"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type {
  Account,
  BrokerAuthInitiation,
  BrokerConnectionView,
  BrokerStatus,
  TransferResult,
} from "@/types/portfolio";

// ─────────────────────────────────────────────────────────────────────────────
// BROKER CONNECTIONS — the live-feed side of an account (GET /me/brokers) plus the raw
// link-lifecycle calls the connect flow orchestrates. The lifecycle contract (verified in
// Vytal-Backend) is a strict ORDER: create a connection → link it to the account → sync. Sync
// refuses (409 account_not_linked) until the binding exists, so link MUST precede sync.
//
// Two capability paths, chosen by the backend's own signal (NOT a hardcoded broker id):
//   • one-shot   integrate                      → non-interactive brokers (mock)
//   • interactive initiate → (redirect) → complete → OAuth brokers (zerodha)
// Calling the wrong one returns 400 not_interactive — that is the capability probe.
// ─────────────────────────────────────────────────────────────────────────────

/** The version of the read-only broker disclaimer the user accepts to connect. The backend records
 *  it verbatim (it validates only that it is non-empty + accepted); "v1" matches the backend harness. */
export const BROKER_DISCLAIMER_VERSION = "v1";

/** GET /me/brokers → the user's connections + the ADAPTED SET (`available`). The adapted set is the
 *  complete "which brokers have a working adapter" source — it includes `mock` (with its real label),
 *  which the pickable account catalogue deliberately omits. Rarely changes; cached a while. */
export function useBrokerStatus() {
  return useQuery<BrokerStatus>({
    queryKey: ["me", "brokers"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: BrokerStatus }>("/api/v1/me/brokers");
      return r.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── the shape the fetch layer throws (HttpError.apiError) ──────────────────────
interface ApiErrorBody {
  error?: string;
  message?: string;
  willDelete?: { transactions: number; holdings: number };
}
interface ThrownApiError {
  apiError?: { status?: number; message?: string; detail?: ApiErrorBody };
}

/** A parsed backend error: the machine `code`, a human `message`, and the HTTP `status`. Every
 *  distinct guard in the link contract carries its own code — the flow branches on THIS, never on
 *  fragile message matching. */
export interface ParsedApiError {
  status?: number;
  code?: string;
  message: string;
}

export function parseApiError(err: unknown): ParsedApiError {
  const api = (err as ThrownApiError)?.apiError;
  const body = api?.detail;
  return {
    status: api?.status,
    code: body?.error,
    message: body?.message ?? api?.message ?? "Something went wrong. Please try again.",
  };
}

/** `not_interactive` (400) is the capability signal: this broker uses the OTHER auth path. */
export const isNotInteractive = (e: ParsedApiError) => e.code === "not_interactive";
/** 503 feature_unavailable: the broker isn't configured on this deployment (e.g. no Kite keys). */
export const isFeatureUnavailable = (e: ParsedApiError) => e.status === 503 || e.code === "feature_unavailable";

const post = <T>(path: string, body?: unknown) =>
  apiFetch<{ success: boolean; data: T }>(path, {
    method: "POST",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

// ── the raw lifecycle calls (the orchestration in use-link-flow sequences these) ──

/** One-shot connect (non-interactive brokers). Returns the fresh connection (has `.id`). */
export const integrateBroker = (broker: string) =>
  post<BrokerConnectionView>(`/api/v1/me/brokers/${broker}/integrate`, {
    accepted: true,
    disclaimerVersion: BROKER_DISCLAIMER_VERSION,
  }).then((r) => r.data);

/** Interactive step 1: get the broker login URL to redirect to. */
export const initiateBrokerAuth = (broker: string) =>
  post<BrokerAuthInitiation>(`/api/v1/me/brokers/${broker}/auth/initiate`, {
    accepted: true,
    disclaimerVersion: BROKER_DISCLAIMER_VERSION,
  }).then((r) => r.data);

/** Interactive step 2: exchange the redirect's callback params for a connection.
 *
 *  `expectedConnectionId` is the RECONNECT precondition (see LinkReconnect). Passing it makes the
 *  server refuse — 409 `wrong_demat`, before anything is written — when the broker login turns out to
 *  be for a DIFFERENT demat, instead of minting an orphan connection that no surface can reach. Omit
 *  it for a first-time link: the server then creates, exactly as before. */
export const completeBrokerAuth = (
  broker: string,
  state: string,
  params: Record<string, unknown>,
  expectedConnectionId?: string,
) =>
  post<BrokerConnectionView>(`/api/v1/me/brokers/${broker}/auth/complete`, {
    state,
    params,
    ...(expectedConnectionId ? { expectedConnectionId } : {}),
  }).then((r) => r.data);

/** Bind a connection to the account (manual → linked_live). `confirm:true` is REQUIRED only when the
 *  account is non-empty (it then deletes the manual ledger + holdings). Returns the updated Account. */
export const linkAccount = (accountId: string, connectionId: string, confirm?: boolean) =>
  post<Account>(`/api/v1/me/accounts/${accountId}/link`, {
    connectionId,
    ...(confirm ? { confirm: true } : {}),
  }).then((r) => r.data);

/** Pull the broker's holdings now. Best-effort AFTER a successful link — its failure never undoes
 *  the link (the account is Verified, just "never synced" until the next attempt). Also the
 *  standalone "Sync now" action: a live session refreshes the snapshot; a dead one → 409
 *  session_dead ("reconnect to refresh"), leaving the book unchanged and still linked_live. */
export const syncConnection = (connectionId: string) =>
  post<unknown>(`/api/v1/me/brokers/connections/${connectionId}/sync`).then((r) => r.data);

/** PAUSE — sever the feed. Sets the connection inactive AND the bound account → linked_stale, in
 *  one transaction; holdings are frozen, KEPT (nothing is deleted). Reversible via activate. This
 *  is the SAME server operation as account unlink. */
export const deactivateConnection = (connectionId: string) =>
  post<BrokerConnectionView>(`/api/v1/me/brokers/connections/${connectionId}/deactivate`).then((r) => r.data);

/** RESUME — bring a severed feed back: connection active, bound account → linked_live. Does NOT
 *  re-authenticate (a dead token stays dead — that is a reconnect, not a resume). */
export const activateConnection = (connectionId: string) =>
  post<BrokerConnectionView>(`/api/v1/me/brokers/connections/${connectionId}/activate`).then((r) => r.data);

/** FORGET — delete the connection (cascades its broker holdings, forgets the token). Requires the
 *  connection to be INACTIVE first (deactivate), and confirm:true. Leaves the bound account as a
 *  linked_stale shell with a null binding (then deletable). Sever freezes; clear forgets. */
export const clearConnection = (connectionId: string, confirm: boolean) =>
  post<unknown>(`/api/v1/me/brokers/connections/${connectionId}/clear`, { confirm }).then((r) => r.data);

/** Move a whole manual book to another manual account. `deleteSource` is HARDCODED false here — in
 *  the link flow the source is the account about to be linked; deleting it destroys the flow's target. */
export const transferAllToAccount = (sourceAccountId: string, toAccountId: string) =>
  post<TransferResult>(`/api/v1/me/accounts/${sourceAccountId}/transfer-all`, {
    toAccountId,
    deleteSource: false,
  }).then((r) => r.data);
