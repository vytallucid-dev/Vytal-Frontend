"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE PENDING MESSAGE — how a surface OUTSIDE /chat starts a real conversation without becoming a
// second chat implementation.
//
// ── THE RULE THIS FILE EXISTS TO KEEP ───────────────────────────────────────────────────────────────
// There is ONE path that creates a session and sends the first message: useChatPage's blank-start
// (POST /chat/sessions {} → the core's dispatch). Session creation, the model-written title, the
// progressive reveal, the guardrail and the daily cap all hang off it. A caller that wanted to "just
// POST the message itself" would get a conversation the rest of the platform does not know about, and
// would have to re-implement every one of those five things to stay honest.
//
// So a caller does not send anything. It STAGES the text, navigates to the blank chat, and the hub —
// which already owns that path — sends it exactly as if the reader had typed it into the composer.
// The precedent is sidekick's `goFullScreen` (sidekick-provider §goFullScreen): it hands a conversation
// to /chat by NAVIGATING to it, never by rebuilding it. This is the same move for a conversation that
// does not exist yet.
//
// ── WHY sessionStorage AND NOT THE URL ──────────────────────────────────────────────────────────────
// `?ask=<the reader's question>` would put a person's question about their own money into the address
// bar, the browser history, and any link they later copy out of it. It also breaks on the long end
// (MAX_MESSAGE_LENGTH is far past a comfortable URL). sessionStorage is per-tab, invisible, and dies
// with the tab.
//
// ── ⚠ ONE-SHOT, AND TIME-BOXED ──────────────────────────────────────────────────────────────────────
// `take` DELETES before it returns, so a re-render, a Fast Refresh or a browser Back cannot re-send a
// message the reader sent once. And a staged message that never got consumed — the reader hit send and
// then closed the tab mid-navigation — must not fire days later when they next open a blank chat, so it
// carries a stamp and expires. TTL is a navigation's worth of time, not a session's.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const KEY = "vytal:chat:pending";

/** How long a staged message stays valid. A same-tab route change is milliseconds; this is generous
 *  enough for a slow load and far too short to surprise anyone later. */
const TTL_MS = 60_000;

interface Staged {
  text: string;
  at: number;
}

/** The destination a staged message is meant for — the blank conversation, the hub's own entry path. */
export const CHAT_NEW_HREF = "/chat?session=new";

/** Hold `text` for the blank chat about to be opened. Best-effort: a browser with storage disabled
 *  simply starts a blank conversation instead, which is a degraded landing, never a broken one. */
export function stageChatMessage(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ text: trimmed, at: Date.now() } satisfies Staged));
  } catch {
    /* storage unavailable (private mode, quota) — the navigation still happens */
  }
}

/** Read and CLEAR the staged message. Returns null when there is none, when it is malformed, or when it
 *  is older than TTL_MS. Clearing happens on every path, including the expired one. */
export function takeChatMessage(): string | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw == null) return null;
    window.sessionStorage.removeItem(KEY); // ⚠ before anything can throw or return
    const parsed = JSON.parse(raw) as Partial<Staged>;
    if (typeof parsed?.text !== "string" || typeof parsed?.at !== "number") return null;
    if (Date.now() - parsed.at > TTL_MS) return null;
    return parsed.text.trim() || null;
  } catch {
    return null;
  }
}
