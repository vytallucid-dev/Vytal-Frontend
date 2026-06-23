"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { FundamentalsView, Basis } from "@/types/fundamentals";

/** The fundamentals view → GET /api/stocks/:symbol/fundamentals?basis=…
 *  Dispatches by industry family server-side; the tab branches on `family` + `built`.
 *  `basis` (consolidated | standalone) re-keys the query so the basis toggle refetches,
 *  same as the window param on the health/ownership hooks. Omit it to let the server
 *  default (consolidated → the only-available basis). */
export function useStockFundamentals(symbol: string, basis?: Basis) {
  return useQuery<FundamentalsView>({
    queryKey: ["stock", symbol, "fundamentals", basis ?? null],
    queryFn: () =>
      apiFetch<FundamentalsView>(
        `/api/stocks/${symbol}/fundamentals${basis ? `?basis=${basis}` : ""}`,
      ),
    enabled: Boolean(symbol),
  });
}
