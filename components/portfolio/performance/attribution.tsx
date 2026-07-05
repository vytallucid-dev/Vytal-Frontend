"use client";

import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Holding } from "@/types/portfolio";
import { type ContributionRow, contributions } from "../lib";

// ─────────────────────────────────────────────────────────────────────────────
// CONTRIBUTORS & DETRACTORS — returns attribution: which holdings added / subtracted the
// most from TOTAL return, by ₹ and share of the net. This is P&L attribution, NOT health
// and NOT today's movers. ZERO health element: no health column, dot, tint or copy.
// ─────────────────────────────────────────────────────────────────────────────

const pnlColor = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;

// One attribution row — symbol · contribution-share bar · share % · ₹ P&L. The bar width
// is |contribution|; its colour is the P&L sign. No health anywhere.
function Row({ r, max }: { r: ContributionRow; max: number }) {
  const share = r.contribution != null ? r.contribution : null;
  const barPct = max > 0 ? (Math.abs(r.pnl) / max) * 100 : 0;
  const pos = r.pnl >= 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="num w-24 shrink-0 truncate text-[12.5px] font-medium text-ink">{r.holding.symbol}</span>
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(barPct, 2)}%`, background: pos ? "var(--success)" : "var(--danger)" }}
        />
      </div>
      {share != null && (
        <span className="num w-14 shrink-0 text-right text-[10.5px] text-ink3">{Math.round(share * 100)}% of net</span>
      )}
      <span className={cn("num w-20 shrink-0 text-right text-[12.5px]", pnlColor(r.pnl))}>{signINR(r.pnl)}</span>
    </div>
  );
}

function Panel({ title, rows, empty }: { title: string; rows: ContributionRow[]; empty: string }) {
  const max = Math.max(0, ...rows.map((r) => Math.abs(r.pnl)));
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5">
      <p className="kicker mb-3">{title}</p>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-4 py-6 text-center text-[12px] text-ink3">
          {empty}
        </p>
      ) : (
        <div className="divide-y divide-line/60">
          {rows.map((r) => (
            <Row key={r.holding.symbol} r={r} max={max} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Attribution({ holdings }: { holdings: Holding[] }) {
  // Top 5 each way — attribution to TOTAL unrealized return, by ₹ (share % of the net).
  const { contributors, detractors } = contributions(holdings, 5);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Panel title="Top contributors" rows={contributors} empty="No positions in the green." />
      <Panel title="Top detractors" rows={detractors} empty="No positions in the red." />
    </div>
  );
}
