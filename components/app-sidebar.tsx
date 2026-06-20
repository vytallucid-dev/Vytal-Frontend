"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { HealthRing } from "@/components/ui/health-ring";
import { Icons, type Icon } from "@/lib/icons";
import { portfolioSummary } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type NavItem = { title: string; url: string; icon: Icon };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Icons.dashboard },
      { title: "Health Hub", url: "/health-score", icon: Icons.health },
    ],
  },
  {
    label: "Invest",
    items: [
      { title: "Portfolio", url: "/portfolio", icon: Icons.portfolio },
      { title: "Watchlist", url: "/watchlist", icon: Icons.watchlist },
      { title: "Calendar", url: "/calendar", icon: Icons.calendar },
    ],
  },
  {
    label: "Research",
    items: [
      { title: "Stock Screener", url: "/research/stock-screener", icon: Icons.screener },
      { title: "Trajectory", url: "/research/trajectory", icon: Icons.chartLine },
      { title: "Divergence", url: "/research/divergence", icon: Icons.scales },
      { title: "Ownership", url: "/research/ownership", icon: Icons.building },
      { title: "Peer Groups", url: "/research/peer-groups", icon: Icons.sector },
      { title: "Comparison", url: "/comparison", icon: Icons.compare },
      { title: "Results", url: "/results", icon: Icons.results },
    ],
  },
  {
    label: "System",
    items: [{ title: "Data & Settings", url: "/settings", icon: Icons.settings }],
  },
];

export function AppSidebar() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const pathname = usePathname();
  const collapsed = !isMobile && state === "collapsed";

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" variant="floating" className="border-none">
      <div className="glass-strong flex h-full flex-col rounded-2xl">
        <SidebarHeader className="px-2 pt-3">
          {collapsed ? (
            <button
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="group relative mx-auto grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 ring-1 ring-primary/30"
            >
              <Icons.spark weight="fill" className="size-5 text-primary group-hover:opacity-0" />
              <Icons.caretRight className="absolute size-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2 px-1">
              <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 ring-1 ring-primary/30">
                  <Icons.spark weight="fill" className="size-5 text-primary" />
                </span>
                <span className="font-display text-lg font-extrabold tracking-tight">
                  Invest<span className="text-gradient">IQ</span>
                </span>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleSidebar}
                className="size-8 shrink-0 text-muted-foreground"
                aria-label="Collapse sidebar"
              >
                <Icons.menu className="size-4" />
              </Button>
            </div>
          )}

          {/* Health pulse — promotes the proprietary score in-nav */}
          {collapsed ? (
            <Link
              href="/health-score"
              aria-label={`Portfolio health ${portfolioSummary.healthScore}`}
              className="mx-auto mt-3 grid place-items-center"
            >
              <HealthRing score={portfolioSummary.healthScore} size={34} strokeWidth={4} showValue />
            </Link>
          ) : (
            <Link
              href="/health-score"
              className="lift group mx-1 mt-3 flex items-center gap-3 rounded-xl border border-border/70 bg-surface-1/50 p-3 hover:border-primary/30"
            >
              <HealthRing score={portfolioSummary.healthScore} size={48} strokeWidth={5} showValue />
              <div className="min-w-0">
                <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  Portfolio Health
                </p>
                <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  Strong
                  <span className="flex items-center gap-0.5 text-xs font-medium text-success">
                    <Icons.trendUp weight="bold" className="size-3" />+{portfolioSummary.healthTrend}
                  </span>
                </p>
              </div>
              <Icons.caretRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </SidebarHeader>

        <SidebarContent className="custom-scrollbar mt-1 gap-0">
          {groups.map((group) => (
            <SidebarGroup key={group.label} className="py-1">
              <SidebarGroupLabel className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.title}
                          className={cn(
                            "group/nav h-10 rounded-lg transition-all",
                            active
                              ? "bg-primary/12 text-foreground ring-1 ring-primary/25"
                              : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
                          )}
                        >
                          <Link href={item.url}>
                            <item.icon
                              weight={active ? "fill" : "regular"}
                              className={cn("size-[1.15rem] shrink-0", active && "text-primary")}
                            />
                            <span className="font-medium">{item.title}</span>
                            {active && !collapsed && (
                              <span className="ml-auto size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--glow)]" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="p-2">
          {collapsed ? (
            <Link
              href="/settings"
              aria-label="Account"
              className="mx-auto grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-accent/30 text-xs font-bold text-primary-foreground"
            >
              AI
            </Link>
          ) : (
            <div className="space-y-2 px-1">
              <div className="overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/12 to-accent/5 p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Icons.crown weight="fill" className="size-4 text-primary" />
                  InvestIQ Pro
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Unlock deep AI analysis &amp; unlimited screens.
                </p>
                <Button size="sm" className="mt-2.5 h-8 w-full">
                  Upgrade
                </Button>
              </div>
              <Link
                href="/settings"
                className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-surface-2/60"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-accent/30 text-xs font-bold text-primary-foreground">
                  AI
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-medium">Aarav Investor</p>
                  <p className="truncate text-xs text-muted-foreground">Pro · NSE</p>
                </div>
                <Icons.settings className="ml-auto size-4 shrink-0 text-muted-foreground" />
              </Link>
            </div>
          )}
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
