"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HealthRing } from "@/components/ui/health-ring";
import { Sparkline } from "@/components/ui/sparkline";
import { Reveal } from "@/components/ui/reveal";
import { Icons, type Icon } from "@/lib/icons";

type Step = {
  n: string;
  title: string;
  body: string;
  icon: Icon;
  visual: React.ReactNode;
};

const steps: Step[] = [
  {
    n: "01",
    title: "Search any stock",
    body: "Type a name or ticker. InvestIQ instantly pulls fundamentals, price action and institutional flows from across the market — no spreadsheets, no tabs.",
    icon: Icons.search,
    visual: (
      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface-1/60 px-3 py-2.5">
        <Icons.search className="size-4 text-muted-foreground" />
        <span className="font-mono text-sm text-foreground">HDFC Bank</span>
        <span className="ml-auto rounded-md bg-primary/12 px-2 py-0.5 text-xs text-primary">NSE</span>
      </div>
    ),
  },
  {
    n: "02",
    title: "Read the score, not the noise",
    body: "Every stock gets a 0–100 Health Score with a plain-English story behind it. See strengths, concerns and how it stacks up against its peers — in seconds.",
    icon: Icons.health,
    visual: (
      <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-surface-1/60 p-3">
        <HealthRing score={85} size={64} strokeWidth={6} showValue />
        <div className="space-y-1.5">
          <span className="rounded-md bg-success/12 px-2 py-0.5 text-xs font-medium text-success">
            Strong fundamentals
          </span>
          <span className="block rounded-md bg-warning/12 px-2 py-0.5 text-xs font-medium text-warning">
            Premium valuation
          </span>
        </div>
      </div>
    ),
  },
  {
    n: "03",
    title: "Act with confidence",
    body: "Add to a portfolio, set health alerts, compare side-by-side or screen the whole market by score. The platform tells the story so you can make the call.",
    icon: Icons.target,
    visual: (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-1/60 p-3">
        <div>
          <p className="text-xs text-muted-foreground">Portfolio impact</p>
          <p className="font-mono text-sm font-semibold text-success">+₹28,500 today</p>
        </div>
        <Sparkline data={[30, 33, 32, 36, 38, 37, 41, 44]} width={84} height={32} />
      </div>
    ),
  },
];

export function HowItWorks() {
  const lineRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: wrapRef.current,
            start: "top 65%",
            end: "bottom 70%",
            scrub: 0.6,
          },
        }
      );
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-primary">
            <Icons.compass weight="duotone" className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              From confusion to conviction
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Analysis that feels like a <span className="text-gradient">conversation.</span>
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            You don't need a finance degree. The platform walks you through every
            stock like a story — here's what's strong, here's what to watch, here's
            what to do next.
          </p>
        </Reveal>

        <div ref={wrapRef} className="relative mt-16 pl-2">
          {/* progress rail */}
          <div className="absolute bottom-6 left-[1.45rem] top-6 w-px bg-border/60 sm:left-[1.95rem]">
            <div
              ref={lineRef}
              className="absolute inset-0 origin-top bg-gradient-to-b from-primary via-accent to-primary"
            />
          </div>

          <div className="space-y-12">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05} className="relative flex gap-5 sm:gap-7">
                <div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-primary/30 bg-background sm:size-12">
                  <s.icon weight="duotone" className="size-5 text-primary" />
                </div>
                <div className="flex-1 pt-0.5">
                  <span className="font-mono text-xs text-primary/70">{s.n}</span>
                  <h3 className="font-display text-xl font-bold sm:text-2xl">{s.title}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {s.body}
                  </p>
                  <div className="mt-4 max-w-sm">{s.visual}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
