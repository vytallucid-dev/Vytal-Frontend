"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { BenchmarkResponse } from "@/types/portfolio";

/**
 * The Nifty 50 benchmark index series (full range, EOD closes). LAZY — only fetched
 * once `enabled` (the chart's Nifty toggle turns on). Fetches the FULL series so the
 * chart can carry-forward-align it onto the NAV trading days and rebase to 100 for any
 * visible window — read-only, no index compute.
 */
export function usePortfolioBenchmark(enabled: boolean) {
  return useQuery<BenchmarkResponse>({
    queryKey: ["me", "portfolio", "benchmark", "Nifty 50", "ALL"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: BenchmarkResponse }>(
        "/api/v1/me/portfolio/benchmark?period=ALL",
      );
      return r.data;
    },
    enabled,
  });
}
