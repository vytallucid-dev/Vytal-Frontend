"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Explorer",
    price: { monthly: 0, yearly: 0 },
    tagline: "Find your footing in the market.",
    features: ["Health Scores for 1,800+ stocks", "Basic dashboard", "1 watchlist", "Delayed market data"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: { monthly: 799, yearly: 649 },
    tagline: "The full analysis terminal.",
    features: [
      "Everything in Explorer",
      "Portfolio intelligence & health alerts",
      "Unlimited screens & comparisons",
      "Sector deep-dives + AI insights",
      "Real-time data",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Desk",
    price: { monthly: 2499, yearly: 1999 },
    tagline: "For serious portfolios & teams.",
    features: ["Everything in Pro", "Multi-portfolio management", "Custom alerts & exports", "Priority support"],
    cta: "Talk to us",
    highlight: false,
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-primary">
            <Icons.crown weight="duotone" className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Pricing</span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Clarity at every <span className="text-gradient">price point.</span>
          </h2>
          <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-border/70 bg-surface-1/50 p-1">
            {(["monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setYearly(p === "yearly")}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                  (p === "yearly") === yearly ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {(p === "yearly") === yearly && (
                  <motion.span
                    layoutId="billing-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {p}
                {p === "yearly" && (
                  <span className="ml-1 text-xs opacity-80">−20%</span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-6",
                  t.highlight
                    ? "border-primary/40 bg-gradient-to-b from-primary/10 to-surface-1/40 glow-sm"
                    : "border-border/70 bg-surface-1/40"
                )}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-lg font-bold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="font-display text-4xl font-extrabold">
                    ₹{yearly ? t.price.yearly : t.price.monthly}
                  </span>
                  <span className="mb-1.5 text-sm text-muted-foreground">/mo</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Icons.check weight="bold" className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-6 w-full"
                  variant={t.highlight ? "default" : "outline"}
                >
                  <Link href="/dashboard">{t.cta}</Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
