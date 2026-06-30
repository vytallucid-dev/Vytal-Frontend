// File: types/compare.ts
//
// Frontend mirror of the backend ComparisonView contract
// (src/scoring/read/compare-view.types.ts) — the exact JSON shape returned by
// GET /api/compare?a=SYMBOL1&b=SYMBOL2 (stock-vs-stock).
//
// The comparison endpoint is an ALIGNMENT service over the existing per-stock reads:
// it decides what is honestly comparable and emits ONE curated payload. The selection
// landing reads only the comparability signal (comparability / peerStandingComparable /
// warnings); the dedicated view renders the full payload.
//
// CONVENTIONS (mirror health / fundamentals): numbers are JS numbers; a metric with no
// backing data is `null` with the key PRESENT; values are already canonical.

import type { IndustryFamily } from "./fundamentals";
import type { InsiderEvent, BlockEvent } from "./research-tools";
import type {
  LabelBand,
  PillarKey,
  PillarView,
  SectorClass,
  TrajectoryMarker,
  TrajectoryPoint,
  DivergenceFlag,
  FindingsSection,
  PondMask,
} from "./health";

/** TWO-TIER comparability. `same_family` → full comparison (universal axis + that
 *  family's specific set, directly comparable). `cross_family` → universal axis only;
 *  family-specific metrics are shown separately and NOT directly comparable. */
export type Comparability = "same_family" | "cross_family";

/** A metric's display unit — drives the formatter. No verdict semantics. */
export type MetricUnit =
  | "score"
  | "band"
  | "marker"
  | "flag"
  | "pct"
  | "cr"
  | "rupees"
  | "ratio"
  | "multiple";

/** One UNIVERSAL metric, paired side-by-side. Lines up for ANY two stocks. */
export interface UniversalMetric {
  key: string;
  label: string;
  unit: MetricUnit;
  aValue: number | string | null;
  bValue: number | string | null;
}

/** One FAMILY-SPECIFIC metric for a single entity. Directly comparable side-by-side
 *  ONLY when both entities share the family (comparability === "same_family"). */
export interface FamilyMetric {
  key: string;
  label: string;
  unit: MetricUnit;
  value: number | null;
}

/** Each entity's within-PG standing. NEVER compared across entities unless they sit
 *  in the SAME peer group (see `peerStandingComparable`). */
export interface CompareePeerStanding {
  peerGroupId: string;
  peerGroupName: string | null;
  rank: number;
  percentile: number;
  memberCount: number;
  perPillarRank: Record<PillarKey, { rank: number; outOf: number }>;
}

/** Interpretive class context — present when both entities have a known sectorClass;
 *  null when either is a coarse-bucket sector (honest-empty). The note is interpretive
 *  context only — no prediction, no recommendation, no winner via class language. */
export interface ClassContext {
  aClass: Exclude<SectorClass, null>;
  bClass: Exclude<SectorClass, null>;
  sameClass: boolean;
  note: string;
}

/** Lightweight identity for an entity. */
export interface CompareeIdentity {
  sector: { key: string; displayName: string } | null;
  /** Sector archetype — null for coarse-bucket sectors (honest-empty). */
  sectorClass: SectorClass;
  peerGroup: { id: string; name: string; displayName: string; memberCount: number } | null;
  asOfDate: string;
  periodKey: string;
}

/** One side of the comparison — A or B. */
export interface Comparee {
  symbol: string;
  name: string;
  family: IndustryFamily;
  familyLabel: string;
  scored: boolean;
  identity: CompareeIdentity;
  universal: {
    composite: number | null;
    band: LabelBand | null;
    trajectoryMarker: TrajectoryMarker | null;
    divergenceFlag: DivergenceFlag | null;
    divergenceGap: number | null;
    foundation: number | null;
    momentum: number | null;
    market: number | null;
    ownership: number | null;
    roe: number | null;
    basicEps: number | null;
    bookValuePerShare: number | null;
    patGrowthYoy: number | null;
    totalAssets: number | null;
    netWorth: number | null;
    return1y: number | null;
    return3y: number | null;
    pctFrom52WHigh: number | null;
    pctFrom52WLow: number | null;
    promoterPct: number | null;
    fiiPct: number | null;
    diiPct: number | null;
    pledgedPctOfPromoter: number | null;
    /** Live market cap (₹ Cr) — scoring-independent, present for unscored stocks too. */
    marketCap: number | null;
  };
  familySpecific: FamilyMetric[];
  /** Per-pillar metric breakdown, passed through from this entity's health view.
   *  Foundation/Momentum carry `metrics[]`, Market carries `marketSubs[]`, Ownership
   *  carries `ownership`. Foundation/Momentum metric keys are family-specific (line up
   *  side-by-side only same-family); market subs + ownership structure are universal. */
  pillars: PillarView[];
  /** Fired findings (patterns + red flags), passed through from this entity's health view.
   *  Rendered as this entity's OWN list — NEVER row-paired with the other's. The engine
   *  prunes by family (a bank can't fire the 6 non-financial-only patterns), so cross-family
   *  columns are honest with no extra gating. */
  findings: FindingsSection | null;
  /** Composite-score history (universal 0–100) — overlays directly with the other's series. */
  trajectorySeries: TrajectoryPoint[];
  /** PG-level pond heat — a fact about THIS entity's own peer group, NEVER cross-compared. */
  pondMask: PondMask | null;
  /** Composite trajectory delta (universal 0–100 movement). */
  trajectoryDelta: number | null;
  peerStanding: CompareePeerStanding | null;
  /** Recent insider / block-deal activity — per entity, never row-paired. Empty today (feeds
   *  wired-but-dormant) → render the honest "awaiting feed" state. Newest-first, capped 25. */
  events: { insider: InsiderEvent[]; block: BlockEvent[] };
}

/** THE top-level read-model returned by GET /api/compare?a=…&b=…. */
export interface ComparisonView {
  a: Comparee;
  b: Comparee;
  comparability: Comparability;
  universalMetrics: UniversalMetric[];
  familyContext: {
    a: FamilyMetric[];
    b: FamilyMetric[];
    comparableDirectly: boolean;
  };
  warnings: string[];
  peerStandingComparable: boolean;
  /** Class-level interpretive context — null when either entity is a coarse-bucket sector. */
  classContext: ClassContext | null;
}
