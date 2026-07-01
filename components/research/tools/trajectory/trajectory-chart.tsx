"use client";

/**
 * The Trajectory centerpiece — composite + 4 pillar lines over zone-banded time.
 * A custom responsive SVG (sized to its column, never full-viewport) so it can:
 *   • SET the frame's active datapoint on hover (desktop) AND tap/drag (mobile),
 *   • draw the scrub marker + an on-chart tooltip (the mobile read, since the
 *     readout card sits below on small screens).
 * Pointer events cover mouse + touch uniformly; leave → resting.
 *
 * Text (axis ticks, result markers, tooltip) is NOT drawn as SVG <text> — it's an HTML
 * overlay positioned by percentage over the chart box, so it keeps a fixed, legible CSS
 * size regardless of how far the SVG itself is scaled down on a narrow mobile column.
 */

import { useMemo, useRef, useState } from "react";
import { Panel, shortPeriod } from "@/components/stock-detail/health/shared";
import { cn } from "@/lib/utils";
import type { ActiveDatapoint } from "../tool-frame.types";
import type { CrossingEvent } from "@/types/health";
import { isHeld, type WindowPoint, type ResultMark } from "../window-slice";
import { TRAJECTORY_LINES } from "./trajectory-data";

const VBW = 640;
const VBH = 384;
const X0 = 40;
const X1 = 596;
const Y0 = 18;
const Y1 = 312;
const BAND_CUTS = [55, 62, 68, 74];
const ZONES = [
  { lo: 74, hi: 100, cssVar: "var(--c-pristine)", op: 0.07 },
  { lo: 68, hi: 74, cssVar: "var(--c-healthy)", op: 0.09 },
  { lo: 62, hi: 68, cssVar: "var(--c-steady)", op: 0.1 },
  { lo: 55, hi: 62, cssVar: "var(--c-below)", op: 0.08 },
  { lo: 0, hi: 55, cssVar: "var(--c-fragile)", op: 0.06 },
];

export function TrajectoryChart({
  points,
  crossings,
  isDaily,
  resultMarks,
  clampedEarlier,
  active,
  onActiveChange,
}: {
  points: WindowPoint[];
  crossings: CrossingEvent[];
  isDaily: boolean;
  resultMarks: ResultMark[];
  clampedEarlier: boolean;
  active: ActiveDatapoint;
  onActiveChange: (a: ActiveDatapoint) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    foundation: true,
    momentum: true,
    market: true,
    ownership: true,
  });

  const n = points.length;

  // ── domain: fit the visible data, padded, clamped to [0,100] ──
  const { lo, hi } = useMemo(() => {
    const vals: number[] = [];
    for (const p of points) {
      vals.push(p.composite);
      for (const l of TRAJECTORY_LINES) {
        if (l.key === "composite") continue;
        if (enabled[l.key]) vals.push(p[l.key as keyof WindowPoint] as number);
      }
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    // On a daily/custom window fit tightly to the real spread (no 55/74 pull) so daily
    // Market/Ownership movement reads; the floor below keeps a trivial wiggle honest.
    if (isDaily) {
      let plo = min - 3;
      let phi = max + 3;
      const MIN_SPAN = 12;
      const span = phi - plo;
      if (span < MIN_SPAN) {
        const grow = (MIN_SPAN - span) / 2;
        plo -= grow;
        phi += grow;
      }
      return { lo: Math.max(0, Math.floor(plo)), hi: Math.min(100, Math.ceil(phi)) };
    }
    return {
      lo: Math.max(0, Math.min(min - 5, 55)),
      hi: Math.min(100, Math.max(max + 5, 74)),
    };
  }, [points, enabled, isDaily]);

  const xOf = (i: number) => (n <= 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (n - 1));
  const yOf = (v: number) => Y0 + ((hi - v) / (hi - lo)) * (Y1 - Y0);
  const leftPct = (i: number) => (xOf(i) / VBW) * 100;
  const topPctY = (y: number) => (y / VBH) * 100;

  const idx = active.index ?? n - 1;
  const scrubbing = active.index != null;

  // marks: quarterly → band crossings; daily → result-day markers (the F/M step).
  const crossMarks = useMemo(() => {
    if (isDaily) return [] as { i: number; from: string; to: string }[];
    const out: { i: number; from: string; to: string }[] = [];
    for (const c of crossings) {
      if (c.type !== "band") continue;
      // crossings carry a raw periodKey (FY25Q2); points carry the short label (Q2'25).
      const i = points.findIndex((p) => p.x === shortPeriod(c.toPeriod));
      if (i >= 0) out.push({ i, from: c.from, to: c.to });
    }
    return out;
  }, [crossings, points, isDaily]);

  // result-day markers positioned onto the window (daily/custom only).
  const resultXi = useMemo(() => {
    if (!isDaily) return [] as { i: number; label: string }[];
    return resultMarks
      .map((r) => ({ i: points.findIndex((p) => p.x === r.x), label: `Result — ${shortPeriod(r.periodKey)}` }))
      .filter((r) => r.i >= 0);
  }, [resultMarks, points, isDaily]);

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vbx = ((e.clientX - rect.left) / rect.width) * VBW;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(xOf(i) - vbx);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    onActiveChange({ index: best });
  };

  const anyHeld = TRAJECTORY_LINES.some((l) => isHeld(l.key, isDaily));
  const bandCutsShown = BAND_CUTS.filter((v) => v > lo && v < hi);

  // x labels — denser stepping on a daily window (more points)
  const xStep = n > 16 ? Math.ceil(n / 8) : n > 6 ? 2 : 1;
  const xLabelIdx = points.map((_, i) => i).filter((i) => i % xStep === 0 || i === n - 1);

  // Honest too-short state — a daily/custom window can slice to <2 points (empty range or
  // sparse daily history). Guard before any points[...] access.
  if (n < 2) {
    return (
      <Panel className="px-2.5 py-3 sm:px-4 sm:py-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="kicker">The recording · composite &amp; pillars over time</span>
        </div>
        <p className="py-14 text-center text-[12px] text-ink3">
          {isDaily
            ? "Fewer than two daily points in this range. Widen the dates or pick a shorter fixed window."
            : "Not enough scored quarters in this window."}
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="px-2.5 py-3 sm:px-4 sm:py-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="kicker">The recording · composite &amp; pillars over time</span>
      </div>

      {/* cadence note — on short/custom windows, explain the flat-honest F/M lines */}
      {isDaily ? (
        <p className="mb-2 text-[10.5px] text-ink3">
          Foundation &amp; Momentum update on quarterly results, so they can look flat over shorter
          periods; a result in this window is marked with a line — the day all four pillars stepped.
          {clampedEarlier && <span className="text-ink3/80"> Range clamped to available daily history.</span>}
        </p>
      ) : (
        <p className="mb-2 text-[10.5px] text-ink3">Per-quarter scores.</p>
      )}

      <div className="relative min-h-75 w-full sm:aspect-640/384 sm:min-h-0">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VBW} ${VBH}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full cursor-crosshair touch-pan-y select-none"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => onActiveChange({ index: null })}
          role="img"
          aria-label="Composite and pillar scores over time"
        >
          {/* zone bands */}
          {ZONES.map((z) => {
            const yTop = yOf(Math.min(z.hi, hi));
            const yBot = yOf(Math.max(z.lo, lo));
            if (yBot <= yTop) return null;
            return (
              <rect
                key={z.lo}
                x={X0}
                y={yTop}
                width={X1 - X0}
                height={yBot - yTop}
                fill={z.cssVar}
                opacity={z.op}
              />
            );
          })}

          {/* band cut gridlines */}
          {bandCutsShown.map((v) => (
            <line key={v} x1={X0} y1={yOf(v)} x2={X1} y2={yOf(v)} stroke="var(--line)" strokeDasharray="2 5" />
          ))}

          {/* band crossings (quarterly) */}
          {crossMarks.map((c, k) => (
            <line
              key={k}
              x1={xOf(c.i)}
              y1={Y0}
              x2={xOf(c.i)}
              y2={Y1}
              stroke="var(--c-steady)"
              strokeDasharray="2 3"
              strokeOpacity={0.55}
            />
          ))}

          {/* result-day markers (daily) — the day a rescore stepped all four pillars */}
          {resultXi.map((r, k) => (
            <line
              key={`result-${k}`}
              x1={xOf(r.i)}
              y1={Y0}
              x2={xOf(r.i)}
              y2={Y1}
              stroke="var(--ink3)"
              strokeDasharray="3 3"
              strokeOpacity={0.55}
            />
          ))}

          {/* lines — held-aware: F/M dashed on a daily window (flat between quarters, honest) */}
          {TRAJECTORY_LINES.map((l) => {
            if (l.key !== "composite" && !enabled[l.key]) return null;
            const d = points
              .map((p, i) => `${xOf(i).toFixed(1)},${yOf(p[l.key as keyof WindowPoint] as number).toFixed(1)}`)
              .join(" ");
            return (
              <polyline
                key={l.key}
                points={d}
                fill="none"
                stroke={l.color}
                strokeWidth={l.width}
                strokeDasharray={isHeld(l.key, isDaily) ? "5 4" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}

          {/* resting marker on latest composite */}
          <circle cx={xOf(n - 1)} cy={yOf(points[n - 1].composite)} r={3} fill="var(--ink)" />

          {/* scrub marker */}
          {scrubbing && (
            <g>
              <line
                x1={xOf(idx)}
                y1={Y0}
                x2={xOf(idx)}
                y2={Y1}
                stroke="var(--ink3)"
                strokeDasharray="3 3"
                strokeOpacity={0.8}
              />
              <circle
                cx={xOf(idx)}
                cy={yOf(points[idx].composite)}
                r={4.5}
                fill="var(--surface-1)"
                stroke="var(--ink)"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* ── HTML label overlay — always legible, always on top ── */}

        {/* band cut right-side labels */}
        {bandCutsShown.map((v) => (
          <span
            key={v}
            className="num pointer-events-none absolute -translate-y-1/2 whitespace-nowrap text-[12px] text-ink3 sm:text-[11px]"
            style={{ left: `${((X1 + 8) / VBW) * 100}%`, top: `${topPctY(yOf(v))}%` }}
          >
            {v}
          </span>
        ))}

        {/* result-day marker labels */}
        {resultXi.map((r, k) => (
          <span
            key={`result-label-${k}`}
            className="num pointer-events-none absolute whitespace-nowrap text-[10px] text-ink3 sm:text-[9px]"
            style={{ left: `${(xOf(r.i) / VBW) * 100 + 0.5}%`, top: `${topPctY(Y0) + 1}%` }}
          >
            {r.label}
          </span>
        ))}

        {/* x-axis labels */}
        {xLabelIdx.map((i) => (
          <span
            key={i}
            className="num pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-[12px] text-ink3 sm:text-[11px]"
            style={{ left: `${leftPct(i)}%`, top: `${topPctY(Y1) + 4}%` }}
          >
            {points[i].x}
          </span>
        ))}

        {/* on-chart tooltip (the mobile read) */}
        {scrubbing && (
          <div
            className="pointer-events-none absolute flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-line2 bg-surface-3 px-2.5 py-1 text-[12px]"
            style={{
              left: `${Math.min(Math.max(leftPct(idx), (X0 / VBW) * 100 + 9), (X1 / VBW) * 100 - 9)}%`,
              top: `${topPctY(Y0)}%`,
            }}
          >
            <span className="num text-ink2">{points[idx].x}</span>
            <span className="num font-semibold text-ink">{points[idx].composite.toFixed(0)}</span>
          </div>
        )}
      </div>

      {/* legend — toggles + latest value */}
      <div className="mt-3 flex flex-wrap gap-2">
        {TRAJECTORY_LINES.map((l) => {
          const isOff = l.togglable && !enabled[l.key];
          return (
            <button
              key={l.key}
              disabled={!l.togglable}
              onClick={() =>
                l.togglable && setEnabled((e) => ({ ...e, [l.key]: !e[l.key] }))
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-[9px] border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink2 transition-opacity",
                l.togglable && "hover:border-line3",
                isOff && "opacity-40",
              )}
            >
              <span
                className={cn("h-[3px] w-3.5 rounded", isHeld(l.key, isDaily) && "opacity-60")}
                style={{
                  background: isHeld(l.key, isDaily)
                    ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)`
                    : l.color,
                }}
              />
              {l.label}
              <span className="num font-medium text-ink">
                {(points[n - 1][l.key as keyof WindowPoint] as number).toFixed(0)}
              </span>
            </button>
          );
        })}
        {/* held key — shown only when a coarser pillar (F/M on a daily window) is held */}
        {anyHeld && (
          <span className="inline-flex items-center gap-1.5 self-center text-[11px] text-ink3">
            <span className="inline-block h-[3px] w-4 rounded bg-ink3" />
            measured
            <span className="ml-1 inline-block h-0 w-4 border-t border-dashed border-ink3" />
            held
          </span>
        )}
      </div>
    </Panel>
  );
}
