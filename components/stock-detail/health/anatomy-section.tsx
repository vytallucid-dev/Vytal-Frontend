"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Reveal } from "@/components/ui/reveal";
import type {
  PillarView,
  MetricView,
  MarketSubView,
  OwnershipDetail,
  FlowCategoryView,
  PillarKey,
} from "@/types/health";
import { getMetricLabel, getMarketSubLabel } from "@/lib/health/metric-labels";
import {
  SectionEyebrow,
  PILLAR_META,
  METRIC_BAND_META,
  PillarGauge,
  clampPct,
  fmt,
  humanizeKey,
} from "./shared";

// ── zone descriptor ───────────────────────────────────────────────────────────
function zoneDescriptor(p: PillarView): { text: string; cls: string } {
  const pos = p.nativeZone.position;
  if (p.pillar === "market") {
    if (pos === "above_native") return { text: "structure hot — read in context", cls: "text-p-mkt" };
    if (pos === "below_native") return { text: "structure soft", cls: "text-ink2" };
    return { text: "structure neutral", cls: "text-ink2" };
  }
  if (pos === "above_native") return { text: "above its native zone", cls: "text-healthy" };
  if (pos === "below_native") return { text: "below its native zone", cls: "text-high" };
  return { text: "inside its native zone", cls: "text-ink2" };
}

function pillarLine(p: PillarView): string {
  if (p.state === "unavailable_redistributed")
    return "Unavailable this period — its weight was redistributed across the others.";
  if (p.metrics && p.metrics.length) {
    const scored = p.metrics.filter((m) => m.scoreState === "scored");
    const clearing = scored.filter((m) => m.l1Band === "excellent" || m.l1Band === "good").length;
    return `${clearing} of ${scored.length} metrics clear their bar.`;
  }
  if (p.marketSubs && p.marketSubs.length) {
    const avail = p.marketSubs.filter((s) => s.available).length;
    return `${avail} of ${p.marketSubs.length} price sub-components available — a health read of structure, not a timing call.`;
  }
  if (p.ownership) {
    if (p.ownership.r1Fired) return "A holding red flag is firing — see findings.";
    if (p.ownership.pledgingAdjustment < 0) return "Pledging is dragging the holding score.";
    return "Directional flow scoring — who is moving, with or against the floor.";
  }
  return "";
}

// ── metric L1 threshold viz ───────────────────────────────────────────────────
// Band → fill color for the progress bar
const BAND_FILL: Record<string, string> = {
  excellent: "var(--c-pristine)",
  good:      "var(--c-healthy)",
  fair:      "var(--c-steady)",
  poor:      "var(--c-below)",
  distress:  "var(--c-fragile)",
};

function MetricBarViz({ m }: { m: MetricView }) {
  if (!m.bars) return null;
  const { distress, excellent } = m.bars;
  const denom = excellent - distress || 1;
  const pos = clampPct(((m.rawValue - distress) / denom) * 100);
  const fill = m.l1Band ? (BAND_FILL[m.l1Band] ?? "var(--c-steady)") : "var(--ink3)";
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${pos}%`, background: fill }}
      />
    </div>
  );
}

function MetricRow({ m }: { m: MetricView }) {
  const suppressed = m.scoreState !== "scored";
  const band = m.l1Band ? METRIC_BAND_META[m.l1Band] : null;
  return (
    <div className={cn("border-t border-line py-3 first:border-t-0", suppressed && "opacity-60")}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[12.5px] font-medium text-ink">
            {getMetricLabel(m.metricKey).label}
          </span>
          <span className="num text-[10px] uppercase tracking-wider text-ink3">{m.metricKey}</span>
        </span>
        <span className="num text-[12.5px] text-ink">{fmt(m.rawValue, 2)}</span>
      </div>

      {suppressed ? (
        <p className="mt-1.5 text-[11px] italic text-ink3">{m.suppressionReason ?? "suppressed"}</p>
      ) : (
        <>
          <MetricBarViz m={m} />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {band && (
              <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px]", band.text)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", band.dot)} />
                bar · {band.label.toLowerCase()}
              </span>
            )}
            {m.l2Score != null && (
              <span className="rounded-md bg-surface-3 px-2 py-0.5 text-[10px] text-ink2">
                L2 <span className="num">{fmt(m.l2Score)}</span>
              </span>
            )}
            {m.l3Score != null && (
              <span className="rounded-md bg-surface-3 px-2 py-0.5 text-[10px] text-ink2">
                L3 <span className="num">{fmt(m.l3Score)}</span>
              </span>
            )}
          </div>
          <p className="num mt-2 text-[10px] text-ink3">
            score {fmt(m.metricScore)} · wt {(m.effectiveWeight).toFixed(1)}% · contrib {fmt(m.contribution)}
          </p>
        </>
      )}
    </div>
  );
}

// ── market sub-components ──────────────────────────────────────────────────────
function MarketSubRow({ s }: { s: MarketSubView }) {
  const band = s.band ? METRIC_BAND_META[s.band] : null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex shrink-0 items-baseline gap-1">
          <span className="text-[11.5px] font-medium text-ink2">
            {getMarketSubLabel(s.subComponent).label}
          </span>
          <span className="num text-[9.5px] text-ink3">{s.subComponent}</span>
        </span>
        {band && s.available ? (
          <span className={cn("inline-flex items-center gap-1.5 text-[11px]", band.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", band.dot)} />
            {band.label}
          </span>
        ) : (
          <span className="text-[11px] text-ink3">{s.reason ?? "unavailable"}</span>
        )}
        {s.saturated && <span className="rounded bg-steady/10 px-1.5 text-[9px] text-steady">sat</span>}
        {s.capped && <span className="rounded bg-below/10 px-1.5 text-[9px] text-below">capped</span>}
      </div>
      <span className="num shrink-0 text-[12px] text-ink">
        {s.rawValue != null ? fmt(s.rawValue, 2) : "—"}
      </span>
    </div>
  );
}

// ── ownership flow lanes ──────────────────────────────────────────────────────
const FLOW_LABEL: Record<FlowCategoryView["category"], string> = {
  A_promoter: "Promoter",
  B_institutional: "Institutional",
  C_insider: "Insider",
  D_block: "Block / bulk",
};

const TREND_GLYPH: Record<string, string> = {
  three_up: "↑↑↑",
  three_down: "↓↓↓",
  mixed: "↕",
  neutral: "→",
};

function FlowLane({ f }: { f: FlowCategoryView }) {
  const dormant = f.categoryState !== "scored";
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[11.5px]",
        dormant ? "border-dashed border-line2 text-ink3" : "border-line bg-surface-2 text-ink2",
      )}
    >
      <span className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", dormant ? "bg-ink3" : "bg-p-own")} />
        {FLOW_LABEL[f.category]}
      </span>
      {dormant ? (
        <span className="text-[10px] italic">{f.categoryState === "dormant_no_feed" ? "no feed" : "no data"}</span>
      ) : (
        <span className="flex items-center gap-2">
          {f.trendState && <span className="num text-ink2">{TREND_GLYPH[f.trendState] ?? "→"}</span>}
          {f.bandLanded && <span className="text-ink2">{f.bandLanded}</span>}
          <span className="num text-ink">{fmt(f.cappedSubScore, 1)}</span>
        </span>
      )}
    </div>
  );
}

function OwnershipBlock({ o }: { o: OwnershipDetail }) {
  const penalties = [
    o.penalties.r2 && { k: "R2", v: o.penalties.r2 },
    o.penalties.r6 && { k: "R6", v: o.penalties.r6 },
    o.penalties.prolongedFii && { k: "Prolonged FII", v: o.penalties.prolongedFii },
  ].filter(Boolean) as { k: string; v: number }[];

  return (
    <div className="space-y-2.5 text-[12px]">
      <div className="flex justify-between text-ink2">
        <span>Baseline · {humanizeKey(o.baselineReason)}</span>
        <span className="num">{fmt(o.baseline)}</span>
      </div>
      {o.pledgingAdjustment !== 0 && (
        <div className="flex justify-between text-ink2">
          <span>Pledging adjustment</span>
          <span className={cn("num", o.pledgingAdjustment < 0 ? "text-fragile" : "text-ink")}>
            {fmt(o.pledgingAdjustment, 2)}
          </span>
        </div>
      )}
      {penalties.map((p) => (
        <div key={p.k} className="flex justify-between text-ink2">
          <span>{p.k} penalty</span>
          <span className="num text-fragile">{fmt(p.v, 2)}</span>
        </div>
      ))}
      {o.r1Fired && (
        <div className="flex items-center gap-2 rounded-lg border border-crit/40 bg-crit/12 px-3 py-1.5 text-[11px] text-fragile">
          <Icons.warning weight="fill" className="h-3.5 w-3.5 shrink-0" />
          R1 holding flag firing
        </div>
      )}

      <div className="pt-1">
        <div className="kicker mb-2">Directional flow</div>
        <div className="space-y-1.5">
          {o.flowCategories.map((f) => (
            <FlowLane key={f.category} f={f} />
          ))}
        </div>
      </div>

      <div className="flex justify-between border-t border-line pt-2.5 font-semibold text-ink">
        <span>Final ownership</span>
        <span className="num">{fmt(o.finalOwnership)}</span>
      </div>
    </div>
  );
}

// ── pillar card ───────────────────────────────────────────────────────────────
function PillarBody({ p, twoCol }: { p: PillarView; twoCol?: boolean }) {
  if (p.metrics && p.metrics.length) {
    return twoCol ? (
      <div className="grid grid-cols-2 gap-x-6 divide-x divide-line">
        <div>{p.metrics.filter((_, i) => i % 2 === 0).map((m) => <MetricRow key={m.metricKey} m={m} />)}</div>
        <div className="pl-6">{p.metrics.filter((_, i) => i % 2 === 1).map((m) => <MetricRow key={m.metricKey} m={m} />)}</div>
      </div>
    ) : (
      <div>{p.metrics.map((m) => <MetricRow key={m.metricKey} m={m} />)}</div>
    );
  }
  if (p.marketSubs && p.marketSubs.length) return <div>{p.marketSubs.map((s) => <MarketSubRow key={s.subComponent} s={s} />)}</div>;
  if (p.ownership) return <OwnershipBlock o={p.ownership} />;
  return <p className="py-3 text-[12px] text-ink3">No detail rows for this pillar.</p>;
}

function PillarCard({ p, featured, defaultOpen }: { p: PillarView; featured?: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const meta = PILLAR_META[p.pillar];
  const zone = zoneDescriptor(p);
  const redistributed = p.state === "unavailable_redistributed";

  return (
    <div
      className={cn(
        "lift overflow-hidden rounded-2xl border border-line bg-surface-1",
        featured && "lg:col-span-3",
      )}
      style={{ borderTop: `2px solid ${meta.cssVar}` }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3.5 p-4 text-left"
      >
        <PillarGauge score={p.subtotal} color={meta.cssVar} size={featured ? 70 : 62} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[13.5px] font-semibold">
            <span className={cn("h-1.5 w-1.5 rounded-sm", meta.dot)} />
            {meta.label}
            <span className="text-[10px] font-normal text-ink3">
              {(p.appliedWeight * 100).toFixed(0)}%
              {p.appliedWeight !== p.nominalWeight && ` (nom ${(p.nominalWeight * 100).toFixed(0)})`}
            </span>
            {redistributed && (
              <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[9px] text-ink3">redistributed</span>
            )}
          </div>
          <div className={cn("mt-1 text-[10.5px]", zone.cls)}>{zone.text}</div>
          <p className="mt-2.5 text-[12px] leading-snug text-ink2">{pillarLine(p)}</p>
          <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-ink3">
            {open ? "Hide metrics" : "Metrics & lenses"}
            <Icons.caretDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-line px-4 pb-4 pt-1">
          <PillarBody p={p} twoCol={featured} />
        </div>
      )}
    </div>
  );
}

// ── section ───────────────────────────────────────────────────────────────────
const COMPACT_ORDER: PillarKey[] = ["momentum", "market", "ownership"];

export function AnatomySection({ pillars }: { pillars: PillarView[] }) {
  const foundation = pillars.find((p) => p.pillar === "foundation");
  const compact = COMPACT_ORDER.map((k) => pillars.find((p) => p.pillar === k)).filter(
    (p): p is PillarView => Boolean(p),
  );

  return (
    <section>
      <SectionEyebrow label="Anatomy" icon={Icons.stack} accent="var(--p-found)" pill="4 pillars · tap to expand" />
      <div className="space-y-3.5">
        {foundation && (
          <Reveal>
            <PillarCard p={foundation} featured defaultOpen />
          </Reveal>
        )}
        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {compact.map((p, i) => (
            <Reveal key={p.pillar} delay={i * 0.06}>
              <PillarCard p={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
