/**
 * Divergence interpretation — the asymmetric taxonomy + templated reads.
 *
 * THE CARDINAL CONCEPT: one spread instrument. Convergence is not a mode — it's the
 * DIRECTION (slope) of the gap. THE ASYMMETRY: a gap is not neutral. Which pillar
 * leads, and which way it moves, changes the meaning:
 *   • value (fundamentals ahead of price) ....... robust, regime-durable → lean-in
 *   • price_ahead (price ahead of fundamentals) . masked caution        → never a buy
 *   • ownership (ownership vs the rest) ......... a flow tell            → investigate
 * Direction × config together produce the read; they are never equal.
 */

import { PILLAR_META, BAND_META } from "@/components/stock-detail/health/shared";
import type {
  VerdictSection,
  PillarView,
  PillarKey,
  DivergenceFlag,
} from "@/types/health";
import type { DivergenceConfig, DivergenceDirection } from "@/types/research-tools";
import type { ChipSpec, PromotedRead } from "../tool-frame.types";
import type { WindowPoint } from "../window-slice";

const DIVERGENCE_NOTABLE = 15;
const DIVERGENCE_WIDE = 25;
const GAP_EPS = 1.0;
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

export const CONFIG_META: Record<DivergenceConfig, { label: string; color: string }> = {
  value: { label: "Value", color: "var(--rec)" },
  price_ahead: { label: "Price ahead", color: "var(--high)" },
  ownership: { label: "Ownership", color: "var(--p-own)" },
  mixed: { label: "Pillar spread", color: "var(--ctx)" },
  none: { label: "Aligned", color: "var(--ink3)" },
};

export const DIRECTION_META: Record<
  DivergenceDirection,
  { label: string; color: string; arrow: string }
> = {
  widening: { label: "widening", color: "var(--high)", arrow: "▲" },
  narrowing: { label: "narrowing", color: "var(--rec)", arrow: "▼" },
  steady: { label: "steady", color: "var(--ctx)", arrow: "•" },
};

/** The two SCORED pillars currently furthest apart — the spread basis. Null when
 *  fewer than two pillars are scored (no spread can be read). */
export function pickScoredPair(pillars: PillarView[]): { high: PillarKey; low: PillarKey } | null {
  const scored = pillars.filter((p) => p.state === "scored");
  if (scored.length < 2) return null;
  let high = scored[0];
  let low = scored[0];
  for (const p of scored) {
    if (p.subtotal > high.subtotal) high = p;
    if (p.subtotal < low.subtotal) low = p;
  }
  return { high: high.pillar, low: low.pillar };
}

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

export function divergenceConfig(high: PillarKey, low: PillarKey): DivergenceConfig {
  if (high === "ownership" || low === "ownership") return "ownership";
  if (high === "market") return "price_ahead";
  if (low === "market") return "value";
  return "mixed";
}

export function divergenceFlag(gap: number): DivergenceFlag {
  return gap >= DIVERGENCE_WIDE ? "wide" : gap >= DIVERGENCE_NOTABLE ? "notable" : "none";
}

export function directionOf(gapStart: number, gapEnd: number): DivergenceDirection {
  const d = gapEnd - gapStart;
  return d > GAP_EPS ? "widening" : d < -GAP_EPS ? "narrowing" : "steady";
}

// ── the promoted read — config × direction, encoding the asymmetry ──────────────

export function buildDivergenceRead(
  config: DivergenceConfig,
  direction: DivergenceDirection,
  high: PillarKey,
  low: PillarKey,
): PromotedRead {
  const H = label(high);
  const L = label(low);

  if (config === "none") {
    return {
      tone: "neutral",
      title: "Pillars in agreement.",
      body: "All scored pillars sit close — no notable divergence this window. Nothing is pulling against the whole; the score stands on aligned parts.",
    };
  }

  if (config === "value") {
    if (direction === "narrowing")
      return {
        tone: "rec",
        title: "A value gap closing — price rising to meet it.",
        body: `${H} held while ${L} climbed back toward it; the gap is narrowing, and it's price doing the moving — the healthy resolution of a value divergence. Still a read, not a buy.`,
      };
    if (direction === "widening")
      return {
        tone: "ctx",
        title: "Sound fundamentals, a de-rated price.",
        body: `${H} held strong while ${L} fell away — the value configuration. Historically one of the more robust divergences in the model, but a state to investigate, not a buy.`,
      };
    return {
      tone: "ctx",
      title: "A value gap, holding.",
      body: `${H} leads a lagging ${L} and the gap is steady — the robust configuration, not yet resolving either way.`,
    };
  }

  if (config === "price_ahead") {
    const note = "The market can hold this a long time — the bill is due, never that it's due today.";
    if (direction === "narrowing")
      return {
        tone: "ctx",
        title: "A price premium compressing.",
        body: `${H} is giving back its lead toward ${L} — the premium is narrowing. The caution easing, but still a read, not a green light.`,
      };
    if (direction === "widening")
      return {
        tone: "high",
        title: "Price has run ahead of cooling fundamentals.",
        body: `${H} pulled away as ${L} softened — the gap has widened. A masked caution: historically the reading the market defers longest, so look for the catalyst rather than the date.`,
        note,
      };
    return {
      tone: "high",
      title: "Price sits ahead of the business.",
      body: `${H} leads ${L} and the gap is holding — deferred, not escaped.`,
      note,
    };
  }

  if (config === "ownership") {
    const ownersLag = low === "ownership"; // owners trail the rest
    if (ownersLag) {
      if (direction === "narrowing")
        return {
          tone: "ctx",
          title: "Owners returning toward the floor.",
          body: `Ownership is climbing back toward ${H} — the gap is closing on the ownership side. A constructive turn in the flow, but read it against why.`,
        };
      return {
        tone: "high",
        title: "Owners stepping back from a holding floor.",
        body: `${H} held while Ownership drifted down — institutions trimming a business the numbers still rate. A flow tell to understand before the rest of the picture follows.`,
      };
    }
    // owners lead (building ahead of the rest)
    if (direction === "narrowing")
      return {
        tone: "ctx",
        title: "An ownership lead narrowing.",
        body: `Ownership's lead over ${L} is compressing — the rest catching up, or owners easing. Read it against why.`,
      };
    return {
      tone: "ctx",
      title: "Owners building ahead of the tape.",
      body: `Ownership pulled ahead of ${L} — smart money accumulating while the rest lags. A tell to investigate, not a signal to follow.`,
    };
  }

  // mixed — two fundamental pillars apart
  return {
    tone: "ctx",
    title: `${H} and ${L} disagree.`,
    body: `Two fundamental pillars have separated — ${H} leads ${L}, and the gap is ${DIRECTION_META[direction].label}. An internal spread to read against why before leaning on the composite.`,
  };
}

// ── chips ───────────────────────────────────────────────────────────────────────

export function buildDivergenceChips(
  verdict: VerdictSection,
  gap: number,
  config: DivergenceConfig,
  direction: DivergenceDirection,
): ChipSpec[] {
  const band = BAND_META[verdict.label.band];
  const dir = DIRECTION_META[direction];
  return [
    { label: `${band.label} · ${Math.round(verdict.composite)}`, dot: band.cssVar, color: "var(--ink2)" },
    { label: `gap ${gap.toFixed(0)} · ${dir.label}`, color: dir.color },
    { label: CONFIG_META[config].label, color: CONFIG_META[config].color },
  ];
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
  config: DivergenceConfig,
  direction: DivergenceDirection,
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

  // The asymmetric read — config decides the meaning, direction the urgency.
  const goodLeg = config === "value" || config === "none";
  let means: string;
  if (config === "value") {
    means =
      direction === "narrowing"
        ? "The tension is resolving upward — the healthy direction of travel. Still a read, not a buy."
        : "Robust on average, but still a read: the market can stay cheap. This is where to look, not a signal to act.";
  } else if (config === "price_ahead") {
    means =
      direction === "narrowing"
        ? "The premium is unwinding — caution easing, but read it against why."
        : "Deferred, not escaped. The market can hold this a long time; the bill is due, never that it's due today.";
  } else if (config === "ownership") {
    means = "A flow tell to investigate, never to follow. Read it against why, not as a verdict.";
  } else if (config === "none") {
    means = "No tension to resolve — the scored pillars agree. Nothing here pulls against the whole.";
  } else {
    means = "An internal fundamentals split — understand which pillar is right before leaning on the composite.";
  }

  return [
    { tone: bothMoved && config === "price_ahead" ? "warn" : goodLeg ? "good" : "warn", title: "Whose move?", body: whose },
    { tone: goodLeg ? "good" : "warn", title: "What it means", body: means },
  ];
}

export { label as pillarLabel, color as pillarColor };
