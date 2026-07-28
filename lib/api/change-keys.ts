// ─────────────────────────────────────────────────────────────────────────────
// CHANGE DOMAIN → QUERY KEYS — the client half of the chat's post-write invalidation.
//
// ── WHY THE SERVER SENDS DOMAINS AND THIS FILE OWNS THE KEYS ─────────────────
// A chat write happens entirely server-side, and the browser CANNOT see it: tool turns are stripped
// from the visible transcript, so nothing in the reply tells us `confirmPendingAction` ran. The only
// honest signal is the server saying so — hence `data.changed: ["alerts"]` on the send response.
//
// But the server must not name OUR cache keys. `["me","alerts"]` is a React Query implementation
// detail; if the backend shipped those strings, renaming a key here would silently make the backend
// lie and the UI would quietly stop refreshing. So the wire carries a stable domain noun and the
// mapping lives here, next to the hooks that define the keys.
//
// ── KEYS ARE PREFIXES ────────────────────────────────────────────────────────
// invalidateQueries matches by prefix, so ["me","alerts"] also covers ["me","alerts","events"], and
// ["me","portfolio"] covers the whole tree (transactions, holdings, snapshot, nav, twr, benchmark) —
// which is exactly what useTransactionMutations does by hand after a manual trade.
//
// ⚠ `relational` is invalidated by BOTH watchlist and portfolio. The stock page's relational card is
// computed server-side from the reader's holdings AND their watchlist, so it goes stale on either —
// easy to miss, because no watchlist/portfolio hook mentions it.
// ─────────────────────────────────────────────────────────────────────────────

import type { QueryClient, QueryKey } from "@tanstack/react-query";

/** The vocabulary the server speaks. Mirrors ChangeDomain in the backend's chat/proposals.ts. */
export type ChangeDomain = "watchlist" | "alerts" | "reminders" | "portfolio";

export const CHANGE_KEYS: Record<ChangeDomain, QueryKey[]> = {
  // the watchlist page, the stock page's pin toggle, and the relational card's "watched" axis
  watchlist: [["me", "watchlist"], ["relational"]],
  // the alerts list, the fired-events feed, AND the navbar bell's active count
  alerts: [["me", "alerts"]],
  // the reminders list + the SAME navbar bell count (it sums alerts + reminders)
  reminders: [["me", "reminders"]],
  // the whole portfolio tree — ledger, holdings, PHS snapshot, nav, twr, benchmark — plus the
  // relational card's position axis (weight, since-added)
  portfolio: [["me", "portfolio"], ["relational"]],
};

/**
 * Invalidate everything the named domains touch. Unknown domains are ignored rather than thrown on,
 * so a backend that learns a new write tool before the frontend ships degrades to "no refresh" — the
 * old behaviour — instead of breaking the reply that just arrived.
 */
export function invalidateChanged(qc: QueryClient, domains: readonly string[] | undefined): void {
  if (!domains?.length) return;
  for (const d of domains) {
    const keys = CHANGE_KEYS[d as ChangeDomain];
    if (!keys) continue;
    for (const queryKey of keys) void qc.invalidateQueries({ queryKey });
  }
}
