// Health Hub — pure derivations over UniverseHealthView. No JSX. Every value
// here is computed from real fields the API returns; nothing is invented. Token
// primitives (BAND_META, PILLAR_META, SectionEyebrow, Panel, PillarGauge) are
// reused from the stock-health shared.tsx — these are the Hub-specific reads.

import { healthLabel } from "@/lib/format";
import { findingName } from "@/lib/finding-names";
import type { LabelBand, PillarKey } from "@/types/health";
import type {
  UniverseHealthView,
  UniverseAggregate,
  UniverseMemberView,
} from "@/types/universe-view";

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
  wideSpread: number; // members with divergence flag === "wide"
  notable: number;
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
  const wideSpread = members.filter((m) => m.divergence.flag === "wide").length;
  const notable = members.filter((m) => m.divergence.flag === "notable").length;
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
    wideSpread,
    notable,
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
  const wide = members
    .filter((m) => m.divergence.flag === "wide")
    .sort((a, b) => b.divergence.gap - a.divergence.gap);
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
