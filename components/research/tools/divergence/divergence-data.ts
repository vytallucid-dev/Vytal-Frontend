/**
 * Divergence tool — chart geometry and the read, RENDERED FROM THE FIRED FINDINGS.
 *
 * ── ★ THIS FILE NO LONGER DECIDES WHAT IS TRUE ────────────────────────────────────────────────────
 * It used to. It carried its own 15/25/1.0 constants, its own (config × direction) taxonomy, and a
 * verdict bank of hand-authored prose — a second opinion competing with the engine's D-family
 * findings, on its own thresholds, in its own vocabulary. All of that is gone; see the note above
 * buildDivergenceRead.
 *
 * ⚠ THE OLD HEADER MADE A CLAIM THE SPEC EXCLUDES, AND IT IS REMOVED, NOT SOFTENED. It described the
 * value configuration (fundamentals ahead of price) as "robust, regime-durable → lean-in". That
 * configuration is on the Divergence spec's EXCLUDED list because its evidence CONFLICTS: one run
 * −0.6% / 47% positive (did not work), another +13.7% / 80% but measured on absolute returns in a
 * rising market — "We cannot say what it means, so it does not ship." There is no weaker version of
 * that claim to fall back to, so none is written here.
 *
 * What remains: pillar labels/colours, the spread SERIES for the chart (geometry, not a verdict), and
 * a read assembled from each finding's own catalogue copy.
 */

import { PILLAR_META, bandMeta } from "@/components/stock-detail/health/shared";
import { findingName, findingDescription, doesntMean } from "@/lib/findings/descriptions";
import { toneOf, evidenceString, stampedRegime } from "@/lib/findings/tool-findings";
import type {
  VerdictSection,
  PillarView,
  PillarKey,
  PatternView,
} from "@/types/health";
import type { DivergenceDirection } from "@/types/research-tools";
import type { DivergenceView } from "@/types/health";
import type { ChipSpec, PromotedRead } from "../tool-frame.types";
import type { WindowPoint } from "../window-slice";

// ⚠ DELETED IN PHASE 4 — DIVERGENCE_NOTABLE (15) · DIVERGENCE_WIDE (25) · GAP_EPS (1.0).
//   A byte-level re-implementation of the backend scan's constants, which were themselves a copy of
//   health-view's. Three declarations of one number, none of which the engine used after Phase 2
//   moved the material cut to 12. Whether a divergence exists is now decided in exactly one place —
//   the rules — and this file reads the result.
const r1 = (x: number) => Math.round(x * 10) / 10;

const label = (p: PillarKey) => PILLAR_META[p].label;
const color = (p: PillarKey) => PILLAR_META[p].cssVar;

export interface SpreadPoint {
  /** axis label — short period (quarterly) or short day (daily/custom). */
  period: string;
  high: number;
  low: number;
  gap: number;
}

// ⚠ DELETED — CONFIG_META (value|price_ahead|ownership|mixed|none). It was keyed on the
//   scan-item `config` field the client used to recompute; the landing card now reads the
//   lead finding's own catalogue name + severity tone instead (divergence-card.tsx).

/**
 * Slope of the drawn spread line — CHART GEOMETRY, deliberately toneless.
 *
 * ── ★ WHY THESE COLOURS ARE ALL NEUTRAL NOW ───────────────────────────────────────────────────────
 * They used to be widening → var(--high) (warning) and narrowing → var(--rec) (constructive), which
 * encodes "widening is bad, narrowing is good". The study found neither:
 *   generic widening spread   −1.1%, 44% positive (n=365) — and INVERTS in banks (+5.6%, 74%)
 *   narrowing spread          +0.2%, 51% positive (n=239) — "indistinguishable from nothing"
 * Both are on the spec's EXCLUDED list, and a coloured arrow is a claim whether or not a sentence
 * accompanies it. The word still describes what the reader can see on the line; the colour no longer
 * tells them how to feel about it.
 */
export const DIRECTION_META: Record<
  DivergenceDirection,
  { label: string; color: string; arrow: string }
> = {
  widening: { label: "widening", color: "var(--ink2)", arrow: "▲" },
  narrowing: { label: "narrowing", color: "var(--ink2)", arrow: "▼" },
  steady: { label: "steady", color: "var(--ink2)", arrow: "•" },
};

/**
 * The drawn line's slope across the window. PURE GEOMETRY — it answers "which way does the shape on
 * screen go", never "does this stock have a widening divergence". The latter was a pattern claim
 * this file used to make with its own threshold; it is excluded, and it is gone.
 * The deadband keeps a flat line from being labelled a move; it classifies nothing.
 */
const SLOPE_DEADBAND = 1.0;
export function spreadSlope(gapStart: number, gapEnd: number): DivergenceDirection {
  const d = gapEnd - gapStart;
  return d > SLOPE_DEADBAND ? "widening" : d < -SLOPE_DEADBAND ? "narrowing" : "steady";
}

// ★ pickScoredPair IS DELETED. It returned the widest scored pair — the fourth copy of that
// derivation, and the one that decided what the CHART drew. The chart, chips, readout and summary now
// read `facts.pillarPair` off the fired finding (served high/low-resolved as `pair`), so the line on
// screen and the sentence beneath it are about the same two pillars by construction.

/** The fixed pair's two subtotals + gap over the SLICED window, oldest→newest. Runs over
 *  the shared WindowPoint series — so on a daily/custom window the gap is computed per
 *  `asOfDate` and you see it widen/narrow day by day (the same pillar-spread math, just
 *  over daily points). Points where either pillar reads ≤ 0 are dropped: the trajectory
 *  contract doesn't carry per-period pillar availability, and an `unavailable_redistributed`
 *  pillar lands a ~0 subtotal that would inject a phantom gap. The x-axis plots on the
 *  point's own label so dropped points never evenly-space-distort the timeline. */
export function buildSpread(
  points: WindowPoint[],
  high: PillarKey,
  low: PillarKey,
): SpreadPoint[] {
  return points
    .map((pt) => {
      const h = pt[high] as number;
      const l = pt[low] as number;
      return { period: pt.x, high: r1(h), low: r1(l), gap: r1(h - l) };
    })
    .filter((p) => p.high > 0 && p.low > 0);
}

// ⚠ DELETED IN PHASE 4 — divergenceConfig() · divergenceFlag() · directionOf().
//
// These were the client half of the duplicate derivation. `divergenceConfig` invented a taxonomy
// (value | price_ahead | ownership | mixed) that maps to NO finding key: a stock could read
// "price_ahead" here while carrying divergence_D1_price_ahead_quality on its stock page and neither
// surface knew about the other. `divergenceFlag` re-applied the retired 15/25 cut. `directionOf`
// classified the gap's slope as widening/narrowing — which is the EXCLUDED pair: generic widening
// spread reads −1.1% / 44% positive (n=365, and INVERTS in banks at +5.6% / 74%), and narrowing
// reads +0.2% / 51% — "indistinguishable from nothing".
//
// Nothing replaces them. Which patterns are true is the rules' answer; this file renders it.

// ── the promoted read — config × direction, encoding the asymmetry ──────────────

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE READ — RENDERED FROM THE FIRED FINDING. The hand-authored verdict bank that stood here is gone.
//
// ── ★ WHAT WAS REMOVED AND WHY ────────────────────────────────────────────────────────────────────
// ~120 lines of templated prose keyed on (config × direction) — a taxonomy the engine does not use —
// with thresholds typed into the sentences. Three specific defects died with it:
//
//   1. IT STATED A NUMBER THE ENGINE NO LONGER USED. Phase 2 moved the material cut to 12; the copy
//      still said 25.
//   2. IT MADE A CLAIM THE SPEC EXPLICITLY EXCLUDES. The 'value' configuration (fundamentals ahead of
//      price) was described as 'Historically one of the more robust divergences in the model' and
//      'the robust configuration'. That configuration is on the Divergence spec's EXCLUDED list:
//      'Evidence CONFLICTS — one run −0.6% / 47% (did not work), another +13.7% / 80% but measured on
//      absolute returns in a rising market. We cannot say what it means, so it does not ship.'
//      A claim about what a configuration has historically meant, for a configuration whose evidence
//      conflicts, is not a hedge away from correct — it is the opposite of what the study found.
//      ⚠ It is NOT replaced with softer wording. The configuration may be DESCRIBED; no claim about
//      its historical meaning may survive, because there is no such finding to soften.
//   3. IT WAS A SECOND OPINION. The tool said one thing, the stock page's finding another.
//
// The read is now the fired finding's own catalogue name + verdict + boundary — the same strings the
// stock page, the Hub, the chat and the relational card render.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * ★ RULING 3's THREE HEADLINE STATES — evaluated in the backend's order, rendered here.
 *
 * ⚠ THE `!lead ⟹ Aligned` FALLBACK IS DELETED. It was a two-way branch over a three-way fact: any
 * stock with no C-family finding rendered the calm state, including stocks whose pillars are nowhere
 * near agreeing. GLENMARK carries a 49-point spread and no live divergence — its rows are the retired
 * C-family — and this branch called it "Aligned — No Tension".
 *
 * The headline now comes from the payload (`verdict.divergence.headline`), decided once, backend-side.
 */
export function buildDivergenceRead(
  findings: PatternView[],
  divergence: DivergenceView | null,
): PromotedRead {
  const lead = findings[0];
  if (!lead) return buildHeadlineRead(divergence);

  const extra = findings.length - 1;
  // The gap tier (material/stretched/extreme) — read straight off evidence.tierWord, which the
  // D-rule itself stamped from gapTier() (divergence/bands.ts). Absent on D3/D4/D6/D7, which are
  // movement/crossing patterns with no standing-gap tier to report — evidenceString returns null
  // rather than a guessed default, so the badge simply doesn't render for those.
  const tierWord = evidenceString(lead, "tierWord");
  return {
    tone: toneOf(lead),
    title: findingName(lead.patternKey),
    // The verdict is already evidence-bound and regime-resolved by the backend.
    body: lead.verdict ?? findingDescription(lead.patternKey) ?? '',
    // The interpretive boundary — what the reader must NOT conclude. Every finding carries one.
    note:
      extra > 0
        ? `${doesntMean(lead.patternKey)} (+${extra} more divergence${extra === 1 ? "" : "s"} on this stock)`
        : doesntMean(lead.patternKey),
    tag: tierWord ? `Gap: ${tierWord}` : null,
    // The phase THIS finding fired under (regimeAtEvent) — only D1/D6 declare a regime
    // dependency (score-pass.ts's fire-time stamp), so this is null for every other D-pattern.
    firedInPhase: stampedRegime(lead),
  };
}

/**
 * ★ THE NON-FIRING HEADLINE — `aligned` or `no_pattern`, from the payload.
 *
 * ⚠ THE TWO INLINE S1 SENTENCES ARE DELETED. This file carried the aligned copy verbatim, and
 * `buildWhoseMove` carried a SECOND, DIFFERENTLY-WORDED one ("No tension to resolve — the scored
 * pillars agree…"). Two hand-typed versions of one catalogue record, in one file, already disagreeing
 * with each other. S1 is a real catalogue key now (`divergence_S1_aligned`), so its name, description
 * and boundary are read like every other finding's.
 *
 * `no_pattern` has NO catalogue entry, and it must not borrow S1's — the two states mean opposite
 * things. It is the one place this file authors a sentence, and it says only what is true: the spread
 * is past the aligned band, and nothing measured describes this shape.
 */
export function buildHeadlineRead(divergence: DivergenceView | null): PromotedRead {
  const key = "divergence_S1_aligned";
  if (divergence?.headline === "no_pattern") {
    const spread = divergence.spread;
    return {
      tone: "neutral",
      title: "No matching pattern",
      body:
        `The pillars are ${spread === null ? "apart" : `${Math.round(spread)} points apart`}, past the point where they` +
        ` count as agreeing — but none of the measured patterns describes this shape.`,
      note:
        "This is not an all-clear and not a warning. It says the tension here is real and that we have" +
        " no studied reading for it, which is a different thing from having looked and found nothing.",
    };
  }
  return {
    tone: "neutral",
    title: findingName(key),
    body: findingDescription(key) ?? "",
    note: doesntMean(key),
  };
}

// ── chips ───────────────────────────────────────────────────────────────────────

/**
 * Header chips. The third chip names the FIRED FINDING (or the aligned state) — it no longer shows a
 * recomputed `config` token, because that taxonomy corresponded to nothing the engine emits.
 *
 * ⚠ The gap chip prints a NUMBER but no THRESHOLD: "gap 27" is a measurement, whereas the old copy's
 * "≥ 25 pts apart" was a rule, and rules typed into prose are what went stale in Phase 2.
 */
export function buildDivergenceChips(
  verdict: VerdictSection,
  gap: number | null,
  findings: PatternView[],
): ChipSpec[] {
  const band = bandMeta(verdict.label.band);
  const lead = findings[0];
  const chips: ChipSpec[] = [
    { label: `${band.label} · ${Math.round(verdict.composite)}`, dot: band.cssVar, color: "var(--ink2)" },
  ];
  // ⚠ THE GAP IS THE SELECTED READING'S OWN, straight off its served `pair`, and is OMITTED when the
  //   selection names no pair. It is not re-derived from the drawn line and not back-filled from the
  //   widest spread: a chip reading "gap 43" beside a card about a different pair is the same
  //   chart-says-one-thing defect `pillarPair` exists to end.
  if (gap !== null) chips.push({ label: `gap ${gap.toFixed(0)}`, color: "var(--ink2)" });
  chips.push(
    lead
      ? { label: findingName(lead.patternKey), color: `var(--${toneOf(lead)})` }
      : { label: "Aligned", color: "var(--ink3)" },
  );
  return chips;
}

// ── the static "whose move?" + asymmetric read ──────────────────────────────────

export interface InterpPoint {
  tone: "good" | "warn";
  title: string;
  body: string;
}

const movedWord = (d: number) => (d > 0 ? "rose" : d < 0 ? "fell" : "held");

export function buildWhoseMove(
  spread: SpreadPoint[],
  high: PillarKey,
  low: PillarKey,
  findings: PatternView[],
): InterpPoint[] {
  const H = label(high);
  const L = label(low);
  const first = spread[0];
  const last = spread[spread.length - 1];
  const hd = r1(last.high - first.high);
  const ld = r1(last.low - first.low);

  // Whose leg moved to change the gap.
  let whose: string;
  const bothMoved = Math.abs(hd) > 1 && Math.abs(ld) > 1;
  if (bothMoved && hd > 0 && ld < 0) {
    whose = `${H} ${movedWord(hd)} while ${L} ${movedWord(ld)} — both legs widened the gap.`;
  } else if (bothMoved && hd < 0 && ld > 0) {
    whose = `${L} ${movedWord(ld)} while ${H} ${movedWord(hd)} — both legs closed the gap.`;
  } else if (Math.abs(hd) >= Math.abs(ld)) {
    whose = `${H} did the moving — ${hd >= 0 ? "pulling away from" : "falling toward"} a steadier ${L}.`;
  } else {
    whose = `${L} did the moving — ${ld >= 0 ? "rising to meet" : "falling away from"} a steadier ${H}.`;
  }

  // ── "What it means" — THE FINDING'S OWN BOUNDARY, not a config lookup ──────────────────────────
  //
  // ⚠ THE SECOND "ROBUST" CLAIM DIED HERE. The `value` branch read "Robust on average, but still a
  // read: the market can stay cheap." That configuration — fundamentals ahead of price — is on the
  // spec's EXCLUDED list precisely because its evidence CONFLICTS (−0.6%/47% in one run, +13.7%/80%
  // in another, the latter on absolute returns in a rising market): "We cannot say what it means, so
  // it does not ship." "Robust on average" is not a hedge on that; it is a claim the study does not
  // support, and there is no weaker phrasing to retreat to.
  //
  // What a reader gets instead is the fired finding's own doesn't-mean line — the interpretive
  // boundary the catalogue guarantees every finding carries, written once and rendered everywhere.
  const lead = findings[0];
  // ★ THE SECOND INLINE S1 SENTENCE IS DELETED. It read "No tension to resolve — the scored pillars
  //   agree. Nothing here pulls against the whole." — a differently-worded copy of the one 150 lines
  //   above it, in the same file, both hand-typed for a state that now has a catalogue record. It was
  //   also unconditional on the headline, so it asserted agreement whenever nothing fired, including
  //   on `no_pattern` stocks whose pillars plainly do not agree.
  const means = lead ? doesntMean(lead.patternKey) : doesntMean("divergence_S1_aligned");

  return [
    { tone: lead ? "warn" : "good", title: "Whose move?", body: whose },
    { tone: lead ? "warn" : "good", title: "What it means", body: means },
  ];
}

export { label as pillarLabel, color as pillarColor };
