/**
 * SHARED statement line-definitions — the single source of truth for every family's
 * P&L / Balance Sheet / Cash Flow row structure (labels, ordering, grouped hierarchy,
 * indent/bold/margin treatment). Both the per-stock Fundamentals tab
 * (financial-statements.tsx) AND the comparison Fundamentals tab (comparison view) import
 * these, so the two surfaces render the SAME statement shape line-for-line — the compare
 * view never re-authors the row structure, it reuses these defs.
 *
 * An `AnnualLine<T>` maps one annual snapshot → a formatted cell string; a quarterly
 * row-builder maps a quarter list → StmtRow[] (label + one formatted value per quarter).
 * Honest "—" per null cell. Formatters live here so both surfaces format identically.
 */

import type {
  AnnualSnapshot,
  QuarterPoint,
  BankingQuarter,
  BankingAnnual,
  NbfcQuarter,
  NbfcAnnual,
  LifeInsuranceQuarter,
  LifeInsuranceAnnual,
  GeneralInsuranceQuarter,
  GeneralInsuranceAnnual,
} from "@/types/fundamentals";

// ── formatters (self-contained — the one place statement cells are formatted) ──
export const DASH = "—";
export const fmtPct = (v: number | null | undefined, dp = 1) =>
  v == null ? DASH : `${v.toFixed(dp)}%`;
export const fmtX = (v: number | null | undefined, dp = 2) =>
  v == null ? DASH : `${v.toFixed(dp)}×`;

export function fmtCr(v: number | null | undefined) {
  if (v == null) return DASH;
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  return `${sign}₹${a.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

// ── row shapes ────────────────────────────────────────────────────────────────
export type StmtRow = {
  label: string;
  values: string[];
  indent?: boolean; // sub-row (indented label, text-ink3)
  isMargin?: boolean; // %-type row → text-ink2, not competing with money
  isBold?: boolean; // total / headline row
};

/** One annual line-def: label + how to render a single year's snapshot into a cell. */
export type AnnualLine<T> = {
  label: string;
  value: (a: T) => string;
  indent?: boolean;
  isMargin?: boolean;
  isBold?: boolean;
};

/** Statement kinds a family may render (insurers have no CF). */
export type StmtType = "pl" | "bs" | "cf";

// ════════════════════════════════════════════════════════════════════════════
// Non-financial
// ════════════════════════════════════════════════════════════════════════════

export function nfPlQuarterRows(qs: QuarterPoint[]): StmtRow[] {
  return [
    { label: "Revenue", values: qs.map((q) => fmtCr(q.revenue)) },
    { label: "Expenses", values: qs.map((q) => fmtCr(q.expenses)) },
    { label: "Operating Profit", values: qs.map((q) => fmtCr(q.operatingProfit)), isBold: true },
    { label: "OPM%", values: qs.map((q) => fmtPct(q.operatingMargin)), isMargin: true },
    { label: "Other Income", values: qs.map((q) => fmtCr(q.otherIncome)) },
    { label: "Interest", values: qs.map((q) => fmtCr(q.interest)) },
    { label: "Depreciation", values: qs.map((q) => fmtCr(q.depreciation)) },
    { label: "Profit Before Tax", values: qs.map((q) => fmtCr(q.profitBeforeTax)), isBold: true },
    { label: "Tax", values: qs.map((q) => fmtCr(q.tax)) },
    { label: "Net Profit", values: qs.map((q) => fmtCr(q.netProfit)), isBold: true },
    { label: "Net Margin%", values: qs.map((q) => fmtPct(q.netMargin)), isMargin: true },
  ];
}

export const nfPlLines: AnnualLine<AnnualSnapshot>[] = [
  { label: "Revenue", value: (a) => fmtCr(a.revenue) },
  { label: "Other Income", value: (a) => fmtCr(a.otherIncome) },
  { label: "Total Expenses", value: (a) => fmtCr(a.expenses), isBold: true },
  { label: "Employee Benefits", value: (a) => fmtCr(a.employeeBenefitExpense), indent: true },
  { label: "Finance Costs", value: (a) => fmtCr(a.financeCosts), indent: true },
  { label: "Depreciation", value: (a) => fmtCr(a.depreciation), indent: true },
  { label: "EBITDA", value: (a) => fmtCr(a.ebitda), isBold: true },
  { label: "Operating Margin%", value: (a) => fmtPct(a.operatingMargin), isMargin: true },
  { label: "Profit Before Tax", value: (a) => fmtCr(a.profitBeforeTax), isBold: true },
  { label: "Tax", value: (a) => fmtCr(a.tax) },
  { label: "Net Profit", value: (a) => fmtCr(a.netProfit), isBold: true },
  { label: "Net Margin%", value: (a) => fmtPct(a.netMargin), isMargin: true },
];

export const nfBsLines: AnnualLine<AnnualSnapshot>[] = [
  { label: "Equity & Liabilities", value: () => DASH, isBold: true },
  { label: "Equity Share Capital", value: (a) => fmtCr(a.equityShareCapital), indent: true },
  { label: "Other Equity (Reserves)", value: (a) => fmtCr(a.otherEquity), indent: true },
  { label: "Total Equity", value: (a) => fmtCr(a.totalEquity), isBold: true },
  { label: "Borrowings — Current", value: (a) => fmtCr(a.borrowingsCurrent), indent: true },
  { label: "Borrowings — Non-current", value: (a) => fmtCr(a.borrowingsNoncurrent), indent: true },
  { label: "Total Debt", value: (a) => fmtCr(a.totalDebt), isBold: true },
  { label: "Current Liabilities", value: (a) => fmtCr(a.currentLiabilities), indent: true },
  { label: "Assets", value: () => DASH, isBold: true },
  { label: "Property, Plant & Equipment", value: (a) => fmtCr(a.propertyPlantAndEquipment), indent: true },
  { label: "Capital Work in Progress", value: (a) => fmtCr(a.capitalWorkInProgress), indent: true },
  { label: "Non-current Investments", value: (a) => fmtCr(a.noncurrentInvestments), indent: true },
  { label: "Current Investments", value: (a) => fmtCr(a.currentInvestments), indent: true },
  { label: "Inventories", value: (a) => fmtCr(a.inventories), indent: true },
  { label: "Current Assets", value: (a) => fmtCr(a.currentAssets), indent: true },
  { label: "Cash & Cash Equivalents", value: (a) => fmtCr(a.cashAndCashEquivalents), indent: true },
  { label: "Total Assets", value: (a) => fmtCr(a.totalAssets), isBold: true },
];

export const nfCfLines: AnnualLine<AnnualSnapshot>[] = [
  { label: "Cash from Operating", value: (a) => fmtCr(a.cashFromOperating), isBold: true },
  { label: "Cash from Investing", value: (a) => fmtCr(a.cashFromInvesting) },
  { label: "Cash from Financing", value: (a) => fmtCr(a.cashFromFinancing) },
  { label: "Free Cash Flow", value: (a) => fmtCr(a.fcf), isBold: true },
  { label: "Capex", value: (a) => fmtCr(a.capex) },
];

// ════════════════════════════════════════════════════════════════════════════
// Banking
// ════════════════════════════════════════════════════════════════════════════

export function bkPlQuarterRows(qs: BankingQuarter[]): StmtRow[] {
  return [
    { label: "Interest Earned", values: qs.map((q) => fmtCr(q.interestEarned)) },
    { label: "Interest Expended", values: qs.map((q) => fmtCr(q.interestExpended)) },
    { label: "Net Interest Income", values: qs.map((q) => fmtCr(q.nii)), isBold: true },
    { label: "Other Income", values: qs.map((q) => fmtCr(q.otherIncome)) },
    { label: "Total Income", values: qs.map((q) => fmtCr(q.totalIncome)), isBold: true },
    { label: "Employees Cost", values: qs.map((q) => fmtCr(q.employeesCost)), indent: true },
    { label: "Operating Expenses", values: qs.map((q) => fmtCr(q.operatingExpenses)), indent: true },
    { label: "Total Expenditure (excl. Provisions)", values: qs.map((q) => fmtCr(q.expenditureExclProvisions)), indent: true },
    { label: "PPOP", values: qs.map((q) => fmtCr(q.ppop)), isBold: true },
    { label: "Provisions", values: qs.map((q) => fmtCr(q.provisions)) },
    { label: "Exceptional Items", values: qs.map((q) => fmtCr(q.exceptionalItems)) },
    { label: "Net Profit", values: qs.map((q) => fmtCr(q.netProfit)), isBold: true },
    { label: "Net Margin%", values: qs.map((q) => fmtPct(q.netMargin)), isMargin: true },
  ];
}

export const bkPlLines: AnnualLine<BankingAnnual>[] = [
  { label: "Interest Earned", value: (a) => fmtCr(a.interestEarned), isBold: true },
  { label: "Interest on Advances", value: (a) => fmtCr(a.interestOnAdvances), indent: true },
  { label: "Revenue on Investments", value: (a) => fmtCr(a.revenueOnInvestments), indent: true },
  { label: "Interest Expended", value: (a) => fmtCr(a.interestExpended) },
  { label: "Net Interest Income", value: (a) => fmtCr(a.nii), isBold: true },
  { label: "Other Income", value: (a) => fmtCr(a.otherIncome) },
  { label: "Total Income", value: (a) => fmtCr(a.totalIncome), isBold: true },
  { label: "Employees Cost", value: (a) => fmtCr(a.employeesCost), indent: true },
  { label: "Operating Expenses", value: (a) => fmtCr(a.operatingExpenses), indent: true },
  { label: "Other Operating Expenses", value: (a) => fmtCr(a.otherOperatingExpenses), indent: true },
  { label: "Total Expenditure (excl. Provisions)", value: (a) => fmtCr(a.expenditureExclProvisions), indent: true },
  { label: "PPOP", value: (a) => fmtCr(a.ppop), isBold: true },
  { label: "Provisions", value: (a) => fmtCr(a.provisions) },
  { label: "Exceptional Items", value: (a) => fmtCr(a.exceptionalItems) },
  { label: "Extraordinary Items", value: (a) => fmtCr(a.extraordinaryItems) },
  { label: "Profit Before Tax", value: (a) => fmtCr(a.profitBeforeTax), isBold: true },
  { label: "Tax", value: (a) => fmtCr(a.tax) },
  { label: "Net Profit", value: (a) => fmtCr(a.netProfit), isBold: true },
  { label: "Net Margin%", value: (a) => fmtPct(a.netMargin), isMargin: true },
];

export const bkBsLines: AnnualLine<BankingAnnual>[] = [
  { label: "Capital & Reserves", value: () => DASH, isBold: true },
  { label: "Capital", value: (a) => fmtCr(a.capital), indent: true },
  { label: "Reserves & Surplus", value: (a) => fmtCr(a.reservesAndSurplus), indent: true },
  { label: "Net Worth", value: (a) => fmtCr(a.netWorth), isBold: true },
  { label: "Deposits & Borrowings", value: () => DASH, isBold: true },
  { label: "Deposits", value: (a) => fmtCr(a.deposits), indent: true },
  { label: "Borrowings", value: (a) => fmtCr(a.borrowings), indent: true },
  { label: "Other Liabilities", value: (a) => fmtCr(a.otherLiabilities), indent: true },
  { label: "Assets", value: () => DASH, isBold: true },
  { label: "Cash & Balances with RBI", value: (a) => fmtCr(a.cashAndBalancesWithRbi), indent: true },
  { label: "Balances with Banks", value: (a) => fmtCr(a.balancesWithBanks), indent: true },
  { label: "Investments", value: (a) => fmtCr(a.investments), indent: true },
  { label: "Advances", value: (a) => fmtCr(a.advances), indent: true },
  { label: "Fixed Assets", value: (a) => fmtCr(a.fixedAssets), indent: true },
  { label: "Other Assets", value: (a) => fmtCr(a.otherAssets), indent: true },
  { label: "Total Assets", value: (a) => fmtCr(a.totalAssets), isBold: true },
];

export const bkCfLines: AnnualLine<BankingAnnual>[] = [
  { label: "Cash from Operating", value: (a) => fmtCr(a.cashFromOperating), isBold: true },
  { label: "Cash from Investing", value: (a) => fmtCr(a.cashFromInvesting) },
  { label: "Cash from Financing", value: (a) => fmtCr(a.cashFromFinancing) },
  { label: "Net Cash Flow", value: (a) => fmtCr(a.netCashFlow), isBold: true },
];

// ════════════════════════════════════════════════════════════════════════════
// NBFC
// ════════════════════════════════════════════════════════════════════════════

export function nbfcPlQuarterRows(qs: NbfcQuarter[]): StmtRow[] {
  return [
    { label: "Revenue (Total Income)", values: qs.map((q) => fmtCr(q.revenue)) },
    { label: "Interest Income", values: qs.map((q) => fmtCr(q.interestIncome)), indent: true },
    { label: "Fee & Commission Income", values: qs.map((q) => fmtCr(q.feeAndCommissionIncome)), indent: true },
    { label: "Other Income", values: qs.map((q) => fmtCr(q.otherIncome)), indent: true },
    { label: "Finance Costs", values: qs.map((q) => fmtCr(q.financeCosts)), indent: true },
    { label: "Impairment on Fin. Instruments", values: qs.map((q) => fmtCr(q.impairmentOnFinancialInstruments)), indent: true },
    { label: "Total Expenses", values: qs.map((q) => fmtCr(q.totalExpenses)), isBold: true },
    { label: "Net Interest Income", values: qs.map((q) => fmtCr(q.nii)), isBold: true },
    { label: "Profit Before Tax", values: qs.map((q) => fmtCr(q.profitBeforeTax)), isBold: true },
    { label: "Tax", values: qs.map((q) => fmtCr(q.tax)) },
    { label: "Net Profit", values: qs.map((q) => fmtCr(q.netProfit)), isBold: true },
    { label: "Net Margin%", values: qs.map((q) => fmtPct(q.netMargin)), isMargin: true },
  ];
}

export const nbfcPlLines: AnnualLine<NbfcAnnual>[] = [
  { label: "Revenue (Total Income)", value: (a) => fmtCr(a.totalIncome), isBold: true },
  { label: "Interest Income", value: (a) => fmtCr(a.interestIncome), indent: true },
  { label: "Fee & Commission Income", value: (a) => fmtCr(a.feeAndCommissionIncome), indent: true },
  { label: "Net Gain on Fair Value Changes", value: (a) => fmtCr(a.netGainOnFairValueChanges), indent: true },
  { label: "Other Income", value: (a) => fmtCr(a.otherIncome), indent: true },
  { label: "Finance Costs", value: (a) => fmtCr(a.financeCosts), indent: true },
  { label: "Impairment on Fin. Instruments", value: (a) => fmtCr(a.impairmentOnFinancialInstruments), indent: true },
  { label: "Employee Benefits", value: (a) => fmtCr(a.employeeBenefitExpense), indent: true },
  { label: "Depreciation", value: (a) => fmtCr(a.depreciation), indent: true },
  { label: "Other Expenses", value: (a) => fmtCr(a.otherExpenses), indent: true },
  { label: "Total Expenses", value: (a) => fmtCr(a.totalExpenses), isBold: true },
  { label: "Profit Before Tax", value: (a) => fmtCr(a.profitBeforeTax), isBold: true },
  { label: "Tax", value: (a) => fmtCr(a.tax) },
  { label: "Net Profit", value: (a) => fmtCr(a.netProfit), isBold: true },
  { label: "Net Margin%", value: (a) => fmtPct(a.netMargin), isMargin: true },
];

export const nbfcBsLines: AnnualLine<NbfcAnnual>[] = [
  { label: "Equity", value: () => DASH, isBold: true },
  { label: "Equity Share Capital", value: (a) => fmtCr(a.equityShareCapital), indent: true },
  { label: "Other Equity", value: (a) => fmtCr(a.otherEquity), indent: true },
  { label: "Total Equity", value: (a) => fmtCr(a.totalEquity), isBold: true },
  { label: "Financial Assets", value: () => DASH, isBold: true },
  { label: "Loans (AUM)", value: (a) => fmtCr(a.loans), indent: true },
  { label: "Investments", value: (a) => fmtCr(a.investments), indent: true },
  { label: "Cash & Cash Equivalents", value: (a) => fmtCr(a.cashAndCashEquivalents), indent: true },
  { label: "Bank Balance (Other)", value: (a) => fmtCr(a.bankBalanceOther), indent: true },
  { label: "Trade Receivables", value: (a) => fmtCr(a.receivablesTrade), indent: true },
  { label: "Other Financial Assets", value: (a) => fmtCr(a.otherFinancialAssets), indent: true },
  { label: "Total Financial Assets", value: (a) => fmtCr(a.financialAssets), isBold: true },
  { label: "Non-Financial Assets", value: (a) => fmtCr(a.nonFinancialAssets), indent: true },
  { label: "Total Assets", value: (a) => fmtCr(a.totalAssets), isBold: true },
  { label: "Financial Liabilities", value: () => DASH, isBold: true },
  { label: "Debt Securities", value: (a) => fmtCr(a.debtSecurities), indent: true },
  { label: "Borrowings", value: (a) => fmtCr(a.borrowings), indent: true },
  { label: "Deposits (Liabilities)", value: (a) => fmtCr(a.depositsLiabilities), indent: true },
  { label: "Payables", value: (a) => fmtCr(a.payables), indent: true },
  { label: "Subordinated Liabilities", value: (a) => fmtCr(a.subordinatedLiabilities), indent: true },
  { label: "Other Financial Liabilities", value: (a) => fmtCr(a.otherFinancialLiabilities), indent: true },
  { label: "Total Financial Liabilities", value: (a) => fmtCr(a.financialLiabilities), isBold: true },
  { label: "Non-Financial Liabilities", value: (a) => fmtCr(a.nonFinancialLiabilities), indent: true },
  { label: "Total Liabilities", value: (a) => fmtCr(a.totalLiabilities), isBold: true },
  { label: "Net Worth", value: (a) => fmtCr(a.netWorth) },
];

export const nbfcCfLines: AnnualLine<NbfcAnnual>[] = [
  { label: "Cash from Operating", value: (a) => fmtCr(a.cashFromOperating), isBold: true },
  { label: "Cash from Investing", value: (a) => fmtCr(a.cashFromInvesting) },
  { label: "Cash from Financing", value: (a) => fmtCr(a.cashFromFinancing) },
  { label: "Net Cash Flow", value: (a) => fmtCr(a.netCashFlow), isBold: true },
];

// ════════════════════════════════════════════════════════════════════════════
// Life Insurance (no CF)
// ════════════════════════════════════════════════════════════════════════════

export function liPlQuarterRows(qs: LifeInsuranceQuarter[]): StmtRow[] {
  return [
    { label: "Net Premium Income", values: qs.map((q) => fmtCr(q.netPremiumIncome)) },
    { label: "Gross Premium Income", values: qs.map((q) => fmtCr(q.grossPremiumIncome)) },
    { label: "Income from Investments", values: qs.map((q) => fmtCr(q.incomeFromInvestments)) },
    { label: "Benefits Paid (Net)", values: qs.map((q) => fmtCr(q.benefitsPaidNet)) },
    { label: "Change in Val. of Liabilities", values: qs.map((q) => fmtCr(q.changeInValuationOfLiabilities)) },
    { label: "Net Profit", values: qs.map((q) => fmtCr(q.netProfit)), isBold: true },
    { label: "Net Margin%", values: qs.map((q) => fmtPct(q.netMargin)), isMargin: true },
    { label: "Solvency Ratio", values: qs.map((q) => fmtX(q.solvencyRatio)), isMargin: true },
  ];
}

export const liPlLines: AnnualLine<LifeInsuranceAnnual>[] = [
  { label: "Revenue Account — Policyholders", value: () => DASH, isBold: true },
  { label: "Gross Premium Income", value: (a) => fmtCr(a.grossPremiumIncome), indent: true },
  { label: "Net Premium Income", value: (a) => fmtCr(a.netPremiumIncome), indent: true },
  { label: "First-Year Premium", value: (a) => fmtCr(a.incomeFirstYearPremium), indent: true },
  { label: "Renewal Premium", value: (a) => fmtCr(a.incomeRenewalPremium), indent: true },
  { label: "Single Premium", value: (a) => fmtCr(a.incomeSinglePremium), indent: true },
  { label: "Reinsurance Ceded", value: (a) => fmtCr(a.reinsuranceCeded), indent: true },
  { label: "Income from Investments", value: (a) => fmtCr(a.incomeFromInvestments), indent: true },
  { label: "Other Income", value: (a) => fmtCr(a.otherIncomePolicyholders), indent: true },
  { label: "Total Revenue", value: (a) => fmtCr(a.totalRevenuePolicyholders), isBold: true },
  { label: "First-Year Commission", value: (a) => fmtCr(a.commissionFirstYearPremium), indent: true },
  { label: "Renewal Commission", value: (a) => fmtCr(a.commissionRenewalPremium), indent: true },
  { label: "Single Commission", value: (a) => fmtCr(a.commissionSinglePremium), indent: true },
  { label: "Total Commission", value: (a) => fmtCr(a.totalCommission), isBold: true },
  { label: "Employees' Remuneration", value: (a) => fmtCr(a.employeesRemuneration), indent: true },
  { label: "Administration Expenses", value: (a) => fmtCr(a.administrationExpenses), indent: true },
  { label: "Total Operating Expenses", value: (a) => fmtCr(a.totalOperatingExpenses), isBold: true },
  { label: "Benefits Paid (Net)", value: (a) => fmtCr(a.benefitsPaidNet), indent: true },
  { label: "Change in Val. of Liabilities", value: (a) => fmtCr(a.changeInValuationOfLiabilities), indent: true },
  { label: "Surplus from Revenue Account", value: (a) => fmtCr(a.surplusFromRevenueAccount), isBold: true },
  { label: "Shareholders' Account", value: () => DASH, isBold: true },
  { label: "Transfer from Policyholders", value: (a) => fmtCr(a.transferFromPolicyholders), indent: true },
  { label: "Income from Investments", value: (a) => fmtCr(a.incomeFromInvestmentsShareholders), indent: true },
  { label: "Shareholders' Expenses", value: (a) => fmtCr(a.shareholdersExpenses), indent: true },
  { label: "Profit Before Tax", value: (a) => fmtCr(a.profitBeforeTax), isBold: true },
  { label: "Tax", value: (a) => fmtCr(a.tax) },
  { label: "Net Profit", value: (a) => fmtCr(a.netProfit), isBold: true },
];

export const liBsLines: AnnualLine<LifeInsuranceAnnual>[] = [
  { label: "Sources of Funds", value: () => DASH, isBold: true },
  { label: "Share Capital", value: (a) => fmtCr(a.shareCapital), indent: true },
  { label: "Reserves & Surplus", value: (a) => fmtCr(a.reservesAndSurplus), indent: true },
  { label: "Fair Value Change Account", value: (a) => fmtCr(a.fairValueChangeAccount), indent: true },
  { label: "Borrowings", value: (a) => fmtCr(a.borrowings), indent: true },
  { label: "Policyholders' Funds", value: (a) => fmtCr(a.policyholdersFunds), indent: true },
  { label: "Funds for Future Appropriations", value: (a) => fmtCr(a.fundsForFutureAppropriations), indent: true },
  { label: "Total Sources of Funds", value: (a) => fmtCr(a.totalSourcesOfFunds), isBold: true },
  { label: "Application of Funds", value: () => DASH, isBold: true },
  { label: "Investments — Shareholders", value: (a) => fmtCr(a.investmentsShareholders), indent: true },
  { label: "Investments — Policyholders", value: (a) => fmtCr(a.investmentsPolicyholders), indent: true },
  { label: "Assets for Linked Liabilities", value: (a) => fmtCr(a.assetsHeldToCoverLinkedLiabilities), indent: true },
  { label: "Loans", value: (a) => fmtCr(a.loansApplicationOfFunds), indent: true },
  { label: "Fixed Assets", value: (a) => fmtCr(a.fixedAssets), indent: true },
  { label: "Cash & Bank Balances", value: (a) => fmtCr(a.cashAndBankBalances), indent: true },
  { label: "Advances & Other Assets", value: (a) => fmtCr(a.advancesAndOtherAssets), indent: true },
  { label: "Current Liabilities", value: (a) => fmtCr(a.currentLiabilities), indent: true },
  { label: "Provisions", value: (a) => fmtCr(a.provisions), indent: true },
  { label: "Total Application of Funds", value: (a) => fmtCr(a.totalApplicationOfFunds), isBold: true },
  { label: "Net Worth", value: (a) => fmtCr(a.netWorth), isBold: true },
  { label: "Total Assets", value: (a) => fmtCr(a.totalAssets), isBold: true },
];

// ════════════════════════════════════════════════════════════════════════════
// General Insurance (no CF)
// ════════════════════════════════════════════════════════════════════════════

export function giPlQuarterRows(qs: GeneralInsuranceQuarter[]): StmtRow[] {
  return [
    { label: "Gross Premiums Written", values: qs.map((q) => fmtCr(q.grossPremiumsWritten)) },
    { label: "Net Premium", values: qs.map((q) => fmtCr(q.netPremium)) },
    { label: "Premium Earned", values: qs.map((q) => fmtCr(q.premiumEarned)) },
    { label: "Incurred Claims", values: qs.map((q) => fmtCr(q.incurredClaims)) },
    { label: "Net Commission", values: qs.map((q) => fmtCr(q.netCommission)) },
    { label: "Underwriting Profit / Loss", values: qs.map((q) => fmtCr(q.underwritingProfitOrLoss)), isBold: true },
    { label: "Net Profit", values: qs.map((q) => fmtCr(q.netProfit)), isBold: true },
    { label: "Net Margin%", values: qs.map((q) => fmtPct(q.netMargin)), isMargin: true },
    { label: "Combined Ratio%", values: qs.map((q) => fmtPct(q.combinedRatio)), isMargin: true },
  ];
}

export const giPlLines: AnnualLine<GeneralInsuranceAnnual>[] = [
  { label: "Revenue Account", value: () => DASH, isBold: true },
  { label: "Gross Premiums Written", value: (a) => fmtCr(a.grossPremiumsWritten), indent: true },
  { label: "Net Premium Written", value: (a) => fmtCr(a.netPremiumWritten), indent: true },
  { label: "Net Premium", value: (a) => fmtCr(a.netPremium), indent: true },
  { label: "Premium Earned", value: (a) => fmtCr(a.premiumEarned), indent: true },
  { label: "Reinsurance Ceded", value: (a) => fmtCr(a.reinsuranceCeded), indent: true },
  { label: "Reinsurance Accepted", value: (a) => fmtCr(a.reinsuranceAccepted), indent: true },
  { label: "Income from Investments", value: (a) => fmtCr(a.incomeFromInvestments), indent: true },
  { label: "Other Income", value: (a) => fmtCr(a.otherIncome), indent: true },
  { label: "Total Revenue", value: (a) => fmtCr(a.totalRevenue), isBold: true },
  { label: "Claims Paid", value: (a) => fmtCr(a.claimsPaid), indent: true },
  { label: "Change in Outstanding Claims", value: (a) => fmtCr(a.changeInOutstandingClaims), indent: true },
  { label: "Reinsurance Recoveries", value: (a) => fmtCr(a.reinsuranceRecoveriesOnClaims), indent: true },
  { label: "Incurred Claims", value: (a) => fmtCr(a.incurredClaims), isBold: true },
  { label: "Commission Paid", value: (a) => fmtCr(a.commissionPaid), indent: true },
  { label: "Commission from Reinsurance", value: (a) => fmtCr(a.commissionReceivedFromReinsurance), indent: true },
  { label: "Net Commission", value: (a) => fmtCr(a.netCommission), isBold: true },
  { label: "Operating Expenses", value: (a) => fmtCr(a.totalOperatingExpensesRelatedToInsurance) },
  { label: "Underwriting Profit / Loss", value: (a) => fmtCr(a.underwritingProfitOrLoss), isBold: true },
  { label: "Profit Before Tax", value: (a) => fmtCr(a.profitBeforeTax), isBold: true },
  { label: "Tax", value: (a) => fmtCr(a.tax) },
  { label: "Net Profit", value: (a) => fmtCr(a.netProfit), isBold: true },
];

export const giBsLines: AnnualLine<GeneralInsuranceAnnual>[] = [
  { label: "Sources of Funds", value: () => DASH, isBold: true },
  { label: "Share Capital", value: (a) => fmtCr(a.shareCapital), indent: true },
  { label: "Reserves & Surplus", value: (a) => fmtCr(a.reservesAndSurplus), indent: true },
  { label: "Fair Value Change Account", value: (a) => fmtCr(a.fairValueChangeAccount), indent: true },
  { label: "Borrowings", value: (a) => fmtCr(a.borrowings), indent: true },
  { label: "Total Sources of Funds", value: (a) => fmtCr(a.totalSourcesOfFunds), isBold: true },
  { label: "Application of Funds", value: () => DASH, isBold: true },
  { label: "Investments", value: (a) => fmtCr(a.investments), indent: true },
  { label: "Loans", value: (a) => fmtCr(a.loansApplicationOfFunds), indent: true },
  { label: "Fixed Assets", value: (a) => fmtCr(a.fixedAssets), indent: true },
  { label: "Cash & Bank Balances", value: (a) => fmtCr(a.cashAndBankBalances), indent: true },
  { label: "Advances & Other Assets", value: (a) => fmtCr(a.advancesAndOtherAssets), indent: true },
  { label: "Current Liabilities", value: (a) => fmtCr(a.currentLiabilities), indent: true },
  { label: "Provisions", value: (a) => fmtCr(a.provisions), indent: true },
  { label: "Total Application of Funds", value: (a) => fmtCr(a.totalApplicationOfFunds), isBold: true },
  { label: "Net Worth", value: (a) => fmtCr(a.netWorth), isBold: true },
  { label: "Total Assets", value: (a) => fmtCr(a.totalAssets), isBold: true },
];
