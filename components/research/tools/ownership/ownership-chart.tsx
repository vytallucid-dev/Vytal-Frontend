"use client";

/**
 * The Ownership centerpiece — the stacked holding split (promoter / FII / DII /
 * retail) over time. This is the SOLE hero: no Foundation line (deliberately
 * demoted — the floor relationship lives in the conditional floor-check strip, not a
 * permanent plot). Custom responsive SVG; sets the frame's active datapoint on
 * hover/tap, draws the scrub marker + an on-chart split tooltip (the mobile read).
 *
 * Text (axis ticks, in-band value labels, tooltip) is NOT drawn as SVG <text> — it's
 * an HTML overlay positioned by percentage over the chart box. Two reasons: (1) an SVG
 * scaled down to a narrow mobile width shrinks its text right along with it, reading too
 * small to use; an HTML overlay keeps a fixed, legible CSS size regardless of the SVG's
 * scale. (2) HTML overlay elements paint AFTER (on top of) the SVG by DOM order, so
 * labels are never occluded by the pledge hatch or any band fill beneath them.
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

/** The pledged fraction of the promoter band, in the SAME stacked-% units as the
 *  lanes: promoterPct × (pledgedPctOfPromoter/100). Null/0 pledge → null (no slice). */
const pledgedLevel = (p: HoldingPoint): number | null => {
  const frac = p.pledgedPctOfPromoter;
  if (frac == null || frac <= 0 || p.promoter <= 0) return null;
  return p.promoter * (frac / 100);
};

/** Contiguous runs of periods that carry real pledge data — so a null/zero period
 *  breaks the red sub-band honestly (never bridges a gap with a fabricated slice). */
function pledgedRuns(points: HoldingPoint[]): number[][] {
  const runs: number[][] = [];
  let run: number[] = [];
  points.forEach((p, i) => {
    if (pledgedLevel(p) != null) {
      run.push(i);
    } else if (run.length) {
      runs.push(run);
      run = [];
    }
  });
  if (run.length) runs.push(run);
  return runs;
}

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
  const leftPct = (i: number) => (xOf(i) / VBW) * 100;
  const topPctY = (y: number) => (y / VBH) * 100;

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
  const last = points[n - 1];

  // x labels — thin denser stepping mirrors the original SVG version
  const step = n > 6 ? 2 : 1;
  const xLabelIdx = points.map((_, i) => i).filter((i) => i % step === 0 || i === n - 1);

  return (
    <Panel className="px-2.5 py-3 sm:px-4 sm:py-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="kicker">Holding split over time · who owns it</span>
      </div>

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
          aria-label="Stacked shareholding split over time"
        >
          <defs>
            {/* pledged hatch — a diagonal at-risk texture drawn OVER the promoter band's own
                gold fill (never a flat red block), so pledged reads as a flagged portion of
                promoter, not a separate holder lane. */}
            <pattern id="pledgeHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="7" fill="var(--crit)" fillOpacity="0.28" />
              <rect width="3.2" height="7" fill="var(--crit)" fillOpacity="0.8" />
            </pattern>
          </defs>

          {/* y grid 25/50/75/100% */}
          {[25, 50, 75, 100].map((v) => (
            <line key={v} x1={X0} y1={yOf(v)} x2={X1} y2={yOf(v)} stroke="var(--line)" strokeDasharray="2 5" />
          ))}

          {/* stacked lanes */}
          {HOLD_LANES.map((lane, h) => {
            const up = points.map((_, i) => `${xOf(i).toFixed(1)},${yOf(cum[i][h + 1]).toFixed(1)}`);
            const dn = points.map((_, i) => `${xOf(i).toFixed(1)},${yOf(cum[i][h]).toFixed(1)}`);
            const poly = up.concat([...dn].reverse()).join(" ");
            return <polygon key={lane.key} points={poly} fill={lane.color} opacity={0.82} />;
          })}

          {/* pledged sub-band — a hazard-hatch OVERLAY on the promoter band's own gold fill
              (never a flat red block), so pledged reads as "part of promoter, flagged" rather
              than a separate holder lane. Adds no stack height; other lanes are unmoved.
              Drawn per contiguous run so null/zero periods leave the band honestly gold. */}
          {pledgedRuns(points).map((run, k) => {
            if (run.length === 1) {
              // isolated pledged period between gaps — a thin standing slice at that x.
              const i = run[0];
              const lvl = pledgedLevel(points[i])!;
              const w = n > 1 ? Math.min(6, ((X1 - X0) / (n - 1)) * 0.5) : 6;
              return (
                <rect
                  key={`pledge-${k}`}
                  x={xOf(i) - w / 2}
                  y={yOf(lvl)}
                  width={w}
                  height={yOf(0) - yOf(lvl)}
                  fill="url(#pledgeHatch)"
                />
              );
            }
            const up = run.map((i) => `${xOf(i).toFixed(1)},${yOf(pledgedLevel(points[i])!).toFixed(1)}`);
            const dn = run.map((i) => `${xOf(i).toFixed(1)},${yOf(0).toFixed(1)}`);
            const poly = up.concat([...dn].reverse()).join(" ");
            return <polygon key={`pledge-${k}`} points={poly} fill="url(#pledgeHatch)" />;
          })}

          {/* scrub marker */}
          {scrubbing && (
            <line x1={xOf(idx)} y1={Y0} x2={xOf(idx)} y2={Y1} stroke="var(--ink)" strokeDasharray="3 3" strokeOpacity={0.85} />
          )}
        </svg>

        {/* ── HTML label overlay — always legible, always on top ── */}

        {/* y-axis 25/50/75/100% */}
        {[25, 50, 75, 100].map((v) => (
          <span
            key={v}
            className="num pointer-events-none absolute right-[calc(100%-var(--x0))] -translate-y-1/2 pr-1.5 text-[12px] text-ink3 sm:text-[11px]"
            style={{ top: `${topPctY(yOf(v))}%`, ["--x0" as string]: `${(X0 / VBW) * 100}%` }}
          >
            {v}%
          </span>
        ))}

        {/* in-band lane value labels (right end of each band, if it has room) */}
        {HOLD_LANES.map((lane, h) => {
          const val = last[lane.key];
          if (val < 8) return null;
          const midY = (yOf(cum[n - 1][h + 1]) + yOf(cum[n - 1][h])) / 2;
          return (
            <span
              key={lane.key}
              className="num pointer-events-none absolute -translate-y-1/2 whitespace-nowrap text-[12px] font-medium text-white sm:text-[11.5px]"
              style={{ left: `${(X1 / VBW) * 100}%`, top: `${topPctY(midY)}%`, transform: "translate(-100%, -50%)" }}
            >
              {lane.label} {val.toFixed(0)}%
            </span>
          );
        })}

        {/* x-axis period labels */}
        {xLabelIdx.map((i) => (
          <span
            key={i}
            className="num pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-[12px] text-ink3 sm:text-[11px]"
            style={{ left: `${leftPct(i)}%`, top: `${topPctY(Y1) + 4}%` }}
          >
            {points[i].period}
          </span>
        ))}

        {/* on-chart split tooltip */}
        {scrubbing && (
          <div
            className="pointer-events-none absolute flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-line2 bg-surface-3 px-2.5 py-1 text-[12px]"
            style={{
              left: `${Math.min(Math.max(leftPct(idx), (X0 / VBW) * 100 + 10), (X1 / VBW) * 100 - 10)}%`,
              top: `${topPctY(Y0)}%`,
            }}
          >
            <span className="num text-ink2">{cur.period}</span>
            <span className="num font-medium text-ink">
              P{cur.promoter.toFixed(0)} F{cur.fii.toFixed(0)} D{cur.dii.toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {/* legend — lanes + latest values */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
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
        {/* pledged sub-band key — subordinate, shown only when any period carries pledging */}
        {points.some((p) => pledgedLevel(p) != null) && (
          <span className="inline-flex items-center gap-1.5 self-center text-[11px] text-ink3">
            <span
              className="size-2.5 rounded-sm"
              style={{
                background:
                  "repeating-linear-gradient(45deg, var(--crit) 0 2px, color-mix(in oklch, var(--crit) 28%, transparent) 2px 4px)",
              }}
            />
            pledged (of promoter)
          </span>
        )}
      </div>
    </Panel>
  );
}
