"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { OwnershipSeriesView } from "@/types/research-tools";

/** The ownership-over-time series → GET /api/stocks/:symbol/ownership?window=…
 *  Holding split + flow lanes + pledging + current anatomy. `window` (4/8/12) re-keys
 *  the query, same as the health hook. */
export function useStockOwnership(symbol: string, window?: number) {
  return useQuery<OwnershipSeriesView>({
    queryKey: ["stock", symbol, "ownership", window ?? null],
    queryFn: () =>
      apiFetch<OwnershipSeriesView>(
        `/api/stocks/${symbol}/ownership${window ? `?window=${window}` : ""}`,
      ),
    enabled: Boolean(symbol),
  });
}
