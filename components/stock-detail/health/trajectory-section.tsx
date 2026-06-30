"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import type { TrajectorySection as TTrajectory } from "@/types/health";
import { SectionEyebrow, Panel, PILLAR_META, shortPeriod } from "./shared";

const ZONE_BANDS: { y1: number; y2: number; cssVar: string }[] = [
  { y1: 74, y2: 100, cssVar: "var(--c-pristine)" },
  { y1: 68, y2: 74, cssVar: "var(--c-healthy)" },
  { y1: 62, y2: 68, cssVar: "var(--c-steady)" },
  { y1: 55, y2: 62, cssVar: "var(--c-below)" },
  { y1: 0, y2: 55, cssVar: "var(--c-fragile)" },
];

type LineKey = "composite" | "foundation" | "momentum" | "market" | "ownership";
const LINES: { key: LineKey; label: string; color: string; width: number }[] = [
  { key: "composite", label: "Composite", color: "var(--ink)", width: 3 },
  { key: "foundation", label: "Foundation", color: PILLAR_META.foundation.cssVar, width: 2 },
  { key: "momentum", label: "Momentum", color: PILLAR_META.momentum.cssVar, width: 2 },
  { key: "market", label: "Market", color: PILLAR_META.market.cssVar, width: 2 },
  { key: "ownership", label: "Ownership", color: PILLAR_META.ownership.cssVar, width: 2 },
];

// ── FORWARD-READY cadence model (held-aware, dormant today) ───────────────────────
// Every pillar SCORE is materialized QUARTERLY today (Market score is stamped per
// snapshot; daily price is only an input). So the chart x-axis is quarterly, every
// pillar is "measured" at each point, and NO line renders held. When a daily Market
// score lands: set market → "daily" here; the x-axis upgrades to daily, Market draws a
// true daily line, and the quarterly pillars render HELD (dotted) between their quarter
// points — automatically, no rebuild. The held legend-key un-hides the moment any line
// is held. (Per-metric sparklines already use the shared HeldAwareLine primitive; this
// chart applies the same measured-vs-held semantics to the recharts lines.)
type Cadence = "quarterly" | "daily";
const CADENCE_RANK: Record<Cadence, number> = { quarterly: 1, daily: 2 }; // higher = finer
const PILLAR_CADENCE: Record<LineKey, Cadence> = {
  composite: "quarterly",
  foundation: "quarterly",
  momentum: "quarterly",
  market: "quarterly",
  ownership: "quarterly",
};
const CHART_CADENCE: Cadence = "quarterly"; // = finest pillar cadence present (upgrades when daily lands)
/** A line is HELD when the chart x-axis is finer than the line's own update clock. */
const isHeld = (k: LineKey): boolean => CADENCE_RANK[CHART_CADENCE] > CADENCE_RANK[PILLAR_CADENCE[k]];
const ANY_HELD = LINES.some((l) => isHeld(l.key));

// ── timeframe selector (full intended set; sub-quarterly disabled until daily lands) ──
type TfKey = "4Q" | "1Y" | "2Y" | "60D" | "30D" | "15D" | "Custom";
const TIMEFRAMES: { key: TfKey; label: string; points: number; disabled: boolean }[] = [
  { key: "4Q", label: "4Q", points: 4, disabled: false },
  { key: "1Y", label: "1Y", points: 4, disabled: false },
  { key: "2Y", label: "2Y", points: 8, disabled: false },
  { key: "60D", label: "60D", points: 0, disabled: true },
  { key: "30D", label: "30D", points: 0, disabled: true },
  { key: "15D", label: "15D", points: 0, disabled: true },
  { key: "Custom", label: "Custom", points: Infinity, disabled: false },
];
const NEEDS_DAILY = "needs daily data — coming";

export function TrajectorySection({
  trajectory,
  symbol,
}: {
  trajectory: TTrajectory;
  symbol?: string;
}) {
  const [tf, setTf] = useState<TfKey>("4Q");

  const allPoints = trajectory.series.map((pt) => ({
    period: shortPeriod(pt.periodKey),
    composite: Math.round(pt.composite * 10) / 10,
    foundation: Math.round(pt.foundation * 10) / 10,
    momentum: Math.round(pt.momentum * 10) / 10,
    market: Math.round(pt.market * 10) / 10,
    ownership: Math.round(pt.ownership * 10) / 10,
  }));

  const bandCrossings = trajectory.crossings.filter((c) => c.type === "band");

  // ── building-history state (single point) ──
  if (allPoints.length <= 1) {
    return (
      <section>
        <SectionEyebrow label="Trajectory" icon={Icons.chartLine} accent="var(--p-mom)" pill="building history" />
        <Panel className="flex flex-col items-center gap-2 py-10 text-center">
          <Icons.clock weight="duotone" className="h-9 w-9 text-ink3" />
          <p className="text-[13px] font-medium text-ink">Only one scored quarter so far</p>
          <p className="max-w-sm text-[12px] text-ink3">
            A trend needs at least two in-force snapshots. As {allPoints[0]?.period ?? "this stock"} accrues
            more scored quarters, the line will fill in here.
          </p>
        </Panel>
      </section>
    );
  }

  // ── window the series to the selected timeframe (quarter-count today) ──
  const win = TIMEFRAMES.find((t) => t.key === tf)!.points;
  const points = win === Infinity ? allPoints : allPoints.slice(-win);
  const tooShort = points.length < 2;

  return (
    <section>
      <SectionEyebrow label="Trajectory" icon={Icons.chartLine} accent="var(--p-mom)" pill={`${points.length} quarters`} />
      <Panel className="px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="kicker">Composite &amp; pillars over time</span>
          <div className="flex items-center gap-2">
            {/* timeframe segmented control — sub-quarterly disabled until daily Market lands */}
            <div className="inline-flex shrink-0 rounded-lg border border-line2 bg-surface-2 p-0.5 text-[11px]">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  disabled={t.disabled}
                  title={t.disabled ? NEEDS_DAILY : undefined}
                  onClick={() => !t.disabled && setTf(t.key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition-colors",
                    t.disabled
                      ? "cursor-not-allowed text-ink3/40"
                      : tf === t.key
                        ? "bg-surface-1 text-ink shadow-sm"
                        : "text-ink3 hover:text-ink2",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {symbol && (
              // Live CTA → the dedicated Trajectory tool (scrub, windows, journey read).
              <Link
                href={`/research/trajectory?symbol=${symbol}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-2.5 py-1 text-[11.5px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
              >
                Study full history
                <Icons.arrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* sub-quarterly roadmap note (only meaningful while daily data is pending) */}
        <p className="mb-2 text-[10.5px] text-ink3">
          Pillar scores update quarterly. <span className="text-ink3/80">60D · 30D · 15D arrive with daily market data.</span>
        </p>

        {tooShort ? (
          <p className="py-10 text-center text-[12px] text-ink3">Not enough scored quarters in this window.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
              {ZONE_BANDS.map((b) => (
                <ReferenceArea key={`zone-${b.y1}`} y1={b.y1} y2={b.y2} fill={b.cssVar} fillOpacity={0.07} ifOverflow="hidden" />
              ))}
              <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: "var(--ink3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[55, 62, 68, 74]}
                tick={{ fill: "var(--ink3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={34}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface2)",
                  border: "1px solid var(--line2)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
              />
              {bandCrossings.map((c, i) => (
                <ReferenceLine
                  key={`xing-${c.toPeriod}-${i}`}
                  x={shortPeriod(c.toPeriod)}
                  stroke="var(--c-steady)"
                  strokeDasharray="2 3"
                  strokeOpacity={0.6}
                  label={{ value: `${c.from}→${c.to}`, fill: "var(--c-steady)", fontSize: 9, position: "insideTopRight" }}
                />
              ))}
              {LINES.map((l, i) => (
                <Line
                  key={l.key}
                  type="monotone"
                  dataKey={l.key}
                  name={l.label}
                  stroke={l.color}
                  strokeWidth={l.width}
                  // held-aware: dotted when this line's clock is coarser than the chart's
                  // (dormant today — every pillar is quarterly, so all lines are solid/measured).
                  strokeDasharray={isHeld(l.key) ? "4 4" : undefined}
                  dot={{ r: 2.5, fill: l.color }}
                  activeDot={{ r: 4 }}
                  isAnimationActive
                  animationDuration={1100}
                  animationBegin={i * 120}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* legend */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11.5px] text-ink2">
          {LINES.map((l) => (
            <span key={l.key} className="inline-flex items-center gap-2">
              <span className="inline-block h-[3px] w-4 rounded" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
          {/* held-key — inert/hidden until a finer-cadence pillar (daily Market) makes others held */}
          {ANY_HELD && (
            <span className="inline-flex items-center gap-1.5 text-ink3">
              <span className="inline-block h-[3px] w-4 rounded bg-ink3" />
              measured
              <span className="ml-1 inline-block h-[3px] w-4 rounded border-t border-dashed border-ink3" />
              held
            </span>
          )}
        </div>

        {/* corporate events overlay (listed, since dates don't map cleanly to quarters) */}
        {trajectory.events.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <div className="kicker mb-2">Corporate events in window</div>
            <div className="flex flex-wrap gap-2">
              {trajectory.events.map((e, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-lg border border-line2 bg-surface-2 px-2.5 py-1 text-[11px] text-ink2"
                >
                  <Icons.spark className="h-3 w-3 text-p-mkt" />
                  <span className="num">{e.eventDate}</span>
                  {e.eventType}
                </span>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </section>
  );
}
