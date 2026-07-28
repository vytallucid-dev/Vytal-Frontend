// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ACTIVITY BUFFER — the PURE core of client behaviour tracking. No browser globals, no auth, no network:
// just an in-memory buffer + the flush DECISION logic, so it is unit-testable headlessly. The browser
// wiring (token, listeners, keepalive fetch) lives in activity-tracker.ts and injects the sender here.
//
// LOSSY BY DESIGN. This is statistical context, not an audit log — never retry, never persist to disk,
// never block. A dropped batch is fine.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/** Mirrors the backend CHECK on attention_events.event_type. */
export type AttentionEventType = "view" | "tab" | "section_expand" | "comparison" | "tool";

export interface AttentionEvent {
  stockId: string;
  eventType: AttentionEventType;
  detail?: string;
  dwellMs?: number;
}

/** Hard cap: a user who leaves a tab open for hours must never accumulate an unbounded buffer. On
 *  overflow we drop the OLDEST (the freshest attention is the most useful). Well above a normal
 *  session's event count between flushes. */
export const MAX_BUFFER = 200;

let buffer: AttentionEvent[] = [];

export function bufferSize(): number {
  return buffer.length;
}

/** Add an event. O(1) amortised; drops the oldest on overflow. Never touches the network. */
export function enqueue(e: AttentionEvent): void {
  buffer.push(e);
  if (buffer.length > MAX_BUFFER) buffer.splice(0, buffer.length - MAX_BUFFER);
}

/** Test/reset hook. */
export function clearBuffer(): void {
  buffer = [];
}

/** A fire-and-forget sender — returns void, must not throw (the tracker's keepalive fetch swallows its
 *  own async rejection). Injected so the core stays pure and testable. */
export type SendFn = (events: AttentionEvent[], token: string) => void;

/**
 * Flush the buffer through `send`, SYNCHRONOUSLY (no await gap — critical for the page-unload path).
 *   · empty buffer  → no-op (never send an empty beacon).
 *   · no token      → drop the buffer (only AUTHENTICATED users are tracked; a signed-out buffer is
 *                     discarded rather than accumulated).
 *   · otherwise     → drain and hand the batch to `send`; swallow any synchronous throw.
 * The buffer is drained BEFORE send, so a failed send loses that batch and never re-queues it (lossy).
 */
export function flushBuffer(send: SendFn, token: string | null): void {
  if (buffer.length === 0) return;
  if (!token) {
    buffer = [];
    return;
  }
  const batch = buffer;
  buffer = [];
  try {
    send(batch, token);
  } catch {
    /* silent — lossy by design */
  }
}
