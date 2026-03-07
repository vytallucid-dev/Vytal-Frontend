"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Award,
  PieChart,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Flag,
  Zap,
  ArrowUpDown,
  Sparkles,
  AlertTriangle,
  Crown,
  Medal,
  Table2,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip as ActualTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";

type TimePeriod = "1M" | "3M" | "6M" | "YTD" | "1Y" | "3Y" | "ALL";
type ChartType = "value" | "cumulative" | "period";
type SortField = "period" | "yourReturn" | "nifty" | "outperformance";
type SectorSortField = "sector" | "allocation" | "avgReturn" | "vsIndex";

interface PeriodReturn {
  period: string;
  yourReturn: number;
  invested: number;
  nifty: number;
  outperformance: number;
  bestStock: string;
  bestStockReturn: number;
  worstStock: string;
  worstStockReturn: number;
}

interface StockPerformance {
  id: number;
  symbol: string;
  name: string;
  return: number;
  gainAmount: number;
  contribution: number;
  holdingPeriod: string;
  sectorOutperformance: number;
  healthScore: number;
  status: string;
  insight?: string;
}

interface SectorPerformance {
  sector: string;
  allocationPercent: number;
  allocationAmount: number;
  avgReturn: number;
  bestStock: string;
  bestStockReturn: number;
  worstStock: string;
  worstStockReturn: number;
  vsIndex: number;
  contributionToReturns: number;
}

interface RiskMetric {
  label: string;
  value: string;
  benchmark?: string;
  interpretation: string;
  rating: "excellent" | "good" | "fair" | "poor";
  explanation: string;
}

interface StockRiskReturn {
  symbol: string;
  risk: number;
  return: number;
  allocation: number;
}

interface AttributionFactor {
  factor: string;
  contribution: number;
  percentOfTotal: number;
  explanation: string;
}

interface BenchmarkComparison {
  period: string;
  yourReturn: number;
  nifty50: number;
  sensex: number;
  bankNifty: number;
  equalWeighted: number;
  gold: number;
}

interface DividendMonth {
  month: string;
  amount: number;
  stocks: string[];
  isUpcoming?: boolean;
}

interface DividendByStock {
  stock: string;
  amount: number;
  percentage: number;
}

interface HealthPerformanceStock {
  symbol: string;
  healthScore: number;
  returns: number;
  category: "star" | "hold" | "lucky" | "concern";
}

interface HealthTrend {
  stock: string;
  currentHealth: number;
  healthChange: number;
  outlook: string;
}

interface ClosedPosition {
  stock: string;
  buyDate: string;
  sellDate: string;
  holdPeriod: string;
  buyPrice: number;
  sellPrice: number;
  return: number;
  reason: string;
  priceAfter3Months?: number;
  timingQuality: "excellent" | "good" | "fair" | "poor";
}

interface BuyTimingStock {
  stock: string;
  boughtAt: number;
  periodLow: number;
  efficiency: number;
  status: "good" | "fair" | "poor";
}

interface MarketScenario {
  scenario: string;
  marketReturn: string;
  portfolioReturn: string;
  notes: string;
}

interface DividendProjection {
  label: string;
  amount: number;
}

const AnalyticsTab = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("YTD");
  const [chartType, setChartType] = useState<ChartType>("value");
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showInvested, setShowInvested] = useState(true);
  const [sortField, setSortField] = useState<SortField>("period");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sectorSortField, setSectorSortField] =
    useState<SectorSortField>("allocation");
  const [sectorSortOrder, setSectorSortOrder] = useState<"asc" | "desc">(
    "desc",
  );
  const [transactionSortBy, setTransactionSortBy] = useState<"return" | "date">(
    "return",
  );
  const [showReturnsTable, setShowReturnsTable] = useState(true);
  const [showSectorTable, setShowSectorTable] = useState(true);

  // Mock performance data based on selected period
  const getPerformanceData = (period: TimePeriod) => {
    const data = {
      "1M": {
        totalReturn: 15420,
        percentReturn: 3.85,
        investedAmount: 400000,
        currentValue: 415420,
        realized: 5200,
        unrealized: 10220,
        capitalGains: 14500,
        dividends: 920,
        niftyReturn: 2.1,
        positiveMonths: 1,
        totalMonths: 1,
        maxGain: 3.85,
        maxLoss: 0,
      },
      "3M": {
        totalReturn: 42800,
        percentReturn: 11.2,
        investedAmount: 382000,
        currentValue: 424800,
        realized: 12400,
        unrealized: 30400,
        capitalGains: 40100,
        dividends: 2700,
        niftyReturn: 5.8,
        positiveMonths: 2,
        totalMonths: 3,
        maxGain: 5.4,
        maxLoss: -2.1,
      },
      "6M": {
        totalReturn: 89600,
        percentReturn: 18.5,
        investedAmount: 484000,
        currentValue: 573600,
        realized: 28200,
        unrealized: 61400,
        capitalGains: 84300,
        dividends: 5300,
        niftyReturn: 9.2,
        positiveMonths: 5,
        totalMonths: 6,
        maxGain: 6.8,
        maxLoss: -2.8,
      },
      YTD: {
        totalReturn: 245800,
        percentReturn: 24.58,
        investedAmount: 1000000,
        currentValue: 1245800,
        realized: 45200,
        unrealized: 200600,
        capitalGains: 233400,
        dividends: 12400,
        niftyReturn: 12.8,
        positiveMonths: 9,
        totalMonths: 12,
        maxGain: 8.7,
        maxLoss: -3.2,
      },
      "1Y": {
        totalReturn: 245800,
        percentReturn: 24.58,
        investedAmount: 1000000,
        currentValue: 1245800,
        realized: 45200,
        unrealized: 200600,
        capitalGains: 233400,
        dividends: 12400,
        niftyReturn: 12.8,
        positiveMonths: 9,
        totalMonths: 12,
        maxGain: 8.7,
        maxLoss: -3.2,
      },
      "3Y": {
        totalReturn: 523400,
        percentReturn: 52.34,
        investedAmount: 1000000,
        currentValue: 1523400,
        realized: 123400,
        unrealized: 400000,
        capitalGains: 498200,
        dividends: 25200,
        niftyReturn: 28.5,
        positiveMonths: 28,
        totalMonths: 36,
        maxGain: 12.4,
        maxLoss: -8.9,
      },
      ALL: {
        totalReturn: 687200,
        percentReturn: 68.72,
        investedAmount: 1000000,
        currentValue: 1687200,
        realized: 187200,
        unrealized: 500000,
        capitalGains: 652400,
        dividends: 34800,
        niftyReturn: 38.2,
        positiveMonths: 42,
        totalMonths: 60,
        maxGain: 14.8,
        maxLoss: -11.2,
      },
    };
    return data[period];
  };

  const performance = getPerformanceData(selectedPeriod);
  const outperformance = performance.percentReturn - performance.niftyReturn;
  const winRate = (performance.positiveMonths / performance.totalMonths) * 100;

  // Chart data generation
  const getChartData = () => {
    const dataPoints =
      selectedPeriod === "1M" ? 30 : selectedPeriod === "3M" ? 90 : 365;
    const data = [];
    const startValue = performance.investedAmount;
    const endValue = performance.currentValue;
    const niftyStart = 100;
    const niftyEnd = niftyStart * (1 + performance.niftyReturn / 100);

    for (let i = 0; i <= dataPoints; i++) {
      const progress = i / dataPoints;
      const portfolioValue =
        startValue +
        (endValue - startValue) * progress +
        Math.random() * 5000 -
        2500;
      const investedValue =
        startValue + (endValue - startValue) * progress * 0.85;
      const niftyValue = niftyStart + (niftyEnd - niftyStart) * progress;

      data.push({
        date:
          selectedPeriod === "1M"
            ? `Day ${i + 1}`
            : selectedPeriod === "3M"
              ? `Day ${i + 1}`
              : `${Math.floor(i / 30) + 1} Mon`,
        portfolio: Math.round(portfolioValue),
        invested: Math.round(investedValue),
        nifty: Math.round(niftyValue),
      });
    }
    return data;
  };

  const chartData = getChartData();

  // Performance milestones
  const milestones = [
    {
      id: 1,
      icon: Trophy,
      title: "Portfolio crossed ₹10L",
      date: "Mar 2024",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      id: 2,
      icon: TrendingUp,
      title: "Best month: +8.7%",
      date: "Aug 2024",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      id: 3,
      icon: Award,
      title: "First time beat Nifty 50",
      date: "May 2024",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      id: 4,
      icon: Zap,
      title: "Recovered from drawdown",
      date: "Jun 2024",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
  ];

  const periods: TimePeriod[] = ["1M", "3M", "6M", "YTD", "1Y", "3Y", "ALL"];

  // Returns analysis data
  const periodReturns: PeriodReturn[] = [
    {
      period: "1 Day",
      yourReturn: 2.35,
      invested: 2.35,
      nifty: 0.85,
      outperformance: 1.5,
      bestStock: "HDFC",
      bestStockReturn: 3.2,
      worstStock: "INFY",
      worstStockReturn: -0.5,
    },
    {
      period: "1 Week",
      yourReturn: 5.2,
      invested: 5.2,
      nifty: 2.1,
      outperformance: 3.1,
      bestStock: "TCS",
      bestStockReturn: 6.8,
      worstStock: "WIPRO",
      worstStockReturn: 2.1,
    },
    {
      period: "1 Month",
      yourReturn: 8.75,
      invested: 8.75,
      nifty: 4.2,
      outperformance: 4.55,
      bestStock: "BAJ",
      bestStockReturn: 12.5,
      worstStock: "INFY",
      worstStockReturn: 3.2,
    },
    {
      period: "3 Month",
      yourReturn: 15.4,
      invested: 15.4,
      nifty: 8.5,
      outperformance: 6.9,
      bestStock: "HDFC",
      bestStockReturn: 18,
      worstStock: "TECH",
      worstStockReturn: 8,
    },
    {
      period: "6 Month",
      yourReturn: 20.85,
      invested: 18.5,
      nifty: 11.2,
      outperformance: 9.65,
      bestStock: "TCS",
      bestStockReturn: 25,
      worstStock: "INFY",
      worstStockReturn: 12,
    },
    {
      period: "YTD",
      yourReturn: 24.58,
      invested: 20.0,
      nifty: 12.8,
      outperformance: 11.78,
      bestStock: "HDFC",
      bestStockReturn: 35,
      worstStock: "INFY",
      worstStockReturn: -2.8,
    },
    {
      period: "1 Year",
      yourReturn: 32.4,
      invested: 28.0,
      nifty: 18.5,
      outperformance: 13.9,
      bestStock: "TCS",
      bestStockReturn: 42,
      worstStock: "TECH",
      worstStockReturn: 15,
    },
    {
      period: "3 Year",
      yourReturn: 68.9,
      invested: 55.0,
      nifty: 42.3,
      outperformance: 26.6,
      bestStock: "HDFC",
      bestStockReturn: 85,
      worstStock: "WIPRO",
      worstStockReturn: 35,
    },
  ];

  // Contribution waterfall data
  const contributionData = [
    { name: "Starting", value: 1000000, color: "#6b7280" },
    { name: "HDFC", value: 9000, color: "#10b981" },
    { name: "TCS", value: 6300, color: "#10b981" },
    { name: "RELIANCE", value: 5200, color: "#10b981" },
    { name: "ITC", value: 4100, color: "#10b981" },
    { name: "ICICI", value: 3800, color: "#10b981" },
    { name: "Others", value: 14000, color: "#10b981" },
    { name: "INFY", value: -2400, color: "#ef4444" },
    { name: "Ending", value: 1245800, color: "#3b82f6" },
  ];

  // Performance distribution data
  const distributionData = [
    { range: "-10 to 0%", count: 1 },
    { range: "0 to 5%", count: 2 },
    { range: "5 to 10%", count: 3 },
    { range: "10 to 15%", count: 4 },
    { range: "15 to 25%", count: 5 },
    { range: "25 to 35%", count: 3 },
    { range: "35 to 50%", count: 1 },
  ];

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Sorted returns data
  const sortedReturns = [...periodReturns].sort((a, b) => {
    let aVal: number, bVal: number;
    switch (sortField) {
      case "yourReturn":
        aVal = a.yourReturn;
        bVal = b.yourReturn;
        break;
      case "nifty":
        aVal = a.nifty;
        bVal = b.nifty;
        break;
      case "outperformance":
        aVal = a.outperformance;
        bVal = b.outperformance;
        break;
      default:
        return 0;
    }
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Sector performance data
  const sectorPerformance: SectorPerformance[] = [
    {
      sector: "Banking",
      allocationPercent: 35,
      allocationAmount: 436000,
      avgReturn: 24.5,
      bestStock: "HDFC",
      bestStockReturn: 35,
      worstStock: "ICICI",
      worstStockReturn: 18,
      vsIndex: 8.2,
      contributionToReturns: 38,
    },
    {
      sector: "IT",
      allocationPercent: 25,
      allocationAmount: 312000,
      avgReturn: 18.2,
      bestStock: "TCS",
      bestStockReturn: 28,
      worstStock: "INFY",
      worstStockReturn: -2.8,
      vsIndex: 3.5,
      contributionToReturns: 21,
    },
    {
      sector: "Auto",
      allocationPercent: 15,
      allocationAmount: 187000,
      avgReturn: 22.8,
      bestStock: "TATA",
      bestStockReturn: 28,
      worstStock: "MARUTI",
      worstStockReturn: 18,
      vsIndex: 6.2,
      contributionToReturns: 18,
    },
    {
      sector: "Pharma",
      allocationPercent: 12,
      allocationAmount: 150000,
      avgReturn: 15.4,
      bestStock: "SUN",
      bestStockReturn: 20,
      worstStock: "CIPLA",
      worstStockReturn: 12,
      vsIndex: 2.1,
      contributionToReturns: 10,
    },
    {
      sector: "FMCG",
      allocationPercent: 8,
      allocationAmount: 100000,
      avgReturn: 12.8,
      bestStock: "ITC",
      bestStockReturn: 15,
      worstStock: "HUL",
      worstStockReturn: 10,
      vsIndex: -1.5,
      contributionToReturns: -3,
    },
    {
      sector: "Energy",
      allocationPercent: 5,
      allocationAmount: 62000,
      avgReturn: 19.5,
      bestStock: "RIL",
      bestStockReturn: 19.5,
      worstStock: "Only 1 stock",
      worstStockReturn: 19.5,
      vsIndex: 4.2,
      contributionToReturns: 7,
    },
  ];

  // Sort sector data
  const handleSectorSort = (field: SectorSortField) => {
    if (sectorSortField === field) {
      setSectorSortOrder(sectorSortOrder === "asc" ? "desc" : "asc");
    } else {
      setSectorSortField(field);
      setSectorSortOrder("desc");
    }
  };

  const sortedSectors = [...sectorPerformance].sort((a, b) => {
    let aVal: number, bVal: number;
    switch (sectorSortField) {
      case "allocation":
        aVal = a.allocationPercent;
        bVal = b.allocationPercent;
        break;
      case "avgReturn":
        aVal = a.avgReturn;
        bVal = b.avgReturn;
        break;
      case "vsIndex":
        aVal = a.vsIndex;
        bVal = b.vsIndex;
        break;
      default:
        return 0;
    }
    return sectorSortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Risk metrics data
  const riskMetrics: RiskMetric[] = [
    {
      label: "Sharpe Ratio",
      value: "1.84",
      benchmark: "1.42",
      interpretation: "You're generating 1.84% excess return per unit of risk",
      rating: "excellent",
      explanation: "Your returns justify the risk taken",
    },
    {
      label: "Volatility",
      value: "18.2%",
      benchmark: "22.5%",
      interpretation: "Your portfolio is less volatile than market",
      rating: "excellent",
      explanation: "Lower risk portfolio",
    },
    {
      label: "Maximum Drawdown",
      value: "-12.4%",
      benchmark: "-18.5%",
      interpretation: "Largest drop: -12.4% (Mar 2024)",
      rating: "good",
      explanation: "Better resilience than market",
    },
    {
      label: "Beta",
      value: "0.92",
      benchmark: "1.00",
      interpretation: "Your portfolio moves 92% in sync with market",
      rating: "good",
      explanation: "Slightly defensive, good for stability",
    },
  ];

  // Rolling returns data
  const rollingReturns = [
    { period: "Jan-Mar", return: 6.5 },
    { period: "Feb-Apr", return: 8.2 },
    { period: "Mar-May", return: 9.8 },
    { period: "Apr-Jun", return: 7.5 },
    { period: "May-Jul", return: 10.2 },
    { period: "Jun-Aug", return: 11.5 },
    { period: "Jul-Sep", return: 9.8 },
    { period: "Aug-Oct", return: 8.5 },
    { period: "Sep-Nov", return: 7.2 },
    { period: "Oct-Dec", return: 9.5 },
    { period: "Nov-Jan", return: 10.8 },
    { period: "Dec-Feb", return: 8.9 },
  ];

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400";
      case "good":
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400";
      case "fair":
        return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400";
      case "poor":
        return "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Benchmark comparison data
  const benchmarkData: BenchmarkComparison[] = [
    {
      period: "1 Month",
      yourReturn: 8.75,
      nifty50: 4.2,
      sensex: 4.8,
      bankNifty: 5.2,
      equalWeighted: 7.2,
      gold: 2.8,
    },
    {
      period: "3 Month",
      yourReturn: 15.4,
      nifty50: 8.5,
      sensex: 9.2,
      bankNifty: 10.8,
      equalWeighted: 13.2,
      gold: 5.5,
    },
    {
      period: "YTD",
      yourReturn: 24.58,
      nifty50: 12.8,
      sensex: 14.2,
      bankNifty: 16.5,
      equalWeighted: 20.3,
      gold: 8.7,
    },
    {
      period: "1 Year",
      yourReturn: 32.4,
      nifty50: 18.5,
      sensex: 20.2,
      bankNifty: 22.8,
      equalWeighted: 28.1,
      gold: 11.2,
    },
  ];

  // Performance race data
  const performanceRace = benchmarkData[2]; // YTD data

  // Dividend data
  const dividendMonths: DividendMonth[] = [
    { month: "Jan", amount: 2400, stocks: ["HDFC", "TCS"] },
    { month: "Feb", amount: 0, stocks: [] },
    { month: "Mar", amount: 0, stocks: [] },
    { month: "Apr", amount: 1800, stocks: ["RELIANCE"] },
    { month: "May", amount: 0, stocks: [] },
    { month: "Jun", amount: 0, stocks: [] },
    { month: "Jul", amount: 3200, stocks: ["ITC", "SUN"] },
    { month: "Aug", amount: 0, stocks: [] },
    { month: "Sep", amount: 0, stocks: [] },
    { month: "Oct", amount: 2500, stocks: ["INFY", "WIPRO"] },
    { month: "Nov", amount: 2800, stocks: ["TCS", "HDFC"], isUpcoming: true },
    { month: "Dec", amount: 1500, stocks: ["ITC"], isUpcoming: true },
  ];

  const receivedDividends = dividendMonths
    .filter((m) => !m.isUpcoming)
    .reduce((sum, m) => sum + m.amount, 0);

  const dividendByStock: DividendByStock[] = [
    { stock: "ITC", amount: 3800, percentage: 31 },
    { stock: "HDFC Bank", amount: 2900, percentage: 23 },
    { stock: "TCS", amount: 2400, percentage: 19 },
    { stock: "Reliance", amount: 1800, percentage: 15 },
    { stock: "Others", amount: 1500, percentage: 12 },
  ];

  // Section 10: Health-Performance Correlation Data
  const healthPerformanceStocks: HealthPerformanceStock[] = [
    { symbol: "HDFC", healthScore: 92, returns: 32.5, category: "star" },
    { symbol: "TCS", healthScore: 88, returns: 24.8, category: "star" },
    { symbol: "Reliance", healthScore: 84, returns: 21.2, category: "star" },
    { symbol: "Infosys", healthScore: 82, returns: 18.5, category: "star" },
    { symbol: "Asian Paints", healthScore: 86, returns: 8.2, category: "hold" },
    { symbol: "ITC", healthScore: 78, returns: 15.4, category: "star" },
    {
      symbol: "Bajaj Finance",
      healthScore: 75,
      returns: 12.8,
      category: "star",
    },
    {
      symbol: "Tech Mahindra",
      healthScore: 58,
      returns: -4.2,
      category: "concern",
    },
  ];

  // Section 11: Transaction Performance Data
  const closedPositions: ClosedPosition[] = [
    {
      stock: "Wipro",
      buyDate: "Jan 2023",
      sellDate: "Aug 2024",
      holdPeriod: "19 months",
      buyPrice: 380,
      sellPrice: 445,
      return: 17.1,
      reason: "Rebalancing",
      priceAfter3Months: 420,
      timingQuality: "excellent",
    },
    {
      stock: "HCL Tech",
      buyDate: "Mar 2023",
      sellDate: "Jun 2024",
      holdPeriod: "15 months",
      buyPrice: 1050,
      sellPrice: 1280,
      return: 21.9,
      reason: "Target reached",
      priceAfter3Months: 1320,
      timingQuality: "good",
    },
    {
      stock: "Dr Reddy",
      buyDate: "May 2023",
      sellDate: "Dec 2024",
      holdPeriod: "19 months",
      buyPrice: 4200,
      sellPrice: 5100,
      return: 21.4,
      reason: "Sector rotation",
      priceAfter3Months: 5050,
      timingQuality: "excellent",
    },
    {
      stock: "Tata Motors",
      buyDate: "Feb 2023",
      sellDate: "Sep 2024",
      holdPeriod: "19 months",
      buyPrice: 420,
      sellPrice: 540,
      return: 28.6,
      reason: "Profit booking",
      priceAfter3Months: 580,
      timingQuality: "fair",
    },
  ];

  const buyTimingStocks: BuyTimingStock[] = [
    {
      stock: "HDFC Bank",
      boughtAt: 1640,
      periodLow: 1580,
      efficiency: 96,
      status: "good",
    },
    {
      stock: "TCS",
      boughtAt: 3420,
      periodLow: 3250,
      efficiency: 95,
      status: "good",
    },
    {
      stock: "Reliance",
      boughtAt: 2380,
      periodLow: 2180,
      efficiency: 92,
      status: "good",
    },
    {
      stock: "Infosys",
      boughtAt: 1420,
      periodLow: 1280,
      efficiency: 90,
      status: "fair",
    },
    {
      stock: "Asian Paints",
      boughtAt: 2850,
      periodLow: 2420,
      efficiency: 85,
      status: "fair",
    },
  ];

  // Section 12: Forward-Looking Data
  const marketScenarios: MarketScenario[] = [
    {
      scenario: "Bull Market (+20%)",
      marketReturn: "+25-30%",
      portfolioReturn: "+25-30%",
      notes: "Outperform (beta 0.92, good stock picks)",
    },
    {
      scenario: "Flat Market (0-5%)",
      marketReturn: "+8-12%",
      portfolioReturn: "+8-12%",
      notes: "Modest gains (dividend income helps)",
    },
    {
      scenario: "Bear Market (-15%)",
      marketReturn: "-8 to -12%",
      portfolioReturn: "-8 to -12%",
      notes: "Better resilience (low beta, quality stocks)",
    },
  ];

  const dividendProjections: DividendProjection[] = [
    { label: "Conservative", amount: 14000 },
    { label: "Expected", amount: 18500 },
    { label: "Optimistic", amount: 22000 },
  ];

  const sortedClosedPositions = [...closedPositions].sort((a, b) =>
    transactionSortBy === "return"
      ? b.return - a.return
      : new Date(b.sellDate).getTime() - new Date(a.sellDate).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: PERFORMANCE HERO
      ═══════════════════════════════════════════════════════════════ */}
      <div id="performance-hero" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Here's how your investments have performed
          </p>
          <h3 className="text-2xl font-bold">Performance Overview</h3>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap gap-2">
          {periods.map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>

        {/* Hero Display */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="pt-8 pb-6">
            <div className="text-center space-y-6">
              {/* Main Return Display */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Total Returns ({selectedPeriod})
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <p
                      className={`text-5xl md:text-6xl font-bold ${
                        performance.totalReturn >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {performance.totalReturn >= 0 ? "+" : ""}₹
                      {performance.totalReturn.toLocaleString()}
                    </p>
                    <p
                      className={`text-2xl font-semibold mt-2 ${
                        performance.percentReturn >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {performance.percentReturn >= 0 ? "+" : ""}
                      {performance.percentReturn.toFixed(2)}%
                    </p>
                  </div>
                  {performance.percentReturn >= 0 ? (
                    <TrendingUp className="w-16 h-16 text-green-500 opacity-50" />
                  ) : (
                    <TrendingDown className="w-16 h-16 text-red-500 opacity-50" />
                  )}
                </div>
              </div>

              {/* Performance Context Pills */}
              <div className="flex flex-wrap justify-center gap-3">
                {outperformance > 0 && (
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm bg-green-500/50 text-green-200 border-green-500 dark:bg-green-500/20"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Beat Nifty by +{outperformance.toFixed(2)}%
                  </Badge>
                )}
                {winRate >= 70 && (
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm bg-blue-500/50 text-blue-200 border-blue-500 dark:bg-blue-500/20"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Top 15% of investors
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm bg-purple-500/50 text-purple-200 border-purple-500 dark:bg-purple-500/20"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Positive in {performance.positiveMonths}/
                  {performance.totalMonths} months
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Return Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: Total Gains */}
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Gains
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Realized</span>
                  <span className="font-semibold text-green-600">
                    ₹{performance.realized.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unrealized</span>
                  <span className="font-semibold text-blue-600">
                    ₹{performance.unrealized.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">
                      ₹{performance.totalReturn.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Progress
                  value={(performance.realized / performance.totalReturn) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(
                    (performance.realized / performance.totalReturn) *
                    100
                  ).toFixed(1)}
                  % realized
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: Return Breakdown */}
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Return Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-muted-foreground">
                      Capital Gains
                    </span>
                  </div>
                  <span className="font-semibold text-sm">
                    ₹{performance.capitalGains.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={
                    (performance.capitalGains / performance.totalReturn) * 100
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {(
                    (performance.capitalGains / performance.totalReturn) *
                    100
                  ).toFixed(1)}
                  % of returns
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-muted-foreground">
                      Dividends
                    </span>
                  </div>
                  <span className="font-semibold text-sm">
                    ₹{performance.dividends.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={
                    (performance.dividends / performance.totalReturn) * 100
                  }
                  className="h-2 bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {(
                    (performance.dividends / performance.totalReturn) *
                    100
                  ).toFixed(1)}
                  % of returns
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: vs Benchmark */}
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                vs Benchmark
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your return</span>
                  <Badge variant={"success"} className="font-bold">
                    +{performance.percentReturn.toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nifty 50</span>
                  <span className="font-semibold">
                    +{performance.niftyReturn.toFixed(2)}%
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Outperformance</span>
                    <Badge
                      variant={outperformance >= 0 ? "success" : "destructive"}
                      className="font-bold text-lg"
                    >
                      {outperformance >= 0 ? "+" : ""}
                      {outperformance.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                {outperformance >= 0 ? (
                  <Badge className="w-full justify-center bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Beating Market 🟢
                  </Badge>
                ) : (
                  <Badge className="w-full justify-center bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Below Market 🔴
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: Consistency */}
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Consistency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Positive months</span>
                  <span className="font-semibold">
                    {performance.positiveMonths} of {performance.totalMonths}
                  </span>
                </div>
                <Progress value={winRate} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Win rate: {winRate.toFixed(0)}%
                </p>
              </div>
              <div className="pt-2 space-y-2 text-sm border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max gain</span>
                  <Badge variant="success" className="font-semibold">
                    +{performance.maxGain}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max loss</span>
                  <Badge variant="destructive" className="font-semibold">
                    {performance.maxLoss}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: PERFORMANCE CHART
      ═══════════════════════════════════════════════════════════════ */}
      <div id="performance-chart" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Let's see your investment journey visually
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            📈 Portfolio Value & Returns Over Time
          </h3>
        </div>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Performance Chart</CardTitle>
                <CardDescription>
                  Track your portfolio growth compared to benchmarks
                </CardDescription>
              </div>

              {/* Chart Controls */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={chartType === "value" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("value")}
                >
                  Portfolio Value
                </Button>
                <Button
                  variant={chartType === "cumulative" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("cumulative")}
                >
                  Cumulative Returns
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Chart Toggle Controls */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={showInvested ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowInvested(!showInvested)}
              >
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                Invested Amount
              </Button>
              <Button
                variant={showBenchmark ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowBenchmark(!showBenchmark)}
              >
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                Nifty 50
              </Button>
            </div>

            {/* Main Chart */}
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  key={`${showInvested}-${showBenchmark}`}
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorPortfolio"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `₹${(value / 100000).toFixed(1)}L`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [
                      `₹${value.toLocaleString()}`,
                      "",
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="portfolio"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPortfolio)"
                    name="Portfolio Value"
                  />
                  {showInvested && (
                    <Line
                      type="monotone"
                      dataKey="invested"
                      stroke="#6b7280"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Invested Amount"
                    />
                  )}
                  {showBenchmark && (
                    <Line
                      type="monotone"
                      dataKey="nifty"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      name="Nifty 50 (Indexed)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Milestones */}
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Performance Milestones
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {milestones.map((milestone) => (
                  <Card
                    key={milestone.id}
                    className={`cursor-pointer hover:shadow-lg transition-all ${milestone.bgColor} border-none`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg bg-background/50 ${milestone.color}`}
                        >
                          <milestone.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">
                            {milestone.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {milestone.date}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: RETURNS ANALYSIS
      ═══════════════════════════════════════════════════════════════ */}
      <div id="returns-analysis" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            How have you performed across different time periods?
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            📊 Returns Across Time Periods
          </h3>
        </div>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comprehensive Returns Analysis</CardTitle>
                <CardDescription>
                  Compare your performance across multiple timeframes
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReturnsTable(!showReturnsTable)}
                className="flex items-center gap-2"
              >
                {showReturnsTable ? (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Chart View
                  </>
                ) : (
                  <>
                    <Table2 className="w-4 h-4" />
                    Table View
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Conditional Rendering: Table or Chart */}
            {showReturnsTable ? (
              /* Returns Table */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSort("yourReturn")}
                          className="flex items-center gap-1 ml-auto hover:text-foreground"
                        >
                          Your Return
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Invested</TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSort("nifty")}
                          className="flex items-center gap-1 ml-auto hover:text-foreground"
                        >
                          Nifty 50
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSort("outperformance")}
                          className="flex items-center gap-1 ml-auto hover:text-foreground"
                        >
                          Outperformance
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Best Stock</TableHead>
                      <TableHead className="text-right">Worst Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedReturns.map((row) => (
                      <TableRow
                        key={row.period}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-semibold">
                          {row.period}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-bold ${
                              row.yourReturn >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {row.yourReturn >= 0 ? "+" : ""}
                            {row.yourReturn.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-muted-foreground">
                            {row.invested >= 0 ? "+" : ""}
                            {row.invested.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-muted-foreground">
                            {row.nifty >= 0 ? "+" : ""}
                            {row.nifty.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-semibold ${
                              row.outperformance >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {row.outperformance >= 0 ? "+" : ""}
                            {row.outperformance.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            <span className="font-semibold">
                              {row.bestStock}
                            </span>
                            <span className="text-green-600 ml-1">
                              +{row.bestStockReturn.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            <span className="font-semibold">
                              {row.worstStock}
                            </span>
                            <span
                              className={`ml-1 ${
                                row.worstStockReturn >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {row.worstStockReturn >= 0 ? "+" : ""}
                              {row.worstStockReturn.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Visual Comparison Chart */
              <div>
                <h4 className="text-sm font-semibold mb-4">
                  Visual Comparison
                </h4>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={periodReturns.slice(2)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="period"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => [`${value.toFixed(2)}%`, ""]}
                      />
                      <Legend />
                      <Bar
                        dataKey="yourReturn"
                        fill="#10b981"
                        name="Your Return"
                      />
                      <Bar dataKey="nifty" fill="#f59e0b" name="Nifty 50" />
                      <Bar dataKey="invested" fill="#6b7280" name="Invested" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Performance Insights */}
            <div className="pt-6 border-t">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Performance Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    ✓ You've beaten Nifty 50 in 11 out of 12 months
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    📈 Your 3-year CAGR is 19.2% vs market 12.5%
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900/30">
                  <p className="text-sm text-purple-900 dark:text-purple-100">
                    🔥 Longest winning streak: 5 months (Apr-Aug 2024)
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    💡 You tend to outperform more in bull markets
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: STOCK-WISE PERFORMANCE
      ═══════════════════════════════════════════════════════════════ */}
      <div id="stock-wise-performance" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Which stocks contributed most to your returns?
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            🏆 Performance by Stock
          </h3>
        </div>

        {/* Contribution Analysis */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Contribution Waterfall
            </CardTitle>
            <CardDescription>
              How each stock contributed to your total returns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={contributionData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--popover-foreground)",
                    }}
                    formatter={(value: any) => {
                      return [
                        <span className="font-bold text-foreground">{`₹${value.toLocaleString()}`}</span>,
                        "",
                      ];
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {contributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Distribution
            </CardTitle>
            <CardDescription>
              How your stocks are distributed across return ranges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="range"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    label={{
                      value: "Number of Stocks",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 Most of your stocks are clustered in the 15-25% return range,
                showing consistent portfolio performance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: SECTOR PERFORMANCE
      ═══════════════════════════════════════════════════════════════ */}
      <div id="sector-performance" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Let's see how different sectors in your portfolio performed
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            🏭 Sector-wise Returns
          </h3>
        </div>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sector Performance Analysis</CardTitle>
                <CardDescription>
                  How different sectors contributed to your returns
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSectorTable(!showSectorTable)}
                className="flex items-center gap-2"
              >
                {showSectorTable ? (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Chart View
                  </>
                ) : (
                  <>
                    <Table2 className="w-4 h-4" />
                    Table View
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Conditional Rendering: Table or Chart */}
            {showSectorTable ? (
              /* Sector Performance Table */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          onClick={() => handleSectorSort("sector")}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Sector
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSectorSort("allocation")}
                          className="flex items-center gap-1 ml-auto hover:text-foreground"
                        >
                          Allocation
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSectorSort("avgReturn")}
                          className="flex items-center gap-1 ml-auto hover:text-foreground"
                        >
                          Avg Return
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Best Stock</TableHead>
                      <TableHead className="text-right">Worst Stock</TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSectorSort("vsIndex")}
                          className="flex items-center gap-1 ml-auto hover:text-foreground"
                        >
                          vs Sector Index
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSectors.map((sector) => (
                      <TableRow
                        key={sector.sector}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-semibold">
                          {sector.sector}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <span className="font-semibold">
                              {sector.allocationPercent}%
                            </span>
                            <p className="text-xs text-muted-foreground">
                              ₹{(sector.allocationAmount / 1000).toFixed(0)}K
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-bold ${
                              sector.avgReturn >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {sector.avgReturn >= 0 ? "+" : ""}
                            {sector.avgReturn.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            <span className="font-semibold">
                              {sector.bestStock}
                            </span>
                            <span className="text-green-600 ml-1">
                              +{sector.bestStockReturn}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            <span className="font-semibold">
                              {sector.worstStock}
                            </span>
                            {sector.worstStock !== "Only 1 stock" && (
                              <span
                                className={`ml-1 ${
                                  sector.worstStockReturn >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {sector.worstStockReturn >= 0 ? "+" : ""}
                                {sector.worstStockReturn}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-semibold ${
                              sector.vsIndex >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {sector.vsIndex >= 0 ? "+" : ""}
                            {sector.vsIndex.toFixed(1)}%{" "}
                            {sector.vsIndex >= 0 ? "better" : "worse"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Sector Performance Chart */
              <div>
                <h4 className="text-sm font-semibold mb-4">
                  Sector Returns Visualization
                </h4>
                <div className="space-y-3">
                  {sectorPerformance.map((sector) => (
                    <div key={sector.sector} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold min-w-[80px]">
                            {sector.sector}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {sector.allocationPercent}%
                          </Badge>
                        </div>
                        <span
                          className={`font-bold ${
                            sector.avgReturn >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {sector.avgReturn >= 0 ? "+" : ""}
                          {sector.avgReturn.toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative">
                        <Progress
                          value={Math.abs(sector.avgReturn) * 2}
                          className="h-3"
                        />
                        <div
                          className="absolute left-0 top-0 h-3 rounded-full bg-primary/20 flex items-center justify-center"
                          style={{ width: `${sector.allocationPercent}%` }}
                        >
                          <div
                            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white font-bold"
                            style={{
                              transform: "scale(0.8)",
                            }}
                          >
                            {sector.allocationPercent}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allocation vs Contribution */}
            <div className="pt-6 border-t">
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-sm font-semibold">
                  Allocation vs Contribution Analysis
                </h4>
                <TooltipProvider>
                  <ActualTooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm bg-gray-900 text-white border-gray-700">
                      <p className="text-sm">
                        💡 When contribution exceeds allocation, the sector
                        outperformed. When allocation exceeds contribution, it
                        underperformed. Negative contributions indicate the
                        sector detracted from overall returns.
                      </p>
                    </TooltipContent>
                  </ActualTooltip>
                </TooltipProvider>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sectorPerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                      dataKey="sector"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      label={{
                        value: "Percentage (%)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--popover-foreground)",
                      }}
                      formatter={(value: any, name: string, props: any) => {
                        const color = props.color; // 👈 this gives correct bar color

                        return [
                          <span style={{ color, fontWeight: 600 }}>
                            {value}%
                          </span>,
                          "",
                        ];
                      }}
                    />
                    <Legend />
                    <ReferenceLine
                      y={0}
                      stroke="var(--border)"
                      strokeWidth={1.5}
                    />
                    <Bar
                      dataKey="allocationPercent"
                      fill="#3b82f6"
                      name="Allocation %"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="contributionToReturns"
                      name="Contribution to Returns %"
                      fill="#10b981"
                    >
                      {sectorPerformance.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.contributionToReturns >= 0
                              ? "#10b981"
                              : "#ef4444"
                          }
                          radius={
                            entry.contributionToReturns >= 0
                              ? ([8, 8, 0, 0] as any)
                              : ([0, 0, 8, 8] as any)
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sector Insights */}
            <div className="pt-6 border-t">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Sector Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    ✓ Banking allocation (35%) delivered strong returns (+24.5%)
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    ⚠️ IT sector underperformed despite 25% allocation
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 Consider: FMCG lagging, but only 8% allocated
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900/30">
                  <p className="text-sm text-purple-900 dark:text-purple-100">
                    🎯 Your sector picks beat sector indices in 5 out of 6
                    sectors
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: RISK-ADJUSTED RETURNS
      ═══════════════════════════════════════════════════════════════ */}
      <div id="risk-adjusted-returns" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Returns are great, but let's understand the risk you took to achieve
            them
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            ⚖️ Risk-Adjusted Performance
          </h3>
        </div>

        {/* Risk Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {riskMetrics.map((metric, idx) => (
            <Card
              key={idx}
              className={`border-2 ${getRatingColor(metric.rating)}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-3xl font-bold">{metric.value}</p>
                  {metric.benchmark && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Benchmark: {metric.benchmark}
                    </p>
                  )}
                </div>
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {metric.interpretation}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {metric.rating === "excellent" && "Excellent 🟢"}
                    {metric.rating === "good" && "Good 🟢"}
                    {metric.rating === "fair" && "Fair 🟡"}
                    {metric.rating === "poor" && "Poor 🔴"}
                  </Badge>
                  <p className="text-xs font-semibold">{metric.explanation}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Consistency Analysis */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Consistency Analysis
            </CardTitle>
            <CardDescription>
              3-month rolling returns over the past year
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={rollingReturns}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="period"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [
                      `${value.toFixed(1)}%`,
                      "Return",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="return"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#3b82f6" }}
                    activeDot={{ r: 7 }}
                  />
                  {/* Reference line at 0% */}
                  <Line
                    type="monotone"
                    dataKey={() => 0}
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Consistency Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">9/12</p>
                <p className="text-sm text-muted-foreground">
                  Positive rolling periods
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">11.5%</p>
                <p className="text-sm text-muted-foreground">Highest return</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">6.5%</p>
                <p className="text-sm text-muted-foreground">Lowest return</p>
              </div>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
              <p className="text-sm text-green-900 dark:text-green-100">
                ✓ Returns positive in 9 out of 12 rolling periods - showing
                strong consistency
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 8: BENCHMARKING
      ═══════════════════════════════════════════════════════════════ */}
      <div id="benchmarking" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Let's see how you stack up against different benchmarks
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            📊 Performance vs Benchmarks
          </h3>
        </div>

        {/* Benchmark Comparison Table */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Multi-Benchmark Comparison</CardTitle>
            <CardDescription>
              Your performance against various market indices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right font-semibold text-primary">
                      Your Return
                    </TableHead>
                    <TableHead className="text-right">Nifty 50</TableHead>
                    <TableHead className="text-right">Sensex</TableHead>
                    <TableHead className="text-right">Bank Nifty</TableHead>
                    <TableHead className="text-right">Gold</TableHead>
                    <TableHead className="text-right">Equal-Weighted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benchmarkData.map((row) => (
                    <TableRow key={row.period}>
                      <TableCell className="font-semibold">
                        {row.period}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-green-600 text-lg">
                          +{row.yourReturn.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">
                          +{row.nifty50.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">
                          +{row.sensex.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">
                          +{row.bankNifty.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">
                          +{row.gold.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">
                          +{row.equalWeighted.toFixed(2)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Benchmark Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
                <p className="text-sm text-green-900 dark:text-green-100">
                  ✓ Beat Nifty 50 by{" "}
                  <span className="font-bold">
                    {(
                      performanceRace.yourReturn - performanceRace.nifty50
                    ).toFixed(2)}
                    %
                  </span>{" "}
                  (YTD)
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  📊 Beat equal-weighted by{" "}
                  <span className="font-bold">
                    {(
                      performanceRace.yourReturn - performanceRace.equalWeighted
                    ).toFixed(2)}
                    %
                  </span>
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900/30">
                <p className="text-sm text-purple-900 dark:text-purple-100">
                  🎯 Closest: Bank Nifty (35% banking exposure)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Race Chart */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Race
            </CardTitle>
            <CardDescription>
              How different benchmarks grew over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={benchmarkData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="period"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [`${value.toFixed(2)}%`, ""]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="yourReturn"
                    stroke="#10b981"
                    strokeWidth={4}
                    name="Your Portfolio"
                    dot={{ r: 6, fill: "#10b981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nifty50"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Nifty 50"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sensex"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Sensex"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bankNifty"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Bank Nifty"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="equalWeighted"
                    stroke="#6b7280"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Equal-Weighted"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Percentile Ranking */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Percentile Ranking
            </CardTitle>
            <CardDescription>
              Among investors with similar portfolio size (₹10-15L)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mb-2">
                  <Award className="w-12 h-12 mx-auto text-yellow-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Return Percentile
                </p>
                <p className="text-3xl font-bold text-green-600">Top 15%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Better than 85% of investors
                </p>
              </div>
              <div className="text-center">
                <div className="mb-2">
                  <CheckCircle className="w-12 h-12 mx-auto text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground">Risk Percentile</p>
                <p className="text-3xl font-bold text-blue-600">Top 30%</p>
                <p className="text-xs text-muted-foreground mt-1">Lower risk</p>
              </div>
              <div className="text-center">
                <div className="mb-2">
                  <Medal className="w-12 h-12 mx-auto text-purple-500" />
                </div>
                <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                <p className="text-3xl font-bold text-purple-600">Top 12%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Best risk-adjusted returns
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30 text-center">
              <p className="font-semibold text-green-900 dark:text-green-100">
                🎉 You're doing better than 85% of similar investors!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 9: DIVIDEND PERFORMANCE
      ═══════════════════════════════════════════════════════════════ */}
      <div id="dividend-performance" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            How much passive income did your investments generate?
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            💰 Dividend Income Analysis
          </h3>
        </div>

        {/* Dividend Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Dividend Income
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-3xl font-bold text-green-600">
                  ₹{receivedDividends.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">YTD received</p>
              </div>
              <div className="pt-3 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last year</span>
                  <span className="font-semibold">₹9,800</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Growth</span>
                  <span className="font-semibold text-green-600">+26.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">% of returns</span>
                  <span className="font-semibold">5%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Dividend Yield
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-3xl font-bold">1.8%</p>
                <p className="text-sm text-muted-foreground">Portfolio yield</p>
              </div>
              <div className="pt-3 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nifty 50 yield</span>
                  <span className="font-semibold">1.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Highest</span>
                  <span className="font-semibold text-green-600">ITC 4.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lowest</span>
                  <span className="font-semibold">TCS 0.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Dividend Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-3xl font-bold">12%</p>
                <p className="text-sm text-muted-foreground">Annually</p>
              </div>
              <div className="pt-3 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Increasing</span>
                  <span className="font-semibold text-green-600">
                    12 out of 15
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cutting</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="pt-2">
                  <Badge className="w-full justify-center bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950/30">
                    Excellent Reliability 🟢
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dividend Timeline */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dividend Timeline
            </CardTitle>
            <CardDescription>
              Monthly dividend income (received & upcoming)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {dividendMonths.map((month) => (
                <Card
                  key={month.month}
                  className={`${
                    month.isUpcoming
                      ? "border-2 border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-950/10"
                      : month.amount > 0
                        ? "bg-green-50/50 dark:bg-green-950/10"
                        : "bg-muted/30"
                  }`}
                >
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm font-semibold">{month.month}</p>
                    <p
                      className={`text-lg font-bold mt-1 ${
                        month.amount > 0
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {month.amount > 0
                        ? `₹${month.amount.toLocaleString()}`
                        : "-"}
                    </p>
                    {month.stocks.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {month.stocks.join(", ")}
                      </p>
                    )}
                    {month.isUpcoming && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Expected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dividend Contribution by Stock */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Dividend by Stock
            </CardTitle>
            <CardDescription>
              Which stocks contributed most to dividend income
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dividendByStock.map((stock) => (
                <div key={stock.stock} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{stock.stock}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 font-bold">
                        ₹{stock.amount.toLocaleString()}
                      </span>
                      <Badge variant="outline">{stock.percentage}%</Badge>
                    </div>
                  </div>
                  <Progress value={stock.percentage * 2} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dividend Reinvestment Analysis */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Dividend Reinvestment Impact
            </CardTitle>
            <CardDescription>
              What if you had reinvested all dividends?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                <p className="text-sm text-muted-foreground mb-1">
                  Dividends Received
                </p>
                <p className="text-2xl font-bold">₹12,400</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
                <p className="text-sm text-muted-foreground mb-1">
                  Additional Value (with growth)
                </p>
                <p className="text-2xl font-bold text-green-600">₹12,600</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900/30">
                <p className="text-sm text-muted-foreground mb-1">
                  New Portfolio Value
                </p>
                <p className="text-2xl font-bold text-purple-600">₹12,58,200</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                💡 <span className="font-semibold">Pro tip:</span> Reinvesting
                dividends accelerates compounding and increases future dividend
                income
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 10: PERFORMANCE & HEALTH CORRELATION
      ═══════════════════════════════════════════════════════════════ */}
      <div id="performance-health-correlation" className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Does fundamental health predict performance? Let&apos;s find out:
          </p>
          <h2 className="text-2xl font-bold">
            🎯 Health Score vs Returns Analysis
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Correlation Scatter Plot */}
          <Card className="backdrop-blur-sm bg-background/95">
            <CardHeader>
              <CardTitle className="text-lg">Correlation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={healthPerformanceStocks.map((s) => ({
                    health: s.healthScore,
                    returns: s.returns,
                    symbol: s.symbol,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="health"
                    label={{
                      value: "Health Score",
                      position: "insideBottom",
                      offset: -5,
                    }}
                    domain={[50, 100]}
                  />
                  <YAxis
                    label={{
                      value: "Returns (%)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background/95 border rounded-lg p-2 shadow-lg">
                            <p className="font-semibold">
                              {payload[0].payload.symbol}
                            </p>
                            <p className="text-sm">
                              Health: {payload[0].payload.health}
                            </p>
                            <p className="text-sm">
                              Returns: {payload[0].payload.returns}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="returns"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const color = payload.returns > 0 ? "#22c55e" : "#ef4444";
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Finding: Stocks with health &gt;80 averaged 28% returns vs 12%
                  for health 60-80
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-muted-foreground">
                    Positive Returns
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-muted-foreground">
                    Negative Returns
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health-Performance Matrix */}
          <Card className="backdrop-blur-sm bg-background/95">
            <CardHeader>
              <CardTitle className="text-lg">
                Health-Performance Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {/* Stars: High Health, High Returns */}
                <div className="p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        Stars
                      </p>
                      <p className="text-xs text-muted-foreground">
                        High Health × High Returns
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {healthPerformanceStocks
                      .filter((s) => s.category === "star" && s.returns > 20)
                      .slice(0, 3)
                      .map((s) => (
                        <p key={s.symbol} className="text-sm font-medium">
                          {s.symbol}
                        </p>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Great picks, keep
                  </p>
                </div>

                {/* Hold: High Health, Low Returns */}
                <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🤔</span>
                    <div>
                      <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                        Hold
                      </p>
                      <p className="text-xs text-muted-foreground">
                        High Health × Low Returns
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {healthPerformanceStocks
                      .filter((s) => s.category === "hold")
                      .map((s) => (
                        <p key={s.symbol} className="text-sm font-medium">
                          {s.symbol}
                        </p>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Good companies, patience needed
                  </p>
                </div>

                {/* Lucky: Low Health, High Returns */}
                <div className="p-4 bg-purple-500/10 border-2 border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎲</span>
                    <div>
                      <p className="font-semibold text-purple-600 dark:text-purple-400">
                        Lucky
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Low Health × High Returns
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {healthPerformanceStocks.filter(
                      (s) => s.category === "lucky",
                    ).length > 0 ? (
                      healthPerformanceStocks
                        .filter((s) => s.category === "lucky")
                        .map((s) => (
                          <p key={s.symbol} className="text-sm font-medium">
                            {s.symbol}
                          </p>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">None</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Reevaluate fundamentals
                  </p>
                </div>

                {/* Concern: Low Health, Low Returns */}
                <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        Concern
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Low Health × Low Returns
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {healthPerformanceStocks
                      .filter((s) => s.category === "concern")
                      .map((s) => (
                        <p key={s.symbol} className="text-sm font-medium">
                          {s.symbol}
                        </p>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Review and possibly exit
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 11: TRANSACTION PERFORMANCE
      ═══════════════════════════════════════════════════════════════ */}
      <div id="transaction-performance" className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Let&apos;s evaluate your investment timing decisions
          </p>
          <h2 className="text-2xl font-bold">⏱️ Transaction Analysis</h2>
        </div>

        {/* Closed Positions */}
        <Card className="backdrop-blur-sm bg-background/95">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Closed Positions</CardTitle>
                <CardDescription>
                  Stocks you&apos;ve sold and their performance
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={
                    transactionSortBy === "return" ? "default" : "outline"
                  }
                  onClick={() => setTransactionSortBy("return")}
                >
                  Sort by Return
                </Button>
                <Button
                  size="sm"
                  variant={transactionSortBy === "date" ? "default" : "outline"}
                  onClick={() => setTransactionSortBy("date")}
                >
                  Sort by Date
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stock Sold</TableHead>
                    <TableHead>Buy Date</TableHead>
                    <TableHead>Sell Date</TableHead>
                    <TableHead>Hold Period</TableHead>
                    <TableHead className="text-right">Buy Price</TableHead>
                    <TableHead className="text-right">Sell Price</TableHead>
                    <TableHead className="text-right">Return</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClosedPositions.map((pos, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{pos.stock}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pos.buyDate}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pos.sellDate}
                      </TableCell>
                      <TableCell className="text-sm">
                        {pos.holdPeriod}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        ₹{pos.buyPrice}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        ₹{pos.sellPrice}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${
                            pos.return > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {pos.return > 0 ? "+" : ""}
                          {pos.return.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pos.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center p-3 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  7/8
                </p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  16 months
                </p>
                <p className="text-sm text-muted-foreground">Avg Hold Period</p>
              </div>
              <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  +19.2%
                </p>
                <p className="text-sm text-muted-foreground">
                  Avg Gain on Exits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing Analysis */}
        <Card className="backdrop-blur-sm bg-background/95">
          <CardHeader>
            <CardTitle className="text-lg">⏰ Timing Analysis</CardTitle>
            <CardDescription>
              How did your exit timing work out?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {closedPositions.slice(0, 2).map((pos, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{pos.stock}</h4>
                    <Badge
                      variant={
                        pos.timingQuality === "excellent"
                          ? "default"
                          : pos.timingQuality === "good"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {pos.timingQuality}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>You sold at ₹{pos.sellPrice}</p>
                    <p className="text-muted-foreground">
                      Price 3 months later: ₹{pos.priceAfter3Months}
                      {pos.priceAfter3Months &&
                      pos.priceAfter3Months < pos.sellPrice ? (
                        <span className="text-green-600 dark:text-green-400 ml-2">
                          (Good exit! ✓)
                        </span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400 ml-2">
                          (Opportunity cost)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Buy Timing Evaluation */}
        <Card className="backdrop-blur-sm bg-background/95">
          <CardHeader>
            <CardTitle className="text-lg">🎯 Buy Timing Evaluation</CardTitle>
            <CardDescription>For current holdings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-3">
                  Stocks bought near their lows (good timing):
                </p>
                <div className="space-y-2">
                  {buyTimingStocks
                    .filter((s) => s.status === "good")
                    .map((stock, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{stock.stock}</p>
                          <p className="text-sm text-muted-foreground">
                            Bought at ₹{stock.boughtAt}, low was ₹
                            {stock.periodLow}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {stock.efficiency}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            efficient
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-3">
                  Stocks bought near highs (unfortunate timing):
                </p>
                <div className="space-y-2">
                  {buyTimingStocks
                    .filter((s) => s.status === "fair")
                    .map((stock, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{stock.stock}</p>
                          <p className="text-sm text-muted-foreground">
                            Bought at ₹{stock.boughtAt}, low was ₹
                            {stock.periodLow}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            {stock.efficiency}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            efficient
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 12: FORWARD-LOOKING PERFORMANCE
      ═══════════════════════════════════════════════════════════════ */}
      <div id="forward-looking-performance" className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Based on your current holdings, here&apos;s the outlook:
          </p>
          <h2 className="text-2xl font-bold">🔮 Performance Outlook</h2>
        </div>

        {/* Risk Scenarios */}
        <Card className="backdrop-blur-sm bg-background/95">
          <CardHeader>
            <CardTitle className="text-lg">⚡ Risk Scenarios</CardTitle>
            <CardDescription>
              Performance in different market conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Market Scenario</TableHead>
                    <TableHead>Likely Return</TableHead>
                    <TableHead>Your Portfolio Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketScenarios.map((scenario, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {scenario.scenario}
                      </TableCell>
                      <TableCell className="text-sm">
                        {scenario.portfolioReturn}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {scenario.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dividend Projections & Goal Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="backdrop-blur-sm bg-background/95">
            <CardHeader>
              <CardTitle className="text-lg">💰 Dividend Projections</CardTitle>
              <CardDescription>
                Expected dividend income (next 12 months)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dividendProjections.map((proj, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <span className="font-medium">{proj.label}</span>
                    <span className="text-lg font-bold">
                      ₹{proj.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm font-medium">Based on:</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 ml-4">
                  <li>• Company dividend policies</li>
                  <li>• Payout ratios</li>
                  <li>• Profit growth expectations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Goal Tracking */}
          <Card className="backdrop-blur-sm bg-background/95">
            <CardHeader>
              <CardTitle className="text-lg">🎯 Goal Tracking</CardTitle>
              <CardDescription>Your investment goal progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Target by Dec 2025
                  </p>
                  <p className="text-3xl font-bold mb-2">₹15L</p>
                  <div className="space-y-1">
                    <Progress value={83} className="h-2" />
                    <p className="text-sm font-medium">₹12.46L / ₹15L (83%)</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Required Return
                    </p>
                    <p className="text-xl font-bold">+20%</p>
                    <p className="text-xs text-muted-foreground">
                      in 14 months
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Historical Returns
                    </p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      +24.5%
                    </p>
                    <p className="text-xs text-muted-foreground">annually</p>
                  </div>
                </div>
                <div className="p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Probability of hitting goal
                  </p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    75% 🟢
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
