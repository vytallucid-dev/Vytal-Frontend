"use client";

import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { EventReminder } from "@/types/reminders";
import { eventTypeLabel, reminderSummary, REMINDER_TINT, REMINDER_ICON } from "@/lib/reminders";
import { ReminderEditPopover } from "./reminder-edit-popover";

// ─────────────────────────────────────────────────────────────────────────────
// REMINDER MANAGE ROW — one event reminder with its lifecycle controls: EDIT (change the lead
// time via the same picker as the calendar) · PAUSE/RESUME (PATCH active) · DELETE. Shown in the
// bell sheet's Reminders section. The lead-time edit re-affirms the (stock, eventType) pair (the
// only thing a reminder has to change), so it lives self-contained in ReminderEditPopover.
// ─────────────────────────────────────────────────────────────────────────────

const TIcon = REMINDER_ICON;

export function ReminderManageRow({
  reminder,
  busy,
  showSymbol = true,
  className,
  onToggle,
  onDelete,
}: {
  reminder: EventReminder;
  busy: boolean;
  showSymbol?: boolean;
  className?: string;
  onToggle: (r: EventReminder) => void;
  onDelete: (r: EventReminder) => void;
}) {
  return (
    <li className={cn("flex items-center gap-3 py-3", className ?? "px-4")}>
      <span
        className="grid size-7 shrink-0 place-items-center rounded-lg"
        style={{ color: REMINDER_TINT, background: `color-mix(in oklch, ${REMINDER_TINT} 12%, transparent)` }}
      >
        <TIcon weight="duotone" className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {showSymbol && <span className="num text-[12.5px] font-semibold text-ink">{reminder.symbol ?? "—"}</span>}
          <span className="text-[11.5px] text-ink2">{eventTypeLabel(reminder.eventType)}</span>
          <span
            className={cn("rounded-[4px] px-1.5 py-px text-[9px] uppercase tracking-wider", reminder.active ? "text-rec" : "text-ink3")}
            style={
              reminder.active
                ? { background: "color-mix(in oklch, var(--rec) 14%, transparent)" }
                : { background: "var(--surface-3)" }
            }
          >
            {reminder.active ? "On" : "Paused"}
          </span>
        </div>
        <p className="truncate text-[11px] text-ink3">{reminderSummary(reminder)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <ReminderEditPopover reminder={reminder} disabled={busy} />
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggle(reminder)}
          aria-label={reminder.active ? "Pause reminder" : "Resume reminder"}
          className="inline-grid size-7 place-items-center rounded-lg text-ink3 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
        >
          {busy ? (
            <Icons.spinner className="size-3.5 animate-spin" />
          ) : reminder.active ? (
            <Icons.pause weight="fill" className="size-4" />
          ) : (
            <Icons.play weight="fill" className="size-4" />
          )}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(reminder)}
          aria-label="Delete reminder"
          className="inline-grid size-7 place-items-center rounded-lg text-ink3 transition-colors hover:bg-crit/10 hover:text-danger disabled:opacity-50"
        >
          <Icons.close className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
