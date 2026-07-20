"use client";

import { useEffect } from "react";
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
import { SidebarUser } from "@/components/app-sidebar-user";
import { HealthRing } from "@/components/ui/health-ring";
import { Icons, type Icon } from "@/lib/icons";
import { usePortfolioSnapshot } from "@/lib/api/hooks/use-portfolio-snapshot";
import { useMe } from "@/lib/api/hooks/use-me";
import { HEALTH_BAND_META, healthColor } from "@/components/portfolio/lib";
import { cn } from "@/lib/utils";

type NavItem = { title: string; url: string; icon: Icon; adminOnly?: boolean };
type NavGroup = { label: string; items: NavItem[] };

// Product surfaces above the Settings group. The Settings group is assembled in
// the component because its "Admin Panel" item is admin-gated (role-aware).
const baseGroups: NavGroup[] = [
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
      { title: "Funds & ETFs", url: "/research/funds", icon: Icons.coins },
      { title: "Trajectory", url: "/research/trajectory", icon: Icons.chartLine },
      { title: "Divergence", url: "/research/divergence", icon: Icons.scales },
      { title: "Ownership", url: "/research/ownership", icon: Icons.building },
      { title: "Peer Groups", url: "/research/peer-groups", icon: Icons.sector },
      { title: "Comparison", url: "/comparison", icon: Icons.compare },
      { title: "Results", url: "/results", icon: Icons.results },
    ],
  },
];

export function AppSidebar() {
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const collapsed = !isMobile && state === "collapsed";

  // Real portfolio health pulse — the pre-computed health snapshot, never a fabricated
  // score. null health ⇒ an honest "no read yet" state (empty/unscored/pending book).
  const snapQ = usePortfolioSnapshot();
  const snapshot = snapQ.data?.snapshot ?? null;
  const health = snapshot?.healthRead?.value ?? null;
  const band = snapshot?.healthRead?.band ?? null;
  const bandLabel = band ? HEALTH_BAND_META[band].label : null;

  // Role gate — the "Admin Panel" item appears ONLY for admins. Role comes from
  // /api/v1/me/profile (never the JWT); the backend still enforces admin on the
  // routes themselves, so this is a UI courtesy, not the security boundary.
  const { isAdmin } = useMe();

  // Settings group — assembled here so Admin Panel can be dropped for non-admins.
  const groups: NavGroup[] = [
    ...baseGroups,
    {
      label: "Settings",
      items: [
        ...(isAdmin
          ? [{ title: "Admin Panel", url: "/admin", icon: Icons.shield, adminOnly: true } as NavItem]
          : []),
        { title: "Settings", url: "/settings", icon: Icons.settings },
      ],
    },
  ];

  // On mobile the sidebar is an overlay Sheet — close it whenever the route changes
  // so tapping a nav item navigates AND dismisses the sheet (instead of staying open).
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" variant="floating" className="border-none">
      {/* Flat editorial shell — solid surface + hairline, matching the stock pages
          (no frosted glass, no aurora, no gradient washes). */}
      <div className="flex h-full flex-col rounded-lg border border-line bg-surface-1">
        <SidebarHeader className="px-2 pt-3">
          {collapsed ? (
            <button
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="group relative mx-auto grid size-8 place-items-center rounded-xl border border-line2 bg-surface-2 transition-colors hover:border-line3 hover:bg-surface-3"
            >
              <Icons.spark weight="fill" className="size-5 text-primary group-hover:opacity-0" />
              <Icons.caretRight className="absolute size-4 text-ink opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2 px-1">
              <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line2 bg-surface-2">
                  <Icons.spark weight="fill" className="size-5 text-primary" />
                </span>
                <span className="font-display text-lg font-extrabold tracking-tight text-ink">
                  Vy<span className="text-primary">tal</span>
                </span>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleSidebar}
                className="size-8 shrink-0 text-ink3 hover:text-ink"
                aria-label="Collapse sidebar"
              >
                <Icons.menu className="size-4" />
              </Button>
            </div>
          )}

          {/* Portfolio health pulse — the real health snapshot (never a fabricated score).
              No score yet (empty / unscored / pending) → an honest neutral state. */}
          {collapsed ? (
            health != null ? (
              <Link
                href="/portfolio"
                aria-label={`Portfolio health ${health}`}
                className="mx-auto mt-3 grid place-items-center"
              >
                <HealthRing score={health} size={34} strokeWidth={4} showValue color={band ? healthColor(band) : undefined} />
              </Link>
            ) : (
              <Link
                href="/portfolio"
                aria-label="Portfolio health — no read yet"
                className="mx-auto mt-3 grid size-9 place-items-center rounded-xl border border-line2 bg-surface-2 text-ink3 transition-colors hover:border-line3 hover:bg-surface-3"
              >
                <Icons.health weight="duotone" className="size-4" />
              </Link>
            )
          ) : (
            <Link
              href="/portfolio"
              className="group mx-1 mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 transition-colors hover:border-line3 hover:bg-surface-3"
            >
              {health != null ? (
                <>
                  <HealthRing score={health} size={48} strokeWidth={5} showValue color={band ? healthColor(band) : undefined} />
                  <div className="min-w-0">
                    <p className="text-[0.7rem] uppercase tracking-wider text-ink3">
                      Portfolio Health
                    </p>
                    <p className="text-sm font-semibold" style={bandLabel ? { color: healthColor(band) } : undefined}>
                      {bandLabel ?? "Scored"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full border border-line2 bg-surface-3 text-ink3">
                    <Icons.health weight="duotone" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] uppercase tracking-wider text-ink3">
                      Portfolio Health
                    </p>
                    <p className="text-sm font-semibold text-ink2">No read yet</p>
                  </div>
                </>
              )}
              <Icons.caretRight className="ml-auto size-4 text-ink3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </SidebarHeader>

        <SidebarContent className="custom-scrollbar mt-1 gap-0.5">
          {groups.map((group, gi) => (
            <SidebarGroup
              key={group.label}
              className={cn("py-1", gi > 0 && "border-t border-line")}
            >
              <SidebarGroupLabel className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink3">
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
                            "group/nav relative h-10 rounded-lg transition-colors duration-200",
                            active
                              ? "bg-surface-2 text-ink"
                              : "text-ink2 hover:bg-surface-2 hover:text-ink"
                          )}
                        >
                          <Link href={item.url}>
                            {/* leading primary rail — the single accent marking the active row */}
                            {active && !collapsed && (
                              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                            )}
                            <item.icon
                              weight={active ? "fill" : "regular"}
                              className={cn(
                                "size-[1.15rem] shrink-0 transition-colors",
                                active
                                  ? "text-primary"
                                  : "text-ink3 group-hover/nav:text-ink"
                              )}
                            />
                            <span className="font-medium">{item.title}</span>
                            {item.adminOnly && !collapsed && (
                              <span className="ml-auto inline-flex items-center rounded-md border border-line2 bg-surface-3 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-primary">
                                Admin
                              </span>
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

        <SidebarFooter className="border-t border-line p-2">
          {collapsed ? (
            <SidebarUser collapsed />
          ) : (
            <div className="px-1">
              <SidebarUser collapsed={false} />
            </div>
          )}
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
