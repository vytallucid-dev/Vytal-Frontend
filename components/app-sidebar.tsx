"use client";

import {
  BarChart3,
  Bookmark,
  Calendar,
  CalendarDays,
  FileText,
  GitCompare,
  Home,
  LayoutDashboard,
  PanelLeftIcon,
  Search,
  Settings,
  SquareActivity,
  TrendingUp,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import Link from "next/link";
import AnimatedCollapsible from "./sidebar/animated-collapsibe";
import { ThemeToggle } from "./theme-toggler";
import { Button } from "./ui/button";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Health Score",
    url: "/health-score",
    icon: SquareActivity,
  },
  {
    title: "Portfolio",
    url: "/portfolio",
    icon: Calendar,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "Watchlist",
    url: "/watchlist",
    icon: Bookmark,
  },
  {
    title: "Comparison",
    url: "/comparison",
    icon: GitCompare,
  },
  {
    title: "Results",
    url: "/results",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Stock Screener",
    url: "/research/stock-screener",
    icon: Search,
  },
  {
    title: "Sector Analysis",
    url: "/research/sector-analysis",
    icon: BarChart3,
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { theme } = useTheme();

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={state !== "collapsed" ? "hover:!bg-transparent " : ""}
            >
              {state === "collapsed" ? (
                <div className="flex items-center justify-center cursor-pointer ">
                  <PanelLeftIcon onClick={() => toggleSidebar()} />
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="flex items-center grow pointer-events-none gap-2">
                    <Home size={16} />
                    <span className="text-primary text-xl font-bold">
                      InvestIQ
                    </span>
                  </div>
                  <Button
                    size={"icon"}
                    variant={"ghost"}
                    onClick={() => toggleSidebar()}
                    className="hover:!bg-sidebar-accent cursor-pointer"
                  >
                    <PanelLeftIcon />
                  </Button>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="!w-[calc(100%-8px)] mx-auto" />

      <SidebarContent className=" custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.title === "Home"}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="w-full flex items-center gap-2">
                <ThemeToggle
                  className={state === "collapsed" ? "w-full h-full" : ""}
                />
                <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
