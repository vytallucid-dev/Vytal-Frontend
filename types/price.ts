/**
 * Read-model contract for the OVERVIEW tab's §1 price line + §2 Price Performance →
 * GET /api/stocks/:symbol/price. Mirrors the backend `price-view.types.ts` verbatim.
 *
 * DISPLAY-ONLY: price facts + neutral benchmark/sector index comparison lines. No
 * verdict, no "outperformer", no momentum language, no valuation lens. Returns are
 * PERCENT, computed consistently across stock/benchmark/sector. A line is `null` when
 * unmapped/absent; a per-window return is `null` when the series can't reach that far.
 */

export interface PriceReturnSet {
  r1m: number | null;
  r3m: number | null;
  r6m: number | null;
  r1y: number | null;
  r3y: number | null;
}

export interface PriceSeriesPoint {
  date: string; // YYYY-MM-DD
  close: number;
}

export interface IndexLine {
  indexName: string;
  label: string;
  series: PriceSeriesPoint[]; // oldest→newest, ≤3Y; rebase to 100 for comparison
  returns: PriceReturnSet;
  coverageDays: number;
}

export interface StockPriceView {
  symbol: string;
  name: string;
  hasPrice: boolean;
  asOfDate: string | null;
  current: {
    price: number | null;
    dayChangePct: number | null; // PERCENT
    marketCap: number | null; // ₹ Cr
    week52High: number | null;
    week52Low: number | null;
    pctFrom52WHigh: number | null; // signed % (≤0)
    pctFrom52WLow: number | null; // signed % (≥0)
  };
  stock: {
    series: PriceSeriesPoint[];
    returns: PriceReturnSet;
    coverageDays: number;
  };
  benchmark: IndexLine | null; // Nifty 50
  sector: IndexLine | null; // mapped sector index; null when unmapped
}

/** The selectable chart periods for §2 (label → trailing-day window). */
export type PricePeriodKey = "1M" | "3M" | "6M" | "1Y" | "3Y";
