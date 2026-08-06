// Health Hub — pure derivations over UniverseHealthView. No JSX. Every value
// here is computed from real fields the API returns; nothing is invented. Token
// primitives (BAND_META, PILLAR_META, SectionEyebrow, Panel, PillarGauge) are
// reused from the stock-health shared.tsx — these are the Hub-specific reads.

import { healthLabel } from "@/lib/format";
import { findingName } from "@/lib/findings/descriptions";
import type { LabelBand, PillarKey } from "@/types/health";
import type {
  UniverseHealthView,
  UniverseAggregate,
  UniverseMemberView,
  UniverseSinceLastWeek,
} from "@/types/universe-view";
import type {
  BandDistribution,
  ScopeDispersion,
  PathologyCensusItem,
  PathologyReach,
} from "@/types/peer-group";

// Composite condition-scale cut points — mirror lib/format.healthBand exactly.
export const BAND_CUTS: { v: number; band: LabelBand }[] = [
  { v: 55, band: "below_par" },
  { v: 62, band: "steady" },
  { v: 68, band: "healthy" },
  { v: 74, band: "pristine" },
];

export function compositeBand(score: number): LabelBand {
  if (score >= 74) return "pristine";
  if (score >= 68) return "healthy";
  if (score >= 62) return "steady";
  if (score >= 55) return "below_par";
  return "fragile";
}

/** A pillar subtotal of exactly 0 is the engine's inert value for an unavailable /
 *  redistributed pillar — never treat it as a real low score. */
export const isRedistributed = (v: number) => v === 0;

export const PILLAR_ORDER: PillarKey[] = ["foundation", "momentum", "market", "ownership"];

// ── best / worst real pillar (guarding redistributed 0) ───────────────────────
export function bestWorstPillar(pillars: Record<PillarKey, number>): {
  best: { key: PillarKey; v: number };
  worst: { key: PillarKey; v: number };
} {
  const real = PILLAR_ORDER.map((key) => ({ key, v: pillars[key] })).filter(
    (p) => !isRedistributed(p.v),
  );
  const pool = real.length ? real : PILLAR_ORDER.map((key) => ({ key, v: pillars[key] }));
  const sorted = [...pool].sort((a, b) => b.v - a.v);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

// ── member-level verdict sentence (templated from the real band) ──────────────
export function memberVerdict(m: UniverseMemberView): string {
  const band = compositeBand(m.composite);
  const { best, worst } = bestWorstPillar(m.pillars);
  const bestL = PILLAR_LABEL[best.key];
  const worstL = PILLAR_LABEL[worst.key];
  if (band === "pristine" || band === "healthy")
    return `${m.name} sits in healthy condition — ${bestL} leads (${Math.round(best.v)}), with no pillar dragging the composite.`;
  if (band === "steady")
    return `${m.name} is fundamentally sound but uneven — ${worstL} (${Math.round(worst.v)}) is holding the composite below the upper bands.`;
  if (band === "below_par")
    return `${m.name} is below par — ${worstL} (${Math.round(worst.v)}) is the soft spot. Demand a specific reason before owning it.`;
  return `${m.name} is fragile across the board — ${worstL} (${Math.round(worst.v)}) is failing. A clear, named thesis is the minimum bar here.`;
}

export const PILLAR_LABEL: Record<PillarKey, string> = {
  foundation: "Foundation",
  momentum: "Momentum",
  market: "Market",
  ownership: "Ownership",
};

// ── KPI rail ──────────────────────────────────────────────────────────────────
export interface HubKpis {
  median: number;
  medianBand: LabelBand;
  drift: number | null;
  priorPeriodKey: string | null;
  eased: number; // deteriorating QoQ
  firmed: number; // improving QoQ
  stable: number;
  redFlags: number;
  recovering: RecoveryMover[];
  /** ★ Members with a divergence pattern firing (Ruling 3's `patterns_firing`) — was a "wide"/
   *  "notable" split banded off the retired widest-pair gap at 15/25. The member-list payload
   *  carries only the three-state headline, not a per-finding tier, so the split is gone with it. */
  patternsFiring: number;
  trajectoryWord: string;
}

export function computeKpis(view: UniverseHealthView): HubKpis {
  const agg = view.aggregate!;
  const members = view.members;
  let eased = 0,
    firmed = 0,
    stable = 0;
  for (const m of members) {
    if (m.trajectoryMarker === "deteriorating") eased++;
    else if (m.trajectoryMarker === "improving") firmed++;
    else if (m.trajectoryMarker === "stable") stable++;
  }
  const patternsFiring = members.filter((m) => m.divergence.headline === "patterns_firing").length;
  const drift = agg.medianDrift;
  const trajectoryWord =
    drift == null
      ? "Mixed"
      : drift <= -2
        ? "Softening"
        : drift >= 2
          ? "Firming"
          : "Holding";
  return {
    median: agg.medianComposite,
    medianBand: compositeBand(agg.medianComposite),
    drift,
    priorPeriodKey: agg.priorPeriodKey,
    eased,
    firmed,
    stable,
    redFlags: agg.redFlagMemberCount,
    recovering: recoveryMovers(view),
    patternsFiring,
    trajectoryWord,
  };
}

// ── recovery: risers off a weak base (priorComposite < Steady line) ───────────
export interface RecoveryMover {
  symbol: string;
  prior: number;
  current: number;
  delta: number;
  fromBand: LabelBand;
  toBand: LabelBand;
  crossedUp: boolean;
}

export function recoveryMovers(view: UniverseHealthView): RecoveryMover[] {
  return view.movers.risers
    .filter((r) => r.priorComposite < 62)
    .map((r) => {
      const fromBand = compositeBand(r.priorComposite);
      const toBand = compositeBand(r.composite);
      return {
        symbol: r.symbol,
        prior: r.priorComposite,
        current: r.composite,
        delta: r.delta,
        fromBand,
        toBand,
        crossedUp: toBand !== fromBand,
      };
    })
    .sort((a, b) => b.delta - a.delta);
}

// ── pillar mix (universe medians) + soft spot ─────────────────────────────────
export interface PillarMixRow {
  key: PillarKey;
  value: number;
  isSoft: boolean;
}
export function pillarMix(agg: UniverseAggregate): {
  rows: PillarMixRow[];
  soft: PillarKey;
} {
  const entries = PILLAR_ORDER.map((key) => ({ key, value: agg.pillarMedians[key] }));
  const soft = [...entries].sort((a, b) => a.value - b.value)[0].key;
  return {
    rows: entries.map((e) => ({ ...e, isSoft: e.key === soft })),
    soft,
  };
}

// ── sector exposure (counts + median health → heat) ───────────────────────────
export type SectorHeat = "hot" | "warm" | "calm";
export interface SectorExposure {
  key: string;
  displayName: string;
  count: number;
  median: number;
  heat: SectorHeat;
}

function heatOf(median: number): SectorHeat {
  if (median < 60) return "hot";
  if (median < 66) return "warm";
  return "calm";
}

export function sectorExposure(members: UniverseMemberView[]): SectorExposure[] {
  const map = new Map<string, { displayName: string; comps: number[] }>();
  for (const m of members) {
    const key = m.sector?.key ?? "unlinked";
    const displayName = m.sector?.displayName ?? "Unlinked";
    const e = map.get(key) ?? { displayName, comps: [] };
    e.comps.push(m.composite);
    map.set(key, e);
  }
  const out: SectorExposure[] = [];
  for (const [key, e] of map) {
    const sorted = [...e.comps].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    out.push({ key, displayName: e.displayName, count: e.comps.length, median, heat: heatOf(median) });
  }
  return out.sort((a, b) => b.count - a.count || a.median - b.median);
}

// ── threshold watch — names sitting on a band line ────────────────────────────
export interface EdgeName {
  symbol: string;
  composite: number;
  line: number;
  lineBand: LabelBand; // the band the line opens into (upper side)
  distance: number;
  side: "above" | "below";
}

export function edgeNames(members: UniverseMemberView[], limit = 4): EdgeName[] {
  const rows = members.map((m) => {
    let nearest = BAND_CUTS[0];
    let best = Infinity;
    for (const c of BAND_CUTS) {
      const d = Math.abs(m.composite - c.v);
      if (d < best) {
        best = d;
        nearest = c;
      }
    }
    return {
      symbol: m.symbol,
      composite: m.composite,
      line: nearest.v,
      lineBand: nearest.band,
      distance: best,
      side: (m.composite >= nearest.v ? "above" : "below") as "above" | "below",
    };
  });
  // Diversify across distinct band lines so the four cards aren't all one boundary.
  rows.sort((a, b) => a.distance - b.distance);
  const picked: EdgeName[] = [];
  const usedLines = new Set<number>();
  for (const r of rows) {
    if (usedLines.has(r.line)) continue;
    picked.push(r);
    usedLines.add(r.line);
    if (picked.length >= limit) break;
  }
  // Top up with the next-closest regardless of line if we ran short.
  if (picked.length < limit) {
    for (const r of rows) {
      if (picked.includes(r)) continue;
      picked.push(r);
      if (picked.length >= limit) break;
    }
  }
  return picked;
}

// ── the quarter's attention reads (honest, real counts) ───────────────────────
export interface AttentionReads {
  redFlag: { count: number; names: string[] };
  slippingFromHigh: { count: number; names: string[] }; // deteriorating & still healthy/pristine
  wideDivergence: { count: number; names: string[] };
  recovering: { count: number; names: string[] };
  crossedBand: { count: number; up: number; down: number };
}

export function attentionReads(view: UniverseHealthView): AttentionReads {
  const members = view.members;
  const flagged = members.filter((m) => m.firedFlags.length > 0);
  const slipping = members
    .filter((m) => m.trajectoryMarker === "deteriorating" && m.composite >= 68)
    .sort((a, b) => (a.trajectoryDelta ?? 0) - (b.trajectoryDelta ?? 0));
  // ★ Ranked by SPREAD, not by a re-banded severity — spread is the honest quantity the payload
  //   carries at this level (S1's own max−min), and ranking by it is not a claim about which
  //   pattern is more severe. Members with no spread (fewer than two scored pillars) sort last
  //   rather than crashing the comparator on `null`.
  const wide = members
    .filter((m) => m.divergence.headline === "patterns_firing")
    .sort((a, b) => (b.divergence.spread ?? -1) - (a.divergence.spread ?? -1));
  const rec = recoveryMovers(view);
  const week = view.sinceLastWeek;
  const up = week.bandCrossings.filter((c) => c.direction === "up").length;
  const down = week.bandCrossings.filter((c) => c.direction === "down").length;
  return {
    redFlag: { count: flagged.length, names: flagged.map((m) => m.symbol) },
    slippingFromHigh: { count: slipping.length, names: slipping.slice(0, 6).map((m) => m.symbol) },
    wideDivergence: { count: wide.length, names: wide.slice(0, 6).map((m) => m.symbol) },
    recovering: { count: rec.length, names: rec.map((m) => m.symbol) },
    crossedBand: { count: week.bandCrossings.length, up, down },
  };
}

// ── honest week read — sinceLastWeek is intra-quarter, price-led churn ─────────
export interface WeekRead {
  versions: number;
  newFlags: number;
  recoveries: number;
  deteriorations: number;
  crossings: number;
  anchorDate: string;
  /** True when the week's churn is dominated by re-versioning (the rescore landing),
   *  not fresh fundamental movement — the calm-state trigger. */
  rescoreDominated: boolean;
}

export function weekRead(view: UniverseHealthView): WeekRead {
  const w = view.sinceLastWeek;
  const total = view.scoredUniverseSize || 1;
  return {
    versions: w.newVersionCount,
    newFlags: w.newFlags.length,
    recoveries: w.newRecoveries.length,
    deteriorations: w.newDeteriorations.length,
    crossings: w.bandCrossings.length,
    anchorDate: w.anchorDate,
    rescoreDominated: w.newVersionCount / total >= 0.5,
  };
}

// ── universe character read (templated from real numbers) ─────────────────────
export function universeCharacter(view: UniverseHealthView): string {
  const agg = view.aggregate!;
  const bd = agg.bandDistribution;
  const leaders = bd.healthy + bd.pristine;
  const weak = bd.fragile + bd.below_par;
  const driftWord =
    agg.medianDrift == null
      ? ""
      : agg.medianDrift <= -2
        ? ` The quarter softened — median off ${Math.round(Math.abs(agg.medianDrift))} from ${agg.priorPeriodKey}.`
        : agg.medianDrift >= 2
          ? ` The quarter firmed — median up ${Math.round(agg.medianDrift)} from ${agg.priorPeriodKey}.`
          : ` The median barely moved from ${agg.priorPeriodKey}.`;
  return `The middle is crowded, as always — ${bd.steady} sit Steady around a ${healthLabel(agg.medianComposite).toLowerCase()} median of ${Math.round(agg.medianComposite)}. ${leaders} hold healthy ground, ${weak} sit below par; the edges are where to look.${driftWord}`;
}

// ── short helpers ──────────────────────────────────────────────────────────────
/** Resolve spec display name for a flag/pattern key via the canonical map. */
export function flagLabel(key: string): string {
  return findingName(key);
}

// ════════════════════════════════════════════════════════════════════════════════
// SCOPE FILTERING — restrict the universe view to a set of symbols (My Portfolio /
// Watchlist) and recompute EVERY aggregate the three tabs read, so the subset is
// internally consistent. We never show the universe's numbers over a filtered list.
//
// Prior composites are reconstructed per member from `trajectoryDelta`
// (prior = composite − delta), which lets drift / movers / recovery stay faithful to
// the subset rather than only reflecting whichever names happened to be universe-top
// movers. Symbols not present in the scored universe simply don't match — so a held
// fund / bond (never a scored stock) is correctly absent, no special-casing needed.
// ════════════════════════════════════════════════════════════════════════════════

function medianOf(sortedAsc: number[]): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 ? sortedAsc[mid] : (sortedAsc[mid - 1] + sortedAsc[mid]) / 2;
}

/** Linear-interpolated quantile over an ascending array (0 ≤ q ≤ 1). */
function quantileOf(sortedAsc: number[], q: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sortedAsc[lo] : sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (pos - lo);
}

function dispersionOf(sortedAsc: number[], mean: number): ScopeDispersion {
  const n = sortedAsc.length;
  if (n === 0) return { stdDev: 0, iqr: 0, p25: 0, p75: 0 };
  const variance = sortedAsc.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const p25 = quantileOf(sortedAsc, 0.25);
  const p75 = quantileOf(sortedAsc, 0.75);
  return { stdDev: Math.sqrt(variance), iqr: p75 - p25, p25, p75 };
}

// Mirrors lib/findings reachOf — kept in sync so a filtered census reads its reach the
// same way the census builder would (isolated ≤1 · widespread ≥50% · else cluster).
function reachOf(n: number, m: number): PathologyReach {
  if (n <= 1) return "isolated";
  if (m > 0 && n / m >= 0.5) return "widespread";
  return "cluster";
}

/** Filter a pathology / lens census to the scope: each item keeps only its in-scope
 *  members, with counts + reach recomputed against the scope size; empty items drop. */
function scopeCensus(items: PathologyCensusItem[], symbols: Set<string>, size: number): PathologyCensusItem[] {
  return items
    .map((it) => {
      const members = it.members.filter((s) => symbols.has(s));
      return { ...it, members, memberCount: members.length, outOf: size, reach: reachOf(members.length, size) };
    })
    .filter((it) => it.members.length > 0);
}

/** Filter the 7-day churn block by symbol. `newVersionCount` has no per-symbol list, so
 *  it's reset to an honest LOWER BOUND — the distinct in-scope names we can SEE changed
 *  this week (a crossing / flag / deterioration / recovery). Never over-counts. */
function scopeWeek(w: UniverseSinceLastWeek, symbols: Set<string>): UniverseSinceLastWeek {
  const bandCrossings = w.bandCrossings.filter((c) => symbols.has(c.symbol));
  const newFlags = w.newFlags.filter((f) => symbols.has(f.symbol));
  const newDeteriorations = w.newDeteriorations.filter((d) => symbols.has(d.symbol));
  const newRecoveries = w.newRecoveries.filter((r) => symbols.has(r.symbol));
  const changed = new Set<string>();
  for (const c of bandCrossings) changed.add(c.symbol);
  for (const f of newFlags) changed.add(f.symbol);
  for (const d of newDeteriorations) changed.add(d.symbol);
  for (const r of newRecoveries) changed.add(r.symbol);
  return { ...w, bandCrossings, newFlags, newDeteriorations, newRecoveries, newVersionCount: changed.size };
}

export function scopeUniverseView(view: UniverseHealthView, symbols: Set<string>): UniverseHealthView {
  const members = view.members.filter((m) => symbols.has(m.symbol));
  const size = members.length;

  // Empty scope (or the universe itself unscored) → honest empty shell; the Hub renders a
  // dedicated empty state rather than any tab (which all require a non-null aggregate).
  if (size === 0 || !view.aggregate) {
    return {
      ...view,
      members,
      scoredUniverseSize: size,
      aggregate: null,
      movers: { risers: [], slippers: [] },
      pathology: [],
      lensPathology: [],
      notAtCurrentPeriod: view.notAtCurrentPeriod.filter((x) => symbols.has(x.symbol)),
      sinceLastWeek: scopeWeek(view.sinceLastWeek, symbols),
    };
  }

  const compositesAsc = members.map((m) => m.composite).sort((a, b) => a - b);
  const medianComposite = medianOf(compositesAsc);
  const meanComposite = compositesAsc.reduce((s, v) => s + v, 0) / size;

  const bandDistribution: BandDistribution = { fragile: 0, below_par: 0, steady: 0, healthy: 0, pristine: 0 };
  for (const m of members) bandDistribution[m.labelBand]++;

  // pillar medians — exclude the engine's inert `0` (redistributed / unavailable pillar).
  const pillarMedians = {} as Record<PillarKey, number>;
  for (const key of PILLAR_ORDER) {
    const vals = members
      .map((m) => m.pillars[key])
      .filter((v) => !isRedistributed(v))
      .sort((a, b) => a - b);
    pillarMedians[key] = vals.length ? medianOf(vals) : 0;
  }

  const redFlagMemberCount = members.filter((m) => m.firedFlags.length > 0).length;

  // prior composites reconstructed from trajectoryDelta (prior = composite − delta), so the
  // subset's drift is measured against its OWN prior median, not the universe's.
  const priorsAsc = members
    .filter((m) => m.trajectoryDelta != null)
    .map((m) => m.composite - (m.trajectoryDelta as number))
    .sort((a, b) => a - b);
  const priorMedianComposite = priorsAsc.length ? medianOf(priorsAsc) : null;
  const medianDrift = priorMedianComposite != null ? medianComposite - priorMedianComposite : null;

  let lo = members[0];
  let hi = members[0];
  for (const m of members) {
    if (m.composite < lo.composite) lo = m;
    if (m.composite > hi.composite) hi = m;
  }

  const aggregate: UniverseAggregate = {
    scoredCount: size,
    medianComposite,
    meanComposite,
    priorMedianComposite,
    medianDrift,
    priorPeriodKey: view.aggregate.priorPeriodKey,
    dispersion: dispersionOf(compositesAsc, meanComposite),
    range: {
      min: { symbol: lo.symbol, composite: lo.composite },
      max: { symbol: hi.symbol, composite: hi.composite },
    },
    composites: compositesAsc,
    bandDistribution,
    pillarMedians,
    redFlagMemberCount,
    descriptor: view.aggregate.descriptor,
  };

  // movers — recomputed from the subset (not the universe's top-mover list, which may
  // contain none of these names). Each mover reconstructs its prior from trajectoryDelta.
  const moverRows = members
    .filter((m) => m.trajectoryDelta != null && m.trajectoryDelta !== 0)
    .map((m) => ({
      symbol: m.symbol,
      composite: m.composite,
      priorComposite: m.composite - (m.trajectoryDelta as number),
      delta: m.trajectoryDelta as number,
      fromPeriod: view.aggregate!.priorPeriodKey ?? "",
      toPeriod: view.periodKey ?? "",
    }));
  const risers = moverRows.filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta);
  const slippers = moverRows.filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta);

  return {
    ...view,
    members,
    scoredUniverseSize: size,
    aggregate,
    movers: { risers, slippers },
    pathology: scopeCensus(view.pathology, symbols, size),
    lensPathology: scopeCensus(view.lensPathology, symbols, size),
    notAtCurrentPeriod: view.notAtCurrentPeriod.filter((x) => symbols.has(x.symbol)),
    sinceLastWeek: scopeWeek(view.sinceLastWeek, symbols),
  };
}
