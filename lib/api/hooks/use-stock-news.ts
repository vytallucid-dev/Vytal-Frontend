"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { StockNewsResponse, StockNewsParams } from "@/types/news";

/**
 * Disclosures & Announcements feed — GET /api/v1/news/:symbol.
 *
 * Two real streams (NSE regulatory filings + Google News press) over one paginated
 * endpoint. Public, no auth. Params are part of the query key so each stream / window
 * / page caches independently. Returns the `/api/v1/*` `{ success, data }` envelope.
 *
 * An in-universe stock with no rows returns `data.news: []` (honest-empty, 200);
 * only an unknown symbol 404s.
 */
export function useStockNews(symbol: string, params: StockNewsParams = {}) {
  const { type = "all", days = 90, limit = 20, page = 1, highImpact } = params;

  return useQuery<StockNewsResponse>({
    queryKey: ["stock", symbol, "news", { type, days, limit, page, highImpact }],
    queryFn: () => {
      const qs = new URLSearchParams({
        type,
        days: String(days),
        limit: String(limit),
        page: String(page),
      });
      if (highImpact != null) qs.set("highImpact", String(highImpact));
      return apiFetch<StockNewsResponse>(`/api/v1/news/${symbol}?${qs.toString()}`);
    },
    enabled: Boolean(symbol),
  });
}
