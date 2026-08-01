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
import { SC_CONVERSATIONS, SC_NEW_CHAT } from "@/components/shortcuts/chat-shortcuts";
import { useShortcutLabel } from "@/lib/shortcuts";
import { Icons } from "@/lib/icons";
import type { ChatSession } from "@/types/chat";
import { ChatComposer } from "./chat-composer";
import { composerQuotaNote } from "./chat-message";
import { ChatTranscript } from "./chat-transcript";
import { PLACEHOLDER_TITLE, resolveTitle } from "./provisional-title";
import { SUGGESTIONS, WELCOME_FRAMING, WELCOME_NOTE, useGreeting } from "./welcome";
import type { ChatPage } from "./use-chat-page";
import { cn } from "@/lib/utils";

/** The blank-chat welcome — greeting + framing + composer + chips as one centred unit. Sets expectations
 *  about the deliberate no-subject grounding limitation (a blank chat has no fact block / tools yet).
 *  The words come from ./welcome, shared with the sidekick panel's empty state; the LAYOUT is this
 *  surface's own — a hero block with room to breathe, which the rail does not have. */
function Welcome({ chat }: { chat: ChatPage }) {
  const greeting = useGreeting();

  return (
    // ⚠ CENTRED WITH `my-auto`, NOT `justify-center`. This is a scroll container, and a flex container
    // that centres its overflowing content clips it at the TOP — unreachably, because you cannot scroll
    // above the start of the scrollport. Auto margins collapse to zero once the content no longer fits,
    // so the block sits in the middle when there is room and scrolls in full when there isn't — which is
    // what a hero composer grown to ten rows on a short viewport needs.
    <div className="custom-scrollbar flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 py-8">
      <div className="my-auto w-full max-w-2xl animate-in fade-in-0 slide-in-from-bottom-3 duration-500 motion-reduce:animate-none">
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

/** The desktop-only "bring the conversation rail back" control. Rendered ONLY while the rail is hidden —
 *  the matching collapse control lives in the rail's own header, so exactly one of the pair is ever on
 *  screen and neither is a second, competing way to do the same thing. It takes the slot the mobile back
 *  arrow occupies at the other breakpoint, so the header's left edge means one thing at every width:
 *  "back to your conversations". */
function ExpandRailButton({ onClick }: { onClick: () => void }) {
  const label = useShortcutLabel(SC_CONVERSATIONS);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Show conversations"
      title={`Show conversations (${label})`}
      aria-expanded={false}
      className="hidden size-8 shrink-0 place-items-center rounded-lg text-ink2 transition-colors hover:bg-surface-2 hover:text-ink md:grid"
    >
      <Icons.sidebarSimple className="size-4" />
    </button>
  );
}

export function ChatConversationPane({
  chat,
  session,
  provisionalTitle,
  onBack,
  onRename,
  railCollapsed,
  onExpandRail,
  onNew,
}: {
  chat: ChatPage;
  /** The active session's list metadata (title / subject) for the header, or null for a blank chat. */
  session: ChatSession | null;
  /** The reader's own first message, standing in for a title the server hasn't written yet (see
   *  provisional-title.ts). Null once there is a real one. */
  provisionalTitle: string | null;
  /** Mobile: return to the list. */
  onBack: () => void;
  /** Open the rename dialog for the active session. */
  onRename: (session: ChatSession) => void;
  /** Desktop: the conversation rail is hidden → offer to bring it back. */
  railCollapsed: boolean;
  onExpandRail: () => void;
  /** Start a blank conversation. Surfaced HERE only while the rail is folded away, because the "New"
   *  button lives in the rail's header — hiding the rail must not cost the reader the ability to start
   *  a conversation, and expanding it first to press New is a step that exists for no reason. */
  onNew: () => void;
}) {
  const newLabel = useShortcutLabel(SC_NEW_CHAT);
  const showWelcome = chat.phase === "blank" && chat.messages.length === 0;
  // §THE SWAP — the reader's own words the instant they send, the server's identical truncation when the
  // exchange lands (no visible change), then the model's short title, once, later. A rename outranks all
  // three. resolveTitle owns that order; this surface only renders its answer.
  const title = resolveTitle(session?.title, provisionalTitle) ?? PLACEHOLDER_TITLE;
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
          {/* slim bar — the mobile return-to-list arrow, and (desktop, only while the rail is hidden)
              the control that brings it back. A blank chat has no header to hang either one on. */}
          <div className={cn("flex shrink-0 items-center px-2 py-2", !railCollapsed && "md:hidden")}>
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations"
              className="grid size-8 place-items-center rounded-lg text-ink2 transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
            >
              <Icons.arrowLeft className="size-4" />
            </button>
            {railCollapsed && <ExpandRailButton onClick={onExpandRail} />}
          </div>
          <Welcome chat={chat} />
        </>
      ) : (
        <>
          {/* header */}
          <div className="flex min-w-0 shrink-0 items-center gap-2 border-b border-line px-3 py-3 sm:px-4">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink2 transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
            >
              <Icons.arrowLeft className="size-4" />
            </button>
            {railCollapsed && <ExpandRailButton onClick={onExpandRail} />}
            {/* ★ ONE LINE, ALWAYS — however long the title is. `truncate` needs an unbroken min-w-0
                chain above it to hold (this row, and the pane's section in chat-hub); without that a
                nowrap title becomes the widest thing on the page and pushes the transcript off a
                320px screen. The full text stays reachable: the native tooltip on a pointer, and a tap
                (which opens rename, where it sits in full in an editable field) on a touch screen. */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {session ? (
                <button
                  type="button"
                  onClick={() => onRename(session)}
                  title={title}
                  aria-label={`Rename conversation: ${title}`}
                  // py-1 makes the tap target the same 32px height as the back arrow beside it — a
                  // bare text baseline is a 24px target on a touch screen, and this one now does
                  // something when you hit it.
                  className="min-w-0 truncate rounded py-1 text-left font-display text-[16px] font-semibold text-ink transition-colors hover:text-ai-from"
                >
                  {/* keyed so a title that CHANGES under the reader (the provisional giving way to the
                      model's, mid-conversation) fades in rather than snapping — see §THE SWAP. */}
                  <span key={title} className="animate-in fade-in-0 duration-300 motion-reduce:animate-none">
                    {title}
                  </span>
                </button>
              ) : (
                <span className="min-w-0 truncate font-display text-[16px] font-semibold text-ink">{title}</span>
              )}
              {session?.subjectSymbol && (
                <span className="num inline-flex shrink-0 items-center rounded border border-line2 bg-surface-2 px-1.5 py-0.5 text-[10px] leading-none text-ink2">
                  {session.subjectSymbol}
                </span>
              )}
            </div>
            {railCollapsed && (
              <button
                type="button"
                onClick={onNew}
                aria-label="New conversation"
                title={`New conversation (${newLabel})`}
                className="hidden size-8 shrink-0 place-items-center rounded-lg text-ink3 transition-colors hover:bg-surface-2 hover:text-ink md:grid"
              >
                <Icons.plus className="size-4" />
              </button>
            )}
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
