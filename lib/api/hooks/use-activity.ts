"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

interface ClearActivityResponse {
  success: boolean;
  data: { attentionDeleted: number; relationshipDeleted: number; rollupDeleted: number };
}

/**
 * DELETE /api/v1/me/activity — clears ALL of the caller's behaviour data (both event tables + the
 * durable rollup), owner-scoped on the server. Uses the shared `apiFetch` so it rides the same bearer
 * auth as every other request.
 *
 * No client query reads the rollup yet (AI consumption of it is a separate build), so there is nothing
 * to refetch today; the invalidate is a forward-safe placeholder for when a read exists.
 */
export function useClearActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<ClearActivityResponse>("/api/v1/me/activity", { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me", "activity"] });
    },
  });
}
