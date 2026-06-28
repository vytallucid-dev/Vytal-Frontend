"use client";

import Activity from "@/components/stock-detail/activity";
import Events from "@/components/stock-detail/events";
import Fundamentals from "@/components/stock-detail/fundamentals";
import HealthScore from "@/components/stock-detail/health";
import News from "@/components/stock-detail/news";
import Overview from "@/components/stock-detail/overview";
import Technical from "@/components/stock-detail/technical";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { Icons } from "@/lib/icons";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { isApiError } from "@/lib/api/client";
import type { Stock } from "@/lib/indian-stocks-data";
import type { LabelBand } from "@/types/health";
import { ArrowLeft, Bell, ChevronDown, Plus, Star } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const BAND_BADGE: Record<LabelBand, string> = {
  pristine: "border-pristine/30 bg-pristine/10 text-pristine",
  healthy: "border-healthy/30 bg-healthy/10 text-healthy",
  steady: "border-steady/30 bg-steady/10 text-steady",
  below_par: "border-below/30 bg-below/10 text-below",
  fragile: "border-fragile/30 bg-fragile/10 text-fragile",
};

const StockDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbol = (params.symbol as string)?.toUpperCase();
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: health,
    isLoading,
    isError,
    error,
    refetch,
  } = useStockHealth(symbol);

  // Handle URL query parameters for tab and section navigation
  useEffect(() => {
    const tab = searchParams.get("tab");
    const section = searchParams.get("section");

    if (tab) setActiveTab(tab);

    if (section) {
      // Wait for tab content to render before scrolling
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [searchParams]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-baseline gap-3">
          <div className="shimmer h-9 w-32 rounded-lg bg-surface-2" />
          <div className="shimmer h-5 w-48 rounded bg-surface-2" />
        </div>
        <QuerySkeleton rows={6} rowHeight="h-16" />
      </div>
    );
  }

  // ── Off-platform / fetch error (404 = symbol not in universe) ─────────────
  if (isError || !health) {
    const maybeApiErr = (error as unknown as { apiError?: unknown })?.apiError;
    const apiErr = isApiError(maybeApiErr) ? maybeApiErr : null;
    const notFound = apiErr?.status === 404;

    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface-1 p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-line2 bg-surface-2">
            <Icons.search weight="duotone" className="size-6 text-ink3" />
          </div>
          <h2 className="font-display text-xl font-semibold text-ink">
            {notFound
              ? "Stock not in our universe"
              : "Couldn't load this stock"}
          </h2>
          <p className="mt-2 text-sm text-ink2">
            {notFound
              ? `“${symbol}” isn't part of the tracked universe yet.`
              : `Something went wrong loading ${symbol}.`}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/research/stock-screener")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to screener
            </Button>
            {!notFound && (
              <Button onClick={() => refetch()}>
                <Icons.refresh className="mr-2 h-4 w-4" />
                Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { identity, verdict } = health;

  // Stock identity from the live universe (not the legacy static list).
  const stock: Stock = {
    symbol: identity.symbol,
    name: identity.name,
    sector: identity.sector?.displayName ?? "—",
    exchange: "NSE",
  };

  // The detail surface is the SAME for scored and not-yet-scored stocks — every tab
  // renders identically; only the Health Score tab (<HealthScore />) shows its own
  // honest not-scored placeholder when there's no score. The header band badge is
  // shown only when a verdict exists; otherwise a neutral "Not yet scored" chip.
  const scored = health.scored && !!verdict;

  return (
    <div className="min-h-screen pb-12">
      {/* HEADER */}
      <div className="border-b border-line bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: Company Info */}
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <h1 className="font-display text-3xl font-semibold text-ink">
                  {stock.symbol}
                </h1>
                <span className="text-lg text-ink2">{stock.name}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{stock.exchange}</Badge>
                {stock.sector !== "—" && (
                  <Badge variant="secondary">{stock.sector}</Badge>
                )}
                {scored && verdict ? (
                  <Badge className={BAND_BADGE[verdict.label.band]}>
                    <span className="num">{verdict.composite.toFixed(1)}</span>
                    <span className="ml-1">· {verdict.label.label}</span>
                  </Badge>
                ) : (
                  <Badge className="border-line2 bg-surface-2 text-ink3">
                    Not yet scored
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/research/stock-screener")}
                className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-ink3 underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to screener
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Quick Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Portfolio
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="mr-2 h-4 w-4" />
                    Watchlist
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    Set Alert
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex overflow-x-auto border-b border-line">
            {[
              { id: "overview", label: "Overview" },
              { id: "health", label: "Health Score" },
              { id: "fundamentals", label: "Fundamentals" },
              { id: "technical", label: "Technical" },
              { id: "activity", label: "Activity" },
              { id: "events", label: "Events" },
              { id: "news", label: "Disclosures" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.push(
                    `/research/stock-screener/${symbol}?tab=${tab.id}`,
                  );
                }}
                className={`relative whitespace-nowrap px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-ink3 hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="mx-auto max-w-7xl px-6 py-8 pt-0">
        {activeTab === "overview" && <Overview symbol={symbol} />}
        {activeTab === "health" && <HealthScore />}
        {activeTab === "fundamentals" && <Fundamentals />}
        {activeTab === "technical" && <Technical />}
        {activeTab === "activity" && <Activity />}
        {activeTab === "events" && <Events />}
        {activeTab === "news" && <News symbol={symbol} />}
      </div>
    </div>
  );
};

export default StockDetailPage;
