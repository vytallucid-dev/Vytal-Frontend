"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

/** One trading session's OHLCV, normalised for lightweight-charts.
 *  `time` is a business-day string 'YYYY-MM-DD' (the format lightweight-charts wants). */
export interface OhlcvBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradedValue: number | null;
}

export interface StockOhlcv {
  symbol: string;
  name: string;
  /** Ascending by date — the order charting libraries expect. */
  bars: OhlcvBar[];
}

// ── raw wire shape of GET /api/v1/prices/:symbol ──────────────────────────────
interface RawPriceRow {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  prevClose: number | null;
  volume: string; // BigInt serialised as string
  tradedValue: number | null;
}

interface PricesEnvelope {
  success: boolean;
  data: {
    stock: { symbol: string; name: string };
    prices: RawPriceRow[]; // newest-first from the backend
  };
}

/** ONE fetch + normalise for GET /api/v1/prices/:symbol. Both hooks below call it with different
 *  windows, so the wire shape is parsed in exactly one place and a sparkline bar and a chart bar can
 *  never be normalised differently. The backend returns rows newest-first (orderBy date desc, take
 *  limit); we reverse to ascending and drop any row missing an OHLC leg. A stock with no price rows
 *  yields bars:[] (honest-empty); only an unknown symbol 404s. */
async function fetchBars(symbol: string, days: number, limit: number): Promise<StockOhlcv> {
  const env = await apiFetch<PricesEnvelope>(
    `/api/v1/prices/${symbol}?days=${days}&limit=${limit}`,
  );

  const bars: OhlcvBar[] = env.data.prices
    .filter(
      (r) => r.open != null && r.high != null && r.low != null && r.close != null,
    )
    .map((r) => ({
      time: r.date,
      open: r.open as number,
      high: r.high as number,
      low: r.low as number,
      close: r.close as number,
      volume: Number(r.volume) || 0,
      tradedValue: r.tradedValue,
    }))
    // backend is newest-first; charts read oldest-first
    .reverse();

  return { symbol: env.data.stock.symbol, name: env.data.stock.name, bars };
}

/** Full daily OHLCV history for the price CHART — 365 days (≈252 sessions, enough for a 200-DMA
 *  plus a recent window). Every chart surface reads this: stock-detail Technical, the watchlist
 *  quick-look 3M chart, the holdings row-expand 60-session strip, and the watchlist rows (which need
 *  ~22 sessions for their 1M return). */
export function useStockOhlcv(symbol: string) {
  return useQuery<StockOhlcv>({
    queryKey: ["stock", symbol, "ohlcv"],
    enabled: Boolean(symbol),
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchBars(symbol, 365, 365),
  });
}

// ── ⚠ THE SPARKLINE WINDOW, AND WHY IT IS NOT `days=7` ────────────────────────────────────────────
// sparkFromBars() slices the last 7 TRADING SESSIONS. `days` on this endpoint is CALENDAR days
// (`since = today − days`), so days=7 spans one weekend and returns ~5 sessions — the line would
// still draw, with 5 points instead of 7, which is a DIFFERENT SHAPE and the kind of regression
// nobody reports. 14 calendar days clears two weekends and a holiday; `limit` then caps the
// response at the 7 newest sessions, so the payload is bounded by the sessions we render, not by
// the calendar span we had to ask for.
const SPARK_DAYS = 14;
const SPARK_SESSIONS = 7;

/**
 * The 7-session read for SPARKLINE-ONLY surfaces (dashboard holdings rows, trending carousel).
 *
 * ★ A DISTINCT QUERY KEY, DELIBERATELY. These bars are a 7-session slice; ["stock", symbol, "ohlcv"]
 * holds a 365-session history. Sharing one key would let whichever surface mounted first decide what
 * the other one gets — and handing 7 bars to the stock-detail chart (200-DMA, 3M candles) is a worse
 * bug than the over-fetch this replaces, because the chart would render, just wrong.
 *
 * TRADEOFF, STATED: the dashboard no longer warms the full-history cache for its symbols, so a
 * dashboard → watchlist navigation now refetches those symbols at full length instead of reusing
 * what the dashboard happened to have pulled. That reuse was never free — it was the dashboard
 * paying 365 sessions × 11 symbols on every cold load so a later page might hit cache.
 */
export function useStockSpark(symbol: string) {
  return useQuery<StockOhlcv>({
    queryKey: ["stock", symbol, "spark"],
    enabled: Boolean(symbol),
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchBars(symbol, SPARK_DAYS, SPARK_SESSIONS),
  });
}
