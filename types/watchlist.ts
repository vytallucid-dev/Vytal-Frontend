// ─────────────────────────────────────────────────────────────────────────────
// WATCHLIST — frontend view types over the per-user pinned research surface.
//
//   GET    /api/v1/me/watchlist            → WatchlistEntry[] (the rich read-join)
//   POST   /api/v1/me/watchlist  { stockId } → pin   (idempotent on user+stock)
//   DELETE /api/v1/me/watchlist/:stockId     → unpin (owner-scoped)
//
// READ-ONLY: every health / band / finding / verdict figure is computed server-side
// and rendered as-is — the client NEVER recomputes a score, band, finding or verdict.
// The `pinned*` fields are the immutable pin-time baseline; the *Delta fields are the
// server's since-you-added convenience (health − pinnedHealth, price change %). An
// unscored pin honestly carries nulls in the health layer (never a fabricated band).
//
// Mirrors the backend EnrichedWatchlistEntry (watchlist-enrich.ts) verbatim; numbers
// arrive as JS numbers (Decimals converted at the API edge), null where unavailable.
// ─────────────────────────────────────────────────────────────────────────────

import type { LabelBand } from "@/types/health";

/** One fired red flag on the pinned stock's latest snapshot (honest-empty when none). */
export interface WatchlistRedFlag {
  flagKey: string;
  severity: string | null;
  tier: string;
  triggeringValues: unknown;
}

/** One fired pattern on the pinned stock's latest snapshot. */
export interface WatchlistPattern {
  patternKey: string;
  direction: string | null;
  severity: string | null;
  displayState: string;
  magnitude: number | null;
  evidence: unknown;
  metricRefs: unknown;
}

/** A fired three-lens verdict (metric- or pillar-level). `verdict` is the BASE wording
 *  the backend composed with NO standing reconciliation — render/glance it verbatim; the
 *  full standing-reconciled read lives on the per-stock health page. */
export interface WatchlistLensVerdict {
  pillar: "foundation" | "momentum";
  id: string;
  label: string;
  tone: string;
  fieldVerdict: "PG_WEAK" | "PG_STRONG" | null;
  role: "top_level" | "supporting_detail";
  verdict: string;
  /** present only on metric-level verdicts */
  metricKey?: string;
}

/** One enriched watchlist row (the GET response element). */
export interface WatchlistEntry {
  stockId: string;
  symbol: string;
  name: string;
  sector: string | null;
  industryType: string;
  addedAt: string;
  favorite: boolean; // two-tier star (mutable, unlike the pinned_* baseline)
  scored: boolean;
  // current read layer (null = honestly unavailable, never faked)
  health: number | null;
  band: LabelBand | null;
  healthAsOf: string | null;
  tier: string;
  marketCap: number | null; // ₹Cr from the latest market-cap freeze (null ⇔ unknown/unranked)
  price: number | null;
  prevClose: number | null;
  dayChangePct: number | null;
  priceDate: string | null;
  // pin-time baseline (immutable) + current-vs-pinned deltas
  pinnedHealth: number | null;
  pinnedBand: LabelBand | null;
  pinnedPrice: number | null;
  healthDelta: number | null; // health − pinnedHealth (both present)
  priceChangePct: number | null; // (price − pinnedPrice) / pinnedPrice × 100
  // fired findings (honest-empty arrays when none)
  findings: {
    redFlags: WatchlistRedFlag[];
    patterns: WatchlistPattern[];
  };
  // three-lens verdicts digest (honest-empty when unscored / nothing fired)
  threeLens: {
    metricPatterns: WatchlistLensVerdict[];
    pillarPatterns: WatchlistLensVerdict[];
  };
}

/** The GET /me/watchlist envelope payload. */
export interface WatchlistResponse {
  watchlist: WatchlistEntry[];
  count: number;
}
