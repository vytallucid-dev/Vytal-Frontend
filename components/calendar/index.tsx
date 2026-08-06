"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR — the catalyst timeline. A prioritized, held-first view of corporate
// events (GET /api/v1/events/calendar), joined to the user's holdings
// (useHoldings) for the health lens. Events only — no price / buy / sell / target.
//
//   • KPI + Spotlight — one compact row: the "do I need to pay attention" read + the
//     single most important upcoming event (rounded health score, held-first).
//   • Controls        — Filters (popover: type · impact · sector · held-vs-all) + a
//     date-range picker driving the timeline window.
//   • Timeline        — agenda by horizon, held-first, paged as you scroll (default view).
//   • Month grid      — the spatial alternate (month/year picker, click a day → sheet),
//                       and the ONE place that reads history.
//
// ── THREE READS, ONE FEED ────────────────────────────────────────────────────────────
// The page used to be one fixed 90-day fetch sliced client-side, which put two ceilings on
// it: the timeline could never show a 91st day, and the grid could never show yesterday.
// Each surface now asks for the window it is actually showing:
//
//   1. useEventsCalendar(90) — the UNPAGED look-ahead behind the KPI strip and the spotlight.
//      Those must describe a FIXED window ("high-impact this week"), never "whatever the
//      reader happened to scroll to", so they cannot be derived from the paged feed. Shared
//      key with the dashboard's card, so it is usually already warm.
//   2. useCalendarTimeline(window) — the timeline's keyset-paged feed, open-ended forward.
//   3. useCalendarWindow(gridWindow(month)) — exactly the month the grid is showing.
//
// Filters stay CLIENT-side over what is loaded. The held lens cannot be pushed to the server
// at all (it is a join against the user's holdings) and a half-server/half-client filter would
// make "load more" mean "fetch 40 rows, show the 2 that pass" — so the honest split is: the
// server owns the WINDOW, the client owns the LENS. The timeline says how many it has loaded
// so that stays legible.
//
// The held lens degrades gracefully: no session / no holdings → KPIs honest-zero, the
// spotlight falls back to the nearest market high-impact, the views still show the full
// market. Holdings never block the calendar from rendering.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from "react";
import { parseISO, startOfMonth } from "date-fns";
import {
  useCalendarBounds,
  useCalendarTimeline,
  useCalendarWindow,
  useEventsCalendar,
} from "@/lib/api/hooks/use-events-calendar";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { tint } from "@/components/stock-detail/health/shared";
import { KpiStrip } from "./kpi-strip";
import { Spotlight } from "./spotlight";
import { CalendarFiltersBar } from "./filters";
import { RangePicker } from "./range-picker";
import { Timeline } from "./timeline";
import { MonthGrid } from "./month-grid";
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  applyFilters,
  buildHeldIndex,
  computeBounds,
  computeKpis,
  enrichEvents,
  gridWindow,
  monthNavBounds,
  presetRange,
  rangeWindow,
  selectSpotlight,
  sectorOptions,
  typeGroupOptions,
  type CalendarFilters,
  type DateRange,
  type RangePresetKey,
} from "./lib";

type View = "timeline" | "grid";

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const opts: { value: View; label: string; icon: typeof Icons.pulse }[] = [
    { value: "timeline", label: "Timeline", icon: Icons.pulse },
    { value: "grid", label: "Month", icon: Icons.calendar },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-1 p-0.5">
      {opts.map((o) => {
        const on = view === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              on ? "text-ink" : "text-ink3 hover:text-ink",
            )}
            style={on ? tint("var(--primary)", 12, 30) : undefined}
          >
            <o.icon weight={on ? "fill" : "regular"} className="size-3.5" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function CalendarHub() {
  const bounds = useMemo(() => computeBounds(), []);

  const [view, setView] = useState<View>("timeline");
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_FILTERS);
  const [rangePreset, setRangePreset] = useState<RangePresetKey>("all");
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [gridMonth, setGridMonth] = useState(() => startOfMonth(bounds.today));

  // ── the reads ───────────────────────────────────────────────────────────────────────
  const contextQ = useEventsCalendar(90); // KPI strip + spotlight + the honest empty state
  const holdingsQ = useHoldings(); // held lens — never blocks the calendar
  const navQ = useCalendarBounds(); // how far back / forward the grid may travel

  const range = useMemo(
    () => (rangePreset === "custom" ? customRange : presetRange(rangePreset, bounds)),
    [rangePreset, customRange, bounds],
  );
  const timelineWindow = useMemo(() => rangeWindow(range, bounds), [range, bounds]);
  const timelineQ = useCalendarTimeline(timelineWindow, view === "timeline");
  const gridQ = useCalendarWindow(view === "grid" ? gridWindow(gridMonth) : null);

  // Memoized on the QUERY DATA, not on a `?? []` literal — an inline fallback is a fresh array
  // on every render, which would rebuild the held index and re-enrich all three feeds each time.
  const holdings = useMemo(() => holdingsQ.data?.holdings ?? [], [holdingsQ.data]);
  const hasHoldings = holdings.length > 0;
  const held = useMemo(() => buildHeldIndex(holdings), [holdings]);

  // the fixed 90-day look-ahead — the ONLY input to the KPIs and the spotlight
  const context = useMemo(
    () => enrichEvents(contextQ.data ?? [], held, bounds),
    [contextQ.data, held, bounds],
  );
  const kpis = useMemo(() => computeKpis(context, bounds), [context, bounds]);
  const spotlight = useMemo(() => selectSpotlight(context), [context]);

  // the timeline's loaded pages
  const timelinePages = timelineQ.data?.pages;
  const timelineAll = useMemo(
    () => enrichEvents(timelinePages?.flatMap((p) => p.events) ?? [], held, bounds),
    [timelinePages, held, bounds],
  );
  const timelineEvents = useMemo(
    () => applyFilters(timelineAll, filters),
    [timelineAll, filters],
  );

  // the grid's visible month
  const gridAll = useMemo(
    () => enrichEvents(gridQ.data?.events ?? [], held, bounds),
    [gridQ.data, held, bounds],
  );
  const gridEvents = useMemo(() => applyFilters(gridAll, filters), [gridAll, filters]);

  // Filter options come from the union of what's in play, so a sector that only exists in a
  // historical month (or 200 days out) is still selectable once it's on screen.
  const optionSource = useMemo(
    () => [...context, ...(view === "grid" ? gridAll : timelineAll)],
    [context, view, gridAll, timelineAll],
  );
  const typeGroups = useMemo(() => typeGroupOptions(optionSource), [optionSource]);
  const sectors = useMemo(() => sectorOptions(optionSource), [optionSource]);
  const activeCount = activeFilterCount(filters);

  const nav = useMemo(() => monthNavBounds(navQ.data, bounds.today), [navQ.data, bounds.today]);
  const latestEvent = navQ.data?.latest ? parseISO(navQ.data.latest) : undefined;

  const clearFilters = () => setFilters(DEFAULT_FILTERS);
  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setRangePreset("all");
    setCustomRange(null);
  };
  const onRangeChange = (preset: RangePresetKey, custom: DateRange | null) => {
    setRangePreset(preset);
    setCustomRange(custom);
  };

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = timelineQ;
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);

  // The page's own first paint hangs on the context read; the two view feeds carry their own
  // loading states so switching views or months never blanks the header and the KPI strip.
  const isFirstLoad = contextQ.isLoading;

  // "Nothing on the calendar" means the TABLE is empty — not merely that the next 90 days are
  // quiet. An empty look-ahead used to blank the whole page, which would now also swallow the
  // view toggle and hide every historical event we hold behind a screen saying there are none.
  const nothingAtAll =
    contextQ.data != null &&
    context.length === 0 &&
    !navQ.isLoading &&
    (navQ.data?.total ?? 0) === 0;

  const subtitle = () => {
    if (!contextQ.data) return "Loading events…";
    if (view === "grid") return "Browse any month — history included";
    const total = timelinePages?.[0]?.total;
    if (total == null) return `${context.length} upcoming events · next 90 days`;
    return `${total} event${total === 1 ? "" : "s"} in view · your holdings first`;
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      {/* header */}
      <div className="pt-1">
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Catalyst calendar</h1>
            <p className="mt-1 text-[12.5px] text-ink2">{subtitle()}</p>
          </div>
          {contextQ.data && !nothingAtAll && (
            <div className="flex flex-wrap items-center gap-2">
              <CalendarFiltersBar
                filters={filters}
                onChange={setFilters}
                onClear={clearFilters}
                typeGroups={typeGroups}
                sectors={sectors}
                hasHoldings={hasHoldings}
              />
              {view === "timeline" && (
                <RangePicker
                  preset={rangePreset}
                  custom={customRange}
                  bounds={bounds}
                  maxDate={latestEvent}
                  onChange={onRangeChange}
                />
              )}
              <ViewToggle view={view} onChange={setView} />
            </div>
          )}
        </div>
      </div>

      {/* body */}
      {isFirstLoad ? (
        <QuerySkeleton rows={6} rowHeight="h-16" className="mt-6" />
      ) : contextQ.isError ? (
        <QueryError
          message={(contextQ.error as Error)?.message ?? "Failed to load the events calendar"}
          onRetry={() => contextQ.refetch()}
          className="mt-6"
        />
      ) : nothingAtAll ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line2 px-8 py-20 text-center">
          <Icons.calendar weight="duotone" className="mx-auto mb-4 size-8 text-ink3 opacity-60" />
          <h3 className="font-display text-[20px] font-semibold text-ink2">Nothing on the calendar</h3>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink3">
            We hold no corporate events for the universe — past or upcoming. Earnings, dividends
            and corporate actions will appear here as the disclosure feeds report them.
          </p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-5">
          {/* KPI + Spotlight — one compact row */}
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <KpiStrip kpis={kpis} />
            </div>
            {spotlight && (
              <div className="lg:col-span-2">
                <Spotlight event={spotlight} />
              </div>
            )}
          </div>

          {/* active view */}
          {view === "timeline" ? (
            timelineQ.isError ? (
              <QueryError
                message={(timelineQ.error as Error)?.message ?? "Failed to load the timeline"}
                onRetry={() => timelineQ.refetch()}
              />
            ) : (
              <Timeline
                events={timelineEvents}
                heldOnly={filters.heldOnly}
                onClear={clearAll}
                hasActiveFilters={activeCount > 0 || rangePreset !== "all"}
                loadedCount={timelineAll.length}
                total={timelinePages?.[0]?.total ?? 0}
                isLoading={timelineQ.isLoading}
                hasMore={!!hasNextPage}
                isFetchingMore={isFetchingNextPage}
                onLoadMore={loadMore}
              />
            )
          ) : gridQ.isError ? (
            <QueryError
              message={(gridQ.error as Error)?.message ?? "Failed to load this month"}
              onRetry={() => gridQ.refetch()}
            />
          ) : (
            <MonthGrid
              events={gridEvents}
              bounds={bounds}
              month={gridMonth}
              onMonthChange={setGridMonth}
              minMonth={nav.min}
              maxMonth={nav.max}
              isLoading={gridQ.isPending}
              isFetching={gridQ.isFetching}
              loadedCount={gridAll.length}
              hasActiveFilters={activeCount > 0}
            />
          )}
        </div>
      )}
    </div>
  );
}
