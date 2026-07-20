"use client";

import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { BrokerExcluded, Holding, HoldingsTotals, XirrResponse } from "@/types/portfolio";
import { brokerGapValue } from "../lib";
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
  loading,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  color?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <p className=" text-[9.5px] uppercase tracking-[0.1em] text-ink3">{label}</p>
      {loading ? (
        <>
          <div className="mt-1.5 h-4 w-3/4 animate-pulse rounded bg-surface-2" />
          <div className="mt-2 h-2 w-1/2 animate-pulse rounded bg-surface-2/70" />
        </>
      ) : (
        <>
          <p className={cn("num mt-1 text-[20px] font-semibold leading-none", color ?? "text-ink")}>{value}</p>
          {sub && <p className="num mt-1.5 text-[10.5px] leading-tight text-ink3">{sub}</p>}
        </>
      )}
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
  periodLoading,
  brokerGap,
  scoped,
  dayChange,
}: {
  holdings: Holding[];
  totals: HoldingsTotals;
  xirr: XirrResponse | undefined;
  xirrLoading: boolean;
  /** The return window (TWR / alpha / best-worst). Whole-book mode: the period-selected window. `scoped`
   *  mode: computed over the ACCOUNT's full NAV dates (the account's own TWR + vs-Nifty now exist —
   *  backend account-scoped) so the TWR + vs-Nifty tiles pair with the account's value line. Best/worst
   *  day stays a whole-book-only read. */
  win?: WindowReturns;
  bestWorst?: { best: DayReturn; worst: DayReturn } | null;
  periodLabel?: string;
  /** the period-dependent reads (NAV / TWR / benchmark) are still loading → skeleton those tiles */
  periodLoading?: boolean;
  /** The broker-linked value the ledgered XIRR / return series leave out (NAV meta), so the tile row
   *  can DISCLOSE — not reconcile — that "Current" (union) and XIRR (ledger) count different populations
   *  on a broker-linked book. Null / absent ⇒ no gap, render nothing. */
  brokerGap?: BrokerExcluded | null;
  /** ACCOUNT-SCOPED (single account) mode: the per-account tiles — Total return, XIRR (client-computed
   *  over this account's ledger), the account's TWR + vs-Nifty (from `win`, computed over the account's
   *  own NAV/TWR/benchmark), Current/Invested, and Day change ₹. Best/worst-day is the one measure kept
   *  whole-book-only here (the day-change ₹ tile is this book's "today" read instead). */
  scoped?: boolean;
  /** Σ dayChangeValue over the account's priced rows — the scoped "today" ₹ signal (replaces the
   *  whole-book best/worst-day % tile). null ⇒ no priced row carried a day move. */
  dayChange?: number | null;
}) {
  const investedPriced = holdings.filter((h) => h.marketValue != null).reduce((s, h) => s + h.investedValue, 0);
  const unrealized = totals.unrealizedPnl;
  const totalReturnPct = investedPriced > 0 ? (unrealized / investedPriced) * 100 : 0;
  // Same gate the NAV-chart caption uses (shared brokerGapValue) — the tiles and the chart agree on
  // whether a gap exists, so the disclosure appears exactly when broker holdings are priced separately.
  const gapValue = brokerGapValue(brokerGap);

  const xirrPct = xirr?.xirrPct ?? null;
  const xirrNote = xirr && xirr.state !== "ok" ? XIRR_STATE_NOTE[xirr.state] ?? "Not available yet." : null;

  // ── ACCOUNT-SCOPED: the honest per-account tiles. TWR + vs-Nifty now scope cleanly (backend
  //    account-scoped /twr + /benchmark, paired with the account's own value line via `win`), so they
  //    join the row here. Best/worst-day is the one measure kept whole-book-only; the day-change ₹ tile
  //    is this book's "today" read. Sparse honesty: an account with < 2 NAV points has no resolvable TWR,
  //    so `win.portfolioPct` is null and the tile reads "needs more history" — never a fabricated figure. ──
  if (scoped) {
    // The account's TWR + alpha, over its OWN full NAV window (same source as its value line above).
    const twrPct = win?.portfolioPct ?? null;
    const alphaPct = win?.alphaPct ?? null;
    const niftyPct = win?.niftyPct ?? null;
    return (
      <div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <Tile
            label="Total return"
            value={signINR(unrealized)}
            sub={<span className={pnlColor(unrealized)}>{signPct(totalReturnPct)} on invested</span>}
            color={pnlColor(unrealized)}
          />
          <Tile
            label="XIRR"
            loading={xirrLoading}
            value={xirrPct != null ? signPct(xirrPct) : "—"}
            sub={xirrPct != null ? "money-weighted · annualized" : xirrNote ?? "needs this book's own ledger"}
            color={pctColor(xirrPct)}
          />
          {/* TWR — this account's time-weighted return (deposits/sells stripped), over its whole history.
              Sparse (< 2 points) ⇒ "needs more history", never a fabricated number. */}
          <Tile
            label="TWR"
            loading={periodLoading}
            value={twrPct != null ? signPct(twrPct) : "—"}
            sub={twrPct != null ? "time-weighted · since inception" : "needs more history"}
            color={pctColor(twrPct)}
          />
          {/* vs Nifty 50 — the account's alpha (its TWR − Nifty over the SAME window). Same account as the
              value line and the TWR tile — never a whole-book overlay. */}
          <Tile
            label="vs Nifty 50"
            loading={periodLoading}
            value={alphaPct != null ? signPct(alphaPct) : "—"}
            sub={
              niftyPct != null ? (
                <>
                  Nifty <span className={pctColor(niftyPct)}>{signPct(niftyPct)}</span>
                </>
              ) : twrPct != null ? (
                "benchmark unavailable"
              ) : (
                "needs more history"
              )
            }
            color={pctColor(alphaPct)}
          />
          <Tile
            label="Current / Invested"
            value={formatINR(totals.currentValue, { compact: true })}
            sub={<>on {formatINR(totals.investedValue, { compact: true })} invested</>}
          />
          <Tile
            label="Day change"
            value={dayChange != null ? signINR(dayChange) : "—"}
            sub={dayChange != null ? "at last close" : "no priced move"}
            color={dayChange != null ? pnlColor(dayChange) : undefined}
          />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-ink3">
          <span className="font-medium text-ink2">TWR</span> (time-weighted) and the Nifty comparison strip this
          account&apos;s deposits &amp; sells to show how its holdings performed; <span className="font-medium text-ink2">
          XIRR</span> (money-weighted) keeps them — over this account&apos;s own ledger — to show what its timing &amp;
          sizing earned. Best/worst day stays a whole-book read.
        </p>
      </div>
    );
  }

  // whole-book period measures — null-safe (the props are optional so the scoped path can omit them).
  const portfolioPct = win?.portfolioPct ?? null;
  const alphaPct = win?.alphaPct ?? null;
  const niftyPct = win?.niftyPct ?? null;
  const pLabel = periodLabel ?? "";

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
          loading={xirrLoading}
          value={xirrPct != null ? signPct(xirrPct) : "—"}
          sub={xirrPct != null ? "money-weighted · annualized" : xirrNote ?? "money-weighted · annualized"}
          color={pctColor(xirrPct)}
        />

        {/* 3 · TWR — time-weighted, this period (LABELED DISTINCT from XIRR) */}
        <Tile
          label={`TWR · ${pLabel}`}
          loading={periodLoading}
          value={portfolioPct != null ? signPct(portfolioPct) : "—"}
          sub="time-weighted"
          color={pctColor(portfolioPct)}
        />

        {/* 4 · vs benchmark (alpha) — this period */}
        <Tile
          label={`vs Nifty 50 · ${pLabel}`}
          loading={periodLoading}
          value={alphaPct != null ? signPct(alphaPct) : "—"}
          sub={
            niftyPct != null ? (
              <>
                Nifty <span className={pctColor(niftyPct)}>{signPct(niftyPct)}</span>
              </>
            ) : (
              "benchmark unavailable"
            )
          }
          color={pctColor(alphaPct)}
        />

        {/* 5 · current vs invested — since inception */}
        <Tile
          label="Current / Invested"
          value={formatINR(totals.currentValue, { compact: true })}
          sub={<>on {formatINR(totals.investedValue, { compact: true })} invested</>}
        />

        {/* 6 · best / worst day — this period. Two figures share the box, so they run a step
            smaller than a single-value tile to fit cleanly on every screen. */}
        <Tile
          label={`Best / worst day · ${pLabel}`}
          loading={periodLoading}
          value={
            bestWorst ? (
              <span className="inline-flex flex-wrap items-baseline gap-1 whitespace-nowrap text-[15px]">
                <span className="text-success">{signPct(bestWorst.best.pct)}</span>
                <span className="text-[12px] text-ink3">/</span>
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

      {/* two-population disclosure — "Current" is the manual ⊎ broker union (what you hold now); XIRR &
          the return series are ledger-derived (broker holdings have no cashflow history), so on a
          broker-linked book they legitimately count different money. Disclose the gap AT the tiles;
          never collapse the two to one number — they answer different questions. */}
      {gapValue != null && (
        <p className="mt-3 text-[11px] leading-relaxed text-ink3">
          XIRR and the return series cover your <span className="text-ink2">ledgered holdings</span>;{" "}
          <span className="num text-ink2">{formatINR(gapValue, { compact: true })}</span> in broker-linked holdings is
          priced separately in <span className="text-ink2">Current</span>.
        </p>
      )}

      {/* the two measures, disambiguated — the "why are there two return numbers" line */}
      <p className="mt-3 text-[11px] leading-relaxed text-ink3">
        <span className="font-medium text-ink2">TWR</span> (time-weighted) strips your deposits and sells to show how your{" "}
        picks performed; <span className="font-medium text-ink2">XIRR</span> (money-weighted) keeps them to show what your{" "}
        timing &amp; sizing earned — two different questions, both shown.
      </p>
    </div>
  );
}
