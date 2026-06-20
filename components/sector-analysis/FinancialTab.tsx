"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart,
  CheckCircle,
  DollarSign,
  Info,
  Minus,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PiggyBank,
  BarChart3,
  Building2,
  Shield,
  Activity,
  Award,
  ChevronRight,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";

const financialData = {
  story: {
    growth: {
      title: "Growth & Scale",
      content:
        "Strong double-digit growth with profit outpacing revenue by 4.3%. Sector is in expansion mode with improving unit economics.",
    },
    profitability: {
      title: "Profitability Trend",
      content:
        "Net margins up 2.3 percentage points to 21.8%. Operating leverage and better pricing power driving this improvement.",
    },
    stability: {
      title: "Financial Stability",
      content:
        "Average D/E of 0.4 is comfortable. Strong cash conversion of 1.15x shows profits are real, not just paper gains.",
    },
  },

  quarterlyData: [
    { quarter: "Q1 23", revenue: 165, profit: 320 },
    { quarter: "Q2 23", revenue: 172, profit: 340 },
    { quarter: "Q3 23", revenue: 168, profit: 330 },
    { quarter: "Q4 23", revenue: 175, profit: 355 },
    { quarter: "Q1 24", revenue: 170, profit: 355 },
    { quarter: "Q2 24", revenue: 180, profit: 390 },
    { quarter: "Q3 24", revenue: 190, profit: 425 },
    { quarter: "Q4 24", revenue: 210, profit: 480 },
  ],

  recentQuarters: [
    {
      quarter: "Q4 FY24",
      revenue: "₹2.1L Cr (+12%)",
      profit: "₹480 Cr (+15%)",
    },
    {
      quarter: "Q3 FY24",
      revenue: "₹1.9L Cr (+10%)",
      profit: "₹425 Cr (+12%)",
    },
    {
      quarter: "Q2 FY24",
      revenue: "₹1.8L Cr (+14%)",
      profit: "₹390 Cr (+18%)",
    },
    { quarter: "Q1 FY24", revenue: "₹1.7L Cr (+9%)", profit: "₹355 Cr (+11%)" },
  ],

  growthInsights: [
    "Consistent double-digit growth for 6 straight quarters",
    "Profit growing 4-5% faster than revenue (margin gain)",
    "Q2 spike driven by festive season demand",
    "Growth accelerating - 14% current vs 10% year ago",
  ],

  margins: {
    gross: { value: 45.2, change: "+1.8", trend: "up" },
    operating: { value: 28.5, change: "+2.1", trend: "up" },
    ebitda: { value: 32.8, change: "+1.9", trend: "up" },
    net: { value: 21.8, change: "+2.3", trend: "up" },
  },

  marginTrend: [
    { quarter: "Q1 23", value: 19.2 },
    { quarter: "Q2 23", value: 19.8 },
    { quarter: "Q3 23", value: 19.6 },
    { quarter: "Q4 23", value: 20.3 },
    { quarter: "Q1 24", value: 20.9 },
    { quarter: "Q2 24", value: 21.7 },
    { quarter: "Q3 24", value: 22.4 },
    { quarter: "Q4 24", value: 22.8 },
  ],

  marginSpread: {
    best: 28.5,
    average: 21.8,
    worst: 14.2,
    spread: 14.3,
    aboveAverage: 8,
    total: 12,
  },

  returnMetrics: [
    {
      name: "Return on Equity (ROE)",
      value: "15.8%",
      change: "+1.2 pts",
      trend: "up",
      range: "12.2% to 18.5%",
      context: "Top quartile in market",
      icon: Target,
    },
    {
      name: "Return on Capital Employed (ROCE)",
      value: "17.2%",
      change: "+1.5 pts",
      trend: "up",
      range: "vs Cost: +5.4 pts",
      context: "Creating economic value",
      icon: TrendingUp,
    },
    {
      name: "Return on Assets (ROA)",
      value: "12.5%",
      change: "+0.8 pts",
      trend: "up",
      range: "Asset utilization: Efficient",
      context: "Better than 70% of sectors",
      icon: Award,
    },
    {
      name: "Asset Turnover",
      value: "0.82x",
      change: "Stable",
      trend: "stable",
      range: "Revenue per ₹1 of assets",
      context: "Moderate capital intensity",
      icon: Activity,
    },
    {
      name: "Working Capital Efficiency",
      value: "45 days",
      change: "Improving",
      trend: "up",
      range: "Cash conversion improving",
      context: "Better than last year's 52 days",
      icon: BarChart3,
    },
    {
      name: "Cash Conversion",
      value: "1.15x",
      change: "Strengthening",
      trend: "up",
      range: "Quality of earnings: High",
      context: "Profits backed by cash",
      icon: DollarSign,
    },
  ],

  leverage: {
    debtToEquity: { value: 0.42, previous: 0.51, trend: "down" },
    interestCoverage: { value: 8.5, status: "healthy" },
    debtQuality: "Low Risk",
  },

  debtTrend: [
    { quarter: "Q1 23", value: 0.51 },
    { quarter: "Q2 23", value: 0.49 },
    { quarter: "Q3 23", value: 0.48 },
    { quarter: "Q4 23", value: 0.46 },
    { quarter: "Q1 24", value: 0.45 },
    { quarter: "Q2 24", value: 0.44 },
    { quarter: "Q3 24", value: 0.43 },
    { quarter: "Q4 24", value: 0.42 },
  ],

  liquidity: {
    currentRatio: 1.85,
    quickRatio: 1.42,
    cash: "₹1.8L Cr",
    cashGrowth: "+₹240 Cr",
    cashToDebt: "0.64x",
  },

  peerComparison: [
    {
      company: "HDFC Bank",
      revenue: "₹1.82L Cr",
      margin: 28.5,
      roe: 18.5,
      de: 0.35,
      score: 92,
    },
    {
      company: "ICICI Bank",
      revenue: "₹1.65L Cr",
      margin: 26.2,
      roe: 17.8,
      de: 0.38,
      score: 88,
    },
    {
      company: "Kotak Bank",
      revenue: "₹0.95L Cr",
      margin: 24.8,
      roe: 16.2,
      de: 0.32,
      score: 85,
    },
    {
      company: "Axis Bank",
      revenue: "₹1.24L Cr",
      margin: 22.5,
      roe: 15.9,
      de: 0.42,
      score: 82,
    },
    {
      company: "SBI",
      revenue: "₹2.85L Cr",
      margin: 19.8,
      roe: 14.5,
      de: 0.48,
      score: 78,
    },
    {
      company: "Punjab National",
      revenue: "₹0.68L Cr",
      margin: 18.2,
      roe: 13.8,
      de: 0.52,
      score: 72,
    },
    {
      company: "Bank of Baroda",
      revenue: "₹0.72L Cr",
      margin: 17.5,
      roe: 13.2,
      de: 0.55,
      score: 68,
    },
    {
      company: "Canara Bank",
      revenue: "₹0.58L Cr",
      margin: 16.8,
      roe: 12.5,
      de: 0.58,
      score: 65,
    },
    {
      company: "Sector Average",
      revenue: "₹8.2L Cr",
      margin: 21.8,
      roe: 15.8,
      de: 0.42,
      score: 78,
    },
  ],

  peerInsights: [
    "Top 3 companies account for 68% of total revenue",
    "5 companies have ROE above 16% (sector avg: 15.8%)",
    "Margin spread from 14% to 28% shows wide performance variance",
  ],
};

const sectorMetrics = [
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
    name: "Combined Revenue",
    value: "₹8.2L Cr",
    category: "risk",
    icon: Wallet,
    explanation:
      "Total revenue generated by all companies in the sector over the past year.",
    trend: "+14.2%",
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
];

export function FinancialTab() {
  const getTrendIcon = (trend: string) => {
    if (trend === "up")
      return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
    if (trend === "down")
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-emerald-500";
    if (trend === "down") return "text-red-500";
    return "text-muted-foreground";
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 25) return "text-emerald-500";
    if (margin >= 20) return "text-blue-500";
    if (margin >= 15) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreColor = (score: number) => {
    if (score >= 85)
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (score >= 75) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (score >= 65)
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

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

  return (
    <div className="container mx-auto p-6 space-y-12">
      {/* Key Sector Metrics Grid */}
      <section id="sector-metrics" className="mb-12">
        <div className="mb-3">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            Key Sector Metrics
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-amber-400 transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-sm p-2 bg-gray-900/95 border border-amber-500/20 text-amber-100 text-xs backdrop-blur-sm"
                >
                  <p className="text-gray-300">
                    Essential financial and operational metrics that define
                    sector health and investment attractiveness.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h2>
          <p className="text-sm text-muted-foreground italic">
            Let's look at the money - how this sector is performing financially
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sectorMetrics.map((metric: any, index: number) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl ${getMetricColor(
                    metric.category
                  )} space-y-3 text-left transition-all duration-200 shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metric.icon && <metric.icon className="w-4 h-4" />}
                      <div className="text-xs font-medium uppercase tracking-wider">
                        {metric.name}
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 opacity-60 hover:opacity-100 cursor-help transition-opacity" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs p-2 bg-gray-900/95 border border-amber-500/20 text-amber-100 text-xs backdrop-blur-sm"
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-amber-200">
                              {metric.name}
                            </div>
                            <p className="text-gray-300 leading-relaxed">
                              {metric.explanation}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  {metric.trend && (
                    <div className="flex items-center gap-1 text-xs">
                      {metric.trend.startsWith("+") ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span
                        className={
                          metric.trend.startsWith("+")
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      >
                        {metric.trend}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        vs last quarter
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 2: FINANCIAL STORY */}
      <motion.div
        id="financial-story"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            Here's what these numbers reveal about sector performance:
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            💰 What the Financials Tell Us
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Growth & Scale */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">
                    {financialData.story.growth.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {financialData.story.growth.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profitability Trend */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Percent className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">
                    {financialData.story.profitability.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {financialData.story.profitability.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Stability */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">
                    {financialData.story.stability.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {financialData.story.stability.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SECTION 3: REVENUE & PROFIT TRENDS */}
      <motion.div
        id="growth-trajectory"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            Now, let's trace the financial journey over time
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📈 Growth Trajectory
          </h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Chart */}
            <div className="mb-6">
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue (₹Cr)",
                    color: "var(--p-found)",
                  },
                  profit: {
                    label: "Profit (₹Cr)",
                    color: "var(--success)",
                  },
                }}
                className="h-80 w-full"
              >
                <ComposedChart data={financialData.quarterlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="quarter"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    fill="var(--p-found)"
                    radius={[8, 8, 0, 0]}
                    opacity={0.8}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="profit"
                    stroke="var(--success)"
                    strokeWidth={3}
                    dot={{ fill: "var(--success)", r: 4 }}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>

            {/* Bottom Part */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
              {/* Recent Performance */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Recent Performance
                </h3>
                <div className="space-y-2">
                  {financialData.recentQuarters.map((q, idx) => (
                    <div
                      key={q.quarter}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-semibold text-sm">{q.quarter}</span>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Rev: {q.revenue}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Profit: {q.profit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Insights */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Growth Insights
                </h3>
                <div className="space-y-3">
                  {financialData.growthInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 4: PROFITABILITY ANALYSIS */}
      <motion.div
        id="margin-deep-dive"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            Let's break down the profitability picture
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            💎 Margin Deep-Dive
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT COLUMN - 60% */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Sector Margin Levels</h3>

                {/* Margin Breakdown */}
                <div className="space-y-3 mb-6">
                  {Object.entries(financialData.margins).map(([key, data]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {key === "ebitda" ? "EBITDA" : key} Margin
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold font-mono">
                          {data.value}%
                        </span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(data.trend)}
                          <span
                            className={`text-xs ${getTrendColor(data.trend)}`}
                          >
                            {data.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Margin Trend Chart */}
                <div className="border rounded-lg p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-3 font-medium">
                    Net Margin Trend (8 Quarters)
                  </p>
                  <ChartContainer
                    config={{
                      value: {
                        label: "Net Margin %",
                        color: "var(--success)",
                      },
                    }}
                    className="h-40 w-full"
                  >
                    <AreaChart data={financialData.marginTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="quarter"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[18, 24]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--success)"
                        fill="var(--success)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>

                {/* AI Insight */}
                <div className="mt-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-sm italic leading-relaxed">
                    "Operating leverage is kicking in. For every ₹100 increase
                    in revenue, companies are keeping ₹28-30 as operating
                    profit, up from ₹25-26 last year."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - 40% */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">
                  Margin Spread Across Companies
                </h3>

                <div className="space-y-4">
                  {/* Spread Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-emerald-500/5">
                      <span className="text-xs text-muted-foreground">
                        Best Performer
                      </span>
                      <span className="font-bold font-mono text-emerald-500">
                        {financialData.marginSpread.best}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-blue-500/5">
                      <span className="text-xs text-muted-foreground">
                        Sector Average
                      </span>
                      <span className="font-bold font-mono text-blue-500">
                        {financialData.marginSpread.average}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-red-500/5">
                      <span className="text-xs text-muted-foreground">
                        Bottom Performer
                      </span>
                      <span className="font-bold font-mono text-red-500">
                        {financialData.marginSpread.worst}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-xs text-muted-foreground">
                        Spread
                      </span>
                      <span className="font-bold font-mono">
                        {financialData.marginSpread.spread} pts
                      </span>
                    </div>
                  </div>

                  {/* Distribution Visual */}
                  <div className="p-4 rounded-lg bg-muted/30 border">
                    <p className="text-xs uppercase text-muted-foreground mb-3">
                      Distribution
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-emerald-500 rounded"></div>
                        <span className="text-xs font-mono">
                          {financialData.marginSpread.aboveAverage} above avg
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-2 bg-amber-500 rounded"
                          style={{ width: "33%" }}
                        ></div>
                        <span className="text-xs font-mono">
                          {financialData.marginSpread.total -
                            financialData.marginSpread.aboveAverage}{" "}
                          below avg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Insight */}
                  <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <p className="text-xs leading-relaxed">
                      <strong>{financialData.marginSpread.aboveAverage}</strong>{" "}
                      out of <strong>{financialData.marginSpread.total}</strong>{" "}
                      companies are above 20% margin. Top 3 players have 25%+
                      margins showing competitive advantages.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* SECTION 5: RETURN METRICS & EFFICIENCY */}
      <motion.div
        id="capital-efficiency"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            What returns are these companies generating with their capital?
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📊 Capital Efficiency
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {financialData.returnMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5" />
                      </div>
                      {metric.trend !== "stable" && getTrendIcon(metric.trend)}
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-medium mb-1">
                        {metric.name}
                      </p>
                      <p className="text-2xl font-bold font-mono">
                        {metric.value}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {metric.range}
                      </p>
                      <p className="text-xs font-medium text-primary">
                        {metric.context}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={getTrendColor(metric.trend)}
                    >
                      {metric.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* SECTION 6: LEVERAGE & BALANCE SHEET */}
      <motion.div
        id="balance-sheet"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            How stable is the sector's financial foundation?
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🏛️ Balance Sheet Health
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - Leverage Position */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Leverage Position</h3>

              {/* Key Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Debt-to-Equity</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono">
                      {financialData.leverage.debtToEquity.value}
                    </span>
                    <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Interest Coverage</span>
                  <span className="text-xl font-bold font-mono">
                    {financialData.leverage.interestCoverage.value}x
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-sm">Debt Quality</span>
                  <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30">
                    🟢 {financialData.leverage.debtQuality}
                  </Badge>
                </div>
              </div>

              {/* D/E Trend Chart */}
              <div className="border rounded-lg p-4 mb-4">
                <p className="text-xs uppercase text-muted-foreground mb-3 font-medium">
                  D/E Trend (8 Quarters)
                </p>
                <ChartContainer
                  config={{
                    value: {
                      label: "Debt/Equity",
                      color: "var(--success)",
                    },
                  }}
                  className="h-32 w-full"
                >
                  <LineChart data={financialData.debtTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="quarter"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0.35, 0.55]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--success)"
                      strokeWidth={2}
                      dot={{ fill: "var(--success)", r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>

              {/* Interpretation */}
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-sm italic leading-relaxed">
                  Sector is deleveraging. Average D/E of{" "}
                  {financialData.leverage.debtToEquity.value} means for every
                  ₹100 of equity, companies have only ₹
                  {financialData.leverage.debtToEquity.value * 100} of debt.
                  Very comfortable position.
                </p>
              </div>

              {/* Distribution */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-muted-foreground">
                    9 out of 12 companies have D/E below 0.5
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-muted-foreground">
                    Only 1 company above 1.0 (higher risk)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT COLUMN - Liquidity & Solvency */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Liquidity & Solvency</h3>

              {/* Ratios */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Current Ratio</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono">
                      {financialData.liquidity.currentRatio}
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-500">
                      🟢 Healthy
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Quick Ratio</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono">
                      {financialData.liquidity.quickRatio}
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-500">
                      🟢 Healthy
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Interpretation */}
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 mb-4">
                <p className="text-sm italic leading-relaxed">
                  Short-term obligations well covered. Both ratios above 1.4
                  indicate strong ability to meet immediate financial
                  commitments.
                </p>
              </div>

              {/* Cash Position */}
              <div className="border rounded-lg p-4 bg-gradient-to-br from-emerald-500/5 to-blue-500/5">
                <h4 className="text-xs uppercase text-muted-foreground mb-3 font-medium">
                  Cash Position
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Combined Cash</span>
                    <span className="text-xl font-bold font-mono">
                      {financialData.liquidity.cash}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">YoY Growth</span>
                    <span className="text-lg font-semibold text-emerald-500">
                      {financialData.liquidity.cashGrowth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cash-to-Debt</span>
                    <span className="text-lg font-bold font-mono">
                      {financialData.liquidity.cashToDebt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Insight */}
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs font-medium">
                  💡 Strong buffer for uncertainties - cash levels up
                  significantly YoY
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SECTION 7: PEER COMPARISON TABLE */}
      <motion.div
        id="company-comparison"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            How do companies in this sector stack up financially?
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            ⚖️ Company-Level Comparison
          </h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs uppercase text-muted-foreground font-medium">
                      Company
                    </th>
                    <th className="text-right py-3 px-4 text-xs uppercase text-muted-foreground font-medium">
                      Revenue
                    </th>
                    <th className="text-right py-3 px-4 text-xs uppercase text-muted-foreground font-medium">
                      Net Margin
                    </th>
                    <th className="text-right py-3 px-4 text-xs uppercase text-muted-foreground font-medium">
                      ROE
                    </th>
                    <th className="text-right py-3 px-4 text-xs uppercase text-muted-foreground font-medium">
                      D/E
                    </th>
                    <th className="text-right py-3 px-4 text-xs uppercase text-muted-foreground font-medium">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.peerComparison.map((company, idx) => {
                    const isSectorAvg = company.company === "Sector Average";
                    return (
                      <tr
                        key={idx}
                        className={`border-b hover:bg-muted/50 transition-colors ${
                          isSectorAvg ? "bg-primary/5 font-semibold" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {isSectorAvg && (
                              <BarChart3 className="h-4 w-4 text-primary" />
                            )}
                            <span className={isSectorAvg ? "font-bold" : ""}>
                              {company.company}
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-mono text-sm">
                          {company.revenue}
                        </td>
                        <td className="text-right py-3 px-4">
                          <span
                            className={`font-mono text-sm ${getMarginColor(
                              company.margin
                            )}`}
                          >
                            {company.margin}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 font-mono text-sm">
                          {company.roe}%
                        </td>
                        <td className="text-right py-3 px-4 font-mono text-sm">
                          {company.de}
                        </td>
                        <td className="text-right py-3 px-4">
                          <Badge className={getScoreColor(company.score)}>
                            {company.score}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Insights */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs uppercase text-muted-foreground mb-3 font-medium">
                Quick Insights
              </p>
              <div className="space-y-2">
                {financialData.peerInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 8: WHAT'S NEXT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">Want to explore further?</p>
        </div>

        <div className="space-y-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Check Institutional Activity
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      See FII/DII flows and trends
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Building2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Deep-Dive Individual Companies
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Detailed financial analysis of any stock
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Compare Top Performers</h3>
                    <p className="text-sm text-muted-foreground">
                      Side-by-side comparison of sector leaders
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
