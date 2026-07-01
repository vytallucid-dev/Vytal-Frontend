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

// ── held-aware cadence model ──────────────────────────────────────────────────────
// Market & Ownership recompute daily/event-driven (their SCORE changes day-to-day);
// Foundation & Momentum step only per quarter. On a DAILY timeframe the chart x-axis is
// finer than F/M's quarterly clock, so those two lines render HELD (dashed) — flat between
// quarter steps, which is TRUE, not interpolated. On the QUARTERLY timeframe every pillar
// is measured at each point, so no line is held. The held legend-key un-hides only when a
// line is actually held (i.e. on a daily timeframe).
type Cadence = "quarterly" | "daily";
const CADENCE_RANK: Record<Cadence, number> = { quarterly: 1, daily: 2 }; // higher = finer
// Each pillar's OWN update clock (independent of the chart's current x-axis).
const PILLAR_CADENCE: Record<LineKey, Cadence> = {
  composite: "daily", // moves daily (Market + Ownership both feed it)
  foundation: "quarterly",
  momentum: "quarterly",
  market: "daily",
  ownership: "daily",
};
/** A line is HELD when the chart x-axis is finer than the line's own update clock. */
const isHeld = (k: LineKey, chartCadence: Cadence): boolean =>
  CADENCE_RANK[chartCadence] > CADENCE_RANK[PILLAR_CADENCE[k]];

// ── timeframe selector ──
// Quarterly timeframes read the per-quarter series; daily timeframes read the daily series.
type TfKey = "4Q" | "1Y" | "2Y" | "60D" | "30D" | "15D" | "Custom";
type Tf = { key: TfKey; label: string; kind: "quarterly" | "daily"; span: number };
const TIMEFRAMES: Tf[] = [
  { key: "4Q", label: "4Q", kind: "quarterly", span: 4 },
  { key: "1Y", label: "1Y", kind: "quarterly", span: 4 },
  { key: "2Y", label: "2Y", kind: "quarterly", span: 8 },
  { key: "60D", label: "60D", kind: "daily", span: 60 },
  { key: "30D", label: "30D", kind: "daily", span: 30 },
  { key: "15D", label: "15D", kind: "daily", span: 15 },
  // Custom is a daily arbitrary start–end range (picker); span unused (handled specially).
  { key: "Custom", label: "Custom", kind: "daily", span: Infinity },
];
const NEEDS_DAILY = "no daily score history yet";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-06-29" → "29 Jun" for the daily x-axis. */
function shortDay(asOfDate: string): string {
  const [, m, d] = asOfDate.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? m}`;
}

// ── adaptive-with-floor y-axis ──────────────────────────────────────────────────────
// Fit the axis to the full vertical spread of EVERY visible line (all pillars + composite)
// in view, with padding — so a real move (Market 55→67) or a wide cross-pillar divergence
// (Foundation 70 vs Market 20) reads clearly instead of being squished by a fixed 0–100
// axis. The FLOOR (a minimum span) is the honesty guard: the axis never zooms tighter than
// Y_MIN_SPAN, so a trivial wiggle (58.2→58.9) stays visually small — 0.7 pts of a ~12-pt
// frame — rather than being blown up into fake drama. Always clamped within [0, 100].
const Y_MIN_SPAN = 12; // never show a window narrower than this many score points
const Y_PAD = 2; // padding above/below the data extent, before flooring
type YPoint = { composite: number; foundation: number; momentum: number; market: number; ownership: number };
function adaptiveYDomain(points: YPoint[]): [number, number] {
  if (points.length === 0) return [0, 100];
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of points) {
    for (const v of [p.composite, p.foundation, p.momentum, p.market, p.ownership]) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 100];
  lo -= Y_PAD;
  hi += Y_PAD;
  // Enforce the floor: grow the window symmetrically around its centre to Y_MIN_SPAN.
  const span = hi - lo;
  if (span < Y_MIN_SPAN) {
    const grow = (Y_MIN_SPAN - span) / 2;
    lo -= grow;
    hi += grow;
  }
  // Clamp within [0,100] without collapsing the span (shift the window if it overflows).
  if (lo < 0) { hi += -lo; lo = 0; }
  if (hi > 100) { lo -= hi - 100; hi = 100; }
  return [Math.max(0, Math.floor(lo)), Math.min(100, Math.ceil(hi))];
}

/** Nice-ish evenly spaced integer ticks inside [lo, hi] (4 interior marks). */
function axisTicks([lo, hi]: [number, number]): number[] {
  const step = (hi - lo) / 4;
  return [1, 2, 3].map((i) => Math.round(lo + step * i));
}

/** Today as "YYYY-MM-DD" (local) — for the custom-range date-input max bound. */
function todayISO(): string {
  const n = new Date();
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const dd = String(n.getDate()).padStart(2, "0");
  return `${n.getFullYear()}-${mm}-${dd}`;
}

export function TrajectorySection({
  trajectory,
  symbol,
}: {
  trajectory: TTrajectory;
  symbol?: string;
}) {
  const [tf, setTf] = useState<TfKey>("4Q");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const r1 = (n: number) => Math.round(n * 10) / 10;
  const allPoints = trajectory.series.map((pt) => ({
    x: shortPeriod(pt.periodKey),
    composite: r1(pt.composite),
    foundation: r1(pt.foundation),
    momentum: r1(pt.momentum),
    market: r1(pt.market),
    ownership: r1(pt.ownership),
  }));

  // Daily series (sub-quarterly). Keyed on asOfDate; F/M carry forward flat between quarters.
  const dailySeries = trajectory.dailySeries ?? [];
  const resultDays = trajectory.resultDays ?? [];
  const dailyAll = dailySeries.map((pt) => ({
    x: shortDay(pt.asOfDate),
    asOfDate: pt.asOfDate,
    periodKey: pt.periodKey,
    composite: r1(pt.composite),
    foundation: r1(pt.foundation),
    momentum: r1(pt.momentum),
    market: r1(pt.market),
    ownership: r1(pt.ownership),
  }));
  const hasDaily = dailyAll.length >= 2;

  const bandCrossings = trajectory.crossings.filter((c) => c.type === "band");

  // ── building-history state (single point) ──
  if (allPoints.length <= 1 && !hasDaily) {
    return (
      <section>
        <SectionEyebrow label="Trajectory" icon={Icons.chartLine} accent="var(--p-mom)" pill="building history" />
        <Panel className="flex flex-col items-center gap-2 py-10 text-center">
          <Icons.clock weight="duotone" className="h-9 w-9 text-ink3" />
          <p className="text-[13px] font-medium text-ink">Only one scored quarter so far</p>
          <p className="max-w-sm text-[12px] text-ink3">
            A trend needs at least two in-force snapshots. As {allPoints[0]?.x ?? "this stock"} accrues
            more scored quarters, the line will fill in here.
          </p>
        </Panel>
      </section>
    );
  }

  // Available daily-history bounds (raw ISO) — the retention envelope the custom range clamps to.
  const dailyFirst = dailyAll.length ? dailyAll[0].asOfDate : null;
  const dailyLast = dailyAll.length ? dailyAll[dailyAll.length - 1].asOfDate : null;

  // ── window the series to the selected timeframe ──
  // Quarterly timeframes slice the per-quarter series; fixed daily timeframes slice the daily
  // series to the last N calendar days; custom slices to an arbitrary start–end (clamped to
  // available history — never fabricated beyond what retention holds).
  const activeTf = TIMEFRAMES.find((t) => t.key === tf)!;
  const isCustom = tf === "Custom";
  const chartCadence: Cadence = activeTf.kind;
  // Effective custom bounds: default to the full available daily window until the user picks.
  const effStart = isCustom ? (customStart || dailyFirst || "") : "";
  const effEnd = isCustom ? (customEnd || dailyLast || "") : "";
  let points: typeof allPoints | typeof dailyAll;
  if (isCustom) {
    points = dailyAll.filter((p) => (!effStart || p.asOfDate >= effStart) && (!effEnd || p.asOfDate <= effEnd));
  } else if (activeTf.kind === "daily") {
    const latest = dailyLast;
    if (latest) {
      const cutoff = new Date(new Date(latest).getTime() - activeTf.span * 24 * 60 * 60 * 1000);
      points = dailyAll.filter((p) => new Date(p.asOfDate) >= cutoff);
    } else {
      points = [];
    }
  } else {
    points = activeTf.span === Infinity ? allPoints : allPoints.slice(-activeTf.span);
  }
  // Did the user pick a start earlier than any daily history? (honest clamp note)
  const clampedEarlier = isCustom && !!customStart && !!dailyFirst && customStart < dailyFirst;
  const tooShort = points.length < 2;
  const yDomain = adaptiveYDomain(points as YPoint[]);
  const anyHeld = LINES.some((l) => isHeld(l.key, chartCadence));
  const pillLabel = activeTf.kind === "daily" ? `${points.length} days` : `${points.length} quarters`;
  // Result-day markers that fall inside the current daily window (x-values that exist in `points`).
  const winXs = new Set(points.map((p) => p.x));
  const resultMarks =
    activeTf.kind === "daily"
      ? resultDays.map((r) => ({ x: shortDay(r.asOfDate), periodKey: r.periodKey })).filter((r) => winXs.has(r.x))
      : [];

  return (
    <section>
      <SectionEyebrow label="Trajectory" icon={Icons.chartLine} accent="var(--p-mom)" pill={pillLabel} />
      <Panel className="px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="kicker">Composite &amp; pillars over time</span>
          <div className="flex items-center gap-2">
            {/* timeframe segmented control — daily timeframes active once daily history exists */}
            <div className="inline-flex shrink-0 rounded-lg border border-line2 bg-surface-2 p-0.5 text-[11px]">
              {TIMEFRAMES.map((t) => {
                const disabled = t.kind === "daily" && !hasDaily;
                return (
                  <button
                    key={t.key}
                    type="button"
                    disabled={disabled}
                    title={disabled ? NEEDS_DAILY : undefined}
                    onClick={() => !disabled && setTf(t.key)}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-medium transition-colors",
                      disabled
                        ? "cursor-not-allowed text-ink3/40"
                        : tf === t.key
                          ? "bg-surface-1 text-ink shadow-sm"
                          : "text-ink3 hover:text-ink2",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
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

        {/* custom range picker — arbitrary start–end, clamped to available daily history */}
        {isCustom && (
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-ink2">
            <label className="inline-flex items-center gap-1.5">
              <span className="text-ink3">From</span>
              <input
                type="date"
                value={customStart || dailyFirst || ""}
                min={dailyFirst ?? undefined}
                max={effEnd || dailyLast || todayISO()}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-md border border-line2 bg-surface-2 px-2 py-1 text-[11px] text-ink outline-none focus:border-line3"
              />
            </label>
            <label className="inline-flex items-center gap-1.5">
              <span className="text-ink3">To</span>
              <input
                type="date"
                value={customEnd || dailyLast || ""}
                min={effStart || dailyFirst || undefined}
                max={dailyLast ?? todayISO()}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-md border border-line2 bg-surface-2 px-2 py-1 text-[11px] text-ink outline-none focus:border-line3"
              />
            </label>
            {(customStart || customEnd) && (
              <button
                type="button"
                onClick={() => { setCustomStart(""); setCustomEnd(""); }}
                className="rounded-md border border-line2 bg-surface-2 px-2 py-1 text-[11px] text-ink3 transition-colors hover:text-ink2"
              >
                Reset
              </button>
            )}
            {dailyFirst && (
              <span className="text-ink3/70">
                daily history starts {shortDay(dailyFirst)}
                {clampedEarlier && <span className="text-ink3"> (clamped)</span>}
              </span>
            )}
          </div>
        )}

        {/* cadence note — explains what moves daily vs what steps quarterly */}
        {chartCadence === "daily" ? (
          <p className="mb-2 text-[10.5px] text-ink3">
            Foundation &amp; Momentum update on quarterly results, so they can appear flat over shorter
            periods.{" "}
            <span className="text-ink3/80">
              If a result landed in this window, it&apos;s marked with a result line — the day all four pillars stepped.
            </span>
          </p>
        ) : (
          <p className="mb-2 text-[10.5px] text-ink3">
            Per-quarter scores.{" "}
            <span className="text-ink3/80">
              {hasDaily ? "60D · 30D · 15D show daily Market & Ownership movement." : "60D · 30D · 15D arrive with daily score history."}
            </span>
          </p>
        )}

        {tooShort ? (
          <p className="py-10 text-center text-[12px] text-ink3">
            {isCustom
              ? "Fewer than two daily points in this range. Widen the dates or pick a range inside available history."
              : chartCadence === "daily"
                ? "Not enough daily points in this window yet."
                : "Not enough scored quarters in this window."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
              {ZONE_BANDS.map((b) => (
                <ReferenceArea key={`zone-${b.y1}`} y1={b.y1} y2={b.y2} fill={b.cssVar} fillOpacity={0.07} ifOverflow="hidden" />
              ))}
              <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="x"
                tick={{ fill: "var(--ink3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={chartCadence === "daily" ? 12 : 5}
              />
              <YAxis
                domain={yDomain}
                ticks={axisTicks(yDomain)}
                tick={{ fill: "var(--ink3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={34}
                allowDataOverflow={false}
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
              {/* quarterly: band crossings. daily: result-day markers explaining the F/M step. */}
              {chartCadence !== "daily" &&
                bandCrossings.map((c, i) => (
                  <ReferenceLine
                    key={`xing-${c.toPeriod}-${i}`}
                    x={shortPeriod(c.toPeriod)}
                    stroke="var(--c-steady)"
                    strokeDasharray="2 3"
                    strokeOpacity={0.6}
                    label={{ value: `${c.from}→${c.to}`, fill: "var(--c-steady)", fontSize: 9, position: "insideTopRight" }}
                  />
                ))}
              {chartCadence === "daily" &&
                resultMarks.map((r, i) => (
                  <ReferenceLine
                    key={`result-${r.x}-${i}`}
                    x={r.x}
                    stroke="var(--ink3)"
                    strokeDasharray="3 3"
                    strokeOpacity={0.55}
                    label={{ value: `Result — ${shortPeriod(r.periodKey)}`, fill: "var(--ink3)", fontSize: 9, position: "insideTopRight" }}
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
                  // held-aware: dashed when this line's clock is coarser than the chart's.
                  // On a daily timeframe, Foundation/Momentum are held (flat between quarters).
                  strokeDasharray={isHeld(l.key, chartCadence) ? "4 4" : undefined}
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
          {/* held-key — shown only when a coarser pillar (F/M on a daily timeframe) is held */}
          {anyHeld && (
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
