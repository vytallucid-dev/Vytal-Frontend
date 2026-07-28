"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE SIDEKICK PROVIDER — the panel's state, mounted once in the (main) layout, ABOVE the router outlet.
//
// WHY IT LIVES IN THE LAYOUT AND NOT IN THE TRIGGER. The old sheet owned its own open state inside the
// button that raised it, which is exactly why it could only ever be a sheet: it died with the card that
// mounted it, so it could not survive a navigation, and a modal sheet has to block the page anyway. The
// whole point of the panel is that the reader keeps browsing while it talks — so the conversation state
// has to sit above every page. It does: this provider holds the driver, the panel renders it, and the
// trigger is reduced to a caller.
//
// ★ THE SIDEBAR INTERPLAY IS THE HARD PART AND IT IS HERE. Two full-width rails leave the content
// unusable, so opening sidekick collapses the main sidebar to its icon state. Restoring it on close is
// where this gets subtle — see §THE INTENT FLAG. The rule is: we may undo OUR OWN collapse and nothing
// else. The reader's hand always wins.
//
// TWO CONTEXTS, DELIBERATELY. `actions` is identity-stable, so DiscussTrigger — which sits on many cards
// across the platform — never re-renders for a conversation it isn't showing. `state` changes per turn
// and is read only by the panel and the manager's host.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { useInvalidateChatSessions } from "@/lib/api/hooks/use-chat-sessions";
import type { DiscussContext } from "@/components/discuss/discuss-context";
import { useSidekickChat, type SidekickChat } from "./use-sidekick-chat";

/** The chat page — the one route sidekick refuses to share the screen with (see §YIELD TO /chat). */
const isChatRoute = (p: string): boolean => p === "/chat" || p.startsWith("/chat/");

export interface SidekickActions {
  /** THE discuss entry point. Closed → a fresh grounded conversation for this card. Already open with a
   *  conversation running → that conversation takes the question. */
  discuss: (ctx: DiscussContext) => void;
  /** The navbar's toggle: closed → open (the running conversation if there is one, else a blank). */
  toggle: () => void;
  close: () => void;
  setManagerOpen: (open: boolean) => void;
  /** Continue this conversation full-width on /chat, and close the panel (restore rule applies). */
  goFullScreen: () => void;
}

export interface SidekickState {
  open: boolean;
  managerOpen: boolean;
  isMobile: boolean;
  chat: SidekickChat;
}

const ActionsContext = createContext<SidekickActions | null>(null);
const StateContext = createContext<SidekickState | null>(null);

export function useSidekickActions(): SidekickActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useSidekickActions must be used within a SidekickProvider.");
  return ctx;
}

export function useSidekick(): SidekickState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useSidekick must be used within a SidekickProvider.");
  return ctx;
}

export function SidekickProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sidebar = useSidebar();
  const invalidateList = useInvalidateChatSessions();
  const chat = useSidekickChat();

  const [open, setOpen] = useState(false);
  const [managerOpen, setManagerOpenState] = useState(false);

  // Everything the stable actions need to read at CALL time rather than at bind time.
  const chatRef = useRef(chat);
  chatRef.current = chat;
  const openRef = useRef(open);
  openRef.current = open;
  const sidebarRef = useRef(sidebar);
  sidebarRef.current = sidebar;
  const routerRef = useRef(router);
  routerRef.current = router;

  // ── §THE INTENT FLAG ──────────────────────────────────────────────────────────────────────────────
  // `weCollapsed` — did WE collapse the main sidebar when the panel opened? Only then may we expand it
  // again on close. If the reader already had it collapsed, closing leaves it collapsed.
  //
  // `applied` — the sidebar `open` value WE last wrote. It is what makes the flag about INTENT rather
  // than state: any `sidebar.open` that disagrees with it was the reader's own doing (the rail handle,
  // the header button, ⌘B), and the moment that happens our claim on the sidebar is void — see the
  // watcher below. Without this, a reader who expands the sidebar mid-conversation would have it
  // yanked back shut when they close the panel, by a decision they never made.
  const weCollapsedRef = useRef(false);
  const appliedRef = useRef<boolean | null>(null);

  const openPanel = useCallback(() => {
    const sb = sidebarRef.current;
    // Mobile has no interplay to manage: the main sidebar is an overlay drawer (openMobile), not a rail,
    // so it takes no width from the content and sidekick covers the screen anyway.
    if (!sb.isMobile) {
      weCollapsedRef.current = sb.open; // we only "own" the collapse if it was expanded
      appliedRef.current = false; // either way the sidebar is collapsed from here
      if (sb.open) sb.setOpen(false);
    }
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setManagerOpenState(false);
    const sb = sidebarRef.current;
    if (weCollapsedRef.current && !sb.isMobile) {
      appliedRef.current = true;
      sb.setOpen(true);
    }
    weCollapsedRef.current = false;
    appliedRef.current = null;
  }, []);

  // ── THE WATCHER — the reader touched the main sidebar while sidekick was open ─────────────────────
  // Two consequences, both required: (1) our restore claim is dropped, so closing sidekick will not
  // override them; (2) if they EXPANDED it, sidekick yields — the mirror of opening sidekick collapsing
  // the sidebar, because the two rails still cannot share the screen.
  useEffect(() => {
    if (!open || sidebar.isMobile) return;
    if (appliedRef.current === sidebar.open) return; // our own write, echoing back
    weCollapsedRef.current = false;
    appliedRef.current = sidebar.open;
    if (sidebar.open) close();
  }, [open, sidebar.open, sidebar.isMobile, close]);

  // ── THE DISCUSS FLOW ──────────────────────────────────────────────────────────────────────────────
  const discuss = useCallback((ctx: DiscussContext) => {
    const c = chatRef.current;
    // Already open with a live conversation → reuse it. `sessionId` is the honest test: a blank
    // conversation the reader has not written into yet has none, and starting THAT grounded is strictly
    // better than sending a subject question into a session with no fact block at all.
    if (openRef.current && c.sessionId) {
      c.sendDiscuss(ctx);
      return;
    }
    c.openDiscuss(ctx);
    if (!openRef.current) openPanel();
  }, [openPanel]);

  // The navbar's toggle — the only way in that isn't a card. Reopening RESTORES rather than restarts:
  // closing the panel never discarded the conversation (the driver lives up here), so if a session is
  // live we just bring the rail back. Only when there is genuinely nothing to return to — no session,
  // and no open still in flight — do we clear to a blank one.
  const toggle = useCallback(() => {
    if (openRef.current) {
      close();
      return;
    }
    const c = chatRef.current;
    if (!c.sessionId && c.phase !== "opening") c.startBlank();
    openPanel();
  }, [close, openPanel]);

  // ── §YIELD TO /chat ───────────────────────────────────────────────────────────────────────────────
  // The chat page IS this conversation, full width. Showing both at once is the same thing twice in less
  // room, so arriving at /chat closes the panel — through the normal close, so the main sidebar gets the
  // same restore treatment it would from the X.
  // ⚠ ONLY /chat. Every other destination leaves the panel open, because browsing while it talks is the
  // whole reason this stopped being a sheet — a rule that is easy to break by generalising this effect.
  useEffect(() => {
    if (isChatRoute(pathname) && openRef.current) close();
  }, [pathname, close]);

  const goFullScreen = useCallback(() => {
    const id = chatRef.current.sessionId;
    routerRef.current.push(id ? `/chat?session=${encodeURIComponent(id)}` : "/chat", { scroll: false });
    close();
  }, [close]);

  const setManagerOpen = useCallback((v: boolean) => setManagerOpenState(v), []);

  // Refresh the conversation list after each finished exchange — the title, the ordering, and (for a
  // card-originated conversation) its PROMOTION into the list on the first follow-up. Same rule the
  // chat hub uses, so the manager and /chat never disagree about what exists.
  const prevGenerating = useRef(false);
  useEffect(() => {
    if (prevGenerating.current && !chat.generating) invalidateList();
    prevGenerating.current = chat.generating;
  }, [chat.generating, invalidateList]);

  // Escape closes the MANAGER, never the panel — the panel is a rail, not a modal, and dismissing a live
  // conversation on a stray keypress is exactly the kind of loss the sheet was replaced for.
  useEffect(() => {
    if (!managerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setManagerOpenState(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [managerOpen]);

  // Full-screen on mobile means the page behind must not scroll under it.
  useEffect(() => {
    if (!open || !sidebar.isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, sidebar.isMobile]);

  const actions = useMemo<SidekickActions>(
    () => ({ discuss, toggle, close, setManagerOpen, goFullScreen }),
    [discuss, toggle, close, setManagerOpen, goFullScreen],
  );
  const state: SidekickState = { open, managerOpen, isMobile: sidebar.isMobile, chat };

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}
