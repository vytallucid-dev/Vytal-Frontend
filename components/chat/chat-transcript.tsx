"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CHAT TRANSCRIPT — the scrolling message area SHARED by the sidekick panel and the chat page. It owns the
// non-trivial, drift-prone coordination: progressive-reveal skip signalling, auto-scroll-to-newest, and
// the "reader scrolled up / tapped → finalize the reveal" behaviour. Messages + the generating/error
// states come in as props; the surface-specific empty/opening state comes in as `leading` (the panel
// passes its opening loader; the page passes a blank invite or a loading indicator).
//
// ⚠ THERE IS NO TRAILING "UNAVAILABLE" NOTICE ANY MORE. A quota denial belongs to the message it refused
// (UiMessage.denial, rendered inside MessageBubble), not to the foot of the transcript — a trailing notice
// could not say WHICH message went unanswered, and vanished the moment a second send replaced it.
//
// SCROLL — auto-scroll is INSTANT, never smooth: a smooth programmatic scroll lags its target for a few
// hundred ms, and onListScroll would misread that lag as the reader scrolling up and finalize the reveal.
//
// §DENSE — the two surfaces are not the same width. The page gives the transcript an 800px column; the
// sidekick rail gives it ~350px, where the page's scale reads oversized and every line wraps twice. So the
// transcript carries ONE flag, threaded to every leaf that sizes text, rather than the panel re-styling
// shared components from outside. Page values are unchanged; `dense` is the rail's step down.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { UiMessage } from "./use-chat-conversation";
import { MessageBubble, SendErrorNotice } from "./chat-message";
import { VytalLoader } from "./vytal-loader";
import { useReducedMotion } from "./use-progressive-reveal";

export function ChatTranscript({
  messages,
  generating,
  sendError,
  onRetrySend,
  onRetryMessage,
  retryDisabled = false,
  leading,
  dense = false,
}: {
  messages: UiMessage[];
  generating: boolean;
  sendError: boolean;
  onRetrySend: () => void;
  /** Re-send a denied (never-delivered) user turn — threaded to every row so each carries its own retry. */
  onRetryMessage?: (id: string) => void;
  /** Sending is impossible right now (still capped / a reply in flight) → row retries are inert. */
  retryDisabled?: boolean;
  /** Rendered at the top of the transcript ONLY when there are no messages yet (opening loader / blank
   *  invite / loading indicator). Hidden as soon as the first turn lands. */
  leading?: ReactNode;
  /** The narrow-rail type scale + padding (the sidekick panel). See §DENSE above. */
  dense?: boolean;
}) {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true); // is the view pinned to the bottom?
  const lastUserRef = useRef<string | null>(null);
  const [skipSignal, setSkipSignal] = useState(0);

  const scrollToEnd = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
  }, []);

  // Stay pinned to the bottom as revealing text grows (only if the reader hasn't scrolled up).
  const onGrow = useCallback(() => {
    if (stickRef.current) scrollToEnd();
  }, [scrollToEnd]);

  // New turn / loader / notice → snap to the bottom, if the view is still following.
  //
  // ★ A SEND RE-PINS THE VIEW. A reader who scrolled up to re-read and then sends is asking for what comes
  //   next, so the newest turn has to be on screen — but that must not become a second scroll mechanism
  //   racing this one. It doesn't: a send is DETECTABLE FROM THE TRANSCRIPT ITSELF, because the core
  //   appends the reader's own bubble optimistically before the request goes out. A new last message with
  //   role "user" IS the send, on both surfaces, with nothing threaded from either composer — and all it
  //   does is set `stickRef` back to true, the same one flag everything else already reads.
  //
  //   ⚠ ON SEND, NOT ON EVERY TOKEN. `onGrow` below still obeys stickRef, so a reader who scrolls up
  //   MID-REPLY to re-read is left exactly where they are until they send again.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "user" && last.id !== lastUserRef.current) {
      lastUserRef.current = last.id;
      stickRef.current = true;
    }
    if (stickRef.current) scrollToEnd();
  }, [messages, generating, sendError, scrollToEnd]);

  // Starting a new reply finalizes any in-flight reveal above it.
  useEffect(() => {
    if (generating) setSkipSignal((s) => s + 1);
  }, [generating]);

  const onListScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 80;
    const wasAtBottom = stickRef.current;
    stickRef.current = atBottom;
    // Reader deliberately scrolled up → let them read now: finalize the reveal.
    if (wasAtBottom && !atBottom) setSkipSignal((s) => s + 1);
  };

  return (
    <div
      ref={listRef}
      onScroll={onListScroll}
      onClick={() => setSkipSignal((s) => s + 1)}
      className="custom-scrollbar min-h-0 flex-1 overflow-y-auto"
    >
      {/* min-h-full ONLY while empty, so a `leading` block can anchor itself to the bottom of the scroll
          area (the panel's empty state does, to sit continuous with the composer below it). With messages
          present the container is content-sized exactly as before. */}
      <div
        className={cn(
          "mx-auto flex w-full flex-col",
          dense ? "max-w-none gap-4 p-3" : "max-w-200 gap-5 p-4",
          messages.length === 0 && "min-h-full",
        )}
      >
        {messages.length === 0 && leading}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            reduced={reduced}
            skipSignal={skipSignal}
            onGrow={onGrow}
            onRetryMessage={onRetryMessage}
            retryDisabled={retryDisabled}
            dense={dense}
          />
        ))}
        {generating && <VytalLoader dense={dense} />}
        {sendError && <SendErrorNotice onRetry={onRetrySend} dense={dense} />}
      </div>
    </div>
  );
}
