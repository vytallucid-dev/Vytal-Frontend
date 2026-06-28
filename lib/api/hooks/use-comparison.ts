"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ComparisonView } from "@/types/compare";

/**
 * The stock-vs-stock ComparisonView → GET /api/compare?a=&b=. A NEW alignment endpoint
 * over the existing per-stock reads; it decides what is honestly comparable and emits
 * one curated payload. The selection landing reads only the comparability signal
 * (comparability / peerStandingComparable / warnings) the moment both symbols resolve;
 * the dedicated view renders the full payload.
 *
 * Disabled until BOTH symbols are present and DISTINCT (the endpoint 400s on equal
 * symbols). Symbols are upper-cased into the key so the cache is order-sensitive but
 * case-insensitive, matching the server's normalisation.
 */
export function useComparison(a: string | null, b: string | null) {
  const symA = a?.toUpperCase().trim() ?? "";
  const symB = b?.toUpperCase().trim() ?? "";
  const enabled = Boolean(symA && symB && symA !== symB);

  return useQuery<ComparisonView>({
    queryKey: ["compare", symA, symB],
    queryFn: () =>
      apiFetch<ComparisonView>(
        `/api/compare?a=${encodeURIComponent(symA)}&b=${encodeURIComponent(symB)}`,
      ),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
