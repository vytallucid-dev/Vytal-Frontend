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
import { useSidekick, useSidekickActions } from "@/components/sidekick/sidekick-provider";
import {
  SC_CONVERSATIONS,
  SC_NEW_CHAT,
  SC_VYTAL,
  useChatShortcutActions,
} from "@/components/shortcuts/chat-shortcuts";
import { focusChatComposer } from "@/components/chat/chat-composer";
import { formatShortcut, useIsApplePlatform } from "@/lib/shortcuts";
import { useMe } from "@/lib/api/hooks/use-me";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import {
  useFundSearch,
  FUND_SEARCH_MIN_Q,
} from "@/lib/api/hooks/use-funds-browse";
import { BAND_META } from "@/components/stock-detail/health/shared";
import { DASH, toneColor } from "@/components/stock-detail/overview/shared";
import { toNum, fmtFractionPct } from "@/lib/fund-format";
import type { UniverseStockLite } from "@/types/research-tools";
import type { FamilyRow } from "@/types/funds-browse";

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
    title: "Ask Vytal",
    url: "/chat",
    icon: Icons.chat,
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

const MAX_STOCK_RESULTS = 10; // matches while searching
const MAX_STOCK_SUGGESTIONS = 6; // top-rated shown before any query
const MAX_FUND_RESULTS = 10; // funds/ETFs shown while searching
const FUND_DEBOUNCE_MS = 180; // funds are a network round-trip; stocks are a cached array

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

// Rank a fund family within the page the server already matched (it filters on
// name-OR-house contains, then orders by name). A name hit beats a fund-house hit,
// so typing a fund's own name doesn't sit behind every other scheme from the house
// that happens to sort earlier. No -1 arm: every row here matched server-side, so an
// unrecognised shape falls to the back rather than being dropped. Equal ranks keep the
// server's alphabetical order — this is a catalogue, not a return leaderboard.
function fundRank(r: FamilyRow, q: string): number {
  const name = r.canonicalName.toLowerCase();
  const house = r.fundHouse.toLowerCase();
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (name.includes(q)) return 2;
  if (house.startsWith(q)) return 3;
  return 4;
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

/** A fund/ETF family row — family grain, so it lands on the server-resolved representative
 *  plan, exactly like the discovery grid's card. Funds carry no health score, so the trailing
 *  figure is the factual 1-year return (coloured by sign only); a null shows a dash carrying
 *  the omission code in its title, never a fabricated 0. */
function FundRow({ row, onSelect }: { row: FamilyRow; onSelect: () => void }) {
  const isEtf = row.assetClass === "etf";
  const RowIcon = isEtf ? Icons.chartLine : Icons.coins;
  const ret = toNum(row.returns.ret1y);
  return (
    <CommandItem
      value={`fund ${row.familyId} ${row.canonicalName}`}
      onSelect={onSelect}
      className={ITEM_CLS}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-ink3">
        <RowIcon weight="duotone" className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-ink">
            {row.canonicalName}
          </span>
          {isEtf && (
            <span className="shrink-0 rounded border border-line2 px-1 py-px text-[8.5px] font-medium text-ink3">
              ETF
            </span>
          )}
        </span>
        <span className="block truncate text-[11px] text-ink3">
          {row.fundHouse}
          {row.categoryLeaf ? ` · ${row.categoryLeaf}` : ""}
        </span>
      </span>
      <span className="shrink-0 text-right">
        {ret !== null ? (
          <span
            className="num block text-[12px] font-semibold"
            style={{ color: toneColor(ret) }}
          >
            {fmtFractionPct(ret)}
          </span>
        ) : (
          <span
            className="num block text-[12px] text-ink3"
            title={row.returnOmissions.ret1y ?? "no value"}
          >
            {DASH}
          </span>
        )}
        <span className="block text-[9px] text-ink3">1-year</span>
      </span>
    </CommandItem>
  );
}

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const page = usePageMeta();
  const PageIcon = page.icon;
  const { isAdmin } = useMe();
  // The sidekick toggle. `open` comes from the state context (it drives the pressed look), `toggle` from
  // the stable actions one. Hidden on /chat — that page IS the conversation at full width, so a button
  // offering to open a narrower copy of it beside itself has nothing to mean.
  const { open: sidekickOpen } = useSidekick();
  const { toggle: toggleSidekick } = useSidekickActions();
  const onChatPage = pathname === "/chat" || pathname.startsWith("/chat/");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // ── THE KEYBOARD LAYER, AS ROWS ───────────────────────────────────────────────────────────────────
  // The palette runs the SAME three functions the shortcuts do (components/shortcuts/chat-shortcuts),
  // never a second copy of the logic — so a row and its key can never come to mean different things,
  // and the row is where a reader who doesn't know the key finds out there is one.
  const chatShortcuts = useChatShortcutActions();
  const apple = useIsApplePlatform();
  const vytalLabel = formatShortcut(SC_VYTAL, apple);

  // Full tracked universe (scored + not-yet-scored) — the same source the screener
  // typeahead uses, cached app-wide, so opening the palette is instant.
  const { data: universe, isLoading: stocksLoading } = useUniverseStocks();

  // Funds/ETFs are a per-term server round-trip (the catalogue is far too large to ship to the
  // client the way the stock universe is), so the term is debounced before it leaves the box.
  const [fundQuery, setFundQuery] = useState("");
  const { data: fundData, isFetching: fundsFetching } = useFundSearch(fundQuery);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // `!altKey` for the same reason the sidebar's ⌘B now checks it: AltGr is Ctrl+Alt on Windows and
      // Linux, and it is how a reader types an accented letter — never a request for the palette.
      if (e.key === "k" && (e.metaKey || e.ctrlKey) && !e.altKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const q = query.trim().toLowerCase();

  useEffect(() => {
    const t = setTimeout(() => setFundQuery(q), FUND_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  const go = (url: string) => {
    router.push(url);
    setOpen(false);
    setQuery("");
  };

  // A Vytal action from the palette. It runs IMMEDIATELY, so the rail starts opening in the same frame
  // the row is clicked. `takesCaret` rows then re-take focus once the dialog has finished closing:
  // Radix restores focus to whatever opened it, which would otherwise pull the cursor straight back out
  // of the composer the action just put it in. NOT for the conversations row — that one opens a list
  // whose search field has its own autofocus, and stealing it back would be the same bug in reverse.
  const runVytalAction = (fn: () => void, takesCaret: boolean) => {
    setOpen(false);
    setQuery("");
    fn();
    if (takesCaret) window.setTimeout(focusChatComposer, 250);
  };

  /** The three keyboard intents as palette rows — same order, same words, same keys as the layer. */
  const vytalActions = [
    {
      id: "vytal",
      // On /chat the key puts the cursor in the composer, which is "Ask Vytal" either way; off it, an
      // open rail means the row closes it, and the row should say so.
      title: sidekickOpen && !onChatPage ? "Close Vytal" : "Ask Vytal",
      keywords: "assistant sidekick panel chat ai",
      icon: Icons.spark,
      sc: SC_VYTAL,
      takesCaret: true,
      run: chatShortcuts.vytal,
    },
    {
      id: "new-conversation",
      title: "New conversation",
      keywords: "new chat vytal ai start fresh",
      icon: Icons.plus,
      sc: SC_NEW_CHAT,
      takesCaret: true,
      run: chatShortcuts.newConversation,
    },
    {
      id: "conversations",
      title: "Your conversations",
      keywords: "history list past chats vytal",
      icon: Icons.history,
      sc: SC_CONVERSATIONS,
      takesCaret: false,
      run: chatShortcuts.conversations,
    },
  ];

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

  // Funds/ETFs — the server already filtered (name OR fund house contains the term) and ordered by
  // name; we only re-rank that page so a name hit leads a fund-house hit, then keep the top few.
  // Guarded on the debounced term's own length because `keepPreviousData` would otherwise hold the
  // last resolved term's hits on screen after the user deletes back below the minimum.
  const fundResults = useMemo(() => {
    if (fundQuery.length < FUND_SEARCH_MIN_Q) return [];
    return (fundData?.results ?? [])
      .map((r, i) => ({ r, rank: fundRank(r, fundQuery), i }))
      .sort((a, b) => a.rank - b.rank || a.i - b.i)
      .slice(0, MAX_FUND_RESULTS)
      .map((x) => x.r);
  }, [fundData, fundQuery]);

  const actionResults = useMemo(
    () => vytalActions.filter((a) => !q || `${a.title} ${a.keywords}`.toLowerCase().includes(q)),
    // vytalActions is rebuilt each render; its CONTENT depends only on these.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, chatShortcuts, sidekickOpen, onChatPage],
  );

  const hasResults =
    stockResults.length > 0 ||
    fundResults.length > 0 ||
    pageGroups.length > 0 ||
    actionResults.length > 0;

  // True while a leg of the search is still outstanding for the CURRENT term — the debounce not yet
  // settled counts, so we never claim "nothing matches" for a term the funds endpoint hasn't been
  // asked about yet.
  const searching =
    (stocksLoading && !universe) ||
    (q.length >= FUND_SEARCH_MIN_Q && (fundQuery !== q || fundsFetching));

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

  // Family grain — the row routes to the SERVER-resolved representative plan, the same target the
  // discovery card uses, so the palette and the detail page can't disagree about which plan opened.
  const fundsBlock =
    fundResults.length > 0 ? (
      <CommandGroup heading="Funds & ETFs" className={GROUP_CLS}>
        {fundResults.map((row) => (
          <FundRow
            key={row.familyId}
            row={row}
            onSelect={() =>
              go(
                `/research/funds/${encodeURIComponent(row.representativeSchemeCode)}`,
              )
            }
          />
        ))}
      </CommandGroup>
    ) : null;

  const vytalBlock =
    actionResults.length > 0 ? (
      <CommandGroup heading="Vytal" className={GROUP_CLS}>
        {actionResults.map((a) => {
          const ActionIcon = a.icon;
          return (
            <CommandItem
              key={a.id}
              value={`vytal ${a.title} ${a.keywords}`}
              onSelect={() => runVytalAction(a.run, a.takesCaret)}
              className={ITEM_CLS}
            >
              <ActionIcon weight="duotone" className="size-4 text-ai-from" />
              <span className="flex-1 text-[13px] text-ink">{a.title}</span>
              <kbd className="rounded border border-line2 bg-surface-2/70 px-1.5 py-0.5 font-mono text-[10px] text-ink3">
                {formatShortcut(a.sc, apple)}
              </kbd>
            </CommandItem>
          );
        })}
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
          Search stocks, funds, pages…
        </span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border/70 bg-surface-2/70 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground sm:flex">
          ⌘K
        </kbd>
      </button>

      <AlertsBell />

      {/* ASK VYTAL — the only way into the panel that isn't a card, so it is present at every breakpoint.
          It replaces the decorative "AI" disc that used to sit here: same slot, same promise, now real.
          `.ai-chip` is the interactive member of the intelligent-layer family (the badge's sibling), so
          this reads as the same system as every "Discuss this read" chip on the pages below. */}
      {!onChatPage && (
        <button
          type="button"
          onClick={toggleSidekick}
          aria-expanded={sidekickOpen}
          aria-label={sidekickOpen ? "Close Vytal" : "Ask Vytal"}
          title={`${sidekickOpen ? "Close Vytal" : "Ask Vytal"} (${vytalLabel})`}
          className={cn(
            "ai-chip grid size-9 shrink-0 place-items-center rounded-xl",
            sidekickOpen && "ring-2 ring-ai-from/35",
          )}
        >
          <Icons.spark weight="fill" className="size-[1.05rem]" />
        </button>
      )}

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
          placeholder="Search a stock, fund or ETF — or jump to a page…"
        />
        <CommandList className="max-h-[55vh] custom-scrollbar">
          {/* Deterministic empty state — driven by our own results (we rank/filter
              manually with shouldFilter={false}, so cmdk's built-in count is unused). */}
          {!hasResults && (
            <div className="px-3 py-8 text-center text-[13px] text-ink3">
              {!q
                ? "Start typing to search."
                : searching
                  ? "Searching…"
                  : `Nothing matches “${query.trim()}”.`}
            </div>
          )}

          {/* Instruments lead when searching (so ⏎ opens the top match), stocks ahead of
              funds because a ticker match is the sharper signal; pages lead the resting
              state as the primary navigation surface. Funds never appear at rest — they'd
              cost a fetch on every page load for a list nobody asked for. */}
          {/* Vytal's actions sit AFTER the destinations in both orders, deliberately: the palette's
              first row is what ⏎ runs, and that has always been a place to go rather than a thing to
              do. Discoverability comes from the row being there at rest at all, plus the key printed
              beside it — not from taking the Enter key away from navigation. */}
          {q ? (
            <>
              {stocksBlock}
              {fundsBlock}
              {pagesBlock}
              {vytalBlock}
            </>
          ) : (
            <>
              {pagesBlock}
              {vytalBlock}
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
