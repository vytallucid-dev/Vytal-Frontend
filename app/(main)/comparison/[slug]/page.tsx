"use client";

/**
 * Comparison VIEW route — /comparison/[slug] where slug = "SYMBOL1-vs-SYMBOL2".
 *
 * Parses the pair, fetches the curated /api/compare payload (useComparison), and hands
 * it to <ComparisonView>. The alignment service owns the comparability thinking; this
 * route only resolves the slug and the loading/error/empty states. NO mock data, NO
 * winner — the old phantom-metric components are gone.
 */

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useComparison } from "@/lib/api/hooks/use-comparison";
import { QueryError } from "@/components/ui/query-error";
import { Icons } from "@/lib/icons";
import { ComparisonView } from "@/components/comparison/view/comparison-view";

function parseSlug(slug: string | undefined): { a: string | null; b: string | null } {
  if (!slug) return { a: null, b: null };
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return { a: null, b: null };
  const a = parts[0]?.toUpperCase().trim() || null;
  const b = parts[1]?.toUpperCase().trim() || null;
  return { a, b };
}

export default function ComparisonResultPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : undefined;

  const { a, b } = useMemo(() => parseSlug(slug), [slug]);
  const query = useComparison(a, b);

  // Malformed slug — can't resolve a pair.
  if (!a || !b || a === b) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-line2">
          <Icons.scales className="h-6 w-6 text-ink3" />
        </div>
        <h1 className="text-xl font-semibold text-ink">Couldn&apos;t read this comparison</h1>
        <p className="text-sm text-ink2">
          The link should look like{" "}
          <span className="num text-ink">/comparison/HDFCBANK-vs-ICICIBANK</span>. Pick two
          stocks to start a fresh comparison.
        </p>
        <button
          type="button"
          onClick={() => router.push("/comparison")}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-line2/40"
        >
          <Icons.scales className="h-4 w-4" />
          Choose two stocks
        </button>
      </div>
    );
  }

  if (query.isLoading) {
    return <ComparisonSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        <QueryError
          message={`Couldn't load the comparison for ${a} vs ${b}. One or both may not be in the universe.`}
          onRetry={() => query.refetch()}
        />
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => router.push("/comparison")}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-line2/40"
          >
            <Icons.scales className="h-4 w-4" />
            Pick two stocks
          </button>
        </div>
      </div>
    );
  }

  return <ComparisonView view={query.data} />;
}

function ComparisonSkeleton() {
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
