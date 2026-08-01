"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE SIDEKICK PANEL — a right-hand rail, the app sidebar's mirror image. Not a sheet: nothing is
// blocked, nothing is dimmed, and the page between the two rails stays fully usable while Vytal talks.
//
// ★ HOW IT MOVES WITHOUT SHAKING THE PAGE. Two elements, one transition. A zero-height SPACER sits in
// the shell's flex row and animates its WIDTH — that is what squeezes the content region. The panel
// itself is FIXED and animates TRANSFORM only. Animating the real panel's width would re-layout and
// re-wrap every line of the transcript on every frame; a transform is composited and costs nothing. Both
// run the same duration and curve, so the rail lands exactly as the space finishes opening. This is the
// same split the app sidebar already uses (its `sidebar-gap` div vs its fixed container) — mirrored.
//
// The conversation itself is NOT this file's business. The transcript, the composer, the loader, the
// progressive reveal and every send state are the shared components under components/chat, driven by the
// provider's useSidekickChat. This file owns the chrome: the rail, the header, and the states around the
// conversation (opening / loading / failed-to-open).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { AnimatePresence, motion } from "framer-motion";
import { ChatTranscript } from "@/components/chat/chat-transcript";
import { ChatComposer } from "@/components/chat/chat-composer";
import { composerQuotaNote } from "@/components/chat/chat-message";
import { PLACEHOLDER_TITLE, resolveTitle } from "@/components/chat/provisional-title";
import { SUGGESTIONS, WELCOME_FRAMING, WELCOME_NOTE_SHORT, useGreeting } from "@/components/chat/welcome";
import { QueryError } from "@/components/ui/query-error";
import { useChatSessions } from "@/lib/api/hooks/use-chat-sessions";
import { Icons } from "@/lib/icons";
import { useSidekick, useSidekickActions } from "./sidekick-provider";
import { SidekickConversationManager } from "./sidekick-conversation-manager";

/** The rail's FOOTPRINT on desktop — what the spacer takes out of the page. The visible panel is 16px
 *  narrower than this, because the rail is inset 8px on each side (see the floating treatment below), so
 *  the readable surface is 416px. Exactly how the app sidebar's floating variant relates its
 *  --sidebar-width to its p-2 inner panel. */
const PANEL_W = 400;
/** One curve for the spacer and the rail, so they can never drift apart mid-open. */
const EASE = [0.32, 0.72, 0, 1] as const;
const TRANSITION = { duration: 0.3, ease: EASE };

/**
 * A blank conversation — the SAME content as the chat page's welcome (greeting, framing, composer,
 * suggestions, the honest note), composed for a 350px column instead of an 800px one.
 *
 * THREE DECISIONS THE NARROW COLUMN FORCES:
 *
 *  · BOTTOM-ANCHORED, NOT CENTRED (`mt-auto`). The page can afford to float its welcome in the middle of
 *    the screen because the composer travels WITH the block. The rail's composer is already docked a few
 *    pixels below, so a centred block would leave a dead gap between the invitation and the input it is
 *    inviting you into. Pushed down, the whole thing reads as one unit — greeting, framing, suggestions,
 *    then the composer — which is exactly what the page's hero achieves by other means. It is why there
 *    is no second composer here: the docked one IS the composer this block is composed around.
 *
 *  · LEFT-ALIGNED, NOT CENTRED. Centred text needs width to look composed; at this column it just makes
 *    every line start somewhere different. Left-aligned, the block gains a spine — and the suggestions
 *    below it line up on that same spine.
 *
 *  · SUGGESTIONS AS ROWS, NOT PILLS. The page wraps four pills into a tidy two-line cloud. The same four
 *    at this width wrap into a ragged five-line stack of fragments. Full-width rows give each question
 *    one clean line or two, a real tap target, and a scannable list — a menu rather than a cloud.
 */
function BlankLeading({ onPick, canSend }: { onPick: (text: string) => void; canSend: boolean }) {
  const greeting = useGreeting();

  return (
    <div className="mt-auto flex flex-col px-1 pb-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
      <span className="ai-badge mb-3 flex w-fit" aria-hidden>
        <Icons.spark weight="fill" className="h-3 w-3" />
      </span>
      {/* min-h reserves the line while the greeting resolves client-side (welcome.ts §useGreeting). */}
      <h2 className="min-h-[1.15em] font-display text-[19px] font-semibold leading-tight tracking-tight text-ink">
        {greeting}
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">{WELCOME_FRAMING}</p>

      <div className="mt-4 flex flex-col gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            disabled={!canSend}
            className="group flex items-center gap-2 rounded-xl border border-line2 bg-surface-1/60 px-3 py-2 text-left text-[12.5px] leading-snug text-ink2 transition-colors hover:border-line3 hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="min-w-0 flex-1">{s}</span>
            <Icons.caretRight className="size-3 shrink-0 text-ink3 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      <p className="mt-4 text-[11.5px] leading-relaxed text-ink3">{WELCOME_NOTE_SHORT}</p>
    </div>
  );
}

/** Fetching a conversation the reader picked in the manager — brief; the orbiting mark reads as "loading". */
function LoadingLeading() {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-ink3" role="status">
      <span className="ai-orbit relative grid size-7 place-items-center rounded-full bg-surface-2" aria-hidden>
        <Icons.spark weight="fill" className="size-3.5 text-ai-from ai-orbit__spark" />
      </span>
      <span>Loading…</span>
    </div>
  );
}

export function SidekickPanel() {
  const { open, isMobile, chat } = useSidekick();
  const { close, setManagerOpen, goFullScreen } = useSidekickActions();
  const sessionsQ = useChatSessions();

  // The header title, most-live source first: the list (so a rename lands immediately), then the row the
  // open/load returned (a card-originated conversation is unpromoted, so it is NOT in the list yet), then
  // — for a BLANK conversation whose first message is still generating — the reader's own first message
  // standing in for the title the server hasn't written (provisional-title.ts), then the subject we are
  // opening on, then the honest blank-state label.
  const fromList = chat.sessionId ? sessionsQ.data?.find((s) => s.id === chat.sessionId)?.title : undefined;
  const title =
    resolveTitle(fromList ?? chat.session?.title, chat.provisionalTitle) ??
    chat.pendingLabel ??
    PLACEHOLDER_TITLE;
  const symbol = chat.session?.subjectSymbol ?? null;
  const failed = chat.phase === "openError" || chat.phase === "loadError";

  const placeholder = chat.sendBlock
    ? "Daily limit reached"
    : chat.generating
      ? "Vytal is replying…"
      : chat.phase === "loading"
        ? "Loading…"
        : "Ask a follow-up…";

  return (
    <>
      {/* THE SPACER — the only thing that moves the page. Hidden on mobile, where the rail is a full
          screen overlay and takes no width from anything. */}
      <motion.div
        aria-hidden
        className="hidden shrink-0 md:block"
        initial={false}
        animate={{ width: open ? PANEL_W : 0 }}
        transition={TRANSITION}
      />

      <AnimatePresence>
        {open && (
          <motion.aside
            key="sidekick"
            aria-label="Vytal"
            // FLOATING, like the app sidebar it mirrors: the fixed element takes the full footprint and
            // pads inward, so the visible rail sits off the viewport edges with its own hairline. The
            // animation is UNCHANGED by that — still a transform on this element and a width on the
            // spacer, never a width on the surface holding the transcript.
            className="fixed inset-y-0 right-0 z-30 flex w-full md:w-(--sidekick-w) md:p-2"
            style={{ "--sidekick-w": `${PANEL_W}px` } as React.CSSProperties}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={TRANSITION}
          >
            {/* Mobile keeps the full-bleed screen — an inset rail on a 375px viewport is just lost room.
                `relative` makes this the manager's positioning parent on mobile. */}
            <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden border-line bg-surface-1 md:rounded-lg md:border md:shadow-sm">
              {/* ── header — title left (opens the manager), full-screen + close right ── */}
              <div className="flex shrink-0 items-center gap-1 border-b border-line px-2 py-2.5">
                <button
                  type="button"
                  onClick={() => setManagerOpen(true)}
                  aria-haspopup="dialog"
                  title="All conversations"
                  className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="ai-badge shrink-0" aria-hidden>
                    <Icons.spark weight="fill" className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 truncate font-display text-[14px] font-semibold text-ink">{title}</span>
                  {symbol && (
                    <span className="num inline-flex shrink-0 items-center rounded border border-line2 bg-surface-2 px-1.5 py-0.5 text-[10px] leading-none text-ink2">
                      {symbol}
                    </span>
                  )}
                  <Icons.caretDown className="size-3.5 shrink-0 text-ink3 transition-colors group-hover:text-ink2" />
                </button>

                <button
                  type="button"
                  onClick={goFullScreen}
                  aria-label="Open full screen"
                  title="Open full screen"
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-ink3 transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <Icons.arrowsOutSimple className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close Vytal"
                  title="Close"
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-ink3 transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <Icons.close className="size-4" />
                </button>
              </div>

              {/* the server picked up an existing thread for this subject rather than starting one */}
              {chat.resumed && (
                <div className="shrink-0 px-4 pt-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-surface-2 px-2.5 py-1 text-[10.5px] text-ink3">
                    <Icons.history className="size-3" />
                    Picking up where you left off
                  </span>
                </div>
              )}

              {failed ? (
                <div className="grid min-h-0 flex-1 place-items-center p-4">
                  <QueryError
                    message={
                      chat.phase === "openError"
                        ? "We couldn't start this conversation."
                        : "We couldn't load this conversation."
                    }
                    onRetry={chat.retry}
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
                  // The rail's column is less than half the page's — everything the transcript renders
                  // steps down one size (chat-transcript §DENSE).
                  dense
                  leading={
                    chat.phase === "loading" ? (
                      <LoadingLeading />
                    ) : chat.phase === "blank" ? (
                      <BlankLeading onPick={chat.send} canSend={chat.canSend} />
                    ) : undefined
                  }
                />
              )}

              <ChatComposer
                onSend={chat.send}
                disabled={!chat.canSend}
                placeholder={placeholder}
                notice={chat.sendBlock ? composerQuotaNote(chat.sendBlock) : null}
                dense
              />

              {/* MOBILE HOST for the manager. There is no content region to spare here — the rail IS the
                  screen — so it takes the whole panel. On desktop the manager mounts in MainShell instead,
                  over the content only, so this conversation stays visible beside it. */}
              {isMobile && <SidekickConversationManager fullBleed />}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
