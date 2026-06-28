"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { StockEventsResponse } from "@/types/events";

/**
 * Per-stock corporate events → GET /api/v1/events/:symbol?upcoming=…&days=N.
 *
 * `corporate_events` rows: dividends (₹/share + ex-date), splits, bonuses, buybacks,
 * board meetings, AGMs and earnings (board-meeting) dates. Public, no auth; returns the
 * `/api/v1/*` `{ success, data }` envelope. 404 ⇔ symbol not in universe.
 *
 * `upcoming` splits the same endpoint into the two timeline halves:
 *   true  → events on/after today (next `days`, max 730)
 *   false → events before today (past `days`)
 * Honest by construction: a dividend the board will only *consider* carries null
 * dividendAmount/exDate (a pending state, not an error); the UI renders it as such.
 */
export function useStockEvents(symbol: string, upcoming: boolean, days = 730) {
  return useQuery<StockEventsResponse>({
    queryKey: ["stock", symbol, "events", { upcoming, days }],
    queryFn: () =>
      apiFetch<StockEventsResponse>(
        `/api/v1/events/${symbol}?upcoming=${upcoming}&days=${days}`,
      ),
    enabled: Boolean(symbol),
  });
}
