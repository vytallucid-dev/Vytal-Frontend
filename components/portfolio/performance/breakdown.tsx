"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Holding, HoldingsTotals } from "@/types/portfolio";
import { CursorTooltip, TipLine, useCursorTooltip } from "@/components/ui/cursor-tooltip";
import { type PnlGroup, classPnl, sectorPnl } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────
// RETURNS BREAKDOWN — one full-width stacked section:
//   TOP    — P&L by sector / class as HORIZONTAL DIVERGING ROWS (all widths): one full-width row per
//            category — name (left, truncated), a centre-anchored bar (gain right/green, loss left/red),
//            then the return % and the ₹ P&L. Every category keeps its row, so a ₹0 / near-zero bucket
//            shows its number in the label column instead of vanishing as a hairline. Sector/Class
//            toggle. Cursor-following tooltip per row. Naturally responsive — rows just stack.
//   BOTTOM — Realized vs Unrealized, full width, as an EXPLANATORY strip (each figure + a magnitude bar +
//            what it means, plus the distinction line). Cards stack on mobile.
// Pure P&L accounting. ZERO health element anywhere.
// ─────────────────────────────────────────────────────────────────────────────

const pnlColor = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const pnlVar = (v: number) => (v >= 0 ? "var(--success)" : "var(--danger)");
const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;
const signPct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`;
const pnlLabel = (v: number) => (v === 0 ? "₹0" : signINR(v));

// ── TOP · P&L by sector / class — horizontal diverging rows ──────────────────────────────────────
type GroupMode = "sector" | "class";

// One category row — name · centre-anchored diverging bar · return % · ₹ P&L. A ₹0 bucket draws no
// bar (just the centre tick) and shows "₹0"; a tiny non-zero bucket shows a minimal stub on the
// correct side. Bar length = |₹ P&L| / the largest |P&L| across the visible categories.
function DivergingRow({
  s,
  max,
  handlers,
}: {
  s: PnlGroup;
  max: number;
  handlers: React.DOMAttributes<HTMLDivElement>;
}) {
  const pos = s.pnl >= 0;
  const barPct = max > 0 ? (Math.abs(s.pnl) / max) * 50 : 0; // half-width each side of centre
  return (
    <div className="flex cursor-default items-center gap-2 rounded py-1.5 text-[12px] transition-colors hover:bg-surface-2/40" {...handlers}>
      <span className="w-24 shrink-0 truncate text-ink2 sm:w-40" title={s.label}>{s.label}</span>
      <div className="relative h-2 min-w-0 flex-1">
        <div className="absolute inset-y-0 left-1/2 w-px bg-line2" />
        {s.pnl !== 0 && (
          <div
            className="absolute inset-y-0 rounded-sm"
            style={{ width: `${Math.max(barPct, 1)}%`, [pos ? "left" : "right"]: "50%", background: pnlVar(s.pnl) } as React.CSSProperties}
          />
        )}
      </div>
      {s.returnPct != null && <span className="num w-11 shrink-0 text-right text-[10.5px] text-ink3">{signPct(s.returnPct)}</span>}
      <span className={cn("num w-16 shrink-0 text-right", pnlColor(s.pnl))}>{pnlLabel(s.pnl)}</span>
    </div>
  );
}

function PnlChart({ holdings }: { holdings: Holding[] }) {
  const [mode, setMode] = useState<GroupMode>("sector");
  const rows = mode === "sector" ? sectorPnl(holdings) : classPnl(holdings); // already sorted gainers-first
  const hasDebt = mode === "class" && rows.some((r) => r.couponBearing);
  const maxAbs = Math.max(0, ...rows.map((r) => Math.abs(r.pnl))); // bar-scaling reference

  const tip = useCursorTooltip();
  const [hi, setHi] = useState<number | null>(null);
  const hovered = hi != null ? rows[hi] : null;

  const sub =
    mode === "sector"
      ? "Unrealized P&L per sector — where your open gains and losses sit."
      : hasDebt
        ? "Unrealized P&L per asset class. Debt is price return only — coupon income isn't tracked, so a bond's total return is understated."
        : "Unrealized P&L per asset class.";

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker">P&amp;L by {mode}</p>
          <p className="mt-1 max-w-prose text-[11px] leading-relaxed text-ink3">{sub}</p>
        </div>
        <div className="flex shrink-0 gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5">
          {(["sector", "class"] as GroupMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setHi(null); }}
              className={cn(
                "rounded-md px-2 py-0.5 text-[10.5px] font-medium capitalize transition-colors",
                mode === m ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line2 bg-surface-2/50 px-4 py-6 text-center text-[12px] text-ink3">
          No priced positions to attribute yet.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-line/60">
          {rows.map((s, i) => (
            <DivergingRow
              key={s.label}
              s={s}
              max={maxAbs}
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
            <span className="mb-0.5 font-medium text-ink">{hovered.label}</span>
            <TipLine label="P&L" value={pnlLabel(hovered.pnl)} className={pnlColor(hovered.pnl)} />
            {hovered.returnPct != null && <TipLine label="Return" value={signPct(hovered.returnPct)} className={pnlColor(hovered.returnPct)} />}
            {hovered.couponBearing && <span className="mt-0.5 whitespace-normal text-[10px] leading-snug text-ink3">Price return only — coupons aren&apos;t tracked.</span>}
          </div>
        )}
      </CursorTooltip>
    </div>
  );
}

// ── BOTTOM · Realized vs Unrealized — full-width explanatory strip ───────────────────────────────
function MeaningCard({ label, value, max, meaning }: { label: string; value: number; max: number; meaning: string }) {
  const pct = max > 0 ? (Math.abs(value) / max) * 100 : 0;
  return (
    <div className="rounded-lg border border-line bg-surface-2/40 p-3.5">
      <p className="text-[10px] uppercase tracking-wide text-ink3">{label}</p>
      <p className={cn("num mt-1 text-[19px] font-semibold leading-none", pnlColor(value))}>{signINR(value)}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: pnlVar(value) }} />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-ink3">{meaning}</p>
    </div>
  );
}

function RealizedUnrealizedStrip({ totals, dividends }: { totals: HoldingsTotals; dividends: number }) {
  const unrealized = totals.unrealizedPnl;
  const realized = totals.realizedPnlAll;
  // Magnitude bars scaled to the LARGEST of the three figures, so the bars are comparable across cards.
  const barMax = Math.max(Math.abs(unrealized), Math.abs(realized), Math.abs(dividends), 1);
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5">
      <p className="kicker mb-3">Realized vs unrealized</p>
      <div className={cn("grid gap-2.5 sm:grid-cols-2", dividends > 0 && "lg:grid-cols-3")}>
        <MeaningCard
          label="Unrealized P&L"
          value={unrealized}
          max={barMax}
          meaning="On paper — marked to last close on your open positions. It moves with prices every day, and only becomes real when you sell."
        />
        <MeaningCard
          label="Realized P&L"
          value={realized}
          max={barMax}
          meaning="Booked — locked in when you sold, settled and won't change. Dividends you've received are counted here too."
        />
        {dividends > 0 && (
          <MeaningCard
            label="Dividend income"
            value={dividends}
            max={barMax}
            meaning="Cash received from the ledger — already in hand, independent of where prices go next."
          />
        )}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink3">
        <span className="text-ink2">Unrealized</span> is what your open positions are worth now versus what they cost;{" "}
        <span className="text-ink2">realized</span> is what you&apos;ve actually banked. A large unrealized gain isn&apos;t money
        in hand until you sell — and a realized loss is already spent, even if the position later recovers.
      </p>
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
    <div className="space-y-3">
      <PnlChart holdings={holdings} />
      <RealizedUnrealizedStrip totals={totals} dividends={dividends} />
    </div>
  );
}
