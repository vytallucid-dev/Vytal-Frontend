"use client";

import { useRef } from "react";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import {
  BAND_META,
  LABEL_BAND_ORDER,
  PILLAR_META,
  Panel,
  SectionEyebrow,
} from "@/components/stock-detail/health/shared";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/ui/chart-tooltip";
import { accentOf, familyOf, findingName } from "@/lib/findings";
import type { UniverseHealthView } from "@/types/universe-view";
import {
  attentionReads,
  computeKpis,
  edgeNames,
  flagLabel,
  pillarMix,
  recoveryMovers,
  sectorExposure,
  universeCharacter,
  weekRead,
  PILLAR_LABEL,
  compositeBand,
  BAND_CUTS,
  formatUniverseMedian,
} from "./lib";
import type { LabelBand } from "@/types/health";

// ── distribution columns (hero) — count-scaled cells per band ─────────────────
// Cell height is derived from the container height + cap so the tallest stack always
// fits inside the card (never overflows the top).
function Distribution({ view }: { view: UniverseHealthView }) {
  const dist = view.aggregate!.bandDistribution;
  const counts = LABEL_BAND_ORDER.map((b) => dist[b]);
  const max = Math.max(...counts, 1);
  const total = counts.reduce((s, n) => s + n, 0) || 1;
  const CAP = 12;
  const COL_H = 118;
  const GAP = 3;
  const cellH = Math.floor((COL_H - (CAP - 1) * GAP) / CAP);
  const chartRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(chartRef);
  return (
    <div ref={chartRef} className="relative w-full min-w-0 flex-[1.3] sm:w-auto sm:min-w-[300px]">
      <ChartTooltip tip={tip} />
      <div className="flex items-end gap-1.5 overflow-hidden" style={{ height: COL_H }}>
        {LABEL_BAND_ORDER.map((band, i) => {
          const n = counts[i];
          const shown = max > CAP ? Math.max(n > 0 ? 1 : 0, Math.round((n / max) * CAP)) : n;
          return (
            <div
              key={band}
              className="flex h-full flex-1 cursor-default flex-col items-center justify-end"
              onMouseMove={(e) =>
                show(
                  e,
                  <TipBody
                    title={BAND_META[band].label}
                    rows={[
                      { label: "Names", value: String(n) },
                      { label: "Share", value: `${((n / total) * 100).toFixed(0)}%` },
                    ]}
                  />,
                )
              }
              onMouseLeave={hide}
            >
              <div className="flex flex-col-reverse items-center" style={{ gap: GAP }}>
                {Array.from({ length: shown }).map((_, k) => (
                  <span
                    key={k}
                    className="w-[17px] rounded-[2.5px] opacity-[0.88]"
                    style={{ height: cellH, background: BAND_META[band].cssVar }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="my-2 h-1 rounded-[3px]"
        style={{
          background:
            "linear-gradient(90deg,var(--c-fragile),var(--c-below),var(--c-steady),var(--c-healthy),var(--c-pristine))",
        }}
      />
      <div className="flex gap-1.5">
        {LABEL_BAND_ORDER.map((band, i) => (
          <div key={band} className="flex-1 text-center text-[10px] text-ink3">
            <span className="num block text-[12.5px] font-medium text-ink">{counts[i]}</span>
            {BAND_META[band].label}
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero({ view }: { view: UniverseHealthView }) {
  const agg = view.aggregate!;
  return (
    <Panel
      className="col-span-12 lg:col-span-8"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--c-pristine) 5%, transparent), transparent 60%), var(--surface)",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2.5">
        <span className="eyebrow">The shape of the scored universe</span>
        <span className="num text-[11px] text-ink2">
          {view.scoredUniverseSize} scored · {view.periodKey}
        </span>
      </div>
      <div className="grid sm:flex flex-wrap items-center gap-6">
        <div className="min-w-[240px] flex-1">
          <h2 className="font-display text-[24px] font-medium leading-[1.15]">
            <span className="num font-medium">{view.scoredUniverseSize}</span> names, this quarter
          </h2>
          <p className="diagnosis mt-1.5 max-w-[42em] text-xs sm:text-[13px] leading-relaxed text-ink2">
            {universeCharacter(view)}
          </p>
          {agg.medianDrift != null && (
            <div className="mt-3.5 flex items-start gap-2 text-[11.5px] leading-snug text-ink2">
              {agg.medianDrift < 0 ? (
                <Icons.trendDown className="mt-0.5 size-3.5 shrink-0 text-ink3" />
              ) : (
                <Icons.trendUp className="mt-0.5 size-3.5 shrink-0 text-ink3" />
              )}
              <span>
                Median composite{" "}
                <span className="num text-ink">{formatUniverseMedian(agg.medianComposite)}</span>, off{" "}
                {/* ⚠ ONE DECIMAL, to match the median in the same sentence. Rounded, "67.5, off −1"
                    implied a prior of 68.5 when it was 68.9 — two precisions in one clause let a
                    reader do arithmetic that does not come out. */}
                <span className="num" style={{ color: agg.medianDrift < 0 ? "var(--high)" : "var(--rec)" }}>
                  {agg.medianDrift > 0 ? "+" : ""}
                  {agg.medianDrift.toFixed(1)}
                </span>{" "}
                from {agg.priorPeriodKey} · spread{" "}
                <span className="num text-ink">
                  {agg.range ? Math.round(agg.range.max.composite - agg.range.min.composite) : 0}
                </span>{" "}
                pts ({agg.range?.min.symbol} → {agg.range?.max.symbol}).
              </span>
            </div>
          )}
        </div>
        <Distribution view={view} />
      </div>
    </Panel>
  );
}

// ── KPI rail ──────────────────────────────────────────────────────────────────
type Tone = "neutral" | "crit" | "rec" | "high" | "ctx";
const TONE_STYLE: Record<Tone, { border: string; bg: string; value: string }> = {
  neutral: { border: "var(--line)", bg: "var(--surface2)", value: "var(--ink)" },
  crit: { border: "var(--crit-bd)", bg: "var(--crit-bg)", value: "var(--crit)" },
  rec: { border: "var(--rec-bd)", bg: "var(--rec-bg)", value: "var(--rec)" },
  high: { border: "var(--high-bd)", bg: "var(--high-bg)", value: "var(--high)" },
  ctx: { border: "var(--ctx-bd)", bg: "var(--ctx-bg)", value: "var(--ink)" },
};

function Kpi({
  value,
  sub,
  label,
  tone = "neutral",
  small,
}: {
  value: React.ReactNode;
  sub?: string;
  label: string;
  tone?: Tone;
  small?: boolean;
}) {
  const t = TONE_STYLE[tone];
  return (
    <div
      className="flex flex-col justify-center rounded-[11px] border px-3.5 py-3"
      style={{ borderColor: t.border, background: t.bg }}
    >
      <div className="num font-medium leading-none" style={{ color: t.value, fontSize: small ? 18 : 23 }}>
        {value}
        {sub && <span className="num ml-1.5 text-[12px] text-ink2">{sub}</span>}
      </div>
      <div className="mt-1.5 text-[10.5px] leading-tight text-ink3">{label}</div>
    </div>
  );
}

function KpiRail({ view }: { view: UniverseHealthView }) {
  const k = computeKpis(view);
  return (
    <div className="col-span-12 lg:col-span-4">
      <div className="grid h-full grid-cols-2 gap-2.5">
        {/* ⚠ ONE DECIMAL, because the band label sits RIGHT NEXT TO IT. Rounded, this read
            "68 · Steady" — and 68 is the Healthy floor on the scale the methodology page publishes.
            See formatUniverseMedian in ./lib for why the number moved rather than the label. */}
        <Kpi value={formatUniverseMedian(k.median)} sub={BAND_META[k.medianBand].label} label="median composite" />
        <Kpi
          value={k.drift == null ? "—" : `${k.drift > 0 ? "+" : ""}${k.drift.toFixed(1)}`}
          tone={k.drift != null && k.drift < 0 ? "high" : "neutral"}
          label={`drift vs ${k.priorPeriodKey ?? "prior"}`}
        />
        <Kpi value={k.eased} sub={`/ ${k.firmed} up`} tone="high" label="eased this quarter" />
        <Kpi
          value={k.redFlags}
          tone={k.redFlags > 0 ? "crit" : "neutral"}
          label={k.redFlags === 1 ? "red flag · watch with care" : "red flags · watch with care"}
        />
        <Kpi value={k.recovering.length} tone="rec" label="recovering from weakness" />
        {/* ⚠ THIRD CORRECTION TO THIS ONE TILE, AND THE SHAPE OF THE THIRD IS THE POINT.
            It first read "wide pillar spread (≥25)" — a threshold typed into copy, stale the moment
            Phase 2 moved the cut. The number was dropped; the LABEL survived, still describing a
            gap size. Then the payload itself changed: `divergence.flag` / `.gap` are gone, replaced
            by `{ headline, spread }`, and lib.ts migrated `wideSpread` → `patternsFiring` (members
            whose headline is `patterns_firing`) WITHOUT this call site following — so the tile read
            a property that no longer exists and the file did not compile.
            What it counts now is names with A DIVERGENCE PATTERN FIRING: not a gap, not a size, and
            no threshold at all. The sibling AttentionCard below already says exactly that, and the
            two now agree because they read the same field through the same helper. */}
        <Kpi value={k.patternsFiring} tone="ctx" label="with a divergence pattern firing" />
      </div>
    </div>
  );
}

// ── pillar mix ──────────────────────────────────────────────────────────────
function PillarMix({ view }: { view: UniverseHealthView }) {
  const { rows, soft, firm } = pillarMix(view.aggregate!);
  return (
    <Panel className="col-span-12 md:col-span-6 lg:col-span-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">The universe&apos;s dimensions</span>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => {
          const meta = PILLAR_META[r.key];
          return (
            <div key={r.key} title={`${meta.label}: median ${Math.round(r.value)}${r.isSoft ? " · soft spot" : ""}`}>
              <div className="mb-1.5 flex justify-between text-[12px]">
                <span className="flex items-center gap-1.5">
                  <span className="size-[7px] rounded-[2px]" style={{ background: meta.cssVar }} />
                  {meta.label}
                  {r.isSoft && (
                    <span
                      className="ml-1 rounded-[4px] px-1.5 py-px text-[9px] uppercase tracking-wide"
                      style={{ color: "var(--high)", background: "var(--high-bg)" }}
                    >
                      soft spot
                    </span>
                  )}
                </span>
                <span className="num text-ink2">{Math.round(r.value)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[4px] bg-surface-3">
                <div className="h-full rounded-[4px]" style={{ width: `${r.value}%`, background: meta.cssVar }} />
              </div>
            </div>
          );
        })}
      </div>
      {/* ⚠ BOTH ENDS ARE READ OFF THE MEDIANS. The second clause used to say "while ownership
          floors hold highest" — a hardcoded claim about a pillar the function never checked. It is
          true today and would have gone on being printed on the day it stopped being, directly
          under bars showing otherwise. Same defect as the retired threshold in KpiRail: a fact
          typed into copy cannot follow the engine. */}
      <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-snug text-ink2">
        <span className="font-medium text-ink">{PILLAR_LABEL[soft]} is the soft spot</span> — the
        median {PILLAR_LABEL[soft].toLowerCase()} read sits lowest across the universe, while{" "}
        {PILLAR_LABEL[firm].toLowerCase()} holds highest.
      </p>
    </Panel>
  );
}

// ── movers ──────────────────────────────────────────────────────────────────
function MoverSpark({ from, to }: { from: number; to: number }) {
  const up = to >= from;
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const rng = hi - lo || 1;
  const y = (v: number) => 16 - ((v - lo) / rng) * 12 - 2;
  return (
    <svg viewBox="0 0 120 20" preserveAspectRatio="none" className="h-5 flex-1">
      <polyline
        points={`2,${y(from).toFixed(1)} 118,${y(to).toFixed(1)}`}
        fill="none"
        stroke={up ? "var(--rec)" : "var(--high)"}
        strokeWidth={1.8}
      />
    </svg>
  );
}

function MoverRow({
  symbol,
  from,
  to,
  delta,
  onShow,
  onHide,
}: {
  symbol: string;
  from: number;
  to: number;
  delta: number;
  onShow: (e: { clientX: number; clientY: number }, content: React.ReactNode) => void;
  onHide: () => void;
}) {
  const up = delta > 0;
  const toBand = compositeBand(to);
  const crossed = compositeBand(from) !== toBand;
  return (
    <div
      className="flex cursor-default items-center gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-surface-2"
      onMouseMove={(e) =>
        onShow(
          e,
          <TipBody
            title={symbol}
            rows={[
              { label: "Composite", value: `${Math.round(from)} → ${Math.round(to)}` },
              { label: "Change", value: `${up ? "+" : ""}${Math.round(delta)}` },
              { label: "Band", value: `${crossed ? (up ? "↑ " : "↓ ") : ""}${BAND_META[toBand].label}` },
            ]}
          />,
        )
      }
      onMouseLeave={onHide}
    >
      <span className="num w-[88px] shrink-0 text-[12.5px]">{symbol}</span>
      <MoverSpark from={from} to={to} />
      <span
        className="num w-[52px] shrink-0 text-right text-[12.5px]"
        style={{ color: up ? "var(--rec)" : "var(--high)" }}
      >
        {up ? "+" : ""}
        {Math.round(delta)}
      </span>
      <span className="w-[64px] shrink-0 text-right text-[10px] text-ink3">
        {crossed ? (up ? "↑ " : "↓ ") : ""}
        {BAND_META[toBand].label}
      </span>
    </div>
  );
}

function Movers({ view }: { view: UniverseHealthView }) {
  const risers = view.movers.risers.slice(0, 4);
  const slippers = view.movers.slippers.slice(0, 4);
  const chartRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(chartRef);
  return (
    <Panel className="col-span-12 md:col-span-6 lg:col-span-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">Biggest health movers</span>
        <span className="num text-[11px] text-ink3">QoQ · {view.aggregate!.priorPeriodKey} → {view.periodKey}</span>
      </div>
      <div ref={chartRef} className="relative flex flex-col gap-0.5">
        <ChartTooltip tip={tip} />
        <div className="pl-1 text-[10px] uppercase tracking-[0.1em] text-ink3">Firming</div>
        {risers.map((m) => (
          <MoverRow key={m.symbol} symbol={m.symbol} from={m.priorComposite} to={m.composite} delta={m.delta} onShow={show} onHide={hide} />
        ))}
        <div className="mt-2 pl-1 text-[10px] uppercase tracking-[0.1em] text-ink3">Slipping</div>
        {slippers.map((m) => (
          <MoverRow key={m.symbol} symbol={m.symbol} from={m.priorComposite} to={m.composite} delta={m.delta} onShow={show} onHide={hide} />
        ))}
      </div>
    </Panel>
  );
}

// ── exposure (sector composition + heat) ──────────────────────────────────────
function Exposure({ view }: { view: UniverseHealthView }) {
  const secs = sectorExposure(view.members).slice(0, 7);
  const max = Math.max(...secs.map((s) => s.count), 1);
  const weakest = [...secs].sort((a, b) => a.median - b.median)[0];
  const heatColor = (h: string) =>
    h === "hot" ? "var(--c-fragile)" : h === "warm" ? "var(--c-below)" : "var(--p-own)";
  const chartRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(chartRef);
  return (
    <Panel className="col-span-12 lg:col-span-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">Where the weight sits</span>
      </div>
      <div ref={chartRef} className="relative flex flex-col gap-2.5">
        <ChartTooltip tip={tip} />
        {secs.map((s) => (
          <div
            key={s.key}
            className="flex cursor-default items-center gap-2.5 text-[12px]"
            onMouseMove={(e) =>
              show(
                e,
                <TipBody
                  title={s.displayName}
                  rows={[
                    { label: "Names", value: String(s.count) },
                    { label: "Median", value: String(Math.round(s.median)) },
                    { label: "Heat", value: s.heat },
                  ]}
                />,
              )
            }
            onMouseLeave={hide}
          >
            <span className="flex w-[88px] shrink-0 items-center gap-1.5 truncate">
              <span className="size-[7px] shrink-0 rounded-full" style={{ background: heatColor(s.heat) }} />
              <span className="truncate">{s.displayName}</span>
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-[4px] bg-surface-3">
              <span
                className="block h-full rounded-[4px] bg-line3"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </span>
            <span className="num w-7 shrink-0 text-right text-[11.5px] text-ink2">{s.count}</span>
          </div>
        ))}
      </div>
      {weakest && (
        <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-snug text-ink2">
          <span className="font-medium text-ink">
            {weakest.displayName} is the softest pond (median {Math.round(weakest.median)}).
          </span>{" "}
          Read price-linked signals there with care.
        </p>
      )}
    </Panel>
  );
}

// ── attention reads (the quarter, honest counts) ──────────────────────────────
function AttentionCard({
  tone,
  icon,
  count,
  title,
  tag,
  names,
}: {
  tone: Tone;
  icon: React.ReactNode;
  count: number;
  title: string;
  tag: string;
  names: { label: string; note?: string }[];
}) {
  const t = TONE_STYLE[tone];
  return (
    <div
      className="relative mb-2.5 flex items-start gap-3 overflow-hidden rounded-xl border bg-surface-2 px-4 py-3"
      style={{ borderColor: "var(--line)" }}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: t.value }} />
      <span
        className="grid size-8 shrink-0 place-items-center rounded-[9px]"
        style={{ background: t.bg, color: t.value }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13.5px] font-semibold">
            <span className="num" style={{ color: t.value }}>
              {count}
            </span>{" "}
            {title}
          </span>
          <span
            className="ml-auto shrink-0 rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{ background: t.bg, color: t.value }}
          >
            {tag}
          </span>
        </div>
        {names.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {names.map((n) => (
              <span
                key={n.label}
                className="num inline-flex items-center gap-1.5 rounded-md border border-line2 bg-surface-3 px-2 py-1 text-[11px] text-ink"
              >
                {n.label}
                {n.note && <span className="text-[9.5px] text-ink3">{n.note}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Attention({ view }: { view: UniverseHealthView }) {
  const a = attentionReads(view);
  // Name each red-flagged stock's ACTUAL finding from the catalog (flagLabel) instead of the
  // old hardcoded "promoter pledge rising" — which was wrong for every non-pledge red flag.
  const flagNameBySymbol = new Map(
    view.members
      .filter((m) => m.firedFlags.length > 0)
      .map((m) => [m.symbol, m.firedFlags[0] ? flagLabel(m.firedFlags[0].flagKey) : undefined] as const),
  );
  return (
    <div className="col-span-12 lg:col-span-8">
      <SectionEyebrow
        className="mb-3 mt-1"
        label="What the quarter changed"
        icon={Icons.pulse}
        accent="var(--p-mkt)"
        pill="across the scored universe"
      />

      {a.redFlag.count > 0 && (
        <AttentionCard
          tone="crit"
          icon={<Icons.warning className="size-4" />}
          count={a.redFlag.count}
          title={a.redFlag.count === 1 ? "name tripped a red flag" : "names tripped red flags"}
          tag="Watch with care"
          names={a.redFlag.names.map((s) => ({ label: s, note: flagNameBySymbol.get(s) }))}
        />
      )}
      {a.slippingFromHigh.count > 0 && (
        <AttentionCard
          tone="high"
          icon={<Icons.trendDown className="size-4" />}
          count={a.slippingFromHigh.count}
          title="sliding from a high base"
          tag="High"
          names={a.slippingFromHigh.names.map((s) => ({ label: s }))}
        />
      )}
      {a.recovering.count > 0 && (
        <AttentionCard
          tone="rec"
          icon={<Icons.trendUp className="size-4" />}
          count={a.recovering.count}
          title="turning up out of weakness"
          tag="Recovery"
          names={a.recovering.names.map((s) => ({ label: s }))}
        />
      )}
      {a.wideDivergence.count > 0 && (
        <AttentionCard
          tone="ctx"
          icon={<Icons.compare className="size-4" />}
          count={a.wideDivergence.count}
          title="have a divergence pattern firing"
          tag="Context"
          // ⚠ This note used to read "≥25 gap" (stale after Phase 2 moved the material cut to 12),
          //   then dropped the number entirely once that comment was written. It now names the fact
          //   the payload actually carries — that something is firing — rather than a gap size this
          //   aggregate never had. The stock's own row shows the pair and the number.
          names={a.wideDivergence.names.map((s) => ({ label: s }))}
        />
      )}
    </div>
  );
}

// ── ★ THE SPOTLIGHT TRACE — TWO POINTS, BECAUSE TWO IS WHAT THE PAYLOAD HAS ───────────────────────
// This panel used to draw a fixed `points="8,54 95,52 185,40 272,24"` — a FOUR-point curve with an
// inflection dot at the second vertex — identical for every stock, directly above real prose about
// that stock's move. `RecoveryMover` carries exactly `prior` and `current`; the two interior
// vertices and the inflection were invented, and the two band rects sat at hardcoded y-positions
// with no relation to any composite. A reader takes that line as the name's actual path, and on
// every card it was the same fabricated path.
//
// It now draws the two points that exist, on a real composite scale, with the band zones at their
// canonical cuts — so the shading says WHICH BANDS THE MOVE CROSSED instead of decorating it. The
// zones are derived from BAND_CUTS rather than restated, so a cut change moves the chart with it.
const TRACE_W = 280;
const TRACE_H = 70;
const TRACE_PAD = 10;

const BAND_RANGES: { band: LabelBand; from: number; to: number }[] = [
  { band: "fragile", from: 0, to: BAND_CUTS[0].v },
  ...BAND_CUTS.map((c, i) => ({ band: c.band, from: c.v, to: BAND_CUTS[i + 1]?.v ?? 100 })),
];

function RecoveryTrace({ from, to }: { from: number; to: number }) {
  // Padded around the move so the crossed band lines are actually visible, clamped to the scale's
  // real ends — a domain wider than the data would flatten every recovery into the same line.
  const lo = Math.max(0, Math.min(from, to) - 8);
  const hi = Math.min(100, Math.max(from, to) + 8);
  const span = hi - lo || 1;
  const y = (v: number) => TRACE_H - ((v - lo) / span) * TRACE_H;
  const x0 = TRACE_PAD;
  const x1 = TRACE_W - TRACE_PAD;
  return (
    <svg viewBox={`0 0 ${TRACE_W} ${TRACE_H}`} className="block h-auto w-full">
      {BAND_RANGES.map((b) => {
        const top = y(Math.min(b.to, hi));
        const bottom = y(Math.max(b.from, lo));
        if (bottom - top <= 0.5) return null; // band not in view
        return (
          <rect
            key={b.band}
            x="0"
            y={top}
            width={TRACE_W}
            height={bottom - top}
            fill={BAND_META[b.band].cssVar}
            opacity={0.08}
          />
        );
      })}
      <line x1={x0} y1={y(from)} x2={x1} y2={y(to)} stroke="var(--rec)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx={x0} cy={y(from)} r="3.4" fill="var(--rec)" opacity={0.45} />
      <circle cx={x1} cy={y(to)} r="3.4" fill="var(--rec)" />
    </svg>
  );
}

// ── right rail: recovery spotlight + flags-mini + honest week panel ────────────
function RightRail({ view }: { view: UniverseHealthView }) {
  const rec = recoveryMovers(view);
  const spot = rec[0];
  const w = weekRead(view);

  // ── ★ THE SYSTEMIC READ IS DERIVED, NOT ASSERTED ────────────────────────────────────────────────
  // This panel's closing line used to be the hardcoded sentence "No pattern clusters this snapshot —
  // risk here is single-name, not systemic." It was unconditional, and it sat DIRECTLY BENEATH the
  // count of pattern clusters. On the live universe that renders as:
  //
  //     27  Shared patterns across the universe
  //     No pattern clusters this snapshot — risk here is single-name, not systemic.
  //
  // — a panel contradicting its own number, and telling the reader the opposite of what the data
  // says: divergence_S2 fires on 43 of 94 names and D2_price_ahead_trajectory on 19 of 94, both
  // `widespread` by the backend's own reach cut. Third instance of this defect in this file (see the
  // retired "≥25" threshold in KpiRail and the hardcoded "promoter pledge rising" in Attention): a
  // claim typed into copy cannot follow the engine, so it must be computed or it must not be made.
  //
  // ⚠ ADVERSE ONLY, AND THAT IS THE WHOLE POINT OF THE FILTER. `momentum_P12_margin_recovery` is
  // shared by 14 of 94 names and is GOOD NEWS. Counting every shared pattern as evidence of systemic
  // RISK would let a broad recovery read as a broad danger. The tiers come from `accentOf`, the one
  // classifier the Flags tab already uses, so the two surfaces cannot drift apart on what counts as
  // adverse.
  //
  // ⚠ RAW CENSUS, NOT `prepareCensus`. The prepared form is right for the Flags board and wrong
  // here: it consolidates every C-family row into one divergence card whose members are the UNION of
  // all sub-types, taking its accent from the WORST of them. That card would read `high` while its
  // member set also contains names whose only divergence is `S2_sticky` (low, 43 of 94) or a green
  // one — so an "N of 94 adverse" claim built on it would count names that have nothing adverse
  // firing. Reading each pattern on its own keeps the number and the tier describing the same names.
  const patterns = view.pathology.filter((p) => p.kind === "pattern");
  const widest = patterns
    .filter((p) => {
      if (p.reach === "isolated") return false;
      const accent = accentOf(p.severity, familyOf(p.key));
      return accent === "crit" || accent === "high";
    })
    .sort((a, b) => b.memberCount - a.memberCount)[0];

  // Every distinct name carrying a red flag, across ALL red-flag keys — not the first member of the
  // first key. `redFlagMemberCount` is 5 on the live universe while the old line named exactly one
  // symbol, which reads as "the red flag is X" when four other names also carry one.
  const flagged = Array.from(new Set(view.pathology.filter((p) => p.kind === "red_flag").flatMap((p) => p.members)));

  return (
    <div className="col-span-12 lg:col-span-4">
      <SectionEyebrow className="mb-3 mt-1" label="Spotlight" icon={Icons.spark} accent="var(--rec)" />

      {spot ? (
        <Panel className="mb-3" style={{ borderColor: "var(--rec-bd)" }}>
          <div className="mb-2 flex items-center gap-2">
            <span className="eyebrow" style={{ color: "var(--rec)" }}>
              Recovery — the durable signal
            </span>
          </div>
          <h4 className="font-display text-[16px] font-medium" style={{ color: "var(--rec)" }}>
            Turning up out of weakness
          </h4>
          <div className="num mt-0.5 text-[18px] font-medium">{spot.symbol}</div>
          <div className="my-3 rounded-[10px] bg-surface-2 p-2.5">
            <RecoveryTrace from={spot.prior} to={spot.current} />
          </div>
          <p className="text-[12px] leading-snug text-ink2">
            Composite rose{" "}
            <span className="num" style={{ color: "var(--rec)" }}>
              +{Math.round(spot.delta)}
            </span>{" "}
            from {Math.round(spot.prior)} ({BAND_META[spot.fromBand].label}) to{" "}
            {Math.round(spot.current)} ({BAND_META[spot.toBand].label}) over the quarter
            {spot.crossedUp ? " — a full band crossing up" : ""}. A coincident inflection worth
            investigating, not a buy.
          </p>
        </Panel>
      ) : null}

      <Panel className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="eyebrow">Flags &amp; patterns firing</span>
        </div>
        <div className="flex items-center gap-2.5 border-b border-line py-1.5 text-[12.5px]">
          <span className="num w-6 shrink-0 text-[16px] font-medium" style={{ color: "var(--crit)" }}>
            {view.aggregate!.redFlagMemberCount}
          </span>
          <span className="min-w-0">
            {view.aggregate!.redFlagMemberCount === 1 ? "Critical red flag" : "Critical red flags"}{" "}
            {flagged.length > 0 && (
              <span className="num text-ink3">
                · {flagged.slice(0, 2).join(", ")}
                {flagged.length > 2 ? ` +${flagged.length - 2} more` : ""}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2.5 py-1.5 text-[12.5px]">
          <span className="num w-6 shrink-0 text-[16px] font-medium text-ink2">
            {patterns.length}
          </span>
          <span className="text-ink2">
            {patterns.length === 1 ? "Shared pattern" : "Shared patterns"} across the universe
          </span>
        </div>
        <p className="mt-1 text-[11px] italic text-ink3">
          {widest ? (
            <>
              Widest is {findingName(widest.key)} —{" "}
              <span className="num not-italic text-ink2">
                {widest.memberCount} of {widest.outOf}
              </span>{" "}
              names. Risk here is shared, not single-name.
            </>
          ) : patterns.length > 0 ? (
            "No adverse pattern reaches more than one name — risk here is single-name, not systemic."
          ) : (
            "No patterns firing this snapshot."
          )}
        </p>
      </Panel>

      {/* HONEST WEEK PANEL — sinceLastWeek is intra-quarter, price-led churn */}
      <Panel>
        <div className="mb-2 flex items-center justify-between">
          <span className="eyebrow">Since you last looked · 7 days</span>
          <span className="num text-[10px] text-ink3">from {w.anchorDate}</span>
        </div>
        <p className="text-[12px] leading-snug text-ink2">
          <span className="num text-ink">{w.versions}</span> names re-versioned this week, but{" "}
          <span className="num text-ink">{w.newFlags}</span> new flags fired —{" "}
          {w.rescoreDominated
            ? "this is the EOD price rescore settling the market pillar, not fresh fundamental movement."
            : "a genuinely quiet week."}{" "}
          Fundamental health moves at quarter cadence; read the quarter above, not the week.
        </p>
        <div className="mt-3 flex gap-2 text-center">
          <div className="flex-1 rounded-lg border border-line bg-surface-2 py-2">
            <div className="num text-[15px] font-medium" style={{ color: "var(--rec)" }}>
              {w.recoveries}
            </div>
            <div className="text-[10px] text-ink3">genuine recoveries</div>
          </div>
          <div className="flex-1 rounded-lg border border-line bg-surface-2 py-2">
            <div className="num text-[15px] font-medium text-ink2">{w.crossings}</div>
            <div className="text-[10px] text-ink3">band crossings (price-led)</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ── threshold watch ───────────────────────────────────────────────────────────
/** Points either side of the band line the track spans. A DISPLAY ZOOM, not a threshold: it decides
 *  how far along the bar a given distance renders, and claims nothing about materiality. The exact
 *  distance is printed beside it, so the reader is never left inferring a number from a position. */
const EDGE_TRACK_WINDOW = 2;

function ThresholdWatch({ view }: { view: UniverseHealthView }) {
  const edges = edgeNames(view.members, 4);
  return (
    <div className="col-span-12">
      <SectionEyebrow
        className="mb-3 mt-1"
        label="At the edge — about to become a story"
        icon={Icons.target}
        accent="var(--high)"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {edges.map((e) => {
          const meta = BAND_META[e.lineBand];
          // ⚠ THE MARKER USED TO SIT AT A HARDCODED 56% / 44%, so every card drew the same two
          // positions whatever the real distance was — and `distance` was never shown at all, while
          // the prose asserted "a whisker" for a name the selection does not bound. Today's four
          // picks are 0.03–0.34 off their line, so the copy happened to be true and every dot was
          // drawn six percent out. It is positioned by the served distance now, and the number is
          // printed, so the track illustrates a stated fact instead of standing in for one.
          const signed = e.side === "above" ? e.distance : -e.distance;
          const pos = Math.max(4, Math.min(96, 50 + (signed / EDGE_TRACK_WINDOW) * 50));
          const away = e.distance < 1 ? e.distance.toFixed(2) : e.distance.toFixed(1);
          return (
            <div key={e.symbol} className="rounded-xl border border-line bg-surface-2 px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="num text-[13px] font-medium">{e.symbol}</span>
                <span className="text-[9.5px] uppercase tracking-wide text-ink3">on a band line</span>
              </div>
              <div className="relative my-4 h-1.5 rounded-[3px] bg-surface-3">
                <span className="absolute -top-0.75 h-3 w-px bg-line3" style={{ left: "50%" }}>
                  <small className="absolute left-1/2 top-3.25 -translate-x-1/2 whitespace-nowrap text-[8.5px] text-ink3">
                    {meta.label} {e.line}
                  </small>
                </span>
                <span
                  className="absolute top-1/2 size-3.25 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px]"
                  style={{ left: `${pos}%`, background: meta.cssVar, borderColor: "var(--surface2)" }}
                />
              </div>
              {/* No "one soft quarter tips it" — that was a claim about a move size nobody measured.
                  The distance IS the whole of what a band change needs, which is true by definition
                  at any distance, so it survives a pick that is nowhere near a line. */}
              <p className="mt-4 text-[11.5px] leading-tight text-ink2">
                Composite <span className="num text-ink">{e.composite.toFixed(1)}</span> ·{" "}
                <span className="num text-ink">{away}</span> {e.side === "above" ? "above" : "below"} the{" "}
                {meta.label} line — the entire gap to a band change.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BriefingTab({ view }: { view: UniverseHealthView }) {
  return (
    <Reveal className="grid grid-cols-12 gap-3.5">
      <Hero view={view} />
      <KpiRail view={view} />
      <PillarMix view={view} />
      <Movers view={view} />
      <Exposure view={view} />
      <Attention view={view} />
      <RightRail view={view} />
      <ThresholdWatch view={view} />
    </Reveal>
  );
}
