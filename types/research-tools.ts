/**
 * Read-model contracts for the Research TOOLS (Trajectory / Divergence / Ownership).
 * Mirrors the backend `stocks-list.types.ts` verbatim:
 *   • GET /api/stocks            → ScoredStockLite[]
 *   • GET /api/stocks/scan?tool= → ToolScanPage<ToolScanItem>  (cursor-paged; see ToolScanPage)
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

/** A scored stock ranked for a tool's landing scan — Trajectory AND Divergence share
 *  this SAME shape (Phase 4): the tool renders the stock's own persisted findings,
 *  filtered to that tool's family, ranked by that tool's own rule. Mirrors backend
 *  ToolScanItem (tool-scan.service.ts) — no `config`/`flag`/`marker`/`spark`/`gap`,
 *  which were the retired client-recomputed taxonomy. */
export interface ToolScanItem {
  symbol: string;
  name: string;
  sector: SectorRef | null;
  composite: number;
  band: LabelBand;
  periodKey: string;
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

/**
 * ONE PAGE of a tool's ranked landing scan — mirrors backend ToolScanPage
 * (tool-scan.page.ts). GET /api/stocks/scan?tool=… returns this wrapper, not a
 * bare array: `total` is the size of the whole (possibly filtered) ranking,
 * not the page, and `cursor`/`hasMore` are what a caller pages through it with.
 */
export interface ToolScanPage<T> {
  tool: ToolId;
  items: T[];
  total: number;
  cursor: string | null;
  hasMore: boolean;
}
