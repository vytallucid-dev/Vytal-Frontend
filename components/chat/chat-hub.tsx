"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CHAT HUB — the two-pane application surface. NOT a card: two continuous full-height regions separated
// by ONE hairline divider. Depth comes from surface TONES, not borders — the rail sits on --surface-1
// (a lifted navigational panel), the conversation on --background (a calm, deep reading canvas that lets
// the surface-2 message bubbles read as raised).
//
// THE URL SAYS WHICH CONVERSATION IS LOADED; THE PANE STATE SAYS WHICH REGION YOU ARE LOOKING AT.
//   /chat                              → blank (desktop: blank right pane; mobile: the list)
//   /chat?session=new                  → blank compose
//   /chat?session=<id>                 → that conversation (deep-linkable / returnable)
//   /chat?session=<id>&view=list       → MOBILE ONLY: that conversation is still loaded, but you have
//                                        stepped back out to the list (§THE MOBILE PANE)
//
// Desktop (≥768px): both regions visible, and the rail folds away with a real transition (§THE RAIL).
// Mobile (<768px): one region at a time, with a back affordance.
//
// SWITCHING conversations cross-fades (the pane is keyed → remounts → fades in). The blank→created
// transition deliberately keeps the SAME key (createdFromBlank) so the first exchange is NOT interrupted
// by a remount — only a genuine switch to a different conversation animates.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useChatSessions, useInvalidateChatSessions } from "@/lib/api/hooks/use-chat-sessions";
import type { ChatSession } from "@/types/chat";
import { cn } from "@/lib/utils";
import { CHAT_RAIL_COOKIE, writeUiPreference } from "@/lib/ui-preference";
import { useChatSurfaceShortcuts } from "@/components/shortcuts/chat-shortcuts";
import { ChatSessionList } from "./chat-session-list";
import { focusChatComposer } from "./chat-composer";
import { ChatConversationPane } from "./chat-conversation";
import { RenameChatDialog } from "./rename-chat-dialog";
import { DeleteChatDialog } from "./delete-chat-dialog";
import { PLACEHOLDER_TITLE, resolveTitle } from "./provisional-title";
import { useReducedMotion } from "./use-progressive-reveal";
import { useChatPage } from "./use-chat-page";

/** How long after a first exchange to re-read the list once, for the model-written title.
 *
 *  The title job is enqueued when the exchange lands and a worker picks it up on a 3s poll, so the real
 *  title exists a few seconds later — but nothing would ask for it: the list is refreshed at the END of
 *  the exchange (too early), queries are 5-minute-stale and do not refetch on focus, so the conversation
 *  would keep the truncated first message until something else invalidated the list, often the whole
 *  visit. One extra GET buys the title landing while the reader is still looking at the conversation. */
const TITLE_SETTLE_MS = 7000;

// ── §THE RAIL — the fold-away motion ───────────────────────────────────────────────────────────────
// TWO ELEMENTS, ONE GESTURE, DELIBERATELY OUT OF STEP.
//
//  · THE FOOTPRINT animates WIDTH. It is the only thing that resizes the page, and it is empty — the
//    panel inside it keeps a fixed 280px and is clipped, so not one line of the conversation list
//    re-wraps while it moves. (Animating the panel's own width would re-layout every row every frame.)
//  · THE PANEL animates TRANSFORM + OPACITY only, which are composited and cost nothing.
//
// The lag between them is what makes it read as a panel sliding UNDER the conversation rather than a box
// being squashed: closing, the panel leads — it slips left and fades while the space is still closing;
// opening, it follows — the space opens first and the panel settles into it. Same curve for both, the
// one the sidekick rail already uses, so the two panels on this platform move like one family.
const RAIL_W = 280; // md:w-70 — the panel's own width, fixed while the footprint moves
const RAIL_GUTTER = 8; // md:mx-2 — the floating inset, on both sides
const RAIL_FOOTPRINT = RAIL_W + RAIL_GUTTER * 2;
const RAIL_SLIP = 26; // how far the panel slides as it goes
const RAIL_EASE = [0.32, 0.72, 0, 1] as const;
const FOOTPRINT_TRANSITION = { duration: 0.34, ease: RAIL_EASE };
const PANEL_OPENING = { duration: 0.26, ease: RAIL_EASE, delay: 0.08 };
const PANEL_CLOSING = { duration: 0.2, ease: RAIL_EASE };
const INSTANT = { duration: 0 };

/** The `md` breakpoint the two-pane layout is built on, read SYNCHRONOUSLY on the first render so the
 *  rail's animated width is never a desktop value for a frame on a phone. (Safe: RequireAuth holds this
 *  tree until Supabase answers, so the hub only ever renders on the client — and the `typeof window`
 *  guard keeps it correct if that ever changes.) */
const MD_QUERY = "(min-width: 768px)";
function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia(MD_QUERY).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(MD_QUERY);
    const sync = () => setDesktop(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);
  return desktop;
}

export function ChatHub({ defaultRailOpen = true }: { defaultRailOpen?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invalidateList = useInvalidateChatSessions();
  const isDesktop = useIsDesktop();
  const reduced = useReducedMotion();

  // URL → state. "new" and null both mean a blank conversation; only a real id loads.
  const activeParam = searchParams.get("session"); // null | "new" | <id>
  const activeId = !activeParam || activeParam === "new" ? null : activeParam;
  const viewParam = searchParams.get("view"); // "list" ⇒ mobile stepped back out (see below)

  const sessionsQ = useChatSessions();
  const sessions = sessionsQ.data ?? [];

  // The id just created from a blank chat — kept so its pane KEEPS the "blank" animation key (no remount
  // mid-first-exchange). Cleared implicitly once the reader switches to a different conversation.
  const createdFromBlankRef = useRef<string | null>(null);

  const onSessionCreated = useCallback(
    (id: string) => {
      createdFromBlankRef.current = id;
      router.replace(`/chat?session=${encodeURIComponent(id)}`, { scroll: false });
      invalidateList();
    },
    [router, invalidateList],
  );

  const chat = useChatPage({ activeId, onSessionCreated });

  // ── §THE MOBILE PANE ──────────────────────────────────────────────────────────────────────────────
  // Which of the two regions is on screen below 768px.
  //
  // ★ STEPPING BACK TO THE LIST DOES NOT CLOSE THE CONVERSATION. `?session=` stays exactly where it was
  //   and `&view=list` is added beside it, which buys three things at once: the list still MARKS the
  //   conversation you came back from (it is still the active one — no second "last visited" state to
  //   keep in sync), re-opening it is instant because nothing was ever torn down or refetched, and a
  //   refresh from the list comes back to the list rather than dropping you into the conversation.
  //
  // ★ AND THE BACK ARROW DOES NOT WAIT ON THE ROUTER. It sets this state directly and syncs the URL
  //   after. That transition — a soft navigation to the same pathname, changing only the query — is the
  //   one thing on this surface that behaved differently after a hard page load, which is exactly when
  //   readers found the arrow dead. Selecting a conversation is left to the URL on purpose: it has to
  //   make that round trip anyway to load anything, and flipping the pane ahead of it would show the
  //   PREVIOUS conversation for a frame (see §NO FLICKER in use-chat-page for the other half of this).
  const paneFor = (session: string | null, view: string | null): "list" | "conversation" =>
    session != null && view !== "list" ? "conversation" : "list";
  const [mobilePane, setMobilePane] = useState<"list" | "conversation">(() =>
    paneFor(activeParam, viewParam),
  );
  const urlKey = `${activeParam ?? ""}|${viewParam ?? ""}`;
  const [seenUrl, setSeenUrl] = useState(urlKey);
  if (seenUrl !== urlKey) {
    // The documented "adjust state while rendering" pattern (not an effect, which React runs only after
    // the browser has painted): the URL changed under us — a deep link, browser Back/Forward, the
    // ?session= replace after a blank chat is created, a conversation picked from the list — so the pane
    // follows it in the SAME frame, with no intermediate paint of the wrong region.
    setSeenUrl(urlKey);
    setMobilePane(paneFor(activeParam, viewParam));
  }
  const showConversationMobile = mobilePane === "conversation";

  // ── §THE RAIL TOGGLE (desktop only) ───────────────────────────────────────────────────────────────
  // Below 768px the rail IS the list view — folding it away would leave no way to reach a conversation —
  // so the toggle is `md:` only and this flag is ignored under that breakpoint.
  //
  // ⚠ IT DOES NOT TOUCH THE APP SIDEBAR, and must not. The sidekick panel owns a careful claim on that
  //   rail (collapse on open, restore on close only if it did the collapsing — sidekick-provider §THE
  //   INTENT FLAG), and the panel is always closed on /chat anyway (§YIELD TO /chat). Two independent
  //   pieces of state that never write to each other cannot fight over one.
  const [railOpen, setRailOpen] = useState(defaultRailOpen);
  const setRail = useCallback((open: boolean) => {
    setRailOpen(open);
    writeUiPreference(CHAT_RAIL_COOKIE, open); // survives the page load; read back server-side in page.tsx
  }, []);
  // Folded away only on desktop — and when it is, it must also be unreachable by keyboard and invisible
  // to assistive tech, or a zero-width panel would still hold a dozen tab stops.
  const railFolded = isDesktop && !railOpen;

  // Refresh the list after each finished exchange (title + lastMessageAt ordering change), then once more
  // a few seconds later for a conversation born in this visit — see TITLE_SETTLE_MS.
  const prevGenerating = useRef(false);
  const settleTimerRef = useRef<number | null>(null);
  const settledForRef = useRef<string | null>(null); // the title job runs once, so this fires once
  useEffect(() => {
    if (prevGenerating.current && !chat.generating) {
      invalidateList();
      const born = createdFromBlankRef.current;
      if (born && born === activeId && settledForRef.current !== born) {
        settledForRef.current = born;
        settleTimerRef.current = window.setTimeout(() => invalidateList(), TITLE_SETTLE_MS);
      }
    }
    prevGenerating.current = chat.generating;
  }, [chat.generating, invalidateList, activeId]);
  useEffect(() => () => {
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
  }, []);

  const select = useCallback(
    (id: string) => {
      // Re-entering the conversation that is ALREADY loaded — the one you just stepped back out of.
      // Nothing has to load and nothing can flash, so the pane flips now instead of waiting on the URL.
      if (id === activeId) setMobilePane("conversation");
      router.push(`/chat?session=${encodeURIComponent(id)}`, { scroll: false });
    },
    [router, activeId],
  );
  const startNew = useCallback(() => {
    if (activeParam === "new") setMobilePane("conversation"); // already blank → nothing to wait for
    router.push(`/chat?session=new`, { scroll: false });
  }, [router, activeParam]);
  // ★ ALWAYS THE LIST, NEVER "wherever you came from" — a push through history (router.back()) would be
  //   inert on a deep link, a shared URL or a refreshed page, which is precisely where readers hit it.
  //   `replace`, not `push`: stepping out to the list is not a place worth putting in the history stack,
  //   and a browser Back that dropped you back INTO the conversation you just left would be perverse.
  const back = useCallback(() => {
    setMobilePane("list");
    router.replace(activeParam ? `/chat?session=${encodeURIComponent(activeParam)}&view=list` : "/chat", {
      scroll: false,
    });
  }, [router, activeParam]);
  /** back()'s inverse — step from the list into the conversation that is still loaded. Nothing to
   *  fetch, so it is instant; the URL drops `view=list` so a refresh agrees with what is on screen. */
  const resume = useCallback(() => {
    if (!activeParam) return;
    setMobilePane("conversation");
    router.replace(`/chat?session=${encodeURIComponent(activeParam)}`, { scroll: false });
  }, [router, activeParam]);

  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const activeSession = activeId ? (sessions.find((s) => s.id === activeId) ?? null) : null;

  // The stand-in title belongs to the conversation this visit created, and only while the server still
  // calls it "New conversation" (provisional-title.ts). Applied to the LIST here so the rail and the
  // header cannot disagree about what the open conversation is called.
  const provisionalTitle = chat.provisionalTitle;
  const listSessions = useMemo(() => {
    if (!provisionalTitle || !activeId) return sessions;
    return sessions.map((s) =>
      s.id === activeId ? { ...s, title: resolveTitle(s.title, provisionalTitle) ?? PLACEHOLDER_TITLE } : s,
    );
  }, [sessions, activeId, provisionalTitle]);

  // After a delete: the mutation already refreshed the list. If the deleted conversation was the open
  // one, clear ?session so we land on the blank-start state rather than a dead pane.
  const onDeleted = useCallback(
    (id: string) => {
      if (id === activeId) {
        setMobilePane("list");
        router.replace("/chat", { scroll: false });
      }
    },
    [activeId, router],
  );

  // ── §THE KEYBOARD CLAIM ───────────────────────────────────────────────────────────────────────────
  // While this page is mounted it answers the three Vytal shortcuts itself (components/shortcuts —
  // being mounted IS the claim, so nothing has to compare pathnames). Each one keeps its meaning and
  // changes only what it acts on:
  //   ⌥A  Vytal is already full screen here → give the reader the cursor rather than a second copy of
  //       this surface in a rail beside it.
  //   ⌥N  a new conversation, on this page.
  //   ⌥B  the conversation list: the rail folds on desktop; on mobile the list is a whole VIEW rather
  //       than a rail, so the same key steps between the two panes — "show me my conversations" either
  //       way, which is what the reader pressed it for.
  useChatSurfaceShortcuts({
    focusComposer: focusChatComposer,
    newConversation: () => {
      startNew();
      focusChatComposer(); // the welcome autofocuses on mount; this covers "already blank" too
    },
    toggleConversations: () => {
      if (isDesktop) setRail(!railOpen);
      else if (showConversationMobile) back();
      else resume(); // already on the list → the same key takes you back in (no-op with nothing to
      //                resume, which is the honest answer to "hide the list" when the list is all there is)
    },
  });

  // Cross-fade key: a just-created blank session keeps the "blank" key (no interrupting remount); a real
  // switch to a different conversation gets its own key → remount → fade.
  const paneKey = activeId && activeId === createdFromBlankRef.current ? "blank" : (activeId ?? "blank");

  return (
    // Transparent — so the platform's own fixed grid backdrop (the layout's -z-10 bg-grid, the same one
    // health/dashboard show) reads through the conversation, no separately-added grid.
    <div className="flex h-full min-h-0">
      {/* THE FOOTPRINT — see §THE RAIL. Empty by design: it owns the width, the panel inside owns the
          look. Note there is no `railOpen` branch in the classes at all — display is the MOBILE pane
          switch and nothing else, because a folded rail that were `display:none` could not animate. */}
      <motion.div
        className={cn(
          "flex min-h-0 shrink-0 overflow-hidden",
          showConversationMobile ? "hidden md:flex" : "flex",
        )}
        initial={false}
        animate={{ width: isDesktop ? (railOpen ? RAIL_FOOTPRINT : 0) : "100%" }}
        transition={reduced ? INSTANT : FOOTPRINT_TRANSITION}
      >
        {/* THE PANEL — a floating panel in the app-sidebar language (rounded, hairline, inset margin).
            `md:shrink-0` is what keeps it 280px while the footprint closes over it, so the list is
            clipped rather than reflowed. */}
        <motion.aside
          aria-label="Conversations"
          inert={railFolded || undefined}
          className="flex min-h-0 w-full flex-col overflow-hidden bg-surface-1 md:mx-2 md:mb-2 md:w-70 md:shrink-0 md:rounded-lg md:border md:border-line md:shadow-sm"
          initial={false}
          animate={{ x: railFolded ? -RAIL_SLIP : 0, opacity: railFolded ? 0 : 1 }}
          transition={reduced ? INSTANT : railOpen ? PANEL_OPENING : PANEL_CLOSING}
        >
          <ChatSessionList
            sessions={listSessions}
            activeId={activeId}
            isLoading={sessionsQ.isLoading}
            isError={sessionsQ.isError}
            onRetry={() => void sessionsQ.refetch()}
            onSelect={select}
            onNew={startNew}
            onRename={setRenameTarget}
            onDelete={setDeleteTarget}
            onCollapse={() => setRail(false)}
          />
        </motion.aside>
      </motion.div>

      {/* conversation canvas — transparent so the platform grid reads through, with an AI spotlight glow
          scoped to THIS region only (never the rail). Its peak sits a little below the top so it fades
          gently toward the navbar rather than hard-cutting against it.
          ⚠ min-w-0 + overflow-hidden are STRUCTURAL, not decoration: this is a flex item, so without
          them its automatic minimum size is its content's min-content width, and any single
          un-wrappable thing inside (a nowrap conversation title, a wide table, a long URL) would set
          the width of the whole region and push the transcript off a 320px screen. */}
      <section
        className={cn(
          "relative isolate min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          showConversationMobile ? "flex" : "hidden md:flex",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_55%_at_50%_30%,color-mix(in_oklch,var(--ai-via)_9%,transparent),transparent_58%)]"
        />
        <ChatConversationPane
          key={paneKey}
          chat={chat}
          session={activeSession}
          provisionalTitle={provisionalTitle}
          onBack={back}
          onRename={setRenameTarget}
          railCollapsed={railFolded}
          onExpandRail={() => setRail(true)}
          onNew={startNew}
        />
      </section>

      <RenameChatDialog session={renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)} />
      <DeleteChatDialog
        session={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={onDeleted}
      />
    </div>
  );
}
