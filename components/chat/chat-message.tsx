"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CHAT MESSAGE RENDERING — the presentational pieces SHARED by the sidekick panel and the chat page, so
// the two surfaces render a turn identically. Pure view: a user bubble, an assistant turn (spark + prose
// with the progressive reveal), the quota "unavailable" notice, and the transport-error retry.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { ChatUnavailable } from "@/types/chat";
import type { UiMessage } from "./use-chat-conversation";
import { MarkdownView, useMarkdown } from "./markdown";
import { hasBeenDelivered, markDelivered, useTypeReveal } from "./use-progressive-reveal";

/** Vytal's static maker's-mark — the avatar on settled assistant turns (the loader uses the ORBITING one,
 *  so motion always means "thinking"). `dense` is the sidekick rail's step down (see chat-transcript). */
export function SparkAvatar({ dense = false }: { dense?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-line2 bg-surface-2 text-ai-from",
        dense ? "size-6" : "size-7",
      )}
      style={{ boxShadow: "0 0 14px -7px var(--ai-glow)" }}
    >
      <Icons.spark weight="fill" className={dense ? "size-3" : "size-3.5"} />
    </span>
  );
}

/** One transcript turn. User turns are right-aligned bubbles; assistant turns are Vytal's voice (spark +
 *  rendered markdown) and progressively reveal when freshly generated (reveal:true & motion allowed). */
export function MessageBubble({
  message,
  reduced,
  skipSignal,
  onGrow,
  onRetryMessage,
  retryDisabled = false,
  dense = false,
}: {
  message: UiMessage;
  reduced: boolean;
  /** Advances when the reader scrolls up / taps / sends again → finalize an in-flight reveal. */
  skipSignal: number;
  onGrow: () => void;
  /** Re-send a denied (never-delivered) user turn. */
  onRetryMessage?: (id: string) => void;
  /** Sending is impossible right now (still capped, or a reply is generating) → the retry is inert. */
  retryDisabled?: boolean;
  /** The narrow-rail type scale (the sidekick panel). */
  dense?: boolean;
}) {
  // ★ REVEAL ONCE, EVER — the fourth instant-render case, and the one that is about TIME rather than
  //   about the message. The other three are properties of what is being rendered (a user turn, loaded
  //   history, reduced motion); this one says a message that has already played must never play again,
  //   however many times its bubble is mounted. See use-progressive-reveal §THE DELIVERED REGISTRY for
  //   why the panel needs it and the page never did.
  //
  //   ⚠ READ IN RENDER, MARK IN AN EFFECT — the same StrictMode discipline as `seenSkip` below, for the
  //   same reason. Reading is pure, so React's double render just reads twice and the ref keeps the first
  //   answer for this instance's whole life. Marking in an effect means the write can never feed back
  //   into the `enabled` we are about to reveal with — only into the NEXT mount's.
  const alreadyDelivered = useRef(hasBeenDelivered(message.id)).current;
  const enabled = message.role === "assistant" && message.reveal && !reduced && !alreadyDelivered;
  useEffect(() => {
    if (enabled) markDelivered(message.id);
  }, [enabled, message.id]);

  // Parse markdown once (only assistant turns render as markdown; user text stays literal).
  const parsed = useMarkdown(message.role === "assistant" ? message.content : "");
  const { count, isRevealing, skip } = useTypeReveal(parsed.total, { enabled });

  // External skip — act only when the signal actually ADVANCES past the value this bubble last saw. A
  // "first run" boolean flag would be defeated by React StrictMode's mount-time double effect invocation
  // (setup→cleanup→setup): the second setup would pass the flag and finalize the reveal instantly.
  // Seeding a ref with the mount-time signal makes mounting a no-op however many times the effect runs.
  const seenSkip = useRef(skipSignal);
  useEffect(() => {
    if (skipSignal !== seenSkip.current) {
      seenSkip.current = skipSignal;
      skip();
    }
  }, [skipSignal, skip]);

  // Keep the view pinned to the newest text as each unit (a typed grapheme or a block) appears.
  useEffect(() => {
    onGrow();
  }, [count, onGrow]);

  if (message.role === "user") {
    // ★ A DENIED TURN MUST NOT LOOK DELIVERED. Three signals, because any one alone is deniable: the
    //   bubble recedes (dashed hairline + dimmed), it says so in words underneath with its own retry, and
    //   the reason sits below it in the assistant's own slot — where the missing reply would have been.
    //   All three are per-row on purpose: with several messages in a transcript the reader has to be able
    //   to tell WHICH ones went unanswered, and all three come off a PERSISTED row, so a refresh redraws
    //   exactly this.
    return (
      <div className={cn("flex flex-col", dense ? "gap-1.5" : "gap-2")}>
        <div className="flex flex-col items-end gap-1">
          <div
            className={cn(
              "whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-md border border-line2 bg-surface-2 leading-relaxed text-ink",
              dense ? "max-w-[88%] px-3 py-2 text-[14px]" : "max-w-[85%] px-3.5 py-2.5 text-[15.5px]",
              message.denied && "border-dashed border-line3 bg-surface-2/40 text-ink3",
            )}
          >
            {message.content}
          </div>
          {message.denied && (
            <div className={cn("flex items-center gap-1.5 pr-0.5 text-ink3", dense ? "text-[10.5px]" : "text-[11px]")}>
              <Icons.warning className={dense ? "size-3" : "size-3.5"} />
              <span>Not sent</span>
              {onRetryMessage && (
                <>
                  <span aria-hidden>·</span>
                  <button
                    type="button"
                    onClick={() => onRetryMessage(message.id)}
                    disabled={retryDisabled}
                    aria-label="Send this message again"
                    className="rounded font-medium text-ink2 underline decoration-line3 underline-offset-2 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:text-ink3 disabled:no-underline disabled:opacity-60"
                  >
                    Retry
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {message.denied && message.denial && <UnavailableNotice info={message.denial} dense={dense} />}
      </div>
    );
  }

  return (
    <div className={cn("flex items-start", dense ? "gap-2" : "gap-2.5")}>
      <SparkAvatar dense={dense} />
      <div className="min-w-0 flex-1 pt-0.5">
        <MarkdownView
          parsed={parsed}
          revealed={isRevealing ? count : parsed.total}
          showCaret={isRevealing}
          animate={isRevealing}
          dense={dense}
        />
      </div>
    </div>
  );
}

/** The precise reset time, on THE READER'S OWN CLOCK — the concrete supplement to the server's in-voice
 *  `message`. Absent / malformed → null (caller shows the message alone, never "Invalid Date"). We say the
 *  day ("tomorrow") only when it isn't today, so the clock time is never mistaken for a same-day one.
 *
 *  ★ THE READER'S ZONE, NOT A PINNED ONE. `resetAt` is an INSTANT (a US-Pacific midnight, because that is
 *  where the free tier's window turns over) — but an instant is not a wall clock, and the only wall clock
 *  a reader can act on is the one on their own machine. So no `timeZone` and no locale are passed at all:
 *  Intl then formats in the browser's resolved zone and the reader's own conventions (24-hour where that
 *  is the norm, their own meridiem where it isn't). Pinning it to Asia/Kolkata was right for exactly one
 *  audience and quietly wrong — by hours — for everyone else, including the same reader travelling.
 *
 *  ★ AND THE ZONE IS NAMED IN THE STRING — as an ABBREVIATION a person uses ("IST", "BST", "PDT"), never
 *  as an offset. `timeZoneName: "short"` alone is not enough: Chrome answers it with "GMT+5:30" for most
 *  zones, and an offset is arithmetic, not a timezone anyone says out loud. See zoneAbbrev.
 *
 *  ⚠ CLIENT-RESOLVED, SO IT MUST NOT BE SERVER-RENDERED. Both callers only ever render after a fetch or a
 *  send has answered, so this never runs during prerender and cannot cause a hydration mismatch. If it is
 *  ever called in a first paint, defer it the way welcome.ts §useGreeting defers the greeting. */
/**
 * The reader's own timezone, as the abbreviation they would say — "IST", "BST", "PDT", "AEST".
 *
 * Two attempts, because no single Intl option gives this everywhere:
 *   1. `short`, which is the real abbreviation on the platforms that have one (Node says "IST"; Chrome
 *      says "PDT" for US zones) — but answers "GMT+5:30" for most of the world, which is an OFFSET. An
 *      offset is not a timezone a person recognises, and it is precisely what a reader in Delhi should
 *      never be shown to describe their own clock.
 *   2. So when attempt 1 returns arithmetic, take the INITIALS OF THE LONG NAME — which is exactly how
 *      these abbreviations are formed: "India Standard Time" → IST, "British Summer Time" → BST,
 *      "Australian Eastern Standard Time" → AEST.
 *
 * Computed in en-US on purpose, so the abbreviation is the canonical one rather than a transliteration
 * of whatever the reader's locale calls the zone — the surrounding sentence is English either way. If
 * neither attempt yields a name (an unnamed zone), the caller shows the time with no zone at all: a bare
 * local time is honest, "GMT+5:30" is not helpful.
 */
function zoneAbbrev(d: Date): string | null {
  const named = (style: "short" | "long"): string =>
    new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZoneName: style })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  const isOffset = (s: string) => s === "" || /^(GMT|UTC)/i.test(s);

  const short = named("short");
  if (!isOffset(short)) return short;

  const long = named("long");
  if (isOffset(long)) return null;
  const initials = long
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .map((w) => w[0].toUpperCase())
    .join("");
  return initials.length >= 2 ? initials : null;
}

export function formatResetHint(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const zone = zoneAbbrev(d);
  const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })
    .format(d)
    // Some locales render a lowercase meridiem ("12:30 pm"); uppercase it for this surface.
    .replace(/(\d)\s*([ap]m)\b/i, (_m, digit: string, p: string) => `${digit} ${p.toUpperCase()}`);
  const time = zone ? `${clock} ${zone}` : clock;
  // "Tomorrow" is decided on the reader's calendar too — the same clock the time above is on.
  const dayKey = (x: Date) =>
    new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(x);
  const tomorrow = dayKey(d) !== dayKey(new Date());
  return `Resets around ${time}${tomorrow ? " tomorrow" : ""}.`;
}

/** The composer's one-line explanation of why its input is dead. Terse by design — the transcript notice
 *  above it carries the server's in-voice line and the reset context; this only has to say "not you, and
 *  not forever". Scope-aware because "you've used yours" and "everyone has used theirs" are different
 *  facts to the reader; a null scope takes the system phrasing (the safe, non-accusatory one). */
export function composerQuotaNote(info: ChatUnavailable): string {
  const lead = info.scopeDenied === "user" ? "You've reached today's message limit." : "Vytal is at its daily limit.";
  const hint = formatResetHint(info.resetAt);
  return hint ? `${lead} ${hint}` : `${lead} Please try again later.`;
}

/** Quota denied — the server's own calm, in-voice line (already scope-aware: personal vs system, and
 *  already TENSE-aware: a remembered denial whose window has passed arrives in the past tense with
 *  `resetAt` null), rendered as an ordinary assistant turn in the slot the missing reply would have
 *  occupied. The message LEADS; the precise reset time SUPPLEMENTS it, and disappears with it. We do not
 *  branch on scopeDenied here — the server owns that distinction in `message`. */
export function UnavailableNotice({ info, dense = false }: { info: ChatUnavailable; dense?: boolean }) {
  const resetHint = formatResetHint(info.resetAt);
  return (
    <div className={cn("flex items-start", dense ? "gap-2" : "gap-2.5")}>
      <SparkAvatar dense={dense} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={cn("leading-relaxed text-ink2", dense ? "text-[14px]" : "text-[15.5px]")}>{info.message}</p>
        {resetHint && (
          <p className={cn("mt-1 leading-relaxed text-ink3", dense ? "text-[11.5px]" : "text-[12px]")}>{resetHint}</p>
        )}
      </div>
    </div>
  );
}

/** A follow-up that failed at the transport layer — an inline retry in the assistant's slot. */
export function SendErrorNotice({ onRetry, dense = false }: { onRetry: () => void; dense?: boolean }) {
  return (
    <div className={cn("flex items-start", dense ? "gap-2" : "gap-2.5")}>
      <span
        aria-hidden
        className={cn(
          "grid shrink-0 place-items-center rounded-full border border-high/40 bg-high/10 text-high",
          dense ? "size-6" : "size-7",
        )}
      >
        <Icons.warning weight="fill" className={dense ? "size-3" : "size-3.5"} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={cn("leading-relaxed text-ink2", dense ? "text-[12.5px]" : "text-[13px]")}>
          That reply didn&apos;t come through.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <Icons.refresh className="size-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
