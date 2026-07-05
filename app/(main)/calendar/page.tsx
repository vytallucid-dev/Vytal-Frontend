import { CalendarHub } from "@/components/calendar";

// The Calendar surface — a prioritized catalyst timeline, not a dumb grid. Read-only over
// GET /api/v1/events/calendar (ranked eventDate ASC, impact tiebreak) joined to the user's
// holdings (useHoldings) for the health lens. KPI strip + spotlight + horizon-grouped,
// held-first timeline, a month-grid alternate, and proper type/impact/sector/held filters.
// Events only — nothing here recomputes a score, and no price/buy/sell/target lives here.
export default function CalendarPage() {
  return <CalendarHub />;
}
