"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Sparkline } from "@/components/ui/sparkline";
import { Icons } from "@/lib/icons";
import { useUniverseHealth } from "@/lib/api/hooks/use-universe-health";
import { useStockSpark } from "@/lib/api/hooks/use-stock-ohlcv";
import { compositeBand } from "@/components/health-hub/lib";
import { STOCK_BAND_LABEL } from "@/components/portfolio/lib";
import { sparkFromBars } from "@/components/watchlist/lib";
import { signPct } from "./lib";
import { cn } from "@/lib/utils";

interface MoverCard {
  symbol: string;
  name: string;
  sector: string | null;
  composite: number;
  delta: number; // signed QoQ health points
  reason: string;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
          <Icons.pulse weight="duotone" className="size-4 text-primary" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold leading-tight text-ink">On the Move</h3>
          <p className="text-xs text-ink3">Biggest health shifts this quarter</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// One slide — pulls the 7-SESSION spark read (key ["stock", symbol, "spark"], not the 365-session
// chart read) for current price, last-day change % and the sparkline (honest-omit <3 pts). The last
// two closes are all the day-change needs. Health shift + "why" come from the universe read.
function MoverSlide({ t, isActive }: { t: MoverCard; isActive: boolean }) {
  const ohlcv = useStockSpark(t.symbol);
  const bars = ohlcv.data?.bars ?? [];
  const spark = sparkFromBars(bars);
  const price = bars.length ? bars[bars.length - 1].close : null;
  const dayPct =
    bars.length >= 2 && bars[bars.length - 2].close > 0
      ? ((bars[bars.length - 1].close - bars[bars.length - 2].close) / bars[bars.length - 2].close) * 100
      : null;
  const dayUp = (dayPct ?? 0) >= 0;
  const healthUp = t.delta >= 0;

  return (
    <motion.div
      animate={{ opacity: isActive ? 1 : 0.55, scale: isActive ? 1 : 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("h-full rounded-2xl border bg-surface-2/50 p-3.5 sm:p-4", isActive ? "border-primary" : "border-line2")}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <HealthRing score={t.composite} size={48} strokeWidth={5} showValue />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-ink">{t.symbol}</p>
            <p className="truncate text-xs text-ink3">{t.sector ?? t.name}</p>
          </div>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-0.5 self-start rounded-md border px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold",
            healthUp ? "border-success/25 bg-success/10 text-success" : "border-danger/25 bg-danger/10 text-danger",
          )}
          title="Quarter-over-quarter health change"
        >
          {healthUp ? (
            <Icons.arrowUpRight weight="bold" className="size-3" />
          ) : (
            <Icons.arrowDownRight weight="bold" className="size-3" />
          )}
          {healthUp ? "+" : "−"}
          {Math.abs(Math.round(t.delta))} health
        </span>
      </div>

      {/* price + last-day change + 7d sparkline */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="num text-base font-bold text-ink sm:text-lg">
            {price != null ? `₹${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—"}
          </p>
          {dayPct != null ? (
            <p className={cn("num flex items-center gap-0.5 text-xs", dayUp ? "text-success" : "text-danger")}>
              {dayUp ? (
                <Icons.arrowUpRight weight="bold" className="size-3" />
              ) : (
                <Icons.arrowDownRight weight="bold" className="size-3" />
              )}
              {signPct(dayPct)} today
            </p>
          ) : (
            <p className="text-xs text-ink3">no recent price</p>
          )}
        </div>
        {spark && (
          <Sparkline
            data={spark.closes}
            width={96}
            height={36}
            color={dayUp ? "var(--success)" : "var(--danger)"}
          />
        )}
      </div>

      <div className="mt-3 rounded-xl border border-line2 bg-surface-3/40 p-2.5">
        <p className="flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          Why it&apos;s moving
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-ink3">{t.reason}</p>
      </div>

      <Link
        href={`/research/stock-screener/${t.symbol}?tab=health`}
        className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-line py-1.5 text-xs font-medium text-ink3 transition-colors hover:border-line3 hover:text-ink"
      >
        View health
        <Icons.arrowRight weight="bold" className="size-3" />
      </Link>
    </motion.div>
  );
}

export function TrendingCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", dragFree: false });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const { data, isLoading } = useUniverseHealth();

  const movers = useMemo<MoverCard[]>(() => {
    if (!data) return [];
    const bySymbol = new Map(data.members.map((m) => [m.symbol, m]));
    const build = (m: { symbol: string; composite: number; priorComposite: number; delta: number }): MoverCard => {
      const member = bySymbol.get(m.symbol);
      const toBand = compositeBand(m.composite);
      const fromBand = compositeBand(m.priorComposite);
      const crossed = toBand !== fromBand;
      const toLabel = STOCK_BAND_LABEL[toBand];
      const reason =
        m.delta >= 0
          ? `Health firmed ${Math.round(m.delta)} this quarter${crossed ? `, into ${toLabel}` : ""}.`
          : `Health eased ${Math.abs(Math.round(m.delta))} this quarter${crossed ? `, down to ${toLabel}` : ""}.`;
      return {
        symbol: m.symbol,
        name: member?.name ?? m.symbol,
        sector: member?.sector?.displayName ?? null,
        composite: m.composite,
        delta: m.delta,
        reason,
      };
    };
    const risers = data.movers.risers.slice(0, 4).map(build);
    const slippers = data.movers.slippers.slice(0, 4).map(build);
    return [...risers, ...slippers]
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 6);
  }, [data]);

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

  useEffect(() => {
    if (!emblaApi || paused || movers.length < 2) return;
    const id = setInterval(() => emblaApi.scrollNext(), 4200);
    return () => clearInterval(id);
  }, [emblaApi, paused, movers.length]);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 flex-1 animate-pulse rounded-2xl bg-surface-2/60" />
          ))}
        </div>
      </Shell>
    );
  }

  if (movers.length === 0) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-line2 bg-surface-2/40 px-4 py-8 text-center">
          <Icons.pulse weight="duotone" className="size-7 text-ink3/60" />
          <p className="max-w-md text-xs leading-relaxed text-ink3">
            No notable health moves in the scored universe this quarter. This fills with real
            risers and slippers as scores shift.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Shell>
        <div className="mb-1 flex justify-end gap-1.5">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="grid size-8 place-items-center rounded-lg border border-line bg-surface-2/60 text-ink3 transition-colors hover:border-line3 hover:text-ink"
            aria-label="Previous"
          >
            <Icons.caretRight className="size-4 rotate-180" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="grid size-8 place-items-center rounded-lg border border-line bg-surface-2/60 text-ink3 transition-colors hover:border-line3 hover:text-ink"
            aria-label="Next"
          >
            <Icons.caretRight className="size-4" />
          </button>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {movers.map((t, i) => (
              <div
                key={t.symbol}
                className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_56%] lg:flex-[0_0_46%] xl:flex-[0_0_34%]"
              >
                <MoverSlide t={t} isActive={i === selected} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {movers.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full cursor-pointer transition-all duration-300",
                i === selected ? "w-6 bg-primary" : "w-1.5 bg-ink3/40 hover:bg-ink3/60",
              )}
            />
          ))}
        </div>
      </Shell>
    </div>
  );
}
