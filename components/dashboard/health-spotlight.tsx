"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { portfolioSummary, portfolioHealthBreakdown } from "@/lib/demo-data";
import { healthColorVar } from "@/lib/format";

export function HealthSpotlight() {
  return (
    <div className="glass relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-6">
      <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
            <Icons.health weight="duotone" className="size-4 text-primary" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold">Portfolio Health</h3>
            <p className="text-xs text-muted-foreground">The InvestIQ signature score</p>
          </div>
        </div>
        <span className="flex items-center gap-0.5 rounded-full bg-success/12 px-2 py-1 text-xs font-medium text-success">
          <Icons.trendUp weight="bold" className="size-3" />+{portfolioSummary.healthTrend} this month
        </span>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <HealthRing score={portfolioSummary.healthScore} size={118} strokeWidth={10} showLabel />
        <div className="flex-1 space-y-2.5">
          {portfolioHealthBreakdown.map((p, i) => (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, x: 8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{p.key}</span>
                <span className="font-mono font-medium" style={{ color: healthColorVar(p.score) }}>
                  {p.score}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-3/60">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${p.score}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{ background: healthColorVar(p.score) }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-surface-1/40 p-3 text-xs text-muted-foreground">
        <Icons.info weight="duotone" className="mr-1 inline size-3.5 text-primary align-text-bottom" />
        Strong on stability & profitability. Valuation is your weakest pillar — two
        holdings trade above their 5-yr median P/E.
      </div>

      <Button asChild variant="outline" size="sm" className="mt-4 w-full">
        <Link href="/health-score">
          Explore Health Scores
          <Icons.arrowRight weight="bold" className="size-3.5" />
        </Link>
      </Button>
    </div>
  );
}
