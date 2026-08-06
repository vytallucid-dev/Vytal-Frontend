"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

/** One upcoming corporate event from the market-wide calendar (already ranked
 *  eventDate asc, impact tiebreak). The dashboard filters this to the user's holdings. */
export interface CalendarEvent {
  id: string;
  /** The stock's raw id — carried so a reminder row can be matched and created without the client
   *  downloading the 504-row universe list to resolve one symbol. */
  stockId: string;
  symbol: string;
  companyName: string;
  sector: string | null;
  eventType: string; // earnings | dividend | agm | board_meeting | bonus | split | …
  eventDate: string; // YYYY-MM-DD
  exDate: string | null;
  recordDate: string | null;
  impactLevel: string; // high | medium | low
  dividendAmount: number | null; // ₹/share
  dividendType: string | null;
  bonusRatio: string | null;
  splitRatio: string | null;
  description: string | null;
}

/** One page of the calendar endpoint. `total` describes the whole requested window (not the
 *  page), so a reader can honestly say "40 of 312". `cursor` is opaque — hand it back verbatim. */
export interface CalendarEventsPage {
  events: CalendarEvent[];
  total: number;
  hasMore: boolean;
  cursor: string | null;
}

interface CalendarEventsResponse {
  success: boolean;
  data: CalendarEventsPage;
}

/** Events per scroll page on the timeline. Big enough that the first page usually covers the
 *  near horizons (this week / next week) in one round trip, small enough to stay cheap. */
export const CALENDAR_PAGE_SIZE = 40;

const STALE = 5 * 60 * 1000;

/** A concrete window for the calendar reads. `to: null` ⇒ open-ended (everything from `from`
 *  onward), which is what "all upcoming" means once the feed is paged rather than capped. */
export interface CalendarWindow {
  /** YYYY-MM-DD */
  from: string;
  /** YYYY-MM-DD, or null for no end bound. */
  to: string | null;
}

function windowQs(w: CalendarWindow, extra?: Record<string, string>): string {
  const p = new URLSearchParams({ from: w.from });
  if (w.to) p.set("to", w.to);
  for (const [k, v] of Object.entries(extra ?? {})) p.set(k, v);
  return p.toString();
}

/**
 * The market-wide corporate-events calendar → GET /api/v1/events/calendar?days=N.
 * Public (no auth); returns upcoming events across all stocks, already ordered by date
 * (impact tiebreak). The dashboard Events card filters this client-side to held names.
 * `days` is clamped 1–90 server-side (default 30).
 *
 * This is the UNPAGED forward look-ahead — the shape the dashboard and portfolio "upcoming"
 * cards want, and the calendar's own KPI/spotlight strip, which must describe a fixed window
 * rather than "whatever the reader has scrolled to". The timeline and month grid use the paged
 * / windowed hooks below.
 */
export function useEventsCalendar(days = 90) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["events", "calendar", days],
    queryFn: async () => {
      const r = await apiFetch<CalendarEventsResponse>(
        `/api/v1/events/calendar?days=${days}`,
      );
      return r.data.events;
    },
    staleTime: STALE,
  });
}

/**
 * The timeline's feed — the same endpoint, keyset-paged, for infinite scroll.
 *
 * The window is part of the query key, so changing the date range starts a FRESH paginated
 * query rather than appending to a stale one. Only the pages actually scrolled to are fetched;
 * `to: null` pages forward through every event we hold rather than stopping at a 90-day wall.
 */
export function useCalendarTimeline(window: CalendarWindow, enabled = true) {
  return useInfiniteQuery<CalendarEventsPage>({
    queryKey: ["events", "calendar", "timeline", window.from, window.to],
    enabled,
    initialPageParam: undefined as string | undefined,
    staleTime: STALE,
    getNextPageParam: (last) => (last.hasMore ? (last.cursor ?? undefined) : undefined),
    queryFn: ({ pageParam }) =>
      apiFetch<CalendarEventsResponse>(
        `/api/v1/events/calendar?${windowQs(window, {
          limit: String(CALENDAR_PAGE_SIZE),
          ...(pageParam ? { cursor: pageParam as string } : {}),
        })}`,
      ).then((r) => r.data),
  });
}

/**
 * One bounded slice of the calendar — the month grid's visible range, history included.
 *
 * Fetched per window and cached under it, so walking back to an already-visited month is
 * instant. `keepPreviousData` keeps the previous month on screen while the next one loads:
 * a grid that blanks on every arrow press reads as broken, not as loading.
 */
export function useCalendarWindow(window: CalendarWindow | null) {
  return useQuery<CalendarEventsPage>({
    queryKey: ["events", "calendar", "window", window?.from ?? null, window?.to ?? null],
    enabled: window != null,
    placeholderData: keepPreviousData,
    staleTime: STALE,
    queryFn: () =>
      apiFetch<CalendarEventsResponse>(
        `/api/v1/events/calendar?${windowQs(window!)}`,
      ).then((r) => r.data),
  });
}

/** How far the calendar reaches in each direction — the month grid's navigation limits. */
export interface CalendarBounds {
  /** YYYY-MM-DD of the oldest event we hold, or null when the table is empty. */
  earliest: string | null;
  /** YYYY-MM-DD of the furthest-out event we hold. */
  latest: string | null;
  total: number;
}

/**
 * GET /api/v1/events/calendar/bounds — the real extent of the events table.
 *
 * Read once and held for half an hour: it only moves when an ingest lands, and it exists so the
 * month picker offers exactly the months that can contain something. Long staleTime because a
 * nav limit that is one day out of date costs nothing.
 */
export function useCalendarBounds() {
  return useQuery<CalendarBounds>({
    queryKey: ["events", "calendar", "bounds"],
    staleTime: 30 * 60 * 1000,
    queryFn: () =>
      apiFetch<{ success: boolean; data: CalendarBounds }>(
        `/api/v1/events/calendar/bounds`,
      ).then((r) => r.data),
  });
}
