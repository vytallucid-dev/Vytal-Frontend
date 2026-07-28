"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CHAT QUOTA — "can this reader send right now?", as SERVER state.
//
//   GET /api/v1/me/chat/quota → ChatQuota (read-only; the peek consumes nothing)
//
// WHY THIS IS A QUERY AND THE TRANSCRIPT IS NOT. The transcript is an ephemeral per-view thing; this is
// one small fact about the ACCOUNT that several independent views need to agree on — the chat page's
// composer, the sidekick panel's composer, and the blank-chat welcome, any two of which can be mounted
// at once. One query key means they read one answer and one request serves them all.
//
// ★ IT IS SEEDED, NOT POLLED. Every conversation fetch already carries the same state, and those writes
//   land here via `seedChatQuota` — so the first paint is correct with no extra request, and this hook's
//   own fetch is what a LONG-OPEN composer uses to re-check when the resetAt it was locked with passes.
//   There is no interval: nothing about a daily cap changes on its own except at a known instant.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ChatQuota } from "@/types/chat";

export const CHAT_QUOTA_KEY = ["me", "chat", "quota"] as const;

/** The answer we act on when the server hasn't told us otherwise. ⚠ OPTIMISTIC BY DESIGN — the same
 *  posture the server's own read takes: never lock a composer on an absence of information. */
export const QUOTA_UNKNOWN: ChatQuota = { canSend: true, scopeDenied: null, resetAt: null, unavailable: null };

export function useChatQuota() {
  return useQuery<ChatQuota>({
    queryKey: CHAT_QUOTA_KEY,
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: { quota: ChatQuota } }>("/api/v1/me/chat/quota");
      return r.data.quota;
    },
    // A cap changes at a known instant, not continuously: the conversation fetches keep this fresh, and
    // the composer asks explicitly when its own resetAt passes.
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/** Write the quota a conversation fetch carried into the shared cache — so the composer's lock arrives
 *  with the first paint rather than one request later. No-op when the response carried none. */
export function seedChatQuota(qc: QueryClient, quota: ChatQuota | undefined): void {
  if (quota) qc.setQueryData(CHAT_QUOTA_KEY, quota);
}

/** Imperative re-check — what the composer calls when the instant it was locked until has passed. */
export function useRefreshChatQuota() {
  const qc = useQueryClient();
  return () => void qc.refetchQueries({ queryKey: CHAT_QUOTA_KEY });
}
