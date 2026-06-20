"use client";

import { useState } from "react";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { getMetricLabel } from "@/lib/health/metric-labels";
import { SectionEyebrow, PILLAR_META } from "./shared";
import type { PillarView, MetricView, MetricBand, PillarKey, BarDirection } from "@/types/health";

const METRIC_BAND_VAR: Record<MetricBand, string> = {
  excellent: "var(--c-pristine)",
  good: "var(--c-healthy)",
  acceptable: "var(--c-steady)",
  concerning: "var(--c-below)",
  distress: "var(--c-fragile)",
};

function fmtVal(v: number, unit?: string): string {
  const d = unit === "×" || unit === "ratio" ? 2 : Math.abs(v) >= 100 ? 0 : 1;
  return v.toFixed(d);
}
const fmtScore = (v: number | null) => (v == null ? "—" : v.toFixed(1));

interface Row {
  pillar: PillarKey;
  m: MetricView;
}

type SortKey = "metric" | "raw" | "score" | "l2" | "l3";

function sortVal(r: Row, key: SortKey): number | string {
  switch (key) {
    case "metric":
      return getMetricLabel(r.m.metricKey).label.toLowerCase();
    case "raw":
      return r.m.rawValue;
    case "score":
      return r.m.metricScore;
    case "l2":
      return r.m.l2Score ?? -Infinity;
    case "l3":
      return r.m.l3Score ?? -Infinity;
  }
}

export function RawFloorSection({ pillars }: { pillars: PillarView[] }) {
  const [open, setOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows: Row[] = [];
  for (const p of pillars) {
    if (p.metrics) for (const m of p.metrics) rows.push({ pillar: p.pillar, m });
  }

  const sorted = [...rows].sort((a, b) => {
    const av = sortVal(a, sortKey);
    const bv = sortVal(b, sortKey);
    if (typeof av === "string" || typeof bv === "string") {
      return av < bv ? -sortDir : av > bv ? sortDir : 0;
    }
    return (av - bv) * sortDir;
  });

  const onSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(key === "metric" ? 1 : -1);
    }
    setExpanded(null);
  };

  if (rows.length === 0) return null;

  const cols: { key: SortKey; label: string; align: "left" | "right" }[] = [
    { key: "metric", label: "Metric", align: "left" },
    { key: "raw", label: "Raw", align: "right" },
    { key: "score", label: "Score", align: "right" },
    { key: "l2", label: "Peer-Z", align: "right" },
    { key: "l3", label: "Trend", align: "right" },
  ];

  return (
    <section className="mt-2">
      <SectionEyebrow label="The underlying record" pill="every number behind the score" />
      <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-3 text-ink2">
            <Icons.stack className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-[14px] font-semibold text-ink">Show the underlying data</span>
            <span className="block text-[12px] text-ink3">
              Every scored metric, its raw value, the data-derived bands it was measured against, and
              the three lenses behind its score — sortable, on demand.
            </span>
          </span>
          <Icons.caretDown className={cn("size-5 shrink-0 text-ink3 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="px-5 pb-5">
            <p className="pb-3 text-[11px] italic text-ink3">
              Click any metric to expand its full lens breakdown. Quarterly/annual reported series per
              metric is a later enrichment — current-period values shown.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    {cols.map((c) => (
                      <th
                        key={c.key}
                        onClick={() => onSort(c.key)}
                        className={cn(
                          "cursor-pointer select-none whitespace-nowrap border-b border-line2 px-3 py-2.5 text-[9.5px] font-semibold uppercase tracking-wide text-ink3 hover:text-ink2",
                          c.align === "left" ? "text-left" : "text-right",
                        )}
                      >
                        {c.label}{" "}
                        {sortKey === c.key && <span className="text-steady">{sortDir < 0 ? "▼" : "▲"}</span>}
                      </th>
                    ))}
                    <th className="border-b border-line2 px-3 py-2.5 text-right text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                      State
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <MetricRow
                      key={r.m.metricKey}
                      r={r}
                      isExp={expanded === r.m.metricKey}
                      onToggle={() =>
                        setExpanded((e) => (e === r.m.metricKey ? null : r.m.metricKey))
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10.5px] text-ink3">
              Market sub-components and the ownership ledger are detailed in the Anatomy section above —
              this floor covers the metric-scored pillars (Foundation &amp; Momentum).
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function BandChip({ band }: { band: MetricBand | null }) {
  if (!band) return <span className="text-ink3">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink2">
      <span className="size-2 rounded-sm" style={{ background: METRIC_BAND_VAR[band] }} />
      {band}
    </span>
  );
}

function MetricRow({ r, isExp, onToggle }: { r: Row; isExp: boolean; onToggle: () => void }) {
  const m = r.m;
  const meta = getMetricLabel(m.metricKey);
  const dim = m.scoreState !== "scored";
  return (
    <>
      <tr className={cn("hover:bg-surface-2", dim && "opacity-60")}>
        <td
          onClick={onToggle}
          className="cursor-pointer whitespace-nowrap border-b border-line px-3 py-2.5 text-left"
        >
          <span className="mr-1 text-[10px] text-ink3">{isExp ? "▾" : "▸"}</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ background: PILLAR_META[r.pillar].cssVar }} />
            <span className="font-medium text-ink">{meta.label}</span>
            <span className="num text-[9px] uppercase tracking-wider text-ink3">{m.metricKey}</span>
          </span>
        </td>
        <td className="num border-b border-line px-3 py-2.5 text-right text-ink2">
          {fmtVal(m.rawValue, meta.unit)}
        </td>
        <td className="num border-b border-line px-3 py-2.5 text-right font-medium text-ink">
          {Math.round(m.metricScore)}
        </td>
        <td className="num border-b border-line px-3 py-2.5 text-right text-ink2">{fmtScore(m.l2Score)}</td>
        <td className="num border-b border-line px-3 py-2.5 text-right text-ink2">{fmtScore(m.l3Score)}</td>
        <td className="border-b border-line px-3 py-2.5 text-right">
          <BandChip band={m.l1Band} />
        </td>
      </tr>
      {isExp && (
        <tr>
          <td colSpan={6} className="border-b border-line2 bg-surface-2 p-0">
            <LensDetail r={r} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── lens breakdown (L1 bars · L2 peer · L3 trend) ───────────────────────────────
function bandOfValue(v: number, bars: NonNullable<MetricView["bars"]>, dir: BarDirection): MetricBand {
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

function LensBar({ m }: { m: MetricView }) {
  const bars = m.bars;
  if (!bars) return <p className="text-[11.5px] text-ink3">No bar set linked for this metric.</p>;
  const unit = getMetricLabel(m.metricKey).unit;
  const dir = bars.direction;
  const vals = [bars.excellent, bars.good, bars.acceptable, bars.concerning, bars.distress, m.rawValue];
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const pad = span * 0.08;
  const mn = lo - pad;
  const mx = hi + pad;
  const pct = (v: number) => ((v - mn) / (mx - mn)) * 100;

  const cuts = Array.from(new Set([mn, bars.excellent, bars.good, bars.acceptable, bars.concerning, bars.distress, mx]))
    .filter((v) => v >= mn && v <= mx)
    .sort((a, b) => a - b);

  return (
    <div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-3">
        {cuts.slice(0, -1).map((c, i) => {
          const next = cuts[i + 1];
          const mid = (c + next) / 2;
          const band = bandOfValue(mid, bars, dir);
          return (
            <span
              key={i}
              className="absolute top-0 h-full"
              style={{ left: `${pct(c)}%`, width: `${pct(next) - pct(c)}%`, background: METRIC_BAND_VAR[band], opacity: 0.5 }}
            />
          );
        })}
        {/* raw marker */}
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink"
          style={{ left: `${pct(m.rawValue)}%`, background: m.l1Band ? METRIC_BAND_VAR[m.l1Band] : "var(--ink3)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink3">
        <span>{dir === "higher_better" ? "Higher is healthier" : "Lower is healthier"}</span>
        <span>·</span>
        <span className="num">raw {fmtVal(m.rawValue, unit)}{unit ? ` ${unit}` : ""}</span>
        <span>·</span>
        <span className="num">
          bars: distress {fmtVal(bars.distress, unit)} · concerning {fmtVal(bars.concerning, unit)} · acceptable{" "}
          {fmtVal(bars.acceptable, unit)} · good {fmtVal(bars.good, unit)} · excellent {fmtVal(bars.excellent, unit)}
        </span>
      </div>
    </div>
  );
}

function LensBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink3">{title}</div>
      {children}
    </div>
  );
}

function LensDetail({ r }: { r: Row }) {
  const m = r.m;
  const unit = getMetricLabel(m.metricKey).unit;
  const peer = m.peer;
  return (
    <div className="grid gap-5 p-4 lg:grid-cols-[1.6fr_1fr]">
      <LensBlock title="L1 — value vs the data-derived bars">
        <LensBar m={m} />
      </LensBlock>

      <div className="flex flex-col gap-4">
        <LensBlock title="L2 — peer-relative">
          {peer && peer.usable ? (
            <div className="num text-[12.5px] text-ink2">
              μ {fmtVal(peer.mean, unit)} · σ {fmtVal(peer.stdDev, unit)} · N {peer.sampleN}
              {peer.stdDev > 0 && (
                <span className="ml-2 text-ink3">
                  z {((m.rawValue - peer.mean) / peer.stdDev).toFixed(2)}
                </span>
              )}
            </div>
          ) : (
            <div className="text-[12px] text-ink3">
              insufficient peers (N={peer?.sampleN ?? 0}) — no peer-Z drawn
            </div>
          )}
        </LensBlock>

        <LensBlock title="L3 — trend">
          <div className="num text-[12.5px] text-ink2">
            {m.l3Score == null ? "— not available" : `score ${m.l3Score.toFixed(1)}`}
            <span className="ml-2 text-[10.5px] text-ink3">(series deferred)</span>
          </div>
        </LensBlock>

        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-2.5 text-[11px] text-ink3">
          <span>state: <span className="text-ink2">{m.scoreState}</span></span>
          <span className="num">weight {(m.effectiveWeight * 100).toFixed(0)}%</span>
          <span className="num">contribution {m.contribution.toFixed(1)}</span>
          {m.suppressionReason && <span className="text-below">· {m.suppressionReason}</span>}
        </div>
      </div>
    </div>
  );
}
