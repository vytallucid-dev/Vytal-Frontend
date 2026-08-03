"use client";

// The timeline (default view) — an agenda grouped by horizon (This week · Next week ·
// This month · Later), held-first within each. Held events lead; a thin "Market" divider
// marks where owned names give way to the rest. Empty horizons are simply omitted; an
// all-empty result is an honest, filter-aware empty.
//
// ── PAGED, NOT PRE-LOADED ─────────────────────────────────────────────────────────────
// The feed arrives one keyset page at a time and grows as the reader scrolls: a sentinel below
// the last horizon pulls the next page before it is visible, with an explicit "Load more" as
// the control for anyone who never reaches it (keyboard, reduced motion, a filter that hides
// most of what is loaded). Both are the SAME action — the button is not a fallback path.
// Because filtering happens over what has been loaded, "no matches" while pages remain is a
// real state and says so, rather than pretending the feed is exhausted.

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
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

/** Placeholder rows for the page in flight — the agenda grows INTO the loader instead of
 *  jumping when the events land. Sized to an EventRow so the shift is nil. */
function RowSkeletons({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="shimmer h-21.5 rounded-xl bg-surface-2" />
      ))}
    </div>
  );
}

export function Timeline({
  events,
  heldOnly,
  onClear,
  hasActiveFilters,
  loadedCount,
  total,
  isLoading,
  hasMore,
  isFetchingMore,
  onLoadMore,
}: {
  /** Loaded pages, enriched and filtered. */
  events: CalEvent[];
  heldOnly: boolean;
  onClear: () => void;
  hasActiveFilters: boolean;
  /** Rows loaded BEFORE filters — what "no matches yet" is measured against. */
  loadedCount: number;
  /** Every event in the window server-side, filters excluded. */
  total: number;
  /** The first page is still in flight. */
  isLoading: boolean;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
}) {
  const groups = groupByHorizon(events);

  /* ── infinite scroll — a sentinel below the agenda pulls the next page as it nears the
   *    viewport (rootMargin preloads before it's actually visible). Same mechanic as the
   *    results feed and the funds browse grid. ── */
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) onLoadMore();
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, isFetchingMore, onLoadMore, loadedCount]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="shimmer h-5 w-32 rounded-md bg-surface-2" aria-hidden />
        <RowSkeletons count={5} />
      </div>
    );
  }

  // Nothing loaded at all for this window — a genuinely empty feed, not a paging state.
  if (loadedCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line2 px-8 py-16 text-center">
        <Icons.calendar weight="duotone" className="mx-auto mb-3 size-7 text-ink3 opacity-60" />
        <p className="text-[13px] text-ink2">
          {hasActiveFilters ? "No events in this date range" : "No upcoming events"}
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

      {/* the filters hid everything loaded so far, but the feed has more to give — an honest
          in-between state, with the same load control rather than a dead end */}
      {events.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line2 px-8 py-12 text-center">
          <Icons.filter weight="duotone" className="mx-auto mb-3 size-6 text-ink3 opacity-60" />
          <p className="text-[13px] text-ink2">No matches in the first {loadedCount} events</p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] text-ink3">
            {hasMore
              ? "Keep loading to search further out, or loosen the filters."
              : "Try the type, impact, sector or held lens."}
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
      )}

      {isFetchingMore && <RowSkeletons count={Math.min(4, Math.max(1, total - loadedCount))} />}

      {/* sentinel + the bottom controls */}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      <div className="flex flex-col items-center gap-2 pb-1" aria-live="polite">
        {isFetchingMore ? (
          <span className="flex items-center gap-2 text-[12px] text-ink3">
            <Icons.spinner className="size-4 animate-spin" />
            Loading more events…
          </span>
        ) : hasMore ? (
          <>
            <button
              type="button"
              onClick={onLoadMore}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-line2 px-3.5 py-2 text-[12.5px] font-medium text-ink2",
                "transition-colors hover:border-line3 hover:text-ink",
              )}
            >
              <Icons.caretDown className="size-3.5" />
              Load more
            </button>
            <p className="num text-[11px] text-ink3">
              {loadedCount.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")} loaded
            </p>
          </>
        ) : (
          total > 0 && (
            <p className="num text-[11px] text-ink3">
              All {total.toLocaleString("en-IN")} event{total === 1 ? "" : "s"} loaded
            </p>
          )
        )}
      </div>
    </div>
  );
}
