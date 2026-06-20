"use client";

/**
 * The Ownership centerpiece — the stacked holding split (promoter / FII / DII /
 * retail) over time. This is the SOLE hero: no Foundation line (deliberately
 * demoted — the floor relationship lives in the conditional floor-check strip, not a
 * permanent plot). Custom responsive SVG; sets the frame's active datapoint on
 * hover/tap, draws the scrub marker + an on-chart split tooltip (the mobile read).
 */

import { useRef } from "react";
import { Panel } from "@/components/stock-detail/health/shared";
import type { ActiveDatapoint } from "../tool-frame.types";
import { HOLD_LANES, type HoldingPoint } from "./ownership-data";

const VBW = 640;
const VBH = 384;
const X0 = 44;
const X1 = 596;
const Y0 = 16;
const Y1 = 320;

export function OwnershipChart({
  points,
  active,
  onActiveChange,
}: {
  points: HoldingPoint[];
  active: ActiveDatapoint;
  onActiveChange: (a: ActiveDatapoint) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const n = points.length;

  const xOf = (i: number) => (n <= 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (n - 1));
  const yOf = (pct: number) => Y1 - (pct / 100) * (Y1 - Y0);

  const idx = active.index ?? n - 1;
  const scrubbing = active.index != null;

  // cumulative stack levels per period: [0, prom, prom+fii, prom+fii+dii, +retail]
  const cum = points.map((p) => {
    const a = p.promoter;
    const b = a + p.fii;
    const c = b + p.dii;
    const d = c + p.retail;
    return [0, a, b, c, d];
  });

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

  const cur = points[idx];

  return (
    <Panel className="px-4 py-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="kicker">Holding split over time · who owns it</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="block h-auto w-full cursor-crosshair touch-pan-y select-none"
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => onActiveChange({ index: null })}
        role="img"
        aria-label="Stacked shareholding split over time"
      >
        {/* y grid 25/50/75/100% */}
        {[25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={X0} y1={yOf(v)} x2={X1} y2={yOf(v)} stroke="var(--line)" strokeDasharray="2 5" />
            <text x={X0 - 8} y={yOf(v) + 4} className="num" fill="var(--ink3)" fontSize="11" textAnchor="end">
              {v}%
            </text>
          </g>
        ))}

        {/* stacked lanes */}
        {HOLD_LANES.map((lane, h) => {
          const up = points.map((_, i) => `${xOf(i).toFixed(1)},${yOf(cum[i][h + 1]).toFixed(1)}`);
          const dn = points.map((_, i) => `${xOf(i).toFixed(1)},${yOf(cum[i][h]).toFixed(1)}`);
          const poly = up.concat([...dn].reverse()).join(" ");
          // label the lane at the right end if it has room
          const last = points[n - 1];
          const val = last[lane.key];
          const midY = (yOf(cum[n - 1][h + 1]) + yOf(cum[n - 1][h])) / 2;
          return (
            <g key={lane.key}>
              <polygon points={poly} fill={lane.color} opacity={0.82} />
              {val >= 8 && (
                <text x={X1 - 6} y={midY + 4} className="num" fill="#fff" fontSize="11.5" textAnchor="end" opacity={0.9}>
                  {lane.label} {val.toFixed(0)}%
                </text>
              )}
            </g>
          );
        })}

        {/* x labels */}
        {points.map((p, i) => {
          const step = n > 6 ? 2 : 1;
          if (i % step !== 0 && i !== n - 1) return null;
          return (
            <text key={i} x={xOf(i)} y={Y1 + 22} className="num" fill="var(--ink3)" fontSize="11" textAnchor="middle">
              {p.period}
            </text>
          );
        })}

        {/* scrub marker + on-chart split tooltip */}
        {scrubbing && (
          <g>
            <line x1={xOf(idx)} y1={Y0} x2={xOf(idx)} y2={Y1} stroke="var(--ink)" strokeDasharray="3 3" strokeOpacity={0.85} />
            <g transform={`translate(${Math.max(X0, Math.min(X1 - 118, xOf(idx) - 59))}, ${Y0})`}>
              <rect width={118} height={26} rx={6} fill="var(--surface-3)" stroke="var(--line2)" />
              <text x={9} y={17} className="num" fill="var(--ink2)" fontSize="10.5">
                {cur.period}
              </text>
              <text x={109} y={17} className="num" fill="var(--ink)" fontSize="11" textAnchor="end">
                P{cur.promoter.toFixed(0)} F{cur.fii.toFixed(0)} D{cur.dii.toFixed(0)}
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* legend — lanes + latest values */}
      <div className="mt-3 flex flex-wrap gap-2">
        {HOLD_LANES.map((lane) => (
          <span
            key={lane.key}
            className="inline-flex items-center gap-2 rounded-[9px] border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink2"
          >
            <span className="size-3 rounded-sm" style={{ background: lane.color }} />
            {lane.label}
            <span className="num font-medium text-ink">{points[n - 1][lane.key].toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </Panel>
  );
}
