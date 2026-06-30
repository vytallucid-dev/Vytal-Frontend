"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Icons } from "@/lib/icons";
import { Reveal } from "@/components/ui/reveal";
import type { ResultDetailData } from "@/types/result-detail";
import {
  Panel,
  SectionEyebrow,
  HonestEmpty,
  shortPeriod,
  fmtCr,
  fmtPct,
  DASH,
} from "./shared";
import { AnnualBlock } from "./AnnualBlock";

const STAGE_COLORS = ["var(--p-found)", "var(--p-mom)", "var(--p-mkt)", "var(--p-own)"];

export default function PnlTrendsTab({ data }: { data: ResultDetailData }) {
  const { spine, current: c, industryType } = data;
  const isNonFin = industryType === "non_financial";

  const chartData = spine.map((q) => ({
    period: shortPeriod(q.periodKey),
    revenue: q.revenue,
    netProfit: q.netProfit,
    operatingMargin: q.operatingMargin,
    netMargin: q.netMargin,
  }));

  // P&L decomposition (non-financial only — the aggregates form a clean cascade there).
  const stages =
    isNonFin && c.revenue != null
      ? ([
          { label: c.revenueLabel, value: c.revenue },
          { label: "Operating profit", value: c.operatingProfit },
          { label: "Profit before tax", value: c.profitBeforeTax },
          { label: "Net profit", value: c.netProfit },
        ] as { label: string; value: number | null }[])
      : [];
  const stageMax = stages.reduce((m, s) => Math.max(m, s.value ?? 0), 0) || 1;

  return (
    <div className="space-y-2">
      {/* ── 8-quarter spine table ────────────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="Quarterly spine" icon={Icons.chartBar} accent="var(--p-found)" pill={`${spine.length} quarters`} />
          <Panel className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-[11px] text-ink3">
                  <th className="px-4 py-2.5 text-left font-medium">Quarter</th>
                  <th className="px-4 py-2.5 text-right font-medium">{c.revenueLabel}</th>
                  <th className="px-4 py-2.5 text-right font-medium">Op profit</th>
                  <th className="px-4 py-2.5 text-right font-medium">PBT</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tax</th>
                  <th className="px-4 py-2.5 text-right font-medium">Net profit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Op margin</th>
                  <th className="px-4 py-2.5 text-right font-medium">Net margin</th>
                </tr>
              </thead>
              <tbody>
                {[...spine].reverse().map((q) => {
                  const isCurrent = q.periodKey === c.periodKey;
                  return (
                    <tr
                      key={q.periodKey}
                      className={isCurrent ? "border-b border-line bg-surface-2" : "border-b border-line"}
                    >
                      <td className="px-4 py-2.5 text-left">
                        <span className={isCurrent ? "font-semibold text-ink" : "text-ink2"}>{shortPeriod(q.periodKey)}</span>
                      </td>
                      <td className="num px-4 py-2.5 text-right text-ink">{fmtCr(q.revenue)}</td>
                      <td className="num px-4 py-2.5 text-right text-ink2">{fmtCr(q.operatingProfit)}</td>
                      <td className="num px-4 py-2.5 text-right text-ink2">{fmtCr(q.profitBeforeTax)}</td>
                      <td className="num px-4 py-2.5 text-right text-ink2">{fmtCr(q.tax)}</td>
                      <td className="num px-4 py-2.5 text-right text-ink">{fmtCr(q.netProfit)}</td>
                      <td className="num px-4 py-2.5 text-right text-ink2">{q.operatingMargin != null ? fmtPct(q.operatingMargin) : DASH}</td>
                      <td className="num px-4 py-2.5 text-right text-ink2">{fmtPct(q.netMargin)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </section>
      </Reveal>

      {/* ── Revenue & profit trend ───────────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="Revenue & profit trend" icon={Icons.chartLine} accent="var(--p-mom)" />
          <Panel>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 8, bottom: 4, left: -6 }}>
                <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rev" tick={{ fill: "var(--ink3)", fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <YAxis yAxisId="profit" orientation="right" tick={{ fill: "var(--ink3)", fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--surface2)", border: "1px solid var(--line2)", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
                  formatter={(v: number, n: string) => [fmtCr(v), n]}
                />
                <Legend wrapperStyle={{ fontSize: 11.5 }} />
                <Line yAxisId="rev" type="monotone" dataKey="revenue" name={c.revenueLabel} stroke="var(--p-found)" strokeWidth={2.2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                <Line yAxisId="profit" type="monotone" dataKey="netProfit" name="Net profit" stroke="var(--p-mom)" strokeWidth={2.2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </section>
      </Reveal>

      {/* ── P&L decomposition (non-fin) ──────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="P&L decomposition" icon={Icons.graph} accent="var(--p-mkt)" pill={`${c.quarter} ${c.fiscalYear}`} />
          <Panel>
            {stages.length === 0 ? (
              <HonestEmpty>
                The revenue → profit cascade is shown for non-financial companies. For banks &amp; insurers the
                P&amp;L structure differs — see the quarterly spine above.
              </HonestEmpty>
            ) : (
              <div className="flex flex-col gap-3">
                {stages.map((s, i) => {
                  const pct = s.value != null ? Math.max(2, (s.value / stageMax) * 100) : 0;
                  return (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 text-[12px] text-ink2">{s.label}</span>
                      <div className="h-6 flex-1 overflow-hidden rounded-md bg-surface-2">
                        {s.value != null && (
                          <div
                            className="h-full rounded-md"
                            style={{ width: `${pct}%`, background: `color-mix(in oklch, ${STAGE_COLORS[i]} 55%, transparent)` }}
                          />
                        )}
                      </div>
                      <span className="num w-24 shrink-0 text-right text-[12.5px] font-semibold text-ink">{fmtCr(s.value)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </section>
      </Reveal>

      {/* ── Margin trend ─────────────────────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="Margin trend" icon={Icons.pulse} accent="var(--p-own)" />
          <Panel>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 10, right: 8, bottom: 4, left: -6 }}>
                <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--ink3)", fontSize: 11 }} axisLine={false} tickLine={false} width={42} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ background: "var(--surface2)", border: "1px solid var(--line2)", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
                  formatter={(v: number, n: string) => [fmtPct(v), n]}
                />
                <Legend wrapperStyle={{ fontSize: 11.5 }} />
                {isNonFin && (
                  <Line type="monotone" dataKey="operatingMargin" name="Op margin" stroke="var(--p-found)" strokeWidth={2.2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} connectNulls />
                )}
                <Line type="monotone" dataKey="netMargin" name="Net margin" stroke="var(--p-own)" strokeWidth={2.2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </section>
      </Reveal>

      {/* ── Annual statements (full-year CF + BS-headline, family-aware) ─ */}
      <Reveal>
        <section>
          <SectionEyebrow
            label="Annual statements"
            icon={Icons.building}
            accent="var(--p-found)"
            pill={data.annualState === "available" && data.annual ? data.annual.fiscalYear : undefined}
          />
          {data.annualState === "available" && data.annual && (
            <p className="mb-3 px-1 text-[12px] text-ink3">
              Full-year (annual) cash-flow &amp; balance-sheet headline for {data.annual.fiscalYear} —
              distinct from the quarterly spine above.
            </p>
          )}
          <AnnualBlock annual={data.annual} annualState={data.annualState} />
        </section>
      </Reveal>
    </div>
  );
}
