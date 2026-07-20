/**
 * Formatting + copy helpers specific to the fund/ETF detail page. Kept separate from the
 * general `lib/format.ts` because these encode fund-domain facts (fraction-vs-already-percent
 * columns, the omission-ledger lookup, the rolling-window decline threshold) that don't belong
 * on the shared formatter.
 */
import type { Omissions, OmissionEntry } from "@/types/fund";

/** mf_analytics stores returns/vol/drawdown as FRACTIONS (0.152345 = +15.2345%) but
 *  rolling1y.pctPositive and rank.pct* are already on a 0–100 scale — see schema.prisma's
 *  own doc comments. Mixing the two up silently divides or multiplies a figure by 100. */
export function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** A fraction (0.184 → "+18.4%"). Use for returns, vol, drawdown, alpha. */
export function fmtFractionPct(v: number | null, decimals = 1, withSign = true): string | null {
  if (v === null) return null;
  const pct = v * 100;
  const sign = withSign && pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(decimals)}%`;
}

/** A value already on a 0–100 scale (rolling pctPositive, rank percentile). */
export function fmtScalePct(v: number | null, decimals = 0): string | null {
  if (v === null) return null;
  return `${v.toFixed(decimals)}%`;
}

/** Sharpe / Sortino / beta — dimensionless ratios. */
export function fmtRatio(v: number | null, decimals = 2): string | null {
  if (v === null) return null;
  return v.toFixed(decimals);
}

export function fmtOrdinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/** NAV / analytics date — never render a date-bearing figure without one; this is the shared
 *  formatter every caller uses so the format never drifts field to field. */
export function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function omit(omissions: Omissions | undefined, key: string): OmissionEntry | undefined {
  return omissions?.[key];
}

// ── THE TRAP (spec §4.1 / rule 2): pctPositive publishes at n = 1. Live distribution
//    (measured against mf_analytics.roll_1y_n, filled=8,158): min 1, p01 6, p05 54, p10 159,
//    p25 592, median 1,002, max 1,513. 252 ≈ one full trading year of ADDITIONAL rolling
//    observations beyond the first — i.e. the fund needs roughly two years of NAV history
//    before "positive in X% of rolling 1-year windows" leads the hero rather than restating
//    one window with a few days of jitter. This excludes 1,135 of 8,158 (13.9%) funds that do
//    have *some* rolling data — the ones young enough that the windows are not yet
//    meaningfully independent — while keeping the vast majority (including the median-1,002
//    and the prototype's own n=1,002 example) intact.
export const ROLL_1Y_MIN_N = 252;

export function hasEnoughRolling(n: number | null): n is number {
  return n !== null && n >= ROLL_1Y_MIN_N;
}

// ── plain-English glosses for the risk vocabulary retail investors don't carry (spec §3.5:
//    "never a verdict — the number and what it measures, nothing more"). ──
export const RISK_GLOSS = {
  volatility:
    "How much this fund's return has swung year to year, annualised. Higher = a bumpier ride for the same average return.",
  sharpe:
    "Return earned per unit of total risk taken (return above the risk-free rate, divided by volatility). Higher means more return for the ups and downs endured — it does not judge whether the ride was worth it.",
  sortino:
    "Like Sharpe, but only counts the downside swings — it doesn't penalise a fund for swinging up. Higher means more return per unit of downside risk.",
  maxDrawdown:
    "The largest peak-to-trough fall in this window — the deepest paper loss you'd have sat through before it recovered (or before the window ended).",
  beta:
    "How much this fund moves for every 1% move in its benchmark. 1.0 tracks the benchmark's swings exactly; above 1 amplifies them, below 1 dampens them.",
  alpha:
    "The return this fund earned above what its beta to the benchmark would predict — the part of the return not explained by simply following the index.",
  trackingError:
    "How far this fund's return has wandered from its benchmark's, annualised. Lower means it hugs the index closely; higher means it diverges, for better or worse.",
} as const;

// ── chart §3.3 / §6.3 — the declined-chart sentence is the product, not an error message.
//    idcw_nav_not_total_return is the only code the fold ever emits down this path today
//    (mf-distributions.ts declineMetrics call sites), but the fallback keeps this honest if
//    that ever changes rather than mis-captioning an unknown code as this one. ──
export function chartDeclineText(reason: string): string {
  if (reason === "idcw_nav_not_total_return") {
    return (
      "This plan pays its gains out as it earns them, so its NAV drops every time it pays. " +
      "A chart drawn from that series would show the fund falling on the days it handed you " +
      "money — and nobody publishes what it paid. So we won't draw one."
    );
  }
  return `This plan's series can't be honestly charted right now (reason: ${reason}).`;
}
