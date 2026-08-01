"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type {
  ScoredStockLite,
  UniverseStockLite,
  StockScanItem,
  ToolId,
} from "@/types/research-tools";

/** Lean scored-stock universe → GET /api/stocks. Powers the name-switcher
 *  typeahead and the landing fallback. Cached app-wide under one key. */
export function useScoredStocks() {
  return useQuery<ScoredStockLite[]>({
    queryKey: ["stocks", "scored"],
    queryFn: () => apiFetch<ScoredStockLite[]>("/api/stocks"),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * FULL stock universe (scored + not-yet-scored) → GET /api/stocks/universe.
 * Powers the stock-screener typeahead so search spans every tracked stock, not
 * only the scored subset. Cached app-wide under one key.
 *
 * ⚠ THIS IS THE HEAVIEST SHARED READ IN THE APP — 504 rows, 104 KB raw / 22.1 KB gzip.
 * It is the right shape for a PICKER (you cannot filter a list you do not have) and the wrong
 * shape for resolving one symbol to one id. `enabled` exists so a picker can pay for it when the
 * picker actually opens, instead of on every page mount: pass the open state.
 *
 * Callers that pass nothing keep the previous eager behaviour, deliberately — the screener index,
 * the comparison pickers and the watchlist add-dialog all render the list as their primary content,
 * so for them the fetch IS the page.
 */
export function useUniverseStocks(enabled = true) {
  return useQuery<UniverseStockLite[]>({
    queryKey: ["stocks", "universe"],
    queryFn: () => apiFetch<UniverseStockLite[]>("/api/stocks/universe"),
    staleTime: 5 * 60 * 1000,
    enabled,
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
