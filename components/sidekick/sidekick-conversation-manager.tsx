"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE CONVERSATION MANAGER — opened by clicking the panel's title.
//
// ★ IT COVERS THE CONTENT REGION, NOT THE VIEWPORT, AND THAT IS THE WHOLE IDEA. It is positioned by its
// HOST (absolute inset-0 inside the frame it belongs to) rather than fixed to the window, so the sidekick
// panel stays fully visible beside it: the reader picks their next conversation with the current one
// still on screen, which is the thing a viewport-covering modal cannot do. On mobile the host is the
// panel itself — there is no second rail to avoid covering there, so it takes the whole surface.
//
// It owns NO list logic: the grouping, the rows, the rename and the delete are ChatSessionList and the
// two dialogs from /chat, unchanged. What this file adds is the frame, the search, and the routing of a
// pick back into the panel's driver.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatSessionList } from "@/components/chat/chat-session-list";
import { RenameChatDialog } from "@/components/chat/rename-chat-dialog";
import { DeleteChatDialog } from "@/components/chat/delete-chat-dialog";
import { useChatSessions } from "@/lib/api/hooks/use-chat-sessions";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/types/chat";
import { useSidekick, useSidekickActions } from "./sidekick-provider";

/** Match on everything a reader might remember a conversation by — its name, its ticker, its subject. */
function matches(s: ChatSession, q: string): boolean {
  return [s.title, s.subjectSymbol, s.subjectName].some((v) => (v ?? "").toLowerCase().includes(q));
}

export function SidekickConversationManager({ fullBleed = false }: { fullBleed?: boolean }) {
  const { managerOpen, chat } = useSidekick();
  const { setManagerOpen } = useSidekickActions();
  const sessionsQ = useChatSessions();
  const [query, setQuery] = useState("");
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);

  const q = query.trim().toLowerCase();
  const sessions = sessionsQ.data ?? [];
  const filtered = useMemo(() => (q ? sessions.filter((s) => matches(s, q)) : sessions), [sessions, q]);

  const close = () => setManagerOpen(false);
  const pick = (id: string) => {
    if (id !== chat.sessionId) chat.loadSession(id);
    close();
  };
  const startNew = () => {
    chat.startBlank();
    close();
  };
  // The open conversation was deleted → the panel must not keep showing a dead transcript.
  const onDeleted = (id: string) => {
    if (id === chat.sessionId) chat.startBlank();
  };

  const search = (
    <div className="flex items-center gap-2 rounded-lg border border-line2 bg-surface-2 px-2.5 py-1.5 transition-colors focus-within:border-line3">
      <Icons.search className="size-4 shrink-0 text-ink3" />
      <input
        value={query}
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search conversations…"
        aria-label="Search conversations"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink3"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="grid size-5 shrink-0 place-items-center rounded text-ink3 transition-colors hover:text-ink"
        >
          <Icons.close className="size-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {managerOpen && (
          <motion.div
            className="absolute inset-0 z-40 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {/* scrim over the content region only — dismisses on click, and keeps the page legible
                behind it so the reader never loses their place */}
            <button
              type="button"
              aria-label="Close conversations"
              onClick={close}
              className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-[1px]"
            />

            <motion.div
              className={cn(
                "relative flex min-h-0 w-full flex-col overflow-hidden bg-surface-1",
                fullBleed ? "h-full" : "m-2 max-w-sm rounded-xl border border-line shadow-2xl",
              )}
              initial={{ x: 18, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 18, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            >
              <ChatSessionList
                title="Conversations"
                toolbar={search}
                onClose={close}
                sessions={filtered}
                activeId={chat.sessionId}
                isLoading={sessionsQ.isLoading}
                isError={sessionsQ.isError}
                onRetry={() => void sessionsQ.refetch()}
                onSelect={pick}
                onNew={startNew}
                onRename={setRenameTarget}
                onDelete={setDeleteTarget}
                empty={
                  q ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <p className="text-[13px] font-medium text-ink2">Nothing matches “{query.trim()}”</p>
                      <p className="mt-1 text-[12px] text-ink3">Try a ticker, or part of the name.</p>
                    </div>
                  ) : undefined
                }
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The house dialogs, reused as-is — they portal to the body, so they sit above everything. */}
      <RenameChatDialog session={renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)} />
      <DeleteChatDialog
        session={deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onDeleted={onDeleted}
      />
    </>
  );
}
