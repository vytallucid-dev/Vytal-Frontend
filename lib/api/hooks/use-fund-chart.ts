"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { FundChart } from "@/types/fund";

interface Envelope {
  success: boolean;
  data: FundChart;
}

/** GET /api/v1/mf/:schemeCode/chart — a LIVE fetch every time, nothing stored, so latency is
 *  real (`stored: false` always) and the loading state must say so rather than skeleton-flash.
 *
 *  Two very different "no chart" outcomes travel through this hook and must stay distinguishable
 *  downstream — never collapse them into one "chart unavailable" message:
 *   · `data.declined === true` (HTTP 200) — an honest refusal, with a reason. The product.
 *   · a thrown error (HTTP 503)          — the source (mfapi.in) is unreachable. An outage. */
export function useFundChart(schemeCode: string, days?: number) {
  return useQuery<FundChart>({
    queryKey: ["fund", schemeCode, "chart", days ?? "default"],
    enabled: Boolean(schemeCode),
    staleTime: 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const qs = days ? `?days=${days}` : "";
      const env = await apiFetch<Envelope>(`/api/v1/mf/${schemeCode}/chart${qs}`);
      return env.data;
    },
  });
}
