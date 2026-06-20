"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Sparkline } from "@/components/ui/sparkline";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { ValueAreaChart } from "@/components/charts/value-area-chart";
import { Icons } from "@/lib/icons";
import {
  holdings,
  portfolioValueSeries,
  portfolioReturns,
  portfolioHealthBreakdown,
  sectorAllocation,
} from "@/lib/demo-data";
import { formatINR, changeColor, healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";

const periods = ["1M", "3M", "6M", "1Y", "ALL"] as const;

export default function PortfolioPage() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("1Y");
  const [showInvested, setShowInvested] = useState(true);
  const [query, setQuery] = useState("");

  const totals = useMemo(() => {
    const value = holdings.reduce((a, h) => a + h.qty * h.ltp, 0);
    const invested = holdings.reduce((a, h) => a + h.qty * h.avgCost, 0);
    const dayChange = holdings.reduce((a, h) => a + (h.qty * h.ltp * h.day) / 100, 0);
    const pnl = value - invested;
    const avgHealth = Math.round(holdings.reduce((a, h) => a + h.health, 0) / holdings.length);
    return { value, invested, dayChange, pnl, pnlPct: (pnl / invested) * 100, avgHealth };
  }, []);

  const series = useMemo(() => {
    const map: Record<string, number> = { "1M": 2, "3M": 4, "6M": 6, "1Y": 12, ALL: 12 };
    return portfolioValueSeries.slice(-map[period]);
  }, [period]);

  const rows = useMemo(
    () =>
      holdings
        .map((h) => {
          const value = h.qty * h.ltp;
          const invested = h.qty * h.avgCost;
          const pnl = value - invested;
          return { ...h, value, invested, pnl, pnlPct: (pnl / invested) * 100, weight: 0 };
        })
        .map((h) => ({ ...h, weight: (h.value / totals.value) * 100 }))
        .filter(
          (h) =>
            h.symbol.toLowerCase().includes(query.toLowerCase()) ||
            h.name.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => b.value - a.value),
    [query, totals.value]
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-7"
      >
        <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-20" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total portfolio value</p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              <AnimatedNumber value={totals.value} prefix="₹" />
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className={cn("flex items-center gap-1 font-mono", changeColor(totals.dayChange))}>
                <Icons.trendUp weight="bold" className="size-4" />
                {formatINR(totals.dayChange, { compact: true })} today
              </span>
              <span className="text-muted-foreground">·</span>
              <span className={cn("font-mono", changeColor(totals.pnl))}>
                {totals.pnl >= 0 ? "+" : ""}
                {formatINR(totals.pnl, { compact: true })} ({totals.pnlPct.toFixed(1)}%) all-time
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { l: "Holdings", v: holdings.length },
                { l: "Sectors", v: sectorAllocation.length },
                { l: "Invested", v: formatINR(totals.invested, { compact: true }) },
                { l: "Avg health", v: totals.avgHealth, accent: true },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-border/70 bg-surface-1/40 px-3 py-2">
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                  <p
                    className="font-display text-base font-bold"
                    style={s.accent ? { color: healthColorVar(totals.avgHealth) } : undefined}
                  >
                    {s.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 self-center rounded-2xl border border-border/70 bg-surface-1/40 p-4">
            <HealthRing score={totals.avgHealth} size={92} strokeWidth={8} showLabel />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Portfolio Health</p>
              <p className="font-display text-lg font-bold">Strong &amp; rising</p>
              <Button asChild size="sm" variant="ghost" className="mt-1 h-7 px-0 text-primary">
                <Link href="/health-score">
                  Details <Icons.arrowRight weight="bold" className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Value chart */}
      <Reveal>
        <div className="glass rounded-3xl border border-border/70 p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading
              eyebrow="Growth"
              icon={Icons.chartLine}
              title="How your portfolio has grown"
              subtitle="Value vs the capital you've put in."
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInvested((v) => !v)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  showInvested ? "border-primary/30 bg-primary/10 text-primary" : "border-border/70 text-muted-foreground"
                )}
              >
                Invested
              </button>
              <div className="flex gap-1 rounded-lg border border-border/70 bg-surface-1/40 p-0.5">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ValueAreaChart data={series} showInvested={showInvested} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Starting", v: formatINR(series[0]?.value ?? 0, { compact: true }) },
              { l: "Current", v: formatINR(totals.value, { compact: true }) },
              { l: "Net invested", v: formatINR(totals.invested, { compact: true }) },
              { l: "Total gain", v: `+${formatINR(totals.pnl, { compact: true })}`, good: true },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-border/60 bg-surface-1/40 p-3">
                <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                <p className={cn("font-mono text-sm font-bold", s.good && "text-success")}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Allocation + Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="glass h-full rounded-3xl border border-border/70 p-5 sm:p-6">
            <SectionHeading eyebrow="Allocation" icon={Icons.sector} title="Sector mix" />
            <div className="mt-4 space-y-3">
              {sectorAllocation.map((s, i) => (
                <div key={s.sector}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
                      {s.sector}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {s.weight}% · {formatINR(s.value, { compact: true })}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-3/60">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.weight}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-surface-1/40 p-3 text-xs text-muted-foreground">
              <Icons.info weight="duotone" className="size-4 shrink-0 text-primary" />
              Banking is 28% of your book — well within a healthy range, but watch concentration if it climbs past 35%.
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="glass h-full rounded-3xl border border-border/70 p-5 sm:p-6">
            <SectionHeading
              eyebrow="Health DNA"
              icon={Icons.health}
              title="Quality of your holdings"
              action={
                <Button asChild size="sm" variant="outline" className="h-8">
                  <Link href="/health-score">Explore</Link>
                </Button>
              }
            />
            <div className="mt-4 space-y-3">
              {portfolioHealthBreakdown.map((p, i) => (
                <div key={p.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p.key}</span>
                    <span className="font-mono font-medium" style={{ color: healthColorVar(p.score) }}>
                      {p.score}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-3/60">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${p.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: healthColorVar(p.score) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Holdings */}
      <Reveal>
        <div className="glass rounded-3xl border border-border/70 p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading eyebrow="Positions" icon={Icons.portfolio} title="Your holdings" />
            <div className="flex items-center gap-2">
              <div className="relative">
                <Icons.search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="h-9 w-40 rounded-lg border border-border/70 bg-surface-1/40 pl-8 pr-3 text-sm outline-none focus:border-primary/40 sm:w-48"
                />
              </div>
              <Button size="sm" className="h-9">
                <Icons.plus weight="bold" className="size-4" /> Add
              </Button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="custom-scrollbar -mx-2 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/70 text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Stock</th>
                  <th className="px-3 py-2 text-center font-medium">Health</th>
                  <th className="px-3 py-2 text-right font-medium">Qty · Avg</th>
                  <th className="px-3 py-2 text-right font-medium">LTP</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="px-3 py-2 text-right font-medium">Day</th>
                  <th className="px-3 py-2 text-right font-medium">P&amp;L</th>
                  <th className="px-3 py-2 text-center font-medium">7d</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.symbol} className="border-b border-border/40 transition-colors hover:bg-surface-2/40">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold">{h.symbol}</p>
                      <p className="text-xs text-muted-foreground">{h.sector} · {h.weight.toFixed(1)}%</p>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className="inline-grid size-7 place-items-center rounded-lg text-xs font-bold"
                        style={{ color: healthColorVar(h.health), background: `color-mix(in oklch, ${healthColorVar(h.health)} 14%, transparent)` }}
                      >
                        {h.health}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">
                      {h.qty} · ₹{h.avgCost.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">₹{h.ltp.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatINR(h.value, { compact: true })}</td>
                    <td className={cn("px-3 py-2.5 text-right font-mono", changeColor(h.day))}>
                      {h.day >= 0 ? "+" : ""}{h.day}%
                    </td>
                    <td className={cn("px-3 py-2.5 text-right font-mono", changeColor(h.pnl))}>
                      {h.pnl >= 0 ? "+" : ""}{formatINR(h.pnl, { compact: true })}
                      <span className="block text-xs opacity-70">{h.pnlPct.toFixed(1)}%</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center">
                        <Sparkline data={h.spark} width={64} height={26} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 md:hidden">
            {rows.map((h) => (
              <div key={h.symbol} className="rounded-2xl border border-border/60 bg-surface-1/40 p-3">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold"
                    style={{ color: healthColorVar(h.health), background: `color-mix(in oklch, ${healthColorVar(h.health)} 14%, transparent)` }}
                  >
                    {h.health}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{h.symbol}</p>
                    <p className="truncate text-xs text-muted-foreground">{h.sector} · {h.weight.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{formatINR(h.value, { compact: true })}</p>
                    <p className={cn("font-mono text-xs", changeColor(h.pnl))}>
                      {h.pnl >= 0 ? "+" : ""}{h.pnlPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                  <span className="font-mono">{h.qty} @ ₹{h.avgCost.toLocaleString("en-IN")}</span>
                  <span className={cn("font-mono", changeColor(h.day))}>{h.day >= 0 ? "+" : ""}{h.day}% today</span>
                  <Sparkline data={h.spark} width={56} height={22} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Returns vs benchmark */}
      <Reveal>
        <div className="glass rounded-3xl border border-border/70 p-5 sm:p-6">
          <SectionHeading
            eyebrow="Performance"
            icon={Icons.rocket}
            title="You vs the market"
            subtitle="Your returns against Nifty 50 across timeframes."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {portfolioReturns.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border/60 bg-surface-1/40 p-3 text-center"
              >
                <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{r.label}</p>
                <p className="mt-1 font-display text-lg font-bold text-success">+{r.you}%</p>
                <p className="text-[0.65rem] text-muted-foreground">Nifty +{r.nifty}%</p>
                <div className="mt-1.5 inline-flex items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-success">
                  <Icons.trendUp weight="bold" className="size-2.5" />
                  +{(r.you - r.nifty).toFixed(1)}%
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
