"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { HealthRing } from "@/components/ui/health-ring";
import { Sparkline } from "@/components/ui/sparkline";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";

const orbitChips = [
  { label: "Profitability", score: 88, pos: "left-[-8%] top-[12%]", icon: Icons.coins },
  { label: "Growth", score: 82, pos: "right-[-6%] top-[6%]", icon: Icons.trendUp },
  { label: "Stability", score: 90, pos: "left-[-12%] bottom-[20%]", icon: Icons.shield },
  { label: "Momentum", score: 75, pos: "right-[-10%] bottom-[14%]", icon: Icons.pulse },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to(visualRef.current, {
        y: -90,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: 0.8 },
      });
      gsap.to(backdropRef.current, {
        y: 120,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: 0.8 },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-16"
    >
      {/* backdrop */}
      <div ref={backdropRef} aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
        <div className="absolute left-1/2 top-[18%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute right-[10%] top-[10%] h-[24rem] w-[24rem] rounded-full bg-accent/12 blur-[130px]" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT — copy */}
        <div>
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary"
          >
            <span className="flex size-1.5 animate-pulse rounded-full bg-primary" />
            Proprietary Health Score · Built for Indian markets
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 font-display text-[2.7rem] font-extrabold leading-[1.04] tracking-tight sm:text-6xl"
          >
            The health of any stock.
            <br />
            In a <span className="text-gradient">single number.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            InvestIQ reads fundamentals, technicals and institutional flows for
            every stock — then distills 40+ metrics into one transparent score you
            can actually trust. No jargon. No noise. Just clarity.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="group">
              <Link href="/dashboard">
                Launch the Terminal
                <Icons.arrowRight
                  weight="bold"
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#score">
                <Icons.compass weight="duotone" className="size-4" />
                See how it works
              </a>
            </Button>
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            {[
              { v: "1,800+", l: "Stocks scored" },
              { v: "40+", l: "Metrics per stock" },
              { v: "9", l: "Health pillars" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-2xl font-bold text-foreground">{s.v}</p>
                <p className="text-xs text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — interactive health visual */}
        <motion.div
          ref={visualRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-square w-full max-w-md"
        >
          {/* central score card */}
          <div className="glass-strong relative flex h-full flex-col items-center justify-center rounded-[2rem] border border-border/70 p-8 glow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              HDFC Bank · NSE
            </span>
            <HealthRing score={85} size={208} strokeWidth={14} showLabel className="my-3" />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-foreground">₹1,820.40</span>
              <span className="flex items-center gap-0.5 font-mono text-success">
                <Icons.arrowUpRight weight="bold" className="size-3.5" />
                1.52%
              </span>
            </div>
            <Sparkline
              data={[40, 42, 41, 44, 46, 45, 48, 50, 49, 53]}
              width={180}
              height={36}
              className="mt-3"
            />
          </div>

          {/* orbiting metric chips */}
          {orbitChips.map((chip, i) => {
            const ChipIcon = chip.icon;
            return (
              <motion.div
                key={chip.label}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.12, duration: 0.5, ease: "backOut" }}
                className={cn(
                  "absolute z-10 animate-float",
                  chip.pos
                )}
                style={{ animationDelay: `${i * -1.4}s` }}
              >
                <div className="glass flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 shadow-lg">
                  <ChipIcon weight="duotone" className="size-4 text-primary" />
                  <div className="leading-tight">
                    <p className="text-[0.65rem] text-muted-foreground">{chip.label}</p>
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {chip.score}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-muted-foreground sm:flex"
      >
        <span className="text-[0.65rem] uppercase tracking-widest">Scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <Icons.caretDown className="size-4" />
        </motion.span>
      </motion.div>
    </section>
  );
}
