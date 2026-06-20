"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Icons } from "@/lib/icons";
import { healthModel, allPillars, scoredStocks } from "@/lib/health-data";
import { healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";

const bands = [
  { label: "Strong", range: "80 – 100", color: "var(--success)", text: "Excellent across most pillars. High-conviction quality with low fundamental risk." },
  { label: "Moderate", range: "60 – 79", color: "var(--warning)", text: "Solid but mixed. One or two pillars need watching before you size up." },
  { label: "Weak", range: "0 – 59", color: "var(--danger)", text: "Multiple red flags. Treat with caution and demand a clear reason to own it." },
];

const example = scoredStocks[0]; // HDFC

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-20 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 px-6 py-12 sm:px-12 sm:py-16">
        <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-30" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <Link
          href="/health-score"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icons.caretRight className="size-3.5 rotate-180" />
          Back to Health Scores
        </Link>
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-primary">
              <Icons.health weight="duotone" className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Methodology</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              How the <span className="text-gradient">Health Score</span> is built
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground sm:text-lg">
              Every stock is graded on 40+ underlying metrics, grouped into 9 pillars
              across 3 lenses. We normalize each metric against the company's own
              history and its sector peers, weight them by what actually predicts
              durable quality, and roll it all into one transparent 0–100 score.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["No black box", "Peer & history aware", "Updated every quarter"].map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-1/40 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Icons.check weight="bold" className="size-3.5 text-primary" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="glass-strong rounded-3xl border border-border/70 p-8 text-center glow-sm">
              <HealthRing score={85} size={188} strokeWidth={13} showLabel />
              <p className="mt-3 text-sm text-muted-foreground">A single, honest number</p>
            </div>
          </div>
        </div>
      </section>

      {/* Three lenses */}
      <section>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">One number, three lenses</h2>
          <p className="mt-2 text-muted-foreground">
            Fundamentals carry the most weight — a great business is the foundation —
            while technicals and institutional flows add timing and conviction.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {healthModel.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.08}>
              <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-surface-1/40 p-5">
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-semibold uppercase tracking-wider", cat.tint)}>
                    {cat.title}
                  </span>
                  <span className="font-display text-2xl font-extrabold">{cat.weight}%</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{cat.blurb}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3/60">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${cat.weight}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {cat.pillars.map((p) => (
                    <span
                      key={p.key}
                      className="rounded-md bg-surface-2/70 px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Nine pillars */}
      <section>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">The nine pillars</h2>
          <p className="mt-2 text-muted-foreground">
            Each pillar answers a specific question about the stock — and you can
            always drill into the exact metrics behind it.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allPillars.map((p, i) => (
            <Reveal key={p.key} delay={(i % 3) * 0.06}>
              <SpotlightCard className="h-full p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <p.icon weight="duotone" className="size-5" />
                  </span>
                  <span className="rounded-md border border-border/70 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    {p.weight}% wt
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold">{p.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
                <div className="mt-3 border-t border-border/60 pt-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    What we measure
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.measures.map((m) => (
                      <span key={m} className="rounded-md bg-surface-2/60 px-2 py-0.5 text-xs text-muted-foreground">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Scoring bands */}
      <section>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Reading the score</h2>
          <p className="mt-2 text-muted-foreground">
            The 0–100 scale maps to three intuitive bands so you know at a glance
            where a stock stands.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {bands.map((b, i) => (
            <Reveal key={b.label} delay={i * 0.08}>
              <div
                className="flex h-full flex-col rounded-2xl border bg-surface-1/40 p-5"
                style={{ borderColor: `color-mix(in oklch, ${b.color} 30%, transparent)` }}
              >
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full" style={{ background: b.color }} />
                  <span className="font-display text-lg font-bold" style={{ color: b.color }}>
                    {b.label}
                  </span>
                  <span className="ml-auto font-mono text-sm text-muted-foreground">{b.range}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Worked example */}
      <section>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">A worked example</h2>
          <p className="mt-2 text-muted-foreground">
            Here's how {example.name}'s pillar scores roll up into its composite of{" "}
            <span className="font-semibold text-foreground">{example.score}</span>.
          </p>
        </Reveal>
        <Reveal>
          <div className="grid grid-cols-1 gap-6 rounded-3xl border border-border/70 bg-surface-1/30 p-6 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-surface-1/40 p-6">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {example.symbol} · {example.sector}
              </span>
              <HealthRing score={example.score} size={150} strokeWidth={11} showLabel />
            </div>
            <div className="space-y-2.5">
              {allPillars.map((p, i) => {
                const v = example.pillars[p.key];
                return (
                  <motion.div
                    key={p.key}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3"
                  >
                    <span className="flex w-28 shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                      <p.icon weight="duotone" className="size-4 text-primary/80" />
                      {p.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3/60">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${v}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: healthColorVar(v) }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-sm" style={{ color: healthColorVar(v) }}>
                      {v}
                    </span>
                    <span className="hidden w-12 text-right font-mono text-xs text-muted-foreground sm:block">
                      ×{p.weight}%
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <Reveal>
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 to-surface-1/40 p-8 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="font-display text-xl font-bold">See it in action</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse every scored stock, or screen the whole market by health.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/health-score">
                View Health Scores
                <Icons.arrowRight weight="bold" className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/research/stock-screener">Open Screener</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
