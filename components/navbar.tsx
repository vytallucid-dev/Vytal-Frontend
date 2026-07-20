"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Icons, type Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { AlertsBell } from "@/components/alerts/alerts-bell";
import { useMe } from "@/lib/api/hooks/use-me";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import { BAND_META } from "@/components/stock-detail/health/shared";
import type { UniverseStockLite } from "@/types/research-tools";

type Route = {
  title: string;
  url: string;
  icon: Icon;
  group: string;
  adminOnly?: boolean;
};

// Product destinations — mirrors the canonical sidebar nav (components/app-sidebar).
// Admin Panel is role-gated here too, matching the sidebar (the route itself is the
// real security boundary). Keep this list in sync with the sidebar's groups.
const routes: Route[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Icons.dashboard,
    group: "Overview",
  },
  {
    title: "Health Hub",
    url: "/health-score",
    icon: Icons.health,
    group: "Overview",
  },
  {
    title: "Portfolio",
    url: "/portfolio",
    icon: Icons.portfolio,
    group: "Invest",
  },
  {
    title: "Watchlist",
    url: "/watchlist",
    icon: Icons.watchlist,
    group: "Invest",
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Icons.calendar,
    group: "Invest",
  },
  {
    title: "Stock Screener",
    url: "/research/stock-screener",
    icon: Icons.screener,
    group: "Research",
  },
  {
    title: "Trajectory",
    url: "/research/trajectory",
    icon: Icons.chartLine,
    group: "Research",
  },
  {
    title: "Divergence",
    url: "/research/divergence",
    icon: Icons.scales,
    group: "Research",
  },
  {
    title: "Ownership",
    url: "/research/ownership",
    icon: Icons.building,
    group: "Research",
  },
  {
    title: "Peer Groups",
    url: "/research/peer-groups",
    icon: Icons.sector,
    group: "Research",
  },
  {
    title: "Comparison",
    url: "/comparison",
    icon: Icons.compare,
    group: "Research",
  },
  { title: "Results", url: "/results", icon: Icons.results, group: "Research" },
  {
    title: "Admin Panel",
    url: "/admin",
    icon: Icons.shield,
    group: "Settings",
    adminOnly: true,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Icons.settings,
    group: "Settings",
  },
  {
    title: "Funds & ETFs",
    url: "/research/funds",
    icon: Icons.coins,
    group: "Research",
  },
];

const MAX_STOCK_RESULTS = 7; // matches while searching
const MAX_STOCK_SUGGESTIONS = 6; // top-rated shown before any query

// Rank a stock against the query: symbol exact/prefix beat name prefix beat
// substring matches; -1 means no match. Lower rank sorts first.
function stockRank(s: UniverseStockLite, q: string): number {
  const sym = s.symbol.toLowerCase();
  const name = s.name.toLowerCase();
  if (sym === q) return 0;
  if (sym.startsWith(q)) return 1;
  if (name.startsWith(q)) return 2;
  if (sym.includes(q)) return 3;
  if (name.includes(q)) return 4;
  return -1;
}

function usePageMeta() {
  const pathname = usePathname();
  return useMemo(() => {
    const match =
      routes
        .filter((r) => pathname.startsWith(r.url))
        .sort((a, b) => b.url.length - a.url.length)[0] ?? routes[0];
    return match;
  }, [pathname]);
}

// Shared item style — themed (Vytal surface) selection state instead of the raw
// shadcn `bg-accent`, keeping the palette consistent with the sidebar rows.
const ITEM_CLS =
  "gap-2.5 rounded-lg data-[selected=true]:bg-surface-2 data-[selected=true]:text-ink";
// Vytal group-heading tokens (uppercase micro-label, echoing the sidebar labels).
const GROUP_CLS =
  "[&_[cmdk-group-heading]]:text-[0.62rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-ink3";

function StockRow({
  s,
  onSelect,
}: {
  s: UniverseStockLite;
  onSelect: () => void;
}) {
  const band = s.band ? BAND_META[s.band] : null;
  const scored = s.composite != null && s.band != null;
  return (
    <CommandItem
      value={`stock ${s.symbol} ${s.name}`}
      onSelect={onSelect}
      className={ITEM_CLS}
    >
      <span
        className="num grid size-8 shrink-0 place-items-center rounded-lg text-[12px] font-semibold tabular-nums"
        style={
          scored
            ? {
                color: BAND_META[s.band!].cssVar,
                background:
                  "color-mix(in oklch, var(--surface-3) 80%, transparent)",
              }
            : { color: "var(--ink3)", background: "var(--surface-3)" }
        }
      >
        {scored ? Math.round(s.composite!) : "–"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">
          {s.symbol}
        </span>
        <span className="block truncate text-[11px] text-ink3">
          {s.name}
          {s.sector ? ` · ${s.sector.displayName}` : ""}
        </span>
      </span>
      {band ? (
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide",
            band.bg,
            band.text,
          )}
        >
          {band.label}
        </span>
      ) : (
        <span className="shrink-0 rounded-md bg-surface-3 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-ink3">
          Unscored
        </span>
      )}
    </CommandItem>
  );
}

const Navbar = () => {
  const router = useRouter();
  const page = usePageMeta();
  const PageIcon = page.icon;
  const { isAdmin } = useMe();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Full tracked universe (scored + not-yet-scored) — the same source the screener
  // typeahead uses, cached app-wide, so opening the palette is instant.
  const { data: universe, isLoading: stocksLoading } = useUniverseStocks();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const q = query.trim().toLowerCase();

  const go = (url: string) => {
    router.push(url);
    setOpen(false);
    setQuery("");
  };

  // Pages grouped in sidebar order, filtered to the query. Admin-only destinations
  // are hidden from non-admins (kept honest; the route is the real gate).
  const pageGroups = useMemo(() => {
    const m = new Map<string, Route[]>();
    for (const r of routes) {
      if (r.adminOnly && !isAdmin) continue;
      if (q && !`${r.title} ${r.group}`.toLowerCase().includes(q)) continue;
      let arr = m.get(r.group);
      if (!arr) m.set(r.group, (arr = []));
      arr.push(r);
    }
    return Array.from(m.entries());
  }, [q, isAdmin]);

  // Stocks — ranked matches while searching, top-rated suggestions before any query.
  const stockResults = useMemo(() => {
    const items = universe ?? [];
    if (!q) {
      return items
        .filter((s) => s.composite != null && s.band != null)
        .sort((a, b) => (b.composite ?? 0) - (a.composite ?? 0))
        .slice(0, MAX_STOCK_SUGGESTIONS);
    }
    return items
      .map((s) => ({ s, rank: stockRank(s, q) }))
      .filter((x) => x.rank >= 0)
      .sort(
        (a, b) =>
          a.rank - b.rank || (b.s.composite ?? 0) - (a.s.composite ?? 0),
      )
      .slice(0, MAX_STOCK_RESULTS)
      .map((x) => x.s);
  }, [universe, q]);

  const hasResults = stockResults.length > 0 || pageGroups.length > 0;

  const stocksBlock =
    stockResults.length > 0 ? (
      <CommandGroup
        heading={q ? "Stocks" : "Suggested stocks"}
        className={GROUP_CLS}
      >
        {stockResults.map((s) => (
          <StockRow
            key={s.id}
            s={s}
            onSelect={() =>
              go(`/research/stock-screener/${encodeURIComponent(s.symbol)}`)
            }
          />
        ))}
      </CommandGroup>
    ) : null;

  const pagesBlock = pageGroups.map(([group, items]) => (
    <CommandGroup key={group} heading={group} className={GROUP_CLS}>
      {items.map((r) => {
        const RIcon = r.icon;
        return (
          <CommandItem
            key={r.url}
            value={`page ${r.title} ${r.group}`}
            onSelect={() => go(r.url)}
            className={ITEM_CLS}
          >
            <RIcon weight="duotone" className="size-4 text-primary" />
            <span className="flex-1 text-[13px] text-ink">{r.title}</span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  ));

  return (
    <header className="z-20 flex w-full shrink-0 items-center gap-3 px-3 py-3.5 sm:px-5">
      <SidebarTrigger className="size-9 rounded-lg text-muted-foreground md:hidden" />

      <div className="hidden items-center gap-2.5 sm:flex">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/12 ring-1 ring-primary/20">
          <PageIcon weight="duotone" className="size-[1.15rem] text-primary" />
        </span>
        <div className="leading-tight">
          <h1 className="font-display text-lg font-bold tracking-tight">
            {page.title}
          </h1>
        </div>
      </div>

      {/* Command / search trigger */}
      <button
        onClick={() => setOpen(true)}
        className="group ml-auto flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border border-border/70 bg-surface-1/40 px-3 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-foreground sm:w-auto sm:min-w-[16rem]"
      >
        <Icons.search className="size-4" />
        <span className="hidden flex-1 text-left sm:inline">
          Search stocks, pages…
        </span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border/70 bg-surface-2/70 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground sm:flex">
          ⌘K
        </kbd>
      </button>

      <AlertsBell />

      <span className="hidden size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary/40 to-accent/30 text-xs font-bold text-primary-foreground sm:grid">
        AI
      </span>

      <CommandDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQuery("");
        }}
        shouldFilter={false}
        className="border-line2 sm:max-w-140"
        commandClassName="bg-surface-1"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search a stock or jump to a page…"
        />
        <CommandList className="max-h-[55vh] custom-scrollbar">
          {/* Deterministic empty state — driven by our own results (we rank/filter
              manually with shouldFilter={false}, so cmdk's built-in count is unused). */}
          {!hasResults && (
            <div className="px-3 py-8 text-center text-[13px] text-ink3">
              {q && stocksLoading && !universe
                ? "Loading stocks…"
                : q
                  ? `No pages or stocks match “${query.trim()}”.`
                  : "Start typing to search."}
            </div>
          )}

          {/* Stocks lead when searching (so ⏎ opens the top match); pages lead the
              resting state as the primary navigation surface. */}
          {q ? (
            <>
              {stocksBlock}
              {pagesBlock}
            </>
          ) : (
            <>
              {pagesBlock}
              {stocksBlock}
            </>
          )}
        </CommandList>

        <div className="flex items-center gap-4 border-t border-line px-3 py-2 text-[10.5px] text-ink3">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line2 bg-surface-3 px-1 font-mono">
              ↑
            </kbd>
            <kbd className="rounded border border-line2 bg-surface-3 px-1 font-mono">
              ↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line2 bg-surface-3 px-1 font-mono">
              ↵
            </kbd>
            Open
          </span>
          <span className="ml-auto flex items-center gap-1">
            <kbd className="rounded border border-line2 bg-surface-3 px-1 font-mono">
              esc
            </kbd>
            Close
          </span>
        </div>
      </CommandDialog>
    </header>
  );
};

export default Navbar;
