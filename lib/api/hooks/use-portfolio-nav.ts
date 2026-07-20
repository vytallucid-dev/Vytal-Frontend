"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { NavResponse } from "@/types/portfolio";

/**
 * The user's daily NAV (value-over-time) series. Fetches the FULL series once
 * (period=ALL); the chart slices it client-side for the 1M/6M/1Y/3Y/All selectors —
 * read-only, no value recompute. Empty `series` ⇒ an empty/no-NAV book.
 *
 * `accountId` (optional) SCOPES the series to ONE owned account (backend `?accountId=…`,
 * reconciling to the paisa with that account's current value). The queryKey carries it, so an
 * account series caches SEPARATELY and never collides with the whole-book series. Omitted ⇒
 * whole-book, byte-identical to before (the key stays `["me","portfolio","nav","ALL"]`) — additive,
 * no regression to the Overview / Performance / Dashboard whole-book callers. The scoped response's
 * `meta.brokerHoldingsExcluded` is the ACCOUNT's gap (zero for a manual book), not the whole book's.
 */
export function usePortfolioNav(accountId?: string) {
  return useQuery<NavResponse>({
    queryKey: accountId
      ? ["me", "portfolio", "nav", "ALL", accountId]
      : ["me", "portfolio", "nav", "ALL"],
    queryFn: async () => {
      const url = accountId
        ? `/api/v1/me/portfolio/nav?accountId=${encodeURIComponent(accountId)}&period=ALL`
        : "/api/v1/me/portfolio/nav?period=ALL";
      const r = await apiFetch<{ success: boolean; data: NavResponse }>(url);
      return r.data;
    },
  });
}
