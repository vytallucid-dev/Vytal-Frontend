"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR — the catalyst timeline. A prioritized, held-first view of upcoming
// corporate events (GET /api/v1/events/calendar), joined to the user's holdings
// (useHoldings) for the health lens. Events only — no price / buy / sell / target.
//
//   • KPI + Spotlight — one compact row: the "do I need to pay attention" read + the
//     single most important upcoming event (rounded health score, held-first).
//   • Controls        — Filters (popover: type · impact · sector · held-vs-all) + a
//     date-range picker driving the timeline window.
//   • Timeline        — agenda by horizon, held-first (default view).
//   • Month grid      — the spatial alternate (month/year picker, click a day → sheet).
//
// The held lens degrades gracefully: no session / no holdings → KPIs honest-zero, the
// spotlight falls back to the nearest market high-impact, the timeline still shows the
// full market. Holdings never block the calendar from rendering.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { useEventsCalendar } from "@/lib/api/hooks/use-events-calendar";
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
  eventsInRange,
  presetRange,
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
  const eventsQ = useEventsCalendar(90);
  const holdingsQ = useHoldings(); // held lens — never blocks the calendar

  const [view, setView] = useState<View>("timeline");
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_FILTERS);
  const [rangePreset, setRangePreset] = useState<RangePresetKey>("all");
  const [customRange, setCustomRange] = useState<DateRange | null>(null);

  const bounds = useMemo(() => computeBounds(), []);
  const holdings = holdingsQ.data?.holdings ?? [];
  const hasHoldings = holdings.length > 0;

  // enrich once (event + held join + timing); everything downstream reads this.
  const all = useMemo(() => {
    const held = buildHeldIndex(holdings);
    return enrichEvents(eventsQ.data ?? [], held, bounds);
  }, [eventsQ.data, holdings, bounds]);

  const kpis = useMemo(() => computeKpis(all, bounds), [all, bounds]);
  const spotlight = useMemo(() => selectSpotlight(all), [all]);
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);

  // the timeline's date window (grid has its own month nav, so it uses `filtered` as-is).
  const range = useMemo(
    () => (rangePreset === "custom" ? customRange : presetRange(rangePreset, bounds)),
    [rangePreset, customRange, bounds],
  );
  const timelineEvents = useMemo(() => eventsInRange(filtered, range), [filtered, range]);

  const typeGroups = useMemo(() => typeGroupOptions(all), [all]);
  const sectors = useMemo(() => sectorOptions(all), [all]);
  const activeCount = activeFilterCount(filters);

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

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      {/* header */}
      <div className="pt-1">
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Catalyst calendar</h1>
            <p className="mt-1 text-[12.5px] text-ink2">
              {eventsQ.data
                ? `${all.length} upcoming event${all.length === 1 ? "" : "s"} · next 90 days — your holdings first`
                : "Loading upcoming events…"}
            </p>
          </div>
          {eventsQ.data && (
            <div className="flex flex-wrap items-center gap-2">
              {all.length > 0 && (
                <>
                  <CalendarFiltersBar
                    filters={filters}
                    onChange={setFilters}
                    onClear={clearFilters}
                    typeGroups={typeGroups}
                    sectors={sectors}
                    hasHoldings={hasHoldings}
                  />
                  {view === "timeline" && (
                    <RangePicker preset={rangePreset} custom={customRange} bounds={bounds} onChange={onRangeChange} />
                  )}
                </>
              )}
              <ViewToggle view={view} onChange={setView} />
            </div>
          )}
        </div>
      </div>

      {/* body */}
      {eventsQ.isLoading ? (
        <QuerySkeleton rows={6} rowHeight="h-16" className="mt-6" />
      ) : eventsQ.isError ? (
        <QueryError
          message={(eventsQ.error as Error)?.message ?? "Failed to load the events calendar"}
          onRetry={() => eventsQ.refetch()}
          className="mt-6"
        />
      ) : all.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line2 px-8 py-20 text-center">
          <Icons.calendar weight="duotone" className="mx-auto mb-4 size-8 text-ink3 opacity-60" />
          <h3 className="font-display text-[20px] font-semibold text-ink2">Nothing on the calendar</h3>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink3">
            No corporate events are scheduled across the universe in the next 90 days. Earnings, dividends
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
            <Timeline
              events={timelineEvents}
              heldOnly={filters.heldOnly}
              onClear={clearAll}
              hasActiveFilters={activeCount > 0 || rangePreset !== "all"}
            />
          ) : (
            <MonthGrid events={filtered} bounds={bounds} />
          )}
        </div>
      )}
    </div>
  );
}
