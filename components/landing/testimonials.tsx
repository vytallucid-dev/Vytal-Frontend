"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
  stat: string;
  statLabel: string;
};

const testimonials: Testimonial[] = [
  { quote: "I stopped drowning in 20 browser tabs. One Health Score tells me more than an hour of digging ever did.", name: "Ananya Rao", role: "Long-term investor", initials: "AR", stat: "82", statLabel: "Avg health" },
  { quote: "The score caught a stock deteriorating two quarters before the price did. That alone paid for the year.", name: "Vikram Shah", role: "Swing trader", initials: "VS", stat: "+31%", statLabel: "YTD return" },
  { quote: "Finally a finance app that explains *why* in plain English. My dad actually uses it now.", name: "Priya Nair", role: "First-time investor", initials: "PN", stat: "9", statLabel: "Pillars" },
  { quote: "Comparison view is brutal in the best way — it ends the 'which bank is better' debate in ten seconds.", name: "Karthik Iyer", role: "Portfolio builder", initials: "KI", stat: "15", statLabel: "Holdings" },
  { quote: "The dashboard feels like a cockpit. Market pulse, my book, alerts — it's the first tab I open daily.", name: "Meera Joshi", role: "Active investor", initials: "MJ", stat: "₹24L", statLabel: "Tracked" },
  { quote: "Sector deep-dives helped me rotate out of IT before the drawdown. The data was just… there.", name: "Rohan Gupta", role: "Value investor", initials: "RG", stat: "Top 12%", statLabel: "Percentile" },
];

function Card({ t }: { t: Testimonial }) {
  return (
    <div className="lift glass w-[20rem] shrink-0 rounded-2xl border border-border/70 p-5 hover:border-primary/30 sm:w-[24rem]">
      <Icons.spark weight="fill" className="size-5 text-primary/60" />
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">“{t.quote}”</p>
      <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-accent/30 text-sm font-bold text-primary-foreground">
          {t.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{t.name}</p>
          <p className="truncate text-xs text-muted-foreground">{t.role}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-bold text-primary">{t.stat}</p>
          <p className="text-[0.6rem] text-muted-foreground">{t.statLabel}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ items, reverse }: { items: Testimonial[]; reverse?: boolean }) {
  const row = [...items, ...items];
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={cn(
          "flex shrink-0 gap-5 pr-5 group-hover:[animation-play-state:paused]",
          reverse ? "animate-marquee-reverse" : "animate-marquee-slow"
        )}
      >
        {row.map((t, i) => (
          <Card key={`${t.name}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section id="loved" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[140px]" />
      <Reveal className="mx-auto mb-14 max-w-2xl px-5 text-center">
        <div className="mb-3 inline-flex items-center gap-2 text-primary">
          <Icons.star weight="fill" className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">Loved by investors</span>
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Clarity people <span className="text-gradient">actually feel.</span>
        </h2>
        <p className="mt-4 text-muted-foreground sm:text-lg">
          From first-timers to full-time traders — here's what changes when the
          noise turns into one number.
        </p>
      </Reveal>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="flex flex-col gap-5"
      >
        <Row items={testimonials.slice(0, 3)} />
        <Row items={testimonials.slice(3)} reverse />
      </motion.div>
    </section>
  );
}
