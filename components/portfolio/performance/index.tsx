"use client";

import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { usePortfolioNav } from "@/lib/api/hooks/use-portfolio-nav";
import { usePortfolioTwr } from "@/lib/api/hooks/use-portfolio-twr";
import { usePortfolioBenchmark } from "@/lib/api/hooks/use-portfolio-benchmark";
import { usePortfolioXirr } from "@/lib/api/hooks/use-portfolio-xirr";
import { useTransactions } from "@/lib/api/hooks/use-transactions";
import type { Holding, HoldingsTotals } from "@/types/portfolio";
import { NavChart } from "../overview/nav-chart";
import {
  PERF_PERIODS,
  type DateRange,
  type PerfPeriodKey,
  bestWorstDay,
  dividendIncome,
  rangeForPeriod,
  sliceNav,
  windowReturns,
} from "./lib";
import { ReturnsSummary } from "./summary";
import { ByAccount } from "./by-account";
import { Attribution } from "./attribution";
import { ReturnsBreakdown } from "./breakdown";

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO PERFORMANCE — the returns & accountability surface. Money-weighted (XIRR) and
// time-weighted (TWR) returns, the value/returns chart with the TWR-honest Nifty overlay,
// returns attribution, and the realized/unrealized breakdown. Reuses NAV / TWR / benchmark;
// XIRR is the one new read. ONE period selector drives the whole tab.
//
// THE LAW: ZERO health on this surface — no health column, dot, tint, chart or copy. This
// is the one place a user could wrongly infer "healthy → profitable"; returns green/red is
// the P&L domain and the only signal here. (Verify by inspection: nothing below imports a
// health hook, type, colour token or component.)
// ─────────────────────────────────────────────────────────────────────────────

function PeriodSelector({
  period,
  onPeriod,
  custom,
  onCustom,
  bounds,
  periodKeys,
}: {
  period: PerfPeriodKey;
  onPeriod: (p: PerfPeriodKey) => void;
  custom: DateRange;
  onCustom: (r: DateRange) => void;
  bounds: { first: string | null; last: string | null };
  /** The visible presets — "All" is present only when meta.maxRange offers the full history. */
  periodKeys: PerfPeriodKey[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5">
        {periodKeys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onPeriod(k)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              period === k ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
            )}
          >
            {k}
          </button>
        ))}
      </div>
      {period === "Custom" && (
        <div className="flex items-center gap-1.5 text-[11px] text-ink3">
          <input
            type="date"
            value={custom.start ?? ""}
            min={bounds.first ?? undefined}
            max={custom.end ?? bounds.last ?? undefined}
            onChange={(e) => onCustom({ ...custom, start: e.target.value || null })}
            className="num rounded-md border border-line2 bg-surface-2 px-2 py-1 text-ink2"
          />
          <span>→</span>
          <input
            type="date"
            value={custom.end ?? ""}
            min={custom.start ?? bounds.first ?? undefined}
            max={bounds.last ?? undefined}
            onChange={(e) => onCustom({ ...custom, end: e.target.value || null })}
            className="num rounded-md border border-line2 bg-surface-2 px-2 py-1 text-ink2"
          />
        </div>
      )}
    </div>
  );
}

export function PerformanceTab({ holdings, totals }: { holdings: Holding[]; totals: HoldingsTotals }) {
  // Start conservative (always a valid preset); the honest default lands from meta.maxRange once the
  // NAV meta arrives (effect below), unless the user has already picked a period.
  const [period, setPeriod] = useState<PerfPeriodKey>("4Y");
  const [userPicked, setUserPicked] = useState(false);
  const [custom, setCustom] = useState<DateRange>({ start: null, end: null });

  const navQ = usePortfolioNav();
  const maxRange = navQ.data?.meta.maxRange;

  // "ALL" (stock-only, series reaches full history) → default All and offer the button; "4Y"
  // (blended, series capped) → default 4Y, no All. Only until the user chooses for themselves.
  useEffect(() => {
    if (!userPicked && maxRange) setPeriod(maxRange === "ALL" ? "All" : "4Y");
  }, [maxRange, userPicked]);

  const periodKeys: PerfPeriodKey[] = [
    ...PERF_PERIODS.map((p) => p.key),
    ...(maxRange === "ALL" ? (["All"] as PerfPeriodKey[]) : []),
    "Custom",
  ];
  const twrQ = usePortfolioTwr(true); // eager: the period returns / alpha / best-worst need it
  const benchQ = usePortfolioBenchmark(true); // eager: the alpha tile needs the Nifty series
  const xirrQ = usePortfolioXirr();
  const txnQ = useTransactions();

  const navSeries = navQ.data?.series ?? [];
  const bounds = {
    first: navSeries.length ? navSeries[0].date : null,
    last: navSeries.length ? navSeries[navSeries.length - 1].date : null,
  };

  // Default a fresh Custom pick to the full range so the inputs aren't empty.
  const onPeriod = (k: PerfPeriodKey) => {
    setUserPicked(true); // a manual pick pins the period — the maxRange default no longer overrides it
    if (k === "Custom" && custom.start == null && custom.end == null) {
      setCustom({ start: bounds.first, end: bounds.last });
    }
    setPeriod(k);
  };

  const range = useMemo(() => rangeForPeriod(navSeries, period, custom), [navSeries, period, custom]);
  const windowDates = useMemo(() => sliceNav(navSeries, range).map((p) => p.date), [navSeries, range]);
  const win = useMemo(() => windowReturns(windowDates, twrQ.data?.series, benchQ.data?.series), [windowDates, twrQ.data, benchQ.data]);
  const bw = useMemo(() => bestWorstDay(windowDates, twrQ.data?.series), [windowDates, twrQ.data]);
  const dividends = useMemo(() => dividendIncome(txnQ.data ?? []), [txnQ.data]);

  const periodLabel = period === "Custom" ? "custom" : period === "All" ? "all" : period;

  return (
    <div className="flex flex-col pb-4">
      {/* one period selector — drives the summary, the chart, and the period stats */}
      <div className="mt-6 mb-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[18px] font-semibold text-ink">Performance</h2>
          <p className="text-[12px] text-ink2">How your money has done — returns, timing, and what drove them.</p>
        </div>
        <PeriodSelector period={period} onPeriod={onPeriod} custom={custom} onCustom={setCustom} bounds={bounds} periodKeys={periodKeys} />
      </div>

      {/* §1 · Returns summary */}
      <SectionEyebrow label="Your returns" pill="XIRR · TWR · vs Nifty" icon={Icons.trendUp} accent="var(--success)" />
      <Reveal>
        <ReturnsSummary
          holdings={holdings}
          totals={totals}
          xirr={xirrQ.data}
          xirrLoading={xirrQ.isLoading}
          win={win}
          bestWorst={bw}
          periodLabel={periodLabel}
          periodLoading={navQ.isLoading || twrQ.isLoading || benchQ.isLoading}
          brokerGap={navQ.data?.meta.brokerHoldingsExcluded}
        />
      </Reveal>

      {/* §2 · Value & returns chart (reused TWR-honest benchmark overlay; scrubbable) */}
      <SectionEyebrow label="Value & returns over time" pill="₹ value · % vs Nifty" icon={Icons.chartLine} accent="var(--p-mkt)" />
      <Reveal>
        <div className="overflow-hidden rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
          {navQ.isLoading ? (
            <div className="h-[240px] w-full animate-pulse rounded-xl bg-surface-2/50" />
          ) : navSeries.length > 0 ? (
            <NavChart series={navSeries} range={range} brokerGap={navQ.data?.meta.brokerHoldingsExcluded} />
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-line2 bg-surface-2/50 px-6 text-center">
              <Icons.chartLine weight="duotone" className="mb-2 size-7 text-ink3 opacity-70" />
              <p className="text-[13px] font-medium text-ink2">Return history builds as you hold</p>
              <p className="mt-1 max-w-md text-[11.5px] text-ink3">
                We chart your value — and the Nifty comparison — from your first position forward. Nothing is back-filled.
              </p>
            </div>
          )}
        </div>
      </Reveal>

      {/* §3 · Contributors & detractors — returns attribution */}
      <SectionEyebrow label="What drove your returns" pill="by ₹ · share of net" icon={Icons.scales} accent="var(--p-own)" />
      <Reveal>
        <Attribution holdings={holdings} />
      </Reveal>

      {/* §4 · Returns breakdown — realized/unrealized + sector/class + dividends */}
      <SectionEyebrow label="Returns breakdown" pill="realized · unrealized · by sector / class" icon={Icons.coins} accent="var(--p-mkt)" />
      <Reveal>
        <ReturnsBreakdown holdings={holdings} totals={totals} dividends={dividends} />
      </Reveal>

      {/* §5 · By account — the closing section: where the value sits, invested vs current per account
          (raw holdings, split by accountId; RELIANCE-in-two-accounts draws two bar groups).
          Value/return only, no health. */}
      <SectionEyebrow label="By account" pill="invested vs current" icon={Icons.stack} accent="var(--p-found)" />
      <Reveal>
        <ByAccount holdings={holdings} />
      </Reveal>

      {/* Phase-2 note slot — consistency / drawdown deliberately not here yet */}
      <p className="mt-6 border-t border-line pt-4 text-[11px] leading-relaxed text-ink3">
        Read-only over your ledger, NAV and benchmark series — nothing is recomputed on the client. Returns are money in
        vs money out; consistency &amp; drawdown measures land in a later pass. Vytal is a data platform, not an advisor —
        nothing here is a prediction or a buy/sell signal.
      </p>
    </div>
  );
}
