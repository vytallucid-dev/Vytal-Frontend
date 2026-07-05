"use client";

import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Holding, HoldingsTotals, XirrResponse } from "@/types/portfolio";
import { XIRR_STATE_NOTE, type DayReturn, type WindowReturns } from "./lib";

const pnlColor = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const signPct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}%`;
const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MON[m - 1]} '${String(y).slice(2)}`;
};

// ── one summary tile — a label, the figure, and a basis sub-line so nothing is misread.
//    `tone` colours the figure by P&L sign (returns domain); "neutral" stays ink. ───────
function Tile({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <p className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">{label}</p>
      <p className={cn("num mt-1 text-[20px] font-semibold leading-none", color ?? "text-ink")}>{value}</p>
      {sub && <p className="num mt-1.5 text-[10.5px] leading-tight text-ink3">{sub}</p>}
    </div>
  );
}

function pctColor(v: number | null) {
  return v == null ? "text-ink3" : v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2";
}

/**
 * Returns summary — absolute return, XIRR, TWR, vs-benchmark alpha, current/invested, and
 * best/worst day. XIRR (money-weighted) and TWR (time-weighted) are shown as DISTINCT
 * measures, each with its basis. Returns green/red is the P&L domain (the star here).
 * ZERO health: no health figure, column, tint or copy anywhere in this component.
 */
export function ReturnsSummary({
  holdings,
  totals,
  xirr,
  xirrLoading,
  win,
  bestWorst,
  periodLabel,
}: {
  holdings: Holding[];
  totals: HoldingsTotals;
  xirr: XirrResponse | undefined;
  xirrLoading: boolean;
  win: WindowReturns;
  bestWorst: { best: DayReturn; worst: DayReturn } | null;
  periodLabel: string;
}) {
  const investedPriced = holdings.filter((h) => h.marketValue != null).reduce((s, h) => s + h.investedValue, 0);
  const unrealized = totals.unrealizedPnl;
  const totalReturnPct = investedPriced > 0 ? (unrealized / investedPriced) * 100 : 0;

  const xirrPct = xirr?.xirrPct ?? null;
  const xirrNote = xirr && xirr.state !== "ok" ? XIRR_STATE_NOTE[xirr.state] ?? "Not available yet." : null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1 · absolute return (₹ + %) — since inception, mark-to-market */}
        <Tile
          label="Total return"
          value={signINR(unrealized)}
          sub={<span className={pnlColor(unrealized)}>{signPct(totalReturnPct)} on invested</span>}
          color={pnlColor(unrealized)}
        />

        {/* 2 · XIRR — money-weighted, annualized, since inception */}
        <Tile
          label="XIRR"
          value={xirrLoading ? "…" : xirrPct != null ? signPct(xirrPct) : "—"}
          sub={xirrPct != null ? "money-weighted · annualized" : xirrNote ?? "money-weighted · annualized"}
          color={xirrLoading ? "text-ink3" : pctColor(xirrPct)}
        />

        {/* 3 · TWR — time-weighted, this period (LABELED DISTINCT from XIRR) */}
        <Tile
          label={`TWR · ${periodLabel}`}
          value={win.portfolioPct != null ? signPct(win.portfolioPct) : "—"}
          sub="time-weighted"
          color={pctColor(win.portfolioPct)}
        />

        {/* 4 · vs benchmark (alpha) — this period */}
        <Tile
          label={`vs Nifty 50 · ${periodLabel}`}
          value={win.alphaPct != null ? signPct(win.alphaPct) : "—"}
          sub={
            win.niftyPct != null ? (
              <>
                Nifty <span className={pctColor(win.niftyPct)}>{signPct(win.niftyPct)}</span>
              </>
            ) : (
              "benchmark unavailable"
            )
          }
          color={pctColor(win.alphaPct)}
        />

        {/* 5 · current vs invested — since inception */}
        <Tile
          label="Current / Invested"
          value={formatINR(totals.currentValue, { compact: true })}
          sub={<>on {formatINR(totals.investedValue, { compact: true })} invested</>}
        />

        {/* 6 · best / worst day — this period */}
        <Tile
          label={`Best / worst day · ${periodLabel}`}
          value={
            bestWorst ? (
              <span className="inline-flex items-baseline gap-1.5">
                <span className="text-success">{signPct(bestWorst.best.pct)}</span>
                <span className="text-[13px] text-ink3">/</span>
                <span className="text-danger">{signPct(bestWorst.worst.pct)}</span>
              </span>
            ) : (
              "—"
            )
          }
          sub={
            bestWorst ? (
              <>
                {shortDate(bestWorst.best.date)} · {shortDate(bestWorst.worst.date)}
              </>
            ) : (
              "needs a longer window"
            )
          }
        />
      </div>

      {/* the two measures, disambiguated — the "why are there two return numbers" line */}
      <p className="mt-3 text-[11px] leading-relaxed text-ink3">
        <span className="font-medium text-ink2">TWR</span> (time-weighted) strips your deposits and sells to show how your{" "}
        picks performed; <span className="font-medium text-ink2">XIRR</span> (money-weighted) keeps them to show what your{" "}
        timing &amp; sizing earned — two different questions, both shown.
      </p>
    </div>
  );
}
