"use client";

import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import {
  BAND_META,
  LABEL_BAND_ORDER,
  PILLAR_META,
  Panel,
} from "@/components/stock-detail/health/shared";
import type { UniverseHealthView } from "@/types/universe-view";
import {
  attentionReads,
  computeKpis,
  edgeNames,
  pillarMix,
  recoveryMovers,
  sectorExposure,
  universeCharacter,
  weekRead,
  PILLAR_LABEL,
  compositeBand,
} from "./lib";

// ── distribution columns (hero) — count-scaled cells per band ─────────────────
// Cell height is derived from the container height + cap so the tallest stack always
// fits inside the card (never overflows the top).
function Distribution({ view }: { view: UniverseHealthView }) {
  const dist = view.aggregate!.bandDistribution;
  const counts = LABEL_BAND_ORDER.map((b) => dist[b]);
  const max = Math.max(...counts, 1);
  const CAP = 12;
  const COL_H = 118;
  const GAP = 3;
  const cellH = Math.floor((COL_H - (CAP - 1) * GAP) / CAP);
  return (
    <div className="min-w-[280px] flex-[1.15]">
      <div className="flex items-end gap-1.5 overflow-hidden" style={{ height: COL_H }}>
        {LABEL_BAND_ORDER.map((band, i) => {
          const n = counts[i];
          const shown = max > CAP ? Math.max(n > 0 ? 1 : 0, Math.round((n / max) * CAP)) : n;
          return (
            <div key={band} className="flex h-full flex-1 flex-col items-center justify-end">
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
      <div className="flex flex-wrap items-center gap-6">
        <div className="min-w-[240px] flex-1">
          <h2 className="font-display text-[24px] font-medium leading-[1.15]">
            <span className="num font-medium">{view.scoredUniverseSize}</span> names, this quarter
          </h2>
          <p className="diagnosis mt-1.5 font-display text-[15px] italic leading-snug text-ink2">
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
                <span className="num text-ink">{Math.round(agg.medianComposite)}</span>, off{" "}
                <span className="num" style={{ color: agg.medianDrift < 0 ? "var(--high)" : "var(--rec)" }}>
                  {agg.medianDrift > 0 ? "+" : ""}
                  {Math.round(agg.medianDrift)}
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
        <Kpi value={Math.round(k.median)} sub={BAND_META[k.medianBand].label} label="median composite" />
        <Kpi
          value={k.drift == null ? "—" : `${k.drift > 0 ? "+" : ""}${Math.round(k.drift)}`}
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
        <Kpi value={k.wideSpread} tone="ctx" label="wide pillar spread (≥25)" />
      </div>
    </div>
  );
}

// ── pillar mix ──────────────────────────────────────────────────────────────
function PillarMix({ view }: { view: UniverseHealthView }) {
  const { rows, soft } = pillarMix(view.aggregate!);
  return (
    <Panel className="col-span-12 md:col-span-6 lg:col-span-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">The universe&apos;s dimensions</span>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => {
          const meta = PILLAR_META[r.key];
          return (
            <div key={r.key}>
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
      <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-snug text-ink2">
        <span className="font-medium text-ink">{PILLAR_LABEL[soft]} is the soft spot</span> — the
        median {PILLAR_LABEL[soft].toLowerCase()} read sits lowest across the universe, while ownership
        floors hold highest.
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

function MoverRow({ symbol, from, to, delta }: { symbol: string; from: number; to: number; delta: number }) {
  const up = delta > 0;
  const toBand = compositeBand(to);
  const crossed = compositeBand(from) !== toBand;
  return (
    <div className="flex items-center gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-surface-2">
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
  return (
    <Panel className="col-span-12 md:col-span-6 lg:col-span-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">Biggest health movers</span>
        <span className="num text-[11px] text-ink3">QoQ · {view.aggregate!.priorPeriodKey} → {view.periodKey}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="pl-1 text-[10px] uppercase tracking-[0.1em] text-ink3">Firming</div>
        {risers.map((m) => (
          <MoverRow key={m.symbol} symbol={m.symbol} from={m.priorComposite} to={m.composite} delta={m.delta} />
        ))}
        <div className="mt-2 pl-1 text-[10px] uppercase tracking-[0.1em] text-ink3">Slipping</div>
        {slippers.map((m) => (
          <MoverRow key={m.symbol} symbol={m.symbol} from={m.priorComposite} to={m.composite} delta={m.delta} />
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
  return (
    <Panel className="col-span-12 lg:col-span-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">Where the weight sits</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {secs.map((s) => (
          <div key={s.key} className="flex items-center gap-2.5 text-[12px]">
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
  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="eyebrow-row mb-3 mt-1 flex items-center gap-2.5">
        <span className="eyebrow shrink-0">What the quarter changed</span>
        <span className="h-px flex-1 bg-line" />
        <span className="shrink-0 rounded-full border border-line2 bg-surface-2 px-2.5 py-0.5 text-[11px] text-ink2">
          across the scored universe
        </span>
      </div>

      {a.redFlag.count > 0 && (
        <AttentionCard
          tone="crit"
          icon={<Icons.warning className="size-4" />}
          count={a.redFlag.count}
          title={a.redFlag.count === 1 ? "name tripped a red flag" : "names tripped red flags"}
          tag="Watch with care"
          names={a.redFlag.names.map((s) => ({ label: s, note: "promoter pledge rising" }))}
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
          title="carry a wide pillar spread"
          tag="Context"
          names={a.wideDivergence.names.map((s) => ({ label: s, note: "≥25 gap" }))}
        />
      )}
    </div>
  );
}

// ── right rail: recovery spotlight + flags-mini + honest week panel ────────────
function RightRail({ view }: { view: UniverseHealthView }) {
  const rec = recoveryMovers(view);
  const spot = rec[0];
  const w = weekRead(view);
  return (
    <div className="col-span-12 lg:col-span-4">
      <div className="eyebrow-row mb-3 mt-1 flex items-center gap-2.5">
        <span className="eyebrow shrink-0">Spotlight</span>
        <span className="h-px flex-1 bg-line" />
      </div>

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
            <svg viewBox="0 0 280 70" preserveAspectRatio="none" className="block h-auto w-full">
              <rect x="0" y="44" width="280" height="26" fill="var(--c-below)" opacity="0.07" />
              <rect x="0" y="30" width="280" height="14" fill="var(--c-steady)" opacity="0.08" />
              <polyline
                points="8,54 95,52 185,40 272,24"
                fill="none"
                stroke="var(--rec)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <circle cx="95" cy="52" r="3.4" fill="var(--rec)" />
            </svg>
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
          <span className="num w-6 text-[16px] font-medium" style={{ color: "var(--crit)" }}>
            {view.aggregate!.redFlagMemberCount}
          </span>
          <span>
            Critical red flag{" "}
            <span className="text-ink3">
              · {view.pathology.find((p) => p.kind === "red_flag")?.members[0] ?? "—"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2.5 py-1.5 text-[12.5px]">
          <span className="num w-6 text-[16px] font-medium text-ink2">
            {view.pathology.filter((p) => p.kind === "pattern").length}
          </span>
          <span className="text-ink2">Shared patterns across the universe</span>
        </div>
        <p className="mt-1 text-[11px] italic text-ink3">
          No pattern clusters this snapshot — risk here is single-name, not systemic.
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
function ThresholdWatch({ view }: { view: UniverseHealthView }) {
  const edges = edgeNames(view.members, 4);
  return (
    <div className="col-span-12">
      <div className="eyebrow-row mb-3 mt-1 flex items-center gap-2.5">
        <span className="eyebrow shrink-0">At the edge — about to become a story</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {edges.map((e) => {
          const meta = BAND_META[e.lineBand];
          const pos = e.side === "above" ? 56 : 44;
          return (
            <div key={e.symbol} className="rounded-xl border border-line bg-surface-2 px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="num text-[13px] font-medium">{e.symbol}</span>
                <span className="text-[9.5px] uppercase tracking-wide text-ink3">on a band line</span>
              </div>
              <div className="relative my-4 h-1.5 rounded-[3px] bg-surface-3">
                <span className="absolute -top-[3px] h-3 w-px bg-line3" style={{ left: "50%" }}>
                  <small
                    className="absolute left-1/2 top-[13px] -translate-x-1/2 whitespace-nowrap text-[8.5px] text-ink3"
                    style={{ position: "absolute" }}
                  >
                    {meta.label} {e.line}
                  </small>
                </span>
                <span
                  className="absolute top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                  style={{ left: `${pos}%`, background: meta.cssVar, borderColor: "var(--surface2)" }}
                />
              </div>
              <p className="mt-4 text-[11.5px] leading-tight text-ink2">
                Composite <span className="num text-ink">{Math.round(e.composite)}</span> — a whisker{" "}
                {e.side === "above" ? "above" : "below"} the {meta.label} line. One soft quarter tips it.
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
