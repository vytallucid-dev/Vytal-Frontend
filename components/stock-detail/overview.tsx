"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Eye,
  Lightbulb,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { Stock } from "@/lib/indian-stocks-data";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface OverviewProps {
  stock: Stock;
}

const Overview = ({ stock }: OverviewProps) => {
  const router = useRouter();
  const params = useParams();
  const symbol = params.symbol as string;
  const [chartPeriod, setChartPeriod] = useState("1Y");

  // Performance data
  const performanceData = {
    returns: [
      { period: "1 Month", value: 8.5, positive: true },
      { period: "6 Months", value: 18.2, positive: true },
      { period: "1 Year", value: 24.5, positive: true },
      { period: "3 Years", value: 65.8, positive: true },
    ],
    vsBenchmark: [
      { benchmark: "vs Nifty 50", value: 12.2, positive: true },
      { benchmark: "vs Bank Nifty", value: 8.5, positive: true },
      { benchmark: "vs Sector Avg", value: 6.8, positive: true },
      { benchmark: "Outperformance", value: "Strong", positive: true },
    ],
    volatility: [
      { metric: "Beta", value: "0.92", subtitle: "(Lower than market)" },
      { metric: "Avg Daily Move", value: "±1.2%", subtitle: "" },
      { metric: "52W Range", value: "₹1,420 - ₹1,950", subtitle: "" },
      { metric: "Risk Level", value: "Moderate", subtitle: "" },
    ],
    currentStatus: [
      { metric: "From 52W High", value: "-6.7%", subtitle: "" },
      { metric: "From 52W Low", value: "+28.2%", subtitle: "" },
      {
        metric: "Moving Avg Status",
        value: "Above all",
        subtitle: "(20/50/200)",
      },
      { metric: "Trend", value: "Uptrend 🟢", subtitle: "" },
    ],
  };

  // Key metrics
  const keyMetrics = [
    // Row 1 - Valuation
    {
      name: "P/E Ratio",
      value: "18.5",
      context: "vs Sector: 14.2 (Premium)",
      trend: "→",
      better: false,
    },
    {
      name: "P/B Ratio",
      value: "2.3",
      context: "vs Sector: 1.8 (Premium)",
      trend: "↗",
      better: false,
    },
    {
      name: "Market Cap",
      value: "₹12.5L Cr",
      context: "Rank: #3 in sector",
      trend: "↗",
      better: true,
    },
    {
      name: "Dividend Yield",
      value: "1.2%",
      context: "vs Sector: 2.8% (Lower)",
      trend: "→",
      better: false,
    },
    // Row 2 - Profitability
    {
      name: "ROE",
      value: "17.2%",
      context: "vs Sector: 15.8% (Better)",
      trend: "↗",
      better: true,
    },
    {
      name: "Net Margin",
      value: "24.5%",
      context: "vs Sector: 21.8% (Better)",
      trend: "↗",
      better: true,
    },
    {
      name: "ROCE",
      value: "16.8%",
      context: "vs Sector: 17.2% (Slightly lower)",
      trend: "→",
      better: false,
    },
    {
      name: "Operating Margin",
      value: "28.2%",
      context: "vs Sector: 28.5%",
      trend: "↗",
      better: true,
    },
    // Row 3 - Growth & Stability
    {
      name: "Revenue Growth",
      value: "14.2% YoY",
      context: "Sector: 12.8%",
      trend: "↗",
      better: true,
    },
    {
      name: "Profit Growth",
      value: "18.5% YoY",
      context: "Sector: 16.2%",
      trend: "↗",
      better: true,
    },
    {
      name: "Debt/Equity",
      value: "0.35",
      context: "vs Sector: 0.42 (Lower risk)",
      trend: "↘",
      better: true,
    },
    {
      name: "Interest Coverage",
      value: "9.2x",
      context: "Safe level: >3x 🟢",
      trend: "↗",
      better: true,
    },
  ];

  // Peer comparison
  const peers = [
    {
      name: stock.name,
      symbol: stock.symbol,
      price: 1820,
      health: 85,
      pe: 18.5,
      roe: 17.2,
      growth: 14.2,
      marketCap: 12.5,
      isCurrent: true,
    },
    {
      name: "ICICI Bank Ltd",
      symbol: "ICICIBANK",
      price: 1180,
      health: 82,
      pe: 16.2,
      roe: 16.8,
      growth: 16.5,
      marketCap: 8.2,
      isCurrent: false,
    },
    {
      name: "Kotak Mahindra Bank Ltd",
      symbol: "KOTAKBANK",
      price: 1950,
      health: 83,
      pe: 20.5,
      roe: 16.2,
      growth: 12.8,
      marketCap: 3.8,
      isCurrent: false,
    },
    {
      name: "Axis Bank Ltd",
      symbol: "AXISBANK",
      price: 1120,
      health: 78,
      pe: 14.8,
      roe: 14.5,
      growth: 15.2,
      marketCap: 3.4,
      isCurrent: false,
    },
  ];

  // Strengths
  const strengths = [
    "Market leader with 15% market share",
    "Consistently high ROE (17%+) for 5 years",
    "Strong asset quality (GNPA below 1%)",
    "Excellent brand and customer loyalty",
    "Digital transformation ahead of peers",
    "Low debt with comfortable leverage (D/E: 0.35)",
  ];

  // Concerns
  const concerns = [
    "Premium valuation (P/E at 18.5 vs sector 14.2)",
    "Valuation leaves little room for disappointment",
    "Growth slowing slightly (14% vs 16% last year)",
    "Increasing competition from fintech",
    "Interest rate sensitivity",
    "Lower dividend yield (1.2%) vs peers",
  ];

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

  // Health categories
  const healthCategories = [
    { name: "Profitability", score: 88, icon: "🟢", color: "text-green-500" },
    { name: "Growth", score: 82, icon: "🟢", color: "text-green-500" },
    { name: "Stability", score: 90, icon: "🟢", color: "text-green-500" },
    { name: "Efficiency", score: 85, icon: "🟢", color: "text-green-500" },
    { name: "Valuation", score: 70, icon: "🟡", color: "text-yellow-500" },
  ];

  // Price history data for chart
  const priceHistory = {
    "1M": [
      { date: "Nov 25", price: 1762 },
      { date: "Nov 27", price: 1775 },
      { date: "Nov 29", price: 1768 },
      { date: "Dec 02", price: 1785 },
      { date: "Dec 04", price: 1792 },
      { date: "Dec 06", price: 1780 },
      { date: "Dec 09", price: 1795 },
      { date: "Dec 11", price: 1802 },
      { date: "Dec 13", price: 1815 },
      { date: "Dec 16", price: 1808 },
      { date: "Dec 18", price: 1820 },
      { date: "Dec 20", price: 1812 },
      { date: "Dec 23", price: 1825 },
      { date: "Dec 25", price: 1820.5 },
    ],
    "3M": [
      { date: "Sep 25", price: 1650 },
      { date: "Oct 02", price: 1668 },
      { date: "Oct 09", price: 1685 },
      { date: "Oct 16", price: 1695 },
      { date: "Oct 23", price: 1710 },
      { date: "Oct 30", price: 1725 },
      { date: "Nov 06", price: 1740 },
      { date: "Nov 13", price: 1755 },
      { date: "Nov 20", price: 1768 },
      { date: "Nov 27", price: 1775 },
      { date: "Dec 04", price: 1792 },
      { date: "Dec 11", price: 1802 },
      { date: "Dec 18", price: 1820 },
      { date: "Dec 25", price: 1820.5 },
    ],
    "6M": [
      { date: "Jun", price: 1520 },
      { date: "Jul", price: 1545 },
      { date: "Aug", price: 1580 },
      { date: "Sep", price: 1650 },
      { date: "Oct", price: 1710 },
      { date: "Nov", price: 1768 },
      { date: "Dec", price: 1820.5 },
    ],
    "1Y": [
      { date: "Jan", price: 1460 },
      { date: "Feb", price: 1485 },
      { date: "Mar", price: 1510 },
      { date: "Apr", price: 1495 },
      { date: "May", price: 1505 },
      { date: "Jun", price: 1520 },
      { date: "Jul", price: 1545 },
      { date: "Aug", price: 1580 },
      { date: "Sep", price: 1650 },
      { date: "Oct", price: 1710 },
      { date: "Nov", price: 1768 },
      { date: "Dec", price: 1820.5 },
    ],
    "3Y": [
      { date: "Q1 '23", price: 1100 },
      { date: "Q2 '23", price: 1150 },
      { date: "Q3 '23", price: 1180 },
      { date: "Q4 '23", price: 1220 },
      { date: "Q1 '24", price: 1280 },
      { date: "Q2 '24", price: 1350 },
      { date: "Q3 '24", price: 1420 },
      { date: "Q4 '24", price: 1510 },
      { date: "Q4 '25", price: 1820.5 },
    ],
    "5Y": [
      { date: "2021", price: 850 },
      { date: "2022", price: 920 },
      { date: "2023", price: 1100 },
      { date: "2024", price: 1420 },
      { date: "2025", price: 1820.5 },
    ],
    MAX: [
      { date: "2018", price: 580 },
      { date: "2019", price: 650 },
      { date: "2020", price: 720 },
      { date: "2021", price: 850 },
      { date: "2022", price: 920 },
      { date: "2023", price: 1100 },
      { date: "2024", price: 1420 },
      { date: "2025", price: 1820.5 },
    ],
  };

  const chartConfig = {
    price: {
      label: "Price",
      color: "var(--p-mkt)",
    },
  } satisfies ChartConfig;

  return (
    <div className="mt-8 space-y-12">
      {/* SECTION 1: COMPANY IDENTITY */}
      <section id="company-identity">
        <p className="text-muted-foreground mb-6 text-lg">
          Let me introduce you to this company
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Company Card (40%) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between w-full">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 shrink-0">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <div className="w-full flex flex-col justcify-center items-end">
                <CardTitle className="text-2xl">{stock.name}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge>{stock.symbol}</Badge>
                  <Badge variant="outline">{mockData.sector}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Industry</p>
                  <p className="font-semibold">{mockData.industry}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Listed Since</p>
                  <p className="font-semibold">{mockData.listedYear}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Exchange</p>
                  <p className="font-semibold">{stock.exchange}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Market Cap
                  </span>
                  <span className="font-bold">
                    ₹{mockData.marketCap / 1000}L Cr
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    52W High
                  </span>
                  <span className="font-mono">
                    ₹{mockData.high52Week.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">52W Low</span>
                  <span className="font-mono">
                    ₹{mockData.low52Week.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Avg Volume
                  </span>
                  <span className="font-mono">
                    {(mockData.avgVolume / 100000).toFixed(1)}L shares/day
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: What They Do (60%) */}
          <Card className="lg:col-span-3 overflow-hidden relative border-2 border-primary/10 pt-0">
            {/* Decorative gradient background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

            <CardHeader className="border-b py-4 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="px-2 bg-primary/10 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  What does this company do?
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-6">
              {/* Main Business Description */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-muted hover:border-primary/30 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2 text-foreground">
                      Core Business
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {stock.symbol === "HDFCBANK" || stock.sector === "Banking"
                        ? `${
                            stock.name.split(" ")[0]
                          } Bank is one of India's largest private sector banks. They provide banking services to retail customers (you and me), small businesses, and large corporations. They make money primarily through the interest spread - borrowing at lower rates and lending at higher rates.`
                        : `${stock.name.split(" ")[0]} is a leading company in the ${
                            stock.sector
                          } sector. The company operates across multiple business segments, serving both retail and institutional customers across India.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-muted hover:border-primary/30 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2 text-foreground">
                      Revenue Model
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {stock.sector === "Banking"
                        ? "They also earn fees from services like credit cards, wealth management, transaction processing, and insurance distribution. Their business model focuses on building long-term customer relationships and cross-selling multiple financial products."
                        : `The company generates revenue through its core ${stock.sector.toLowerCase()} operations, with a strong focus on market leadership, operational efficiency, and sustainable growth. They have established a significant presence in key markets.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-muted hover:border-primary/30 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2 text-foreground">
                      Competitive Advantage
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {stock.sector === "Banking"
                        ? "With a strong brand reputation and extensive distribution network including branches, ATMs, and digital channels, they have built a loyal customer base. Their competitive advantage lies in superior asset quality, technology adoption, and customer service excellence."
                        : `The company's competitive strengths include brand recognition, distribution network, operational excellence, and continuous innovation. They maintain a strong market position through strategic investments and customer-centric approach.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expandable Section */}
              <details className="group">
                <summary className="cursor-pointer flex items-center gap-2 p-4 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all">
                  <ChevronRight className="w-4 h-4 text-primary transition-transform group-open:rotate-90" />
                  <span className="font-semibold text-primary">
                    Learn More about Business Model
                  </span>
                </summary>
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border-l-4 border-primary/50 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The company's revenue model is diversified across multiple
                    streams, reducing dependence on any single source. They
                    focus on sustainable growth while maintaining healthy profit
                    margins.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="outline" className="bg-primary/5">
                      Diversified Revenue
                    </Badge>
                    <Badge variant="outline" className="bg-primary/5">
                      Sustainable Growth
                    </Badge>
                    <Badge variant="outline" className="bg-primary/5">
                      Strong Margins
                    </Badge>
                  </div>
                </div>
              </details>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 2: HEALTH SCORE AT A GLANCE */}
      <section id="health-score">
        <p className="text-muted-foreground mb-6 text-lg">
          Here's our assessment of this company's overall health
        </p>

        <Card>
          <CardContent className="pt-6">
            {/* Top: Large Health Display */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 70 * (1 - mockData.healthScore / 100)
                    }`}
                    className="text-green-500 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold">
                    {mockData.healthScore}
                  </div>
                  <div className="text-sm text-muted-foreground">/100</div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 ">
                    Strong 🟢
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    {mockData.healthTrend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    Improved from {mockData.healthPrevious} (last quarter)
                  </span>
                </div>
                <p className="text-xl font-semibold">
                  Exceptional profitability with strong fundamentals
                </p>
                <p className="text-muted-foreground">
                  This health score reflects the company's overall financial
                  strength, combining profitability, growth prospects,
                  operational efficiency, and valuation metrics.
                </p>
              </div>
            </div>

            {/* Below: 5 Mini Health Category Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {healthCategories.map((category, index) => (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <CardContent className="pt-4 text-center">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {category.name}
                    </div>
                    <div className={`text-2xl font-bold ${category.color}`}>
                      {category.score}/100
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="text-primary"
                onClick={() =>
                  router.push(`/research/stock-screener/${symbol}?tab=health`)
                }
              >
                Want detailed breakdown? → Go to Health Score Tab
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 3: PRICE PERFORMANCE */}
      <section id="price-performance">
        <p className="text-muted-foreground mb-6 text-lg">
          Let's see how the stock has been performing
        </p>

        <Card>
          <CardContent className="pt-6">
            {/* Chart Section */}
            <div className="mb-6">
              <div className="flex justify-end gap-2 mb-4">
                {["1M", "3M", "6M", "1Y", "3Y", "5Y", "MAX"].map((period) => (
                  <Button
                    key={period}
                    variant={chartPeriod === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartPeriod(period)}
                  >
                    {period}
                  </Button>
                ))}
              </div>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <LineChart
                  data={priceHistory[chartPeriod as keyof typeof priceHistory]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "var(--muted-foreground)" }}
                    domain={["dataMin - 20", "dataMax + 20"]}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            {/* Performance Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Column 1: Returns */}
              <Card className="bg-green-500/5 border-green-500/20">
                <CardHeader>
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-green-600 dark:text-green-400">
                    Returns
                  </h4>
                </CardHeader>
                <CardContent className="space-y-2">
                  {performanceData.returns.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{item.period}:</span>
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          item.positive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-500"
                        }`}
                      >
                        +{item.value}% {item.positive && "🟢"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Column 2: vs Benchmarks */}
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardHeader>
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    vs Benchmarks
                  </h4>
                </CardHeader>
                <CardContent className="space-y-2">
                  {performanceData.vsBenchmark.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{item.benchmark}:</span>
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          item.positive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-red-500"
                        }`}
                      >
                        {typeof item.value === "number"
                          ? `+${item.value}%`
                          : item.value}{" "}
                        {item.positive && "🟢"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Column 3: Volatility */}
              <Card className="bg-purple-500/5 border-purple-500/20">
                <CardHeader>
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-purple-600 dark:text-purple-400">
                    Volatility
                  </h4>
                </CardHeader>
                <CardContent className="space-y-2">
                  {performanceData.volatility.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{item.metric}:</span>
                        <span className="font-bold">{item.value}</span>
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Column 4: Current Status */}
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardHeader>
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    Current Status
                  </h4>
                </CardHeader>
                <CardContent className="space-y-2">
                  {performanceData.currentStatus.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{item.metric}:</span>
                        <span className="font-bold">{item.value}</span>
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* AI Interpretation */}
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex gap-2">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  <span className="font-semibold">AI Interpretation:</span>{" "}
                  Stock has been a consistent outperformer, beating Nifty by 12%
                  over the last year. Currently trading near 52-week high,
                  showing strong momentum with lower volatility than market.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 4: KEY METRICS SNAPSHOT */}
      <section id="key-metrics">
        <p className="text-muted-foreground mb-6 text-lg">
          Here are the numbers that matter most
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyMetrics.map((metric, idx) => (
            <Card
              key={idx}
              className={`hover:shadow-lg transition-all cursor-pointer border-l-4 ${
                metric.better
                  ? "border-l-green-500 hover:border-l-green-600"
                  : "border-l-yellow-500 hover:border-l-yellow-600"
              }`}
            >
              <CardContent className="pt-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  {metric.name}
                </div>
                <div className="text-2xl font-bold font-mono mb-1">
                  {metric.value}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {metric.context}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{metric.trend}</span>
                  <div className="h-8 w-16 bg-muted/30 rounded flex items-end justify-around px-1">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary/50 rounded-t"
                        style={{ height: `${Math.random() * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 5: PEER COMPARISON */}
      <section id="peer-comparison">
        <p className="text-muted-foreground mb-6 text-lg">
          Let's see how it compares to competitors
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⚖️</span> Quick Peer Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">
                      Company
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Price
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Health Score
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">P/E</th>
                    <th className="text-right py-3 px-4 font-semibold">ROE</th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Growth
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Market Cap
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {peers.map((peer, idx) => (
                    <tr
                      key={idx}
                      className={`border-b hover:bg-muted/50 transition-colors ${
                        peer.isCurrent ? "bg-primary/5 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {peer.isCurrent && (
                            <ChevronRight className="w-4 h-4 text-primary" />
                          )}
                          <div>
                            <div>{peer.symbol}</div>
                            <div className="text-xs text-muted-foreground">
                              {peer.name.substring(0, 20)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        ₹{peer.price}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-500"
                        >
                          {peer.health} 🟢
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {peer.pe}
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {peer.roe}%
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {peer.growth}%
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        ₹{peer.marketCap}L Cr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-2 bg-muted/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Comparative Insights</h4>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p>
                  {stock.symbol} has highest health score and ROE in peer group
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p>Trading at premium valuation (P/E 18.5 vs peer avg 17.1)</p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p>Second largest by market cap, industry leader</p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p>Balanced growth profile - not fastest but most consistent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 6: STRENGTHS & CONCERNS */}
      <section id="strengths-concerns">
        <p className="text-muted-foreground mb-6 text-lg">
          Every stock has strengths and areas to watch. Here's what we see:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Concerns */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-5 h-5" />
                Things to Watch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {concerns.map((concern, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{concern}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 7: AI SUMMARY */}
      <section id="ai-summary">
        <p className="text-muted-foreground mb-6 text-lg">
          Putting it all together, here's what you should know:
        </p>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Lightbulb className="w-6 h-6 text-primary" />
              AI Investment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Headline */}
            <p className="text-xl font-bold">
              Strong fundamentals with premium valuation - suitable for
              quality-focused long-term investors
            </p>

            {/* Three Paragraphs */}
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h4 className="font-semibold  mb-2 text-primary">
                  Business Quality
                </h4>
                <p>
                  {stock.name} is a high-quality business with consistent
                  profitability, strong market position, and excellent
                  operational metrics. ROE of {mockData.roe}% and net margin of{" "}
                  {mockData.netMargin}% place it among the best-run{" "}
                  {stock.sector.toLowerCase()} companies in India.
                </p>
              </div>

              <div>
                <h4 className="font-semibold  mb-2 text-primary">
                  Valuation Context
                </h4>
                <p>
                  The stock trades at a premium (P/E: {mockData.pe} vs sector:
                  14.2), reflecting its quality and track record. This leaves
                  limited margin of safety - the price already factors in
                  continued excellence. Any disappointment in execution could
                  lead to valuation de-rating.
                </p>
              </div>

              <div>
                <h4 className="font-semibold  mb-2 text-primary">
                  Suitability
                </h4>
                <p>
                  Best suited for investors who prioritize quality and stability
                  over value hunting. Growth is steady rather than explosive. If
                  you're building a long-term portfolio and can handle the
                  premium pricing for a dependable compounder, this fits well.
                </p>
              </div>
            </div>

            {/* Risk-Reward Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Risk Level
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded ${
                        i <= 2 ? "bg-yellow-500" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs mt-1">Moderate (2/5)</p>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Return Potential
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded ${
                        i <= 3 ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs mt-1">Good (3/5)</p>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Time Horizon
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-semibold">Long-term</p>
                    <p className="text-xs text-muted-foreground">3-5+ years</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Suitability Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Quality Investor</Badge>
              <Badge variant="secondary">Long-term Holder</Badge>
              <Badge variant="secondary">Blue-chip Seeker</Badge>
              <Badge variant="secondary">Dividend Not Priority</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 8: WHAT'S NEXT */}
      <section id="whats-next">
        <p className="text-muted-foreground mb-6 text-lg">
          Want to dig deeper? Here's where to go:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow group">
            <CardContent className="pt-6">
              <BarChart3 className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                Understand the Business
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Deep-dive into financials, complete health breakdown, and
                historical performance analysis
              </p>
              <Button
                variant="outline"
                className="w-full group-hover:bg-primary  transition-colors"
                onClick={() =>
                  router.push(
                    `/research/stock-screener/${symbol}?tab=fundamentals`,
                  )
                }
              >
                Go to Fundamentals Tab
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow group">
            <CardContent className="pt-6">
              <DollarSign className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                Check if Price is Right
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Detailed valuation analysis, historical pricing context, and
                fair value estimation
              </p>
              <Button
                variant="outline"
                className="w-full group-hover:bg-primary  transition-colors"
                onClick={() =>
                  router.push(
                    `/research/stock-screener/${symbol}?tab=valuation`,
                  )
                }
              >
                Go to Valuation Tab
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow group">
            <CardContent className="pt-6">
              <Eye className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">See Who's Buying</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Institutional activity, promoter transactions, and ownership
                patterns
              </p>
              <Button
                variant="outline"
                className="w-full group-hover:bg-primary  transition-colors"
                onClick={() =>
                  router.push(`/research/stock-screener/${symbol}?tab=activity`)
                }
              >
                Go to Activity Tab
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Overview;
