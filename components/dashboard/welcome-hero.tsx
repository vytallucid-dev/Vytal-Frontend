"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sparkline } from "@/components/ui/sparkline";
import { Icons, type Icon } from "@/lib/icons";
import { portfolioSummary } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const quickActions: { label: string; href: string; icon: Icon }[] = [
  { label: "View Portfolio", href: "/portfolio", icon: Icons.portfolio },
  { label: "Health Scores", href: "/health-score", icon: Icons.health },
  { label: "Screen Stocks", href: "/research/stock-screener", icon: Icons.screener },
  { label: "Compare", href: "/comparison", icon: Icons.compare },
];

const kpis = (s: typeof portfolioSummary) => [
  { label: "Net worth", value: s.totalValue, prefix: "₹", icon: Icons.coins, accent: "text-foreground" },
  { label: "Today", value: s.dayChange, prefix: "+₹", icon: Icons.trendUp, accent: "text-success", sub: `+${s.dayChangePct}%` },
  { label: "Total return", value: s.totalReturnPct, suffix: "%", prefix: "+", icon: Icons.rocket, accent: "text-success", decimals: 2 },
  { label: "Holdings", value: s.holdingsCount, icon: Icons.stack, accent: "text-foreground", sub: `${s.sectorsCount} sectors` },
];

export function WelcomeHero() {
  const s = portfolioSummary;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong relative overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-7"
    >
      <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-25" />
      <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-[90px]" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            {greeting}, Aarav
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Your book is up{" "}
            <span className="text-success">
              <AnimatedNumber value={s.dayChange} prefix="+₹" />
            </span>{" "}
            today.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Portfolio health is <span className="font-medium text-primary">Strong</span> and
            improving. Here's everything that matters, in one place.
          </p>

          {/* AI ask bar */}
          <div className="group mt-5 flex h-12 items-center gap-2 rounded-2xl border border-border/70 bg-surface-1/50 px-3 backdrop-blur-sm transition-colors focus-within:border-primary/40">
            <Icons.brain weight="duotone" className="size-5 text-primary" />
            <input
              placeholder="Ask InvestIQ anything — “Is my portfolio overexposed to banks?”"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <button className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground transition-transform hover:scale-105">
              <Icons.arrowRight weight="bold" className="size-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-1/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
              >
                <a.icon weight="duotone" className="size-3.5 text-primary" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* portfolio value mini panel */}
        <div className="shrink-0 rounded-2xl border border-border/70 bg-surface-1/40 p-4 lg:w-72">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Portfolio value</p>
          <p className="mt-1 font-display text-3xl font-extrabold">
            <AnimatedNumber value={s.totalValue} prefix="₹" />
          </p>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-0.5 font-mono text-success">
              <Icons.arrowUpRight weight="bold" className="size-3.5" />
              {s.totalReturnPct}%
            </span>
            <span className="text-muted-foreground">all-time</span>
          </div>
          <Sparkline data={s.valueSeries} width={256} height={56} className="mt-3 w-full" />
        </div>
      </div>

      {/* KPI tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis(s).map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-border/70 bg-surface-1/40 p-3.5 transition-colors hover:border-primary/25"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <k.icon weight="duotone" className="size-4 text-primary/80" />
            </div>
            <p className={cn("mt-1.5 font-display text-xl font-bold", k.accent)}>
              <AnimatedNumber
                value={k.value}
                prefix={k.prefix}
                suffix={k.suffix}
                decimals={k.decimals ?? 0}
              />
            </p>
            {k.sub && <p className="text-xs text-muted-foreground">{k.sub}</p>}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
