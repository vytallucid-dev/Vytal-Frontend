"use client";

import { useQueries } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { OwnershipSeriesView } from "@/types/research-tools";
import type { FundamentalsView } from "@/types/fundamentals";
import type { StockPriceView } from "@/types/price";

// ─────────────────────────────────────────────────────────────────────────────────────
// THE per-member assembly hook — the shared spine for every NON-health PG lens.
//
// The PG /health endpoint yields the member roster (symbols + names) but NO per-stock
// detail. Each lens (ownership / fundamentals / price) is read from the EXISTING per-stock
// endpoint. This hook fans out one query per member, IN PARALLEL (6–14 members = 6–14
// concurrent calls — fast), and surfaces each as it lands so the UI renders PROGRESSIVELY
// rather than blocking on the slowest call. No backend changes (recon Option A).
//
// Reused verbatim by the Valuation (`price`) and Fundamentals (`fundamentals`) tabs — only
// the `kind` argument changes; the assembly shape, progressive-load contract and honest-
// empty handling are identical.
// ─────────────────────────────────────────────────────────────────────────────────────

/** The per-member lenses the PG tabs assemble client-side. */
export type MemberDataKind = "ownership" | "fundamentals" | "price";

/** kind → the read-model that endpoint returns. Keep in lockstep with ENDPOINT below. */
export interface MemberDataMap {
  ownership: OwnershipSeriesView;
  fundamentals: FundamentalsView;
  price: StockPriceView;
}

const ENDPOINT: Record<MemberDataKind, (symbol: string) => string> = {
  ownership: (s) => `/api/stocks/${s}/ownership?window=8`,
  fundamentals: (s) => `/api/stocks/${s}/fundamentals`,
  price: (s) => `/api/stocks/${s}/price`,
};

/** Minimal member identity — the PG health view's members[] satisfies this. */
export interface MemberLike {
  symbol: string;
  name: string;
}

/** One member's slot in the assembly — identity ALWAYS present, `data` once resolved.
 *  `isLoading` drives progressive render (pending rows show placeholders); `isError` /
 *  null data → honest "—", never a broken row. */
export interface MemberDatum<T> {
  symbol: string;
  name: string;
  data: T | null;
  isLoading: boolean;
  isError: boolean;
}

export interface PeerGroupMemberData<T> {
  members: MemberDatum<T>[];
  /** members that have settled (success OR error) — for the "n of m loaded" read. */
  resolvedCount: number;
  totalCount: number;
  /** true until the FIRST member resolves (first paint may show a table skeleton). */
  isInitialLoading: boolean;
  /** true once every member has settled. */
  isComplete: boolean;
}

/**
 * Assemble a per-member lens client-side, in parallel, progressively.
 *
 * @param peerGroupId  the pond id (namespaces the query cache)
 * @param members      roster from the PG health view (symbol + name)
 * @param kind         which per-stock read to fan out
 */
export function usePeerGroupMemberData<K extends MemberDataKind>(
  peerGroupId: string,
  members: MemberLike[],
  kind: K,
): PeerGroupMemberData<MemberDataMap[K]> {
  type T = MemberDataMap[K];

  const results = useQueries({
    queries: members.map((m) => ({
      queryKey: ["peer-group", peerGroupId, "member", kind, m.symbol] as const,
      queryFn: () => apiFetch<T>(ENDPOINT[kind](m.symbol)),
      enabled: Boolean(peerGroupId) && Boolean(m.symbol),
      staleTime: 5 * 60 * 1000, // member reads are quarter-grained — cache across tab switches
    })),
  });

  const data: MemberDatum<T>[] = members.map((m, i) => {
    const r = results[i];
    return {
      symbol: m.symbol,
      name: m.name,
      data: (r?.data as T | undefined) ?? null,
      isLoading: r?.isLoading ?? true,
      isError: r?.isError ?? false,
    };
  });

  const resolvedCount = data.filter((d) => !d.isLoading).length;

  return {
    members: data,
    resolvedCount,
    totalCount: members.length,
    isInitialLoading: resolvedCount === 0 && members.length > 0,
    isComplete: members.length > 0 && resolvedCount === members.length,
  };
}
