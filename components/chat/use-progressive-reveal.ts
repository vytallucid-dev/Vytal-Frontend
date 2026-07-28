"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// PROGRESSIVE REVEAL — the client-side "typing" of an already-complete reply.
//
// The backend deliberately has NO streaming transport: the guardrail needs the WHOLE message before any
// of it is shown, so a reply arrives complete. To keep the familiar alive-feeling of a reply forming, we
// reveal that finished text progressively on the client. This is pure view animation over settled data —
// nothing here changes what was said, only how fast it appears.
//
// UNIT-BASED. The reply is markdown, revealed BLOCK-BY-BLOCK (see markdown.tsx): typed text spends one
// "unit" per grapheme, and a structured block (table / code / rule) — which fades in whole rather than
// typing — spends a short fixed beat (STRUCTURED_BLOCK_UNITS). This hook just advances one counter from
// 0 → total at a constant pace; markdown.tsx decides what each unit means and renders accordingly. One
// clock drives both the character typing and the block pacing, so they never drift.
//
// SPEED — a CONSTANT CPS ("characters"/second), like a streaming assistant. There is deliberately NO
// duration cap: a longer reply simply takes longer to finish, so the pace stays even instead of racing
// on long messages. At ~70 cps that's roughly one grapheme per animation frame (60fps ≈ 1.17/frame), so
// the text visibly types character-by-character rather than jumping in chunks. Tune CPS below.
//
// GRAPHEME-SAFE — text is measured/sliced in grapheme CLUSTERS (via Intl.Segmenter when present), not
// UTF-16 code units, so mixed-script / Devanagari text (Hinglish) never reveals a broken half-cluster.
//
// SKIPPABLE — reduced-motion or a disabled reveal shows everything at once; skip() finalizes an in-flight
// reveal instantly (the panel/page calls it when the reader scrolls up or taps, or sends again) — which,
// with blocks, means rendering the WHOLE message immediately, not just the current block.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";

/** graphemes/second — the constant WITHIN-TEXT-BLOCK typing pace, no duration cap (long replies just take
 *  longer). This is the rate the user tuned earlier; block-by-block reveal keeps it unchanged. */
export const CPS = 100;

/** A structured block (table / code / rule) fades in as a unit instead of typing — but the counter still
 *  spends a short even beat crossing it so the next block doesn't jump in on the same frame. Expressed in
 *  the same cps currency (≈0.4s) so speed stays a single knob. */
export const STRUCTURED_BLOCK_UNITS = Math.max(1, Math.round(CPS * 0.4));

// ── THE DELIVERED REGISTRY — the record that survives a remount ──────────────────────────────────────
// `UiMessage.reveal` means "this text was freshly generated", NOT "and it has not been shown yet": it is
// set once when a reply lands and stays true for the message's whole life. That was survivable while the
// only surface was /chat, which unmounts its transcript by navigating away and refetches history as
// reveal:false. The sidekick panel breaks it: the conversation lives in the provider ABOVE the router
// outlet, but the panel's rail is unmounted by AnimatePresence every time it closes — so reopening
// remounted every bubble with reveal STILL true and no memory of having played, and the whole transcript
// re-typed itself.
//
// This is that memory, deliberately OUTSIDE React so no unmount can take it: the ids of messages a reveal
// has already been handed. A message enters it the moment its reveal STARTS, so a reveal interrupted by a
// close also renders whole on reopen — the text arrived complete and was already on screen; the typing is
// only how it was shown, and showing it again from zero is the bug, not the fix.
//
// Module-scoped ⇒ it lives exactly as long as the tab's JS, which is the "session lifetime" that matters:
// a full reload refetches every transcript as history anyway. Entries are server message ids; the only
// locally-minted ids are user turns and the panel's optimistic opening line, which never reveal.
const delivered = new Set<string>();

/** Has this message already been handed to a reveal in this tab? Pure — safe to call during render. */
export function hasBeenDelivered(id: string): boolean {
  return delivered.has(id);
}

/** Record that this message's reveal has started. Idempotent (StrictMode may run the effect twice). */
export function markDelivered(id: string): void {
  delivered.add(id);
}

/** Whether the user asked the OS to minimize motion. SSR-safe: false until mounted, then live. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** Split into grapheme clusters (base + combining marks stay together). Falls back to code points. */
export function toGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text); // code-point fallback (still better than UTF-16 .slice)
}

export interface TypeRevealState {
  /** Reveal units shown so far — a growing prefix while revealing, `total` once done. */
  count: number;
  /** True while units are still appearing (drives auto-scroll + the typing caret). */
  isRevealing: boolean;
  /** Jump to the end immediately (idempotent) — finalizes the whole message. */
  skip: () => void;
}

/**
 * Advance a reveal counter 0 → `total` at a constant CPS. `total` is a count of abstract reveal UNITS
 * computed by the caller (markdown.tsx). When `enabled` is false (loaded history, or reduced motion) the
 * counter starts at `total` and isRevealing stays false. Keyed on `total`, so a new message restarts.
 */
export function useTypeReveal(total: number, opts: { enabled: boolean }): TypeRevealState {
  const { enabled } = opts;

  const [count, setCount] = useState(enabled ? 0 : total);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const skippedRef = useRef(false);

  useEffect(() => {
    skippedRef.current = false;
    startRef.current = null;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    if (!enabled || total === 0) {
      setCount(total);
      return;
    }

    setCount(0);
    const tick = (t: number) => {
      if (skippedRef.current) return;
      if (startRef.current == null) startRef.current = t;
      const elapsed = t - startRef.current;
      const next = Math.min(total, Math.floor((elapsed / 1000) * CPS));
      setCount(next);
      if (next < total) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, total]);

  const skip = useCallback(() => {
    skippedRef.current = true;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    setCount(total);
  }, [total]);

  const isRevealing = enabled && count < total;
  return { count, isRevealing, skip };
}
