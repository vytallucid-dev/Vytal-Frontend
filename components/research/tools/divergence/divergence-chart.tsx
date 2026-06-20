"use client";

/**
 * The Divergence centerpiece — ONE spread instrument (not two modes). Two pillar
 * lines with the gap shaded and named between them; the fill is coloured by
 * DIRECTION (widening amber / narrowing green) — that is where "convergence" lives.
 * Custom responsive SVG, sized to its column; sets the frame's active datapoint on
 * hover/tap and draws the scrub marker + an on-chart gap tooltip (the mobile read).
 */

import { useMemo, useRef } from "react";
import { Panel, PILLAR_META } from "@/components/stock-detail/health/shared";
import type { PillarKey } from "@/types/health";
import type { ActiveDatapoint } from "../tool-frame.types";
import type { DivergenceDirection } from "@/types/research-tools";
import { DIRECTION_META, type SpreadPoint } from "./divergence-data";

const VBW = 640;
const VBH = 384;
const X0 = 40;
const X1 = 588;
const Y0 = 18;
const Y1 = 312;
const BAND_CUTS = [55, 62, 68, 74];
const THRESHOLDS = [15, 25]; // notable / wide — derived gap crossings

export function DivergenceChart({
  spread,
  highPillar,
  lowPillar,
  direction,
  active,
  onActiveChange,
}: {
  spread: SpreadPoint[];
  highPillar: PillarKey;
  lowPillar: PillarKey;
  direction: DivergenceDirection;
  active: ActiveDatapoint;
  onActiveChange: (a: ActiveDatapoint) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const n = spread.length;
  const hiCol = PILLAR_META[highPillar].cssVar;
  const loCol = PILLAR_META[lowPillar].cssVar;
  const fill = DIRECTION_META[direction].color;

  const { lo, hi } = useMemo(() => {
    const vals = spread.flatMap((p) => [p.high, p.low]);
    return {
      lo: Math.max(0, Math.floor(Math.min(...vals) - 4)),
      hi: Math.min(100, Math.ceil(Math.max(...vals) + 4)),
    };
  }, [spread]);

  const xOf = (i: number) => (n <= 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (n - 1));
  const yOf = (v: number) => Y0 + ((hi - v) / (hi - lo)) * (Y1 - Y0);

  const idx = active.index ?? n - 1;
  const scrubbing = active.index != null;

  const hiPts = spread.map((p, i) => `${xOf(i).toFixed(1)},${yOf(p.high).toFixed(1)}`);
  const loPts = spread.map((p, i) => `${xOf(i).toFixed(1)},${yOf(p.low).toFixed(1)}`);
  const gapPoly = hiPts.concat([...loPts].reverse()).join(" ");

  // derived threshold crossings (gap crosses 15 / 25)
  const crossings = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i < n; i++) {
      for (const t of THRESHOLDS) {
        if ((spread[i].gap - t) * (spread[i - 1].gap - t) < 0) out.push(i);
      }
    }
    return out;
  }, [spread, n]);

  const midI = Math.floor((n - 1) / 2);

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
        <span className="kicker">
          The spread ·{" "}
          <span style={{ color: hiCol }}>{PILLAR_META[highPillar].label}</span> vs{" "}
          <span style={{ color: loCol }}>{PILLAR_META[lowPillar].label}</span>
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="block h-auto w-full cursor-crosshair touch-pan-y select-none"
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => onActiveChange({ index: null })}
        role="img"
        aria-label={`Spread between ${PILLAR_META[highPillar].label} and ${PILLAR_META[lowPillar].label} over time`}
      >
        {/* band cut gridlines */}
        {BAND_CUTS.filter((v) => v > lo && v < hi).map((v) => (
          <line
            key={v}
            x1={X0}
            y1={yOf(v)}
            x2={X1}
            y2={yOf(v)}
            stroke="var(--line)"
            strokeDasharray="2 5"
          />
        ))}

        {/* derived threshold crossings */}
        {crossings.map((i, k) => (
          <line
            key={k}
            x1={xOf(i)}
            y1={Y0}
            x2={xOf(i)}
            y2={Y1}
            stroke="var(--c-steady)"
            strokeDasharray="2 3"
            strokeOpacity={0.45}
          />
        ))}

        {/* the gap, shaded by direction */}
        <polygon points={gapPoly} fill={fill} opacity={0.14} />

        {/* the two pillar lines */}
        <polyline points={loPts.join(" ")} fill="none" stroke={loCol} strokeWidth={2.4} strokeLinejoin="round" />
        <polyline points={hiPts.join(" ")} fill="none" stroke={hiCol} strokeWidth={2.4} strokeLinejoin="round" />

        {/* gap label mid-chart */}
        <text
          x={xOf(midI)}
          y={(yOf(spread[midI].high) + yOf(spread[midI].low)) / 2 + 4}
          className="num"
          fill="var(--ink)"
          fontSize="13"
          fontWeight={500}
          textAnchor="middle"
        >
          gap {spread[midI].gap.toFixed(0)}
        </text>

        {/* x labels */}
        {spread.map((p, i) => {
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

        {/* scrub marker + on-chart gap tooltip */}
        {scrubbing && (
          <g>
            <line x1={xOf(idx)} y1={Y0} x2={xOf(idx)} y2={Y1} stroke="var(--ink3)" strokeDasharray="3 3" strokeOpacity={0.8} />
            <circle cx={xOf(idx)} cy={yOf(spread[idx].high)} r={4} fill="var(--surface-1)" stroke={hiCol} strokeWidth={2} />
            <circle cx={xOf(idx)} cy={yOf(spread[idx].low)} r={4} fill="var(--surface-1)" stroke={loCol} strokeWidth={2} />
            <g transform={`translate(${Math.max(X0, Math.min(X1 - 96, xOf(idx) - 48))}, ${Y0})`}>
              <rect width={96} height={26} rx={6} fill="var(--surface-3)" stroke="var(--line2)" />
              <text x={9} y={17} className="num" fill="var(--ink2)" fontSize="11">
                {spread[idx].period}
              </text>
              <text x={88} y={17} className="num" fill="var(--ink)" fontSize="12" textAnchor="end" fontWeight={600}>
                gap {spread[idx].gap.toFixed(0)}
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* legend — the two lines + their latest values */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { p: highPillar, v: spread[n - 1].high, c: hiCol },
          { p: lowPillar, v: spread[n - 1].low, c: loCol },
        ].map(({ p, v, c }) => (
          <span
            key={p}
            className="inline-flex items-center gap-2 rounded-[9px] border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink2"
          >
            <span className="h-[3px] w-3.5 rounded" style={{ background: c }} />
            {PILLAR_META[p].label}
            <span className="num font-medium text-ink">{v.toFixed(0)}</span>
          </span>
        ))}
      </div>
    </Panel>
  );
}
