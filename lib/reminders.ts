// ─────────────────────────────────────────────────────────────────────────────
// EVENT REMINDERS — pure derivations (no JSX, no fetching). Event-type labels, the lead
// phrasing ("reminds 1 day before"), and the small daysBefore preset list. The sibling of
// lib/alerts.ts; reminders get ONE distinct accent (they're a single kind, not three types).
// ─────────────────────────────────────────────────────────────────────────────

import { Icons, type Icon } from "@/lib/icons";
import type { EventReminder } from "@/types/reminders";

// ── event-type identity — labels mirror the calendar's TYPE_META so a reminder reads the
//    same wherever it appears. Unknown types fall back gracefully. ──────────────────────
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const REMINDER_EVENT_LABEL: Record<string, string> = {
  earnings: "Earnings",
  dividend: "Dividend",
  agm: "AGM",
  board_meeting: "Board meeting",
  bonus: "Bonus issue",
  split: "Stock split",
  rights: "Rights issue",
  buyback: "Buyback",
  record_date: "Record date",
};
export function eventTypeLabel(t: string): string {
  return REMINDER_EVENT_LABEL[t] ?? cap(t.replace(/_/g, " "));
}

// ── reminders speak one colour + glyph (distinct from the three alert types) ──────────
export const REMINDER_TINT = "var(--p-own)";
export const REMINDER_ICON: Icon = Icons.bell;

// ── lead-time presets for the picker (default 1 — never on the event day) ─────────────
export const DAYS_BEFORE_PRESETS = [1, 2, 3, 7] as const;
export const DEFAULT_DAYS_BEFORE = 1;

/** "reminds 1 day before" / "reminds 3 days before". */
export function leadLabel(daysBefore: number): string {
  return `reminds ${daysBefore} day${daysBefore === 1 ? "" : "s"} before`;
}

/** "1 day before" / "3 days before" (bare, for chips). */
export function leadShort(daysBefore: number): string {
  return `${daysBefore} day${daysBefore === 1 ? "" : "s"} before`;
}

// ── date formatting for the resolved next event ("5 Aug", "Mon, 5 Aug 2026") ──────────
export function fmtReminderDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short" });
}

/** The management-row line: "Earnings · reminds 1 day before" plus the resolved next date
 *  when we have one ("· 5 Aug"), or an honest "no upcoming date" when none is scheduled. */
export function reminderSummary(r: EventReminder): string {
  const base = `${eventTypeLabel(r.eventType)} · ${leadLabel(r.daysBefore)}`;
  if (r.nextEventDate) return `${base} · next ${fmtReminderDate(r.nextEventDate)}`;
  return `${base} · no date scheduled yet`;
}

// ── lead-time validity — a lead is invalid when eventDate − daysBefore is already past. Shared
//    by every surface that picks a lead time (the calendar button + the bell-sheet edit) so the
//    disabling rule is identical wherever a reminder is set or modified. ─────────────────────

/** remindDate = eventDate − daysBefore (YYYY-MM-DD), for the picker's "we'll remind you on …"
 *  line. Null when the event's own date isn't known (or is unparseable). */
export function computeRemindDate(eventDate: string | null | undefined, days: number): string | null {
  if (!eventDate) return null;
  const d = new Date(`${eventDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** "today" as a UTC-midnight timestamp built from the user's LOCAL wall-clock day — directly
 *  comparable to computeRemindDate's UTC-midnight arithmetic (both represent plain calendar
 *  dates, not moments in time). */
export function todayAsUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** A lead time is invalid when it would remind on a date that's already past. Unknowable (and
 *  never disabled) when the event's own date isn't known yet. */
export function isPastLead(eventDate: string | null | undefined, days: number, today: Date): boolean {
  const remind = computeRemindDate(eventDate, days);
  if (!remind) return false;
  return new Date(`${remind}T00:00:00Z`).getTime() < today.getTime();
}

/** The first preset that isn't disabled, or null when all of them are. */
export function firstValidPreset(disabled: ReadonlySet<number>): number | null {
  for (const d of DAYS_BEFORE_PRESETS) if (!disabled.has(d)) return d;
  return null;
}
