/**
 * Read-model contract for the FUNDAMENTALS tab → GET /api/stocks/:symbol/fundamentals.
 * Mirrors the backend `fundamentals-view.types.ts` verbatim. ONE dispatch-by-industry
 * -family endpoint: a shared envelope (every family) + exactly one populated per-family
 * payload, the other four null. `built:false` → family not yet implemented (honest
 * "coming" state). Every value is already canonical (percent as percent, money ₹ Cr,
 * ratios as-is) — the tab does NO unit conversion.
 */

export type IndustryFamily =
  | "non_financial"
  | "banking"
  | "nbfc"
  | "life_insurance"
  | "general_insurance";

export type Basis = "consolidated" | "standalone";

/** One quarter of the QUARTERLY SPINE (chosen basis, oldest→newest). */
export interface QuarterPoint {
  periodKey: string; // "FY26Q4"
  reportDate: string; // YYYY-MM-DD
  revenue: number | null; // ₹ Cr
  netProfit: number | null; // ₹ Cr
  operatingProfit: number | null; // ₹ Cr (EBITDA proxy)
  operatingMargin: number | null; // %
  netMargin: number | null; // %
  revenueYoy: number | null; // %
  profitYoy: number | null; // %
  revenueQoq: number | null; // %
  profitQoq: number | null; // %
  // P&L waterfall — completes Revenue → Expenses → OPM → Other Income → Interest →
  // Depreciation → PBT → Tax → Net Profit. All ₹ Cr; null when not filed.
  otherIncome: number | null; // ₹ Cr
  expenses: number | null; // ₹ Cr (total expenses)
  depreciation: number | null; // ₹ Cr
  interest: number | null; // ₹ Cr (finance costs)
  profitBeforeTax: number | null; // ₹ Cr
  tax: number | null; // ₹ Cr
}

/** DuPont legs — ROE = netMargin × assetTurnover × equityMultiplier. */
export interface DupontLegs {
  netMargin: number | null; // %
  assetTurnover: number | null; // x
  equityMultiplier: number | null; // x
}

/** ANNUAL CONTEXT — latest year, chosen basis. Derived fields are guarded arithmetic. */
export interface AnnualSnapshot {
  fiscalYear: string;

  roe: number | null; // %
  roce: number | null; // %
  netMargin: number | null; // %
  operatingMargin: number | null; // %
  roa: number | null; // % DERIVED

  revenueGrowthYoy: number | null; // %
  profitGrowthYoy: number | null; // %
  epsGrowthYoy: number | null; // %

  debtToEquity: number | null; // ratio
  interestCoverage: number | null; // x
  currentRatio: number | null; // DERIVED
  quickRatio: number | null; // DERIVED
  equityMultiplier: number | null; // DERIVED

  netProfit: number | null; // ₹ Cr (annual P&L — pairs with cashFromOperating for cash conversion)
  fcf: number | null; // ₹ Cr
  capex: number | null; // ₹ Cr
  cashFromOperating: number | null;
  cashFromInvesting: number | null;
  cashFromFinancing: number | null;
  dividendPayout: number | null; // % DERIVED

  basicEps: number | null;
  bookValuePerShare: number | null;

  // P&L waterfall — stored annual lines completing the full waterfall
  revenue: number | null; // ₹ Cr (top-line, for waterfall context)
  otherIncome: number | null; // ₹ Cr
  expenses: number | null; // ₹ Cr (total expenses)
  employeeBenefitExpense: number | null; // ₹ Cr
  financeCosts: number | null; // ₹ Cr
  depreciation: number | null; // ₹ Cr
  profitBeforeTax: number | null; // ₹ Cr
  tax: number | null; // ₹ Cr
  ebitda: number | null; // ₹ Cr

  totalAssets: number | null; // ₹ Cr
  totalEquity: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  inventories: number | null;
  totalDebt: number | null;
  cashAndCashEquivalents: number | null;

  // BS sub-lines — equity & liabilities
  equityShareCapital: number | null; // ₹ Cr
  otherEquity: number | null; // ₹ Cr (reserves & surplus)
  borrowingsCurrent: number | null; // ₹ Cr
  borrowingsNoncurrent: number | null; // ₹ Cr

  // BS sub-lines — assets
  propertyPlantAndEquipment: number | null; // ₹ Cr
  capitalWorkInProgress: number | null; // ₹ Cr
  noncurrentInvestments: number | null; // ₹ Cr
  currentInvestments: number | null; // ₹ Cr

  dupont: DupontLegs | null;
}

/** PRICE-RELATIVE — trailing-year figures over LIVE market cap. Facts, not valuation. */
export interface YieldsBlock {
  marketCap: number | null; // ₹ Cr (null when not populated)
  fcfYield: number | null; // %
  dividendYield: number | null; // %
  asOfBasis: string; // honest label
}

/** One fiscal year of the CASH-CONVERSION view — operating cash flow against net profit.
 *  Profit that doesn't convert to cash is the signal. Oldest→newest; kept only where CFO exists. */
export interface CashConversionPoint {
  fiscalYear: string;
  cashFromOperating: number | null; // ₹ Cr
  netProfit: number | null; // ₹ Cr
}

/** One fiscal year of the headline-ratio history — feeds the sparklines beside the annual
 *  return cards. All canonical % (non_financial stores ratios already-percent). */
export interface NfRatioHistoryPoint {
  fiscalYear: string;
  roe: number | null; // %
  roce: number | null; // %
  netMargin: number | null; // %
  operatingMargin: number | null; // %
}

export interface NonFinancialPayload {
  quarters: QuarterPoint[]; // oldest → newest
  annual: AnnualSnapshot | null; // latest year (= annualSeries[last]); kept for existing readers
  annualSeries: AnnualSnapshot[]; // oldest → newest; the multi-year statement history
  yields: YieldsBlock | null;
  cashConversion: CashConversionPoint[]; // oldest → newest; empty when no annual CFO on file
  ratioHistory: NfRatioHistoryPoint[]; // oldest → newest; for headline-ratio sparklines
}

// ── BANKING family — a different P&L (NII not revenue), bank-risk lens first. ──
// All units canonical: ratios PERCENT, money ₹ Cr. auditPending is an honest STATE
// (asset-quality/capital null that row by design), NOT missing data. No FCF for banks.

/** One quarter of the BANKING EARNINGS SPINE (chosen basis, oldest→newest). */
export interface BankingQuarter {
  periodKey: string; // "FY26Q4"
  reportDate: string; // YYYY-MM-DD
  auditPending: boolean; // true → asset-quality/capital fields null this row

  interestEarned: number | null; // ₹ Cr
  interestExpended: number | null; // ₹ Cr
  nii: number | null; // ₹ Cr (net interest income)
  otherIncome: number | null; // ₹ Cr
  totalIncome: number | null; // ₹ Cr
  ppop: number | null; // ₹ Cr (pre-provision operating profit)
  provisions: number | null; // ₹ Cr
  netProfit: number | null; // ₹ Cr
  netMargin: number | null; // %

  gnpaPct: number | null; // %
  nnpaPct: number | null; // %
  gnpaAbsolute: number | null; // ₹ Cr
  nnpaAbsolute: number | null; // ₹ Cr
  pcr: number | null; // % (provision coverage ratio)

  cet1: number | null; // %
  tier1: number | null; // %
  additionalTier1: number | null; // %

  costToIncome: number | null; // %
  roaQuarterly: number | null; // % (annualised-by-convention)

  niiQoq: number | null; // %
  niiYoy: number | null; // %
  patQoq: number | null; // %
  patYoy: number | null; // %
}

/** ANNUAL CONTEXT — latest year, chosen basis. No fcf/capex (banks have no FCF). */
export interface BankingAnnual {
  fiscalYear: string;

  roe: number | null; // %
  roaDisclosed: number | null; // % (disclosed full-year ROA)
  nim: number | null; // % (net interest margin)
  costToIncome: number | null; // %
  creditCostPct: number | null; // %

  // earnings mix — ₹ Cr (interestEarned is the denominator; advances = credit/lending interest,
  // revenueOnInvestments = treasury income, null when not disclosed separately)
  interestEarned: number | null;
  interestOnAdvances: number | null;
  revenueOnInvestments: number | null;

  deposits: number | null; // ₹ Cr
  advances: number | null; // ₹ Cr
  investments: number | null; // ₹ Cr
  borrowings: number | null; // ₹ Cr
  creditDepositRatio: number | null; // %

  depositGrowthYoy: number | null; // %
  advanceGrowthYoy: number | null; // %
  niiGrowthYoy: number | null; // %
  patGrowthYoy: number | null; // %
  assetGrowthYoy: number | null; // %

  gnpaPct: number | null; // %
  nnpaPct: number | null; // %
  pcr: number | null; // %
  gnpaAbsolute: number | null; // ₹ Cr
  nnpaAbsolute: number | null; // ₹ Cr
  cet1: number | null; // %
  tier1: number | null; // %

  capital: number | null; // ₹ Cr
  reservesAndSurplus: number | null; // ₹ Cr
  netWorth: number | null; // ₹ Cr
  totalAssets: number | null; // ₹ Cr
  cashAndBalancesWithRbi: number | null; // ₹ Cr

  basicEps: number | null; // ₹
  bookValuePerShare: number | null; // ₹

  cashFromOperating: number | null; // ₹ Cr
  cashFromInvesting: number | null; // ₹ Cr
  cashFromFinancing: number | null; // ₹ Cr
}

/** One fiscal year of the banking headline-ratio history — feeds the sparklines beside the
 *  annual return cards. Canonical %. Per-stock gated in the UI (≥ 3 reported years). */
export interface BkRatioHistoryPoint {
  fiscalYear: string;
  roe: number | null; // %
  nim: number | null; // %
  costToIncome: number | null; // %
  creditCostPct: number | null; // %
}

// ── CASA (current-and-savings ratio) — entered quarterly, tiered for HONEST display. ──
// The tier in `current.source` is load-bearing: the UI renders four distinct states from
// it (see §0 of the build spec). NEVER show a bare value — always with its `quarter`.
// Banks-only: `casa` exists solely on the banking payload. A bank with no entered CASA is
// honest-empty (current.value null, source "none", series []).

/** The current CASA reading + the tier context needed to render it honestly. */
export interface BankingCasaCurrent {
  value: number | null; // CASA %, e.g. 34.5 — null when source === "none"
  quarter: string | null; // the quarter this value is FOR, e.g. "FY26/Q4"; null on legacy_live / none
  source: "quarter" | "legacy_live" | "none"; // resolved tier — THE field that drives honest display
  isCurrent: boolean; // true ONLY when the latest entered quarter === the current expected quarter
  asOf: string | null; // ISO — when the driving row was entered (null when none)
}

/** One entered CASA quarter for the history chart (quarter-keyed rows only, ascending). */
export interface BankingCasaSeriesPoint {
  quarter: string; // "FY26/Q3" — the chart x-axis label
  value: number; // CASA % for that quarter (already percent — no conversion)
  periodEnd: string | null; // period-end date if stored (currently always null — use `quarter`)
}

/** CASA block on the banking fundamentals view: current tiered value + full quarter series. */
export interface BankingCasa {
  current: BankingCasaCurrent;
  series: BankingCasaSeriesPoint[]; // ascending by quarter; [] when no entered quarters
}

export interface BankingPayload {
  quarters: BankingQuarter[]; // oldest → newest
  annual: BankingAnnual | null; // latest year (= annualSeries[last]); kept for existing readers
  annualSeries: BankingAnnual[]; // oldest → newest; the multi-year statement history
  ratioHistory: BkRatioHistoryPoint[]; // oldest → newest; sparkline-eligible, per-stock gated
  // current CASA (tiered, honest) + full quarter series for the history chart. OPTIONAL on the
  // read model: a backend that predates the CASA read-exposure omits it → the UI honest-empties
  // (never crashes). Present on every current build of the fundamentals service.
  casa?: BankingCasa;
}

// ── NBFC family — a lending P&L, credit-cost as the (thinner) risk lens. No GNPA/PCR,
// no audit-pending, NO quarterly balance sheet (BS is annual-only). borrowingsToEquity
// is a LEVERAGE MULTIPLE (3.13×, never "313%"). depositsLiabilities is null for
// non-deposit-taking NBFCs (honest-empty). No FCF for NBFCs.

/** One quarter of the NBFC EARNINGS SPINE (P&L ONLY, chosen basis, oldest→newest). */
export interface NbfcQuarter {
  periodKey: string; // "FY26Q4"
  reportDate: string; // YYYY-MM-DD

  revenue: number | null; // ₹ Cr (total income)
  interestIncome: number | null; // ₹ Cr
  feeAndCommissionIncome: number | null; // ₹ Cr
  financeCosts: number | null; // ₹ Cr
  impairmentOnFinancialInstruments: number | null; // ₹ Cr (loan-loss / ECL)
  nii: number | null; // ₹ Cr (net interest income)
  netProfit: number | null; // ₹ Cr
  netMargin: number | null; // %

  revenueYoy: number | null; // %
  patYoy: number | null; // %
  revenueQoq: number | null; // %
  patQoq: number | null; // %
}

/** ANNUAL CONTEXT — latest year, chosen basis. The balance sheet lives here. */
export interface NbfcAnnual {
  fiscalYear: string;

  // P&L — previously missing from payload (live bug fix)
  netProfit: number | null; // ₹ Cr
  netMargin: number | null; // % DERIVED (netProfit / revenue × 100)
  interestIncome: number | null; // ₹ Cr
  feeAndCommissionIncome: number | null; // ₹ Cr

  roe: number | null; // %
  nim: number | null; // % (net interest margin)
  spread: number | null; // % (lending spread)
  costToIncomeRatio: number | null; // %
  creditCostPct: number | null; // % (impairment ÷ avg AUM)

  borrowingsToEquity: number | null; // × (MULTIPLE — display 3.13×, NOT a percent)
  capitalToAssetsRatio: number | null; // % (CRAR proxy)

  loans: number | null; // ₹ Cr (AUM / loan book)
  debtSecurities: number | null; // ₹ Cr
  borrowings: number | null; // ₹ Cr
  depositsLiabilities: number | null; // ₹ Cr — null for non-deposit-taking NBFCs

  aumGrowthYoy: number | null; // %
  revenueGrowthYoy: number | null; // %
  patGrowthYoy: number | null; // %

  totalAssets: number | null; // ₹ Cr
  totalEquity: number | null; // ₹ Cr
  netWorth: number | null; // ₹ Cr
  investments: number | null; // ₹ Cr
  cashAndCashEquivalents: number | null; // ₹ Cr

  basicEps: number | null; // ₹
  bookValuePerShare: number | null; // ₹

  cashFromOperating: number | null; // ₹ Cr
  cashFromInvesting: number | null; // ₹ Cr
  cashFromFinancing: number | null; // ₹ Cr
}

export interface NbfcPayload {
  quarters: NbfcQuarter[]; // oldest → newest
  annual: NbfcAnnual | null; // latest year (= annualSeries[last]); kept for existing readers
  annualSeries: NbfcAnnual[]; // oldest → newest; the multi-year statement history
}

// ── LIFE INSURANCE family — policyholders'-fund accounting; persistency + solvency are
// the quality lens. Ratios canonical PERCENT, EXCEPT solvencyRatio which is a MULTIPLE
// (1.90×, never "1.9%"). persistency13M / persistency.* are null when the source filing
// is suspect (guarded). incomeFromInvestments / changeInValuationOfLiabilities can be
// legitimately NEGATIVE. No FCF. Thin history → no trend charts.

/** One quarter of the LIFE-INSURANCE EARNINGS SPINE (chosen basis, oldest→newest). */
export interface LifeInsuranceQuarter {
  periodKey: string; // "FY26Q4"
  reportDate: string; // YYYY-MM-DD

  netPremiumIncome: number | null; // ₹ Cr
  grossPremiumIncome: number | null; // ₹ Cr
  // premium mix — the three lines sum to gross premium (₹ Cr). Renewal-heavy = a sticky book.
  incomeFirstYearPremium: number | null; // ₹ Cr
  incomeRenewalPremium: number | null; // ₹ Cr
  incomeSinglePremium: number | null; // ₹ Cr
  incomeFromInvestments: number | null; // ₹ Cr (can be negative — mark-to-market)
  benefitsPaidNet: number | null; // ₹ Cr
  changeInValuationOfLiabilities: number | null; // ₹ Cr (can be negative)
  netProfit: number | null; // ₹ Cr
  netMargin: number | null; // %

  solvencyRatio: number | null; // × (MULTIPLE — display 1.90×)
  persistency13M: number | null; // % (null when source value suspect)

  premiumQoq: number | null; // %
  premiumYoy: number | null; // %
  patQoq: number | null; // %
  patYoy: number | null; // %
}

/** The 13/25/37/49/61-month persistency ladder — % of policies still in force after N
 *  months. Each leg null when the source filing's value is suspect. */
export interface PersistencyLadder {
  m13: number | null; // %
  m25: number | null; // %
  m37: number | null; // %
  m49: number | null; // %
  m61: number | null; // %
}

/** ANNUAL CONTEXT — latest year, chosen basis. No fcf/capex. */
export interface LifeInsuranceAnnual {
  fiscalYear: string;

  roe: number | null; // %
  solvencyRatio: number | null; // × (MULTIPLE — display 1.90×)
  newBusinessPremiumPct: number | null; // %
  expenseRatioPolicyholders: number | null; // %
  persistency: PersistencyLadder; // %, each leg guarded

  // premium mix — the three lines sum to gross premium (₹ Cr)
  incomeFirstYearPremium: number | null; // ₹ Cr
  incomeRenewalPremium: number | null; // ₹ Cr
  incomeSinglePremium: number | null; // ₹ Cr

  premiumGrowthYoy: number | null; // %
  patGrowthYoy: number | null; // %

  policyholdersFunds: number | null; // ₹ Cr (the dominant liability)
  assetsHeldToCoverLinkedLiabilities: number | null; // ₹ Cr (ULIP-linked)
  investmentsShareholders: number | null; // ₹ Cr
  investmentsPolicyholders: number | null; // ₹ Cr
  shareCapital: number | null; // ₹ Cr
  reservesAndSurplus: number | null; // ₹ Cr
  netWorth: number | null; // ₹ Cr
  totalAssets: number | null; // ₹ Cr

  basicEps: number | null; // ₹
  bookValuePerShare: number | null; // ₹
}

/** One fiscal year of the life-insurance headline-ratio history — feeds the solvency &
 *  persistency sparklines. solvency is the MULTIPLE (×); persistency13M the guarded %. */
export interface LiRatioHistoryPoint {
  fiscalYear: string;
  solvencyRatio: number | null; // × (MULTIPLE)
  persistency13M: number | null; // % (guarded; null when source value suspect)
}

export interface LifeInsurancePayload {
  quarters: LifeInsuranceQuarter[]; // oldest → newest
  annual: LifeInsuranceAnnual | null; // latest year (= annualSeries[last]); kept for existing readers
  annualSeries: LifeInsuranceAnnual[]; // oldest → newest; the multi-year statement history
  ratioHistory: LiRatioHistoryPoint[]; // oldest → newest; for solvency/persistency sparklines
}

// ── GENERAL INSURANCE family — combined-ratio / underwriting accounting. combinedRatio
// is a PERCENT that CAN EXCEED 100 (above 100 = underwriting loss before investment
// income — a FACT). netUnderwritingMargin / underwritingProfitOrLoss can be NEGATIVE.
// solvencyRatio is a MULTIPLE (2.67×). investments is NOT reconciled to totalAssets (GI
// convention). Several XBRL columns honestly null. Single stock, thin history. No FCF.

/** One quarter of the GENERAL-INSURANCE EARNINGS SPINE (chosen basis, oldest→newest). */
export interface GeneralInsuranceQuarter {
  periodKey: string; // "FY26Q4"
  reportDate: string; // YYYY-MM-DD

  grossPremiumsWritten: number | null; // ₹ Cr
  netPremium: number | null; // ₹ Cr
  premiumEarned: number | null; // ₹ Cr
  incurredClaims: number | null; // ₹ Cr
  netCommission: number | null; // ₹ Cr
  underwritingProfitOrLoss: number | null; // ₹ Cr (can be negative)
  netProfit: number | null; // ₹ Cr
  netMargin: number | null; // %

  combinedRatio: number | null; // % (can exceed 100)
  incurredClaimRatio: number | null; // %
  expensesOfManagementRatio: number | null; // %
  netRetentionRatio: number | null; // %
  netUnderwritingMargin: number | null; // % (can be negative)
  solvencyRatio: number | null; // × (MULTIPLE — display 2.67×)

  gpwQoq: number | null; // %
  gpwYoy: number | null; // %
  patQoq: number | null; // %
  patYoy: number | null; // %
}

/** ANNUAL CONTEXT — latest year, chosen basis. investments is its OWN line — NOT
 *  reconciled against totalAssets (GI convention). No fcf/capex. */
export interface GeneralInsuranceAnnual {
  fiscalYear: string;

  roe: number | null; // %
  solvencyRatio: number | null; // × (MULTIPLE — display 2.67×)
  combinedRatio: number | null; // % (can exceed 100)
  incurredClaimRatio: number | null; // %
  expensesOfManagementRatio: number | null; // %
  netRetentionRatio: number | null; // %
  netUnderwritingMargin: number | null; // % (can be negative)

  gpwGrowthYoy: number | null; // %
  patGrowthYoy: number | null; // %

  // reserve adequacy — ₹ Cr; 0 = none required (adequate pricing); positive = a flag
  premiumDeficiency: number | null;

  investments: number | null; // ₹ Cr (own line)
  totalAssets: number | null; // ₹ Cr (context only)
  shareCapital: number | null; // ₹ Cr
  reservesAndSurplus: number | null; // ₹ Cr
  netWorth: number | null; // ₹ Cr

  basicEps: number | null; // ₹
  bookValuePerShare: number | null; // ₹
}

export interface GeneralInsurancePayload {
  quarters: GeneralInsuranceQuarter[]; // oldest → newest
  annual: GeneralInsuranceAnnual | null; // latest year (= annualSeries[last]); kept for existing readers
  annualSeries: GeneralInsuranceAnnual[]; // oldest → newest; the multi-year statement history
}

/** THE top-level read-model returned by GET /api/stocks/:symbol/fundamentals. */
export interface FundamentalsView {
  // shared envelope — every family
  symbol: string;
  name: string;
  industryType: IndustryFamily;
  family: IndustryFamily;
  built: boolean;
  basis: Basis;
  basisAvailable: Basis[];
  historyDepth: { quarters: number; years: number };
  notes: string[];

  // exactly one populated per family; the other four null
  nonFinancial: NonFinancialPayload | null;
  banking: BankingPayload | null;
  nbfc: NbfcPayload | null;
  lifeInsurance: LifeInsurancePayload | null;
  generalInsurance: GeneralInsurancePayload | null;
}
