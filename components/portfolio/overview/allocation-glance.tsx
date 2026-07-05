"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Holding } from "@/types/portfolio";
import { type AllocationMode, type AllocSegment, buildAllocation, diversificationRead } from "../lib";
import { Funnel } from "./shared";

const MODES: { id: AllocationMode; label: string }[] = [
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

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
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
          <div className="flex h-9 gap-0.5 overflow-hidden rounded-lg">
            {segs.map((seg) => (
              <div
                key={seg.key}
                className="num flex items-center justify-center text-[10.5px] font-medium"
                style={{ flex: Math.max(seg.weight * 100, 1.5), background: seg.color, color: "#0a0b0e" }}
                title={`${seg.label} ${(seg.weight * 100).toFixed(1)}%`}
              >
                {seg.weight >= 0.1 ? `${Math.round(seg.weight * 100)}%` : ""}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-ink2">
            {segs.map((seg) => (
              <span key={seg.key} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-[2px]" style={{ background: seg.color }} />
                {seg.label} <span className="num text-ink3">{(seg.weight * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
            <Stat label="Top-3 concentration" value={`${Math.round(div.top3 * 100)}%`} />
            <Stat label="Sectors" value={String(div.sectorCount)} />
            <Stat
              label="Largest position"
              value={div.largest ? `${Math.round(div.largest.weight * 100)}%` : "—"}
              sub={div.largest?.symbol}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">{label}</p>
      <p className="num mt-0.5 text-[17px] font-medium text-ink">{value}</p>
      {sub && <p className="num text-[10.5px] text-ink3">{sub}</p>}
    </div>
  );
}
