// ─────────────────────────────────────────────────────────────────────────────
// CHAT — frontend view types over the discuss/chat conversation engine.
//
//   POST /api/v1/me/chat/sessions              DiscussContext → open | resume
//   POST /api/v1/me/chat/sessions/:id/messages { message }    → send + reply
//
// Mirrors the backend serializers VERBATIM (chat/sessions.ts serializeSession /
// serializeVisibleMessages, chat-controller.ts unavailablePayload). The client
// renders exactly what the server sent — it never composes an opening, decides a
// title, or infers a guardrail state.
//
// ★ THE OPENING SCAFFOLDING IS ALREADY GONE. serializeVisibleMessages drops the
//   grounded opening USER message (isOpening + role=user) server-side, so the
//   transcript we receive starts at the assistant's opening. `isOpening` survives
//   only on the assistant's opening message (informational).
//
// ★ guardrailBlocked IS OBSERVABILITY, NOT A UI SIGNAL. When a reply is blocked the
//   server has ALREADY substituted the fixed in-voice redirect as normal assistant
//   text; we render it identically. Same rule the old cards used for `generatedBy`.
// ─────────────────────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

/** Per-message token accounting — present on assistant messages, observability only. */
export interface ChatMessageUsage {
  promptTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  modelVersion: string | null;
}

/** A visible transcript row (serializeMessage). The grounded opening user message is
 *  already excluded upstream — every row here is meant to be shown. */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  isOpening: boolean;
  /** Observability only — NEVER surfaced to the reader (see header). */
  guardrailBlocked: boolean;
  regenerated: boolean;
  /** ★ THE READER'S MESSAGE THAT NEVER WENT ANYWHERE. True on a user row the spend gate refused. Rendered
   *  as "not sent" + a retry — never as a delivered turn. The server EXCLUDES these from the model's
   *  history, so a denial is invisible to Vytal and visible to the reader, which is the correct way round. */
  undelivered: boolean;
  /** Why it wasn't sent, re-composed by the server AGAINST THE CLOCK on every read: the stored form is a
   *  scope + a reset instant, never a sentence, so a denial read tomorrow says "…when you sent this"
   *  with `resetAt` null instead of promising a reset that already happened. Null unless undelivered. */
  denial: ChatUnavailable | null;
  usage: ChatMessageUsage | null;
  createdAt: string;
}

/** A conversation (serializeSession). The header shows the subject, not the title. */
export interface ChatSession {
  id: string;
  origin: string;
  surface: string | null;
  subjectKind: string | null;
  subjectSymbol: string | null;
  subjectName: string | null;
  title: string;
  titleSource: string;
  promoted: boolean;
  asOfSnapshot: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

/** The honest in-band unavailable state (unavailablePayload). The reader's MESSAGE is persisted (marked
 *  undelivered) but nothing was generated and nothing was spent; they may retry later. `message` is the
 *  server-authored, in-voice line to render as-is — and it is tense-correct: a live denial states the
 *  reset in words ("It resets tomorrow."), a remembered one whose window has passed says it never went
 *  through, with `resetAt` null. Never compose this line client-side. */
export interface ChatUnavailable {
  reason: string;
  scopeDenied: "user" | "global" | null;
  message: string;
  /** ISO instant the denying cap resets (next Pacific-midnight). Render in the reader's local time
   *  (Asia/Kolkata); null/absent when the server couldn't determine it — fall back to `message` alone. */
  resetAt?: string | null;
}

/** ★ THE COMPOSER'S LOCK, AS SERVER STATE (chat/unavailable.ts ChatQuotaState).
 *
 *  Read from `ai_usage_counters` by the READ-ONLY peek — never by consuming a call — so "can this reader
 *  send?" survives a refresh instead of being a memory of a request that failed. It rides on every
 *  conversation fetch (first paint is already correct) AND on GET /chat/quota, which is what a composer
 *  that has been open for hours re-checks when the `resetAt` it was locked with finally passes.
 *
 *  ⚠ A read that fails DEGRADES TO canSend:true. The server would rather serve one send that comes back
 *  honestly denied than lock out a reader because a query hiccuped. Never infer a lock from its absence. */
export interface ChatQuota {
  canSend: boolean;
  /** Which ceiling binds — "user" (their own allowance) vs "global" (everyone's). Null when able. */
  scopeDenied: "user" | "global" | null;
  resetAt: string | null;
  /** The reader-facing state, present iff !canSend — the SAME shape a denied send returns, so both are
   *  applied through one path and can never render differently. */
  unavailable: ChatUnavailable | null;
}

/** POST /chat/sessions — 201 (new) | 200 (resumed) | 200 (unavailable). On unavailable,
 *  `session` is null and `messages` is empty; otherwise `resumed` distinguishes a fresh
 *  server-composed opening (false) from a picked-up existing thread (true). */
export interface OpenSessionData {
  session: ChatSession | null;
  messages: ChatMessage[];
  resumed: boolean;
  unavailable?: ChatUnavailable;
  /** The composer's lock, carried on the fetch so the first paint needs no second request. */
  quota?: ChatQuota;
}

/** GET /chat/sessions/:id — one conversation, with the same quota state riding along. */
export interface SessionDetailData {
  session: ChatSession;
  messages: ChatMessage[];
  quota?: ChatQuota;
}

// ★ THE VISIBLE-VS-MODEL-FACING OPENING SPLIT NEEDS NO FIELD HERE, AND THAT IS THE DESIGN.
//   A discuss session's opening user row carries two texts server-side: `content` (the full grounded ask
//   the model receives forever) and `display_content` (the one line the reader sees themselves say).
//   serializeMessage substitutes the second for the first, so the line simply ARRIVES as an ordinary
//   `ChatMessage` in `messages` — on open, on resume, and on GET-by-id alike. A top-level field would
//   have covered only the first of those three, which is precisely how the panel and /chat would have
//   ended up showing the same conversation differently.

/** POST /chat/sessions/:id/messages — 200 (ok) | 200 (unavailable). On ok, `reply` is the last assistant
 *  message and `messages` is the full visible transcript. On unavailable, `reply` is null and `messages`
 *  is the transcript WITH the refused message appended to it, marked undelivered — so the client can swap
 *  its optimistic row for the persisted one and a retry after a refresh behaves like a retry before one. */
export interface SendMessageData {
  session: ChatSession;
  messages?: ChatMessage[];
  reply: ChatMessage | null;
  unavailable?: ChatUnavailable;
  /**
   * ★ The SEMANTIC domains a confirmed chat write changed this turn ("watchlist" | "alerts" |
   * "reminders" | "portfolio"); empty on an ordinary question. Deliberately NOT query keys — the
   * mapping lives in lib/api/change-keys.ts. This is the only signal the client has that a write
   * happened at all, since tool turns never reach the transcript.
   */
  changed?: string[];
}
