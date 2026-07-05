"use client";

import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Holding } from "@/types/portfolio";
import { type AllocationMode, type AllocSegment, buildAllocation, diversificationRead } from "../lib";

// The allocation layer absorbed into the Holdings tab. Its Sector / Stock / Market-cap
// toggle is the SHARED cut — it drives both this donut and the positions table's
// group-by (§1 ↔ §2). Read-only: every slice is a value share of the priced book, never
// a target or a recompute.

const MODES: { id: AllocationMode; label: string }[] = [
  { id: "sector", label: "Sector" },
  { id: "stock", label: "Stock" },
  { id: "marketcap", label: "Market cap" },
];

/** Fold slices beyond `max` into one grey "Others" wedge, so the ring stays legible. */
function fold(segs: AllocSegment[], max = 8): AllocSegment[] {
  if (segs.length <= max) return segs;
  const head = segs.slice(0, max - 1);
  const restWeight = segs.slice(max - 1).reduce((s, x) => s + x.weight, 0);
  return [...head, { key: "__others", label: `Others (${segs.length - (max - 1)})`, weight: restWeight, color: "var(--ink3)" }];
}

// ── the donut: concentric stroked arcs, one per slice, drawn clockwise from 12 o'clock ──
function Donut({ segs, centerTop, centerBottom }: { segs: AllocSegment[]; centerTop: string; centerBottom: string }) {
  const size = 168;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = segs.length > 1 ? 2 : 0; // px gap between wedges (via dash), skipped when single slice

  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        {segs.map((seg) => {
          const len = Math.max(seg.weight * c - gap, 0.001);
          const dash = `${len} ${c - len}`;
          const offset = -acc * c;
          acc += seg.weight;
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
            >
              <title>{`${seg.label} · ${(seg.weight * 100).toFixed(1)}%`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-[19px] font-semibold text-ink">{centerTop}</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ink3">{centerBottom}</span>
      </div>
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
  const segs = fold(segsAll);
  const div = diversificationRead(holdings);

  const pricedValue = holdings.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  // centre count = number of ring slices for this cut (priced positions / sectors / tiers)
  const centerTop = String(segsAll.length);
  const centerBottom = cut === "stock" ? "positions" : cut === "marketcap" ? "cap tiers" : "sectors";

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
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
                cut === m.id ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-ink3">
          by value · <span className="num text-ink2">{formatINR(pricedValue, { compact: true })}</span> priced
        </span>
      </div>

      {segs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line2 bg-surface-2/50 px-5 py-10 text-center text-[12.5px] text-ink3">
          Allocation appears once your holdings carry live prices — nothing is charted from cost alone.
        </p>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <Donut segs={segs} centerTop={centerTop} centerBottom={centerBottom} />

          {/* legend */}
          <div className="min-w-0 flex-1">
            <ul className="flex flex-col gap-1.5">
              {segs.map((seg) => (
                <li key={seg.key} className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: seg.color }} />
                  <span className="min-w-0 flex-1 truncate text-ink2">{seg.label}</span>
                  {seg.meta && <span className="hidden truncate text-[10.5px] text-ink3 sm:inline">{seg.meta}</span>}
                  <span className="num shrink-0 font-medium text-ink">{(seg.weight * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>

          {/* diversification read — the short concentration story */}
          <div className="grid shrink-0 grid-cols-3 gap-4 border-t border-line pt-4 lg:w-44 lg:grid-cols-1 lg:gap-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <Stat label="Top-3 concentration" value={`${Math.round(div.top3 * 100)}%`} />
            <Stat label="Sectors held" value={String(div.sectorCount)} />
            <Stat
              label="Largest position"
              value={div.largest ? `${Math.round(div.largest.weight * 100)}%` : "—"}
              sub={div.largest?.symbol}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">{label}</p>
      <p className="num mt-0.5 text-[18px] font-medium text-ink">{value}</p>
      {sub && <p className="num text-[10.5px] text-ink3">{sub}</p>}
    </div>
  );
}
