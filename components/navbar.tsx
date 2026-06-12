"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import ToggleToProMode from "./pro-mode-toggle";
import {
  LayoutDashboard,
  Target,
  MessageCircle,
  Bell,
  TrendingUp,
  Notebook,
  CalendarIcon,
  GitCompare,
  FileText,
  Search,
  BarChart3,
} from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();

  // Define page configurations
  const getPageConfig = () => {
    switch (pathname) {
      case "/dashboard":
        return {
          title: "Dashboard",
          icon: LayoutDashboard,
          breadcrumb: [
            { label: "Home", href: "/" },
            { label: "Dashboard", href: "/dashboard", isActive: true },
          ],
        };
      case "/health-score":
        return {
          title: "Health Scores",
          icon: Target,
          breadcrumb: [
            { label: "Home", href: "/" },
            { label: "Analytics", href: "#" },
            { label: "Health Scores", href: "/health-score", isActive: true },
          ],
        };
      case "/portfolio":
        return {
          title: "Portfolio",
          icon: TrendingUp,
          breadcrumb: [
            { label: "Home", href: "/" },
            { label: "Investment", href: "#" },
            { label: "Portfolio", href: "/portfolio", isActive: true },
          ],
        };
      case "/chat":
        return {
          title: "AI Chat",
          icon: MessageCircle,
          breadcrumb: [
            { label: "Home", href: "/" },
            { label: "AI Tools", href: "#" },
            { label: "AI Chat", href: "/chat", isActive: true },
          ],
        };
      case "/alerts":
        return {
          title: "Alerts",
          icon: Bell,
          breadcrumb: [
            { label: "Home", href: "/" },
            { label: "Monitoring", href: "#" },
            { label: "Alerts", href: "/alerts", isActive: true },
          ],
        };
      case "/calendar":
        return {
          title: "Market Calendar",
          icon: CalendarIcon,
          breadcrumb: [
            { label: "Home", href: "/" },
            { label: "Monitoring", href: "#" },
            { label: "Market Calendar", href: "/calendar", isActive: true },
          ],
        };
      case "/watchlist":
        return {
          title: "Watchlist",
          icon: Notebook,
          breadcrumb: [
            { label: "Home", href: "/" },
            { label: "Watchlist", href: "/watchlist", isActive: true },
          ],
        };
      case "/comparison":
        return {
          title: "Comparison",
          icon: GitCompare,
          breadcrumb: [
            { label: "Home", href: "/" },
            { label: "Comparison", href: "/comparison", isActive: true },
          ],
        };
      case "/results":
        return {
          title: "Quarterly Results",
          icon: FileText,
          breadcrumb: [
            { label: "Home", href: "/" },
            { label: "Results", href: "/results", isActive: true },
          ],
        };

      case "/research/stock-screener":
        return {
          title: "Stock Screener",
          icon: Search,
          breadcrumb: [
            { label: "Home", href: "/" },
            {
              label: "Stock Screener",
              href: "/research/stock-screener",
              isActive: true,
            },
          ],
        };
      case "/research/sector-analysis":
        return {
          title: "Sector Analysis",
          icon: BarChart3,
          breadcrumb: [
            { label: "Home", href: "/" },
            {
              label: "Sector Analysis",
              href: "/research/sector-analysis",
              isActive: true,
            },
          ],
        };
      default:
        return {
          title: "Dashboard",
          icon: LayoutDashboard,
          breadcrumb: [
            { label: "Home", href: "/" },
            { label: "Dashboard", href: "/dashboard", isActive: true },
          ],
        };
    }
  };

  const pageConfig = getPageConfig();
  const IconComponent = pageConfig.icon;

  return (
    <div className="w-full mb-2 px-4 py-2 flex flex-col gap-2 ">
      <div className=" w-full flex items-center justify-between ">
        <div className="hidden sm:flex items-center gap-2">
          <IconComponent />
          <h1 className="text-xl">{pageConfig.title}</h1>
        </div>
        <SidebarTrigger className="sm:hidden" />

        <div className="flex items-center gap-4">
          {/* Switch to Pro mode */}
          {/* <ToggleToProMode /> */}

          {/* User avatar */}
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      </div>
      {/* <Breadcrumb className="hidden sm:flex">
        <BreadcrumbList className="text-xs text-muted-foreground/50 ">
          {pageConfig.breadcrumb.map((item, index) => (
            <BreadcrumbItem key={index}>
              {item.isActive ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
              {index < pageConfig.breadcrumb.length - 1 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb> */}
    </div>
  );
};

export default Navbar;
