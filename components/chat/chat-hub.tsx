"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CHAT HUB — the two-pane application surface. NOT a card: two continuous full-height regions separated
// by ONE hairline divider. Depth comes from surface TONES, not borders — the rail sits on --surface-1
// (a lifted navigational panel), the conversation on --background (a calm, deep reading canvas that lets
// the surface-2 message bubbles read as raised).
//
// The URL is the source of truth for which conversation is open:
//   /chat                    → blank (desktop: blank right pane; mobile: the list)
//   /chat?session=new        → blank compose (mobile enters the conversation pane; desktop unchanged)
//   /chat?session=<id>       → that conversation (deep-linkable / returnable)
//
// Desktop (≥768px): both regions visible. Mobile (<768px): one region — the list, or the conversation
// once ?session is present, with a back affordance (Tailwind `md` = 768px).
//
// SWITCHING conversations cross-fades (the pane is keyed → remounts → fades in). The blank→created
// transition deliberately keeps the SAME key (createdFromBlank) so the first exchange is NOT interrupted
// by a remount — only a genuine switch to a different conversation animates.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChatSessions, useInvalidateChatSessions } from "@/lib/api/hooks/use-chat-sessions";
import type { ChatSession } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ChatSessionList } from "./chat-session-list";
import { ChatConversationPane } from "./chat-conversation";
import { RenameChatDialog } from "./rename-chat-dialog";
import { DeleteChatDialog } from "./delete-chat-dialog";
import { useChatPage } from "./use-chat-page";

export function ChatHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invalidateList = useInvalidateChatSessions();

  // URL → state. "new" and null both mean a blank conversation; only a real id loads.
  const activeParam = searchParams.get("session"); // null | "new" | <id>
  const activeId = !activeParam || activeParam === "new" ? null : activeParam;
  const showConversationMobile = activeParam != null;

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

  // Refresh the list after each finished exchange (title + lastMessageAt ordering change).
  const prevGenerating = useRef(false);
  useEffect(() => {
    if (prevGenerating.current && !chat.generating) invalidateList();
    prevGenerating.current = chat.generating;
  }, [chat.generating, invalidateList]);

  const select = useCallback(
    (id: string) => router.push(`/chat?session=${encodeURIComponent(id)}`, { scroll: false }),
    [router],
  );
  const startNew = useCallback(() => router.push(`/chat?session=new`, { scroll: false }), [router]);
  const back = useCallback(() => router.push(`/chat`, { scroll: false }), [router]);

  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const activeSession = activeId ? (sessions.find((s) => s.id === activeId) ?? null) : null;

  // After a delete: the mutation already refreshed the list. If the deleted conversation was the open
  // one, clear ?session so we land on the blank-start state rather than a dead pane.
  const onDeleted = useCallback(
    (id: string) => {
      if (id === activeId) router.replace("/chat", { scroll: false });
    },
    [activeId, router],
  );

  // Cross-fade key: a just-created blank session keeps the "blank" key (no interrupting remount); a real
  // switch to a different conversation gets its own key → remount → fade.
  const paneKey = activeId && activeId === createdFromBlankRef.current ? "blank" : (activeId ?? "blank");

  return (
    // Transparent — so the platform's own fixed grid backdrop (the layout's -z-10 bg-grid, the same one
    // health/dashboard show) reads through the conversation, no separately-added grid.
    <div className="flex h-full min-h-0">
      {/* list rail — a floating panel in the app-sidebar language (rounded, hairline, inset margin) */}
      <aside
        className={cn(
          "min-h-0 w-full flex-col overflow-hidden bg-surface-1 md:m-2 md:mt-0 md:w-70 md:shrink-0 md:rounded-lg md:border md:border-line md:shadow-sm",
          showConversationMobile ? "hidden md:flex" : "flex",
        )}
      >
        <ChatSessionList
          sessions={sessions}
          activeId={activeId}
          isLoading={sessionsQ.isLoading}
          isError={sessionsQ.isError}
          onRetry={() => void sessionsQ.refetch()}
          onSelect={select}
          onNew={startNew}
          onRename={setRenameTarget}
          onDelete={setDeleteTarget}
        />
      </aside>

      {/* conversation canvas — transparent so the platform grid reads through, with an AI spotlight glow
          scoped to THIS region only (never the rail). Its peak sits a little below the top so it fades
          gently toward the navbar rather than hard-cutting against it. */}
      <section
        className={cn(
          "relative isolate min-h-0 flex-1 flex-col",
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
          onBack={back}
          onRename={setRenameTarget}
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
