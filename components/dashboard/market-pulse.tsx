"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Sparkline } from "@/components/ui/sparkline";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { useIndices, type IndexQuote } from "@/lib/api/hooks/use-indices";
import { cn } from "@/lib/utils";

// The market strip — a rotating carousel of the headline indices from the index_prices
// feed (Nifty 50, Bank Nifty, Nifty IT, Sensex, Nifty Auto/FMCG/Metal/Pharma/Realty).
// Auto-scrolls; the user can also swipe/drag; dot pagination, no arrows. Read-only.

function IndexTile({ idx }: { idx: IndexQuote }) {
  const up = idx.changePct >= 0;
  return (
    <div className="h-full rounded-xl border border-line bg-surface-2/50 p-4 transition-colors hover:border-line3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-ink3">
          {idx.label}
        </span>
        <span
          className={cn(
            "flex shrink-0 items-center gap-0.5 font-mono text-xs",
            up ? "text-success" : "text-danger",
          )}
        >
          {up ? (
            <Icons.arrowUpRight weight="bold" className="size-3" />
          ) : (
            <Icons.arrowDownRight weight="bold" className="size-3" />
          )}
          {Math.abs(idx.changePct).toFixed(2)}%
        </span>
      </div>
      <p className="num mt-1 font-display text-lg font-bold tracking-tight text-ink">
        {idx.close.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </p>
      <Sparkline
        data={idx.spark}
        width={200}
        height={30}
        className="mt-1.5 w-full"
        color={up ? "var(--success)" : "var(--danger)"}
      />
    </div>
  );
}

export function MarketPulse() {
  const { data, isLoading, isError } = useIndices();
  const indices = data ?? [];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", dragFree: true });
  const [snaps, setSnaps] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => {
      setSnaps(emblaApi.scrollSnapList());
      onSelect();
    });
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect, indices.length]);

  // auto-scroll — pauses on hover/touch
  useEffect(() => {
    if (!emblaApi || paused || indices.length < 2) return;
    const id = setInterval(() => emblaApi.scrollNext(), 3500);
    return () => clearInterval(id);
  }, [emblaApi, paused, indices.length]);

  if (isLoading) {
    return (
      <Reveal>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-line bg-surface-1" />
          ))}
        </div>
      </Reveal>
    );
  }

  if (isError || indices.length === 0) {
    return (
      <Reveal>
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-line2 bg-surface-1 p-4 text-sm text-ink3">
          <Icons.pulse weight="duotone" className="size-5 text-primary/70" />
          <span>Market index data is unavailable right now.</span>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal>
      <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3">
            {indices.map((idx) => (
              <div
                key={idx.indexName}
                className="min-w-0 flex-[0_0_72%] sm:flex-[0_0_45%] lg:flex-[0_0_31%] xl:flex-[0_0_23.4%]"
              >
                <IndexTile idx={idx} />
              </div>
            ))}
          </div>
        </div>

        {/* dot pagination — no arrows */}
        {snaps.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {snaps.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Go to index group ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full cursor-pointer transition-all duration-300",
                  i === selected ? "w-6 bg-primary" : "w-1.5 bg-ink3/40 hover:bg-ink3/60",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
