"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { Account, BrokerCatalogEntry, CreateAccountInput, TransferResult } from "@/types/portfolio";

/** The authenticated user's accounts (the books their holdings live in) → GET /me/accounts.
 *  Read-only list; every row is the serialize() shape. No health, no totals — this is the list
 *  of containers, not the aggregate. */
export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ["me", "accounts"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: Account[] }>("/api/v1/me/accounts");
      return r.data;
    },
  });
}

/** The create-account broker picker → GET /me/accounts/brokers (pickableBrokers()). Carries the
 *  per-broker `linkable` flag — the single source of "can this be connected". Rarely changes (only
 *  when a new adapter ships), so it is cached long. */
export function useBrokerCatalog() {
  return useQuery<BrokerCatalogEntry[]>({
    queryKey: ["me", "accounts", "brokers"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: BrokerCatalogEntry[] }>("/api/v1/me/accounts/brokers");
      return r.data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

/** Create an account → POST /me/accounts. On success the list refetches. Errors (e.g. a duplicate
 *  name, which the @@unique([userId, name]) constraint rejects) are surfaced INLINE on the form —
 *  never a toast — so `suppressErrorToast` opts out of the global mutation toast. */
export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAccountInput) =>
      apiFetch<{ success: boolean; data: Account }>("/api/v1/me/accounts", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "accounts"] }),
    meta: { suppressErrorToast: true },
  });
}

/** Rename and/or RETAG an account → PATCH /me/accounts/:id. Rename is unconditional; a retag
 *  (broker change) is accepted by the backend ONLY while the account is manual + unbound (else 409
 *  account_linked) — the caller must only offer it under that guard. Duplicate names return 409
 *  duplicate_name. Both are surfaced INLINE on the field, so the error toast is suppressed. On
 *  success the accounts list refetches (name/broker label re-read). */
export function usePatchAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; broker?: string } }) =>
      apiFetch<{ success: boolean; data: Account }>(`/api/v1/me/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "accounts"] }),
    meta: { suppressErrorToast: true },
  });
}

/** Delete an account → DELETE /me/accounts/:id (the NON-rescue path). Cascades the account's
 *  transactions + holdings. A non-empty account requires `confirm:true` (else 400
 *  confirmation_required); the backend also refuses the user's LAST account (409 last_account).
 *  Errors render inline in the confirm, so the toast is suppressed. On success both the accounts
 *  list and the portfolio tree (the holdings union) re-read. */
export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm?: boolean }) =>
      apiFetch<{ success: boolean; data: { deleted: boolean; id: string } }>(`/api/v1/me/accounts/${id}`, {
        method: "DELETE",
        body: JSON.stringify(confirm ? { confirm: true } : {}),
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "accounts"] });
      qc.invalidateQueries({ queryKey: ["me", "portfolio"] });
    },
    meta: { suppressErrorToast: true },
  });
}

/** Move an entire Stated book into another Stated account → POST /me/accounts/:id/transfer-all.
 *  Unlike the link-flow helper (which forces deleteSource:false to protect its link target), here
 *  `deleteSource` is the caller's choice: keep the emptied source, or delete it. Destination may be
 *  any manual account, ANY broker (the backend has no same-broker gate on this path). Returns the
 *  TransferResult so the UI can show what landed (`destination: PositionDelta[]`). Errors render
 *  inline. On success the accounts list + portfolio tree re-read. */
export function useMoveAllHoldings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, toAccountId, deleteSource }: { sourceId: string; toAccountId: string; deleteSource: boolean }) =>
      apiFetch<{ success: boolean; data: TransferResult }>(`/api/v1/me/accounts/${sourceId}/transfer-all`, {
        method: "POST",
        body: JSON.stringify({ toAccountId, deleteSource }),
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "accounts"] });
      qc.invalidateQueries({ queryKey: ["me", "portfolio"] });
    },
    meta: { suppressErrorToast: true },
  });
}
