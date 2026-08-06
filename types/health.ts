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
  /** Raw Stock.id (UUID). The key every per-stock mutation takes — watchlist pin, alert rule,
   *  event reminder, relational card. Present on the not-scored path too. Reading it here is what
   *  replaced downloading GET /api/stocks/universe (22.1 KB gzip) to run a .find() for one field. */
  id: string;
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

/**
 * ★ RULING 3's THREE HEADLINE STATES — decided BACKEND-SIDE, rendered here. Never inferred.
 *
 *   aligned          spread ≤ 7 (S1's ceiling). The pillars agree — the study's measured control.
 *   no_pattern       spread past the ceiling but NOTHING matched: the 8–11 minor band, or a ≥12
 *                    spread on a pair no rule names.
 *   patterns_firing  one or more divergence findings are standing.
 *
 * ⚠ THE MIDDLE STATE IS WHY THIS TYPE EXISTS. Every surface ran `lead ? patterns : Aligned` — a
 * two-way branch over a three-way fact — so a stock with a wide spread and no live finding rendered
 * as "Aligned — no tension". GLENMARK carries a 49-point spread and reads `no_pattern`.
 */
export type DivergenceHeadline = "aligned" | "no_pattern" | "patterns_firing";

export interface PillarReading {
  pillar: PillarKey;
  subtotal: number;
}

/** The pair a FIRED finding names, high/low resolved server-side from its record's `pillarPair`. */
export interface DivergencePair {
  patternKey: string;
  high: PillarReading;
  low: PillarReading;
  /** |high − low| for THIS pair, at difference precision (a whole number). */
  gap: number;
}

/**
 * ★ THE LIVE MARKET REGIME for this stock's SECTOR. Net-new on the wire.
 *
 * ⚠ `regime: null` IS A FIRST-CLASS ANSWER WITH NO NUMERIC FALLBACK — the window was too short, too
 * stale, or the stock is in no peer group. `reason` says which. Never substitute a phase.
 */
export interface RegimeBadgeView {
  regime: "HOT" | "NORMAL" | "STRESSED" | null;
  /** Signed FRACTION (0.2215 = +22.15%). Null iff regime is null. */
  trailing6mo: number | null;
  source: "index" | "pg_pool" | null;
  indexName: string | null;
  /** Trading date the reading is AS OF (YYYY-MM-DD). */
  asOf: string | null;
  reason: string | null;
}

export interface DivergenceView {
  headline: DivergenceHeadline;
  /** max − min across scored pillars — S1's own input, not "the divergence". Null under two pillars. */
  spread: number | null;
  /** S1's ceiling (7), from S1's record. Carried so no surface types the number. */
  alignedMax: number;
  /**
   * ★ THE LEAD FIRING FINDING'S OWN PAIR. Null when nothing is firing — absence, never a fallback to
   * the widest scored pair. That fallback was the IOC bug: IOC's widest pair is Foundation↔Market
   * while its finding (S2) is about Foundation↔Momentum, so the chart and the prose named different
   * pillars on one card.
   */
  pair: DivergencePair | null;
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

export interface DailyTrajectoryPoint {
  asOfDate: string;
  periodKey: string;
  composite: number;
  labelBand: LabelBand;
  foundation: number;
  momentum: number;
  market: number;
  ownership: number;
}

export interface ResultDayMarker {
  asOfDate: string;
  periodKey: string;
}

export interface TrajectorySection {
  windowQuarters: number;
  series: TrajectoryPoint[];
  /** Sub-quarterly series (one point per calendar day, trailing ~60D). Powers 60D/30D/15D. */
  dailySeries: DailyTrajectoryPoint[];
  /** Result-landing days inside the daily window (periodKey transitions). */
  resultDays: ResultDayMarker[];
  crossings: CrossingEvent[];
  events: CorporateEventView[];
}

export interface RedFlagView {
  flagKey: string;
  severity: string | null;
  tier: "auto" | "review";
  triggeringValues: unknown | null;
  guardrailEventId: string | null;
  /** The File-1 §5 verdict sentence, rendered SERVER-SIDE against this firing's evidence
   *  (Stage 3). OPTIONAL on purpose: a backend older than Stage 3, or a cached payload, has no
   *  such field, and the bundled renderVerdict must still produce the same sentence. */
  verdict?: string;
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
  /** Server-rendered verdict sentence — see RedFlagView.verdict. Optional for the same reason. */
  verdict?: string;
  /** How long this has been true and which way it is moving. Optional: surfaces that do not resolve
   *  lifecycles (the watchlist list view) send `null`, and older payloads omit the key entirely. */
  lifecycle?: FindingLifecycle | null;
  /** The same verdict, decomposed. ⚠ The `boundary` clause is PRESENT here and ABSENT from `verdict` —
   *  every card already renders `doesntMean` in its own slot, and joining it would print it twice. */
  clauses?: VerdictClause[] | null;
  /**
   * ★ THE PATTERN'S OWN RECORD FACTS. `pillarPair` is the pair the chart, chips, readout and summary
   * must draw — replacing `pickScoredPair`, which chose the widest pair independently of the finding.
   * Null for a finding with no record (a red flag, an ownership event): those have no pillar pair,
   * and inventing one is the defect this field ends.
   *
   * ⚠ DISPLAY GEOMETRY ONLY. Every threshold (gapFloor, movementFloor, evidencedTier, legs,
   * regimeMap, evidenceStats) is a scoring bar and is stripped before serving.
   */
  facts?: ServedPatternFacts | null;
  /** §1.2 tier word — `material` / `stretched` / `extreme`. Null for crossings and movements, which
   *  have no severity gradient. Order cards by this, then severity. */
  tier?: string | null;
  /**
   * ★ FORMED or BUILDING — the pattern state.
   *
   * A threshold grades intensity; it does not gate existence. `building` means the shape holds but at
   * least one leg has not crossed its evidenced threshold, so the card carries NO claim, NO study
   * figure and NO regime clause. Render it as visibly a DIFFERENT STATE, never as a weaker version of
   * the same card — same pattern name, evidently not the same thing. Null for patterns that declare
   * no state (D5–D7, S2, T1–T9 — crossings and measured discriminants with no "almost").
   */
  state?: "formed" | "building" | null;
  /** This finding's own pair, high/low resolved. Null for composite (T1–T4) and single-pillar
   *  (T5–T9) patterns, which genuinely name no pair. */
  pair?: DivergencePair | null;
}

/** The three record facts that are safe to serve — mirrors ServedPatternFacts backend-side. */
export interface ServedPatternFacts {
  /** The subject(s) the pattern is ABOUT: two real pillars, one pillar, or `["composite"]`. */
  pillarPair: readonly ("foundation" | "momentum" | "market" | "ownership" | "composite")[];
  basis: "gap" | "movement" | "crossing" | "level";
  /** THE only precision this pattern's readings are ever formatted at, on any surface. */
  displayPrecision: number;
}

export interface FindingsSection {
  redFlags: RedFlagView[];
  patterns: PatternView[];
  /** Findings that have CLOSED, in their own array so one can never render as current.
   *  `null` ⇔ this surface did not resolve lifecycles — which is not the same claim as `[]`. */
  recentlyEnded?: EndedFindingView[] | null;
  /**
   * ★ NOT-COVERED NOTES — configurations both specs tested and deliberately did NOT ship.
   *
   * ⚠ THEIR OWN ARRAY, AND THEY MUST STAY THERE. A note is the record of a decision NOT to make a
   * claim — no severity, no lifecycle, no gap size, no ordering. Merging them into `patterns` would
   * rebuild the generic-spread pattern both specs killed: the moment a 41-point version reads louder
   * than a 15-point one, we are ranking configurations we explicitly refused to rank.
   */
  notCovered?: NotCoveredNote[];
  /**
   * ★ THE THIRD SILENT STATE. A scored stock can be quiet because nothing tested reliably here
   * (`notCovered` has a note) or because truly nothing had anything to say (`patterns` AND
   * `notCovered` both empty). This is the registry-level line for the second case only — `null`
   * whenever there is a pattern firing or a not-covered note already saying something.
   */
  quietNote?: string | null;
  /** A two-line digest of what the OTHER tool is showing. Never enough to render a second card. */
  crossTool?: CrossToolSummary[];
}

// ── finding lifecycle (mirrors Vytal-Backend/src/scoring/read/finding-lifecycle.service.ts) ─────────

export type LifecycleState = "firing" | "ended";
export type LifecycleDirection = "widening" | "narrowing" | "steady";
/** What the quantity is doing. Never a claim about an outcome — only about a number's path. */
export type MovementPhase = "building" | "widening" | "narrowing" | "sticky" | "closed";
export type LifecycleValueBasis = "gap" | "delta" | "distance_from_mark";
export type LifecycleClock = "head_per_period" | "all_versions_in_current_period";

/** The pattern's own quantity at one period head, recomputed from stored pillar subtotals.
 *  ⚠ Arithmetic over stored values — NOT a replay of whether the pattern would have fired. */
export interface ValuePoint {
  periodKey: string;
  value: number | null;
  pastFloor: boolean | null;
}

/** One version inside the current quarter — populated only for Market-clock patterns, whose gap can
 *  open and close entirely within one period. */
export interface IntraPeriodPoint {
  version: number;
  asOfDate: string;
  firing: boolean;
  value: number | null;
}

export interface EndedResolution {
  type: "converged" | "collapsed";
  laggardMovePp: number;
  leaderMovePp: number;
  gapThen: number;
  gapNow: number;
  laggardShare: number | null;
  /** Did the gap close back into the aligned band, or did the pattern merely stop firing?
   *  A separate question from `type` — both are needed to say "this converged". */
  resolved: boolean;
  leadPillar: PillarKey;
  lagPillar: PillarKey;
}

export interface FindingLifecycle {
  patternKey: string;
  state: LifecycleState;
  firstSeen: string;
  lastSeen: string;
  /** Consecutive periods with a ROW. ⚠ Not the same question as `periodsPastFloor`. */
  runLength: number;
  valueThen: number | null;
  valueNow: number | null;
  valueBasis: LifecycleValueBasis | null;
  /** The quantity at every period head — what makes "31 now, 14 last quarter" sayable. */
  valueSeries: ValuePoint[];
  /** Consecutive recent periods the QUANTITY has been past its floor. Can legitimately differ from
   *  `runLength`: the row history and the value history answer different questions. */
  periodsPastFloor: number;
  floor: number | null;
  direction: LifecycleDirection | null;
  directionDeadband: number;
  movementPhase: MovementPhase | null;
  resolution: EndedResolution | null;
  endedPeriodsAgo: number;
  clock: LifecycleClock;
  intraPeriod: IntraPeriodPoint[] | null;
}

// ── verdict clauses (mirrors Vytal-Backend/src/scoring/findings/verdicts.ts) ────────────────────────

export type ClauseType = "observation" | "band_context" | "movement" | "size" | "phase" | "boundary";

export interface VerdictClause {
  type: ClauseType;
  text: string;
}

/**
 * A configuration that was TESTED AND NOT SHIPPED.
 *
 * ⚠ CARRIES NO MEASURED FIGURE AND NO DIRECTION WORD IN COPY, BY RULE. Every one of these has a
 * number attached to it in the spec and every one of those numbers (and their sign, in words) reads
 * backwards — "Foundation crossing down through 72" measured strongly POSITIVE, which is exactly why
 * it is excluded. The figure is the reason for the exclusion, not a fact to show. A backend gate
 * fails the build if either appears in `text`.
 *
 * ⚠ `pair` and `lifecycle` are DATA, not copy — chart-parity fields added so the same chart/readout a
 * real finding uses can draw a not-covered configuration identically. Neither is ever stated in
 * `text`. There is deliberately no `severity` field anywhere on this type — not even null.
 */
export interface NotCoveredNote {
  id: string;
  reason:
    | "evidence_conflicted"
    | "superseded_by_D6"
    | "superseded_by_T7"
    | "bull_masked"
    | "regime_driven"
    | "indistinguishable"
    | "outlier_driven";
  /** The pillars involved and their values. No gap, no magnitude, no ordering. */
  readings: { subject: string; value: number }[];
  /** The two-pillar spread a chart would draw, when the record names two real pillars (NC1/NC2 only).
   *  Null for every composite or single-pillar record. */
  pair: { high: PillarReading; low: PillarReading; gap: number } | null;
  /** Continuity, read off the SAME resolver a real finding uses. Null until a second period exists
   *  for this configuration to walk. */
  lifecycle: FindingLifecycle | null;
  text: string;
  evidenceBasis: "tested_not_shipped";
}

/** A compact digest of the other tool's findings — a summary line and a link, nothing more. */
export interface CrossToolSummary {
  tool: "divergence" | "trajectory";
  count: number;
  names: string[];
  /** The most severe one's OWN observation clause, verbatim — not a new sentence. */
  leadFact: string | null;
  leadPatternKey: string | null;
}

/** An ended finding — its own card: what it was, how long it stood, that it closed, and how.
 *  ⚠ Carries no `size` or `phase` clause, ever: both qualify a claim about a condition that holds. */
export interface EndedFindingView {
  patternKey: string;
  name: string;
  lifecycle: FindingLifecycle;
  clauses: VerdictClause[];
  text: string;
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
  /** ★ The live sector regime — see RegimeBadgeView. Null on the not-scored path. */
  regime?: RegimeBadgeView | null;
  peerStanding: PeerStandingSection | null;
}
