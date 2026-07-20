/**
 * Wire types for the mutual-fund / ETF detail page — GET /api/v1/mf/:schemeCode/{analytics,chart,family}.
 * Mirrors the backend response shapes verbatim (src/controllers/ingestion/mf-controllers.ts). Every
 * metric is nullable by design: a null is never "missing", it is explained by `omissions`.
 */

/** Per-field decline: the raw code AND the pre-composed sentence (explainOmissions on the backend). */
export interface OmissionEntry {
  code: string;
  reason: string;
}
/** Keyed by the mf_analytics column, e.g. "ret_5y_cagr", "sharpe_3y", "rank", "benchmark", "beta_1y". */
export type Omissions = Record<string, OmissionEntry>;

export interface FundScheme {
  name: string;
  symbol: string | null;
  assetClass: "mutual_fund" | "etf";
  fundHouse: string | null;
  category: string | null;
  planType: "direct" | "regular" | null;
  currentNav: string | null;
  navDate: string | null;
  isActive: boolean;
}

export interface FundReturns {
  m1: string | null;
  m3: string | null;
  m6: string | null;
  y1: string | null;
  y3Cagr: string | null;
  y5Cagr: string | null;
}

export interface FundRisk {
  vol1y: string | null;
  vol3y: string | null;
  sharpe1y: string | null;
  sharpe3y: string | null;
  sharpe5y: string | null;
  sortino1y: string | null;
  sortino3y: string | null;
  maxDrawdown1y: string | null;
  maxDrawdown3y: string | null;
  maxDrawdown5y: string | null;
}

export interface FundRolling1y {
  n: number | null;
  min: string | null;
  max: string | null;
  avg: string | null;
  pctPositive: string | null;
}

export interface FundRank {
  category: string;
  planType: string;
  bucketSize: number | null;
  y1: number | null;
  y3: number | null;
  y5: number | null;
  pool1y: number | null;
  pool3y: number | null;
  pool5y: number | null;
  pct1y: string | null;
  pct3y: string | null;
  pct5y: string | null;
}

export interface FundBenchmark {
  index: string | null;
  via: string | null;
  beta1y: string | null;
  beta3y: string | null;
  beta5y: string | null;
  alpha1y: string | null;
  alpha3y: string | null;
  alpha5y: string | null;
  trackingError1y: string | null;
  trackingError3y: string | null;
  trackingError5y: string | null;
}

export interface FundAnalytics {
  schemeCode: string;
  scheme: FundScheme | null;
  asOfDate: string;
  navPoints: number;
  returns: FundReturns;
  risk: FundRisk;
  rolling1y: FundRolling1y;
  rank: FundRank | null;
  benchmark: FundBenchmark;
  omissions: Omissions;
  computedAt: string;
}

export interface FundChartPoint {
  date: string;
  nav: string;
}

export interface FundChartOk {
  declined?: false;
  schemeCode: string;
  seriesSchemeCode: string;
  via: "self" | "growth_twin";
  splitAdjusted: boolean;
  schemeName: string;
  from: string | null;
  to: string | null;
  points: FundChartPoint[];
  source: string;
  stored: false;
}

export interface FundChartDeclined {
  declined: true;
  schemeCode: string;
  reason: string;
  stored: false;
}

export type FundChart = FundChartOk | FundChartDeclined;

export type PlanTier = "direct" | "regular" | "none";
export type PlanOptionLabel = "growth" | "bonus" | "idcw";

export interface FundFamilyMember {
  schemeCode: string;
  schemeName: string;
  planOption: string | null;
  tier: PlanTier;
  optionLabel: PlanOptionLabel;
  instrument: {
    symbol: string | null;
    assetClass: "mutual_fund" | "etf";
    category: string | null;
    categoryLeaf: string | null;
    planType: "direct" | "regular" | null;
    currentNav: string | null;
    navDate: string | null;
    isActive: boolean;
  } | null;
  hasAnalytics: boolean;
  /** Same test /chart and /analytics already use: this member has a real total-return series. */
  measurable: boolean;
}

export interface FundFamily {
  schemeCode: string;
  family: {
    id: string;
    canonicalName: string;
    fundHouse: string;
    assetClass: "mutual_fund" | "etf";
    schemeCount: number;
    isSingleton: boolean;
    ungroupedReason: string | null;
  };
  /** The member the server picked to represent this family (Direct+Growth → Regular+Growth → any
   *  measurable → first), resolved by the ONE rule in the backend's resolveRepresentative(). The
   *  frontend reads this — it never re-derives the fallback chain. `null` only if the family has no
   *  members (cannot occur in practice). */
  representativeSchemeCode: string | null;
  members: FundFamilyMember[];
}
