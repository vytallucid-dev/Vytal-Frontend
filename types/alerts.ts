// ─────────────────────────────────────────────────────────────────────────────
// ALERTS — frontend view types over the user-created alerts surface.
//
//   POST   /api/v1/me/alerts             { stockId, type, operator, … } → create
//   GET    /api/v1/me/alerts             [?includeEvents=true]          → the rules
//   PATCH  /api/v1/me/alerts/:id         { active? | threshold? | … }   → edit
//   DELETE /api/v1/me/alerts/:id                                        → remove
//   GET    /api/v1/me/alerts/events      [?limit=&alertId=]             → the fired log
//
// READ-ONLY over the contract: the BACKEND evaluates conditions on the daily EOD cycle
// and RECORDS fires into the log — the client only creates rules and displays what fired.
// Nothing here sends anything (email is a separate backend track); the in-app feed shows
// every fired event regardless of a (backend-only) `delivered` flag.
//
// Mirrors the backend serializers (alerts-controller.ts) verbatim; Decimals arrive as JS
// numbers at the API edge, null where honestly unavailable.
// ─────────────────────────────────────────────────────────────────────────────

import type { LabelBand } from "@/types/health";

export type AlertType = "price" | "health_band" | "finding";
export type AlertOperator = "above" | "below" | "fires";
export type AlertRepeatMode = "one_shot" | "repeating";

/** One alert rule (the GET /me/alerts element + the POST/PATCH response `alert`). */
export interface Alert {
  id: string;
  stockId: string;
  symbol: string | null;
  name: string | null;
  type: AlertType;
  operator: AlertOperator;
  // exactly ONE of these is non-null, matching `type` (DB-enforced server-side)
  thresholdPrice: number | null;
  thresholdBand: LabelBand | null;
  findingKey: string | null; // null on a finding alert ⇒ "any new finding"
  repeatMode: AlertRepeatMode;
  active: boolean; // one_shot self-deactivates after firing; repeating stays active
  armed: boolean; // the re-arm flag (fires on a fresh crossing, not daily while true)
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** present only on GET /me/alerts?includeEvents=true */
  recentEvents?: AlertEvent[];
}

/** One fired event — a DISCRETE crossing the backend recorded (not a daily status). */
export interface AlertEvent {
  id: string;
  alertId: string;
  stockId: string;
  symbol: string | null;
  firedAt: string;
  snapshot: string; // the value that triggered it (price / band / finding key), rendered
  delivered: boolean; // backend email track only — the in-app feed ignores this
}

export interface CreateAlertInput {
  stockId: string;
  type: AlertType;
  operator: AlertOperator;
  /** price → number; health_band → a LabelBand string. Omitted for finding. */
  threshold?: number | string;
  /** finding → a specific finding key, or null/omitted ⇒ "any new finding". */
  findingKey?: string | null;
  repeatMode?: AlertRepeatMode;
}

export interface UpdateAlertInput {
  active?: boolean;
  repeatMode?: AlertRepeatMode;
  threshold?: number | string;
  findingKey?: string | null;
}

export interface AlertsResponse {
  alerts: Alert[];
  count: number;
}
export interface AlertEventsResponse {
  events: AlertEvent[];
  count: number;
}
