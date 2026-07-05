"use client";

import { formatINR } from "@/lib/format";
import type { Transaction } from "@/types/portfolio";
import { ledgerSummary } from "./lib";

const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v))}`;
const pnlColor = (v: number) => (v > 0 ? "var(--success)" : v < 0 ? "var(--danger)" : "var(--ink2)");

function Tile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-1 px-4 py-3">
      <p className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">{label}</p>
      <p className="num mt-1 text-[17px] font-medium" style={{ color: color ?? "var(--ink)" }}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10.5px] text-ink3">{sub}</p>}
    </div>
  );
}

/**
 * Ledger summary strip. Invested / withdrawn / dividends / charges are ARITHMETIC over the
 * ledger the user entered. Realized (booked) P&L is READ from the server-computed holdings
 * totals (FIFO across all positions incl. exited, now fee-aware) — never recomputed here.
 * The STCG/LTCG split has no ledger field yet, so it stays an honest noted slot.
 */
export function SummaryStrip({ txns, realizedPnl }: { txns: Transaction[]; realizedPnl: number | null }) {
  const s = ledgerSummary(txns);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <Tile
          label="Invested"
          value={formatINR(s.invested, { compact: true })}
          sub={`${s.buyCount} buy${s.buyCount === 1 ? "" : "s"}`}
        />
        <Tile
          label="Withdrawn"
          value={formatINR(s.withdrawn, { compact: true })}
          sub={`${s.sellCount} sell${s.sellCount === 1 ? "" : "s"}`}
        />
        <Tile
          label="Realized P&L"
          value={realizedPnl != null ? signINR(realizedPnl) : "—"}
          sub="booked · after replay"
          color={realizedPnl != null ? pnlColor(realizedPnl) : undefined}
        />
        <Tile
          label="Dividends"
          value={s.dividendCount > 0 ? formatINR(s.dividends, { compact: true }) : "—"}
          sub={`${s.dividendCount} recorded`}
          color={s.dividends > 0 ? "var(--rec)" : undefined}
        />
        <Tile
          label="Charges"
          value={formatINR(s.charges, { compact: true })}
          sub="fees you entered"
          color={s.charges > 0 ? "var(--high)" : undefined}
        />
      </div>
      <p className="mt-2 px-1 text-[10.5px] text-ink3">
        Realized P&amp;L is the server&apos;s FIFO figure, read as-is — now net of the fees you record (a buy fee raises
        cost basis, a sell fee lowers proceeds). The STCG / LTCG split arrives in Phase 3 — noted, not yet built.
      </p>
    </div>
  );
}
