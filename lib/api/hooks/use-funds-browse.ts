"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
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

/** Minimum `q` before the fund typeahead fires. The endpoint filters an in-memory array (3.8k
 *  families) so a short term is cheap server-side, but one character matches most of the
 *  catalogue and tells the user nothing — two is the first selective length. */
export const FUND_SEARCH_MIN_Q = 2;

/** How many families the typeahead pulls per term. The server slices name-ordered AFTER filtering,
 *  so this is the pool a caller gets to rank locally — wide enough that a prefix match isn't
 *  alphabetically stranded, narrow enough to stay a small payload per keystroke. */
export const FUND_SEARCH_LIMIT = 40;

/** Single-page typeahead over the SAME catalogue the browse grid reads — one flat request, no
 *  cursor, dormant families excluded (the browse default). Rows carry `representativeSchemeCode`,
 *  so a hit routes straight to /research/funds/:schemeCode with no second lookup.
 *
 *  `q` MUST already be debounced by the caller — every distinct term is a network round-trip.
 *  Disabled below the min length; `keepPreviousData` holds the last hits on screen while the next
 *  term resolves, so the list never blanks between keystrokes. */
export function useFundSearch(q: string, limit: number = FUND_SEARCH_LIMIT) {
  const term = q.trim();
  const enabled = term.length >= FUND_SEARCH_MIN_Q;
  return useQuery<FundsResponse>({
    // Key on the normalized term — the backend lowercases before matching, so "HDFC"/"hdfc" share
    // one cache entry.
    queryKey: ["funds", "search", term.toLowerCase(), limit],
    enabled,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: () => apiFetch<FundsResponse>(`/api/v1/funds${buildQs({ q: term, limit })}`),
  });
}
