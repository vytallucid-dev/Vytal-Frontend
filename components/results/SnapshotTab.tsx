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
  VerdictBadge,
  VerdictCaveat,
  QuarterBriefProse,
  REACTION_EMPTY_COPY,
  REACTION_NOT_OPENED_KICKER,
  REACTION_NOT_OPENED_COPY,
  REACTION_COMPLETE_COPY,
  reactionFormingKicker,
  reactionFormingCopy,
} from "./shared";
import { HealthContext } from "./HealthContext";

// Both accept a timestamp as well as an ISO day, because the reaction chart's axis is now
// numeric. `Date.parse("2026-08-01")` is UTC midnight — the exact value `new Date("2026-08-01")`
// produced before — so what these render is unchanged.
const fmtFullDay = (d: string | number) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtShortDay = (d: string | number) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** ── THE X AXIS IS TIME, NOT A LIST OF TRADING DAYS ────────────────────────────────────────────
 *  The axis used to be Recharts' default `type="category"`, whose domain is exactly the plotted
 *  date strings. A filing on a non-trading day is not one of them, so `scale(filingDate)` was
 *  `undefined` → `NaN` → ReferenceLine's `ifOverflow: 'discard'` returned null. The marker vanished
 *  on 695 of 7,040 renderable charts (599 weekends, 96 market holidays) with no warning, and the
 *  same missing domain member kept the filing date off the axis labels — one defect, two symptoms.
 *
 *  An ordinal scale cannot be made to fix this: it maps domain members to evenly-spaced slots and
 *  has no coordinate at all for a value between two of them. So the axis is numeric/time. Dates are
 *  continuous and trading days are a sample of them — that is the honest model, and the filing date
 *  lands at its true position between the closes either side of it. The visible cost is that
 *  weekend gaps are now proportional: 31 Jul → 3 Aug is drawn three times as wide as a one-day step.
 *
 *  ⚠ THE MARKER IS NEVER SNAPPED TO THE NEAREST TRADING DAY. Snapping a Saturday filing back to
 *  Friday would draw the line on a day the filing had not happened. */
const tsOf = (iso: string): number => Date.parse(iso);

/** ── EVERY AXIS TICK IS A DAY THIS CHART HAS A CLOSE FOR ───────────────────────────────────────
 *  Candidates are the PLOTTED DATES ONLY, thinned evenly toward ~6 with both ends kept. The filing
 *  date is not a candidate and is never inserted here.
 *
 *  ⚠ THE FILING DATE USED TO BE FORCED IN, AND IT COST A REAL TRADING DAY ITS LABEL. Protecting it
 *  from Recharts' backwards-walking thinner meant clearing a neighbourhood around it, which on the
 *  1 Aug window deleted 31 Jul — a real close, and the very one the pre-filing baseline and the
 *  +1.3% are measured from. The tooltip showed "31 Jul 2026 · ₹94.67" over a date the axis denied.
 *  Two things were conflated: keeping the filing marker legible (right) and evicting real days to
 *  do it (wrong). A label that names a day the market did not trade is worth less than a label
 *  naming one it did, and it is not the axis's job to carry it — the dotted line already sits at
 *  the true position and now names the date itself, so nothing is lost by leaving the axis alone.
 *
 *  There is no clear zone, no guard fraction and no special case: real days compete only with each
 *  other, on density, and the marker never takes one of their slots at any width. */
function axisTicks(pointTs: number[], max = 6): number[] {
  const uniq = Array.from(new Set(pointTs)).sort((a, b) => a - b);
  if (uniq.length <= max) return uniq;

  const keep = new Set<number>([uniq[0], uniq[uniq.length - 1]]);
  const slots = max - keep.size;
  const step = (uniq.length - 1) / (slots + 1);
  for (let i = 1; i <= slots; i++) keep.add(uniq[Math.round(i * step)]);
  return Array.from(keep).sort((a, b) => a - b);
}

// `onTab` is gone: the only caller was the brief's "Read the full analysis" button, and the brief
// now renders in full here. A prop no child reads is half-wiring, so it comes out with its use.
export default function SnapshotTab({ data }: { data: ResultDetailData }) {
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
  const reactionData = mr.points.map((p) => ({ ts: tsOf(p.date), close: p.close }));
  const filingTs = tsOf(mr.filingDate);
  const pointTs = reactionData.map((p) => p.ts);
  const reactionDomain: [number, number] = [
    Math.min(filingTs, ...pointTs),
    Math.max(filingTs, ...pointTs),
  ];
  const reactionTicks = axisTicks(pointTs);

  const lastPoint = mr.points.length ? mr.points[mr.points.length - 1] : null;
  /** ⚠ SUPPRESSED WHEN THE LATEST CLOSE IS THE BASELINE ITSELF. A window filed on a Saturday and
   *  read on the Sunday has its last point BEFORE the filing, so this would render "+0.0% close vs
   *  pre-filing" — a value measured against itself, which reads as "the market did not react" when
   *  the market has not yet had the chance. Where a close at or after the filing exists (including
   *  a same-day filing's own close), the figure is real and shows. */
  const windowMove =
    lastPoint && lastPoint.date >= mr.filingDate ? pctChange(lastPoint.close, mr.preClose) : null;

  const windowNotOpened = mr.reactionState === "forming" && mr.tradingDaysSinceFiling === 0;

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

      {/* ── Health & flags (scoring connection) ──────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="Health & flags" icon={Icons.health} accent="var(--p-found)" />
          <HealthContext health={data.health} viewedPeriodKey={c.periodKey} />
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
                        <span className="num text-sm sm:text-[17px] font-semibold text-ink">{fmtPct(m.value)}</span>
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
              <HonestEmpty>{REACTION_EMPTY_COPY}</HonestEmpty>
            ) : (
              <>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="kicker">
                    Daily close around the filing ({fmtFullDay(mr.filingDate)})
                    {mr.reactionState === "forming" && (
                      <span className="ml-1.5 text-ink3">
                        ·{" "}
                        {windowNotOpened
                          ? REACTION_NOT_OPENED_KICKER
                          : reactionFormingKicker(mr.tradingDaysSinceFiling, mr.expectedTradingDays)}
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
                  <AreaChart data={reactionData} margin={{ top: 18, right: 12, bottom: 4, left: -6 }}>
                    <defs>
                      <linearGradient id="reactionFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--p-mkt)" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="var(--p-mkt)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="ts"
                      type="number"
                      scale="time"
                      domain={reactionDomain}
                      ticks={reactionTicks}
                      tickFormatter={fmtShortDay}
                      tick={{ fill: "var(--ink3)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={16}
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
                    {/* Positioned by TIME, so it lands on the true filing date whether or not the
                        market traded that day. ★ THE LABEL CARRIES THE DATE. It is the only thing
                        that has to — the axis is reserved for days with a close, so on a weekend or
                        holiday filing this annotation is where the filing date is named on the
                        chart, and it is always present because it travels with the line. */}
                    <ReferenceLine
                      x={filingTs}
                      stroke="var(--p-mkt)"
                      strokeDasharray="2 3"
                      strokeOpacity={0.6}
                      label={{
                        value: `Filed ${fmtShortDay(filingTs)}`,
                        position: "top",
                        fill: "var(--p-mkt)",
                        fontSize: 10,
                        opacity: 0.75,
                      }}
                    />
                    <Tooltip
                      contentStyle={{ background: "var(--surface2)", border: "1px solid var(--line2)", borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
                      labelFormatter={(l: number) => fmtFullDay(l)}
                      formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Close"]}
                    />
                    <Area type="monotone" dataKey="close" stroke="var(--p-mkt)" strokeWidth={1.8} fill="url(#reactionFill)" dot={false} activeDot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="mt-2 text-[11px] text-ink3">
                  {mr.reactionState !== "forming"
                    ? REACTION_COMPLETE_COPY
                    : windowNotOpened
                      ? REACTION_NOT_OPENED_COPY
                      : reactionFormingCopy(mr.tradingDaysSinceFiling, mr.expectedTradingDays)}
                </p>
              </>
            )}
          </Panel>
        </section>
      </Reveal>

      {/* ── Quarter in Brief ─────────────────────────────────────────── */}
      {/* The whole brief renders HERE. It previously showed a headline plus a button through to the
          Context tab, which never rendered the body — so the "full analysis" was one click from
          nowhere. A brief is short by design; there is nothing to page through. */}
      <Reveal>
        <section>
          <SectionEyebrow
            label="Quarter in Brief"
            icon={Icons.spark}
            accent="var(--p-own)"
            pill={`${c.quarter} ${c.fiscalYear}`}
          />
          <Panel>
            {ai.available && ai.content ? (
              <div className="flex flex-col gap-4">
                {/* ★ THE BADGE AND ITS LIMIT, TOGETHER, ABOVE THE PROSE. Not a footer, not a tooltip.
                    The verdict is the line a reader is most likely to act on, so what it does not
                    claim is the next thing they read — before the figures, not after them.
                    ⚠ VerdictBadge renders NOTHING when there is no verdict, and that is a shipped
                    state: MMTC has real prose and no verdict. The caveat still holds — it qualifies
                    the reading, not only the badge — so this block never collapses to empty. */}
                <div className="flex flex-col gap-2 border-b border-line pb-4">
                  <VerdictBadge verdictKey={ai.verdictKey} label={ai.verdictLabel} />
                  <VerdictCaveat />
                </div>

                <QuarterBriefProse content={ai.content} scoredAsOf={ai.scoredAsOf} />

                {ai.generatedAt && (
                  <p className="num text-[10.5px] text-ink3">
                    Written from the filed figures on {fmtFullDay(ai.generatedAt)}.
                  </p>
                )}
              </div>
            ) : (
              /* ⚠ NOT "coming soon", and not a failure. Absence here means exactly one thing to a
                 reader — nothing has been written for this quarter — and the sentence says that and
                 stops. A brief that was withdrawn because a correction moved its figures reads the
                 same way, deliberately: a reader is owed the absence, not the reason. */
              <HonestEmpty>No Quarter in Brief has been written for this quarter.</HonestEmpty>
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
        <div className="num mt-0.5 text-xs sm:text-[16px] font-semibold text-ink">{value}</div>
      </div>
      <MiniSpark points={series} color={color} width={120} height={34} />
    </div>
  );
}
