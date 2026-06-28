"use client";

/**
 * Distribution-shaped chart primitives for the PG-vs-PG comparison view.
 *
 * These compare FIELDS, not point estimates — so every visual reads as a SHAPE (a spread,
 * a band mix, a dispersion strip) rather than a single value. The two fields are the same
 * two neutral identity hues used everywhere in compare (A = Foundation, B = Momentum); the
 * band/metric SEGMENT colours are the platform condition scale. Nothing here ranks one
 * field over the other — there is no winner column, no highlight of the "higher" side.
 *
 * Every interactive element carries a cursor-following tooltip (the platform useChartTooltip
 * pattern) so the exact figure behind each bar / dot / segment is one hover away.
 */

import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import {
  LABEL_BAND_ORDER,
  BAND_META,
  PILLAR_META,
  METRIC_BAND_META,
} from "@/components/stock-detail/health/shared";
import { getMetricLabel } from "@/lib/health/metric-labels";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/ui/chart-tooltip";
import { A_HUE, B_HUE } from "../view/shared";
import type { LabelBand, PillarKey, MetricBand } from "@/types/health";
import type {
  BandDistribution,
  PeerMetricDistribution,
} from "@/types/peer-group";

type ShowFn = (e: MouseEvent, content: ReactNode) => void;

const clamp01 = (n: number) => Math.max(0, Math.min(100, n));
const sumVals = (d: Record<string, number>) =>
  Object.values(d).reduce((s, v) => s + (v || 0), 0);

/* ------------------------------------------------------------------ */
/* Band distribution — the core field-character read. Each field's     */
/* share of members per band (Pristine→Fragile), as paired bars.       */
/* bandDistribution arrives as COUNTS, so we normalise to % of field.  */
/* ------------------------------------------------------------------ */

export function BandDistributionPaired({
  aDist,
  bDist,
  aLabel,
  bLabel,
}: {
  aDist: BandDistribution;
  bDist: BandDistribution;
  aLabel: string;
  bLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(ref);
  const aTotal = sumVals(aDist);
  const bTotal = sumVals(bDist);
  const order = [...LABEL_BAND_ORDER].reverse() as LabelBand[]; // Pristine at top

  return (
    <div ref={ref} className="relative space-y-3">
      <ChartTooltip tip={tip} />
      {order.map((band) => {
        const meta = BAND_META[band];
        const aCount = aDist[band] ?? 0;
        const bCount = bDist[band] ?? 0;
        const aPct = aTotal ? (aCount / aTotal) * 100 : 0;
        const bPct = bTotal ? (bCount / bTotal) * 100 : 0;
        return (
          <div key={band} className="flex items-center gap-3">
            <div className="flex w-24 shrink-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: meta.cssVar }}
              />
              <span className="text-xs text-ink2">{meta.label}</span>
            </div>
            <div className="flex-1 space-y-1">
              <DistRow
                hue={A_HUE}
                pct={aPct}
                count={aCount}
                onMove={(e) =>
                  show(
                    e,
                    <TipBody
                      title={`${aLabel} · ${meta.label}`}
                      rows={[
                        { label: "Share", value: `${aPct.toFixed(0)}%` },
                        { label: "Members", value: String(aCount) },
                      ]}
                    />,
                  )
                }
                onLeave={hide}
              />
              <DistRow
                hue={B_HUE}
                pct={bPct}
                count={bCount}
                onMove={(e) =>
                  show(
                    e,
                    <TipBody
                      title={`${bLabel} · ${meta.label}`}
                      rows={[
                        { label: "Share", value: `${bPct.toFixed(0)}%` },
                        { label: "Members", value: String(bCount) },
                      ]}
                    />,
                  )
                }
                onLeave={hide}
              />
            </div>
          </div>
        );
      })}
      <LegendDots aLabel={aLabel} bLabel={bLabel} />
    </div>
  );
}

function DistRow({
  hue,
  pct,
  count,
  onMove,
  onLeave,
}: {
  hue: string;
  pct: number;
  count: number;
  onMove: (e: MouseEvent) => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2.5 flex-1 cursor-default overflow-hidden rounded-full bg-line/60"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${clamp01(pct)}%`, background: hue }}
        />
      </div>
      <span className="num w-16 shrink-0 text-right text-[11px] text-ink3">
        {pct.toFixed(0)}% · {count}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pillar medians — the 4 universal pillar medians (0–100), paired.    */
/* The distribution-level analog of the stock radar, on medians.       */
/* ------------------------------------------------------------------ */

const PILLAR_ORDER: PillarKey[] = ["foundation", "momentum", "market", "ownership"];

export function PillarMediansPaired({
  aMedians,
  bMedians,
  aLabel,
  bLabel,
}: {
  aMedians: Record<PillarKey, number>;
  bMedians: Record<PillarKey, number>;
  aLabel: string;
  bLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(ref);

  return (
    <div ref={ref} className="relative space-y-3.5">
      <ChartTooltip tip={tip} />
      {PILLAR_ORDER.map((pk) => {
        const meta = PILLAR_META[pk];
        const av = aMedians[pk];
        const bv = bMedians[pk];
        return (
          <div key={pk} className="flex items-center gap-3">
            <div className="flex w-24 shrink-0 items-center gap-2">
              <span
                className="h-3 w-[3px] shrink-0 rounded-full"
                style={{ background: meta.cssVar }}
              />
              <span className="text-xs text-ink2">{meta.label}</span>
            </div>
            <div className="flex-1 space-y-1">
              <MedianBar
                hue={A_HUE}
                value={av}
                onMove={(e) =>
                  show(
                    e,
                    <TipBody
                      title={`${aLabel} · ${meta.label}`}
                      rows={[{ label: "Median", value: av == null ? "—" : av.toFixed(1) }]}
                    />,
                  )
                }
                onLeave={hide}
              />
              <MedianBar
                hue={B_HUE}
                value={bv}
                onMove={(e) =>
                  show(
                    e,
                    <TipBody
                      title={`${bLabel} · ${meta.label}`}
                      rows={[{ label: "Median", value: bv == null ? "—" : bv.toFixed(1) }]}
                    />,
                  )
                }
                onLeave={hide}
              />
            </div>
          </div>
        );
      })}
      <LegendDots aLabel={aLabel} bLabel={bLabel} />
    </div>
  );
}

function MedianBar({
  hue,
  value,
  onMove,
  onLeave,
}: {
  hue: string;
  value: number | null;
  onMove: (e: MouseEvent) => void;
  onLeave: () => void;
}) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2.5 flex-1 cursor-default overflow-hidden rounded-full bg-line/60"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${clamp01(v)}%`, background: hue }}
        />
      </div>
      <span className="num w-10 shrink-0 text-right text-[11px] text-ink3">
        {value === null ? "—" : v.toFixed(1)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dispersion strips — "how healthy, how tight". Each field on a shared */
/* 0–100 composite axis: full range (min→max), IQR box (p25→p75),       */
/* median tick, and each member composite as a dot. Two strips stacked  */
/* so the cohesion of one field vs the spread of the other is visible.  */
/* ------------------------------------------------------------------ */

export interface DispersionField {
  label: string;
  hue: string;
  members: { symbol: string; composite: number }[];
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  stdDev: number;
  iqr: number;
}

export function DispersionStrips({ fields }: { fields: DispersionField[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(ref);

  return (
    <div ref={ref} className="relative space-y-5">
      <ChartTooltip tip={tip} />
      {fields.map((f) => (
        <div key={f.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.hue }} />
              <span className="num text-xs font-medium text-ink2">{f.label}</span>
            </div>
            <span className="num text-[11px] text-ink3">
              median {f.median.toFixed(1)} · σ {f.stdDev.toFixed(1)} · IQR {f.iqr.toFixed(1)}
            </span>
          </div>
          <div className="relative h-9 rounded-lg border border-line bg-surface-1">
            {/* full range line */}
            <div
              className="absolute top-1/2 h-px -translate-y-1/2"
              style={{
                left: `${clamp01(f.min)}%`,
                width: `${clamp01(f.max) - clamp01(f.min)}%`,
                background: "var(--line3)",
              }}
            />
            {/* IQR box */}
            <div
              className="absolute top-1/2 h-4 -translate-y-1/2 cursor-default rounded-sm"
              style={{
                left: `${clamp01(f.p25)}%`,
                width: `${Math.max(0.5, clamp01(f.p75) - clamp01(f.p25))}%`,
                background: f.hue,
                opacity: 0.18,
              }}
              onMouseMove={(e) =>
                show(
                  e,
                  <TipBody
                    title={`${f.label} · middle 50%`}
                    rows={[
                      { label: "p25", value: f.p25.toFixed(1) },
                      { label: "p75", value: f.p75.toFixed(1) },
                      { label: "IQR", value: f.iqr.toFixed(1) },
                    ]}
                  />,
                )
              }
              onMouseLeave={hide}
            />
            {/* member dots */}
            {f.members.map((m, i) => (
              <span
                key={`${m.symbol}-${i}`}
                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-full"
                style={{ left: `${clamp01(m.composite)}%`, background: f.hue, opacity: 0.85 }}
                onMouseMove={(e) =>
                  show(
                    e,
                    <TipBody
                      title={m.symbol}
                      rows={[
                        { label: "Field", value: f.label },
                        { label: "Composite", value: m.composite.toFixed(1) },
                      ]}
                    />,
                  )
                }
                onMouseLeave={hide}
              />
            ))}
            {/* median tick */}
            <div
              className="absolute top-1 bottom-1 w-[2px] -translate-x-1/2 cursor-default rounded-full"
              style={{ left: `${clamp01(f.median)}%`, background: f.hue }}
              onMouseMove={(e) =>
                show(
                  e,
                  <TipBody
                    title={`${f.label} · median`}
                    rows={[{ label: "Composite", value: f.median.toFixed(1) }]}
                  />,
                )
              }
              onMouseLeave={hide}
            />
          </div>
        </div>
      ))}
      {/* shared axis */}
      <div className="relative h-4 text-[10px] text-ink3">
        {[0, 25, 50, 75, 100].map((t) => (
          <span
            key={t}
            className="num absolute -translate-x-1/2"
            style={{ left: `${t}%` }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Metric distribution — per sector-specific metric, each field's members */
/* spread across the metric's condition bands (Excellent→Distress) as a   */
/* stacked bar. Only ever rendered when families MATCH (same metric set).  */
/* ------------------------------------------------------------------ */

const METRIC_BAND_ORDER: MetricBand[] = [
  "excellent",
  "good",
  "acceptable",
  "concerning",
  "distress",
];

export function MetricBandLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink3">
      {METRIC_BAND_ORDER.map((mb) => (
        <span key={mb} className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", METRIC_BAND_META[mb].dot)} />
          {METRIC_BAND_META[mb].label}
        </span>
      ))}
    </div>
  );
}

function StackedBandBar({
  label,
  hue,
  bars,
  peer,
  unit,
  show,
  hide,
}: {
  label: string;
  hue: string;
  bars: PeerMetricDistribution["bars"];
  peer: PeerMetricDistribution["peer"];
  unit?: string;
  show: ShowFn;
  hide: () => void;
}) {
  const total = bars ? sumVals(bars) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: hue }} />
          <span className="num text-[11px] font-medium text-ink2">{label}</span>
        </span>
        {peer?.usable && (
          <span className="num text-[11px] text-ink3">
            peer μ {peer.mean.toFixed(1)}
            {unit ? unit : ""} · σ {peer.stdDev.toFixed(1)}
          </span>
        )}
      </div>
      {bars && total > 0 ? (
        <div className="flex h-3 overflow-hidden rounded-full bg-line/60">
          {METRIC_BAND_ORDER.map((mb) => {
            const c = bars[mb] ?? 0;
            if (c === 0) return null;
            const pct = (c / total) * 100;
            return (
              <div
                key={mb}
                className={cn("h-full cursor-default", METRIC_BAND_META[mb].dot)}
                style={{ width: `${pct}%` }}
                onMouseMove={(e) =>
                  show(
                    e,
                    <TipBody
                      title={`${label} · ${METRIC_BAND_META[mb].label}`}
                      rows={[
                        { label: "Members", value: String(c) },
                        { label: "Share", value: `${pct.toFixed(0)}%` },
                      ]}
                    />,
                  )
                }
                onMouseLeave={hide}
              />
            );
          })}
        </div>
      ) : (
        <div className="h-3 rounded-full border border-dashed border-line2" />
      )}
    </div>
  );
}

/** One metric row — the metric's label + both fields' band-distribution bars stacked.
 *  Aligned by metricKey (same-family guarantee that both fields carry this metric). */
export function MetricDistRow({
  metricKey,
  a,
  b,
  aLabel,
  bLabel,
}: {
  metricKey: string;
  a: PeerMetricDistribution | null;
  b: PeerMetricDistribution | null;
  aLabel: string;
  bLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(ref);
  const meta = getMetricLabel(metricKey);
  return (
    <div ref={ref} className="relative rounded-xl border border-line bg-surface-1 p-4">
      <ChartTooltip tip={tip} />
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{meta.label}</span>
        <span className="num text-[10px] uppercase tracking-wider text-ink3">{metricKey}</span>
      </div>
      <div className="space-y-2">
        <StackedBandBar
          label={aLabel}
          hue={A_HUE}
          bars={a?.bars ?? null}
          peer={a?.peer ?? null}
          unit={meta.unit}
          show={show}
          hide={hide}
        />
        <StackedBandBar
          label={bLabel}
          hue={B_HUE}
          bars={b?.bars ?? null}
          peer={b?.peer ?? null}
          unit={meta.unit}
          show={show}
          hide={hide}
        />
      </div>
    </div>
  );
}

/** A single field's metric distribution — used in the cross-family case, where the two
 *  fields' metric SETS differ and must NOT be aligned. Shown in its own labeled panel. */
export function SingleMetricDist({
  metricKey,
  dist,
  hue,
}: {
  metricKey: string;
  dist: PeerMetricDistribution;
  hue: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(ref);
  const meta = getMetricLabel(metricKey);
  return (
    <div ref={ref} className="relative rounded-xl border border-line bg-surface-1 p-4">
      <ChartTooltip tip={tip} />
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{meta.label}</span>
        <span className="num text-[10px] uppercase tracking-wider text-ink3">{metricKey}</span>
      </div>
      <StackedBandBar
        label="Distribution"
        hue={hue}
        bars={dist.bars}
        peer={dist.peer}
        unit={meta.unit}
        show={show}
        hide={hide}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function LegendDots({ aLabel, bLabel }: { aLabel: string; bLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-ink3">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: A_HUE }} />
        <span className="font-medium text-ink2">{aLabel}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: B_HUE }} />
        <span className="font-medium text-ink2">{bLabel}</span>
      </span>
    </div>
  );
}
