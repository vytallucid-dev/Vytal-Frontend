"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Reveal } from "@/components/ui/reveal";
import { Icons, type Icon } from "@/lib/icons";
import { healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * ★ THE FOUR PILLARS, and they are the REAL four. This section used to show nine pillars in three
 * categories (Fundamentals / Technical / Institutional) with RSI and MACD in the copy — a model the
 * engine has never run. The scores below are ILLUSTRATIVE by design (this is the marketing page,
 * not a live read) but the STRUCTURE is the engine's: Foundation · Momentum · Market · Ownership,
 * listed heaviest-first.
 *
 * ⚠ NO WEIGHTS. An earlier version printed "35% weight" on each card and computed the composite
 * ring from them — between the two, a reader could read the weight off the card and check it
 * against the ring. Per the product-wide rule, no numeric weight ships on any reader-facing
 * surface; the ORDER does, because four pillars with nothing said about their pull read as four
 * equal ones. See lib/health-data.ts.
 */
type Pillar = {
  key: string;
  score: number;
  icon: Icon;
  blurb: string;
};

const pillars: Pillar[] = [
  {
    key: "Foundation",
    score: 70,
    icon: Icons.shield,
    blurb:
      "The durable quality of the business — how profitably it turns capital into earnings, how solid the balance sheet is, and how much profit arrives as actual cash.",
  },
  {
    key: "Momentum",
    score: 59,
    icon: Icons.trendUp,
    blurb:
      "Which way those fundamentals are travelling. Earnings, revenue and margins over trailing twelve-month windows — not the share price.",
  },
  {
    key: "Market",
    score: 55,
    icon: Icons.chartLine,
    blurb:
      "The only pillar that reads price: where it sits in its own range, its trend, and how it has done against sector peers.",
  },
  {
    key: "Ownership",
    score: 75,
    icon: Icons.building,
    blurb:
      "Who owns the company and how that is shifting — promoter commitment and pledging, institutional participation, insider and block-deal activity.",
  },
];

/** An illustrative composite for the ring. ⚠ NOT computed from the cards: a published composite
 *  beside four published pillar scores is one equation, and enough such pairs solve for the
 *  weights. It sits inside the range the four imply and says nothing more than that. */
const ILLUSTRATIVE_COMPOSITE = 65;

export function HealthScoreSection() {
  const [active, setActive] = useState<Pillar>(pillars[0]);

  return (
    <section id="score" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-primary">
            <Icons.health weight="duotone" className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              The Vytal Health Score
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Four readings, one <span className="text-gradient">honest number.</span>
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Foundation, Momentum, Market and Ownership — each a 0–100 read of one
            dimension of the company, blended by fixed weights into a single 0–100
            score. Foundation carries the most. Hover any pillar to see what it
            measures.
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
              {/* ★ COMPUTED, not typed. The old hardcoded 85 sat above nine invented pillar scores
                  that could never have produced it. This is the real blend of the four cards on the
                  right, so the illustration is at least arithmetically honest with itself. */}
              <HealthRing score={ILLUSTRATIVE_COMPOSITE} size={196} strokeWidth={13} showLabel className="mx-auto my-4" />
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

          {/* RIGHT — the four pillars */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {pillars.map((p, i) => {
              const isActive = active.key === p.key;
              return (
                <Reveal key={p.key} delay={i * 0.06}>
                  <button
                    onMouseEnter={() => setActive(p)}
                    onFocus={() => setActive(p)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300",
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
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{p.key}</span>
                        {/* the pillar's own 0–100 read. NOT its weight — see the header note. */}
                        <span className="font-mono text-[0.7rem] text-muted-foreground">{p.score}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3/60">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p.score}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full"
                          // ★ THE REAL CONDITION SCALE. This bar used to cut at 80/60 into
                          // success/warning/danger — a three-band scale the product does not have.
                          // healthColorVar is the same five-band mapping every other surface uses.
                          style={{ background: healthColorVar(p.score) }}
                        />
                      </div>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
