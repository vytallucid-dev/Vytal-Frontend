"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CHAT CONVERSATION PANE — the right region. Two modes:
//
//  · BLANK (a fresh chat, no messages) → a vertically-centred WELCOME: a time-of-day greeting, one line
//    of framing, the composer AS PART OF that block (not pinned to the bottom), and a row of suggestion
//    chips scoped to what a blank chat can genuinely answer (concepts, not live stock data — there's no
//    fact block or tools yet). The honest "open a stock's card for its numbers" note is integrated here.
//  · ACTIVE (loading / has messages) → the normal header + shared transcript + pinned-bottom composer.
//    Sending from the welcome flips to this layout (the composer "moves" to the bottom).
//
// All send states (generating / unavailable+reset / guardrail-as-normal-reply / transport error) come
// from the shared transcript + core, so this pane and the sidekick panel stay identical.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { QueryError } from "@/components/ui/query-error";
import { Icons } from "@/lib/icons";
import type { ChatSession } from "@/types/chat";
import { ChatComposer } from "./chat-composer";
import { composerQuotaNote } from "./chat-message";
import { ChatTranscript } from "./chat-transcript";
import { SUGGESTIONS, WELCOME_FRAMING, WELCOME_NOTE, useGreeting } from "./welcome";
import type { ChatPage } from "./use-chat-page";

/** The blank-chat welcome — greeting + framing + composer + chips as one centred unit. Sets expectations
 *  about the deliberate no-subject grounding limitation (a blank chat has no fact block / tools yet).
 *  The words come from ./welcome, shared with the sidekick panel's empty state; the LAYOUT is this
 *  surface's own — a hero block with room to breathe, which the rail does not have. */
function Welcome({ chat }: { chat: ChatPage }) {
  const greeting = useGreeting();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
      <div className="w-full max-w-2xl animate-in fade-in-0 slide-in-from-bottom-3 duration-500 motion-reduce:animate-none">
        <div className="mb-6 text-center">
          <span className="ai-badge mx-auto mb-4 flex w-fit" aria-hidden>
            <Icons.spark weight="fill" className="h-3 w-3" />
          </span>
          {/* min-h reserves the line while the greeting resolves client-side (see useGreeting), so the
              block never jumps once it lands. */}
          <h1 className="min-h-[1.1em] font-display text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
            {greeting}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink2">{WELCOME_FRAMING}</p>
        </div>

        {/* The welcome's composer is the SAME composer, so the daily cap closes it here too — a blank
            chat is exactly where a capped reader would otherwise type a whole question for nothing. */}
        <ChatComposer
          variant="hero"
          autoFocus
          onSend={chat.send}
          disabled={!chat.canSend}
          placeholder={chat.sendBlock ? "Daily limit reached" : "Ask Vytal anything…"}
          notice={chat.sendBlock ? composerQuotaNote(chat.sendBlock) : null}
        />

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => chat.send(s)}
              disabled={!chat.canSend}
              className="rounded-full border border-line2 bg-surface-1/60 px-3 py-1.5 text-[12.5px] text-ink2 transition-colors hover:border-line3 hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-md text-center text-[12px] leading-relaxed text-ink3">
          {WELCOME_NOTE}
        </p>
      </div>
    </div>
  );
}

/** Fetching an existing session's history — brief; the orbiting mark reads as "loading". */
function LoadingLeading() {
  return (
    <div
      className="flex items-center justify-center gap-2 py-12 text-[13px] text-ink3"
      role="status"
    >
      <span
        className="ai-orbit relative grid size-7 place-items-center rounded-full bg-surface-2"
        aria-hidden
      >
        <Icons.spark
          weight="fill"
          className="size-3.5 text-ai-from ai-orbit__spark"
        />
      </span>
      <span>Loading…</span>
    </div>
  );
}

export function ChatConversationPane({
  chat,
  session,
  onBack,
  onRename,
}: {
  chat: ChatPage;
  /** The active session's list metadata (title / subject) for the header, or null for a blank chat. */
  session: ChatSession | null;
  /** Mobile: return to the list. */
  onBack: () => void;
  /** Open the rename dialog for the active session. */
  onRename: (session: ChatSession) => void;
}) {
  const showWelcome = chat.phase === "blank" && chat.messages.length === 0;
  const placeholder = chat.sendBlock
    ? "Daily limit reached"
    : chat.generating
      ? "Vytal is replying…"
      : chat.phase === "loading"
        ? "Loading…"
        : "Ask a follow-up…";

  return (
    // The pane is keyed by conversation in the hub, so this fade-in is the cross-fade on switch.
    <div className="flex h-full min-h-0 flex-col animate-in fade-in-0 duration-200 motion-reduce:animate-none">
      {showWelcome ? (
        <>
          {/* mobile-only slim bar so a blank chat can still return to the list */}
          <div className="flex shrink-0 items-center px-2 py-2 md:hidden">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations"
              className="grid size-8 place-items-center rounded-lg text-ink2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Icons.arrowLeft className="size-4" />
            </button>
          </div>
          <Welcome chat={chat} />
        </>
      ) : (
        <>
          {/* header */}
          <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-3 sm:px-4">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink2 transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
            >
              <Icons.arrowLeft className="size-4" />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="min-w-0 truncate font-display text-[16px] font-semibold text-ink">
                {session?.title ?? "Conversation"}
              </span>
              {session?.subjectSymbol && (
                <span className="num inline-flex shrink-0 items-center rounded border border-line2 bg-surface-2 px-1.5 py-0.5 text-[10px] leading-none text-ink2">
                  {session.subjectSymbol}
                </span>
              )}
            </div>
          </div>

          {chat.phase === "loadError" ? (
            <div className="grid min-h-0 flex-1 place-items-center p-4">
              <QueryError
                message="We couldn't load this conversation."
                onRetry={chat.reload}
              />
            </div>
          ) : (
            <ChatTranscript
              messages={chat.messages}
              generating={chat.generating}
              sendError={chat.sendError}
              onRetrySend={chat.retrySend}
              onRetryMessage={chat.retryMessage}
              retryDisabled={!chat.canSend}
              leading={
                chat.phase === "loading" ? <LoadingLeading /> : undefined
              }
            />
          )}

          <ChatComposer
            onSend={chat.send}
            disabled={!chat.canSend}
            placeholder={placeholder}
            notice={chat.sendBlock ? composerQuotaNote(chat.sendBlock) : null}
          />
        </>
      )}
    </div>
  );
}
