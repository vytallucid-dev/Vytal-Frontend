"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { isApiError } from "@/lib/api/client";
import { QueryError } from "@/components/ui/query-error";
import { tint } from "@/components/stock-detail/health/shared";
import { Chip } from "@/components/stock-detail/overview/shared";
import { useResultDetail } from "@/lib/api/hooks/use-result-detail";
import SnapshotTab from "@/components/results/SnapshotTab";
import PnlTrendsTab from "@/components/results/PnlTrendsTab";
import ContextTab from "@/components/results/ContextTab";

const TABS = [
  { id: "snapshot", label: "Snapshot" },
  { id: "pnl", label: "P&L & Trends" },
  { id: "context", label: "Context" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const fmtFullDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function ViewerSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="shimmer h-28 rounded-xl bg-surface-2" />
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="shimmer h-40 rounded-xl bg-surface-2" />
        <div className="shimmer h-40 rounded-xl bg-surface-2" />
        <div className="shimmer h-40 rounded-xl bg-surface-2" />
      </div>
    </div>
  );
}

function ResultsViewerInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const symbol = String(params.ticker ?? "").toUpperCase();
  const period = searchParams.get("period") ?? undefined;
  const activeTab = (searchParams.get("tab") as TabId) ?? "snapshot";

  const { data, isLoading, isError, error, refetch } = useResultDetail(symbol, period);

  const pushParams = (next: Partial<{ tab: string; period: string }>) => {
    const p = new URLSearchParams(searchParams.toString());
    if (next.tab) p.set("tab", next.tab);
    if (next.period) p.set("period", next.period);
    router.push(`/results/${symbol}?${p.toString()}`, { scroll: false });
  };

  const detail = data?.data;

  // Quarter navigator — periodsAvailable is newest→oldest.
  const nav = useMemo(() => {
    if (!detail) return { newer: null as null | string, older: null as null | string };
    const list = detail.periodsAvailable;
    const i = list.findIndex((p) => p.periodKey === detail.current.periodKey);
    return {
      newer: i > 0 ? list[i - 1].periodKey : null,
      older: i >= 0 && i < list.length - 1 ? list[i + 1].periodKey : null,
    };
  }, [detail]);

  if (isLoading) return <ViewerSkeleton />;

  if (isError || !detail) {
    const msg =
      isApiError(error) && error.status === 404
        ? `No filed results found for ${symbol} yet.`
        : "We couldn't load this result.";
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/results"
          className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink2 transition-colors hover:text-ink"
        >
          <Icons.caretRight className="h-3.5 w-3.5 rotate-180" />
          Back to results
        </Link>
        <QueryError message={msg} onRetry={() => refetch()} />
      </div>
    );
  }

  const c = detail.current;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
      {/* back */}
      <Link
        href="/results"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-ink2 transition-colors hover:text-ink"
      >
        <Icons.caretRight className="h-3.5 w-3.5 rotate-180" />
        Back to results
      </Link>

      {/* header */}
      <div className="mt-3 flex flex-col gap-3  pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h1 className="text-[24px] font-semibold tracking-tight text-ink">{detail.name}</h1>
            <span className="num text-[15px] font-medium text-ink2">
              {c.quarter} {c.fiscalYear}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink3">
            {detail.symbol}
            {detail.sector ? ` · ${detail.sector}` : ""}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Chip>Filed {fmtFullDay(c.filingDate)}</Chip>
            <Chip tone="accent">{c.resultType}</Chip>
            {c.xbrlUrl && (
              <a
                href={c.xbrlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-surface-2 px-2.5 py-1 text-[11.5px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
              >
                View filing
                <Icons.arrowUpRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* quarter navigator */}
        <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-line2 text-[12px]">
          <button
            disabled={!nav.older}
            onClick={() => nav.older && pushParams({ period: nav.older })}
            className="flex items-center gap-1 px-3 py-1.5 text-ink2 transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icons.caretRight className="h-3.5 w-3.5 rotate-180" />
            Older
          </button>
          <span className="h-5 w-px bg-line2" />
          <button
            disabled={!nav.newer}
            onClick={() => nav.newer && pushParams({ period: nav.newer })}
            className="flex items-center gap-1 px-3 py-1.5 text-ink2 transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Newer
            <Icons.caretRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* tab bar */}
      <div className="mt-1 flex gap-1 overflow-x-auto overflow-y-hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => pushParams({ tab: t.id })}
            className={cn(
              "relative whitespace-nowrap px-4 py-2.5 text-[13px] font-medium transition-colors",
              activeTab === t.id
                ? "text-ink"
                : "text-ink3 hover:text-ink2",
            )}
          >
            {t.label}
            {activeTab === t.id && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full" style={{ background: "var(--p-found)" }} />
            )}
          </button>
        ))}
      </div>

      {/* content */}
      <div>
        {activeTab === "snapshot" && <SnapshotTab data={detail} onTab={(t) => pushParams({ tab: t })} />}
        {activeTab === "pnl" && <PnlTrendsTab data={detail} />}
        {activeTab === "context" && <ContextTab data={detail} />}
      </div>
    </div>
  );
}

export default function ResultsViewerPage() {
  return (
    <Suspense fallback={<ViewerSkeleton />}>
      <ResultsViewerInner />
    </Suspense>
  );
}
