// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO PERFORMANCE — pure derivations over NAV / TWR / benchmark / ledger. No JSX.
//
// THE LAW OF THIS SURFACE: returns & accountability ONLY — there is ZERO health here (no
// health field is read, imported, or derived anywhere in this file). Everything is P&L,
// return, or attribution. Window returns reuse the SAME cash-flow-neutral (TWR) basis the
// value chart uses, so a deposit never reads as return; the benchmark stays TWR-honest.
// Read-only: the series are truth, selectors slice, nothing is recomputed.
// ─────────────────────────────────────────────────────────────────────────────
import type { BenchmarkPoint, Holding, NavPoint, Transaction, TwrPoint } from "@/types/portfolio";

export type PerfPeriodKey = "1M" | "6M" | "1Y" | "3Y" | "All" | "Custom";

/** The period presets that drive the tab (Custom is a date-range, handled separately). */
export const PERF_PERIODS: { key: Exclude<PerfPeriodKey, "Custom">; days: number | null }[] = [
  { key: "1M", days: 30 },
  { key: "6M", days: 182 },
  { key: "1Y", days: 365 },
  { key: "3Y", days: 1095 },
  { key: "All", days: null },
];

export interface DateRange {
  start: string | null;
  end: string | null;
}

export function isoMinusDays(iso: string, days: number): string {
  const dt = new Date(iso + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
}

/** The window (start/end ISO) for a period selection, anchored to the series' last date.
 *  All → the full range (both null); Custom → the user's date inputs (clamped by caller). */
export function rangeForPeriod(series: NavPoint[], period: PerfPeriodKey, custom: DateRange): DateRange {
  if (period === "Custom") return { start: custom.start || null, end: custom.end || null };
  const days = PERF_PERIODS.find((p) => p.key === period)?.days ?? null;
  if (days == null || series.length === 0) return { start: null, end: null };
  return { start: isoMinusDays(series[series.length - 1].date, days), end: null };
}

/** Slice a NAV series to a window (inclusive). Honest-short: a window younger than the
 *  history simply yields fewer points — never padded. */
export function sliceNav(series: NavPoint[], range: DateRange): NavPoint[] {
  let w = series;
  if (range.start) w = w.filter((p) => p.date >= range.start!);
  if (range.end) w = w.filter((p) => p.date <= range.end!);
  return w;
}

/** Carry-forward align a sorted series onto `dates`: each date takes the last value ≤ it
 *  (a gap reuses the prior value; null until the first). Same rule the value chart uses. */
function carryForward<T extends { date: string }>(pts: T[], val: (p: T) => number, dates: string[]): (number | null)[] {
  let j = 0;
  let last: number | null = null;
  return dates.map((d) => {
    while (j < pts.length && pts[j].date <= d) {
      last = val(pts[j]);
      j++;
    }
    return last;
  });
}

// ── window returns — TIME-WEIGHTED (cash-flow-neutral) portfolio return over the window,
//    the benchmark return over the same window, and the alpha between them. ──────────────
export interface WindowReturns {
  portfolioPct: number | null; // time-weighted return over the window
  niftyPct: number | null; // benchmark (Nifty 50) return over the window
  alphaPct: number | null; // portfolio − benchmark
  startDate: string | null;
  endDate: string | null;
  points: number;
}

export function windowReturns(
  windowDates: string[],
  twr: TwrPoint[] | undefined,
  nifty: BenchmarkPoint[] | undefined,
): WindowReturns {
  const startDate = windowDates[0] ?? null;
  const endDate = windowDates.length ? windowDates[windowDates.length - 1] : null;
  const empty: WindowReturns = { portfolioPct: null, niftyPct: null, alphaPct: null, startDate, endDate, points: windowDates.length };
  if (windowDates.length < 2 || !twr?.length) return empty;

  const twrAt = carryForward(twr, (p) => p.twrIndex, windowDates);
  const twr0 = twrAt[0];
  const twrN = twrAt[twrAt.length - 1];
  if (twr0 == null || twrN == null || twr0 === 0) return empty;
  const portfolioPct = (twrN / twr0 - 1) * 100;

  let niftyPct: number | null = null;
  if (nifty?.length) {
    const nAt = carryForward(nifty, (p) => p.close, windowDates);
    const n0 = nAt[0];
    const nN = nAt[nAt.length - 1];
    if (n0 != null && nN != null && n0 !== 0) niftyPct = (nN / n0 - 1) * 100;
  }

  return {
    portfolioPct,
    niftyPct,
    alphaPct: niftyPct == null ? null : portfolioPct - niftyPct,
    startDate,
    endDate,
    points: windowDates.length,
  };
}

// ── best / worst single trading day within the window (from the TWR series, so a deposit
//    day never masquerades as a return day). ────────────────────────────────────────────
export interface DayReturn {
  date: string;
  pct: number;
}
export function bestWorstDay(windowDates: string[], twr: TwrPoint[] | undefined): { best: DayReturn; worst: DayReturn } | null {
  if (windowDates.length < 2 || !twr?.length) return null;
  const twrAt = carryForward(twr, (p) => p.twrIndex, windowDates);
  let best: DayReturn | null = null;
  let worst: DayReturn | null = null;
  for (let i = 1; i < windowDates.length; i++) {
    const a = twrAt[i - 1];
    const b = twrAt[i];
    if (a == null || b == null || a === 0) continue;
    const pct = (b / a - 1) * 100;
    if (best == null || pct > best.pct) best = { date: windowDates[i], pct };
    if (worst == null || pct < worst.pct) worst = { date: windowDates[i], pct };
  }
  return best && worst ? { best, worst } : null;
}

// ── sector P&L attribution — which SECTORS made/lost money, by unrealized ₹. Pure P&L,
//    grouped by sector; NO health input of any kind. ──────────────────────────────────
export interface SectorPnl {
  sector: string;
  pnl: number; // Σ unrealized P&L (₹) across the sector's priced holdings
  invested: number;
  returnPct: number | null;
}
export function sectorPnl(holdings: Holding[]): SectorPnl[] {
  const by = new Map<string, { pnl: number; invested: number }>();
  for (const h of holdings) {
    if (h.unrealizedPnl == null) continue;
    const key = h.sector ?? "Unclassified";
    const e = by.get(key) ?? { pnl: 0, invested: 0 };
    e.pnl += h.unrealizedPnl;
    e.invested += h.investedValue;
    by.set(key, e);
  }
  return [...by.entries()]
    .map(([sector, v]) => ({ sector, pnl: v.pnl, invested: v.invested, returnPct: v.invested > 0 ? (v.pnl / v.invested) * 100 : null }))
    .sort((a, b) => b.pnl - a.pnl);
}

/** Total dividend income from the ledger (₹, net of any recorded charge). */
export function dividendIncome(txns: Transaction[]): number {
  return txns.filter((t) => t.type === "dividend").reduce((s, t) => s + (t.price ?? 0) - (t.fees ?? 0), 0);
}

/** The human "why there's no XIRR yet" line for each honest-null state. */
export const XIRR_STATE_NOTE: Record<string, string> = {
  empty: "No transactions yet.",
  single_cashflow: "Needs at least one buy and a current value.",
  no_sign_change: "Needs both invested capital and a return to solve.",
  insufficient_history: "History is too short to annualize honestly yet.",
  non_convergent: "Couldn't resolve a rate on this cashflow pattern.",
};
