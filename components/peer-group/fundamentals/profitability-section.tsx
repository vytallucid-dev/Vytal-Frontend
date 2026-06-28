"use client";

import { useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { niceBounds } from "@/components/peer-group/health/lib";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { median, type FundamentalsRow } from "./lib";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/peer-group/chart-tooltip";

// ─────────────────────────────────────────────────────────────────────────────────────
// §C · Profitability & margins — a 1-D DISTRIBUTION STRIP (not a bar chart): every member
// is a dot positioned along one selectable margin/return axis, with a median tick. Shows
// "where each member sits" on profitability. Factual — no leader crown, no good/bad colour.
// ─────────────────────────────────────────────────────────────────────────────────────

interface Metric {
  key: string;
  label: string;
  pick: (r: FundamentalsRow) => number | null;
}

const NF_METRICS: Metric[] = [
  { key: "netMargin", label: "Net margin", pick: (r) => r.netMargin },
  { key: "operatingMargin", label: "Operating margin", pick: (r) => r.operatingMargin },
  { key: "roe", label: "ROE", pick: (r) => r.roe },
  { key: "roce", label: "ROCE", pick: (r) => r.roce },
];
const BANK_METRICS: Metric[] = [
  { key: "nim", label: "NIM", pick: (r) => r.nim },
  { key: "netMargin", label: "Net margin", pick: (r) => r.netMargin },
  { key: "roe", label: "ROE", pick: (r) => r.roe },
  { key: "roa", label: "ROA", pick: (r) => r.roa },
];

const W = 1000;
const H = 150;
const X0 = 40;
const X1 = 960;
const AXIS_Y = 78;
const DOT = "var(--p-found)";

export function ProfitabilitySection({
  rows,
  isBanking,
}: {
  rows: FundamentalsRow[];
  isBanking: boolean;
}) {
  const metrics = isBanking ? BANK_METRICS : NF_METRICS;
  const [key, setKey] = useState(metrics[0].key);
  const metric = metrics.find((m) => m.key === key) ?? metrics[0];

  const pts = useMemo(
    () =>
      rows
        .map((r) => ({ symbol: r.symbol, v: metric.pick(r) }))
        .filter((p): p is { symbol: string; v: number } => p.v != null)
        .sort((a, b) => a.v - b.v),
    [rows, metric],
  );

  const med = median(pts.map((p) => p.v));
  const { lo, hi } = niceBounds(pts.map((p) => p.v), 0.08);
  const xo = (v: number) => X0 + ((v - lo) / (hi - lo || 1)) * (X1 - X0);
  const clampX = (x: number) => Math.max(X0, Math.min(X1, x));

  const containerRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(containerRef);

  return (
    <section>
      <SectionEyebrow
        label="Profitability across the field"
        icon={Icons.pulse}
        accent="var(--p-found)"
        pill="distribution"
      />
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-ink3">Metric:</span>
        {metrics.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setKey(m.key)}
            className={cn(
              "rounded-full border px-2.5 py-1 transition-colors",
              m.key === key
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-line text-ink2 hover:border-line2 hover:text-ink",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Reveal>
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          {pts.length < 3 ? (
            <p className="py-6 text-center text-[13px] text-ink3">
              Too few members report {metric.label} to show a distribution yet.
            </p>
          ) : (
            <div ref={containerRef} className="relative">
              <ChartTooltip tip={tip} />
              <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" preserveAspectRatio="none"
                role="img" aria-label={`${metric.label} distribution across ${pts.length} members`}>
                {/* axis */}
                <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke="var(--line2)" strokeWidth={1} />
                {/* min / max ticks */}
                {[lo, hi].map((v, i) => (
                  <text key={i} x={i === 0 ? X0 : X1} y={AXIS_Y + 26} textAnchor={i === 0 ? "start" : "end"} className="num" style={{ fontSize: 10, fill: "var(--ink3)" }}>
                    {v.toFixed(0)}%
                  </text>
                ))}
                {/* median tick — a fact */}
                {med != null && (
                  <g>
                    <line x1={xo(med)} y1={AXIS_Y - 26} x2={xo(med)} y2={AXIS_Y + 6} stroke="var(--ink3)" strokeWidth={1} strokeDasharray="3 4" />
                    <text x={clampX(xo(med))} y={AXIS_Y - 32} textAnchor="middle" className="num" style={{ fontSize: 10, fill: "var(--ink3)" }}>
                      median {med.toFixed(1)}%
                    </text>
                  </g>
                )}
                {/* members — alternating labels above/below to avoid overlap */}
                {pts.map((p, i) => {
                  const x = xo(p.v);
                  const above = i % 2 === 0;
                  const ly = above ? AXIS_Y - 12 : AXIS_Y + 22;
                  return (
                    <g key={p.symbol}>
                      <circle cx={x} cy={AXIS_Y} r={5} fill={DOT} opacity={0.85} />
                      <text x={clampX(x)} y={ly} textAnchor="middle" className="num" style={{ fontSize: 10, fill: "var(--ink2)" }}>
                        {p.symbol}
                      </text>
                      <circle
                        cx={x}
                        cy={AXIS_Y}
                        r={18}
                        fill="transparent"
                        style={{ cursor: "pointer" }}
                        onMouseMove={(e) =>
                          show(
                            e,
                            <TipBody title={p.symbol} rows={[{ label: metric.label, value: `${p.v.toFixed(1)}%` }]} />,
                          )
                        }
                        onMouseLeave={hide}
                      />
                    </g>
                  );
                })}
              </svg>
              <p className="mt-3 text-[11.5px] text-ink3">
                Each member placed by {metric.label}; the dashed tick is the group median. Hover a
                point for its value. Where a member sits is the information — no member is flagged best
                or worst.
              </p>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
