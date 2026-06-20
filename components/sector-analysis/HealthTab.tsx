"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  DollarSign,
  Target,
  BarChart3,
  Activity,
  Zap,
  Shield,
  Sparkles,
  Award,
  AlertTriangle,
  Building2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

interface HealthTabProps {
  sectorData: any;
  getHealthColor: (score: number) => string;
}

// Mock health data for the new design
const healthData = {
  overallScore: 78,
  category: "Strong",
  trend: "+5",
  categories: [
    {
      name: "Profitability",
      icon: DollarSign,
      score: 85,
      trend: "+3",
      status: "strong",
      color: "emerald",
    },
    {
      name: "Growth",
      icon: TrendingUp,
      score: 82,
      trend: "+7",
      status: "strong",
      color: "blue",
    },
    {
      name: "Stability",
      icon: Shield,
      score: 71,
      trend: "-2",
      status: "moderate",
      color: "purple",
    },
    {
      name: "Efficiency",
      icon: Zap,
      score: 76,
      trend: "+4",
      status: "moderate",
      color: "orange",
    },
    {
      name: "Valuation",
      icon: Target,
      score: 65,
      trend: "-1",
      status: "moderate",
      color: "cyan",
    },
  ],
  insights: [
    {
      title: "What's Working Well",
      icon: "✅",
      text: "Profitability is exceptional - average ROE of 15.8% puts this sector in the top 20% of all sectors. Net margins have expanded by 2.3% YoY.",
    },
    {
      title: "What Needs Attention",
      icon: "⚠️",
      text: "Valuations are stretched. P/E of 18.2 is 25% above the 5-year average. Limited upside until earnings catch up with prices.",
    },
    {
      title: "Compared to Other Sectors",
      icon: "📊",
      text: "Banking ranks #2 overall among 11 sectors. Only Technology scores higher. Led by profitability, held back by valuation concerns.",
    },
    {
      title: "The Trend Direction",
      icon: "📈",
      text: "Health improving steadily - up 6 points in last 6 months. Growth acceleration and margin expansion driving the momentum.",
    },
  ],
  categoryDetails: {
    Profitability: {
      score: 85,
      trend: "+3",
      color: "emerald",
      icon: DollarSign,
      measures: ["ROE, ROCE, Net Margin"],
      metrics: [
        {
          name: "ROE",
          value: "15.8%",
          benchmark: "12% (Industry)",
          status: "strong",
        },
        {
          name: "Net Margin",
          value: "18.2%",
          benchmark: "15% (Target)",
          status: "strong",
        },
        {
          name: "ROCE",
          value: "17.5%",
          benchmark: "14% (Good)",
          status: "strong",
        },
      ],
      interpretation:
        "Profitability metrics are strong across the board. ROE of 15.8% indicates efficient capital use, and margins have expanded by 2.3% YoY.",
      topPerformer: { name: "HDFC Bank", value: "18.5%" },
      chartData: [
        { month: "Jul", value: 82 },
        { month: "Aug", value: 83 },
        { month: "Sep", value: 84 },
        { month: "Oct", value: 85 },
      ],
    },
    Growth: {
      score: 82,
      trend: "+7",
      color: "blue",
      icon: TrendingUp,
      measures: ["Revenue CAGR, Profit CAGR, Asset Growth"],
      metrics: [
        {
          name: "Revenue CAGR",
          value: "12.4%",
          benchmark: "10% (Target)",
          status: "strong",
        },
        {
          name: "Profit CAGR",
          value: "15.2%",
          benchmark: "12% (Good)",
          status: "strong",
        },
        {
          name: "Asset Growth",
          value: "11.8%",
          benchmark: "9% (Industry)",
          status: "strong",
        },
      ],
      interpretation:
        "Strong growth momentum with profit growth outpacing revenue by 2.8%, indicating improving operational efficiency and pricing power.",
      topPerformer: { name: "ICICI Bank", value: "16.8%" },
      chartData: [
        { month: "Jul", value: 75 },
        { month: "Aug", value: 78 },
        { month: "Sep", value: 80 },
        { month: "Oct", value: 82 },
      ],
    },
    Stability: {
      score: 71,
      trend: "-2",
      color: "purple",
      icon: Shield,
      measures: ["Debt/Equity, Current Ratio, Interest Coverage"],
      metrics: [
        {
          name: "Debt/Equity",
          value: "0.42",
          benchmark: "< 0.5 (Safe)",
          status: "strong",
        },
        {
          name: "Current Ratio",
          value: "1.65",
          benchmark: "> 1.5 (Good)",
          status: "strong",
        },
        {
          name: "Interest Coverage",
          value: "4.2x",
          benchmark: "> 3x (Healthy)",
          status: "strong",
        },
      ],
      interpretation:
        "Financial stability is solid but showing minor deterioration. Debt levels remain manageable, though rising slightly as sector expands lending.",
      topPerformer: { name: "Kotak Bank", value: "0.35" },
      chartData: [
        { month: "Jul", value: 73 },
        { month: "Aug", value: 72 },
        { month: "Sep", value: 72 },
        { month: "Oct", value: 71 },
      ],
    },
    Efficiency: {
      score: 76,
      trend: "+4",
      color: "orange",
      icon: Zap,
      measures: ["Asset Turnover, Cash Conversion, Cost/Income"],
      metrics: [
        {
          name: "Asset Turnover",
          value: "0.85",
          benchmark: "> 0.7 (Good)",
          status: "strong",
        },
        {
          name: "Cost/Income",
          value: "42%",
          benchmark: "< 45% (Efficient)",
          status: "strong",
        },
        {
          name: "Cash Conversion",
          value: "88%",
          benchmark: "> 85% (Strong)",
          status: "strong",
        },
      ],
      interpretation:
        "Operational efficiency improving steadily. Digital transformation reducing cost-to-income ratio while maintaining service quality.",
      topPerformer: { name: "Axis Bank", value: "38%" },
      chartData: [
        { month: "Jul", value: 72 },
        { month: "Aug", value: 74 },
        { month: "Sep", value: 75 },
        { month: "Oct", value: 76 },
      ],
    },
    Valuation: {
      score: 65,
      trend: "-1",
      color: "cyan",
      icon: Target,
      measures: ["P/E Ratio, P/B Ratio, Dividend Yield"],
      metrics: [
        {
          name: "P/E Ratio",
          value: "18.2x",
          benchmark: "14.5x (5Y Avg)",
          status: "moderate",
        },
        {
          name: "P/B Ratio",
          value: "2.4x",
          benchmark: "2.0x (Fair)",
          status: "moderate",
        },
        {
          name: "Div Yield",
          value: "2.8%",
          benchmark: "> 2.5% (Good)",
          status: "strong",
        },
      ],
      interpretation:
        "Valuations elevated vs historical averages. Market pricing in strong growth, but leaving limited margin for disappointment.",
      topPerformer: { name: "SBI", value: "1.8x P/B" },
      chartData: [
        { month: "Jul", value: 68 },
        { month: "Aug", value: 67 },
        { month: "Sep", value: 66 },
        { month: "Oct", value: 65 },
      ],
    },
  },
  sectorComparison: [
    {
      sector: "Technology",
      score: 82,
      rank: 1,
      breakdown: [88, 85, 75, 82, 70],
    },
    { sector: "Banking", score: 78, rank: 2, breakdown: [85, 82, 71, 76, 65] },
    {
      sector: "Healthcare",
      score: 74,
      rank: 3,
      breakdown: [80, 78, 82, 70, 62],
    },
    { sector: "Consumer", score: 71, rank: 4, breakdown: [75, 72, 76, 74, 68] },
    { sector: "Energy", score: 68, rank: 5, breakdown: [70, 65, 72, 71, 70] },
    {
      sector: "Industrial",
      score: 65,
      rank: 6,
      breakdown: [68, 62, 70, 69, 66],
    },
  ],
  distribution: {
    ranges: [
      { range: "80-100", count: 4, color: "emerald" },
      { range: "60-80", count: 4, color: "amber" },
      { range: "40-60", count: 3, color: "orange" },
      { range: "20-40", count: 1, color: "red" },
      { range: "0-20", count: 0, color: "red" },
    ],
    topCompanies: [
      { name: "HDFC Bank", score: 92, strength: "Profitability" },
      { name: "ICICI Bank", score: 88, strength: "Growth" },
      { name: "Kotak Bank", score: 85, strength: "Stability" },
    ],
    watchCompanies: [
      { name: "Bank X", score: 62, concern: "Asset Quality" },
      { name: "Bank Y", score: 58, concern: "Profitability" },
      { name: "Bank Z", score: 55, concern: "Growth" },
    ],
  },
  historicalTrend: [
    { quarter: "Q1 22", score: 68 },
    { quarter: "Q2 22", score: 70 },
    { quarter: "Q3 22", score: 72 },
    { quarter: "Q4 22", score: 74 },
    { quarter: "Q1 23", score: 75 },
    { quarter: "Q2 23", score: 82 },
    { quarter: "Q3 23", score: 80 },
    { quarter: "Q4 23", score: 78 },
  ],
  trendStats: {
    best: { quarter: "Q2 2023", score: 82, reason: "Post-recovery peak" },
    worst: { quarter: "Q1 2022", score: 68, reason: "Pandemic impact" },
    current: { trend: "Improving", change: "+6", period: "6 months" },
  },
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

const getScoreBgColor = (score: number) => {
  if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
};

const getColorHex = (color: string) => {
  const hexColors: any = {
    emerald: "var(--success)",
    blue: "var(--p-found)",
    purple: "var(--p-mom)",
    orange: "var(--warning)",
    cyan: "var(--p-found)",
  };
  return hexColors[color] || "var(--p-found)";
};

const getCategoryColor = (color: string, type: "bg" | "text" | "border") => {
  const colors: any = {
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      border: "border-emerald-500/20",
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      border: "border-blue-500/20",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-500",
      border: "border-purple-500/20",
    },
    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-500",
      border: "border-orange-500/20",
    },
    cyan: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-500",
      border: "border-cyan-500/20",
    },
  };
  return colors[color]?.[type] || "";
};

export function HealthTab({ sectorData, getHealthColor }: HealthTabProps) {
  return (
    <div className="space-y-10">
      {/* SECTION 1: HEALTH OVERVIEW DASHBOARD */}
      <motion.div
        id="health-overview"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-muted-foreground mb-6 text-base">
          Let's break down what makes this sector tick
        </p>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex gap-8">
              {/* LEFT SIDE - Overall Score */}
              <div className="w-[40%] flex flex-col justify-center items-center border-r pr-8">
                <div className="text-center">
                  <div className="text-7xl font-bold mb-2">
                    <span className={getScoreColor(healthData.overallScore)}>
                      {healthData.overallScore}
                    </span>
                    <span className="text-3xl text-muted-foreground">/100</span>
                  </div>
                  <Badge
                    className={`${getScoreBgColor(
                      healthData.overallScore
                    )} mb-2`}
                  >
                    {healthData.category}
                  </Badge>
                  <div className="flex items-center justify-center gap-1 text-emerald-500 mt-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold">{healthData.trend}</span>
                    <span className="text-xs text-muted-foreground">
                      vs last quarter
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Based on 5 key dimensions
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE - Category Mini-Cards */}
              <div className="w-[60%] flex items-center">
                <div className="grid grid-cols-5 gap-3 w-full">
                  {healthData.categories.map((cat, idx) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex flex-col items-center p-3 rounded-lg border ${getCategoryColor(
                        cat.color,
                        "bg"
                      )} ${getCategoryColor(cat.color, "border")}`}
                    >
                      <cat.icon
                        className={`h-5 w-5 mb-2 ${getCategoryColor(
                          cat.color,
                          "text"
                        )}`}
                      />
                      <span className="text-[10px] text-muted-foreground text-center mb-1">
                        {cat.name}
                      </span>
                      <span
                        className={`text-xl font-bold ${getScoreColor(
                          cat.score
                        )}`}
                      >
                        {cat.score}
                      </span>
                      <div
                        className={`flex items-center gap-0.5 mt-1 ${
                          cat.trend.startsWith("+")
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {cat.trend.startsWith("+") ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="text-[10px] font-medium">
                          {cat.trend}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 2: SMART HEALTH INSIGHTS */}
      <motion.div
        id="health-story"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Health Story in Plain English
          </h3>
          <p className="text-muted-foreground">
            Here's what the numbers are telling us:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {healthData.insights.map((insight, idx) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{insight.icon}</span>
                    <div>
                      <h4 className="font-semibold mb-2">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.text}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* SECTION 3: DETAILED HEALTH BREAKDOWN */}
      <motion.div
        id="category-breakdown"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p className="text-muted-foreground mb-6 text-base">
          Now, let's examine each dimension in detail
        </p>

        <div className="space-y-6">
          {Object.entries(healthData.categoryDetails).map(
            ([name, details]: [string, any], idx) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
              >
                <Card
                  className={`border-l-4 ${getCategoryColor(
                    details.color,
                    "border"
                  )}`}
                >
                  <CardContent className="pt-6">
                    {/* HEADER */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${getCategoryColor(
                            details.color,
                            "bg"
                          )}`}
                        >
                          <details.icon
                            className={`h-6 w-6 ${getCategoryColor(
                              details.color,
                              "text"
                            )}`}
                          />
                        </div>
                        <h3 className="text-xl font-semibold">{name}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          className={`${getScoreBgColor(
                            details.score
                          )} text-lg px-4 py-1`}
                        >
                          {details.score}/100
                        </Badge>
                        <div
                          className={`flex items-center gap-1 ${
                            details.trend.startsWith("+")
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {details.trend.startsWith("+") ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-semibold">{details.trend}</span>
                        </div>
                        <button className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
                          See companies
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* BODY - Two Columns */}
                    <div className="grid grid-cols-[65%_35%] gap-6">
                      {/* LEFT COLUMN */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground mb-2 font-medium">
                            What We Measure
                          </p>
                          <p className="text-sm">{details.measures[0]}</p>
                        </div>

                        <div>
                          <p className="text-xs uppercase text-muted-foreground mb-3 font-medium">
                            Current Status
                          </p>
                          <div className="space-y-2">
                            {details.metrics.map((metric: any) => (
                              <div
                                key={metric.name}
                                className="flex items-center justify-between py-2 px-3 rounded bg-muted/30"
                              >
                                <span className="text-sm font-medium">
                                  {metric.name}
                                </span>
                                <div className="flex items-center gap-4">
                                  <span className="font-mono font-semibold">
                                    {metric.value}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {metric.benchmark}
                                  </span>
                                  <span>
                                    {metric.status === "strong" ? (
                                      <span className="text-emerald-500">
                                        🟢
                                      </span>
                                    ) : (
                                      <span className="text-amber-500">🟡</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div
                          className={`p-4 rounded-lg ${getCategoryColor(
                            details.color,
                            "bg"
                          )} border ${getCategoryColor(
                            details.color,
                            "border"
                          )}`}
                        >
                          <p className="text-sm italic leading-relaxed">
                            {details.interpretation}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="space-y-4">
                        {/* Mini Trend Chart */}
                        <div className="border rounded-lg p-3">
                          <p className="text-xs uppercase text-muted-foreground mb-3 font-medium">
                            3-Month Trend
                          </p>
                          <ChartContainer
                            config={{
                              value: {
                                label: "Score",
                                color: getColorHex(details.color),
                              },
                            }}
                            className="h-24 w-full"
                          >
                            <LineChart data={details.chartData}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis 
                                dataKey="month" 
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis 
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                domain={[60, 90]}
                              />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke={getColorHex(details.color)}
                                strokeWidth={2}
                                dot={{ fill: getColorHex(details.color), r: 3 }}
                              />
                            </LineChart>
                          </ChartContainer>
                        </div>

                        {/* Quick Stats */}
                        <div
                          className={`p-4 rounded-lg ${getCategoryColor(
                            details.color,
                            "bg"
                          )} border ${getCategoryColor(
                            details.color,
                            "border"
                          )}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Award
                              className={`h-4 w-4 ${getCategoryColor(
                                details.color,
                                "text"
                              )}`}
                            />
                            <span className="text-xs font-medium">
                              Top Performer
                            </span>
                          </div>
                          <p className="font-semibold text-sm">
                            {details.topPerformer.name}
                          </p>
                          <p
                            className={`text-xs ${getCategoryColor(
                              details.color,
                              "text"
                            )} font-mono`}
                          >
                            {name === "Profitability" ? "ROE: " : ""}
                            {details.topPerformer.value}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Sector leader by{" "}
                            {name === "Profitability"
                              ? "2.7%"
                              : name === "Growth"
                              ? "1.6%"
                              : "3.2%"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          )}
        </div>
      </motion.div>

      {/* SECTION 4: COMPARATIVE ANALYSIS */}
      <motion.div
        id="sector-comparison"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            How does this sector stack up against others?
          </p>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Health Comparison Across Sectors
          </h3>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-6 gap-4">
              {healthData.sectorComparison.map((sector) => (
                <div
                  key={sector.sector}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    sector.sector === "Banking"
                      ? "bg-primary/5 border-primary shadow-md scale-105"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      #{sector.rank}
                    </div>
                    <div className="font-semibold text-sm mb-2">
                      {sector.sector}
                    </div>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        sector.score
                      )}`}
                    >
                      {sector.score}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {sector.breakdown.map((score, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              score >= 80
                                ? "bg-emerald-500"
                                : score >= 60
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-center">
                <span className="font-medium">Banking ranks #2 overall</span>,
                led by strong profitability but held back by valuation concerns
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 5: COMPANY-LEVEL HEALTH DISTRIBUTION */}
      <motion.div
        id="score-distribution"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            Not all companies in this sector are equal. Here's the distribution:
          </p>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Health Score Distribution
          </h3>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* TOP PART - Distribution Chart */}
            <div className="mb-6">
              <ChartContainer
                config={{
                  count: {
                    label: "Companies",
                    color: "var(--p-found)",
                  },
                }}
                className="h-48 w-full"
              >
                <BarChart
                  data={healthData.distribution.ranges}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {healthData.distribution.ranges.map((entry, index) => {
                      const colorMap: any = {
                        emerald: "var(--success)",
                        amber: "var(--warning)",
                        orange: "var(--warning)",
                        red: "var(--danger)",
                      };
                      return (
                        <Cell key={`cell-${index}`} fill={colorMap[entry.color] || "var(--p-found)"} />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ChartContainer>
              <p className="text-center text-sm mt-4 font-medium">
                8 out of 12 companies score above 75
              </p>
            </div>

            {/* BOTTOM PART - Top/Bottom Companies */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t">
              {/* LEFT - Strongest Companies */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-500" />
                  Strongest Companies
                </h4>
                <div className="space-y-2">
                  {healthData.distribution.topCompanies.map((company, idx) => (
                    <div
                      key={company.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-emerald-500">
                          #{idx + 1}
                        </span>
                        <span className="font-medium">{company.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-500">
                          {company.score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {company.strength}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT - Companies to Watch */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Companies to Watch
                </h4>
                <div className="space-y-2">
                  {healthData.distribution.watchCompanies.map((company) => (
                    <div
                      key={company.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                    >
                      <span className="font-medium">{company.name}</span>
                      <div className="text-right">
                        <div className="font-bold text-amber-500">
                          {company.score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {company.concern}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 6: HEALTH TRENDS OVER TIME */}
      <motion.div
        id="health-journey"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            Let's see how sector health has evolved
          </p>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Journey - Last 2 Years
          </h3>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* TOP - Line Chart */}
            <div className="mb-6">
              <ChartContainer
                config={{
                  score: {
                    label: "Health Score",
                    color: "var(--primary)",
                  },
                }}
                className="h-64 w-full"
              >
                <AreaChart
                  data={healthData.historicalTrend}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <defs>
                    <linearGradient
                      id="healthGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="quarter" />
                  <YAxis domain={[60, 85]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    fill="url(#healthGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* BOTTOM - Three Mini Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-xs uppercase text-muted-foreground mb-2">
                  Best Quarter
                </div>
                <div className="font-bold text-lg mb-1">
                  {healthData.trendStats.best.quarter}
                </div>
                <div className="text-2xl font-bold text-emerald-500 mb-1">
                  {healthData.trendStats.best.score}
                </div>
                <div className="text-xs text-muted-foreground">
                  {healthData.trendStats.best.reason}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="text-xs uppercase text-muted-foreground mb-2">
                  Worst Quarter
                </div>
                <div className="font-bold text-lg mb-1">
                  {healthData.trendStats.worst.quarter}
                </div>
                <div className="text-2xl font-bold text-red-500 mb-1">
                  {healthData.trendStats.worst.score}
                </div>
                <div className="text-xs text-muted-foreground">
                  {healthData.trendStats.worst.reason}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="text-xs uppercase text-muted-foreground mb-2">
                  Current Trend
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg">
                    {healthData.trendStats.current.trend}
                  </span>
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-blue-500 mb-1">
                  {healthData.trendStats.current.change}
                </div>
                <div className="text-xs text-muted-foreground">
                  in {healthData.trendStats.current.period}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 7: WHAT'S NEXT */}
      <motion.div
        id="key-takeaways"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <p className="text-muted-foreground mb-6">Want to explore further?</p>

        <div className="space-y-3">
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <DollarSign className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Check Financial Metrics</h4>
                    <p className="text-sm text-muted-foreground">
                      Deep-dive into revenue, profit, and cash flow
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Compare Top Companies</h4>
                    <p className="text-sm text-muted-foreground">
                      See detailed health comparison of leaders
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <Target className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Analyze Individual Stocks</h4>
                    <p className="text-sm text-muted-foreground">
                      Pick a company to analyze in detail
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
