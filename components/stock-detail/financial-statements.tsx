"use client";

/**
 * Financial statements section — the VERIFICATION FLOOR beneath the interpretation cards.
 * Renders the three raw statement tables (P&L, Balance Sheet, Cash Flow) in a
 * collapsible section, open by default. Family-aware: each family gets its own row set
 * drawn from its real payload fields. Honest "—" for every null; no fabrication.
 *
 * Layout: periods as columns, line-items as rows (standard statement orientation).
 * Quarterly P&L: last 8 quarters visible, show-all toggle. Annual P&L / Balance Sheet /
 * Cash Flow render the annualSeries (oldest→newest), last 5 years visible with a show-all
 * toggle. Honest "—" per null cell, per year — a year that didn't disclose a line dashes
 * it. A stock with one year on file shows a single column (narrow, not broken).
 */

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Panel, shortPeriod, tint } from "./health/shared";
import type {
  FundamentalsView,
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

// ── formatters (self-contained — no cross-import from fundamentals.tsx) ───────
const DASH = "—";
const fmtPct = (v: number | null | undefined, dp = 1) =>
  v == null ? DASH : `${v.toFixed(dp)}%`;
const fmtX = (v: number | null | undefined, dp = 2) =>
  v == null ? DASH : `${v.toFixed(dp)}×`;

function fmtCr(v: number | null | undefined) {
  if (v == null) return DASH;
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  return `${sign}₹${a.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

// ── statement row ─────────────────────────────────────────────────────────────
type StmtRow = {
  label: string;
  values: string[];
  indent?: boolean;   // sub-row (indented label, text-ink3)
  isMargin?: boolean; // %-type row → text-ink2, not competing with money
  isBold?: boolean;   // total / headline row
};

// ── generic multi-period statement table (periods as columns) ─────────────────
function StmtTable({
  periods,
  rows,
  note,
}: {
  periods: string[];
  rows: StmtRow[];
  note?: string;
}) {
  if (periods.length === 0) {
    return <p className="py-6 text-center text-[12px] text-ink3">No data available for this statement.</p>;
  }
  return (
    <div>
      {note && <p className="mb-2 text-[11px] text-ink3 italic">{note}</p>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="min-w-[168px] px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                Line item
              </th>
              {periods.map((p) => (
                <th
                  key={p}
                  className="min-w-[88px] px-2 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide text-ink3"
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.label}-${i}`} className="border-t border-line">
                <td
                  className={cn(
                    "px-2 py-[7px] text-left text-[11.5px]",
                    row.indent ? "pl-5 text-ink3" : "text-ink2",
                    row.isBold && "font-semibold text-ink",
                  )}
                >
                  {row.label}
                </td>
                {row.values.map((v, j) => (
                  <td
                    key={j}
                    className={cn(
                      "num px-2 py-[7px] text-right",
                      v === DASH ? "text-ink3" : row.isMargin ? "text-ink2" : "text-ink",
                      row.isBold && "font-semibold",
                    )}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── windowing constants ───────────────────────────────────────────────────────
const MAX_Q = 8;
const MAX_YEARS = 5;

// ── show-all toggle (quarters or years) ───────────────────────────────────────
function ShowAllToggle({
  total,
  max,
  unit,
  showAll,
  onToggle,
}: {
  total: number;
  max: number;
  unit: string;
  showAll: boolean;
  onToggle: () => void;
}) {
  if (total <= max) return null;
  return (
    <button
      onClick={onToggle}
      className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[11.5px] text-ink2 transition-colors hover:text-ink"
    >
      {showAll ? "Show recent only" : `Show all ${total} ${unit}`}
      <Icons.caretDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
    </button>
  );
}

// ── annual statement table — one line-def per row, mapped across every year ────
// Each year of the (oldest→newest) series becomes a COLUMN, exactly like the quarterly
// table does with quarters: last MAX_YEARS visible, show-all expands the rest. A
// single-year stock renders one column. Honest "—" per null cell (the line-def's value()
// returns DASH for that year).
type AnnualLine<T> = {
  label: string;
  value: (a: T) => string;
  indent?: boolean;
  isMargin?: boolean;
  isBold?: boolean;
};

function buildAnnualRows<T>(items: T[], lines: AnnualLine<T>[]): StmtRow[] {
  return lines.map((ln) => ({
    label: ln.label,
    values: items.map(ln.value),
    indent: ln.indent,
    isMargin: ln.isMargin,
    isBold: ln.isBold,
  }));
}

function AnnualStmtTable<T extends { fiscalYear: string }>({
  series,
  lines,
  note,
}: {
  series: T[]; // oldest → newest
  lines: AnnualLine<T>[];
  note?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  if (series.length === 0) {
    return <p className="py-6 text-center text-[12px] text-ink3">No annual figures available.</p>;
  }
  const visible = showAll ? series : series.slice(-MAX_YEARS);
  return (
    <div>
      <StmtTable periods={visible.map((a) => a.fiscalYear)} rows={buildAnnualRows(visible, lines)} note={note} />
      <ShowAllToggle total={series.length} max={MAX_YEARS} unit="years" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
    </div>
  );
}

// ── statement type tabs ───────────────────────────────────────────────────────
type StmtType = "pl" | "bs" | "cf";

function StmtTabs({
  active,
  onChange,
  tabs,
}: {
  active: StmtType;
  onChange: (t: StmtType) => void;
  tabs: { id: StmtType; label: string }[];
}) {
  return (
    <div className="mb-4 inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
            active === t.id
              ? "bg-surface-3 text-ink"
              : "cursor-pointer text-ink3 hover:text-ink2",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── quarterly / annual sub-toggle ─────────────────────────────────────────────
function PeriodToggle({
  active,
  onChange,
}: {
  active: "q" | "a";
  onChange: (p: "q" | "a") => void;
}) {
  return (
    <div className="mb-3 inline-flex rounded-md border border-line bg-surface-2 p-0.5">
      {(["q", "a"] as const).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded px-2.5 py-0.5 text-[10.5px] font-medium transition-colors",
            active === p ? "bg-surface-3 text-ink" : "cursor-pointer text-ink3 hover:text-ink2",
          )}
        >
          {p === "q" ? "Quarterly" : "Annual"}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Non-financial statements
// ════════════════════════════════════════════════════════════════════════════

function NfPL({
  quarters,
  annualSeries,
}: {
  quarters: QuarterPoint[];
  annualSeries: AnnualSnapshot[];
}) {
  const [mode, setMode] = useState<"q" | "a">("q");
  const [showAll, setShowAll] = useState(false);

  if (mode === "q") {
    const qVisible = showAll ? quarters : quarters.slice(-MAX_Q);
    const rows: StmtRow[] = [
      { label: "Revenue", values: qVisible.map((q) => fmtCr(q.revenue)) },
      { label: "Expenses", values: qVisible.map((q) => fmtCr(q.expenses)) },
      { label: "Operating Profit", values: qVisible.map((q) => fmtCr(q.operatingProfit)), isBold: true },
      { label: "OPM%", values: qVisible.map((q) => fmtPct(q.operatingMargin)), isMargin: true },
      { label: "Other Income", values: qVisible.map((q) => fmtCr(q.otherIncome)) },
      { label: "Interest", values: qVisible.map((q) => fmtCr(q.interest)) },
      { label: "Depreciation", values: qVisible.map((q) => fmtCr(q.depreciation)) },
      { label: "Profit Before Tax", values: qVisible.map((q) => fmtCr(q.profitBeforeTax)), isBold: true },
      { label: "Tax", values: qVisible.map((q) => fmtCr(q.tax)) },
      { label: "Net Profit", values: qVisible.map((q) => fmtCr(q.netProfit)), isBold: true },
      { label: "Net Margin%", values: qVisible.map((q) => fmtPct(q.netMargin)), isMargin: true },
    ];
    return (
      <div>
        <PeriodToggle active={mode} onChange={setMode} />
        <StmtTable periods={qVisible.map((q) => shortPeriod(q.periodKey))} rows={rows} />
        <ShowAllToggle total={quarters.length} max={MAX_Q} unit="quarters" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
      </div>
    );
  }

  const lines: AnnualLine<AnnualSnapshot>[] = [
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
  return (
    <div>
      <PeriodToggle active={mode} onChange={setMode} />
      <AnnualStmtTable series={annualSeries} lines={lines} />
    </div>
  );
}

function NfBS({ annualSeries }: { annualSeries: AnnualSnapshot[] }) {
  const lines: AnnualLine<AnnualSnapshot>[] = [
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
  return (
    <AnnualStmtTable
      series={annualSeries}
      lines={lines}
      note={'"—" means not separately disclosed in the filing.'}
    />
  );
}

function NfCF({ annualSeries }: { annualSeries: AnnualSnapshot[] }) {
  const lines: AnnualLine<AnnualSnapshot>[] = [
    { label: "Cash from Operating", value: (a) => fmtCr(a.cashFromOperating), isBold: true },
    { label: "Cash from Investing", value: (a) => fmtCr(a.cashFromInvesting) },
    { label: "Cash from Financing", value: (a) => fmtCr(a.cashFromFinancing) },
    { label: "Free Cash Flow", value: (a) => fmtCr(a.fcf), isBold: true },
    { label: "Capex", value: (a) => fmtCr(a.capex) },
  ];
  return <AnnualStmtTable series={annualSeries} lines={lines} />;
}

// ════════════════════════════════════════════════════════════════════════════
// Banking statements
// ════════════════════════════════════════════════════════════════════════════

function BkPL({
  quarters,
  annualSeries,
}: {
  quarters: BankingQuarter[];
  annualSeries: BankingAnnual[];
}) {
  const [mode, setMode] = useState<"q" | "a">("q");
  const [showAll, setShowAll] = useState(false);

  if (mode === "q") {
    const qVisible = showAll ? quarters : quarters.slice(-MAX_Q);
    const rows: StmtRow[] = [
      { label: "Interest Earned", values: qVisible.map((q) => fmtCr(q.interestEarned)) },
      { label: "Interest Expended", values: qVisible.map((q) => fmtCr(q.interestExpended)) },
      { label: "Net Interest Income", values: qVisible.map((q) => fmtCr(q.nii)), isBold: true },
      { label: "Other Income", values: qVisible.map((q) => fmtCr(q.otherIncome)) },
      { label: "Total Income", values: qVisible.map((q) => fmtCr(q.totalIncome)), isBold: true },
      { label: "PPOP", values: qVisible.map((q) => fmtCr(q.ppop)) },
      { label: "Provisions", values: qVisible.map((q) => fmtCr(q.provisions)) },
      { label: "Net Profit", values: qVisible.map((q) => fmtCr(q.netProfit)), isBold: true },
      { label: "Net Margin%", values: qVisible.map((q) => fmtPct(q.netMargin)), isMargin: true },
    ];
    return (
      <div>
        <PeriodToggle active={mode} onChange={setMode} />
        <StmtTable periods={qVisible.map((q) => shortPeriod(q.periodKey))} rows={rows} />
        <ShowAllToggle total={quarters.length} max={MAX_Q} unit="quarters" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
      </div>
    );
  }

  const lines: AnnualLine<BankingAnnual>[] = [
    { label: "Interest Earned", value: (a) => fmtCr(a.interestEarned), isBold: true },
    { label: "Interest on Advances", value: (a) => fmtCr(a.interestOnAdvances), indent: true },
    { label: "Revenue on Investments", value: (a) => fmtCr(a.revenueOnInvestments), indent: true },
  ];
  return (
    <div>
      <PeriodToggle active={mode} onChange={setMode} />
      <AnnualStmtTable
        series={annualSeries}
        lines={lines}
        note="Banking annual P&L shows the earnings mix (interest-income breakdown) across reported years."
      />
    </div>
  );
}

function BkBS({ annualSeries }: { annualSeries: BankingAnnual[] }) {
  const lines: AnnualLine<BankingAnnual>[] = [
    { label: "Capital", value: (a) => fmtCr(a.capital) },
    { label: "Reserves & Surplus", value: (a) => fmtCr(a.reservesAndSurplus) },
    { label: "Net Worth", value: (a) => fmtCr(a.netWorth), isBold: true },
    { label: "Deposits", value: (a) => fmtCr(a.deposits), isBold: true },
    { label: "Advances", value: (a) => fmtCr(a.advances), isBold: true },
    { label: "Investments", value: (a) => fmtCr(a.investments) },
    { label: "Borrowings", value: (a) => fmtCr(a.borrowings) },
    { label: "Cash & Balances with RBI", value: (a) => fmtCr(a.cashAndBalancesWithRbi) },
    { label: "Total Assets", value: (a) => fmtCr(a.totalAssets), isBold: true },
  ];
  return <AnnualStmtTable series={annualSeries} lines={lines} />;
}

function BkCF({ annualSeries }: { annualSeries: BankingAnnual[] }) {
  const lines: AnnualLine<BankingAnnual>[] = [
    { label: "Cash from Operating", value: (a) => fmtCr(a.cashFromOperating), isBold: true },
    { label: "Cash from Investing", value: (a) => fmtCr(a.cashFromInvesting) },
    { label: "Cash from Financing", value: (a) => fmtCr(a.cashFromFinancing) },
  ];
  return <AnnualStmtTable series={annualSeries} lines={lines} />;
}

// ════════════════════════════════════════════════════════════════════════════
// NBFC statements
// ════════════════════════════════════════════════════════════════════════════

function NbfcPL({
  quarters,
  annualSeries,
}: {
  quarters: NbfcQuarter[];
  annualSeries: NbfcAnnual[];
}) {
  const [mode, setMode] = useState<"q" | "a">("q");
  const [showAll, setShowAll] = useState(false);

  if (mode === "q") {
    const qVisible = showAll ? quarters : quarters.slice(-MAX_Q);
    const rows: StmtRow[] = [
      { label: "Revenue (Total Income)", values: qVisible.map((q) => fmtCr(q.revenue)) },
      { label: "Interest Income", values: qVisible.map((q) => fmtCr(q.interestIncome)), indent: true },
      { label: "Fee & Commission Income", values: qVisible.map((q) => fmtCr(q.feeAndCommissionIncome)), indent: true },
      { label: "Finance Costs", values: qVisible.map((q) => fmtCr(q.financeCosts)) },
      { label: "Impairment on Fin. Instruments", values: qVisible.map((q) => fmtCr(q.impairmentOnFinancialInstruments)) },
      { label: "Net Interest Income", values: qVisible.map((q) => fmtCr(q.nii)), isBold: true },
      { label: "Net Profit", values: qVisible.map((q) => fmtCr(q.netProfit)), isBold: true },
      { label: "Net Margin%", values: qVisible.map((q) => fmtPct(q.netMargin)), isMargin: true },
    ];
    return (
      <div>
        <PeriodToggle active={mode} onChange={setMode} />
        <StmtTable periods={qVisible.map((q) => shortPeriod(q.periodKey))} rows={rows} />
        <ShowAllToggle total={quarters.length} max={MAX_Q} unit="quarters" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
      </div>
    );
  }

  const lines: AnnualLine<NbfcAnnual>[] = [
    { label: "Interest Income", value: (a) => fmtCr(a.interestIncome) },
    { label: "Fee & Commission Income", value: (a) => fmtCr(a.feeAndCommissionIncome) },
    { label: "Net Profit", value: (a) => fmtCr(a.netProfit), isBold: true },
    { label: "Net Margin%", value: (a) => fmtPct(a.netMargin), isMargin: true },
  ];
  return (
    <div>
      <PeriodToggle active={mode} onChange={setMode} />
      <AnnualStmtTable series={annualSeries} lines={lines} />
    </div>
  );
}

function NbfcBS({ annualSeries }: { annualSeries: NbfcAnnual[] }) {
  const lines: AnnualLine<NbfcAnnual>[] = [
    { label: "Total Equity", value: (a) => fmtCr(a.totalEquity), isBold: true },
    { label: "Net Worth", value: (a) => fmtCr(a.netWorth) },
    { label: "Loans (AUM)", value: (a) => fmtCr(a.loans), isBold: true },
    { label: "Debt Securities", value: (a) => fmtCr(a.debtSecurities), indent: true },
    { label: "Borrowings", value: (a) => fmtCr(a.borrowings), indent: true },
    { label: "Deposits (Liabilities)", value: (a) => fmtCr(a.depositsLiabilities), indent: true },
    { label: "Investments", value: (a) => fmtCr(a.investments) },
    { label: "Cash & Cash Equivalents", value: (a) => fmtCr(a.cashAndCashEquivalents) },
    { label: "Total Assets", value: (a) => fmtCr(a.totalAssets), isBold: true },
  ];
  return (
    <AnnualStmtTable
      series={annualSeries}
      lines={lines}
      note={'Non-deposit-taking NBFCs show "—" for deposits liabilities.'}
    />
  );
}

function NbfcCF({ annualSeries }: { annualSeries: NbfcAnnual[] }) {
  const lines: AnnualLine<NbfcAnnual>[] = [
    { label: "Cash from Operating", value: (a) => fmtCr(a.cashFromOperating), isBold: true },
    { label: "Cash from Investing", value: (a) => fmtCr(a.cashFromInvesting) },
    { label: "Cash from Financing", value: (a) => fmtCr(a.cashFromFinancing) },
  ];
  return <AnnualStmtTable series={annualSeries} lines={lines} />;
}

// ════════════════════════════════════════════════════════════════════════════
// Life Insurance statements
// ════════════════════════════════════════════════════════════════════════════

function LiPL({ quarters }: { quarters: LifeInsuranceQuarter[] }) {
  const [showAll, setShowAll] = useState(false);
  const qVisible = showAll ? quarters : quarters.slice(-MAX_Q);
  const rows: StmtRow[] = [
    { label: "Net Premium Income", values: qVisible.map((q) => fmtCr(q.netPremiumIncome)) },
    { label: "Gross Premium Income", values: qVisible.map((q) => fmtCr(q.grossPremiumIncome)) },
    { label: "Income from Investments", values: qVisible.map((q) => fmtCr(q.incomeFromInvestments)) },
    { label: "Benefits Paid (Net)", values: qVisible.map((q) => fmtCr(q.benefitsPaidNet)) },
    { label: "Change in Val. of Liabilities", values: qVisible.map((q) => fmtCr(q.changeInValuationOfLiabilities)) },
    { label: "Net Profit", values: qVisible.map((q) => fmtCr(q.netProfit)), isBold: true },
    { label: "Net Margin%", values: qVisible.map((q) => fmtPct(q.netMargin)), isMargin: true },
    { label: "Solvency Ratio", values: qVisible.map((q) => fmtX(q.solvencyRatio)), isMargin: true },
  ];
  return (
    <div>
      <StmtTable
        periods={qVisible.map((q) => shortPeriod(q.periodKey))}
        rows={rows}
        note="Income from investments and change in valuation of liabilities can be negative (mark-to-market)."
      />
      <ShowAllToggle total={quarters.length} max={MAX_Q} unit="quarters" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
    </div>
  );
}

function LiBS({ annualSeries }: { annualSeries: LifeInsuranceAnnual[] }) {
  const lines: AnnualLine<LifeInsuranceAnnual>[] = [
    { label: "Policyholders' Funds", value: (a) => fmtCr(a.policyholdersFunds), isBold: true },
    { label: "Assets for Linked Liabilities", value: (a) => fmtCr(a.assetsHeldToCoverLinkedLiabilities) },
    { label: "Investments — Shareholders", value: (a) => fmtCr(a.investmentsShareholders) },
    { label: "Investments — Policyholders", value: (a) => fmtCr(a.investmentsPolicyholders) },
    { label: "Share Capital", value: (a) => fmtCr(a.shareCapital) },
    { label: "Reserves & Surplus", value: (a) => fmtCr(a.reservesAndSurplus) },
    { label: "Net Worth", value: (a) => fmtCr(a.netWorth), isBold: true },
    { label: "Total Assets", value: (a) => fmtCr(a.totalAssets), isBold: true },
  ];
  return <AnnualStmtTable series={annualSeries} lines={lines} />;
}

// ════════════════════════════════════════════════════════════════════════════
// General Insurance statements
// ════════════════════════════════════════════════════════════════════════════

function GiPL({ quarters }: { quarters: GeneralInsuranceQuarter[] }) {
  const [showAll, setShowAll] = useState(false);
  const qVisible = showAll ? quarters : quarters.slice(-MAX_Q);
  const rows: StmtRow[] = [
    { label: "Gross Premiums Written", values: qVisible.map((q) => fmtCr(q.grossPremiumsWritten)) },
    { label: "Net Premium", values: qVisible.map((q) => fmtCr(q.netPremium)) },
    { label: "Premium Earned", values: qVisible.map((q) => fmtCr(q.premiumEarned)) },
    { label: "Incurred Claims", values: qVisible.map((q) => fmtCr(q.incurredClaims)) },
    { label: "Net Commission", values: qVisible.map((q) => fmtCr(q.netCommission)) },
    { label: "Underwriting Profit / Loss", values: qVisible.map((q) => fmtCr(q.underwritingProfitOrLoss)), isBold: true },
    { label: "Net Profit", values: qVisible.map((q) => fmtCr(q.netProfit)), isBold: true },
    { label: "Net Margin%", values: qVisible.map((q) => fmtPct(q.netMargin)), isMargin: true },
    { label: "Combined Ratio%", values: qVisible.map((q) => fmtPct(q.combinedRatio)), isMargin: true },
  ];
  return (
    <div>
      <StmtTable
        periods={qVisible.map((q) => shortPeriod(q.periodKey))}
        rows={rows}
        note="Combined ratio above 100% = underwriting loss before investment income. Underwriting profit/loss can be negative."
      />
      <ShowAllToggle total={quarters.length} max={MAX_Q} unit="quarters" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
    </div>
  );
}

function GiBS({ annualSeries }: { annualSeries: GeneralInsuranceAnnual[] }) {
  const lines: AnnualLine<GeneralInsuranceAnnual>[] = [
    { label: "Investments", value: (a) => fmtCr(a.investments), isBold: true },
    { label: "Share Capital", value: (a) => fmtCr(a.shareCapital) },
    { label: "Reserves & Surplus", value: (a) => fmtCr(a.reservesAndSurplus) },
    { label: "Net Worth", value: (a) => fmtCr(a.netWorth), isBold: true },
    { label: "Total Assets", value: (a) => fmtCr(a.totalAssets), isBold: true },
  ];
  return (
    <AnnualStmtTable
      series={annualSeries}
      lines={lines}
      note="Investments is its own line — not reconciled against total assets (GI convention)."
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Family dispatcher
// ════════════════════════════════════════════════════════════════════════════

function StmtContent({ view, stmt }: { view: FundamentalsView; stmt: StmtType }) {
  if (view.family === "non_financial" && view.nonFinancial) {
    const nf = view.nonFinancial;
    if (stmt === "pl") return <NfPL quarters={nf.quarters} annualSeries={nf.annualSeries} />;
    if (stmt === "bs") return <NfBS annualSeries={nf.annualSeries} />;
    return <NfCF annualSeries={nf.annualSeries} />;
  }
  if (view.family === "banking" && view.banking) {
    const bk = view.banking;
    if (stmt === "pl") return <BkPL quarters={bk.quarters} annualSeries={bk.annualSeries} />;
    if (stmt === "bs") return <BkBS annualSeries={bk.annualSeries} />;
    return <BkCF annualSeries={bk.annualSeries} />;
  }
  if (view.family === "nbfc" && view.nbfc) {
    const nb = view.nbfc;
    if (stmt === "pl") return <NbfcPL quarters={nb.quarters} annualSeries={nb.annualSeries} />;
    if (stmt === "bs") return <NbfcBS annualSeries={nb.annualSeries} />;
    return <NbfcCF annualSeries={nb.annualSeries} />;
  }
  if (view.family === "life_insurance" && view.lifeInsurance) {
    const li = view.lifeInsurance;
    if (stmt === "pl") return <LiPL quarters={li.quarters} />;
    if (stmt === "bs") return <LiBS annualSeries={li.annualSeries} />;
    return <p className="py-6 text-center text-[12px] text-ink3">Cash flow is not served for life insurance.</p>;
  }
  if (view.family === "general_insurance" && view.generalInsurance) {
    const gi = view.generalInsurance;
    if (stmt === "pl") return <GiPL quarters={gi.quarters} />;
    if (stmt === "bs") return <GiBS annualSeries={gi.annualSeries} />;
    return <p className="py-6 text-center text-[12px] text-ink3">Cash flow is not served for general insurance.</p>;
  }
  return (
    <p className="py-6 text-center text-[12px] text-ink3">
      Financial statements for this sector are being built.
    </p>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Main export — collapsible eyebrow + Panel with tabs
// ════════════════════════════════════════════════════════════════════════════

const ACCENT = "var(--p-found)";
const HAS_CF = new Set(["non_financial", "banking", "nbfc"]);

export function FinancialStatements({ view }: { view: FundamentalsView }) {
  const [open, setOpen] = useState(true);
  const [stmt, setStmt] = useState<StmtType>("pl");

  const tabs: { id: StmtType; label: string }[] = [
    { id: "pl", label: "Profit & Loss" },
    { id: "bs", label: "Balance Sheet" },
    ...(HAS_CF.has(view.family) ? [{ id: "cf" as StmtType, label: "Cash Flow" }] : []),
  ];

  // Switch to P&L if CF tab disappears (family switch)
  const activeStmt = tabs.some((t) => t.id === stmt) ? stmt : "pl";

  return (
    <section>
      {/* Collapsible eyebrow — mirrors SectionEyebrow markup exactly, with a caret added */}
      <div
        className="mb-4 mt-8 flex cursor-pointer select-none items-center gap-2.5"
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
      >
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border"
          style={tint(ACCENT) as CSSProperties}
        >
          <Icons.stack weight="duotone" className="h-4 w-4" />
        </span>
        <span className="eyebrow shrink-0">Financial statements</span>
        <span
          className="h-px flex-1"
          style={{ background: `color-mix(in oklch, ${ACCENT} 20%, var(--line))` }}
        />
        <span
          className="num shrink-0 rounded-full border px-2.5 py-1 text-[11px] tracking-normal"
          style={tint(ACCENT, 10, 26) as CSSProperties}
        >
          Raw figures
        </span>
        <Icons.caretDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink3 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
      </div>

      {open && (
        <Panel>
          <p className="mb-4 text-[11.5px] text-ink3">
            The reported figures, as filed — verify the analysis above against the source. "—" means
            not separately disclosed in the filing.
          </p>
          <StmtTabs active={activeStmt} onChange={setStmt} tabs={tabs} />
          <StmtContent view={view} stmt={activeStmt} />
        </Panel>
      )}
    </section>
  );
}
