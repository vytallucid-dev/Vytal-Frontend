export type IndustryPath = "non_financial" | "banking";
export type CoverageState = "scored" | "covered" | "off_platform";
export type LabelBand = "fragile" | "below_par" | "steady" | "healthy" | "pristine";
export type PillarKey = "foundation" | "momentum" | "market" | "ownership";
export type PillarState = "scored" | "unavailable_redistributed";
export type MetricBand = "excellent" | "good" | "acceptable" | "concerning" | "distress";
export type MetricScoreState = "scored" | "suppressed" | "missing_renorm" | "neutral_hold";
export type FlowCategoryKey = "A_promoter" | "B_institutional" | "C_insider" | "D_block";
export type FlowCategoryState = "scored" | "dormant_no_feed" | "dormant_no_data";
export type FlowTrendState = "three_up" | "three_down" | "mixed" | "neutral";
export type MarketSubKey = "A1" | "A2" | "B1" | "B2" | "B3" | "C1" | "D1";
export type MarketCategory = "A" | "B" | "C" | "D";
export type TrajectoryMarker = "improving" | "stable" | "deteriorating";
export type DivergenceFlag = "none" | "notable" | "wide";
export type BarDirection = "higher_better" | "lower_better";
export type SectorClass = "Quality" | "Defensive" | "Commodity" | "Cyclical" | "Growth" | "PSU" | null;

export interface IdentitySection {
  symbol: string;
  name: string;
  sector: { key: string; displayName: string } | null;
  sectorClass: SectorClass;
  industryPath: IndustryPath;
  peerGroup: { id: string; name: string; displayName: string; memberCount: number } | null;
  coverageState: CoverageState | null;
  coverageReason: string | null;
  asOfDate: string;
  periodKey: string;
}

export interface BandColour {
  band: LabelBand;
  label: string;
  colour: string | null;
  range: [number | null, number | null] | null;
}

export interface DivergenceView {
  flag: DivergenceFlag;
  gap: number;
  high: { pillar: PillarKey; subtotal: number } | null;
  low: { pillar: PillarKey; subtotal: number } | null;
  storedScalar: number;
}

export interface VerdictSection {
  composite: number;
  label: BandColour;
  trajectoryMarker: TrajectoryMarker | null;
  trajectoryDelta: number | null;
  divergence: DivergenceView;
  pondMask: null;
}

export interface MetricBars {
  direction: BarDirection;
  excellent: number;
  good: number;
  acceptable: number;
  concerning: number;
  distress: number;
}

export interface PeerStats {
  mean: number;
  stdDev: number;
  sampleN: number;
  /** True only when the cross-section is a USABLE distribution: sampleN ≥ 5 AND
   *  stdDev > 0. When false, render "insufficient peers (N=x)" — NEVER a drawn
   *  distribution or a (raw−μ)/σ computation. */
  usable: boolean;
}

export interface MetricView {
  metricKey: string;
  rawValue: number;
  l1Score: number | null;
  l2Score: number | null;
  l3Score: number | null;
  metricScore: number;
  l1Band: MetricBand | null;
  scoreState: MetricScoreState;
  nominalWeight: number;
  effectiveWeight: number;
  contribution: number;
  suppressionReason: string | null;
  bars: MetricBars | null;
  peer: PeerStats | null;
}

export interface MarketSubView {
  subComponent: MarketSubKey;
  category: MarketCategory;
  available: boolean;
  reason: string | null;
  rawValue: number | null;
  score: number | null;
  band: MetricBand | null;
  saturated: boolean;
  capped: boolean;
}

export interface FlowCategoryView {
  category: FlowCategoryKey;
  categoryState: FlowCategoryState;
  rawSubScore: number;
  capApplied: number;
  cappedSubScore: number;
  bandLanded: string | null;
  netFlowValue: number | null;
  trendState: FlowTrendState | null;
}

export interface OwnershipDetail {
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
}

export interface NativeZone {
  lowerMark: number;
  upperMark: number;
  position: "below_native" | "in_native" | "above_native";
}

export interface PillarView {
  pillar: PillarKey;
  subtotal: number;
  state: PillarState;
  nominalWeight: number;
  appliedWeight: number;
  nativeZone: NativeZone;
  metrics: MetricView[] | null;
  marketSubs: MarketSubView[] | null;
  ownership: OwnershipDetail | null;
}

export interface TrajectoryPoint {
  periodKey: string;
  asOfDate: string;
  composite: number;
  labelBand: LabelBand;
  foundation: number;
  momentum: number;
  market: number;
  ownership: number;
}

export interface CrossingEvent {
  type: "band" | "pillar_zone";
  fromPeriod: string;
  toPeriod: string;
  pillar: PillarKey | null;
  from: string;
  to: string;
}

export interface CorporateEventView {
  eventType: string;
  eventDate: string;
  description: string | null;
  impactLevel: string;
}

export interface TrajectorySection {
  windowQuarters: number;
  series: TrajectoryPoint[];
  crossings: CrossingEvent[];
  events: CorporateEventView[];
}

export interface RedFlagView {
  flagKey: string;
  severity: string | null;
  tier: "auto" | "review";
  triggeringValues: unknown | null;
  guardrailEventId: string | null;
}

export interface PatternView {
  patternKey: string;
  direction: string | null;
  severity: string | null;
  evidence: unknown | null;
  metricRefs: unknown | null;
}

export interface FindingsSection {
  redFlags: RedFlagView[];
  patterns: PatternView[];
}

export interface PeerRankView {
  rank: number;
  outOf: number;
}

export interface PeerStandingSection {
  peerGroupId: string;
  periodKey: string;
  memberCount: number;
  rank: number;
  percentile: number;
  neighbours: {
    above: { symbol: string; composite: number } | null;
    below: { symbol: string; composite: number } | null;
  };
  perPillarRank: Record<PillarKey, PeerRankView>;
}

export interface HealthSnapshotView {
  scored: boolean;
  identity: IdentitySection;
  verdict: VerdictSection | null;
  pillars: PillarView[];
  trajectory: TrajectorySection | null;
  findings: FindingsSection | null;
  peerStanding: PeerStandingSection | null;
}
