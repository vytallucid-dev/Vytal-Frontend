"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { TwrResponse } from "@/types/portfolio";

/**
 * The portfolio's time-weighted return series (cash-flow-neutral, indexed to 100 at the
 * first day) + scalars (total / annualized). LAZY — fetched only when `enabled` (the
 * chart's Returns lens / benchmark comparison turns on). This — not raw-NAV-rebased — is what the
 * Nifty overlay compares, so deposits don't read as alpha. Read-only.
 *
 * `accountId` (optional) SCOPES the return series to ONE owned account (backend `?accountId=…`) — so
 * the account chart's Returns lens and the account summary's TWR tile are THIS account's, paired with
 * its own value line. The queryKey carries it (an account series caches separately from the whole
 * book). Omitted ⇒ whole-book, byte-identical to before — additive, no regression.
 */
export function usePortfolioTwr(enabled: boolean, accountId?: string) {
  return useQuery<TwrResponse>({
    queryKey: accountId
      ? ["me", "portfolio", "twr", "ALL", accountId]
      : ["me", "portfolio", "twr", "ALL"],
    queryFn: async () => {
      const url = accountId
        ? `/api/v1/me/portfolio/twr?accountId=${encodeURIComponent(accountId)}`
        : "/api/v1/me/portfolio/twr";
      const r = await apiFetch<{ success: boolean; data: TwrResponse }>(url);
      return r.data;
    },
    enabled,
  });
}
