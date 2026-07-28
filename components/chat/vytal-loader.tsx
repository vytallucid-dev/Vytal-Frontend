"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE VYTAL LOADER — shown in the assistant's slot while a reply generates (typically 2–4s).
//
// It is the moment the product feels alive, so it is NOT a spinner: it is Vytal's own maker's-mark spark
// (Sparkle) breathing inside a blue→violet gradient ARC that orbits it — the same --ai-* identity as
// .ai-surface / .ai-badge — beside a line of STATUS TEXT that rotates while the wait runs. Read together:
// the orbit says "thinking", the words say what kind of thinking. It deliberately mirrors an assistant
// message's own layout (spark avatar + body) so it sits exactly where the reply will land.
//
// ★ THE TEXT REPLACED THREE SHIMMER BARS. The bars were honest but mute — they said "a reply is
// materializing" and nothing else, and a reader waiting 15s got no more from them than one waiting 2s.
// The words carry that same texture AND give the long wait somewhere to go. What they do NOT do is
// report: there is no progress to observe (no streaming transport — the guardrail needs the whole
// message first), so every line is written to claim nothing. generation-status.ts owns that rule.
//
// REDUCED MOTION — the global prefers-reduced-motion rule halts every animation. Here that means the
// shimmer sweep and the crossfade are both dropped; the text still ROTATES, because the rotation is the
// information (and the long-wait switch is the reassurance), while the fading was only decoration.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useGenerationStatus } from "./generation-status";
import { useReducedMotion } from "./use-progressive-reveal";

/** The breathing spark inside the orbiting gradient ring — the loader's avatar (and Vytal's mark). */
export function VytalSpark({ className, dense = false }: { className?: string; dense?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <span
      aria-hidden
      className={cn(
        "ai-orbit relative grid shrink-0 place-items-center rounded-full bg-surface-2",
        dense ? "size-6" : "size-7",
        className,
      )}
    >
      <Icons.spark
        weight="fill"
        className={cn(dense ? "size-3" : "size-3.5", "text-ai-from", !reduced && "ai-orbit__spark")}
      />
    </span>
  );
}

export function VytalLoader({ dense = false }: { dense?: boolean }) {
  const reduced = useReducedMotion();
  const { text, longWait } = useGenerationStatus();

  const sizeCls = cn("leading-relaxed", dense ? "text-[12.5px]" : "text-[13px]");
  // ★ THE LONG-WAIT LINE KEEPS THE SHIMMER TOO. It is still loading text, and 15s in is precisely when a
  //   frozen line reads as hung — the moving band is what says "still working", which is the whole job of
  //   that phase. Only reduced motion drops it, and then it settles to ordinary ink2 rather than leaving
  //   transparent text lit by a halted gradient.
  const inkCls = reduced ? "text-ink2" : "ai-text-shimmer";

  return (
    <div className={cn("flex items-center", dense ? "gap-2" : "gap-2.5")} role="status" aria-live="polite">
      <VytalSpark dense={dense} />

      {/* ★ THE ROTATION IS HIDDEN FROM ASSISTIVE TECH, DELIBERATELY. This is a live region, so announcing
          every swap would read six changing phrases over one wait — noise that tells a screen-reader user
          strictly less than one stable sentence. So the visible line is aria-hidden and the live region
          carries a fixed string, which changes exactly once: when the wait becomes long, which is the one
          moment the announcement is worth making. */}
      {reduced ? (
        <span className={cn(sizeCls, inkCls)} aria-hidden>
          {text}
        </span>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {/* mode="wait" fades the old line fully OUT before the new one comes in, so two phrases are
              never on screen at once — a true crossfade would overlap them mid-word. */}
          <motion.span
            key={text}
            aria-hidden
            className={sizeCls}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {/* ⚠ THE SWEEP LIVES ON AN INNER NODE, NOT ON THE ANIMATED ONE. framer-motion drives this
                span's opacity and transform, which promotes it to its own compositing layer — and
                background-clip:text on a composited, transformed element is exactly the combination
                that renders as INVISIBLE text in some engines. Keeping the two effects on separate
                elements makes each one ordinary. */}
            <span className={inkCls}>{text}</span>
          </motion.span>
        </AnimatePresence>
      )}

      <span className="sr-only">{longWait ? "This is taking a while. Vytal is still working." : "Vytal is thinking…"}</span>
    </div>
  );
}
