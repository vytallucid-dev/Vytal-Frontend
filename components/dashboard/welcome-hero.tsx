"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { NavChart } from "@/components/portfolio/overview/nav-chart";
import { diversificationRead, sectorCoverageShort } from "@/components/portfolio/lib";
import { Icons, type Icon } from "@/lib/icons";
import { AskVytal } from "./ask-vytal";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { usePortfolioSnapshot } from "@/lib/api/hooks/use-portfolio-snapshot";
import { usePortfolioNav } from "@/lib/api/hooks/use-portfolio-nav";
import { HEALTH_BAND_META, healthColor } from "@/components/portfolio/lib";
import { formatINR, changeColor } from "@/lib/format";
// ★ THE GREETING IS THE CHAT'S, NOT A SECOND ONE. `useGreeting` is the same hook the chat page's welcome
//   and the sidekick panel's empty state call — fifteen lines across seven IST bands, weekday-gated on
//   the market-aware ones, and the same first-name resolution. Importing the HOOK (not the strings) is
//   what makes "the dashboard and the chat greet you identically" true by construction rather than by
//   two lists someone has to remember to keep in step. See components/chat/welcome.ts.
import { useGreeting } from "@/components/chat/welcome";
import { signINR, signPct } from "./lib";
import { cn } from "@/lib/utils";

const quickActions: { label: string; href: string; icon: Icon }[] = [
  { label: "View Portfolio", href: "/portfolio", icon: Icons.portfolio },
  { label: "Health Scores", href: "/health-score", icon: Icons.health },
  { label: "Screen Stocks", href: "/research/stock-screener", icon: Icons.screener },
  { label: "Compare", href: "/comparison", icon: Icons.compare },
];

function QuickActions() {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {quickActions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
        >
          <a.icon weight="duotone" className="size-3.5 text-primary" />
          {a.label}
        </Link>
      ))}
    </div>
  );
}

function HeroShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-xl border border-line bg-surface-1 p-5 sm:p-7"
    >
      {children}
    </motion.section>
  );
}

/** The greeting line. ★ RESOLVED AFTER MOUNT (useGreeting returns null until then — the random pick and
 *  the reader's name are both browser-side), so the row RESERVES its height: without `min-h` the whole
 *  hero would shift down by one line the moment the greeting lands. */
function GreetingLine({ pulse = false }: { pulse?: boolean }) {
  const greeting = useGreeting();
  return (
    <p className="flex min-h-5 items-center gap-2 text-sm text-muted-foreground">
      <span className={cn("size-1.5 rounded-full bg-primary", pulse && "animate-pulse")} />
      {greeting}
    </p>
  );
}

export function WelcomeHero() {
  const holdQ = useHoldings();
  const snapQ = usePortfolioSnapshot();
  const navQ = usePortfolioNav();

  const totals = holdQ.data?.totals;
  const holdings = holdQ.data?.holdings ?? [];
  const snapshot = snapQ.data?.snapshot ?? null;
  const hasHoldings = snapQ.data?.hasHoldings ?? holdings.length > 0;
  const dataReady = Boolean(holdQ.data);

  // count-up: start at 0, set the real value after mount so NumberFlow animates
  const [displayValue, setDisplayValue] = useState(0);
  const [displayDay, setDisplayDay] = useState(0);
  useEffect(() => {
    if (totals) {
      setDisplayValue(totals.currentValue);
      setDisplayDay(Math.abs(totals.dayChangeValue));
    }
  }, [totals]);

  // ── loading — a calm shell, never a fake number ──
  if (holdQ.isLoading) {
    return (
      <HeroShell>
        <GreetingLine />
        <div className="mt-4 h-10 w-72 animate-pulse rounded-xl bg-surface-2/60" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2/50" />
          ))}
        </div>
      </HeroShell>
    );
  }

  // ── empty book — honest "start tracking", no ₹0/forced green ──
  if (!dataReady || !hasHoldings || !totals || totals.positions === 0) {
    return (
      <HeroShell>
        <div className="max-w-xl">
          <GreetingLine />
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Start tracking your holdings.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first transaction and this fills in — real value, weighted health,
            allocation and what&apos;s moving. Nothing is shown until then, by design.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-[filter] hover:brightness-110"
            >
              <Icons.plus weight="bold" className="size-4" />
              Add your first transaction
            </Link>
          </div>
          {/* An empty book gets the CONCEPTUAL suggestions — "what is my portfolio health" has no
              answer here, and offering it would be the same broken promise the SOON pill used to be
              (ask-vytal §THE EMPTY BOOK). */}
          <AskVytal hasHoldings={false} />
          <QuickActions />
        </div>
      </HeroShell>
    );
  }

  // ── real book ──
  const investedPriced = holdings
    .filter((h) => h.marketValue != null)
    .reduce((s, h) => s + h.investedValue, 0);
  const totalReturn = totals.unrealizedPnl;
  const returnPct = investedPriced > 0 ? (totalReturn / investedPriced) * 100 : 0;
  const dayVal = totals.dayChangeValue;
  const dayPct = totals.dayChangePct;
  // The SHARED sector read — was an inline Set that counted an "ETF" bucket as one sector.
  const div = diversificationRead(holdings);
  // Glance chart is the RETURNS trajectory (TWR), not ₹ value — so the mini-line agrees with
  // the "total return" number beside it instead of climbing green while the return is red.
  const navPoints = navQ.data?.series ?? [];

  // health line — real band, or an honest "building" when there's no health read
  const bandLabel = snapshot?.healthRead?.band ? HEALTH_BAND_META[snapshot.healthRead.band].label : null;
  const bandColor = snapshot?.healthRead?.band ? healthColor(snapshot.healthRead.band) : undefined;
  const dayUp = dayVal >= 0;

  const kpis: {
    label: string;
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    icon: Icon;
    color: string;
    sub?: string;
  }[] = [
    { label: "Net worth", value: totals.currentValue, prefix: "₹", icon: Icons.coins, color: "text-foreground" },
    {
      label: "Today",
      value: Math.abs(dayVal),
      prefix: dayUp ? "+₹" : "−₹",
      icon: dayUp ? Icons.trendUp : Icons.trendDown,
      color: changeColor(dayVal),
      sub: dayPct != null ? signPct(dayPct) : undefined,
    },
    {
      // Same figure as the mini panel's, so the same words — one card must not have two names for one
      // number (see the panel's note on why "on cost" is load-bearing here).
      label: "Return on cost",
      value: Math.abs(returnPct),
      suffix: "%",
      prefix: returnPct >= 0 ? "+" : "−",
      decimals: 2,
      icon: returnPct >= 0 ? Icons.trendUp : Icons.trendDown,
      color: changeColor(returnPct),
      sub: signINR(totalReturn),
    },
    {
      label: "Holdings",
      value: totals.positions,
      icon: Icons.stack,
      color: "text-foreground",
      // The sector count carries its coverage in the same breath: "1 sector · across 44% of book".
      // A pure-equity book appends nothing — there is no absence to disclose. A fund-only book has
      // no sector read at all and says so, rather than claiming "0 sectors".
      sub:
        div.sectorCount == null
          ? "no sector read"
          : `${div.sectorCount} sector${div.sectorCount === 1 ? "" : "s"}` +
            (sectorCoverageShort(div) ? ` · ${sectorCoverageShort(div)}` : ""),
    },
  ];

  return (
    <HeroShell>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <GreetingLine pulse />
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Your book is {dayUp ? "up" : "down"}{" "}
            <span className={changeColor(dayVal)}>
              <AnimatedNumber value={displayDay} prefix="₹" locales="en-IN" />
            </span>{" "}
            today.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bandLabel ? (
              <>
                Portfolio health is{" "}
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 align-middle text-xs font-semibold"
                  style={
                    bandColor
                      ? { color: bandColor, background: `color-mix(in oklch, ${bandColor} 15%, transparent)` }
                      : undefined
                  }
                >
                  {bandLabel}
                  {snapshot?.healthRead?.value != null && (
                    <>
                      <span className="opacity-50">·</span>
                      <span className="num">{snapshot.healthRead.value}</span>
                    </>
                  )}
                </span>
                . Here&apos;s everything that matters, in one place.
              </>
            ) : (
              <>Your portfolio health read is building — it appears once your book is scored.</>
            )}
          </p>

          <AskVytal hasHoldings />
          <QuickActions />
        </div>

        {/* portfolio value mini panel */}
        <div className="shrink-0 rounded-2xl border border-line bg-surface-2/60 p-4 lg:w-72">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Portfolio value</p>
          <p className="mt-1 truncate font-display text-2xl font-extrabold sm:text-3xl">
            <AnimatedNumber value={displayValue} prefix="₹" locales="en-IN" />
          </p>
          {/* ★ "ON COST", NOT BARE "total return" — see nav-chart §THE UNLABELLED LINE. This figure is
              unrealized P&L over what the held positions COST, with no time window; the sparkline under
              it is the time-weighted return over the book's whole history. Two honest answers to two
              different questions, and the card now says which is which instead of leaving a red line
              beside a green number looking like a contradiction. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
            <span className={cn("flex items-center gap-0.5 font-mono", changeColor(totalReturn))}>
              {totalReturn >= 0 ? (
                <Icons.arrowUpRight weight="bold" className="size-3.5" />
              ) : (
                <Icons.arrowDownRight weight="bold" className="size-3.5" />
              )}
              {signPct(returnPct)}
            </span>
            <span
              className="text-muted-foreground"
              title="Unrealized gain or loss on the positions you hold now, measured against what they cost. Not time-bounded — each holding counts from its own purchase date, and positions you have sold are not in it."
            >
              total return on cost
            </span>
          </div>
          {navPoints.length >= 2 && (
            <div className="mt-3">
              <NavChart
                series={navPoints}
                defaultLens="returns"
                lockLens
                compact
                brokerGap={navQ.data?.meta.brokerHoldingsExcluded}
                maxRange={navQ.data?.meta.maxRange}
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="min-w-0 rounded-2xl border border-line bg-surface-2/60 p-3 transition-colors hover:border-primary/25 sm:p-3.5"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="truncate text-[11px] text-muted-foreground sm:text-xs">{k.label}</span>
              <k.icon weight="duotone" className="size-4 shrink-0 text-primary/80" />
            </div>
            <p className={cn("mt-1.5 truncate font-display text-lg font-bold leading-tight sm:text-xl", k.color)}>
              <AnimatedNumber
                value={k.value}
                prefix={k.prefix}
                suffix={k.suffix}
                decimals={k.decimals ?? 0}
                locales="en-IN"
              />
            </p>
            {k.sub && <p className={cn("truncate text-[11px] sm:text-xs", k.color === "text-foreground" ? "text-muted-foreground" : k.color)}>{k.sub}</p>}
          </div>
        ))}
      </div>
    </HeroShell>
  );
}
