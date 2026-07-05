"use client";

import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Holding, HoldingsTotals } from "@/types/portfolio";
import { type SectorPnl, sectorPnl } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────
// RETURNS BREAKDOWN — realized vs unrealized P&L, sector P&L (which sectors made/lost),
// and dividend income. Pure P&L accounting. ZERO health element anywhere.
// ─────────────────────────────────────────────────────────────────────────────

const pnlColor = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const pnlVar = (v: number) => (v >= 0 ? "var(--success)" : "var(--danger)");
const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;
const signPct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`;

// realized vs unrealized (+ dividends) — each a labelled ₹ figure with a |value|-scaled bar.
function PnlRow({ label, value, max, note }: { label: string; value: number; max: number; note?: string }) {
  const barPct = max > 0 ? (Math.abs(value) / max) * 100 : 0;
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] text-ink2">{label}</span>
        <span className={cn("num text-[13px] font-medium", pnlColor(value))}>{signINR(value)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${Math.max(barPct, 2)}%`, background: pnlVar(value) }} />
      </div>
      {note && <p className="mt-1 text-[10.5px] text-ink3">{note}</p>}
    </div>
  );
}

function RealizedUnrealized({ totals, dividends }: { totals: HoldingsTotals; dividends: number }) {
  const realized = totals.realizedPnlAll;
  const unrealized = totals.unrealizedPnl;
  const max = Math.max(Math.abs(realized), Math.abs(unrealized), Math.abs(dividends), 1);
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5">
      <p className="kicker mb-3">Realized vs unrealized</p>
      <div className="divide-y divide-line/60">
        <PnlRow label="Unrealized P&L" value={unrealized} max={max} note="marked to last close on open positions" />
        <PnlRow label="Realized P&L" value={realized} max={max} note="booked on closed positions" />
        {dividends > 0 && <PnlRow label="Dividend income" value={dividends} max={max} note="cash received from the ledger" />}
      </div>
    </div>
  );
}

// sector P&L — which sectors made / lost money (by unrealized ₹). Diverging bars from a
// centre line: winners extend right (green), losers left (red). No health input.
function SectorRow({ s, max }: { s: SectorPnl; max: number }) {
  const pos = s.pnl >= 0;
  const barPct = max > 0 ? (Math.abs(s.pnl) / max) * 50 : 0; // half-width each side of centre
  return (
    <div className="flex items-center gap-2 py-1.5 text-[12px]">
      <span className="w-28 shrink-0 truncate text-ink2">{s.sector}</span>
      <div className="relative h-2 min-w-0 flex-1">
        <div className="absolute inset-y-0 left-1/2 w-px bg-line2" />
        <div
          className="absolute inset-y-0 rounded-sm"
          style={{
            width: `${Math.max(barPct, 1)}%`,
            [pos ? "left" : "right"]: "50%",
            background: pnlVar(s.pnl),
          } as React.CSSProperties}
        />
      </div>
      {s.returnPct != null && <span className="num w-12 shrink-0 text-right text-[10.5px] text-ink3">{signPct(s.returnPct)}</span>}
      <span className={cn("num w-16 shrink-0 text-right", pnlColor(s.pnl))}>{signINR(s.pnl)}</span>
    </div>
  );
}

function SectorBreakdown({ holdings }: { holdings: Holding[] }) {
  const rows = sectorPnl(holdings);
  const max = Math.max(0, ...rows.map((r) => Math.abs(r.pnl)));
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5">
      <p className="kicker mb-3">P&amp;L by sector</p>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-4 py-6 text-center text-[12px] text-ink3">
          No priced positions to attribute yet.
        </p>
      ) : (
        <div className="divide-y divide-line/60">
          {rows.map((s) => (
            <SectorRow key={s.sector} s={s} max={max} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ReturnsBreakdown({
  holdings,
  totals,
  dividends,
}: {
  holdings: Holding[];
  totals: HoldingsTotals;
  dividends: number;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <RealizedUnrealized totals={totals} dividends={dividends} />
      <SectorBreakdown holdings={holdings} />
    </div>
  );
}
