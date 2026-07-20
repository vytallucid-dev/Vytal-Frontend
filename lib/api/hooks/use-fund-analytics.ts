"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch, isApiError } from "@/lib/api/client";
import type { FundAnalytics } from "@/types/fund";

interface Envelope {
  success: boolean;
  data: FundAnalytics;
}

/** GET /api/v1/mf/:schemeCode/analytics — the computed row + its honest-empty ledger.
 *  A 404 ("no analytics yet") is a real, distinct state from a network/server error — the
 *  page must tell a newly-listed fund apart from a broken fetch, so callers should branch on
 *  `isApiError(error) && error.status === 404` rather than treating every isError the same. */
export function useFundAnalytics(schemeCode: string) {
  return useQuery<FundAnalytics>({
    queryKey: ["fund", schemeCode, "analytics"],
    enabled: Boolean(schemeCode),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      const apiError = (error as { apiError?: unknown })?.apiError;
      if (isApiError(apiError) && apiError.status === 404) return false;
      return failureCount < 2;
    },
    queryFn: async () => {
      const env = await apiFetch<Envelope>(`/api/v1/mf/${schemeCode}/analytics`);
      return env.data;
    },
  });
}
