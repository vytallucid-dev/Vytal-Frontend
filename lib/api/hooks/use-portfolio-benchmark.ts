"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { BenchmarkResponse } from "@/types/portfolio";

/**
 * The Nifty 50 benchmark index series (full range, EOD closes). LAZY — only fetched
 * once `enabled` (the chart's Nifty toggle turns on). Fetches the FULL series so the
 * chart can carry-forward-align it onto the NAV trading days and rebase to 100 for any
 * visible window — read-only, no index compute.
 *
 * `accountId` (optional) does NOT change the data — the account chart overlays the SAME Nifty 50,
 * paired with the ACCOUNT's TWR/value line (the frontend aligns it to that account's dates). It is
 * passed for IDOR-safe symmetry with the nav/twr siblings, and carried in the queryKey so the
 * account overlay caches beside its scoped siblings rather than sharing the whole-book entry.
 * Omitted ⇒ whole-book, byte-identical to before — additive, no regression.
 */
export function usePortfolioBenchmark(enabled: boolean, accountId?: string) {
  return useQuery<BenchmarkResponse>({
    queryKey: accountId
      ? ["me", "portfolio", "benchmark", "Nifty 50", "ALL", accountId]
      : ["me", "portfolio", "benchmark", "Nifty 50", "ALL"],
    queryFn: async () => {
      const base = "/api/v1/me/portfolio/benchmark?period=ALL";
      const url = accountId ? `${base}&accountId=${encodeURIComponent(accountId)}` : base;
      const r = await apiFetch<{ success: boolean; data: BenchmarkResponse }>(url);
      return r.data;
    },
    enabled,
  });
}
