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

// ── asset-class vocabulary MOVED OUT (→ @/lib/asset-class) ─────────────────────────────────────
// ASSET_CLASS_LABEL / assetClassLabel / isCouponBearing used to live here. They describe the
// CATALOGUE's asset_class enum, not the ledger — this module was only their first reader. They left
// because THIS file imports @/lib/api/client (for parseTxnError below), which builds the Supabase
// client at module scope: any module wanting a label was silently buying Supabase with it. Importers
// take them from @/lib/asset-class directly — deliberately NOT re-exported from here, which would
// be the same import wearing a hat.

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
// The list is fetched WHOLE-BOOK (useTransactions() with no accountId), so every narrowing here is
// IN-MEMORY — the scoped `?accountId` endpoint exists but the tab never needs it. The instrument
// filter is GONE: search already finds a ticker/name, so account + type + date + search is complete.
export interface LedgerFilter {
  search: string; // over symbol + name + notes
  account: string | "all"; // accountId (the KEY); "all" = every book
  type: TransactionType | "all";
  from: string; // "YYYY-MM-DD" or ""
  to: string; // "YYYY-MM-DD" or ""
}
export const EMPTY_FILTER: LedgerFilter = { search: "", account: "all", type: "all", from: "", to: "" };

export function filterTransactions(txns: Transaction[], f: LedgerFilter): Transaction[] {
  const q = f.search.trim().toLowerCase();
  return txns.filter((t) => {
    if (f.account !== "all" && t.accountId !== f.account) return false;
    if (f.type !== "all" && t.type !== f.type) return false;
    if (f.from && t.tradeDate < f.from) return false; // ISO dates sort lexicographically
    if (f.to && t.tradeDate > f.to) return false;
    // Search matches the ticker, the human name (so "kotak" finds the fund) OR the note.
    if (q && !t.symbol.toLowerCase().includes(q) && !(t.name ?? "").toLowerCase().includes(q) && !(t.notes ?? "").toLowerCase().includes(q)) return false;
    return true;
  });
}

/** The distinct accounts across a ledger, {id, name}, first-seen order — the account filter's options
 *  and the "hide when one account" gate. Names, never UUIDs (`accountName` is on the wire); an id with
 *  no name degrades to "Unnamed account" rather than leaking the raw id. */
export function ledgerAccounts(txns: Transaction[]): { id: string; name: string }[] {
  const m = new Map<string, string>();
  for (const t of txns) if (t.accountId) m.set(t.accountId, t.accountName || "Unnamed account");
  return [...m.entries()].map(([id, name]) => ({ id, name }));
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
export type TxnField = "symbol" | "type" | "tradeDate" | "quantity" | "price" | "fees" | "ratio" | "notes" | "account";
export interface ParsedTxnError {
  fields: Partial<Record<TxnField, string>>;
  formError?: string;
  reauth?: boolean;
  /** On a 409 `ambiguous_symbol`: the candidate instruments the backend refused to pick between.
   *  The caller renders these as a picker (NEVER auto-picks) and re-submits the chosen ISIN. Empty
   *  or absent otherwise. */
  disambiguation?: { isin: string; name: string; assetClass: string }[];
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
  // Account-resolution refusals (resolveWritableAccount). The sheet is built to PREVENT these — it
  // offers Stated accounts only and always sends an accountId — so these are DEFENSIVE: an account
  // deleted/linked in another tab between open and save, or a stale client. Map to the account field
  // (or the form when there is no account to point at).
  if (body.error === "account_required") {
    return { fields: { account: "Choose which account this transaction belongs to." } };
  }
  if (body.error === "account_not_found") {
    return { fields: { account: "That account no longer exists — pick another." } };
  }
  if (body.error === "account_linked") {
    return { fields: { account: "That account is broker-managed — hand-entered transactions aren't allowed there." } };
  }
  if (body.error === "no_account") {
    return { fields: {}, formError: e.message || "Create an account first, then add transactions to it." };
  }
  // (Step 20) A holding can now be ANY instrument — a stock, an ETF, a fund, a REIT, a bond — so the
  // backend resolves against the catalogue, not just `stocks`, and its refusals got more specific.
  // `stock_not_found` is kept because the other endpoints (watchlist, alerts, reminders) are still
  // equity-only and still emit it.
  if (body.error === "stock_not_found" || body.error === "instrument_not_found") {
    return { fields: { symbol: e.message || "That symbol isn't in our catalogue." } };
  }
  // A SYMBOL IS NOT A KEY, and the backend refuses to guess which one you meant. Three bonds share
  // the ticker "IMC1"; a mutual fund has no ticker at all. The 409 carries the candidate ISINs so the
  // user can say which one they actually hold, rather than have us attach their money to a coin flip.
  if (body.error === "ambiguous_symbol") {
    const candidates = (body as { candidates?: { isin: string; name: string; assetClass?: string }[] }).candidates ?? [];
    return {
      fields: {
        symbol: e.message || "That identifier names more than one instrument — pick the one you hold.",
      },
      // Surfaced structurally so the sheet renders a PICKER of the candidates rather than a text hint;
      // never auto-resolved. (The picker submits an ISIN, so this is a backstop — see the sheet.)
      disambiguation: candidates.map((c) => ({ isin: c.isin, name: c.name, assetClass: c.assetClass ?? "" })),
    };
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
