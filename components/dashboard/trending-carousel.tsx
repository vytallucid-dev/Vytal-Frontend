"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Sparkline } from "@/components/ui/sparkline";
import { Icons } from "@/lib/icons";
import { trendingToday } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const ratingTint: Record<string, string> = {
  "Strong Buy": "text-success border-success/30 bg-success/10",
  Buy: "text-success border-success/25 bg-success/8",
  Accumulate: "text-info border-info/25 bg-info/8",
  Hold: "text-warning border-warning/25 bg-warning/8",
};

export function TrendingCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", dragFree: false });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // autoplay
  useEffect(() => {
    if (!emblaApi || paused) return;
    const id = setInterval(() => emblaApi.scrollNext(), 4200);
    return () => clearInterval(id);
  }, [emblaApi, paused]);

  return (
    <div
      className="glass relative overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
            <Icons.fire weight="duotone" className="size-4 text-primary" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold leading-tight">Trending Today</h3>
            <p className="text-xs text-muted-foreground">Movers with momentum &amp; a story</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="grid size-8 place-items-center rounded-lg border border-border/70 bg-surface-1/40 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            aria-label="Previous"
          >
            <Icons.caretRight className="size-4 rotate-180" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="grid size-8 place-items-center rounded-lg border border-border/70 bg-surface-1/40 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            aria-label="Next"
          >
            <Icons.caretRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {trendingToday.map((t, i) => {
            const up = t.change >= 0;
            const isActive = i === selected;
            return (
              <div
                key={t.symbol}
                className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_56%] lg:flex-[0_0_46%] xl:flex-[0_0_34%]"
              >
                <motion.div
                  animate={{ opacity: isActive ? 1 : 0.55, scale: isActive ? 1 : 0.97 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-2xl border border-border/70 bg-surface-1/50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <HealthRing score={t.health} size={48} strokeWidth={5} showValue />
                      <div>
                        <p className="font-display text-sm font-bold">{t.symbol}</p>
                        <p className="text-xs text-muted-foreground">{t.sector}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-md border px-1.5 py-0.5 text-[0.6rem] font-semibold",
                        ratingTint[t.rating] ?? "text-muted-foreground border-border/70"
                      )}
                    >
                      {t.rating}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="font-mono text-lg font-bold">₹{t.price.toLocaleString("en-IN")}</p>
                      <p className={cn("flex items-center gap-0.5 font-mono text-xs", up ? "text-success" : "text-danger")}>
                        {up ? <Icons.arrowUpRight weight="bold" className="size-3" /> : <Icons.arrowDownRight weight="bold" className="size-3" />}
                        {Math.abs(t.change)}%
                      </p>
                    </div>
                    <Sparkline data={t.spark} width={96} height={36} color={up ? "var(--success)" : "var(--danger)"} />
                  </div>

                  <div className="mt-3 rounded-xl border border-border/60 bg-surface-2/40 p-2.5">
                    <p className="flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                      <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                      Why it's trending
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.reason}</p>
                  </div>

                  <Link
                    href={`/research/stock-screener/${t.symbol}`}
                    className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-border/70 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  >
                    View analysis
                    <Icons.arrowRight weight="bold" className="size-3" />
                  </Link>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* dots */}
      <div className="mt-4 flex justify-center gap-1.5">
        {trendingToday.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === selected ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
