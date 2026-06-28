"use client";

import { useMemo, useRef } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { niceBounds } from "@/components/peer-group/health/lib";
import { Icons } from "@/lib/icons";
import { median, type FundamentalsRow } from "./lib";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/peer-group/chart-tooltip";

// ─────────────────────────────────────────────────────────────────────────────────────
// §B · Growth — revenue growth (x) vs profit growth (y), each member a point. A scatter
// pairs the two growth dimensions on one plane ("growing the top line vs the bottom line").
// FACTUAL: labelled axes + median reference lines (the middle of the set). No quadrant
// labels, no "good corner", no verdicts. Both YoY (multi-year CAGR isn't stored).
// ─────────────────────────────────────────────────────────────────────────────────────

const W = 1000;
const H = 420;
const M = { top: 24, right: 28, bottom: 54, left: 64 };
const DOT = "var(--ink2)";

export function GrowthSection({
  rows,
  isBanking,
}: {
  rows: FundamentalsRow[];
  isBanking: boolean;
}) {
  const xLabel = isBanking ? "NII growth" : "Revenue growth";

  const points = useMemo(
    () =>
      rows
        .map((r) => ({ symbol: r.symbol, x: r.revenueGrowth, y: r.profitGrowth }))
        .filter((p): p is { symbol: string; x: number; y: number } => p.x != null && p.y != null),
    [rows],
  );

  const xMed = median(points.map((p) => p.x));
  const yMed = median(points.map((p) => p.y));
  const { lo: xLo, hi: xHi } = niceBounds(points.map((p) => p.x), 0.14);
  const { lo: yLo, hi: yHi } = niceBounds(points.map((p) => p.y), 0.14);
  const px = (x: number) => M.left + ((x - xLo) / (xHi - xLo || 1)) * (W - M.left - M.right);
  const py = (y: number) => H - M.bottom - ((y - yLo) / (yHi - yLo || 1)) * (H - M.top - M.bottom);

  const containerRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(containerRef);

  return (
    <section>
      <SectionEyebrow
        label="Growth across the field"
        icon={Icons.trendUp}
        accent="var(--p-mom)"
        pill="YoY"
      />
      <Reveal>
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          {points.length < 3 ? (
            <p className="py-8 text-center text-[13px] text-ink3">
              Too few members report both {xLabel.toLowerCase()} and profit growth to plot the field
              yet.
            </p>
          ) : (
            <div ref={containerRef} className="relative">
              <ChartTooltip tip={tip} />
              <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img"
                aria-label={`${xLabel} vs profit growth for ${points.length} members`}>
                <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="var(--line2)" strokeWidth={1} />
                <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="var(--line2)" strokeWidth={1} />

                {xMed != null && (
                  <g>
                    <line x1={px(xMed)} y1={M.top} x2={px(xMed)} y2={H - M.bottom} stroke="var(--ink3)" strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />
                    <text x={px(xMed)} y={M.top - 8} textAnchor="middle" className="num" style={{ fontSize: 11, fill: "var(--ink3)" }}>
                      median {xMed.toFixed(1)}%
                    </text>
                  </g>
                )}
                {yMed != null && (
                  <g>
                    <line x1={M.left} y1={py(yMed)} x2={W - M.right} y2={py(yMed)} stroke="var(--ink3)" strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />
                    <text x={W - M.right} y={py(yMed) - 6} textAnchor="end" className="num" style={{ fontSize: 11, fill: "var(--ink3)" }}>
                      median {yMed.toFixed(1)}%
                    </text>
                  </g>
                )}

                {points.map((p) => (
                  <g key={p.symbol}>
                    <circle cx={px(p.x)} cy={py(p.y)} r={5.5} fill={DOT} opacity={0.85} />
                    <text x={px(p.x)} y={py(p.y) - 10} textAnchor="middle" className="num" style={{ fontSize: 10.5, fill: "var(--ink2)" }}>
                      {p.symbol}
                    </text>
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
                              { label: xLabel, value: `${p.x > 0 ? "+" : ""}${p.x.toFixed(1)}%` },
                              { label: "Profit growth", value: `${p.y > 0 ? "+" : ""}${p.y.toFixed(1)}%` },
                            ]}
                          />,
                        )
                      }
                      onMouseLeave={hide}
                    />
                  </g>
                ))}

                <text x={(M.left + W - M.right) / 2} y={H - 14} textAnchor="middle" style={{ fontSize: 12, fill: "var(--ink2)" }}>
                  {xLabel} (YoY %) →
                </text>
                <text x={18} y={(M.top + H - M.bottom) / 2} textAnchor="middle" transform={`rotate(-90 18 ${(M.top + H - M.bottom) / 2})`} style={{ fontSize: 12, fill: "var(--ink2)" }}>
                  Profit growth (YoY %) →
                </text>
              </svg>
              <p className="mt-3 text-[11.5px] text-ink3">
                Each member plotted by {xLabel.toLowerCase()} against profit growth, both year-on-year;
                dashed lines mark the group median on each axis. Hover a point for its values.
                Positions are facts — nothing here is a recommendation.
              </p>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
