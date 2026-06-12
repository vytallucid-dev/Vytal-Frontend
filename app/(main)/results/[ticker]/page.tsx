"use client";

import { hdfcBankQ2FY26Data } from "@/lib/results-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitCompare,
  Plus,
} from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import SnapshotTab from "@/components/results/SnapshotTab";
import PnlTrendsTab from "@/components/results/PnlTrendsTab";
import ContextTab from "@/components/results/ContextTab";

const TABS = [
  { id: "snapshot", label: "Snapshot" },
  { id: "pnl", label: "P&L & Trends" },
  { id: "context", label: "Context" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Inner Page (reads searchParams) ────────────────────────────────────────

function ResultsViewerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab: TabId = (searchParams.get("tab") as TabId) ?? "snapshot";

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onTabChange = (tab: string) => setTab(tab as TabId);

  const data = hdfcBankQ2FY26Data;
  const { stock, current, prevQuarterNav, nextQuarterNav } = data;

  const filingDateFormatted = new Date(current.filingDate).toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short", year: "numeric" },
  );

  return (
    <div className="min-h-screen pb-16">
      {/* ── STICKY HEADER ──────────────────────────────────────────── */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/60">
        <div className={`transition-all duration-300 py-4`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              {/* LEFT — Identity */}
              <div className="flex flex-col gap-1.5">
                {/* Company name + Quarter */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1
                    className={`font-bold leading-tight transition-all text-3xl`}
                  >
                    {stock.companyName}
                  </h1>
                  <span
                    className={`font-semibold text-muted-foreground transition-all text-xl`}
                  >
                    {current.quarter} {current.fiscalYear}
                  </span>
                </div>

                {/* Ticker · Sector */}

                <p className="text-sm text-muted-foreground">
                  {stock.ticker} · {stock.sector}
                </p>

                {/* Meta pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Filed {filingDateFormatted}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${
                      current.resultType === "consolidated"
                        ? "border-blue-500/40 text-blue-500 bg-blue-500/5"
                        : "border-amber-500/40 text-amber-500 bg-amber-500/5"
                    }`}
                  >
                    {current.resultType}
                  </Badge>
                  <a
                    href={current.xbrlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-full px-2.5 py-0.5 transition-colors hover:border-border"
                  >
                    View XBRL
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* RIGHT — Navigator + Actions */}
              <div className="flex flex-col items-start lg:items-end gap-3">
                {/* Quarter navigator */}
                <div className="flex items-center rounded-lg border border-border/60 overflow-hidden text-sm">
                  <button
                    disabled={!prevQuarterNav}
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    {prevQuarterNav
                      ? `${prevQuarterNav?.quarter} ${prevQuarterNav?.fiscalYear}`
                      : "—"}
                  </button>
                  <div className="w-px h-6 bg-border/60" />
                  <button
                    disabled={!nextQuarterNav}
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {nextQuarterNav
                      ? `${nextQuarterNav?.quarter} ${nextQuarterNav?.fiscalYear}`
                      : "—"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <GitCompare className="w-3.5 h-3.5" />
                    Compare
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <Bell className="w-3.5 h-3.5" />
                    Alert
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="gap-1.5 h-8">
                        <Plus className="w-3.5 h-3.5" />
                        Add to Portfolio
                        <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Portfolio
                      </DropdownMenuItem>
                      <DropdownMenuItem>Add to Watchlist</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TAB BAR ───────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "snapshot" && (
          <SnapshotTab data={data} onTabChange={onTabChange} />
        )}
        {activeTab === "pnl" && <PnlTrendsTab data={data} />}
        {activeTab === "context" && (
          <ContextTab data={data} onTabChange={onTabChange} />
        )}
      </div>
    </div>
  );
}

// ─── Page Export (Suspense wrapper for useSearchParams) ──────────────────────

export default function ResultsViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      }
    >
      <ResultsViewerInner />
    </Suspense>
  );
}
