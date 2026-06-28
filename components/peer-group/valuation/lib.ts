// PG Valuation tab — pure derivations (no JSX). Computes relative-valuation multiples per
// member from the per-stock price + fundamentals reads. FACTUAL only: every value is
// real-or-null, negative-earnings / missing → null (honest "—"), nothing fabricated. NO
// health framing, NO targets, NO verdicts — the multiples are facts, the user judges.

import type { StockPriceView } from "@/types/price";
import type { FundamentalsView, IndustryFamily } from "@/types/fundamentals";
import type { StandingsRow } from "@/components/peer-group/standings-table";

/** One member's valuation standings row. Multiples are null when their inputs are absent
 *  or non-meaningful (EPS ≤ 0 → no P/E; financials → no EV/EBITDA). */
export interface ValuationRow extends StandingsRow {
  family: IndustryFamily | null;
  pe: number | null;
  pb: number | null;
  marketCap: number | null; // ₹ Cr
  evEbitda: number | null; // non-financial only
  // quality/growth axes for the positioning scatter (real fundamentals fields)
  roce: number | null; // non-financial
  roe: number | null; // both families
  netMargin: number | null; // non-financial
  profitGrowth: number | null; // profitGrowthYoy (nf) / patGrowthYoy (banking)
}

const pos = (x: number | null | undefined): number | null =>
  x == null ? null : x;

/** TTM EBITDA proxy = sum of the last 4 quarters' operatingProfit (the read-model's stated
 *  EBITDA proxy). Null unless 4 real quarters exist and the sum is positive. */
function ttmEbitda(fund: FundamentalsView): number | null {
  const qs = fund.nonFinancial?.quarters ?? [];
  const last4 = qs.slice(-4);
  if (last4.length < 4) return null;
  const vals = last4.map((q) => q.operatingProfit).filter((v): v is number => v != null);
  if (vals.length < 4) return null;
  const sum = vals.reduce((s, v) => s + v, 0);
  return sum > 0 ? sum : null;
}

export function deriveValuationRow(
  symbol: string,
  name: string,
  price: StockPriceView | null,
  fund: FundamentalsView | null,
  pending: boolean,
): ValuationRow {
  const base: ValuationRow = {
    symbol,
    name,
    pending,
    family: fund?.family ?? null,
    pe: null,
    pb: null,
    marketCap: pos(price?.current.marketCap),
    evEbitda: null,
    roce: null,
    roe: null,
    netMargin: null,
    profitGrowth: null,
  };

  const px = price?.current.price ?? null;
  if (!fund || !fund.built) return base;

  // Dispatch the annual snapshot by family — banking has no roce/ebitda.
  if (fund.family === "non_financial") {
    const a = fund.nonFinancial?.annual ?? null;
    if (a) {
      base.roce = pos(a.roce);
      base.roe = pos(a.roe);
      base.netMargin = pos(a.netMargin);
      base.profitGrowth = pos(a.profitGrowthYoy);
      if (px != null && a.basicEps != null && a.basicEps > 0) base.pe = round2(px / a.basicEps);
      if (px != null && a.bookValuePerShare != null && a.bookValuePerShare > 0)
        base.pb = round2(px / a.bookValuePerShare);
      const ebitda = ttmEbitda(fund);
      if (base.marketCap != null && ebitda != null) {
        const ev = base.marketCap + (a.totalDebt ?? 0) - (a.cashAndCashEquivalents ?? 0);
        base.evEbitda = round2(ev / ebitda);
      }
    }
  } else if (fund.family === "banking") {
    const a = fund.banking?.annual ?? null;
    if (a) {
      base.roe = pos(a.roe);
      base.profitGrowth = pos(a.patGrowthYoy);
      if (px != null && a.basicEps != null && a.basicEps > 0) base.pe = round2(px / a.basicEps);
      if (px != null && a.bookValuePerShare != null && a.bookValuePerShare > 0)
        base.pb = round2(px / a.bookValuePerShare);
    }
  } else {
    // nbfc / insurance — P/E and P/B only, from the shared envelope where available.
    // (These PGs ship as alternates; we surface what the family payload exposes, never fake EV/EBITDA.)
    base.roe = null;
  }

  return base;
}

export const round2 = (x: number) => Math.round(x * 100) / 100;

/** Median of the real (non-null) values — the relative-valuation reference. */
export function median(values: (number | null)[]): number | null {
  const xs = values.filter((v): v is number => v != null).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

/** Premium (+) / discount (−) of a value vs the group median, as a percent. Factual —
 *  "trades at +20% vs the median multiple", NOT a buy/sell signal. */
export function premiumPct(value: number | null, med: number | null): number | null {
  if (value == null || med == null || med === 0) return null;
  return ((value - med) / med) * 100;
}

/** Whether EV/EBITDA is meaningful for this PG — non-financial only (ebitda exists only
 *  there; banking/NBFC/insurance have no EBITDA). */
export function showsEvEbitda(family: IndustryFamily | null): boolean {
  return family === "non_financial";
}

/** The PG's dominant family — first resolved member with a built fundamentals payload. */
export function resolveFamily(rows: ValuationRow[]): IndustryFamily | null {
  return rows.find((r) => r.family != null)?.family ?? null;
}
