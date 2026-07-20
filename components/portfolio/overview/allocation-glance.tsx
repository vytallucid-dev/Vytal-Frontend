"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Holding } from "@/types/portfolio";
import {
  type AllocationMode,
  type AllocSegment,
  buildAllocation,
  diversificationRead,
  sectorCountLabel,
  sectorCoverageNote,
} from "../lib";
import { Funnel } from "./shared";

const MODES: { id: AllocationMode; label: string }[] = [
  { id: "class", label: "Class" },
  { id: "sector", label: "Sector" },
  { id: "stock", label: "Stock" },
  { id: "marketcap", label: "Market cap" },
];

/** Fold segments beyond `max` into a single grey "Others" slice (bar + legend). */
function fold(segs: AllocSegment[], max = 8): AllocSegment[] {
  if (segs.length <= max) return segs;
  const head = segs.slice(0, max - 1);
  const restWeight = segs.slice(max - 1).reduce((s, x) => s + x.weight, 0);
  return [...head, { key: "__others", label: `Others (${segs.length - (max - 1)})`, weight: restWeight, color: "var(--ink3)" }];
}

export function AllocationGlance({ holdings, onOpenHoldings }: { holdings: Holding[]; onOpenHoldings: () => void }) {
  const [mode, setMode] = useState<AllocationMode>("sector");
  const segsAll = buildAllocation(holdings, mode);
  const segs = fold(segsAll);
  const div = diversificationRead(holdings);

  // cursor-following tooltip over the allocation bar — every segment (of every tab's cut) reports its
  // label + exact % under the cursor, the tooltip tracking the pointer x, like the other charts.
  const barRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ seg: AllocSegment; x: number } | null>(null);
  const onSegMove = (seg: AllocSegment) => (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    // clamp so the tooltip stays inside the bar's width even at the extreme edges
    const x = Math.min(Math.max(e.clientX - rect.left, 46), rect.width - 46);
    setHover({ seg, x });
  };

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "rounded-md px-2 py-1 text-[11.5px] font-medium transition-colors sm:px-2.5 sm:text-[12px]",
                mode === m.id ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Funnel onClick={onOpenHoldings}>See holdings</Funnel>
      </div>

      {segs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line2 bg-surface-2/50 px-5 py-8 text-center text-[12.5px] text-ink3">
          Allocation appears once your holdings carry live prices.
        </p>
      ) : (
        <>
          <div ref={barRef} className="relative">
            <div className="flex h-9 gap-0.5 overflow-hidden rounded-lg" onPointerLeave={() => setHover(null)}>
              {segs.map((seg) => (
                <div
                  key={seg.key}
                  onPointerMove={onSegMove(seg)}
                  className="num flex items-center justify-center text-[10.5px] font-medium"
                  style={{ flex: Math.max(seg.weight * 100, 1.5), background: seg.color, color: "#0a0b0e" }}
                >
                  {seg.weight >= 0.1 ? `${Math.round(seg.weight * 100)}%` : ""}
                </div>
              ))}
            </div>
            {/* the tooltip — follows the cursor's x, shows the segment's label + exact % */}
            {hover && (
              <div
                className="pointer-events-none absolute bottom-full z-10 mb-2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-md border border-line2 bg-surface-3 px-2.5 py-1 text-[11px] shadow-lg"
                style={{ left: hover.x }}
              >
                <span className="size-2 shrink-0 rounded-[2px]" style={{ background: hover.seg.color }} />
                <span className="font-medium text-ink">{hover.seg.label}</span>
                <span className="num text-ink2">{(hover.seg.weight * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-ink2">
            {segs.map((seg) => (
              <span key={seg.key} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-[2px]" style={{ background: seg.color }} />
                {seg.label} <span className="num text-ink3">{(seg.weight * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 sm:gap-3">
            <Stat label="Top-3 concentration" value={`${Math.round(div.top3 * 100)}%`} />
            {/* No `sub` here: this Stat's sub truncates, and a clipped disclosure is a hidden one.
                The coverage rides in the full note directly below instead. */}
            <Stat label="Sectors" value={sectorCountLabel(div)} />
            <Stat
              label="Largest position"
              value={div.largest ? `${Math.round(div.largest.weight * 100)}%` : "—"}
              sub={div.largest?.symbol}
            />
          </div>

          {/* MANDATORY coverage for the sector read — see allocation-layer. Nothing renders on a
              pure-equity book. */}
          {sectorCoverageNote(div) && (
            <p className="mt-3 text-[11px] leading-relaxed text-ink3">{sectorCoverageNote(div)}</p>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9.5px] uppercase leading-tight tracking-[0.1em] text-ink3">{label}</p>
      <p className="num mt-0.5 truncate text-[15px] font-medium text-ink sm:text-[17px]">{value}</p>
      {sub && <p className="num truncate text-[10.5px] text-ink3">{sub}</p>}
    </div>
  );
}
