/**
 * Read-model contracts for the Research TOOLS (Trajectory / Divergence / Ownership).
 * Mirrors the backend `stocks-list.types.ts` verbatim:
 *   • GET /api/stocks            → ScoredStockLite[]
 *   • GET /api/stocks/scan?tool= → ToolScanPage<ToolScanItem | OwnershipScanItem>
 */

import type { LabelBand, FlowCategoryView } from "@/types/health";

export interface SectorRef {
  key: string;
  displayName: string;
}

/** Lean scored-stock row — powers the name-switcher typeahead + landing fallback. */
export interface ScoredStockLite {
  symbol: string;
  name: string;
  sector: SectorRef | null;
  composite: number;
  band: LabelBand;
}

/** Lean row for EVERY stock in the universe (scored + not-yet-scored) — powers the
 *  screener typeahead so it spans all tracked stocks, not just the scored subset.
 *  `scored=false` rows carry null composite/band. Mirrors backend UniverseStockListItem.
 *  `id` is the Stock UUID — the key the watchlist pin (POST /me/watchlist) targets. */
export interface UniverseStockLite {
  id: string;
  symbol: string;
  name: string;
  sector: SectorRef | null;
  scored: boolean;
  composite: number | null;
  band: LabelBand | null;
}

export type DivergenceDirection = "widening" | "narrowing" | "steady";

/** One fired finding on a tool scan row — already resolved server-side from the
 *  catalogue (name/description/doesntMean/verdict). Mirrors backend ToolFinding
 *  (tool-scan.service.ts). The tool renders this; it computes nothing from it. */
export interface ToolFinding {
  key: string;
  name: string;
  description: string;
  doesntMean: string;
  /** The evidence-bound sentence, already regime-resolved by the verdict layer. */
  verdict: string;
  severity: string | null;
  direction: string | null;
  evidence: unknown;
}

/** ★ DIVERGENCE ONLY — the S1 "no tension" tool state. Computed in exactly one
 *  backend place (findings/divergence/aligned.ts) and never a finding. Mirrors
 *  backend AlignedState. */
export interface AlignedState {
  aligned: boolean;
  spread: number | null;
  highPillar: string | null;
  lowPillar: string | null;
  alignedMax: number;
}

/** The stock's pond, lean — what the landing's peer-group filter needs (an id to filter on,
 *  a name to label with). Mirrors backend ScanPeerGroupRef. Carried by EVERY scan shape, so the
 *  peer-group filter works on all three tools. */
export interface ScanPeerGroupRef {
  id: string;
  name: string;
  displayName: string;
}

/** ★ DIVERGENCE ONLY — the card's two-line mini chart. A divergence is a gap BETWEEN TWO
 *  PILLARS, so the card draws both legs and the band between them.
 *
 *  ⚠ The pair is fixed ONCE from the current snapshot and then read backwards (mirroring the
 *  single view's pickScoredPair + buildSpread). Choosing per point would let "high" mean Market
 *  in one quarter and Foundation in the next — two lines swapping identity mid-chart.
 *  Mirrors backend DivergenceSpark. */
export interface DivergenceSpark {
  highPillar: string;
  lowPillar: string;
  /** Both legs at each snapshot where BOTH were genuinely scored, oldest→newest. */
  points: { high: number; low: number }[];
}

/** A scored stock ranked for a tool's landing scan — Trajectory AND Divergence share
 *  this SAME shape (Phase 4): the tool renders the stock's own persisted findings,
 *  filtered to that tool's family, ranked by that tool's own rule. Mirrors backend
 *  ToolScanItem (tool-scan.service.ts) — no `config`/`flag`/`marker`/`gap`, which were
 *  the retired client-recomputed taxonomy.
 *
 *  ⚠ `spark` is NOT one of those. It is a RECORDING — the stock's own trailing composites,
 *  served straight off the in-force snapshots — not a pattern this surface re-derives. */
export interface ToolScanItem {
  symbol: string;
  name: string;
  sector: SectorRef | null;
  composite: number;
  band: LabelBand;
  periodKey: string;
  /** The stock's peer group. Null when it is in none. */
  peerGroup: ScanPeerGroupRef | null;
  /** Trailing in-force composites, oldest→newest (≤8) — the trajectory card's sparkline. */
  spark: number[];
  /** ★ DIVERGENCE ONLY — the two legs of this stock's widest pillar gap over time. Null on
   *  trajectory, deliberately (a two-pillar reading is out of trajectory's reach by
   *  construction), and null when fewer than two pillars are scored. Served, not derived. */
  spreadSpark: DivergenceSpark | null;
  findings: ToolFinding[];
  /** Present only on the divergence tool, only when the stock is aligned. */
  aligned: AlignedState | null;
  /** Spec copy for the aligned state — carried so no surface re-types it. */
  alignedCopy: { name: string; description: string; verdict: string } | null;
}

// ── OWNERSHIP (mirrors backend ownership-series.types + OwnershipScanItem) ───────

export type OwnershipTell =
  | "pledge_r1"
  | "pledge_high"
  | "distribution"
  | "accumulation"
  | "rotation"
  | "flat";

/** Holding split at a point in time. Pledge is derived from share counts
 *  (pledgedShares ÷ promoterShares) — the Decimal pledge column is unreliable. */
export interface OwnershipHolding {
  asOnDate: string;
  promoterPct: number | null;
  fiiPct: number | null;
  diiPct: number | null;
  retailPct: number | null;
  othersPct: number | null;
  pledgedPctOfPromoter: number | null;
  pledgedPctOfTotal: number | null;
}

export interface OwnershipSeriesPoint {
  periodKey: string;
  asOfDate: string;
  baseline: number;
  pledgingAdjustment: number;
  primarySubtotal: number;
  flowAdjustmentClamped: number;
  finalOwnership: number;
  r1Fired: boolean;
  flowCategories: FlowCategoryView[];
  holding: OwnershipHolding | null;
}

export interface PledgingPoint {
  asOnDate: string;
  sourceDate: string;
  fiscalYear: string;
  quarter: string;
  pledgedPctOfPromoter: number | null;
  pledgedPctOfTotal: number | null;
  pledgedShares: string | null;
  promoterShares: string | null;
  totalShares: string | null;
}

export interface OwnershipAnatomy {
  periodKey: string;
  asOfDate: string;
  baseline: number;
  baselineReason: string;
  pledgingAdjustment: number;
  penalties: { r2: number; r6: number; prolongedFii: number };
  primarySubtotal: number;
  flowAdjustmentRaw: number;
  flowAdjustmentClamped: number;
  finalOwnership: number;
  r1Fired: boolean;
  r1TriggeringValues: unknown | null;
  flowCategories: FlowCategoryView[];
  holding: OwnershipHolding | null;
}

/** One insider trade event (NSE PIT disclosure) — always arrays, empty when none. */
export interface InsiderEvent {
  tradeDate: string | null;
  personName: string;
  personCategory: string;
  transactionType: string;
  securitiesTraded: string | null;
  holdingPctDelta: number | null;
  tradeValueCr: number | null;
  acquisitionMode: string | null;
  regulation: string;
}

/** One block/bulk deal event. */
export interface BlockEvent {
  dealDate: string;
  dealType: string;
  clientName: string;
  transactionType: string;
  quantity: string;
  price: number;
  valueCr: number | null;
}

export interface OwnershipSeriesView {
  symbol: string;
  name: string;
  windowQuarters: number;
  scored: boolean; // alias of hasScoredPeriod (a scored period exists)
  hasScoredPeriod: boolean; // gates only the score-derived sections; raw ledger is independent
  series: OwnershipSeriesPoint[];
  pledging: PledgingPoint[];
  current: OwnershipAnatomy | null;
  events: {
    insider: InsiderEvent[];
    block: BlockEvent[];
  };
}

/** A scored stock for the OWNERSHIP landing scan — tell from holding-split deltas +
 *  pledging; `spark` is institutional share (FII+DII) over time. */
export interface OwnershipScanItem {
  symbol: string;
  name: string;
  sector: SectorRef | null;
  composite: number;
  band: LabelBand;
  periodKey: string;
  /** The stock's peer group — the landing's pond filter. Null when it is in none. */
  peerGroup: ScanPeerGroupRef | null;
  /** ★ The tell IS this tool's categorical dimension — what the `patterns` filter narrows on
   *  here. Ownership fires no findings, so the scan matches this field instead. */
  tell: OwnershipTell;
  r1Fired: boolean;
  pledgedPctOfPromoter: number | null;
  instDelta: number | null;
  fiiDelta: number | null;
  diiDelta: number | null;
  finalOwnership: number;
  spark: number[];
}

/** Tool ids — the seam for `divergence | ownership` reusing the same frame. */
export type ToolId = "trajectory" | "divergence" | "ownership";

/** One PAGE of a tool's landing scan. `cursor` is opaque — hand it back verbatim for the
 *  next page. `total` is the whole ranking (AS FILTERED), NOT the page. */
export interface ToolScanPage<T> {
  tool: ToolId;
  items: T[];
  total: number;
  cursor: string | null; // null once the scan is exhausted
  hasMore: boolean;
}

// ── LANDING FILTERS ──────────────────────────────────────────────────────────────────
// The narrowing is SERVER-SIDE (GET /api/stocks/scan?pg=&patterns=) because the landing is
// cursor-paged: the client only holds the pages it has scrolled to, so a client-side filter
// would filter a PREFIX of the ranking and report a `total` that isn't one. Mirrors backend
// ToolScanFilters / ToolScanFacets (tool-scan.page.ts).

/** One option in a filter dropdown. `count` is cross-filtered — computed with the OTHER
 *  dimension's selection applied — so a 0 truthfully reads "none, given your other filter". */
export interface ScanFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface ToolScanFacets {
  tool: ToolId;
  peerGroups: ScanFacetOption[];
  patterns: ScanFacetOption[];
  /** Condition bands, already ordered BEST→WORST by the backend's band mapping — render in the
   *  given order, never re-sort by count: this is a scale, not a popularity list. */
  bands: ScanFacetOption[];
}

/** The reader's selection. OR within each list, AND between them; empty = don't narrow. */
export interface ScanFilters {
  peerGroups: string[];
  patterns: string[];
  /** LabelBand keys — `pristine` … `fragile`. */
  bands: string[];
}

export const EMPTY_SCAN_FILTERS: ScanFilters = { peerGroups: [], patterns: [], bands: [] };

export const scanFilterCount = (f: ScanFilters): number =>
  f.peerGroups.length + f.patterns.length + f.bands.length;
