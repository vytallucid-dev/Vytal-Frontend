"use client";

import type { DOMAttributes } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Holding } from "@/types/portfolio";
import { CursorTooltip, TipLine, useCursorTooltip } from "@/components/ui/cursor-tooltip";
import { type ContributionRow, contributions } from "../lib";

// ─────────────────────────────────────────────────────────────────────────────
// CONTRIBUTORS & DETRACTORS — returns attribution: which holdings added / subtracted the
// most from TOTAL return, by ₹ and share of the net. This is P&L attribution, NOT health
// and NOT today's movers. ZERO health element: no health column, dot, tint or copy.
//
// Fully fluid rows (name flexes-and-truncates, bar shrinks, %/₹ fixed) so a card never overflows
// when it's cramped, and the two panels stack until there's real room for two (lg). A cursor-following
// tooltip per row carries the full name + ₹ + share.
// ─────────────────────────────────────────────────────────────────────────────

const pnlColor = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;

/** NAME leads over a raw ISIN — the standing rule (Holdings preview / what's-moving): a stock keeps its
 *  ticker, but a fund/bond/ETF whose ticker fell back to its ISIN (`symbol === isin`) shows its
 *  instrument name. `ticker` gates the mono `num` font (a ticker/ISIN is monospaced; a name is not). */
function rowLabel(h: Holding): { text: string; ticker: boolean } {
  const isIsinFallback = !!h.isin && h.symbol === h.isin;
  return isIsinFallback ? { text: h.name || h.symbol, ticker: false } : { text: h.symbol, ticker: true };
}

// One attribution row — name/ticker · contribution-share bar · share % · ₹ P&L. The bar width
// is |contribution|; its colour is the P&L sign. No health anywhere.
function Row({ r, max, handlers }: { r: ContributionRow; max: number; handlers: DOMAttributes<HTMLDivElement> }) {
  const share = r.contribution != null ? r.contribution : null;
  const barPct = max > 0 ? (Math.abs(r.pnl) / max) * 100 : 0;
  const pos = r.pnl >= 0;
  const label = rowLabel(r.holding);
  return (
    <div className="flex cursor-default items-center gap-2.5 rounded py-1.5 transition-colors hover:bg-surface-2/40" {...handlers}>
      <span className={cn("w-20 shrink-0 truncate text-[12.5px] font-medium text-ink sm:w-24", label.ticker && "num")} title={label.text}>
        {label.text}
      </span>
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${Math.max(barPct, 2)}%`, background: pos ? "var(--success)" : "var(--danger)" }} />
      </div>
      {share != null && <span className="num w-9 shrink-0 text-right text-[10px] text-ink3">{Math.round(share * 100)}%</span>}
      <span className={cn("num w-16 shrink-0 text-right text-[12.5px]", pnlColor(r.pnl))}>{signINR(r.pnl)}</span>
    </div>
  );
}

function Panel({ title, rows, empty }: { title: string; rows: ContributionRow[]; empty: string }) {
  const max = Math.max(0, ...rows.map((r) => Math.abs(r.pnl)));
  const tip = useCursorTooltip();
  const [hi, setHi] = useState<number | null>(null);
  const hovered = hi != null ? rows[hi] : null;
  const hoveredShare = hovered?.contribution ?? null;
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5">
      <p className="kicker mb-3">{title}</p>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-4 py-6 text-center text-[12px] text-ink3">
          {empty}
        </p>
      ) : (
        <div className="divide-y divide-line/60">
          {rows.map((r, i) => (
            <Row
              key={r.holding.symbol}
              r={r}
              max={max}
              handlers={{
                onPointerEnter: (e) => { setHi(i); tip.handlers.onPointerEnter(e); },
                onPointerMove: tip.handlers.onPointerMove,
                onPointerLeave: () => { setHi(null); tip.handlers.onPointerLeave(); },
              }}
            />
          ))}
        </div>
      )}
      <CursorTooltip open={tip.open && hovered != null} pos={tip.pos}>
        {hovered && (
          <div className="flex flex-col gap-0.5">
            <span className="mb-0.5 font-medium text-ink">{rowLabel(hovered.holding).text}</span>
            <TipLine label="P&L" value={signINR(hovered.pnl)} className={pnlColor(hovered.pnl)} />
            {hoveredShare != null && <TipLine label="Share of net" value={`${Math.round(hoveredShare * 100)}%`} className="text-ink2" />}
          </div>
        )}
      </CursorTooltip>
    </div>
  );
}

export function Attribution({ holdings }: { holdings: Holding[] }) {
  // Top 5 each way — attribution to TOTAL unrealized return, by ₹ (share % of the net).
  const { contributors, detractors } = contributions(holdings, 5);
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Top contributors" rows={contributors} empty="No positions in the green." />
      <Panel title="Top detractors" rows={detractors} empty="No positions in the red." />
    </div>
  );
}
