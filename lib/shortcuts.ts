"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS — the matching primitive, and the three traps that make hand-rolled ones wrong.
//
// The platform already had two, written inline and independently: ⌘/Ctrl+B (the app sidebar, in
// components/ui/sidebar.tsx) and ⌘/Ctrl+K (the command palette, in components/navbar.tsx). Both follow
// the same convention — `metaKey || ctrlKey`, so ⌘ on a Mac and Ctrl everywhere else, one binding — and
// this file is that convention written down once, plus the parts those two get away with not doing
// because a plain Ctrl+letter is the easy case.
//
// ── §MATCHING — WHY BOTH `code` AND `key` ───────────────────────────────────────────────────────────
// `e.key` is the character the key PRODUCES; `e.code` is the physical key PRESSED. Neither alone is
// enough once Alt is involved:
//
//   · On macOS, ⌥ is a composing modifier. ⌥A produces "å", ⌥B "∫", and ⌥N is a dead key ("Dead"). So an
//     `e.key === "b"` test — the way both existing shortcuts are written — simply never fires on a Mac.
//     `e.code === "KeyB"` does.
//   · But `e.code` is the physical key, so on Dvorak / AZERTY / Colemak it names whatever letter sits in
//     the QWERTY position — and the reader who presses the key LABELLED N is not pressing "KeyN".
//
// So a binding declares both and either one matches. The cost is that a remapped layout may fire the
// action from two different physical keys; the benefit is that the shortcut works on every layout and
// every OS, which is the trade every editor makes here.
//
// ── §MODIFIERS ARE EXACT ────────────────────────────────────────────────────────────────────────────
// A binding matches ONLY its own modifier set. That is not fussiness — it is the AltGr bug: on Windows
// and Linux, AltGr reports as ctrlKey AND altKey together, and it is how a Polish, Croatian or Brazilian
// reader types ą, đ, ã. An Alt-only shortcut that ignored ctrlKey would eat those keystrokes.
//
// ── §WHEN A SHORTCUT MUST NOT FIRE ──────────────────────────────────────────────────────────────────
//   · auto-repeat (`e.repeat`) — a held key would strobe a toggle at the OS repeat rate.
//   · IME composition (`e.isComposing`) — the same rule the chat composer's Enter already follows.
//   · a modal is up — the reader is in a conversation with THAT, and rearranging the page behind it is
//     an answer to a question nobody asked. Radix gives every dialog (including the ⌘K palette and the
//     mobile sidebar sheet) `role="dialog"` + `data-state="open"`, so one probe covers all of them.
//
//   · an Alt binding, on an Apple platform, while the caret is in a text field — because there ⌥+letter
//     IS text (see §ON macOS below). Everywhere else, and for every ⌘/Ctrl binding, shortcuts stay live
//     inside inputs: those combinations can never be part of typing, which is why ⌘K and ⌘B have always
//     worked from the composer.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";

export interface Shortcut {
  /** The physical key, layout-independent — "KeyA". See §MATCHING. */
  code: string;
  /** The letter it prints, lower-case — "a". Matched as an alternative to `code`. */
  key: string;
  /** ⌘ on macOS, Ctrl elsewhere — the platform's existing convention. */
  mod?: boolean;
  /** ⌥ Option on macOS, Alt elsewhere. */
  alt?: boolean;
}

/** Declare a shortcut once, use it for both the binding and its printed label. */
export const shortcut = (code: string, key: string, mods: { mod?: boolean; alt?: boolean }): Shortcut => ({
  code,
  key,
  ...mods,
});

function modalIsOpen(): boolean {
  return document.querySelector('[role="dialog"][data-state="open"]') != null;
}

/** Apple platforms, for behaviour rather than for labels (no hook — this is read inside a listener). */
export function isApplePlatform(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// ── §ON macOS, ⌥+LETTER IS TEXT ────────────────────────────────────────────────────────────────────
// ⌥N is the ñ dead key. ⌥A types å, ⌥B types ∫. So on Apple platforms an Alt binding must NOT take the
// keystroke out of a field the reader is typing in — there would otherwise be no way to write "señor"
// in the chat composer, and losing a letter is a worse failure than losing a shortcut.
//
// Everywhere else Alt+letter produces no text at all, so the bindings stay live in every field,
// including the composer. And ⌘/Ctrl bindings are never text on any platform, so they are unaffected —
// which is why ⌘K and ⌘B have always been able to fire from inside an input.
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
function altWouldTypeText(e: KeyboardEvent): boolean {
  if (!isApplePlatform()) return false;
  const el = e.target as Element | null;
  return typeof el?.closest === "function" && el.closest(EDITABLE) != null;
}

export function matchesShortcut(e: KeyboardEvent, s: Shortcut): boolean {
  if (e.repeat || e.isComposing) return false;
  if ((e.metaKey || e.ctrlKey) !== (s.mod === true)) return false; // §MODIFIERS ARE EXACT (AltGr!)
  if (e.altKey !== (s.alt === true)) return false;
  if (e.shiftKey) return false;
  return e.code === s.code || e.key.toLowerCase() === s.key;
}

/**
 * Bind one action to one or more key combinations for as long as the component is mounted.
 *
 * `run` is read through a ref, so the listener is attached once and never re-bound as the handler's
 * closure changes — a re-binding race is exactly how a shortcut ends up firing twice or not at all.
 */
export function useShortcut(keys: Shortcut | Shortcut[], run: () => void, enabled = true): void {
  const runRef = useRef(run);
  runRef.current = run;
  const bindingsRef = useRef<Shortcut[]>([]);
  bindingsRef.current = Array.isArray(keys) ? keys : [keys];
  // The effect re-runs when the BINDING changes, never merely because an array literal was rebuilt.
  const signature = bindingsRef.current
    .map((k) => `${k.code}${k.key}${k.mod ? "m" : ""}${k.alt ? "a" : ""}`)
    .join("|");

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const hit = bindingsRef.current.find((b) => matchesShortcut(e, b));
      if (!hit) return;
      if (hit.alt && altWouldTypeText(e)) return; // §ON macOS, ⌥+LETTER IS TEXT
      if (modalIsOpen()) return;
      e.preventDefault();
      runRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [signature, enabled]);
}

// ── labels ─────────────────────────────────────────────────────────────────────────────────────────

/** Apple platforms print modifiers as glyphs and call Alt "Option"; everyone else spells them out.
 *  Resolved after mount (there is no honest answer during a server render), so a label may render as
 *  the Windows form for one frame — it lives in tooltips and a palette row, both of which are read
 *  long after that. */
export function useIsApplePlatform(): boolean {
  const [apple, setApple] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setApple(/Mac|iPhone|iPad|iPod/i.test(ua));
  }, []);
  return apple;
}

/** "⌥A" on a Mac, "Alt+A" elsewhere. */
export function formatShortcut(s: Shortcut, apple: boolean): string {
  const parts: string[] = [];
  if (s.mod) parts.push(apple ? "⌘" : "Ctrl");
  if (s.alt) parts.push(apple ? "⌥" : "Alt");
  parts.push(s.key.toUpperCase());
  return apple ? parts.join("") : parts.join("+");
}

export function useShortcutLabel(s: Shortcut): string {
  return formatShortcut(s, useIsApplePlatform());
}
