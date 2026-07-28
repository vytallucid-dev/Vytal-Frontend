"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CHAT SESSIONS — the chat page's list (server-side visibility filter already applied:
// promoted=true = all chat_page sessions ∪ discuss sessions that were promoted).
//
//   GET    /api/v1/me/chat/sessions        → ChatSession[] (thin: no message count)
//   PATCH  /api/v1/me/chat/sessions/:id    → rename (sets titleSource=user)
//   DELETE /api/v1/me/chat/sessions/:id    → delete (owner-scoped; messages cascade)
//
// The LIST is a genuine server resource (multiple things read it; rename / delete / new-session / each
// exchange must refresh it) so it lives in React Query. The active CONVERSATION is local state (see
// use-chat-conversation) — an ephemeral transcript, not a cacheable resource.
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ChatSession } from "@/types/chat";

export const CHAT_SESSIONS_KEY = ["me", "chat", "sessions"] as const;

export function useChatSessions() {
  return useQuery<ChatSession[]>({
    queryKey: CHAT_SESSIONS_KEY,
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: { sessions: ChatSession[]; count: number } }>(
        "/api/v1/me/chat/sessions",
      );
      return r.data.sessions;
    },
  });
}

/** Rename a conversation. PATCH sets titleSource="user", which the title job already respects (it never
 *  overwrites a user title). Invalidates the list so the new title + ordering land. */
export function useRenameChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      apiFetch<{ success: boolean; data: unknown }>(`/api/v1/me/chat/sessions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAT_SESSIONS_KEY }),
    meta: { errorMessage: "Couldn't rename this conversation" },
  });
}

/** Delete a conversation (owner-scoped; the server cascades its messages). Invalidates the list. Uses
 *  the MutationCache convention: it toasts on success via meta.successMessage and on error via
 *  meta.errorMessage — so callers must NOT toast again (that would double-fire). */
export function useDeleteChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean; data: { removed: boolean; id: string } }>(
        `/api/v1/me/chat/sessions/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAT_SESSIONS_KEY }),
    meta: { successMessage: "Conversation deleted", errorMessage: "Couldn't delete this conversation" },
  });
}

/** Imperative list refresh — used after creating a blank session and after each exchange (title +
 *  lastMessageAt ordering change). */
export function useInvalidateChatSessions() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: CHAT_SESSIONS_KEY });
}
