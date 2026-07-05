"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

/**
 * Per-pipeline "last run" summary for the Admin Panel cards. Admin-only
 * (GET /api/v1/admin/pipelines, requireAdmin). Each entry says WHEN a data
 * source last actually ran (finished background job, last detection, or last
 * manual CASA inject) and by whom — the card renders it as a relative time.
 *
 * Keyed by pipeline slug (matches the /admin/<key> card route) for O(1) lookup.
 */
export interface PipelineStatus {
  key: string;
  /** ISO timestamp of the last run, or null if it has never run. */
  lastRunAt: string | null;
  /** Raw trigger audit ("cron" | "user:…" | "admin_route" | "hook:…" | "detection" | …). */
  triggeredBy: string | null;
  /** Job status of that last run, or null for non-job sources. */
  status: string | null;
}

export function usePipelineStatus() {
  return useQuery<Record<string, PipelineStatus>>({
    queryKey: ["admin", "pipelines"],
    staleTime: 60_000,
    refetchInterval: 60_000, // keep the cadence fresh while the panel is open
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: PipelineStatus[] }>(
        "/api/v1/admin/pipelines",
      );
      return Object.fromEntries(r.data.map((p) => [p.key, p]));
    },
  });
}
