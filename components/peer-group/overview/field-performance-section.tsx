"use client";

import { useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/peer-group/chart-tooltip";
import {
  buildComposite,
  FIELD_WINDOWS,
  type CompositeMemberInput,
  type Weighting,
} from "./lib";

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ─────────────────────────────────────────────────────────────────────────────────────
// §4 · Field performance over time — a cap-/equal-weighted composite of members' rebased
// price paths (=100 at window start). HONEST: members lacking history for the window are
// EXCLUDED and reported ("N of M shown"), never zero-filled; too few → honest-empty. Just
// the path — no "set to outperform", no prediction.
// ─────────────────────────────────────────────────────────────────────────────────────

const W = 1000;
const H = 300;
const M = { top: 18, right: 16, bottom: 28, left: 48 };
const LINE = "var(--p-mom)";

export function FieldPerformanceSection({
  members,
}: {
  members: CompositeMemberInput[];
}) {
  const [windowKey, setWindowKey] = useState("1Y");
  const [weighting, setWeighting] = useState<Weighting>("cap");
  const win = FIELD_WINDOWS.find((w) => w.key === windowKey) ?? FIELD_WINDOWS[2];

  const result = useMemo(
    () => buildComposite(members, win.days, weighting),
    [members, win.days, weighting],
  );

  const { points, included, excluded } = result;
  const hasPath = points.length >= 2;

  const containerRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(containerRef);
  const [hoverI, setHoverI] = useState<number | null>(null);
  const resetHover = () => {
    setHoverI(null);
    hide();
  };

  const geom = useMemo(() => {
    if (!hasPath) return null;
    const vs = points.map((p) => p.v);
    const lo = Math.min(...vs);
    const hi = Math.max(...vs);
    const t0 = points[0].t;
    const t1 = points[points.length - 1].t;
    const x = (t: number) => M.left + ((t - t0) / (t1 - t0 || 1)) * (W - M.left - M.right);
    const y = (v: number) => H - M.bottom - ((v - lo) / (hi - lo || 1)) * (H - M.top - M.bottom);
    const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const last = points[points.length - 1];
    return { lo, hi, x, y, d, last };
  }, [points, hasPath]);

  return (
    <section>
      <SectionEyebrow
        label="Field performance over time"
        icon={Icons.chartLine}
        accent="var(--p-mom)"
        pill={weighting === "cap" ? "cap-weighted" : "equal-weighted"}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 text-[12px]">
          {FIELD_WINDOWS.map((w) => (
            <button
              key={w.key}
              type="button"
              onClick={() => {
                setWindowKey(w.key);
                resetHover();
              }}
              className={cn(
                "rounded-md border px-2.5 py-1 transition-colors",
                w.key === windowKey
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-line text-ink2 hover:border-line2 hover:text-ink",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 text-[12px]">
          {(["cap", "equal"] as Weighting[]).map((wt) => (
            <button
              key={wt}
              type="button"
              onClick={() => {
                setWeighting(wt);
                resetHover();
              }}
              className={cn(
                "rounded-md border px-2.5 py-1 transition-colors",
                wt === weighting
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-line text-ink2 hover:border-line2 hover:text-ink",
              )}
            >
              {wt === "cap" ? "Cap-weighted" : "Equal-weighted"}
            </button>
          ))}
        </div>
      </div>

      <Reveal>
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          {hasPath && geom ? (
            <div ref={containerRef} className="relative">
              <ChartTooltip tip={tip} />
              <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" preserveAspectRatio="none"
                role="img" aria-label={`Field price composite, ${win.label}, ${weighting}-weighted`}>
                {/* rebase baseline at 100 */}
                {geom.lo <= 100 && geom.hi >= 100 && (
                  <g>
                    <line x1={M.left} y1={geom.y(100)} x2={W - M.right} y2={geom.y(100)} stroke="var(--line2)" strokeWidth={1} strokeDasharray="3 4" />
                    <text x={M.left - 6} y={geom.y(100) + 3} textAnchor="end" className="num" style={{ fontSize: 10, fill: "var(--ink3)" }}>100</text>
                  </g>
                )}
                {/* hi / lo ticks */}
                <text x={M.left - 6} y={geom.y(geom.hi) + 3} textAnchor="end" className="num" style={{ fontSize: 10, fill: "var(--ink3)" }}>{geom.hi.toFixed(0)}</text>
                <text x={M.left - 6} y={geom.y(geom.lo) + 3} textAnchor="end" className="num" style={{ fontSize: 10, fill: "var(--ink3)" }}>{geom.lo.toFixed(0)}</text>

                <path d={geom.d} fill="none" stroke={LINE} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={geom.x(geom.last.t)} cy={geom.y(geom.last.v)} r={3} fill={LINE} />
                <text x={geom.x(geom.last.t)} y={geom.y(geom.last.v) - 8} textAnchor="end" className="num" style={{ fontSize: 11, fill: "var(--ink2)" }}>
                  {geom.last.v.toFixed(1)}
                </text>

                {/* hover crosshair + marker */}
                {hoverI != null && points[hoverI] && (
                  <g>
                    <line x1={geom.x(points[hoverI].t)} y1={M.top} x2={geom.x(points[hoverI].t)} y2={H - M.bottom} stroke="var(--ink3)" strokeWidth={1} strokeDasharray="2 3" />
                    <circle cx={geom.x(points[hoverI].t)} cy={geom.y(points[hoverI].v)} r={4} fill={LINE} stroke="var(--surface-1)" strokeWidth={1.5} />
                  </g>
                )}

                {/* transparent capture layer (last → on top) — nearest-point hover */}
                <rect
                  x={M.left}
                  y={M.top}
                  width={W - M.left - M.right}
                  height={H - M.top - M.bottom}
                  fill="transparent"
                  style={{ cursor: "crosshair" }}
                  onMouseMove={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const vbX = ((e.clientX - rect.left) / rect.width) * W;
                    let bi = 0;
                    let bd = Infinity;
                    points.forEach((p, i) => {
                      const dx = Math.abs(geom.x(p.t) - vbX);
                      if (dx < bd) {
                        bd = dx;
                        bi = i;
                      }
                    });
                    setHoverI(bi);
                    show(
                      e,
                      <TipBody
                        title={fmtDate(points[bi].t)}
                        rows={[
                          { label: "Index", value: points[bi].v.toFixed(1) },
                          { label: "Members", value: String(included.length) },
                        ]}
                      />,
                    );
                  }}
                  onMouseLeave={resetHover}
                />
              </svg>
              <p className="mt-3 text-[11.5px] text-ink3">
                Members&apos; price paths rebased to 100 at the window start,{" "}
                {weighting === "cap" ? "weighted by market cap" : "equally weighted"}.{" "}
                <span className="num">{included.length}</span> of{" "}
                <span className="num">{included.length + excluded.length}</span> members shown
                {excluded.length > 0 && (
                  <>
                    {" "}
                    — <span className="num text-ink2">{excluded.join(", ")}</span> lack history for this
                    window
                  </>
                )}
                . Hover the line to read the index at any date. A path, not a forecast.
              </p>
            </div>
          ) : (
            <p className="py-8 text-center text-[13px] text-ink3">
              Too few members have price history reaching back over this window to build a field
              composite — try a shorter window.
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
