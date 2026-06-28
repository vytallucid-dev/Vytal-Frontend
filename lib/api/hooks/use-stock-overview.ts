"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { StockOverviewView } from "@/types/overview";

/** The per-stock editorial profile — GET /api/stocks/:symbol/overview. Returns a
 *  honest-empty view (hasProfile:false) for an in-universe stock with no editorial
 *  row; only an unknown symbol 404s. */
export function useStockOverview(symbol: string) {
  return useQuery<StockOverviewView>({
    queryKey: ["stock", symbol, "overview"],
    queryFn: () => apiFetch<StockOverviewView>(`/api/stocks/${symbol}/overview`),
    enabled: Boolean(symbol),
  });
}
