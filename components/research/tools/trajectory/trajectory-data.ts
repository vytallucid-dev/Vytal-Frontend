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
} from "@/types/health";
import type { ChipSpec, PromotedRead } from "../tool-frame.types";

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

/** Is this a "price ahead" divergence (Market leads, fundamentals/momentum lag)? */
function isPriceAhead(div: VerdictSection["divergence"]): boolean {
  return (
    div.flag !== "none" &&
    div.high?.pillar === "market" &&
    (div.low?.pillar === "foundation" || div.low?.pillar === "momentum")
  );
}

/** The promoted read — interpretation sentence above the grid. */
export function buildTrajectoryRead(
  verdict: VerdictSection,
  trajectory: TrajectorySection,
): PromotedRead {
  const marker = verdict.trajectoryMarker;
  const delta = verdict.trajectoryDelta;
  const band = verdict.label.band;
  const word = healthLabel(verdict.composite);
  const cross = lastBandCrossing(trajectory.crossings);
  const deltaTxt = delta != null ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}` : null;

  // recovery — featured.
  if (marker === "improving") {
    const crossedUp = cross && bandIndex(cross.to as LabelBand) > bandIndex(cross.from as LabelBand);
    const body =
      `The composite has turned up${deltaTxt ? ` (${deltaTxt} last quarter)` : ""}` +
      (crossedUp ? `, crossing back into ${BAND_META[cross!.to as LabelBand].label}.` : ".") +
      " The model's most durable signal — a place to look, not a buy.";
    return {
      tone: "rec",
      title: bandIndex(band) >= bandIndex("healthy") ? "Recovering into strength." : "Turning up out of weakness.",
      body,
    };
  }

  // deterioration — noted, with the masked caveat when price has run ahead.
  if (marker === "deteriorating") {
    const crossedDown = cross && bandIndex(cross.to as LabelBand) < bandIndex(cross.from as LabelBand);
    const body =
      `The composite is sliding${deltaTxt ? ` (${deltaTxt} last quarter)` : ""}` +
      (crossedDown
        ? `, having left ${BAND_META[cross!.from as LabelBand].label} for ${BAND_META[cross!.to as LabelBand].label}.`
        : ".") +
      " An early risk-regime change — usually visible in the recording before price reacts.";
    return {
      tone: "high",
      title: "A base, sliding.",
      body,
      note: isPriceAhead(verdict.divergence)
        ? "Price has run ahead of cooling fundamentals — this read may be deferred further."
        : null,
    };
  }

  // stable / aligned — calm.
  return {
    tone: "ctx",
    title: `${word}, holding its level.`,
    body:
      verdict.divergence.flag === "none"
        ? "The pillars sit close and steady; nothing has moved this window. Sound and fully understood — little for the recording to add."
        : `${PILLAR_META[verdict.divergence.high!.pillar].label} leads while ${PILLAR_META[verdict.divergence.low!.pillar].label.toLowerCase()} lags, but the level is steady — a state to understand, not a move to chase.`,
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
  if (verdict.divergence.flag !== "none") {
    chips.push({
      label: `${verdict.divergence.flag} divergence · ${verdict.divergence.gap.toFixed(0)}`,
      color: verdict.divergence.flag === "wide" ? "var(--crit)" : "var(--high)",
    });
  }
  return chips;
}

/** One row in the "What happened" journey timeline. */
export interface TimelineItem {
  when: string;
  text: string;
  tag: string;
  dotColor: string;
}

/** Build the journey timeline from real crossings + corporate events. */
export function buildTimeline(trajectory: TrajectorySection): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const c of trajectory.crossings) {
    if (c.type === "band") {
      const up = bandIndex(c.to as LabelBand) > bandIndex(c.from as LabelBand);
      items.push({
        when: shortPeriod(c.toPeriod),
        text: `Crossed ${BAND_META[c.from as LabelBand].label} → ${BAND_META[c.to as LabelBand].label}`,
        tag: "band",
        dotColor: up ? "var(--rec)" : "var(--high)",
      });
    } else if (c.pillar) {
      items.push({
        when: shortPeriod(c.toPeriod),
        text: `${PILLAR_META[c.pillar].label} crossed its ${c.to} mark`,
        tag: c.pillar,
        dotColor: PILLAR_META[c.pillar].cssVar,
      });
    }
  }

  for (const e of trajectory.events) {
    items.push({
      when: e.eventDate,
      text: humanizeKey(e.eventType),
      tag: "event",
      dotColor: "var(--p-mkt)",
    });
  }

  return items;
}
