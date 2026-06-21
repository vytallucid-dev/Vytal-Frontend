// Peer-group aggregate read-models — mirrored VERBATIM from the backend
// (invest-iq-backend/src/scoring/read/peer-group-view.types.ts). Same conventions
// as types/health.ts: every number is a JS number; a field with no backing data is
// `null` with the key present — never omitted, never fabricated.
//
// This file currently mirrors only the LIST shape (the index page). The detail shape
// (PeerGroupHealthView) lands with the per-pond Health tab build.

import type {
  LabelBand,
  PillarKey,
  MetricBand,
  BarDirection,
  SectorClass,
  TrajectoryMarker,
  DivergenceFlag,
  FlowCategoryState,
} from "./health";

export type BandDistribution = Record<LabelBand, number>;

export interface SectorRef {
  key: string;
  displayName: string;
}

/** One lightweight card on the peer-group index. When `scored` is false the pond has
 *  no in-force snapshots — every aggregate field is null (10 of 23 ponds today). */
export interface PeerGroupListItem {
  id: string;
  name: string;
  displayName: string;
  /** Parent sector (for grouping cards under sector headers). null only if unlinked. */
  sector: SectorRef | null;
  /** Roster size (the pond's member count). */
  memberCount: number;
  scored: boolean;
  periodKey: string | null;
  asOfDate: string | null; // YYYY-MM-DD
  /** Members folded into the aggregate (scored at the period; may be < memberCount). */
  scoredCount: number;
  medianComposite: number | null;
  meanComposite: number | null;
  bandDistribution: BandDistribution | null;
  dispersion: { stdDev: number; iqr: number } | null;
  range: { min: number; max: number } | null;
  /** Templated from median band + dispersion (e.g. "healthy, tight"). null when unscored. */
  descriptor: string | null;
  /** Members currently firing ≥1 red flag — the attention indicator. */
  redFlagMemberCount: number;
}

// ── DETAIL (PeerGroupHealthView) — mirrored from the backend ─────────────────────
// GET /api/peer-groups/:id/health. Consumed by the per-pond Health tab.

export interface ScopeDispersion {
  stdDev: number;
  iqr: number;
  p25: number;
  p75: number;
}

export interface PeerGroupIdentity {
  id: string;
  name: string;
  displayName: string;
  sector: SectorRef | null;
  sectorClass: SectorClass;
  industryPath: "banking" | "non_financial" | "mixed" | null;
  memberCount: number; // roster
  periodKey: string | null;
  asOfDate: string | null;
}

export interface PeerGroupAggregate {
  scoredCount: number;
  medianComposite: number;
  meanComposite: number;
  /** Median composite of the SAME members one period back. null when no prior
   *  period exists (pond at its earliest scored quarter). */
  priorMedianComposite: number | null;
  /** medianComposite − priorMedianComposite. null when prior is null. */
  medianDrift: number | null;
  /** The immediate-prior periodKey the drift is measured against. null when absent. */
  priorPeriodKey: string | null;
  dispersion: ScopeDispersion;
  range: {
    min: { symbol: string; composite: number };
    max: { symbol: string; composite: number };
  } | null;
  /** Raw composites ASCENDING — the distribution strip substrate. */
  composites: number[];
  bandDistribution: BandDistribution;
  pillarMedians: Record<PillarKey, number>;
  redFlagMemberCount: number;
  descriptor: string;
}

export interface FiredFlag {
  flagKey: string;
  severity: string | null;
  tier: "auto" | "review";
}
export interface FiredPattern {
  patternKey: string;
  direction: string | null;
  severity: string | null;
  /** File 1 §5E display state; defaults "active". */
  displayState?: "active" | "pending_data_integration" | "dampened";
}

export interface PeerGroupMemberView {
  symbol: string;
  name: string;
  composite: number;
  labelBand: LabelBand;
  pillars: Record<PillarKey, number>;
  trajectoryMarker: TrajectoryMarker | null;
  trajectoryDelta: number | null;
  divergence: { flag: DivergenceFlag; gap: number };
  firedFlags: FiredFlag[];
  firedPatterns: FiredPattern[];
  /** C/D ownership flow-category state — read-projection of score_ownership_flows.category_state.
   *  undefined when the stock has no shareholding data. */
  flowCategoryStates?: { C_insider: FlowCategoryState; D_block: FlowCategoryState };
}

export type PathologyReach = "isolated" | "cluster" | "widespread";

export interface PathologyCensusItem {
  kind: "red_flag" | "pattern";
  key: string;
  severity: string | null;
  memberCount: number; // N firing
  outOf: number; // M scored at period
  members: string[];
  reach: PathologyReach;
  /** Dominant display state across the firing members (File 1 §5E). A pattern dampened
   *  PG-wide (>80%) surfaces here as "dampened" so the board can show the sector-wide chip.
   *  Optional + defaults "active" — present once the census builder projects it. */
  displayState?: "active" | "pending_data_integration" | "dampened";
}

export interface PeerMetricMemberPoint {
  symbol: string;
  rawValue: number;
  l1Band: MetricBand | null;
  scoreState: string;
}

export interface PeerMetricDistribution {
  metricKey: string;
  pillar: "foundation" | "momentum";
  direction: BarDirection | null;
  bars: {
    excellent: number;
    good: number;
    acceptable: number;
    concerning: number;
    distress: number;
  } | null;
  /** Persisted peer μ/σ/N. `usable` = sampleN≥5 && stdDev>0 — when false the UI must
   *  NOT draw a curve or compute (raw−μ)/σ. */
  peer: { mean: number; stdDev: number; sampleN: number; usable: boolean } | null;
  members: PeerMetricMemberPoint[];
}

export interface PeerGroupMover {
  symbol: string;
  composite: number;
  priorComposite: number;
  delta: number;
  fromPeriod: string;
  toPeriod: string;
}

export interface PeerGroupHealthView {
  scored: boolean;
  identity: PeerGroupIdentity;
  /** null only when the pond has no in-force snapshots. */
  aggregate: PeerGroupAggregate | null;
  members: PeerGroupMemberView[];
  /** Roster members whose latest snapshot is at an OLDER period — never folded in. */
  notAtCurrentPeriod: { symbol: string; latestPeriod: string }[];
  pathology: PathologyCensusItem[];
  metricDistributions: PeerMetricDistribution[];
  movers: { risers: PeerGroupMover[]; slippers: PeerGroupMover[] };
}
