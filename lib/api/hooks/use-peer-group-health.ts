"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { PeerGroupHealthView } from "@/types/peer-group";

/** One pond's full aggregate — GET /api/peer-groups/:id/health. The detail-page
 *  chrome uses only `identity`; the rich Health tab consumes the whole view. */
export function usePeerGroupHealth(id: string) {
  return useQuery<PeerGroupHealthView>({
    queryKey: ["peer-group", id, "health"],
    queryFn: () => apiFetch<PeerGroupHealthView>(`/api/peer-groups/${id}/health`),
    enabled: Boolean(id),
  });
}
