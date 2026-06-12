"use client";

import Activity from "@/components/stock-detail/activity";
import CalendarComponent from "@/components/stock-detail/calendar";
import Fundamentals from "@/components/stock-detail/fundamentals";
import HealthScore from "@/components/stock-detail/health";
import News from "@/components/stock-detail/news";
import Overview from "@/components/stock-detail/overview";
import Technical from "@/components/stock-detail/technical";
import Valuation from "@/components/stock-detail/valuation";
import { NavigationCommandPalette } from "@/components/stock-detail/navigation-command-palette";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { indianStocks } from "@/lib/indian-stocks-data";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Plus,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const StockDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbol = params.symbol as string;
  const [stock, setStock] = useState(
    indianStocks.find((s) => s.symbol === symbol),
  );
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const foundStock = indianStocks.find((s) => s.symbol === symbol);
    setStock(foundStock);
  }, [symbol]);

  // Handle URL query parameters for tab and section navigation
  useEffect(() => {
    const tab = searchParams.get("tab");
    const section = searchParams.get("section");

    if (tab) {
      setActiveTab(tab);
    }

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

  if (!stock) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Stock Not Found</CardTitle>
            <CardDescription>
              The stock symbol "{symbol}" was not found in our database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/research/stock-screener")}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stock Screener
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data for demonstration
  const mockData = {
    currentPrice: 1820.5,
    change: 58.4,
    changePercent: 3.32,
    previousClose: 1762.1,
    open: 1765.0,
    dayHigh: 1835.2,
    dayLow: 1760.5,
    marketCap: 1250000, // in Crores
    pe: 18.5,
    pb: 2.3,
    dividendYield: 1.2,
    high52Week: 1950.0,
    low52Week: 1420.0,
    volume: 2500000,
    avgVolume: 2200000,
    healthScore: 85,
    healthTrend: "up",
    healthPrevious: 82,
    roe: 17.2,
    netMargin: 24.5,
    roce: 16.8,
    operatingMargin: 28.2,
    revenueGrowth: 14.2,
    profitGrowth: 18.5,
    debtEquity: 0.35,
    interestCoverage: 9.2,
    beta: 0.92,
    avgDailyMove: 1.2,
    eps: 98.5,
    bookValue: 791.3,
    listedYear: 1995,
    sector: stock.sector,
    industry: stock.sector === "Banking" ? "Private Sector Bank" : stock.sector,
  };

  const isPositive = mockData.change > 0;

  return (
    <div className="min-h-screen pb-12">
      {/* FIXED HEADER */}
      <div className=" bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Left: Company Info & Price */}
            <div className="flex flex-col gap-3">
              {/* Row 1: Ticker and Name */}
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-bold">{stock.symbol}</h1>
                <span className="text-lg text-muted-foreground">{stock.name}</span>
              </div>
              
              {/* Row 2: All badges/pills */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{stock.exchange}</Badge>
                <Badge
                  className={`${
                    mockData.healthScore >= 80
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : mockData.healthScore >= 60
                        ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  Health: {mockData.healthScore}/100
                </Badge>
                <Badge variant="secondary" className="font-mono font-semibold">
                  ₹{mockData.currentPrice.toFixed(2)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`${
                    isPositive ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {isPositive ? "+" : ""}₹{mockData.change.toFixed(2)} ({isPositive ? "+" : ""}{mockData.changePercent.toFixed(2)}%)
                </Badge>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Quick Actions
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Portfolio
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="w-4 h-4 mr-2" />
                    Watchlist
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="w-4 h-4 mr-2" />
                    Set Alert
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Navigation Command Palette */}
              <NavigationCommandPalette currentSymbol={symbol} />
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: "overview", label: "Overview" },
              { id: "health", label: "Health Score" },
              { id: "fundamentals", label: "Fundamentals" },
              { id: "valuation", label: "Valuation" },
              { id: "technical", label: "Technical" },
              { id: "activity", label: "Activity" },
              { id: "events", label: "Events" },
              { id: "news", label: "News" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.push(`/research/stock-screener/${symbol}?tab=${tab.id}`);
                }}
                className={`px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && <Overview stock={stock} />}

        {/* TAB 2: HEALTH SCORE */}
        {activeTab === "health" && <HealthScore stock={stock} />}

        {/* TAB 3: FUNDAMENTALS */}
        {activeTab === "fundamentals" && <Fundamentals />}

        {/* TAB 4: VALUATION */}
        {activeTab === "valuation" && <Valuation />}

        {/* TAB 5: TECHNICAL */}
        {activeTab === "technical" && <Technical />}

        {/* TAB 6: ACTIVITY */}
        {activeTab === "activity" && <Activity />}

        {/* TAB 7: EVENTS */}
        {activeTab === "events" && <CalendarComponent />}

        {/* TAB 8: NEWS */}
        {activeTab === "news" && <News />}
      </div>
    </div>
  );
};

export default StockDetailPage;
