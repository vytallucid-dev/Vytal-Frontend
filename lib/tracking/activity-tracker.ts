"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ACTIVITY TRACKER — the browser wiring around the pure activity-buffer.
//
// ── TRANSPORT: fetch(..., { keepalive: true }), NOT navigator.sendBeacon ──────────────────────────
// The app authenticates with a Supabase BEARER TOKEN in the Authorization header (see lib/api/client).
// `sendBeacon` cannot set request headers — it only carries a body + cookies — so it CANNOT
// authenticate a bearer-token API. `fetch` with `keepalive: true` is the beacon's equivalent that DOES
// send custom headers AND survives page unload/navigation, so it keeps ONE auth path (the same bearer
// token every other request uses). Batches are tiny (≤200 small events), far under the 64 KB keepalive
// body budget.
//
// ── FIRE-AND-FORGET + LOSSY ───────────────────────────────────────────────────────────────────────
// The send never awaits and swallows its own rejection. A flaky connection silently drops a batch —
// acceptable, this is statistical context. We flush on a ~25s timer AND on visibilitychange(hidden) /
// pagehide (the mobile-safe unload signals; see the report). The token is CACHED (seeded once, kept
// fresh via onAuthStateChange) so the unload flush reads it synchronously — no await gap before fetch.
//
// Only AUTHENTICATED users are tracked: with no cached token the buffer is simply dropped at flush.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
import { supabase } from "@/lib/supabase/client";
import {
  enqueue,
  flushBuffer,
  type AttentionEvent,
  type AttentionEventType,
} from "./activity-buffer";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const FLUSH_INTERVAL_MS = 25_000;

let token: string | null = null;
let started = false;
let currentStockId: string | null = null;

/** The injected sender: a keepalive POST carrying the bearer token. Fire-and-forget; its rejection is
 *  swallowed so a failed flush is silent. */
function send(events: AttentionEvent[], tok: string): void {
  void fetch(`${BASE_URL}/api/v1/me/activity`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
    body: JSON.stringify(events),
  }).catch(() => {
    /* lossy by design — never retry, never surface */
  });
}

function flush(): void {
  flushBuffer(send, token);
}

/** Idempotent lazy init on first tracked event: seed + subscribe the token, start the timer, and attach
 *  the two unload signals. All browser-guarded so an accidental SSR import is a no-op. */
function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  void supabase.auth.getSession().then(({ data }) => {
    token = data.session?.access_token ?? null;
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    token = session?.access_token ?? null;
  });

  setInterval(flush, FLUSH_INTERVAL_MS);
  // visibilitychange(hidden) is the reliable "user is leaving" signal on desktop AND mobile (where a
  // real unload/beforeunload often never fires); pagehide covers bfcache + the classic unload. Both
  // flush — a double flush is harmless (the second sees an empty buffer and no-ops).
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
}

function push(e: AttentionEvent): void {
  start();
  enqueue(e);
}

/** No sub-second granularity: round dwell to whole seconds and floor at 0. The server clamps the upper
 *  bound. undefined stays undefined (no dwell for this event). */
function coarseDwell(ms: number | undefined): number | undefined {
  if (ms == null || !Number.isFinite(ms)) return undefined;
  return Math.max(0, Math.round(ms / 1000) * 1000);
}

// ── Public API ───────────────────────────────────────────────────────────────────────────────────
/** The current stock in view — set by the stock page so deep section-expand emitters need no prop
 *  threading. Cleared on leave. */
export function setCurrentStock(stockId: string | null): void {
  currentStockId = stockId;
}

/** The user landed on this stock. */
export function trackStockView(stockId: string): void {
  push({ stockId, eventType: "view" });
}

/** A tab was viewed for `dwellMs` (coarse). Fired when the tab is LEFT, from the tab-switch choke-point. */
export function trackStockTab(stockId: string, tab: string, dwellMs?: number): void {
  push({ stockId, eventType: "tab", detail: tab, dwellMs: coarseDwell(dwellMs) });
}

/** A disclosure/section was expanded. Uses the passed stockId or falls back to the current stock. */
export function trackSectionExpand(section: string, stockId?: string | null): void {
  const sid = stockId ?? currentStockId;
  if (sid) push({ stockId: sid, eventType: "section_expand", detail: section });
}

/** Generic escape hatch for comparison/tool seams (unused in Phase 2 — see the report). */
export function trackAttention(stockId: string, eventType: AttentionEventType, detail?: string): void {
  push({ stockId, eventType, detail });
}
