"use client";

/**
 * Fundamentals tab — the business's earnings & balance sheet, quarterly spine first.
 *
 * Wired to GET /api/stocks/:symbol/fundamentals (useStockFundamentals). The endpoint
 * dispatches by industry family; this tab renders all five — non_financial, banking,
 * nbfc, life_insurance, general_insurance — each with its own statement-shaped layout
 * (the ComingState is now a defensive fallback only). Every figure traces to a real
 * endpoint field or an honest-empty dash — nothing mocked.
 *
 * Theme: matches the Health tab (components/stock-detail/health/*) — Vytal tokens only,
 * .num on every number, the same eyebrow / Panel rhythm. No raw hex, no Tailwind colour
 * names, no scoring surfaces (Fundamentals shows what the business earned & owns; the
 * grade is the Health tab's story). Units arrive canonical from the service — the tab
 * does ZERO unit conversion. No price-cheapness judgment: yields are stated as facts.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { Icons, type Icon } from "@/lib/icons";
import { Reveal } from "@/components/ui/reveal";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { useStockFundamentals } from "@/lib/api/hooks/use-stock-fundamentals";
import type {
  FundamentalsView,
  NonFinancialPayload,
  AnnualSnapshot,
  QuarterPoint,
  YieldsBlock,
  CashConversionPoint,
  NfRatioHistoryPoint,
  IndustryFamily,
  Basis,
  BankingPayload,
  BankingQuarter,
  BankingAnnual,
  BankingCasa,
  BkRatioHistoryPoint,
  NbfcPayload,
  NbfcQuarter,
  NbfcAnnual,
  LifeInsurancePayload,
  LifeInsuranceQuarter,
  LifeInsuranceAnnual,
  LiRatioHistoryPoint,
  GeneralInsurancePayload,
  GeneralInsuranceQuarter,
  GeneralInsuranceAnnual,
} from "@/types/fundamentals";
import { SectionEyebrow, Panel, shortPeriod, MiniSpark, sparkSeries } from "./health/shared";
import { WhereNext } from "./where-next";
import { casaTier, casaContextLabel } from "@/lib/casa-display";

// ════════════════════════════════════════════════════════════════════════════
// formatters — every number wears .num at the render site
// ════════════════════════════════════════════════════════════════════════════
const DASH = "—";

const fmtPct = (v: number | null | undefined, dp = 1) => (v == null ? DASH : `${v.toFixed(dp)}%`);

const fmtX = (v: number | null | undefined, dp = 2) => (v == null ? DASH : `${v.toFixed(dp)}×`);

const fmtRatio = (v: number | null | undefined, dp = 2) => (v == null ? DASH : v.toFixed(dp));

function fmtCr(v: number | null | undefined, dp = 0) {
  if (v == null) return DASH;
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  return `${sign}₹${a.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp })} Cr`;
}

function fmtSignedCr(v: number | null | undefined, dp = 0) {
  if (v == null) return DASH;
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  const a = Math.abs(v);
  return `${sign}₹${a.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp })} Cr`;
}

function fmtSignedPct(v: number | null | undefined, dp = 1) {
  if (v == null) return DASH;
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(dp)}%`;
}

const fmtRupee = (v: number | null | undefined, dp = 2) =>
  v == null ? DASH : `₹${v.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

const FAMILY_LABEL: Record<IndustryFamily, string> = {
  non_financial: "non-financial",
  banking: "banking",
  nbfc: "NBFC",
  life_insurance: "life-insurance",
  general_insurance: "general-insurance",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--surface2)",
    border: "1px solid var(--line2)",
    borderRadius: 10,
    fontSize: 12,
  },
  labelStyle: { color: "var(--ink2)", fontSize: 11 },
} as const;

/** Descriptive direction chip from a signed % (Rising / Easing / Stable) — never advice. */
function dirChip(v: number | null | undefined) {
  if (v == null) return { cls: "text-ink3", glyph: "→" };
  if (v > 0.05) return { cls: "text-healthy", glyph: "↑" };
  if (v < -0.05) return { cls: "text-high", glyph: "↓" };
  return { cls: "text-ink2", glyph: "→" };
}

// ── tiny shared primitives ───────────────────────────────────────────────────
function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="text-[11px] text-ink3">{label}</div>
      <div className={cn("num mt-1 text-[18px] font-semibold", accent ?? "text-ink")}>{value}</div>
      {sub && <div className="num mt-0.5 text-[11px] text-ink3">{sub}</div>}
    </div>
  );
}

/** Honest-empty placeholder for a section whose annual/quarterly data is absent. */
function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-[12px] text-ink3">{children}</p>;
}

// MiniSpark + sparkSeries now live in ./health/shared (shared with the Overview tab's
// §5 metric cards) — same ≥3-real-point self-gate, imported above.

// ════════════════════════════════════════════════════════════════════════════
// §1 — Quarterly performance (the spine): revenue + profit + margins, basis toggle
// ════════════════════════════════════════════════════════════════════════════
function BasisToggle({
  available,
  current,
  onChange,
}: {
  available: Basis[];
  current: Basis;
  onChange: (b: Basis) => void;
}) {
  if (available.length < 2) return null;
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {available.map((b) => (
        <button
          key={b}
          onClick={() => onChange(b)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
            current === b ? "bg-surface-3 text-ink" : "cursor-pointer text-ink3 hover:text-ink2",
          )}
        >
          {b}
        </button>
      ))}
    </div>
  );
}

function QuarterlySpine({
  nf,
  view,
  onBasis,
}: {
  nf: NonFinancialPayload;
  view: FundamentalsView;
  onBasis: (b: Basis) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const quarters = nf.quarters;
  const chartData = quarters.map((q) => ({
    period: shortPeriod(q.periodKey),
    revenue: q.revenue,
    profit: q.netProfit,
  }));

  // table: newest-first, windowed to 8 unless expanded
  const rowsNewestFirst = [...quarters].reverse();
  const visibleRows = showAll ? rowsNewestFirst : rowsNewestFirst.slice(0, 8);

  return (
    <section>
      <SectionEyebrow label="Quarterly performance" icon={Icons.chartBar} accent="var(--p-found)" pill={`${quarters.length} quarters · ${view.basis}`} />
      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-ink2">
            Revenue and net profit each quarter — the recurring read on the business.
          </p>
          <BasisToggle available={view.basisAvailable} current={view.basis} onChange={onBasis} />
        </div>

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fill: "var(--ink3)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(val: number, name) => [fmtCr(val), name === "revenue" ? "Revenue" : "Net profit"]}
              />
              <Bar yAxisId="left" dataKey="revenue" name="revenue" fill="var(--p-found)" opacity={0.45} radius={[4, 4, 0, 0]} maxBarSize={34} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="profit"
                name="profit"
                stroke="var(--p-own)"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "var(--p-own)" }}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive
                animationDuration={1000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyNote>Limited history — a revenue/profit trend needs at least two quarters.</EmptyNote>
        )}

        {/* legend */}
        {chartData.length >= 2 && (
          <div className="mt-2 flex items-center gap-4 text-[11px] text-ink3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-found)", opacity: 0.5 }} />
              Revenue
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-own)" }} />
              Net profit
            </span>
          </div>
        )}

        {/* quarterly table */}
        {quarters.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="kicker mb-3">Per-quarter detail</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    {["Quarter", "Revenue", "Rev YoY", "Net profit", "Profit YoY", "Op margin", "Net margin"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "px-2 py-2 text-[9.5px] font-semibold uppercase tracking-wide text-ink3",
                            i === 0 ? "text-left" : "text-right",
                          )}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((q) => {
                    const ry = dirChip(q.revenueYoy);
                    const py = dirChip(q.profitYoy);
                    return (
                      <tr key={q.periodKey} className="border-t border-line">
                        <td className="px-2 py-2.5 text-left text-ink2">{shortPeriod(q.periodKey)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.revenue)}</td>
                        <td className={cn("num px-2 py-2.5 text-right", ry.cls)}>{fmtSignedPct(q.revenueYoy)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.netProfit)}</td>
                        <td className={cn("num px-2 py-2.5 text-right", py.cls)}>{fmtSignedPct(q.profitYoy)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtPct(q.operatingMargin)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtPct(q.netMargin)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {rowsNewestFirst.length > 8 && (
              <button
                onClick={() => setShowAll((s) => !s)}
                className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[11.5px] text-ink2 transition-colors hover:text-ink"
              >
                {showAll ? "Show recent only" : `Show all ${rowsNewestFirst.length} quarters`}
                <Icons.caretDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
              </button>
            )}
          </div>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §2 — Margin trend (operating + net margin over the quarterly spine)
// ════════════════════════════════════════════════════════════════════════════
function MarginTrend({ quarters }: { quarters: QuarterPoint[] }) {
  const data = quarters
    .map((q) => ({ period: shortPeriod(q.periodKey), op: q.operatingMargin, net: q.netMargin }))
    .filter((d) => d.op != null || d.net != null);
  const enough = data.length >= 2;

  return (
    <section>
      <SectionEyebrow label="Margin trend" icon={Icons.chartLine} accent="var(--p-mom)" pill="operating · net" />
      <Panel>
        {enough ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "var(--ink3)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  unit="%"
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number, name) => [`${v.toFixed(2)}%`, name === "op" ? "Operating margin" : "Net margin"]}
                />
                <Line type="monotone" dataKey="op" name="op" stroke="var(--p-mkt)" strokeWidth={2} dot={{ r: 2, fill: "var(--p-mkt)" }} connectNulls isAnimationActive animationDuration={900} />
                <Line type="monotone" dataKey="net" name="net" stroke="var(--p-mom)" strokeWidth={2} dot={{ r: 2, fill: "var(--p-mom)" }} connectNulls isAnimationActive animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center gap-4 text-[11px] text-ink3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-mkt)" }} />
                Operating margin
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-mom)" }} />
                Net margin
              </span>
            </div>
          </>
        ) : (
          <EmptyNote>Limited history — a margin trend needs at least two quarters with reported margins.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §3 — Profitability & returns (annual): ROE, ROCE, ROA, margins
// ════════════════════════════════════════════════════════════════════════════
function ReturnCard({
  label,
  value,
  hint,
  spark,
  sparkColor,
}: {
  label: string;
  value: string;
  hint: string;
  /** optional multi-year history for the ratio — a MiniSpark renders only with ≥3 real points. */
  spark?: (number | null)[];
  sparkColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-1 p-4">
      <div className="text-[11px] text-ink3">{label}</div>
      <div className="num mt-1.5 text-[26px] font-semibold text-ink">{value}</div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="text-[11px] text-ink3">{hint}</div>
        {spark && <MiniSpark points={spark} color={sparkColor ?? "var(--p-own)"} />}
      </div>
    </div>
  );
}

function ProfitabilityReturns({
  annual,
  history,
}: {
  annual: AnnualSnapshot | null;
  history: NfRatioHistoryPoint[];
}) {
  // Sparklines render only where the ratio has ≥3 real years (MiniSpark self-gates) — roa is
  // a derived latest-year figure with no history series, so it carries no spark.
  return (
    <section>
      <SectionEyebrow label="Profitability & returns" icon={Icons.coins} accent="var(--p-own)" pill={annual ? `annual · ${annual.fiscalYear}` : "annual"} />
      {annual ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReturnCard label="Return on equity" value={fmtPct(annual.roe, 1)} hint="Net profit ÷ shareholder equity" spark={sparkSeries(history, (r) => r.roe)} sparkColor="var(--p-own)" />
          <ReturnCard label="Return on capital" value={fmtPct(annual.roce, 1)} hint="Pre-tax return on capital employed" spark={sparkSeries(history, (r) => r.roce)} sparkColor="var(--p-found)" />
          <ReturnCard label="Return on assets" value={fmtPct(annual.roa, 1)} hint="Net profit ÷ total assets" />
          <ReturnCard label="Net margin" value={fmtPct(annual.netMargin, 1)} hint="Net profit ÷ revenue" spark={sparkSeries(history, (r) => r.netMargin)} sparkColor="var(--p-mom)" />
        </div>
      ) : (
        <Panel>
          <EmptyNote>No annual fundamentals reported yet for this basis.</EmptyNote>
        </Panel>
      )}
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §4 — Growth (annual YoY) — honest-empty the latest-year nulls
// ════════════════════════════════════════════════════════════════════════════
function GrowthSection({ annual, quarters }: { annual: AnnualSnapshot | null; quarters: QuarterPoint[] }) {
  const latestQ = [...quarters].reverse().find((q) => q.revenueYoy != null || q.profitYoy != null) ?? null;
  const annualEmpty =
    !annual || (annual.revenueGrowthYoy == null && annual.profitGrowthYoy == null && annual.epsGrowthYoy == null);

  const items: { label: string; v: number | null }[] = [
    { label: "Revenue YoY", v: annual?.revenueGrowthYoy ?? null },
    { label: "Profit YoY", v: annual?.profitGrowthYoy ?? null },
    { label: "EPS YoY", v: annual?.epsGrowthYoy ?? null },
  ];

  return (
    <section>
      <SectionEyebrow label="Growth" icon={Icons.trendUp} accent="var(--c-healthy)" pill="year-over-year" />
      <Panel>
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((it) => {
            const chip = dirChip(it.v);
            return (
              <div key={it.label} className="rounded-xl border border-line bg-surface-2 p-3.5">
                <div className="text-[11px] text-ink3">{it.label}</div>
                <div className={cn("num mt-1 text-[20px] font-semibold", it.v == null ? "text-ink3" : chip.cls)}>
                  {fmtSignedPct(it.v)}
                </div>
              </div>
            );
          })}
        </div>
        {annualEmpty && (
          <p className="mt-3 text-[11.5px] italic text-ink3">
            {latestQ
              ? `Annual year-over-year growth needs a prior year on this basis. The latest quarter (${shortPeriod(
                  latestQ.periodKey,
                )}) grew revenue ${fmtSignedPct(latestQ.revenueYoy)}${
                  latestQ.profitYoy != null ? ` and profit ${fmtSignedPct(latestQ.profitYoy)}` : ""
                } year-over-year — see the quarterly spine above.`
              : "Annual year-over-year growth needs a prior year on this basis."}
          </p>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §5 — Leverage & liquidity
// ════════════════════════════════════════════════════════════════════════════
function LeverageLiquidity({ annual }: { annual: AnnualSnapshot | null }) {
  return (
    <section>
      <SectionEyebrow label="Leverage & liquidity" icon={Icons.scales} accent="var(--p-mkt)" pill={annual ? annual.fiscalYear : "annual"} />
      {annual ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Debt / equity" value={fmtRatio(annual.debtToEquity)} sub="lower is less geared" />
          <Stat label="Interest coverage" value={fmtX(annual.interestCoverage, 1)} sub="EBIT ÷ interest" />
          <Stat label="Current ratio" value={fmtRatio(annual.currentRatio)} sub="current assets ÷ liabilities" />
          <Stat label="Quick ratio" value={fmtRatio(annual.quickRatio)} sub="ex-inventory liquidity" />
          <Stat label="Equity multiplier" value={fmtX(annual.equityMultiplier)} sub="assets ÷ equity" />
        </div>
      ) : (
        <Panel>
          <EmptyNote>No annual balance-sheet figures reported yet for this basis.</EmptyNote>
        </Panel>
      )}
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §6 — Cash flow (CFO / CFI / CFF + FCF & capex)
// ════════════════════════════════════════════════════════════════════════════
function CashFlowSection({ annual }: { annual: AnnualSnapshot | null }) {
  const flows = annual
    ? [
        { label: "Operating", v: annual.cashFromOperating },
        { label: "Investing", v: annual.cashFromInvesting },
        { label: "Financing", v: annual.cashFromFinancing },
      ]
    : [];
  const present = flows.filter((f) => f.v != null);
  const maxAbs = Math.max(1, ...present.map((f) => Math.abs(f.v as number)));
  const hasAny =
    annual &&
    (present.length > 0 || annual.fcf != null || annual.capex != null);

  return (
    <section>
      <SectionEyebrow label="Cash flow" icon={Icons.coins} accent="var(--p-own)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {hasAny ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* CFO / CFI / CFF diverging bars */}
            <div>
              <div className="kicker mb-3">Cash movements</div>
              {present.length > 0 ? (
                <div className="space-y-3">
                  {flows.map((f) => {
                    const v = f.v;
                    const pos = (v ?? 0) >= 0;
                    const w = v == null ? 0 : (Math.abs(v) / maxAbs) * 100;
                    return (
                      <div key={f.label}>
                        <div className="mb-1 flex items-baseline justify-between text-[12px]">
                          <span className="text-ink2">{f.label}</span>
                          <span className={cn("num", v == null ? "text-ink3" : pos ? "text-healthy" : "text-high")}>
                            {fmtSignedCr(v)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${w}%`, background: pos ? "var(--c-healthy)" : "var(--high)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyNote>Cash-flow statement not reported for this year.</EmptyNote>
              )}
            </div>

            {/* FCF + capex */}
            <div className="grid grid-cols-2 gap-3 self-start">
              <Stat
                label="Free cash flow"
                value={fmtCr(annual?.fcf)}
                sub="operating cash − capex"
                accent={annual?.fcf != null && annual.fcf >= 0 ? "text-healthy" : annual?.fcf != null ? "text-high" : undefined}
              />
              <Stat label="Capex" value={fmtCr(annual?.capex)} sub="capital expenditure" />
            </div>
          </div>
        ) : (
          <EmptyNote>No cash-flow figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §6b — Cash conversion (multi-year): operating cash flow vs net profit. Profit that
// doesn't convert to cash is the signal — the divergence is what this draws. Honest-empty
// when fewer than two annual years carry operating cash flow.
// ════════════════════════════════════════════════════════════════════════════
function CashConversionSection({ points }: { points: CashConversionPoint[] }) {
  const data = points.map((p) => ({ period: p.fiscalYear, cfo: p.cashFromOperating, profit: p.netProfit }));
  const enough = data.length >= 2;
  // latest-year conversion (CFO ÷ net profit) for the caption — guarded against null/≤0 profit
  const last = points[points.length - 1];
  const conv =
    last && last.netProfit != null && last.netProfit > 0 && last.cashFromOperating != null
      ? (last.cashFromOperating / last.netProfit) * 100
      : null;

  return (
    <section>
      <SectionEyebrow label="Cash conversion" icon={Icons.refresh} accent="var(--p-own)" pill="operating cash vs net profit" />
      <Panel>
        {enough ? (
          <>
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(val: number, name) => [fmtCr(val), name === "cfo" ? "Operating cash flow" : "Net profit"]}
                />
                <Bar dataKey="profit" name="profit" fill="var(--p-own)" opacity={0.5} radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="cfo" name="cfo" fill="var(--c-healthy)" opacity={0.6} radius={[4, 4, 0, 0]} maxBarSize={26} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-ink3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-own)", opacity: 0.55 }} />
                Net profit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--c-healthy)", opacity: 0.65 }} />
                Operating cash flow
              </span>
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              Operating cash flow set against net profit, year by year. When cash runs below profit the earnings
              aren&apos;t fully converting to cash
              {conv != null ? ` — the latest year converted ${conv.toFixed(0)}% of profit into operating cash` : ""}. A
              description of cash quality, not a judgment.
            </p>
          </>
        ) : (
          <EmptyNote>Cash conversion needs at least two annual years with reported operating cash flow.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §7 — Balance-sheet snapshot
// ════════════════════════════════════════════════════════════════════════════
function BalanceSheetSnapshot({ annual }: { annual: AnnualSnapshot | null }) {
  const rows: { label: string; v: number | null; accent?: string }[] = annual
    ? [
        { label: "Total assets", v: annual.totalAssets },
        { label: "Total equity", v: annual.totalEquity },
        { label: "Current assets", v: annual.currentAssets },
        { label: "Current liabilities", v: annual.currentLiabilities },
        { label: "Inventories", v: annual.inventories },
        { label: "Total debt", v: annual.totalDebt },
        { label: "Cash & equivalents", v: annual.cashAndCashEquivalents },
        { label: "Book value / share", v: annual.bookValuePerShare },
      ]
    : [];
  const hasAny = rows.some((r) => r.v != null);

  return (
    <section>
      <SectionEyebrow label="Balance-sheet snapshot" icon={Icons.stack} accent="var(--p-found)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {annual && hasAny ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                <span className="text-[11.5px] text-ink3">{r.label}</span>
                <span className="num text-[13px] text-ink">
                  {r.label === "Book value / share" ? fmtRupee(r.v) : fmtCr(r.v)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote>No annual balance-sheet figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §8 — DuPont decomposition (ROE = net margin × asset turnover × equity multiplier)
// ════════════════════════════════════════════════════════════════════════════
function DupontLeg({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-xl border border-line bg-surface-2 px-4 py-3 text-center">
      <div className="text-[10.5px] uppercase tracking-wide text-ink3">{label}</div>
      <div className="num mt-1 text-[18px] font-semibold text-ink">{value}</div>
    </div>
  );
}

function DupontSection({ annual }: { annual: AnnualSnapshot | null }) {
  const d = annual?.dupont ?? null;
  const hasLegs = d && (d.netMargin != null || d.assetTurnover != null || d.equityMultiplier != null);

  return (
    <section>
      <SectionEyebrow label="DuPont decomposition" icon={Icons.graph} accent="var(--p-mom)" pill="what drives ROE" />
      <Panel>
        {hasLegs ? (
          <>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="rounded-xl border border-p-own/30 bg-p-own/10 px-4 py-3 text-center sm:w-36">
                <div className="text-[10.5px] uppercase tracking-wide text-ink3">ROE</div>
                <div className="num mt-1 text-[20px] font-semibold text-p-own">{fmtPct(annual?.roe, 1)}</div>
              </div>
              <span className="hidden text-center text-[15px] font-semibold text-ink3 sm:block">=</span>
              <DupontLeg label="Net margin" value={fmtPct(d!.netMargin, 1)} />
              <span className="text-center text-[14px] font-semibold text-ink3">×</span>
              <DupontLeg label="Asset turnover" value={fmtX(d!.assetTurnover)} />
              <span className="text-center text-[14px] font-semibold text-ink3">×</span>
              <DupontLeg label="Equity multiplier" value={fmtX(d!.equityMultiplier)} />
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              Return on equity broken into its three real drivers — how much profit each rupee of sales keeps, how
              hard assets are worked, and how much the balance sheet is geared. A description of the mechanics, not
              a judgment.
            </p>
          </>
        ) : (
          <EmptyNote>DuPont decomposition needs annual margin, turnover and leverage figures.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §9 — Yields (business-characteristic facts; never a valuation call)
// ════════════════════════════════════════════════════════════════════════════
function YieldsSection({ yields }: { yields: YieldsBlock | null }) {
  const noMcap = !yields || yields.marketCap == null;

  return (
    <section>
      <SectionEyebrow label="Yields" icon={Icons.spark} accent="var(--p-mkt)" pill="business characteristic" />
      <Panel>
        {yields && !noMcap ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Market cap" value={fmtCr(yields.marketCap)} />
              <Stat label="Free cash flow yield" value={fmtPct(yields.fcfYield, 2)} sub="trailing FCF ÷ market cap" />
              <Stat label="Dividend yield" value={fmtPct(yields.dividendYield, 2)} sub="trailing dividends ÷ market cap" />
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">{yields.asOfBasis}. Stated as facts about the business — not a view on whether the price is cheap or dear.</p>
          </>
        ) : (
          <div className="flex items-start gap-3">
            <Icons.info weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-ink3" />
            <div>
              <p className="text-[13px] font-medium text-ink">Yields unavailable</p>
              <p className="mt-0.5 text-[12px] text-ink3">
                A live market cap isn&apos;t currently populated for this stock, so free-cash-flow and dividend
                yields can&apos;t be computed. They fill in automatically once the price snapshot carries market cap.
              </p>
            </div>
          </div>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §10 — AI summary slot (Phase-2 preview — wired to nothing, clearly marked)
// ════════════════════════════════════════════════════════════════════════════
function AiSummarySlot() {
  return (
    <section>
      <SectionEyebrow label="Fundamentals narrative" icon={Icons.brain} accent="var(--p-mom)" pill="preview" />
      <div className="rounded-2xl border border-dashed border-line2 bg-surface-1/60 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-p-mom/30 bg-p-mom/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-p-mom">
            <Icons.spark weight="fill" className="h-3 w-3" />
            AI · Coming in Phase 2
          </span>
          <span className="text-[11px] text-ink3">Not live — sample of how this will read</span>
        </div>
        <p className="diagnosis mt-3 max-w-[46em] text-[13.5px] text-ink2 opacity-80">
          “Revenue grew for a fourth straight quarter and net profit rebuilt off a soft first quarter, lifting the
          net margin back toward the high-teens. The company stayed effectively debt-free, with operating cash flow
          comfortably funding capex and a roughly two-thirds dividend payout.”
        </p>
        <p className="mt-3 text-[11px] italic text-ink3">
          A generated, state-describing summary of the figures above will appear here in Phase 2. It will describe
          what changed — never recommend an action or judge the price.
        </p>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Data-state notes footer (honest flags surfaced by the endpoint)
// ════════════════════════════════════════════════════════════════════════════
function NotesFooter({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-line bg-surface-1 px-4 py-3">
      <div className="kicker mb-2 text-ink3">Data notes</div>
      <ul className="space-y-1.5">
        {notes.map((n, i) => (
          <li key={i} className="flex items-start gap-2 text-[11.5px] text-ink3">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink3" />
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Where-to-look-next nav — the shared, colourful WhereNext (one source across tabs)
// ════════════════════════════════════════════════════════════════════════════
function WhatsNextNav({ symbol }: { symbol: string }) {
  return <WhereNext symbol={symbol} exclude={["fundamentals"]} />;
}

// ████████████████████████████████████████████████████████████████████████████
// BANKING family — a different P&L (NII not revenue; PPOP not EBITDA), led by the
// bank-risk lens: asset quality and capital adequacy come BEFORE profitability.
// No revenue / EBITDA / operating-margin vocabulary anywhere on this tab. Capital &
// asset quality are shown as FACTS with regulatory context — never a pass/fail call.
// ████████████████████████████████████████████████████████████████████████████

/** Honest "pending audit" state for a cell whose figure isn't yet final (consolidated
 *  Q4). NOT a blank/dash — that would read as "no such data"; this reads as "not final yet". */
function PendingAuditChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line2 bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-ink3">
      <Icons.clock weight="bold" className="h-3 w-3" />
      Pending audit
    </span>
  );
}

// ── §1 Quarterly earnings spine — NII / PPOP / provisions / net profit ──────────
function BankingSpine({
  bk,
  view,
  onBasis,
}: {
  bk: BankingPayload;
  view: FundamentalsView;
  onBasis: (b: Basis) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const quarters = bk.quarters;
  const chartData = quarters.map((q) => ({
    period: shortPeriod(q.periodKey),
    nii: q.nii,
    profit: q.netProfit,
  }));

  const rowsNewestFirst = [...quarters].reverse();
  const visibleRows = showAll ? rowsNewestFirst : rowsNewestFirst.slice(0, 8);

  return (
    <section>
      <SectionEyebrow label="Quarterly earnings" icon={Icons.chartBar} accent="var(--p-found)" pill={`${quarters.length} quarters · ${view.basis}`} />
      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-ink2">
            Net interest income and net profit each quarter — the recurring read on the bank&apos;s earning power.
          </p>
          <BasisToggle available={view.basisAvailable} current={view.basis} onChange={onBasis} />
        </div>

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(val: number, name) => [fmtCr(val), name === "nii" ? "Net interest income" : "Net profit"]}
              />
              <Bar yAxisId="left" dataKey="nii" name="nii" fill="var(--p-found)" opacity={0.45} radius={[4, 4, 0, 0]} maxBarSize={34} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="profit"
                name="profit"
                stroke="var(--p-own)"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "var(--p-own)" }}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive
                animationDuration={1000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyNote>Limited history — an income/profit trend needs at least two quarters.</EmptyNote>
        )}

        {chartData.length >= 2 && (
          <div className="mt-2 flex items-center gap-4 text-[11px] text-ink3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-found)", opacity: 0.5 }} />
              Net interest income
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-own)" }} />
              Net profit
            </span>
          </div>
        )}

        {quarters.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="kicker mb-3">Per-quarter detail</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    {["Quarter", "NII", "PPOP", "Provisions", "Net profit", "NII YoY", "PAT YoY", "Net margin"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "px-2 py-2 text-[9.5px] font-semibold uppercase tracking-wide text-ink3",
                            i === 0 ? "text-left" : "text-right",
                          )}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((q) => {
                    const ny = dirChip(q.niiYoy);
                    const py = dirChip(q.patYoy);
                    return (
                      <tr key={q.periodKey} className="border-t border-line">
                        <td className="px-2 py-2.5 text-left text-ink2">{shortPeriod(q.periodKey)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.nii)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtCr(q.ppop)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtCr(q.provisions)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.netProfit)}</td>
                        <td className={cn("num px-2 py-2.5 text-right", ny.cls)}>{fmtSignedPct(q.niiYoy)}</td>
                        <td className={cn("num px-2 py-2.5 text-right", py.cls)}>{fmtSignedPct(q.patYoy)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtPct(q.netMargin)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {rowsNewestFirst.length > 8 && (
              <button
                onClick={() => setShowAll((s) => !s)}
                className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[11.5px] text-ink2 transition-colors hover:text-ink"
              >
                {showAll ? "Show recent only" : `Show all ${rowsNewestFirst.length} quarters`}
                <Icons.caretDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
              </button>
            )}
          </div>
        )}
      </Panel>
    </section>
  );
}

// ── §2 Asset quality (leads the risk lens) — GNPA/NNPA % + absolute, PCR ─────────
function AssetQuality({ quarters }: { quarters: BankingQuarter[] }) {
  // % trend over quarters with reported (non-pending) asset quality
  const trend = quarters
    .map((q) => ({ period: shortPeriod(q.periodKey), gnpa: q.gnpaPct, nnpa: q.nnpaPct }))
    .filter((d) => d.gnpa != null || d.nnpa != null);
  const enoughTrend = trend.length >= 2;

  const rowsNewestFirst = [...quarters].reverse();
  const anyData = quarters.some((q) => !q.auditPending && (q.gnpaPct != null || q.nnpaPct != null));

  return (
    <section>
      <SectionEyebrow label="Asset quality" icon={Icons.shield} accent="var(--p-own)" pill="gross & net NPA · PCR" />
      <Panel>
        {enoughTrend ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 8, right: 10, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} width={40} unit="%" domain={[0, "auto"]} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name) => [`${v.toFixed(2)}%`, name === "gnpa" ? "Gross NPA" : "Net NPA"]} />
                <Line type="monotone" dataKey="gnpa" name="gnpa" stroke="var(--p-mkt)" strokeWidth={2} dot={{ r: 2, fill: "var(--p-mkt)" }} connectNulls isAnimationActive animationDuration={900} />
                <Line type="monotone" dataKey="nnpa" name="nnpa" stroke="var(--p-mom)" strokeWidth={2} dot={{ r: 2, fill: "var(--p-mom)" }} connectNulls isAnimationActive animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center gap-4 text-[11px] text-ink3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-mkt)" }} />
                Gross NPA %
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-mom)" }} />
                Net NPA %
              </span>
              <span className="text-ink3">Lower is cleaner — the absolute ₹Cr alongside shows scale the % can mask.</span>
            </div>
          </>
        ) : (
          <EmptyNote>
            {anyData
              ? "A gross/net NPA trend needs at least two quarters with reported asset quality."
              : "Asset quality isn't reported for the selected periods on this basis."}
          </EmptyNote>
        )}

        {quarters.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="kicker mb-3">Per-quarter detail</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    {["Quarter", "Gross NPA %", "Gross NPA", "Net NPA %", "Net NPA", "PCR"].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-2 py-2 text-[9.5px] font-semibold uppercase tracking-wide text-ink3",
                          i === 0 ? "text-left" : "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsNewestFirst.map((q) => (
                    <tr key={q.periodKey} className="border-t border-line">
                      <td className="px-2 py-2.5 text-left text-ink2">{shortPeriod(q.periodKey)}</td>
                      {q.auditPending ? (
                        <td colSpan={5} className="px-2 py-2.5 text-right">
                          <PendingAuditChip />
                        </td>
                      ) : (
                        <>
                          <td className="num px-2 py-2.5 text-right text-ink">{fmtPct(q.gnpaPct, 2)}</td>
                          <td className="num px-2 py-2.5 text-right text-ink2">{fmtCr(q.gnpaAbsolute)}</td>
                          <td className="num px-2 py-2.5 text-right text-ink">{fmtPct(q.nnpaPct, 2)}</td>
                          <td className="num px-2 py-2.5 text-right text-ink2">{fmtCr(q.nnpaAbsolute)}</td>
                          <td className="num px-2 py-2.5 text-right text-ink2">{fmtPct(q.pcr, 1)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>
    </section>
  );
}

// ── §3 Capital adequacy — CET1 / Tier 1 / Additional Tier 1 vs regulatory floor ──
// RBI Basel III minimums (incl. the 2.5% capital conservation buffer) shown as factual
// context: CET1 8.0%, Tier 1 9.5%. Context, NOT a pass/fail verdict.
const CET1_FLOOR = 8.0;
const TIER1_FLOOR = 9.5;

function CapitalCard({ label, value, floor, hint }: { label: string; value: number | null; floor?: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-1 p-4">
      <div className="text-[11px] text-ink3">{label}</div>
      <div className="num mt-1.5 text-[26px] font-semibold text-ink">{fmtPct(value, 2)}</div>
      <div className="mt-1 text-[11px] text-ink3">
        {floor != null ? `RBI min ${floor.toFixed(1)}% (incl. buffer)` : hint}
      </div>
    </div>
  );
}

function CapitalAdequacy({ quarters, annual }: { quarters: BankingQuarter[]; annual: BankingAnnual | null }) {
  // Latest quarter that actually reports capital (skips audit-pending rows); else annual.
  const q = [...quarters].reverse().find((x) => x.cet1 != null || x.tier1 != null || x.additionalTier1 != null);
  const cet1 = q?.cet1 ?? annual?.cet1 ?? null;
  const tier1 = q?.tier1 ?? annual?.tier1 ?? null;
  const at1 = q?.additionalTier1 ?? null;
  const asOf = q ? shortPeriod(q.periodKey) : annual ? annual.fiscalYear : null;
  const hasAny = cet1 != null || tier1 != null || at1 != null;

  return (
    <section>
      <SectionEyebrow label="Capital adequacy" icon={Icons.shield} accent="var(--p-found)" pill={asOf ? `as of ${asOf}` : "capital"} />
      <Panel>
        {hasAny ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <CapitalCard label="CET1 ratio" value={cet1} floor={CET1_FLOOR} hint="core equity capital" />
              <CapitalCard label="Tier 1 ratio" value={tier1} floor={TIER1_FLOOR} hint="going-concern capital" />
              <CapitalCard label="Additional Tier 1" value={at1} hint="AT1 instruments" />
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              Shown against the RBI Basel III regulatory minimum (including the 2.5% capital conservation buffer) as
              factual context — a description of where capital stands, not a pass/fail assessment.
            </p>
          </>
        ) : (
          <EmptyNote>
            Capital ratios aren&apos;t reported for the selected periods on this basis — they fill in with each audited filing.
          </EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §4 Profitability & efficiency — ROE / disclosed ROA / NIM / C-I / credit cost ─
// Sparklines self-gate at ≥3 reported years, so only well-covered banks (6yr) show them;
// 2-year banks show no spark. Disclosed ROA carries no history series → no spark.
function ProfitabilityEfficiency({ annual, history }: { annual: BankingAnnual | null; history: BkRatioHistoryPoint[] }) {
  return (
    <section>
      <SectionEyebrow label="Profitability & efficiency" icon={Icons.coins} accent="var(--p-own)" pill={annual ? `annual · ${annual.fiscalYear}` : "annual"} />
      {annual ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ReturnCard label="Return on equity" value={fmtPct(annual.roe, 1)} hint="Net profit ÷ shareholder equity" spark={sparkSeries(history, (r) => r.roe)} sparkColor="var(--p-own)" />
          <ReturnCard label="Return on assets" value={fmtPct(annual.roaDisclosed, 2)} hint="Disclosed full-year ROA" />
          <ReturnCard label="Net interest margin" value={fmtPct(annual.nim, 2)} hint="Net interest income ÷ avg assets" spark={sparkSeries(history, (r) => r.nim)} sparkColor="var(--p-found)" />
          <ReturnCard label="Cost-to-income" value={fmtPct(annual.costToIncome, 1)} hint="Operating cost ÷ income" spark={sparkSeries(history, (r) => r.costToIncome)} sparkColor="var(--p-mkt)" />
          <ReturnCard label="Credit cost" value={fmtPct(annual.creditCostPct, 2)} hint="Provisions ÷ advances" spark={sparkSeries(history, (r) => r.creditCostPct)} sparkColor="var(--p-mom)" />
        </div>
      ) : (
        <Panel>
          <EmptyNote>No annual profitability figures reported yet for this basis.</EmptyNote>
        </Panel>
      )}
    </section>
  );
}

// ── §4b Quarterly efficiency — cost-to-income each quarter (a higher-frequency read than
// the annual ratio). Cost-to-income is reported every quarter (it isn't audit-gated), so
// this trend fills even where asset-quality rows are pending. Honest-empty under two points.
function BankingEfficiencyTrend({ quarters }: { quarters: BankingQuarter[] }) {
  const data = quarters
    .map((q) => ({ period: shortPeriod(q.periodKey), ci: q.costToIncome }))
    .filter((d) => d.ci != null);
  const enough = data.length >= 2;

  return (
    <section>
      <SectionEyebrow label="Quarterly efficiency" icon={Icons.spark} accent="var(--p-mom)" pill="cost-to-income" />
      <Panel>
        {enough ? (
          <>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} width={40} unit="%" domain={["auto", "auto"]} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(1)}%`, "Cost-to-income"]} />
                <Line type="monotone" dataKey="ci" name="ci" stroke="var(--p-mkt)" strokeWidth={2} dot={{ r: 2, fill: "var(--p-mkt)" }} connectNulls isAnimationActive animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              Operating cost as a share of income, quarter by quarter — lower means more of each rupee of income drops
              through to pre-provision profit. A description of operating leverage, not a judgment.
            </p>
          </>
        ) : (
          <EmptyNote>A cost-to-income trend needs at least two quarters with reported efficiency.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §4c Earnings mix — interest income split into advances (credit) vs investments
// (treasury) vs other. revenueOnInvestments is honest-null for banks that don't disclose
// it separately; there the residual is labelled "investments & other". Honest-empty when
// interest income or the advances line is unavailable.
function BankingEarningsMix({ annual }: { annual: BankingAnnual | null }) {
  const ie = annual?.interestEarned ?? null;
  const adv = annual?.interestOnAdvances ?? null;
  const inv = annual?.revenueOnInvestments ?? null;
  const hasMix = ie != null && ie > 0 && adv != null;

  // residual = interest income not attributed to advances (and investments when disclosed).
  const residual = hasMix ? Math.max(0, ie - adv - (inv ?? 0)) : null;
  const invDisclosed = inv != null;
  const seg: { label: string; v: number; color: string }[] = hasMix
    ? [
        { label: "Advances (credit)", v: adv, color: "var(--p-found)" },
        ...(invDisclosed ? [{ label: "Investments (treasury)", v: inv as number, color: "var(--p-mom)" }] : []),
        { label: invDisclosed ? "Other interest" : "Investments & other", v: residual as number, color: "var(--ink3)" },
      ]
    : [];

  return (
    <section>
      <SectionEyebrow label="Earnings mix" icon={Icons.chartBar} accent="var(--p-mkt)" pill={annual ? `interest income · ${annual.fiscalYear}` : "interest income"} />
      <Panel>
        {hasMix ? (
          <>
            <div className="mb-3 flex items-baseline justify-between text-[12px]">
              <span className="text-ink2">Total interest income</span>
              <span className="num text-ink">{fmtCr(ie)}</span>
            </div>
            {/* proportional stacked bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-3">
              {seg.map((s) => (
                <div key={s.label} style={{ width: `${(s.v / (ie as number)) * 100}%`, background: s.color }} />
              ))}
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {seg.map((s) => (
                <div key={s.label} className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-ink3">
                    <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                    {s.label}
                  </div>
                  <div className="num mt-1 text-[14px] font-semibold text-ink">{fmtPct((s.v / (ie as number)) * 100, 1)}</div>
                  <div className="num mt-0.5 text-[11px] text-ink3">{fmtCr(s.v)}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              {invDisclosed
                ? "Interest income split between lending (advances) and the investment book (treasury) — the read on whether the bank earns from credit or its securities portfolio. Stated as a fact."
                : "Interest income split by source — this bank doesn't disclose investment income as a separate line, so treasury and other interest fall into the residual. The advances share is the credit-vs-rest read. Stated as a fact."}
            </p>
          </>
        ) : (
          <EmptyNote>The earnings-mix split isn&apos;t reported for the latest year on this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── CASA cell — low-cost deposit share, quarterly + tiered for HONEST display (§0). ──
// CASA is a deposit-mix metric (current + savings as a share of deposits) → it lives in
// the franchise group. NEVER a bare value: the quarter rides alongside, and the tier drives
// the wording. A non-current `quarter` is shown plainly ("as of FY26/Q4") — NOT alarmed;
// only `legacy` gets a soft-stale accent; `none` is honest-empty.
function CasaStat({ casa }: { casa?: BankingCasa }) {
  // casa may be absent (older backend) → c is null → tier "empty" → honest-empty, no crash.
  const c = casa?.current ?? null;
  const tier = casaTier(c);
  const ctx = casaContextLabel(c); // "FY26/Q4" for a real quarter, "legacy value" for legacy
  const empty = tier === "empty";
  const legacy = tier === "legacy";
  const sub = empty
    ? "not entered yet"
    : legacy
      ? "legacy value · not a current quarter"
      : `as of ${ctx}`;

  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="text-[11px] text-ink3">CASA ratio</div>
      <div className={cn("num mt-1 text-[18px] font-semibold", empty ? "text-ink3" : "text-ink")}>
        {empty ? DASH : fmtPct(c?.value, 1)}
      </div>
      <div className={cn("num mt-0.5 text-[11px]", legacy ? "text-ctx" : "text-ink3")}>{sub}</div>
    </div>
  );
}

// ── §5 Franchise — deposits / advances / CD ratio + CASA + franchise growth ─────
function Franchise({ annual, casa }: { annual: BankingAnnual | null; casa?: BankingCasa }) {
  const growth: { label: string; v: number | null }[] = [
    { label: "Deposit YoY", v: annual?.depositGrowthYoy ?? null },
    { label: "Advances YoY", v: annual?.advanceGrowthYoy ?? null },
    { label: "NII YoY", v: annual?.niiGrowthYoy ?? null },
    { label: "PAT YoY", v: annual?.patGrowthYoy ?? null },
  ];
  const hasFranchise =
    annual && (annual.deposits != null || annual.advances != null || annual.creditDepositRatio != null);

  return (
    <section>
      <SectionEyebrow label="Franchise" icon={Icons.building} accent="var(--p-found)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {hasFranchise ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Deposits" value={fmtCr(annual!.deposits)} sub="customer funding base" />
              <Stat label="Advances" value={fmtCr(annual!.advances)} sub="loans extended" />
              <Stat label="Credit-deposit ratio" value={fmtPct(annual!.creditDepositRatio, 1)} sub="advances ÷ deposits" />
              <CasaStat casa={casa} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              {growth.map((g) => {
                const chip = dirChip(g.v);
                return (
                  <div key={g.label} className="rounded-xl border border-line bg-surface-2 p-3.5">
                    <div className="text-[11px] text-ink3">{g.label}</div>
                    <div className={cn("num mt-1 text-[18px] font-semibold", g.v == null ? "text-ink3" : chip.cls)}>
                      {fmtSignedPct(g.v)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyNote>No annual franchise figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §5b CASA history — the quarter-by-quarter path of the low-cost deposit share. ──
// X-axis = the entered quarter LABEL (periodEnd is always null per the backend contract).
// A factual record of the path — never a "improving/deteriorating" verdict, no projection.
// Sparse-honest: 0 points → honest-empty; 1 point → the single reading (never a broken line).
function CasaHistory({ casa }: { casa?: BankingCasa }) {
  // casa/series may be absent (older backend) → empty data → honest "no history", no crash.
  const data = (casa?.series ?? []).map((p) => ({ quarter: p.quarter, casa: p.value }));
  const n = data.length;
  const latest = data[n - 1] ?? null;

  return (
    <section>
      <SectionEyebrow label="CASA history" icon={Icons.chartLine} accent="var(--p-mkt)" pill="low-cost deposit share" />
      <Panel>
        {n >= 2 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} width={40} unit="%" domain={["auto", "auto"]} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(2)}%`, "CASA"]} />
                <Line
                  type="monotone"
                  dataKey="casa"
                  name="casa"
                  stroke="var(--p-mkt)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--p-mkt)" }}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              Current-and-savings accounts as a share of deposits, quarter by quarter — a factual record of the path,
              not a trend judgment.
            </p>
          </>
        ) : n === 1 && latest ? (
          <div className="py-6 text-center">
            <div className="num text-[28px] font-semibold text-ink">{fmtPct(latest.casa, 1)}</div>
            <div className="num mt-1 text-[12px] text-ink3">{latest.quarter}</div>
            <p className="mx-auto mt-3 max-w-[34em] text-[11.5px] italic text-ink3">
              One quarter on record — the history chart fills in as more quarters are entered.
            </p>
          </div>
        ) : (
          <EmptyNote>No CASA history recorded yet.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §6 Balance-sheet snapshot ───────────────────────────────────────────────────
function BankBalanceSheet({ annual }: { annual: BankingAnnual | null }) {
  const rows: { label: string; v: number | null; rupee?: boolean }[] = annual
    ? [
        { label: "Total assets", v: annual.totalAssets },
        { label: "Deposits", v: annual.deposits },
        { label: "Advances", v: annual.advances },
        { label: "Investments", v: annual.investments },
        { label: "Borrowings", v: annual.borrowings },
        { label: "Net worth", v: annual.netWorth },
        { label: "Capital", v: annual.capital },
        { label: "Reserves & surplus", v: annual.reservesAndSurplus },
        { label: "Cash & balances w/ RBI", v: annual.cashAndBalancesWithRbi },
        { label: "Book value / share", v: annual.bookValuePerShare, rupee: true },
      ]
    : [];
  const hasAny = rows.some((r) => r.v != null);

  return (
    <section>
      <SectionEyebrow label="Balance-sheet snapshot" icon={Icons.stack} accent="var(--p-found)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {annual && hasAny ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                <span className="text-[11.5px] text-ink3">{r.label}</span>
                <span className="num text-[13px] text-ink">{r.rupee ? fmtRupee(r.v) : fmtCr(r.v)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote>No annual balance-sheet figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §7 Cash flow — CFO / CFI / CFF only (no FCF for banks) ───────────────────────
function BankCashFlow({ annual }: { annual: BankingAnnual | null }) {
  const flows = annual
    ? [
        { label: "Operating", v: annual.cashFromOperating },
        { label: "Investing", v: annual.cashFromInvesting },
        { label: "Financing", v: annual.cashFromFinancing },
      ]
    : [];
  const present = flows.filter((f) => f.v != null);
  const maxAbs = Math.max(1, ...present.map((f) => Math.abs(f.v as number)));

  return (
    <section>
      <SectionEyebrow label="Cash flow" icon={Icons.coins} accent="var(--p-own)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {present.length > 0 ? (
          <div className="space-y-3">
            {flows.map((f) => {
              const v = f.v;
              const pos = (v ?? 0) >= 0;
              const w = v == null ? 0 : (Math.abs(v) / maxAbs) * 100;
              return (
                <div key={f.label}>
                  <div className="mb-1 flex items-baseline justify-between text-[12px]">
                    <span className="text-ink2">{f.label}</span>
                    <span className={cn("num", v == null ? "text-ink3" : pos ? "text-healthy" : "text-high")}>
                      {fmtSignedCr(v)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full" style={{ width: `${w}%`, background: pos ? "var(--c-healthy)" : "var(--high)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyNote>No cash-flow figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §8 AI summary slot (Phase-2 preview — wired to nothing) ─────────────────────
function BankAiSummarySlot() {
  return (
    <section>
      <SectionEyebrow label="Fundamentals narrative" icon={Icons.brain} accent="var(--p-mom)" pill="preview" />
      <div className="rounded-2xl border border-dashed border-line2 bg-surface-1/60 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-p-mom/30 bg-p-mom/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-p-mom">
            <Icons.spark weight="fill" className="h-3 w-3" />
            AI · Coming in Phase 2
          </span>
          <span className="text-[11px] text-ink3">Not live — sample of how this will read</span>
        </div>
        <p className="diagnosis mt-3 max-w-[46em] text-[13.5px] text-ink2 opacity-80">
          “Net interest income grew for a third straight quarter while gross NPAs held steady and provisions eased,
          lifting net profit. Capital stayed well above regulatory minimums and deposit growth kept pace with
          advances.”
        </p>
        <p className="mt-3 text-[11px] italic text-ink3">
          A generated, state-describing summary of the figures above will appear here in Phase 2. It will describe
          what changed — never recommend an action or judge the price.
        </p>
      </div>
    </section>
  );
}

// ── Banking tab — bank-risk lens leads (asset quality before profitability) ─────
function BankingTab({ bk, view, onBasis, symbol }: { bk: BankingPayload; view: FundamentalsView; onBasis: (b: Basis) => void; symbol: string }) {
  return (
    <div className="mt-6 space-y-2">
      <Reveal>
        <BankingSpine bk={bk} view={view} onBasis={onBasis} />
      </Reveal>
      <Reveal>
        <AssetQuality quarters={bk.quarters} />
      </Reveal>
      <Reveal>
        <CapitalAdequacy quarters={bk.quarters} annual={bk.annual} />
      </Reveal>
      <Reveal>
        <ProfitabilityEfficiency annual={bk.annual} history={bk.ratioHistory} />
      </Reveal>
      <Reveal>
        <BankingEfficiencyTrend quarters={bk.quarters} />
      </Reveal>
      <Reveal>
        <BankingEarningsMix annual={bk.annual} />
      </Reveal>
      <Reveal>
        <Franchise annual={bk.annual} casa={bk.casa} />
      </Reveal>
      <Reveal>
        <CasaHistory casa={bk.casa} />
      </Reveal>
      <Reveal>
        <BankBalanceSheet annual={bk.annual} />
      </Reveal>
      <Reveal>
        <BankCashFlow annual={bk.annual} />
      </Reveal>
      <Reveal>
        <BankAiSummarySlot />
      </Reveal>
      <Reveal>
        <WhatsNextNav symbol={symbol} />
      </Reveal>
      <NotesFooter notes={view.notes} />
    </div>
  );
}

// ████████████████████████████████████████████████████████████████████████████
// NBFC family — a lending P&L (NII not revenue). Credit cost is the (thinner) risk
// lens — no GNPA/PCR regime, no audit-pending, NO quarterly balance sheet (the BS is
// annual-only context). Leverage (borrowings/equity) is rendered as a MULTIPLE (3.13×),
// the headline NBFC risk metric — never as a percent. Deposits honest-empty for pure
// lenders. No FCF. No bank PPOP/GNPA or non_financial revenue/EBITDA vocabulary.
// ████████████████████████████████████████████████████████████████████████████

// ── §1 Quarterly earnings spine — interest income / NII / impairment / net profit ─
function NbfcSpine({
  nb,
  view,
  onBasis,
}: {
  nb: NbfcPayload;
  view: FundamentalsView;
  onBasis: (b: Basis) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const quarters = nb.quarters;
  const chartData = quarters.map((q) => ({
    period: shortPeriod(q.periodKey),
    nii: q.nii,
    profit: q.netProfit,
  }));

  const rowsNewestFirst = [...quarters].reverse();
  const visibleRows = showAll ? rowsNewestFirst : rowsNewestFirst.slice(0, 8);

  return (
    <section>
      <SectionEyebrow label="Quarterly earnings" icon={Icons.chartBar} accent="var(--p-found)" pill={`${quarters.length} quarters · ${view.basis}`} />
      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-ink2">
            Net interest income and net profit each quarter — the recurring read on the lending book.
          </p>
          <BasisToggle available={view.basisAvailable} current={view.basis} onChange={onBasis} />
        </div>

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(val: number, name) => [fmtCr(val), name === "nii" ? "Net interest income" : "Net profit"]}
              />
              <Bar yAxisId="left" dataKey="nii" name="nii" fill="var(--p-found)" opacity={0.45} radius={[4, 4, 0, 0]} maxBarSize={34} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="profit"
                name="profit"
                stroke="var(--p-own)"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "var(--p-own)" }}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive
                animationDuration={1000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyNote>Limited history — an income/profit trend needs at least two quarters.</EmptyNote>
        )}

        {chartData.length >= 2 && (
          <div className="mt-2 flex items-center gap-4 text-[11px] text-ink3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-found)", opacity: 0.5 }} />
              Net interest income
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--p-own)" }} />
              Net profit
            </span>
          </div>
        )}

        {quarters.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="kicker mb-3">Per-quarter detail</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    {["Quarter", "Interest income", "NII", "Impairment", "Net profit", "Rev YoY", "PAT YoY", "Net margin"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "px-2 py-2 text-[9.5px] font-semibold uppercase tracking-wide text-ink3",
                            i === 0 ? "text-left" : "text-right",
                          )}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((q) => {
                    const ry = dirChip(q.revenueYoy);
                    const py = dirChip(q.patYoy);
                    return (
                      <tr key={q.periodKey} className="border-t border-line">
                        <td className="px-2 py-2.5 text-left text-ink2">{shortPeriod(q.periodKey)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.interestIncome)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.nii)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtCr(q.impairmentOnFinancialInstruments)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.netProfit)}</td>
                        <td className={cn("num px-2 py-2.5 text-right", ry.cls)}>{fmtSignedPct(q.revenueYoy)}</td>
                        <td className={cn("num px-2 py-2.5 text-right", py.cls)}>{fmtSignedPct(q.patYoy)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtPct(q.netMargin)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {rowsNewestFirst.length > 8 && (
              <button
                onClick={() => setShowAll((s) => !s)}
                className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[11.5px] text-ink2 transition-colors hover:text-ink"
              >
                {showAll ? "Show recent only" : `Show all ${rowsNewestFirst.length} quarters`}
                <Icons.caretDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
              </button>
            )}
          </div>
        )}
      </Panel>
    </section>
  );
}

// ── §2 Credit cost (the NBFC risk lens) — impairment trend + annual credit cost % ─
function NbfcCreditCost({ quarters, annual }: { quarters: NbfcQuarter[]; annual: NbfcAnnual | null }) {
  const data = quarters
    .map((q) => ({ period: shortPeriod(q.periodKey), impairment: q.impairmentOnFinancialInstruments }))
    .filter((d) => d.impairment != null);
  const enough = data.length >= 2;

  return (
    <section>
      <SectionEyebrow label="Credit cost" icon={Icons.shield} accent="var(--p-mkt)" pill="the lending risk lens" />
      <Panel>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="kicker mb-3">Loan-loss provisioning (impairment) per quarter</div>
            {enough ? (
              <ResponsiveContainer width="100%" height={190}>
                <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(val: number) => [fmtCr(val), "Impairment"]} />
                  <Bar dataKey="impairment" name="impairment" fill="var(--p-mkt)" opacity={0.5} radius={[4, 4, 0, 0]} maxBarSize={34} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyNote>An impairment trend needs at least two quarters with reported provisioning.</EmptyNote>
            )}
          </div>
          <div className="self-start">
            <Stat
              label="Credit cost (annual)"
              value={fmtPct(annual?.creditCostPct, 2)}
              sub="impairment ÷ average AUM"
            />
            <p className="mt-3 text-[11.5px] italic text-ink3">
              NBFCs report credit cost — the share of the loan book written down — rather than a bank&apos;s gross/net
              NPA and provision-coverage regime. The impairment trend and credit-cost ratio are the read on book
              quality here. A description, not a judgment.
            </p>
          </div>
        </div>
      </Panel>
    </section>
  );
}

// ── §3 Profitability & spread — ROE / NIM / spread / cost-to-income ──────────────
function NbfcProfitability({ annual }: { annual: NbfcAnnual | null }) {
  return (
    <section>
      <SectionEyebrow label="Profitability & spread" icon={Icons.coins} accent="var(--p-own)" pill={annual ? `annual · ${annual.fiscalYear}` : "annual"} />
      {annual ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReturnCard label="Return on equity" value={fmtPct(annual.roe, 1)} hint="Net profit ÷ shareholder equity" />
          <ReturnCard label="Net interest margin" value={fmtPct(annual.nim, 2)} hint="Net interest income ÷ avg AUM" />
          <ReturnCard label="Spread" value={fmtPct(annual.spread, 2)} hint="Lending yield − cost of funds" />
          <ReturnCard label="Cost-to-income" value={fmtPct(annual.costToIncomeRatio, 1)} hint="Operating cost ÷ income" />
        </div>
      ) : (
        <Panel>
          <EmptyNote>No annual profitability figures reported yet for this basis.</EmptyNote>
        </Panel>
      )}
    </section>
  );
}

// ── §4 Leverage & funding — borrowings/equity as a MULTIPLE (3.13×) + funding mix ─
/** Funding-line card; honest-empties (a muted label, not a fake ₹0) when null. */
function FundingCard({ label, v, emptyLabel }: { label: string; v: number | null; emptyLabel?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="text-[11px] text-ink3">{label}</div>
      {v == null && emptyLabel ? (
        <div className="mt-1.5 text-[13px] font-medium text-ink3">{emptyLabel}</div>
      ) : (
        <div className="num mt-1 text-[18px] font-semibold text-ink">{fmtCr(v)}</div>
      )}
    </div>
  );
}

function NbfcLeverageFunding({ annual }: { annual: NbfcAnnual | null }) {
  const noDeposits = annual != null && annual.depositsLiabilities == null;

  return (
    <section>
      <SectionEyebrow label="Leverage & funding" icon={Icons.scales} accent="var(--p-mkt)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {annual ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <ReturnCard label="Borrowings / equity" value={fmtX(annual.borrowingsToEquity, 2)} hint="Leverage — debt funding per rupee of equity" />
              <ReturnCard label="Capital / assets" value={fmtPct(annual.capitalToAssetsRatio, 1)} hint="Equity cushion against the book (CRAR proxy)" />
            </div>
            <div className="mt-4">
              <div className="kicker mb-3">Funding mix</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <FundingCard label="Borrowings" v={annual.borrowings} />
                <FundingCard label="Debt securities" v={annual.debtSecurities} />
                <FundingCard
                  label="Customer deposits"
                  v={annual.depositsLiabilities}
                  emptyLabel="Non-deposit-taking"
                />
              </div>
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              {noDeposits
                ? "A non-deposit-taking NBFC — it funds its loan book through borrowings and debt securities, not customer deposits. Leverage is read as a multiple of equity, the headline gearing measure for a lender."
                : "Leverage is read as a multiple of equity — the headline gearing measure for a lender. Funding mix shows where the book is financed. Stated as facts, not a view on the balance sheet."}
            </p>
          </>
        ) : (
          <EmptyNote>No annual leverage or funding figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §5 Franchise / AUM — loan book + AUM/revenue/PAT growth ──────────────────────
function NbfcFranchise({ annual }: { annual: NbfcAnnual | null }) {
  const growth: { label: string; v: number | null }[] = [
    { label: "AUM YoY", v: annual?.aumGrowthYoy ?? null },
    { label: "Revenue YoY", v: annual?.revenueGrowthYoy ?? null },
    { label: "PAT YoY", v: annual?.patGrowthYoy ?? null },
  ];
  const hasFranchise = annual && (annual.loans != null || annual.aumGrowthYoy != null);

  return (
    <section>
      <SectionEyebrow label="Franchise & AUM" icon={Icons.building} accent="var(--p-found)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {hasFranchise ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Assets under management" value={fmtCr(annual!.loans)} sub="the loan book" />
              <Stat label="Investments" value={fmtCr(annual!.investments)} sub="securities held" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {growth.map((g) => {
                const chip = dirChip(g.v);
                return (
                  <div key={g.label} className="rounded-xl border border-line bg-surface-2 p-3.5">
                    <div className="text-[11px] text-ink3">{g.label}</div>
                    <div className={cn("num mt-1 text-[18px] font-semibold", g.v == null ? "text-ink3" : chip.cls)}>
                      {fmtSignedPct(g.v)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyNote>No annual franchise figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §6 Balance-sheet snapshot (annual-only context) ─────────────────────────────
function NbfcBalanceSheet({ annual }: { annual: NbfcAnnual | null }) {
  const rows: { label: string; v: number | null; rupee?: boolean }[] = annual
    ? [
        { label: "Total assets", v: annual.totalAssets },
        { label: "Loan book (AUM)", v: annual.loans },
        { label: "Investments", v: annual.investments },
        { label: "Total equity", v: annual.totalEquity },
        { label: "Net worth", v: annual.netWorth },
        { label: "Borrowings", v: annual.borrowings },
        { label: "Debt securities", v: annual.debtSecurities },
        { label: "Cash & equivalents", v: annual.cashAndCashEquivalents },
        { label: "Book value / share", v: annual.bookValuePerShare, rupee: true },
      ]
    : [];
  const hasAny = rows.some((r) => r.v != null);

  return (
    <section>
      <SectionEyebrow label="Balance-sheet snapshot" icon={Icons.stack} accent="var(--p-found)" pill={annual ? `annual · ${annual.fiscalYear}` : "annual"} />
      <Panel>
        {annual && hasAny ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                <span className="text-[11.5px] text-ink3">{r.label}</span>
                <span className="num text-[13px] text-ink">{r.rupee ? fmtRupee(r.v) : fmtCr(r.v)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote>No annual balance-sheet figures reported yet for this basis.</EmptyNote>
        )}
        <p className="mt-3 text-[11px] italic text-ink3">
          NBFCs report a balance sheet annually — quarterly filings carry the P&amp;L only, so this snapshot is the
          most recent audited year.
        </p>
      </Panel>
    </section>
  );
}

// ── §7 Cash flow — CFO / CFI / CFF only (no FCF for NBFCs) ───────────────────────
function NbfcCashFlow({ annual }: { annual: NbfcAnnual | null }) {
  const flows = annual
    ? [
        { label: "Operating", v: annual.cashFromOperating },
        { label: "Investing", v: annual.cashFromInvesting },
        { label: "Financing", v: annual.cashFromFinancing },
      ]
    : [];
  const present = flows.filter((f) => f.v != null);
  const maxAbs = Math.max(1, ...present.map((f) => Math.abs(f.v as number)));

  return (
    <section>
      <SectionEyebrow label="Cash flow" icon={Icons.coins} accent="var(--p-own)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {present.length > 0 ? (
          <>
            <div className="space-y-3">
              {flows.map((f) => {
                const v = f.v;
                const pos = (v ?? 0) >= 0;
                const w = v == null ? 0 : (Math.abs(v) / maxAbs) * 100;
                return (
                  <div key={f.label}>
                    <div className="mb-1 flex items-baseline justify-between text-[12px]">
                      <span className="text-ink2">{f.label}</span>
                      <span className={cn("num", v == null ? "text-ink3" : pos ? "text-healthy" : "text-high")}>
                        {fmtSignedCr(v)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full" style={{ width: `${w}%`, background: pos ? "var(--c-healthy)" : "var(--high)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] italic text-ink3">
              For a lender, operating cash flow swings with loan-book growth — drawing down cash to fund new advances
              is normal and isn&apos;t free cash flow. No FCF is shown for NBFCs.
            </p>
          </>
        ) : (
          <EmptyNote>No cash-flow figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §8 AI summary slot (Phase-2 preview — wired to nothing) ─────────────────────
function NbfcAiSummarySlot() {
  return (
    <section>
      <SectionEyebrow label="Fundamentals narrative" icon={Icons.brain} accent="var(--p-mom)" pill="preview" />
      <div className="rounded-2xl border border-dashed border-line2 bg-surface-1/60 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-p-mom/30 bg-p-mom/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-p-mom">
            <Icons.spark weight="fill" className="h-3 w-3" />
            AI · Coming in Phase 2
          </span>
          <span className="text-[11px] text-ink3">Not live — sample of how this will read</span>
        </div>
        <p className="diagnosis mt-3 max-w-[46em] text-[13.5px] text-ink2 opacity-80">
          “Assets under management grew for a fifth straight quarter while credit costs stayed contained and leverage
          held roughly flat. Net interest income kept pace with the book, holding the spread steady.”
        </p>
        <p className="mt-3 text-[11px] italic text-ink3">
          A generated, state-describing summary of the figures above will appear here in Phase 2. It will describe
          what changed — never recommend an action or judge the price.
        </p>
      </div>
    </section>
  );
}

// ── NBFC tab — P&L-led, credit cost as the (thinner) risk lens ──────────────────
function NbfcTab({ nb, view, onBasis, symbol }: { nb: NbfcPayload; view: FundamentalsView; onBasis: (b: Basis) => void; symbol: string }) {
  return (
    <div className="mt-6 space-y-2">
      <Reveal>
        <NbfcSpine nb={nb} view={view} onBasis={onBasis} />
      </Reveal>
      <Reveal>
        <NbfcCreditCost quarters={nb.quarters} annual={nb.annual} />
      </Reveal>
      <Reveal>
        <NbfcProfitability annual={nb.annual} />
      </Reveal>
      <Reveal>
        <NbfcLeverageFunding annual={nb.annual} />
      </Reveal>
      <Reveal>
        <NbfcFranchise annual={nb.annual} />
      </Reveal>
      <Reveal>
        <NbfcBalanceSheet annual={nb.annual} />
      </Reveal>
      <Reveal>
        <NbfcCashFlow annual={nb.annual} />
      </Reveal>
      <Reveal>
        <NbfcAiSummarySlot />
      </Reveal>
      <Reveal>
        <WhatsNextNav symbol={symbol} />
      </Reveal>
      <NotesFooter notes={view.notes} />
    </div>
  );
}

// ████████████████████████████████████████████████████████████████████████████
// LIFE INSURANCE family — policyholders'-fund accounting (premium income → benefits →
// change in valuation of liabilities → surplus), NOT revenue/EBITDA. The quality lens is
// PERSISTENCY (% of policies still in force at 13/25/37/49/61 months) and SOLVENCY (a
// MULTIPLE, 1.90×, vs the IRDAI 1.5× floor — a regulatory fact, never a verdict). History
// is thin (5Q / 2yr) → trend charts suppressed; spine is a TABLE, ratios are value cards.
// No revenue/EBITDA/NPA vocabulary. No FCF.
// ████████████████████████████████████████████████████████████████████████████

const IRDAI_SOLVENCY_FLOOR = 1.5; // IRDAI minimum regulatory solvency ratio (150%)

/** Thin-history caption — said plainly where a trend chart would otherwise sit. */
function LimitedHistoryCaption({ quarters }: { quarters: number }) {
  return (
    <p className="mt-3 text-[11px] italic text-ink3">
      Limited history — {quarters} quarter{quarters === 1 ? "" : "s"} on file. A trend chart needs more periods, so
      figures are shown as a table and current-value cards rather than a misleading short line.
    </p>
  );
}

// ── §1 Premium & earnings spine (table — no trend chart at this depth) ──────────
function LiSpine({
  li,
  view,
  onBasis,
}: {
  li: LifeInsurancePayload;
  view: FundamentalsView;
  onBasis: (b: Basis) => void;
}) {
  const quarters = li.quarters;
  const rowsNewestFirst = [...quarters].reverse();

  return (
    <section>
      <SectionEyebrow label="Premium & earnings" icon={Icons.coins} accent="var(--p-own)" pill={`${quarters.length} quarters · ${view.basis}`} />
      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-ink2">
            Premium income, the investment result on the policyholders&apos; fund, benefits paid and net profit each
            quarter — the recurring read on the book.
          </p>
          <BasisToggle available={view.basisAvailable} current={view.basis} onChange={onBasis} />
        </div>

        {quarters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["Quarter", "Net premium", "Investment income", "Benefits paid", "Change in reserves", "Net profit", "Net margin", "Prem YoY", "PAT YoY"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-2 py-2 text-[9.5px] font-semibold uppercase tracking-wide text-ink3",
                          i === 0 ? "text-left" : "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rowsNewestFirst.map((q) => {
                  const py = dirChip(q.premiumYoy);
                  const ay = dirChip(q.patYoy);
                  return (
                    <tr key={q.periodKey} className="border-t border-line">
                      <td className="px-2 py-2.5 text-left text-ink2">{shortPeriod(q.periodKey)}</td>
                      <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.netPremiumIncome)}</td>
                      {/* investment income swings negative on mark-to-market — shown honestly */}
                      <td className={cn("num px-2 py-2.5 text-right", (q.incomeFromInvestments ?? 0) < 0 ? "text-high" : "text-ink2")}>
                        {fmtSignedCr(q.incomeFromInvestments)}
                      </td>
                      <td className="num px-2 py-2.5 text-right text-ink2">{fmtCr(q.benefitsPaidNet)}</td>
                      {/* change in valuation of policyholder liabilities — the largest cost line; can
                          swing either way (reserves build on growth, release on maturities). Neutral. */}
                      <td className="num px-2 py-2.5 text-right text-ink2">{fmtSignedCr(q.changeInValuationOfLiabilities)}</td>
                      <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.netProfit)}</td>
                      <td className="num px-2 py-2.5 text-right text-ink2">{fmtPct(q.netMargin)}</td>
                      <td className={cn("num px-2 py-2.5 text-right", py.cls)}>{fmtSignedPct(q.premiumYoy)}</td>
                      <td className={cn("num px-2 py-2.5 text-right", ay.cls)}>{fmtSignedPct(q.patYoy)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyNote>No quarterly results reported yet for this basis.</EmptyNote>
        )}
        <LimitedHistoryCaption quarters={quarters.length} />
        <p className="mt-1 text-[11px] italic text-ink3">
          A life insurer&apos;s investment income is the mark-to-market on the policyholders&apos; fund — it can swing
          deeply negative in a quarter without affecting net profit, which is largely offset by the matching change in
          policy reserves. Shown as a fact, not a concern.
        </p>
      </Panel>
    </section>
  );
}

// ── §2 Persistency — the 13/25/37/49/61-month ladder (the defining LI quality metric) ─
function PersistencyCard({ label, v }: { label: string; v: number | null }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5 text-center">
      <div className="text-[11px] text-ink3">{label}</div>
      <div className={cn("num mt-1.5 text-[20px] font-semibold", v == null ? "text-ink3" : "text-ink")}>
        {fmtPct(v, 1)}
      </div>
    </div>
  );
}

function Persistency({ annual, notes }: { annual: LifeInsuranceAnnual | null; notes: string[] }) {
  const p = annual?.persistency;
  const hasAny = p != null && (p.m13 != null || p.m25 != null || p.m37 != null || p.m49 != null || p.m61 != null);
  // The service pushes the discrepancy note when the guard nulls persistency — surface it here too.
  const guardedNote = notes.find((n) => n.toLowerCase().startsWith("persistency data unavailable"));

  return (
    <section>
      <SectionEyebrow label="Persistency" icon={Icons.pulse} accent="var(--p-mom)" pill={annual ? `annual · ${annual.fiscalYear}` : "policy retention"} />
      <Panel>
        {hasAny ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <PersistencyCard label="13-month" v={p!.m13} />
              <PersistencyCard label="25-month" v={p!.m25} />
              <PersistencyCard label="37-month" v={p!.m37} />
              <PersistencyCard label="49-month" v={p!.m49} />
              <PersistencyCard label="61-month" v={p!.m61} />
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              Persistency is the share of policies (by premium) still in force after N months — the read on how well the
              book retains customers. It naturally steps down as the cohort ages. A description of the franchise, not a
              judgment.
            </p>
          </>
        ) : (
          <>
            <EmptyNote>
              {guardedNote
                ? "Persistency is unavailable for this insurer — a discrepancy in the source filing makes the reported ratios unreliable."
                : "No persistency ratios reported yet for this basis."}
            </EmptyNote>
            {guardedNote && (
              <p className="mx-auto max-w-[44em] text-center text-[11.5px] italic text-ink3">
                We show this as unavailable rather than display a misstated figure. It will populate once the filing is
                re-ingested with the corrected values.
              </p>
            )}
          </>
        )}
      </Panel>
    </section>
  );
}

// ── §3 Solvency & new business ──────────────────────────────────────────────────
// The solvency sparkline self-gates at ≥3 annual years — life insurers currently file two
// standalone years each, so it stays dormant until a third accrues (never a 2-point line).
function LiSolvencyNewBusiness({
  annual,
  history,
}: {
  annual: LifeInsuranceAnnual | null;
  history: LiRatioHistoryPoint[];
}) {
  const solvency = annual?.solvencyRatio ?? null;
  const aboveFloor = solvency != null && solvency >= IRDAI_SOLVENCY_FLOOR;

  return (
    <section>
      <SectionEyebrow label="Solvency & new business" icon={Icons.shield} accent="var(--p-found)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {annual ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-surface-1 p-4">
                <div className="text-[11px] text-ink3">Solvency ratio</div>
                <div className="num mt-1.5 text-[26px] font-semibold text-ink">{fmtX(solvency, 2)}</div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <div className="text-[11px] text-ink3">
                    {solvency == null ? "available capital ÷ required" : aboveFloor ? "above the 1.5× regulatory floor" : "vs the 1.5× regulatory floor"}
                  </div>
                  <MiniSpark points={sparkSeries(history, (r) => r.solvencyRatio)} color="var(--p-found)" />
                </div>
              </div>
              <ReturnCard label="New-business premium" value={fmtPct(annual.newBusinessPremiumPct, 1)} hint="First-year ÷ total premium" />
              <ReturnCard label="Expense ratio" value={fmtPct(annual.expenseRatioPolicyholders, 1)} hint="Operating cost ÷ premium" />
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              IRDAI requires a minimum solvency ratio of 1.5× (150% of required capital). The figure is stated against
              that floor as a regulatory fact — not a view on capital strength. New-business mix and the expense ratio
              describe how the book is growing and what it costs to run.
            </p>
          </>
        ) : (
          <EmptyNote>No annual solvency or new-business figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §4 Profitability — ROE + premium/PAT growth ─────────────────────────────────
function LiProfitability({ annual }: { annual: LifeInsuranceAnnual | null }) {
  const growth: { label: string; v: number | null }[] = [
    { label: "Premium YoY", v: annual?.premiumGrowthYoy ?? null },
    { label: "PAT YoY", v: annual?.patGrowthYoy ?? null },
  ];
  return (
    <section>
      <SectionEyebrow label="Profitability & growth" icon={Icons.trendUp} accent="var(--c-healthy)" pill={annual ? `annual · ${annual.fiscalYear}` : "annual"} />
      {annual ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <ReturnCard label="Return on equity" value={fmtPct(annual.roe, 1)} hint="Net profit ÷ shareholder equity" />
          {growth.map((g) => {
            const chip = dirChip(g.v);
            return (
              <div key={g.label} className="rounded-2xl border border-line bg-surface-1 p-4">
                <div className="text-[11px] text-ink3">{g.label}</div>
                <div className={cn("num mt-1.5 text-[26px] font-semibold", g.v == null ? "text-ink3" : chip.cls)}>
                  {fmtSignedPct(g.v)}
                </div>
                <div className="mt-1 text-[11px] text-ink3">year-over-year</div>
              </div>
            );
          })}
        </div>
      ) : (
        <Panel>
          <EmptyNote>No annual profitability figures reported yet for this basis.</EmptyNote>
        </Panel>
      )}
    </section>
  );
}

// ── §5 Balance sheet — policyholders' fund dominates ────────────────────────────
function LiBalanceSheet({ annual }: { annual: LifeInsuranceAnnual | null }) {
  const rows: { label: string; v: number | null; rupee?: boolean }[] = annual
    ? [
        { label: "Policyholders' fund", v: annual.policyholdersFunds },
        { label: "ULIP-linked assets", v: annual.assetsHeldToCoverLinkedLiabilities },
        { label: "Investments (policyholder)", v: annual.investmentsPolicyholders },
        { label: "Investments (shareholder)", v: annual.investmentsShareholders },
        { label: "Total assets", v: annual.totalAssets },
        { label: "Net worth", v: annual.netWorth },
        { label: "Reserves & surplus", v: annual.reservesAndSurplus },
        { label: "Book value / share", v: annual.bookValuePerShare, rupee: true },
      ]
    : [];
  const hasAny = rows.some((r) => r.v != null);

  return (
    <section>
      <SectionEyebrow label="Balance-sheet snapshot" icon={Icons.stack} accent="var(--p-found)" pill={annual ? `annual · ${annual.fiscalYear}` : "annual"} />
      <Panel>
        {annual && hasAny ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                <span className="text-[11.5px] text-ink3">{r.label}</span>
                <span className="num text-[13px] text-ink">{r.rupee ? fmtRupee(r.v) : fmtCr(r.v)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote>No annual balance-sheet figures reported yet for this basis.</EmptyNote>
        )}
        <p className="mt-3 text-[11px] italic text-ink3">
          For a life insurer the policyholders&apos; fund — the pool backing in-force policies — dwarfs shareholder
          equity. ULIP-linked assets are held against unit-linked liabilities. The balance sheet is the most recent
          audited year.
        </p>
      </Panel>
    </section>
  );
}

// ── §3b Premium mix — first-year / renewal / single as a share of gross premium. A
// renewal-heavy book is a sticky one. Latest annual composition (the three lines reconcile
// to gross). Honest-empty when no mix is reported.
function LiPremiumMix({ annual }: { annual: LifeInsuranceAnnual | null }) {
  const fy = annual?.incomeFirstYearPremium ?? null;
  const rn = annual?.incomeRenewalPremium ?? null;
  const sp = annual?.incomeSinglePremium ?? null;
  const total = (fy ?? 0) + (rn ?? 0) + (sp ?? 0);
  const hasMix = annual != null && total > 0 && (fy != null || rn != null || sp != null);
  const seg: { label: string; v: number; color: string }[] = hasMix
    ? [
        { label: "First-year", v: fy ?? 0, color: "var(--p-found)" },
        { label: "Renewal", v: rn ?? 0, color: "var(--p-own)" },
        { label: "Single", v: sp ?? 0, color: "var(--p-mom)" },
      ]
    : [];
  const renewalShare = hasMix ? ((rn ?? 0) / total) * 100 : null;

  return (
    <section>
      <SectionEyebrow label="Premium mix" icon={Icons.chartBar} accent="var(--p-mkt)" pill={annual ? `annual · ${annual.fiscalYear}` : "premium composition"} />
      <Panel>
        {hasMix ? (
          <>
            <div className="mb-3 flex items-baseline justify-between text-[12px]">
              <span className="text-ink2">Gross premium</span>
              <span className="num text-ink">{fmtCr(total)}</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-3">
              {seg.map((s) => (
                <div key={s.label} style={{ width: `${(s.v / total) * 100}%`, background: s.color }} />
              ))}
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {seg.map((s) => (
                <div key={s.label} className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-ink3">
                    <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                    {s.label} premium
                  </div>
                  <div className="num mt-1 text-[14px] font-semibold text-ink">{fmtPct((s.v / total) * 100, 1)}</div>
                  <div className="num mt-0.5 text-[11px] text-ink3">{fmtCr(s.v)}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              First-year, renewal and single premium as a share of gross premium
              {renewalShare != null ? ` — renewals make up ${renewalShare.toFixed(0)}% of the book` : ""}. A
              renewal-heavy mix points to a stickier book; the split is stated as a fact, not a judgment.
            </p>
          </>
        ) : (
          <EmptyNote>No premium-mix breakdown reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §3c Quarterly solvency & persistency — the intra-year read the annual cards can't show.
// A TABLE (not a trend line) in keeping with the family's thin-history design. Persistency is
// guard-nulled for insurers with a suspect source filing → an honest "—" plus a note.
function LiQuarterlyDisclosures({ quarters, notes }: { quarters: LifeInsuranceQuarter[]; notes: string[] }) {
  const rowsNewestFirst = [...quarters].reverse();
  const anySolvency = quarters.some((q) => q.solvencyRatio != null);
  const anyPersistency = quarters.some((q) => q.persistency13M != null);
  const guardedNote = notes.find((n) => n.toLowerCase().startsWith("persistency data unavailable"));

  return (
    <section>
      <SectionEyebrow label="Quarterly solvency & persistency" icon={Icons.shield} accent="var(--p-own)" pill="intra-year" />
      <Panel>
        {anySolvency || anyPersistency ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    {["Quarter", "Solvency", "13-month persistency"].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-2 py-2 text-[9.5px] font-semibold uppercase tracking-wide text-ink3",
                          i === 0 ? "text-left" : "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsNewestFirst.map((q) => {
                    const aboveFloor = q.solvencyRatio != null && q.solvencyRatio >= IRDAI_SOLVENCY_FLOOR;
                    return (
                      <tr key={q.periodKey} className="border-t border-line">
                        <td className="px-2 py-2.5 text-left text-ink2">{shortPeriod(q.periodKey)}</td>
                        <td className={cn("num px-2 py-2.5 text-right", q.solvencyRatio == null ? "text-ink3" : aboveFloor ? "text-ink" : "text-high")}>
                          {fmtX(q.solvencyRatio, 2)}
                        </td>
                        <td className={cn("num px-2 py-2.5 text-right", q.persistency13M == null ? "text-ink3" : "text-ink2")}>
                          {fmtPct(q.persistency13M, 1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              Solvency is read against the IRDAI 1.5× floor each quarter; 13-month persistency is the share of the
              prior year&apos;s policies still in force.
              {!anyPersistency && guardedNote
                ? " Persistency is shown as unavailable here — a discrepancy in the source filing makes the reported ratios unreliable."
                : ""}
            </p>
          </>
        ) : (
          <EmptyNote>No quarterly solvency or persistency reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §6 AI summary slot (Phase-2 preview — wired to nothing) ─────────────────────
function LiAiSummarySlot() {
  return (
    <section>
      <SectionEyebrow label="Fundamentals narrative" icon={Icons.brain} accent="var(--p-mom)" pill="preview" />
      <div className="rounded-2xl border border-dashed border-line2 bg-surface-1/60 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-p-mom/30 bg-p-mom/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-p-mom">
            <Icons.spark weight="fill" className="h-3 w-3" />
            AI · Coming in Phase 2
          </span>
          <span className="text-[11px] text-ink3">Not live — sample of how this will read</span>
        </div>
        <p className="diagnosis mt-3 max-w-[46em] text-[13.5px] text-ink2 opacity-80">
          “Net premium income grew year-on-year while persistency across the early cohorts held broadly steady. The
          solvency ratio stayed comfortably above the regulatory floor, and the quarter&apos;s investment result moved
          with markets, offset by the matching change in policy reserves.”
        </p>
        <p className="mt-3 text-[11px] italic text-ink3">
          A generated, state-describing summary of the figures above will appear here in Phase 2. It will describe what
          changed — never recommend an action or judge the price.
        </p>
      </div>
    </section>
  );
}

function LifeInsuranceTab({ li, view, onBasis, symbol }: { li: LifeInsurancePayload; view: FundamentalsView; onBasis: (b: Basis) => void; symbol: string }) {
  return (
    <div className="mt-6 space-y-2">
      <Reveal>
        <LiSpine li={li} view={view} onBasis={onBasis} />
      </Reveal>
      <Reveal>
        <LiPremiumMix annual={li.annual} />
      </Reveal>
      <Reveal>
        <Persistency annual={li.annual} notes={view.notes} />
      </Reveal>
      <Reveal>
        <LiSolvencyNewBusiness annual={li.annual} history={li.ratioHistory} />
      </Reveal>
      <Reveal>
        <LiQuarterlyDisclosures quarters={li.quarters} notes={view.notes} />
      </Reveal>
      <Reveal>
        <LiProfitability annual={li.annual} />
      </Reveal>
      <Reveal>
        <LiBalanceSheet annual={li.annual} />
      </Reveal>
      <Reveal>
        <LiAiSummarySlot />
      </Reveal>
      <Reveal>
        <WhatsNextNav symbol={symbol} />
      </Reveal>
      <NotesFooter notes={view.notes} />
    </div>
  );
}

// ████████████████████████████████████████████████████████████████████████████
// GENERAL INSURANCE family — combined-ratio / underwriting accounting (gross premium →
// premium earned → incurred claims → underwriting result). The risk lens is the COMBINED
// RATIO (claims + expenses as a % of premium; above 100% = an underwriting loss before
// investment income — a FACT) and SOLVENCY (a MULTIPLE, vs the IRDAI 1.5× floor). The BS
// `investments` line is NOT reconciled to total assets (GI convention). Thin history →
// trend charts suppressed. No life persistency/premium-mix vocabulary. No FCF.
// ████████████████████████████████████████████████████████████████████████████

// ── §1 Premium & earnings spine (table — no trend chart at this depth) ──────────
function GiSpine({
  gi,
  view,
  onBasis,
}: {
  gi: GeneralInsurancePayload;
  view: FundamentalsView;
  onBasis: (b: Basis) => void;
}) {
  const quarters = gi.quarters;
  const rowsNewestFirst = [...quarters].reverse();

  return (
    <section>
      <SectionEyebrow label="Premium & earnings" icon={Icons.coins} accent="var(--p-own)" pill={`${quarters.length} quarters · ${view.basis}`} />
      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-ink2">
            Gross premium written, premium earned, incurred claims and the underwriting result each quarter — the
            recurring read on the book.
          </p>
          <BasisToggle available={view.basisAvailable} current={view.basis} onChange={onBasis} />
        </div>

        {quarters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["Quarter", "Gross premium", "Premium earned", "Incurred claims", "Underwriting P&L", "Net profit", "Net margin", "GPW YoY"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-2 py-2 text-[9.5px] font-semibold uppercase tracking-wide text-ink3",
                          i === 0 ? "text-left" : "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rowsNewestFirst.map((q) => {
                  const gy = dirChip(q.gpwYoy);
                  return (
                    <tr key={q.periodKey} className="border-t border-line">
                      <td className="px-2 py-2.5 text-left text-ink2">{shortPeriod(q.periodKey)}</td>
                      <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.grossPremiumsWritten)}</td>
                      <td className="num px-2 py-2.5 text-right text-ink2">{fmtCr(q.premiumEarned)}</td>
                      <td className="num px-2 py-2.5 text-right text-ink2">{fmtCr(q.incurredClaims)}</td>
                      {/* underwriting result runs negative for most GI books — shown honestly */}
                      <td className={cn("num px-2 py-2.5 text-right", (q.underwritingProfitOrLoss ?? 0) < 0 ? "text-high" : "text-healthy")}>
                        {fmtSignedCr(q.underwritingProfitOrLoss)}
                      </td>
                      <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(q.netProfit)}</td>
                      <td className="num px-2 py-2.5 text-right text-ink2">{fmtPct(q.netMargin)}</td>
                      <td className={cn("num px-2 py-2.5 text-right", gy.cls)}>{fmtSignedPct(q.gpwYoy)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyNote>No quarterly results reported yet for this basis.</EmptyNote>
        )}
        <LimitedHistoryCaption quarters={quarters.length} />
        <p className="mt-1 text-[11px] italic text-ink3">
          A general insurer typically runs an underwriting loss (claims + expenses outrun earned premium) and earns its
          profit on the investment float. A negative underwriting result is the norm, not a warning — stated as a fact.
        </p>
      </Panel>
    </section>
  );
}

// ── §2 Underwriting performance (leads the risk lens) — combined ratio + components ─
function GiUnderwriting({ annual }: { annual: GeneralInsuranceAnnual | null }) {
  const combined = annual?.combinedRatio ?? null;
  const aboveHundred = combined != null && combined > 100;

  return (
    <section>
      <SectionEyebrow label="Underwriting performance" icon={Icons.target} accent="var(--p-own)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {annual ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-line bg-surface-1 p-4">
                <div className="text-[11px] text-ink3">Combined ratio</div>
                <div className={cn("num mt-1.5 text-[26px] font-semibold", combined == null ? "text-ink3" : aboveHundred ? "text-high" : "text-healthy")}>
                  {fmtPct(combined, 1)}
                </div>
                <div className="mt-1 text-[11px] text-ink3">
                  {combined == null ? "claims + expenses ÷ premium" : aboveHundred ? "above 100% — underwriting loss" : "below 100% — underwriting profit"}
                </div>
              </div>
              <ReturnCard label="Incurred claim ratio" value={fmtPct(annual.incurredClaimRatio, 1)} hint="Claims ÷ earned premium (loss ratio)" />
              <ReturnCard label="Expense of management" value={fmtPct(annual.expensesOfManagementRatio, 1)} hint="Expenses ÷ premium" />
              <div className="rounded-2xl border border-line bg-surface-1 p-4">
                <div className="text-[11px] text-ink3">Net underwriting margin</div>
                <div className={cn("num mt-1.5 text-[26px] font-semibold", annual.netUnderwritingMargin == null ? "text-ink3" : annual.netUnderwritingMargin < 0 ? "text-high" : "text-healthy")}>
                  {fmtSignedPct(annual.netUnderwritingMargin)}
                </div>
                <div className="mt-1 text-[11px] text-ink3">underwriting result ÷ premium</div>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              The combined ratio is claims plus expenses as a share of premium. Above 100% means the book lost money on
              underwriting before investment income — a fact about the underwriting result, not a verdict on the
              company, which earns on the float. The loss and expense ratios decompose it.
            </p>
            {/* reserve-adequacy signal — 0 is the unremarkable norm (premiums adequate); a positive
                figure means a reserve was set aside because pricing may not cover expected claims. */}
            {annual.premiumDeficiency != null && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-3">
                <Icons.info weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-ink3" />
                <p className="text-[11.5px] text-ink2">
                  {annual.premiumDeficiency > 0 ? (
                    <>
                      <span className="font-medium text-ink">Premium-deficiency reserve {fmtCr(annual.premiumDeficiency)}</span> —
                      a reserve set aside because premiums on some lines may not cover expected claims. A reserve-adequacy
                      fact, not a verdict.
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-ink">No premium-deficiency reserve required</span> — premiums were
                      adequate for expected claims this year, so no extra reserve was set aside.
                    </>
                  )}
                </p>
              </div>
            )}
          </>
        ) : (
          <EmptyNote>No annual underwriting figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §2b Quarterly underwriting ratios — combined / loss / expense / retention / solvency
// per quarter. A TABLE, not a trend chart (1 stock, ~5 quarters — too thin to plot). The
// per-quarter decomposition the annual cards can't show. Honest-empty with no quarters.
function GiQuarterlyRatios({ quarters }: { quarters: GeneralInsuranceQuarter[] }) {
  const rowsNewestFirst = [...quarters].reverse();
  const anyRatio = quarters.some(
    (q) => q.combinedRatio != null || q.incurredClaimRatio != null || q.solvencyRatio != null,
  );

  return (
    <section>
      <SectionEyebrow label="Quarterly underwriting ratios" icon={Icons.scales} accent="var(--p-mom)" pill="combined-ratio decomposition" />
      <Panel>
        {anyRatio ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    {["Quarter", "Combined", "Loss ratio", "Expense ratio", "Net retention", "Solvency"].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-2 py-2 text-[9.5px] font-semibold uppercase tracking-wide text-ink3",
                          i === 0 ? "text-left" : "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsNewestFirst.map((q) => {
                    const over = q.combinedRatio != null && q.combinedRatio > 100;
                    return (
                      <tr key={q.periodKey} className="border-t border-line">
                        <td className="px-2 py-2.5 text-left text-ink2">{shortPeriod(q.periodKey)}</td>
                        <td className={cn("num px-2 py-2.5 text-right", q.combinedRatio == null ? "text-ink3" : over ? "text-high" : "text-healthy")}>
                          {fmtPct(q.combinedRatio, 1)}
                        </td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtPct(q.incurredClaimRatio, 1)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtPct(q.expensesOfManagementRatio, 1)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtPct(q.netRetentionRatio, 1)}</td>
                        <td className="num px-2 py-2.5 text-right text-ink2">{fmtX(q.solvencyRatio, 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              The combined ratio each quarter, decomposed into its loss (claims ÷ earned premium) and expense
              components, with net retention and solvency alongside. Shown as a table — too few quarters to plot a
              meaningful trend. Above 100% combined is an underwriting loss before investment income, a fact.
            </p>
          </>
        ) : (
          <EmptyNote>No quarterly underwriting ratios reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §3 Solvency & retention ──────────────────────────────────────────────────────
function GiSolvencyRetention({ annual }: { annual: GeneralInsuranceAnnual | null }) {
  const solvency = annual?.solvencyRatio ?? null;
  const aboveFloor = solvency != null && solvency >= IRDAI_SOLVENCY_FLOOR;

  return (
    <section>
      <SectionEyebrow label="Solvency & retention" icon={Icons.shield} accent="var(--p-found)" pill={annual ? annual.fiscalYear : "annual"} />
      <Panel>
        {annual ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-surface-1 p-4">
                <div className="text-[11px] text-ink3">Solvency ratio</div>
                <div className="num mt-1.5 text-[26px] font-semibold text-ink">{fmtX(solvency, 2)}</div>
                <div className="mt-1 text-[11px] text-ink3">
                  {solvency == null ? "available capital ÷ required" : aboveFloor ? "above the 1.5× regulatory floor" : "vs the 1.5× regulatory floor"}
                </div>
              </div>
              <ReturnCard label="Net retention ratio" value={fmtPct(annual.netRetentionRatio, 1)} hint="Net ÷ gross premium kept on the book" />
            </div>
            <p className="mt-3 text-[11.5px] italic text-ink3">
              IRDAI requires a minimum solvency ratio of 1.5× (150% of required capital) — stated against that floor as
              a regulatory fact. Net retention is the share of premium the insurer keeps rather than cedes to
              reinsurers.
            </p>
          </>
        ) : (
          <EmptyNote>No annual solvency or retention figures reported yet for this basis.</EmptyNote>
        )}
      </Panel>
    </section>
  );
}

// ── §4 Profitability & growth — ROE + GPW/PAT growth ────────────────────────────
function GiProfitability({ annual }: { annual: GeneralInsuranceAnnual | null }) {
  const growth: { label: string; v: number | null }[] = [
    { label: "Gross premium YoY", v: annual?.gpwGrowthYoy ?? null },
    { label: "PAT YoY", v: annual?.patGrowthYoy ?? null },
  ];
  return (
    <section>
      <SectionEyebrow label="Profitability & growth" icon={Icons.trendUp} accent="var(--c-healthy)" pill={annual ? `annual · ${annual.fiscalYear}` : "annual"} />
      {annual ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReturnCard label="Return on equity" value={fmtPct(annual.roe, 1)} hint="Net profit ÷ shareholder equity" />
          {growth.map((g) => {
            const chip = dirChip(g.v);
            return (
              <div key={g.label} className="rounded-2xl border border-line bg-surface-1 p-4">
                <div className="text-[11px] text-ink3">{g.label}</div>
                <div className={cn("num mt-1.5 text-[26px] font-semibold", g.v == null ? "text-ink3" : chip.cls)}>
                  {fmtSignedPct(g.v)}
                </div>
                <div className="mt-1 text-[11px] text-ink3">year-over-year</div>
              </div>
            );
          })}
        </div>
      ) : (
        <Panel>
          <EmptyNote>No annual profitability figures reported yet for this basis.</EmptyNote>
        </Panel>
      )}
    </section>
  );
}

// ── §5 Balance sheet — investments + total assets as SEPARATE context (GI convention) ─
function GiBalanceSheet({ annual }: { annual: GeneralInsuranceAnnual | null }) {
  const rows: { label: string; v: number | null; rupee?: boolean }[] = annual
    ? [
        { label: "Investments", v: annual.investments },
        { label: "Total assets", v: annual.totalAssets },
        { label: "Net worth", v: annual.netWorth },
        { label: "Share capital", v: annual.shareCapital },
        { label: "Reserves & surplus", v: annual.reservesAndSurplus },
        { label: "Book value / share", v: annual.bookValuePerShare, rupee: true },
      ]
    : [];
  const hasAny = rows.some((r) => r.v != null);

  return (
    <section>
      <SectionEyebrow label="Balance-sheet snapshot" icon={Icons.stack} accent="var(--p-found)" pill={annual ? `annual · ${annual.fiscalYear}` : "annual"} />
      <Panel>
        {annual && hasAny ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                <span className="text-[11.5px] text-ink3">{r.label}</span>
                <span className="num text-[13px] text-ink">{r.rupee ? fmtRupee(r.v) : fmtCr(r.v)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote>No annual balance-sheet figures reported yet for this basis.</EmptyNote>
        )}
        <p className="mt-3 text-[11px] italic text-ink3">
          For a general insurer the investment portfolio (the float) and the reported total assets are read as separate
          lines — a GI accounting convention — not reconciled against each other. The snapshot is the most recent
          audited year.
        </p>
      </Panel>
    </section>
  );
}

// ── §6 AI summary slot (Phase-2 preview — wired to nothing) ─────────────────────
function GiAiSummarySlot() {
  return (
    <section>
      <SectionEyebrow label="Fundamentals narrative" icon={Icons.brain} accent="var(--p-mom)" pill="preview" />
      <div className="rounded-2xl border border-dashed border-line2 bg-surface-1/60 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-p-mom/30 bg-p-mom/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-p-mom">
            <Icons.spark weight="fill" className="h-3 w-3" />
            AI · Coming in Phase 2
          </span>
          <span className="text-[11px] text-ink3">Not live — sample of how this will read</span>
        </div>
        <p className="diagnosis mt-3 max-w-[46em] text-[13.5px] text-ink2 opacity-80">
          “Gross premium grew year-on-year while the combined ratio held just above 100%, leaving a small underwriting
          loss offset by investment income. The solvency ratio stayed above the regulatory floor and net retention was
          broadly steady.”
        </p>
        <p className="mt-3 text-[11px] italic text-ink3">
          A generated, state-describing summary of the figures above will appear here in Phase 2. It will describe what
          changed — never recommend an action or judge the price.
        </p>
      </div>
    </section>
  );
}

function GeneralInsuranceTab({ gi, view, onBasis, symbol }: { gi: GeneralInsurancePayload; view: FundamentalsView; onBasis: (b: Basis) => void; symbol: string }) {
  return (
    <div className="mt-6 space-y-2">
      <Reveal>
        <GiSpine gi={gi} view={view} onBasis={onBasis} />
      </Reveal>
      <Reveal>
        <GiUnderwriting annual={gi.annual} />
      </Reveal>
      <Reveal>
        <GiQuarterlyRatios quarters={gi.quarters} />
      </Reveal>
      <Reveal>
        <GiSolvencyRetention annual={gi.annual} />
      </Reveal>
      <Reveal>
        <GiProfitability annual={gi.annual} />
      </Reveal>
      <Reveal>
        <GiBalanceSheet annual={gi.annual} />
      </Reveal>
      <Reveal>
        <GiAiSummarySlot />
      </Reveal>
      <Reveal>
        <WhatsNextNav symbol={symbol} />
      </Reveal>
      <NotesFooter notes={view.notes} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// built:false → honest "being built" state (no families left — defensive only)
// ════════════════════════════════════════════════════════════════════════════
function ComingState({ view }: { view: FundamentalsView }) {
  return (
    <div className="mt-6">
      <Panel className="flex flex-col items-center gap-3 py-14 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-3 text-ink3">
          <Icons.chartBar weight="duotone" className="h-6 w-6" />
        </span>
        <p className="font-medium text-ink">
          Detailed financials for {FAMILY_LABEL[view.family]} companies are being built
        </p>
        <p className="max-w-md text-sm text-ink3">
          {view.name} ({view.symbol}) is classified as a {FAMILY_LABEL[view.family]} business. These companies report
          on a different statement structure, so the Fundamentals tab for them is built as its own pass — coming soon.
          Its health score, ownership and news are already live in the other tabs.
        </p>
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-line2 bg-surface-2 px-3 py-1 text-[11px] text-ink3">
          <Icons.building weight="fill" className="h-3.5 w-3.5" />
          {FAMILY_LABEL[view.family]}
        </span>
      </Panel>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Fundamentals tab
// ════════════════════════════════════════════════════════════════════════════
export default function Fundamentals() {
  const params = useParams();
  const symbol = (params.symbol as string) ?? "";
  const [basis, setBasis] = useState<Basis | undefined>(undefined);
  const { data, isLoading, isError, error, refetch } = useStockFundamentals(symbol, basis);

  if (isLoading) return <QuerySkeleton rows={6} rowHeight="h-16" className="mt-8" />;
  if (isError)
    return (
      <QueryError
        message={(error as Error)?.message ?? "Failed to load fundamentals"}
        onRetry={() => refetch()}
        className="mt-8"
      />
    );
  if (!data) return null;

  // Banking family — bank-shaped tab (asset quality & capital before profitability).
  if (data.family === "banking" && data.banking) {
    return <BankingTab bk={data.banking} view={data} onBasis={setBasis} symbol={symbol} />;
  }

  // NBFC family — lending-shaped tab (credit cost + leverage-as-multiple).
  if (data.family === "nbfc" && data.nbfc) {
    return <NbfcTab nb={data.nbfc} view={data} onBasis={setBasis} symbol={symbol} />;
  }

  // Life insurance — persistency / solvency lens, premium-fund accounting.
  if (data.family === "life_insurance" && data.lifeInsurance) {
    return <LifeInsuranceTab li={data.lifeInsurance} view={data} onBasis={setBasis} symbol={symbol} />;
  }

  // General insurance — combined-ratio / underwriting lens.
  if (data.family === "general_insurance" && data.generalInsurance) {
    return <GeneralInsuranceTab gi={data.generalInsurance} view={data} onBasis={setBasis} symbol={symbol} />;
  }

  // Honest "coming" state for not-yet-built families.
  if (!data.built || !data.nonFinancial) return <ComingState view={data} />;

  const nf = data.nonFinancial;

  return (
    <div className="mt-6 space-y-2">
      <Reveal>
        <QuarterlySpine nf={nf} view={data} onBasis={setBasis} />
      </Reveal>
      <Reveal>
        <MarginTrend quarters={nf.quarters} />
      </Reveal>
      <Reveal>
        <ProfitabilityReturns annual={nf.annual} history={nf.ratioHistory} />
      </Reveal>
      <Reveal>
        <GrowthSection annual={nf.annual} quarters={nf.quarters} />
      </Reveal>
      <Reveal>
        <LeverageLiquidity annual={nf.annual} />
      </Reveal>
      <Reveal>
        <CashFlowSection annual={nf.annual} />
      </Reveal>
      <Reveal>
        <CashConversionSection points={nf.cashConversion} />
      </Reveal>
      <Reveal>
        <BalanceSheetSnapshot annual={nf.annual} />
      </Reveal>
      <Reveal>
        <DupontSection annual={nf.annual} />
      </Reveal>
      <Reveal>
        <YieldsSection yields={nf.yields} />
      </Reveal>
      <Reveal>
        <AiSummarySlot />
      </Reveal>
      <Reveal>
        <WhatsNextNav symbol={symbol} />
      </Reveal>
      <NotesFooter notes={data.notes} />
    </div>
  );
}
