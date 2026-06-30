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
  MetricBand,
  PillarLensPattern,
  LensRead,
  TrajectorySection as TTrajectory,
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
  shortPeriod,
  LensChip,
  LensPatternPill,
  MetricStateChip,
  lensAccentKey,
  lensAccentVars,
} from "./shared";
import { MetricModal } from "./metric-modal";

// ── per-pillar change indicator (Feature A — fills the reserved header slot) ───────
// Quarterly delta derived FRONTEND-SIDE from trajectory.series (last point vs prior),
// plus the prior period. Ownership prefers a recent corporate event when one exists.
// Descriptive history only — never a forecast. Negative is NOT auto-red (directional
// context, not alarm). Market is a quarterly delta today; it upgrades to a session
// delta automatically when a daily Market score lands (same series, finer points).
interface PillarChange {
  kind: "delta" | "unchanged" | "event" | "none";
  delta?: number;
  sincePeriod?: string;
  eventType?: string;
  eventDate?: string;
}

function computePillarChanges(trajectory: TTrajectory | null): Record<PillarKey, PillarChange> {
  const none: PillarChange = { kind: "none" };
  const out: Record<PillarKey, PillarChange> = {
    foundation: none, momentum: none, market: none, ownership: none,
  };
  const s = trajectory?.series ?? [];
  if (s.length < 2) return out; // no prior quarter → honest-empty ("no prior quarter")
  const last = s[s.length - 1];
  const prior = s[s.length - 2];
  const since = shortPeriod(prior.periodKey);
  const mk = (curr: number, prev: number): PillarChange => {
    const d = Math.round((curr - prev) * 10) / 10;
    return Math.abs(d) < 0.05
      ? { kind: "unchanged", sincePeriod: since }
      : { kind: "delta", delta: d, sincePeriod: since };
  };
  out.foundation = mk(last.foundation, prior.foundation);
  out.momentum = mk(last.momentum, prior.momentum);
  out.market = mk(last.market, prior.market);
  const ev = trajectory && trajectory.events.length ? trajectory.events[trajectory.events.length - 1] : null;
  out.ownership = ev
    ? { kind: "event", eventType: ev.eventType, eventDate: ev.eventDate }
    : mk(last.ownership, prior.ownership);
  return out;
}

function ChangeChip({ change }: { change?: PillarChange }) {
  if (!change || change.kind === "none")
    return <span className="shrink-0 text-[10px] text-ink3">no prior quarter</span>;
  if (change.kind === "event")
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line2 bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink2">
        <Icons.spark className="h-2.5 w-2.5 text-p-own" />
        event · <span className="num">{change.eventDate}</span>
      </span>
    );
  if (change.kind === "unchanged")
    return <span className="shrink-0 text-[10px] text-ink3">unchanged since {change.sincePeriod}</span>;
  const up = (change.delta ?? 0) > 0;
  // Neutral tone — directional arrow only, never red/green alarm.
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line2 bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink2"
      title={`vs ${change.sincePeriod}`}
    >
      <span className="num font-medium">{up ? "+" : ""}{change.delta?.toFixed(1)}</span>
      <span className="text-ink3">{up ? "▲" : "▼"}</span>
      <span className="text-ink3">vs last quarter</span>
    </span>
  );
}

// ── zone descriptor (unchanged) ────────────────────────────────────────────────
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

// ── the secondary "X of N clear their bar" count (now a small detail, not the lead) ──
function clearCount(p: PillarView): string | null {
  if (!p.metrics) return null;
  const scored = p.metrics.filter((m) => m.metricState === "scored");
  if (!scored.length) return null;
  const clearing = scored.filter((m) => m.lens?.l1.state === "above_bar").length;
  return `${clearing} of ${scored.length} clear their bar`;
}

// Non-metric pillar lead line (Market / Ownership — unchanged copy).
function nonMetricLine(p: PillarView): string {
  if (p.state === "unavailable_redistributed")
    return "Unavailable this period — its weight was redistributed across the others.";
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

// ── per-pillar lens verdict (NEW headline for Foundation/Momentum) ────────────────
// Faithful short reads (databank §3.2) for the LP a pillar fired. Field-verdicts (LP2/LP3)
// are CONTEXT — the pill colour resolves neutral/amber via lensAccentKey, never good/bad.
const LP_DESC: Record<string, string> = {
  LP1: "Strong on most metrics — absolutely and versus the field. Genuine breadth.",
  LP2: "Most metrics trail their bars but beat the field — the relative strength is a weak-field artifact.",
  LP3: "Most metrics clear their bars but trail the field — an elite peer group, not a weak stock.",
  LP4: "A majority of metrics are improving against their own history — broad self-improvement.",
  LP5: "A majority of metrics are sliding against their own history — broad self-deterioration.",
  LP6: "Most metrics still clear their bars, but most are declining — strong, but fading.",
};

function PillarVerdict({ p }: { p: PillarView }) {
  const lps = p.lensPillarPatterns;
  const count = clearCount(p);
  const isMetricPillar = p.pillar === "foundation" || p.pillar === "momentum";

  if (isMetricPillar && lps && lps.length) {
    const lead = lps.find((x) => x.role === "top_level") ?? lps[0];
    const v = lensAccentVars(lensAccentKey(lead.tone, lead.fieldVerdict));
    const others = lps.filter((x) => x.id !== lead.id);
    return (
      <div className="mt-2.5">
        <p className="text-[12.5px] font-semibold leading-snug" style={{ color: v.color }}>
          {lead.label}
        </p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-ink2">{lead.verdict ?? LP_DESC[lead.id] ?? ""}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {count && <span className="num text-[10.5px] text-ink3">{count}</span>}
          {others.map((o) => (
            <LensPatternPill key={o.id} label={o.label} tone={o.tone} fieldVerdict={o.fieldVerdict} role={o.role} />
          ))}
        </div>
      </div>
    );
  }

  // Foundation/Momentum with NO LP fired → the count is the honest neutral lead.
  if (isMetricPillar) {
    return (
      <p className="mt-2.5 text-[12px] leading-snug text-ink2">
        {count ? `${count} — a mixed read across its metrics.` : "No scored metrics this period."}
      </p>
    );
  }

  // Market / Ownership — unchanged lead line.
  return <p className="mt-2.5 text-[12px] leading-snug text-ink2">{nonMetricLine(p)}</p>;
}

// ── correct band → fill colour (existing map had stale keys) ──────────────────────
const BAND_FILL: Record<MetricBand, string> = {
  excellent: "var(--c-pristine)",
  good: "var(--c-healthy)",
  acceptable: "var(--c-steady)",
  concerning: "var(--c-below)",
  distress: "var(--c-fragile)",
};

/** KEPT glance primitive: the colored fill bar (raw value's position in its bar range)
 *  + the numeric metricScore beside it, coloured by the metric's band. */
function MetricScoreBar({ m }: { m: MetricView }) {
  const band = m.l1Band ? METRIC_BAND_META[m.l1Band] : null;
  const fill = m.l1Band ? BAND_FILL[m.l1Band] : "var(--ink3)";
  let pos = 0;
  if (m.bars && m.rawValue != null) {
    const denom = m.bars.excellent - m.bars.distress || 1;
    pos = clampPct(((m.rawValue - m.bars.distress) / denom) * 100);
  }
  return (
    <div className="mt-2 flex items-center gap-2.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pos}%`, background: fill }} />
      </div>
      {m.metricScore != null && (
        <span className={cn("num shrink-0 text-[12.5px] font-semibold", band?.text ?? "text-ink2")}>
          {Math.round(m.metricScore)}
        </span>
      )}
    </div>
  );
}

// ── lens chips (vs bar · vs field · vs trend) ─────────────────────────────────────
const L1_LABEL: Record<string, string> = { above_bar: "above", below_bar: "below", not_evaluable: "—" };
const L2_LABEL: Record<string, string> = { above_peer: "above field", near_peer: "at field", below_peer: "below field", not_evaluable: "—" };
const L3_LABEL: Record<string, string> = { improving: "improving", flat: "flat", declining: "declining", not_evaluable: "building history" };

function f1(n: number | null): string {
  return n == null ? "—" : n.toFixed(1);
}

function LensChipRow({ m }: { m: MetricView }) {
  if (!m.lens) return null;
  const { l1, l2, l3 } = m.lens;
  // L1 absolute — OK to hint direction (above=good / below=caution).
  const l1Dot = l1.state === "above_bar" ? "var(--rec)" : l1.state === "below_bar" ? "var(--high)" : undefined;
  // L3 self-trend — improving/declining hinted; flat/building neutral.
  const l3Dot = l3.state === "improving" ? "var(--rec)" : l3.state === "declining" ? "var(--high)" : undefined;
  // L2 field POSITION is context, never good/bad — neutral, no directional hue.
  const l3Eval = l3.evaluable && l3.series.length >= 1;
  const trendDetail = l3Eval && l3.series.length >= 2
    ? `${f1(l3.series[0].rawValue)}→${f1(l3.series[l3.series.length - 1].rawValue)}`
    : undefined;
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1">
      {l1.evaluable && (
        <LensChip label="vs bar" state={L1_LABEL[l1.state]} detail={l1.referenceValue != null ? `bar ${f1(l1.referenceValue)}` : undefined} dotColor={l1Dot} />
      )}
      {/* vs field renders NOTHING when L2 not_evaluable (trap 3 — never a fabricated field read). */}
      {l2.evaluable && (
        <LensChip label="vs field" state={L2_LABEL[l2.state]} detail={l2.referenceValue != null ? `μ ${f1(l2.referenceValue)}` : undefined} dotColor="var(--ctx)" />
      )}
      {/* vs trend reads its state from l3.evaluable (trap 1) — building-history is the COMMON calm case (trap 2). */}
      <LensChip
        label="vs trend"
        state={l3.evaluable ? L3_LABEL[l3.state] : "building history"}
        detail={trendDetail}
        muted={!l3.evaluable}
        dotColor={l3Dot}
      />
    </div>
  );
}

// ── one metric row: scored (clickable → modal) OR honest-empty (dimmed, not clickable) ──
function honestReason(m: MetricView): string {
  if (m.suppressionReason) return m.suppressionReason;
  switch (m.metricState) {
    case "no_bar": return "No bar set — can't be scored on an absolute scale.";
    case "normalized_out": return "Normalized out of the pillar this period.";
    case "data_unavailable": return "Not scored this period — the value was unavailable.";
    default: return "Not scored this period.";
  }
}

function ScoredMetricRow({ m, pillarLabel }: { m: MetricView; pillarLabel: string }) {
  const meta = getMetricLabel(m.metricKey);
  return (
    <MetricModal m={m} pillarLabel={pillarLabel}>
      <button
        type="button"
        className="group block w-full cursor-pointer border-t border-line py-3 text-left transition-colors first:border-t-0 hover:bg-surface-2/60"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[12.5px] font-medium text-ink">{meta.label}</span>
            <span className="num text-[9.5px] uppercase tracking-wider text-ink3">{m.metricKey}</span>
          </span>
          {/* RAW VALUE = hero */}
          <span className="num shrink-0 text-[18px] font-semibold leading-none text-ink">
            {m.rawValue != null ? fmt(m.rawValue, 2) : "—"}
            {meta.unit ? <span className="ml-0.5 text-[10px] font-normal text-ink3">{meta.unit}</span> : null}
          </span>
        </div>

        <MetricScoreBar m={m} />
        <LensChipRow m={m} />

        {m.lensPattern && (
          <div className="mt-2 flex items-center gap-2">
            <LensPatternPill
              label={m.lensPattern.label}
              tone={m.lensPattern.tone}
              fieldVerdict={m.lensPattern.fieldVerdict}
              role={m.lensPattern.role}
            />
            <Icons.caretRight className="ml-auto h-3 w-3 text-ink3 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </button>
    </MetricModal>
  );
}

function HonestEmptyMetricRow({ m }: { m: MetricView }) {
  const meta = getMetricLabel(m.metricKey);
  return (
    <div className="border-t border-line py-3 opacity-60 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-[12.5px] font-medium text-ink2">{meta.label}</span>
          <span className="num text-[9.5px] uppercase tracking-wider text-ink3">{m.metricKey}</span>
        </span>
        <span className="num shrink-0 text-[15px] font-medium text-ink3">
          {m.rawValue != null ? fmt(m.rawValue, 2) : "—"}
        </span>
      </div>
      {/* empty DASHED bar track — never a coloured fill (no score to show) */}
      <div className="mt-2 h-1.5 w-full rounded-full border border-dashed border-line2" />
      <div className="mt-2 flex items-center gap-2">
        <MetricStateChip state={m.metricState} />
      </div>
      <p className="mt-1.5 text-[11px] italic text-ink3">{honestReason(m)}</p>
    </div>
  );
}

function MetricRow({ m, pillarLabel }: { m: MetricView; pillarLabel: string }) {
  return m.metricState === "scored"
    ? <ScoredMetricRow m={m} pillarLabel={pillarLabel} />
    : <HonestEmptyMetricRow m={m} />;
}

// ── market sub-components (UNCHANGED) ───────────────────────────────────────────
function MarketSubRow({ s }: { s: MarketSubView }) {
  const band = s.band ? METRIC_BAND_META[s.band] : null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex shrink-0 items-baseline gap-1">
          <span className="text-[11.5px] font-medium text-ink2">{getMarketSubLabel(s.subComponent).label}</span>
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
      <span className="num shrink-0 text-[12px] text-ink">{s.rawValue != null ? fmt(s.rawValue, 2) : "—"}</span>
    </div>
  );
}

// ── ownership flow lanes (UNCHANGED) ────────────────────────────────────────────
const FLOW_LABEL: Record<FlowCategoryView["category"], string> = {
  A_promoter: "Promoter",
  B_institutional: "Institutional",
  C_insider: "Insider",
  D_block: "Block / bulk",
};
const TREND_GLYPH: Record<string, string> = { three_up: "↑↑↑", three_down: "↓↓↓", mixed: "↕", neutral: "→" };

function FlowLane({ f }: { f: FlowCategoryView }) {
  const dormant = f.categoryState !== "scored";
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[11.5px]", dormant ? "border-dashed border-line2 text-ink3" : "border-line bg-surface-2 text-ink2")}>
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
          <span className={cn("num", o.pledgingAdjustment < 0 ? "text-fragile" : "text-ink")}>{fmt(o.pledgingAdjustment, 2)}</span>
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
        <div className="space-y-1.5">{o.flowCategories.map((f) => <FlowLane key={f.category} f={f} />)}</div>
      </div>
      <div className="flex justify-between border-t border-line pt-2.5 font-semibold text-ink">
        <span>Final ownership</span>
        <span className="num">{fmt(o.finalOwnership)}</span>
      </div>
    </div>
  );
}

// ── pillar card ───────────────────────────────────────────────────────────────
function PillarBody({ p, pillarLabel, twoCol }: { p: PillarView; pillarLabel: string; twoCol?: boolean }) {
  if (p.metrics && p.metrics.length) {
    return twoCol ? (
      <div className="grid grid-cols-2 gap-x-6 divide-x divide-line">
        <div>{p.metrics.filter((_, i) => i % 2 === 0).map((m) => <MetricRow key={m.metricKey} m={m} pillarLabel={pillarLabel} />)}</div>
        <div className="pl-6">{p.metrics.filter((_, i) => i % 2 === 1).map((m) => <MetricRow key={m.metricKey} m={m} pillarLabel={pillarLabel} />)}</div>
      </div>
    ) : (
      <div>{p.metrics.map((m) => <MetricRow key={m.metricKey} m={m} pillarLabel={pillarLabel} />)}</div>
    );
  }
  if (p.marketSubs && p.marketSubs.length) return <div>{p.marketSubs.map((s) => <MarketSubRow key={s.subComponent} s={s} />)}</div>;
  if (p.ownership) return <OwnershipBlock o={p.ownership} />;
  return <p className="py-3 text-[12px] text-ink3">No detail rows for this pillar.</p>;
}

function PillarCard({ p, featured, open, onToggle, change }: { p: PillarView; featured?: boolean; open: boolean; onToggle: () => void; change?: PillarChange }) {
  const meta = PILLAR_META[p.pillar];
  const zone = zoneDescriptor(p);
  const redistributed = p.state === "unavailable_redistributed";

  return (
    <div
      className={cn("lift flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-1", featured && "lg:col-span-3")}
      style={{ borderTop: `2px solid ${meta.cssVar}` }}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3.5 p-4 text-left">
        <PillarGauge score={p.subtotal} color={meta.cssVar} size={featured ? 70 : 62} />
        <div className="min-w-0 flex-1">
          {/* header row — label + weight on the left, per-pillar change chip on the right */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] font-semibold">
              <span className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-sm", meta.dot)} />
                {meta.label}
              </span>
              <span className="text-[10px] font-normal text-ink3">
                {(p.appliedWeight * 100).toFixed(0)}%
                {p.appliedWeight !== p.nominalWeight && ` (nom ${(p.nominalWeight * 100).toFixed(0)})`}
              </span>
              {redistributed && <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[9px] text-ink3">redistributed</span>}
            </div>
            <ChangeChip change={change} />
          </div>
          <div className={cn("mt-1.5 text-[10.5px]", zone.cls)}>{zone.text}</div>
          {/* lens verdict line — the headline (reads backend-composed pattern.verdict) */}
          <PillarVerdict p={p} />
          <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-ink3">
            {open ? "Hide metrics" : "Metrics & lenses"}
            <Icons.caretDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-line px-4 pb-4 pt-1">
          <PillarBody p={p} pillarLabel={meta.label} twoCol={featured} />
        </div>
      )}
    </div>
  );
}

// ── section ───────────────────────────────────────────────────────────────────
const COMPACT_ORDER: PillarKey[] = ["momentum", "market", "ownership"];

export function AnatomySection({ pillars, trajectory }: { pillars: PillarView[]; trajectory?: TTrajectory | null }) {
  const foundation = pillars.find((p) => p.pillar === "foundation");
  const compact = COMPACT_ORDER.map((k) => pillars.find((p) => p.pillar === k)).filter(
    (p): p is PillarView => Boolean(p),
  );
  const changes = computePillarChanges(trajectory ?? null);

  // Per-card open state (independent toggle per pillar). Foundation opens by default.
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set(["foundation"]));
  const toggle = (key: string) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  // Even-height stretch applies to the COLLAPSED compact row only — when one compact card
  // is open it sizes to its own content and siblings must NOT stretch up to match it.
  const anyCompactOpen = compact.some((p) => openSet.has(p.pillar));

  return (
    <section>
      <SectionEyebrow label="Anatomy" icon={Icons.stack} accent="var(--p-found)" pill="4 pillars · tap a metric for its lenses" />
      <div className="space-y-3.5">
        {foundation && (
          <Reveal>
            <PillarCard p={foundation} featured open={openSet.has(foundation.pillar)} onToggle={() => toggle(foundation.pillar)} change={changes[foundation.pillar]} />
          </Reveal>
        )}
        <div className={cn("grid gap-3.5 md:grid-cols-2 lg:grid-cols-3", anyCompactOpen ? "items-start" : "items-stretch")}>
          {compact.map((p, i) => (
            <Reveal key={p.pillar} delay={i * 0.06} className={anyCompactOpen ? undefined : "h-full"}>
              <PillarCard p={p} open={openSet.has(p.pillar)} onToggle={() => toggle(p.pillar)} change={changes[p.pillar]} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export type { LensRead, PillarLensPattern };
