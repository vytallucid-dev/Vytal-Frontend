"use client";

import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { toast } from "@/components/ui/toast";

// ─────────────────────────────────────────────────────────────────────────────
// Global mutation feedback. Every write in the app flows through React Query, so the
// MutationCache is the one place to guarantee a toast fires for EVERY action — no per
// call-site wiring, no forgotten error path.
//
//   • onError   — always toast (a mutation that failed is always worth surfacing),
//                 using the server's message when we have one. Opt out with
//                 meta.suppressErrorToast, override copy with meta.errorMessage.
//   • onSuccess — toast only when the mutation declares meta.successMessage (a string,
//                 or a fn of (data, variables) for action-aware copy). Reads/optimistic
//                 chatter stays quiet unless it opts in.
//
// Individual mutations set these via `meta` in their useMutation definition.
// ─────────────────────────────────────────────────────────────────────────────

type Msg<T> = string | ((data: T, variables: unknown) => string);

interface ToastMeta {
  successMessage?: Msg<unknown>;
  successDescription?: Msg<unknown>;
  errorMessage?: string;
  errorDescription?: string;
  suppressErrorToast?: boolean;
}

function resolve(msg: Msg<unknown> | undefined, data: unknown, variables: unknown): string | undefined {
  if (msg == null) return undefined;
  return typeof msg === "function" ? msg(data, variables) : msg;
}

/** Pull a human message off whatever the fetch layer threw (HttpError.apiError, ApiError, Error). */
function errorMessageOf(error: unknown): string {
  const api = (error as { apiError?: { message?: string; status?: number } })?.apiError;
  if (api?.status === 401) return "Please sign in and try again.";
  if (api?.message) return api.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState so each request gets a fresh client in SSR; avoids shared state across users
  const [client] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error, _variables, _ctx, mutation) => {
            const meta = mutation.meta as ToastMeta | undefined;
            if (meta?.suppressErrorToast) return;
            toast.error(meta?.errorMessage ?? errorMessageOf(error), {
              description: meta?.errorDescription,
            });
          },
          onSuccess: (data, variables, _ctx, mutation) => {
            const meta = mutation.meta as ToastMeta | undefined;
            const title = resolve(meta?.successMessage, data, variables);
            if (!title) return;
            toast.success(title, {
              description: resolve(meta?.successDescription, data, variables),
            });
          },
        }),
        defaultOptions: {
          queries: {
            // Health data updates quarterly — 5-minute client-side freshness is generous
            staleTime: 5 * 60 * 1000,
            // ── ⚠ gcTime ≠ staleTime, AND THIS ONE WAS NEVER SET ────────────────────────────────
            // `staleTime` decides when a cached entry is REFETCHED IN THE BACKGROUND; `gcTime`
            // decides when it is DELETED once nothing is mounted. This block never set gcTime, so it
            // ran on React Query's 5-minute default — shorter than a browse session. Navigate away
            // from a page for six minutes and its payloads are gone: not stale, GONE, so coming back
            // is a cold fetch with a spinner rather than a stale-then-revalidate.
            //
            // That default is now the main defence on the dashboard → watchlist path. The sparkline
            // fix means the dashboard no longer warms the full-history price cache, so the watchlist
            // refetches 11.5 KB gzip per symbol; with a 30-minute gcTime it pays that once per
            // session instead of once per six-minute gap. Serving stale-then-revalidating is
            // strictly better than serving nothing — the data cadence here is quarterly.
            gcTime: 30 * 60 * 1000,
            retry: 1,
            // Tab re-focus should not trigger refetches for this data cadence
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
