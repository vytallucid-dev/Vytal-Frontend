"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/components/providers/auth-provider";
import type { RelationalState } from "@/types/relational";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// useRelationalState — the reader-relative Overview card → GET /api/v1/relational/stock/:stockId.
//
// One hook serves BOTH readers: `apiFetch` attaches the bearer token when a session exists and never
// blocks when it doesn't, and the endpoint (optionalAuth) resolves an anonymous M9 card with no token.
//
// ── AUTH-TRANSITION CORRECTNESS (the critical requirement) ──────────────────────────────────────────
// This card lives on a PUBLIC page and renders for signed-in AND anonymous readers, so a stale cached
// card must never survive a sign-in/sign-out. Existing /me/* queries do NOT self-invalidate on auth
// change — the AuthProvider mirrors the session into context but never touches the query cache; those
// hooks rely on route-protection instead (they only mount on authed pages), so an auth transition simply
// unmounts them. That mechanism is unavailable here (the page is public). The minimum, self-contained
// fix is to fold the READER IDENTITY into the query key: sign-in/sign-out changes `user?.id`, which
// changes the key, so React Query fetches the correct card under a fresh key and can never serve the
// previous reader's card from cache. The key is also namespaced ["relational", …] so it can never
// collide with the public ["stock", symbol, …] reads.
//
// Gated on `!authLoading` so the very first fetch already knows who is asking — no anonymous-card flash
// for a signed-in reader on load. This gates only THIS query; the Overview's other sections fetch on
// their own timing and are never blocked.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

export function useRelationalState(stockId: string | null) {
  const { user, loading: authLoading } = useAuth();
  const readerKey = user?.id ?? "anon"; // reader identity — flips the key on sign-in / sign-out

  return useQuery<RelationalState>({
    queryKey: ["relational", "stock", stockId, readerKey],
    enabled: !authLoading && Boolean(stockId),
    // A supplementary card: a failed fetch renders nothing (the component returns null), so retries are
    // pointless noise. Keep it to a single attempt.
    retry: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: RelationalState }>(
        `/api/v1/relational/stock/${encodeURIComponent(stockId as string)}`,
      );
      return r.data;
    },
  });
}
