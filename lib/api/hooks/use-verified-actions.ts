"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { RescuePreview, TransferResult } from "@/types/portfolio";
import { activateConnection, clearConnection, deactivateConnection, syncConnection } from "./use-brokers";

// ─────────────────────────────────────────────────────────────────────────────
// VERIFIED (broker-fed) ACCOUNT ACTIONS — sync / pause / resume / rescue / discard.
//
// Every action here changes the book (holdings union) or the account's lifecycle, so on success we
// invalidate the accounts list, the broker connections, AND the whole portfolio tree so holdings,
// snapshot and value re-read the server truth. Errors are surfaced INLINE by each caller
// (suppressErrorToast), because a failed sync or a refused rescue must explain itself in place.
// ─────────────────────────────────────────────────────────────────────────────

function invalidateBook(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["me", "accounts"] });
  qc.invalidateQueries({ queryKey: ["me", "brokers"] });
  qc.invalidateQueries({ queryKey: ["me", "portfolio"] });
}

/** SYNC NOW → POST /brokers/connections/:id/sync. A live session refreshes the snapshot; a dead one
 *  returns 409 session_dead (the book is unchanged, still shows its last real sync). */
export function useSyncNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => syncConnection(connectionId),
    onSuccess: () => invalidateBook(qc),
    meta: { suppressErrorToast: true },
  });
}

/** PAUSE → deactivate the connection (feed frozen, account → linked_stale, holdings kept). */
export function usePauseAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => deactivateConnection(connectionId),
    onSuccess: () => invalidateBook(qc),
    meta: { suppressErrorToast: true },
  });
}

/** RESUME → activate the connection (account → linked_live; does not re-authenticate). */
export function useResumeAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => activateConnection(connectionId),
    onSuccess: () => invalidateBook(qc),
    meta: { suppressErrorToast: true },
  });
}

// ── RESCUE (linked → same-broker Stated) via the DELETE rescue door ──────────────────────────────
interface RescueDeleteResponse {
  deleted: boolean;
  id: string;
  rescue: TransferResult;
}

const rescueViaDelete = (accountId: string, rescueToAccountId: string, confirm: boolean) =>
  apiFetch<{ success: boolean; data: RescueDeleteResponse }>(`/api/v1/me/accounts/${accountId}`, {
    method: "DELETE",
    body: JSON.stringify({ rescueToAccountId, confirm }),
  }).then((r) => r.data);

/** PREVIEW a rescue — call the door with confirm:false. The backend runs ALL its guards
 *  (broker_mismatch, unrescuable_holdings, nothing_to_rescue) and, if they pass, returns 400
 *  confirmation_required carrying `willRescue`. We return that preview; a REAL guard failure is
 *  re-thrown so the caller renders it. Side-effect-free by construction (confirm:false writes
 *  nothing — the backend checks confirm before any mutation). */
export async function previewRescue(accountId: string, rescueToAccountId: string): Promise<RescuePreview> {
  try {
    await rescueViaDelete(accountId, rescueToAccountId, false);
    // confirm:false ALWAYS trips the confirmation gate, so a success here is unexpected. Treat it
    // as "nothing to preview" rather than inventing rows.
    return { willRescue: [], willDeleteAccount: "" };
  } catch (e) {
    const detail = (e as { apiError?: { detail?: (RescuePreview & { error?: string }) | undefined } })?.apiError?.detail;
    if (detail?.error === "confirmation_required" && Array.isArray(detail.willRescue)) {
      return { willRescue: detail.willRescue, willDeleteAccount: detail.willDeleteAccount };
    }
    throw e; // broker_mismatch / unrescuable_holdings / nothing_to_rescue / … — surface it
  }
}

/** COMMIT a rescue → DELETE with confirm:true. Returns the TransferResult (with `rescued`, the
 *  synthetic buys and their FABRICATED dates). Deletes the account and forgets the connection. */
export function useRescueAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, rescueToAccountId }: { accountId: string; rescueToAccountId: string }) =>
      rescueViaDelete(accountId, rescueToAccountId, true).then((d) => d.rescue),
    onSuccess: () => invalidateBook(qc),
    meta: { suppressErrorToast: true },
  });
}

// ── DISCARD (remove a Verified account + its connection, dropping the broker holdings) ────────────
const deleteAccountRaw = (accountId: string) =>
  apiFetch<{ success: boolean; data: { deleted: boolean; id: string } }>(`/api/v1/me/accounts/${accountId}`, {
    method: "DELETE",
    body: JSON.stringify({ confirm: true }),
  }).then((r) => r.data);

/** DISCARD a Verified account entirely — the honest 3-step the backend documents on its delete
 *  refusal ("unlink and clear the connection to discard them deliberately"), orchestrated here:
 *    1. deactivate the connection   — ALWAYS (idempotent); guarantees clear's "must be inactive"
 *       precondition even if account.state and connection.enabled have drifted out of lockstep
 *    2. clear the connection (confirm)   — deletes the connection + broker holdings
 *    3. delete the now-unbound stale account   — gone
 *  Sequential + all-or-surface: a step that fails stops the chain and reports where, leaving a
 *  recoverable (never corrupt) state. Only used when there IS a connection to forget. */
export function useDiscardAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, connectionId }: { accountId: string; connectionId: string }) => {
      await deactivateConnection(connectionId); // → inactive (idempotent; clear's precondition)
      await clearConnection(connectionId, true); // deletes connection + broker holdings
      await deleteAccountRaw(accountId); // removes the now-unbound shell
    },
    onSuccess: () => invalidateBook(qc),
    meta: { suppressErrorToast: true },
  });
}
