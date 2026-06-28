"use client";

import { useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { niceBounds } from "@/components/peer-group/health/lib";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { IndustryFamily } from "@/types/fundamentals";
import { median, type ValuationRow } from "./lib";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/peer-group/chart-tooltip";

// ─────────────────────────────────────────────────────────────────────────────────────
// §B · Valuation Positioning — cheapness (x: P/E) against quality/growth (y).
//
// HONESTY LINE — plot and stop. Labelled axes + a median reference line on EACH axis (a
// fact: "the middle of the set"). NO quadrant labels, NO "good corner" colour, NO verdict
// annotations, NO "attractively valued" copy. Every point is the same neutral colour —
// the position IS the information; the user reads it.
// ─────────────────────────────────────────────────────────────────────────────────────

interface QualityOption {
  key: string;
  label: string;
  unit: string;
  pick: (r: ValuationRow) => number | null;
}

const NF_OPTIONS: QualityOption[] = [
  { key: "roce", label: "ROCE", unit: "%", pick: (r) => r.roce },
  { key: "profitGrowth", label: "Profit growth", unit: "%", pick: (r) => r.profitGrowth },
  { key: "netMargin", label: "Net margin", unit: "%", pick: (r) => r.netMargin },
];
const FIN_OPTIONS: QualityOption[] = [
  { key: "roe", label: "ROE", unit: "%", pick: (r) => r.roe },
  { key: "profitGrowth", label: "Profit growth", unit: "%", pick: (r) => r.profitGrowth },
];

// neutral plot geometry
const W = 1000;
const H = 440;
const M = { top: 24, right: 28, bottom: 56, left: 64 };
const DOT = "var(--ink2)"; // single neutral colour for every member — no judgment

export function PositioningScatter({
  rows,
  family,
}: {
  rows: ValuationRow[];
  family: IndustryFamily | null;
}) {
  const options = family === "banking" || family === "nbfc" ? FIN_OPTIONS : NF_OPTIONS;
  const [yKey, setYKey] = useState(options[0].key);
  const yOpt = options.find((o) => o.key === yKey) ?? options[0];

  const containerRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(containerRef);

  const points = useMemo(
    () =>
      rows
        .map((r) => ({ symbol: r.symbol, x: r.pe, y: yOpt.pick(r) }))
        .filter((p): p is { symbol: string; x: number; y: number } => p.x != null && p.y != null),
    [rows, yOpt],
  );

  const xMed = median(points.map((p) => p.x));
  const yMed = median(points.map((p) => p.y));

  const { lo: xLo, hi: xHi } = niceBounds(points.map((p) => p.x), 0.12);
  const { lo: yLo, hi: yHi } = niceBounds(points.map((p) => p.y), 0.12);

  const px = (x: number) => M.left + ((x - xLo) / (xHi - xLo || 1)) * (W - M.left - M.right);
  const py = (y: number) => H - M.bottom - ((y - yLo) / (yHi - yLo || 1)) * (H - M.top - M.bottom);

  return (
    <section>
      <SectionEyebrow
        label="Valuation positioning"
        icon={Icons.scales}
        accent="var(--p-mom)"
        pill="P/E vs quality"
      />

      {/* y-axis metric selector — the user picks the quality lens */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-ink3">Quality axis:</span>
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setYKey(o.key)}
            className={cn(
              "rounded-full border px-2.5 py-1 transition-colors",
              o.key === yKey
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-line text-ink2 hover:border-line2 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <Reveal>
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          {points.length < 3 ? (
            <p className="py-8 text-center text-[13px] text-ink3">
              Too few members have both a P/E and {yOpt.label} to plot a positioning view yet.
            </p>
          ) : (
            <div ref={containerRef} className="relative">
              <ChartTooltip tip={tip} />
              <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img"
                aria-label={`Scatter of P/E against ${yOpt.label} for ${points.length} members`}>
                {/* plot frame */}
                <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="var(--line2)" strokeWidth={1} />
                <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="var(--line2)" strokeWidth={1} />

                {/* median reference lines — a FACT (the middle of the set), not a verdict */}
                {xMed != null && (
                  <g>
                    <line x1={px(xMed)} y1={M.top} x2={px(xMed)} y2={H - M.bottom} stroke="var(--ink3)" strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />
                    <text x={px(xMed)} y={M.top - 8} textAnchor="middle" className="num" style={{ fontSize: 11, fill: "var(--ink3)" }}>
                      median P/E {xMed.toFixed(1)}
                    </text>
                  </g>
                )}
                {yMed != null && (
                  <g>
                    <line x1={M.left} y1={py(yMed)} x2={W - M.right} y2={py(yMed)} stroke="var(--ink3)" strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />
                    <text x={W - M.right} y={py(yMed) - 6} textAnchor="end" className="num" style={{ fontSize: 11, fill: "var(--ink3)" }}>
                      median {yOpt.label} {yMed.toFixed(1)}{yOpt.unit}
                    </text>
                  </g>
                )}

                {/* members — one neutral colour, labelled by symbol. No corner is coloured. */}
                {points.map((p) => (
                  <g key={p.symbol}>
                    <circle cx={px(p.x)} cy={py(p.y)} r={5.5} fill={DOT} opacity={0.85} />
                    <text x={px(p.x)} y={py(p.y) - 10} textAnchor="middle" className="num" style={{ fontSize: 10.5, fill: "var(--ink2)" }}>
                      {p.symbol}
                    </text>
                    {/* invisible hit target — generous radius for easy hover */}
                    <circle
                      cx={px(p.x)}
                      cy={py(p.y)}
                      r={16}
                      fill="transparent"
                      style={{ cursor: "pointer" }}
                      onMouseMove={(e) =>
                        show(
                          e,
                          <TipBody
                            title={p.symbol}
                            rows={[
                              { label: "P/E", value: p.x.toFixed(1) },
                              { label: yOpt.label, value: `${p.y.toFixed(1)}${yOpt.unit}` },
                            ]}
                          />,
                        )
                      }
                      onMouseLeave={hide}
                    />
                  </g>
                ))}

                {/* axis titles */}
                <text x={(M.left + W - M.right) / 2} y={H - 14} textAnchor="middle" style={{ fontSize: 12, fill: "var(--ink2)" }}>
                  P/E (trailing) →
                </text>
                <text x={18} y={(M.top + H - M.bottom) / 2} textAnchor="middle" transform={`rotate(-90 18 ${(M.top + H - M.bottom) / 2})`} style={{ fontSize: 12, fill: "var(--ink2)" }}>
                  {yOpt.label} ({yOpt.unit}) →
                </text>
              </svg>
              <p className="mt-3 text-[11.5px] text-ink3">
                Each member plotted by trailing P/E against {yOpt.label}; dashed lines mark the group
                median on each axis. Hover a point for its values. Positions are facts — there are no
                &quot;good&quot; or &quot;bad&quot; corners here, and nothing is flagged as cheap or
                expensive.
              </p>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
