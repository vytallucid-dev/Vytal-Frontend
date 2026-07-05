"use client";

import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Icons } from "@/lib/icons";
import { useReminderMutations } from "@/lib/api/hooks/use-reminders";
import type { EventReminder } from "@/types/reminders";
import { eventTypeLabel, firstValidPreset, leadShort, REMINDER_TINT } from "@/lib/reminders";
import { ReminderLeadPicker, useLeadDisabled } from "./reminder-lead-picker";

// ─────────────────────────────────────────────────────────────────────────────
// REMINDER EDIT POPOVER — the bell-sheet affordance to CHANGE an existing reminder's lead time,
// mirroring the calendar's set-reminder popover so a reminder is modified identically wherever it
// lives. daysBefore is only changeable through the upsert POST (PATCH is pause/resume only), so
// this re-affirms the (stock, eventType) pair with the new lead. Self-contained like the calendar
// button: owns the picker, the create mutation, and the success flash. Unlike the calendar button
// it already holds the reminder (stockId, eventType, resolved nextEventDate) — no universe lookup.
// ─────────────────────────────────────────────────────────────────────────────

function parseErr(e: unknown): string {
  const ae = (e as { apiError?: { message?: string; status?: number } })?.apiError;
  if (ae?.status === 401) return "Sign in to edit reminders.";
  if (ae?.message) return ae.message;
  return "Couldn’t save the reminder. Please try again.";
}

export function ReminderEditPopover({
  reminder,
  disabled,
}: {
  reminder: EventReminder;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<number>(reminder.daysBefore);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  // The reminder's resolved next occurrence drives which lead times are still in the future.
  const { disabledDays, allDisabled } = useLeadDisabled(reminder.nextEventDate);
  const { create } = useReminderMutations();
  const busy = create.isPending;

  // Sync the picker to the reminder's current lead each time the popover opens — falling back to
  // the nearest valid preset when the stored lead is now a past lead (the event has drawn closer).
  useEffect(() => {
    if (open) {
      setErr(null);
      setFlash(false);
      const initial = reminder.daysBefore;
      setDays(disabledDays.has(initial) ? firstValidPreset(disabledDays) ?? initial : initial);
    }
  }, [open, reminder.daysBefore, disabledDays]);

  const label = eventTypeLabel(reminder.eventType);

  const submit = () => {
    if (allDisabled || disabledDays.has(days)) {
      setErr("Pick a lead time that isn’t already in the past.");
      return;
    }
    setErr(null);
    create.mutate(
      { stockId: reminder.stockId, eventType: reminder.eventType, daysBefore: days },
      {
        onSuccess: () => {
          setFlash(true);
          setTimeout(() => setOpen(false), 850);
        },
        onError: (e) => setErr(parseErr(e)),
      },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Edit reminder lead time"
          className="inline-grid size-7 place-items-center rounded-lg text-ink3 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
        >
          <Icons.edit className="size-4" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-line px-3.5 py-3">
          <div className="flex items-center gap-2">
            <span
              className="grid size-6 shrink-0 place-items-center rounded-md"
              style={{ color: REMINDER_TINT, background: `color-mix(in oklch, ${REMINDER_TINT} 12%, transparent)` }}
            >
              <Icons.bell weight="duotone" className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-ink">
                <span className="num">{reminder.symbol ?? "—"}</span> · {label}
              </p>
              <p className="text-[11px] text-ink3">Change when we remind you</p>
            </div>
          </div>
        </div>

        {flash ? (
          <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
            <span className="grid size-8 place-items-center rounded-full" style={{ color: "var(--rec)", background: "color-mix(in oklch, var(--rec) 12%, transparent)" }}>
              <Icons.check weight="bold" className="size-4" />
            </span>
            <p className="text-[12.5px] font-medium text-ink">Reminder updated</p>
            <p className="text-[11px] text-ink3">We’ll email you {leadShort(days)}.</p>
          </div>
        ) : (
          <div className="px-3.5 py-3">
            <ReminderLeadPicker
              days={days}
              onChange={setDays}
              eventDate={reminder.nextEventDate}
              disabledDays={disabledDays}
              allDisabled={allDisabled}
            />

            {err && (
              <div
                className="mt-2.5 flex items-start gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px]"
                style={{ color: "var(--crit)", borderColor: "var(--crit-bd)", background: "var(--crit-bg)" }}
              >
                <Icons.warning weight="fill" className="mt-0.5 size-3.5 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-line2 px-3 text-[12px] font-medium text-ink2 transition-colors hover:border-line3 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || allDisabled}
                onClick={submit}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-medium text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-60"
                style={{ background: REMINDER_TINT }}
              >
                {busy && <Icons.spinner className="size-3.5 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
