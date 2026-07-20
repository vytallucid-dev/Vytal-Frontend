/**
 * Wire types for fund discovery — GET /api/v1/funds. The browse door to the detail page.
 * Mirrors the backend response (src/controllers/funds-controller.ts) verbatim. Family-grain: one
 * row per fund family, carrying the SERVER-resolved representative plan so the list and the detail
 * page can never disagree about whose numbers "the fund's return" means.
 */
import type { PlanTier, PlanOptionLabel } from "./fund";

export type FundAssetClass = "mutual_fund" | "etf";
export type FundSortKey = "name" | "ret1y" | "ret3y" | "ret5y";

export interface RepresentativePlan {
  tier: PlanTier;
  optionLabel: PlanOptionLabel;
}

export interface FamilyRow {
  familyId: string;
  canonicalName: string;
  fundHouse: string;
  assetClass: FundAssetClass;
  /** Normalised leaf of the representative member — never the raw AMFI wrapper string. */
  categoryLeaf: string | null;
  representativeSchemeCode: string;
  representativePlan: RepresentativePlan;
  returns: { ret1y: number | null; ret3y: number | null; ret5y: number | null };
  /** Present only for a null horizon — the omission code, same vocabulary as /analytics. */
  returnOmissions: { ret1y?: string; ret3y?: string; ret5y?: string };
  currentNav: number | null;
  navDate: string | null;
  schemeCount: number;
  availablePlans: RepresentativePlan[];
  isDormant: boolean;
  /** The representative has no total-return series at all. Row still ships — a fund we can't
   *  measure still exists and must still be findable. */
  declined: boolean;
  declinedReason?: string;
}

export interface Facet {
  value: string;
  count: number;
}

export interface FundsResponse {
  results: FamilyRow[];
  facets: { category: Facet[]; fundHouse: Facet[]; assetClass: Facet[] };
  total: number;
  hasMore: boolean;
  cursor: string | null;
  /** How many rows in the CURRENT result set have no value for the active sort key. Rendered in
   *  plain words whenever a return sort is active — a sorted list that silently omits its
   *  uncovered rows is the coverage lie. */
  nullSortCount: number;
}

export interface FundsQuery {
  q?: string;
  assetClass?: FundAssetClass;
  category?: string[];
  fundHouse?: string[];
  plan?: Exclude<PlanTier, "none">;
  includeDormant?: boolean;
  sort?: FundSortKey;
  limit?: number;
}
