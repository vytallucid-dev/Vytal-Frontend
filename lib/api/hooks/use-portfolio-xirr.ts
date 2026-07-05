"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { XirrResponse } from "@/types/portfolio";

/**
 * The portfolio's XIRR (money-weighted / internal rate of return) — annualized, derived
 * from the ledger's dated cashflows + current value. The COMPLEMENT to TWR: XIRR answers
 * "what did my timing earn", TWR "how did my picks do". `xirrPct` is null on a degenerate
 * book (one flow / no sign change / too-short span) with a `state` that says why — never a
 * garbage number. Read-only.
 */
export function usePortfolioXirr() {
  return useQuery<XirrResponse>({
    queryKey: ["me", "portfolio", "xirr"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: XirrResponse }>("/api/v1/me/portfolio/xirr");
      return r.data;
    },
  });
}
