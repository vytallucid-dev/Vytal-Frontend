"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  completeBrokerAuth,
  initiateBrokerAuth,
  integrateBroker,
  isFeatureUnavailable,
  isNotInteractive,
  linkAccount,
  parseApiError,
  syncConnection,
  type ParsedApiError,
} from "@/lib/api/hooks/use-brokers";

// ─────────────────────────────────────────────────────────────────────────────
// THE CONNECT ORCHESTRATION — one place that sequences the broker link lifecycle, so the two entry
// points (the one-shot flow here, and the OAuth callback route) share EXACTLY the same link→sync
// half and can never disagree about the order or about what "linked" means.
//
// The commit point is the LINK. Sync runs after, best-effort: if it fails, the link still happened —
// the account is Verified with nothing synced yet ("never synced"), NOT rolled back, NOT a failure.
// ─────────────────────────────────────────────────────────────────────────────

export type LinkPhase =
  | "idle"
  | "connecting" // establishing the broker connection (integrate / initiate)
  | "redirecting" // interactive broker → leaving for the broker's login page
  | "linking" // binding the connection to the account
  | "syncing" // pulling the first snapshot
  | "done" // linked + synced
  | "linked_unsynced" // linked, but the first sync didn't land (Verified, never synced)
  | "error";

export interface LinkFlowState {
  phase: LinkPhase;
  error: ParsedApiError | null;
}

const RESUME_KEY = "vytal.link.resume";

/** RECONNECT intent — carried when re-authenticating an ALREADY-LINKED book (a daily Kite token that
 *  expired). Presence flips the flow: it SKIPS `linkAccount` entirely (the account is already bound,
 *  so `POST /accounts/:id/link` would 409 `already_linked`) and, after re-auth, verifies the fresh
 *  connection is the SAME demat before syncing. Nothing is created — `initiate → complete` upserts
 *  the existing connection row (`persistSession`, keyed on `brokerAccountRef`). */
export interface LinkReconnect {
  /** The connection this book is bound to NOW. After re-auth the returned connection's id MUST equal
   *  this — otherwise the user signed into a DIFFERENT demat (guarded, never linked/synced). */
  connectionId: string;
  /** The broker's own account id (Kite client code) this book expects. Non-secret — it is
   *  `staleness.brokerAccountRef`, served for exactly this — and named in the wrong-demat message. */
  accountRef: string | null;
}

/** What the interactive (OAuth) redirect must carry across the page unload so the callback can finish
 *  the flow: which account to bind, which broker to complete, whether the account needed the
 *  destructive confirm, and — for a reconnect — the demat guard (see LinkReconnect). */
export interface LinkResume {
  accountId: string;
  broker: string;
  confirm?: boolean;
  reconnect?: LinkReconnect;
}

/** The result `complete` returns to the callback page (and `finishFresh` to both entry points). The
 *  false branch always carries a renderable `message` (wrong-demat, or a caught API error). */
export type CompleteResult =
  | { ok: true; synced: boolean }
  | { ok: false; synced: false; message: string };

export function saveResume(r: LinkResume) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(RESUME_KEY, JSON.stringify(r));
}
export function readResume(): LinkResume | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(RESUME_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LinkResume;
  } catch {
    return null;
  }
}
export function clearResume() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(RESUME_KEY);
}

/** Bind the connection to the account, then sync (best-effort). Returns whether the first sync
 *  landed. Throws only on a LINK failure (the flow's real failure) — a sync failure is swallowed
 *  into `synced:false`, because the link already committed. */
export async function linkAndSync(
  accountId: string,
  connectionId: string,
  confirm: boolean | undefined,
  onPhase?: (p: LinkPhase) => void,
): Promise<{ synced: boolean }> {
  onPhase?.("linking");
  await linkAccount(accountId, connectionId, confirm); // throws → surfaced to the caller (broker_mismatch, already_linked, …)
  onPhase?.("syncing");
  try {
    await syncConnection(connectionId);
    return { synced: true };
  } catch {
    // The link stands. Sync will happen on the next attempt; the card shows "never synced yet".
    return { synced: false };
  }
}

/** RECONNECT's finish: the account is ALREADY bound, so there is NO link step (that would 409
 *  `already_linked`) — just pull a fresh snapshot with the new token, best-effort, mirroring
 *  linkAndSync's swallow (a failed first sync leaves the card "never synced yet", not an error). */
export async function syncOnly(connectionId: string, onPhase?: (p: LinkPhase) => void): Promise<{ synced: boolean }> {
  onPhase?.("syncing");
  try {
    await syncConnection(connectionId);
    return { synced: true };
  } catch {
    return { synced: false };
  }
}

/** The wrong-demat copy — the one place that names the demat this book expects. Rendered from BOTH
 *  guards: the server's 409 `wrong_demat` (the real gate now — it refuses before writing anything)
 *  and the client-side id comparison below. The SERVER's own message deliberately stays generic, so
 *  this is where the user-facing wording lives. */
export function wrongDematMessage(reconnect: LinkReconnect): string {
  const which = reconnect.accountRef ? `demat ${reconnect.accountRef}` : "the demat this book is linked to";
  return `That broker login was for a different account than this book (it expects ${which}). Nothing here was changed — reconnect and sign in to ${which}.`;
}

/** THE WRONG-DEMAT GUARD, client side. Reconnect authenticates whoever logs into the broker — if that
 *  is a DIFFERENT demat, the connection returned is not the one this book is bound to.
 *
 *  BELT AND BRACES since the server learned the same precondition (`expectedConnectionId` → 409
 *  wrong_demat, refused before any write). This is deliberately KEPT: it costs an id comparison, and
 *  it is the last line if the intent ever fails to reach the server (a stale sessionStorage blob, an
 *  older server, a future caller that forgets to pass it). Returns the message when it fires. */
export function reconnectMismatch(reconnect: LinkReconnect, freshConnectionId: string): string | null {
  if (freshConnectionId === reconnect.connectionId) return null;
  return wrongDematMessage(reconnect);
}

export function useLinkFlow() {
  const qc = useQueryClient();
  const [state, setState] = useState<LinkFlowState>({ phase: "idle", error: null });
  const setPhase = useCallback((phase: LinkPhase) => setState((s) => ({ ...s, phase })), []);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["me", "accounts"] });
    qc.invalidateQueries({ queryKey: ["me", "brokers"] });
    qc.invalidateQueries({ queryKey: ["me", "portfolio"] }); // holdings/snapshot re-read the new book
  }, [qc]);

  const reset = useCallback(() => setState({ phase: "idle", error: null }), []);

  /**
   * The shared second half, after a fresh connection exists (one-shot integrate OR OAuth complete).
   * ONE place, so first-link and reconnect can never diverge:
   *   • reconnect → guard the demat (stop on mismatch), then SYNC ONLY (skip linkAccount — bound already)
   *   • first link → linkAccount, then sync (best-effort)
   * A link failure throws out to the caller's catch; a wrong-demat mismatch returns a false result
   * with a renderable message (it is not an exception — nothing failed, the user picked the wrong book).
   */
  const finishFresh = useCallback(
    async (
      connectionId: string,
      { accountId, confirm, reconnect }: Pick<LinkResume, "accountId" | "confirm" | "reconnect">,
    ): Promise<CompleteResult> => {
      if (reconnect) {
        const mismatch = reconnectMismatch(reconnect, connectionId);
        if (mismatch) {
          // Do NOT link, do NOT sync, do NOT touch the account. Reaching here now means the server's
          // own precondition did not run (it refuses a wrong demat before writing) — so this is the
          // backstop, not the gate. No orphan connection is created on the reconnect path any more.
          setState({ phase: "error", error: { code: "wrong_demat", message: mismatch } });
          return { ok: false, synced: false, message: mismatch };
        }
        const { synced } = await syncOnly(connectionId, setPhase);
        invalidate();
        setState({ phase: synced ? "done" : "linked_unsynced", error: null });
        return { ok: true, synced };
      }
      const { synced } = await linkAndSync(accountId, connectionId, confirm, setPhase);
      invalidate();
      setState({ phase: synced ? "done" : "linked_unsynced", error: null });
      return { ok: true, synced };
    },
    [invalidate, setPhase],
  );

  /**
   * Connect `broker` and bind it to `accountId` — or, with `reconnect` set, re-authenticate an
   * already-linked book (no bind). Chooses the auth path from the backend's own capability signal —
   * never a hardcoded broker id:
   *   • initiate succeeds  → interactive: persist resume state, redirect to the broker (page unloads)
   *   • not_interactive    → one-shot: integrate → finishFresh, all here
   */
  const run = useCallback(
    async ({ broker, accountId, confirm, reconnect }: LinkResume) => {
      setState({ phase: "connecting", error: null });
      try {
        // Interactive first: the efficient path for real (OAuth) brokers. mock falls through below.
        const { authUrl } = await initiateBrokerAuth(broker);
        saveResume({ accountId, broker, confirm, reconnect });
        setPhase("redirecting");
        window.location.assign(authUrl);
        return;
      } catch (e) {
        const parsed = parseApiError(e);
        if (isFeatureUnavailable(parsed)) {
          setState({ phase: "error", error: { ...parsed, message: "Connecting this broker isn’t available on this deployment yet. Nothing was changed." } });
          return;
        }
        if (!isNotInteractive(parsed)) {
          // A real initiate failure (disclaimer, rate limit, unsupported). The account is untouched.
          setState({ phase: "error", error: parsed });
          return;
        }
        // not_interactive → the one-shot (integrate) path.
      }

      try {
        const conn = await integrateBroker(broker);
        await finishFresh(conn.id, { accountId, confirm, reconnect }); // sets state; surface reads flow.state
      } catch (e) {
        // A link-side failure (broker_mismatch, already_linked, connection_already_linked,
        // broker_not_linkable, confirmation_required, …). Nothing has been bound; render it.
        setState({ phase: "error", error: parseApiError(e) });
      }
    },
    [finishFresh, setPhase],
  );

  /** For the OAuth callback route: complete the exchange, then finishFresh (link+sync, or — for a
   *  reconnect — the demat guard + sync only). */
  const complete = useCallback(
    async ({ broker, accountId, confirm, reconnect, state: oauthState, params }: LinkResume & { state: string; params: Record<string, unknown> }): Promise<CompleteResult> => {
      setState({ phase: "connecting", error: null });
      try {
        // The reconnect intent now reaches the SERVER (it used to live only in this sessionStorage
        // blob). With it, `complete` refuses a wrong-demat login before writing anything, instead of
        // creating an orphan connection for the frontend guard below to notice too late.
        const conn = await completeBrokerAuth(broker, oauthState, params, reconnect?.connectionId);
        return await finishFresh(conn.id, { accountId, confirm, reconnect });
      } catch (e) {
        const parsed = parseApiError(e);
        // The server REFUSED a wrong-demat reconnect (409 wrong_demat — nothing was written). Render
        // OUR copy: it names the demat this book expects, which the server's message deliberately
        // does not. Without this the user would see the generic server text and lose the one detail
        // that tells them which login to use.
        const message = parsed.code === "wrong_demat" && reconnect ? wrongDematMessage(reconnect) : parsed.message;
        setState({ phase: "error", error: { ...parsed, message } });
        return { ok: false, synced: false, message };
      }
    },
    [finishFresh],
  );

  return { state, run, complete, reset, setState };
}
