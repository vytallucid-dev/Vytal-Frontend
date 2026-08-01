"use client";

import { useQuery } from "@tanstack/react-query";
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

/**
 * The market-wide corporate-events calendar → GET /api/v1/events/calendar?days=N.
 * Public (no auth); returns upcoming events across all stocks, already ordered by date
 * (impact tiebreak). The dashboard Events card filters this client-side to held names.
 * `days` is clamped 1–90 server-side (default 30).
 */
export function useEventsCalendar(days = 90) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["events", "calendar", days],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: { events: CalendarEvent[] } }>(
        `/api/v1/events/calendar?days=${days}`,
      );
      return r.data.events;
    },
    staleTime: 5 * 60 * 1000,
  });
}
