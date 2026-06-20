"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Building2,
  Calendar,
  ChevronRight,
  DollarSign,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis
} from "recharts";

interface ActivityTabProps {
  sectorData: any;
  getChangeColor?: (change: string) => string;
}

// Mock data for Activity Analysis
const activityData = {
  snapshot: {
    fii: {
      flow: "₹2,450 Cr",
      type: "BUY",
      status: "🟢 Strong Inflow",
      trend: "↗ 3rd consecutive month",
      context: "Foreign confidence high",
    },
    dii: {
      flow: "₹850 Cr",
      type: "BUY",
      status: "🟢 Buying",
      trend: "↗ Steady accumulation",
      context: "Domestic support strong",
    },
    delivery: {
      ratio: "68%",
      status: "🟢 High (>60% is good)",
      vsMarket: "+12%",
      context: "Genuine investing, not speculation",
    },
    promoter: {
      holding: "52.8%",
      change: "→ Stable (+0.2%)",
      pledged: "2.4% (Low)",
      status: "🟢 Stable ownership",
    },
  },

  story: {
    institutional: {
      title: "Institutional Interest",
      content:
        "Strong buying from both foreign and domestic institutions signals broad-based confidence. FII buying at 3x DII pace shows global investors are bullish on sector prospects.",
    },
    quality: {
      title: "Market Quality",
      content:
        "Delivery ratio of 68% (vs market's 56%) shows investors are holding positions, not day-trading. This indicates conviction in sector fundamentals.",
    },
    ownership: {
      title: "Ownership Stability",
      content:
        "Stable promoter holding at 52.8% with minimal pledging (2.4%) shows management confidence. No distress signals from ownership side.",
    },
  },

  fiiDiiFlows: [
    { month: "Jan", fii: 1200, dii: 450 },
    { month: "Feb", fii: -800, dii: 320 },
    { month: "Mar", fii: 1500, dii: 680 },
    { month: "Apr", fii: 2100, dii: 520 },
    { month: "May", fii: -400, dii: -200 },
    { month: "Jun", fii: 1800, dii: 750 },
    { month: "Jul", fii: 2200, dii: 610 },
    { month: "Aug", fii: 4200, dii: 890 },
    { month: "Sep", fii: 1400, dii: 380 },
    { month: "Oct", fii: 2450, dii: 850 },
    { month: "Nov", fii: 0, dii: 0 },
    { month: "Dec", fii: 0, dii: 0 },
  ],

  flowStats: {
    lastMonth: {
      fii: 2450,
      dii: 850,
      combined: 3300,
      status: "🟢 Strong Inflow",
    },
    lastQuarter: {
      fii: 6200,
      dii: 2100,
      combined: 8300,
      trend: "Consistent buying",
    },
    lastYear: {
      fii: 18500,
      dii: 7800,
      combined: 26300,
      pattern: "Net accumulation",
    },
  },

  flowInsights: [
    "FIIs have been net buyers for 8 out of last 12 months",
    "Largest monthly inflow was ₹4,200 Cr in Aug 2024",
    "DIIs showed selling only in 2 months (profit booking)",
    "FII buying accelerated in recent quarter (+45% vs previous)",
    "Combined institutional holding now at 31.2% (+2.8% YoY)",
  ],

  bulkDeals: [
    {
      date: "Oct 15",
      company: "HDFC Bank",
      party: "ABC Fund",
      type: "B",
      quantity: "2.5L",
      value: "₹450 Cr",
      dealType: "Bulk Buy",
    },
    {
      date: "Oct 12",
      company: "ICICI Bank",
      party: "XYZ MF",
      type: "S",
      quantity: "1.8L",
      value: "₹210 Cr",
      dealType: "Bulk Sell",
    },
    {
      date: "Oct 08",
      company: "Axis Bank",
      party: "PQR Invest",
      type: "B",
      quantity: "3.2L",
      value: "₹360 Cr",
      dealType: "Bulk Buy",
    },
    {
      date: "Oct 05",
      company: "Kotak Bank",
      party: "LMN Fund",
      type: "B",
      quantity: "1.5L",
      value: "₹280 Cr",
      dealType: "Bulk Buy",
    },
    {
      date: "Oct 02",
      company: "SBI",
      party: "RST Capital",
      type: "S",
      quantity: "2.1L",
      value: "₹165 Cr",
      dealType: "Bulk Sell",
    },
  ],

  bulkSummary: {
    totalBuys: 8,
    totalBuysValue: "₹1,850 Cr",
    totalSells: 3,
    totalSellsValue: "₹720 Cr",
    net: "+₹1,130 Cr (Bullish)",
  },

  dealPatterns: [
    "Mutual Funds are net buyers (6 buy vs 2 sell)",
    "FPIs increased stake in 4 companies",
    "Insurance companies added positions in 3 stocks",
    "No distress selling observed",
  ],

  deliveryData: [
    { month: "Aug", delivery: 64, market: 54 },
    { month: "Sep", delivery: 66, market: 55 },
    { month: "Oct", delivery: 68, market: 56 },
  ],

  deliveryByCompany: [
    { company: "HDFC Bank", delivery: 78, status: "Very High" },
    { company: "ICICI Bank", delivery: 72, status: "High" },
    { company: "Kotak Bank", delivery: 65, status: "Good" },
    { company: "Axis Bank", delivery: 58, status: "Moderate" },
    { company: "SBI", delivery: 54, status: "Moderate" },
  ],

  tradingMetrics: {
    volume: {
      avg: "₹8,500 Cr",
      change: "+12%",
      liquidity: "🟢 Excellent",
      context: "Easy to enter/exit positions",
    },
    volatility: {
      avgMove: "±1.2%",
      vsNifty: "Lower (Nifty at ±1.5%)",
      range: "-8% to +24%",
      stability: "🟢 Moderate volatility",
    },
    breadth: {
      advancing: "9 out of 12",
      newHighs: "4 companies",
      momentum: "🟢 Broad-based",
    },
  },

  promoterData: {
    avgHolding: 52.8,
    changeQoQ: "+0.2%",
    increased: 4,
    decreased: 2,
    stable: 6,
    avgPledged: 2.4,
    riskLevel: "🟢 Low (< 20% is safe)",
    highPledge: 1,
    zeroPledge: 8,
  },

  promoterTrend: [
    { quarter: "Q1 24", holding: 52.2 },
    { quarter: "Q2 24", holding: 52.4 },
    { quarter: "Q3 24", holding: 52.6 },
    { quarter: "Q4 24", holding: 52.8 },
  ],

  insiderActivity: {
    buys: {
      count: 12,
      value: "₹48 Cr",
      avg: "₹4 Cr",
      companies: 7,
    },
    sells: {
      count: 5,
      value: "₹22 Cr",
      nature: "Mostly scheduled/planned sales",
      reasons: "4 out of 5 tax/personal reasons",
    },
    netSentiment: "🟢 Bullish",
    ratio: "2.4:1",
  },

  upcomingEvents: [
    {
      category: "Earnings",
      date: "Oct 20",
      event: "HDFC Bank Q2 Results",
      impact: "High",
    },
    {
      category: "Earnings",
      date: "Oct 25",
      event: "ICICI Bank Q2 Results",
      impact: "High",
    },
    {
      category: "Dividend",
      date: "Oct 28",
      event: "Kotak Bank Ex-Dividend (₹15)",
      impact: "Medium",
    },
    {
      category: "Corporate",
      date: "Nov 05",
      event: "Axis Bank Board Meeting",
      impact: "Medium",
    },
    {
      category: "Policy",
      date: "Nov 08",
      event: "RBI Monetary Policy",
      impact: "High",
    },
    {
      category: "Data",
      date: "Nov 30",
      event: "Q2 GDP Data Release",
      impact: "Medium",
    },
  ],

  shareholdingPattern: [
    { name: "Promoters", value: 52.8, color: "var(--p-found)" },
    { name: "FIIs", value: 22.4, color: "var(--success)" },
    { name: "DIIs", value: 8.8, color: "var(--warning)" },
    { name: "Retail", value: 11.2, color: "var(--p-mom)" },
    { name: "Others", value: 4.8, color: "var(--ink3)" },
  ],

  shareholdingChanges: {
    fii: { change: "+1.2%", trend: "Accumulating" },
    dii: { change: "+0.3%", trend: "Steady" },
    promoter: { change: "+0.2%", trend: "Stable" },
    retail: { change: "-0.8%", trend: "Profit booking" },
  },

  concentration: {
    top5: "18.5%",
    largestFII: "3.2% (in HDFC Bank)",
    mostDiversified: "Kotak Bank (25% retail)",
    mostConcentrated: "SBI (68% promoter)",
  },
};

const getDeliveryColor = (delivery: number) => {
  if (delivery >= 70) return "text-emerald-500";
  if (delivery >= 60) return "text-blue-500";
  if (delivery >= 50) return "text-amber-500";
  return "text-red-500";
};

const getImpactBadge = (impact: string) => {
  if (impact === "High") return "bg-red-500/10 text-red-500 border-red-500/20";
  if (impact === "Medium")
    return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-blue-500/10 text-blue-500 border-blue-500/20";
};

const COLORS = ["var(--p-found)", "var(--success)", "var(--warning)", "var(--p-mom)", "var(--ink3)"];

export function ActivityTab({ sectorData, getChangeColor }: ActivityTabProps) {
  return (
    <div className="space-y-12">
      {/* SECTION 1: ACTIVITY SNAPSHOT */}
      <motion.div
        id="activity-snapshot"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            Let's see who's active in this sector and what they're doing
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Activity Snapshot
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* FII Activity */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground font-medium">
                  <TrendingUp className="h-3 w-3" />
                  FII Activity (Last Month)
                </div>
                <p className="text-2xl font-bold font-mono text-blue-500">
                  {activityData.snapshot.fii.flow}
                </p>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  {activityData.snapshot.fii.type}
                </Badge>
                <p className="text-xs font-medium">
                  {activityData.snapshot.fii.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activityData.snapshot.fii.trend}
                </p>
                <p className="text-xs italic text-muted-foreground">
                  {activityData.snapshot.fii.context}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* DII Activity */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground font-medium">
                  <Users className="h-3 w-3" />
                  DII Activity (Last Month)
                </div>
                <p className="text-2xl font-bold font-mono text-emerald-500">
                  {activityData.snapshot.dii.flow}
                </p>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  {activityData.snapshot.dii.type}
                </Badge>
                <p className="text-xs font-medium">
                  {activityData.snapshot.dii.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activityData.snapshot.dii.trend}
                </p>
                <p className="text-xs italic text-muted-foreground">
                  {activityData.snapshot.dii.context}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Ratio */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground font-medium">
                  <BarChart3 className="h-3 w-3" />
                  Delivery Ratio
                </div>
                <p className="text-2xl font-bold font-mono text-purple-500">
                  {activityData.snapshot.delivery.ratio}
                </p>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  High Quality
                </Badge>
                <p className="text-xs font-medium">
                  {activityData.snapshot.delivery.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  vs Market: {activityData.snapshot.delivery.vsMarket}
                </p>
                <p className="text-xs italic text-muted-foreground">
                  {activityData.snapshot.delivery.context}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Promoter Holding */}
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground font-medium">
                  <Building2 className="h-3 w-3" />
                  Promoter Holding
                </div>
                <p className="text-2xl font-bold font-mono text-amber-500">
                  {activityData.snapshot.promoter.holding}
                </p>
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  Sector Avg
                </Badge>
                <p className="text-xs font-medium">
                  {activityData.snapshot.promoter.change}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pledged: {activityData.snapshot.promoter.pledged}
                </p>
                <p className="text-xs italic text-muted-foreground">
                  {activityData.snapshot.promoter.status}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SECTION 2: ACTIVITY STORY */}
      <motion.div
        id="activity-story"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            Here's what institutional behavior reveals about sector sentiment:
          </p>
          <h2 className="text-2xl font-bold">📊 What the Activity Tells Us</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">
                    {activityData.story.institutional.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activityData.story.institutional.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Award className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">
                    {activityData.story.quality.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activityData.story.quality.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">
                    {activityData.story.ownership.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activityData.story.ownership.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SECTION 3: FII/DII FLOW TRENDS */}
      <motion.div
        id="fund-flows"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            Let's track institutional money flow over time
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            💵 Institutional Fund Flows
          </h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Chart */}
            <div className="mb-6">
              <ChartContainer
                config={{
                  fii: {
                    label: "FII Flow (₹Cr)",
                    color: "var(--p-found)",
                  },
                  dii: {
                    label: "DII Flow (₹Cr)",
                    color: "var(--success)",
                  },
                }}
                className="h-80 w-full"
              >
                <ComposedChart data={activityData.fiiDiiFlows}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="colorFii" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--p-found)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--p-found)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDii" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="fii"
                    stroke="var(--p-found)"
                    fill="url(#colorFii)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="dii"
                    stroke="var(--success)"
                    fill="url(#colorDii)"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-xs uppercase text-muted-foreground mb-2">
                  Last Month
                </p>
                <div className="space-y-1">
                  <p className="text-sm">
                    FII:{" "}
                    <span className="font-mono font-bold text-blue-500">
                      ₹{activityData.flowStats.lastMonth.fii} Cr
                    </span>
                  </p>
                  <p className="text-sm">
                    DII:{" "}
                    <span className="font-mono font-bold text-emerald-500">
                      ₹{activityData.flowStats.lastMonth.dii} Cr
                    </span>
                  </p>
                  <p className="text-sm">
                    Combined:{" "}
                    <span className="font-mono font-bold">
                      ₹{activityData.flowStats.lastMonth.combined} Cr
                    </span>
                  </p>
                  <p className="text-xs font-medium mt-2">
                    {activityData.flowStats.lastMonth.status}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-xs uppercase text-muted-foreground mb-2">
                  Last Quarter
                </p>
                <div className="space-y-1">
                  <p className="text-sm">
                    FII:{" "}
                    <span className="font-mono font-bold text-blue-500">
                      ₹{activityData.flowStats.lastQuarter.fii} Cr
                    </span>
                  </p>
                  <p className="text-sm">
                    DII:{" "}
                    <span className="font-mono font-bold text-emerald-500">
                      ₹{activityData.flowStats.lastQuarter.dii} Cr
                    </span>
                  </p>
                  <p className="text-sm">
                    Combined:{" "}
                    <span className="font-mono font-bold">
                      ₹{activityData.flowStats.lastQuarter.combined} Cr
                    </span>
                  </p>
                  <p className="text-xs font-medium mt-2">
                    {activityData.flowStats.lastQuarter.trend}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <p className="text-xs uppercase text-muted-foreground mb-2">
                  Last Year
                </p>
                <div className="space-y-1">
                  <p className="text-sm">
                    FII:{" "}
                    <span className="font-mono font-bold text-blue-500">
                      ₹{activityData.flowStats.lastYear.fii} Cr
                    </span>
                  </p>
                  <p className="text-sm">
                    DII:{" "}
                    <span className="font-mono font-bold text-emerald-500">
                      ₹{activityData.flowStats.lastYear.dii} Cr
                    </span>
                  </p>
                  <p className="text-sm">
                    Combined:{" "}
                    <span className="font-mono font-bold">
                      ₹{activityData.flowStats.lastYear.combined} Cr
                    </span>
                  </p>
                  <p className="text-xs font-medium mt-2">
                    {activityData.flowStats.lastYear.pattern}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="pt-6 border-t">
              <p className="text-xs uppercase text-muted-foreground mb-3 font-medium">
                Key Insights
              </p>
              <div className="space-y-2">
                {activityData.flowInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 4: BULK & BLOCK DEALS */}
      <motion.div
        id="significant-deals"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            What are the big players doing? Let's check large transactions
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🎯 Significant Deals
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Bulk Deals */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">
                Recent Bulk Deals (Last 30 days)
              </h3>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-xs uppercase text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left py-2 text-xs uppercase text-muted-foreground">
                        Company
                      </th>
                      <th className="text-left py-2 text-xs uppercase text-muted-foreground">
                        Party
                      </th>
                      <th className="text-right py-2 text-xs uppercase text-muted-foreground">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityData.bulkDeals.map((deal, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="py-2 font-mono text-xs">{deal.date}</td>
                        <td className="py-2">{deal.company}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            <span>{deal.party}</span>
                            <Badge
                              className={
                                deal.type === "B"
                                  ? "bg-emerald-500/10 text-emerald-500 text-xs"
                                  : "bg-red-500/10 text-red-500 text-xs"
                              }
                            >
                              {deal.type}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-2 text-right font-mono">
                          {deal.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Bulk Buys
                    </p>
                    <p className="font-semibold text-emerald-500">
                      {activityData.bulkSummary.totalBuys} (
                      {activityData.bulkSummary.totalBuysValue})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Bulk Sells
                    </p>
                    <p className="font-semibold text-red-500">
                      {activityData.bulkSummary.totalSells} (
                      {activityData.bulkSummary.totalSellsValue})
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">Net</p>
                  <p className="font-bold text-emerald-500">
                    {activityData.bulkSummary.net}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Deal Patterns */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Deal Patterns</h3>

              <div className="space-y-3 mb-6">
                {activityData.dealPatterns.map((pattern, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-3 rounded-lg bg-muted/30"
                  >
                    <ChevronRight className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{pattern}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">AI Insight</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Bulk deal activity shows institutional accumulation. Large
                      funds are building positions across sector leaders,
                      suggesting long-term conviction.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs font-medium mb-2">Recent Block Deals</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Transactions:
                    </span>
                    <span className="font-mono font-semibold">4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-mono font-semibold">₹1,250 Cr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Net Direction:
                    </span>
                    <Badge className="bg-emerald-500/10 text-emerald-500">
                      Buying
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SECTION 5: DELIVERY & TRADING METRICS */}
      <motion.div
        id="trading-quality"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            How is the sector being traded? Investment or speculation?
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📈 Trading Quality Indicators
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">
                  Delivery Percentage Trends
                </h3>

                {/* Chart */}
                <div className="mb-6">
                  <ChartContainer
                    config={{
                      delivery: {
                        label: "Sector Delivery %",
                        color: "var(--p-found)",
                      },
                      market: {
                        label: "Market Avg %",
                        color: "var(--ink3)",
                      },
                    }}
                    className="h-48 w-full"
                  >
                    <LineChart data={activityData.deliveryData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[50, 70]} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="delivery"
                        stroke="var(--p-found)"
                        strokeWidth={2}
                        dot={{ fill: "var(--p-found)", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="market"
                        stroke="var(--ink3)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "var(--ink3)", r: 3 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>

                {/* Delivery by Company */}
                <div className="space-y-2">
                  <p className="text-xs uppercase text-muted-foreground mb-3 font-medium">
                    Delivery % by Top Companies
                  </p>
                  {activityData.deliveryByCompany.map((company, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-muted/30"
                    >
                      <span className="text-sm">{company.company}</span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono font-bold ${getDeliveryColor(
                            company.delivery
                          )}`}
                        >
                          {company.delivery}%
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {company.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs italic leading-relaxed">
                    High delivery percentage means most trades result in actual
                    share transfer, not intraday speculation. This indicates
                    investors are taking long-term positions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Volume & Volatility</h3>

                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-xs uppercase text-muted-foreground mb-2">
                      Trading Volume
                    </p>
                    <p className="text-xl font-bold font-mono mb-1">
                      {activityData.tradingMetrics.volume.avg}
                    </p>
                    <p className="text-xs text-emerald-500 font-semibold mb-2">
                      {activityData.tradingMetrics.volume.change} vs last month
                    </p>
                    <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">
                      {activityData.tradingMetrics.volume.liquidity}
                    </Badge>
                    <p className="text-xs text-muted-foreground italic mt-2">
                      {activityData.tradingMetrics.volume.context}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <p className="text-xs uppercase text-muted-foreground mb-2">
                      Price Volatility
                    </p>
                    <p className="text-xl font-bold font-mono mb-1">
                      {activityData.tradingMetrics.volatility.avgMove}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {activityData.tradingMetrics.volatility.vsNifty}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      52-week: {activityData.tradingMetrics.volatility.range}
                    </p>
                    <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">
                      {activityData.tradingMetrics.volatility.stability}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-xs uppercase text-muted-foreground mb-2">
                      Market Breadth
                    </p>
                    <p className="text-sm font-semibold mb-1">
                      Advancing: {activityData.tradingMetrics.breadth.advancing}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      New 52-week highs:{" "}
                      {activityData.tradingMetrics.breadth.newHighs}
                    </p>
                    <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">
                      {activityData.tradingMetrics.breadth.momentum}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* SECTION 6: PROMOTER & INSIDER ACTIVITY */}
      <motion.div
        id="promoter-trends"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            What are company insiders doing with their holdings?
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            👔 Promoter & Insider Trends
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Promoter Holdings */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Promoter Holdings</h3>

              {/* Aggregate View */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">
                    Average Holding
                  </p>
                  <p className="text-2xl font-bold font-mono">
                    {activityData.promoterData.avgHolding}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">
                    Change (QoQ)
                  </p>
                  <p className="text-lg font-semibold text-emerald-500">
                    {activityData.promoterData.changeQoQ}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 rounded bg-emerald-500/5 text-center">
                  <p className="text-xs text-muted-foreground">Increased</p>
                  <p className="text-lg font-bold text-emerald-500">
                    {activityData.promoterData.increased}
                  </p>
                </div>
                <div className="p-2 rounded bg-red-500/5 text-center">
                  <p className="text-xs text-muted-foreground">Decreased</p>
                  <p className="text-lg font-bold text-red-500">
                    {activityData.promoterData.decreased}
                  </p>
                </div>
                <div className="p-2 rounded bg-blue-500/5 text-center">
                  <p className="text-xs text-muted-foreground">Stable</p>
                  <p className="text-lg font-bold text-blue-500">
                    {activityData.promoterData.stable}
                  </p>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="border rounded-lg p-4 mb-4">
                <p className="text-xs uppercase text-muted-foreground mb-3 font-medium">
                  Promoter Holding Trend
                </p>
                <ChartContainer
                  config={{
                    holding: {
                      label: "Promoter %",
                      color: "var(--p-found)",
                    },
                  }}
                  className="h-32 w-full"
                >
                  <LineChart data={activityData.promoterTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="quarter"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[51, 54]}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="holding"
                      stroke="var(--p-found)"
                      strokeWidth={2}
                      dot={{ fill: "var(--p-found)", r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>

              {/* Pledged Shares */}
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-xs uppercase text-muted-foreground mb-2">
                  Pledged Shares Analysis
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Sector Avg Pledged:
                    </span>
                    <span className="font-mono font-bold">
                      {activityData.promoterData.avgPledged}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500">
                      {activityData.promoterData.riskLevel}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Companies &gt;20% pledge:
                    </span>
                    <span className="font-bold text-amber-500">
                      {activityData.promoterData.highPledge}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Zero pledge companies:
                    </span>
                    <span className="font-bold text-emerald-500">
                      {activityData.promoterData.zeroPledge}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-xs italic leading-relaxed">
                  Stable to increasing promoter holdings with minimal pledging
                  indicates management confidence and low financial stress.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Insider Trading */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">
                Insider Trading (Last 90 days)
              </h3>

              {/* Buy Transactions */}
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-semibold">BUY Transactions</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Transactions:
                    </span>
                    <span className="font-mono font-bold text-emerald-500">
                      {activityData.insiderActivity.buys.count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-mono font-bold text-emerald-500">
                      {activityData.insiderActivity.buys.value}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Avg Transaction:
                    </span>
                    <span className="font-mono">
                      {activityData.insiderActivity.buys.avg}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Companies:</span>
                    <span className="font-bold">
                      {activityData.insiderActivity.buys.companies}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sell Transactions */}
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-semibold">SELL Transactions</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Transactions:
                    </span>
                    <span className="font-mono font-bold text-red-500">
                      {activityData.insiderActivity.sells.count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-mono font-bold text-red-500">
                      {activityData.insiderActivity.sells.value}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nature:</span>
                    <span className="text-xs">
                      {activityData.insiderActivity.sells.nature}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reasons:</span>
                    <span className="text-xs">
                      {activityData.insiderActivity.sells.reasons}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Sentiment */}
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Net Sentiment:</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500">
                    {activityData.insiderActivity.netSentiment}
                  </Badge>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm">Buy-to-Sell Ratio:</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {activityData.insiderActivity.ratio}
                  </span>
                </div>
              </div>

              {/* Key Insight */}
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Key Insight</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Insiders are net buyers with ₹26 Cr net buying. Most sells
                      are pre-planned (ESOP liquidation, tax needs). Fresh
                      buying by promoters in 7 companies signals confidence.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SECTION 7: CORPORATE ACTIONS & EVENTS */}
      <motion.div
        id="ownership-changes"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            What's coming up that could impact the sector?
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📅 Upcoming Events
          </h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {activityData.upcomingEvents.map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 rounded-lg border-l-4 border-l-primary/30 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-shrink-0 w-20">
                    <p className="text-xs text-muted-foreground">
                      {event.date}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{event.event}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.category}
                    </p>
                  </div>
                  <Badge className={getImpactBadge(event.impact)}>
                    {event.impact}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs uppercase text-muted-foreground mb-3 font-medium">
                Impact Assessment
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Heavy earnings calendar in next 2 weeks - expect volatility
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Dividend season = stable support to prices
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    RBI policy decision could impact sentiment
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 8: SHAREHOLDING PATTERN */}
      <motion.div
        id="money-flow-summary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">
            Let's see the complete ownership picture
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🏢 Ownership Distribution
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Pie Chart */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">
                Sector-wide Holding Pattern
              </h3>

              <div className="h-64 flex items-center justify-center">
                <ChartContainer
                  config={{
                    value: {
                      label: "Holding %",
                      color: "var(--p-found)",
                    },
                  }}
                  className="h-full w-full"
                >
                  <RechartsPieChart>
                    <Pie
                      data={activityData.shareholdingPattern}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="var(--p-mom)"
                      dataKey="value"
                    >
                      {activityData.shareholdingPattern.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ChartContainer>
              </div>

              <div className="mt-4 space-y-2">
                {activityData.shareholdingPattern.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Changes & Concentration */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">
                  Recent Changes (Last Quarter)
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5">
                    <div>
                      <p className="text-sm font-medium">FII Holding</p>
                      <p className="text-xs text-muted-foreground">
                        {activityData.shareholdingChanges.fii.trend}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-500">
                        {activityData.shareholdingChanges.fii.change}
                      </p>
                      <ArrowUpRight className="h-4 w-4 text-emerald-500 ml-auto" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5">
                    <div>
                      <p className="text-sm font-medium">DII Holding</p>
                      <p className="text-xs text-muted-foreground">
                        {activityData.shareholdingChanges.dii.trend}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-500">
                        {activityData.shareholdingChanges.dii.change}
                      </p>
                      <ArrowUpRight className="h-4 w-4 text-emerald-500 ml-auto" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5">
                    <div>
                      <p className="text-sm font-medium">Promoter</p>
                      <p className="text-xs text-muted-foreground">
                        {activityData.shareholdingChanges.promoter.trend}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-500">
                        {activityData.shareholdingChanges.promoter.change}
                      </p>
                      <Minus className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5">
                    <div>
                      <p className="text-sm font-medium">Retail</p>
                      <p className="text-xs text-muted-foreground">
                        {activityData.shareholdingChanges.retail.trend}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-red-500">
                        {activityData.shareholdingChanges.retail.change}
                      </p>
                      <ArrowDownRight className="h-4 w-4 text-red-500 ml-auto" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Concentration Analysis</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Top 5 investors own:
                    </span>
                    <span className="font-mono font-bold">
                      {activityData.concentration.top5}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Largest FII stake:
                    </span>
                    <span className="font-mono text-xs">
                      {activityData.concentration.largestFII}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Most diversified:
                    </span>
                    <span className="text-xs">
                      {activityData.concentration.mostDiversified}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Most concentrated:
                    </span>
                    <span className="text-xs">
                      {activityData.concentration.mostConcentrated}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-xs italic leading-relaxed">
                    Institutional holding of 31.2% (FII+DII) is healthy.
                    Increasing FII stake shows foreign confidence. Retail
                    participation at 11% leaves room for further retail
                    interest.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* SECTION 9: WHAT'S NEXT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="mb-6">
          <p className="text-muted-foreground mb-2">Ready to dig deeper?</p>
        </div>

        <div className="space-y-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Compare Individual Companies
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      See which stocks institutions prefer
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
                    <Target className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Deep-Dive Specific Stock</h3>
                    <p className="text-sm text-muted-foreground">
                      Detailed activity analysis for any company
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
                    <Activity className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Back to Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Review overall sector picture
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
