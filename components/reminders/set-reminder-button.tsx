"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SET-REMINDER BUTTON — the calendar affordance to set an event reminder for a
// (stock, eventType). Click → a popover to pick the lead time (default 1 day before) and
// confirm. Symbol-driven: it resolves the stockId from the universe list (like the alert
// modal), so callers pass only a symbol + eventType. If a reminder already exists for the
// pair it shows the "set" state with a remove control (the reminder binds semantically by
// (stock, eventType), so there is only ever one). READ-ONLY over the contract — POST/PATCH/
// DELETE a rule; the backend resolves the next event, fires, and sends.
//
// Rendered as an OVERLAY sibling of the calendar row's <Link> (not a child), so a click
// never triggers navigation. Honest for any stock — reminders are date-based, no score needed.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import { useReminders, useReminderMutations } from "@/lib/api/hooks/use-reminders";
import {
  eventTypeLabel,
  leadShort,
  fmtReminderDate,
  firstValidPreset,
  DEFAULT_DAYS_BEFORE,
  REMINDER_TINT,
} from "@/lib/reminders";
import { ReminderLeadPicker, useLeadDisabled } from "./reminder-lead-picker";

function parseErr(e: unknown): string {
  const ae = (e as { apiError?: { message?: string; status?: number } })?.apiError;
  if (ae?.status === 401) return "Sign in to set reminders.";
  if (ae?.message) return ae.message;
  return "Couldn’t save the reminder. Please try again.";
}

export function SetReminderButton({
  symbol,
  eventType,
  eventDate,
  className,
}: {
  symbol: string;
  eventType: string;
  /** the event's own date (YYYY-MM-DD) — lets the popover show the resolved remind date. */
  eventDate?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<number>(DEFAULT_DAYS_BEFORE);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<"set" | "removed" | null>(null);

  const { data: universe } = useUniverseStocks();
  const stockId = useMemo(
    () => universe?.find((s) => s.symbol === symbol)?.id ?? null,
    [universe, symbol],
  );

  // Enabled always (not just when open) so the "already set" state shows on load. React-query
  // dedupes by key → all rows on the calendar share ONE /me/reminders fetch.
  const { data: reminders } = useReminders();
  const existing = useMemo(
    () => reminders?.find((r) => r.stockId === stockId && r.eventType === eventType) ?? null,
    [reminders, stockId, eventType],
  );

  const { create, remove } = useReminderMutations();
  const busy = create.isPending || remove.isPending;

  // A preset is invalid when eventDate − preset falls before today (it would remind for a date
  // that's already gone). Shared with the bell-sheet edit popover via useLeadDisabled so the
  // disabling rule stays identical across both surfaces.
  const { disabledDays, allDisabled } = useLeadDisabled(eventDate);

  // Sync the picker to the existing reminder each time the popover opens — falling back to
  // the nearest valid preset when the synced value would itself be a past lead time (e.g. an
  // existing reminder's daysBefore no longer fits as the event has drawn closer).
  useEffect(() => {
    if (open) {
      setErr(null);
      setFlash(null);
      const initial = existing?.daysBefore ?? DEFAULT_DAYS_BEFORE;
      setDays(disabledDays.has(initial) ? firstValidPreset(disabledDays) ?? initial : initial);
    }
  }, [open, existing?.daysBefore, disabledDays]);

  const label = eventTypeLabel(eventType);
  const isSet = !!existing;

  const submit = () => {
    if (!stockId) {
      setErr("This stock isn’t in the tracked universe.");
      return;
    }
    if (allDisabled || disabledDays.has(days)) {
      setErr("Pick a lead time that isn’t already in the past.");
      return;
    }
    setErr(null);
    create.mutate(
      { stockId, eventType, daysBefore: days },
      {
        onSuccess: () => {
          setFlash("set");
          setTimeout(() => setOpen(false), 900);
        },
        onError: (e) => setErr(parseErr(e)),
      },
    );
  };

  const onRemove = () => {
    if (!existing) return;
    setErr(null);
    remove.mutate(existing.id, {
      onSuccess: () => {
        setFlash("removed");
        setTimeout(() => setOpen(false), 700);
      },
      onError: (e) => setErr(parseErr(e)),
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={isSet ? `Reminder set for ${symbol} ${label}` : `Set a reminder for ${symbol} ${label}`}
          title={isSet ? "Reminder set" : "Set a reminder"}
          className={cn(
            "inline-grid size-7 shrink-0 place-items-center rounded-lg border transition hover:brightness-110",
            // The presence of the teal accent IS the on/off signal. UNSET = neutral chrome
            // (visible, but no colour); SET = a filled teal chip. Impossible to confuse.
            !isSet && "border-line2 bg-surface-2 text-ink2 hover:border-line3 hover:text-ink",
            className,
          )}
          style={
            isSet
              ? {
                  color: REMINDER_TINT,
                  background: `color-mix(in oklch, ${REMINDER_TINT} 20%, transparent)`,
                  borderColor: `color-mix(in oklch, ${REMINDER_TINT} 45%, transparent)`,
                }
              : undefined
          }
        >
          <Icons.bell weight={isSet ? "fill" : "regular"} className="size-3.5" />
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
                <span className="num">{symbol}</span> · {label}
              </p>
              <p className="text-[11px] text-ink3">
                {eventDate ? `Event on ${fmtReminderDate(eventDate)}` : "Reminds before the next one"}
              </p>
            </div>
          </div>
        </div>

        {flash ? (
          <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
            <span className="grid size-8 place-items-center rounded-full" style={{ color: "var(--rec)", background: "color-mix(in oklch, var(--rec) 12%, transparent)" }}>
              <Icons.check weight="bold" className="size-4" />
            </span>
            <p className="text-[12.5px] font-medium text-ink">
              {flash === "set" ? "Reminder set" : "Reminder removed"}
            </p>
            {flash === "set" && (
              <p className="text-[11px] text-ink3">We’ll email you {leadShort(days)}.</p>
            )}
          </div>
        ) : (
          <div className="px-3.5 py-3">
            <ReminderLeadPicker
              days={days}
              onChange={setDays}
              eventDate={eventDate}
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
              {isSet && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onRemove}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-line2 px-3 text-[12px] font-medium text-ink2 transition-colors hover:border-crit/40 hover:text-danger disabled:opacity-50"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                disabled={busy || allDisabled}
                onClick={submit}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-medium text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-60"
                style={{ background: REMINDER_TINT }}
              >
                {busy && <Icons.spinner className="size-3.5 animate-spin" />}
                {isSet ? "Update" : "Set reminder"}
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
