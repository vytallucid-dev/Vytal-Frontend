"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 * THE SELECTION'S CHART AND READOUT — one dispatcher, shared by both tools.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * The selected reading decides the instrument, and the decision is made by ONE wire field:
 *
 *   `pair` present  → the SPREAD instrument. Two real pillars with the gap shaded between them.
 *   `pair` null     → SUBJECT LINES. One pillar (T5–T9), the composite (T1–T4), or several plain
 *                     lines when a record names more than two subjects (S1 names all four).
 *
 * ⚠ THE DISCRIMINATOR IS THE PAYLOAD'S, NOT A COUNT TAKEN HERE. The backend resolves `pair` from the
 * record's own `pillarPair` AND from whether both pillars are currently scored; it returns null when
 * either is not. So a two-pillar pattern on a stock missing one of its pillars falls to plain lines
 * rather than drawing a spread against an inert 0 — which is the same guard the backend applies, read
 * rather than re-implemented.
 *
 * ★ A NOT-COVERED NOTE GETS THE IDENTICAL TREATMENT. Its `pair` and `lifecycle` are the same shapes a
 * finding carries, so it flows through this file without a single branch on `kind`. That is the whole
 * point of chart parity: the CHART does not know it is drawing a configuration we declined to read.
 * Only the words differ, and the words are not here.
 */

import { DivergenceChart, DivergenceEmpty } from "./divergence/divergence-chart";
import { DivergenceReadout } from "./divergence/divergence-readout";
import { buildSpread, spreadSlope } from "./divergence/divergence-data";
import { TrajectoryChart } from "./trajectory/trajectory-chart";
import { TrajectoryReadout } from "./trajectory/trajectory-readout";
import { findingName } from "@/lib/findings/descriptions";
import { SUBJECT_META, configurationTitle, pairOf, subjectsOf, type Selectable } from "./selection";
import type { SlicedWindow } from "./window-slice";
import type { ActiveDatapoint } from "./tool-frame.types";
import type { CrossingEvent } from "@/types/health";

/**
 * The chart heading, re-framed onto the selection. Names the reading, then its subjects.
 *
 * ⚠ A NOT-COVERED NOTE GETS ITS SUBJECTS AND NOTHING ELSE. It used to be named "Tested, not shipped"
 * here, which described our process rather than the stock. Its name is now its pillars — which the
 * `· subjects` suffix would then repeat verbatim ("Foundation vs Market · Foundation · Market"), so
 * the suffix is skipped rather than the name being padded out to earn it.
 */
function headingOf(s: Selectable): string {
  if (s.kind === "not_covered") return configurationTitle(s.note.readings);
  const subjects = subjectsOf(s)
    .map((k) => SUBJECT_META[k].label)
    .join(" · ");
  const name = findingName(s.pattern.patternKey);
  return subjects ? `${name} · ${subjects}` : name;
}

export function SelectionChart({
  selection,
  sliced,
  crossings,
  active,
  onActiveChange,
}: {
  selection: Selectable | null;
  sliced: SlicedWindow | null;
  crossings: CrossingEvent[];
  active: ActiveDatapoint;
  onActiveChange: (a: ActiveDatapoint) => void;
}) {
  if (!selection || !sliced) return null;
  const pair = pairOf(selection);
  const subjects = subjectsOf(selection);

  if (pair) {
    const spread = buildSpread(sliced.points, pair.high, pair.low);
    // Slope is CHART GEOMETRY — which way the drawn line goes, for shading. Not a classification:
    // widening and narrowing spreads are both on the excluded list and neither is coloured for tone.
    const direction =
      spread.length >= 2 ? spreadSlope(spread[0].gap, spread[spread.length - 1].gap) : ("steady" as const);
    return spread.length >= 2 ? (
      <DivergenceChart
        spread={spread}
        highPillar={pair.high}
        lowPillar={pair.low}
        direction={direction}
        isDaily={sliced.isDaily}
        resultMarks={sliced.resultMarks}
        clampedEarlier={sliced.clampedEarlier}
        active={active}
        onActiveChange={onActiveChange}
      />
    ) : (
      <DivergenceEmpty isDaily={sliced.isDaily} highPillar={pair.high} lowPillar={pair.low} />
    );
  }

  return (
    <TrajectoryChart
      points={sliced.points}
      crossings={crossings}
      isDaily={sliced.isDaily}
      resultMarks={sliced.resultMarks}
      clampedEarlier={sliced.clampedEarlier}
      active={active}
      onActiveChange={onActiveChange}
      focus={subjects}
      title={headingOf(selection)}
    />
  );
}

export function SelectionReadout({
  selection,
  sliced,
  active,
}: {
  selection: Selectable | null;
  sliced: SlicedWindow | null;
  active: ActiveDatapoint;
}) {
  if (!selection || !sliced || !sliced.points.length) return null;
  const pair = pairOf(selection);

  if (pair) {
    const spread = buildSpread(sliced.points, pair.high, pair.low);
    if (!spread.length) return null;
    const direction =
      spread.length >= 2 ? spreadSlope(spread[0].gap, spread[spread.length - 1].gap) : ("steady" as const);
    return (
      <DivergenceReadout
        spread={spread}
        highPillar={pair.high}
        lowPillar={pair.low}
        direction={direction}
        active={active}
      />
    );
  }

  return (
    <TrajectoryReadout
      points={sliced.points}
      isDaily={sliced.isDaily}
      active={active}
      focus={subjectsOf(selection)}
    />
  );
}
