// Peer-group Health tab — shared helpers (pure, no JSX). Token primitives
// (SectionEyebrow, Panel, BAND_META, PILLAR_META, METRIC_BAND_META, PillarGauge)
// are reused from the stock health tab's shared.tsx — these are the PG-specific
// derivations on top of the contract.

import { healthLabel } from "@/lib/format";
import { humanizeKey } from "@/components/stock-detail/health/shared";
import type {
  PeerGroupAggregate,
  PeerGroupMemberView,
  PathologyReach,
} from "@/types/peer-group";
import type { LabelBand, SectorClass } from "@/types/health";

// Composite condition-scale cut points (mirror lib/format.healthBand).
export const BAND_CUTS = [55, 62, 68, 74] as const;

/** A pond's one-line character read — templated from real numbers, never invented. */
export function pondCharacterRead(a: PeerGroupAggregate, sectorClass: SectorClass): string {
  const median = Math.round(a.medianComposite);
  const label = healthLabel(a.medianComposite).toLowerCase();
  const rangeWidth = a.range ? Math.round(a.range.max.composite - a.range.min.composite) : 0;
  // descriptor is "<band>, <spread>" — reuse its spread word (tight/varied/dispersed).
  const spread = a.descriptor.split(",")[1]?.trim() ?? "varied";
  const bd = a.bandDistribution;
  const leaders = bd.healthy + bd.pristine;
  const weak = bd.fragile + bd.below_par;
  const sc = sectorClass ? `${sectorClass.toLowerCase()} ` : "";

  let shape: string;
  if (leaders > 0 && weak > 0) shape = "a quality top and a softer tail";
  else if (leaders > 0) shape = "a healthy core";
  else if (weak > 0) shape = "a weak skew";
  else shape = "a tight middle";

  const tail = [
    leaders ? `${leaders} on healthy ground` : null,
    weak ? `${weak} below par` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return `A ${spread}, ${sc}pond with ${shape} — median ${median} (${label}), spanning ${rangeWidth} points across ${a.scoredCount} names${tail ? `; ${tail}` : ""}.`;
}

// ── pathology labelling + interpretation ────────────────────────────────────────
const FLAG_LABELS: Record<string, string> = {
  ownership_R1_pledge: "Promoter pledge rising",
};

export function pathologyLabel(kind: "red_flag" | "pattern", key: string): string {
  if (kind === "red_flag" && FLAG_LABELS[key]) return FLAG_LABELS[key];
  return humanizeKey(key);
}

export function pathologyRead(reach: PathologyReach, n: number, of: number): string {
  if (reach === "isolated")
    return "Confined to one name — a single-stock concern, not a pond signal.";
  if (reach === "widespread")
    return `Group-wide (${n} of ${of}) — read it as sector-level pressure, not company-specific.`;
  return `A cluster across ${n} of ${of} — a shared theme worth watching.`;
}

// ── member classification → prospects / hazards ─────────────────────────────────
export type MemberTone = "rec" | "ctx" | "high" | "crit";
export const TONE_VAR: Record<MemberTone, string> = {
  rec: "var(--c-healthy)",
  ctx: "var(--c-pristine)",
  high: "var(--c-below)",
  crit: "var(--c-fragile)",
};

export interface Classified {
  m: PeerGroupMemberView;
  side: "prospect" | "hazard";
  tag: string;
  why: string;
  tone: MemberTone;
}

const LEAD_BANDS: LabelBand[] = ["healthy", "pristine"];

/** A pillar subtotal of exactly 0 is the engine's inert value for an
 *  unavailable/redistributed pillar — never treat it as a real low score. */
const isRedistributed = (v: number) => v === 0;

function flagNames(m: PeerGroupMemberView): string {
  return m.firedFlags.map((f) => pathologyLabel("red_flag", f.flagKey)).join(", ");
}

function classifyOne(m: PeerGroupMemberView): Classified | null {
  const flags = m.firedFlags.length;
  const hasCritical = m.firedFlags.some((f) => (f.severity ?? "").toLowerCase() === "critical");
  const delta = m.trajectoryDelta;

  // ── hazards first (loud signals win) ──
  if (m.labelBand === "fragile") {
    return {
      m,
      side: "hazard",
      tag: "Fragile",
      tone: "crit",
      why: `Fragile floor${flags ? ` with ${flagNames(m)} firing` : ""}.`,
    };
  }
  if (flags > 0) {
    return {
      m,
      side: "hazard",
      tag: "Flagged",
      tone: hasCritical ? "crit" : "high",
      why: `${flagNames(m)} firing.`,
    };
  }
  if (m.trajectoryMarker === "deteriorating" && (m.labelBand === "below_par" || m.labelBand === "steady")) {
    return {
      m,
      side: "hazard",
      tag: "Deteriorating",
      tone: "high",
      why: `Cooling — composite down ${Math.abs(delta ?? 0).toFixed(1)} this period.`,
    };
  }

  // ── prospects ──
  if (LEAD_BANDS.includes(m.labelBand)) {
    return {
      m,
      side: "prospect",
      tag: "Leader",
      tone: "rec",
      why: "Among the healthiest in the pond — no flags firing.",
    };
  }
  if (m.trajectoryMarker === "improving" && m.composite < 62) {
    return {
      m,
      side: "prospect",
      tag: "Recovering",
      tone: "rec",
      why: `Composite up ${(delta ?? 0).toFixed(1)} — climbing off a weak base.`,
    };
  }
  // value configuration — strong fundamentals, lagging market read (market available)
  const f = m.pillars.foundation;
  const mk = m.pillars.market;
  if (!isRedistributed(mk) && f >= 62 && f - mk >= 15) {
    return {
      m,
      side: "prospect",
      tag: "Value config",
      tone: "ctx",
      why: `Fundamentals (${Math.round(f)}) sit ahead of the market read (${Math.round(mk)}) — a value configuration.`,
    };
  }
  return null; // mid, stable, unflagged — not featured either side
}

export function classifyMembers(members: PeerGroupMemberView[]): {
  prospects: Classified[];
  hazards: Classified[];
} {
  const classified = members.map(classifyOne).filter((c): c is Classified => c !== null);
  const prospects = classified
    .filter((c) => c.side === "prospect")
    .sort((a, b) => b.m.composite - a.m.composite);
  const hazards = classified
    .filter((c) => c.side === "hazard")
    .sort((a, b) => a.m.composite - b.m.composite);
  return { prospects, hazards };
}

// ── SVG scale helper ────────────────────────────────────────────────────────────
export function niceBounds(values: number[], padFrac = 0.12): { lo: number; hi: number } {
  if (values.length === 0) return { lo: 0, hi: 100 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const pad = span * padFrac || Math.abs(max) * 0.1 || 1;
  return { lo: min - pad, hi: max + pad };
}

export const round2 = (x: number) => Math.round(x * 100) / 100;
