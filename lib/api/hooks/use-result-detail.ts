"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ResultDetailResponse } from "@/types/result-detail";

/**
 * Per-result viewer payload — GET /api/v1/results/:symbol[?period=FY26Q4].
 *
 * One stock + one quarter, with the spine for context and four independently
 * honest-empty context blocks (market reaction, news, AI, peers). Bundled server-side
 * so the viewer makes ONE call. Public, no auth; `{ success, data }` envelope.
 *
 * 404 ⇔ unknown symbol OR no filed results yet. Omitting `period` returns the latest
 * filed quarter.
 */
export function useResultDetail(symbol: string, period?: string) {
  return useQuery<ResultDetailResponse>({
    queryKey: ["result-detail", symbol, period ?? "latest"],
    queryFn: () =>
      apiFetch<ResultDetailResponse>(
        `/api/v1/results/${symbol}${period ? `?period=${period}` : ""}`,
      ),
    enabled: Boolean(symbol),
  });
}
