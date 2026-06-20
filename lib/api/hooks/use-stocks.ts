"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ScoredStockLite, StockScanItem, ToolId } from "@/types/research-tools";

/** Lean scored-stock universe → GET /api/stocks. Powers the name-switcher
 *  typeahead and the landing fallback. Cached app-wide under one key. */
export function useScoredStocks() {
  return useQuery<ScoredStockLite[]>({
    queryKey: ["stocks", "scored"],
    queryFn: () => apiFetch<ScoredStockLite[]>("/api/stocks"),
    staleTime: 5 * 60 * 1000,
  });
}

/** Per-tool landing scan → GET /api/stocks/scan?tool=…  Each tool ranks the same
 *  scored universe differently and returns its own item shape, so the row type is a
 *  type param (defaults to the trajectory item). `trajectory` + `divergence` are
 *  backed today; others 400 until implemented. */
export function useStockScan<T = StockScanItem>(tool: ToolId, enabled = true) {
  return useQuery<T[]>({
    queryKey: ["stocks", "scan", tool],
    queryFn: () => apiFetch<T[]>(`/api/stocks/scan?tool=${tool}`),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
