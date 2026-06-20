"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Sparkline } from "@/components/ui/sparkline";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { formatINR, formatPct, changeColor, healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- mock data */

interface ResultItem {
  symbol: string;
  name: string;
  sector: string;
  quarter: string;
  reportedOn: string; // ISO date
  revenue: number; // ₹ crore
  revenueYoY: number; // %
  netProfit: number; // ₹ crore
  profitYoY: number; // %
  opMargin: number; // %
  marginDeltaBps: number; // basis points YoY
  health: number; // 0–100
  marketReaction: number; // % price move post-results
  reactionSpark: number[]; // 8 points
  aiTake: string;
  highlights: string[];
}

const CR = 1e7; // one crore in rupees → lets formatINR compact render "Cr"

const results: ResultItem[] = [
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    sector: "IT Services",
    quarter: "Q1 FY26",
    reportedOn: "2026-06-12",
    revenue: 64210,
    revenueYoY: 7.4,
    netProfit: 12840,
    profitYoY: 11.2,
    opMargin: 25.1,
    marginDeltaBps: 80,
    health: 88,
    marketReaction: 3.6,
    reactionSpark: [100, 99, 101, 103, 102, 105, 106, 108],
    aiTake:
      "Steady growth and a healthier margin — the core business is humming even if it isn't sprinting.",
    highlights: ["Record deal pipeline of $9.4B", "Margin up 80 bps", "Attrition cooling"],
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    sector: "Energy & Retail",
    quarter: "Q4 FY26",
    reportedOn: "2026-06-11",
    revenue: 248330,
    revenueYoY: 9.8,
    netProfit: 19450,
    profitYoY: 14.6,
    opMargin: 17.8,
    marginDeltaBps: 120,
    health: 84,
    marketReaction: 4.2,
    reactionSpark: [100, 101, 100, 102, 104, 103, 106, 108],
    aiTake:
      "Retail and digital did the heavy lifting, pushing profit growth well past sales — a clean beat.",
    highlights: ["Jio ARPU climbs", "Retail margin expands", "Capex peak behind it"],
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    sector: "Banking",
    quarter: "Q4 FY26",
    reportedOn: "2026-06-10",
    revenue: 78120,
    revenueYoY: 11.3,
    netProfit: 17890,
    profitYoY: 13.1,
    opMargin: 41.2,
    marginDeltaBps: 30,
    health: 86,
    marketReaction: 1.9,
    reactionSpark: [100, 100, 101, 100, 102, 101, 102, 103],
    aiTake:
      "Loan growth and steady asset quality kept profit ticking up — dependable rather than dramatic.",
    highlights: ["NIM holds at 3.6%", "Deposits up 14%", "Bad loans near record low"],
  },
  {
    symbol: "INFY",
    name: "Infosys",
    sector: "IT Services",
    quarter: "Q1 FY26",
    reportedOn: "2026-06-12",
    revenue: 41560,
    revenueYoY: 5.1,
    netProfit: 6620,
    profitYoY: 8.9,
    opMargin: 21.4,
    marginDeltaBps: -40,
    health: 79,
    marketReaction: -2.1,
    reactionSpark: [100, 101, 99, 98, 99, 97, 96, 95],
    aiTake:
      "Profit grew, but a softer revenue outlook and slimmer margins left investors underwhelmed.",
    highlights: ["FY26 guidance trimmed", "Margin dips 40 bps", "Large-deal wins steady"],
  },
  {
    symbol: "TATAMOTORS",
    name: "Tata Motors",
    sector: "Automobiles",
    quarter: "Q4 FY26",
    reportedOn: "2026-06-09",
    revenue: 121940,
    revenueYoY: 3.2,
    netProfit: 4980,
    profitYoY: -6.4,
    opMargin: 12.6,
    marginDeltaBps: -90,
    health: 64,
    marketReaction: -4.8,
    reactionSpark: [100, 99, 98, 99, 96, 95, 93, 92],
    aiTake:
      "JLR demand cooled and costs bit into margins, so profit slipped despite flat-ish sales — a clear miss.",
    highlights: ["JLR volumes soften", "EV losses widen", "Net debt edges up"],
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel",
    sector: "Telecom",
    quarter: "Q4 FY26",
    reportedOn: "2026-06-08",
    revenue: 41280,
    revenueYoY: 12.7,
    netProfit: 5210,
    profitYoY: 28.4,
    opMargin: 53.1,
    marginDeltaBps: 160,
    health: 82,
    marketReaction: 5.4,
    reactionSpark: [100, 102, 103, 105, 104, 107, 109, 111],
    aiTake:
      "Tariff hikes and rising data use sent profit soaring — one of the standout beats this week.",
    highlights: ["ARPU jumps to ₹245", "Africa swings to profit", "Margin best-in-class"],
  },
  {
    symbol: "ITC",
    name: "ITC",
    sector: "FMCG",
    quarter: "Q4 FY26",
    reportedOn: "2026-06-07",
    revenue: 18640,
    revenueYoY: 6.3,
    netProfit: 5460,
    profitYoY: 9.7,
    opMargin: 36.8,
    marginDeltaBps: 50,
    health: 81,
    marketReaction: 1.2,
    reactionSpark: [100, 100, 101, 101, 100, 102, 101, 102],
    aiTake:
      "Cigarettes stayed resilient and the consumer arm chipped in, delivering a quietly solid quarter.",
    highlights: ["FMCG margin improves", "Hotels demand strong", "Steady dividend cushion"],
  },
  {
    symbol: "ASIANPAINT",
    name: "Asian Paints",
    sector: "Consumer",
    quarter: "Q4 FY26",
    reportedOn: "2026-06-06",
    revenue: 9120,
    revenueYoY: -1.8,
    netProfit: 1180,
    profitYoY: -11.3,
    opMargin: 18.9,
    marginDeltaBps: -210,
    health: 58,
    marketReaction: -3.4,
    reactionSpark: [100, 99, 98, 97, 98, 96, 95, 94],
    aiTake:
      "Weak demand and pricing pressure squeezed both sales and margins — the toughest print this week.",
    highlights: ["Volume growth stalls", "Raw-material cost rises", "Rural recovery delayed"],
  },
];

/* a "beat" = profit growth at/above 12%, otherwise a miss */
const isBeat = (r: ResultItem) => r.profitYoY >= 12;

/* "this week" relative to the demo's current date */
const NOW = new Date("2026-06-15");
const isThisWeek = (r: ResultItem) => {
  const days = (NOW.getTime() - new Date(r.reportedOn).getTime()) / 86_400_000;
  return days >= 0 && days <= 7;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

type Filter = "all" | "beats" | "misses" | "week";

const filters: { key: Filter; label: string; icon: typeof Icons.results }[] = [
  { key: "all", label: "All", icon: Icons.results },
  { key: "beats", label: "Beats", icon: Icons.trendUp },
  { key: "misses", label: "Misses", icon: Icons.trendDown },
  { key: "week", label: "This week", icon: Icons.calendar },
];

/* ------------------------------------------------------------------ helpers */

function YoYStat({
  label,
  value,
  delta,
  deltaSuffix = "%",
  isBps = false,
}: {
  label: string;
  value: string;
  delta: number;
  deltaSuffix?: string;
  isBps?: boolean;
}) {
  const up = delta >= 0;
  return (
    <div className="rounded-xl border border-border/60 bg-surface-1/40 px-3 py-2">
      <p className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-bold">{value}</p>
      <p className={cn("flex items-center gap-0.5 font-mono text-[0.7rem]", changeColor(delta))}>
        {up ? (
          <Icons.arrowUpRight weight="bold" className="size-3" />
        ) : (
          <Icons.arrowDownRight weight="bold" className="size-3" />
        )}
        {isBps
          ? `${up ? "+" : ""}${delta} bps`
          : `${up ? "+" : ""}${delta.toFixed(1)}${deltaSuffix}`}
        <span className="text-muted-foreground/70"> YoY</span>
      </p>
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export default function ResultsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const week = results.filter(isThisWeek);
    const beats = results.filter(isBeat).length;
    const misses = results.length - beats;
    const avgRev = results.reduce((a, r) => a + r.revenueYoY, 0) / results.length;
    const avgReaction = results.reduce((a, r) => a + r.marketReaction, 0) / results.length;
    return { reportedThisWeek: week.length, beats, misses, avgRev, avgReaction };
  }, []);

  const filtered = useMemo(
    () =>
      results
        .filter((r) =>
          filter === "beats"
            ? isBeat(r)
            : filter === "misses"
            ? !isBeat(r)
            : filter === "week"
            ? isThisWeek(r)
            : true
        )
        .filter(
          (r) =>
            r.symbol.toLowerCase().includes(query.toLowerCase()) ||
            r.name.toLowerCase().includes(query.toLowerCase()) ||
            r.sector.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => +new Date(b.reportedOn) - +new Date(a.reportedOn)),
    [filter, query]
  );

  const movers = useMemo(
    () => [...results].sort((a, b) => b.marketReaction - a.marketReaction),
    []
  );

  const counts: Record<Filter, number> = {
    all: results.length,
    beats: stats.beats,
    misses: stats.misses,
    week: stats.reportedThisWeek,
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      {/* ---------------------------------------------------------------- Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-7"
      >
        <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-20" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-primary">
              <span className="grid size-6 place-items-center rounded-md bg-primary/12 ring-1 ring-primary/20">
                <Icons.results weight="duotone" className="size-3.5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Quarterly Results
              </span>
            </div>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Earnings, <span className="text-gradient">decoded</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Every quarterly result translated into plain English and scored by the InvestIQ
              Health Score — so you see what actually changed, not just the numbers.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  l: "Reported this week",
                  node: <AnimatedNumber value={stats.reportedThisWeek} />,
                },
                {
                  l: "Beats vs misses",
                  node: (
                    <span>
                      <span className="text-success">{stats.beats}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-danger">{stats.misses}</span>
                    </span>
                  ),
                },
                {
                  l: "Avg revenue growth",
                  node: (
                    <span className="text-success">
                      <AnimatedNumber value={stats.avgRev} prefix="+" suffix="%" decimals={1} />
                    </span>
                  ),
                },
                {
                  l: "Avg market reaction",
                  node: (
                    <span className={changeColor(stats.avgReaction)}>
                      <AnimatedNumber
                        value={stats.avgReaction}
                        prefix={stats.avgReaction >= 0 ? "+" : ""}
                        suffix="%"
                        decimals={1}
                      />
                    </span>
                  ),
                },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-xl border border-border/70 bg-surface-1/40 px-3 py-2.5"
                >
                  <p className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                    {s.l}
                  </p>
                  <p className="font-display text-lg font-bold">{s.node}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 self-start rounded-2xl border border-border/70 bg-surface-1/40 p-4 lg:self-center">
            <span className="grid size-12 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <Icons.brain weight="duotone" className="size-6" />
            </span>
            <div className="max-w-[12rem]">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                AI earnings desk
              </p>
              <p className="font-display text-base font-bold leading-snug">
                {results.length} results read &amp; summarized for you
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ------------------------------------------------------- Filters + search */}
      <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="custom-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:text-foreground"
                )}
              >
                <f.icon weight={active ? "fill" : "regular"} className="size-4" />
                {f.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[0.65rem] font-bold",
                    active ? "bg-primary/15 text-primary" : "bg-surface-3/60 text-muted-foreground"
                  )}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-64">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or sector…"
            className="h-10 w-full rounded-xl border border-border/70 bg-surface-1/40 pl-9 pr-3 text-sm outline-none focus:border-primary/40"
          />
        </div>
      </Reveal>

      {/* --------------------------------------------------------- Biggest movers */}
      <Reveal>
        <div className="glass rounded-3xl border border-border/70 p-5 sm:p-6">
          <SectionHeading
            eyebrow="Biggest movers"
            icon={Icons.fire}
            title="How the market reacted"
            subtitle="Share-price moves in the sessions right after each result dropped."
          />
          <div className="custom-scrollbar -mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1">
            {movers.map((m) => (
              <div
                key={m.symbol}
                className="flex w-44 shrink-0 flex-col gap-2 rounded-2xl border border-border/60 bg-surface-1/40 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{m.symbol}</span>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 font-mono text-xs font-bold",
                      changeColor(m.marketReaction)
                    )}
                  >
                    {m.marketReaction >= 0 ? (
                      <Icons.trendUp weight="bold" className="size-3" />
                    ) : (
                      <Icons.trendDown weight="bold" className="size-3" />
                    )}
                    {formatPct(m.marketReaction)}
                  </span>
                </div>
                <Sparkline data={m.reactionSpark} width={152} height={34} className="w-full" />
                <span className="truncate text-[0.7rem] text-muted-foreground">{m.sector}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------- Results feed */}
      <div>
        <SectionHeading
          eyebrow="Earnings feed"
          icon={Icons.chartBar}
          title={`${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
          subtitle="Latest quarterly prints, freshest first."
          className="mb-4"
        />

        {filtered.length === 0 ? (
          <Reveal>
            <div className="glass flex flex-col items-center gap-2 rounded-3xl border border-border/70 p-12 text-center">
              <Icons.search className="size-7 text-muted-foreground" />
              <p className="font-display text-lg font-bold">No results match</p>
              <p className="text-sm text-muted-foreground">
                Try a different filter or clear your search.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
              >
                Reset filters
              </Button>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r, i) => {
              const beat = isBeat(r);
              return (
                <Reveal key={r.symbol} delay={Math.min(i, 5) * 0.05}>
                  <article className="glass flex h-full flex-col gap-4 rounded-3xl border border-border/70 p-5 transition-colors hover:border-primary/30">
                    {/* header */}
                    <div className="flex items-start gap-3">
                      <HealthRing score={r.health} size={48} strokeWidth={5} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-display text-lg font-bold leading-none">
                            {r.symbol}
                          </h3>
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide",
                              beat
                                ? "bg-success/12 text-success"
                                : "bg-danger/12 text-danger"
                            )}
                          >
                            {beat ? "Beat" : "Miss"}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{r.name}</p>
                        <p className="text-[0.7rem] text-muted-foreground/80">{r.sector}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block rounded-md border border-border/70 bg-surface-1/40 px-2 py-0.5 font-mono text-[0.7rem] font-semibold">
                          {r.quarter}
                        </span>
                        <p className="mt-1 flex items-center justify-end gap-1 text-[0.65rem] text-muted-foreground">
                          <Icons.calendar weight="regular" className="size-3" />
                          {fmtDate(r.reportedOn)}
                        </p>
                      </div>
                    </div>

                    {/* headline numbers */}
                    <div className="grid grid-cols-3 gap-2">
                      <YoYStat
                        label="Revenue"
                        value={formatINR(r.revenue * CR, { compact: true })}
                        delta={r.revenueYoY}
                      />
                      <YoYStat
                        label="Net profit"
                        value={formatINR(r.netProfit * CR, { compact: true })}
                        delta={r.profitYoY}
                      />
                      <YoYStat
                        label="Op margin"
                        value={`${r.opMargin.toFixed(1)}%`}
                        delta={r.marginDeltaBps}
                        isBps
                      />
                    </div>

                    {/* market reaction */}
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-1/40 px-3 py-2.5">
                      <div>
                        <p className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                          Market reaction
                        </p>
                        <p
                          className={cn(
                            "flex items-center gap-1 font-mono text-base font-bold",
                            changeColor(r.marketReaction)
                          )}
                        >
                          {r.marketReaction >= 0 ? (
                            <Icons.arrowUpRight weight="bold" className="size-4" />
                          ) : (
                            <Icons.arrowDownRight weight="bold" className="size-4" />
                          )}
                          {formatPct(r.marketReaction)}
                        </p>
                      </div>
                      <Sparkline data={r.reactionSpark} width={120} height={36} />
                    </div>

                    {/* AI quick take */}
                    <div className="flex gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] p-3">
                      <Icons.spark
                        weight="fill"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
                      <div>
                        <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-primary">
                          AI quick take
                        </p>
                        <p className="mt-0.5 text-sm leading-snug text-foreground/90">{r.aiTake}</p>
                      </div>
                    </div>

                    {/* highlight chips */}
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      {r.highlights.map((h) => (
                        <span
                          key={h}
                          className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface-1/40 px-2 py-1 text-[0.7rem] text-muted-foreground"
                        >
                          <Icons.check weight="bold" className="size-3 text-success" />
                          {h}
                        </span>
                      ))}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------- Peer rank table */}
      <Reveal>
        <div className="glass rounded-3xl border border-border/70 p-5 sm:p-6">
          <SectionHeading
            eyebrow="Peer rank"
            icon={Icons.target}
            title="This quarter, ranked"
            subtitle="Sorted by profit growth — the clearest read on who actually delivered."
          />

          {/* desktop table */}
          <div className="custom-scrollbar -mx-2 mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/70 text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Company</th>
                  <th className="px-3 py-2 text-center font-medium">Health</th>
                  <th className="px-3 py-2 text-right font-medium">Rev YoY</th>
                  <th className="px-3 py-2 text-right font-medium">Profit YoY</th>
                  <th className="px-3 py-2 text-right font-medium">Op margin</th>
                  <th className="px-3 py-2 text-right font-medium">Reaction</th>
                </tr>
              </thead>
              <tbody>
                {[...results]
                  .sort((a, b) => b.profitYoY - a.profitYoY)
                  .map((r, i) => (
                    <tr
                      key={r.symbol}
                      className="border-b border-border/40 transition-colors hover:bg-surface-2/40"
                    >
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold">{r.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.sector} · {r.quarter}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className="inline-grid size-7 place-items-center rounded-lg text-xs font-bold"
                          style={{
                            color: healthColorVar(r.health),
                            background: `color-mix(in oklch, ${healthColorVar(r.health)} 14%, transparent)`,
                          }}
                        >
                          {r.health}
                        </span>
                      </td>
                      <td className={cn("px-3 py-2.5 text-right font-mono", changeColor(r.revenueYoY))}>
                        {formatPct(r.revenueYoY)}
                      </td>
                      <td className={cn("px-3 py-2.5 text-right font-mono", changeColor(r.profitYoY))}>
                        {formatPct(r.profitYoY)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.opMargin.toFixed(1)}%</td>
                      <td className={cn("px-3 py-2.5 text-right font-mono", changeColor(r.marketReaction))}>
                        {formatPct(r.marketReaction)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="mt-4 space-y-2.5 md:hidden">
            {[...results]
              .sort((a, b) => b.profitYoY - a.profitYoY)
              .map((r, i) => (
                <div
                  key={r.symbol}
                  className="rounded-2xl border border-border/60 bg-surface-1/40 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold"
                      style={{
                        color: healthColorVar(r.health),
                        background: `color-mix(in oklch, ${healthColorVar(r.health)} 14%, transparent)`,
                      }}
                    >
                      {r.health}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{r.symbol}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.sector} · {r.quarter}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-sm font-bold",
                        changeColor(r.profitYoY)
                      )}
                    >
                      {formatPct(r.profitYoY)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                    <span className={cn("font-mono", changeColor(r.revenueYoY))}>
                      Rev {formatPct(r.revenueYoY)}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      Margin {r.opMargin.toFixed(1)}%
                    </span>
                    <span className={cn("font-mono", changeColor(r.marketReaction))}>
                      {formatPct(r.marketReaction)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
