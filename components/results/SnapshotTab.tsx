"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Icons } from "@/lib/icons";
import { Reveal } from "@/components/ui/reveal";
import type { ResultDetailData } from "@/types/result-detail";
import {
  Panel,
  SectionEyebrow,
  MiniSpark,
  sparkSeries,
  MetricTile,
  Chip,
  HonestEmpty,
  fmtCr,
  fmtPct,
  fmtBps,
  fmtSignedPct,
  pctChange,
  bps,
  toneColor,
  tint,
} from "./shared";

const fmtFullDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtShortDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function SnapshotTab({
  data,
  onTab,
}: {
  data: ResultDetailData;
  onTab: (tab: string) => void;
}) {
  const { current: c, prevQuarter: prev, sameQuarterLastYear: sqly, spine, marketReaction: mr, ai, peers } = data;

  // Derived YoY/QoQ for the aggregates that have no stored growth column — real
  // arithmetic over stored values, honest-null when a comparison row is missing.
  const opYoy = pctChange(c.operatingProfit, sqly?.operatingProfit);
  const opQoq = pctChange(c.operatingProfit, prev?.operatingProfit);
  const pbtYoy = pctChange(c.profitBeforeTax, sqly?.profitBeforeTax);
  const pbtQoq = pctChange(c.profitBeforeTax, prev?.profitBeforeTax);

  const margins = [
    { label: c.operatingMargin != null ? "Operating margin" : null, value: c.operatingMargin, prev: prev?.operatingMargin, sqly: sqly?.operatingMargin },
    { label: "Net margin", value: c.netMargin, prev: prev?.netMargin, sqly: sqly?.netMargin },
  ].filter((m) => m.label != null && m.value != null) as {
    label: string; value: number; prev: number | null | undefined; sqly: number | null | undefined;
  }[];

  const revSeries = sparkSeries(spine, (q) => q.revenue);
  const profitSeries = sparkSeries(spine, (q) => q.netProfit);

  // Market-reaction chart data + factual window move (direction only — no verdict).
  const reactionData = mr.points.map((p) => ({ date: p.date, close: p.close }));
  const lastClose = mr.points.length ? mr.points[mr.points.length - 1].close : null;
  const windowMove = pctChange(lastClose, mr.preClose);

  return (
    <div className="space-y-2">
      {/* ── Headline numbers ─────────────────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="Headline" icon={Icons.chartBar} accent="var(--p-found)" pill={`${c.quarter} ${c.fiscalYear}`} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile label={c.revenueLabel} value={fmtCr(c.revenue)} yoy={c.revenueYoy} qoq={c.revenueQoq} />
            {c.operatingProfit != null && (
              <MetricTile label="Operating profit" value={fmtCr(c.operatingProfit)} yoy={opYoy} qoq={opQoq} />
            )}
            <MetricTile label="Profit before tax" value={fmtCr(c.profitBeforeTax)} yoy={pbtYoy} qoq={pbtQoq} />
            <MetricTile label="Net profit" value={fmtCr(c.netProfit)} yoy={c.profitYoy} qoq={c.profitQoq} />
          </div>
        </section>
      </Reveal>

      {/* ── Margins + trend sparks ───────────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="Margins & trend" icon={Icons.pulse} accent="var(--p-mom)" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* margin pulse */}
            <Panel className="p-0">
              {margins.length === 0 ? (
                <div className="p-5"><HonestEmpty>Margin data not disclosed for this quarter.</HonestEmpty></div>
              ) : (
                <div className="divide-y divide-line">
                  {margins.map((m) => (
                    <div key={m.label} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <span className="text-[13px] font-medium text-ink">{m.label}</span>
                      <div className="flex items-center gap-6">
                        <span className="num text-[17px] font-semibold text-ink">{fmtPct(m.value)}</span>
                        <div className="min-w-[92px] text-right">
                          <div className="num text-[11px]" style={{ color: toneColor(bps(m.value, m.sqly)) }}>
                            {fmtBps(bps(m.value, m.sqly))} <span className="text-ink3">YoY</span>
                          </div>
                          <div className="num text-[11px]" style={{ color: toneColor(bps(m.value, m.prev)) }}>
                            {fmtBps(bps(m.value, m.prev))} <span className="text-ink3">QoQ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* trend sparks */}
            <Panel className="flex flex-col justify-center gap-4">
              <SparkRow label={`${c.revenueLabel} · ${spine.length}Q`} value={fmtCr(c.revenue)} series={revSeries} color="var(--p-found)" />
              <SparkRow label={`Net profit · ${spine.length}Q`} value={fmtCr(c.netProfit)} series={profitSeries} color="var(--p-mom)" />
            </Panel>
          </div>
        </section>
      </Reveal>

      {/* ── Market reaction ──────────────────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="Market reaction" icon={Icons.chartLine} accent="var(--p-mkt)" />
          <Panel>
            {!mr.available ? (
              <HonestEmpty>Price reaction data not available for this result date.</HonestEmpty>
            ) : (
              <>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="kicker">
                    Daily close around the filing ({fmtFullDay(mr.filingDate)})
                    {mr.reactionState === "forming" && (
                      <span className="ml-1.5 text-ink3">
                        · still forming — {mr.tradingDaysSinceFiling} of ~12 trading days
                      </span>
                    )}
                  </span>
                  {windowMove != null && (
                    <span className="num text-[12px]" style={{ color: toneColor(windowMove) }}>
                      {fmtSignedPct(windowMove)} <span className="text-ink3">close vs pre-filing</span>
                    </span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={reactionData} margin={{ top: 8, right: 12, bottom: 4, left: -6 }}>
                    <defs>
                      <linearGradient id="reactionFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--p-mkt)" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="var(--p-mkt)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={fmtShortDay}
                      tick={{ fill: "var(--ink3)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: "var(--ink3)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={46}
                      tickFormatter={(v: number) => `₹${v.toFixed(0)}`}
                    />
                    {mr.preClose != null && (
                      <ReferenceLine y={mr.preClose} stroke="var(--line3)" strokeDasharray="3 3" />
                    )}
                    <ReferenceLine x={mr.filingDate} stroke="var(--p-mkt)" strokeDasharray="2 3" strokeOpacity={0.6} />
                    <Tooltip
                      contentStyle={{ background: "var(--surface2)", border: "1px solid var(--line2)", borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
                      labelFormatter={(l: string) => fmtFullDay(l)}
                      formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Close"]}
                    />
                    <Area type="monotone" dataKey="close" stroke="var(--p-mkt)" strokeWidth={1.8} fill="url(#reactionFill)" dot={false} activeDot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="mt-2 text-[11px] text-ink3">
                  {mr.reactionState === "forming"
                    ? `Partial window — ${mr.tradingDaysSinceFiling} of ~12 trading days since filing. The line extends as daily closes come in.`
                    : "Closing price across the window — the path, stated as fact. No reaction verdict is implied."}
                </p>
              </>
            )}
          </Panel>
        </section>
      </Reveal>

      {/* ── AI quick take ────────────────────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="AI quick take" icon={Icons.spark} accent="var(--p-own)" />
          <Panel>
            {ai.available && ai.headline ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border" style={tint("var(--p-own)")}>
                    <Icons.spark weight="duotone" className="h-4 w-4" />
                  </span>
                  <p className="text-[14px] font-medium leading-snug text-ink">{ai.headline}</p>
                </div>
                <button
                  onClick={() => onTab("context")}
                  className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-2.5 py-1 text-[12px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
                >
                  Read the full analysis
                  <Icons.arrowRight className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <HonestEmpty>AI earnings analysis is coming soon — not yet generated for this result.</HonestEmpty>
            )}
          </Panel>
        </section>
      </Reveal>

      {/* ── Peers this quarter (optional) ────────────────────────────── */}
      {peers.length > 0 && (
        <Reveal>
          <section>
            <SectionEyebrow
              label="Peers this quarter"
              icon={Icons.scales}
              accent="var(--p-found)"
              pill={data.peerGroupName ?? undefined}
            />
            <Panel className="p-0">
              <div className="divide-y divide-line">
                {peers.map((p) => (
                  <div key={p.symbol} className="flex items-center justify-between gap-3 px-5 py-2.5">
                    <div className="min-w-0">
                      <span className="text-[13px] font-medium text-ink">{p.symbol}</span>
                      <span className="ml-2 truncate text-[11.5px] text-ink3">{p.name}</span>
                    </div>
                    {p.filed ? (
                      <div className="flex items-center gap-5 text-right">
                        <span className="num text-[12px]" style={{ color: toneColor(p.revenueYoy) }}>
                          {fmtSignedPct(p.revenueYoy)} <span className="text-ink3">rev</span>
                        </span>
                        <span className="num text-[12px]" style={{ color: toneColor(p.profitYoy) }}>
                          {fmtSignedPct(p.profitYoy)} <span className="text-ink3">profit</span>
                        </span>
                      </div>
                    ) : (
                      <Chip>Not filed yet</Chip>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
            <p className="mt-2 px-1 text-[11px] text-ink3">
              Same-quarter peer growth, stated as fact — not a ranking or recommendation.
            </p>
          </section>
        </Reveal>
      )}
    </div>
  );
}

function SparkRow({
  label,
  value,
  series,
  color,
}: {
  label: string;
  value: string;
  series: (number | null)[];
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[11px] text-ink3">{label}</div>
        <div className="num mt-0.5 text-[16px] font-semibold text-ink">{value}</div>
      </div>
      <MiniSpark points={series} color={color} width={120} height={34} />
    </div>
  );
}
