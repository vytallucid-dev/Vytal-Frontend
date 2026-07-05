"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DAYS_BEFORE_PRESETS,
  leadShort,
  fmtReminderDate,
  computeRemindDate,
  isPastLead,
  todayAsUtcMidnight,
} from "@/lib/reminders";

// ─────────────────────────────────────────────────────────────────────────────
// REMINDER LEAD PICKER — the shared lead-time chooser (1 / 2 / 3 / 7 days before) used by BOTH
// the calendar's set-reminder popover AND the bell-sheet edit popover, so a reminder is set and
// modified identically wherever it lives. Presets that would land before today (for a known
// event date) are disabled. Presentational + controlled — the parent owns `days`, the disabled
// set (via useLeadDisabled), and the mutation.
// ─────────────────────────────────────────────────────────────────────────────

/** Derives which presets are past-lead for a given (nullable) event date. `today` is memoised
 *  once per mount — an event's date doesn't move while a popover is open, so there's nothing to
 *  re-derive on a tick. `allDisabled` is only meaningful once the event's date is known. */
export function useLeadDisabled(eventDate: string | null | undefined) {
  const today = useMemo(() => todayAsUtcMidnight(), []);
  const disabledDays = useMemo(() => {
    const s = new Set<number>();
    for (const d of DAYS_BEFORE_PRESETS) if (isPastLead(eventDate, d, today)) s.add(d);
    return s;
  }, [eventDate, today]);
  const allDisabled = eventDate != null && disabledDays.size === DAYS_BEFORE_PRESETS.length;
  return { today, disabledDays, allDisabled };
}

export function ReminderLeadPicker({
  days,
  onChange,
  eventDate,
  disabledDays,
  allDisabled,
}: {
  days: number;
  onChange: (d: number) => void;
  eventDate: string | null | undefined;
  disabledDays: ReadonlySet<number>;
  allDisabled: boolean;
}) {
  const remindDate = computeRemindDate(eventDate, days);
  return (
    <>
      <p className="mb-1.5 text-[11px] font-medium text-ink2">Remind me</p>
      <div className="grid grid-cols-4 gap-1 rounded-lg border border-line2 bg-surface-2 p-1">
        {DAYS_BEFORE_PRESETS.map((d) => {
          const on = days === d;
          const disabled = disabledDays.has(d);
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onChange(d)}
              title={disabled ? "That lead time would fall before today" : undefined}
              className={cn(
                "rounded-md py-1.5 text-[11.5px] font-medium transition-colors",
                disabled
                  ? "cursor-not-allowed text-ink3/40"
                  : on
                    ? "text-ink shadow-[inset_0_0_0_1px_var(--line3)]"
                    : "text-ink3 hover:text-ink2",
              )}
              style={!disabled && on ? { background: "var(--surface-3)" } : undefined}
            >
              {d}d
            </button>
          );
        })}
      </div>
      {allDisabled ? (
        <p className="mt-1.5 text-[11px] leading-snug text-ink3">
          This event is too close — every lead time would fall before today.
        </p>
      ) : (
        <p className="mt-1.5 text-[11px] leading-snug text-ink3">
          {leadShort(days).replace(/^\w/, (c) => c.toUpperCase())} — never on the day itself.
          {remindDate && (
            <>
              {" "}We’ll remind you on <span className="num text-ink2">{fmtReminderDate(remindDate)}</span>.
            </>
          )}
        </p>
      )}
    </>
  );
}
