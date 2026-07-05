"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { WatchlistEntry, WatchlistResponse } from "@/types/watchlist";

const WATCHLIST_KEY = ["me", "watchlist"] as const;

/**
 * The authenticated user's pinned research surface → GET /api/v1/me/watchlist.
 * READ-ONLY: the backend serves the rich read-join (current health/band/tier/price +
 * fired findings + three-lens verdicts + the immutable pin-time baseline). This hook
 * never recomputes a score, band, finding or verdict — it renders what the server sent.
 */
export function useWatchlist() {
  return useQuery<WatchlistEntry[]>({
    queryKey: WATCHLIST_KEY,
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: WatchlistResponse }>(
        "/api/v1/me/watchlist",
      );
      return r.data.watchlist;
    },
  });
}

// ── mutations — pin (POST, idempotent) + unpin (DELETE, owner-scoped). Both invalidate
//    the watchlist so the list re-reads the server truth (baseline + fresh read-join).
//    We never optimistically fabricate a row's health/findings — the server is the only
//    source of the enriched read. ─────────────────────────────────────────────────────
export function useWatchlistMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: WATCHLIST_KEY });

  const pin = useMutation({
    mutationFn: (stockId: string) =>
      apiFetch<{ success: boolean; data: unknown }>("/api/v1/me/watchlist", {
        method: "POST",
        body: JSON.stringify({ stockId }),
      }),
    onSuccess: refresh,
    meta: {
      successMessage: "Pinned to watchlist",
      successDescription: "We captured today's health & price as your baseline.",
      errorMessage: "Couldn't pin that stock",
    },
  });

  const unpin = useMutation({
    mutationFn: (stockId: string) =>
      apiFetch<{ success: boolean; data: unknown }>(
        `/api/v1/me/watchlist/${encodeURIComponent(stockId)}`,
        { method: "DELETE" },
      ),
    onSuccess: refresh,
    meta: {
      successMessage: "Removed from watchlist",
      errorMessage: "Couldn't remove that stock",
    },
  });

  // Favorite toggle — OPTIMISTIC so the star flips instantly. We patch only the `favorite`
  // flag in the cached list (never a derived read), roll back on error, and reconcile with
  // the server on settle. The persisted flag is the source of truth.
  const setFavorite = useMutation({
    mutationFn: ({ stockId, favorite }: { stockId: string; favorite: boolean }) =>
      apiFetch<{ success: boolean; data: unknown }>(
        `/api/v1/me/watchlist/${encodeURIComponent(stockId)}`,
        { method: "PATCH", body: JSON.stringify({ favorite }) },
      ),
    onMutate: async ({ stockId, favorite }) => {
      await qc.cancelQueries({ queryKey: WATCHLIST_KEY });
      const prev = qc.getQueryData<WatchlistEntry[]>(WATCHLIST_KEY);
      if (prev) {
        qc.setQueryData<WatchlistEntry[]>(
          WATCHLIST_KEY,
          prev.map((e) => (e.stockId === stockId ? { ...e, favorite } : e)),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(WATCHLIST_KEY, ctx.prev);
    },
    onSettled: refresh,
    meta: {
      successMessage: (_data: unknown, vars: unknown) =>
        (vars as { favorite: boolean }).favorite ? "Added to favorites" : "Removed from favorites",
      errorMessage: "Couldn't update favorite",
    },
  });

  return { pin, unpin, setFavorite };
}
