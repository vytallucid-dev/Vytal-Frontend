"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// useChatConversation — the SHARED conversation core for both the sidekick panel AND the chat page.
//
// It owns the transcript + the send/reply network semantics, so the two surfaces cannot drift on the
// part most likely to: what happens when you send a message. The DIFFERENT bit — how a session is first
// established (open-with-context in the panel, load-by-id or blank-start on the page) — is left to the
// driver hooks (use-sidekick-chat, use-chat-page), which feed this core via setSession / ensureSession.
//
// WHY LOCAL STATE, NOT REACT QUERY. A transcript is append-only, ephemeral-per-view UI state, not a
// cacheable resource. Going through the MutationCache would also auto-toast every failure
// (query-provider.tsx); chat surfaces its own errors INLINE. So the message POST is a plain apiFetch.
//
// THE NON-OK OUTCOMES (identical on both surfaces):
//   · unavailable (quota) — success:true with data.unavailable. The SERVER persists the reader's message
//     marked undelivered and returns the transcript; we adopt it, so the row we show is the row that will
//     still be there after a refresh. Surface the calm in-voice line on that row, arm the send-block
//     below; retryable once the window rolls over.
//   · guardrail-blocked  — NOT handled here: the server already substituted the fixed redirect as normal
//     assistant text, so it flows through as an ordinary reply (guardrailBlocked is ignored).
//   · transport error    — a thrown fetch → inline retry of the same message (no duplicate user bubble).
//
// ★ A DENIAL IS A PROPERTY OF A MESSAGE, PLUS ONE ACCOUNT-LEVEL FACT. The explanation rides on the row it
// refused (UiMessage.denial — server-composed, and server-PERSISTED, so it reads the same after a reload).
// `sendBlock` is the separate, account-level fact that sending is pointless until a known instant: it
// deliberately SURVIVES a conversation switch (the daily cap is not per-thread) and is cleared only by the
// clock, by a send that gets through, or by never arming at all (a denial with no usable resetAt).
//
// ★ WHY THE DENIED MARK LIVES ON THE ROW. Before this, a denial was ONLY the bottom-of-transcript notice,
// so a second denied send cleared the first one's notice and re-rendered it underneath — two reader
// messages, one notice, and no way to tell that the FIRST one had also failed. The mark is per-row now,
// so every undelivered message says so itself and carries its own retry — and because the row is what the
// server persists, the SAME rendering survives a reload with no separate "remembered denial" path.
//
// SWITCH-SAFE. setSession() cancels any in-flight reply for the previous session (the dispatch drops its
// result when sessionIdRef no longer matches the id it started with), so switching conversations on the
// page never lands a reply in the wrong transcript.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { MutableRefObject } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ChatMessage, ChatQuota, ChatRole, ChatUnavailable, SendMessageData } from "@/types/chat";
import { invalidateChanged } from "@/lib/api/change-keys";
import { provisionalTitleFrom } from "./provisional-title";

/** The maximum message length the server accepts (SendBody: .max(4000)). Mirror it so the composer caps. */
export const MAX_MESSAGE_LENGTH = 4000;

/** A transcript row as the UI holds it. `reveal` marks freshly-generated text to type out on mount; loaded
 *  history is reveal:false (it renders at once — the reader saw it before). */
export interface UiMessage {
  id: string;
  role: ChatRole;
  content: string;
  reveal: boolean;
  /** A user turn the server REFUSED on quota — never delivered, retryable. Rendered as "not sent" so a
   *  transcript can never imply a message got through when it didn't. Mirrors ChatMessage.undelivered. */
  denied?: boolean;
  /** Why it wasn't sent — the server's in-voice line for THIS row, live or remembered. Rendered under the
   *  message so the explanation can never drift from the message it explains. */
  denial?: ChatUnavailable | null;
}

/** A wire message → a transcript row. The single place `undelivered`/`denial` become `denied`/`denial`,
 *  so every load path (open, resume, GET-by-id, and a denied send's own response) agrees. */
export function toUiMessage(m: ChatMessage, reveal: boolean): UiMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    reveal,
    denied: m.undelivered,
    denial: m.denial ?? null,
  };
}

/** The newest still-live denial in a transcript, if any — what re-arms the send-block after a reload.
 *  "Live" is decided by the server: it nulls `resetAt` once the window has passed, so a remembered denial
 *  from yesterday can never lock today's composer. */
function liveDenialIn(msgs: UiMessage[]): ChatUnavailable | null {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const d = msgs[i].denial;
    if (d && resetInstant(d.resetAt) != null) return d;
  }
  return null;
}

/** Parse a resetAt into an instant, or null when absent / malformed (never trust it into a Date blindly —
 *  a NaN instant would arm a lock that the clock can never lift). */
function resetInstant(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

/** How often the armed send-block re-checks the clock. An interval rather than one long timer: a machine
 *  that slept through the reset still comes back unlocked on its first tick. */
const RESET_POLL_MS = 15_000;

interface Envelope<T> {
  success: boolean;
  data: T;
}

export interface ChatConversationOptions {
  /** Called by send() when there is no session yet (blank-start on the chat page): create one and return
   *  its id, or null on failure. Runs inside the send's busy-guard, so a double-send can't create two. */
  ensureSession?: () => Promise<string | null>;
  /** Fired when a lock's `resetAt` passes — the driver re-reads the server's quota instead of letting a
   *  failed send be the thing that proves the window rolled over. */
  onResetPassed?: () => void;
  /** Called once, right after ensureSession establishes a new session id and BEFORE the message POST, so
   *  the driver can sync the URL / list. The live id is already set, so a URL-driven reload is skipped. */
  onSessionEstablished?: (id: string) => void;
}

export interface ChatConversation {
  messages: UiMessage[];
  /** ★ THE READER'S FIRST MESSAGE, TRUNCATED — the stand-in title for a conversation that was born in
   *  this session and has not been named by the server yet. Set by the send that CREATES the session
   *  (the only send that can happen against a blank one), cleared by every conversation switch, and
   *  never allowed to outrank a real title (see provisional-title.ts §resolveTitle). It lives here
   *  rather than in either driver because both surfaces can start a blank conversation, and a title
   *  that appeared on one of them and not the other would be a difference with no reason. */
  provisionalTitle: string | null;
  /** A reply is generating → the caller shows the Vytal loader in the assistant slot. */
  generating: boolean;
  /** The last send failed at the transport layer → the caller shows an inline retry. */
  sendError: boolean;
  /** Non-null while the daily cap makes sending pointless → the surfaces disable the composer and explain
   *  why. Lifts on its own at `resetAt`, or on the first send that gets through. */
  sendBlock: ChatUnavailable | null;
  send: (text: string) => void;
  /** Re-send the last message after a transport error (no duplicate user bubble). */
  retrySend: () => void;
  /** Re-send a specific transcript row (a denied message's "Retry"): same text, same row, moved to the
   *  end of the transcript so the reply lands under it — which is also where the server now has it. */
  retryMessage: (id: string) => void;
  /** Guard the driver's own async against unmount. */
  aliveRef: MutableRefObject<boolean>;
  /** The live session id (drivers use this to avoid reloading a session that's already in memory). */
  currentSessionId: () => string | null;
  /** Switch to (or clear) a conversation: cancels any in-flight reply for the previous session, resets
   *  transient state, and installs the given transcript. Pass (null, []) for a blank conversation. */
  setSession: (id: string | null, messages: UiMessage[]) => void;
  /** Arm the send-block from a denial the DRIVER saw (the panel's open-time quota denial, which isn't a
   *  send). The reader-facing explanation is not this function's business — it belongs to the row. */
  noteUnavailable: (u: ChatUnavailable | null) => void;
  /** Apply the SERVER's quota state (from a conversation fetch or GET /chat/quota). This is what makes
   *  the lock survive a refresh: it is read from `ai_usage_counters`, not inferred from a failed send. */
  applyQuota: (q: ChatQuota) => void;
}

export function useChatConversation(opts: ChatConversationOptions = {}): ChatConversation {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [provisionalTitle, setProvisionalTitle] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [sendBlock, setSendBlock] = useState<ChatUnavailable | null>(null);
  const blockUntilRef = useRef<number | null>(null);
  // What the SERVER last said about sending — null until it has said anything. It is the tie-breaker
  // against a transcript's own remembered denial (see setSession): the transcript is the instant
  // fallback while the quota read is in flight, the server is the authority once it answers.
  const serverSendableRef = useRef<boolean | null>(null);

  // The transcript as a ref, so retryMessage can look a row up without becoming a per-render callback.
  const messagesRef = useRef<UiMessage[]>(messages);
  messagesRef.current = messages;

  // Held in a ref because `dispatch` is a useCallback([]) — the client identity is stable for the
  // app's lifetime, so a ref keeps the dependency list empty without going stale.
  const qc = useQueryClient();
  const qcRef = useRef(qc);
  qcRef.current = qc;

  const aliveRef = useRef(false);
  const busyRef = useRef(false); // synchronous send-concurrency guard (double-Enter / create races)
  const sessionIdRef = useRef<string | null>(null);
  const lastAttemptRef = useRef<{ id: string; text: string } | null>(null);
  const tmpRef = useRef(0);
  const ensureRef = useRef(opts.ensureSession);
  ensureRef.current = opts.ensureSession;
  const onResetRef = useRef(opts.onResetPassed);
  onResetRef.current = opts.onResetPassed;
  const onEstablishedRef = useRef(opts.onSessionEstablished);
  onEstablishedRef.current = opts.onSessionEstablished;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const currentSessionId = useCallback(() => sessionIdRef.current, []);

  // Arm the send-block from a denial. Called by dispatch, by setSession (a reload into a capped day), and
  // by the drivers (the panel's open-time denial isn't a send, but it stops the reader just as completely).
  // A denial with no usable resetAt does NOT lock the composer — we would have no signal to unlock on, and
  // a permanently dead input is worse than a send that fails honestly. The reader still sees the denial:
  // it is rendered on the message row it refused, not here.
  const noteUnavailable = useCallback((u: ChatUnavailable | null) => {
    if (!u) return;
    const until = resetInstant(u.resetAt);
    if (until == null || until <= Date.now()) return;
    blockUntilRef.current = until;
    setSendBlock(u);
  }, []);

  // ── THE SERVER'S ANSWER WINS ──────────────────────────────────────────────────────────────────────
  // Applied on every conversation fetch and on every explicit re-check. This is the whole point of the
  // backend exposure: "can this reader send?" is read from the counters that the gate itself reads, so it
  // is true on the first paint after a refresh — where the old client-derived lock had nothing to go on
  // but a request that failed before the page reloaded.
  //
  // ⚠ A canSend:true ANSWER UNLOCKS. That is deliberate, including when we are locally locked: the server
  //   read the counters just now, we are quoting a response from some minutes ago, and the server's read
  //   degrades to allowing on failure — so the worst case of trusting it is one send that comes back
  //   honestly denied and re-arms the lock, which costs nothing and is a state this surface handles well.
  const applyQuota = useCallback(
    (q: ChatQuota) => {
      serverSendableRef.current = q.canSend;
      if (!q.canSend) {
        if (q.unavailable) noteUnavailable(q.unavailable);
        return;
      }
      blockUntilRef.current = null;
      setSendBlock(null);
    },
    [noteUnavailable],
  );

  // ── THE SEND-BLOCK LIFTS ITSELF ───────────────────────────────────────────────────────────────────
  // Poll the clock against the denying cap's own resetAt. `scopeDenied` needs no branch here: the server
  // sends the reset of whichever ceiling actually refused this send, so a GLOBAL denial unlocks on the
  // global window and a personal one on the reader's — the reader can never be held past the cap that
  // stopped them, even when the two windows differ.
  useEffect(() => {
    if (!sendBlock) return;
    const until = blockUntilRef.current;
    if (until == null) return;
    const tick = () => {
      if (Date.now() < until) return;
      blockUntilRef.current = null;
      setSendBlock(null);
      // ★ AND RETIRE THE EXPLANATIONS THE ROLLOVER JUST MADE UNTRUE. "It resets tomorrow." was the server's
      //   line for a window that has now passed; we don't rewrite server prose client-side, we drop it. The
      //   "not sent" mark and its retry STAY — those messages really were never delivered — and a reload
      //   brings the sentence back in the past tense, composed where all this wording is composed.
      setMessages((prev) =>
        prev.some((m) => m.denial && resetInstant(m.denial.resetAt) != null && resetInstant(m.denial.resetAt)! <= Date.now())
          ? prev.map((m) =>
              m.denial && resetInstant(m.denial.resetAt) != null && resetInstant(m.denial.resetAt)! <= Date.now()
                ? { ...m, denial: null }
                : m,
            )
          : prev,
      );
      // ★ AND ASK, RATHER THAN ASSUME. Unlocking above is optimistic — `resetAt` is a claim made hours
      //   ago about a moment that has only just arrived. The driver re-reads the server's quota now, so a
      //   window that did NOT actually roll over (clock skew, a global cap on a different schedule)
      //   re-arms the lock from real counters instead of being discovered by a doomed send.
      onResetRef.current?.();
    };
    tick();
    const timer = window.setInterval(tick, RESET_POLL_MS);
    return () => window.clearInterval(timer);
  }, [sendBlock]);

  const setSession = useCallback(
    (id: string | null, msgs: UiMessage[]) => {
      // Switching (or clearing): cancel any in-flight reply for the previous session and reset transients.
      // `sendBlock` is NOT a transient of this conversation — the daily cap is account-wide, so it survives.
      sessionIdRef.current = id;
      busyRef.current = false;
      lastAttemptRef.current = null;
      setGenerating(false);
      setSendError(false);
      setMessages(msgs);
      // The stand-in title belongs to ONE conversation — the one whose first message produced it. Any
      // switch (to another session, or back to a blank one) retires it; the conversation being switched
      // to has its own name, and inheriting someone else's would be the wrong-title failure this whole
      // mechanism exists to avoid.
      setProvisionalTitle(null);
      // ★ A RELOAD INTO A CAPPED DAY MUST STILL FIND THE COMPOSER SHUT — from the FIRST paint, before any
      //   quota read has answered. The loaded transcript already knows: its newest denial whose reset is
      //   still ahead. (The server nulls `resetAt` once the window has passed, so yesterday's denial can
      //   never lock today's composer.) This is a fallback, not a second source of truth: once the server
      //   has said sending is possible, its answer stands and a remembered denial does not re-lock.
      const live = liveDenialIn(msgs);
      if (live && serverSendableRef.current !== true) noteUnavailable(live);
    },
    [noteUnavailable],
  );

  // `rowId` null → a new send (append the reader's bubble). Non-null → a retry of a row already in the
  // transcript (a denied message, or the last message after a transport error): no duplicate bubble.
  const dispatch = useCallback(async (text: string, rowId: string | null) => {
    if (busyRef.current) return;
    if (text.trim().length === 0) return;

    busyRef.current = true;
    const id_ = rowId ?? `local-${tmpRef.current++}`;
    lastAttemptRef.current = { id: id_, text };
    setSendError(false);
    setGenerating(true);
    // ★ NAME THE CONVERSATION AT THE KEYSTROKE, NOT AT THE REPLY. No session id yet ⇒ this send is the
    //   one that creates it, so this text is its first message — the same text the server will truncate
    //   into the same title when the exchange finally lands, minutes later on a heavy question.
    if (sessionIdRef.current == null) setProvisionalTitle(provisionalTitleFrom(text));
    if (rowId == null) {
      setMessages((prev) => [...prev, { id: id_, role: "user", content: text, reveal: false }]);
    } else {
      // Retry: clear the row's denied mark + explanation and MOVE IT TO THE END. The server supersedes the
      // denied row with this attempt (appendFollowup), so the tail is exactly where it will be persisted —
      // leaving the bubble in its old slot would put its reply under some later message instead, and
      // disagree with the transcript on the next reload.
      setMessages((prev) => {
        const row = prev.find((m) => m.id === id_);
        if (!row) return prev;
        return [...prev.filter((m) => m.id !== id_), { ...row, content: text, denied: false, denial: null }];
      });
    }

    let id = sessionIdRef.current;
    try {
      // Blank-start: create the session on first send (no generation / quota — see composeChatPageOpening).
      if (!id) {
        id = ensureRef.current ? await ensureRef.current() : null;
        if (!aliveRef.current) return;
        if (!id) {
          setSendError(true); // couldn't create the session — offer a retry
          return;
        }
        sessionIdRef.current = id;
        onEstablishedRef.current?.(id);
      }

      const res = await apiFetch<Envelope<SendMessageData>>(
        `/api/v1/me/chat/sessions/${encodeURIComponent(id)}/messages`,
        { method: "POST", body: JSON.stringify({ message: text }) },
      );
      // Drop if unmounted OR the reader switched to a different session mid-flight.
      if (!aliveRef.current || sessionIdRef.current !== id) return;

      const d = res.data;
      if (d.unavailable) {
        noteUnavailable(d.unavailable);
        // ★ ADOPT THE SERVER'S TRANSCRIPT. The refused message IS persisted now (marked undelivered), so
        //   what comes back is the durable version of what we optimistically drew — real id, real order,
        //   its denial attached to it. Taking it means a retry works identically before and after a
        //   refresh, and a second denial cannot desynchronise us. Fall back to marking our own local row
        //   if an older server ever answers without a transcript.
        const wire = d.messages;
        setMessages((prev) =>
          wire ? wire.map((m) => toUiMessage(m, false)) : prev.map((m) => (m.id === id_ ? { ...m, denied: true, denial: d.unavailable! } : m)),
        );
        return;
      }
      // A send got through → whatever cap was denying us isn't anymore; lift the block early.
      blockUntilRef.current = null;
      setSendBlock(null);
      if (d.reply) {
        const reply = d.reply;
        setMessages((prev) => [...prev, { id: reply.id, role: "assistant", content: reply.content, reveal: true }]);
      }
      // ★ POST-WRITE REFRESH. If this turn confirmed a write, the server names the domains it touched
      //   and we drop the matching caches — the navbar bell count, the watchlist page, the stock
      //   page's pin toggle, the portfolio tree. Nothing else in the app can know this happened: the
      //   write ran server-side and the tool turns never reach the transcript.
      //   Done here (not in either surface) so the sidekick panel and the chat page cannot drift.
      invalidateChanged(qcRef.current, d.changed);
    } catch {
      if (!aliveRef.current || sessionIdRef.current !== id) return;
      setSendError(true);
    } finally {
      // Only release the guard / clear generating if we're still the session this dispatch was for.
      if (sessionIdRef.current === id) {
        busyRef.current = false;
        if (aliveRef.current) setGenerating(false);
      }
    }
  }, [noteUnavailable]);

  const send = useCallback((text: string) => void dispatch(text, null), [dispatch]);
  const retrySend = useCallback(() => {
    const last = lastAttemptRef.current;
    if (last != null) void dispatch(last.text, last.id);
  }, [dispatch]);
  const retryMessage = useCallback(
    (id: string) => {
      const row = messagesRef.current.find((m) => m.id === id);
      if (row) void dispatch(row.content, id);
    },
    [dispatch],
  );

  return {
    messages,
    provisionalTitle,
    generating,
    sendError,
    sendBlock,
    send,
    retrySend,
    retryMessage,
    aliveRef,
    currentSessionId,
    setSession,
    noteUnavailable,
    applyQuota,
  };
}
