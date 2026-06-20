"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState so each request gets a fresh client in SSR; avoids shared state across users
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Health data updates quarterly — 5-minute client-side freshness is generous
            staleTime: 5 * 60 * 1000,
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
