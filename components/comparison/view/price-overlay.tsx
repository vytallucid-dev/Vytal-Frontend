"use client";

/**
 * Price-path overlay — both stocks rebased to 100 at the window start, so the SHAPE of
 * the two paths is directly comparable regardless of absolute price. Two neutral
 * identity hues; no "outperformed therefore better" — the divergence is shown as fact,
 * the user reads it. A is the reference window; B is aligned onto A's dates.
 */

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PriceSeriesPoint } from "@/types/price";
import { A_HUE, B_HUE, HonestEmpty } from "./shared";

const DAY = 24 * 60 * 60 * 1000;
const PERIODS = [
  { key: "3M", days: 90 },
  { key: "6M", days: 182 },
  { key: "1Y", days: 365 },
  { key: "3Y", days: 365 * 3 },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

function within(series: PriceSeriesPoint[], days: number): PriceSeriesPoint[] {
  if (!series.length) return [];
  const latestMs = new Date(series[series.length - 1].date).getTime();
  const startMs = latestMs - days * DAY;
  return series.filter((p) => new Date(p.date).getTime() >= startMs);
}

function closeOnOrBefore(series: PriceSeriesPoint[], dateMs: number): number | null {
  let pick: number | null = null;
  for (const p of series) {
    if (new Date(p.date).getTime() <= dateMs) pick = p.close;
    else break;
  }
  return pick;
}

interface Row {
  date: string;
  a: number | null;
  b: number | null;
}

export function PriceOverlay({
  aLabel,
  bLabel,
  aSeries,
  bSeries,
}: {
  aLabel: string;
  bLabel: string;
  aSeries: PriceSeriesPoint[];
  bSeries: PriceSeriesPoint[];
}) {
  const [period, setPeriod] = useState<PeriodKey>("1Y");
  const days = PERIODS.find((p) => p.key === period)!.days;

  const { rows, bShown } = useMemo(() => {
    if (aSeries.length < 2) return { rows: [] as Row[], bShown: false };
    const aWin = within(aSeries, days);
    if (aWin.length < 2) return { rows: [] as Row[], bShown: false };
    const aBase = aWin[0].close;
    const startMs = new Date(aWin[0].date).getTime();
    // B can only join if it has a close at-or-before A's window start (shared 100-point).
    const bBase = closeOnOrBefore(bSeries, startMs);
    const rows: Row[] = aWin.map((p) => {
      const dMs = new Date(p.date).getTime();
      const bClose = closeOnOrBefore(bSeries, dMs);
      return {
        date: p.date,
        a: aBase > 0 ? Math.round((p.close / aBase) * 1000) / 10 : null,
        b: bBase && bClose ? Math.round((bClose / bBase) * 1000) / 10 : null,
      };
    });
    return { rows, bShown: bBase != null };
  }, [aSeries, bSeries, days]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-ink3">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: A_HUE }} />
            <span className="num font-medium text-ink2">{aLabel}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: B_HUE }} />
            <span className="num font-medium text-ink2">{bLabel}</span>
          </span>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`num rounded-md px-2.5 py-1 text-[11px] transition-colors ${
                period === p.key
                  ? "border border-line2 bg-surface-2 text-ink"
                  : "border border-transparent text-ink3 hover:text-ink2"
              }`}
            >
              {p.key}
            </button>
          ))}
        </div>
      </div>

      {rows.length < 2 ? (
        <HonestEmpty>Not enough price history for this period.</HonestEmpty>
      ) : (
        <>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--ink3)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--line)" }}
                  minTickGap={48}
                  tickFormatter={(d: string) => d.slice(2)}
                />
                <YAxis
                  tick={{ fill: "var(--ink3)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                  width={42}
                />
                <ReferenceLine y={100} stroke="var(--line2)" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--line2)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
                  formatter={(value: number, name: string) => {
                    const delta = value - 100;
                    const txt = `${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)}%`;
                    return [txt, name === "a" ? aLabel : bLabel];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="a"
                  stroke={A_HUE}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="b"
                  stroke={B_HUE}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="num text-[10.5px] text-ink3">Indexed to 100 at period start.</p>
          {!bShown && (
            <p className="text-[10.5px] text-ink3">
              {bLabel} price history doesn&apos;t reach back this far — its line is
              omitted for this period.
            </p>
          )}
        </>
      )}
    </div>
  );
}
