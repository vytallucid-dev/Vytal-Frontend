"use client";

/**
 * TRAJECTORY OVERLAY — the centerpiece of the comparison Overview. Both entities'
 * composite-score HISTORY drawn as two lines on ONE shared time axis, both in the
 * universal 0–100 health space (A-hue / B-hue). Like the rebased price overlay, but for
 * the health composite over quarters — the temporal shape of difference a static
 * side-by-side can't show.
 *
 * FACTUAL ONLY: it is the score path over time. There is NO "A is pulling ahead" verdict —
 * the two paths are drawn; the reader sees convergence / divergence / one improving while
 * the other slips. No fill, no winner colour; two equal lines.
 *
 * HONEST-EMPTY: when BOTH series are too short (<2 points) there is nothing to chart. When
 * only one is too short it still renders (a lone point), and a note states the limit.
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrajectoryPoint } from "@/types/health";
import { shortPeriod } from "@/components/stock-detail/health/shared";
import { A_HUE, B_HUE, HonestEmpty } from "./shared";

/** Chronological rank for an "FY26Q4"-style period key (year × 4 + quarter). Lets us merge
 *  two independently-sorted series onto one ordered time axis. */
function periodRank(pk: string): number {
  const m = /^FY(\d{2})Q(\d)$/.exec(pk);
  if (!m) return 0;
  return Number(m[1]) * 4 + Number(m[2]);
}

interface Row {
  period: string;
  rank: number;
  a: number | null;
  b: number | null;
}

/** Union both series on a shared, chronologically-ordered period axis. A period present
 *  for only one entity leaves the other null at that slot (the line spans its own points). */
function mergeSeries(aSeries: TrajectoryPoint[], bSeries: TrajectoryPoint[]): Row[] {
  const aByPeriod = new Map(aSeries.map((p) => [p.periodKey, p.composite]));
  const bByPeriod = new Map(bSeries.map((p) => [p.periodKey, p.composite]));
  const periods = Array.from(new Set([...aByPeriod.keys(), ...bByPeriod.keys()]));
  return periods
    .map((pk) => ({
      period: shortPeriod(pk),
      rank: periodRank(pk),
      a: aByPeriod.get(pk) ?? null,
      b: bByPeriod.get(pk) ?? null,
    }))
    .sort((x, y) => x.rank - y.rank);
}

export function TrajectoryOverlay({
  aLabel,
  bLabel,
  aSeries,
  bSeries,
}: {
  aLabel: string;
  bLabel: string;
  aSeries: TrajectoryPoint[];
  bSeries: TrajectoryPoint[];
}) {
  // Both too short — nothing honest to chart.
  if (aSeries.length < 2 && bSeries.length < 2) {
    return (
      <HonestEmpty>
        Not enough health history to chart a trajectory for either company yet.
      </HonestEmpty>
    );
  }

  const data = mergeSeries(aSeries, bSeries);

  // One side too short — render what's there, then state the limit honestly.
  const shortNotes: string[] = [];
  if (aSeries.length < 2) shortNotes.push(`${aLabel}: only ${aSeries.length} quarter on file`);
  if (bSeries.length < 2) shortNotes.push(`${bLabel}: only ${bSeries.length} quarter on file`);

  return (
    <div className="space-y-2">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fill: "var(--ink3)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "var(--ink3)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--line2)",
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
              formatter={(value: number, name: string) => [
                value.toFixed(1),
                name === "a" ? aLabel : bLabel,
              ]}
            />
            <Line
              type="monotone"
              dataKey="a"
              name="a"
              stroke={A_HUE}
              strokeWidth={2}
              dot={{ r: 2, fill: A_HUE, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="b"
              name="b"
              stroke={B_HUE}
              strokeWidth={2}
              dot={{ r: 2, fill: B_HUE, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {shortNotes.length > 0 && (
        <p className="text-xs text-ink3">{shortNotes.join(" · ")} — shown as a point, not a line.</p>
      )}
    </div>
  );
}
