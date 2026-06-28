"use client";

/**
 * Peer-group comparison VIEW route — /comparison/pg/[slug] where slug = "ID_A-vs-ID_B".
 *
 * SEPARATE from the stock route (/comparison/[slug], which parses SYM-vs-SYM): PG ids are
 * opaque (UUID-shaped), not symbol-shaped, so overloading the same slug would collide. The
 * "-vs-" delimiter is safe here because UUIDs are hex and can't contain "vs".
 *
 * Fetches both fields' /api/peer-groups/:id/health (cache-warm from the landing's pre-fetch)
 * and hands them to <PgComparisonView>, the distribution-alignment surface. This route only
 * resolves the slug and the loading/error states.
 */

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icons } from "@/lib/icons";
import { QueryError } from "@/components/ui/query-error";
import { usePeerGroupHealth } from "@/lib/api/hooks/use-peer-group-health";
import { PgComparisonView } from "@/components/comparison/pg-view/pg-comparison-view";

function parseSlug(slug: string | undefined): { a: string | null; b: string | null } {
  if (!slug) return { a: null, b: null };
  // UUID-shaped ids can't contain "vs", so a plain split on the delimiter is safe.
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return { a: null, b: null };
  const a = parts[0]?.trim() || null;
  const b = parts[1]?.trim() || null;
  return { a, b };
}

export default function PeerGroupComparisonResultPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : undefined;

  const { a, b } = useMemo(() => parseSlug(slug), [slug]);

  // Both aggregates — cached by ["peer-group", id, "health"], pre-warmed by the landing.
  const groupA = usePeerGroupHealth(a ?? "");
  const groupB = usePeerGroupHealth(b ?? "");

  // Malformed slug — can't resolve a pair.
  if (!a || !b || a === b) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-line2">
          <Icons.stack className="h-6 w-6 text-ink3" />
        </div>
        <h1 className="text-xl font-semibold text-ink">Couldn&apos;t read this comparison</h1>
        <p className="text-sm text-ink2">
          A peer-group comparison link looks like{" "}
          <span className="num text-ink">/comparison/pg/ID_A-vs-ID_B</span>. Pick two peer
          groups to start a fresh comparison.
        </p>
        <button
          type="button"
          onClick={() => router.push("/comparison")}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-line bg-surface-1 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-line2/40"
        >
          <Icons.stack className="h-4 w-4" />
          Choose two peer groups
        </button>
      </div>
    );
  }

  if (groupA.isLoading || groupB.isLoading) {
    return <PgComparisonSkeleton />;
  }

  if (groupA.isError || groupB.isError || !groupA.data || !groupB.data) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        <QueryError
          message="Couldn't load one or both peer groups. They may not be scored or may no longer exist."
          onRetry={() => {
            groupA.refetch();
            groupB.refetch();
          }}
        />
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => router.push("/comparison")}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-1 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-line2/40"
          >
            <Icons.stack className="h-4 w-4" />
            Pick two peer groups
          </button>
        </div>
      </div>
    );
  }

  return <PgComparisonView a={groupA.data} b={groupB.data} />;
}

function PgComparisonSkeleton() {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="shimmer h-24 flex-1 rounded-xl bg-surface-2" />
        <div className="shimmer h-24 flex-1 rounded-xl bg-surface-2" />
      </div>
      <div className="shimmer mt-4 h-12 rounded-xl bg-surface-2" />
      <div className="shimmer mt-6 h-72 rounded-xl bg-surface-2" />
    </div>
  );
}
