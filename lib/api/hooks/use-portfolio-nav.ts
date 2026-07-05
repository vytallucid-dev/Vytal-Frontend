"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { NavResponse } from "@/types/portfolio";

/**
 * The user's daily NAV (value-over-time) series. Fetches the FULL series once
 * (period=ALL); the chart slices it client-side for the 1M/6M/1Y/3Y/All selectors —
 * read-only, no value recompute. Empty `series` ⇒ an empty/no-NAV book.
 */
export function usePortfolioNav() {
  return useQuery<NavResponse>({
    queryKey: ["me", "portfolio", "nav", "ALL"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: NavResponse }>(
        "/api/v1/me/portfolio/nav?period=ALL",
      );
      return r.data;
    },
  });
}
