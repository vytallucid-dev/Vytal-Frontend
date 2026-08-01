"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE VYTAL KEYBOARD LAYER — three keys, one idea each, and the same idea at every surface.
//
//   ⌥A   ASK VYTAL          open / close the assistant
//   ⌥N   NEW CONVERSATION   start a fresh one, wherever you are  (⌘/Ctrl+N too, where the browser allows)
//   ⌥B   YOUR CONVERSATIONS show / hide the list of them
//
// ★ THE SAME KEY MEANS THE SAME THING EVERYWHERE — it just has a different thing to act on. The chat
//   page and the sidekick rail are two presentations of one product, so the keys are bound to INTENTS,
//   and each surface answers the intent in its own terms:
//
//                        │ on /chat (the dedicated page)      │ anywhere else
//     ───────────────────┼────────────────────────────────────┼──────────────────────────────────────
//     ⌥A  Ask Vytal      │ put the cursor in the composer     │ toggle the sidekick rail — which
//                        │ (Vytal is already full screen; a   │ reopens the RUNNING conversation if
//                        │  rail beside it would be the same  │ there is one, else a blank (the
//                        │  thing twice, in less room)        │ panel's own restore rule, untouched)
//     ⌥N  New            │ a new conversation on the page     │ a new conversation in the rail,
//                        │                                    │ opening it first if it was closed
//     ⌥B  Conversations  │ fold the history rail (desktop) /  │ the conversation manager, if the rail
//                        │ step back to the list (mobile,     │ is open; otherwise nothing — there is
//                        │ where the list IS the rail)        │ no list on screen to toggle
//
// ★ HOW THE PAGE CLAIMS ITS KEYS — §THE CLAIM. Not by comparing pathnames in two places: the chat page
//   REGISTERS its three handlers while it is mounted, and being mounted IS the claim. One source of
//   truth, no window during a route change where both interpretations are live, and nothing here has to
//   know what the chat page's URL looks like.
//
// ★ AND WHY THIS DOES NOT RE-RENDER THE APP. It subscribes to the sidekick's ACTIONS context only, which
//   is identity-stable by design (sidekick-provider §TWO CONTEXTS); the panel's open/closed state is
//   read inside those actions, off refs. A shortcut layer that watched `open` reactively would re-render
//   the entire shell on every turn of every conversation.
//
// The same three functions drive the ⌘K command palette's "Vytal" rows, so a reader who does not know
// the keys can do all of it with a mouse — and see what the key was, next to the row they just used.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useSidekickActions } from "@/components/sidekick/sidekick-provider";
import { shortcut, useShortcut } from "@/lib/shortcuts";

/** ⌥A — Ask Vytal. */
export const SC_VYTAL = shortcut("KeyA", "a", { alt: true });
/** ⌥N — a new conversation. */
export const SC_NEW_CHAT = shortcut("KeyN", "n", { alt: true });
/** ⌘/Ctrl+N — the same intent, for the hands that reach for it.
 *
 *  ⚠ IT IS NOT THE PRIMARY BINDING, AND IT CANNOT BE. Ctrl+N (and ⌘N) is a RESERVED browser shortcut —
 *  "new window" — which Chrome, Edge and Safari never deliver to a page, so `preventDefault` has nothing
 *  to prevent. It is bound anyway because it costs nothing and does reach us where the browser releases
 *  it (an installed PWA window, some Linux builds), but every label in the product shows ⌥N, which
 *  always works. Advertising a key that silently does nothing on most machines is worse than not
 *  advertising one at all. */
export const SC_NEW_CHAT_ALT = shortcut("KeyN", "n", { mod: true });
/** ⌥B — your conversations. */
export const SC_CONVERSATIONS = shortcut("KeyB", "b", { alt: true });

/** What a chat surface must be able to do for the three intents to mean something there. */
export interface ChatSurfaceShortcuts {
  /** ⌥A — the reader is already looking at Vytal full screen; give them the cursor. */
  focusComposer: () => void;
  /** ⌥N — a new conversation on this surface. */
  newConversation: () => void;
  /** ⌥B — show / hide this surface's own list of conversations. */
  toggleConversations: () => void;
}

/** §THE CLAIM — a mutable box, not state: a surface mounting must not re-render the shell, and the key
 *  handler needs the answer at KEYPRESS time, which a box gives it for free. */
type SurfaceBox = { current: ChatSurfaceShortcuts | null };
const SurfaceContext = createContext<SurfaceBox | null>(null);

export interface ChatShortcutActions {
  /** ⌥A */
  vytal: () => void;
  /** ⌥N (⌘/Ctrl+N) */
  newConversation: () => void;
  /** ⌥B */
  conversations: () => void;
}
const ActionsContext = createContext<ChatShortcutActions | null>(null);

/**
 * Claim the three chat intents for the surface calling this, for as long as it is mounted (see §THE
 * CLAIM). Used by the chat page — components/chat/chat-hub.tsx.
 *
 * The handlers may be fresh closures on every render; what is registered is a stable façade over them,
 * so the newest ones always run AND the release below can tell its own claim from a successor's.
 */
export function useChatSurfaceShortcuts(handlers: ChatSurfaceShortcuts): void {
  const box = useContext(SurfaceContext);
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    if (!box) return;
    const facade: ChatSurfaceShortcuts = {
      focusComposer: () => latest.current.focusComposer(),
      newConversation: () => latest.current.newConversation(),
      toggleConversations: () => latest.current.toggleConversations(),
    };
    box.current = facade;
    return () => {
      if (box.current === facade) box.current = null; // never clear a successor's claim
    };
  }, [box]);
}

/** The three actions, for anything that triggers them without a keyboard (the ⌘K palette). */
export function useChatShortcutActions(): ChatShortcutActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useChatShortcutActions must be used within a ChatShortcutsProvider.");
  return ctx;
}

export function ChatShortcutsProvider({ children }: { children: ReactNode }) {
  const sidekick = useSidekickActions();
  // Stable across the app's life — the box IS the context value, so claiming it re-renders nothing.
  const surface = useRef<ChatSurfaceShortcuts | null>(null);

  const actions = useMemo<ChatShortcutActions>(
    () => ({
      vytal: () => (surface.current ? surface.current.focusComposer() : sidekick.toggle()),
      newConversation: () =>
        surface.current ? surface.current.newConversation() : sidekick.newConversation(),
      conversations: () =>
        surface.current ? surface.current.toggleConversations() : sidekick.toggleManager(),
    }),
    [sidekick],
  );

  useShortcut(SC_VYTAL, actions.vytal);
  useShortcut([SC_NEW_CHAT, SC_NEW_CHAT_ALT], actions.newConversation);
  useShortcut(SC_CONVERSATIONS, actions.conversations);

  return (
    <SurfaceContext.Provider value={surface}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </SurfaceContext.Provider>
  );
}
