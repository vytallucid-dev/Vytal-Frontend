import { Icons, type Icon } from "@/lib/icons";

// The portfolio surface's tab set. Overview + Holdings are LIVE; the rest follow the same
// read-only-over-snapshot pattern and are marked `soon` until built — honest, not hidden.
// Allocation is NOT its own tab: it's absorbed into Holdings (the cut toggle there drives
// both the donut and the positions group-by), so there's one place capital-spread lives.
export type PortfolioTab = "overview" | "holdings" | "performance" | "health" | "transactions" | "accounts";

export const PORTFOLIO_TABS: { id: PortfolioTab; label: string; icon: Icon; live: boolean }[] = [
  { id: "overview", label: "Overview", icon: Icons.compass, live: true },
  { id: "holdings", label: "Holdings", icon: Icons.portfolio, live: true },
  { id: "performance", label: "Performance", icon: Icons.chartLine, live: true },
  { id: "health", label: "Health", icon: Icons.pulse, live: true },
  { id: "transactions", label: "Transactions", icon: Icons.coins, live: true },
  { id: "accounts", label: "Accounts", icon: Icons.stack, live: true },
];
