"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// GENERATION STATUS — the rotating line under Vytal's spark while a reply is being produced. Shared by
// the sidekick panel and the chat page (both render it through VytalLoader), so the wait reads the same
// on both surfaces.
//
// ★★★ THE RULE THESE LINES ARE WRITTEN TO ★★★
// There is no streaming transport — deliberately: the guardrail must see the whole message before any of
// it is shown (see use-progressive-reveal). So NOTHING here can be a report. There is no observable
// progress to narrate, and a line that implied otherwise would be the one dishonest thing in a product
// whose whole position is that it doesn't do that.
//
// So these are TEXTURE, not reporting, and the line they respect is: ⚠ NO MESSAGE MAY DESCRIBE A PROCESS
// THAT ISN'T HAPPENING. Every line below is something a THINKING READER does — mulling, joining dots,
// working it out — never a system operation on a named dataset. That is exactly why "crunching the
// numbers", "checking the market" and "analysing fundamentals" are out while "doing the maths" is in:
// the first three claim a machine step against real data that may never have run; the last is the
// register of a person thinking, which is the only claim being made and is always true.
//
// ⚠ BEFORE ADDING A LINE, ask: does it name a dataset, a tool, or a step the server may not have taken?
// If yes, it is a lie ~half the time and it does not go in this list, however good it sounds.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";

/**
 * The rotating pool. Bare phrases — the trailing ellipsis is added at render (see `statusText`), so the
 * punctuation rule lives in one place instead of seventeen.
 *
 * Grouped by flavour only for reading; the pick is uniform across the whole list.
 */
export const GENERATION_MESSAGES = [
  // ── Vytal's own vocabulary. Safe because these name the LENS, not a dataset: the pillars, the field
  //    and the read are in the context layer on every single turn, so "consulting the pillars" is true
  //    of a conceptual question and a grounded one alike.
  "Consulting the pillars",
  "Reading the field",
  "Squaring it up",
  "Weighing the read",

  // ── market texture ──
  "Reading the tape",
  "Doing the maths",
  "Sifting the numbers",
  "Turning the pages",
  "Joining the dots",
  "Following the thread",
  "Lining things up",
  "Piecing it together",

  // ── neutral ──
  "Thinking it through",
  "Mulling it over",
  "Getting my bearings",
  "Working it out",
  "Chewing on it",
] as const;

/** After LONG_WAIT_MS the rotation STOPS and this stands alone. No ellipsis, deliberately: the ellipsis
 *  below means "still going", and this is not another step — it is an explanation of the wait. It also
 *  never promises imminence ("nearly there" would be a guess about something we cannot see). */
export const LONG_WAIT_MESSAGE = "This one's taking a while";

// ── TIMING, TUNED AGAINST REAL TURNS ────────────────────────────────────────────────────────────────
// Most turns land in 2–4s, so the DEFAULT experience must be one calm line, not a flicker. That is what
// the long first hold buys: at 3.5s the median turn finishes before anything has changed, and rotation
// only ever shows up on the turns that actually run long. A uniform 2.5s cadence would have swapped the
// line ~1s before a typical reply arrived — motion with nothing behind it, and the exact "rotation
// implies progress that isn't real" failure this is meant to avoid.
//
// A boundary flash is unavoidable in principle (a reply can always land 200ms after a swap); putting the
// first boundary at 3.5s pushes that window past the bulk of the distribution rather than into it.

/** The first line holds through the median turn. */
export const FIRST_HOLD_MS = 3500;
/** Every line after it. Slightly slower than a read-and-notice beat, so it never feels agitated. */
export const ROTATE_MS = 2750;
/** Rotation stops here and LONG_WAIT_MESSAGE takes over for the rest of the turn. Roughly 4× the median:
 *  by now the reader wants reassurance it isn't stuck, not more character. */
export const LONG_WAIT_MS = 15000;

export interface GenerationStatus {
  /** The line to show, punctuation included. */
  text: string;
  /** True once the wait crossed LONG_WAIT_MS — the caller drops the shimmer so it reads as plain. */
  longWait: boolean;
}

const statusText = (message: string): string => `${message}…`;

/**
 * The next line's index, given the current one.
 *
 * ★ NO BACK-TO-BACK REPEAT, BY CONSTRUCTION. Stepping forward by a random 1..n-1 is uniform over every
 * line EXCEPT the current one — so the "did it just say that?" moment is impossible, and there is no
 * re-draw loop that could in principle spin. Exported (and `rand` injectable) so the property is
 * checkable rather than merely intended.
 */
export function nextIndex(current: number, rand: () => number = Math.random): number {
  const n = GENERATION_MESSAGES.length;
  return (current + 1 + Math.floor(rand() * (n - 1))) % n;
}

/**
 * Drive the status line for ONE turn.
 *
 * ★ THE CLOCK STARTS AT MOUNT AND IS NEVER RESTARTED. VytalLoader mounts when the turn begins and
 *   unmounts when the reply lands, so a guardrail retry — which happens INSIDE the single POST and
 *   roughly doubles the turn — cannot reach this. Elapsed is elapsed, structurally, with nothing to
 *   remember to not-reset.
 */
export function useGenerationStatus(): GenerationStatus {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * GENERATION_MESSAGES.length));
  const [longWait, setLongWait] = useState(false);

  useEffect(() => {
    let rotator: ReturnType<typeof setInterval> | undefined;

    // The draw happens HERE, in the timer callback, and is then fed to a PURE updater. An updater that
    // called Math.random() itself would be double-invoked by StrictMode and give two different answers
    // for one rotation; freezing the draw first makes the updater idempotent, which is what React needs.
    const rotate = () => {
      const draw = Math.random();
      setIndex((i) => nextIndex(i, () => draw));
    };

    const first = setTimeout(() => {
      rotate();
      rotator = setInterval(rotate, ROTATE_MS);
    }, FIRST_HOLD_MS);

    // Its own timer rather than a check inside the rotation, so the switch lands AT 15s rather than at
    // whichever rotation boundary happens to follow it (which would be ~17s).
    const long = setTimeout(() => {
      clearTimeout(first);
      if (rotator) clearInterval(rotator);
      setLongWait(true);
    }, LONG_WAIT_MS);

    return () => {
      clearTimeout(first);
      clearTimeout(long);
      if (rotator) clearInterval(rotator);
    };
  }, []);

  return {
    text: longWait ? LONG_WAIT_MESSAGE : statusText(GENERATION_MESSAGES[index]),
    longWait,
  };
}
