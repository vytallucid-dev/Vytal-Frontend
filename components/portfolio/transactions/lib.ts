// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTIONS (ledger) — pure derivations over the txn list + wire-error parsing.
// No JSX. Ledger figures here are ARITHMETIC over what the user entered (buy notional,
// sell proceeds, dividend amounts) — NEVER a recomputed holding, realized-P&L or PHS
// figure (those are server-replayed and read verbatim from the holdings/snapshot).
// ─────────────────────────────────────────────────────────────────────────────
import { isApiError, type ApiError } from "@/lib/api/client";
import type { Transaction, TransactionType } from "@/types/portfolio";

// ── type identity → label + colour (neutral hues; buy/sell are EVENTS, not advice) ──
export const TXN_TYPE_META: Record<TransactionType, { label: string; color: string; short: string }> = {
  buy: { label: "Buy", color: "var(--p-found)", short: "BUY" },
  sell: { label: "Sell", color: "var(--p-mkt)", short: "SELL" },
  dividend: { label: "Dividend", color: "var(--rec)", short: "DIV" },
  bonus: { label: "Bonus", color: "var(--p-own)", short: "BON" },
  split: { label: "Split", color: "var(--p-mom)", short: "SPL" },
};

/** Selector order — buy first (the 90% case), then the other common types. */
export const TXN_TYPES: TransactionType[] = ["buy", "sell", "dividend", "bonus", "split"];

/** The single ₹ figure a row represents, or null when the event carries no cash value:
 *   • buy/sell → qty × price   • dividend → the amount (stored in the price slot)
 *   • split/bonus → null (a lot reshape, no cash) */
export function txnValue(t: Transaction): number | null {
  if (t.type === "buy" || t.type === "sell") {
    return t.quantity != null && t.price != null ? t.quantity * t.price : null;
  }
  if (t.type === "dividend") return t.price;
  return null; // split / bonus
}

// ── summary strip (ledger arithmetic) ────────────────────────────────────────────
export interface LedgerSummary {
  invested: number; // Σ buy notional (gross capital deployed via buys)
  withdrawn: number; // Σ sell proceeds (gross capital taken out via sells)
  dividends: number; // Σ dividend amounts recorded
  charges: number; // Σ fees across the ledger (brokerage+STT+…)
  buyCount: number;
  sellCount: number;
  dividendCount: number;
}
export function ledgerSummary(txns: Transaction[]): LedgerSummary {
  const s: LedgerSummary = { invested: 0, withdrawn: 0, dividends: 0, charges: 0, buyCount: 0, sellCount: 0, dividendCount: 0 };
  for (const t of txns) {
    s.charges += t.fees ?? 0; // a fee is a charge regardless of type; null = 0
    if (t.type === "buy") {
      s.buyCount++;
      s.invested += txnValue(t) ?? 0;
    } else if (t.type === "sell") {
      s.sellCount++;
      s.withdrawn += txnValue(t) ?? 0;
    } else if (t.type === "dividend") {
      s.dividendCount++;
      s.dividends += t.price ?? 0;
    }
  }
  return s;
}

// ── filter + sort (pure) ─────────────────────────────────────────────────────────
export interface LedgerFilter {
  search: string; // over symbol + notes
  symbol: string | "all";
  type: TransactionType | "all";
  from: string; // "YYYY-MM-DD" or ""
  to: string; // "YYYY-MM-DD" or ""
}
export const EMPTY_FILTER: LedgerFilter = { search: "", symbol: "all", type: "all", from: "", to: "" };

export function filterTransactions(txns: Transaction[], f: LedgerFilter): Transaction[] {
  const q = f.search.trim().toLowerCase();
  return txns.filter((t) => {
    if (f.symbol !== "all" && t.symbol !== f.symbol) return false;
    if (f.type !== "all" && t.type !== f.type) return false;
    if (f.from && t.tradeDate < f.from) return false; // ISO dates sort lexicographically
    if (f.to && t.tradeDate > f.to) return false;
    if (q && !t.symbol.toLowerCase().includes(q) && !(t.notes ?? "").toLowerCase().includes(q)) return false;
    return true;
  });
}

export type LedgerSortKey = "tradeDate" | "type" | "symbol" | "value";
export type SortDir = "asc" | "desc";

const SORT_VALUE: Record<LedgerSortKey, (t: Transaction) => number | string | null> = {
  tradeDate: (t) => t.tradeDate,
  type: (t) => t.type,
  symbol: (t) => t.symbol,
  value: (t) => txnValue(t),
};

/** Sort a copy. Nulls (corporate-action rows on the value column) sink to the bottom
 *  either direction — an honest "no cash value" never outranks a real figure. */
export function sortTransactions(txns: Transaction[], key: LedgerSortKey, dir: SortDir): Transaction[] {
  const get = SORT_VALUE[key];
  const factor = dir === "asc" ? 1 : -1;
  return [...txns].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "string" && typeof vb === "string") {
      const c = va.localeCompare(vb);
      // tie-break dates by insertion order (createdAt) so same-day rows stay stable
      return factor * (c !== 0 ? c : a.createdAt.localeCompare(b.createdAt));
    }
    return factor * ((va as number) - (vb as number));
  });
}

// ── ratio validation (mirrors the backend RATIO_RE / corporateActionFactor) ─────────
export const RATIO_RE = /^\s*\d+(?:\.\d+)?\s*:\s*\d+(?:\.\d+)?\s*$/;
export function ratioValid(s: string): boolean {
  if (!RATIO_RE.test(s)) return false;
  const [a, b] = s.split(":").map((x) => Number(x.trim()));
  return a >= 0 && b > 0; // a additional per b held → factor (a+b)/b
}

// ── wire-error → field-level messages (per the controller's error contract) ─────────
export type TxnField = "symbol" | "type" | "tradeDate" | "quantity" | "price" | "fees" | "ratio" | "notes";
export interface ParsedTxnError {
  fields: Partial<Record<TxnField, string>>;
  formError?: string;
  reauth?: boolean;
}

function extractApiError(err: unknown): ApiError | null {
  if (isApiError(err)) return err;
  const wrapped = (err as { apiError?: unknown })?.apiError;
  return isApiError(wrapped) ? wrapped : null;
}

const FIELD_KEYS: TxnField[] = ["symbol", "type", "tradeDate", "quantity", "price", "fees", "ratio", "notes"];

/** Map a thrown request error onto field-level + form-level messages, per the backend
 *  contract (validation_error / stock_not_found / oversell / not_found / 401). Never
 *  loses the user's input — the caller keeps form state; this only decides what to show. */
export function parseTxnError(err: unknown): ParsedTxnError {
  const e = extractApiError(err);
  if (!e) return { fields: {}, formError: "Something went wrong. Your entry is kept — try again." };

  if (e.status === 401) {
    return { fields: {}, reauth: true, formError: "Your session expired. Sign in again to save — your entry is kept." };
  }

  const body = (e.detail ?? {}) as { error?: string; message?: string; details?: Record<string, string[]>; attempted?: string; available?: string };

  if (body.error === "oversell") {
    return { fields: { quantity: `You hold ${body.available}; this sells ${body.attempted}. Reduce the quantity.` } };
  }
  if (body.error === "stock_not_found") {
    return { fields: { symbol: e.message || "That symbol isn't in the tracked universe." } };
  }
  if (body.error === "validation_error") {
    const fields: Partial<Record<TxnField, string>> = {};
    if (body.details) {
      for (const k of FIELD_KEYS) {
        const msg = body.details[k]?.[0];
        if (msg) fields[k] = msg;
      }
    }
    const formError = Object.keys(fields).length === 0 ? body.message ?? "Please check the highlighted fields." : body.message;
    return { fields, formError: Object.keys(fields).length === 0 ? formError : undefined };
  }
  if (e.status === 404) {
    return { fields: {}, formError: body.message ?? "This transaction no longer exists — it may have been removed." };
  }
  return { fields: {}, formError: e.message || "Couldn't save. Your entry is kept — try again." };
}
