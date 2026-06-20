// types/universe-view.ts — mirrored VERBATIM from backend universe-view.types.ts
//
// Universe-level aggregate read-model: GET /api/universe/health
// → UniverseHealthView. Mirrors PeerGroupHealthView structure minus pond-identity,
// plus the sinceLastWeek 7-day delta block for the Hub Briefing.

import type {
  LabelBand,
  PillarKey,
  TrajectoryMarker,
  DivergenceFlag,
} from "./health";
import type {
  ScopeDispersion,
  BandDistribution,
  FiredFlag,
  FiredPattern,
  PathologyCensusItem,
  PeerGroupMover,
} from "./peer-group";

// Re-export for Hub component convenience
export type { PathologyCensusItem, PeerGroupMover, FiredFlag, FiredPattern };

export interface UniverseMemberView {
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
  /** Sector for Hub Overview table grouping/filter. null if unlinked. */
  sector: { key: string; displayName: string } | null;
}

export interface UniverseAggregate {
  scoredCount: number;
  medianComposite: number;
  meanComposite: number;
  priorMedianComposite: number | null;
  medianDrift: number | null;
  priorPeriodKey: string | null;
  dispersion: ScopeDispersion;
  range: {
    min: { symbol: string; composite: number };
    max: { symbol: string; composite: number };
  } | null;
  composites: number[];
  bandDistribution: BandDistribution;
  pillarMedians: Record<PillarKey, number>;
  redFlagMemberCount: number;
  descriptor: string;
}

export interface UniverseSinceLastWeek {
  anchorDate: string;
  newVersionCount: number;
  bandCrossings: Array<{
    symbol: string;
    from: LabelBand;
    to: LabelBand;
    direction: "up" | "down";
  }>;
  newFlags: Array<{
    symbol: string;
    flagKey: string;
    severity: string | null;
  }>;
  newDeteriorations: Array<{
    symbol: string;
    delta: number;
    fromComposite: number;
    toComposite: number;
    fromBand: LabelBand;
    toBand: LabelBand;
  }>;
  newRecoveries: Array<{
    symbol: string;
    delta: number;
    fromComposite: number;
    toComposite: number;
    fromBand: LabelBand;
    toBand: LabelBand;
  }>;
  honestNote: string;
}

export interface UniverseHealthView {
  scored: boolean;
  periodKey: string | null;
  asOfDate: string | null;
  scoredUniverseSize: number;
  aggregate: UniverseAggregate | null;
  members: UniverseMemberView[];
  notAtCurrentPeriod: { symbol: string; latestPeriod: string }[];
  pathology: PathologyCensusItem[];
  movers: { risers: PeerGroupMover[]; slippers: PeerGroupMover[] };
  sinceLastWeek: UniverseSinceLastWeek;
}
