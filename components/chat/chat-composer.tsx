"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CHAT COMPOSER — shared by the sidekick panel and the chat page. Multi-line, Enter to send (Shift+Enter
// for a newline), auto-growing, IME-safe (Hinglish / Devanagari candidate confirmation must not submit),
// disabled while generating/opening. The send action is a prop; the composer owns only its own input.
//
// TWO PLACEMENTS, ONE INPUT: `docked` (default) is the pinned-bottom bar with a top divider (the panel
// and an active conversation); `hero` is the centred input of the blank-chat welcome — no divider, part
// of the greeting block. Both share the `.chat-composer-field` AI focus state so it feels continuous.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { MAX_MESSAGE_LENGTH } from "./use-chat-conversation";

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

  // Auto-grow to fit content, capped so the transcript keeps its room.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  const submit = () => {
    if (!canSubmit) return;
    onSend(value);
    setValue("");
  };

  const field = (
    <div
      className={cn(
        "chat-composer-field flex items-end gap-2 rounded-2xl bg-surface-2/70",
        dense ? "py-1.5 pl-3 pr-1.5" : "py-2 pl-4 pr-2",
      )}
    >
      <textarea
        ref={ref}
        rows={1}
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
        className={cn(
          "min-h-6 flex-1 resize-none bg-transparent leading-relaxed text-ink outline-none placeholder:text-ink3 disabled:cursor-not-allowed disabled:opacity-60",
          variant === "hero"
            ? "max-h-40 h-[28px]! py-0.5 text-[14px]"
            : cn("max-h-35 h-[25px]", dense ? "text-[13px]" : "text-[13.5px]"),
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
    <div
      className={cn(
        "shrink-0 border-t border-line pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        dense ? "px-2.5 py-2.5" : "px-3 py-3",
      )}
    >
      {field}
      <div className={dense ? "mt-1" : "mt-1.5"}>{hint}</div>
    </div>
  );
}
