"use client";

/**
 * The Trajectory centerpiece — composite + 4 pillar lines over zone-banded time.
 * A custom responsive SVG (sized to its column, never full-viewport) so it can:
 *   • SET the frame's active datapoint on hover (desktop) AND tap/drag (mobile),
 *   • draw the scrub marker + an on-chart tooltip (the mobile read, since the
 *     readout card sits below on small screens).
 * Pointer events cover mouse + touch uniformly; leave → resting.
 */

import { useMemo, useRef, useState } from "react";
import { Panel, shortPeriod } from "@/components/stock-detail/health/shared";
import { cn } from "@/lib/utils";
import type { ActiveDatapoint } from "../tool-frame.types";
import type { CrossingEvent } from "@/types/health";
import { TRAJECTORY_LINES, type ChartPoint } from "./trajectory-data";

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
  active,
  onActiveChange,
}: {
  points: ChartPoint[];
  crossings: CrossingEvent[];
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
        if (enabled[l.key]) vals.push(p[l.key as keyof ChartPoint] as number);
      }
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return {
      lo: Math.max(0, Math.min(min - 5, 55)),
      hi: Math.min(100, Math.max(max + 5, 74)),
    };
  }, [points, enabled]);

  const xOf = (i: number) => (n <= 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (n - 1));
  const yOf = (v: number) => Y0 + ((hi - v) / (hi - lo)) * (Y1 - Y0);

  const idx = active.index ?? n - 1;
  const scrubbing = active.index != null;

  // crossings → nearest point index by matching short period label
  const crossMarks = useMemo(() => {
    const out: { i: number; from: string; to: string }[] = [];
    for (const c of crossings) {
      if (c.type !== "band") continue;
      // crossings carry a raw periodKey (FY25Q2); points carry the short label (Q2'25).
      const i = points.findIndex((p) => p.period === shortPeriod(c.toPeriod));
      if (i >= 0) out.push({ i, from: c.from, to: c.to });
    }
    return out;
  }, [crossings, points]);

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

  return (
    <Panel className="px-4 py-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="kicker">The recording · composite &amp; pillars over time</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="block h-auto w-full cursor-crosshair touch-pan-y select-none"
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

        {/* band cut gridlines + right labels */}
        {BAND_CUTS.filter((v) => v > lo && v < hi).map((v) => (
          <g key={v}>
            <line
              x1={X0}
              y1={yOf(v)}
              x2={X1}
              y2={yOf(v)}
              stroke="var(--line)"
              strokeDasharray="2 5"
            />
            <text x={X1 + 7} y={yOf(v) + 4} className="num" fill="var(--ink3)" fontSize="11">
              {v}
            </text>
          </g>
        ))}

        {/* band crossings */}
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

        {/* x labels */}
        {points.map((p, i) => {
          const step = n > 6 ? 2 : 1;
          if (i % step !== 0 && i !== n - 1) return null;
          return (
            <text
              key={i}
              x={xOf(i)}
              y={Y1 + 22}
              className="num"
              fill="var(--ink3)"
              fontSize="11"
              textAnchor="middle"
            >
              {p.period}
            </text>
          );
        })}

        {/* lines */}
        {TRAJECTORY_LINES.map((l) => {
          if (l.key !== "composite" && !enabled[l.key]) return null;
          const d = points
            .map((p, i) => `${xOf(i).toFixed(1)},${yOf(p[l.key as keyof ChartPoint] as number).toFixed(1)}`)
            .join(" ");
          return (
            <polyline
              key={l.key}
              points={d}
              fill="none"
              stroke={l.color}
              strokeWidth={l.width}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}

        {/* resting marker on latest composite */}
        <circle cx={xOf(n - 1)} cy={yOf(points[n - 1].composite)} r={3} fill="var(--ink)" />

        {/* scrub marker + on-chart tooltip (the mobile read) */}
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
            <g
              transform={`translate(${Math.max(X0, Math.min(X1 - 96, xOf(idx) - 48))}, ${Y0})`}
            >
              <rect width={96} height={26} rx={6} fill="var(--surface-3)" stroke="var(--line2)" />
              <text x={9} y={17} className="num" fill="var(--ink2)" fontSize="11">
                {points[idx].period}
              </text>
              <text x={88} y={17} className="num" fill="var(--ink)" fontSize="12" textAnchor="end" fontWeight={600}>
                {points[idx].composite.toFixed(0)}
              </text>
            </g>
          </g>
        )}
      </svg>

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
              <span className="h-[3px] w-3.5 rounded" style={{ background: l.color }} />
              {l.label}
              <span className="num font-medium text-ink">
                {(points[n - 1][l.key as keyof ChartPoint] as number).toFixed(0)}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
