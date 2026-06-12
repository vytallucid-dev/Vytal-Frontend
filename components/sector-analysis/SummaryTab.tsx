"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  DollarSign,
  FileChartColumn,
  Globe,
  LineChart as LineChartIcon,
  Percent,
  PieChart as PieChartIcon,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { JSX } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

interface SummaryTabProps {
  sectorData: any;
  performanceTimeRange: "3M" | "6M" | "1Y" | "5Y" | "ALL";
  setPerformanceTimeRange: (range: "3M" | "6M" | "1Y" | "5Y" | "ALL") => void;
  sectorPerformanceData: any;
  performanceData: any;
  chartConfig: ChartConfig;
  concentrationData: any;
  concentrationConfig: ChartConfig;
  ChartLegendCustom: () => JSX.Element;
  getRatingColor: (rating: string) => string;
  getHealthColor: (score: number) => string;
  getChangeColor: (change: string) => string;
}

export function SummaryTab({
  sectorData,
  performanceTimeRange,
  setPerformanceTimeRange,
  sectorPerformanceData,
  performanceData,
  chartConfig,
  concentrationData,
  concentrationConfig,
  ChartLegendCustom,
  getRatingColor,
  getHealthColor,
  getChangeColor,
}: SummaryTabProps) {
  return (
    <div className="space-y-8">
      {/* Key Financial Metrics */}
      <motion.section
        id="key-metrics"
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-3">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500" />
            Key Financial Metrics
          </h2>
          <p className="text-sm text-muted-foreground italic">
            I've analyzed the latest data. Here's what matters:
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <DollarSign className="w-8 h-8 mx-auto text-green-500" />
                <div className="text-2xl font-bold">$2.4T</div>
                <div className="text-sm text-muted-foreground">
                  Total Market Cap
                </div>
              </div>
              <div className="text-center space-y-2">
                <Percent className="w-8 h-8 mx-auto text-blue-500" />
                <div className="text-2xl font-bold">18.5%</div>
                <div className="text-sm text-muted-foreground">
                  Avg P/E Ratio
                </div>
              </div>
              <div className="text-center space-y-2">
                <TrendingUp className="w-8 h-8 mx-auto text-emerald-500" />
                <div className="text-2xl font-bold">12.3%</div>
                <div className="text-sm text-muted-foreground">
                  Revenue Growth
                </div>
              </div>
              <div className="text-center space-y-2">
                <FileChartColumn className="w-8 h-8 mx-auto text-purple-500" />
                <div className="text-2xl font-bold">8.7%</div>
                <div className="text-sm text-muted-foreground">
                  Profit Margin
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Sector Overview Card */}
      <motion.section
        id="sector-overview"
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-3">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            Sector Overview
          </h2>
          <p className="text-sm text-muted-foreground italic">
            Now, let's look at the summary and basic info about this sector
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Description */}
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {sectorData.sectorInfo.description}
                </p>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center space-y-2">
                  <Users className="w-8 h-8 mx-auto text-blue-500" />
                  <div className="text-2xl font-bold">
                    {sectorData.sectorInfo.totalCompanies}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Companies
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-green-500" />
                  <div className="text-2xl font-bold">
                    {sectorData.sectorInfo.avgAge} yrs
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Age
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <Globe className="w-8 h-8 mx-auto text-purple-500" />
                  <div className="text-2xl font-bold">Global</div>
                  <div className="text-sm text-muted-foreground">
                    Market Reach
                  </div>
                </div>
              </div>

              {/* Investment Objective */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2 text-amber-500">
                  Investment Objective
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {sectorData.sectorInfo.objective}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* SMART HIGHLIGHTS */}
      <motion.section
        id="smart-highlights"
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-3">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            🎯 What You Should Know Right Now
          </h2>
          <p className="text-sm text-muted-foreground italic">
            I've analyzed the latest data. Here's what matters:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {sectorData.smartInsights.map((insight: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full bg-muted/30 border-border/50 hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{insight.icon}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">{insight.trend}</h3>
                        {insight.direction === "up" && (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        {insight.direction === "down" && (
                          <ArrowDown className="w-3.5 h-3.5 text-red-500" />
                        )}
                        {insight.direction === "neutral" && (
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.detail}
                      </p>
                      <p className="text-xs text-muted-foreground/70 italic flex items-start gap-1.5 pt-1 border-t border-border/30">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{insight.impact}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm italic text-muted-foreground/90 font-medium">
          Bottom line: Strong credit growth and improving margins, but watch
          valuations carefully
        </p>
      </motion.section>

      {/* Sector Performance Chart */}
      <motion.section
        id="performance-chart"
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-3">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-amber-500" />
            Sector Performance Over Time
          </h2>
          <p className="text-sm text-muted-foreground italic">
            Now, let's look at the numbers and how the sector is performing
          </p>
        </div>
        <Card className="overflow-hidden border-muted/40 bg-gradient-to-br from-amber-500/[0.02] via-transparent to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold">
                  $
                  {sectorPerformanceData[performanceTimeRange][
                    sectorPerformanceData[performanceTimeRange].length - 1
                  ].value.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  +
                  {(
                    ((sectorPerformanceData[performanceTimeRange][
                      sectorPerformanceData[performanceTimeRange].length - 1
                    ].value -
                      sectorPerformanceData[performanceTimeRange][0].value) /
                      sectorPerformanceData[performanceTimeRange][0].value) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5 border border-border/50">
                {(["3M", "6M", "1Y", "5Y", "ALL"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setPerformanceTimeRange(range)}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all duration-200 ${
                      performanceTimeRange === range
                        ? "bg-amber-500 text-black shadow-sm shadow-amber-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            {/* Chart Container - Compact */}
            <div className="relative rounded-lg border border-border/50 bg-gradient-to-br from-background via-background to-muted/10 p-2">
              <ChartContainer
                config={{
                  value: {
                    label: "Sector Index",
                    color: "hsl(45, 90%, 60%)",
                  },
                }}
                className="h-[220px] w-full"
              >
                <LineChart
                  data={sectorPerformanceData[performanceTimeRange]}
                  margin={{
                    left: 10,
                    right: 10,
                    top: 15,
                    bottom: 15,
                  }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(45, 90%, 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(45, 90%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    horizontal={true}
                    opacity={0.2}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-[9px]"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={60}
                    className="text-[9px]"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [
                          `$${Number(value).toLocaleString()}`,
                          "Index Value",
                        ]}
                        className="bg-background/95 border border-amber-500/20 text-foreground backdrop-blur-sm shadow-lg"
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(45, 90%, 60%)"
                    strokeWidth={2.5}
                    dot={false}
                    fill="url(#colorValue)"
                    activeDot={{
                      r: 5,
                      stroke: "hsl(45, 90%, 60%)",
                      strokeWidth: 2,
                      fill: "hsl(var(--background))",
                    }}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            {/* Compact Performance Stats */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="group relative overflow-hidden rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 hover:border-emerald-500/40 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-emerald-600 font-semibold mb-1">
                    <TrendingUp className="w-2.5 h-2.5" />
                    Return
                  </div>
                  <div className="text-lg font-bold text-emerald-500">
                    +
                    {(
                      ((sectorPerformanceData[performanceTimeRange][
                        sectorPerformanceData[performanceTimeRange].length - 1
                      ].value -
                        sectorPerformanceData[performanceTimeRange][0].value) /
                        sectorPerformanceData[performanceTimeRange][0].value) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-lg border border-border/40 bg-muted/20 p-2 hover:border-primary/40 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    <ArrowUp className="w-2.5 h-2.5" />
                    High
                  </div>
                  <div className="text-lg font-bold">
                    $
                    {Math.max(
                      ...sectorPerformanceData[performanceTimeRange].map(
                        (d: any) => d.value
                      )
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-lg border border-border/40 bg-muted/20 p-2 hover:border-primary/40 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    <ArrowDown className="w-2.5 h-2.5" />
                    Low
                  </div>
                  <div className="text-lg font-bold">
                    $
                    {Math.min(
                      ...sectorPerformanceData[performanceTimeRange].map(
                        (d: any) => d.value
                      )
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 hover:border-amber-500/50 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-amber-600 font-semibold mb-1">
                    <Activity className="w-2.5 h-2.5" />
                    Vol
                  </div>
                  <div className="text-lg font-bold text-amber-500">
                    {(
                      ((Math.max(...sectorPerformanceData[performanceTimeRange].map((d: any) => d.value)) -
                        Math.min(...sectorPerformanceData[performanceTimeRange].map((d: any) => d.value))) /
                        Math.min(...sectorPerformanceData[performanceTimeRange].map((d: any) => d.value))) *
                      100
                    ).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Health Pillars */}
      <motion.section
        id="health-pillars"
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-3">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-amber-500" />
            How healthy is this sector and why?
          </h2>
          <p className="text-sm text-muted-foreground italic">
            A breakdown of the key health pillars driving sector strength
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sectorData.healthPillars.map((pillar: any, index: number) => (
                <motion.div
                  key={pillar.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <h4 className="font-medium">{pillar.name}</h4>
                    <Badge className={getRatingColor(pillar.rating)}>
                      {pillar.rating}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.explanation}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Market Concentration & Risk Analysis */}
      <motion.div
        id="market-concentration"
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Market Concentration */}
        <section className="mb-12">
          <div className="mb-3">
            <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-amber-500" />
              Market Concentration
            </h2>
            <p className="text-sm text-muted-foreground italic">
              Understanding the distribution of market share within the
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Pie Chart */}
                <div>
                  <ChartContainer config={concentrationConfig}>
                    <PieChart>
                      <Pie
                        data={concentrationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {concentrationData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            nameKey="name"
                            hideLabel
                            formatter={(value) => [`${value}%`, "Share"]}
                            className="bg-gray-900/95 border border-amber-500/20 text-amber-100 text-xs backdrop-blur-sm"
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Top 3 Holdings</span>
                    <span className="text-sm font-medium">42%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Top 10 Holdings</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Diversification Score</span>
                    <span className="text-sm font-medium">Medium</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Performance Comparison */}
        <section className="mb-12">
          <div className="mb-3">
            <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-amber-500" />
              Performance vs Market Benchmarks
            </h2>
            <p className="text-sm text-muted-foreground italic">
              Comparing sector performance against key market indices
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Actual Line Chart */}
                <div className="h-80">
                  <ChartContainer config={chartConfig}>
                    <LineChart
                      accessibilityLayer
                      data={performanceData}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        dataKey="sector"
                        type="monotone"
                        stroke="hsl(45, 85%, 55%)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        dataKey="nifty"
                        type="monotone"
                        stroke="hsl(38, 55%, 45%)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        dataKey="sensex"
                        type="monotone"
                        stroke="hsl(32, 40%, 35%)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                  <ChartLegendCustom />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </motion.div>

      {/* Top Performers */}
      <motion.section
        id="top-performers"
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-3">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Top Performing Stocks
          </h2>
          <p className="text-sm text-muted-foreground italic">
            Here are the strongest players in this space
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Market Cap</TableHead>
                  <TableHead>Health Score</TableHead>
                  <TableHead>Quarterly Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectorData.topStocks.map((stock: any) => (
                  <TableRow
                    key={stock.ticker}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{stock.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {stock.ticker}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {stock.marketCap}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-semibold ${getHealthColor(
                          stock.healthScore
                        )}`}
                      >
                        {stock.healthScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${getChangeColor(
                          stock.change
                        )}`}
                      >
                        {stock.change}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.section>

      {/* WHAT'S NEXT */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-sm text-muted-foreground italic mb-4">
          Ready to dig deeper? Here's where to go next:
        </p>

        <div className="space-y-3">
          <Card className="bg-muted/20 border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-0.5">
                    Detailed Health Analysis
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    See what makes these companies strong
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-0.5">Compare Financials</h4>
                  <p className="text-xs text-muted-foreground">
                    Which ones have the best margins and growth?
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <LineChartIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-0.5">
                    Analyze Individual Stocks
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Deep-dive into any company in this sector
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </div>
  );
}
