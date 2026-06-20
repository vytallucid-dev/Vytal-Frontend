"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Icons, type Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Route = { title: string; url: string; icon: Icon; group: string };

const routes: Route[] = [
  { title: "Dashboard", url: "/dashboard", icon: Icons.dashboard, group: "Overview" },
  { title: "Health Hub", url: "/health-score", icon: Icons.health, group: "Overview" },
  { title: "Portfolio", url: "/portfolio", icon: Icons.portfolio, group: "Invest" },
  { title: "Watchlist", url: "/watchlist", icon: Icons.watchlist, group: "Invest" },
  { title: "Calendar", url: "/calendar", icon: Icons.calendar, group: "Invest" },
  { title: "Stock Screener", url: "/research/stock-screener", icon: Icons.screener, group: "Research" },
  { title: "Trajectory", url: "/research/trajectory", icon: Icons.chartLine, group: "Research" },
  { title: "Divergence", url: "/research/divergence", icon: Icons.scales, group: "Research" },
  { title: "Ownership", url: "/research/ownership", icon: Icons.building, group: "Research" },
  { title: "Peer Groups", url: "/research/peer-groups", icon: Icons.sector, group: "Research" },
  { title: "Comparison", url: "/comparison", icon: Icons.compare, group: "Research" },
  { title: "Results", url: "/results", icon: Icons.results, group: "Research" },
  { title: "Data & Settings", url: "/settings", icon: Icons.settings, group: "System" },
];

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

const Navbar = () => {
  const router = useRouter();
  const page = usePageMeta();
  const PageIcon = page.icon;
  const [open, setOpen] = useState(false);

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

  const grouped = useMemo(() => {
    const g: Record<string, Route[]> = {};
    routes.forEach((r) => (g[r.group] ??= []).push(r));
    return g;
  }, []);

  return (
    <header className="z-20 flex w-full shrink-0 items-center gap-3 px-3 py-2.5 sm:px-5">
      <SidebarTrigger className="size-9 rounded-lg text-muted-foreground md:hidden" />

      <div className="hidden items-center gap-2.5 sm:flex">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/12 ring-1 ring-primary/20">
          <PageIcon weight="duotone" className="size-[1.15rem] text-primary" />
        </span>
        <div className="leading-tight">
          <h1 className="font-display text-lg font-bold tracking-tight">{page.title}</h1>
          <p className="text-[0.7rem] text-muted-foreground">
            <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-success align-middle" />
            Markets open · Live
          </p>
        </div>
      </div>

      {/* Command / search trigger */}
      <button
        onClick={() => setOpen(true)}
        className="group ml-auto flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border border-border/70 bg-surface-1/40 px-3 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-foreground sm:w-auto sm:min-w-[16rem]"
      >
        <Icons.search className="size-4" />
        <span className="hidden flex-1 text-left sm:inline">Search stocks, pages…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border/70 bg-surface-2/70 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground sm:flex">
          ⌘K
        </kbd>
      </button>

      <button
        className="relative grid size-9 shrink-0 place-items-center rounded-lg border border-border/70 bg-surface-1/40 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        aria-label="Notifications"
      >
        <Icons.bell className="size-4" />
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger ring-2 ring-background" />
      </button>

      <span className="hidden size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-accent/30 text-xs font-bold text-primary-foreground sm:grid">
        AI
      </span>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a page or search a stock…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(grouped).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((r) => {
                const RIcon = r.icon;
                return (
                  <CommandItem
                    key={r.url}
                    value={`${r.title} ${r.group}`}
                    onSelect={() => {
                      router.push(r.url);
                      setOpen(false);
                    }}
                    className={cn("gap-2.5")}
                  >
                    <RIcon weight="duotone" className="size-4 text-primary" />
                    {r.title}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </header>
  );
};

export default Navbar;
