"use client";

// The month-grid view — the spatial overview (the timeline is the detail). Restrained
// indicators: TODAY gets a ring, a day with an owned name's event gets a corner star, and
// impact-coloured dots show density — two emphases, not three competing ones. A month/year
// picker (plus the arrows) jumps around the window. Click a day → a right-side sheet with
// that day's events (the same EventRow the timeline uses). Filters flow through as normal.

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

  const minY = min.getFullYear();
  const maxY = max.getFullYear();
  const monthOk = (m: number) => {
    const d = startOfMonth(new Date(year, m, 1));
    return d >= startOfMonth(min) && d <= startOfMonth(max);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setYear(cursor.getFullYear());
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
            disabled={year <= minY}
            onClick={() => setYear((y) => y - 1)}
            aria-label="Previous year"
            className="grid size-6 place-items-center rounded-md border border-line2 text-ink3 transition-colors hover:text-ink disabled:opacity-30"
          >
            <Icons.arrowLeft className="size-3" />
          </button>
          <span className="num text-[13px] font-semibold text-ink">{year}</span>
          <button
            type="button"
            disabled={year >= maxY}
            onClick={() => setYear((y) => y + 1)}
            aria-label="Next year"
            className="grid size-6 place-items-center rounded-md border border-line2 text-ink3 transition-colors hover:text-ink disabled:opacity-30"
          >
            <Icons.arrowRight className="size-3" />
          </button>
        </div>
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
      </PopoverContent>
    </Popover>
  );
}

export function MonthGrid({ events, bounds }: { events: CalEvent[]; bounds: Bounds }) {
  const [cursor, setCursor] = useState(() => startOfMonth(bounds.today));
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
        start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
      }),
    [cursor],
  );

  // nav bounds — no past months (feed is forward-only), out to the ~90-day window end.
  const minMonth = startOfMonth(bounds.today);
  const maxMonth = startOfMonth(addMonths(bounds.today, 3));
  const canPrev = cursor > minMonth;
  const canNext = cursor < maxMonth;

  const selectedEvents = selected ? sortForTimeline(byDay.get(dayKey(selected)) ?? []) : [];

  return (
    <div className="rounded-2xl border border-line bg-surface-1 p-3 sm:p-4">
      {/* month nav — arrows + month/year picker */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => canPrev && setCursor((c) => startOfMonth(addMonths(c, -1)))}
          disabled={!canPrev}
          aria-label="Previous month"
          className="grid size-8 place-items-center rounded-lg border border-line2 text-ink2 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink2"
        >
          <Icons.arrowLeft className="size-4" />
        </button>
        <MonthYearPicker cursor={cursor} min={minMonth} max={maxMonth} onPick={setCursor} />
        <button
          type="button"
          onClick={() => canNext && setCursor((c) => startOfMonth(addMonths(c, 1)))}
          disabled={!canNext}
          aria-label="Next month"
          className="grid size-8 place-items-center rounded-lg border border-line2 text-ink2 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink2"
        >
          <Icons.arrowRight className="size-4" />
        </button>
      </div>

      {/* weekday header */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink3">
            {w}
          </div>
        ))}
      </div>

      {/* day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dEvents = byDay.get(dayKey(day)) ?? [];
          const inMonth = isSameMonth(day, cursor);
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
              aria-label={`${format(day, "d MMM")}${has ? ` — ${dEvents.length} events` : ""}`}
              className={cn(
                "relative flex h-16 flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors sm:h-20",
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
                <Icons.star weight="fill" className="absolute right-1 top-1 size-2.5 text-primary" aria-hidden />
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
                <div className="flex items-center gap-0.5">
                  {dots.map((c, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                  ))}
                  {extra > 0 && <span className="num text-[9px] font-medium text-ink3">+{extra}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

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
