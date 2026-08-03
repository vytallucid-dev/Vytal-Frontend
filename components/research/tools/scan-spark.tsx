"use client";

/**
 * The landing cards' mini-charts. ONE frame, two shapes.
 *
 *   <ScanSpark>      one line   — Trajectory's composite, against the condition bands
 *   <ScanSparkPair>  two lines  — Divergence's pillar pair, with the gap called out between them
 *
 * A divergence is a gap BETWEEN TWO PILLARS, so its card draws both legs rather than a single
 * derived magnitude: the reader sees which line is high, which is low, and how far apart they
 * are. The frame (viewBox, padding, flat-series guard, empty state) is shared so the two
 * landings stay visually one system instead of drifting into two sparklines.
 *
 * ⚠ THEY DRAW THE SERIES AND NOTHING ELSE. No trend colouring, no slope arrow, no threshold
 * line. Both tool specs exclude exactly those: trajectory because magnitude does not scale the
 * signal (a 15+pt Momentum gain read NEGATIVE), divergence because generic widening/narrowing
 * is on the EXCLUDED list (−1.1%/44%, and it INVERTS in banks). A shape a reader can see is a
 * recording; a shape this file has coloured by direction is a claim. The gap NUMBER is a
 * measurement of the drawn line, not a rule — no threshold accompanies it.
 */

import { useId } from "react";

const W = 240;
const H = 52;
const PAD = 5;

/** The shared empty state. Kept at the chart's own height so a grid row stays even whether or
 *  not a card has a path to draw. */
function SparkEmpty({ label }: { label: string }) {
  return (
    <div
      className="grid place-items-center rounded-md border border-dashed border-line2 text-[10px] text-ink3"
      style={{ height: H }}
    >
      {label}
    </div>
  );
}

/** A tinted horizontal region, in VALUE space — the caller decides what a zone means. */
export interface SparkZone {
  key: string;
  from: number;
  to: number;
  color: string;
}

export function ScanSpark({
  values,
  color,
  /** "zero" anchors the floor at 0 (a spread of 0 is a real, meaningful floor: no tension);
   *  "auto" frames the series against its own range (a composite near 70 says nothing useful
   *  when plotted from 0). */
  baseline = "auto",
  /** Value-space bands drawn behind the line. Built by the caller from ITS OWN scale. */
  zones,
  /** Soft wash under the line — reads as "distance from the floor", so it only makes sense
   *  when the floor means something (baseline="zero"). */
  fill = false,
  /** Shown in place of the chart when there is no path to draw yet. */
  emptyLabel = "building history",
  ariaLabel,
}: {
  values: number[];
  color: string;
  baseline?: "zero" | "auto";
  zones?: SparkZone[];
  fill?: boolean;
  emptyLabel?: string;
  ariaLabel?: string;
}) {
  const gradientId = useId();

  // Honest empty: one point is not a path.
  if (values.length < 2) return <SparkEmpty label={emptyLabel} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  // A dead-flat series would collapse to a zero span; give it a nominal one so the line renders
  // through the frame instead of dividing by zero.
  const span = max - min || 1;
  const lo = baseline === "zero" ? 0 : min - span * 0.12;
  const hi = baseline === "zero" ? max + span * 0.15 : max + span * 0.12;

  const y = (v: number) => PAD + (1 - (v - lo) / (hi - lo || 1)) * (H - 2 * PAD);
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (values.length - 1);

  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const last = values[values.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full"
      preserveAspectRatio="none"
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {fill && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}

      {zones?.map((z) => (
        <rect
          key={z.key}
          x={0}
          y={y(z.to)}
          width={W}
          height={Math.max(0, y(z.from) - y(z.to))}
          fill={z.color}
          opacity={0.08}
        />
      ))}

      {fill && (
        <polygon
          points={`${PAD},${H - PAD} ${pts.join(" ")} ${W - PAD},${H - PAD}`}
          fill={`url(#${gradientId})`}
        />
      )}

      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* where the stock stands now */}
      <circle cx={x(values.length - 1)} cy={y(last)} r={2.6} fill={color} />
    </svg>
  );
}

/**
 * <ScanSparkPair> — TWO lines and the band between them. The divergence card's chart.
 *
 * ── WHAT THE READER GETS ──────────────────────────────────────────────────────────────────
 * The high leg and the low leg over the same trailing quarters, each in its own PILLAR colour
 * (the same tokens the single view's chart uses, so the two surfaces read as one instrument),
 * with the space between them filled — the fill IS the divergence — and the current gap
 * printed inside that space at the right-hand end.
 *
 * ── ★ THE PAIR IS FIXED UPSTREAM ──────────────────────────────────────────────────────────
 * Both legs name ONE pillar for the whole window; the backend picks the pair from the current
 * snapshot and reads it backwards. This component never re-picks per point, which is what
 * keeps a line from silently changing which pillar it means halfway across the card.
 *
 * ── SCALE ─────────────────────────────────────────────────────────────────────────────────
 * Framed to BOTH legs together, so the vertical distance on screen is the gap. It is not
 * anchored at zero: two pillars both sitting near 70 with 4 points between them would collapse
 * into one line, and "these two are close" is exactly the reading that must stay visible.
 */
export function ScanSparkPair({
  points,
  highColor,
  lowColor,
  emptyLabel,
  ariaLabel,
}: {
  /** oldest→newest; both legs already resolved to the same fixed pillar pair. */
  points: { high: number; low: number }[];
  highColor: string;
  lowColor: string;
  /** Omit to render nothing at all when there is no path — some cards would rather collapse
   *  than explain an absence. */
  emptyLabel?: string;
  ariaLabel?: string;
}) {
  const gradientId = useId();

  if (points.length < 2) return emptyLabel ? <SparkEmpty label={emptyLabel} /> : null;

  const highs = points.map((p) => p.high);
  const lows = points.map((p) => p.low);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  // Both legs identical across the whole window (a genuinely zero spread) would collapse the
  // frame; a nominal span keeps the pair rendering through the middle.
  const span = max - min || 1;
  const lo = min - span * 0.18;
  const hi = max + span * 0.18;

  const y = (v: number) => PAD + (1 - (v - lo) / (hi - lo)) * (H - 2 * PAD);
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (points.length - 1);

  const at = (vals: number[]) => vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const highPts = at(highs);
  const lowPts = at(lows);

  const lastI = points.length - 1;
  const last = points[lastI];
  const gap = last.high - last.low;
  // The label sits BETWEEN the two lines at their current values, right-aligned. A halo in the
  // card surface keeps it legible when the gap closes far enough for a leg to pass behind it,
  // so a near-aligned pair needs no separate layout.
  const labelY = (y(last.high) + y(last.low)) / 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full"
      preserveAspectRatio="none"
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={highColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={lowColor} stopOpacity={0.2} />
        </linearGradient>
      </defs>

      {/* the divergence itself — the area the two legs enclose */}
      <polygon points={`${highPts.join(" ")} ${[...lowPts].reverse().join(" ")}`} fill={`url(#${gradientId})`} />

      {[
        { pts: lowPts, color: lowColor, v: last.low },
        { pts: highPts, color: highColor, v: last.high },
      ].map((leg) => (
        <g key={leg.color}>
          <polyline
            points={leg.pts.join(" ")}
            fill="none"
            stroke={leg.color}
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={x(lastI)} cy={y(leg.v)} r={2.2} fill={leg.color} />
        </g>
      ))}

      <text
        x={W - PAD - 4}
        y={labelY}
        textAnchor="end"
        dominantBaseline="central"
        fontSize={9.5}
        fontWeight={600}
        fill="var(--ink2)"
      >
       Gap {gap.toFixed(0)}
      </text>
    </svg>
  );
}
