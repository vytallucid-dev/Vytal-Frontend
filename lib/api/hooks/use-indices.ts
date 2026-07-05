"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

/** One headline index — latest close, prior close, day change % + a trailing sparkline.
 *  READ-ONLY over index_prices (EOD closes); the backend computes none of it beyond the
 *  day-change arithmetic. */
export interface IndexQuote {
  indexName: string;
  label: string;
  close: number;
  prevClose: number;
  changePct: number;
  asOf: string; // YYYY-MM-DD
  spark: number[]; // ascending closes (~40 sessions)
}

/**
 * The headline indices board → GET /api/v1/indices/latest. Public market data (no auth).
 * Powers the dashboard index carousel — Nifty 50, Bank Nifty, Nifty IT, Sensex, and the
 * other core full-history indices the feed carries.
 */
export function useIndices() {
  return useQuery<IndexQuote[]>({
    queryKey: ["indices", "latest"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: { indices: IndexQuote[] } }>(
        "/api/v1/indices/latest",
      );
      return r.data.indices;
    },
    staleTime: 5 * 60 * 1000,
  });
}
