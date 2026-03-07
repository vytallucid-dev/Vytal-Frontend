"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle,
  DollarSign,
  Heart,
  PieChart,
  RefreshCw,
  Shield,
  Target,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const PortfolioOverviewPage = () => {
  const [totalValue, setTotalValue] = useState(0);
  const [todayChange, setTodayChange] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("1Y");
  const [showInvestedLine, setShowInvestedLine] = useState(true);
  const [selectedView, setSelectedView] = useState("holding");

  // Animated count-up effect for portfolio value
  useEffect(() => {
    const targetValue = 1245800;
    const targetChange = 28500;
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = targetValue / steps;
    const changeIncrement = targetChange / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setTotalValue(Math.min(increment * currentStep, targetValue));
      setTodayChange(Math.min(changeIncrement * currentStep, targetChange));

      if (currentStep >= steps) {
        clearInterval(timer);
        setTotalValue(targetValue);
        setTodayChange(targetChange);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Chart data based on period
  const getChartData = (): Array<{
    date: string;
    value: number;
    invested: number;
    event?: string;
  }> => {
    const data1Y = [
      { date: "Jan 24", value: 850000, invested: 800000 },
      { date: "Feb", value: 920000, invested: 850000 },
      { date: "Mar", value: 780000, invested: 850000, event: "Market Dip" },
      { date: "Apr", value: 850000, invested: 850000 },
      { date: "May", value: 950000, invested: 900000 },
      { date: "Jun", value: 1020000, invested: 900000 },
      { date: "Jul", value: 1100000, invested: 950000 },
      { date: "Aug", value: 1150000, invested: 950000 },
      { date: "Sep", value: 1200000, invested: 1000000 },
      { date: "Oct", value: 1285000, invested: 1000000, event: "Peak" },
      { date: "Nov", value: 1220000, invested: 1000000 },
      { date: "Dec", value: 1245800, invested: 1000000 },
    ];

    const data3M = [
      { date: "Oct", value: 1285000, invested: 1000000 },
      { date: "Oct 15", value: 1250000, invested: 1000000 },
      { date: "Nov", value: 1220000, invested: 1000000 },
      { date: "Nov 15", value: 1230000, invested: 1000000 },
      { date: "Dec", value: 1245800, invested: 1000000 },
    ];

    const data6M = [
      { date: "Jul", value: 1100000, invested: 950000 },
      { date: "Aug", value: 1150000, invested: 950000 },
      { date: "Sep", value: 1200000, invested: 1000000 },
      { date: "Oct", value: 1285000, invested: 1000000 },
      { date: "Nov", value: 1220000, invested: 1000000 },
      { date: "Dec", value: 1245800, invested: 1000000 },
    ];

    switch (selectedPeriod) {
      case "3M":
        return data3M;
      case "6M":
        return data6M;
      case "1Y":
        return data1Y;
      default:
        return data1Y;
    }
  };

  // Holdings data for composition
  const holdingsData = [
    { name: "HDFC Bank", percentage: 14.6, value: 182000, returns: 35.2 },
    { name: "Reliance", percentage: 12.2, value: 152000, returns: 28.5 },
    { name: "Infosys", percentage: 11.1, value: 138000, returns: 18.2 },
    { name: "TCS", percentage: 10.1, value: 126000, returns: 22.1 },
    { name: "ITC", percentage: 7.4, value: 92000, returns: 15.8 },
    { name: "Bajaj Finance", percentage: 6.8, value: 85000, returns: 31.2 },
    { name: "Asian Paints", percentage: 5.2, value: 65000, returns: 12.4 },
    { name: "Maruti", percentage: 4.9, value: 61000, returns: 9.2 },
    { name: "Sun Pharma", percentage: 4.5, value: 56000, returns: 14.5 },
    { name: "Wipro", percentage: 3.8, value: 47000, returns: 6.8 },
    { name: "Others (5)", percentage: 4.8, value: 60000, returns: 10.2 },
  ];

  const sectorData = [
    { name: "Banking", percentage: 35, value: 436000, color: "#3b82f6" },
    { name: "IT Services", percentage: 25, value: 311500, color: "#10b981" },
    { name: "Automobile", percentage: 15, value: 186900, color: "#f59e0b" },
    { name: "Pharma", percentage: 12, value: 149500, color: "#8b5cf6" },
    { name: "FMCG", percentage: 8, value: 99700, color: "#ec4899" },
    { name: "Energy", percentage: 5, value: 62300, color: "#ef4444" },
  ];

  const healthData = [
    { category: "Strong (80-100)", stocks: 12, value: 1085000, percentage: 87 },
    { category: "Moderate (60-79)", stocks: 3, value: 160800, percentage: 13 },
    { category: "Weak (0-59)", stocks: 0, value: 0, percentage: 0 },
  ];

  const returnsData = [
    { category: "High (>25%)", stocks: 4, value: 420000 },
    { category: "Good (10-25%)", stocks: 7, value: 650000 },
    { category: "Moderate (0-10%)", stocks: 3, value: 138000 },
    { category: "Losers (<0%)", stocks: 1, value: 37800 },
  ];

  const getBarColor = (returns: number) => {
    if (returns > 20) return "bg-green-600 dark:bg-green-500";
    if (returns > 10) return "bg-green-400 dark:bg-green-600";
    if (returns > 0) return "bg-yellow-500 dark:bg-yellow-600";
    return "bg-red-500 dark:bg-red-600";
  };

  // Top 5 Holdings Data
  const topHoldings = [
    {
      name: "HDFC Bank",
      value: 182000,
      percentage: 14.6,
      shares: 50,
      avgCost: 1640,
      currentPrice: 1820,
      returnPercent: 10.98,
      todayChange: 3.2,
      health: 82,
    },
    {
      name: "Reliance Industries",
      value: 165000,
      percentage: 13.2,
      shares: 60,
      avgCost: 2450,
      currentPrice: 2750,
      returnPercent: 12.24,
      todayChange: -1.8,
      health: 78,
    },
    {
      name: "TCS",
      value: 158000,
      percentage: 12.7,
      shares: 40,
      avgCost: 3680,
      currentPrice: 3950,
      returnPercent: 7.34,
      todayChange: 2.1,
      health: 85,
    },
    {
      name: "Infosys",
      value: 142000,
      percentage: 11.4,
      shares: 80,
      avgCost: 1620,
      currentPrice: 1775,
      returnPercent: 9.57,
      todayChange: 1.5,
      health: 80,
    },
    {
      name: "ICICI Bank",
      value: 128000,
      percentage: 10.3,
      shares: 100,
      avgCost: 1180,
      currentPrice: 1280,
      returnPercent: 8.47,
      todayChange: 0.8,
      health: 79,
    },
  ];

  const portfolioStats = {
    totalValue: 125430.5,
    todayChange: 2450.3,
    todayChangePercent: 1.98,
    totalGainLoss: 15230.5,
    totalGainLossPercent: 13.78,
    totalInvested: 110200.0,
  };

  const healthScore = {
    overall: 7.8,
    categories: [
      { name: "Financial Health", score: 8.2, icon: DollarSign },
      { name: "Growth Potential", score: 7.5, icon: TrendingUp },
      { name: "Risk Management", score: 7.8, icon: Shield },
      { name: "Diversification", score: 8.0, icon: PieChart },
    ],
    distribution: {
      excellent: 40,
      good: 35,
      average: 20,
      poor: 5,
    },
  };

  // Action Items Data
  const actionItems = [
    {
      priority: "HIGH",
      category: "Health Alert",
      title: "Tech Mahindra health score dropped from 75 to 68",
      context: "Asset quality concerns, margin pressure",
      actions: ["Review Stock", "Set Alert"],
    },
    {
      priority: "MEDIUM",
      category: "Valuation",
      title: "2 stocks trading near 52-week highs",
      context: "HDFC Bank, TCS - consider partial profit booking",
      actions: ["View Stocks", "Set Targets"],
    },
    {
      priority: "MEDIUM",
      category: "Upcoming Event",
      title: "3 stocks announcing results in next 7 days",
      context: "HDFC (Oct 25), Reliance (Oct 28), Infosys (Oct 30)",
      actions: ["View Calendar", "Set Reminders"],
    },
    {
      priority: "LOW",
      category: "Rebalancing",
      title: "Banking sector overweight by 5%",
      context: "Target: 30%, Current: 35%",
      actions: ["View Rebalancing Tool", "Ignore"],
    },
    {
      priority: "LOW",
      category: "Opportunity",
      title: "3 watchlist stocks in buy zone",
      context: "Based on your criteria and health scores",
      actions: ["View Watchlist", "Analyze"],
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: PORTFOLIO HERO
          "Here's your complete investment picture"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="portfolio-hero" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Here's your complete investment picture
        </p>

        {/* Center Display - Total Portfolio Value */}
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-sm">
          <CardContent className="pt-10 pb-8">
            <div className="text-center space-y-6">
              {/* Total Portfolio Value - Massive Display */}
              <div>
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
                  Total Portfolio Value
                </p>
                <h1
                  className="text-6xl md:text-7xl font-bold font-serif tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
                  style={{ fontFamily: "Fraunces, serif" }}
                >
                  {formatCurrency(totalValue)}
                </h1>
              </div>

              {/* Today's Change */}
              <div className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-semibold">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <TrendingUp className="w-8 h-8" />
                  <span>+{formatCurrency(todayChange)}</span>
                  <span className="text-xl">(+2.35%)</span>
                </div>
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 text-sm">
                  Today
                </Badge>
              </div>

              {/* Quick Status Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm bg-background/50"
                >
                  <span className="font-semibold mr-1">15</span> Holdings
                </Badge>
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm bg-background/50"
                >
                  <span className="font-semibold mr-1">5</span> Sectors
                </Badge>
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm bg-green-50 dark:bg-green-950/30 border-green-500/30"
                >
                  <span className="font-semibold mr-1">82</span> Avg Health 🟢
                </Badge>
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm bg-blue-50 dark:bg-blue-950/30 border-blue-500/30"
                >
                  <span className="font-semibold mr-1">+24.5%</span> YTD
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Four Key Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Value
                </CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold">
                ${portfolioStats.totalValue.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-500 font-medium">
                  +${portfolioStats.todayChange.toFixed(2)} (
                  {portfolioStats.todayChangePercent}%) today
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Returns
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-green-600">
                +${portfolioStats.totalGainLoss.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-green-500 font-medium">
                  +{portfolioStats.totalGainLossPercent}% overall return
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Invested
                </CardTitle>
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold">
                ${portfolioStats.totalInvested.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Across {topHoldings.length} positions
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Health Score
                </CardTitle>
                <Heart className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold">{healthScore.overall}/10</div>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-500 font-medium">
                  Healthy portfolio
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: PORTFOLIO AT A GLANCE
          "Here's what's happening in your portfolio right now"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="portfolio-glance" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Here's what's happening in your portfolio right now
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            💡 Quick Insights
          </h2>
        </div>

        {/* Grid of 4 Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CARD 1: Today's Movers */}
          <Card className="border-border/50 bg-gradient-to-br from-blue-50/30 to-background dark:from-blue-950/10 hover:shadow-lg transition-shadow ">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-lg">Today's Movers</h3>
                </div>

                {/* Content */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900/30">
                    <div>
                      <p className="font-medium">Top Gainer</p>
                      <p className="text-xs text-muted-foreground">HDFC Bank</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        +3.2%
                      </p>
                      <p className="text-xs text-muted-foreground">+₹2,940</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900/30">
                    <div>
                      <p className="font-medium">Top Loser</p>
                      <p className="text-xs text-muted-foreground">Infosys</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        -0.5%
                      </p>
                      <p className="text-xs text-muted-foreground">-₹690</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                    <p className="font-medium">Net Impact</p>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      +₹28,500 🟢
                    </p>
                  </div>
                </div>

                {/* Action */}
                <Button
                  variant="ghost"
                  className="w-full justify-between group/btn hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <span>View All Holdings</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: Health Update */}
          <Card className="border-border/50 bg-gradient-to-br from-green-50/30 to-background dark:from-green-950/10 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-lg">Health Update</h3>
                </div>

                {/* Content */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>Improved</span>
                    </div>
                    <span className="font-semibold">3 stocks</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    HDFC, TCS, Reliance
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>Declined</span>
                    </div>
                    <span className="font-semibold">1 stock</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Tech Mahindra
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                      <span>Stable</span>
                    </div>
                    <span className="font-semibold">11 stocks</span>
                  </div>

                  <div className="mt-4 p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900/30">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400">
                      📊 Trend: Improving overall 🟢
                    </p>
                  </div>
                </div>

                {/* Action */}
                <Button
                  variant="ghost"
                  className="w-full justify-between group/btn hover:bg-green-50 dark:hover:bg-green-950/20"
                >
                  <span>View Health Tab</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: Upcoming Events */}
          <Card className="border-border/50 bg-gradient-to-br from-purple-50/30 to-background dark:from-purple-950/10 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-lg">Upcoming Events</h3>
                </div>

                {/* Content */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                    <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 min-w-[4rem]">
                      Oct 25
                    </div>
                    <div>
                      <p className="font-medium">HDFC Results</p>
                      <p className="text-xs text-muted-foreground">
                        Quarterly earnings
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                    <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 min-w-[4rem]">
                      Oct 28
                    </div>
                    <div>
                      <p className="font-medium">Reliance Results</p>
                      <p className="text-xs text-muted-foreground">
                        Quarterly earnings
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                    <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 min-w-[4rem]">
                      Nov 5
                    </div>
                    <div>
                      <p className="font-medium">TCS Dividend</p>
                      <p className="text-xs text-muted-foreground">
                        Ex-dividend date
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-900/30">
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-400">
                      📅 8 events in next 30 days
                    </p>
                  </div>
                </div>

                {/* Action */}
                <Button
                  variant="ghost"
                  className="w-full justify-between group/btn hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <span>View All Events</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: Action Items */}
          <Card className="border-border/50 bg-gradient-to-br from-orange-50/30 to-background dark:from-orange-950/10 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-lg">Action Items</h3>
                </div>

                {/* Content */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                    <p>
                      <span className="font-semibold">2 stocks</span> near 52W
                      high{" "}
                      <span className="text-xs text-muted-foreground">
                        (consider booking)
                      </span>
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <p>
                      <span className="font-semibold">1 stock</span> health
                      dropped below 70
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    <p>
                      <span className="font-semibold">3 dividend</span> payouts
                      this month
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    <p>Review portfolio allocation</p>
                  </div>

                  <div className="mt-4 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md border border-orange-200 dark:border-orange-900/30">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                      ⚠️ 4 items need your attention
                    </p>
                  </div>
                </div>

                {/* Action */}
                <Button
                  variant="ghost"
                  className="w-full justify-between group/btn hover:bg-orange-50 dark:hover:bg-orange-950/20"
                >
                  <span>View Recommendations</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: PORTFOLIO VALUE CHART
          "Let's see how your portfolio value has grown"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="portfolio-value-chart" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Let's see how your portfolio value has grown
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📈 Portfolio Growth
          </h2>
        </div>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardContent className="pt-6 pb-6">
            {/* Period Toggles */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex gap-2">
                {["1M", "3M", "6M", "1Y", "3Y", "5Y", "ALL"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                      selectedPeriod === period
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowInvestedLine(!showInvestedLine)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={showInvestedLine}
                  onChange={() => setShowInvestedLine(!showInvestedLine)}
                  className="rounded"
                />
                Show Invested Amount
              </button>
            </div>

            {/* Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={getChartData()}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="date"
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
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [formatCurrency(value), "Value"]}
                  />
                  {showInvestedLine && (
                    <Line
                      type="monotone"
                      dataKey="invested"
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      dot={false}
                      strokeWidth={2}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                  {getChartData()
                    .filter((d) => d.event)
                    .map((point, idx) => (
                      <ReferenceDot
                        key={idx}
                        x={point.date}
                        y={point.value}
                        r={6}
                        fill="#f59e0b"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {/* Starting Value */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground mb-2">
                  Starting Value
                </p>
                <p className="text-sm font-semibold mb-1">Jan 1, 2024</p>
                <p className="text-2xl font-bold">₹8,50,000</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invested: ₹8,00,000
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  +₹50,000 (+6.25%)
                </p>
              </div>

              {/* Current Value */}
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
                <p className="text-xs text-muted-foreground mb-2">
                  Current Value
                </p>
                <p className="text-sm font-semibold mb-1">Today</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹12,45,800
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invested: ₹10,00,000
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-semibold">
                  +₹2,45,800 (+24.58%)
                </p>
              </div>

              {/* Peak Value */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                <p className="text-xs text-muted-foreground mb-2">Peak Value</p>
                <p className="text-sm font-semibold mb-1">Oct 12, 2024</p>
                <p className="text-2xl font-bold">₹12,85,000</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Distance: -3.05%
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  Near all-time high
                </p>
              </div>

              {/* Worst Drawdown */}
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900/30">
                <p className="text-xs text-muted-foreground mb-2">
                  Worst Drawdown
                </p>
                <p className="text-sm font-semibold mb-1">Mar 15, 2024</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  -8.5%
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Fully recovered 🟢
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  45 days to recover
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: PORTFOLIO COMPOSITION
          "Here's how your investments are distributed"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="portfolio-composition" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Here's how your investments are distributed
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🎯 Portfolio Allocation
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT COLUMN - Visual Breakdowns */}
          <div className="lg:col-span-3">
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
              <CardContent className="pt-6 pb-6">
                {/* Tab Toggle */}
                <div className="flex gap-2 mb-6 border-b border-border/30 overflow-x-auto">
                  {[
                    { id: "holding", label: "By Holding" },
                    { id: "sector", label: "By Sector" },
                    { id: "health", label: "By Health" },
                    { id: "returns", label: "By Returns" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedView(tab.id)}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        selectedView === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* VIEW 1 - By Holding */}
                {selectedView === "holding" && (
                  <div className="space-y-3">
                    {holdingsData.map((holding, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{holding.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">
                              {formatCurrency(holding.value)}
                            </span>
                            <span className="font-semibold min-w-[3rem] text-right">
                              {holding.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="relative w-full h-6 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getBarColor(
                              holding.returns,
                            )} transition-all duration-500`}
                            style={{ width: `${holding.percentage * 6}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* VIEW 2 - By Sector */}
                {selectedView === "sector" && (
                  <div className="space-y-4">
                    {/* Donut Chart Visualization */}
                    <div className="relative h-64 flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        <svg
                          viewBox="0 0 100 100"
                          className="w-full h-full -rotate-90"
                        >
                          {(() => {
                            let currentAngle = 0;
                            return sectorData.map((sector, idx) => {
                              const angle = (sector.percentage / 100) * 360;
                              const largeArc = angle > 180 ? 1 : 0;
                              const x1 =
                                50 +
                                40 * Math.cos((currentAngle * Math.PI) / 180);
                              const y1 =
                                50 +
                                40 * Math.sin((currentAngle * Math.PI) / 180);
                              currentAngle += angle;
                              const x2 =
                                50 +
                                40 * Math.cos((currentAngle * Math.PI) / 180);
                              const y2 =
                                50 +
                                40 * Math.sin((currentAngle * Math.PI) / 180);

                              return (
                                <path
                                  key={idx}
                                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={sector.color}
                                  opacity={0.8}
                                  className="hover:opacity-100 transition-opacity cursor-pointer"
                                />
                              );
                            });
                          })()}
                          <circle
                            cx="50"
                            cy="50"
                            r="25"
                            fill="hsl(var(--background))"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold">6</p>
                            <p className="text-xs text-muted-foreground">
                              Sectors
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sector List */}
                    <div className="space-y-2">
                      {sectorData.map((sector, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-md transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: sector.color }}
                            />
                            <span className="font-medium">{sector.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-sm">
                              {formatCurrency(sector.value)}
                            </span>
                            <span className="font-semibold min-w-[3rem] text-right">
                              {sector.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIEW 3 - By Health Score */}
                {selectedView === "health" && (
                  <div className="space-y-4">
                    {healthData.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.category}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {item.stocks} stocks
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(item.value)}
                            </span>
                            <span className="text-muted-foreground">
                              ({item.percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="relative w-full h-8 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              idx === 0
                                ? "bg-green-500"
                                : idx === 1
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            } transition-all duration-500 flex items-center justify-center text-xs font-semibold text-white`}
                            style={{ width: `${item.percentage}%` }}
                          >
                            {item.percentage > 10 && `${item.percentage}%`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* VIEW 4 - By Returns */}
                {selectedView === "returns" && (
                  <div className="space-y-4">
                    {returnsData.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-border/30 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{item.category}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.stocks} stocks
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="relative w-full h-6 bg-muted/30 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  idx === 0
                                    ? "bg-green-600"
                                    : idx === 1
                                      ? "bg-green-400"
                                      : idx === 2
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                } transition-all duration-500`}
                                style={{
                                  width: `${(item.value / 1245800) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="font-bold min-w-[5rem] text-right">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Key Stats */}
          <div className="lg:col-span-2 space-y-4">
            {/* CARD 1: Diversification Score */}
            <Card className="border-border/50 bg-gradient-to-br from-green-50/30 to-background dark:from-green-950/10">
              <CardContent className="pt-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <PieChart className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        Diversification Score
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold">78/100</span>
                        <Badge className="bg-green-500 text-white">🟢</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rating</span>
                      <span className="font-semibold">Well Diversified</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sectors</span>
                      <span className="font-semibold">6</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Top holding</span>
                      <span className="font-semibold">14.6%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Risk</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        Low concentration
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2: Sector Weights */}
            <Card className="border-border/50 bg-gradient-to-br from-blue-50/30 to-background dark:from-blue-950/10">
              <CardContent className="pt-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Sector Weights</h3>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground mb-3">
                      Top 3 sectors by allocation:
                    </p>
                    {sectorData.slice(0, 3).map((sector, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-muted/20 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-muted-foreground">
                            {idx + 1}.
                          </span>
                          <span className="font-medium">{sector.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">
                            {sector.percentage}%
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            (₹{(sector.value / 100000).toFixed(2)}L)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border/30">
                    <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                      💡 Good balance, consider adding pharma exposure
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 3: Rebalancing Check */}
            <Card className="border-border/50 bg-gradient-to-br from-orange-50/30 to-background dark:from-orange-950/10">
              <CardContent className="pt-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Rebalancing Check</h3>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Last rebalanced
                      </span>
                      <span className="font-semibold">45 days ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Current drift
                      </span>
                      <span className="font-semibold">8% from target</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                        🟡 Consider rebalancing
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-md border border-orange-200 dark:border-orange-900/30">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                      ⚠️ Banking overweight by 5%
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full justify-between group/btn"
                  >
                    <span>View Rebalancing Tool</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: TOP HOLDINGS SNAPSHOT
          "Your largest investments at a glance"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="top-holdings-snapshot" className="space-y-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Your largest investments at a glance
            </p>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🏆 Top 5 Holdings
            </h2>
          </div>

          {/* View All Button */}
          <div className="flex justify-center mt-4">
            <Button variant="outline" className="group/viewall">
              <span>View All 15 Holdings</span>
              <ArrowRight className="ml-2 w-4 h-4 group-hover/viewall:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin custom-scrollbar ">
            {topHoldings.map((holding, idx) => (
              <Card
                key={idx}
                className={`min-w-[280px] md:min-w-[300px] snap-start border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  holding.returnPercent >= 0
                    ? "border-green-500/30 bg-gradient-to-br from-green-50/20 to-background dark:from-green-950/10"
                    : "border-red-500/30 bg-gradient-to-br from-red-50/20 to-background dark:from-red-950/10"
                }`}
              >
                <CardContent className="pt-5 pb-5">
                  {/* Header */}
                  <div className="space-y-1 mb-4">
                    <h3 className="font-bold text-lg">{holding.name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">
                        {formatCurrency(holding.value)}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {holding.percentage}% of portfolio
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/30 my-3" />

                  {/* Holdings Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Holdings</span>
                      <span className="font-medium">
                        {holding.shares} shares @ ₹{holding.avgCost} avg
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          ₹{holding.currentPrice}
                        </span>
                        <span
                          className={`font-semibold ${
                            holding.returnPercent >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          ({holding.returnPercent >= 0 ? "+" : ""}
                          {holding.returnPercent}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Today</span>
                      <span
                        className={`font-semibold ${
                          holding.todayChange >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {holding.todayChange >= 0 ? "+" : ""}
                        {holding.todayChange}%{" "}
                        {holding.todayChange >= 0 ? "🟢" : "🔴"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Health</span>
                      <Badge
                        className={`${
                          holding.health >= 80
                            ? "bg-green-500 text-white"
                            : holding.health >= 60
                              ? "bg-yellow-500 text-white"
                              : "bg-red-500 text-white"
                        }`}
                      >
                        {holding.health}/100{" "}
                        {holding.health >= 80
                          ? "🟢"
                          : holding.health >= 60
                            ? "🟡"
                            : "🔴"}
                      </Badge>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/30 my-3" />

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1 text-xs">
                      Trade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: RETURNS BREAKDOWN
          "Here's how your returns break down"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="returns-breakdown" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Here's how your returns break down
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            💰 Returns Analysis
          </h2>
        </div>

        {/* TOP ROW: Quick Return Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: Realized Gains */}
          <Card className="border-border/50 bg-gradient-to-br from-green-50/30 to-background dark:from-green-950/10">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Realized Gains
                  </h3>
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹45,200
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    From 8 stocks sold
                  </p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tax Paid (LTCG)
                    </span>
                    <span className="font-medium">₹4,520</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/30">
                    <span className="font-semibold">Net Received</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      ₹40,680
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: Unrealized Gains */}
          <Card className="border-border/50 bg-gradient-to-br from-blue-50/30 to-background dark:from-blue-950/10">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Unrealized Gains
                  </h3>
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₹2,45,800
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Holdings: 15 stocks
                  </p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Potential Tax (if sold)
                    </span>
                    <span className="font-medium">₹24,580</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/30">
                    <span className="font-semibold">Net if sold today</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      ₹2,21,220
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: Dividend Income */}
          <Card className="border-border/50 bg-gradient-to-br from-purple-50/30 to-background dark:from-purple-950/10">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Dividend Income
                  </h3>
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ₹12,400
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    YTD from 8 stocks
                  </p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Status</span>
                    <span className="font-medium">TDS deducted</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/30">
                    <span className="font-semibold">Next Expected (Nov)</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      ₹2,800
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: Total Returns */}
          <Card className="border-border/50 bg-gradient-to-br from-orange-50/30 to-background dark:from-orange-950/10 border-2 border-orange-500/30">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Total Returns
                  </h3>
                  <span className="text-xl">🎯</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ₹3,03,400
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                    +30.34% overall return
                  </p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capital Gains</span>
                    <span className="font-medium">₹2,91,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dividends</span>
                    <span className="font-medium">₹12,400</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/30">
                    <span className="font-semibold">Total Earnings</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      ₹3,03,400
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WATERFALL CHART */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardContent className="pt-6 pb-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Return Waterfall: How You Got Here
            </h3>

            <div className="relative h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Starting", value: 1000000, fill: "#64748b" },
                    { name: "Top Gainers", value: 180000, fill: "#10b981" },
                    { name: "Mid Gainers", value: 85000, fill: "#34d399" },
                    { name: "Losers", value: -38200, fill: "#ef4444" },
                    { name: "Dividends", value: 12400, fill: "#8b5cf6" },
                    { name: "Current", value: 1245800, fill: "#f59e0b" },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickFormatter={(value) =>
                      `₹${(value / 100000).toFixed(1)}L`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--primary)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                    formatter={(value: any) => {
                      const isGain = value >= 0;

                      return [
                        <span
                          style={{
                            color: isGain ? "green" : "red",
                            fontWeight: 600,
                          }}
                        >
                          {formatCurrency(Math.abs(value))}
                        </span>,
                        <span
                          style={{
                            color: isGain ? "green" : "red",
                          }}
                        >
                          {isGain ? "Gain" : "Loss"}
                        </span>,
                      ];
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {[
                      { name: "Starting", value: 1000000, fill: "#64748b" },
                      { name: "Top Gainers", value: 180000, fill: "#10b981" },
                      { name: "Mid Gainers", value: 85000, fill: "#34d399" },
                      { name: "Losers", value: -38200, fill: "#ef4444" },
                      { name: "Dividends", value: 12400, fill: "#8b5cf6" },
                      { name: "Current", value: 1245800, fill: "#f59e0b" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Waterfall Legend */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-500 rounded" />
                <span>Starting (₹10L)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Top Gainers (+₹1.8L)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded" />
                <span>Mid Gainers (+₹85K)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>Losers (-₹38K)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span>Dividends (+₹12K)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded" />
                <span>Current (₹12.5L)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 7: RECOMMENDATIONS & ALERTS
          "Here's what you should pay attention to"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="recommendations-alerts" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Here's what you should pay attention to
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            ⚠️ Action Items & Recommendations
          </h2>
        </div>

        <div className="space-y-4">
          {actionItems.map((item, idx) => (
            <Card
              key={idx}
              className={`border-l-4 transition-all duration-300 hover:shadow-md ${
                item.priority === "HIGH"
                  ? "border-l-red-500 bg-gradient-to-r from-red-50/30 to-background dark:from-red-950/10"
                  : item.priority === "MEDIUM"
                    ? "border-l-yellow-500 bg-gradient-to-r from-yellow-50/30 to-background dark:from-yellow-950/10"
                    : "border-l-blue-500 bg-gradient-to-r from-blue-50/30 to-background dark:from-blue-950/10"
              }`}
            >
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  {/* Left Content */}
                  <div className="flex-1 space-y-1">
                    {/* Priority & Category */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`text-xs py-0 ${
                          item.priority === "HIGH"
                            ? "bg-red-500 text-white"
                            : item.priority === "MEDIUM"
                              ? "bg-yellow-500 text-white"
                              : "bg-blue-500 text-white"
                        }`}
                      >
                        {item.priority} PRIORITY
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm">{item.title}</h3>

                    {/* Context */}
                    <p className="text-xs text-muted-foreground">
                      {item.context}
                    </p>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col gap-1.5">
                    {item.actions.map((action, actionIdx) => (
                      <Button
                        key={actionIdx}
                        variant={actionIdx === 0 ? "default" : "outline"}
                        size="sm"
                        className="text-xs whitespace-nowrap h-7"
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Message */}
        <Card className="border-border/50 bg-gradient-to-r from-slate-50 to-background dark:from-slate-900/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    You're all caught up! 🎉
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No critical actions required right now. Keep monitoring your
                    portfolio.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Refresh Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 8: PORTFOLIO HEALTH SUMMARY
          "How healthy is your portfolio overall?"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="portfolio-health-summary" className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            How healthy is your portfolio overall?
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🎯 Portfolio Health Score
          </h2>
        </div>

        <Card className="border-border/50 bg-gradient-to-br from-green-50/30 to-background dark:from-green-950/10">
          <CardContent className="pt-8 pb-8">
            {/* Large Health Score Display */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                {/* Circular Progress Indicator */}
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/20"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(82 / 100) * 351.86} 351.86`}
                      className="text-green-500 transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold">82</p>
                      <p className="text-xs text-muted-foreground">/100</p>
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <Badge className="bg-green-500/30 border border-green-500 text-green-100 mb-2">
                    Strong 🟢
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      ↗ +4 points
                    </span>{" "}
                    (last quarter)
                  </p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Top 15% of all portfolios
                  </p>
                </div>
              </div>
            </div>

            {/* 5 Category Mini-Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {/* Profitability */}
              <div className="p-4 bg-background/50 border border-green-500/40 rounded-lg  hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-primary">
                    PROFITABILITY
                  </span>
                  <span className="text-green-600 dark:text-green-400">🟢</span>
                </div>
                <p className="text-2xl font-bold mb-1">85/100</p>
                <p className="text-xs text-muted-foreground">
                  Avg ROE: 16.5% across holdings
                </p>
              </div>

              {/* Growth */}
              <div className="p-4 bg-background/50 rounded-lg border border-green-500/40 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-primary">
                    GROWTH
                  </span>
                  <span className="text-green-600 dark:text-green-400">🟢</span>
                </div>
                <p className="text-2xl font-bold mb-1">80/100</p>
                <p className="text-xs text-muted-foreground">
                  Portfolio growing 18.5% YoY
                </p>
              </div>

              {/* Stability */}
              <div className="p-4 bg-background/50 rounded-lg border border-green-500/40 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-primary">
                    STABILITY
                  </span>
                  <span className="text-green-600 dark:text-green-400">🟢</span>
                </div>
                <p className="text-2xl font-bold mb-1">88/100</p>
                <p className="text-xs text-muted-foreground">
                  Low debt, strong balance sheets
                </p>
              </div>

              {/* Efficiency */}
              <div className="p-4 bg-background/50 rounded-lg border border-green-500/40 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-primary">
                    EFFICIENCY
                  </span>
                  <span className="text-green-600 dark:text-green-400">🟢</span>
                </div>
                <p className="text-2xl font-bold mb-1">82/100</p>
                <p className="text-xs text-muted-foreground">
                  High cash conversion across stocks
                </p>
              </div>

              {/* Valuation */}
              <div className="p-4 bg-background/50 rounded-lg border border-yellow-500/40 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-primary">
                    VALUATION
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-400">
                    🟡
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1">72/100</p>
                <p className="text-xs text-muted-foreground">
                  Some premium valuations
                </p>
              </div>
            </div>

            {/* Health Distribution */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
              <h3 className="font-semibold mb-3">Your Holdings by Health:</h3>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span>Strong (80-100)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">12 stocks</span>
                    <span className="font-semibold">80% of value</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded" />
                    <span>Moderate (60-79)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">3 stocks</span>
                    <span className="font-semibold">20% of value</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span>Weak (0-59)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">0 stocks</span>
                    <span className="font-semibold">0% of value</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900/30 mb-4">
                <p className="text-sm text-green-700 dark:text-green-400">
                  💡 <strong>Interpretation:</strong> Excellent portfolio
                  health. 80% of your investments are in strong companies.
                  Consider reviewing the 3 moderate stocks.
                </p>
              </div>

              <Button className="w-full" variant="gradient">
                <Link
                  href="?tab=health"
                  className="w-full flex justify-center items-center gap-2"
                >
                  View Detailed Health Analysis
                  <span>View Detailed Health Analysis</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 10: WHAT'S NEXT
          "Want to dig deeper? Here's where to go:"
      ═══════════════════════════════════════════════════════════════ */}
      <div id="whats-next" className="space-y-4 mb-20">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Want to dig deeper? Here's where to go:
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🧭 Quick Navigation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: Check Portfolio Health */}
          <Card className="border-primary/30 bg-gradient-to-br from-green-50/30 to-background dark:from-green-950/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center text-4xl">
                  🎯
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    Check Portfolio Health
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Deep-dive into health scores across all holdings
                  </p>
                </div>
                <Button
                  variant="gradient"
                  className="w-full group-hover:bg-green-50 dark:group-hover:bg-green-950/20"
                >
                  <Link
                    href="?tab=health"
                    className="w-full flex justify-center items-center gap-2"
                  >
                    <span>Go to Health Tab</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: View All Holdings */}
          <Card className="border-primary/30 bg-gradient-to-br from-blue-50/30 to-background dark:from-blue-950/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center text-4xl">
                  📊
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">View All Holdings</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed view of each stock with metrics
                  </p>
                </div>
                <Button
                  variant="gradient"
                  className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20"
                >
                 <Link
                    href="?tab=holdings"
                    className="w-full flex justify-center items-center gap-2"
                  >
                    <span>Go to Holdings Tab</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: Analyze Performance */}
          <Card className="border-primary/30 bg-gradient-to-br from-purple-50/30 to-background dark:from-purple-950/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center text-4xl">
                  📈
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    Analyze Performance
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Returns, benchmarks, and attribution analysis
                  </p>
                </div>
                <Button
                  variant="gradient"
                  className="w-full group-hover:bg-purple-50 dark:group-hover:bg-purple-950/20"
                >
                  <Link
                    href="?tab=analytics"
                    className="w-full flex justify-center items-center gap-2"
                  >
                    <span>Go to Analytics Tab</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: Review History */}
          <Card className="border-primary/30 bg-gradient-to-br from-orange-50/30 to-background dark:from-orange-950/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center text-4xl">
                  📜
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Review History</h3>
                  <p className="text-sm text-muted-foreground">
                    Transaction history and portfolio evolution
                  </p>
                </div>
                <Button
                  variant="gradient"
                  className="w-full group-hover:bg-orange-50 dark:group-hover:bg-orange-950/20"
                >
                  <Link
                    href="?tab=history"
                    className="w-full flex justify-center items-center gap-2"
                  >
                    <span>Go to History Tab</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverviewPage;
