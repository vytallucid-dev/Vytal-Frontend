"use client";

import { tint } from "@/components/stock-detail/health/shared";
import { QueryError } from "@/components/ui/query-error";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { useUniverseHealth } from "@/lib/api/hooks/use-universe-health";
import { useWatchlist } from "@/lib/api/hooks/use-watchlist";
import { Icons, type Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BriefingTab } from "./briefing-tab";
import { FlagsTab } from "./flags-tab";
import { scopeUniverseView } from "./lib";
import { ScreenTab } from "./screen-tab";

// ─────────────────────────────────────────────────────────────────────────────
// The Health Hub — flagship surface, faithful to docs/vytal_health_hub_full.html.
// Three tabs (Briefing · Flags & Patterns · Screen) over a SCOPE switcher that acts
// as a live filter on the scored universe:
//   · Scored Universe — every scored name (GET /api/universe/health).
//   · My Portfolio    — the scored stocks the user holds across every account.
//   · Watchlist       — the scored stocks the user is watching.
// The universe read is fetched once; the personal scopes intersect it with the user's
// holdings / watchlist symbols and recompute every aggregate client-side (see
// scopeUniverseView in ./lib), so all three tabs read a self-consistent subset.
//
// Chrome mirrors the Portfolio Hub sibling — an ink-scale page header (icon eyebrow ·
// display title · subtitle · stat chips) over the app-standard underline tab bar.
// ─────────────────────────────────────────────────────────────────────────────

type TabId = "brief" | "flags" | "screen";
const TABS: {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  soon: boolean;
}[] = [
  {
    id: "brief",
    label: "Briefing",
    icon: <Icons.results className="size-[15px]" />,
    soon: false,
  },
  {
    id: "flags",
    label: "Flags & Patterns",
    icon: <Icons.warning className="size-[15px]" />,
    soon: false,
  },
  {
    id: "screen",
    label: "Screen",
    icon: <Icons.screener className="size-[15px]" />,
    soon: false,
  },
];

type ScopeId = "portfolio" | "watchlist" | "universe";
const SCOPES: { id: ScopeId; label: string }[] = [
  { id: "portfolio", label: "My Portfolio" },
  { id: "watchlist", label: "Watchlist" },
  { id: "universe", label: "Scored Universe" },
];

// Per-scope header identity — the title / subtitle / icon change with the active filter
// so the surface always announces WHAT it is reading right now.
const SCOPE_META: Record<
  ScopeId,
  { title: string; icon: Icon; accent: string; blurb: (n: number | null) => string }
> = {
  universe: {
    title: "The scored universe",
    icon: Icons.health,
    accent: "var(--c-pristine)",
    blurb: () =>
      "One health read across every scored name — the quarter's briefing, the flags & patterns firing, and the full screen.",
  },
  portfolio: {
    title: "Your portfolio",
    icon: Icons.portfolio,
    accent: "var(--p-own)",
    blurb: (n) =>
      n == null
        ? "The same briefing, flags and screen — filtered to the scored stocks you hold across every account."
        : `The same briefing, flags and screen — over the ${n} scored stock${n === 1 ? "" : "s"} you hold.`,
  },
  watchlist: {
    title: "Your watchlist",
    icon: Icons.watchlist,
    accent: "var(--p-mkt)",
    blurb: (n) =>
      n == null
        ? "The same briefing, flags and screen — filtered to the scored stocks you're watching."
        : `The same briefing, flags and screen — over the ${n} scored stock${n === 1 ? "" : "s"} you're watching.`,
  },
};

// Honest empty-state for a personal scope: the user's list is empty, or none of the names
// on it carry a score this quarter. Never fabricates a read — points back to the source.
function ScopeEmpty({ scope, total }: { scope: "portfolio" | "watchlist"; total: number }) {
  const isPortfolio = scope === "portfolio";
  const Glyph = isPortfolio ? Icons.portfolio : Icons.watchlist;
  const noun = isPortfolio ? "portfolio" : "watchlist";
  const empty = total === 0;
  return (
    <div className="rounded-2xl border border-dashed border-line2 px-6 py-16 text-center sm:px-8 sm:py-20">
      <Glyph weight="duotone" className="mx-auto mb-4 size-8 text-ink3 opacity-60" />
      <h3 className="font-display text-[18px] font-medium text-ink2 sm:text-[20px]">
        {empty ? `Your ${noun} is empty` : `No scored names in your ${noun} yet`}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink3">
        {empty
          ? `Add ${isPortfolio ? "holdings" : "stocks"} and the Briefing, Flags and Screen re-run over just the scored names you ${isPortfolio ? "hold" : "watch"} — no rebuild.`
          : `None of the ${total} ${isPortfolio ? "instruments you hold" : "stocks you're watching"} carry a score this quarter. The moment one is scored, it appears here.`}
      </p>
      <Link
        href={isPortfolio ? "/portfolio" : "/watchlist"}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3.5 py-2 text-[12px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
      >
        {empty ? `Go to your ${noun}` : `Manage your ${noun}`}
        <Icons.arrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
}

// ── header stat chip — matches the Portfolio/Watchlist hub cluster ───────────────
function StatChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-surface-1 px-3.5 py-2">
      <span className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">
        {label}
      </span>
      <span className="num text-[15px] font-medium text-ink">{value}</span>
    </div>
  );
}

export function HealthHub() {
  const [tab, setTab] = useState<TabId>("brief");
  const [scope, setScope] = useState<ScopeId>("universe");
  const { data, isLoading, isError, error, refetch } = useUniverseHealth();

  // The two personal scopes fetch lazily — only once selected (the `enabled` gate).
  const holdingsQ = useHoldings({ enabled: scope === "portfolio" });
  const watchlistQ = useWatchlist({ enabled: scope === "watchlist" });

  // Distinct symbols the user holds / watches; null for the full universe (no filter).
  const scopeSymbols = useMemo<Set<string> | null>(() => {
    if (scope === "portfolio") return new Set((holdingsQ.data?.holdings ?? []).map((h) => h.symbol));
    if (scope === "watchlist") return new Set((watchlistQ.data ?? []).map((e) => e.symbol));
    return null;
  }, [scope, holdingsQ.data, watchlistQ.data]);

  // The view feeding all three tabs — the universe, or a faithful subset of it.
  const view = useMemo(() => {
    if (!data) return null;
    if (!scopeSymbols) return data; // universe — no filtering
    return scopeUniverseView(data, scopeSymbols);
  }, [data, scopeSymbols]);

  // The active scope's source query (null on universe) drives loading/error next to the
  // universe read.
  const scopeQ = scope === "portfolio" ? holdingsQ : scope === "watchlist" ? watchlistQ : null;
  const loading = isLoading || (scopeQ?.isLoading ?? false);
  const errored = isError || (scopeQ?.isError ?? false);

  const universeReady = Boolean(data?.scored && data.aggregate);
  const inScopeCount = view?.members.length ?? 0;
  const showChips = universeReady && Boolean(view?.aggregate) && inScopeCount > 0;

  const meta = SCOPE_META[scope];
  const Glyph = meta.icon;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col">
      {/* ── header ── */}
      <div className="pt-1">
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2.5">
              <span
                className="grid size-7 shrink-0 place-items-center rounded-lg border"
                style={tint(meta.accent)}
              >
                <Glyph weight="duotone" className="size-4" />
              </span>
              <span className="eyebrow">Health Hub</span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {meta.title}
            </h1>
            <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink2">
              {meta.blurb(showChips ? inScopeCount : null)}
            </p>
          </div>
          {showChips && view && (
            <div className="flex flex-wrap gap-2">
              <StatChip label={scope === "universe" ? "Scored" : "In scope"} value={view.scoredUniverseSize} />
              <StatChip label="As of" value={view.asOfDate} />
              <StatChip label="Period" value={view.periodKey} />
            </div>
          )}
        </div>

        {/* primary nav — app-standard underline tab bar */}
        <div className="flex gap-0.5 overflow-x-auto border-b border-line hidden-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-[13px] font-medium transition-colors",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-ink3 hover:text-ink",
              )}
            >
              {t.icon}
              {t.label}
              {t.soon && (
                <span className="rounded-[4px] border border-line2 px-1.5 py-px text-[8.5px] uppercase tracking-wider text-ink3">
                  soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* scope switcher — the live filter row */}
      <div className="mb-4 mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <span className="kicker shrink-0">Scope</span>
        <div className="flex flex-wrap gap-1.5">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors",
                scope === s.id
                  ? "border-line3 bg-surface-3 font-medium text-ink"
                  : "border-line2 bg-surface-1 text-ink2 hover:border-line3 hover:text-ink",
              )}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: scope === s.id ? "var(--p-own)" : "var(--ink3)" }}
              />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      {loading ? (
        <QuerySkeleton rows={6} rowHeight="h-16" className="mt-2" />
      ) : errored ? (
        <QueryError
          message={
            (error as Error)?.message ??
            (scopeQ?.error as Error)?.message ??
            "Failed to load the scored universe"
          }
          onRetry={() => {
            refetch();
            scopeQ?.refetch();
          }}
          className="mt-2"
        />
      ) : !universeReady || !view ? (
        <div className="rounded-xl border border-line bg-surface-1 py-16 text-center">
          <p className="text-sm font-medium text-ink2">No scored universe yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] text-ink3">
            There are no in-force snapshots to aggregate. Coverage is rolling out.
          </p>
        </div>
      ) : scope !== "universe" && inScopeCount === 0 ? (
        <ScopeEmpty scope={scope} total={scopeSymbols?.size ?? 0} />
      ) : tab === "brief" ? (
        <BriefingTab view={view} />
      ) : tab === "flags" ? (
        <FlagsTab view={view} />
      ) : (
        <ScreenTab view={view} />
      )}
    </div>
  );
}
