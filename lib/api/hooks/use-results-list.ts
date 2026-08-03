"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type {
  ReportedResultItem,
  UpcomingResultItem,
  ResultsFeedKind,
  ResultsFeedPage,
  ResultsFeedParams,
  ResultsFeedResponse,
  ResultsOverview,
  ResultsOverviewResponse,
} from "@/types/results";

/** Cards per scroll page. The grid is 1 / 2 / 3 columns, and 12 divides all three — so a
 *  page boundary always lands on a full row. */
export const RESULTS_PAGE_SIZE = 12;

function buildQs(
  feed: ResultsFeedKind,
  params: ResultsFeedParams,
  cursor?: string,
): string {
  const p = new URLSearchParams({ feed });
  const q = params.q?.trim();
  if (q) p.set("q", q);
  if (params.days != null) p.set("days", String(params.days));
  if (params.scored) p.set("scored", "true");
  if (params.upcomingDays != null) p.set("upcomingDays", String(params.upcomingDays));
  p.set("limit", String(params.limit ?? RESULTS_PAGE_SIZE));
  if (cursor) p.set("cursor", cursor);
  return p.toString();
}

/**
 * One half of the cross-stock results feed — GET /api/v1/results, cursor-paged.
 *
 * The server owns the filtering: `q`, `days` and `scored` are part of the query key, so
 * changing one starts a fresh paginated query rather than appending to a stale one. Only
 * the pages actually scrolled to are ever fetched. Public, no auth.
 *
 * `total` describes the whole filtered set (not the page) and rides on every page — read it
 * off `data.pages[0]`.
 */
function useResultsFeed<T>(feed: ResultsFeedKind, params: ResultsFeedParams) {
  const { enabled = true, ...filters } = params;
  return useInfiniteQuery<ResultsFeedPage<T>>({
    queryKey: ["results", "feed", feed, filters],
    enabled,
    initialPageParam: undefined as string | undefined,
    staleTime: 60 * 1000,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage.cursor ?? undefined) : undefined),
    queryFn: ({ pageParam }) =>
      apiFetch<ResultsFeedResponse<T>>(
        `/api/v1/results?${buildQs(feed, filters, pageParam as string | undefined)}`,
      ).then((r) => r.data),
  });
}

/** The REPORTED half — latest filed quarter per stock, newest filing first. */
export function useReportedResults(params: ResultsFeedParams = {}) {
  return useResultsFeed<ReportedResultItem>("reported", params);
}

/** The UPCOMING half — real earnings dates, soonest first, no numbers yet. */
export function useUpcomingResults(params: ResultsFeedParams = {}) {
  return useResultsFeed<UpcomingResultItem>("upcoming", params);
}

/**
 * Whole-feed context — GET /api/v1/results/overview.
 *
 * The header KPIs, the filter-chip counts and the top-growers strip describe the ENTIRE
 * feed, so they are read once per visit and never re-derived from a page: a number computed
 * off page 1 would silently mean "of the twelve cards you can see".
 */
export function useResultsOverview(upcomingDays?: number) {
  return useQuery<ResultsOverview>({
    queryKey: ["results", "overview", upcomingDays ?? null],
    staleTime: 60 * 1000,
    queryFn: () =>
      apiFetch<ResultsOverviewResponse>(
        `/api/v1/results/overview${upcomingDays != null ? `?upcomingDays=${upcomingDays}` : ""}`,
      ).then((r) => r.data),
  });
}
