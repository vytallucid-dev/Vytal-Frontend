"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Holding } from "@/types/portfolio";
import {
  type AllocationMode,
  type AllocSegment,
  OTHERS_COLOR,
  buildAllocation,
  diversificationRead,
  sectorCountLabel,
  sectorCoverageNote,
  sectorCoverageShort,
} from "../lib";

// The allocation layer absorbed into the Holdings tab. Its Sector / Stock / Market-cap
// toggle is the SHARED cut — it drives both this donut and the positions table's
// group-by (§1 ↔ §2). Read-only: every slice is a value share of the priced book, never
// a target or a recompute.

const MODES: { id: AllocationMode; label: string }[] = [
  { id: "class", label: "Class" },
  { id: "sector", label: "Sector" },
  { id: "stock", label: "Stock" },
  { id: "marketcap", label: "Market cap" },
];

/** Fold slices beyond `max` into one grey "Others" wedge, so the ring stays legible. SIZE-driven — for
 *  the Sector cut (and a display cap on Class/Market-cap). The STOCK cut does NOT use this: it folds
 *  CATEGORICALLY in buildAllocation (non-stock = Other, always), so it is passed through untouched. */
function fold(segs: AllocSegment[], max = 8): AllocSegment[] {
  if (segs.length <= max) return segs;
  const head = segs.slice(0, max - 1);
  const restWeight = segs.slice(max - 1).reduce((s, x) => s + x.weight, 0);
  return [
    ...head,
    {
      key: "__others",
      label: `Others (${segs.length - (max - 1)})`,
      weight: restWeight,
      color: OTHERS_COLOR,
    },
  ];
}

// ── the donut: concentric stroked arcs, one per slice, drawn clockwise from 12 o'clock. A SINGLE
//    cursor-FOLLOWING tooltip tracks the pointer over any wedge (name + weight); Others carries its
//    count in the label. ──
function Donut({
  segs,
  centerTop,
  centerBottom,
}: {
  segs: AllocSegment[];
  centerTop: string;
  centerBottom: string;
}) {
  const size = 168;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = segs.length > 1 ? 2 : 0; // px gap between wedges (via dash), skipped when single slice

  // the hovered wedge + the live cursor position (viewport coords). One tooltip, moved with the mouse.
  const [hover, setHover] = useState<{
    label: string;
    pct: string;
    x: number;
    y: number;
  } | null>(null);

  let acc = 0;
  return (
    <div
      className="max-lg:mx-auto relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        {segs.map((seg) => {
          const len = Math.max(seg.weight * c - gap, 0.001);
          const dash = `${len} ${c - len}`;
          const offset = -acc * c;
          acc += seg.weight;
          const pct = (seg.weight * 100).toFixed(1);
          // `fill="none"` ⇒ only the PAINTED arc receives the pointer, so a hover maps to its wedge.
          return (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              className=" outline-none transition-opacity hover:opacity-80"
              onMouseMove={(e) =>
                setHover({ label: seg.label, pct, x: e.clientX, y: e.clientY })
              }
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>
      {/* the centre label overlays the ring (absolute inset-0) — it MUST be pointer-transparent, or it
          eats every hover before it reaches the wedge circles beneath, and no tooltip ever fires. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-[19px] font-semibold text-ink">
          {centerTop}
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ink3">
          {centerBottom}
        </span>
      </div>

      {/* the cursor-following tooltip — portal'd to <body> so `position: fixed` stays viewport-relative
          (immune to any transformed ancestor, e.g. the Reveal wrapper). Rendered only while hovering. */}
      {hover &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-60 rounded-lg border border-line2 bg-surface-3 px-2.5 py-1 text-xs text-ink shadow-lg"
            style={{ left: hover.x + 14, top: hover.y + 14 }}
          >
            <span className="num">
              {hover.label} · {hover.pct}%
            </span>
          </div>,
          document.body,
        )}
    </div>
  );
}

export function AllocationLayer({
  holdings,
  cut,
  onCutChange,
}: {
  holdings: Holding[];
  cut: AllocationMode;
  onCutChange: (m: AllocationMode) => void;
}) {
  const segsAll = buildAllocation(holdings, cut);
  // The STOCK cut already produced its final slices (categorical non-stock fold + palette cap) in
  // buildAllocation — the size-fold would double-fold it, so it is passed through. Other cuts size-fold.
  const segs = cut === "stock" ? segsAll : fold(segsAll);
  const div = diversificationRead(holdings);

  const pricedValue = holdings.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  // ── THE CENTRE DESCRIBES THE PICTURE, AND SAYS SO ──────────────────────────────────────────
  // It counts RING SLICES. It used to name them "sectors" / "cap tiers", which was true only while
  // every slice was one: once a fund buckets as "ETF" (it has no sector and no market-cap tier —
  // see holdingClass / holdingTierKey), a two-slice ring read "2 sectors" while the Stat beside it
  // read "Sectors held: 1". One card, two answers to one question, and the centre's was the false
  // one — an ETF is not a sector.
  //
  // "groups" is the honest name for what the centre actually counts, and it is a WORD fix, not a
  // number fix. Renumbering to div.sectorCount would print "1" over two visible slices — a number
  // arguing with the geometry beneath it. The two now answer DIFFERENT questions, both labelled:
  // the centre "how many slices is this ring?", the Stat "how many sectors, over how much of the
  // book?". "positions" survives on the stock cut: there, every slice IS a position.
  const centerTop = String(segsAll.length);
  const centerBottom = cut === "stock" ? "positions" : "groups";

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-2 sm:p-6">
      {/* toggle — the shared cut; the table below groups by the same choice */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onCutChange(m.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                cut === m.id
                  ? "bg-surface-3 text-ink"
                  : "text-ink3 hover:text-ink2",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-ink3">
          by value ·
          {/* the priced total as a quiet label — a low-opacity ACCENT tint (the section's own teal) with a
              matching border, so it reads as a coloured chip, not grey body text (a label, not a CTA). */}
          <span
            className="num rounded-md border px-1.5 py-0.5 text-ink2"
            style={{
              color: "var(--c-pristine)",
              background:
                "color-mix(in oklch, var(--c-pristine) 10%, transparent)",
              borderColor:
                "color-mix(in oklch, var(--c-pristine) 26%, transparent)",
            }}
          >
            {formatINR(pricedValue, { compact: true })} priced
          </span>
        </span>
      </div>

      {segs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line2 bg-surface-2/50 px-5 py-10 text-center text-[12.5px] text-ink3">
          Allocation appears once your holdings carry live prices — nothing is
          charted from cost alone.
        </p>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <Donut
            segs={segs}
            centerTop={centerTop}
            centerBottom={centerBottom}
          />

          {/* legend */}
          <div className="min-w-0 flex-1">
            <ul className="flex flex-col gap-1.5">
              {segs.map((seg) => (
                <li
                  key={seg.key}
                  className="flex items-center gap-2.5 text-[12.5px]"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ background: seg.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-ink2">
                    {seg.label}
                  </span>
                  {seg.meta && (
                    <span className="hidden truncate text-[10.5px] text-ink3 sm:inline">
                      {seg.meta}
                    </span>
                  )}
                  <span className="num shrink-0 font-medium text-ink">
                    {(seg.weight * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* diversification read — the short concentration story */}
          <div className="grid shrink-0 grid-cols-3 gap-4 border-t border-line pt-4 lg:w-44 lg:grid-cols-1 lg:gap-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <Stat
              label="Top-3 concentration"
              value={`${Math.round(div.top3 * 100)}%`}
            />
            <Stat
              label="Sectors held"
              value={sectorCountLabel(div)}
              sub={sectorCoverageShort(div) ?? undefined}
            />
            <Stat
              label="Largest position"
              value={
                div.largest ? `${Math.round(div.largest.weight * 100)}%` : "—"
              }
              sub={div.largest?.symbol}
            />
          </div>
        </div>
      )}

      {/* The sector read's MANDATORY coverage — it rides with the number, always, whenever any
          fund weight exists. A pure-equity book renders nothing here: there is no absence to
          disclose. */}
      {segs.length > 0 && sectorCoverageNote(div) && (
        <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink3">
          {sectorCoverageNote(div)}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">
        {label}
      </p>
      <p className="num mt-0.5 text-[18px] font-medium text-ink">{value}</p>
      {sub && <p className="num text-[10.5px] text-ink3">{sub}</p>}
    </div>
  );
}
