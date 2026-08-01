"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { CatalogueDocument } from "@/lib/findings/catalogue-store";

/** The `/api/v1/*` envelope, typed the way results/compare already type theirs. */
interface Envelope<T> {
  success: boolean;
  data: T;
}

/**
 * THE COPY CATALOGUE — every finding's name, description and interpretive boundary, plus the
 * three-lens faces and the two boundary maps. Static product vocabulary; changes on DEPLOY ONLY.
 *
 * ── 1e · FETCH + CACHE STRATEGY, AND WHY ──────────────────────────────────────────────────────────
 *
 *   ONE REQUEST, AT THE ROOT.  `CatalogueProvider` is the only component that calls this hook, and it
 *     is mounted once in the root layout. Nothing else fetches copy; every other surface reads the
 *     module store the provider hydrates. So there is exactly one request per page load, no matter how
 *     many finding cards render.
 *
 *   staleTime: Infinity      The content cannot change while the tab is open — it changes when the
 *                            backend is redeployed. Cross-session freshness is the HTTP layer's job
 *                            and it is already doing it: `public, max-age=3600,
 *                            stale-while-revalidate=86400` + an ETag, so a new deploy reaches a
 *                            returning reader within the hour, instantly, off a background refresh.
 *                            A client-side timer on top of that would only add refetches that 304.
 *
 *   gcTime: Infinity         Never evict. Evicting means the next surface to mount renders BUNDLED
 *                            copy until the refetch lands — a visible flicker between two versions of
 *                            the same sentence, for no benefit.
 *
 *   refetchOnMount: false    ⚠ EXPLICIT, not inherited. `staleTime: Infinity` already prevents a
 *   refetchOnWindowFocus     remount refetch, but stating all three means a future default change in
 *   refetchOnReconnect       QueryProvider cannot silently turn one page's copy into 40 requests.
 *
 *   retry: 2                 A transient failure on the FIRST load would otherwise strand the whole
 *                            session on bundled copy — the fallback is meant to cover an outage, not
 *                            a flaky first packet.
 *
 * ── WHY THE FULL DOCUMENT AND NOT THE TWO SEGMENTS THE FRONTEND ACTUALLY READS ────────────────────
 * The frontend uses `stock_finding` (17.3 KB) and `lens_face` (6.6 KB) and does not use
 * `phs_finding` (portfolio findings arrive with their boundary already inline on the PHS payload) or
 * `guardrail_signature` (not surfaced to readers yet). Fetching the two segments would save ~29 KB
 * uncompressed — but it costs TWO requests, two ETags, and the possibility of holding two segments
 * from different deploys. One request that gzips well is the better trade. The segment doors still
 * earn their keep for the alert picker, which takes the 1.9 KB names projection instead of all of it.
 */
export function useCatalogue() {
  return useQuery<Envelope<CatalogueDocument>>({
    queryKey: ["catalogue"],
    queryFn: () => apiFetch<Envelope<CatalogueDocument>>("/api/v1/catalogue"),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });
}

/** key → display name, ~1.9 KB. The alert picker's projection — see `lib/alerts`. */
export interface CatalogueNames {
  version: string;
  count: number;
  names: Record<string, string>;
}

/**
 * 1d · THE ALERT PICKER'S DOOR. A dropdown needs 35 names; it has no use for descriptions,
 * boundaries, families or concerns. This is ~1/28th of the full document.
 *
 * Same cache posture as the full catalogue, and a separate query key so a picker that opens before
 * the root fetch resolves does not wait on 54 KB to render a select.
 */
export function useCatalogueNames() {
  return useQuery<Envelope<CatalogueNames>>({
    queryKey: ["catalogue", "names"],
    queryFn: () => apiFetch<Envelope<CatalogueNames>>("/api/v1/catalogue/names"),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });
}
