"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// useSidekickChat — the PANEL's driver over the shared conversation core (use-chat-conversation).
//
// The core owns the transcript + send semantics and is untouched: this hook adds only the lifecycle the
// panel needs, exactly as use-chat-page adds the page's. It REPLACES use-discuss-chat, which could
// assume one conversation per mount because the sheet died with the card that raised it. The panel is
// persistent — it outlives any one conversation — so it must be able to switch between them:
//
//   · openDiscuss(ctx) — a card asked for a FRESH grounded conversation. POST /chat/sessions with the
//     DiscussContext; the server composes + runs the opening, or RESUMES this subject's thread (24h).
//   · sendDiscuss(ctx) — a card asked while a conversation is already running: REUSE it. The short
//     natural line goes in as an ordinary message, so the model answers with the tools it has (a new
//     subject costs it a getStockFacts round-trip — the accepted price of not throwing the thread away).
//   · startBlank()     — the manager's "New". No session until the first send (core ensureSession).
//   · loadSession(id)  — the manager picked an existing conversation. GET, render its history at once.
//
// ★ THE VISIBLE OPENING MESSAGE. A fresh open shows the reader's own short line the moment they tap —
// optimistically, before the network answers — and the reply then generates under it. That optimism IS
// the "it auto-sent" feel: without it the panel would sit blank for the length of a generation and the
// message would arrive fully-formed alongside its answer. The server's text wins the moment it lands
// (see applyOpen); ours is the stand-in, never the authority.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { seedChatQuota, useChatQuota, useRefreshChatQuota } from "@/lib/api/hooks/use-chat-quota";
import type { ChatMessage, ChatSession, ChatUnavailable, OpenSessionData, SessionDetailData } from "@/types/chat";
import { useChatConversation, toUiMessage, type UiMessage } from "@/components/chat/use-chat-conversation";
import type { DiscussContext } from "@/components/discuss/discuss-context";
import { provisionalOpeningLine, subjectLabelFor } from "./sidekick-opening";

/** The panel's lifecycle. `openError` / `loadError` are transport failures (both retryable). */
export type SidekickPhase = "blank" | "opening" | "loading" | "ready" | "openError" | "loadError";

export interface SidekickChat {
  messages: UiMessage[];
  phase: SidekickPhase;
  /** The live session's metadata — the header's title, and the manager's active-row marker. */
  session: ChatSession | null;
  sessionId: string | null;
  /** The subject a fresh conversation is opening on, while it has no server title yet. */
  pendingLabel: string | null;
  /** A BLANK conversation's stand-in title — the reader's first message, truncated (see
   *  provisional-title.ts). `pendingLabel`'s counterpart for the path that has no subject. */
  provisionalTitle: string | null;
  /** True when the server picked up an existing thread instead of composing a fresh opening. */
  resumed: boolean;
  /** Reply in flight — INCLUDING the opening exchange, so the loader sits under the reader's line. */
  generating: boolean;
  sendError: boolean;
  /** Non-null while the daily cap is denying sends → the composer is disabled and says why. */
  sendBlock: ChatUnavailable | null;
  canSend: boolean;
  send: (text: string) => void;
  retrySend: () => void;
  /** Re-send a denied user turn. Routes the OPENING line back through a fresh grounded open (see below). */
  retryMessage: (id: string) => void;
  /** Re-attempt whatever failed (the open, or the load). */
  retry: () => void;
  /** A card asked for a conversation and there is none to reuse → open a fresh, grounded one. */
  openDiscuss: (ctx: DiscussContext) => void;
  /** A card asked while one is running → send the same intent into it as an ordinary message. */
  sendDiscuss: (ctx: DiscussContext) => void;
  startBlank: () => void;
  loadSession: (id: string) => void;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

/** The optimistic opening row's id — stable, because a denied open has to be able to route ITS retry back
 *  through runOpen rather than through the core's ordinary send (see retryMessage). */
const OPENING_LOCAL_ID = "sidekick-opening-local";

export function useSidekickChat(): SidekickChat {
  const [phase, setPhase] = useState<SidekickPhase>("blank");
  const [sessionRow, setSessionRow] = useState<ChatSession | null>(null);
  const [resumed, setResumed] = useState(false);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  // The composer's lock as SERVER state — the same shared query the chat page reads, so the rail and the
  // page can never disagree about whether this reader can send, and one request serves both.
  const qc = useQueryClient();
  const quotaQ = useChatQuota();
  const refreshQuota = useRefreshChatQuota();

  // Blank-start: create a chat_page session on the first send (no generation, no quota) — the same
  // ensureSession contract the chat page uses, so a blank panel conversation IS a chat-page conversation.
  const ensureSession = useCallback(async (): Promise<string | null> => {
    try {
      const r = await apiFetch<Envelope<OpenSessionData>>("/api/v1/me/chat/sessions", {
        method: "POST",
        body: JSON.stringify({}),
      });
      seedChatQuota(qc, r.data.quota);
      setSessionRow(r.data.session);
      return r.data.session?.id ?? null;
    } catch {
      return null;
    }
  }, [qc]);

  const conv = useChatConversation({
    ensureSession,
    onResetPassed: refreshQuota,
    onSessionEstablished: () => setPhase("ready"),
  });
  const { setSession, noteUnavailable, currentSessionId, aliveRef } = conv;

  // What to re-run on retry — the last open's context, or the last load's id.
  const lastOpenRef = useRef<DiscussContext | null>(null);
  const lastLoadRef = useRef<string | null>(null);
  // Monotonic open ticket. An open has no session id to match on (that is what it is going to create),
  // so this is what a slower earlier open loses to a faster later one — otherwise tapping a second card
  // mid-open would install the FIRST card's conversation over the one the reader actually asked for.
  const openSeqRef = useRef(0);
  // A discuss-while-generating, held for the end of the turn (see §THE ONE-DEEP QUEUE). Cleared by every
  // conversation switch below: it is addressed to the conversation that was running when it was queued,
  // and delivering it to a different one would be worse than dropping it.
  const queuedRef = useRef<string | null>(null);

  // ── OPEN a fresh grounded conversation ────────────────────────────────────────────────────────────
  const runOpen = useCallback(
    async (ctx: DiscussContext) => {
      const seq = ++openSeqRef.current;
      lastOpenRef.current = ctx;
      lastLoadRef.current = null;
      queuedRef.current = null;
      setResumed(false);
      setSessionRow(null);
      setPendingLabel(subjectLabelFor(ctx));
      setPhase("opening");
      // The optimistic user line: shown immediately, replaced by the server's the moment it lands.
      const optimistic: UiMessage = {
        id: OPENING_LOCAL_ID,
        role: "user",
        content: provisionalOpeningLine(ctx),
        reveal: false,
      };
      setSession(null, [optimistic]);

      try {
        const res = await apiFetch<Envelope<OpenSessionData>>("/api/v1/me/chat/sessions", {
          method: "POST",
          body: JSON.stringify(ctx),
        });
        if (!aliveRef.current || openSeqRef.current !== seq) return; // superseded by a newer open → drop
        const d = res.data;
        seedChatQuota(qc, d.quota); // the lock rides on the open, so the rail paints it immediately

        if (d.unavailable) {
          // Quota denied at open — NO session was created, so there is nothing to persist the line ONTO
          // (unlike a denied follow-up, which the server now stores marked undelivered). It is kept in
          // memory, marked, carrying its own explanation; a refresh loses it along with the whole panel
          // conversation, which a refresh loses anyway. noteUnavailable arms the send-block (composer off).
          setSession(null, [{ ...optimistic, denied: true, denial: d.unavailable }]);
          noteUnavailable(d.unavailable);
          setSessionRow(null);
          setPhase("ready");
          return;
        }

        // ★ applyOpen — the server's opening line arrives as an ordinary user message in `messages`
        //   (its row carries display_content, so serializeVisibleMessages keeps it and serializeMessage
        //   swaps the text). So we drop our placeholder and render what came back. The only case that
        //   still needs the placeholder is a conversation with no such row at all — a session resumed
        //   from before display_content existed — where prepending it beats a transcript that opens with
        //   Vytal talking to nobody.
        const serverHasOpeningLine = (d.messages ?? []).some((m) => m.role === "user");
        const opening: UiMessage[] = serverHasOpeningLine ? [] : [optimistic];

        setSession(d.session?.id ?? null, [
          ...opening,
          // A fresh opening is newly generated → reveal it. A resumed thread is history the reader has
          // already read → render it at once.
          ...(d.messages ?? []).map((m) => toUiMessage(m, !d.resumed && m.role === "assistant")),
        ]);
        setSessionRow(d.session);
        setResumed(d.resumed);
        setPhase("ready");
      } catch {
        if (!aliveRef.current || openSeqRef.current !== seq) return;
        setSession(null, []);
        setPhase("openError");
      }
    },
    [setSession, noteUnavailable, aliveRef, qc],
  );

  // ── LOAD an existing conversation (the manager picked one) ────────────────────────────────────────
  const runLoad = useCallback(
    async (id: string) => {
      lastLoadRef.current = id;
      lastOpenRef.current = null;
      openSeqRef.current++; // an open still in flight is no longer what the reader is looking at
      queuedRef.current = null;
      setResumed(false);
      setPendingLabel(null);
      setSessionRow(null); // don't let the header keep naming the conversation we just left
      setSession(id, []); // claim the id first, so a reply from the conversation we left is dropped
      setPhase("loading");
      try {
        const r = await apiFetch<Envelope<SessionDetailData>>(
          `/api/v1/me/chat/sessions/${encodeURIComponent(id)}`,
        );
        seedChatQuota(qc, r.data.quota);
        if (!aliveRef.current || currentSessionId() !== id) return; // switched away mid-load → drop
        setSession(
          id,
          r.data.messages.map((m) => toUiMessage(m, false)),
        );
        setSessionRow(r.data.session);
        setPhase("ready");
      } catch {
        if (!aliveRef.current || currentSessionId() !== id) return;
        setPhase("loadError");
      }
    },
    [setSession, currentSessionId, aliveRef, qc],
  );

  // Apply whatever the server last said — from a fetch that seeded the cache, or from an explicit
  // re-check once a lock's resetAt passed.
  const { applyQuota } = conv;
  useEffect(() => {
    if (quotaQ.data) applyQuota(quotaQ.data);
  }, [quotaQ.data, applyQuota]);

  const startBlank = useCallback(() => {
    lastOpenRef.current = null;
    lastLoadRef.current = null;
    openSeqRef.current++;
    queuedRef.current = null;
    setSession(null, []);
    setSessionRow(null);
    setResumed(false);
    setPendingLabel(null);
    setPhase("blank");
  }, [setSession]);

  const retry = useCallback(() => {
    if (lastOpenRef.current) void runOpen(lastOpenRef.current);
    else if (lastLoadRef.current) void runLoad(lastLoadRef.current);
  }, [runOpen, runLoad]);

  // ── THE ONE-DEEP QUEUE ────────────────────────────────────────────────────────────────────────────
  // A card can be tapped while a reply is still generating, and the core's send is guarded against
  // concurrency — it would drop the message on the floor, silently, in exactly the "reuse the running
  // conversation" case that matters most. So a discuss-while-busy is held and flushed the moment the
  // turn finishes. One deep on purpose: this is a reader tapping a card, not a backlog to replay.
  useEffect(() => {
    if (conv.generating) return;
    const queued = queuedRef.current;
    if (!queued) return;
    queuedRef.current = null;
    conv.send(queued);
  }, [conv.generating, conv.send]);

  // ⚠ REUSE SENDS AN ORDINARY MESSAGE, so there is no split to honour: what the reader sees IS what the
  // model receives. It gets the provisional line rather than a surface's buildDisplay because that text
  // is a PROMISE about what a grounded opening will cover, and this path has no grounded opening behind
  // it — the running conversation answers from its tools. Promising less than the reply may deliver is
  // the safe direction; promising more is not.
  const sendDiscuss = useCallback(
    (ctx: DiscussContext) => {
      const text = provisionalOpeningLine(ctx);
      if (conv.generating) queuedRef.current = text;
      else conv.send(text);
    },
    [conv.generating, conv.send],
  );

  // ⚠ A DENIED OPENING RETRIES AS AN OPEN, NOT AS A MESSAGE. The optimistic line is a stand-in for a
  // GROUNDED open (the server composes the real ask and attaches the fact block); re-sending its text
  // through the ordinary send path would produce an ungrounded conversation that looks the same and
  // answers worse. Every other row is an ordinary message and retries as one.
  const retryMessage = useCallback(
    (id: string) => {
      if (id === OPENING_LOCAL_ID && lastOpenRef.current) {
        void runOpen(lastOpenRef.current);
        return;
      }
      conv.retryMessage(id);
    },
    [runOpen, conv.retryMessage],
  );

  // Opening counts as generating: the reply IS being produced, and the panel wants the loader under the
  // reader's line rather than the empty-transcript state.
  const generating = conv.generating || phase === "opening";
  // A live daily cap denies every send — including a card-opened one — so it closes the composer too.
  // The core lifts sendBlock by itself at resetAt; nothing here has to remember to.
  const canSend = (phase === "ready" || phase === "blank") && !generating && !conv.sendBlock;

  return {
    messages: conv.messages,
    phase,
    session: sessionRow,
    sessionId: currentSessionId(),
    pendingLabel,
    provisionalTitle: conv.provisionalTitle,
    resumed,
    generating,
    sendError: conv.sendError,
    sendBlock: conv.sendBlock,
    canSend,
    send: conv.send,
    retrySend: conv.retrySend,
    retryMessage,
    retry,
    openDiscuss: (ctx) => void runOpen(ctx),
    // Reuse: the SAME short line the reader would have seen on a fresh open, sent as an ordinary
    // message. No re-grounding — the running conversation's fact block is fixed at its own session
    // start, so a different subject reaches the model through its tools.
    sendDiscuss,
    startBlank,
    loadSession: (id) => void runLoad(id),
  };
}
