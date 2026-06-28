"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { StockPriceView } from "@/types/price";

/** The per-stock price-performance view — GET /api/stocks/:symbol/price. Bundles the
 *  stock's own series + the Nifty 50 benchmark + the mapped sector index, with returns
 *  computed consistently. A stock with no price rows returns hasPrice:false (honest-empty);
 *  only an unknown symbol 404s. */
export function useStockPrice(symbol: string) {
  return useQuery<StockPriceView>({
    queryKey: ["stock", symbol, "price"],
    queryFn: () => apiFetch<StockPriceView>(`/api/stocks/${symbol}/price`),
    enabled: Boolean(symbol),
  });
}
