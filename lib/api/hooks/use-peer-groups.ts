"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { PeerGroupListItem } from "@/types/peer-group";

/** The peer-group index list — GET /api/peer-groups (the no-v1 scoring path, NOT the
 *  legacy /api/v1/peer-groups ingestion-metrics router). Pre-ordered by sector then
 *  displayName, so consumers can group consecutive items by sector. */
export function usePeerGroups() {
  return useQuery<PeerGroupListItem[]>({
    queryKey: ["peer-groups"],
    queryFn: () => apiFetch<PeerGroupListItem[]>("/api/peer-groups"),
  });
}
