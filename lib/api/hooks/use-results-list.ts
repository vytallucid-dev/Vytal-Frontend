"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ResultsListResponse, ResultsListParams } from "@/types/results";

/**
 * Cross-stock results feed — GET /api/v1/results.
 *
 * Two real halves over one endpoint: REPORTED (latest filed quarter per active stock,
 * from the per-family quarterly_results tables) + UPCOMING (corporate_events earnings
 * dates). Public, no auth. Returns the `/api/v1/*` `{ success, data }` envelope.
 *
 * Honest-empty by construction: a stock with no health score / no AI summary carries
 * `null` for those fields; there is NO market-reaction and NO beat/miss in the payload.
 */
export function useResultsList(params: ResultsListParams = {}) {
  const { filter = "all", days, upcomingDays, limit } = params;

  return useQuery<ResultsListResponse>({
    queryKey: ["results", { filter, days, upcomingDays, limit }],
    queryFn: () => {
      const qs = new URLSearchParams({ filter });
      if (days != null) qs.set("days", String(days));
      if (upcomingDays != null) qs.set("upcomingDays", String(upcomingDays));
      if (limit != null) qs.set("limit", String(limit));
      return apiFetch<ResultsListResponse>(`/api/v1/results?${qs.toString()}`);
    },
  });
}
