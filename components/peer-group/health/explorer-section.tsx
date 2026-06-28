"use client";

import { useRef, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { SectionEyebrow, Panel } from "@/components/stock-detail/health/shared";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/peer-group/chart-tooltip";
import { getMetricLabel } from "@/lib/health/metric-labels";
import { niceBounds } from "./lib";
import type { PeerMetricDistribution } from "@/types/peer-group";
import type { MetricBand, BarDirection } from "@/types/health";

const METRIC_BAND_VAR: Record<MetricBand, string> = {
  excellent: "var(--c-pristine)",
  good: "var(--c-healthy)",
  acceptable: "var(--c-steady)",
  concerning: "var(--c-below)",
  distress: "var(--c-fragile)",
};

type Bars = NonNullable<PeerMetricDistribution["bars"]>;

function bandOfValue(v: number, bars: Bars, dir: BarDirection): MetricBand {
  if (dir === "higher_better") {
    if (v >= bars.excellent) return "excellent";
    if (v >= bars.good) return "good";
    if (v >= bars.acceptable) return "acceptable";
    if (v >= bars.concerning) return "concerning";
    return "distress";
  }
  if (v <= bars.excellent) return "excellent";
  if (v <= bars.good) return "good";
  if (v <= bars.acceptable) return "acceptable";
  if (v <= bars.concerning) return "concerning";
  return "distress";
}

function fmtVal(v: number, unit?: string): string {
  const d = unit === "×" || unit === "ratio" ? 2 : Math.abs(v) >= 100 ? 0 : 1;
  return v.toFixed(d);
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const VB_W = 1000;
const VB_H = 220;
const X0 = 46;
const X1 = 954;
const AXIS_Y = 120;

function MetricChart({ dist, unit }: { dist: PeerMetricDistribution; unit?: string }) {
  const raws = dist.members.map((m) => m.rawValue);
  const bars = dist.bars;
  const dir = dist.direction ?? "higher_better";
  const peerUsable = dist.peer?.usable ?? false;

  // bounds span member values, all thresholds, and (if usable) the μ±σ band.
  const thresholdVals = bars ? Object.values(bars) : [];
  const peerVals =
    peerUsable && dist.peer ? [dist.peer.mean - dist.peer.stdDev, dist.peer.mean + dist.peer.stdDev] : [];
  const { lo, hi } = niceBounds([...raws, ...thresholdVals, ...peerVals], 0.1);
  const xo = (v: number) => X0 + ((v - lo) / (hi - lo || 1)) * (X1 - X0);
  const clampX = (x: number) => Math.max(X0, Math.min(X1, x));

  // band regions from the 5 thresholds (the data-derived bars made visible).
  const regions: { x1: number; x2: number; band: MetricBand }[] = [];
  if (bars) {
    const cuts = Array.from(new Set([lo, ...thresholdVals, hi]))
      .filter((v) => v >= lo && v <= hi)
      .sort((a, b) => a - b);
    for (let i = 0; i < cuts.length - 1; i++) {
      const mid = (cuts[i] + cuts[i + 1]) / 2;
      regions.push({ x1: xo(cuts[i]), x2: xo(cuts[i + 1]), band: bandOfValue(mid, bars, dir) });
    }
  }

  const sorted = [...dist.members].sort((a, b) => a.rawValue - b.rawValue);
  const med = median(raws);

  const containerRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(containerRef);

  return (
    <div ref={containerRef} className="relative">
      <ChartTooltip tip={tip} />
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block h-auto w-full" preserveAspectRatio="none">
      {/* data-derived band regions */}
      {regions.map((r, i) => (
        <rect
          key={i}
          x={r.x1}
          y={26}
          width={Math.max(0, r.x2 - r.x1)}
          height={150}
          fill={METRIC_BAND_VAR[r.band]}
          opacity={0.07}
        />
      ))}

      {/* peer μ±σ band — ONLY when usable */}
      {peerUsable && dist.peer && (
        <g>
          <rect
            x={clampX(xo(dist.peer.mean - dist.peer.stdDev))}
            y={40}
            width={Math.max(0, clampX(xo(dist.peer.mean + dist.peer.stdDev)) - clampX(xo(dist.peer.mean - dist.peer.stdDev)))}
            height={120}
            fill="var(--ink2)"
            opacity={0.07}
          />
          <line x1={clampX(xo(dist.peer.mean))} y1={40} x2={clampX(xo(dist.peer.mean))} y2={AXIS_Y} stroke="var(--ink2)" strokeWidth={1.5} strokeDasharray="3 3" />
          <text x={clampX(xo(dist.peer.mean))} y={36} textAnchor="middle" className="num" style={{ fontSize: 9.5, fill: "var(--ink2)" }}>
            μ {fmtVal(dist.peer.mean, unit)}
          </text>
        </g>
      )}

      {/* threshold marks */}
      {bars &&
        Object.entries(bars)
          .filter(([, v]) => v > lo && v < hi)
          .map(([k, v]) => {
            const x = xo(v);
            return (
              <line key={k} x1={x} y1={30} x2={x} y2={178} stroke={METRIC_BAND_VAR[k as MetricBand]} strokeWidth={1} strokeDasharray="4 3" opacity={0.55} />
            );
          })}

      {/* axis */}
      <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke="var(--line2)" strokeWidth={1} />

      {/* median tick */}
      <line x1={clampX(xo(med))} y1={AXIS_Y} x2={clampX(xo(med))} y2={188} stroke="var(--ink3)" strokeWidth={1} strokeDasharray="1 3" />
      <text x={clampX(xo(med))} y={200} textAnchor="middle" className="num" style={{ fontSize: 9.5, fill: "var(--ink3)" }}>
        median {fmtVal(med, unit)}
      </text>

      {/* member dots */}
      {sorted.map((m, i) => {
        const x = xo(m.rawValue);
        const col = m.l1Band ? METRIC_BAND_VAR[m.l1Band] : "var(--ink3)";
        const dim = m.scoreState !== "scored";
        const above = i % 2 === 0;
        const ly = above ? AXIS_Y - 18 : AXIS_Y + 28;
        const dy = above ? AXIS_Y - 7 : AXIS_Y + 7;
        return (
          <g key={m.symbol} opacity={dim ? 0.4 : 1}>
            <line x1={x} y1={AXIS_Y} x2={x} y2={dy} stroke={col} strokeWidth={1} opacity={0.35} />
            <circle cx={x} cy={AXIS_Y} r={5} fill={col} />
            <text x={clampX(x)} y={ly} textAnchor="middle" className="num" style={{ fontSize: 9.5, fill: "var(--ink2)" }}>
              {m.symbol}
            </text>
            <circle
              cx={x}
              cy={AXIS_Y}
              r={16}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseMove={(e) =>
                show(
                  e,
                  <TipBody
                    title={m.symbol}
                    rows={[
                      { label: "Value", value: `${fmtVal(m.rawValue, unit)}${unit ? ` ${unit}` : ""}` },
                      { label: "Band", value: m.l1Band ?? "unscored" },
                      ...(dim ? [{ label: "State", value: m.scoreState }] : []),
                    ]}
                  />,
                )
              }
              onMouseLeave={hide}
            />
          </g>
        );
      })}
      </svg>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2.5 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <span className="text-[11.5px] text-ink2">{k}</span>
      <span className="num text-[15px] font-medium text-ink">{v}</span>
    </div>
  );
}

export function ExplorerSection({ metrics }: { metrics: PeerMetricDistribution[] }) {
  const [active, setActive] = useState(metrics[0]?.metricKey ?? "");
  const dist = metrics.find((m) => m.metricKey === active) ?? metrics[0];

  if (!dist) {
    return (
      <section>
        <SectionEyebrow label="Metric distribution explorer" icon={Icons.chartBar} accent="var(--p-found)" />
        <Panel className="py-10 text-center text-[12px] text-ink3">
          No metric distributions for this pond.
        </Panel>
      </section>
    );
  }

  const meta = getMetricLabel(dist.metricKey);
  const unit = meta.unit;
  const raws = dist.members.map((m) => m.rawValue);
  const med = median(raws);
  const lo = raws.length ? Math.min(...raws) : 0;
  const hi = raws.length ? Math.max(...raws) : 0;
  const dirText = (dist.direction ?? "higher_better") === "higher_better" ? "Higher is healthier" : "Lower is healthier";

  return (
    <section>
      <SectionEyebrow label="Metric distribution explorer" icon={Icons.chartBar} accent="var(--p-found)" pill="the substrate behind every bar" />
      <Reveal>
        <Panel>
          {/* metric chips */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {metrics.map((m) => {
              const lbl = getMetricLabel(m.metricKey);
              const on = m.metricKey === dist.metricKey;
              return (
                <button
                  key={m.metricKey}
                  type="button"
                  onClick={() => setActive(m.metricKey)}
                  className={
                    "rounded-lg border px-3 py-1.5 text-[12px] transition-colors " +
                    (on
                      ? "border-line3 bg-surface-3 font-medium text-ink"
                      : "border-line2 bg-surface-2 text-ink2 hover:border-line3 hover:text-ink")
                  }
                >
                  {lbl.label}
                  <span className="num ml-1.5 text-[9px] text-ink3">{m.metricKey}</span>
                </button>
              );
            })}
          </div>

          <div className="grid items-center gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="min-w-0">
              <MetricChart dist={dist} unit={unit} />
            </div>
            <div className="flex flex-col gap-3.5">
              <Stat k="Group median" v={`${fmtVal(med, unit)}${unit ? ` ${unit}` : ""}`} />
              <Stat k="Spread" v={`${fmtVal(lo, unit)}–${fmtVal(hi, unit)}`} />
              <Stat k="Members" v={dist.members.length} />
              <Stat
                k="Peer μ / σ"
                v={
                  dist.peer?.usable
                    ? `${fmtVal(dist.peer.mean, unit)} · σ ${fmtVal(dist.peer.stdDev, unit)}`
                    : <span className="text-[12px] text-ink3">insufficient peers (N={dist.peer?.sampleN ?? 0})</span>
                }
              />
              <div className="rounded-xl border border-line2 bg-surface-2 p-3.5 text-[11.5px] leading-relaxed text-ink2">
                The bars for <span className="font-medium text-ink">{meta.label}</span> in this pond
                are derived from this very distribution — not set by hand. {dirText}; each name is
                shaded by the band it lands in.
                {!dist.peer?.usable && (
                  <>
                    {" "}
                    The peer-Z lens is{" "}
                    <span className="text-ink">withheld here</span> — too few peers or no spread (σ=0)
                    to form an honest distribution.
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="mt-3.5 border-l-2 border-line2 pl-3 text-[11px] italic leading-relaxed text-ink3">
            This is the substrate behind the peer-Z lens: every name is scored against the spread you
            see here, and the bars are recomputed from the real group each quarter — so the threshold
            is always defensible against the actual pond, never an analyst&apos;s guess.
          </p>
        </Panel>
      </Reveal>
    </section>
  );
}
