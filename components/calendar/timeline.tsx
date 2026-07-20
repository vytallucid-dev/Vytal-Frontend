"use client";

// The timeline (default view) — an agenda grouped by horizon (This week · Next week ·
// This month · Later), held-first within each. Held events lead; a thin "Market" divider
// marks where owned names give way to the rest. Empty horizons are simply omitted; an
// all-empty result is an honest, filter-aware empty.

import { motion } from "framer-motion";
import { Icons } from "@/lib/icons";
import { EventRow } from "./event-row";
import {
  HORIZON_META,
  HORIZON_ORDER,
  groupByHorizon,
  type CalEvent,
  type Horizon,
} from "./lib";

function HorizonSection({ horizon, events, heldOnly }: { horizon: Horizon; events: CalEvent[]; heldOnly: boolean }) {
  if (events.length === 0) return null;

  // held-first is already applied; find the boundary to a "Market" sub-label.
  const firstMarket = events.findIndex((e) => !e.isHeld);
  const hasHeld = events.some((e) => e.isHeld);
  const showMarketDivider = !heldOnly && hasHeld && firstMarket > 0;
  const heldCount = events.filter((e) => e.isHeld).length;

  return (
    // A mount-time entrance — deliberately NOT a scroll-gated `Reveal`/`whileInView`. The
    // timeline is a variable-height agenda, so a viewport-`once` reveal left any section below
    // the fold stuck at opacity 0 until the user happened to scroll to it.
    <motion.section
      className="flex flex-col gap-2.5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between gap-3 px-0.5">
        <h3 className="font-display text-[15px] font-semibold text-ink">{HORIZON_META[horizon].label}</h3>
        <span className="num rounded-full border border-line bg-surface-1 px-2 py-0.5 text-[11px] text-ink3">
          {events.length} event{events.length === 1 ? "" : "s"}
          {heldCount > 0 && !heldOnly && <span className="text-ink2"> · {heldCount} held</span>}
        </span>
      </div>

      {/* Each row drives its OWN entrance (initial→animate) instead of inheriting a
          `show` variant from a StaggerGroup parent. The calendar joins two independent
          queries (events, then holdings), and when holdings land the rows re-sort
          held-first. Under parent-orchestrated variants that reorder reset some rows back
          to the `hidden` (opacity-0) variant without ever re-firing `show`, so they stayed
          invisible. A self-animating row settles at opacity 1 and, keyed by a stable id,
          only reorders on re-sort — it never resets, so no row can get stuck transparent. */}
      <div className="flex flex-col gap-2">
        {events.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 12) * 0.025 }}
          >
            {showMarketDivider && i === firstMarket && (
              <div className="mb-2 flex items-center gap-2 px-0.5 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-ink3">Market</span>
                <span className="h-px flex-1 bg-line" />
              </div>
            )}
            <EventRow e={e} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export function Timeline({
  events,
  heldOnly,
  onClear,
  hasActiveFilters,
}: {
  events: CalEvent[];
  heldOnly: boolean;
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  const groups = groupByHorizon(events);

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line2 px-8 py-16 text-center">
        <Icons.calendar weight="duotone" className="mx-auto mb-3 size-7 text-ink3 opacity-60" />
        <p className="text-[13px] text-ink2">
          {hasActiveFilters ? "No events match these filters" : "No upcoming events in the next 90 days"}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[12px] text-ink3">
          {hasActiveFilters
            ? "Try widening the date range, or the type, impact, sector or held lens."
            : "Corporate actions will appear here as the disclosure feeds report them."}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line2 px-3 py-1.5 text-[12px] font-medium text-ink2 transition-colors hover:text-ink"
          >
            <Icons.close className="size-3.5" />
            Reset filters &amp; range
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {HORIZON_ORDER.map((h) => (
        <HorizonSection key={h} horizon={h} events={groups[h]} heldOnly={heldOnly} />
      ))}
    </div>
  );
}
