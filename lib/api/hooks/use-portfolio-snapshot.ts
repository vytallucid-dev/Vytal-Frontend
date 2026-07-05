"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { PortfolioSnapshotResponse } from "@/types/portfolio";

/**
 * The authenticated user's pre-computed Portfolio Health Score snapshot.
 * READ-ONLY: the backend serves the persisted snapshot (portfolio-spec 1.0); this
 * hook never recomputes a score, penalty or weight. `snapshot` is null with
 * `hasHoldings:false` for an empty book (the honest construction state).
 */
export function usePortfolioSnapshot() {
  return useQuery<PortfolioSnapshotResponse>({
    queryKey: ["me", "portfolio", "snapshot"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: PortfolioSnapshotResponse }>(
        "/api/v1/me/portfolio",
      );
      return r.data;
    },
  });
}
