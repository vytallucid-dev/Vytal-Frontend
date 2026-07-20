"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ScoreHistoryResponse } from "@/types/portfolio";

/**
 * The authenticated user's daily Health/Construction series (portfolio_score_history) —
 * date-ascending, one row per day the PHS write actually ran. A YOUNG, FILLS-FORWARD
 * series: a fresh book has 0-1 points, never a backfilled history. No cron reads here —
 * a day with no dot simply had no compute that day (see the controller's own header).
 * Fetched by whichever component mounts the history chart (mirrors usePortfolioNav being
 * called from inside ValueHero rather than hoisted) — React Query dedupes the identical
 * queryKey, so mounting the chart on both Overview and the Health tab costs one request.
 */
export function useScoreHistory() {
  return useQuery<ScoreHistoryResponse>({
    queryKey: ["me", "portfolio", "score-history"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: ScoreHistoryResponse }>(
        "/api/v1/me/score-history",
      );
      return r.data;
    },
  });
}
