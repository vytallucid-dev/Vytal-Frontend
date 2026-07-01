"use client";

import { useMemo } from "react";
import { StockAutocomplete } from "@/components/stock-autocomplete";
import { Icons } from "@/lib/icons";
import { motion } from "framer-motion";
import { Stock } from "@/lib/indian-stocks-data";
import { useRouter } from "next/navigation";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import type { LabelBand } from "@/types/health";

const BAND_CHIP: Record<LabelBand, string> = {
  pristine: "bg-pristine/15 text-pristine",
  healthy: "bg-healthy/15 text-healthy",
  steady: "bg-steady/15 text-steady",
  below_par: "bg-below/15 text-below",
  fragile: "bg-fragile/15 text-fragile",
};
const BAND_LABEL: Record<LabelBand, string> = {
  pristine: "Pristine",
  healthy: "Healthy",
  steady: "Steady",
  below_par: "Below par",
  fragile: "Fragile",
};

const StockScreenerPage = () => {
  const router = useRouter();
  const { data: universe, isLoading } = useUniverseStocks();

  // Full universe (scored + not-yet-scored) → the StockAutocomplete shape, so search
  // spans every tracked stock. Coverage flag drives the typeahead chip.
  const autocompleteStocks: Stock[] = useMemo(
    () =>
      (universe ?? []).map((s) => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector?.displayName ?? "",
        exchange: "NSE",
        scored: s.scored,
        band: s.band ?? undefined,
      })),
    [universe],
  );

  // Recommended = highest-rated SCORED stocks (top composite).
  const recommendedStocks = useMemo(
    () =>
      (universe ?? [])
        .filter((s) => s.scored && s.composite != null && s.band != null)
        .sort((a, b) => (b.composite ?? 0) - (a.composite ?? 0))
        .slice(0, 8),
    [universe],
  );

  const scoredCount = useMemo(
    () => (universe ?? []).filter((s) => s.scored).length,
    [universe],
  );

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 sm:px-6 py-12 pt-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto w-full max-w-4xl space-y-12 text-center"
      >
        {/* Title and Description */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-6xl"
          >
            Stock Analysis
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-sm text-ink2 sm:text-lg md:text-xl"
          >
            Search and analyse any stock in the universe to get its health score,
            diagnosis, and full pillar breakdown.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <StockAutocomplete
            stocks={autocompleteStocks}
            placeholder="Search any stock by ticker or company name…"
          />
          {!isLoading && universe && (
            <p className="num mt-3 text-xs text-ink3">
              {universe.length} stocks tracked · {scoredCount} scored
            </p>
          )}
        </motion.div>

        {/* Recommended Stocks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-center gap-2 text-ink3">
            <Icons.spark weight="duotone" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs font-medium sm:text-sm">Top rated in the universe</span>
          </div>

          {isLoading ? (
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-3 sm:gap-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 w-20 animate-pulse rounded-full bg-surface-2 sm:h-9 sm:w-28"
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-6 sm:gap-x-3 sm:gap-y-8">
              {recommendedStocks.map((stock, index) => (
                <motion.button
                  key={stock.symbol}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.5 + index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  onClick={() => router.push(`/research/stock-screener/${stock.symbol}`)}
                  className="group relative rounded-full border border-line bg-surface-1 px-3 py-1.5 transition-all duration-300 hover:scale-105 hover:border-line3 hover:bg-surface-2 sm:px-4 sm:py-2"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs font-semibold text-ink sm:text-sm">{stock.symbol}</span>
                    {stock.band && (
                      <span
                        className={`rounded-full px-1 py-0.5 text-[9px] font-semibold sm:px-1.5 sm:text-[10px] ${BAND_CHIP[stock.band]}`}
                      >
                        {BAND_LABEL[stock.band]}
                      </span>
                    )}
                  </div>
                  <span className="absolute -bottom-6 left-1/2 z-10 hidden -translate-x-1/2 transform whitespace-nowrap rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs text-ink2 shadow-lg group-hover:block">
                    {stock.name}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StockScreenerPage;
