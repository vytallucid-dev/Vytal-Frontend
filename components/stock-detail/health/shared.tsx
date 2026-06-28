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
import type { LabelBand, PillarKey, MetricBand } from "@/types/health";

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
