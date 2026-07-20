"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { InstrumentSearchResponse } from "@/types/portfolio";

/** Minimum `q` length before the universe search fires — MIRRORS the backend's SEARCH_MIN_Q_LENGTH.
 *  Below it the server 400s (`q_too_short`) AND the contains-scan degrades to a full pass of the
 *  ~19k catalogue on every keystroke, so the client refuses to fire and says why rather than sitting
 *  silently empty. Exact ISIN (12 chars) and every real ticker clear 3 comfortably. */
export const INSTRUMENT_SEARCH_MIN_Q = 3;

/** Universe-wide instrument search → GET /api/v1/instruments/search?q=… (public, returned DIRECTLY,
 *  no {success,data} envelope — same contract as /api/stocks). Ranked + keyset-paged server-side; the
 *  picker reads the first page and surfaces `hasMore` verbatim so the UI can say "showing N of many".
 *
 *  `q` MUST already be debounced by the caller — every distinct value is a network round-trip against
 *  a 19k-row catalogue. Disabled below the min length; `keepPreviousData` holds the last page on screen
 *  while the next query runs, so the list doesn't blank between keystrokes. */
export function useInstrumentSearch(q: string) {
  const term = q.trim();
  const enabled = term.length >= INSTRUMENT_SEARCH_MIN_Q;
  return useQuery<InstrumentSearchResponse>({
    // Key on the normalized term (the backend upper-cases) so "HDFC" / "hdfc" share one cache entry.
    queryKey: ["instruments", "search", term.toUpperCase()],
    queryFn: () =>
      apiFetch<InstrumentSearchResponse>(`/api/v1/instruments/search?q=${encodeURIComponent(term)}`),
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

// ── the stored weekly series for ONE instrument — GET /api/v1/instruments/:instrumentId/series ──────
export interface InstrumentSeriesPoint {
  date: string; // "YYYY-MM-DD", ascending
  value: number;
}
export interface InstrumentSeries {
  instrumentId: string;
  points: InstrumentSeriesPoint[];
  /** nav_corrected (funds) | market_close (listed non-stocks) | mixed | null (empty window). */
  source: "nav_corrected" | "market_close" | "mixed" | null;
  from: string | null;
  to: string | null;
  resolution: "weekly";
  /** full (a window worth drawing) | partial (thin/recent-only) | none (backfill not run — a TRUE state). */
  coverage: "full" | "partial" | "none";
}

/**
 * The STORED weekly NAV/close series for one instrument — the holdings-expand sparkline for funds/ETFs
 * (and any listed non-stock that has close rows). STORED TABLE ONLY: this never touches live mfapi or the
 * fund-detail chart — keeping a high-frequency UI surface off an unmetered external API is the whole point.
 *
 * `coverage:"none"` is a real HTTP 200 (backfill not run yet), NOT an error — the caller renders "history
 * is still building", never a broken chart and never a live fallback. Mirrors use-fund-chart's shape:
 * enabled on a present id, briefly cached, one retry.
 */
export function useInstrumentSeries(instrumentId: string | null | undefined, days?: number) {
  return useQuery<InstrumentSeries>({
    queryKey: ["instrument", instrumentId ?? "none", "series", days ?? "all"],
    enabled: Boolean(instrumentId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const qs = days ? `?days=${days}` : "";
      const env = await apiFetch<{ success: boolean; data: InstrumentSeries }>(
        `/api/v1/instruments/${instrumentId}/series${qs}`,
      );
      return env.data;
    },
  });
}
