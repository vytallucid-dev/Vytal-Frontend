"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Info,
  Shield,
  TrendingDown,
  TrendingUp,
  TrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Heart,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Dot,
} from "recharts";
import { portfolioStocks } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const HealthTab = () => {
  const [activeDeepDive, setActiveDeepDive] = useState("profitability");
  const [selectedPeriod, setSelectedPeriod] = useState("1Y");

  // Portfolio Health Stocks Table State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "score", direction: "desc" });
  const itemsPerPage = 10;

  // Chart data based on selected period
  const getChartData = () => {
    switch (selectedPeriod) {
      case "3M":
        return [
          { date: "Oct", score: 81, month: "Oct" },
          { date: "Oct 15", score: 81.2, month: "Oct 15" },
          { date: "Nov", score: 81.5, month: "Nov" },
          { date: "Nov 15", score: 81.7, month: "Nov 15" },
          { date: "Dec", score: 81.8, month: "Dec" },
          { date: "Dec 15", score: 82, month: "Dec 15" },
          { date: "Jan", score: 82, month: "Jan" },
          { date: "Jan 15", score: 82, month: "Jan 15" },
          { date: "Jan 26", score: 82, month: "Jan" },
        ];
      case "6M":
        return [
          { date: "Jul", score: 80.5, month: "Jul" },
          { date: "Aug", score: 81, month: "Aug" },
          { date: "Sep", score: 81.2, month: "Sep" },
          { date: "Oct", score: 81.5, month: "Oct" },
          { date: "Nov", score: 81.7, month: "Nov" },
          { date: "Dec", score: 82, month: "Dec" },
          { date: "Jan", score: 82, month: "Jan" },
        ];
      case "1Y":
        return [
          { date: "Jan 25", score: 78, month: "Jan 25" },
          { date: "Feb", score: 78.5, month: "Feb" },
          { date: "Mar", score: 79, month: "Mar" },
          { date: "Apr", score: 79.3, month: "Apr" },
          { date: "May", score: 79.8, month: "May", event: "Major Buy" },
          { date: "Jun", score: 80.2, month: "Jun" },
          { date: "Jul", score: 80.5, month: "Jul" },
          { date: "Aug", score: 81, month: "Aug" },
          { date: "Sep", score: 81.2, month: "Sep" },
          { date: "Oct", score: 81.5, month: "Oct", event: "Market Event" },
          { date: "Nov", score: 81.8, month: "Nov" },
          { date: "Dec", score: 82, month: "Dec" },
          { date: "Jan 26", score: 82, month: "Jan 26" },
        ];
      case "3Y":
        return [
          { date: "Jan 23", score: 72, month: "Jan 23" },
          { date: "Mar 23", score: 72.5, month: "Mar 23" },
          { date: "May 23", score: 73, month: "May 23" },
          { date: "Jul 23", score: 74, month: "Jul 23" },
          { date: "Sep 23", score: 75, month: "Sep 23" },
          { date: "Nov 23", score: 76, month: "Nov 23" },
          { date: "Jan 24", score: 77, month: "Jan 24" },
          { date: "Mar 24", score: 77.8, month: "Mar 24" },
          { date: "May 24", score: 78.5, month: "May 24" },
          { date: "Jul 24", score: 79.2, month: "Jul 24" },
          { date: "Sep 24", score: 80, month: "Sep 24" },
          { date: "Nov 24", score: 80.8, month: "Nov 24" },
          { date: "Jan 25", score: 81.5, month: "Jan 25" },
          { date: "Jun 25", score: 81.8, month: "Jun 25" },
          { date: "Jan 26", score: 82, month: "Jan 26" },
        ];
      case "ALL":
        return [
          { date: "2020", score: 68, month: "2020" },
          { date: "Q2 20", score: 68.5, month: "Q2" },
          { date: "Q3 20", score: 69.2, month: "Q3" },
          { date: "Q4 20", score: 70, month: "Q4" },
          { date: "2021", score: 71, month: "2021" },
          { date: "Q2 21", score: 72.5, month: "Q2" },
          { date: "Q3 21", score: 73.5, month: "Q3" },
          { date: "Q4 21", score: 75, month: "Q4" },
          { date: "2022", score: 76, month: "2022" },
          { date: "Q2 22", score: 77, month: "Q2" },
          { date: "Q3 22", score: 77.8, month: "Q3" },
          { date: "Q4 22", score: 78.5, month: "Q4" },
          { date: "2023", score: 79.2, month: "2023" },
          { date: "Q2 23", score: 80.2, month: "Q2" },
          { date: "Q3 23", score: 80.8, month: "Q3" },
          { date: "Q4 23", score: 81.5, month: "Q4" },
          { date: "2025", score: 81.8, month: "2025" },
          { date: "2026", score: 82, month: "2026" },
        ];
      default:
        return [];
    }
  };

  const chartConfig = {
    score: {
      label: "Health Score",
      color: "hsl(var(--primary))",
    },
  };

  // Helper functions for Portfolio Health Stocks Table
  const getScoreBgColor = (score: number) => {
    if (score >= 80)
      return "bg-gradient-to-br from-green-400/20 to-green-600/30 border border-green-500/30 text-green-400";
    if (score >= 60)
      return "bg-gradient-to-br from-yellow-400/20 to-yellow-600/30 border border-yellow-500/30 text-yellow-400";
    return "bg-gradient-to-br from-red-400/20 to-red-600/30 border border-red-500/30 text-red-400";
  };

  const getMetricClass = (value: number) => {
    if (value >= 80) return "bg-green-900/50 text-green-500 ";
    if (value >= 60) return "bg-yellow-500/20 text-yellow-500 ";
    return "bg-red-700/40 text-red-500 ";
  };

  // Filtering and sorting logic for portfolio stocks
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = portfolioStocks.filter((stock) => {
      const matchesSearch =
        stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return filtered;
  }, [searchTerm, sortConfig]);

  // Pagination calculations for portfolio stocks
  const totalPages = Math.ceil(filteredAndSortedStocks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStocks = filteredAndSortedStocks.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  // Deep-dive data for each category
  const deepDiveData: any = {
    profitability: {
      name: "Profitability",
      icon: "💰",
      score: 85,
      badge: "Strong",
      badgeColor: "bg-green-500",
      explanation: {
        title: "What is Profitability?",
        definition:
          "Profitability measures how well companies convert revenue into actual profit. It shows if businesses are earning money efficiently.",
        whyMatters:
          "High profitability means companies can reinvest in growth, pay dividends, and weather downturns. It's a sign of competitive advantage and pricing power.",
        simple:
          "Think of it as: For every ₹100 in sales, how much actual profit do they keep? Strong companies keep ₹15-25.",
      },
      portfolioMetrics: [
        {
          label: "Avg ROE",
          value: "16.5%",
          vsMarket: "vs Market 12%",
          status: "good",
        },
        {
          label: "Avg Profit Margin",
          value: "18.2%",
          vsMarket: "vs Market 14%",
          status: "good",
        },
        {
          label: "Avg ROA",
          value: "12.8%",
          vsMarket: "vs Market 9%",
          status: "good",
        },
        {
          label: "ROIC",
          value: "19.4%",
          vsMarket: "vs Market 15%",
          status: "good",
        },
      ],
      stockRankings: [
        {
          rank: 1,
          stock: "TCS",
          score: 95,
          metric1: "ROE 22%",
          metric2: "Margin 25%",
          badge: "Excellent",
          badgeColor: "green",
        },
        {
          rank: 2,
          stock: "Bajaj Finance",
          score: 92,
          metric1: "ROE 20%",
          metric2: "Margin 28%",
          badge: "Excellent",
          badgeColor: "green",
        },
        {
          rank: 3,
          stock: "HDFC Bank",
          score: 88,
          metric1: "ROE 18%",
          metric2: "Margin 22%",
          badge: "Strong",
          badgeColor: "green",
        },
        {
          rank: 4,
          stock: "ITC",
          score: 85,
          metric1: "ROE 24%",
          metric2: "Margin 32%",
          badge: "Strong",
          badgeColor: "green",
        },
      ],
      insights: {
        working: [
          "IT services stocks showing excellent capital efficiency (ROE >20%)",
          "Financial sector benefiting from margin expansion",
          "No stocks with negative profitability - solid foundation",
        ],
        watching: [
          "Tech Mahindra margins under pressure from wage inflation",
          "Some stocks trading at premium valuations despite moderate profitability",
        ],
      },
    },
    growth: {
      name: "Growth",
      icon: "📈",
      score: 80,
      badge: "Strong",
      badgeColor: "bg-green-500",
      explanation: {
        title: "What is Growth?",
        definition:
          "Growth measures how fast companies are expanding revenue and profits over time. It shows business momentum.",
        whyMatters:
          "Growing companies can increase your wealth faster. Consistent growth often leads to stock price appreciation.",
        simple:
          "If a company grew profits by 15% last year, your share of profits grew 15% too - compounding your returns.",
      },
      portfolioMetrics: [
        {
          label: "Avg Revenue Growth",
          value: "12.4%",
          vsMarket: "vs Market 8%",
          status: "good",
        },
        {
          label: "Avg Profit Growth",
          value: "15.2%",
          vsMarket: "vs Market 10%",
          status: "good",
        },
        {
          label: "EPS Growth",
          value: "16.8%",
          vsMarket: "vs Market 11%",
          status: "good",
        },
        {
          label: "3Y CAGR",
          value: "14.5%",
          vsMarket: "vs Market 9%",
          status: "good",
        },
      ],
      stockRankings: [
        {
          rank: 1,
          stock: "TCS",
          score: 90,
          metric1: "+18% Profit",
          metric2: "+15% Rev",
          badge: "Excellent",
          badgeColor: "green",
        },
        {
          rank: 2,
          stock: "Bajaj Finance",
          score: 88,
          metric1: "+22% Profit",
          metric2: "+19% Rev",
          badge: "Excellent",
          badgeColor: "green",
        },
        {
          rank: 3,
          stock: "Reliance",
          score: 82,
          metric1: "+14% Profit",
          metric2: "+12% Rev",
          badge: "Strong",
          badgeColor: "green",
        },
        {
          rank: 4,
          stock: "HDFC Bank",
          score: 80,
          metric1: "+12% Profit",
          metric2: "+14% Rev",
          badge: "Strong",
          badgeColor: "green",
        },
      ],
      insights: {
        working: [
          "Portfolio growth significantly above market average",
          "IT and Financial sectors driving strong earnings momentum",
          "Diversified growth across multiple stocks",
        ],
        watching: [
          "Infosys showing growth slowdown - monitor client wins",
          "Tech Mahindra growth lagging peers significantly",
        ],
      },
    },
    stability: {
      name: "Stability",
      icon: "⚖️",
      score: 88,
      badge: "Strong",
      badgeColor: "bg-green-500",
      explanation: {
        title: "What is Stability?",
        definition:
          "Stability measures financial health through debt levels, balance sheet strength, and consistency of performance.",
        whyMatters:
          "Stable companies survive downturns better and face less bankruptcy risk. Low debt means flexibility to invest during opportunities.",
        simple:
          "It's like checking if someone has savings and low credit card debt - they can handle emergencies.",
      },
      portfolioMetrics: [
        {
          label: "Avg Debt/Equity",
          value: "0.42",
          vsMarket: "vs Market 0.65",
          status: "good",
        },
        {
          label: "Interest Coverage",
          value: "8.5x",
          vsMarket: "vs Market 5.2x",
          status: "good",
        },
        {
          label: "Current Ratio",
          value: "1.8",
          vsMarket: "vs Market 1.3",
          status: "good",
        },
        {
          label: "Cash/Debt",
          value: "62%",
          vsMarket: "vs Market 38%",
          status: "good",
        },
      ],
      stockRankings: [
        {
          rank: 1,
          stock: "TCS",
          score: 98,
          metric1: "Zero Debt",
          metric2: "₹45k Cr Cash",
          badge: "Excellent",
          badgeColor: "green",
        },
        {
          rank: 2,
          stock: "ITC",
          score: 95,
          metric1: "Zero Debt",
          metric2: "₹38k Cr Cash",
          badge: "Excellent",
          badgeColor: "green",
        },
        {
          rank: 3,
          stock: "Wipro",
          score: 92,
          metric1: "D/E 0.08",
          metric2: "Strong Cash",
          badge: "Excellent",
          badgeColor: "green",
        },
        {
          rank: 4,
          stock: "HDFC Bank",
          score: 88,
          metric1: "D/E 0.45",
          metric2: "Well Managed",
          badge: "Strong",
          badgeColor: "green",
        },
      ],
      insights: {
        working: [
          "Exceptional balance sheet health - 3 stocks are debt-free",
          "IT sector with fortress balance sheets",
          "All companies can easily service debt obligations",
        ],
        watching: [
          "Monitor Bajaj Finance leverage (NBFC business model)",
          "Reliance debt reduction progress post-capex cycle",
        ],
      },
    },
    efficiency: {
      name: "Efficiency",
      icon: "⚡",
      score: 82,
      badge: "Strong",
      badgeColor: "bg-green-500",
      explanation: {
        title: "What is Efficiency?",
        definition:
          "Efficiency measures how well companies convert earnings to cash and use assets to generate revenue.",
        whyMatters:
          "Efficient companies need less capital to grow, generate real cash (not just accounting profits), and have better quality earnings.",
        simple:
          "Like comparing two shops - one generates ₹100 sales with ₹20 of equipment, another needs ₹50 of equipment.",
      },
      portfolioMetrics: [
        {
          label: "Avg Asset Turnover",
          value: "1.42",
          vsMarket: "vs Market 1.15",
          status: "good",
        },
        {
          label: "Cash Conversion",
          value: "87%",
          vsMarket: "vs Market 72%",
          status: "good",
        },
        {
          label: "Working Capital Days",
          value: "42",
          vsMarket: "vs Market 58",
          status: "good",
        },
        {
          label: "Capital Efficiency",
          value: "High",
          vsMarket: "Above Average",
          status: "good",
        },
      ],
      stockRankings: [
        {
          rank: 1,
          stock: "TCS",
          score: 96,
          metric1: "95% Cash Conv",
          metric2: "Asset Light",
          badge: "Excellent",
          badgeColor: "green",
        },
        {
          rank: 2,
          stock: "ITC",
          score: 90,
          metric1: "Strong Margins",
          metric2: "Efficient Ops",
          badge: "Excellent",
          badgeColor: "green",
        },
        {
          rank: 3,
          stock: "HDFC Bank",
          score: 88,
          metric1: "High Turnover",
          metric2: "Asset Use",
          badge: "Strong",
          badgeColor: "green",
        },
        {
          rank: 4,
          stock: "Wipro",
          score: 85,
          metric1: "92% Cash Conv",
          metric2: "Good Ops",
          badge: "Strong",
          badgeColor: "green",
        },
      ],
      insights: {
        working: [
          "IT services with excellent cash generation (>90%)",
          "Asset-light business models in tech sector",
          "Strong working capital management",
        ],
        watching: [
          "Tech Mahindra utilization rates declining",
          "Ensure efficiency maintained during growth phase",
        ],
      },
    },
    valuation: {
      name: "Valuation",
      icon: "💎",
      score: 72,
      badge: "Moderate",
      badgeColor: "bg-yellow-500",
      explanation: {
        title: "What is Valuation?",
        definition:
          "Valuation measures if you're paying a fair price for stocks relative to their earnings, growth, and assets.",
        whyMatters:
          "Overpaying reduces future returns even for great companies. Buying at reasonable valuations improves margin of safety.",
        simple:
          "Like buying a house - fundamentals might be great, but if you overpay, you won't make good returns.",
      },
      portfolioMetrics: [
        {
          label: "Avg P/E Ratio",
          value: "26.4",
          vsMarket: "vs Market 21.5",
          status: "caution",
        },
        {
          label: "Avg P/B Ratio",
          value: "4.8",
          vsMarket: "vs Market 3.2",
          status: "caution",
        },
        {
          label: "PEG Ratio",
          value: "1.8",
          vsMarket: "vs Market 1.5",
          status: "caution",
        },
        {
          label: "Earnings Yield",
          value: "3.8%",
          vsMarket: "vs Market 4.7%",
          status: "caution",
        },
      ],
      stockRankings: [
        {
          rank: 1,
          stock: "ITC",
          score: 85,
          metric1: "P/E 18",
          metric2: "Fair Value",
          badge: "Good Value",
          badgeColor: "green",
        },
        {
          rank: 2,
          stock: "Wipro",
          score: 82,
          metric1: "P/E 20",
          metric2: "Reasonable",
          badge: "Fair",
          badgeColor: "blue",
        },
        {
          rank: 3,
          stock: "Reliance",
          score: 78,
          metric1: "P/E 22",
          metric2: "Sector Avg",
          badge: "Fair",
          badgeColor: "blue",
        },
        {
          rank: 4,
          stock: "HDFC Bank",
          score: 68,
          metric1: "P/E 22",
          metric2: "Premium",
          badge: "Expensive",
          badgeColor: "yellow",
        },
      ],
      insights: {
        working: [
          "ITC and Wipro at reasonable valuations",
          "Quality premium justified for some holdings",
          "No extreme overvaluations (P/E >40)",
        ],
        watching: [
          "Portfolio trading 23% above market average",
          "TCS and Bajaj Finance at stretched multiples",
          "Consider trimming expensive positions on rallies",
        ],
      },
    },
  };

  // Mock data for portfolio health analysis
  const overallHealth = {
    score: 74,
    trend: 3,
    trendDirection: "up" as const,
    rating: "Moderate",
    color: "yellow",
  };

  const subComponentScores = [
    {
      name: "Quality Score",
      score: 82,
      description: "Strong fundamentals in holdings",
      icon: Award,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      name: "Growth Score",
      score: 65,
      description: "Moderate earnings momentum",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      name: "Stability Score",
      score: 88,
      description: "Low debt-to-equity across the board",
      icon: Shield,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      name: "Valuation Score",
      score: 42,
      description: "🔴 Your portfolio is currently expensive",
      icon: DollarSign,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
    },
  ];

  const qualityMatrix = [
    { symbol: "AAPL", healthScore: 88, allocation: 18.5, status: "ideal" },
    { symbol: "MSFT", healthScore: 85, allocation: 15.2, status: "ideal" },
    { symbol: "HDFC", healthScore: 78, allocation: 12.8, status: "good" },
    { symbol: "GOOGL", healthScore: 82, allocation: 10.5, status: "ideal" },
    { symbol: "TSLA", healthScore: 32, allocation: 8.3, status: "danger" },
    { symbol: "RELIANCE", healthScore: 72, allocation: 6.2, status: "good" },
    { symbol: "TCS", healthScore: 80, allocation: 5.5, status: "good" },
    { symbol: "INFY", healthScore: 75, allocation: 4.8, status: "good" },
  ];

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: AGGREGATE HEALTH DNA
          "Let's look at the DNA of your combined holdings."
      ═══════════════════════════════════════════════════════════════ */}
      <div id="aggregate-health-dna" className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Let's look at the DNA of your combined holdings.
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🧬 Portfolio Health Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Central Health Score */}
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm lg:col-span-1">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <svg className="w-40 h-40" viewBox="0 0 160 160">
                    {/* Background circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="12"
                    />
                    {/* Health score circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      stroke={
                        overallHealth.color === "yellow" ? "#eab308" : "#10b981"
                      }
                      strokeWidth="12"
                      strokeDasharray={`${overallHealth.score * 4.08} 408`}
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-bold">
                      {overallHealth.score}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      out of 100
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className={`
                      ${
                        overallHealth.color === "yellow"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/20"
                          : "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/20"
                      }
                    `}
                  >
                    🟡 {overallHealth.rating}
                  </Badge>

                  <div className="flex items-center justify-center gap-2 text-sm">
                    {overallHealth.trendDirection === "up" ? (
                      <ChevronUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-red-500" />
                    )}
                    <span
                      className={
                        overallHealth.trendDirection === "up"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {overallHealth.trend} points from last month
                    </span>
                  </div>
                </div>

                <div className="pt-4 text-left border-t border-border/30">
                  <h4 className="text-sm font-semibold mb-2">
                    Overall Portfolio Health
                  </h4>
                  <p className="border p-2 rounded-sm border-blue-500/80 bg-blue-500/30  text-xs text-blue-200">
                    Your portfolio shows moderate health with room for
                    improvement in valuation metrics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sub-Component Scores */}
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm lg:col-span-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subComponentScores.map((component, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border border-border/30 ${component.bgColor}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${component.bgColor}`}>
                          <component.icon
                            className={`w-5 h-5 ${component.color}`}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">
                            {component.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {component.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-2xl font-bold ${component.color}`}
                        >
                          {component.score}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /100
                        </span>
                      </div>
                      <Progress value={component.score} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: HEALTH TRENDS
          "Let's see how your portfolio health has evolved over time"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="health-trends" className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Let's see how your portfolio health has evolved over time
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            📈 Health Score Trends
          </h3>
        </div>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            {/* Period Selector */}
            <div className="flex items-center justify-end mb-6">
              <div className="flex gap-2">
                {["3M", "6M", "1Y", "3Y", "ALL"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      period === selectedPeriod
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Container */}
            <div className="relative">
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getChartData()}
                    margin={{ top: 20, right: 60, bottom: 20, left: 20 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorScore"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>

                    {/* Background zones */}
                    <ReferenceArea
                      y1={80}
                      y2={100}
                      fill="#10b981"
                      fillOpacity={0.1}
                    />
                    <ReferenceArea
                      y1={50}
                      y2={80}
                      fill="#eab308"
                      fillOpacity={0.1}
                    />
                    <ReferenceArea
                      y1={0}
                      y2={50}
                      fill="#ef4444"
                      fillOpacity={0.1}
                    />

                    {/* Zone boundary lines */}
                    <ReferenceLine
                      y={80}
                      stroke="#10b981"
                      strokeOpacity={0.3}
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={50}
                      stroke="#eab308"
                      strokeOpacity={0.3}
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#ef4444"
                      strokeOpacity={0.3}
                      strokeDasharray="3 3"
                    />

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      opacity={0.3}
                    />

                    <XAxis
                      dataKey="month"
                      stroke="var(--primary)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      domain={[0, 100]}
                      stroke="var(--primary)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />

                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => `Date: ${value}`}
                          formatter={(value) => [`${value}`, " Health Score"]}
                        />
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="url(#colorScore)"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", r: 5, strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: "#3b82f6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Zone labels on right */}
              <div className="absolute -right-7 top-0 bottom-0 w-20 flex flex-col justify-around text-xs py-6 pointer-events-none">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Strong
                </span>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                  Moderate
                </span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Weak
                </span>
              </div>
            </div>

            {/* Trend Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {/* Card 1: Overall Trend */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 pb-0 overflow-hidden">
                <CardContent className="pt-4 pb-0 flex grow flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Overall Trend</h4>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500 text-white text-xs">
                        ↗ Improving
                      </Badge>
                    </div>

                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Started at:
                        </span>
                        <Badge variant={"success"} className="font-semibold">
                          78
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Now at:</span>
                        <Badge variant={"success"} className="font-semibold">
                          82
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Change:</span>
                        <span className="font-semibold text-green-600">
                          +4 points
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate:</span>
                        <span className="font-semibold">+4 pts / 90 days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-0 mt-2 min-h-20">
                  <div className="px-6 py-3 bg-green-100/50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800 w-full h-full">
                    <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                      Your portfolio health is steadily improving as you've
                      added stronger companies.
                    </p>
                  </div>
                </CardFooter>
              </Card>

              {/* Card 2: Biggest Improvers */}
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 pb-0 overflow-hidden">
                <CardContent className="pt-4 pb-0 flex grow flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Biggest Improvers</h4>
                    <ArrowUpIcon className="w-5 h-5 text-blue-600" />
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">HDFC Bank</span>
                      <div className="flex items-center gap-1 text-green-600">
                        <span className="text-xs">75 → 85</span>
                        <Badge
                          variant={"success"}
                          className="text-xs min-w-10 ml-2"
                        >
                          +10
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">TCS</span>
                      <div className="flex items-center gap-1 text-green-600">
                        <span className="text-xs">78 → 88</span>
                        <Badge
                          variant={"success"}
                          className="text-xs min-w-10 ml-2"
                        >
                          +10
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Reliance</span>
                      <div className="flex items-center gap-1 text-green-600">
                        <span className="text-xs">70 → 79</span>
                        <Badge
                          variant={"success"}
                          className="text-xs min-w-10 ml-2"
                        >
                          +9
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-0 mt-2 min-h-20">
                  <div className="px-6 py-3 bg-blue-100/50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 w-full h-full">
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                      Better fundamentals reported in recent quarters
                    </p>
                  </div>
                </CardFooter>
              </Card>

              {/* Card 3: Stocks to Watch */}
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800 pb-0 overflow-hidden">
                <CardContent className="pt-4 pb-0 flex grow flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Stocks to Watch</h4>
                    <ArrowDownIcon className="w-5 h-5 text-orange-600" />
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Tech Mahindra</span>
                      <div className="flex items-center gap-1 text-red-600">
                        <span className="text-xs">75 → 68</span>
                        <Badge
                          variant={"destructive"}
                          className="text-xs min-w-10 ml-2"
                        >
                          -7
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Asian Paints</span>
                      <div className="flex items-center gap-1 text-red-600">
                        <span className="text-xs">82 → 78</span>
                        <Badge
                          variant={"destructive"}
                          className="text-xs min-w-10 ml-2"
                        >
                          -4
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-0 mt-2 min-h-20">
                  <div className="px-6 py-3 bg-orange-100/50 dark:bg-orange-900/20 border-t border-orange-200 dark:border-orange-800 w-full h-full">
                    <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed mb-1.5">
                      Margin pressure, competitive intensity
                    </p>
                    <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">
                      Action: Monitor quarterly results closely
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: THE QUALITY SPECTRUM
          "Let's see where your stocks sit on the Quality vs. Risk scale."
      ═══════════════════════════════════════════════════════════════ */}
      <div id="quality-spectrum" className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Let's see where your stocks sit on the Quality vs. Risk scale.
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            📊 Quality Mapping
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            The "InvestIQ Matrix"
          </p>
        </div>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Scatter Plot Simulation */}
              <div className="relative h-80 bg-gradient-to-tr from-red-50 via-yellow-50 to-green-50 dark:from-red-950/10 dark:via-yellow-950/10 dark:to-green-950/10 rounded-lg p-6 border border-border/30">
                {/* Axes Labels */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground">
                  Health Score (0-100) →
                </div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground">
                  ← Portfolio Allocation (%)
                </div>

                {/* Zone Labels */}
                <div className="absolute top-4 right-4 text-xs font-semibold text-green-600">
                  ✓ Ideal Zone
                </div>
                <div className="absolute top-4 left-4 text-xs font-semibold text-red-600">
                  ⚠ Danger Zone
                </div>

                {/* Plot Points */}
                <div className="relative w-full h-full">
                  {qualityMatrix.map((stock, idx) => (
                    <div
                      key={idx}
                      className="absolute group cursor-pointer"
                      style={{
                        left: `${stock.healthScore}%`,
                        bottom: `${stock.allocation * 4}%`,
                        transform: "translate(-50%, 50%)",
                      }}
                    >
                      <div
                        className={`
                          w-3 h-3 rounded-full transition-all group-hover:scale-150
                          ${
                            stock.status === "ideal"
                              ? "bg-green-500"
                              : stock.status === "good"
                                ? "bg-blue-500"
                                : "bg-red-500"
                          }
                        `}
                      />
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg z-10">
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-muted-foreground">
                          Health: {stock.healthScore}
                        </div>
                        <div className="text-muted-foreground">
                          Allocation: {stock.allocation}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-border/20" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/20" />
                </div>
              </div>

              {/* AI Interpretation */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      AI Interpretation
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You have <span className="font-semibold">8.3%</span> of
                      your capital in{" "}
                      <span className="font-semibold">TSLA</span>, which has a
                      Health Score of only{" "}
                      <span className="font-semibold">32</span>. This is your
                      highest-risk position. Consider if the conviction matches
                      the quality.
                    </p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Ideal Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Good Position</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Danger Zone</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: HEALTH DISTRIBUTION
          "Here's how your portfolio is distributed by health quality"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="health-distribution" className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Here's how your portfolio is distributed by health quality
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            🎯 Health Distribution Analysis
          </h3>
        </div>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* LEFT SIDE: Dual Visualization (60%) */}
              <div className="lg:col-span-3 space-y-6 flex flex-col justify-between">
                {/* VIZ 1: Health Segments (Donut Chart) */}
                <div>
                  <h4 className="font-semibold text-sm mb-4">
                    Portfolio Value by Health Category
                  </h4>
                  <div className="flex items-center gap-8">
                    {/* Donut Chart */}
                    <div className="relative w-48 h-48">
                      <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full -rotate-90"
                      >
                        {/* Strong segment (70%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="hsl(142, 76%, 36%)"
                          strokeWidth="20"
                          strokeDasharray="175.84 251.2"
                          className="transition-all hover:opacity-80 cursor-pointer"
                        />
                        {/* Moderate segment (20%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="hsl(45, 93%, 47%)"
                          strokeWidth="20"
                          strokeDasharray="50.24 251.2"
                          strokeDashoffset="-175.84"
                          className="transition-all hover:opacity-80 cursor-pointer"
                        />
                        {/* Weak segment (10%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="hsl(0, 84%, 60%)"
                          strokeWidth="20"
                          strokeDasharray="25.12 251.2"
                          strokeDashoffset="-226.08"
                          className="transition-all hover:opacity-80 cursor-pointer"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold">76</div>
                          <div className="text-xs text-muted-foreground">
                            Health
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                          <div>
                            <div className="font-semibold text-sm">
                              Strong (80-100)
                            </div>
                            <div className="text-xs text-muted-foreground">
                              10 stocks
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            ₹8,72,300
                          </div>
                          <div className="text-xs text-muted-foreground">
                            70%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                          <div>
                            <div className="font-semibold text-sm">
                              Moderate (60-79)
                            </div>
                            <div className="text-xs text-muted-foreground">
                              3 stocks
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-600">
                            ₹2,49,160
                          </div>
                          <div className="text-xs text-muted-foreground">
                            20%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-red-600"></div>
                          <div>
                            <div className="font-semibold text-sm">
                              Weak (0-59)
                            </div>
                            <div className="text-xs text-muted-foreground">
                              2 stocks
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">
                            ₹1,24,540
                          </div>
                          <div className="text-xs text-muted-foreground">
                            10%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VIZ 2: Stock Count by Health */}
                <div>
                  <h4 className="font-semibold text-sm mb-4">
                    Number of Stocks by Health Category
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          Strong (80-100)
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          10 stocks
                        </span>
                      </div>
                      <div className="h-8 bg-green-500/20 rounded-lg relative overflow-hidden">
                        <div
                          className="absolute inset-0 bg-green-500"
                          style={{ width: "66.7%" }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-green-900 dark:text-green-100">
                            10 stocks
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          Moderate (60-79)
                        </span>
                        <span className="text-sm font-bold text-yellow-600">
                          3 stocks
                        </span>
                      </div>
                      <div className="h-8 bg-yellow-500/20 rounded-lg relative overflow-hidden">
                        <div
                          className="absolute inset-0 bg-yellow-500"
                          style={{ width: "20%" }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">
                            3 stocks
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Weak (0-59)</span>
                        <span className="text-sm font-bold text-red-600">
                          2 stocks
                        </span>
                      </div>
                      <div className="h-8 bg-red-500/20 rounded-lg relative overflow-hidden">
                        <div
                          className="absolute inset-0 bg-red-500"
                          style={{ width: "13.3%" }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-red-900 dark:text-red-100">
                            2 stocks
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendation Box - Moved from Right Side */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-2 mb-3">
                      <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-300">
                        Recommendation
                      </h4>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed mb-4">
                      Consider: If any moderate stock drops to 'Weak' category,
                      review whether to continue holding or redeploy capital to
                      stronger opportunities.
                    </p>
                  </CardContent>

                  <CardFooter className="w-full">
                    <div className="flex gap-2 w-full">
                      <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors">
                        View Watchlist
                      </button>
                      <button className="flex-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-md transition-colors">
                        Set Health Alerts
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* RIGHT SIDE: Insights & Recommendations (40%) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Insight Box 1 */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <h4 className="font-semibold text-sm text-green-800 dark:text-green-300">
                        What This Means
                      </h4>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">
                      Good health distribution. 70% of your capital is in
                      fundamentally strong companies, though 10% in weak stocks
                      requires attention.
                    </p>
                  </CardContent>
                </Card>

                {/* Insight Box 2 - Moderate */}
                <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <h4 className="font-semibold text-sm text-yellow-800 dark:text-yellow-300">
                        The 20% in Moderate
                      </h4>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-3">
                      3 stocks need monitoring:
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">1. Tech Mahindra</span>
                        <span className="text-muted-foreground">₹98,400</span>
                      </div>
                      <p className="text-yellow-600 dark:text-yellow-500 text-xs pl-3">
                        Margin pressure
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="font-medium">2. Asian Paints</span>
                        <span className="text-muted-foreground">₹87,260</span>
                      </div>
                      <p className="text-yellow-600 dark:text-yellow-500 text-xs pl-3">
                        Competitive intensity
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="font-medium">3. Wipro</span>
                        <span className="text-muted-foreground">₹63,500</span>
                      </div>
                      <p className="text-yellow-600 dark:text-yellow-500 text-xs pl-3">
                        Growth concerns
                      </p>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                      Not urgent, but watch quarterly performance.
                    </p>
                  </CardContent>
                </Card>

                {/* Insight Box 3 - Weak Section */}
                <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <h4 className="font-semibold text-sm text-red-800 dark:text-red-300">
                        The 10% in Weak ⚠️
                      </h4>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-400 mb-3">
                      2 stocks require immediate attention:
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">1. Vodafone Idea</span>
                        <span className="text-muted-foreground">₹74,220</span>
                      </div>
                      <p className="text-red-600 dark:text-red-500 text-xs pl-3">
                        Debt stress, declining revenue
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="font-medium">2. YES Bank</span>
                        <span className="text-muted-foreground">₹50,320</span>
                      </div>
                      <p className="text-red-600 dark:text-red-500 text-xs pl-3">
                        Asset quality concerns, restructuring
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-red-800 dark:text-red-300 mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      ⚡ Urgent: Consider exit strategy or wait for turnaround
                      signals.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: SECTOR HEALTH COMPARISON
          "How does health vary across your sector investments?"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="sector-health-comparison" className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            How does health vary across your sector investments?
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            🏭 Health by Sector
          </h3>
        </div>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            {/* Sector Analysis Cards */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">
                Detailed Sector Analysis
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Banking Sector Card */}
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold">BANKING SECTOR</h5>
                          <p className="text-xs text-muted-foreground">
                            35% of portfolio
                          </p>
                        </div>
                        <Badge className="bg-green-500 text-white">
                          84/100 🟢
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs ">
                        <div>
                          <p className="text-muted-foreground">Holdings</p>
                          <p className="font-semibold">3 stocks</p>
                        </div>
                        <div className="flex flex-col justify-end items-end">
                          <p className="text-muted-foreground">Trend</p>
                          <p className="font-semibold text-green-600">
                            ↗ +3 pts
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Strongest:
                          </span>
                          <span className="font-medium">HDFC Bank (85)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Weakest:
                          </span>
                          <span className="font-medium">ICICI Bank (82)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                          Strong fundamentals across all banking holdings.
                          Sector benefiting from credit growth and margin
                          expansion.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* IT Services Sector Card */}
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold">IT SERVICES</h5>
                          <p className="text-xs text-muted-foreground">
                            25% of portfolio
                          </p>
                        </div>
                        <Badge className="bg-green-500 text-white">
                          82/100 🟢
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Holdings</p>
                          <p className="font-semibold">4 stocks</p>
                        </div>
                        <div className="flex flex-col justify-end items-end">
                          <p className="text-muted-foreground">Trend</p>
                          <p className="font-semibold text-green-600">
                            ↗ +2 pts
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Strongest:
                          </span>
                          <span className="font-medium">TCS (88)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Weakest:
                          </span>
                          <span className="font-medium">Wipro (75)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                          Robust sector with strong cash generation. Digital
                          transformation driving sustained demand.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Automobile Sector Card */}
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold">AUTOMOBILE</h5>
                          <p className="text-xs text-muted-foreground">
                            15% of portfolio
                          </p>
                        </div>
                        <Badge className="bg-green-500 text-white">
                          78/100 🟢
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Holdings</p>
                          <p className="font-semibold">2 stocks</p>
                        </div>
                        <div className="flex flex-col justify-end items-end">
                          <p className="text-muted-foreground">Trend</p>
                          <p className="font-semibold text-blue-600">→ 0 pts</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Strongest:
                          </span>
                          <span className="font-medium">Maruti (80)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Weakest:
                          </span>
                          <span className="font-medium">Tata Motors (76)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                          Stable fundamentals. EV transition creating
                          opportunities but also competitive pressure.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pharma Sector Card */}
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold">PHARMA</h5>
                          <p className="text-xs text-muted-foreground">
                            12% of portfolio
                          </p>
                        </div>
                        <Badge className="bg-green-500 text-white">
                          75/100 🟢
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Holdings</p>
                          <p className="font-semibold">2 stocks</p>
                        </div>
                        <div className="flex flex-col justify-end items-end">
                          <p className="text-muted-foreground">Trend</p>
                          <p className="font-semibold text-green-600">
                            ↗ +1 pt
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Strongest:
                          </span>
                          <span className="font-medium">Sun Pharma (78)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Weakest:
                          </span>
                          <span className="font-medium">Dr. Reddy's (72)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                          Defensive sector with steady growth. US generics
                          business showing signs of recovery.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FMCG Sector Card */}
                <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold">FMCG</h5>
                          <p className="text-xs text-muted-foreground">
                            8% of portfolio
                          </p>
                        </div>
                        <Badge className="bg-yellow-500 text-white">
                          73/100 🟡
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Holdings</p>
                          <p className="font-semibold">2 stocks</p>
                        </div>
                        <div className="flex flex-col justify-end items-end">
                          <p className="text-muted-foreground">Trend</p>
                          <p className="font-semibold text-red-600">↘ -2 pts</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Strongest:
                          </span>
                          <span className="font-medium">ITC (76)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Weakest:
                          </span>
                          <span className="font-medium">HUL (70)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
                          Volume growth pressure from rural slowdown. Premium
                          pricing power under test.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Energy Sector Card */}
                <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold">ENERGY</h5>
                          <p className="text-xs text-muted-foreground">
                            5% of portfolio
                          </p>
                        </div>
                        <Badge className="bg-yellow-500 text-white">
                          71/100 🟡
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Holdings</p>
                          <p className="font-semibold">2 stocks</p>
                        </div>
                        <div className="flex flex-col justify-end items-end">
                          <p className="text-muted-foreground">Trend</p>
                          <p className="font-semibold text-red-600">↘ -1 pt</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Strongest:
                          </span>
                          <span className="font-medium">Reliance (74)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Weakest:
                          </span>
                          <span className="font-medium">ONGC (68)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
                          Cyclical exposure with commodity price volatility.
                          Energy transition creating uncertainty.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          NEW SECTION: PORTFOLIO HEALTH STOCKS ANALYSIS TABLE
          "Let's examine the health metrics of each stock in your portfolio"
      ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Let's examine the health metrics of each stock in your portfolio
          </p>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              🏥 Portfolio Stock Health Analysis
            </h3>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center justify-center rounded-full w-5 h-5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                    <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-md p-4 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border-slate-700 dark:border-slate-600 shadow-2xl backdrop-blur-xl"
                >
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-blue-400">
                      Why This Matters
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-200 dark:text-slate-300">
                      Each stock in your portfolio contributes to your overall
                      wealth—but not all equally. This comprehensive health
                      scorecard reveals which holdings are your portfolio's
                      champions and which might need attention. Think of it as a
                      medical checkup for every investment, examining 9 critical
                      vital signs from profitability to market sentiment.
                    </p>
                    <p className="text-xs leading-relaxed text-slate-200 dark:text-slate-300">
                      <span className="font-semibold text-blue-300">
                        Pro Tip:
                      </span>{" "}
                      Stocks with overall scores above 80 are investment-grade
                      quality. Below 60? Time to ask tough questions about
                      whether they deserve a place in your portfolio.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive health scorecard for all your holdings
          </p>
        </div>

        {/* Table */}
        <div className="border border-border/30 rounded-sm bg-background/50 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {/* Main Category Headers */}
                <TableRow className="border-b border-border/30 bg-muted/30 hover:bg-muted/30">
                  <TableHead
                    rowSpan={2}
                    className="text-left p-3 font-semibold text-xs sm:text-sm border-r border-border/20 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("ticker")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Stock
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    rowSpan={2}
                    className="text-center p-3 font-semibold text-xs sm:text-sm border-r border-border/20 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("score")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="w-4 h-4" />
                      Score
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                </TableRow>
                <TableRow className="border-b border-border/30 bg-muted/20 hover:bg-muted/20">
                  <TableHead
                    className="text-center p-2 text-xs font-medium text-muted-foreground border-r border-border/20 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("profitability")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Profit
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center p-2 text-xs font-medium text-muted-foreground border-r border-border/20 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("growth")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Growth
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center p-2 text-xs font-medium text-muted-foreground border-r border-border/20 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("stability")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Stability
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center p-2 text-xs font-medium text-muted-foreground border-r border-border/20 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("efficiency")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Efficiency
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center p-2 text-xs font-medium text-muted-foreground border-r border-border/20 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("valuation")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Valuation
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center p-2 text-xs font-medium text-muted-foreground border-r border-border/20 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("momentum")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Momentum
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center p-2 text-xs font-medium text-muted-foreground border-r border-border/20 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("trend")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Trend
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center p-2 text-xs font-medium text-muted-foreground border-r border-border/20 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("activity")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Activity
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center p-2 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("sentiment")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Sentiment
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStocks.map((stock, index) => (
                  <TableRow
                    key={stock.ticker}
                    className="border-b border-border/30 hover:bg-muted/20 transition-all duration-200"
                  >
                    <TableCell className="px-2 border-r border-border/20">
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs sm:text-sm">
                          {stock.ticker}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-center border-r border-border/20">
                      <div
                        className={`${getScoreBgColor(
                          stock.score,
                        )} h-full w-full flex items-center justify-center py-2 text-sm font-medium`}
                      >
                        {stock.score}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-center border-r border-border/20">
                      <div
                        className={`${getMetricClass(
                          stock.profitability,
                        )} h-full w-full flex items-center justify-center py-2 text-sm font-medium`}
                      >
                        {stock.profitability}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-center border-r border-border/20">
                      <div
                        className={`${getMetricClass(
                          stock.growth,
                        )} h-full w-full flex items-center justify-center py-2 text-sm font-medium`}
                      >
                        {stock.growth}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-center border-r border-border/20">
                      <div
                        className={`${getMetricClass(
                          stock.stability,
                        )} h-full w-full flex items-center justify-center py-2 text-sm font-medium`}
                      >
                        {stock.stability}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-center border-r border-border/20">
                      <div
                        className={`${getMetricClass(
                          stock.efficiency,
                        )} h-full w-full flex items-center justify-center py-2 text-sm font-medium`}
                      >
                        {stock.efficiency}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-center border-r border-border/20">
                      <div
                        className={`${getMetricClass(
                          stock.valuation,
                        )} h-full w-full flex items-center justify-center py-2 text-sm font-medium`}
                      >
                        {stock.valuation}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-center border-r border-border/20">
                      <div
                        className={`${getMetricClass(
                          stock.momentum,
                        )} h-full w-full flex items-center justify-center py-2 text-sm font-medium`}
                      >
                        {stock.momentum}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-center border-r border-border/20">
                      <div
                        className={`${getMetricClass(
                          stock.trend,
                        )} h-full w-full flex items-center justify-center py-2 text-sm font-medium`}
                      >
                        {stock.trend}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-center border-r border-border/20">
                      <div
                        className={`${getMetricClass(
                          stock.activity,
                        )} h-full w-full flex items-center justify-center py-2 text-sm font-medium`}
                      >
                        {stock.activity}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-center">
                      <div
                        className={`${getMetricClass(
                          stock.sentiment,
                        )} h-full w-full flex items-center justify-center py-2 text-sm font-medium`}
                      >
                        {stock.sentiment}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Empty State */}
          {filteredAndSortedStocks.length === 0 && (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted/20 rounded-full">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    No stocks found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredAndSortedStocks.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredAndSortedStocks.length)} of{" "}
              {filteredAndSortedStocks.length} stocks
            </div>
            <div className="flex items-center gap-1">
              {/* First Page */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-3 w-3" />
              </Button>

              {/* Previous Page */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>

              {/* Page Display */}
              <div className="flex items-center gap-1 mx-4">
                <span className="text-sm font-medium text-foreground">
                  {currentPage}
                </span>
                <span className="text-sm text-muted-foreground">/</span>
                <span className="text-sm font-medium text-foreground">
                  {totalPages}
                </span>
              </div>

              {/* Next Page */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>

              {/* Last Page */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 7: INTERACTIVE HEALTH DEEP-DIVE
          "Want to understand a specific area in depth? Pick what interests you:"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="health-deep-dive" className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Let's break down what makes your portfolio fundamentally strong (or
            weak)
          </p>
          <h2 className="text-2xl font-bold">🔍 Portfolio Health Deep-Dive</h2>
        </div>

        {/* Custom Tab Navigation */}
        <div className="relative">
          <div className="flex items-center gap-6 border-b border-border/30 overflow-x-auto">
            {Object.entries(deepDiveData).map(([key, data]: [string, any]) => (
              <button
                key={key}
                onClick={() => setActiveDeepDive(key)}
                className={`
                  relative pb-4 px-2 text-sm font-medium transition-all duration-300 ease-in-out
                  flex items-center gap-2 hover:text-foreground whitespace-nowrap flex-shrink-0
                  ${
                    activeDeepDive === key
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-muted-foreground/80"
                  }
                `}
              >
                <span>{data.name}</span>

                {/* Animated bottom border */}
                <div
                  className={`
                    absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-in-out
                    ${
                      activeDeepDive === key
                        ? "w-full opacity-100"
                        : "w-0 opacity-0"
                    }
                  `}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content wrapped in Card */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            {Object.entries(deepDiveData).map(([key, data]: [string, any]) => (
              <div
                key={key}
                className={activeDeepDive === key ? "space-y-6" : "hidden"}
              >
                {/* Category Card */}
                <Card
                  className={`border-l-4 p-0 ${
                    data.score >= 80
                      ? "border-l-green-500"
                      : data.score >= 60
                        ? "border-l-blue-500"
                        : data.score >= 40
                          ? "border-l-yellow-500"
                          : "border-l-red-500"
                  }`}
                >
                  <CardContent
                    className={`py-6 ${
                      data.score >= 80
                        ? "bg-green-500/5"
                        : data.score >= 60
                          ? "bg-blue-500/5"
                          : data.score >= 40
                            ? "bg-yellow-500/5"
                            : "bg-red-500/5"
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                      {/* Left Column (70%) */}
                      <div className="lg:col-span-7 space-y-4">
                        {/* What We Measure */}
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold">
                            What is {data.name}?
                          </span>
                          <p className="mt-2">{data.explanation.definition}</p>
                        </div>

                        {/* Metrics Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-semibold text-sm">
                                  Metric
                                </th>
                                <th className="text-right py-2 font-semibold text-sm">
                                  Portfolio Avg
                                </th>
                                <th className="text-right py-2 font-semibold text-sm">
                                  Market Avg
                                </th>
                                <th className="text-right py-2 font-semibold text-sm">
                                  Difference
                                </th>
                                <th className="text-right py-2 font-semibold text-sm">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.portfolioMetrics.map(
                                (metric: any, idx: number) => (
                                  <tr key={idx} className="border-b">
                                    <td className="py-3 text-sm">
                                      {metric.label}
                                    </td>
                                    <td className="text-right font-mono font-bold">
                                      {metric.value}
                                    </td>
                                    <td className="text-right font-mono text-muted-foreground">
                                      {metric.vsMarket.replace(
                                        "vs Market ",
                                        "",
                                      )}
                                    </td>
                                    <td
                                      className={`text-right font-mono ${
                                        metric.status === "good"
                                          ? "text-green-500"
                                          : "text-yellow-500"
                                      }`}
                                    >
                                      {metric.status === "good" ? "🟢" : "🟡"}{" "}
                                      {(
                                        parseFloat(metric.value) -
                                        parseFloat(
                                          metric.vsMarket
                                            .replace("vs Market ", "")
                                            .replace("%", ""),
                                        )
                                      ).toFixed(1)}
                                      %
                                    </td>
                                    <td className="text-right">
                                      {metric.status === "good" ? (
                                        <span className="text-green-500">
                                          ↗ Above
                                        </span>
                                      ) : (
                                        <span className="text-yellow-500">
                                          → Average
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* AI Interpretation */}
                        <div className="p-4 bg-muted/50 rounded-lg border italic">
                          <p className="text-sm mb-2">
                            <span className="font-semibold not-italic">
                              AI Interpretation:
                            </span>
                          </p>
                          <p className="text-sm leading-relaxed">
                            {data.explanation.whyMatters}
                          </p>
                        </div>

                        {/* Why It Matters */}
                        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                          <p className="text-sm">
                            <span className="font-semibold">
                              Why It Matters:
                            </span>{" "}
                            {data.explanation.simple}
                          </p>
                        </div>
                      </div>

                      {/* Right Column (30%) */}
                      <div className="lg:col-span-3 space-y-4 flex flex-col justify-center">
                        {/* Circular Progress */}
                        <div className="flex flex-col items-center">
                          <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="none"
                                className="text-muted/20"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 56}`}
                                strokeDashoffset={`${
                                  2 * Math.PI * 56 * (1 - data.score / 100)
                                }`}
                                className={
                                  data.score >= 80
                                    ? "text-green-500"
                                    : data.score >= 60
                                      ? "text-blue-500"
                                      : data.score >= 40
                                        ? "text-yellow-500"
                                        : "text-red-500"
                                }
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-3xl font-bold">
                                {data.score}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                /100
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={`${data.badgeColor} text-white mt-3`}
                          >
                            {data.badge}
                          </Badge>
                        </div>

                        {/* Quick Stats */}
                        <div
                          className={`p-3 rounded-lg border space-y-2 ${
                            data.score >= 80
                              ? "bg-green-500/10 border-green-500/20"
                              : data.score >= 60
                                ? "bg-blue-500/10 border-blue-500/20"
                                : "bg-yellow-500/10 border-yellow-500/20"
                          }`}
                        >
                          <p className="text-xs font-semibold">
                            Portfolio Position
                          </p>
                          <div className="space-y-1 text-xs">
                            <p>
                              <span className="font-semibold">Category:</span>{" "}
                              {data.name}
                            </p>
                            <p>
                              <span className="font-semibold">Score:</span>{" "}
                              {data.score}/100
                            </p>
                            <p>
                              <span className="font-semibold">Ranking:</span>{" "}
                              {data.badge}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthTab;
