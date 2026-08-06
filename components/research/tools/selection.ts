/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 * THE SELECTION MODEL — what the page is currently ABOUT. Pure; no React, no fetching, no deriving.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ── ★ WHAT THIS FIXES ────────────────────────────────────────────────────────────────────────────
 * GLENMARK fires D2 (Market 69 vs Momentum 26), D1 (Market 69 vs Foundation 35) and D5 (Foundation 35
 * vs Momentum 26). The tool charted ONE of them and reduced the other two to text in a panel you
 * could not click. It acknowledged that three readings existed and then refused to show two of them.
 *
 * A selection is not a tab over a static chart. Every downstream slot — chart series, heading,
 * readout, the card and its clauses, the boundary — is a function of THIS value. Switching from D2 to
 * D5 re-frames the page onto a different pair of pillars, a different gap and a different sentence.
 *
 * ── ★ EVERYTHING HERE IS READ, NOTHING IS DERIVED ────────────────────────────────────────────────
 * The subjects come from the finding's OWN `facts.pillarPair` (or a note's `readings`), the pair comes
 * from the backend's already-resolved `pair`, and the ORDER comes from `findingsForTool`, which is the
 * one place card order is decided. This module picks no pair, ranks no severity and classifies no
 * family — it only says which of the things the backend sent is currently on screen.
 */

import { findingsForTool, type ToolId } from "@/lib/findings/tool-findings";
import { findingName } from "@/lib/findings/descriptions";
import { PILLAR_META } from "@/components/stock-detail/health/shared";
import type { PromotedRead } from "./tool-frame.types";
import type { NotCoveredNote, PatternView, PillarKey } from "@/types/health";

/** Everything a chart can draw a line for — the four pillars plus the composite. */
export type SubjectKey = "composite" | PillarKey;

const SUBJECTS: readonly string[] = ["composite", "foundation", "momentum", "market", "ownership"];
const isSubject = (s: string): s is SubjectKey => SUBJECTS.includes(s);

/** Label + colour for any chartable subject. The composite is not in PILLAR_META (it is not a
 *  pillar), so it is named here once rather than at each of the five call sites that need it. */
export const SUBJECT_META: Record<SubjectKey, { label: string; cssVar: string }> = {
  composite: { label: "Health score", cssVar: "var(--ink)" },
  foundation: { label: PILLAR_META.foundation.label, cssVar: PILLAR_META.foundation.cssVar },
  momentum: { label: PILLAR_META.momentum.label, cssVar: PILLAR_META.momentum.cssVar },
  market: { label: PILLAR_META.market.label, cssVar: PILLAR_META.market.cssVar },
  ownership: { label: PILLAR_META.ownership.label, cssVar: PILLAR_META.ownership.cssVar },
};

/**
 * One thing the page can be about: a firing pattern, or a configuration tested and not shipped.
 *
 * ⚠ A DISCRIMINATED UNION, NOT A MERGED SHAPE. A note carries no severity and no tier — it is the
 * record of a decision NOT to make a claim. Flattening the two into one optional-severity type is
 * exactly how a note starts being ranked against a finding.
 */
export type Selectable =
  | { kind: "pattern"; id: string; pattern: PatternView }
  | { kind: "not_covered"; id: string; note: NotCoveredNote };

/** The values the wire gives for a selection's subjects, when it gives any. */
export interface SelectionReading {
  subject: SubjectKey;
  value: number | null;
}

/**
 * Everything selectable on this tool, in the order it is offered.
 *
 * ⚠ PATTERNS FIRST, IN `findingsForTool`'s ORDER — that function is the single home of card order
 * (state → tier → severity → key) and this does not re-sort. NOT-COVERED NOTES ALWAYS LAST, in the
 * order the backend sent them, which is registry order and therefore not an order at all: sorting
 * them by anything — most of all by their gap — would rebuild the ranked generic-spread read both
 * specs excluded.
 *
 * ⚠ NOTES ARE FILTERED TO THIS TOOL, ON THE WIRE FIELD. `NotCoveredNote.tool` says which spec's
 * exclusion table a configuration came from (NC1/NC2 divergence, NC3–NC10 trajectory) — HDFCBANK's
 * NC1 is a Foundation-vs-Market divergence configuration, and showing it in the Trajectory switcher
 * put a divergence reading on a tool with no divergence axis to place it on. This filters on that
 * served field; it never reads the id to guess which family a note belongs to.
 */
export function buildSelectables(
  patterns: readonly PatternView[] | undefined,
  notCovered: readonly NotCoveredNote[] | undefined,
  tool: ToolId,
): Selectable[] {
  const p: Selectable[] = findingsForTool(patterns, tool).map((pattern) => ({
    kind: "pattern",
    id: pattern.patternKey,
    pattern,
  }));
  const n: Selectable[] = (notCovered ?? [])
    .filter((note) => note.tool === tool)
    .map((note) => ({ kind: "not_covered", id: note.id, note }));
  return [...p, ...n];
}

/**
 * The selection a URL asks for, or the default.
 *
 * ⚠ AN UNKNOWN ID IS NOT AN ERROR. A link to a pattern that has since stopped firing — or to the
 * other tool's pattern — falls back to the default silently. A reader following an old link should
 * land on the stock, not on a failure.
 */
export function resolveSelected(items: readonly Selectable[], requestedId: string | null): Selectable | null {
  if (!items.length) return null;
  return items.find((i) => i.id === requestedId) ?? items[0];
}

/**
 * The subjects a selection's chart draws — the pattern's own `pillarPair`, or the subjects a note
 * reports readings for. Two real pillars, one pillar, or `["composite"]` (T1–T4).
 *
 * ⚠ NOT INFERRED FROM THE PATTERN KEY. `facts.pillarPair` is served for exactly this, and T1–T4's
 * record carries `["composite"]` precisely so a chart does not read a doubled pillar name off a key
 * and draw two unrelated lines.
 */
export function subjectsOf(s: Selectable): SubjectKey[] {
  const raw: readonly string[] =
    s.kind === "pattern" ? (s.pattern.facts?.pillarPair ?? []) : s.note.readings.map((r) => r.subject);
  return raw.filter(isSubject);
}

/** The subject values the wire carries for this selection. `null` where the payload states none —
 *  a single-pillar pattern's current reading is not served as a pair, and no value is invented. */
export function readingsOf(s: Selectable): SelectionReading[] {
  if (s.kind === "not_covered") {
    return s.note.readings.filter((r) => isSubject(r.subject)).map((r) => ({ subject: r.subject as SubjectKey, value: r.value }));
  }
  const pair = s.pattern.pair;
  if (pair) {
    return [
      { subject: pair.high.pillar, value: pair.high.subtotal },
      { subject: pair.low.pillar, value: pair.low.subtotal },
    ];
  }
  return subjectsOf(s).map((subject) => ({ subject, value: null }));
}

/**
 * The high/low pair when the selection HAS one, already resolved backend-side. Null for every
 * single-subject and composite selection — an absence, never a cue to pick the widest pair.
 * Its presence is what decides whether the page draws a spread or plain subject lines.
 */
export function pairOf(s: Selectable): { high: PillarKey; low: PillarKey; gap: number } | null {
  const p = s.kind === "pattern" ? s.pattern.pair : s.note.pair;
  return p ? { high: p.high.pillar, low: p.low.pillar, gap: p.gap } : null;
}

/**
 * The state chip: Formed · Building.
 *
 * `null` for a pattern that declares no state (D5–D7, S2, T1–T9 — crossings and measured
 * discriminants with no "almost"). An absent chip is the honest render for those; a "Formed" chip on
 * a pattern whose record has no formed/building axis would be inventing a state.
 *
 * ⚠ ALSO `null` FOR A NOT-COVERED NOTE, AND THAT IS THE POINT. It used to return "Not covered",
 * which put a label on the one thing the surrounding language already says outright — the copy, the
 * neutral tone and the muted rail all establish that a note is not a reading. The badge only repeated
 * it, and a chip in the position where patterns carry a lifecycle state reads as a third state
 * alongside Formed and Building. It is not one. The muted treatment carries the distinction.
 */
export function stateLabelOf(s: Selectable): "Formed" | "Building" | null {
  if (s.kind === "not_covered") return null;
  return s.pattern.state === "formed" ? "Formed" : s.pattern.state === "building" ? "Building" : null;
}

/**
 * ★ THE ONE DERIVATION OF A NOT-COVERED CONFIGURATION'S NAME — its pillars, in the order the record
 * reports them: "Foundation vs Market", "Momentum vs Foundation", or the single subject where the
 * record names no pair ("Health score").
 *
 * ⚠ NOT A NAME FIELD, AND DELIBERATELY NOT ONE. A note carries no display name on the wire, and its
 * `reason` is a machine token for WHY it was withheld ("bull_masked") — promoting that to a title
 * would label the configuration with its own verdict. The subjects ARE its identity, so they are the
 * name, and this is the single place that is computed. `titleOf`, the promoted banner and the card
 * list all route through here, so the switcher and the card can never drift apart.
 *
 * TOTAL: NotCoveredRecord subjects are `Pillar | "composite"` backend-side, every one of which is in
 * SUBJECT_META, so the filter drops nothing and the result is never empty.
 */
export function configurationTitle(readings: readonly { subject: string }[]): string {
  return readings
    .map((r) => r.subject)
    .filter(isSubject)
    .map((k) => SUBJECT_META[k].label)
    .join(" vs ");
}

/**
 * The switcher entry's headline.
 *
 * ⚠ A NOT-COVERED NOTE CARRIES NO DISPLAY NAME ON THE WIRE, and none is invented. Its `reason` is a
 * machine token for WHY it was withheld ("bull_masked"), not a name for WHAT the configuration is, so
 * promoting it to a title would label the configuration with its own verdict. The subjects it reports
 * ARE its identity, so they are the title. See the build report.
 */
export function titleOf(s: Selectable): string {
  if (s.kind === "pattern") return findingName(s.pattern.patternKey);
  return configurationTitle(readingsOf(s));
}

/** The lifecycle behind a selection — the same resolver output for a note as for a finding. */
export const lifecycleOf = (s: Selectable) =>
  s.kind === "pattern" ? (s.pattern.lifecycle ?? null) : s.note.lifecycle;

/**
 * The promoted banner for a NOT-COVERED selection.
 *
 * ⚠ `tone: "neutral"` IS LOAD-BEARING AND IS NOT A DEFAULT. Every other tone on this banner
 * (rec/high/ctx/crit) paints a severity accent, and a note has no severity — it is the record of a
 * decision NOT to give a read. Painting one would present the withheld thing as the finding.
 *
 * ⚠ THE TITLE NAMES THE CONFIGURATION, NOT OUR PROCESS. It used to read "Tested, not shipped", which
 * described how we work rather than anything about this stock — the same reason the closing lines
 * came out. The body already explains the mechanism, so the heading's only remaining job is to say
 * WHICH configuration this is, and its pillars are that. The body stays the backend's copy verbatim.
 */
export function notCoveredRead(n: NotCoveredNote): PromotedRead {
  return { tone: "neutral", title: configurationTitle(n.readings), body: n.text, note: null };
}
