"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { TwrResponse } from "@/types/portfolio";

/**
 * The portfolio's time-weighted return series (cash-flow-neutral, indexed to 100 at the
 * first day) + scalars (total / annualized). LAZY — fetched only when `enabled` (the
 * chart's benchmark comparison turns on). This — not raw-NAV-rebased — is what the Nifty
 * overlay compares, so deposits don't read as alpha. Read-only.
 */
export function usePortfolioTwr(enabled: boolean) {
  return useQuery<TwrResponse>({
    queryKey: ["me", "portfolio", "twr", "ALL"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: TwrResponse }>("/api/v1/me/portfolio/twr");
      return r.data;
    },
    enabled,
  });
}
