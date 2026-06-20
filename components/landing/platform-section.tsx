"use client";

import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { HealthRing } from "@/components/ui/health-ring";
import { Sparkline } from "@/components/ui/sparkline";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function PlatformSection() {
  return (
    <section id="platform" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-primary">
            <Icons.stack weight="duotone" className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              One terminal, every angle
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            A personalized OS for <span className="text-gradient">your money.</span>
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            From a bird's-eye dashboard to deep single-stock research — every tool
            speaks the same language, anchored by the Health Score.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          {/* Big — Dashboard OS */}
          <Reveal className="md:col-span-2 md:row-span-1">
            <SpotlightCard className="h-full p-6">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 text-primary">
                  <Icons.dashboard weight="duotone" className="size-5" />
                  <span className="text-sm font-semibold">Dashboard OS</span>
                </div>
                <h3 className="mt-3 font-display text-xl font-bold">
                  Your entire financial world, at a glance
                </h3>
                <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                  Portfolio, market pulse, holdings, news, alerts and AI insight —
                  one personalized control center that updates as the market moves.
                </p>
                <div className="mt-5 grid flex-1 grid-cols-3 gap-3">
                  {[
                    { l: "Net worth", v: "₹12.4L", c: "text-foreground" },
                    { l: "Today", v: "+2.35%", c: "text-success" },
                    { l: "Health", v: "82", c: "text-primary" },
                  ].map((m) => (
                    <div
                      key={m.l}
                      className="flex flex-col justify-end rounded-xl border border-border/70 bg-surface-1/50 p-3"
                    >
                      <p className="text-[0.7rem] text-muted-foreground">{m.l}</p>
                      <p className={cn("font-mono text-lg font-bold", m.c)}>{m.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* Tall — Health-driven research */}
          <Reveal delay={0.05} className="md:col-span-1 md:row-span-2">
            <SpotlightCard className="h-full p-6">
              <div className="flex h-full flex-col items-center text-center">
                <div className="flex items-center gap-2 self-start text-primary">
                  <Icons.health weight="duotone" className="size-5" />
                  <span className="text-sm font-semibold">Deep research</span>
                </div>
                <HealthRing score={88} size={150} strokeWidth={11} showLabel className="my-6" />
                <h3 className="font-display text-xl font-bold">9 tabs of clarity</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Overview, fundamentals, valuation, technicals, activity & more —
                  every metric explained in human terms.
                </p>
                <div className="mt-auto flex w-full flex-wrap justify-center gap-1.5 pt-5">
                  {["Fundamentals", "Valuation", "Technicals", "Activity", "News"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border/70 bg-surface-1/50 px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* Compare */}
          <Reveal delay={0.1}>
            <SpotlightCard className="h-full p-6">
              <div className="flex items-center gap-2 text-primary">
                <Icons.compare weight="duotone" className="size-5" />
                <span className="text-sm font-semibold">Compare</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold">Stock vs stock, head to head</h3>
              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-center">
                  <HealthRing score={85} size={56} strokeWidth={5} showValue />
                  <p className="mt-1 text-xs text-muted-foreground">HDFC</p>
                </div>
                <span className="font-display text-sm font-bold text-muted-foreground">VS</span>
                <div className="text-center">
                  <HealthRing score={82} size={56} strokeWidth={5} showValue />
                  <p className="mt-1 text-xs text-muted-foreground">ICICI</p>
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* Screener */}
          <Reveal delay={0.15}>
            <SpotlightCard className="h-full p-6">
              <div className="flex items-center gap-2 text-primary">
                <Icons.screener weight="duotone" className="size-5" />
                <span className="text-sm font-semibold">Screener & Sectors</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold">
                Filter the market by health
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Rank every stock and sector by score, momentum and valuation.
              </p>
              <Sparkline data={[20, 30, 28, 40, 52, 48, 60, 72, 68, 80]} width={220} height={40} className="mt-4 w-full" />
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
