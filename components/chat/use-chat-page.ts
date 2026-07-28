"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// useChatPage — the chat PAGE's driver over the shared conversation core (use-chat-conversation).
//
// The core owns the transcript + send semantics. This hook adds the page's lifecycle, which differs from
// the panel's in two ways:
//   · LOAD BY ID — when the URL points at a session, GET it and render its history at once (reveal:false).
//   · BLANK-START — with no session, the composer is live; the FIRST send creates a chat_page session
//     (POST /chat/sessions {} — no opening exchange, no generation, no quota) and then sends the message
//     to it. That's the page's primary entry path and the opposite of a card-opened panel conversation (which always opens with
//     a server-composed exchange). ensureSession wires it into the core's dispatch.
//
// `activeId` is the real session id from the URL (the "new" sentinel and null both mean blank). Switching
// activeId loads a different session; the core's session-match guard drops any in-flight reply from the
// one we left.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { seedChatQuota, useChatQuota, useRefreshChatQuota } from "@/lib/api/hooks/use-chat-quota";
import type { ChatMessage, ChatSession, ChatUnavailable, OpenSessionData, SessionDetailData } from "@/types/chat";
import { useChatConversation, toUiMessage, type UiMessage } from "./use-chat-conversation";

export type ChatPagePhase = "blank" | "loading" | "ready" | "loadError";

export interface ChatPage {
  messages: UiMessage[];
  phase: ChatPagePhase;
  generating: boolean;
  sendError: boolean;
  /** Non-null while the daily cap is denying sends → the composer is disabled and says why. */
  sendBlock: ChatUnavailable | null;
  canSend: boolean;
  send: (text: string) => void;
  retrySend: () => void;
  retryMessage: (id: string) => void;
  /** Re-attempt loading the current session after a loadError. */
  reload: () => void;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export function useChatPage(opts: {
  /** The real session id from the URL, or null for a blank (new) conversation. */
  activeId: string | null;
  /** Sync the URL + list once a blank-start session is created (the live id is already set, so this
   *  won't trigger a reload). */
  onSessionCreated: (id: string) => void;
}): ChatPage {
  const onCreatedRef = useRef(opts.onSessionCreated);
  onCreatedRef.current = opts.onSessionCreated;

  // The composer's lock as SERVER state: seeded by every fetch below, re-read when a lock's resetAt
  // passes. Shared query key, so the panel and this page read one answer from one request.
  const qc = useQueryClient();
  const quotaQ = useChatQuota();
  const refreshQuota = useRefreshChatQuota();

  // Blank-start: create a chat_page session (empty body). No generation / quota — the reader's first
  // message drives the first exchange (see composeChatPageOpening).
  const ensureSession = useCallback(async (): Promise<string | null> => {
    try {
      const r = await apiFetch<Envelope<OpenSessionData>>("/api/v1/me/chat/sessions", {
        method: "POST",
        body: JSON.stringify({}),
      });
      seedChatQuota(qc, r.data.quota);
      return r.data.session?.id ?? null;
    } catch {
      return null;
    }
  }, [qc]);

  const conv = useChatConversation({
    ensureSession,
    onResetPassed: refreshQuota,
    onSessionEstablished: (id) => {
      setPhase("ready");
      onCreatedRef.current(id);
    },
  });
  const { setSession, currentSessionId, aliveRef } = conv;

  const [phase, setPhase] = useState<ChatPagePhase>("blank");

  const loadSession = useCallback(
    async (id: string) => {
      setSession(id, []); // clear + claim the target id, so a re-run / the URL sync skips reloading
      setPhase("loading");
      try {
        const r = await apiFetch<Envelope<SessionDetailData>>(
          `/api/v1/me/chat/sessions/${encodeURIComponent(id)}`,
        );
        // The lock rides on the fetch, so it lands with the first paint of the transcript — no window in
        // which a capped reader is shown a live input, and no second request to open one.
        seedChatQuota(qc, r.data.quota);
        if (!aliveRef.current || currentSessionId() !== id) return; // switched away mid-load → drop
        // toUiMessage, not a local shape: a loaded transcript carries denied/denial exactly as a live one
        // does, which is what makes a refreshed denial render identically to the one that just happened.
        setSession(id, r.data.messages.map((m: ChatMessage) => toUiMessage(m, false)));
        setPhase("ready");
      } catch {
        if (!aliveRef.current || currentSessionId() !== id) return;
        setPhase("loadError");
      }
    },
    [setSession, currentSessionId, aliveRef, qc],
  );

  // Apply whatever the server last said — from a fetch that seeded the cache, or from an explicit
  // re-check after a reset passed. `applyQuota` is idempotent, so re-running on identity change is free.
  const { applyQuota } = conv;
  useEffect(() => {
    if (quotaQ.data) applyQuota(quotaQ.data);
  }, [quotaQ.data, applyQuota]);

  useEffect(() => {
    const target = opts.activeId;
    if (target == null) {
      // Blank (new) — clear to a fresh blank conversation if we were on one.
      if (currentSessionId() != null) setSession(null, []);
      setPhase("blank");
      return;
    }
    if (target === currentSessionId()) return; // already live (freshly created / already loaded)
    void loadSession(target);
  }, [opts.activeId, loadSession, setSession, currentSessionId]);

  const reload = useCallback(() => {
    if (opts.activeId) void loadSession(opts.activeId);
  }, [opts.activeId, loadSession]);

  // Blank AND ready both allow sending; loading / loadError do not — and neither does a live daily cap,
  // where every attempt is a guaranteed failure (the core lifts sendBlock at resetAt on its own).
  const canSend = (phase === "blank" || phase === "ready") && !conv.generating && !conv.sendBlock;

  return {
    messages: conv.messages,
    phase,
    generating: conv.generating,
    sendError: conv.sendError,
    sendBlock: conv.sendBlock,
    canSend,
    send: conv.send,
    retrySend: conv.retrySend,
    retryMessage: conv.retryMessage,
    reload,
  };
}
