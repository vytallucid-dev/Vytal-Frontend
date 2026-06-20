"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { UniverseHealthView } from "@/types/universe-view";

/**
 * The universe-level aggregate — GET /api/universe/health. Folds all ~93 scored
 * stocks into one ScopeAggregate (+ drift, movers, pathology, sinceLastWeek).
 * Powers the Health Hub's Universe scope. `window` is reserved for a future
 * trailing-quarters param; omitting it preserves the server default + cache key.
 */
export function useUniverseHealth(window?: number) {
  return useQuery<UniverseHealthView>({
    queryKey: ["universe", "health", window ?? null],
    queryFn: () =>
      apiFetch<UniverseHealthView>(
        `/api/universe/health${window ? `?window=${window}` : ""}`,
      ),
  });
}
