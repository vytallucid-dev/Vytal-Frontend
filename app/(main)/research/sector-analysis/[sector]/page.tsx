"use client";

import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SummaryTab } from "@/components/sector-analysis/SummaryTab";
import { HealthTab } from "@/components/sector-analysis/HealthTab";
import { ActivityTab } from "@/components/sector-analysis/ActivityTab";
import { FinancialTab } from "@/components/sector-analysis/FinancialTab";
import { SectorNavigationCommandPalette } from "@/components/sector-analysis/navigation-command-palette";
import {
  AlertCircle,
  BarChart,
  Building2,
  Clock,
  DollarSign,
  Percent,
  Target,
  TrendingUp,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Activity, useState, useEffect } from "react";
import { Cell, Line, LineChart, Pie, PieChart } from "recharts";

// Performance data for different time ranges
const sectorPerformanceData = {
  "3M": [
    { date: "Sep 21", value: 12450 },
    { date: "Sep 24", value: 12520 },
    { date: "Sep 28", value: 12580 },
    { date: "Oct 1", value: 12640 },
    { date: "Oct 5", value: 12720 },
    { date: "Oct 8", value: 12680 },
    { date: "Oct 12", value: 12650 },
    { date: "Oct 15", value: 12780 },
    { date: "Oct 19", value: 12890 },
    { date: "Oct 22", value: 12950 },
    { date: "Oct 26", value: 13120 },
    { date: "Oct 29", value: 13180 },
    { date: "Nov 2", value: 13280 },
    { date: "Nov 5", value: 13350 },
    { date: "Nov 9", value: 13450 },
    { date: "Nov 12", value: 13520 },
    { date: "Nov 16", value: 13620 },
    { date: "Nov 19", value: 13590 },
    { date: "Nov 23", value: 13580 },
    { date: "Nov 26", value: 13720 },
    { date: "Nov 30", value: 13890 },
    { date: "Dec 3", value: 13980 },
    { date: "Dec 7", value: 14120 },
    { date: "Dec 10", value: 14220 },
    { date: "Dec 14", value: 14380 },
    { date: "Dec 17", value: 14520 },
    { date: "Dec 21", value: 14690 },
  ],
  "6M": [
    { date: "Jul 1", value: 11200 },
    { date: "Jul 8", value: 11280 },
    { date: "Jul 15", value: 11380 },
    { date: "Jul 22", value: 11450 },
    { date: "Jul 29", value: 11520 },
    { date: "Aug 1", value: 11540 },
    { date: "Aug 8", value: 11620 },
    { date: "Aug 15", value: 11720 },
    { date: "Aug 22", value: 11880 },
    { date: "Aug 29", value: 12020 },
    { date: "Sep 1", value: 12100 },
    { date: "Sep 8", value: 12250 },
    { date: "Sep 15", value: 12450 },
    { date: "Sep 22", value: 12520 },
    { date: "Sep 29", value: 12580 },
    { date: "Oct 1", value: 12680 },
    { date: "Oct 8", value: 12780 },
    { date: "Oct 15", value: 12920 },
    { date: "Oct 22", value: 13080 },
    { date: "Oct 29", value: 13180 },
    { date: "Nov 1", value: 13280 },
    { date: "Nov 8", value: 13420 },
    { date: "Nov 15", value: 13560 },
    { date: "Nov 22", value: 13680 },
    { date: "Nov 29", value: 13820 },
    { date: "Dec 1", value: 13950 },
    { date: "Dec 8", value: 14120 },
    { date: "Dec 15", value: 14380 },
    { date: "Dec 21", value: 14690 },
  ],
  "1Y": [
    { date: "Jan '25", value: 9850 },
    { date: "Jan 15", value: 9780 },
    { date: "Feb '25", value: 9680 },
    { date: "Feb 15", value: 9820 },
    { date: "Mar '25", value: 10240 },
    { date: "Mar 15", value: 10380 },
    { date: "Apr '25", value: 10680 },
    { date: "Apr 15", value: 10620 },
    { date: "May '25", value: 10520 },
    { date: "May 15", value: 10780 },
    { date: "Jun '25", value: 11120 },
    { date: "Jun 15", value: 11280 },
    { date: "Jul '25", value: 11480 },
    { date: "Jul 15", value: 11620 },
    { date: "Aug '25", value: 11850 },
    { date: "Aug 15", value: 12020 },
    { date: "Sep '25", value: 12450 },
    { date: "Sep 15", value: 12580 },
    { date: "Oct '25", value: 13020 },
    { date: "Oct 15", value: 13180 },
    { date: "Nov '25", value: 13680 },
    { date: "Nov 15", value: 13820 },
    { date: "Dec '25", value: 14380 },
    { date: "Dec 21", value: 14690 },
  ],
  "5Y": [
    { date: "Q1 2021", value: 6200 },
    { date: "Q2 2021", value: 7100 },
    { date: "Q3 2021", value: 8200 },
    { date: "Q4 2021", value: 8950 },
    { date: "Q1 2022", value: 8450 },
    { date: "Q2 2022", value: 7850 },
    { date: "Q3 2022", value: 7420 },
    { date: "Q4 2022", value: 8100 },
    { date: "Q1 2023", value: 8950 },
    { date: "Q2 2023", value: 9680 },
    { date: "Q3 2023", value: 10240 },
    { date: "Q4 2023", value: 10850 },
    { date: "Q1 2024", value: 11420 },
    { date: "Q2 2024", value: 12180 },
    { date: "Q3 2024", value: 12850 },
    { date: "Q4 2024", value: 13580 },
    { date: "Q1 2025", value: 13980 },
    { date: "Q2 2025", value: 14220 },
    { date: "Q3 2025", value: 14480 },
    { date: "Q4 2025", value: 14690 },
  ],
  ALL: [
    { date: "2018", value: 4200 },
    { date: "2019", value: 4680 },
    { date: "2020", value: 5250 },
    { date: "2021", value: 7600 },
    { date: "2022", value: 7100 },
    { date: "2023", value: 8820 },
    { date: "2024", value: 10240 },
    { date: "2025", value: 11980 },
    { date: "2026 YTD", value: 14690 },
  ],
};

// Mock data for sector analysis
const getSectorData = (sector: string) => {
  const sectorName = sector
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    name: sectorName,
    verdict:
      "The sector is stable, but valuations are higher than long-term averages.",
    snapshot: {
      healthScore: 85,
      avgValuation: "24.5 P/E",
      yearReturn: "+28.4%",
      lastUpdated: "2 hours ago",
      marketCap: "$12.8T",
      volatility: "Medium",
    },
    sectorInfo: {
      description:
        "This sector focuses on technology innovation, software development, and digital transformation solutions that drive modern business operations.",
      overview:
        "Comprised of companies developing cutting-edge technologies, cloud services, artificial intelligence, and consumer electronics that shape the digital economy.",
      objective:
        "To provide investors exposure to high-growth technology companies driving innovation across multiple industries and consumer segments.",
      totalCompanies: 156,
      avgAge: "28 years",
      headquarters: "Global",
    },
    healthMetrics: {
      overall: 85,
      financial: 88,
      growth: 92,
      valuation: 75,
      momentum: 89,
      stability: 78,
    },
    healthHistory: [
      { period: "1M", score: 83 },
      { period: "3M", score: 81 },
      { period: "6M", score: 79 },
      { period: "1Y", score: 75 },
      { period: "2Y", score: 78 },
      { period: "3Y", score: 82 },
    ],
    healthPillars: [
      {
        name: "Profitability",
        rating: "Strong",
        explanation:
          "Companies consistently generate healthy profit margins above industry benchmarks.",
      },
      {
        name: "Growth",
        rating: "Strong",
        explanation:
          "Revenue and earnings are expanding faster than the broader market.",
      },
      {
        name: "Debt & Safety",
        rating: "Average",
        explanation:
          "Debt levels are manageable but slightly elevated compared to historical norms.",
      },
      {
        name: "Valuation",
        rating: "Weak",
        explanation:
          "Stock prices appear expensive relative to current earnings and growth prospects.",
      },
    ],
    topStocks: [
      {
        ticker: "AAPL",
        name: "Apple Inc.",
        marketCap: "$2.8T",
        healthScore: 88,
        change: "+3",
      },
      {
        ticker: "MSFT",
        name: "Microsoft Corp",
        marketCap: "$2.7T",
        healthScore: 92,
        change: "+1",
      },
      {
        ticker: "NVDA",
        name: "NVIDIA Corp",
        marketCap: "$1.1T",
        healthScore: 85,
        change: "+8",
      },
      {
        ticker: "GOOGL",
        name: "Alphabet Inc",
        marketCap: "$1.8T",
        healthScore: 79,
        change: "-2",
      },
      {
        ticker: "TSLA",
        name: "Tesla Inc",
        marketCap: "$793B",
        healthScore: 72,
        change: "+5",
      },
      {
        ticker: "META",
        name: "Meta Platforms",
        marketCap: "$891B",
        healthScore: 81,
        change: "+2",
      },
    ],
    sectorMetrics: [
      {
        name: "Revenue Growth",
        value: "12.4%",
        category: "growth",
        icon: TrendingUp,
        explanation:
          "Year-over-year revenue growth rate showing sector expansion and business momentum.",
        trend: "+3.2%",
      },
      {
        name: "Profit Margin",
        value: "18.6%",
        category: "profitability",
        icon: Target,
        explanation:
          "Net profit margin indicating operational efficiency and pricing power.",
        trend: "+0.9%",
      },
      {
        name: "P/E Ratio",
        value: "24.5x",
        category: "valuation",
        icon: Percent,
        explanation:
          "Price-to-earnings ratio showing how much investors pay for each dollar of earnings.",
        trend: "+2.1%",
      },
      {
        name: "ROE",
        value: "22.1%",
        category: "profitability",
        icon: BarChart,
        explanation:
          "Return on equity measuring how effectively companies generate returns on shareholder investments.",
        trend: "+1.8%",
      },
      {
        name: "Debt-to-Equity",
        value: "0.42",
        category: "risk",
        icon: AlertCircle,
        explanation:
          "Financial leverage ratio indicating the balance between debt and equity financing.",
        trend: "-0.05%",
      },
      {
        name: "Market Cap",
        value: "$2.4T",
        category: "size",
        icon: Building2,
        explanation:
          "Total market capitalization representing sector size and investor interest.",
        trend: "+15.6%",
      },
      {
        name: "Beta",
        value: "1.15",
        category: "risk",
        icon: Activity,
        explanation:
          "Volatility measure relative to market - values above 1 indicate higher volatility than market average.",
        trend: "+0.05%",
      },
      {
        name: "Dividend Yield",
        value: "1.8%",
        category: "income",
        icon: DollarSign,
        explanation:
          "Average dividend yield across sector companies providing income to investors.",
        trend: "+0.2%",
      },
    ],
    smartInsights: [
      {
        icon: "🚀",
        trend: "STRONG CREDIT GROWTH",
        detail:
          "Loan book expanded 15.2% YoY, driven by retail and MSME segments. Asset quality remains stable with GNPA at 3.1%.",
        impact:
          "Higher lending indicates strong economic activity and revenue potential",
        direction: "up",
      },
      {
        icon: "💰",
        trend: "IMPROVING MARGINS",
        detail:
          "NIMs improved to 3.8%, up from 3.5% last quarter as rate hikes boost interest income faster than cost of funds.",
        impact: "Better profitability and earnings growth ahead",
        direction: "up",
      },
      {
        icon: "⚠️",
        trend: "ELEVATED VALUATIONS",
        detail:
          "Sector P/B at 2.1x vs 5-year average of 1.8x. Premium valuations leave limited margin for disappointment.",
        impact:
          "New positions carry higher risk; look for individual stock opportunities",
        direction: "neutral",
      },
      {
        icon: "📊",
        trend: "STRONG DEPOSIT GROWTH",
        detail:
          "Deposits grew 11.8% YoY with CASA ratio maintained at 42%. Stable funding base for future lending.",
        impact: "Supports sustainable growth without liquidity pressure",
        direction: "up",
      },
    ],
    upcomingEvents: [
      { date: "Dec 18", event: "Apple Q4 Earnings Release", impact: "High" },
      { date: "Dec 20", event: "Microsoft Q4 Earnings", impact: "High" },
      { date: "Dec 22", event: "NVIDIA Q4 Earnings", impact: "Medium" },
      { date: "Dec 24", event: "Holiday Trading Break", impact: "Low" },
      {
        date: "Dec 31",
        event: "Year-end Portfolio Rebalancing",
        impact: "Medium",
      },
    ],
    recentMovers: [
      {
        ticker: "NVDA",
        change: "+8.2%",
        reason: "Strong AI chip demand exceeded quarterly expectations",
      },
      {
        ticker: "TSLA",
        change: "+5.6%",
        reason: "Electric vehicle delivery numbers beat analyst forecasts",
      },
      {
        ticker: "META",
        change: "+2.1%",
        reason: "Virtual reality segment showed improved user engagement",
      },
      {
        ticker: "GOOGL",
        change: "-1.2%",
        reason: "Regulatory concerns about AI development practices emerged",
      },
    ],
    sectorNews: [
      {
        title: "AI Innovation Drives Record Sector Investment",
        time: "2 hours ago",
      },
      {
        title: "Tech Companies Report Strong Holiday Quarter",
        time: "4 hours ago",
      },
      {
        title: "Supply Chain Improvements Boost Manufacturing",
        time: "6 hours ago",
      },
      {
        title: "Consumer Spending on Technology Remains Robust",
        time: "8 hours ago",
      },
    ],
  };
};

// Performance comparison chart data
const performanceData = [
  { month: "Jan", sector: 100, nifty: 90, sensex: 80 },
  { month: "Feb", sector: 110, nifty: 95, sensex: 85 },
  { month: "Mar", sector: 120, nifty: 100, sensex: 90 },
  { month: "Apr", sector: 130, nifty: 105, sensex: 95 },
  { month: "May", sector: 140, nifty: 110, sensex: 100 },
  { month: "Jun", sector: 150, nifty: 115, sensex: 105 },
  { month: "Jul", sector: 160, nifty: 120, sensex: 110 },
  { month: "Aug", sector: 170, nifty: 125, sensex: 115 },
  { month: "Sep", sector: 180, nifty: 130, sensex: 120 },
  { month: "Oct", sector: 190, nifty: 135, sensex: 125 },
  { month: "Nov", sector: 200, nifty: 140, sensex: 130 },
  { month: "Dec", sector: 190, nifty: 138, sensex: 128 },
];

const chartConfig = {
  sector: {
    label: "Technology Sector",
    color: "hsl(45, 90%, 60%)",
  },
  nifty: {
    label: "Nifty 50",
    color: "hsl(40, 70%, 50%)",
  },
  sensex: {
    label: "Sensex",
    color: "hsl(35, 60%, 42%)",
  },
} satisfies ChartConfig;

// Market concentration pie chart data
const concentrationData = [
  { name: "Top 3 Companies", value: 42, fill: "hsl(217, 91%, 60%)" },
  { name: "Next 7 Companies", value: 26, fill: "hsl(142, 76%, 36%)" },
  { name: "Other Companies", value: 32, fill: "hsl(45, 93%, 47%)" },
];

const concentrationConfig = {
  top3: {
    label: "Top 3 Companies",
    color: "hsl(217, 91%, 60%)",
  },
  next7: {
    label: "Next 7 Companies",
    color: "hsl(142, 76%, 36%)",
  },
  others: {
    label: "Other Companies",
    color: "hsl(45, 93%, 47%)",
  },
} satisfies ChartConfig;

function ChartLegendCustom() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4 ">
      {Object.entries(chartConfig).map(([key, config]) => (
        <div
          key={key}
          className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm shadow-sm bg-background"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="font-medium text-xs text-muted-foreground">
            {config.label}
          </span>
        </div>
      ))}
    </div>
  );
}

const getMetricColor = (category: string) => {
  switch (category) {
    case "profitability":
      return "bg-emerald-900/15 text-emerald-200 border border-emerald-700/20 hover:bg-emerald-900/25";
    case "growth":
      return "bg-blue-900/15 text-blue-200 border border-blue-700/20 hover:bg-blue-900/25";
    case "valuation":
      return "bg-purple-900/15 text-purple-200 border border-purple-700/20 hover:bg-purple-900/25";
    case "risk":
      return "bg-amber-900/15 text-amber-200 border border-amber-700/20 hover:bg-amber-900/25";
    case "size":
      return "bg-slate-800/15 text-slate-200 border border-slate-600/20 hover:bg-slate-800/25";
    case "income":
      return "bg-teal-900/15 text-teal-200 border border-teal-700/20 hover:bg-teal-900/25";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getSnapshotBadgeColor = (type: string) => {
  switch (type) {
    case "health":
      return "bg-emerald-900/20 text-emerald-300 border border-emerald-700/30";
    case "valuation":
      return "bg-blue-900/20 text-blue-300 border border-blue-700/30";
    case "return":
      return "bg-green-900/20 text-green-300 border border-green-700/30";
    case "cap":
      return "bg-purple-900/20 text-purple-300 border border-purple-700/30";
    case "volatility":
      return "bg-amber-900/20 text-amber-300 border border-amber-700/30";
    case "updated":
      return "bg-slate-800/20 text-slate-300 border border-slate-600/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getRatingColor = (rating: string) => {
  switch (rating) {
    case "Strong":
      return "bg-emerald-100 text-emerald-700";
    case "Average":
      return "bg-amber-100 text-amber-700";
    case "Weak":
      return "bg-red-100 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getHealthColor = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
};

const getChangeColor = (change: string) => {
  return change.startsWith("+") ? "text-emerald-600" : "text-red-600";
};

export default function SectorDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("summary");
  const [performanceTimeRange, setPerformanceTimeRange] = useState<
    "3M" | "6M" | "1Y" | "5Y" | "ALL"
  >("1Y");
  const sectorSlug = params.sector as string;
  const sectorData = getSectorData(sectorSlug);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className=" bg-background border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="space-y-4">
            {/* Title */}
            <h1 className="text-2xl font-bold">
              {sectorData.name} Sector Health
            </h1>

            {/* Verdict */}
            {/* <p className="text-muted-foreground">{sectorData.verdict}</p> */}
            <div className="w-full flex items-center justify-between">
              {/* Snapshot Metrics - Badge Style */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${getSnapshotBadgeColor(
                    "health",
                  )}`}
                >
                  Health: {sectorData.snapshot.healthScore}
                </div>
                <div
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${getSnapshotBadgeColor(
                    "valuation",
                  )}`}
                >
                  P/E: {sectorData.snapshot.avgValuation}
                </div>
                <div
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${getSnapshotBadgeColor(
                    "return",
                  )}`}
                >
                  1Y: {sectorData.snapshot.yearReturn}
                </div>
                <div
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${getSnapshotBadgeColor(
                    "cap",
                  )}`}
                >
                  Cap: {sectorData.snapshot.marketCap}
                </div>
                <div
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${getSnapshotBadgeColor(
                    "volatility",
                  )}`}
                >
                  Vol: {sectorData.snapshot.volatility}
                </div>
                <div
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${getSnapshotBadgeColor(
                    "updated",
                  )}`}
                >
                  <Clock className="w-3 h-3 inline mr-1" />
                  {sectorData.snapshot.lastUpdated}
                </div>
              </div>
              {/* Navigation Command Palette */}
              <SectorNavigationCommandPalette currentSector={sectorSlug} />
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="container mx-auto px-6">
          <div className="flex border-b">
            {["summary", "health", "activity", "financial"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize transition-colors relative ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Summary Tab */}
        {activeTab === "summary" && (
          <SummaryTab
            sectorData={sectorData}
            performanceTimeRange={performanceTimeRange}
            setPerformanceTimeRange={setPerformanceTimeRange}
            sectorPerformanceData={sectorPerformanceData}
            performanceData={performanceData}
            chartConfig={chartConfig}
            concentrationData={concentrationData}
            concentrationConfig={concentrationConfig}
            ChartLegendCustom={ChartLegendCustom}
            getRatingColor={getRatingColor}
            getHealthColor={getHealthColor}
            getChangeColor={getChangeColor}
          />
        )}

        {/* Health Tab */}
        {activeTab === "health" && (
          <HealthTab sectorData={sectorData} getHealthColor={getHealthColor} />
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <ActivityTab
            sectorData={sectorData}
            getChangeColor={getChangeColor}
          />
        )}

        {/* Financial Tab */}
        {activeTab === "financial" && <FinancialTab />}
      </div>
    </div>
  );
}
