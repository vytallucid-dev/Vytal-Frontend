/**
 * Read-model contract for the OVERVIEW tab's Identity section →
 * GET /api/stocks/:symbol/overview. Mirrors the backend `overview-view.types.ts`
 * verbatim. EDITORIAL-ONLY: hand-authored company profile, no score/verdict.
 *
 * Honest-empty: `hasProfile:false` ⇒ every editorial field is null/[] and the
 * Identity section shows a "company profile not yet available" state — never
 * fabricated prose.
 */
export interface StockOverviewView {
  symbol: string;
  name: string;
  hasProfile: boolean;
  industry: string | null; // sub-industry label
  listedSince: number | null; // year first listed
  coreBusiness: string | null; // multi-paragraph prose — what the company does
  revenueModel: string | null; // multi-paragraph prose — how it earns
  businessTags: string[]; // category chips; [] when no profile
}
