"use client";

/**
 * Shared tokens + small primitives for the Health Score tab.
 * Every colour here is a design-system token (text-pristine, bg-p-found/10, …) —
 * never a raw hex. The prototype's hex palette maps 1:1 onto these.
 */

import { motion, useInView } from "framer-motion";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type Icon } from "@/lib/icons";
import type {
  LabelBand,
  PillarKey,
  MetricBand,
  MetricState,
  BandLadder as TBandLadder,
  BarDirection,
} from "@/types/health";

/** A faint tinted-surface style from any accent colour (icon chips, pills, accents). */
export function tint(accent: string, fill = 14, border = 30): CSSProperties {
  return {
    color: accent,
    background: `color-mix(in oklch, ${accent} ${fill}%, transparent)`,
    borderColor: `color-mix(in oklch, ${accent} ${border}%, transparent)`,
  };
}

// ── band identity (composite condition scale) ─────────────────────────────────
export const LABEL_BAND_ORDER: LabelBand[] = [
  "fragile",
  "below_par",
  "steady",
  "healthy",
  "pristine",
];

export const BAND_META: Record<
  LabelBand,
  { label: string; text: string; bg: string; border: string; cssVar: string; cap: string }
> = {
  fragile:   { label: "Fragile",   text: "text-fragile",  bg: "bg-fragile/10",  border: "border-fragile/40",  cssVar: "var(--c-fragile)",  cap: "bg-fragile"  },
  below_par: { label: "Below par", text: "text-below",    bg: "bg-below/10",    border: "border-below/40",    cssVar: "var(--c-below)",    cap: "bg-below"    },
  steady:    { label: "Steady",    text: "text-steady",   bg: "bg-steady/10",   border: "border-steady/40",   cssVar: "var(--c-steady)",   cap: "bg-steady"   },
  healthy:   { label: "Healthy",   text: "text-healthy",  bg: "bg-healthy/10",  border: "border-healthy/40",  cssVar: "var(--c-healthy)",  cap: "bg-healthy"  },
  pristine:  { label: "Pristine",  text: "text-pristine", bg: "bg-pristine/10", border: "border-pristine/40", cssVar: "var(--c-pristine)", cap: "bg-pristine" },
};

// ── pillar identity (fixed everywhere) ────────────────────────────────────────
export const PILLAR_META: Record<
  PillarKey,
  { label: string; text: string; bg: string; border: string; cssVar: string; dot: string }
> = {
  foundation: { label: "Foundation", text: "text-p-found", bg: "bg-p-found/10", border: "border-p-found/30", cssVar: "var(--p-found)", dot: "bg-p-found" },
  momentum:   { label: "Momentum",   text: "text-p-mom",   bg: "bg-p-mom/10",   border: "border-p-mom/30",   cssVar: "var(--p-mom)",   dot: "bg-p-mom"   },
  market:     { label: "Market",     text: "text-p-mkt",   bg: "bg-p-mkt/10",   border: "border-p-mkt/30",   cssVar: "var(--p-mkt)",   dot: "bg-p-mkt"   },
  ownership:  { label: "Ownership",  text: "text-p-own",   bg: "bg-p-own/10",   border: "border-p-own/30",   cssVar: "var(--p-own)",   dot: "bg-p-own"   },
};

// ── metric L1 band → condition colour ─────────────────────────────────────────
export const METRIC_BAND_META: Record<MetricBand, { label: string; text: string; dot: string }> = {
  excellent:  { label: "Excellent",  text: "text-pristine", dot: "bg-pristine" },
  good:       { label: "Good",       text: "text-healthy",  dot: "bg-healthy"  },
  acceptable: { label: "Acceptable", text: "text-steady",   dot: "bg-steady"   },
  concerning: { label: "Concerning", text: "text-below",    dot: "bg-below"    },
  distress:   { label: "Distress",   text: "text-fragile",  dot: "bg-fragile"  },
};

// ── helpers ───────────────────────────────────────────────────────────────────
export function fmt(n: number, d = 1) {
  return n.toFixed(d);
}

export function clampPct(v: number) {
  return Math.max(0, Math.min(100, v));
}

/** "FY26Q4" → "Q4'26" */
export function shortPeriod(periodKey: string) {
  const m = /^FY(\d{2})Q(\d)$/.exec(periodKey);
  return m ? `Q${m[2]}'${m[1]}` : periodKey;
}

/** "MARGIN_COMPRESSION" / "r1_pledge" → "Margin compression" */
export function humanizeKey(key: string) {
  const s = key.replace(/[_-]+/g, " ").trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── section eyebrow (coloured icon/accent · label · tinted hairline · optional pill) ──
// Colour is now part of the universal section rhythm: an `icon` renders a tinted icon
// chip; without one a small accent bar still carries the colour, and the hairline picks
// up a faint tint — so every tab's section headers read with life, not flat grey.
export function SectionEyebrow({
  label,
  pill,
  icon: Glyph,
  accent = "var(--p-found)",
}: {
  label: string;
  pill?: string;
  icon?: Icon;
  accent?: string;
}) {
  return (
    <div className="mb-4 mt-8 flex items-center gap-2.5">
      {Glyph ? (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border" style={tint(accent)}>
          <Glyph weight="duotone" className="h-4 w-4" />
        </span>
      ) : (
        <span className="h-3.5 w-[3px] shrink-0 rounded-full" style={{ background: accent }} />
      )}
      <span className="eyebrow shrink-0">{label}</span>
      <span className="h-px flex-1" style={{ background: `color-mix(in oklch, ${accent} 20%, var(--line))` }} />
      {pill && (
        <span className="num shrink-0 rounded-full border px-2.5 py-1 text-[11px] tracking-normal" style={tint(accent, 10, 26)}>
          {pill}
        </span>
      )}
    </div>
  );
}

// ── pillar gauge — arc draws on scroll-in, coloured by pillar identity ─────────
export function PillarGauge({
  score,
  color,
  size = 62,
  strokeWidth = 6,
}: {
  score: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const clamped = clampPct(score);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div ref={ref} className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface3)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={inView ? { strokeDashoffset: circ * (1 - clamped / 100) } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="num absolute font-semibold" style={{ fontSize: size * 0.3, color }}>
        {Math.round(clamped)}
      </span>
    </div>
  );
}

/** A tiny inline sparkline — ONLY drawn when ≥ 3 real points exist (returns null otherwise),
 *  so a blank or misleading 2-point line can never render. Nulls in the series are skipped
 *  (the line spans gaps), but their slot still occupies its time position so spacing is honest.
 *  Shared by the Fundamentals tab and the Overview tab's §5 metric cards. */
export const SPARK_MIN_POINTS = 3;
export function MiniSpark({
  points,
  color,
  width = 80,
  height = 26,
}: {
  points: (number | null)[];
  color: string;
  width?: number;
  height?: number;
}) {
  const real = points.filter((p): p is number => p != null);
  if (real.length < SPARK_MIN_POINTS) return null; // never a blank / 2-point spark
  const min = Math.min(...real);
  const max = Math.max(...real);
  const span = max - min || 1;
  const n = points.length;
  const denom = n > 1 ? n - 1 : 1;
  const pad = 2;
  const usableH = height - pad * 2;
  const coords = points
    .map((p, i) =>
      p == null ? null : { x: (i / denom) * width, y: pad + (usableH - ((p - min) / span) * usableH) },
    )
    .filter((c): c is { x: number; y: number } => c != null);
  const d = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
      {last && <circle cx={last.x} cy={last.y} r={1.9} fill={color} />}
    </svg>
  );
}

/** Pull a single ratio's series out of a per-year history (oldest→newest), for a MiniSpark. */
export function sparkSeries<T>(history: T[], pick: (row: T) => number | null): (number | null)[] {
  return history.map(pick);
}

/** Generic panel matching the prototype `.card` (surface · hairline · 16px radius). */
export function Panel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface-1 p-5", className)} style={style}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// THREE-LENS SHARED PRIMITIVES (§6 — place once, reuse everywhere: Anatomy + the
// metric modal now; the main chart (Prompt B) + PG/Comparison surfaces later).
// ════════════════════════════════════════════════════════════════════════════════

// ── tone → accent (§0.2) — reuses the findings accent tokens (--rec/--high/--crit/
//    --ctx, each with -bg/-bd). LOAD-BEARING: a FIELD-VERDICT (PG_WEAK/PG_STRONG) is
//    CONTEXT — amber/neutral, NEVER good/bad. So field-verdicts resolve to high/ctx,
//    never rec(green) or crit(red). The no-advice spine, one layer down. ──────────────
export type LensAccentKey = "rec" | "high" | "crit" | "ctx";

export function lensAccentKey(tone: string, fieldVerdict: string | null): LensAccentKey {
  if (fieldVerdict === "PG_WEAK") return "high"; // field-weak → amber CONTEXT (never red/green)
  if (fieldVerdict === "PG_STRONG") return "ctx"; // elite field → neutral CONTEXT
  const t = tone.toLowerCase();
  if (t.includes("concern")) return "crit";
  if (t.includes("caution")) return "high";
  if (t.includes("constructive")) return "rec";
  return "ctx"; // Neutral
}

export function lensAccentVars(key: LensAccentKey): { color: string; bg: string; bd: string } {
  return { color: `var(--${key})`, bg: `var(--${key}-bg)`, bd: `var(--${key}-bd)` };
}

// ── honest metric-state chip (every non-scored row carries one) ───────────────────
export const METRIC_STATE_LABEL: Record<MetricState, string> = {
  scored: "Scored",
  no_bar: "No bar set",
  data_unavailable: "Data unavailable",
  normalized_out: "Normalized out",
  insufficient_peers: "Insufficient peers",
  building_history: "Building history",
};

export function MetricStateChip({ state }: { state: MetricState }) {
  return (
    <span className="rounded-md border border-line2 bg-surface-3 px-2 py-0.5 text-[10px] text-ink3">
      {METRIC_STATE_LABEL[state]}
    </span>
  );
}

// ── lens chip (vs bar · vs field · vs trend) — compact, light, content-first ──────
// `muted` renders the calm honest-empty state (building-history / not-evaluable) so the
// SAME chip gracefully degrades; `dotColor` puts a tiny state hue without heavy styling.
export function LensChip({
  label,
  state,
  detail,
  muted,
  dotColor,
}: {
  label: string;
  state: string;
  detail?: string;
  muted?: boolean;
  dotColor?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-md bg-surface-3 px-2 py-0.5 text-[10px]">
      <span className="text-ink3">{label}</span>
      {dotColor && !muted && (
        <span className="inline-block h-1.5 w-1.5 translate-y-px rounded-full" style={{ background: dotColor }} />
      )}
      <span className={cn(muted ? "italic text-ink3" : "font-medium text-ink2")}>{state}</span>
      {detail && <span className="num text-ink3">{detail}</span>}
    </span>
  );
}

// ── lens-pattern pill (tone-coloured; field-verdicts neutral per §0.2) ────────────
export function LensPatternPill({
  label,
  tone,
  fieldVerdict,
  role,
}: {
  label: string;
  tone: string;
  fieldVerdict: string | null;
  role?: "top_level" | "supporting_detail";
}) {
  const v = lensAccentVars(lensAccentKey(tone, fieldVerdict));
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium"
      style={{ color: v.color, background: v.bg, borderColor: v.bd }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.color }} />
      {label}
      {role === "supporting_detail" && <span className="font-normal text-ink3">· detail</span>}
    </span>
  );
}

// ── band-ladder renderer (§2.1) — every band Distress→Excellent with its range, the
//    active band highlighted, the raw value's exact position marked. ────────────────
const LADDER_BANDS: { band: MetricBand; label: string }[] = [
  { band: "excellent", label: "Excellent" },
  { band: "good", label: "Good" },
  { band: "acceptable", label: "Acceptable" },
  { band: "concerning", label: "Concerning" },
  { band: "distress", label: "Distress" },
];
const LADDER_BAND_VAR: Record<MetricBand, string> = {
  excellent: "var(--c-pristine)",
  good: "var(--c-healthy)",
  acceptable: "var(--c-steady)",
  concerning: "var(--c-below)",
  distress: "var(--c-fragile)",
};

/** The numeric [lower, upper] range of each band given the 5 cuts + direction. Open
 *  ends render as "≥"/"≤". For higher_better the excellent band is the top (≥ excellent);
 *  for lower_better it inverts (≤ excellent). */
export function bandRangeText(band: MetricBand, l: TBandLadder): string {
  const f1 = (n: number) => n.toFixed(2);
  const hb = l.direction === "higher_better";
  switch (band) {
    case "excellent":
      return hb ? `≥ ${f1(l.excellent)}` : `≤ ${f1(l.excellent)}`;
    case "good":
      return hb ? `${f1(l.good)} – ${f1(l.excellent)}` : `${f1(l.excellent)} – ${f1(l.good)}`;
    case "acceptable":
      return hb ? `${f1(l.acceptable)} – ${f1(l.good)}` : `${f1(l.good)} – ${f1(l.acceptable)}`;
    case "concerning":
      return hb ? `${f1(l.concerning)} – ${f1(l.acceptable)}` : `${f1(l.acceptable)} – ${f1(l.concerning)}`;
    case "distress":
      return hb ? `< ${f1(l.concerning)}` : `> ${f1(l.concerning)}`;
  }
}

export function BandLadder({ ladder, rawValue }: { ladder: TBandLadder; rawValue: number | null }) {
  return (
    <div className="flex flex-col gap-1">
      {LADDER_BANDS.map(({ band, label }) => {
        const active = ladder.activeBand === band;
        const color = LADDER_BAND_VAR[band];
        return (
          <div
            key={band}
            className={cn(
              "flex items-center justify-between rounded-md border px-3 py-1.5 text-[11.5px] transition-colors",
              active ? "border-line2 bg-surface-2" : "border-transparent",
            )}
            style={active ? { borderColor: color, background: `color-mix(in oklch, ${color} 9%, transparent)` } : undefined}
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm" style={{ background: color, opacity: active ? 1 : 0.45 }} />
              <span className={cn(active ? "font-semibold text-ink" : "text-ink2")}>{label}</span>
              {active && rawValue !== null && (
                <span className="num rounded bg-surface-3 px-1.5 text-[10px] text-ink2">raw {rawValue.toFixed(2)}</span>
              )}
            </span>
            <span className="num text-[10.5px] text-ink3">{bandRangeText(band, ladder)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── held-aware L3 line (§0.3 / §6) — draws a metric/pillar series where HELD segments
//    (no new data in the window) render visually DISTINCT (dotted + faded), never a
//    confident solid flat line. A segment is held when the incoming point is flagged
//    `held`, or — absent an explicit flag — when its value is unchanged from the prior
//    point (a flat run is treated cautiously). Prompt B's chart passes explicit held
//    flags; both paths render "flat" identically through THIS primitive. ────────────
export interface HeldAwarePoint {
  value: number | null;
  /** Explicit held marker (Prompt B). When omitted, a flat run (equal value) is held. */
  held?: boolean;
  label?: string;
}

export function HeldAwareLine({
  points,
  color,
  width = 280,
  height = 90,
  refValue,
  refLabel,
}: {
  points: HeldAwarePoint[];
  color: string;
  width?: number;
  height?: number;
  /** A reference line (the bar / active-band threshold) drawn across the chart. */
  refValue?: number | null;
  refLabel?: string;
}) {
  const real = points.filter((p): p is HeldAwarePoint & { value: number } => p.value != null);
  if (real.length < 2) return null; // a single point is not a trajectory

  const domainVals = [...real.map((p) => p.value), ...(refValue != null ? [refValue] : [])];
  const min = Math.min(...domainVals);
  const max = Math.max(...domainVals);
  const span = max - min || 1;
  const padY = 10;
  const usableH = height - padY * 2;
  const n = points.length;
  const denom = n > 1 ? n - 1 : 1;
  const padX = 6;
  const usableW = width - padX * 2;
  const xy = (i: number, v: number) => ({
    x: padX + (i / denom) * usableW,
    y: padY + (usableH - ((v - min) / span) * usableH),
  });

  // Build per-segment paths, marking held segments distinct.
  const segs: { d: string; held: boolean }[] = [];
  let prevIdx = -1;
  let prevVal: number | null = null;
  points.forEach((p, i) => {
    if (p.value == null) return;
    if (prevIdx >= 0 && prevVal != null) {
      const a = xy(prevIdx, prevVal);
      const b = xy(i, p.value);
      const held = p.held ?? p.value === prevVal; // explicit flag, else a flat run is held
      segs.push({ d: `M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`, held });
    }
    prevIdx = i;
    prevVal = p.value;
  });

  const refY = refValue != null ? xy(0, refValue).y : null;
  const last = real.length ? xy(points.indexOf(real[real.length - 1] as HeldAwarePoint), real[real.length - 1].value) : null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full" aria-hidden>
      {refY !== null && (
        <g>
          <line x1={padX} y1={refY} x2={width - padX} y2={refY} stroke="var(--ink3)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
          {refLabel && (
            <text x={width - padX} y={refY - 3} textAnchor="end" className="num" style={{ fill: "var(--ink3)", fontSize: 9 }}>
              {refLabel}
            </text>
          )}
        </g>
      )}
      {segs.map((s, i) => (
        <path
          key={i}
          d={s.d}
          fill="none"
          stroke={color}
          strokeWidth={s.held ? 1.4 : 1.9}
          strokeLinecap="round"
          strokeDasharray={s.held ? "2.5 3" : undefined}
          opacity={s.held ? 0.5 : 0.95}
        />
      ))}
      {points.map((p, i) =>
        p.value == null ? null : (() => {
          const c = xy(i, p.value);
          return <circle key={i} cx={c.x} cy={c.y} r={1.7} fill={color} opacity={0.8} />;
        })(),
      )}
      {last && <circle cx={last.x} cy={last.y} r={2.6} fill={color} />}
    </svg>
  );
}
