/**
 * Return calculator math (spec §3.9 / §3.8 of SPEC_fund_detail_page_v1.md) — a RECORD of the
 * past, never a projection. Every number here is derived from the series already fetched for
 * the page's chart (series_scheme_code, split-adjusted, twin-resolved) — no raw mfapi fetch,
 * no forward projection, no target-solving, no comparison to another fund.
 */

export interface CalcPoint {
  date: string; // YYYY-MM-DD
  nav: number;
}

export interface HorizonOption {
  key: string;
  label: string;
  days: number;
}

/** Candidate horizons — only ever OFFERED when the series genuinely spans that far. A fund
 *  with two years of history shows two years' worth of horizons; never padded, never
 *  extrapolated, never annualised into a longer claim (spec §3.8). */
const CANDIDATE_HORIZONS: HorizonOption[] = [
  { key: "6m", label: "6 months", days: 182 },
  { key: "1y", label: "1 year", days: 365 },
  { key: "3y", label: "3 years", days: 365 * 3 },
  { key: "5y", label: "5 years", days: 365 * 5 },
];

export function availableHorizons(points: CalcPoint[]): HorizonOption[] {
  if (points.length < 2) return [];
  const spanDays =
    (new Date(points[points.length - 1].date).getTime() - new Date(points[0].date).getTime()) / 86_400_000;
  return CANDIDATE_HORIZONS.filter((h) => spanDays >= h.days);
}

function sliceLastDays(points: CalcPoint[], days: number): CalcPoint[] {
  if (points.length === 0) return [];
  const endTime = new Date(points[points.length - 1].date).getTime();
  const cutoff = endTime - days * 86_400_000;
  return points.filter((p) => new Date(p.date).getTime() >= cutoff);
}

export interface CalcResult {
  invested: number;
  finalValue: number;
  lowestValue: number;
  lowestDate: string;
  returnPct: number; // total return over the window — plain, not annualised
}

export function computeOneTime(points: CalcPoint[], amount: number, horizonDays: number): CalcResult | null {
  const slice = sliceLastDays(points, horizonDays);
  if (slice.length < 2 || amount <= 0) return null;

  const startNav = slice[0].nav;
  if (startNav <= 0) return null;
  const units = amount / startNav;

  let lowest = amount;
  let lowestDate = slice[0].date;
  for (const p of slice) {
    const v = units * p.nav;
    if (v < lowest) {
      lowest = v;
      lowestDate = p.date;
    }
  }
  const finalValue = units * slice[slice.length - 1].nav;
  return { invested: amount, finalValue, lowestValue: lowest, lowestDate, returnPct: (finalValue / amount - 1) * 100 };
}

/** Roughly-monthly investment dates spanning the slice — spaced 30 days apart from the first
 *  point. Each is EXECUTED on the nearest available trading day at or after it (never an
 *  interpolated NAV that doesn't exist in the published series). */
function pickMonthlyDates(slice: CalcPoint[]): number[] {
  const start = new Date(slice[0].date).getTime();
  const end = new Date(slice[slice.length - 1].date).getTime();
  const dates: number[] = [];
  for (let t = start; t <= end; t += 30 * 86_400_000) dates.push(t);
  return dates;
}

export function computeSip(points: CalcPoint[], monthlyAmount: number, horizonDays: number): CalcResult | null {
  const slice = sliceLastDays(points, horizonDays);
  if (slice.length < 2 || monthlyAmount <= 0) return null;

  const investDates = pickMonthlyDates(slice);
  if (investDates.length === 0) return null;

  let units = 0;
  let invested = 0;
  let lowest = Infinity;
  let lowestDate = slice[0].date;
  let investIdx = 0;

  for (const p of slice) {
    const t = new Date(p.date).getTime();
    while (investIdx < investDates.length && t >= investDates[investIdx]) {
      if (p.nav > 0) {
        units += monthlyAmount / p.nav;
        invested += monthlyAmount;
      }
      investIdx++;
    }
    if (units > 0) {
      const v = units * p.nav;
      if (v < lowest) {
        lowest = v;
        lowestDate = p.date;
      }
    }
  }
  if (invested === 0) return null;
  const finalValue = units * slice[slice.length - 1].nav;
  return {
    invested,
    finalValue,
    lowestValue: lowest === Infinity ? invested : lowest,
    lowestDate,
    returnPct: (finalValue / invested - 1) * 100,
  };
}
