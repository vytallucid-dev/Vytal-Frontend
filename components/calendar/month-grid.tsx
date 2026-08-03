"use client";

// The month-grid view — the spatial overview (the timeline is the detail). Restrained
// indicators: TODAY gets a ring, a day with an owned name's event gets a corner star, and
// impact-coloured dots show density — two emphases, not three competing ones. A month/year
// picker (plus the arrows) jumps around the window. Click a day → a right-side sheet with
// that day's events (the same EventRow the timeline uses). Filters flow through as normal.
//
// ── THE GRID READS HISTORY ────────────────────────────────────────────────────────────
// It used to be pinned to [this month, +3 months] because the calendar was fed by ONE
// forward-only 90-day fetch, so a past month could only ever have rendered empty — the nav
// limits were hiding the absence of data, not the data. The grid now fetches the month a
// reader navigates to, and the limits come from the events table's real extent
// (GET /events/calendar/bounds), so it walks back as far as we have ever recorded. The month
// under the cursor is owned by the parent, which owns the query with it.

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { tint } from "@/components/stock-detail/health/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EventRow } from "./event-row";
import { IMPACT_META, fmtFull, sortForTimeline, type Bounds, type CalEvent, type Impact } from "./lib";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

// ── month + year picker (clickable header → popover) ─────────────────────────────────
// TWO PANES, not a year stepper. The events table reaches back to 2005, so stepping one year
// at a time to get there is twenty-odd clicks; the year label opens a scrollable grid of every
// year that can hold something, exactly the way a native date picker does it.
function MonthYearPicker({
  cursor,
  min,
  max,
  onPick,
}: {
  cursor: Date;
  min: Date;
  max: Date;
  onPick: (d: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(cursor.getFullYear());
  const [pane, setPane] = useState<"months" | "years">("months");

  const minY = min.getFullYear();
  const maxY = max.getFullYear();
  const years = useMemo(
    () => Array.from({ length: maxY - minY + 1 }, (_, i) => maxY - i), // newest first
    [minY, maxY],
  );
  const monthOk = (m: number) => {
    const d = startOfMonth(new Date(year, m, 1));
    return d >= startOfMonth(min) && d <= startOfMonth(max);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setYear(cursor.getFullYear());
          setPane("months");
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-display text-[15px] font-semibold text-ink transition-colors hover:bg-surface-2"
        >
          {format(cursor, "MMMM yyyy")}
          <Icons.caretDown className="size-3 text-ink3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-60">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={pane === "years" || year <= minY}
            onClick={() => setYear((y) => y - 1)}
            aria-label="Previous year"
            className="grid size-6 place-items-center rounded-md border border-line2 text-ink3 transition-colors hover:text-ink disabled:opacity-30"
          >
            <Icons.arrowLeft className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => setPane((p) => (p === "months" ? "years" : "months"))}
            aria-label={pane === "months" ? "Choose a year" : "Back to months"}
            className="num inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            {year}
            <Icons.caretDown className={cn("size-2.5 text-ink3 transition-transform", pane === "years" && "rotate-180")} />
          </button>
          <button
            type="button"
            disabled={pane === "years" || year >= maxY}
            onClick={() => setYear((y) => y + 1)}
            aria-label="Next year"
            className="grid size-6 place-items-center rounded-md border border-line2 text-ink3 transition-colors hover:text-ink disabled:opacity-30"
          >
            <Icons.arrowRight className="size-3" />
          </button>
        </div>

        {pane === "years" ? (
          <div className="custom-scrollbar grid max-h-56 grid-cols-3 gap-1 overflow-y-auto pr-0.5">
            {years.map((y) => {
              const on = y === year;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setYear(y);
                    setPane("months");
                  }}
                  className={cn(
                    "num rounded-lg py-1.5 text-[12px] font-medium transition-colors",
                    on ? "text-ink" : "text-ink2 hover:bg-surface-2",
                  )}
                  style={on ? tint("var(--primary)", 14, 32) : undefined}
                >
                  {y}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, m) => {
              const ok = monthOk(m);
              const on = year === cursor.getFullYear() && m === cursor.getMonth();
              return (
                <button
                  key={m}
                  type="button"
                  disabled={!ok}
                  onClick={() => {
                    onPick(startOfMonth(new Date(year, m, 1)));
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-lg py-1.5 text-[12px] font-medium transition-colors",
                    on ? "text-ink" : ok ? "text-ink2 hover:bg-surface-2" : "cursor-default text-ink3/40",
                  )}
                  style={on ? tint("var(--primary)", 14, 32) : undefined}
                >
                  {format(new Date(2000, m, 1), "MMM")}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** The grid's own loading state — a shimmer in the shape of the cells it is about to fill,
 *  so the card keeps its height and nothing below it jumps when the month lands. */
function GridSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-0.5 sm:gap-1" aria-hidden>
      {Array.from({ length: 42 }, (_, i) => (
        <div key={i} className="shimmer h-16 rounded-lg bg-surface-2 sm:h-20" />
      ))}
    </div>
  );
}

export function MonthGrid({
  events,
  bounds,
  month,
  onMonthChange,
  minMonth,
  maxMonth,
  isLoading,
  isFetching,
  loadedCount,
  hasActiveFilters,
}: {
  /** The visible grid's events — already filtered, already enriched, already scoped to the
   *  window this month renders (leading/trailing days included). */
  events: CalEvent[];
  bounds: Bounds;
  /** The month under the cursor. Owned by the parent because it drives the fetch. */
  month: Date;
  onMonthChange: (d: Date) => void;
  /** Navigation limits — the real extent of the events table. */
  minMonth: Date;
  maxMonth: Date;
  /** No data for this month yet (first paint of a cold month). */
  isLoading: boolean;
  /** A month is in flight while a previous one is still on screen. */
  isFetching: boolean;
  /** Events in this month BEFORE filters — separates "quiet month" from "filtered out". */
  loadedCount: number;
  hasActiveFilters: boolean;
}) {
  const [selected, setSelected] = useState<Date | null>(null); // drives the side sheet

  // index filtered events by day
  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      const k = dayKey(e.date);
      const arr = m.get(k);
      if (arr) arr.push(e);
      else m.set(k, [e]);
    }
    return m;
  }, [events]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  const thisMonth = startOfMonth(bounds.today);
  const canPrev = month > minMonth;
  const canNext = month < maxMonth;
  const isCurrentMonth = isSameMonth(month, bounds.today);
  const isHistory = month < thisMonth;

  const selectedEvents = selected ? sortForTimeline(byDay.get(dayKey(selected)) ?? []) : [];

  return (
    <div className="rounded-2xl border border-line bg-surface-1 p-3 sm:p-4">
      {/* month nav — arrows + month/year picker, with a jump back to today once the reader
          has wandered off into history (or far ahead). */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => canPrev && onMonthChange(startOfMonth(addMonths(month, -1)))}
          disabled={!canPrev}
          aria-label="Previous month"
          className="grid size-8 place-items-center rounded-lg border border-line2 text-ink2 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink2"
        >
          <Icons.arrowLeft className="size-4" />
        </button>
        <MonthYearPicker cursor={month} min={minMonth} max={maxMonth} onPick={onMonthChange} />
        <button
          type="button"
          onClick={() => canNext && onMonthChange(startOfMonth(addMonths(month, 1)))}
          disabled={!canNext}
          aria-label="Next month"
          className="grid size-8 place-items-center rounded-lg border border-line2 text-ink2 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink2"
        >
          <Icons.arrowRight className="size-4" />
        </button>

        {!isCurrentMonth && (
          <button
            type="button"
            onClick={() => onMonthChange(thisMonth)}
            className="ml-1 rounded-lg border border-line2 px-2.5 py-1 text-[11.5px] font-medium text-ink2 transition-colors hover:text-ink"
          >
            Today
          </button>
        )}

        {/* the month is loading UNDER the previous one — a quiet spinner, not a blanked grid */}
        {isFetching && !isLoading && (
          <span className="flex items-center gap-1.5 text-[11px] text-ink3" aria-live="polite">
            <Icons.spinner className="size-3.5 animate-spin" />
            <span className="sr-only">Loading month</span>
          </span>
        )}
      </div>

      {/* a past month is a record, not a plan — say so rather than letting the reader wonder
          why nothing is "upcoming" */}
      {isHistory && (
        <div className="mb-3 flex items-center justify-center gap-1.5 rounded-lg border border-line2 bg-surface-2/50 px-3 py-1.5 text-[11.5px] text-ink3">
          <Icons.clock className="size-3.5" />
          Past month — showing events as they were recorded
        </div>
      )}

      {/* weekday header */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink3">
            {w}
          </div>
        ))}
      </div>

      {/* day cells */}
      {isLoading ? (
        <GridSkeleton />
      ) : (
        <div className={cn("grid grid-cols-7 gap-0.5 transition-opacity sm:gap-1", isFetching && "opacity-60")}>
          {days.map((day) => {
            const dEvents = byDay.get(dayKey(day)) ?? [];
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, bounds.today);
            const isSelected = selected != null && isSameDay(day, selected);
            const hasHeld = dEvents.some((e) => e.isHeld);
            const has = dEvents.length > 0;
            const dots = dEvents.slice(0, 3).map((e) => IMPACT_META[e.impact].color);
            const extra = dEvents.length - dots.length;

            return (
              <button
                key={dayKey(day)}
                type="button"
                onClick={() => has && setSelected(day)}
                disabled={!has}
                aria-label={`${format(day, "d MMM yyyy")}${has ? ` — ${dEvents.length} events` : ""}`}
                className={cn(
                  "relative flex h-16 flex-col items-center gap-1 overflow-hidden rounded-lg border p-1 transition-colors sm:h-20 sm:p-1.5",
                  has ? "cursor-pointer hover:border-line3 hover:bg-surface-2/60" : "cursor-default",
                  isSelected
                    ? "border-primary/60 bg-surface-2"
                    : isToday
                      ? "border-primary/40 ring-1 ring-primary/50"
                      : "border-line",
                  !inMonth && "opacity-40",
                )}
              >
                {/* held marker — a small corner star (subtle, single accent) */}
                {hasHeld && (
                  <Icons.star weight="fill" className="absolute right-0.5 top-0.5 size-2.5 text-primary sm:right-1 sm:top-1" aria-hidden />
                )}

                <span
                  className={cn(
                    "num text-[11.5px]",
                    isToday ? "font-semibold text-primary" : "font-medium text-ink2",
                  )}
                >
                  {format(day, "d")}
                </span>

                {has && (
                  <div className="flex max-w-full flex-wrap items-center justify-center gap-0.5">
                    {dots.map((c, i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                    ))}
                    {extra > 0 && <span className="num text-[9px] font-medium leading-none text-ink3">+{extra}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* an honest empty — and it distinguishes a genuinely quiet month from one the filters
          emptied, which look identical on a grid of blank cells */}
      {!isLoading && events.length === 0 && (
        <p className="mt-3 text-center text-[12px] text-ink3">
          {loadedCount > 0 && hasActiveFilters
            ? `None of the ${loadedCount} event${loadedCount === 1 ? "" : "s"} in ${format(month, "MMMM yyyy")} match these filters.`
            : `No events recorded in ${format(month, "MMMM yyyy")}.`}
        </p>
      )}

      {/* legend — the two emphases + impact dots */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line pt-3 text-[10.5px] text-ink3">
        {(["high", "medium", "low"] as Impact[]).map((i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: IMPACT_META[i].color }} />
            {IMPACT_META[i].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="size-3.5 rounded-md ring-1 ring-primary/50" />
          Today
        </span>
        <span className="flex items-center gap-1">
          <Icons.star weight="fill" className="size-2.5 text-primary" />
          Your holding
        </span>
      </div>

      {/* day → right-side sheet */}
      <Sheet open={selected != null} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full gap-0 border-line bg-surface-1 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-line px-4 py-3.5">
            <SheetTitle className="flex items-center gap-2 font-display text-[15px] text-ink">
              <Icons.calendar weight="duotone" className="size-4 text-ink3" />
              {selected ? fmtFull(selected) : "Events"}
            </SheetTitle>
            <p className="text-[11.5px] text-ink3">
              {selectedEvents.length} event{selectedEvents.length === 1 ? "" : "s"}
              {selectedEvents.some((e) => e.isHeld) && " · your holdings included"}
            </p>
          </SheetHeader>
          <div className="custom-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((e) => <EventRow key={e.id} e={e} />)
            ) : (
              <p className="py-8 text-center text-[12.5px] text-ink3">No events on this day.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
