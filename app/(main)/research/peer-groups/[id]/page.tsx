"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePeerGroupHealth } from "@/lib/api/hooks/use-peer-group-health";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ComingSoonPanel } from "@/components/peer-group/coming-soon-panel";
import { PeerGroupHealth } from "@/components/peer-group/health";
import { PeerGroupShareholding } from "@/components/peer-group/ownership";
import { PeerGroupValuation } from "@/components/peer-group/valuation";
import { PeerGroupFundamentals } from "@/components/peer-group/fundamentals";
import { PeerGroupOverview } from "@/components/peer-group/overview";

const PAGE_WRAP = "mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 sm:gap-6";

type TabId =
  | "health"
  | "overview"
  | "fundamentals"
  | "valuation"
  | "shareholding";
const TABS: { id: TabId; label: string; real: boolean }[] = [
  { id: "overview", label: "Overview", real: true },
  { id: "health", label: "Health", real: true },
  { id: "fundamentals", label: "Fundamentals", real: true },
  { id: "valuation", label: "Valuation", real: true },
  { id: "shareholding", label: "Shareholding", real: true }
];

export default function PeerGroupDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { data, isLoading, isError, error, refetch } = usePeerGroupHealth(id);

  if (isLoading) {
    return (
      <div className={PAGE_WRAP}>
        <QuerySkeleton rows={6} rowHeight="h-16" className="mt-2" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className={PAGE_WRAP}>
        <QueryError
          message={(error as Error)?.message ?? "Failed to load peer group"}
          onRetry={() => refetch()}
          className="mt-2"
        />
      </div>
    );
  }
  if (!data) return null;

  const { identity } = data;

  return (
    <div className={PAGE_WRAP}>
      {/* Quiet back-link (single link, not a breadcrumb). */}
      <Link
        href="/research/peer-groups"
        className="inline-flex w-fit items-center gap-1.5 text-xs text-ink3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Peer Groups
      </Link>

      {/* Chrome — identity ONLY. No aggregate numbers here (the Health tab owns them). */}
      <header className="flex flex-col gap-2">
        <h1 className="hero-name font-display text-2xl font-bold sm:text-3xl">
          {identity.displayName}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink2">
          <span className="num">{identity.memberCount} stocks</span>
          {identity.sector && (
            <>
              <span className="text-ink3">·</span>
              <Badge variant="outline">{identity.sector.displayName}</Badge>
            </>
          )}
        </div>
      </header>

      {!data.scored ? (
        // Index hides unscored ponds, but guard anyway.
        <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-card py-16 text-center">
          <p className="text-sm font-medium text-ink2">Not yet scored</p>
          <p className="max-w-sm text-[12px] text-ink3">
            This pond has no in-force snapshots yet. Coverage is rolling out.
          </p>
        </div>
      ) : (
        <>
          {/* Tab row — custom button tabs (matches the stock/sector detail pattern). */}
          <div className="flex gap-1 overflow-x-auto border-b border-line">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : tab.real
                      ? "text-ink2 hover:text-ink"
                      : "text-ink3/60 hover:text-ink3",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {tab.label}
                  {!tab.real && (
                    <span className="rounded-full border border-line2 px-1.5 py-px text-[9px] uppercase tracking-wider text-ink3">
                      soon
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Panels. */}
          <div>
            {activeTab === "health" && <PeerGroupHealth view={data} />}
            {activeTab === "overview" && (
              <PeerGroupOverview peerGroupId={id} view={data} onOpenTab={setActiveTab} />
            )}
            {activeTab === "fundamentals" && (
              <PeerGroupFundamentals peerGroupId={id} members={data.members} />
            )}
            {activeTab === "valuation" && (
              <PeerGroupValuation peerGroupId={id} members={data.members} />
            )}
            {activeTab === "shareholding" && (
              <PeerGroupShareholding peerGroupId={id} members={data.members} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
