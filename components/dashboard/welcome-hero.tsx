"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sparkline } from "@/components/ui/sparkline";
import { Icons, type Icon } from "@/lib/icons";
import { useAuth } from "@/components/providers/auth-provider";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { usePortfolioSnapshot } from "@/lib/api/hooks/use-portfolio-snapshot";
import { usePortfolioNav } from "@/lib/api/hooks/use-portfolio-nav";
import { HEALTH_BAND_META, healthColor } from "@/components/portfolio/lib";
import { formatINR, changeColor } from "@/lib/format";
import { nameFromUser, greeting, signINR, signPct } from "./lib";
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

// The Ask-Vytal bar — deferred. The conversational layer isn't built, so this is a
// clearly-disabled placeholder (consistent with the AI Insights stub), never a live input.
function AskVytalBar() {
  return (
    <div
      aria-disabled
      className="mt-5 flex h-12 items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-3"
    >
      <Icons.brain weight="duotone" className="size-5 text-primary/70" />
      <input
        disabled
        placeholder="Ask Vytal about your book — coming soon"
        className="h-full flex-1 cursor-not-allowed bg-transparent text-sm text-ink3 outline-none placeholder:text-ink3/70"
      />
      <span className="shrink-0 rounded-md border border-line2 bg-surface-3/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink3">
        Soon
      </span>
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

export function WelcomeHero() {
  const { user } = useAuth();
  const holdQ = useHoldings();
  const snapQ = usePortfolioSnapshot();
  const navQ = usePortfolioNav();

  const name = nameFromUser(user?.user_metadata, user?.email);
  const [hour, setHour] = useState(9);
  useEffect(() => setHour(new Date().getHours()), []);

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
        <p className="text-sm text-muted-foreground">{greeting(hour)}, {name}</p>
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
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            {greeting(hour)}, {name}
          </p>
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
          <AskVytalBar />
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
  const sectorsCount = new Set(holdings.map((h) => h.sector ?? "Unclassified")).size;
  const navSeries = navQ.data?.series.map((p) => p.value) ?? [];

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
      label: "Total return",
      value: Math.abs(returnPct),
      suffix: "%",
      prefix: returnPct >= 0 ? "+" : "−",
      decimals: 2,
      icon: returnPct >= 0 ? Icons.trendUp : Icons.trendDown,
      color: changeColor(returnPct),
      sub: signINR(totalReturn),
    },
    { label: "Holdings", value: totals.positions, icon: Icons.stack, color: "text-foreground", sub: `${sectorsCount} sector${sectorsCount === 1 ? "" : "s"}` },
  ];

  return (
    <HeroShell>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            {greeting(hour)}, {name}
          </p>
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

          <AskVytalBar />
          <QuickActions />
        </div>

        {/* portfolio value mini panel */}
        <div className="shrink-0 rounded-2xl border border-line bg-surface-2/60 p-4 lg:w-72">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Portfolio value</p>
          <p className="mt-1 font-display text-3xl font-extrabold">
            <AnimatedNumber value={displayValue} prefix="₹" locales="en-IN" />
          </p>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className={cn("flex items-center gap-0.5 font-mono", changeColor(totalReturn))}>
              {totalReturn >= 0 ? (
                <Icons.arrowUpRight weight="bold" className="size-3.5" />
              ) : (
                <Icons.arrowDownRight weight="bold" className="size-3.5" />
              )}
              {signPct(returnPct)}
            </span>
            <span className="text-muted-foreground">total return</span>
          </div>
          {navSeries.length >= 2 && (
            <Sparkline data={navSeries} width={256} height={56} className="mt-3 w-full" />
          )}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-line bg-surface-2/60 p-3.5 transition-colors hover:border-primary/25"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <k.icon weight="duotone" className="size-4 text-primary/80" />
            </div>
            <p className={cn("mt-1.5 font-display text-xl font-bold", k.color)}>
              <AnimatedNumber
                value={k.value}
                prefix={k.prefix}
                suffix={k.suffix}
                decimals={k.decimals ?? 0}
                locales="en-IN"
              />
            </p>
            {k.sub && <p className={cn("text-xs", k.color === "text-foreground" ? "text-muted-foreground" : k.color)}>{k.sub}</p>}
          </div>
        ))}
      </div>
    </HeroShell>
  );
}
