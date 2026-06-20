/**
 * Read-model contracts for the Research TOOLS (Trajectory / Divergence / Ownership).
 * Mirrors the backend `stocks-list.types.ts` verbatim:
 *   • GET /api/stocks            → ScoredStockLite[]
 *   • GET /api/stocks/scan?tool= → StockScanItem[]
 */

import type {
  LabelBand,
  TrajectoryMarker,
  DivergenceFlag,
  PillarKey,
  FlowCategoryView,
} from "@/types/health";

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

/** A scored stock ranked for a tool's landing scan. `marker`/`delta`/`previousComposite`
 *  are null for a single-period (building-history) stock. `spark` = recent in-force
 *  composites, oldest→newest (≤8), for the card's mini chart. */
export interface StockScanItem {
  symbol: string;
  name: string;
  sector: SectorRef | null;
  composite: number;
  band: LabelBand;
  periodKey: string;
  marker: TrajectoryMarker | null;
  delta: number | null;
  previousComposite: number | null;
  previousPeriodKey: string | null;
  spark: number[];
}

/** Divergence configuration TYPE — the asymmetric taxonomy (mirrors backend). */
export type DivergenceConfig = "value" | "price_ahead" | "ownership" | "mixed" | "none";
export type DivergenceDirection = "widening" | "narrowing" | "steady";

/** A scored stock for the DIVERGENCE landing scan — typed by config + direction,
 *  `spark` = the fixed pair's gap over time (oldest→newest). Mirrors the backend. */
export interface DivergenceScanItem {
  symbol: string;
  name: string;
  sector: SectorRef | null;
  composite: number;
  band: LabelBand;
  periodKey: string;
  gap: number;
  flag: DivergenceFlag;
  config: DivergenceConfig;
  direction: DivergenceDirection;
  highPillar: PillarKey;
  lowPillar: PillarKey;
  previousGap: number | null;
  gapDelta: number | null;
  spark: number[];
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
  scored: boolean;
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
