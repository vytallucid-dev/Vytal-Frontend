"use client";

/**
 * The Divergence centerpiece — ONE spread instrument (not two modes). Two pillar
 * lines with the gap shaded and named between them; the fill is coloured by
 * DIRECTION (widening amber / narrowing green) — that is where "convergence" lives.
 * Custom responsive SVG, sized to its column; sets the frame's active datapoint on
 * hover/tap and draws the scrub marker + an on-chart gap tooltip (the mobile read).
 *
 * Text (axis ticks, gap label, result markers, tooltip) is NOT drawn as SVG <text> —
 * it's an HTML overlay positioned by percentage over the chart box, so it keeps a
 * fixed, legible CSS size regardless of how far the SVG itself is scaled down on a
 * narrow mobile column.
 */

import { useMemo, useRef, useState } from "react";
import { Panel, PILLAR_META, shortPeriod } from "@/components/stock-detail/health/shared";
import { cn } from "@/lib/utils";
import type { PillarKey } from "@/types/health";
import type { ActiveDatapoint } from "../tool-frame.types";
import type { DivergenceDirection } from "@/types/research-tools";
import type { ResultMark } from "../window-slice";
import { DIRECTION_META, type SpreadPoint } from "./divergence-data";

const VBW = 640;
const VBH = 384;
const X0 = 40;
const X1 = 588;
const Y0 = 18;
const Y1 = 312;
const BAND_CUTS = [55, 62, 68, 74];
const THRESHOLDS = [15, 25]; // notable / wide — derived gap crossings

/** Honest empty state — the current window sliced to <2 comparable points. */
export function DivergenceEmpty({
  isDaily,
  highPillar,
  lowPillar,
}: {
  isDaily: boolean;
  highPillar: PillarKey;
  lowPillar: PillarKey;
}) {
  return (
    <Panel className="px-2.5 py-3 sm:px-4 sm:py-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="kicker">
          The spread ·{" "}
          <span style={{ color: PILLAR_META[highPillar].cssVar }}>{PILLAR_META[highPillar].label}</span> vs{" "}
          <span style={{ color: PILLAR_META[lowPillar].cssVar }}>{PILLAR_META[lowPillar].label}</span>
        </span>
      </div>
      <p className="py-14 text-center text-[12px] text-ink3">
        {isDaily
          ? "Fewer than two comparable daily points in this range. Widen the dates or pick a shorter fixed window."
          : "Not enough scored quarters in this window."}
      </p>
    </Panel>
  );
}

export function DivergenceChart({
  spread,
  highPillar,
  lowPillar,
  direction,
  isDaily,
  resultMarks,
  clampedEarlier,
  active,
  onActiveChange,
}: {
  spread: SpreadPoint[];
  highPillar: PillarKey;
  lowPillar: PillarKey;
  direction: DivergenceDirection;
  isDaily: boolean;
  resultMarks: ResultMark[];
  clampedEarlier: boolean;
  active: ActiveDatapoint;
  onActiveChange: (a: ActiveDatapoint) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const n = spread.length;
  const hiCol = PILLAR_META[highPillar].cssVar;
  const loCol = PILLAR_META[lowPillar].cssVar;
  const fill = DIRECTION_META[direction].color;
  const [visible, setVisible] = useState({ high: true, low: true });

  const { lo, hi } = useMemo(() => {
    const vals = spread.flatMap((p) => [p.high, p.low]);
    // Adaptive floored domain — a wide pillar spread reads wide; a trivial one stays small.
    let plo = Math.min(...vals) - 4;
    let phi = Math.max(...vals) + 4;
    const MIN_SPAN = 12;
    const span = phi - plo;
    if (span < MIN_SPAN) {
      const grow = (MIN_SPAN - span) / 2;
      plo -= grow;
      phi += grow;
    }
    return {
      lo: Math.max(0, Math.floor(plo)),
      hi: Math.min(100, Math.ceil(phi)),
    };
  }, [spread]);

  const xOf = (i: number) => (n <= 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (n - 1));
  const yOf = (v: number) => Y0 + ((hi - v) / (hi - lo)) * (Y1 - Y0);
  const leftPct = (i: number) => (xOf(i) / VBW) * 100;
  const topPctY = (y: number) => (y / VBH) * 100;

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

  // result-day markers positioned onto the spread window (daily/custom only). Matched by
  // the point's own label against `spread` (which may have dropped ≤0-pillar points), so a
  // marker only draws where its day survived the guard — never evenly-spaced onto a gap.
  const resultXi = useMemo(() => {
    if (!isDaily) return [] as { i: number; label: string }[];
    return resultMarks
      .map((r) => ({
        i: spread.findIndex((p) => p.period === r.x),
        label: `Result — ${shortPeriod(r.periodKey)}`,
      }))
      .filter((r) => r.i >= 0);
  }, [resultMarks, spread, isDaily]);

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

  const bandCutsShown = BAND_CUTS.filter((v) => v > lo && v < hi);
  const xStep = n > 16 ? Math.ceil(n / 8) : n > 6 ? 2 : 1;
  const xLabelIdx = spread.map((_, i) => i).filter((i) => i % xStep === 0 || i === n - 1);

  return (
    <Panel className="px-2.5 py-3 sm:px-4 sm:py-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="kicker">
          The spread ·{" "}
          <span style={{ color: hiCol }}>{PILLAR_META[highPillar].label}</span> vs{" "}
          <span style={{ color: loCol }}>{PILLAR_META[lowPillar].label}</span>
        </span>
      </div>

      {/* cadence note — on a short/custom window, a result re-scores all four pillars and
          can SNAP the gap; the marker explains that discontinuity. */}
      {isDaily && (
        <p className="mb-2 text-[10.5px] text-ink3">
          Foundation &amp; Momentum update on quarterly results, so a fundamentals leg can look flat
          over shorter periods; a result in this window is marked — a rescore can snap the gap.
          {clampedEarlier && <span className="text-ink3/80"> Range clamped to available daily history.</span>}
        </p>
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
          aria-label={`Spread between ${PILLAR_META[highPillar].label} and ${PILLAR_META[lowPillar].label} over time`}
        >
          {/* band cut gridlines */}
          {bandCutsShown.map((v) => (
            <line key={v} x1={X0} y1={yOf(v)} x2={X1} y2={yOf(v)} stroke="var(--line)" strokeDasharray="2 5" />
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

          {/* result-day markers (daily) — a rescore steps all four pillars and can snap the gap */}
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

          {/* the gap, shaded by direction — always shown, it's the tool's core read */}
          <polygon points={gapPoly} fill={fill} opacity={0.14} />

          {/* the two pillar lines — each togglable via the legend below */}
          {visible.low && (
            <polyline points={loPts.join(" ")} fill="none" stroke={loCol} strokeWidth={2.4} strokeLinejoin="round" />
          )}
          {visible.high && (
            <polyline points={hiPts.join(" ")} fill="none" stroke={hiCol} strokeWidth={2.4} strokeLinejoin="round" />
          )}

          {/* scrub marker */}
          {scrubbing && (
            <g>
              <line x1={xOf(idx)} y1={Y0} x2={xOf(idx)} y2={Y1} stroke="var(--ink3)" strokeDasharray="3 3" strokeOpacity={0.8} />
              {visible.high && (
                <circle cx={xOf(idx)} cy={yOf(spread[idx].high)} r={4} fill="var(--surface-1)" stroke={hiCol} strokeWidth={2} />
              )}
              {visible.low && (
                <circle cx={xOf(idx)} cy={yOf(spread[idx].low)} r={4} fill="var(--surface-1)" stroke={loCol} strokeWidth={2} />
              )}
            </g>
          )}
        </svg>

        {/* ── HTML label overlay — always legible, always on top ── */}

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

        {/* gap label mid-chart */}
        <span
          className="num pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[14px] font-medium text-ink sm:text-[13px]"
          style={{
            left: `${leftPct(midI)}%`,
            top: `${topPctY((yOf(spread[midI].high) + yOf(spread[midI].low)) / 2)}%`,
          }}
        >
          gap {spread[midI].gap.toFixed(0)}
        </span>

        {/* x-axis labels */}
        {xLabelIdx.map((i) => (
          <span
            key={i}
            className="num pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-[12px] text-ink3 sm:text-[11px]"
            style={{ left: `${leftPct(i)}%`, top: `${topPctY(Y1) + 4}%` }}
          >
            {spread[i].period}
          </span>
        ))}

        {/* on-chart gap tooltip */}
        {scrubbing && (
          <div
            className="pointer-events-none absolute flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-line2 bg-surface-3 px-2.5 py-1 text-[12px]"
            style={{
              left: `${Math.min(Math.max(leftPct(idx), (X0 / VBW) * 100 + 9), (X1 / VBW) * 100 - 9)}%`,
              top: `${topPctY(Y0)}%`,
            }}
          >
            <span className="num text-ink2">{spread[idx].period}</span>
            <span className="num font-semibold text-ink">gap {spread[idx].gap.toFixed(0)}</span>
          </div>
        )}
      </div>

      {/* legend — toggles each pillar line + shows its latest value */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { key: "high" as const, p: highPillar, v: spread[n - 1].high, c: hiCol },
          { key: "low" as const, p: lowPillar, v: spread[n - 1].low, c: loCol },
        ].map(({ key, p, v, c }) => {
          const isOff = !visible[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setVisible((s) => ({ ...s, [key]: !s[key] }))}
              aria-pressed={!isOff}
              className={cn(
                "inline-flex items-center gap-2 rounded-[9px] border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink2 transition-opacity hover:border-line3",
                isOff && "opacity-40",
              )}
            >
              <span className="h-[3px] w-3.5 rounded" style={{ background: c }} />
              {PILLAR_META[p].label}
              <span className="num font-medium text-ink">{v.toFixed(0)}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
