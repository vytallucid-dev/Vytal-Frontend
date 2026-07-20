import type { Account, BrokerCatalogEntry, BrokerMeta, Holding, Transaction } from "@/types/portfolio";

// ─────────────────────────────────────────────────────────────────────────────
// Accounts tab — pure derivations. No health, no PHS, no totals here (or anywhere on
// this surface). The whole design is one distinction: Verified vs Stated.
// ─────────────────────────────────────────────────────────────────────────────

/** The not-at-a-broker sentinel — the ONE broker id with product meaning on this surface. It is a
 *  PERMANENT structural constant in the data model (never an adapter that ships later), so
 *  identifying it by id is NOT the "hardcoded broker" anti-pattern the spec forbids: adapter STATUS
 *  is derived entirely from the catalogue's `linkable` flag (see linkAffordanceFor), so new brokers
 *  getting adapted never require an edit here. This single id is the only exception, and it has to
 *  be — it is the only signal that separates "not available yet" (temporal) from "never" (permanent),
 *  and both carry `linkable: false`. */
export const NOT_AT_BROKER = "other";

export type AccountKind = "verified" | "stated";

/** Verified ⇔ the holdings come from the broker's own feed (`linked_live` | `linked_stale`) — the
 *  user cannot lie in this book. Stated ⇔ the user entered them (`manual`) — claims, not
 *  attestations. This is the whole design. */
export function accountKind(a: Account): AccountKind {
  return a.state === "manual" ? "stated" : "verified";
}

/** The display label for a broker id — NEVER render the raw enum. Resolves against the pickable
 *  account catalogue first, then the ADAPTED SET (`available` from /me/brokers), which is the only
 *  surface carrying `mock`'s label ("Mock Broker") — the account catalogue omits it by design. Falls
 *  back to the id only while neither has loaded (defensive). */
export function brokerLabel(
  brokerId: string,
  catalogue: BrokerCatalogEntry[] | undefined,
  adapted?: BrokerMeta[] | undefined,
): string {
  return (
    catalogue?.find((b) => b.id === brokerId)?.displayName ??
    adapted?.find((m) => m.id === brokerId)?.displayName ??
    brokerId
  );
}

// ── per-broker colour — a DETERMINISTIC hash into a theme-token palette, NEVER a hardcoded broker
//    map (the codebase forbids hardcoding broker ids; a new broker colours itself with no edit here).
//    Reds are excluded (reserved for danger/flags) and slate --ctx is reserved for the Stated tag, so
//    a broker badge collides with neither — a Zerodha holding and a Groww holding read apart at a
//    glance. ONE source, shared by the Holdings preview badges AND the Performance per-account chart,
//    so the same broker is the same colour on every surface. ─────────────────────────────────────
export const BROKER_HUES = ["var(--p-found)", "var(--p-mom)", "var(--p-mkt)", "var(--p-own)", "var(--c-healthy)", "var(--c-steady)", "var(--c-pristine)"];
export function brokerHue(brokerId: string): string {
  let h = 0;
  for (let i = 0; i < brokerId.length; i++) h = (h * 31 + brokerId.charCodeAt(i)) >>> 0;
  return BROKER_HUES[h % BROKER_HUES.length];
}

// ── the three link truths (Stated cards only) — three different promises, never one grey button ──
export type LinkAffordance =
  | { kind: "connect"; broker: string } // adapted broker → can be connected now
  | { kind: "not_yet"; broker: string } // linkable:false, a real broker → not available yet (temporal)
  | { kind: "never" }; //                   the not-at-a-broker account → permanent, never linkable

/** Derive which of the three truths a Stated account shows. "Adapted" (connectable now) derives from
 *  BOTH signals the spec names — the catalogue's `linkable` flag AND the adapted set — so a broker
 *  that is implemented but not offered in the picker (`mock`) is still connectable, and no broker id
 *  is ever hardcoded. The `other` sentinel is the ONLY signal that separates the permanent "never"
 *  from the temporal "not yet". */
export function linkAffordanceFor(
  a: Account,
  catalogue: BrokerCatalogEntry[] | undefined,
  adapted?: BrokerMeta[] | undefined,
): LinkAffordance {
  const entry = catalogue?.find((b) => b.id === a.broker);
  const broker = brokerLabel(a.broker, catalogue, adapted);
  const isAdapted = entry?.linkable === true || adapted?.some((m) => m.id === a.broker) === true;
  if (isAdapted) return { kind: "connect", broker };
  if (a.broker === NOT_AT_BROKER) return { kind: "never" };
  return { kind: "not_yet", broker };
}

// ── link-flow gating — mirrors the backend's `nonEmpty = txns>0 || holdings>0` EXACTLY, from the
//    same per-account counts the backend uses (_count.transactions / _count.holdings). An empty
//    account skips the warning entirely (Stage 1's silent path); a non-empty one has something to
//    lose and gets the guard (Stage 2). ──────────────────────────────────────────────────────────
/** Has this account a manual history to lose on linking? (Its transactions + manual holdings.) */
export function hasHistoryToLose(a: Account): boolean {
  return a.transactionCount > 0 || a.holdingCount > 0;
}

/** An empty Stated account — nothing to warn about, so linking runs silently (Stage 1). */
export function isEmptyStated(a: Account): boolean {
  return a.state === "manual" && a.transactionCount === 0 && a.holdingCount === 0;
}

/** The account's earliest trade date, in "Month YYYY" — but ONLY when it can be stated HONESTLY.
 *
 *  GET /me/transactions is user-wide and carries no accountId, so the earliest date is attributable
 *  to THIS account only when every transaction in that read belongs to it — i.e. the whole-user count
 *  equals this account's own count. When they match, the global minimum IS this account's earliest
 *  (exact, never inferred). When they don't (the user has trades in other accounts too), the date
 *  cannot be honestly attributed, so it is OMITTED — the count still stands, the date simply isn't
 *  claimed. Never approximated, never defaulted. */
export function earliestTradeMonth(a: Account, allUserTransactions: Transaction[] | undefined): string | null {
  if (!allUserTransactions) return null;
  if (a.transactionCount === 0) return null;
  // Attributability gate: only exact when this account holds 100% of the user's transactions.
  if (allUserTransactions.length !== a.transactionCount) return null;
  let min: string | null = null;
  for (const t of allUserTransactions) {
    if (min === null || t.tradeDate < min) min = t.tradeDate; // "YYYY-MM-DD" sorts lexicographically
  }
  return min ? monthYear(min) : null;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2024-03-15" → "March 2024". Parsed from the string parts (no Date) so no timezone can shift the
 *  month across a boundary. */
function monthYear(isoDate: string): string {
  const [y, m] = isoDate.split("-");
  const idx = Number(m) - 1;
  const name = MONTHS[idx];
  return name && y ? `${name} ${y}` : isoDate;
}

/** Is this broker the not-at-a-broker one? (Used by the create picker to explain the "Other" option.) */
export function isNotAtBroker(brokerId: string): boolean {
  return brokerId === NOT_AT_BROKER;
}

/** Per-account CURRENT holdings, from the holdings union (each line carries `accountId`). This is
 *  the only honest source for BOTH facts a card shows about positions:
 *   • count — open positions on the account. `/me/accounts.holdingCount` counts only manual
 *     `Holding` rows, so it is structurally 0 for a Verified (broker-fed) account whose positions
 *     live in `broker_holdings`. The union counts a broker account's real positions; the contract
 *     count cannot. So the card takes its count from here, consistently for both kinds.
 *   • value — OUR summed market value. Only priced lines contribute; an account with no priced line
 *     gets `value: null` (never a fabricated ₹0). `/me/accounts` carries no value at all. */
export interface AccountStats {
  count: number;
  value: number | null;
}
export function accountStatsMap(holdings: Holding[]): Map<string, AccountStats> {
  const acc = new Map<string, { count: number; value: number; priced: boolean }>();
  for (const h of holdings) {
    if (!h.accountId) continue;
    const cur = acc.get(h.accountId) ?? { count: 0, value: 0, priced: false };
    cur.count += 1;
    if (h.marketValue != null) {
      cur.value += h.marketValue;
      cur.priced = true;
    }
    acc.set(h.accountId, cur);
  }
  const out = new Map<string, AccountStats>();
  for (const [id, s] of acc) out.set(id, { count: s.count, value: s.priced ? s.value : null });
  return out;
}

// ── Verified-account liveness — ONE resolver, shared by the card, the detail header AND the
//    action bar so the three can never drift. Three orthogonal facts already on the wire
//    (`staleness`), resolved in priority order:
//      • paused (linked_stale)          — the user pressed Pause. Deliberate. WINS over token state:
//                                          a paused book isn't trying to sync and needs no token.
//      • dead   (linked_live +          — the daily Kite token expired (~6am IST). ROUTINE, not an
//                sessionState "dead")      error; the data is real, frozen at the last sync. Needs a
//                                          reconnect (initiate→complete again — nothing is created).
//      • never / synced (linked_live)   — a live feed: awaiting its first sync, or last-synced ago.
//    `sessionState: null` (connection gone / clear-data) presents as "paused" here, because such an
//    account is `linked_stale` — state wins, exactly as built.
export type AccountLiveness =
  | { kind: "none" } // manual — nothing syncs, no line
  | { kind: "paused"; lastSyncedAt: string | null }
  | { kind: "dead"; lastSyncedAt: string | null }
  | { kind: "never" }
  | { kind: "synced"; lastSyncedAt: string };

export function accountLiveness(a: Account): AccountLiveness {
  const s = a.staleness;
  if (a.state === "manual" || !s) return { kind: "none" };
  // PAUSE WINS over token state — a paused book isn't trying to sync, so a dead token is irrelevant.
  if (a.state === "linked_stale") return { kind: "paused", lastSyncedAt: s.lastSyncedAt };
  // linked_live from here. A dead token is orthogonal to pause and ROUTINE (daily) — needs a reconnect.
  if (s.sessionState === "dead") return { kind: "dead", lastSyncedAt: s.lastSyncedAt };
  if (!s.lastSyncedAt) return { kind: "never" };
  return { kind: "synced", lastSyncedAt: s.lastSyncedAt };
}

/** Does this Verified account need a reconnect right now — a LIVE binding whose daily token has
 *  expired (and is NOT paused)? The single signal both surfaces and the action bar key off. */
export function needsReconnect(a: Account): boolean {
  return accountLiveness(a).kind === "dead";
}

/** Compact relative time ("2 hours ago", "3 days ago"). Client-only — reads "now". */
export function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/** "3 holdings" / "1 holding" — count with its noun, correctly pluralised. */
export function countLabel(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}
