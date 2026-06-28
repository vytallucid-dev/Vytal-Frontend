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

/** Full daily OHLCV history for the price chart — GET /api/v1/prices/:symbol.
 *  Asks for 365 days (≈252 trading sessions, enough for a 200-DMA + recent window).
 *  The backend returns rows newest-first; we reverse to ascending and drop any row
 *  missing an OHLC leg. A stock with no price rows yields bars:[] (honest-empty);
 *  only an unknown symbol 404s. */
export function useStockOhlcv(symbol: string) {
  return useQuery<StockOhlcv>({
    queryKey: ["stock", symbol, "ohlcv"],
    enabled: Boolean(symbol),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const env = await apiFetch<PricesEnvelope>(
        `/api/v1/prices/${symbol}?days=365&limit=365`,
      );

      const bars: OhlcvBar[] = env.data.prices
        .filter(
          (r) =>
            r.open != null && r.high != null && r.low != null && r.close != null,
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
    },
  });
}
