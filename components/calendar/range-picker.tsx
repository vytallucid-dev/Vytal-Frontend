"use client";

// The timeline's date-range control (§3) — a dropdown of presets (Today · Tomorrow · This
// week · This month · All) plus the shadcn Calendar in range mode for a custom window.
// Drives the timeline only (the grid has its own month nav). The far end is the last event
// we actually hold (`maxDate`), not a hardcoded +90d: the timeline pages the feed now, so the
// picker must be able to name any date the feed can reach. The calendar inherits the app
// tokens (primary/accent = the brand blues), with a few slots nudged to the calm-ink palette.

import { useState } from "react";
import { addDays, startOfMonth } from "date-fns";
import type { DateRange as RdpDateRange } from "react-day-picker";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { tint } from "@/components/stock-detail/health/shared";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  RANGE_PRESETS,
  presetRange,
  rangeLabel,
  type Bounds,
  type DateRange,
  type RangePresetKey,
} from "./lib";

export function RangePicker({
  preset,
  custom,
  bounds,
  maxDate,
  onChange,
}: {
  preset: RangePresetKey;
  custom: DateRange | null;
  bounds: Bounds;
  /** The furthest-out event we hold. Undefined while the bounds request is in flight — the
   *  picker then falls back to the old +90d reach rather than offering empty months. */
  maxDate?: Date;
  onChange: (preset: RangePresetKey, custom: DateRange | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RdpDateRange | undefined>(
    preset === "custom" && custom ? { from: custom.from, to: custom.to } : undefined,
  );

  const label = rangeLabel(preset, custom);
  const isDefault = preset === "all";
  const fallbackMax = addDays(bounds.today, 90);
  const maxDay = maxDate && maxDate > fallbackMax ? maxDate : fallbackMax;

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    // resync the calendar draft to the committed custom range (or clear it for a preset)
    if (o) setDraft(preset === "custom" && custom ? { from: custom.from, to: custom.to } : undefined);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-surface-2",
            isDefault ? "text-ink2 hover:text-ink" : "text-ink",
          )}
          style={!isDefault ? tint("var(--primary)", 10, 32) : undefined}
        >
          <Icons.calendar weight={isDefault ? "regular" : "fill"} className="size-3.5" />
          {label}
          <Icons.caretDown className="size-3 opacity-60" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto min-w-64">
        <div className="flex flex-col gap-1">
          {RANGE_PRESETS.map((p) => {
            const on = preset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  onChange(p.key, presetRange(p.key, bounds));
                  setDraft(undefined);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  on ? "text-ink" : "text-ink2 hover:bg-surface-2",
                )}
                style={on ? tint("var(--primary)", 12, 30) : undefined}
              >
                {p.label}
                {on && <Icons.check weight="bold" className="size-3.5" />}
              </button>
            );
          })}
        </div>

        <div className="my-2.5 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink3">Custom range</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Calendar
          mode="range"
          selected={draft}
          onSelect={(r) => {
            setDraft(r);
            if (r?.from && r?.to) {
              onChange("custom", { from: r.from, to: r.to });
              setOpen(false);
            }
          }}
          defaultMonth={draft?.from ?? bounds.today}
          startMonth={startOfMonth(bounds.today)}
          endMonth={startOfMonth(maxDay)}
          disabled={{ before: bounds.today, after: maxDay }}
          showOutsideDays={false}
          className="p-0"
          classNames={{
            weekday: "flex-1 select-none text-[10px] font-semibold uppercase text-ink3",
            caption_label: "num select-none text-[12.5px] font-semibold text-ink",
            today: "rounded-md ring-1 ring-primary/50 ring-inset",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
