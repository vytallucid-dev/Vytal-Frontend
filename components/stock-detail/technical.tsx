"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Activity,
  DollarSign,
  BarChart3,
  Target,
  CheckCircle2,
  XCircle,
  Search,
  AlertTriangle,
  Clock,
  Users,
  Newspaper,
  Briefcase,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import Link from "next/link";
import { useParams } from "next/navigation";

// Mock data for the chart
const generateChartData = (period: string) => {
  const basePrice = 1580;
  const dataPoints =
    period === "1D"
      ? 78
      : period === "5D"
        ? 390
        : period === "1M"
          ? 22
          : period === "3M"
            ? 66
            : period === "6M"
              ? 132
              : period === "1Y"
                ? 252
                : period === "3Y"
                  ? 756
                  : 1260;

  const data = [];
  let currentPrice = basePrice;

  for (let i = 0; i < dataPoints; i++) {
    const change = (Math.random() - 0.45) * 30; // Slight upward bias
    currentPrice += change;

    const date = new Date();
    date.setDate(date.getDate() - (dataPoints - i));

    const open = currentPrice;
    const close = currentPrice + (Math.random() - 0.5) * 20;
    const high = Math.max(open, close) + Math.random() * 15;
    const low = Math.min(open, close) - Math.random() * 15;
    const volume = 1500000 + Math.random() * 1500000;

    data.push({
      date: date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      price: close,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return data;
};

const Technical = () => {
  const params = useParams();
  const symbol = params.symbol as string;
  const [selectedPeriod, setSelectedPeriod] = useState("6M");
  const [chartType, setChartType] = useState<
    "candlestick" | "line" | "area" | "bar"
  >("candlestick");

  const chartData = generateChartData(selectedPeriod);
  const currentPrice = 1820;

  const periods = ["1D", "5D", "1M", "3M", "6M", "1Y", "3Y", "5Y", "MAX"];

  return (
    <div className="space-y-6">
      {/* Storytelling Introduction */}
      <div>
        <p className="text-muted-foreground text-sm">
          Let&apos;s check the technical pulse - what&apos;s the price momentum
          saying?
        </p>
      </div>

      {/* SECTION 1: TECHNICAL HEALTH SNAPSHOT */}
      <div id="technical-snapshot">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Technical Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* CARD 1: Overall Trend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20">
                  Uptrend 🟢
                </Badge>
              </div>
              <p className="text-sm font-semibold">Strength: Strong</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUp className="h-3 w-3 mr-1" />
                Higher highs & lows
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Price making higher highs and higher lows
              </p>
            </CardContent>
          </Card>

          {/* CARD 2: Momentum */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Momentum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20">
                  Bullish 🟢
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs">
                  <span className="font-medium">RSI:</span> 62{" "}
                  <span className="text-muted-foreground">(Healthy)</span>
                </p>
                <p className="text-xs">
                  <span className="font-medium">MACD:</span>{" "}
                  <span className="text-green-600 dark:text-green-400">
                    Positive ↗
                  </span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Buyers in control
              </p>
            </CardContent>
          </Card>

          {/* CARD 3: Moving Averages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moving Averages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20">
                  Above all MAs ✓
                </Badge>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">20 DMA:</span>
                  <span className="font-medium">
                    ₹1,780 <span className="text-green-600">+2.2%</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">50 DMA:</span>
                  <span className="font-medium">
                    ₹1,720 <span className="text-green-600">+5.8%</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">200 DMA:</span>
                  <span className="font-medium">
                    ₹1,580 <span className="text-green-600">+15.2%</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 pt-2 border-t font-medium">
                Golden Cross active
              </p>
            </CardContent>
          </Card>

          {/* CARD 4: Volume */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Volume
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20">
                  Rising 🟢
                </Badge>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Volume:</span>
                  <span className="font-medium">25L shares/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recent Spike:</span>
                  <span className="font-medium text-green-600">+35%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Strong participation
              </p>
            </CardContent>
          </Card>

          {/* CARD 5: Support/Resistance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Support/Resistance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Support:</span>
                  <span className="font-medium">
                    ₹1,750 <span className="text-red-500">-3.8%</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resistance:</span>
                  <span className="font-medium">
                    ₹1,950 <span className="text-green-600">+7.1%</span>
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Risk-Reward:</span>
                  <span className="font-medium">1:1.8</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs mt-2">
                Neutral territory
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* AI Summary */}
        <Card className="mt-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Technical picture is positive.
                </span>{" "}
                Stock in established uptrend with momentum indicators bullish.
                Trading above all key moving averages with strong volume
                support. Next resistance at ₹1,950 (52W high), support at ₹1,750
                (20 DMA).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: INTERACTIVE PRICE CHART */}
      <div id="price-chart">
        <div className="mb-3">
          <p className="text-muted-foreground text-sm mb-4">
            Let&apos;s look at the price action itself
          </p>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Price Chart Analysis
          </h3>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Chart Controls */}
            <div className="space-y-4 mb-6">
              {/* Time Period Toggles */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Time Period
                </p>
                <div className="flex flex-wrap gap-2">
                  {periods.map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selectedPeriod === period
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Type */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Chart Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "candlestick", label: "Candlestick" },
                    { value: "line", label: "Line" },
                    { value: "area", label: "Area" },
                    { value: "bar", label: "Bar" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setChartType(type.value as any)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        chartType === type.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Chart Area */}
            <div className="border rounded-lg p-4 bg-background">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      domain={["auto", "auto"]}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--ink)",
                        border: "1px solid var(--ink2)",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                      wrapperStyle={{
                        outline: "none",
                      }}
                      cursor={{
                        stroke: "var(--p-mom)",
                        strokeWidth: 1,
                        strokeDasharray: "3 3",
                      }}
                    />

                    {/* Current Price Line */}
                    <ReferenceLine
                      y={currentPrice}
                      stroke="var(--p-mom)"
                      strokeDasharray="5 5"
                      label={{
                        value: `₹${currentPrice}`,
                        position: "right",
                        fontSize: 11,
                      }}
                    />

                    {/* Price Chart based on type */}
                    {chartType === "line" && (
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="var(--p-mom)"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {chartType === "area" && (
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="var(--p-mom)"
                        fill="rgba(139, 92, 246, 0.2)"
                      />
                    )}
                    {chartType === "bar" && (
                      <Bar dataKey="price" fill="var(--p-mom)" />
                    )}
                    {chartType === "candlestick" && (
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke="var(--p-mom)"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Chart */}
              <div className="h-[100px] mt-4 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Volume
                </p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} hide />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--ink)",
                        border: "1px solid var(--ink2)",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "11px",
                      }}
                      cursor={{ fill: "rgba(96, 165, 250, 0.1)" }}
                    />
                    <Bar
                      dataKey="volume"
                      fill="rgba(96, 165, 250, 0.5)"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Interpretation Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* What the Chart Shows */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                What the Chart Shows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  <p className="text-sm text-muted-foreground flex-1">
                    Price broke out above ₹1,750 resistance on Oct 5 with strong
                    volume
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  <p className="text-sm text-muted-foreground flex-1">
                    Trading comfortably above 50 DMA (₹1,720) - trend intact
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  <p className="text-sm text-muted-foreground flex-1">
                    No negative divergence - higher prices + higher volume =
                    healthy
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  <p className="text-sm text-muted-foreground flex-1">
                    Consolidation between ₹1,800-₹1,850 for past 2 weeks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to Watch */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                What to Watch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">
                    →
                  </span>
                  <p className="text-sm text-muted-foreground flex-1">
                    Breakout above ₹1,850 targets ₹1,950 (52W high)
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-red-600 dark:text-red-400 mt-0.5">
                    →
                  </span>
                  <p className="text-sm text-muted-foreground flex-1">
                    Watch for support hold at ₹1,750 on any dips
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  <p className="text-sm text-muted-foreground flex-1">
                    Volume confirmation needed for further upside
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  <p className="text-sm text-muted-foreground flex-1">
                    RSI near 62 - room to run before overbought
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 3: TREND ANALYSIS */}
      <div id="trend-analysis">
        <div className="mb-3">
          <p className="text-muted-foreground text-sm mb-4">
            Let&apos;s understand the trend - which direction is price moving?
          </p>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🎯 Trend Direction & Strength
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* COLUMN 1: Short-Term Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Short-Term Trend</CardTitle>
              <p className="text-xs text-muted-foreground">1-4 weeks</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Direction:
                  </span>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    Uptrend 🟢
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Strength:
                  </span>
                  <span className="text-sm font-semibold">Strong (8/10)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Key Level:
                  </span>
                  <span className="text-sm font-semibold">₹1,750</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Pattern:</p>
                  <p className="text-sm">Higher highs, higher lows</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Recent Action:
                  </p>
                  <p className="text-sm font-medium text-green-600">
                    Breakout from consolidation
                  </p>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="h-[100px] border rounded-lg p-2 bg-muted/30">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData("1M")}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--success)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Short-term momentum is bullish. Price broke above ₹1,750 and
                  held. As long as it stays above this level, short-term bias
                  remains positive.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* COLUMN 2: Medium-Term Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medium-Term Trend</CardTitle>
              <p className="text-xs text-muted-foreground">1-6 months</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Direction:
                  </span>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    Uptrend 🟢
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Strength:
                  </span>
                  <span className="text-sm font-semibold">
                    Moderate-Strong (7/10)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Key Level:
                  </span>
                  <span className="text-sm font-semibold">₹1,650</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Pattern:</p>
                  <p className="text-sm">Ascending channel</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Phase:</p>
                  <p className="text-sm font-medium text-green-600">
                    Trending after consolidation
                  </p>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="h-[100px] border rounded-lg p-2 bg-muted/30">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData("6M")}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--p-found)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Medium-term structure is healthy. Price has been making steady
                  higher highs within an ascending channel. Pullbacks to
                  ₹1,650-₹1,700 zone have been buyable.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* COLUMN 3: Long-Term Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Long-Term Trend</CardTitle>
              <p className="text-xs text-muted-foreground">1+ years</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Direction:
                  </span>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    Uptrend 🟢
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Strength:
                  </span>
                  <span className="text-sm font-semibold">Strong (9/10)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Key Level:
                  </span>
                  <span className="text-sm font-semibold">
                    ₹1,580 (200 DMA)
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Pattern:</p>
                  <p className="text-sm">Steady uptrend since COVID low</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Phase:</p>
                  <p className="text-sm font-medium text-green-600">
                    Established bull market
                  </p>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="h-[100px] border rounded-lg p-2 bg-muted/30">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData("3Y")}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--p-mom)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Long-term trend is firmly bullish. Trading 15% above 200 DMA
                  which is sloping upward. No signs of trend reversal.
                  Structural bull market intact.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Verdict */}
        <Card className="mt-4 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <span>Overall Trend Assessment:</span>
                <Badge className="bg-green-500 text-white">
                  🟢 BULLISH ACROSS ALL TIMEFRAMES
                </Badge>
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All three timeframes aligned positively - rare and powerful
                setup. Short, medium, and long-term trends all pointing up. This
                alignment suggests path of least resistance is higher. Dips are
                likely to be shallow and buyable.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Current Trading Phase
                  </p>
                  <p className="text-sm font-semibold">Trending (not choppy)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Probability of Continuation
                  </p>
                  <p className="text-sm font-semibold text-green-600">70-75%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Risk of Reversal
                  </p>
                  <p className="text-sm font-semibold">
                    Low (watch ₹1,650 break)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: MOMENTUM INDICATORS */}
      <div id="momentum-indicators">
        <div className="mb-3">
          <p className="text-muted-foreground text-sm mb-4">
            Beyond just price, let&apos;s check momentum indicators
          </p>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            ⚡ Momentum Analysis
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CARD 1: RSI */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">RSI</CardTitle>
                <div className="group relative">
                  <span className="text-xs text-muted-foreground cursor-help border-b border-dashed border-muted-foreground">
                    What is RSI?
                  </span>
                  <div className="absolute hidden group-hover:block w-64 p-2 bg-popover border rounded-md shadow-lg text-xs z-10 -left-20 top-6">
                    Measures if stock is overbought (&gt;70) or oversold
                    (&lt;30). Range: 0-100
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    RSI (14-day):
                  </span>
                  <span className="text-2xl font-bold">62</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Zone:</span>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    🟢 Healthy (50-70)
                  </Badge>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium">
                    Bullish but not overbought
                  </p>
                </div>
              </div>

              {/* RSI Chart */}
              <div className="h-[120px] border rounded-lg p-2 bg-muted/30">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={generateChartData("3M").map((d) => ({
                      ...d,
                      rsi: 45 + Math.random() * 25,
                    }))}
                  >
                    <ReferenceLine
                      y={70}
                      stroke="var(--danger)"
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={30}
                      stroke="var(--warning)"
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={50}
                      stroke="var(--ink3)"
                      strokeDasharray="2 2"
                    />
                    <Line
                      type="monotone"
                      dataKey="rsi"
                      stroke="var(--p-mom)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  RSI at 62 shows momentum is positive but not extreme.
                  There&apos;s room for price to continue higher before reaching
                  overbought territory (70+). Last oversold reading (&lt;30) was
                  in July - those who bought then are sitting on good gains.
                </p>
                <div className="text-xs font-medium">
                  <span className="text-muted-foreground">Signal:</span>{" "}
                  <span className="text-orange-600">Buy &lt;40</span> |{" "}
                  <span className="text-red-600">Sell &gt;75</span> |{" "}
                  <span className="text-green-600">
                    Current: Hold/Accumulate
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: MACD */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">MACD</CardTitle>
                <div className="group relative">
                  <span className="text-xs text-muted-foreground cursor-help border-b border-dashed border-muted-foreground">
                    What is MACD?
                  </span>
                  <div className="absolute hidden group-hover:block w-64 p-2 bg-popover border rounded-md shadow-lg text-xs z-10 -left-20 top-6">
                    Momentum indicator showing relationship between two moving
                    averages. Crossovers signal trend changes
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">MACD Line:</span>
                  <span className="font-semibold">28.5</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Signal Line:</span>
                  <span className="font-semibold">22.3</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Histogram:</span>
                  <span className="font-semibold text-green-600">+6.2</span>
                </div>
                <div className="pt-2 border-t">
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    🟢 Bullish crossover
                  </Badge>
                </div>
              </div>

              {/* MACD Chart */}
              <div className="h-[120px] border rounded-lg p-2 bg-muted/30">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={generateChartData("3M").map((d, i) => ({
                      ...d,
                      macd: -5 + i * 0.5 + Math.random() * 3,
                      signal: -5 + i * 0.45 + Math.random() * 2,
                    }))}
                  >
                    <ReferenceLine y={0} stroke="var(--ink3)" />
                    <Line
                      type="monotone"
                      dataKey="macd"
                      stroke="var(--p-found)"
                      strokeWidth={1.5}
                      dot={false}
                      name="MACD"
                    />
                    <Line
                      type="monotone"
                      dataKey="signal"
                      stroke="var(--warning)"
                      strokeWidth={1.5}
                      dot={false}
                      name="Signal"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  MACD crossed above signal line on Oct 3 - bullish signal.
                  Histogram is positive and expanding, indicating strengthening
                  momentum. No negative divergence (price and MACD both making
                  higher highs). This setup typically leads to further upside.
                </p>
                <p className="text-xs font-medium text-green-600">
                  Bullish crossover 3 weeks ago - early in trend move
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: Stochastic */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Stochastic</CardTitle>
                <div className="group relative">
                  <span className="text-xs text-muted-foreground cursor-help border-b border-dashed border-muted-foreground">
                    What is Stochastic?
                  </span>
                  <div className="absolute hidden group-hover:block w-64 p-2 bg-popover border rounded-md shadow-lg text-xs z-10 -left-40 top-6">
                    Compares closing price to price range over period. Shows
                    momentum and turning points
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    %K Line:
                  </span>
                  <span className="text-xl font-bold">68</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    %D Line:
                  </span>
                  <span className="text-xl font-bold">62</span>
                </div>
                <div className="pt-2 border-t">
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    🟢 Bullish (50-80)
                  </Badge>
                </div>
                <div className="pt-1">
                  <p className="text-sm font-medium">Positive momentum</p>
                </div>
              </div>

              {/* Stochastic Chart */}
              <div className="h-[120px] border rounded-lg p-2 bg-muted/30">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={generateChartData("3M").map((d) => ({
                      ...d,
                      k: 40 + Math.random() * 35,
                      d: 38 + Math.random() * 33,
                    }))}
                  >
                    <ReferenceLine
                      y={80}
                      stroke="var(--danger)"
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={20}
                      stroke="var(--warning)"
                      strokeDasharray="3 3"
                    />
                    <Line
                      type="monotone"
                      dataKey="k"
                      stroke="var(--p-mom)"
                      strokeWidth={1.5}
                      dot={false}
                      name="%K"
                    />
                    <Line
                      type="monotone"
                      dataKey="d"
                      stroke="var(--p-mom)"
                      strokeWidth={1.5}
                      dot={false}
                      name="%D"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Stochastic at 68 confirms upward momentum. Lines in bullish
                  zone but not overbought. Watch for bearish crossover above 80
                  as potential reversal warning. Currently, momentum remains
                  supportive of higher prices.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Momentum Summary */}
        <Card className="mt-4 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <span>Momentum Verdict:</span>
                <Badge className="bg-green-500 text-white">
                  🟢 POSITIVE ACROSS INDICATORS
                </Badge>
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All three momentum indicators aligned bullish - RSI healthy,
                MACD positive crossover, Stochastic in bullish zone. This
                suggests the current uptrend has legs. Watch for divergences
                (price making new highs but indicators not confirming) as early
                warning sign.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 5: SUPPORT & RESISTANCE LEVELS */}
      <div id="support-resistance">
        <div className="mb-3">
          <p className="text-muted-foreground text-sm mb-4">
            Where are the critical price levels that could act as floors or
            ceilings?
          </p>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🎚️ Key Support & Resistance Zones
          </h3>
        </div>

        {/* Visual Price Ladder */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="space-y-1 font-mono text-sm">
              {/* Strong Resistance - Psychological */}
              <div className="flex items-center gap-2 py-2 opacity-60">
                <span className="w-16 text-right font-semibold">₹2,000</span>
                <div className="flex-1 border-t-2 border-dashed border-gray-400" />
                <span className="text-xs text-muted-foreground">
                  Strong Resistance (Psychological)
                </span>
              </div>

              {/* Major Resistance - 52W High */}
              <div className="flex items-center gap-2 py-3 bg-red-50 dark:bg-red-950/20 rounded px-2">
                <span className="w-16 text-right font-bold text-red-600">
                  ₹1,950
                </span>
                <div className="flex-1 border-t-4 border-red-500" />
                <span className="text-sm font-semibold text-red-600">
                  🔴 Major Resistance (52W High)
                </span>
              </div>
              <div className="ml-20 text-xs text-muted-foreground italic mb-2">
                [Price needs to break this]
              </div>

              {/* Minor Resistance */}
              <div className="flex items-center gap-2 py-2">
                <span className="w-16 text-right font-semibold">₹1,900</span>
                <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                <span className="text-xs text-muted-foreground">
                  Minor Resistance
                </span>
              </div>

              {/* Immediate Resistance */}
              <div className="flex items-center gap-2 py-2">
                <span className="w-16 text-right font-semibold">₹1,850</span>
                <div className="flex-1 border-t-2 border-gray-400" />
                <span className="text-xs text-muted-foreground">
                  Immediate Resistance
                </span>
              </div>
              <div className="ml-20 text-xs text-muted-foreground italic mb-2">
                (Current consolidation top)
              </div>

              {/* CURRENT PRICE */}
              <div className="flex items-center gap-2 py-3 bg-indigo-50 dark:bg-indigo-950/30 rounded px-2 my-3">
                <span className="w-16 text-right font-bold text-lg text-indigo-600">
                  ₹1,820
                </span>
                <div className="flex-1 border-t-4 border-indigo-500" />
                <span className="text-base font-bold text-indigo-600">
                  💰 CURRENT PRICE
                </span>
              </div>

              {/* Immediate Support */}
              <div className="flex items-center gap-2 py-3 bg-green-50 dark:bg-green-950/20 rounded px-2 mt-3">
                <span className="w-16 text-right font-bold text-green-600">
                  ₹1,750
                </span>
                <div className="flex-1 border-t-4 border-green-500" />
                <span className="text-sm font-semibold text-green-600">
                  🟢 Immediate Support (20 DMA)
                </span>
              </div>
              <div className="ml-20 text-xs text-muted-foreground italic mb-2">
                (Recent breakout level)
              </div>

              {/* Minor Support */}
              <div className="flex items-center gap-2 py-2">
                <span className="w-16 text-right font-semibold">₹1,700</span>
                <div className="flex-1 border-t-2 border-gray-400" />
                <span className="text-xs text-muted-foreground">
                  Minor Support (50 DMA)
                </span>
              </div>

              {/* Strong Support */}
              <div className="flex items-center gap-2 py-3 bg-green-50 dark:bg-green-950/20 rounded px-2">
                <span className="w-16 text-right font-bold text-green-600">
                  ₹1,650
                </span>
                <div className="flex-1 border-t-4 border-green-500" />
                <span className="text-sm font-semibold text-green-600">
                  🟢 Strong Support
                </span>
              </div>
              <div className="ml-20 text-xs text-muted-foreground italic mb-2">
                (Previous resistance, now support)
              </div>

              {/* Major Support */}
              <div className="flex items-center gap-2 py-2">
                <span className="w-16 text-right font-semibold">₹1,580</span>
                <div className="flex-1 border-t-2 border-dashed border-green-400" />
                <span className="text-xs text-muted-foreground">
                  Major Support (200 DMA)
                </span>
              </div>

              {/* Psychological Support */}
              <div className="flex items-center gap-2 py-2 opacity-60">
                <span className="w-16 text-right font-semibold">₹1,500</span>
                <div className="flex-1 border-t-2 border-dashed border-gray-400" />
                <span className="text-xs text-muted-foreground">
                  Psychological Support
                </span>
              </div>
            </div>

            {/* Price Distance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Current to Resistance
                </p>
                <p className="text-lg font-bold text-green-600">+7.1%</p>
                <p className="text-xs text-muted-foreground">₹130 away</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Current to Support
                </p>
                <p className="text-lg font-bold text-red-500">-3.8%</p>
                <p className="text-xs text-muted-foreground">₹70 away</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Risk-Reward Ratio
                </p>
                <p className="text-lg font-bold text-indigo-600">1:1.8</p>
                <p className="text-xs text-green-600 font-medium">Favorable</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support and Resistance Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT: Support Zones */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <ArrowDown className="h-4 w-4 text-green-600" />
              Support Zones (Buy on Dips)
            </h4>

            {/* Immediate Support */}
            <Card className="border-green-200 dark:border-green-900">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">Immediate Support</p>
                    <p className="text-2xl font-bold text-green-600">₹1,750</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    🟢 Strong
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">
                      Recent breakout + 20 DMA
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Why:</p>
                    <p className="text-xs">Price held here 3 times in Sept</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      Action:
                    </p>
                    <p className="text-xs font-medium">
                      First support to watch on pullback
                    </p>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Hold Probability:
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      75%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strong Support */}
            <Card className="border-green-200 dark:border-green-900">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">Strong Support</p>
                    <p className="text-2xl font-bold text-green-600">₹1,650</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    🟢 Very Strong
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">
                      Previous resistance flipped
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Why:</p>
                    <p className="text-xs">Multiple tests, high volume zone</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      Action:
                    </p>
                    <p className="text-xs font-medium">
                      Ideal buy zone if correction happens
                    </p>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Hold Probability:
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      85%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Major Support */}
            <Card className="border-green-200 dark:border-green-900">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">Major Support</p>
                    <p className="text-2xl font-bold text-green-600">₹1,580</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    🟢 Critical
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">200 DMA + trend line</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Why:</p>
                    <p className="text-xs">
                      Structural support for bull market
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      Action:
                    </p>
                    <p className="text-xs font-medium text-red-600">
                      Break of this = trend change
                    </p>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Hold Probability:
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      90%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Resistance Zones */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <ArrowUp className="h-4 w-4 text-red-600" />
              Resistance Zones (Profit Targets)
            </h4>

            {/* Immediate Resistance */}
            <Card className="border-orange-200 dark:border-orange-900">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">Immediate Resistance</p>
                    <p className="text-2xl font-bold text-orange-600">₹1,850</p>
                  </div>
                  <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                    🟡 Moderate
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">Consolidation top</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Why:</p>
                    <p className="text-xs">Upper range of recent trading</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      Action:
                    </p>
                    <p className="text-xs font-medium">First hurdle to cross</p>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Break Probability:
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      60%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Major Resistance */}
            <Card className="border-red-200 dark:border-red-900">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">Major Resistance</p>
                    <p className="text-2xl font-bold text-red-600">₹1,950</p>
                  </div>
                  <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
                    🔴 Strong
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">52-week high</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Why:</p>
                    <p className="text-xs">Psychological + technical barrier</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      Action:
                    </p>
                    <p className="text-xs font-medium">
                      Break = new high territory
                    </p>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Break Probability:
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      40-45%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Psychological Level */}
            <Card className="border-red-200 dark:border-red-900">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">Psychological Level</p>
                    <p className="text-2xl font-bold text-red-600">₹2,000</p>
                  </div>
                  <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
                    🔴 Very Strong
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">Round number</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Why:</p>
                    <p className="text-xs">Major psychological milestone</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      Action:
                    </p>
                    <p className="text-xs font-medium">
                      Extended target if momentum continues
                    </p>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Reach Probability:
                    </span>
                    <span className="text-sm font-bold text-red-600">30%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trading Strategy Table */}
        <Card className="mt-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Level-Based Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold">
                      If Price Goes To...
                    </th>
                    <th className="text-left py-2 font-semibold">
                      Action Suggested
                    </th>
                    <th className="text-left py-2 font-semibold">Reasoning</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="border-b">
                    <td className="py-3 font-medium">₹1,950-₹2,000</td>
                    <td className="py-3 text-orange-600 font-medium">
                      Consider booking partial profits
                    </td>
                    <td className="py-3 text-muted-foreground">
                      Strong resistance zone
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 font-medium">₹1,850-₹1,900</td>
                    <td className="py-3 text-blue-600 font-medium">
                      Hold existing positions
                    </td>
                    <td className="py-3 text-muted-foreground">
                      Consolidation likely
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 font-medium">₹1,750-₹1,800</td>
                    <td className="py-3 text-gray-600 font-medium">
                      Current range - neutral
                    </td>
                    <td className="py-3 text-muted-foreground">
                      Wait for breakout/breakdown
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 font-medium">₹1,650-₹1,750</td>
                    <td className="py-3 text-green-600 font-medium">
                      Accumulation opportunity
                    </td>
                    <td className="py-3 text-muted-foreground">
                      Strong support, buyable dip
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Below ₹1,650</td>
                    <td className="py-3 text-red-600 font-medium">
                      Re-evaluate position
                    </td>
                    <td className="py-3 text-muted-foreground">
                      Support broken, trend weakening
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 6: VOLUME ANALYSIS */}
      <div id="volume-analysis">
        <div className="mb-3">
          <p className="text-muted-foreground text-sm mb-4">
            Volume confirms price moves. Let&apos;s see what the volume is
            telling us
          </p>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            📊 Volume & Liquidity Analysis
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* LEFT COLUMN: Volume Trends */}
          <div className="md:col-span-3 space-y-4">
            {/* Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Volume Trends (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={generateChartData("6M").map((d) => ({
                        ...d,
                        volumeColor: Math.random() > 0.5 ? d.volume : -d.volume,
                      }))}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--ink)",
                          border: "1px solid var(--ink2)",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "11px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="var(--p-mom)"
                        strokeWidth={1}
                        dot={false}
                        name="20D Avg Volume"
                      />
                      <Bar
                        dataKey="volume"
                        fill="var(--p-found)"
                        opacity={0.6}
                        name="Volume"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Current Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Current Volume Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Today&apos;s Volume
                    </p>
                    <p className="text-lg font-bold">28L</p>
                    <p className="text-xs text-muted-foreground">shares</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Avg Volume (20D)
                    </p>
                    <p className="text-lg font-bold">25L</p>
                    <p className="text-xs text-muted-foreground">shares</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Today vs Avg
                    </p>
                    <p className="text-lg font-bold text-green-600">+12%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Value Traded
                    </p>
                    <p className="text-lg font-bold">₹5,100</p>
                    <p className="text-xs text-muted-foreground">Crore</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Liquidity
                    </p>
                    <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 mt-1">
                      🟢 Excellent
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volume Observations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Volume Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    <p className="text-sm text-muted-foreground flex-1">
                      Volume spiked to 42L shares on Oct 5 breakout (+68% above
                      avg)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    <p className="text-sm text-muted-foreground flex-1">
                      Recent uptrend accompanied by above-average volume
                      (bullish)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    <p className="text-sm text-muted-foreground flex-1">
                      Down days showing lower volume than up days (healthy)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    <p className="text-sm text-muted-foreground flex-1">
                      No distribution pattern (selling volume) detected
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volume-Price Relationship */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Volume-Price Relationship Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Rising price + Rising volume
                      </p>
                      <p className="text-xs text-muted-foreground">
                        🟢 Healthy uptrend
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 opacity-50">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Rising price + Falling volume
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ⚠️ Weak rally (not current case)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 opacity-50">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Falling price + Rising volume
                      </p>
                      <p className="text-xs text-muted-foreground">
                        🔴 Distribution (not present)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Volume Insights */}
          <div className="md:col-span-2 space-y-4">
            {/* What Volume Tells Us */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  What Volume Tells Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Volume on Breakouts
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Oct 5 breakout:</span>
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                        42L 🟢
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Sept 15 attempt:</span>
                      <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
                        18L 🔴
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 border-t italic">
                      Breakout with conviction
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Volume on Pullbacks
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-xs">Oct 12 dip:</span>
                      <span className="text-xs font-medium">15L (low)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs">Oct 18 dip:</span>
                      <span className="text-xs font-medium">17L (low)</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 border-t italic">
                      Weak selling pressure
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Recent Pattern
                  </p>
                  <div className="space-y-2">
                    <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded">
                      <p className="text-xs">Up days: Average 28L shares</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded">
                      <p className="text-xs">Down days: Average 19L shares</p>
                    </div>
                    <p className="text-xs font-medium text-green-600 pt-2">
                      Buyers more aggressive than sellers - bullish accumulation
                      pattern
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Percentage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery Percentage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Avg Delivery:
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      68%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Market Avg:</span>
                    <span className="font-semibold">56%</span>
                  </div>
                  <div className="pt-2 border-t">
                    <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 mb-2">
                      🟢 High (+12 pts above market)
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Genuine investing, not just trading/speculation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liquidity Rating */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Liquidity Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Value:</span>
                    <span className="font-semibold">₹5,100 Cr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entry/Exit:</span>
                    <span className="font-semibold text-green-600">Easy</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impact Cost:</span>
                    <span className="font-semibold text-green-600">
                      Minimal
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <Badge className="bg-green-500 text-white w-full justify-center py-2">
                      🟢 Excellent (Top 50 stocks)
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Suitable for retail and institutional investors
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* SECTION 7: CHART PATTERNS & SIGNALS */}
      <div id="chart-patterns">
        <div className="mb-3">
          <p className="text-muted-foreground text-sm mb-4">
            Let&apos;s identify any meaningful chart patterns or setups
          </p>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pattern Recognition
          </h3>
        </div>

        {/* Current Active Patterns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* PATTERN 1: Ascending Triangle */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Ascending Triangle</CardTitle>
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                  Bullish
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mini Chart */}
              <div className="h-[120px] border rounded-lg p-2 bg-muted/30">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData("1M")}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--success)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <ReferenceLine
                      y={1850}
                      stroke="var(--danger)"
                      strokeDasharray="3 3"
                      label="Resistance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formation:</span>
                  <span className="font-medium">6 weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">Bullish continuation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Breakout Target:
                  </span>
                  <span className="font-medium text-green-600">₹1,950</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="font-medium">65-70%</span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Stock consolidating in ascending triangle - higher lows with
                  flat resistance. Breakout above ₹1,850 on good volume could
                  trigger move to ₹1,950. Watch for false breakout - needs
                  volume confirmation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* PATTERN 2: Golden Cross */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Golden Cross</CardTitle>
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                  Bullish Signal
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mini Chart with MAs */}
              <div className="h-[120px] border rounded-lg p-2 bg-muted/30">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData("6M")}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--p-mom)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crossover Date:</span>
                  <span className="font-medium">Aug 15, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-green-600">
                    Active & widening
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strength:</span>
                  <span className="font-medium">Strong</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="font-medium">60-65%</span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  50-day moving average crossed above 200-day average - classic
                  bullish signal called &quot;Golden Cross&quot;. This suggests
                  momentum shift to bullish. Price typically continues higher
                  after this crossover for several months.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* PATTERN 3: Higher Highs & Lows */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Higher Highs & Lows</CardTitle>
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                  Uptrend Structure
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mini Chart with swing points */}
              <div className="h-[120px] border rounded-lg p-2 bg-muted/30">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData("3M")}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--p-found)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-semibold mb-2">Recent Swing Points:</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      High 1 (Sept 1):
                    </span>
                    <span className="font-medium">₹1,680</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      High 2 (Sept 22):
                    </span>
                    <span className="font-medium">₹1,770</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      High 3 (Oct 12):
                    </span>
                    <span className="font-medium">₹1,850</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Current:</span>
                    <span className="font-bold">₹1,820</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Clear uptrend - each peak and trough higher than the last. As
                  long as price stays above ₹1,720, uptrend remains intact.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Signals Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Active Buy Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span>Golden Cross (50 DMA above 200 DMA)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span>MACD bullish crossover</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span>RSI in healthy bullish zone (50-70)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span>Price above all major moving averages</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span>Ascending triangle forming (pre-breakout)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span>Higher highs, higher lows structure</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Watch Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Active Sell Signals:
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    (None currently)
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-semibold mb-2">
                    Neutral/Watch Signals:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs">
                        Approaching previous 52W high (₹1,950) - may face
                        resistance
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs">
                        RSI near 62 - watch for overbought if crosses 75
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 8: TECHNICAL VERDICT */}
      <div id="technical-verdict">
        <div className="mb-3">
          <p className="text-muted-foreground text-sm mb-4">
            Putting it all together - what&apos;s the technical picture telling
            us?
          </p>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🎯 Technical Summary & Outlook
          </h3>
        </div>

        {/* Technical Score Card */}
        <Card className="mb-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Technical Score
                </p>
                <div className="text-6xl font-bold text-green-600">
                  78<span className="text-3xl">/100</span>
                </div>
                <Badge className="mt-3 bg-green-500 text-white text-base px-4 py-1">
                  🟢 Bullish
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Trend</p>
                  <p className="font-semibold text-green-600">
                    All timeframes aligned
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Momentum</p>
                  <p className="font-semibold text-green-600">
                    Strong & building
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Pattern</p>
                  <p className="font-semibold text-green-600">
                    Bullish continuation
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Setup</p>
                  <p className="font-semibold text-green-600">Favorable</p>
                </div>
              </div>
              <p className="text-base font-medium text-foreground pt-4 border-t">
                Clear uptrend with positive momentum - technical setup favorable
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Strengths (What&apos;s Working)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    Established uptrend across all timeframes
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    Trading above all moving averages (20/50/200)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    Momentum indicators positive (RSI, MACD)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">Volume confirming price moves</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    Clean higher highs, higher lows structure
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    Golden Cross active and widening
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">Support levels holding well</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    High delivery % showing conviction
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Concerns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                Concerns (What to Watch)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    Approaching major resistance at ₹1,950 (52W high)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    Short-term consolidation could extend
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    Need volume on breakout above ₹1,850
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    RSI approaching overbought on daily chart
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    Market breadth could affect individual stock
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    Gap between price and 200 DMA widening (15%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-blue-600">
                <Target className="h-4 w-4" />
                Opportunities (Actionable)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span className="text-xs">
                    Breakout above ₹1,850 targets ₹1,950-₹2,000
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span className="text-xs">
                    Dips to ₹1,750-₹1,780 are buyable (support zone)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span className="text-xs">
                    Ascending triangle breakout setup forming
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span className="text-xs">
                    Risk-reward favorable (support close, target far)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span className="text-xs">
                    Momentum just building, not exhausted yet
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Outlook by Timeframe */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Technical Outlook by Timeframe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Short-Term */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    🟢 Bullish
                  </Badge>
                  <span className="font-semibold">Short-Term (1-4 weeks)</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium text-green-600">
                      ₹1,900-₹1,950
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Support:</span>
                    <span className="font-medium">₹1,750-₹1,780</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Hold long positions, add on dips to support
                </p>
              </div>

              {/* Medium-Term */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    🟢 Bullish
                  </Badge>
                  <span className="font-semibold">
                    Medium-Term (1-3 months)
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium text-green-600">
                      ₹1,950-₹2,100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Support:</span>
                    <span className="font-medium">₹1,650-₹1,700</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Uptrend likely to continue, manage position sizing
                </p>
              </div>

              {/* Long-Term */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                    🟢 Bullish
                  </Badge>
                  <span className="font-semibold">Long-Term (3-12 months)</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium text-green-600">
                      ₹2,000-₹2,200
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Support:</span>
                    <span className="font-medium">₹1,580 (200 DMA)</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Structural bull market intact, suitable for holding
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk-Reward Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Risk-Reward Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Entry at Current Price (₹1,820)
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Upside Target:
                      </span>
                      <span className="font-medium text-green-600">
                        ₹1,950 (+7.1%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Downside Risk:
                      </span>
                      <span className="font-medium text-red-600">
                        ₹1,750 (-3.8%)
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">
                        Risk-Reward Ratio:
                      </span>
                      <span className="font-bold text-lg">1 : 1.85</span>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 mt-3">
                    🟢 Favorable
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Stop Loss Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Conservative</p>
                    <p className="text-xs text-muted-foreground">
                      20 DMA breach
                    </p>
                  </div>
                  <span className="font-bold">Below ₹1,750</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <p className="font-medium">Moderate</p>
                    <p className="text-xs text-muted-foreground">
                      50 DMA breach
                    </p>
                  </div>
                  <span className="font-bold">Below ₹1,700</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <p className="font-medium">Aggressive</p>
                    <p className="text-xs text-muted-foreground">Trend break</p>
                  </div>
                  <span className="font-bold">Below ₹1,650</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* For Different Trading Styles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Recommendations by Trading Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <p className="font-semibold text-sm mb-2">
                    If You&apos;re a Swing Trader (Days to Weeks)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bullish. Can go long with stop at ₹1,750. Target
                    ₹1,900-₹1,950.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-semibold text-sm mb-2">
                    If You&apos;re a Position Trader (Weeks to Months)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Favorable setup. Buy on dips to ₹1,750-₹1,780 support zone.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <p className="font-semibold text-sm mb-2">
                    If You&apos;re an Investor (Don&apos;t care about timing)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Technical picture supportive. Current levels fine for
                    long-term entry.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-semibold text-sm mb-2">
                    If You&apos;re Sitting on Profits
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Trail stop to ₹1,750. Book partial at ₹1,950 resistance,
                    hold rest.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 9: WHAT'S NEXT */}
      <div id="whats-next">
        <div className="mb-3">
          <p className="text-muted-foreground text-sm mb-4">
            Checked the charts? Here&apos;s what to explore next:
          </p>
          <h3 className="text-lg font-semibold">What&apos;s Next</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/research/stock-screener/${symbol}?tab=activity`}>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="text-4xl">💎</div>
                  <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    See Who&apos;s Accumulating
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Check institutional buying, promoter activity, insider
                    trades
                  </p>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    → Go to Activity Tab
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/research/stock-screener/${symbol}?tab=news`}>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="text-4xl">📈</div>
                  <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    Stay Updated on Developments
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Latest announcements, results, news affecting the stock
                  </p>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    → Go to News Tab
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/research/stock-screener/${symbol}?tab=financials`}>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="text-4xl">🏢</div>
                  <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    Back to Fundamentals
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Double-check business performance supports technical setup
                  </p>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    → Go to Financials Tab
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Technical;
