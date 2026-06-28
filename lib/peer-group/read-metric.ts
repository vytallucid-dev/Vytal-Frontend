// Shared resolver: a peer-group config metric `key` → a member's value off its
// fundamentals annual payload. Mirrors the config's key vocabulary (lib/peer-group/config.ts)
// so finalizing the config is a data-swap, not a rebuild. Unknown / backend-gap keys → null.
// Used by the Fundamentals deep-metrics section and the Overview headline standings.

import type { FundamentalsView } from "@/types/fundamentals";
import { casaDistributionValue } from "@/lib/casa-display";

export function readConfigMetric(view: FundamentalsView | null, key: string): number | null {
  if (!view || !view.built) return null;
  const nf = view.nonFinancial?.annual ?? null;
  const bk = view.banking?.annual ?? null;
  switch (key) {
    // non-financial
    case "roce": return nf?.roce ?? null;
    case "roe": return nf?.roe ?? bk?.roe ?? null;
    case "operatingMargin": return nf?.operatingMargin ?? null;
    case "netMargin": return nf?.netMargin ?? null;
    case "debtToEquity": return nf?.debtToEquity ?? null;
    case "interestCoverage": return nf?.interestCoverage ?? null;
    case "profitGrowthYoy": return nf?.profitGrowthYoy ?? null;
    case "revenueGrowthYoy": return nf?.revenueGrowthYoy ?? null;
    // banking
    case "nim": return bk?.nim ?? null;
    case "gnpaPct": return bk?.gnpaPct ?? null;
    case "nnpaPct": return bk?.nnpaPct ?? null;
    case "pcr": return bk?.pcr ?? null;
    case "roaDisclosed": return bk?.roaDisclosed ?? null;
    case "tier1": return bk?.tier1 ?? null;
    case "costToIncome": return bk?.costToIncome ?? null;
    case "niiGrowthYoy": return bk?.niiGrowthYoy ?? null;
    case "patGrowthYoy": return bk?.patGrowthYoy ?? null;
    // CASA — now surfaced on the banking read path as a tiered quarterly value. Fold the
    // current entered value into the distribution; a `none` member returns null (excluded
    // from the median, never a fabricated 0). The quarter/tier context is shown separately.
    case "casa": return casaDistributionValue(view.banking?.casa?.current ?? null);
    default: return null;
  }
}
