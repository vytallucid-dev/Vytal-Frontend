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

/** PG-level pond mask (File 1 §5 / File 2 §3.3) — inherited from the snapshot's PG. */
export interface PondMask {
  heat: "hot" | "warm" | "calm";
  /** heat === "hot" — the boolean the §5 price-linked cards (B/C1/D) consume. */
  isHot: boolean;
  /** signed pond median ~21d trailing return %, e.g. +12.4 / −17.5 (null when n/a). */
  trailingMovePct: number | null;
}

export interface VerdictSection {
  composite: number;
  label: BandColour;
  trajectoryMarker: TrajectoryMarker | null;
  trajectoryDelta: number | null;
  divergence: DivergenceView;
  /** PG-level pond mask; null when not established (no member quorum) or pre-stamp. */
  pondMask: PondMask | null;
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

// ── THREE-LENS CONTRACT (S2/S3) ────────────────────────────────────────────────

/** Honest discriminant for every metric (scored AND not). PER-LENS thinness
 *  (building_history / insufficient_peers) lives on lens.l*.reason, NOT here — a
 *  scored metric with an empty trend lens still reads metricState="scored". */
export type MetricState =
  | "scored"
  | "no_bar"
  | "data_unavailable"
  | "normalized_out"
  | "insufficient_peers"
  | "building_history";

export type L1State = "above_bar" | "below_bar" | "not_evaluable";
export type L2State = "above_peer" | "near_peer" | "below_peer" | "not_evaluable";
export type L3State = "improving" | "flat" | "declining" | "not_evaluable";

/** One lens read. referenceValue: bar (L1), peer μ (L2), own-history μ (L3).
 *  evaluable=false ⇒ state is not_evaluable; reason explains why (building_history…). */
export interface LensRead {
  state: L1State | L2State | L3State;
  evaluable: boolean;
  referenceValue: number | null;
  reason: string | null;
}

/** One L3 own-history series point (the per-metric sparkline). */
export interface L3SeriesPoint {
  periodKey: string;
  asOfDate: string;
  rawValue: number;
}

/** Standing band from absolute rank in the PG (rank/N only — no z-score). */
export type LensStandingBand = "top" | "upper" | "mid" | "lower" | "bottom";
/** Rank second-check context (read-layer; CONFIRMATION ONLY — never changes firing). */
export interface LensStandingContext {
  rank: number;
  n: number;
  band: LensStandingBand;
}

/** A fired metric-level lens pattern (LM1–LM8). tone drives colour (§0.2); a field-
 *  verdict (PG_WEAK/PG_STRONG) is CONTEXT, never styled good/bad. */
export interface MetricLensPattern {
  id: string;
  label: string;
  tone: string;
  fieldVerdict: "PG_WEAK" | "PG_STRONG" | null;
  role: "top_level" | "supporting_detail";
  /** S3.5 rank second-check; null when no PG standing. */
  standingContext?: LensStandingContext | null;
  /** Standing-reconciled verdict sentence, composed backend-side; render verbatim. */
  verdict?: string;
}

/** A fired pillar-level lens pattern (LP1–LP6). */
export interface PillarLensPattern {
  id: string;
  label: string;
  tone: string;
  fieldVerdict: "PG_WEAK" | "PG_STRONG" | null;
  role: "top_level" | "supporting_detail";
  /** S3.5 rank second-check; null when no PG standing. */
  standingContext?: LensStandingContext | null;
  /** Standing-reconciled verdict sentence, composed backend-side; render verbatim. */
  verdict?: string;
}

/** The 5 band cuts + the active band + direction (the modal §2.1 ladder). */
export interface BandLadder {
  direction: BarDirection;
  excellent: number;
  good: number;
  acceptable: number;
  concerning: number;
  distress: number;
  activeBand: MetricBand | null;
}

/** Pillar-level pass-shares (denominator = per-lens-evaluable scored metrics only). */
export interface PillarLensShares {
  l1Pass: number | null;
  l2Pass: number | null;
  l3Improving: number | null;
  l3Declining: number | null;
  nL1: number;
  nL2: number;
  nL3: number;
}

/** One PG member's value for a metric in the peer cross-section (modal §2.3). */
export interface PeerDistributionMember {
  symbol: string;
  value: number;
  isSelf: boolean;
}

/** The metric's full peer cross-section + this stock's direction-aware rank.
 *  `usable` mirrors PeerStats.usable (≥5 peers AND σ>0) — when false, show the spread
 *  but NOT a field-verdict. null for an honest-empty row. */
export interface PeerDistribution {
  mean: number;
  selfValue: number;
  rank: number; // 1 = healthiest
  outOf: number;
  usable: boolean;
  members: PeerDistributionMember[];
}

/** Where the metric's bars came from + when last recalibrated (modal §2.1). */
export interface BarProvenance {
  barPath: string;
  recalibratedAt: string; // YYYY-MM-DD
  inheritedFromPeerGroupId: string | null;
}

export interface MetricView {
  metricKey: string;
  /** null only for an honest-empty (non-scored) metric row. */
  rawValue: number | null;
  l1Score: number | null;
  l2Score: number | null;
  l3Score: number | null;
  /** null when not scored. */
  metricScore: number | null;
  l1Band: MetricBand | null;
  scoreState: MetricScoreState;
  nominalWeight: number;
  effectiveWeight: number;
  contribution: number;
  suppressionReason: string | null;
  bars: MetricBars | null;
  peer: PeerStats | null;

  // ── S2/S3 three-lens fields ──
  metricState: MetricState;
  l2Available: boolean;
  l3Available: boolean;
  l3WindowN: number | null;
  lensFallbackApplied: string;
  /** The three lens reads (l3 includes its sparkline series). null when not scored. */
  lens: {
    l1: LensRead;
    l2: LensRead;
    l3: LensRead & { series: L3SeriesPoint[] };
  } | null;
  /** Fired LM pattern + role; null for no-tension / honest-empty cells. */
  lensPattern: MetricLensPattern | null;
  /** 5 cuts + active band; null when no bar set (metricState=no_bar). */
  bandLadder: BandLadder | null;
  /** Peer cross-section for the modal §2.3; null for an honest-empty row. */
  peerDistribution: PeerDistribution | null;
  /** Bar provenance for the modal §2.1; null when no bar set. */
  barProvenance: BarProvenance | null;
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

  // ── S2/S3 pillar-level lens contract (Foundation + Momentum only; null otherwise) ──
  /** Fired LP patterns (LP1–LP6) + role; empty array when none fire. */
  lensPillarPatterns: PillarLensPattern[] | null;
  /** Per-lens pass-shares used to derive the LP patterns. */
  lensShares: PillarLensShares | null;
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
  /** File 1 §5E display state: active | pending_data_integration | dampened. */
  displayState: "active" | "pending_data_integration" | "dampened";
  /** Effective §5E score impact; a dampened pattern carries the HALVED value. null for
   *  structural cards (B/C/D/F/G/H/I) which carry no §5E magnitude. */
  magnitude: number | null;
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
