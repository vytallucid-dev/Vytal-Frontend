"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { Transaction, TransactionInput, TransactionPatch } from "@/types/portfolio";

// ── raw wire shape (money as Decimal strings) → normalized numbers ──────────────
interface RawTxn {
  id: string;
  symbol: string;
  name: string; // the instrument's human-readable NAME (a fund's real name, not its ISIN); Instrument.name is NOT NULL
  type: Transaction["type"];
  quantity: string | null;
  price: string | null;
  fees: string | null;
  tradeDate: string;
  ratio: string | null;
  notes: string | null;
  createdAt: string;
  accountId: string; // NOT NULL in the schema → non-nullable on the /me/transactions wire (the KEY)
  accountName: string; // the account's DISPLAY name ("Grow 1"/"demo"); PortfolioAccount.name is NOT NULL
  assetClass: string; // the instrument's class, carried on the list wire (instrument is the spine)
  isin: string; // the instrument's ISIN — the true reference for a fund/bond (a bond's ISIN ≠ its ticker)
}

const num = (s: string | null): number | null => (s == null ? null : Number(s));

function normalize(r: RawTxn): Transaction {
  return {
    id: r.id,
    symbol: r.symbol,
    name: r.name,
    type: r.type,
    quantity: num(r.quantity),
    price: num(r.price),
    fees: num(r.fees),
    tradeDate: r.tradeDate,
    ratio: r.ratio,
    notes: r.notes,
    createdAt: r.createdAt,
    accountId: r.accountId,
    accountName: r.accountName,
    assetClass: r.assetClass,
    isin: r.isin,
  };
}

/** The transaction ledger (newest first) → GET /me/transactions. The append-only source of
 *  truth; holdings/PHS/NAV are all replayed from it.
 *
 *  With no `accountId` this is the whole user's ledger — the request and cache key are
 *  byte-for-byte what the portfolio Transactions tab has always issued. Pass an `accountId`
 *  and the read is scoped to that one account (?accountId=…, ANDed on the owner server-side);
 *  the key carries the id so the two reads never collide, and any write still invalidates the
 *  whole ["me","portfolio"] tree so both re-read the freshly-replayed truth. */
export function useTransactions(accountId?: string) {
  return useQuery<Transaction[]>({
    queryKey: accountId ? ["me", "portfolio", "transactions", accountId] : ["me", "portfolio", "transactions"],
    queryFn: async () => {
      const url = accountId
        ? `/api/v1/me/transactions?accountId=${encodeURIComponent(accountId)}`
        : "/api/v1/me/transactions";
      const r = await apiFetch<{ success: boolean; data: RawTxn[] }>(url);
      return r.data.map(normalize);
    },
  });
}

// ── mutations — every write triggers the server replay (holdings → PHS → NAV). On
//    success we invalidate the WHOLE ["me","portfolio"] tree so the ledger, holdings,
//    snapshot, nav, twr and benchmark all re-read the freshly-replayed truth. We never
//    optimistically fake a derived number — the server is the only source. ───────────
export function useTransactionMutations() {
  const qc = useQueryClient();
  // The backend awaits replay + PHS refresh before responding, so by onSettled the
  // snapshot is already fresh; a prefix invalidation refetches everything at once.
  const refreshAll = () => qc.invalidateQueries({ queryKey: ["me", "portfolio"] });

  const add = useMutation({
    mutationFn: (body: TransactionInput) =>
      apiFetch<{ success: boolean; data: unknown }>("/api/v1/me/transactions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: refreshAll,
    meta: {
      successMessage: "Transaction added",
      successDescription: "Your ledger replayed — holdings, health & value updated.",
      errorMessage: "Couldn't save the transaction",
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: TransactionPatch }) =>
      apiFetch<{ success: boolean; data: unknown }>(`/api/v1/me/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: refreshAll,
    meta: {
      successMessage: "Transaction updated",
      successDescription: "Your ledger replayed — holdings, health & value recomputed.",
      errorMessage: "Couldn't update the transaction",
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean; data: unknown }>(`/api/v1/me/transactions/${id}`, {
        method: "DELETE",
      }),
    onSuccess: refreshAll,
    meta: {
      successMessage: "Transaction deleted",
      successDescription: "Your ledger replayed — holdings, health & value recomputed.",
      errorMessage: "Couldn't delete the transaction",
    },
  });

  return { add, update, remove };
}
