// Types for the per-stock corporate-events feed — GET /api/v1/events/:symbol
// (v1 { success, data } envelope). Mirrors the backend read shape in
// src/controllers/ingestion/events-controllers.ts (getEventsBySymbol).
//
// Every value is real or honest-null. Per-type field discipline: only the fields
// real for a given eventType are populated — a dividend carries dividendAmount /
// dividendType / exDate / recordDate; a split carries splitRatio (or, when NSE
// only gave free-text, just `description`); a board_meeting / agm carries
// `description`. Dates are YYYY-MM-DD; dividendAmount is ₹ per share.

/** The corporate-event eventType enum (NSE-sourced). `record_date` / `rights`
 *  are in the schema enum but rare; we render them via the generic fallback. */
export type EventType =
  | "earnings"
  | "dividend"
  | "agm"
  | "board_meeting"
  | "bonus"
  | "split"
  | "rights"
  | "buyback"
  | "record_date";

export type ImpactLevel = "high" | "medium" | "low";

export interface CorporateEvent {
  id: string;
  eventType: string; // EventType, but kept wide — the UI handles unknowns gracefully
  eventDate: string; // YYYY-MM-DD (the event / board-meeting date)
  exDate: string | null; // YYYY-MM-DD — dividends / bonus / split
  recordDate: string | null; // YYYY-MM-DD
  impactLevel: string; // "high" | "medium" | "low"
  isConfirmed: boolean;
  dividendAmount: number | null; // ₹ per share (null ⇔ not yet announced)
  dividendType: string | null; // "interim" | "final" | "special"
  bonusRatio: string | null; // "1:1"
  splitRatio: string | null; // "2:1" (null when NSE gave only free-text → description)
  description: string | null; // raw NSE text — the honest fallback for every type
}

export interface StockEventsData {
  symbol: string;
  name: string;
  events: CorporateEvent[];
}

export interface StockEventsResponse {
  success: boolean;
  data: StockEventsData;
}
