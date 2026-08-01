"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SetReminderButton } from "@/components/reminders/set-reminder-button";
import type { CalendarEvent } from "@/lib/api/hooks/use-events-calendar";

// ─────────────────────────────────────────────────────────────────────────────
// Shared "upcoming event" row + helpers — the single rendering used by BOTH the
// dashboard Events card and the Portfolio Overview "On the horizon" section, so a
// held-name's next event reads identically in both. Read-only over the real market
// calendar (GET /api/v1/events/calendar), client-filtered to the user's holdings.
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EVENT_LABEL: Record<string, string> = {
  earnings: "Earnings",
  dividend: "Dividend",
  agm: "AGM",
  board_meeting: "Board Meeting",
  bonus: "Bonus",
  split: "Split",
  buyback: "Buyback",
  rights: "Rights",
  record_date: "Record Date",
};

export const IMPACT_TINT: Record<string, string> = {
  high: "text-danger bg-danger/10 border-danger/25",
  medium: "text-warning bg-warning/10 border-warning/25",
  low: "text-info bg-info/10 border-info/25",
};

export function fmtEventDate(iso: string): { day: string; mon: string } {
  const [, m, d] = iso.split("-");
  return { day: d ?? "--", mon: MONTHS[Number(m) - 1] ?? "" };
}

export function eventLabel(t: string): string {
  return EVENT_LABEL[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function eventDetail(e: CalendarEvent): string | null {
  if (e.eventType === "dividend") {
    const amt = e.dividendAmount != null ? `₹${e.dividendAmount}/sh` : null;
    const ex = e.exDate ? `ex ${fmtEventDate(e.exDate).mon} ${fmtEventDate(e.exDate).day}` : null;
    return [amt, ex].filter(Boolean).join(" · ") || null;
  }
  if (e.eventType === "bonus" && e.bonusRatio) return `Bonus ${e.bonusRatio}`;
  if (e.eventType === "split" && e.splitRatio) return `Split ${e.splitRatio}`;
  return null;
}

/** Held-scoped, upcoming-first slice of the market calendar. The calendar is already
 *  ordered eventDate asc (impact tiebreak), so we just keep held names and cap the count. */
export function heldUpcomingEvents(
  events: CalendarEvent[] | undefined,
  heldSymbols: Set<string>,
  limit: number,
): CalendarEvent[] {
  return (events ?? []).filter((e) => heldSymbols.has(e.symbol)).slice(0, limit);
}

/** One upcoming-event row — date chip · symbol · type · (ex-date / dividend / ratio) · impact.
 *  `showReminder` appends the set-reminder bell (self-indicating set/unset state), the same
 *  affordance the calendar rows carry — opt-in so the compact dashboard card stays as-is. */
export function UpcomingEventRow({
  e,
  index = 0,
  showReminder = false,
}: {
  e: CalendarEvent;
  index?: number;
  showReminder?: boolean;
}) {
  const d = fmtEventDate(e.eventDate);
  const detail = eventDetail(e);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 rounded-xl border border-line2 bg-surface-2/40 p-2.5"
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-line2 bg-surface-3/50 text-center leading-none">
        <span className="num font-display text-xs font-bold text-ink">{d.day}</span>
        <span className="text-[0.6rem] uppercase text-ink3">{d.mon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {e.symbol} <span className="font-normal text-ink3">· {eventLabel(e.eventType)}</span>
        </p>
        {detail && <p className="truncate text-xs text-ink3">{detail}</p>}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-md border px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase",
          IMPACT_TINT[e.impactLevel] ?? "text-ink3 border-line2",
        )}
      >
        {e.impactLevel}
      </span>
      {showReminder && <SetReminderButton symbol={e.symbol} stockId={e.stockId} eventType={e.eventType} eventDate={e.eventDate} />}
    </motion.div>
  );
}
