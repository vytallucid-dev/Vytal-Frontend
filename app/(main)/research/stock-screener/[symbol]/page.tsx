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
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { CreateAlertModal } from "@/components/alerts/create-alert-modal";
import { TransactionSheet } from "@/components/portfolio/transaction-sheet";
import { Icons, type Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { roundScore } from "@/lib/format";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import { useWatchlist, useWatchlistMutations } from "@/lib/api/hooks/use-watchlist";
import { useStockAttentionTracking } from "@/lib/tracking/use-stock-attention";
import { isApiError } from "@/lib/api/client";
import type { Stock } from "@/lib/indian-stocks-data";
import type { LabelBand } from "@/types/health";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const BAND_BADGE: Record<LabelBand, string> = {
  pristine: "border-pristine/30 bg-pristine/10 text-pristine",
  healthy: "border-healthy/30 bg-healthy/10 text-healthy",
  steady: "border-steady/30 bg-steady/10 text-steady",
  below_par: "border-below/30 bg-below/10 text-below",
  fragile: "border-fragile/30 bg-fragile/10 text-fragile",
};

// ── the three quick actions — the app's standard outline button (border-line2 / surface-1 /
//    ink2, matching the Button `outline` variant + the header's other controls), with the
//    only colour being a subtly-accented duotone icon glyph (the same colour-icon-on-neutral
//    idiom the alert modal uses). A toggle in its ON state (watchlist) fills with its accent
//    tint — the app's active-toggle convention (cf. the watchlist Favorites toggle) — so an
//    active state reads clearly without the trio shouting at rest. Icon always shows; the
//    label hides below `sm` so three buttons + the back-link never overflow a phone header. ──
function QuickActionButton({
  icon: ActionIcon,
  label,
  color,
  active,
  busy,
  onClick,
}: {
  icon: Icon;
  label: string;
  color: string;
  active?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      title={label}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:px-3 sm:text-[13px]",
        !active && "border-line2 bg-surface-1 text-ink2 hover:border-line3 hover:bg-surface-2 hover:text-ink",
      )}
      style={
        active
          ? {
              color,
              borderColor: `color-mix(in oklch, ${color} 40%, transparent)`,
              background: `color-mix(in oklch, ${color} 12%, transparent)`,
            }
          : undefined
      }
    >
      {busy ? (
        <Icons.spinner className="size-3.5 animate-spin sm:size-4" />
      ) : (
        <ActionIcon
          weight={active ? "fill" : "duotone"}
          className="size-3.5 sm:size-4"
          style={active ? undefined : { color }}
        />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

const StockDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbol = (params.symbol as string)?.toUpperCase();
  const [activeTab, setActiveTab] = useState("overview");
  const [alertOpen, setAlertOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  const {
    data: health,
    isLoading,
    isError,
    error,
    refetch,
  } = useStockHealth(symbol);

  // Quick-action state (header buttons). Resolved independently of the health fetch above —
  // health's `identity` carries no raw stock id, and the watchlist pin needs the universe id.
  const { data: universe } = useUniverseStocks();
  const stockId = useMemo(() => universe?.find((s) => s.symbol === symbol)?.id ?? null, [universe, symbol]);
  const { data: watchlist } = useWatchlist();
  const isWatchlisted = useMemo(
    () => (stockId ? (watchlist?.some((w) => w.stockId === stockId) ?? false) : false),
    [watchlist, stockId],
  );
  const { pin, unpin } = useWatchlistMutations();
  const watchlistBusy = pin.isPending || unpin.isPending;
  const toggleWatchlist = () => {
    if (!stockId || watchlistBusy) return;
    if (isWatchlisted) unpin.mutate(stockId);
    else pin.mutate(stockId);
  };

  // Behaviour tracking (Phase 2): view on stock-resolve, tab-dwell on switch, and publish the current
  // stock for section-expand emitters. All effect-only — nothing runs on render. Called before the
  // early returns below so the hook order is stable.
  useStockAttentionTracking(stockId, activeTab);

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
      <div className=" border-line bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-0 sm:px-6 py-4">
          <div className="flex flex-col gap-4 px-4 sm:px-0 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: Company Info */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl lg:text-3xl">
                  {stock.symbol}
                </h1>
                <span className="text-sm text-ink2 sm:text-base lg:text-lg">{stock.name}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{stock.exchange}</Badge>
                {stock.sector !== "—" && (
                  <Badge variant="secondary">{stock.sector}</Badge>
                )}
                {scored && verdict ? (
                  <Badge className={BAND_BADGE[verdict.label.band]}>
                    <span className="num">{roundScore(verdict.composite)}</span>
                    <span className="ml-1">· {verdict.label.label}</span>
                  </Badge>
                ) : (
                  <Badge className="border-line2 bg-surface-2 text-ink3">
                    Not yet scored
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: Action Buttons — three standalone colour-coded buttons (no dropdown).
                flex-wrap is the safety net if a phone width ever squeezes tighter than the
                icon-only buttons allow. */}
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={() => router.push("/research/stock-screener")}
                className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-ink3 underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to screener
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <QuickActionButton
                  icon={Icons.portfolio}
                  label="Portfolio"
                  color="var(--rec)"
                  onClick={() => setPortfolioOpen(true)}
                />
                <QuickActionButton
                  icon={Icons.star}
                  label={isWatchlisted ? "Watchlisted" : "Watchlist"}
                  color="var(--warning)"
                  active={isWatchlisted}
                  busy={watchlistBusy}
                  onClick={toggleWatchlist}
                />
                <QuickActionButton
                  icon={Icons.bell}
                  label="Set Alert"
                  color="var(--primary)"
                  onClick={() => setAlertOpen(true)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="hidden-scrollbar flex overflow-x-auto border-line">
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
      <div className="mx-auto max-w-7xl px-0 sm:px-6 py-8 pt-0">
        {activeTab === "overview" && <Overview symbol={symbol} />}
        {activeTab === "health" && <HealthScore />}
        {activeTab === "fundamentals" && <Fundamentals />}
        {activeTab === "technical" && <Technical />}
        {activeTab === "activity" && <Activity />}
        {activeTab === "events" && <Events />}
        {activeTab === "news" && <News symbol={symbol} />}
      </div>

      {/* set-alert modal (symbol-driven; resolves scored/band from the universe) */}
      <CreateAlertModal open={alertOpen} onOpenChange={setAlertOpen} symbol={symbol} name={stock.name} />

      {/* add-to-portfolio sheet — pre-selects this symbol (add mode only) */}
      <TransactionSheet open={portfolioOpen} onOpenChange={setPortfolioOpen} initialSymbol={symbol} />
    </div>
  );
};

export default StockDetailPage;
