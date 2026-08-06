"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type {
  ScoredStockLite,
  UniverseStockLite,
  ToolScanItem,
  ToolScanPage,
  ToolScanFacets,
  ScanFilters,
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

/** Cards per landing-scan page. The scan grid is 1 / 2 / 4 columns and 16 divides all
 *  three, so a page boundary always lands on a full row. */
export const SCAN_PAGE_SIZE = 16;

/**
 * Per-tool landing scan → GET /api/stocks/scan?tool=…, cursor-paged.
 *
 * Each tool ranks the same scored universe differently and returns its own item shape, so
 * the row type is a type param (defaults to the trajectory item). The server owns the
 * ranking and hands back one page at a time — only the pages actually scrolled to are ever
 * fetched. `total` describes the whole ranking and rides on every page; read it off
 * `data.pages[0]`.
 */
/**
 * The filter query string, and the query KEY it must agree with.
 *
 * ★ SORTED, so the key is stable: selecting A then B and selecting B then A are the same
 *   narrowing and must share one cache entry rather than fetching the ranking twice.
 * ★ Empty lists emit NOTHING — an unfiltered landing keeps the exact URL (and the exact cache
 *   entry) it had before filters existed.
 */
function filterParams(filters?: ScanFilters): { qs: string; key: string[] } {
  const pg = [...(filters?.peerGroups ?? [])].sort();
  const pat = [...(filters?.patterns ?? [])].sort();
  const bands = [...(filters?.bands ?? [])].sort();
  const qs =
    (pg.length ? `&pg=${encodeURIComponent(pg.join(","))}` : "") +
    (pat.length ? `&patterns=${encodeURIComponent(pat.join(","))}` : "") +
    (bands.length ? `&bands=${encodeURIComponent(bands.join(","))}` : "");
  return { qs, key: [pg.join(","), pat.join(","), bands.join(",")] };
}

/**
 * Per-tool landing scan → GET /api/stocks/scan?tool=…, cursor-paged, optionally filtered.
 *
 * ⚠ THE FILTERS ARE PART OF THE QUERY KEY, deliberately: a narrowed landing is a DIFFERENT
 * ranking, with its own cursors and its own `total`. Changing the selection therefore starts a
 * fresh infinite query at page 1 — which is the only correct behaviour, since a cursor from the
 * unfiltered ranking names a position that doesn't exist in the filtered one. The frame's scroll
 * sentinel then pages through the narrowed ranking exactly as it does the full one.
 */
export function useStockScan<T = ToolScanItem>(
  tool: ToolId,
  enabled = true,
  filters?: ScanFilters,
) {
  const { qs, key } = filterParams(filters);
  return useInfiniteQuery<ToolScanPage<T>>({
    queryKey: ["stocks", "scan", tool, ...key],
    enabled,
    staleTime: 5 * 60 * 1000,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage.cursor ?? undefined) : undefined),
    queryFn: ({ pageParam }) =>
      apiFetch<ToolScanPage<T>>(
        `/api/stocks/scan?tool=${tool}&limit=${SCAN_PAGE_SIZE}` +
          qs +
          (pageParam ? `&cursor=${encodeURIComponent(pageParam as string)}` : ""),
      ),
  });
}

/**
 * The landing filters' OPTION lists → GET /api/stocks/scan/facets?tool=….
 *
 * The current selection is sent along because the counts are cross-filtered (each dimension
 * counted with the other's selection applied). `placeholderData` keeps the previous options on
 * screen while those counts refresh — a dropdown that empties itself the instant you tick a row
 * is unusable, and the option list itself never changes, only the numbers beside it.
 */
export function useStockScanFacets(tool: ToolId, enabled = true, filters?: ScanFilters) {
  const { qs, key } = filterParams(filters);
  return useQuery<ToolScanFacets>({
    queryKey: ["stocks", "scan-facets", tool, ...key],
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    queryFn: () => apiFetch<ToolScanFacets>(`/api/stocks/scan/facets?tool=${tool}${qs}`),
  });
}
