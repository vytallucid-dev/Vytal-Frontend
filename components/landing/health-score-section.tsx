"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Reveal } from "@/components/ui/reveal";
import { Icons, type Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Pillar = {
  key: string;
  score: number;
  icon: Icon;
  blurb: string;
};
type Category = { title: string; tint: string; pillars: Pillar[] };

const categories: Category[] = [
  {
    title: "Fundamentals",
    tint: "text-success",
    pillars: [
      { key: "Profitability", score: 88, icon: Icons.coins, blurb: "How efficiently the business turns revenue into profit — ROE, margins, ROCE." },
      { key: "Growth", score: 82, icon: Icons.trendUp, blurb: "Consistency and quality of revenue, profit and EPS expansion over time." },
      { key: "Stability", score: 90, icon: Icons.shield, blurb: "Balance-sheet strength — low leverage, strong interest coverage, steady earnings." },
      { key: "Efficiency", score: 85, icon: Icons.bolt, blurb: "How well capital converts into real cash flow, not just accounting profit." },
      { key: "Valuation", score: 70, icon: Icons.scales, blurb: "Whether you're paying a fair price versus the stock's history and its peers." },
    ],
  },
  {
    title: "Technical",
    tint: "text-info",
    pillars: [
      { key: "Momentum", score: 75, icon: Icons.pulse, blurb: "Strength of the current move — RSI, MACD and relative price action." },
      { key: "Trend", score: 80, icon: Icons.chartLine, blurb: "Alignment across short, medium and long-term trend structure." },
    ],
  },
  {
    title: "Institutional",
    tint: "text-primary",
    pillars: [
      { key: "Activity", score: 85, icon: Icons.building, blurb: "What smart money is doing — FII / DII flows, bulk & block deals." },
      { key: "Sentiment", score: 78, icon: Icons.brain, blurb: "Promoter conviction, insider buying and overall ownership quality." },
    ],
  },
];

const allPillars = categories.flatMap((c) => c.pillars);

export function HealthScoreSection() {
  const [active, setActive] = useState<Pillar>(allPillars[0]);

  return (
    <section id="score" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-primary">
            <Icons.health weight="duotone" className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              The InvestIQ Health Score
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            40+ metrics, distilled into <span className="text-gradient">one honest number.</span>
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Nine pillars across three lenses — fundamentals, technicals and
            institutional flows — combine into a transparent 0–100 score. Hover any
            pillar to see exactly what it measures.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          {/* LEFT — composite + active explanation */}
          <Reveal className="lg:sticky lg:top-28">
            <div className="glass-strong relative overflow-hidden rounded-3xl border border-border/70 p-8 text-center glow-sm">
              <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-30" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Composite Health
              </p>
              <HealthRing score={85} size={196} strokeWidth={13} showLabel className="mx-auto my-4" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mx-auto max-w-xs"
                >
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <active.icon weight="duotone" className="size-4 text-primary" />
                    <span className="font-display font-semibold">{active.key}</span>
                    <span className="font-mono text-sm text-muted-foreground">
                      {active.score}/100
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{active.blurb}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>

          {/* RIGHT — pillar grid */}
          <div className="space-y-7">
            {categories.map((cat, ci) => (
              <Reveal key={cat.title} delay={ci * 0.08}>
                <p className={cn("mb-2.5 text-xs font-semibold uppercase tracking-[0.16em]", cat.tint)}>
                  {cat.title}
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {cat.pillars.map((p) => {
                    const isActive = active.key === p.key;
                    return (
                      <button
                        key={p.key}
                        onMouseEnter={() => setActive(p)}
                        onFocus={() => setActive(p)}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300",
                          isActive
                            ? "border-primary/40 bg-primary/8 shadow-[0_0_30px_-12px_var(--glow)]"
                            : "border-border/70 bg-surface-1/40 hover:border-primary/25 hover:bg-surface-2/50"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
                            isActive ? "bg-primary/15 text-primary" : "bg-surface-2/70 text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          <p.icon weight="duotone" className="size-[1.15rem]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{p.key}</span>
                            <span className="font-mono text-xs text-muted-foreground">{p.score}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3/60">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${p.score}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                              className="h-full rounded-full"
                              style={{
                                background:
                                  p.score >= 80
                                    ? "var(--success)"
                                    : p.score >= 60
                                    ? "var(--warning)"
                                    : "var(--danger)",
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
