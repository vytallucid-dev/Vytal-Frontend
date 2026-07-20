"use client";

import { useEffect, useMemo, useState } from "react";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { usePortfolioNav } from "@/lib/api/hooks/use-portfolio-nav";
import type { Holding, HoldingsTotals } from "@/types/portfolio";
import { diversificationRead, sectorCountLabel, sectorCoverageShort } from "../lib";
import { aggregateHoldings } from "../health/lib";
import { Kicker, NiftySoon } from "./shared";
import { NavChart } from "./nav-chart";

const PERIODS = ["1M", "6M", "1Y", "3Y", "4Y"] as const;

/** The chart header shown for the loading / empty states (disabled selector). */
function StubHeader() {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <Kicker>Portfolio value over time</Kicker>
      <div className="flex items-center gap-2">
        <NiftySoon />
        <div className="flex gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5 opacity-50">
          {PERIODS.map((p) => (
            <span key={p} className="cursor-not-allowed rounded-md px-2.5 py-1 text-[11px] font-medium text-ink3">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function signPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function signINR(v: number) {
  return `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;
}
const pnlColor = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");

export function ValueHero({ holdings, totals }: { holdings: Holding[]; totals: HoldingsTotals }) {
  const navQ = usePortfolioNav();
  // Count up on load: start at 0, then set the real value after mount so NumberFlow
  // animates (it renders a static value on first mount otherwise).
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => setDisplayValue(totals.currentValue), [totals.currentValue]);
  const investedPriced = holdings
    .filter((h) => h.marketValue != null)
    .reduce((s, h) => s + h.investedValue, 0);
  const totalReturn = totals.unrealizedPnl;
  const returnPct = investedPriced > 0 ? (totalReturn / investedPriced) * 100 : 0;
  const dayVal = totals.dayChangeValue;
  const dayPct = totals.dayChangePct;
  // The SHARED sector read (was an inline Set that counted an "ETF" bucket as a sector — see
  // diversificationRead). Sectors are counted over stocks only, and the coverage rides along.
  const div = diversificationRead(holdings);
  const largest = Math.max(0, ...holdings.map((h) => h.weight)) * 100;
  const unpriced = totals.positions - totals.pricedPositions;
  // ENTITY count — the SAME collapse Holdings/Health show (RELIANCE-in-two-accounts once), so the
  // glance and the tabs never contradict. Never raw `totals.positions` (which is per-account-instrument).
  const holdingsCount = useMemo(() => aggregateHoldings(holdings).length, [holdings]);

  const kpis: { label: string; value: string; color?: string; sub?: string }[] = [
    {
      label: "Booked P&L",
      value: signINR(totals.realizedPnlAll),
      color: totals.realizedPnlAll >= 0 ? "text-success" : "text-danger",
    },
    { label: "Holdings", value: String(holdingsCount) },
    { label: "Sectors", value: sectorCountLabel(div), sub: sectorCoverageShort(div) ?? undefined },
    { label: "Largest position", value: `${largest.toFixed(1)}%` },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* money anchor */}
        <div className="min-w-0">
          <p className="kicker mb-2">Current value · at last close</p>
          <AnimatedNumber
            value={displayValue}
            prefix="₹"
            locales="en-IN"
            className="block text-[32px] font-semibold leading-none text-ink sm:text-[44px] lg:text-[52px]"
          />
          <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <span className="text-ink2">
              Invested <span className="num text-ink">{formatINR(totals.investedValue, { compact: true })}</span>
            </span>
            <span className={cn("flex items-center gap-1.5", pnlColor(totalReturn))}>
              {totalReturn >= 0 ? (
                <Icons.trendUp weight="bold" className="size-4" />
              ) : (
                <Icons.trendDown weight="bold" className="size-4" />
              )}
              <span className="num font-medium">{signINR(totalReturn)}</span>
              <span className="num">({signPct(returnPct)})</span>
              <span className="text-ink3">total return</span>
            </span>
            <span className={cn("flex items-center gap-1.5", pnlColor(dayVal))}>
              <span className="num font-medium">{signINR(dayVal)}</span>
              {dayPct != null && <span className="num">({signPct(dayPct)})</span>}
              <span className="text-ink3">today</span>
            </span>
          </div>
          {unpriced > 0 && (
            <p className="mt-2 text-[11.5px] text-ink3">
              {/* No raw-total denominator here: the headline count is the ENTITY count (21), so citing
                  the per-instrument total (23) would re-open the very contradiction this pass closes.
                  This caveat is about price coverage, stated without a competing count. */}
              {unpriced} position{unpriced === 1 ? " has" : "s have"} no live price yet — value &amp; return reflect the priced ones.
            </p>
          )}
        </div>

        {/* KPI rail */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto lg:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg border border-line bg-surface-2 px-3.5 py-2.5">
              <p className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">{k.label}</p>
              <p className={cn("num mt-0.5 text-[16px] font-medium", k.color ?? "text-ink")}>{k.value}</p>
              {/* the sector read's coverage rides HERE, with its number — never a footnote */}
              {k.sub && <p className="num text-[9.5px] leading-tight text-ink3">{k.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* value-over-time — the real NAV series; empty state ONLY for a truly empty book */}
      <div className="mt-6 border-t border-line pt-5">
        {navQ.isLoading ? (
          <>
            <StubHeader />
            <div className="h-[210px] w-full animate-pulse rounded-xl bg-surface-2/50 sm:h-[240px]" />
          </>
        ) : navQ.data && navQ.data.series.length > 0 ? (
          <NavChart
            series={navQ.data.series}
            brokerGap={navQ.data.meta.brokerHoldingsExcluded}
            maxRange={navQ.data.meta.maxRange}
          />
        ) : (
          <>
            <StubHeader />
            <div className="flex h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-line2 bg-surface-2/50 px-6 text-center">
              <Icons.chartLine weight="duotone" className="mb-2 size-7 text-ink3 opacity-70" />
              <p className="text-[13px] font-medium text-ink2">Value history builds as you hold</p>
              <p className="mt-1 max-w-md text-[11.5px] text-ink3">
                We start charting your portfolio&apos;s value — and the Nifty overlay — from your positions forward.
                Nothing is back-filled or estimated.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
