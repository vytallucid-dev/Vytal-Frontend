"use client";

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

const LINES: { key: "composite" | "foundation" | "momentum" | "market" | "ownership"; label: string; color: string; width: number }[] = [
  { key: "composite", label: "Composite", color: "var(--ink)", width: 3 },
  { key: "foundation", label: "Foundation", color: PILLAR_META.foundation.cssVar, width: 2 },
  { key: "momentum", label: "Momentum", color: PILLAR_META.momentum.cssVar, width: 2 },
  { key: "market", label: "Market", color: PILLAR_META.market.cssVar, width: 2 },
  { key: "ownership", label: "Ownership", color: PILLAR_META.ownership.cssVar, width: 2 },
];

export function TrajectorySection({
  trajectory,
  symbol,
}: {
  trajectory: TTrajectory;
  symbol?: string;
}) {
  const points = trajectory.series.map((pt) => ({
    period: shortPeriod(pt.periodKey),
    composite: Math.round(pt.composite * 10) / 10,
    foundation: Math.round(pt.foundation * 10) / 10,
    momentum: Math.round(pt.momentum * 10) / 10,
    market: Math.round(pt.market * 10) / 10,
    ownership: Math.round(pt.ownership * 10) / 10,
  }));

  const bandCrossings = trajectory.crossings.filter((c) => c.type === "band");

  // ── building-history state (single point) ──
  if (points.length <= 1) {
    return (
      <section>
        <SectionEyebrow label="Trajectory" pill="building history" />
        <Panel className="flex flex-col items-center gap-2 py-10 text-center">
          <Icons.clock weight="duotone" className="h-9 w-9 text-ink3" />
          <p className="text-[13px] font-medium text-ink">Only one scored quarter so far</p>
          <p className="max-w-sm text-[12px] text-ink3">
            A trend needs at least two in-force snapshots. As {points[0]?.period ?? "this stock"} accrues
            more scored quarters, the line will fill in here.
          </p>
        </Panel>
      </section>
    );
  }

  return (
    <section>
      <SectionEyebrow label="Trajectory" pill={`${points.length} quarters`} />
      <Panel className="px-4 py-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="kicker">Composite &amp; pillars over time</span>
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
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={points} margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
            {ZONE_BANDS.map((b) => (
              <ReferenceArea key={b.y1} y1={b.y1} y2={b.y2} fill={b.cssVar} fillOpacity={0.07} ifOverflow="hidden" />
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
                key={i}
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
                dot={{ r: 2.5, fill: l.color }}
                activeDot={{ r: 4 }}
                isAnimationActive
                animationDuration={1100}
                animationBegin={i * 120}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* legend */}
        <div className="mt-3 flex flex-wrap gap-4 text-[11.5px] text-ink2">
          {LINES.map((l) => (
            <span key={l.key} className="inline-flex items-center gap-2">
              <span className="inline-block h-[3px] w-4 rounded" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
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
