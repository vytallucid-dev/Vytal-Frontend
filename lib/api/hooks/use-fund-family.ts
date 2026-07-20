"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { FundFamily } from "@/types/fund";

interface Envelope {
  success: boolean;
  data: FundFamily;
}

/** GET /api/v1/mf/:schemeCode/family — the scheme's family + every sibling plan. Any member's
 *  code resolves the same family, which is what makes plan-switching and the twinless-IDCW
 *  "route to the plan that can be measured" possible without a client-side table join. */
export function useFundFamily(schemeCode: string) {
  return useQuery<FundFamily>({
    queryKey: ["fund", schemeCode, "family"],
    enabled: Boolean(schemeCode),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const env = await apiFetch<Envelope>(`/api/v1/mf/${schemeCode}/family`);
      return env.data;
    },
  });
}
