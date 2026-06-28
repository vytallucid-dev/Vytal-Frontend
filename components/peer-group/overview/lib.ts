// PG Overview tab — pure derivations (no JSX). Concentration (field shape), the cap/equal-
// weighted price composite (with HONEST short-history exclusion), and the cross-dimensional
// headline row. Real-or-null throughout; nothing faked or zero-filled.

import type { StockPriceView } from "@/types/price";
import type { FundamentalsView } from "@/types/fundamentals";
import type { LabelBand } from "@/types/health";
import type { StandingsRow } from "@/components/peer-group/standings-table";

export const sum = (xs: number[]) => xs.reduce((s, v) => s + v, 0);

export function median(values: (number | null)[]): number | null {
  const xs = values.filter((v): v is number => v != null).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

// ── Concentration (field shape) ──────────────────────────────────────────────────────
export interface ConcentrationSlice {
  symbol: string;
  mcap: number;
  share: number; // 0..1 of aggregate
}
export interface Concentration {
  aggregate: number; // Σ member mcap (₹ Cr)
  withData: number;
  total: number;
  slices: ConcentrationSlice[]; // largest → smallest
  leaderShare: number | null; // top member's share
  /** how many of the largest names make up ≥ 50% / ≥ 80% of the field. */
  count50: number | null;
  count80: number | null;
}

export function concentration(
  rows: { symbol: string; mcap: number | null }[],
): Concentration {
  const withMcap = rows.filter((r): r is { symbol: string; mcap: number } => r.mcap != null && r.mcap > 0);
  const aggregate = sum(withMcap.map((r) => r.mcap));
  const slices: ConcentrationSlice[] = withMcap
    .map((r) => ({ symbol: r.symbol, mcap: r.mcap, share: aggregate > 0 ? r.mcap / aggregate : 0 }))
    .sort((a, b) => b.mcap - a.mcap);

  let cum = 0;
  let count50: number | null = null;
  let count80: number | null = null;
  slices.forEach((s, i) => {
    cum += s.share;
    if (count50 == null && cum >= 0.5) count50 = i + 1;
    if (count80 == null && cum >= 0.8) count80 = i + 1;
  });

  return {
    aggregate,
    withData: withMcap.length,
    total: rows.length,
    slices,
    leaderShare: slices[0]?.share ?? null,
    count50,
    count80,
  };
}

// ── Cross-dimensional headline row ─────────────────────────────────────────────────────
export interface HeadlineRow extends StandingsRow {
  composite: number | null;
  labelBand: LabelBand | null;
  marketCap: number | null;
  keyMetric: number | null;
  pe: number | null;
  return1y: number | null;
}

/** P/E from price + fundamentals annual EPS (any family). Null if EPS ≤ 0 / missing. */
export function computePE(price: StockPriceView | null, fund: FundamentalsView | null): number | null {
  const px = price?.current.price ?? null;
  const eps =
    fund?.nonFinancial?.annual?.basicEps ??
    fund?.banking?.annual?.basicEps ??
    fund?.nbfc?.annual?.basicEps ??
    null;
  if (px == null || eps == null || eps <= 0) return null;
  return Math.round((px / eps) * 100) / 100;
}

// ── Field price composite (cap- or equal-weighted, rebased to 100) ─────────────────────
export type Weighting = "cap" | "equal";

export interface CompositeMemberInput {
  symbol: string;
  mcap: number | null;
  series: { date: string; close: number }[]; // oldest → newest
}

export interface CompositeResult {
  points: { t: number; v: number }[]; // rebased to 100 at window start
  included: string[];
  excluded: string[];
  weighting: Weighting;
}

const DAY = 86_400_000;

/** Build the field's rebased price composite over a trailing window.
 *  HONEST: a member whose series doesn't reach the window start is EXCLUDED (and reported),
 *  never zero-filled. Forward-fills each member's own closes across non-trading gaps only. */
export function buildComposite(
  members: CompositeMemberInput[],
  windowDays: number, // Infinity → MAX (common start across members)
  weighting: Weighting,
): CompositeResult {
  const usable = members
    .map((m) => ({
      symbol: m.symbol,
      mcap: m.mcap,
      pts: m.series
        .map((p) => ({ t: Date.parse(p.date), close: p.close }))
        .filter((p) => Number.isFinite(p.t) && p.close > 0)
        .sort((a, b) => a.t - b.t),
    }))
    .filter((m) => m.pts.length >= 2 && (weighting === "equal" || (m.mcap != null && m.mcap > 0)));

  if (usable.length === 0)
    return { points: [], included: [], excluded: members.map((m) => m.symbol), weighting };

  const lastT = Math.max(...usable.map((m) => m.pts[m.pts.length - 1].t));
  let cutoff: number;
  if (Number.isFinite(windowDays)) {
    cutoff = lastT - windowDays * DAY;
  } else {
    // MAX → start where every usable member already has data (the latest of their earliest).
    cutoff = Math.max(...usable.map((m) => m.pts[0].t));
  }
  const tolerance = Number.isFinite(windowDays) ? Math.max(7, windowDays * 0.05) * DAY : 0;

  const included: typeof usable = [];
  const excluded: string[] = [];
  for (const m of usable) {
    // member must reach back to the window start to be part of the field path.
    if (m.pts[0].t <= cutoff + tolerance) included.push(m);
    else excluded.push(m.symbol);
  }
  // members dropped for no series / no mcap are excluded too.
  for (const m of members) {
    if (!usable.find((u) => u.symbol === m.symbol) && !excluded.includes(m.symbol))
      excluded.push(m.symbol);
  }

  if (included.length < 3)
    return { points: [], included: included.map((m) => m.symbol), excluded, weighting };

  // each member: clip to window, anchor (rebase base) = first in-window close.
  const prepared = included.map((m) => {
    const inWin = m.pts.filter((p) => p.t >= cutoff);
    return { symbol: m.symbol, mcap: m.mcap ?? 0, pts: inWin, base: inWin[0].close, ptr: 0 };
  });

  // union grid of in-window dates, ascending.
  const gridSet = new Set<number>();
  prepared.forEach((m) => m.pts.forEach((p) => gridSet.add(p.t)));
  let grid = [...gridSet].sort((a, b) => a - b);
  // cap path length for a clean SVG.
  if (grid.length > 240) {
    const step = Math.ceil(grid.length / 240);
    grid = grid.filter((_, i) => i % step === 0 || i === grid.length - 1);
  }

  const points: { t: number; v: number }[] = [];
  for (const t of grid) {
    let wsum = 0;
    let vsum = 0;
    for (const m of prepared) {
      while (m.ptr + 1 < m.pts.length && m.pts[m.ptr + 1].t <= t) m.ptr++;
      const pt = m.pts[m.ptr];
      if (pt.t > t) continue; // member hasn't started yet at this date
      const rebased = (pt.close / m.base) * 100;
      const w = weighting === "cap" ? m.mcap : 1;
      wsum += w;
      vsum += w * rebased;
    }
    if (wsum > 0) points.push({ t, v: vsum / wsum });
  }

  return { points, included: included.map((m) => m.symbol), excluded, weighting };
}

export interface WindowOption {
  key: string;
  label: string;
  days: number;
}
export const FIELD_WINDOWS: WindowOption[] = [
  { key: "1M", label: "1M", days: 30 },
  { key: "6M", label: "6M", days: 182 },
  { key: "1Y", label: "1Y", days: 365 },
  { key: "3Y", label: "3Y", days: 1095 },
  { key: "MAX", label: "Max", days: Infinity },
];
