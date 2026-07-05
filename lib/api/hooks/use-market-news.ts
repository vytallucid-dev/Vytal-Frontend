"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

/** One market-news row from the cross-stock feed. High-impact rows lead the list. */
export interface MarketNewsItem {
  id: string;
  symbol: string;
  companyName: string;
  sector: string | null;
  sourceType: string; // "nse_announcement" | "google_news"
  headline: string;
  summary: string | null;
  category: string | null;
  pdfUrl: string | null;
  externalUrl: string | null;
  isHighImpact: boolean;
  hasFullContent: boolean;
  publishedAt: string; // ISO
}

/**
 * The cross-stock market-news feed → GET /api/v1/news/feed/today?days=N. Public (no auth).
 * The backend leads with high-impact rows, then recent normal news (newest-first), over the
 * `days` window — so it stays populated on quiet days rather than reading empty.
 */
export function useMarketNews(days = 7) {
  return useQuery<MarketNewsItem[]>({
    queryKey: ["news", "feed", "today", days],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: MarketNewsItem[] }>(
        `/api/v1/news/feed/today?days=${days}`,
      );
      return r.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
