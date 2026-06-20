"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Sparkline } from "@/components/ui/sparkline";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { healthColorVar, healthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Local mock data — self-contained, no external route or import.      */
/* ------------------------------------------------------------------ */

type Pillars = {
  profitability: number;
  growth: number;
  stability: number;
  efficiency: number;
  valuation: number;
  momentum: number;
};

type CompareStock = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  health: number;
  pillars: Pillars;
  pe: number;
  roe: number;
  revenueGrowth: number;
  debtEquity: number;
  dividendYield: number;
  marketCap: string;
  spark: number[];
};

const STOCKS: CompareStock[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    sector: "Energy · Conglomerate",
    price: 2942,
    health: 84,
    pillars: { profitability: 82, growth: 79, stability: 88, efficiency: 75, valuation: 64, momentum: 81 },
    pe: 24.6,
    roe: 12.8,
    revenueGrowth: 11.4,
    debtEquity: 0.42,
    dividendYield: 0.35,
    marketCap: "₹19.9L Cr",
    spark: [2710, 2740, 2705, 2790, 2830, 2810, 2880, 2942],
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    sector: "IT Services",
    price: 3865,
    health: 91,
    pillars: { profitability: 94, growth: 76, stability: 95, efficiency: 92, valuation: 58, momentum: 73 },
    pe: 29.1,
    roe: 46.2,
    revenueGrowth: 8.1,
    debtEquity: 0.08,
    dividendYield: 1.6,
    marketCap: "₹14.0L Cr",
    spark: [3650, 3690, 3720, 3700, 3780, 3810, 3840, 3865],
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    sector: "Banking",
    price: 1678,
    health: 87,
    pillars: { profitability: 86, growth: 84, stability: 90, efficiency: 80, valuation: 71, momentum: 70 },
    pe: 19.4,
    roe: 17.1,
    revenueGrowth: 19.6,
    debtEquity: 0.0,
    dividendYield: 1.1,
    marketCap: "₹12.7L Cr",
    spark: [1540, 1565, 1590, 1572, 1610, 1640, 1660, 1678],
  },
  {
    symbol: "INFY",
    name: "Infosys",
    sector: "IT Services",
    price: 1612,
    health: 82,
    pillars: { profitability: 88, growth: 70, stability: 85, efficiency: 86, valuation: 66, momentum: 62 },
    pe: 25.3,
    roe: 31.4,
    revenueGrowth: 6.2,
    debtEquity: 0.09,
    dividendYield: 2.3,
    marketCap: "₹6.7L Cr",
    spark: [1700, 1660, 1640, 1612, 1590, 1605, 1600, 1612],
  },
  {
    symbol: "ITC",
    name: "ITC Ltd",
    sector: "FMCG",
    price: 458,
    health: 79,
    pillars: { profitability: 90, growth: 61, stability: 88, efficiency: 74, valuation: 78, momentum: 58 },
    pe: 26.7,
    roe: 28.9,
    revenueGrowth: 4.8,
    debtEquity: 0.01,
    dividendYield: 3.1,
    marketCap: "₹5.7L Cr",
    spark: [430, 438, 445, 440, 450, 448, 455, 458],
  },
  {
    symbol: "BAJFINANCE",
    name: "Bajaj Finance",
    sector: "NBFC · Finance",
    price: 7124,
    health: 73,
    pillars: { profitability: 78, growth: 92, stability: 64, efficiency: 70, valuation: 41, momentum: 88 },
    pe: 33.8,
    roe: 22.5,
    revenueGrowth: 27.4,
    debtEquity: 3.9,
    dividendYield: 0.5,
    marketCap: "₹4.4L Cr",
    spark: [6600, 6720, 6810, 6750, 6900, 7010, 7080, 7124],
  },
];

/* Pillar metadata (label + icon) */
const PILLARS: { key: keyof Pillars; label: string; icon: typeof Icons.coins }[] = [
  { key: "profitability", label: "Profitability", icon: Icons.coins },
  { key: "growth", label: "Growth", icon: Icons.trendUp },
  { key: "stability", label: "Stability", icon: Icons.shield },
  { key: "efficiency", label: "Efficiency", icon: Icons.bolt },
  { key: "valuation", label: "Valuation", icon: Icons.scales },
  { key: "momentum", label: "Momentum", icon: Icons.pulse },
];

/* Metric rows. `lowerIsBetter` flips winner logic for valuation-style metrics. */
type MetricRow = {
  key: string;
  label: string;
  get: (s: CompareStock) => number;
  fmt: (v: number) => string;
  lowerIsBetter?: boolean;
  hint: string;
};

const METRICS: MetricRow[] = [
  { key: "pe", label: "P/E ratio", get: (s) => s.pe, fmt: (v) => v.toFixed(1) + "×", lowerIsBetter: true, hint: "Lower is cheaper" },
  { key: "roe", label: "Return on equity", get: (s) => s.roe, fmt: (v) => v.toFixed(1) + "%", hint: "Higher is better" },
  { key: "revenueGrowth", label: "Revenue growth", get: (s) => s.revenueGrowth, fmt: (v) => v.toFixed(1) + "%", hint: "Higher is better" },
  { key: "debtEquity", label: "Debt / Equity", get: (s) => s.debtEquity, fmt: (v) => v.toFixed(2), lowerIsBetter: true, hint: "Lower is safer" },
  { key: "dividendYield", label: "Dividend yield", get: (s) => s.dividendYield, fmt: (v) => v.toFixed(2) + "%", hint: "Higher is better" },
  { key: "health", label: "Health score", get: (s) => s.health, fmt: (v) => String(v), hint: "Higher is better" },
];

/* winner: 0 = left, 1 = right, -1 = tie */
function winnerOf(a: number, b: number, lowerIsBetter?: boolean): 0 | 1 | -1 {
  if (a === b) return -1;
  const aWins = lowerIsBetter ? a < b : a > b;
  return aWins ? 0 : 1;
}

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

/* ------------------------------------------------------------------ */
/* Stock picker (button + dropdown list)                               */
/* ------------------------------------------------------------------ */

function StockPicker({
  side,
  stock,
  otherSymbol,
  accent,
  onPick,
}: {
  side: "left" | "right";
  stock: CompareStock;
  otherSymbol: string;
  accent: string;
  onPick: (s: CompareStock) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group relative w-full overflow-hidden rounded-3xl border p-5 text-left transition-colors sm:p-6",
          "border-border/70 bg-surface-1/40 hover:border-primary/40"
        )}
        style={{ boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${accent} 16%, transparent)` }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.18em]"
            style={{ color: accent, background: `color-mix(in oklch, ${accent} 14%, transparent)` }}
          >
            {side === "left" ? "Contender A" : "Contender B"}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            Change <Icons.caretDown weight="bold" className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </span>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <HealthRing score={stock.health} size={84} strokeWidth={8} showLabel />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-extrabold leading-tight">{stock.symbol}</p>
            <p className="truncate text-sm text-muted-foreground">{stock.name}</p>
            <p className="mt-2 font-mono text-lg font-bold">{inr(stock.price)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
          <span className="text-xs text-muted-foreground">{stock.sector}</span>
          <Sparkline data={stock.spark} width={84} height={28} color={accent} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              aria-label="Close picker"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute z-40 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-border/70 p-1.5 shadow-2xl"
            >
              {STOCKS.map((s) => {
                const isCurrent = s.symbol === stock.symbol;
                const isOther = s.symbol === otherSymbol;
                return (
                  <button
                    key={s.symbol}
                    disabled={isOther}
                    onClick={() => {
                      onPick(s);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      isOther
                        ? "cursor-not-allowed opacity-35"
                        : isCurrent
                          ? "bg-primary/10"
                          : "hover:bg-surface-2/60"
                    )}
                  >
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold"
                      style={{
                        color: healthColorVar(s.health),
                        background: `color-mix(in oklch, ${healthColorVar(s.health)} 14%, transparent)`,
                      }}
                    >
                      {s.health}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{s.symbol}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.name}</p>
                    </div>
                    {isCurrent && <Icons.check weight="bold" className="size-4 text-primary" />}
                    {isOther && <span className="text-[0.6rem] uppercase text-muted-foreground">In use</span>}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ComparisonPage() {
  const [left, setLeft] = useState<CompareStock>(STOCKS[0]); // RELIANCE
  const [right, setRight] = useState<CompareStock>(STOCKS[1]); // TCS

  const ACCENT_L = "var(--info)";
  const ACCENT_R = "var(--primary)";

  /* Tally metric wins for the AI verdict. */
  const tally = useMemo(() => {
    let leftWins = 0;
    let rightWins = 0;
    for (const m of METRICS) {
      const w = winnerOf(m.get(left), m.get(right), m.lowerIsBetter);
      if (w === 0) leftWins += 1;
      else if (w === 1) rightWins += 1;
    }
    let pillarLeft = 0;
    let pillarRight = 0;
    for (const p of PILLARS) {
      const a = left.pillars[p.key];
      const b = right.pillars[p.key];
      if (a > b) pillarLeft += 1;
      else if (b > a) pillarRight += 1;
    }
    return { leftWins, rightWins, pillarLeft, pillarRight };
  }, [left, right]);

  /* Overall verdict: health score is the headline, metric/pillar wins back it up. */
  const verdict = useMemo(() => {
    const healthLead = left.health - right.health;
    let champion: CompareStock;
    let challenger: CompareStock;
    let championAccent: string;
    if (healthLead > 0 || (healthLead === 0 && tally.leftWins >= tally.rightWins)) {
      champion = left;
      challenger = right;
      championAccent = ACCENT_L;
    } else {
      champion = right;
      challenger = left;
      championAccent = ACCENT_R;
    }
    const champMetricWins = champion === left ? tally.leftWins : tally.rightWins;
    const champPillarWins = champion === left ? tally.pillarLeft : tally.pillarRight;
    const gap = Math.abs(left.health - right.health);
    const margin = gap >= 10 ? "decisively" : gap >= 4 ? "clearly" : "narrowly";

    return {
      champion,
      challenger,
      championAccent,
      champMetricWins,
      champPillarWins,
      margin,
      gap,
      summary: `${champion.symbol} ${margin} edges out ${challenger.symbol} with a Health Score of ${champion.health} vs ${challenger.health}, winning ${champMetricWins} of ${METRICS.length} head-to-head metrics and ${champPillarWins} of ${PILLARS.length} quality pillars.`,
    };
  }, [left, right, tally]);

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      {/* 1) Hero */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-7"
      >
        <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-20" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-primary">
              <span className="grid size-7 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
                <Icons.scales weight="duotone" className="size-4" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Head to head</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Compare, <span className="text-gradient">head to head</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Settle the debate in seconds. Put any two stocks side by side and let the InvestIQ Health
              Score — plus the metrics that actually move it — pick a winner.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-start lg:self-center">
            <div className="rounded-2xl border border-border/70 bg-surface-1/40 px-4 py-3 text-center">
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Stocks</p>
              <p className="font-display text-xl font-extrabold">{STOCKS.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-surface-1/40 px-4 py-3 text-center">
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Metrics</p>
              <p className="font-display text-xl font-extrabold">{METRICS.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-surface-1/40 px-4 py-3 text-center">
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Pillars</p>
              <p className="font-display text-xl font-extrabold">{PILLARS.length}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 2) Pickers with VS */}
      <Reveal>
        <div className="glass rounded-3xl border border-border/70 p-4 sm:p-6">
          <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <StockPicker
                side="left"
                stock={left}
                otherSymbol={right.symbol}
                accent={ACCENT_L}
                onPick={setLeft}
              />
            </div>

            <div className="flex items-center justify-center md:px-1">
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="font-display text-2xl font-black"
              >
                <span className="grid size-12 place-items-center rounded-full border border-border/70 bg-surface-2 text-gradient shadow-lg sm:size-14">
                  VS
                </span>
              </motion.span>
            </div>

            <div className="flex-1">
              <StockPicker
                side="right"
                stock={right}
                otherSymbol={left.symbol}
                accent={ACCENT_R}
                onPick={setRight}
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* 3) Head-to-head metrics table */}
      <Reveal>
        <div className="glass rounded-3xl border border-border/70 p-5 sm:p-6">
          <SectionHeading
            eyebrow="Tale of the tape"
            icon={Icons.scales}
            title="Head-to-head metrics"
            subtitle="Winner of each row is highlighted. For valuation-style metrics, lower is better."
          />

          {/* Desktop table */}
          <div className="custom-scrollbar mt-5 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/70 text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 text-left font-medium">Metric</th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    <span style={{ color: ACCENT_L }}>{left.symbol}</span>
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium"></th>
                  <th className="px-3 py-2.5 text-left font-medium">
                    <span style={{ color: ACCENT_R }}>{right.symbol}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => {
                  const av = m.get(left);
                  const bv = m.get(right);
                  const w = winnerOf(av, bv, m.lowerIsBetter);
                  return (
                    <tr key={m.key} className="border-b border-border/40">
                      <td className="px-3 py-3">
                        <p className="font-medium">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.hint}</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono font-semibold",
                            w === 0 ? "text-success" : "text-foreground"
                          )}
                          style={w === 0 ? { background: "color-mix(in oklch, var(--success) 12%, transparent)" } : undefined}
                        >
                          {w === 0 && <Icons.crown weight="fill" className="size-3.5" />}
                          {m.fmt(av)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-[0.65rem] uppercase tracking-wider text-muted-foreground/60">
                        {w === -1 ? "tie" : "vs"}
                      </td>
                      <td className="px-3 py-3 text-left">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono font-semibold",
                            w === 1 ? "text-success" : "text-foreground"
                          )}
                          style={w === 1 ? { background: "color-mix(in oklch, var(--success) 12%, transparent)" } : undefined}
                        >
                          {w === 1 && <Icons.crown weight="fill" className="size-3.5" />}
                          {m.fmt(bv)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-5 space-y-2.5 md:hidden">
            {METRICS.map((m) => {
              const av = m.get(left);
              const bv = m.get(right);
              const w = winnerOf(av, bv, m.lowerIsBetter);
              return (
                <div key={m.key} className="rounded-2xl border border-border/60 bg-surface-1/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{m.label}</p>
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{m.hint}</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <div
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-3 py-2",
                        w === 0 ? "border-success/40 bg-success/10" : "border-border/50 bg-surface-2/40"
                      )}
                    >
                      <span className="truncate text-[0.65rem] font-semibold" style={{ color: ACCENT_L }}>
                        {left.symbol}
                      </span>
                      <span className={cn("flex items-center gap-1 font-mono text-sm font-bold", w === 0 && "text-success")}>
                        {w === 0 && <Icons.crown weight="fill" className="size-3" />}
                        {m.fmt(av)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-3 py-2",
                        w === 1 ? "border-success/40 bg-success/10" : "border-border/50 bg-surface-2/40"
                      )}
                    >
                      <span className="truncate text-[0.65rem] font-semibold" style={{ color: ACCENT_R }}>
                        {right.symbol}
                      </span>
                      <span className={cn("flex items-center gap-1 font-mono text-sm font-bold", w === 1 && "text-success")}>
                        {w === 1 && <Icons.crown weight="fill" className="size-3" />}
                        {m.fmt(bv)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* 4) Pillar-by-pillar diverging bars */}
      <Reveal>
        <div className="glass rounded-3xl border border-border/70 p-5 sm:p-6">
          <SectionHeading
            eyebrow="Quality DNA"
            icon={Icons.health}
            title="Pillar by pillar"
            subtitle="Six dimensions of the Health Score, mirrored. The leader of each pillar lights up."
          />

          <div className="mt-5 flex items-center justify-between text-xs font-semibold">
            <span style={{ color: ACCENT_L }}>{left.symbol}</span>
            <span className="text-muted-foreground">0 — 100</span>
            <span style={{ color: ACCENT_R }}>{right.symbol}</span>
          </div>

          <div className="mt-3 space-y-4">
            {PILLARS.map((p, i) => {
              const a = left.pillars[p.key];
              const b = right.pillars[p.key];
              const leftWins = a > b;
              const rightWins = b > a;
              const PIcon = p.icon;
              return (
                <div key={p.key}>
                  <div className="mb-1.5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <PIcon weight="duotone" className="size-3.5 text-primary" />
                    <span className="font-medium text-foreground">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* left value */}
                    <span
                      className={cn("w-8 shrink-0 text-right font-mono text-sm font-bold", leftWins ? "" : "text-muted-foreground")}
                      style={leftWins ? { color: ACCENT_L } : undefined}
                    >
                      {a}
                    </span>
                    {/* left bar (grows right-to-left) */}
                    <div className="flex h-2.5 flex-1 justify-end overflow-hidden rounded-full bg-surface-3/60">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${a}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{
                          background: ACCENT_L,
                          opacity: leftWins ? 1 : 0.45,
                          boxShadow: leftWins ? `0 0 10px ${ACCENT_L}` : undefined,
                        }}
                      />
                    </div>
                    {/* center divider */}
                    <span className="size-1.5 shrink-0 rounded-full bg-border" />
                    {/* right bar (grows left-to-right) */}
                    <div className="flex h-2.5 flex-1 justify-start overflow-hidden rounded-full bg-surface-3/60">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${b}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{
                          background: ACCENT_R,
                          opacity: rightWins ? 1 : 0.45,
                          boxShadow: rightWins ? `0 0 10px ${ACCENT_R}` : undefined,
                        }}
                      />
                    </div>
                    {/* right value */}
                    <span
                      className={cn("w-8 shrink-0 text-left font-mono text-sm font-bold", rightWins ? "" : "text-muted-foreground")}
                      style={rightWins ? { color: ACCENT_R } : undefined}
                    >
                      {b}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 border-t border-border/50 pt-4 text-xs text-muted-foreground">
            <span>
              Pillars won — <span style={{ color: ACCENT_L }}>{left.symbol} {tally.pillarLeft}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span>
              <span style={{ color: ACCENT_R }}>{right.symbol} {tally.pillarRight}</span>
            </span>
          </div>
        </div>
      </Reveal>

      {/* 5) AI verdict */}
      <Reveal>
        <div className="glass-strong relative overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-7">
          <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-20" />
          <div className="flex items-center gap-2 text-primary">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
              <Icons.brain weight="duotone" className="size-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">AI verdict</span>
          </div>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-center">
            {/* Champion badge */}
            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-border/70 bg-surface-1/40 p-4">
              <div className="relative">
                <HealthRing score={verdict.champion.health} size={92} strokeWidth={8} showLabel />
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.2 }}
                  className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-warning text-background shadow-lg"
                >
                  <Icons.crown weight="fill" className="size-4" />
                </motion.span>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Winner</p>
                <p className="font-display text-2xl font-extrabold" style={{ color: verdict.championAccent }}>
                  {verdict.champion.symbol}
                </p>
                <p className="text-xs text-muted-foreground">{healthLabel(verdict.champion.health)} health</p>
              </div>
            </div>

            {/* Narrative + scoreboard */}
            <div className="min-w-0 flex-1">
              <p className="text-base leading-relaxed text-foreground sm:text-lg">{verdict.summary}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {verdict.gap >= 4
                  ? `The ${verdict.gap}-point Health Score gap reflects stronger fundamentals overall — but check the pillars where ${verdict.challenger.symbol} still leads before you decide.`
                  : `It is a tight race — the two are nearly evenly matched, so let your own valuation tolerance and time horizon break the tie.`}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border/60 bg-surface-1/40 p-3 text-center">
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Health gap</p>
                  <p className="font-display text-xl font-extrabold">
                    <AnimatedNumber value={verdict.gap} suffix=" pts" />
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-surface-1/40 p-3 text-center">
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Metric wins</p>
                  <p className="font-display text-xl font-extrabold text-success">
                    {verdict.champMetricWins}/{METRICS.length}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-surface-1/40 p-3 text-center">
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Pillars won</p>
                  <p className="font-display text-xl font-extrabold text-success">
                    {verdict.champPillarWins}/{PILLARS.length}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-surface-1/40 p-3 text-center">
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Verdict</p>
                  <p className="font-display text-sm font-bold capitalize" style={{ color: verdict.championAccent }}>
                    {verdict.margin}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="gradient">
                  <Icons.target weight="duotone" className="size-4" /> Add {verdict.champion.symbol} to watchlist
                </Button>
                <Button variant="outline">
                  <Icons.arrowRight weight="bold" className="size-4" /> Full analysis
                </Button>
              </div>

              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <Icons.info weight="duotone" className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Generated from Health Scores and head-to-head metric wins. For education only, not investment advice.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
