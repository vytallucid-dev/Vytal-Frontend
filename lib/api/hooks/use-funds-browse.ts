"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { FundsQuery, FundsResponse } from "@/types/funds-browse";

function buildQs(query: FundsQuery, cursor?: string): string {
  const p = new URLSearchParams();
  if (query.q) p.set("q", query.q);
  if (query.assetClass) p.set("assetClass", query.assetClass);
  for (const c of query.category ?? []) p.append("category", c);
  for (const h of query.fundHouse ?? []) p.append("fundHouse", h);
  if (query.plan) p.set("plan", query.plan);
  if (query.includeDormant) p.set("includeDormant", "true");
  if (query.sort) p.set("sort", query.sort);
  if (query.limit) p.set("limit", String(query.limit));
  if (cursor) p.set("cursor", cursor);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** GET /api/v1/funds — the filterable family catalogue, cursor-paged. `facets`, `total`, and
 *  `nullSortCount` come from the FIRST page's response (they describe the whole filtered set, not
 *  the page) — read them off `data.pages[0]`. Every non-cursor filter is part of the query key, so
 *  changing a filter starts a fresh paginated query rather than appending to a stale one. */
export function useFundsBrowse(query: FundsQuery) {
  return useInfiniteQuery<FundsResponse>({
    queryKey: ["funds", "browse", query],
    initialPageParam: undefined as string | undefined,
    staleTime: 60 * 1000,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.cursor ?? undefined : undefined),
    queryFn: ({ pageParam }) => apiFetch<FundsResponse>(`/api/v1/funds${buildQs(query, pageParam as string | undefined)}`),
  });
}
