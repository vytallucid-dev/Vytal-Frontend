"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CHAT COMPOSER — shared by the sidekick panel and the chat page. Multi-line, Enter to send (Shift+Enter
// for a newline), auto-growing, IME-safe (Hinglish / Devanagari candidate confirmation must not submit),
// disabled while generating/opening. The send action is a prop; the composer owns only its own input.
//
// TWO PLACEMENTS, ONE INPUT: `docked` (default) is the pinned-bottom bar with a top divider (the panel
// and an active conversation); `hero` is the centred input of the blank-chat welcome — no divider, part
// of the greeting block. Both share the `.chat-composer-field` AI focus state so it feels continuous.
//
// ★ THE FIELD GROWS WITH THE TEXT, THEN SCROLLS — see §GROWTH. There is exactly ONE implementation of
// that behaviour, here, because there is exactly one composer: the panel, the chat page's docked bar and
// the blank-chat hero are three PROPS of this component, not three inputs. A pasted paragraph therefore
// behaves identically on all of them, which is the only way it can stay true of all of them.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { MAX_MESSAGE_LENGTH } from "./use-chat-conversation";

// ── §GROWTH ────────────────────────────────────────────────────────────────────────────────────────
// The cap is expressed in ROWS, not pixels. The three placements run at three type sizes (hero 14px,
// the page's docked field 13.5px, the rail's dense one 13px), so a fixed pixel ceiling would mean a
// different amount of readable text on each. Rows of the field's OWN computed line-height mean the same
// thing everywhere: ten lines of what you are actually typing.
const MAX_ROWS = 10;
// ⚠ AND NEVER MORE THAN THIS SHARE OF THE VISUAL VIEWPORT. With a phone keyboard up, the visible page is
// roughly half the window; a desktop-tuned ten-row cap would swallow all of it and leave the reader
// typing into a box with no conversation above it. `visualViewport.height` is the only measure that
// tracks the keyboard (window.innerHeight does not move on iOS), so the cap is the SMALLER of the two —
// which means the cap is ~10 rows on a laptop, ~5–6 rows on a phone with the keyboard open, and back to
// 10 the moment the keyboard is dismissed. Nothing has to detect "mobile" for that to be true.
const MAX_VIEWPORT_SHARE = 0.35;
// The floor the viewport share may never push the cap below — a landscape phone must still show two
// lines of what is being typed, even if that costs it a little of the transcript.
const MIN_ROWS = 2;

/** Marks every chat input, so `focusChatComposer` can find the one on screen without either surface
 *  having to hand a ref up to whatever wants to put the cursor there. */
const COMPOSER_MARK = "data-chat-composer";

/**
 * Put the cursor in the chat input — the keyboard layer's way of saying "start typing to Vytal".
 *
 * ★ FINDS THE VISIBLE ONE, WHICH IS THE WHOLE DIFFICULTY. Several composers can exist in the DOM at
 *   once (the chat page keeps its conversation pane mounted behind the mobile list; the panel keeps
 *   its own), and a focus() call on a display:none field silently does nothing while looking like it
 *   worked. `getClientRects()` is empty for exactly those, and non-empty for the one on screen.
 *
 * ★ AND RETRIES ACROSS TWO FRAMES, because the caller is usually the thing that just made the composer
 *   exist — a panel opening, a route arriving. Disabled fields (a reply in flight, the daily cap) are
 *   skipped by the selector, so this is a no-op exactly when typing would be.
 */
export function focusChatComposer(): void {
  const attempt = (): boolean => {
    const fields = document.querySelectorAll<HTMLTextAreaElement>(
      `textarea[${COMPOSER_MARK}]:not([disabled])`,
    );
    const el = Array.from(fields).find((f) => f.getClientRects().length > 0);
    if (!el) return false;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length); // caret after any draft already there
    return true;
  };
  if (attempt()) return;
  requestAnimationFrame(() => {
    if (!attempt()) requestAnimationFrame(attempt);
  });
}

export function ChatComposer({
  onSend,
  disabled,
  placeholder,
  notice,
  variant = "docked",
  autoFocus = false,
  dense = false,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
  /** Why the input is dead, when it is dead for a reason worth stating (the daily cap). Takes the hint
   *  line's place — a disabled field explaining "Enter to send" is the one thing it must not say. */
  notice?: string | null;
  variant?: "docked" | "hero";
  autoFocus?: boolean;
  /** The narrow-rail step down, matching the transcript above it (chat-transcript §DENSE). Docked only. */
  dense?: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSubmit = value.trim().length > 0 && !disabled;

  // Measure → grow → cap → decide whether the field scrolls. Reading the line-height off the element
  // rather than hard-coding it is what lets one constant (MAX_ROWS) hold for all three type scales.
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || 20;
    const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const viewport = window.visualViewport?.height ?? window.innerHeight;
    const cap = Math.max(
      MIN_ROWS * line + pad,
      Math.min(MAX_ROWS * line + pad, viewport * MAX_VIEWPORT_SHARE),
    );
    // height:auto first, or scrollHeight reports the height we last SET, and the field could then only
    // ever grow — deleting text would leave the box tall and mostly empty.
    const prevScroll = el.scrollTop;
    el.style.height = "auto";
    const needed = el.scrollHeight;
    el.style.height = `${Math.min(needed, cap)}px`;
    // Only a field that has actually hit the ceiling scrolls; below it, an overflow:auto textarea can
    // still flicker a scrollbar on the row that straddles the boundary.
    el.style.overflowY = needed > cap ? "auto" : "hidden";
    // ⚠ AND PUT THE VIEW BACK. Measuring at height:auto removes the overflow for an instant, which zeroes
    //   scrollTop — so a message past the ceiling would snap to its FIRST line after every keystroke,
    //   leaving the reader typing blind at the bottom. Caret at the end (ordinary typing) ⇒ follow it;
    //   caret anywhere else (editing mid-message) ⇒ leave the reader where they were looking.
    if (needed > cap) {
      el.scrollTop = el.selectionStart === el.value.length ? el.scrollHeight : prevScroll;
    }
  }, []);

  // Before paint, so growth never shows as a one-frame jump on the row that pushed it over.
  useLayoutEffect(() => {
    resize();
  }, [value, dense, variant, resize]);

  // The cap is viewport-derived, so it has to be re-taken when the viewport changes — a rotation, a
  // desktop window resize, and (the one that matters) the phone keyboard opening or closing.
  useEffect(() => {
    const vv = window.visualViewport;
    window.addEventListener("resize", resize);
    vv?.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      vv?.removeEventListener("resize", resize);
    };
  }, [resize]);

  const submit = () => {
    if (!canSubmit) return;
    onSend(value);
    setValue("");
  };

  const field = (
    // items-end keeps the send button on the FIELD'S LAST LINE as the text grows: the button travels
    // down with the box instead of floating beside the middle of a ten-line paragraph.
    <div
      className={cn(
        "chat-composer-field flex items-end gap-2 rounded-2xl bg-surface-2/70",
        dense ? "py-1.5 pl-3 pr-1.5" : "py-2 pl-4 pr-2",
      )}
    >
      <textarea
        ref={ref}
        rows={1}
        {...{ [COMPOSER_MARK]: "" }}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends — UNLESS Shift is held (newline) or an IME composition is active (confirming a
          // Devanagari / mixed-script candidate must never submit).
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={MAX_MESSAGE_LENGTH}
        aria-label="Message Vytal"
        // ⚠ NO `h-*` UTILITY AND NO `max-h-*` HERE. The height is owned by resize() above; a Tailwind
        // height would either be overridden every keystroke (dead code) or — as `h-[28px]!` was —
        // beat the inline style outright and pin the field to one line, which is exactly how a pasted
        // paragraph ended up scrolled and clipped mid-word. `min-h` is the resting height only.
        className={cn(
          "custom-scrollbar min-w-0 flex-1 resize-none bg-transparent leading-relaxed text-ink outline-none placeholder:text-ink3 disabled:cursor-not-allowed disabled:opacity-60",
          variant === "hero"
            ? "min-h-7 py-0.5 text-[14px]"
            : cn("min-h-6.25", dense ? "text-[13px]" : "text-[13.5px]"),
        )}
      />
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        aria-label="Send"
        className={cn(
          "grid shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40",
          dense ? "size-7" : "size-8",
        )}
      >
        <Icons.send className={dense ? "size-3.5" : "size-4"} />
      </button>
    </div>
  );

  // The cap note replaces the keyboard hint rather than joining it: both at once is two lines of small
  // grey text under a field that cannot be typed into, and only one of them is true.
  const hint = notice ? (
    <p className="flex items-start gap-1.5 px-1 text-[10.5px] leading-snug text-ink3" role="status">
      <Icons.info className="mt-px size-3 shrink-0" />
      <span>{notice}</span>
    </p>
  ) : (
    <p className="px-1 text-[10px] text-ink3">Enter to send · Shift+Enter for a new line</p>
  );

  if (variant === "hero") {
    return (
      <div className="w-full">
        {field}
        <div className="mt-2 text-center">{hint}</div>
      </div>
    );
  }

  return (
    // shrink-0 against the transcript above: the bar takes the height it needs and the CONVERSATION
    // gives it up, so neither the send button nor the hint line can ever be pushed off the bottom.
    <div
      className={cn(
        "shrink-0 border-t border-line pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        dense ? "px-2.5 py-2.5" : "px-3 py-3",
      )}
    >
      {/* The page's docked bar holds the transcript's own reading measure (chat-transcript: max-w-200
          with p-4 ⇒ a 768px column), so the input stays under the messages it answers however wide the
          pane gets — which is what makes collapsing the conversation rail safe. The rail's dense
          composer is already narrower than that and is left alone. */}
      <div className={cn(!dense && "mx-auto w-full max-w-3xl")}>
        {field}
        <div className={dense ? "mt-1" : "mt-1.5"}>{hint}</div>
      </div>
    </div>
  );
}
