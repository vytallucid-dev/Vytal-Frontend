// ─────────────────────────────────────────────────────────────────────────────
// EVENT REMINDERS — frontend view types over the date-triggered reminder surface.
//
//   POST   /api/v1/me/reminders          { stockId, eventType, daysBefore? } → create/affirm
//   GET    /api/v1/me/reminders                                              → the rules
//   PATCH  /api/v1/me/reminders/:id      { active }                          → pause / resume
//   DELETE /api/v1/me/reminders/:id                                          → remove
//
// The date-triggered SIBLING of alerts (types/alerts.ts): "remind me N days before this
// stock's next <eventType>". READ-ONLY over the contract — the BACKEND resolves the next
// event on the daily cycle, fires in the lead window, and sends the email; the client only
// creates/pauses/deletes the rule and shows its resolved next event.
//
// Mirrors the backend serializer (reminders-controller.ts) verbatim.
// ─────────────────────────────────────────────────────────────────────────────

/** The corporate-event types a reminder may watch (mirrors the backend enum). */
export const REMINDER_EVENT_TYPES = [
  "earnings",
  "dividend",
  "agm",
  "board_meeting",
  "bonus",
  "split",
  "rights",
  "buyback",
  "record_date",
] as const;
export type ReminderEventType = (typeof REMINDER_EVENT_TYPES)[number];

/** One reminder rule (the GET /me/reminders element + the POST/PATCH response `reminder`). */
export interface EventReminder {
  id: string;
  stockId: string;
  symbol: string | null;
  name: string | null;
  eventType: string; // one of REMINDER_EVENT_TYPES (free string at the edge)
  daysBefore: number; // lead time (>= 1)
  active: boolean; // paused ⇔ active=false
  lastFiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** the resolved nearest-upcoming event date (YYYY-MM-DD), or null when none is scheduled. */
  nextEventDate: string | null;
  /** whole days from today to nextEventDate (null when no upcoming event). */
  nextEventDaysAway: number | null;
  /** the concrete date we'd remind on for that occurrence = nextEventDate − daysBefore. */
  remindDate: string | null;
}

export interface CreateReminderInput {
  stockId: string;
  eventType: string;
  daysBefore?: number;
}

export interface RemindersResponse {
  reminders: EventReminder[];
  count: number;
}
