"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { HealthSnapshotView } from "@/types/health";

/**
 * The per-stock HealthSnapshotView. `window` (trailing quarters for the trajectory
 * series) is optional — omitting it preserves the server default (12 / 3Y) and the
 * original cache key, so existing call sites are untouched. The Trajectory tool
 * passes 4 / 8 / 12 (1Y / 2Y / 3Y) and the query re-keys per window.
 */
export function useStockHealth(symbol: string, window?: number) {
  return useQuery<HealthSnapshotView>({
    queryKey: ["stock", symbol, "health", window ?? null],
    queryFn: () =>
      apiFetch<HealthSnapshotView>(
        `/api/stocks/${symbol}/health${window ? `?window=${window}` : ""}`,
      ),
    enabled: Boolean(symbol),
  });
}
