/**
 * Trajectory interpretation — turns the REAL scored fields (marker, delta,
 * band crossings, divergence) into the promoted read + chips + journey timeline.
 * Every clause is derived from a real field; nothing is fabricated. Recovery is
 * featured; deterioration is noted; alignment reads as calm.
 */

import { healthLabel } from "@/lib/format";
import {
  BAND_META,
  LABEL_BAND_ORDER,
  PILLAR_META,
  shortPeriod,
  humanizeKey,
} from "@/components/stock-detail/health/shared";
import type {
  VerdictSection,
  TrajectorySection,
  CrossingEvent,
  LabelBand,
  PillarKey,
  PatternView,
} from "@/types/health";
import type { ChipSpec, PromotedRead } from "../tool-frame.types";
import { findingName, findingDescription, doesntMean } from "@/lib/findings/descriptions";
import { toneOf, stampedRegime } from "@/lib/findings/tool-findings";

/** The chart's plotted lines — composite + the four pillars. */
export const TRAJECTORY_LINES: {
  key: "composite" | PillarKey;
  label: string;
  color: string;
  width: number;
  togglable: boolean;
}[] = [
  { key: "composite", label: "Composite", color: "var(--ink)", width: 3, togglable: false },
  { key: "foundation", label: "Foundation", color: PILLAR_META.foundation.cssVar, width: 2, togglable: true },
  { key: "momentum", label: "Momentum", color: PILLAR_META.momentum.cssVar, width: 2, togglable: true },
  { key: "market", label: "Market", color: PILLAR_META.market.cssVar, width: 2, togglable: true },
  { key: "ownership", label: "Ownership", color: PILLAR_META.ownership.cssVar, width: 2, togglable: true },
];

export const MARKER_TONE: Record<
  NonNullable<VerdictSection["trajectoryMarker"]>,
  { word: string; color: string }
> = {
  improving: { word: "Recovering", color: "var(--rec)" },
  deteriorating: { word: "Deteriorating", color: "var(--high)" },
  stable: { word: "Stable", color: "var(--ink3)" },
};

const bandIndex = (b: LabelBand) => LABEL_BAND_ORDER.indexOf(b);

/** The most recent band crossing (the last regime change), if any. */
function lastBandCrossing(crossings: CrossingEvent[]): CrossingEvent | null {
  const bands = crossings.filter((c) => c.type === "band");
  return bands.length ? bands[bands.length - 1] : null;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE READ — RENDERED FROM THE FIRED T-FAMILY FINDINGS.
//
// ── ★ WHAT WAS REMOVED ────────────────────────────────────────────────────────────────────────────
// 1. isPriceAhead() — a DIVERGENCE predicate (Market leads, fundamentals lag), independently
//    derived here, on the TRAJECTORY tool. Two violations at once: it was a seventh derivation of
//    a two-pillar reading, and both specs state that two-pillar readings are "deliberately absent"
//    from this tool. The separation is now structural — findingsForTool() partitions by FAMILY, so
//    a C-family finding cannot reach this file at all.
// 2. The marker-driven verdict bank (improving / deteriorating / stable).  is a
//    ±1.0-composite-point classifier — not a T pattern, and not something the study measured. It
//    survives ONLY as a chip; it no longer authors an interpretation.
//
// ── ★ R1 — THIS TOOL MUST NOT PRESENT A BIGGER MOVE AS A BIGGER SIGNAL ───────────────────────
// Measured: a 1–3pt Foundation gain drifted +1.9% (64% positive); a 15+ point gain did nothing; a
// 15+ point Momentum gain reacted NEGATIVELY (−1.1%, 31% positive). So the read leads with the
// pattern, never with the size of the move, and the delta is demoted to a chip.
// ⚠ NOR IS IT INVERTED — the evidence supports not ranking by size, not "smaller is stronger".
// ⚠ THE DIVERGENCE TOOL IS DELIBERATELY THE OPPOSITE (severity IS the gap, spec §1.2). Do not
//   "harmonise" the two tools' sorting; one of the two measured findings would be inverted.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

export function buildTrajectoryRead(findings: PatternView[]): PromotedRead {
  const lead = findings[0];

  // §1.6 — silence is correct. ~79% of composites sit in the crowded 55–72 band where nothing
  // discriminates; a stock with no T pattern reads "stable, no material change", not an empty panel.
  if (!lead) {
    return {
      tone: "ctx",
      title: "Stable — no material change.",
      body:
        "Nothing in this stock's own path has moved enough to read this window. Most scores sit in the crowded middle of the scale, where the record has nothing to add — that quiet is what makes the loud readings credible.",
    };
  }

  const extra = findings.length - 1;
  return {
    tone: toneOf(lead),
    title: findingName(lead.patternKey),
    // Already evidence-bound AND regime-resolved by the backend verdict layer — including the
    // "no directional read in this phase" wording for T3 in NORMAL and T6 in HOT.
    body: lead.verdict ?? findingDescription(lead.patternKey) ?? "",
    note: extra > 0
      ? doesntMean(lead.patternKey) + " (+" + extra + " more trajectory reading" + (extra === 1 ? "" : "s") + " on this stock)"
      : doesntMean(lead.patternKey),
    // ⚠ NO `tag` HERE, DELIBERATELY. PromotedRead.tag exists for divergence's gap tier — a scale
    // this tool must never adopt (§1.3/R1 above: magnitude does not scale the trajectory signal,
    // and in the Momentum case a large move read WORSE). Divergence ranks severity by gap size;
    // trajectory does not rank by move size at all. Leaving `tag` unset is what keeps that
    // asymmetry true in the render, not just in a comment.
    firedInPhase: stampedRegime(lead),
  };
}

/** Header chips — band · composite, marker, and divergence when it's firing. */
export function buildTrajectoryChips(verdict: VerdictSection): ChipSpec[] {
  const band = BAND_META[verdict.label.band];
  const chips: ChipSpec[] = [
    { label: `${band.label} · ${Math.round(verdict.composite)}`, dot: band.cssVar, color: "var(--ink2)" },
  ];
  if (verdict.trajectoryMarker) {
    const m = MARKER_TONE[verdict.trajectoryMarker];
    chips.push({ label: m.word, color: m.color });
  }
  // ★ RULING 3's state, and — when something is firing — that finding's OWN gap. The old chip read
  //   `${flag} divergence · ${gap}` off the widest scored pair banded at 15/25, a third severity
  //   scale that could disagree with the finding standing on the same stock.
  if (verdict.divergence.headline === "patterns_firing" && verdict.divergence.pair) {
    chips.push({ label: `divergence · ${verdict.divergence.pair.gap}`, color: "var(--high)" });
  } else if (verdict.divergence.headline === "no_pattern" && verdict.divergence.spread !== null) {
    chips.push({ label: `spread ${verdict.divergence.spread.toFixed(0)} · no pattern`, color: "var(--ink2)" });
  }
  return chips;
}

/** One row in the "What happened" journey timeline. */
export interface TimelineItem {
  when: string;
  text: string;
  tag: string;
  dotColor: string;
  /** Sortable instant behind `when` — see `whenKey`. Never rendered. */
  at: string;
}

/**
 * The sortable instant behind a row, as an ISO-ish date string.
 *
 * ── ★ WHY THE SERIES IS THE AUTHORITY AND THE PERIOD KEY IS THE FALLBACK ──────────────────
 * The two row kinds are dated differently: a crossing carries a fiscal PERIOD ("FY26Q4"), an
 * event carries a calendar DATE. To interleave them one has to become the other, and the
 * series already holds the answer — every TrajectoryPoint carries both `periodKey` and the
 * `asOfDate` that period was scored on. So a crossing borrows its own snapshot's date, which
 * is exact and needs no calendar assumption.
 *
 * ⚠ THE FALLBACK ASSUMES AN APR–MAR FISCAL YEAR, AND THAT ASSUMPTION IS NOT UNIVERSAL — a
 *   handful of listed companies file Jan–Dec or Jul–Jun (see the backend's deriveFiscalPeriod,
 *   which is why FY is defined off the fiscal year's END, not off April). It is reached only
 *   for a crossing whose period is absent from the series, where the alternative is no order
 *   at all; being a quarter out there cannot reorder rows that are quarters apart.
 */
function whenKey(periodKey: string, byPeriod: Map<string, string>): string {
  const known = byPeriod.get(periodKey);
  if (known) return known;
  const m = /^FY(\d{2})Q([1-4])$/.exec(periodKey);
  if (!m) return periodKey;
  const fyEnd = 2000 + Number(m[1]);
  const q = Number(m[2]);
  // FY26 = Apr 2025 → Mar 2026, so Q1–Q3 end in the PRIOR calendar year.
  return q === 4
    ? `${fyEnd}-03-31`
    : `${fyEnd - 1}-${["06-30", "09-30", "12-31"][q - 1]}`;
}

/**
 * Build the journey timeline from real crossings + corporate events.
 *
 * ★ NEWEST FIRST. A reader opening a stock asks "what just happened", not "what happened three
 *   years ago" — the most recent regime change is the one that explains today's score, and it
 *   belongs at the top of the panel rather than at the bottom of a scroll. (The CHART stays
 *   left-to-right chronological; that is a different reading and is unaffected.)
 */
export function buildTimeline(trajectory: TrajectorySection): TimelineItem[] {
  const items: TimelineItem[] = [];
  const byPeriod = new Map(trajectory.series.map((p) => [p.periodKey, p.asOfDate]));

  for (const c of trajectory.crossings) {
    if (c.type === "band") {
      const up = bandIndex(c.to as LabelBand) > bandIndex(c.from as LabelBand);
      items.push({
        when: shortPeriod(c.toPeriod),
        at: whenKey(c.toPeriod, byPeriod),
        text: `Crossed ${BAND_META[c.from as LabelBand].label} → ${BAND_META[c.to as LabelBand].label}`,
        tag: "band",
        dotColor: up ? "var(--rec)" : "var(--high)",
      });
    } else if (c.pillar) {
      items.push({
        when: shortPeriod(c.toPeriod),
        at: whenKey(c.toPeriod, byPeriod),
        text: `${PILLAR_META[c.pillar].label} crossed its ${c.to} mark`,
        tag: c.pillar,
        dotColor: PILLAR_META[c.pillar].cssVar,
      });
    }
  }

  for (const e of trajectory.events) {
    items.push({
      when: e.eventDate,
      at: e.eventDate,
      text: humanizeKey(e.eventType),
      tag: "event",
      dotColor: "var(--p-mkt)",
    });
  }

  // Latest → oldest. Sort is stable, so same-day rows keep their build order (crossings, then
  // events) instead of shuffling between renders.
  return items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
