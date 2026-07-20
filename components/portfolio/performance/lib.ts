// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO PERFORMANCE — pure derivations over NAV / TWR / benchmark / ledger. No JSX.
//
// THE LAW OF THIS SURFACE: returns & accountability ONLY — there is ZERO health here (no
// health field is read, imported, or derived anywhere in this file). Everything is P&L,
// return, or attribution. Window returns reuse the SAME cash-flow-neutral (TWR) basis the
// value chart uses, so a deposit never reads as return; the benchmark stays TWR-honest.
// Read-only: the series are truth, selectors slice, nothing is recomputed.
// ─────────────────────────────────────────────────────────────────────────────
import { UNCLASSIFIED, holdingAssetClassKey, holdingClass } from "../lib";
import { assetClassLabel, isCouponBearing } from "@/lib/asset-class";
import type { BenchmarkPoint, Holding, NavPoint, Transaction, TwrPoint } from "@/types/portfolio";

export type PerfPeriodKey = "1M" | "6M" | "1Y" | "3Y" | "4Y" | "All" | "Custom";

/** The numeric trailing-window presets (Custom is a date-range, "All" the full series — both handled
 *  separately in rangeForPeriod). "4Y" is the ceiling on a blended book; "All" is offered only when
 *  meta.maxRange says the series honestly reaches the full history (a stock-only book). */
export const PERF_PERIODS: { key: Exclude<PerfPeriodKey, "Custom" | "All">; days: number }[] = [
  { key: "1M", days: 30 },
  { key: "6M", days: 182 },
  { key: "1Y", days: 365 },
  { key: "3Y", days: 1095 },
  { key: "4Y", days: 1461 },
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

/** Round a positive magnitude up to a clean axis bound (1/2/5 × 10ⁿ), so a chart's top/edge gridline
 *  lands on a readable ₹ figure. Shared by the per-account chart and the centered-zero P&L chart. */
export function niceNum(v: number): number {
  if (v <= 0) return 0;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

/** The window (start/end ISO) for a period selection, anchored to the series' last date.
 *  All → the full range (both null); a numeric preset → a trailing window; Custom → the user's
 *  date inputs (clamped by caller). An unknown key falls back to the full range. */
export function rangeForPeriod(series: NavPoint[], period: PerfPeriodKey, custom: DateRange): DateRange {
  if (period === "Custom") return { start: custom.start || null, end: custom.end || null };
  if (period === "All") return { start: null, end: null };
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

// ── grouped P&L attribution — which GROUPS made/lost money, by unrealized ₹. Pure P&L,
//    grouped by a caller-chosen key (sector cut or class cut); NO health input of any kind. ────
export interface PnlGroup {
  label: string;
  pnl: number; // Σ unrealized P&L (₹) across the group's priced holdings
  invested: number;
  returnPct: number | null;
  /** Class cut only: this bucket is a coupon-bearing debt class (bond/G-Sec/SGB), so its P&L is a
   *  PRICE return — coupon income isn't tracked. Undefined on the sector cut. */
  couponBearing?: boolean;
}

/** One pass, either cut. `keyOf` buckets a holding; `metaOf` turns a bucket key into its display
 *  label (+ optional couponBearing flag). Priced/unpriced is not the axis here — a holding with no
 *  unrealizedPnl (unpriced) simply carries no P&L to attribute, so it's skipped. */
function groupPnl(
  holdings: Holding[],
  keyOf: (h: Holding) => string,
  metaOf?: (key: string) => { label: string; couponBearing?: boolean },
): PnlGroup[] {
  const by = new Map<string, { pnl: number; invested: number }>();
  for (const h of holdings) {
    if (h.unrealizedPnl == null) continue;
    const key = keyOf(h);
    const e = by.get(key) ?? { pnl: 0, invested: 0 };
    e.pnl += h.unrealizedPnl;
    e.invested += h.investedValue;
    by.set(key, e);
  }
  return [...by.entries()]
    .map(([key, v]) => {
      const meta = metaOf ? metaOf(key) : { label: key };
      return { label: meta.label, couponBearing: meta.couponBearing, pnl: v.pnl, invested: v.invested, returnPct: v.invested > 0 ? (v.pnl / v.invested) * 100 : null };
    })
    .sort((a, b) => b.pnl - a.pnl);
}

/** The SECTOR cut — stocks by sector; a non-stock has no sector, so it folds to its class label
 *  (exactly the sector cut the allocation donut uses via holdingClass). */
export function sectorPnl(holdings: Holding[]): PnlGroup[] {
  return groupPnl(holdings, holdingClass);
}

/** The CLASS cut — the return-side companion to the value-by-class on Holdings. EVERY stock buckets
 *  as "Stock"; funds/bonds/ETFs/REITs bucket by their asset class. Labels come from the one
 *  assetClassLabel vocabulary; a coupon-bearing debt bucket is flagged so the UI can note its P&L is
 *  price-return only. */
export function classPnl(holdings: Holding[]): PnlGroup[] {
  return groupPnl(holdings, holdingAssetClassKey, (key) =>
    key === UNCLASSIFIED ? { label: UNCLASSIFIED } : { label: assetClassLabel(key), couponBearing: isCouponBearing(key) },
  );
}

// ── PER-ACCOUNT VALUE — invested vs current, per account, from the RAW holdings union ─────────────
//
// The raw /me/holdings feed is per-(account, instrument): RELIANCE-in-two-accounts is TWO rows, each
// with its own accountId + investedValue + marketValue. So grouping by accountId splits it correctly
// (Grow 1 gets its ₹, demo gets its ₹) — the OPPOSITE of the Holdings tab's entity-combine, and the
// point of this chart. Consume the raw array; never aggregateHoldings.
//
// SAME-POPULATION RULE (the honesty that makes the two bars comparable): marketValue is null on an
// unpriced holding, investedValue is not. If invested summed every row but current excluded the
// unpriced ones, the bars would measure different populations and the comparison would lie. So a
// PRICED row feeds BOTH sums and an unpriced row feeds NEITHER — the unpriced cost is surfaced
// separately ("₹X not shown"), never folded silently into invested. `current` is therefore Σ
// marketValue over priced rows — byte-for-byte the account-detail page's "Value" (accountStatsMap),
// so the chart's current bar matches that page exactly rather than deriving a second total.
export interface AccountValueRow {
  accountId: string;
  accountName: string;
  invested: number; // Σ investedValue over PRICED rows only
  current: number; // Σ marketValue over the SAME priced rows — matches the account-detail "Value"
  changeValue: number; // current − invested (same population)
  changePct: number | null; // null when there's no priced cost basis to divide by
  dayChangeValue: number | null; // Σ dayChangeValue where present; null when no priced row carries one (e.g. NAV-priced funds)
  pricedCount: number;
  unpricedCount: number; // holdings in this account we couldn't price (excluded from BOTH bars)
  unpricedInvested: number; // Σ investedValue of those unpriced rows — the "₹X not shown" figure
}

export interface AccountValueBreakdown {
  rows: AccountValueRow[]; // chartable accounts (≥1 priced holding), current-value desc
  unpricedOnlyCount: number; // accounts that hold instruments but none we could price → not chartable
}

export function accountValueRows(holdings: Holding[]): AccountValueBreakdown {
  const by = new Map<
    string,
    { name: string; invested: number; current: number; day: number; dayHas: boolean; priced: number; unpriced: number; unpricedInvested: number }
  >();
  for (const h of holdings) {
    if (!h.accountId) continue; // no account dimension → can't place it (the live wire always carries it)
    const e = by.get(h.accountId) ?? { name: h.accountName || "Unnamed account", invested: 0, current: 0, day: 0, dayHas: false, priced: 0, unpriced: 0, unpricedInvested: 0 };
    if (!e.name && h.accountName) e.name = h.accountName;
    if (h.marketValue != null) {
      e.invested += h.investedValue;
      e.current += h.marketValue;
      e.priced += 1;
      if (h.dayChangeValue != null) {
        e.day += h.dayChangeValue;
        e.dayHas = true;
      }
    } else {
      e.unpriced += 1;
      e.unpricedInvested += h.investedValue;
    }
    by.set(h.accountId, e);
  }

  const rows: AccountValueRow[] = [];
  let unpricedOnlyCount = 0;
  for (const [accountId, e] of by) {
    if (e.priced === 0) {
      unpricedOnlyCount += 1; // has holdings, but nothing we can value — no honest bar to draw
      continue;
    }
    const changeValue = e.current - e.invested;
    rows.push({
      accountId,
      accountName: e.name,
      invested: e.invested,
      current: e.current,
      changeValue,
      changePct: e.invested > 0 ? (changeValue / e.invested) * 100 : null,
      dayChangeValue: e.dayHas ? e.day : null,
      pricedCount: e.priced,
      unpricedCount: e.unpriced,
      unpricedInvested: e.unpricedInvested,
    });
  }
  rows.sort((a, b) => b.current - a.current); // largest current value first
  return { rows, unpricedOnlyCount };
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
