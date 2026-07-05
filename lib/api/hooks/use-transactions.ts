"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { Transaction, TransactionInput, TransactionPatch } from "@/types/portfolio";

// ── raw wire shape (money as Decimal strings) → normalized numbers ──────────────
interface RawTxn {
  id: string;
  symbol: string;
  type: Transaction["type"];
  quantity: string | null;
  price: string | null;
  fees: string | null;
  tradeDate: string;
  ratio: string | null;
  notes: string | null;
  createdAt: string;
}

const num = (s: string | null): number | null => (s == null ? null : Number(s));

function normalize(r: RawTxn): Transaction {
  return {
    id: r.id,
    symbol: r.symbol,
    type: r.type,
    quantity: num(r.quantity),
    price: num(r.price),
    fees: num(r.fees),
    tradeDate: r.tradeDate,
    ratio: r.ratio,
    notes: r.notes,
    createdAt: r.createdAt,
  };
}

/** The authenticated user's transaction ledger (newest first) → GET /me/transactions.
 *  The append-only source of truth; holdings/PHS/NAV are all replayed from it. */
export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ["me", "portfolio", "transactions"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: RawTxn[] }>("/api/v1/me/transactions");
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
