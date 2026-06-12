import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Building2,
  Shield,
  Eye,
  ShoppingCart,
  DollarSign,
  PieChart,
  CheckCircle,
  XCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  Clock,
  AlertCircle,
  Info,
  Target,
  Lightbulb,
  BookOpen,
  LineChart as LineChartIcon,
  Newspaper,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ActivityCardData {
  icon: React.ReactNode;
  title: string;
  mainMetric: {
    label: string;
    value: string;
    trend: "buy" | "sell";
  };
  details: {
    label: string;
    value: string;
  }[];
  signal: string;
  signalType: "positive" | "negative" | "neutral";
}

const Activity = () => {
  const params = useParams();
  const symbol = params.symbol as string;

  // Mock data for institutional flow chart (12 months)
  const flowData = [
    { month: "Jan", fii: 280, dii: 120, event: null },
    { month: "Feb", fii: -150, dii: 80, event: null },
    { month: "Mar", fii: 320, dii: 90, event: "Q4 Results" },
    { month: "Apr", fii: 420, dii: 150, event: null },
    { month: "May", fii: 380, dii: -60, event: null },
    { month: "Jun", fii: 720, dii: 180, event: "Q1 Results" },
    { month: "Jul", fii: -200, dii: -120, event: "Market Correction" },
    { month: "Aug", fii: 380, dii: 150, event: null },
    { month: "Sep", fii: 520, dii: 110, event: "Q2 Results" },
    { month: "Oct", fii: 450, dii: 180, event: null },
    { month: "Nov", fii: 380, dii: 140, event: null },
    { month: "Dec", fii: 450, dii: 180, event: null },
  ];

  // Mock data for shareholding pie chart
  const shareholdingData = [
    { name: "Promoters", value: 52.4, color: "#F59E0B" },
    { name: "FII", value: 24.2, color: "#3B82F6" },
    { name: "DII", value: 9.5, color: "#10B981" },
    { name: "Retail", value: 10.8, color: "#8B5CF6" },
    { name: "Others", value: 3.1, color: "#6B7280" },
  ];

  // Mock data for shareholding trend table
  const shareholdingTrend = [
    {
      category: "Promoters",
      sep24: 52.4,
      jun24: 52.2,
      mar24: 52.6,
      dec23: 52.8,
      change: -0.4,
      trend: "stable",
    },
    {
      category: "FII",
      sep24: 24.2,
      jun24: 23.4,
      mar24: 22.8,
      dec23: 21.7,
      change: 2.5,
      trend: "up",
    },
    {
      category: "DII",
      sep24: 9.5,
      jun24: 9.2,
      mar24: 8.9,
      dec23: 8.5,
      change: 1.0,
      trend: "up",
    },
    {
      category: "Retail",
      sep24: 10.8,
      jun24: 12.0,
      mar24: 12.4,
      dec23: 13.5,
      change: -2.7,
      trend: "down",
    },
    {
      category: "Others",
      sep24: 3.1,
      jun24: 3.2,
      mar24: 3.3,
      dec23: 3.5,
      change: -0.4,
      trend: "stable",
    },
  ];

  // Mock data for promoter holding trend (8 quarters)
  const promoterTrendData = [
    { quarter: "Q1'23", stake: 52.8 },
    { quarter: "Q2'23", stake: 52.6 },
    { quarter: "Q3'23", stake: 52.8 },
    { quarter: "Q4'23", stake: 52.4 },
    { quarter: "Q1'24", stake: 52.6 },
    { quarter: "Q2'24", stake: 52.2 },
    { quarter: "Q3'24", stake: 52.4 },
    { quarter: "Q4'24", stake: 52.4 },
  ];

  // Mock data for promoter transactions
  const promoterTransactions = [
    {
      date: "Oct 15 '24",
      type: "Buy",
      shares: "50,000",
      value: "₹9.1 Cr",
      reason: "Open market purchase",
    },
    {
      date: "Aug 22 '24",
      type: "Buy",
      shares: "75,000",
      value: "₹13.1 Cr",
      reason: "Confidence signal",
    },
    {
      date: "Jun 18 '24",
      type: "-",
      shares: "-",
      value: "-",
      reason: "No activity",
    },
    {
      date: "Apr 10 '24",
      type: "Buy",
      shares: "25,000",
      value: "₹4.2 Cr",
      reason: "Small accumulation",
    },
  ];

  // Mock data for insider buy transactions
  const insiderBuys = [
    {
      name: "Director A",
      value: "₹12.0 Cr",
      date: "Sept 25",
      type: "Open market",
    },
    { name: "CFO", value: "₹6.5 Cr", date: "Oct 8", type: "Open market" },
    {
      name: "Director B",
      value: "₹4.2 Cr",
      date: "Oct 15",
      type: "Open market",
    },
    {
      name: "Senior VP",
      value: "₹3.8 Cr",
      date: "Sept 18",
      type: "Open market",
    },
    {
      name: "Others (4)",
      value: "₹1.5 Cr",
      date: "Various",
      type: "Open market",
    },
  ];

  // Mock data for bulk deals
  const bulkDeals = [
    {
      date: "Oct 18",
      party: "ABC Mutual Fund",
      type: "BUY",
      quantity: "8.5L",
      value: "₹155 Cr",
      percent: "0.62%",
    },
    {
      date: "Oct 15",
      party: "XYZ Investment Trust",
      type: "BUY",
      quantity: "6.2L",
      value: "₹113 Cr",
      percent: "0.45%",
    },
    {
      date: "Oct 12",
      party: "PQR Insurance Co.",
      type: "SELL",
      quantity: "4.8L",
      value: "₹87 Cr",
      percent: "0.35%",
    },
    {
      date: "Oct 08",
      party: "MNO Asset Management",
      type: "BUY",
      quantity: "10.5L",
      value: "₹189 Cr",
      percent: "0.76%",
    },
    {
      date: "Oct 05",
      party: "LMN Fund House",
      type: "BUY",
      quantity: "7.8L",
      value: "₹141 Cr",
      percent: "0.57%",
    },
  ];

  // Mock data for block deals
  const blockDeals = [
    {
      date: "Oct 10",
      buyer: "Global Investment Fund",
      seller: "Domestic Pension",
      quantity: "25L",
      value: "₹450 Cr",
    },
    {
      date: "Sept 28",
      buyer: "Sovereign Wealth Fund",
      seller: "FPI Exit",
      quantity: "18L",
      value: "₹315 Cr",
    },
    {
      date: "Sept 15",
      buyer: "Large Mutual Fund House",
      seller: "Private Equity Exit",
      quantity: "12L",
      value: "₹205 Cr",
    },
  ];

  // Mock data for MF activity trend
  const mfTrendData = [
    { quarter: "Dec'23", schemes: 368, stake: 7.5 },
    { quarter: "Mar'24", schemes: 380, stake: 7.9 },
    { quarter: "Jun'24", schemes: 398, stake: 8.3 },
    { quarter: "Sep'24", schemes: 425, stake: 8.7 },
  ];

  // Mock data for MF quarterly table
  const mfQuarterlyData = [
    {
      quarter: "Sep'24",
      schemes: 425,
      stake: "8.7%",
      value: "11,850",
      change: "+27 schemes",
    },
    {
      quarter: "Jun'24",
      schemes: 398,
      stake: "8.3%",
      value: "10,980",
      change: "+18 schemes",
    },
    {
      quarter: "Mar'24",
      schemes: 380,
      stake: "7.9%",
      value: "10,120",
      change: "+12 schemes",
    },
    {
      quarter: "Dec'23",
      schemes: 368,
      stake: "7.5%",
      value: "9,420",
      change: "+15 schemes",
    },
  ];

  // Mock data for MF changes
  const mfIncreasers = [
    {
      mf: "ICICI Prudential",
      action: "Increased",
      change: "+₹180",
      current: "₹1,450",
    },
    { mf: "HDFC MF", action: "Increased", change: "+₹150", current: "₹1,120" },
    { mf: "SBI MF", action: "Increased", change: "+₹95", current: "₹890" },
    {
      mf: "Nippon India",
      action: "New Entry",
      change: "+₹125",
      current: "₹125",
    },
  ];

  const mfDecreasers = [
    { mf: "Kotak MF", action: "Decreased", change: "-₹45", current: "₹320" },
    { mf: "DSP MF", action: "Partial Exit", change: "-₹32", current: "₹85" },
  ];

  // Mock data for activity cards
  const activityCards: ActivityCardData[] = [
    {
      icon: <Building2 className="h-5 w-5" />,
      title: "FII Activity",
      mainMetric: {
        label: "Last Month Net",
        value: "₹450 Cr",
        trend: "buy",
      },
      details: [
        { label: "Trend", value: "3 months of buying" },
        { label: "Current Holding", value: "24.2% (+0.8% QoQ)" },
      ],
      signal: "Strong foreign interest",
      signalType: "positive",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "DII Activity",
      mainMetric: {
        label: "Last Month Net",
        value: "₹180 Cr",
        trend: "buy",
      },
      details: [
        { label: "Trend", value: "Steady accumulation" },
        { label: "Current Holding", value: "9.5% (+0.3% QoQ)" },
      ],
      signal: "Domestic support strong",
      signalType: "positive",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Promoter Holdings",
      mainMetric: {
        label: "Current Stake",
        value: "52.4%",
        trend: "buy",
      },
      details: [
        { label: "Change (QoQ)", value: "+0.2% (Stable)" },
        { label: "Pledged Shares", value: "0.8% (Very low)" },
      ],
      signal: "Management confident",
      signalType: "positive",
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: "Insider Activity",
      mainMetric: {
        label: "Last 90 days",
        value: "Net +₹20 Cr",
        trend: "buy",
      },
      details: [
        { label: "Insider Buys", value: "8 transactions (₹28 Cr)" },
        { label: "Insider Sells", value: "2 transactions (₹8 Cr)" },
      ],
      signal: "Insiders accumulating",
      signalType: "positive",
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      title: "Recent Bulk Deals",
      mainMetric: {
        label: "Last Week",
        value: "₹85 Cr",
        trend: "buy",
      },
      details: [
        { label: "Total Deals", value: "3 bulk deals" },
        { label: "Notable Buyer", value: "ABC Mutual Fund" },
      ],
      signal: "Large investors interested",
      signalType: "positive",
    },
  ];

  const aiSummary =
    "Activity picture is positive. Both FII and DII are net buyers with ₹630 Cr combined inflow last month. Promoters stable with minimal pledging. Insiders bought 4x more than they sold. Recent bulk deals show institutional accumulation. Smart money is backing this stock.";

  return (
    <div className="space-y-6">
      {/* Section 1: Activity Snapshot */}
      <div className="space-y-4">
        {/* Storytelling Header */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Let&apos;s see who&apos;s active in this stock and what they&apos;re
            doing
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🔍 Activity Overview
          </h2>
        </div>

        {/* Activity Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {activityCards.map((card, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-muted/40 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
            >
              {/* Gradient Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardContent className="relative p-4 space-y-3">
                {/* Header: Icon + Title */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      {card.icon}
                    </div>
                    <h3 className="text-xs font-semibold text-muted-foreground line-clamp-2 leading-tight">
                      {card.title}
                    </h3>
                  </div>
                </div>

                {/* Main Metric - Compact */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium mb-1">
                        {card.mainMetric.label}
                      </p>
                      <p className="text-2xl font-bold tracking-tight">
                        {card.mainMetric.value}
                      </p>
                    </div>
                    <Badge
                      variant={
                        card.mainMetric.trend === "buy"
                          ? "success"
                          : "destructive"
                      }
                      className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 h-5 shrink-0"
                    >
                      {card.mainMetric.trend === "buy" ? (
                        <>
                          <ArrowUpRight className="h-2.5 w-2.5" />
                          BUY
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-2.5 w-2.5" />
                          SELL
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Details - Compact */}
                <div className="space-y-1 pt-2 border-t border-muted/50">
                  {card.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center gap-2 text-[11px]"
                    >
                      <span className="text-muted-foreground truncate">
                        {detail.label}
                      </span>
                      <span className="font-semibold shrink-0">
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Signal - Compact Badge */}
                <div
                  className={`text-[10px] font-semibold px-2 py-1.5 rounded-md text-center leading-none ${
                    card.signalType === "positive"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20"
                      : card.signalType === "negative"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20"
                        : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-500/20"
                  }`}
                >
                  {card.signal}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Summary */}
        <Card className="bg-gradient-to-br from-primary/5 via-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">AI Activity Summary</h3>
                  <Badge variant="default" className="text-xs">
                    Smart Money Analysis
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiSummary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Institutional Flow Trends */}
      <div className="space-y-4">
        {/* Storytelling Header */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Let&apos;s track institutional money flow over time - who&apos;s
            buying and who&apos;s selling?
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            💰 FII & DII Flow Analysis
          </h2>
        </div>

        {/* Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>12-Month Institutional Flow Trend</CardTitle>
            <CardDescription>
              Monthly net buying/selling by FII and DII (₹ Crores)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={flowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis
                  className="text-xs"
                  label={{ value: "₹ Cr", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`₹${value} Cr`, ""]}
                />
                <Legend />
                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                />
                <Bar
                  dataKey="fii"
                  name="FII Flow"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="dii"
                  name="DII Flow"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="fii"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="dii"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Three-Column Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Recent Activity (Last Month)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-primary">
                  FII Activity
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buy Value:</span>
                    <span className="font-medium">₹680 Cr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sell Value:</span>
                    <span className="font-medium">₹230 Cr</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t">
                    <span className="text-muted-foreground">Net:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600">₹450 Cr</span>
                      <Badge variant="success">BUY</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Days of Buying:
                    </span>
                    <span className="font-medium">18 out of 22</span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="outline" className="w-full justify-center">
                      Consistent accumulation
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-semibold text-sm text-green-600">
                  DII Activity
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buy Value:</span>
                    <span className="font-medium">₹320 Cr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sell Value:</span>
                    <span className="font-medium">₹140 Cr</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t">
                    <span className="text-muted-foreground">Net:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600">₹180 Cr</span>
                      <Badge variant="success">BUY</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Days of Buying:
                    </span>
                    <span className="font-medium">15 out of 22</span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="outline" className="w-full justify-center">
                      Steady support
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Net Inflow:</span>
                    <span className="text-lg font-bold">₹630 Cr</span>
                  </div>
                  <p className="text-xs mt-1">🟢 Strong Buying Pressure</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Quarterly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Quarterly Trend (Last Quarter)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-primary">
                  FII (Last 3 Months)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Month 1:</span>
                    <span className="font-medium text-green-600">
                      ₹380 Cr (BUY)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Month 2:</span>
                    <span className="font-medium text-green-600">
                      ₹520 Cr (BUY)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Month 3:</span>
                    <span className="font-medium text-green-600">
                      ₹450 Cr (BUY)
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold">₹1,350 Cr</span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="outline" className="w-full justify-center">
                      Sustained buying for 3 months
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-semibold text-sm text-green-600">
                  DII (Last 3 Months)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Month 1:</span>
                    <span className="font-medium text-green-600">
                      ₹150 Cr (BUY)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Month 2:</span>
                    <span className="font-medium text-green-600">
                      ₹110 Cr (BUY)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Month 3:</span>
                    <span className="font-medium text-green-600">
                      ₹180 Cr (BUY)
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold">₹440 Cr</span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="outline" className="w-full justify-center">
                      Consistent support
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Quarterly Net:</span>
                    <span className="text-lg font-bold">₹1,790 Cr</span>
                  </div>
                  <p className="text-xs mt-1">🟢 Strong Quarter</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column 3: Long-Term Pattern */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Long-Term Pattern (Last Year)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-primary">
                  FII (12 Months)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Buying Months:
                    </span>
                    <span className="font-medium">9 out of 12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Selling Months:
                    </span>
                    <span className="font-medium">3 out of 12</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Net Annual:</span>
                    <span className="font-bold text-green-600">
                      ₹4,200 Cr (BUY)
                    </span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="outline" className="w-full justify-center">
                      Clear accumulation phase
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-semibold text-sm text-green-600">
                  DII (12 Months)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Buying Months:
                    </span>
                    <span className="font-medium">8 out of 12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Selling Months:
                    </span>
                    <span className="font-medium">4 out of 12</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Net Annual:</span>
                    <span className="font-bold text-green-600">
                      ₹1,800 Cr (BUY)
                    </span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="outline" className="w-full justify-center">
                      Supportive stance
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Annual Net:</span>
                    <span className="text-lg font-bold">₹6,000 Cr</span>
                  </div>
                  <p className="text-xs mt-1">🟢 Strong Year</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span>
                FIIs have been net buyers for 9 out of last 12 months - strong
                conviction
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span>
                Largest monthly inflow was ₹720 Cr in June 2024 (post Q1
                results)
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span>
                DIIs showed selling only during market-wide corrections, not
                stock-specific
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span>
                Both FII and DII buying accelerated in recent quarter (+35% vs
                previous)
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span>Institutional holding increased by 2.5% over the year</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Interpretation */}
        <Card className="bg-gradient-to-br from-blue-500/5 via-blue-500/5 to-transparent border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">AI Flow Interpretation</h3>
                  <Badge variant="default" className="text-xs bg-blue-600">
                    Trend Analysis
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sustained institutional buying over 12 months suggests strong
                  belief in the stock&apos;s prospects. The fact that both
                  foreign and domestic investors are aligned is particularly
                  bullish. Recent acceleration in buying (₹1,790 Cr in Q3 vs
                  ₹1,200 Cr in Q2) indicates growing conviction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Shareholding Pattern */}
      <div className="space-y-4">
        {/* Storytelling Header */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Let&apos;s see the complete ownership picture and how it&apos;s
            changing
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🏢 Ownership Structure
          </h2>
        </div>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Current Shareholding Pattern</CardTitle>
            <CardDescription>As of September 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={shareholdingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {shareholdingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>

              <div className="space-y-3">
                {shareholdingData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-lg font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shareholding Trend Table */}
        <Card>
          <CardHeader>
            <CardTitle>Shareholding Trend (Last 4 Quarters)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">
                      Category
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Sep&apos;24
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Jun&apos;24
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Mar&apos;24
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Dec&apos;23
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Change (YoY)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shareholdingTrend.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{row.category}</td>
                      <td className="text-right py-3 px-4">{row.sep24}%</td>
                      <td className="text-right py-3 px-4">{row.jun24}%</td>
                      <td className="text-right py-3 px-4">{row.mar24}%</td>
                      <td className="text-right py-3 px-4">{row.dec23}%</td>
                      <td className="text-right py-3 px-4">
                        <span
                          className={`flex items-center justify-end gap-1 font-medium ${
                            row.trend === "up"
                              ? "text-green-600"
                              : row.trend === "down"
                                ? "text-red-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {row.change > 0 ? "+" : ""}
                          {row.change}%
                          {row.trend === "up" && (
                            <TrendingUp className="h-3 w-3" />
                          )}
                          {row.trend === "down" && (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {row.trend === "stable" && (
                            <ArrowRight className="h-3 w-3" />
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Two Columns: Key Changes and Ownership Quality */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: Key Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Key Changes (Last Year)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    FII stake increased by 2.5%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    from 21.7% to 24.2%
                  </p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    → Foreign investors adding aggressively
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    DII stake increased by 1.0%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    from 8.5% to 9.5%
                  </p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    → Mutual funds building positions
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Retail stake decreased by 2.7%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    from 13.5% to 10.8%
                  </p>
                  <p className="text-xs text-red-600 font-medium mt-1">
                    → Retail profit-booking as stock rose
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Promoter stake stable around 52.4%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    → Management maintaining position
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm font-medium">Net Effect:</p>
                <p className="text-xs text-muted-foreground mt-1">
                  &quot;Shift from retail to institutional hands - typically
                  positive for stability&quot;
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Ownership Quality */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ownership Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">
                  Concentration Analysis
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Top 5 Investors:
                    </span>
                    <span className="font-medium">18.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Top 10 Investors:
                    </span>
                    <span className="font-medium">28.2%</span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="outline" className="w-full justify-center">
                      Moderate (Not too concentrated)
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-semibold text-sm">Institutional Quality</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      MF Schemes holding:
                    </span>
                    <span className="font-medium">425</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">FPI holdings:</span>
                    <span className="font-medium">180</span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="success" className="w-full justify-center">
                      🟢 Diverse institutional base
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-semibold text-sm">Stability Score</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Promoter Pledge:
                    </span>
                    <span className="font-medium text-green-600">
                      0.8% (Very low)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Institutional Lock-in:
                    </span>
                    <span className="font-medium">None expired recently</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liquidity:</span>
                    <span className="font-medium text-green-600">
                      🟢 Excellent (10.8% retail)
                    </span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="success" className="w-full justify-center">
                      🟢 Stable Ownership
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 4: Promoter & Insider Activity */}
      <div className="space-y-4">
        {/* Storytelling Header */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            What are the people who know the business best doing with their
            holdings?
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            👔 Promoter & Insider Transactions
          </h2>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-4">
          {/* Left Column: Promoter Holdings & Activity */}
          <div className="space-y-4">
            {/* Promoter Holding Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Promoter Holding Trend
                </CardTitle>
                <CardDescription>Last 8 Quarters</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={promoterTrendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="quarter" className="text-xs" />
                    <YAxis domain={[51, 54]} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value}%`, "Stake"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="stake"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ fill: "#F59E0B", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Current Status */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Promoter Stake
                    </p>
                    <p className="text-xl font-bold">52.4%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Quarterly Change
                    </p>
                    <p className="text-xl font-bold text-green-600">+0.2%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">YoY Change</p>
                    <p className="text-xl font-bold">-0.4%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Assessment</p>
                    <Badge variant="success">🟢 Stable and High</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pledged Shares Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Pledged Shares Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Pledged:
                    </span>
                    <span className="font-medium">0.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Absolute Pledge:
                    </span>
                    <span className="font-medium">0.4%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge variant="success">
                    🟢 Very Low (&lt; 20% is safe)
                  </Badge>
                </div>
                <div className="pt-2 text-sm text-muted-foreground bg-green-500/5 p-3 rounded-lg">
                  <p className="font-medium text-green-600 mb-1">
                    Interpretation:
                  </p>
                  Minimal financial stress, no distress signals
                </div>
              </CardContent>
            </Card>

            {/* Recent Promoter Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Recent Promoter Transactions
                </CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">Date</th>
                        <th className="text-left py-2 font-semibold">Type</th>
                        <th className="text-right py-2 font-semibold">
                          Shares
                        </th>
                        <th className="text-right py-2 font-semibold">Value</th>
                        <th className="text-left py-2 font-semibold">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoterTransactions.map((txn, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-2">{txn.date}</td>
                          <td className="py-2">
                            {txn.type === "Buy" ? (
                              <Badge variant="success" className="text-xs">
                                Buy
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                {txn.type}
                              </span>
                            )}
                          </td>
                          <td className="text-right py-2">{txn.shares}</td>
                          <td className="text-right py-2 font-medium">
                            {txn.value}
                          </td>
                          <td className="py-2 text-muted-foreground text-xs">
                            {txn.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 pt-4 border-t bg-green-500/5 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Analysis:{" "}
                    </span>
                    Promoters have been net buyers with 3 open market purchases
                    totaling ₹26.4 Cr in last 6 months. No selling observed.
                    This is a strong vote of confidence in the company&apos;s
                    prospects.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Insider Trading Activity */}
          <div className="space-y-4">
            {/* Buy Transactions Card */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  BUY Transactions (Last 90 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Number of Buys</p>
                    <p className="text-2xl font-bold text-green-600">8</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold text-green-600">₹28 Cr</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Insiders Involved</p>
                    <p className="text-lg font-bold">5</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Largest Buy</p>
                    <p className="text-lg font-bold">₹12 Cr</p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Badge
                    variant="outline"
                    className="w-full justify-center mb-3"
                  >
                    Broad-based buying across management
                  </Badge>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Breakdown:
                    </p>
                    {insiderBuys.map((buy, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm p-2 rounded bg-background/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{buy.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {buy.date} • {buy.type}
                          </p>
                        </div>
                        <p className="font-bold text-green-600">{buy.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sell Transactions Card */}
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  SELL Transactions (Last 90 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Number of Sells</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">₹8 Cr</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason:</span>
                    <span className="font-medium">Pre-planned</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nature:</span>
                    <span className="font-medium">ESOP liquidation</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impact:</span>
                    <Badge variant="outline" className="text-xs">
                      Minimal
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Both scheduled sales (not opportunistic)
                </p>
              </CardContent>
            </Card>

            {/* Net Insider Activity */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">
                  Net Insider Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buys:</span>
                    <span className="font-bold text-green-600">₹28 Cr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sells:</span>
                    <span className="font-bold text-red-600">₹8 Cr</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Net:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-green-600">
                        ₹20 Cr
                      </span>
                      <Badge variant="success">BUY</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Buy/Sell Ratio:
                    </span>
                    <span className="font-bold">3.5:1</span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Badge
                    variant="success"
                    className="w-full justify-center text-sm py-2"
                  >
                    🟢 Strongly Bullish Signal
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* AI Interpretation */}
            <Card className="bg-gradient-to-br from-purple-500/5 via-purple-500/5 to-transparent border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                      <Eye className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        AI Insider Interpretation
                      </h3>
                      <Badge
                        variant="default"
                        className="text-xs bg-purple-600"
                      >
                        Management Confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Insider activity is decisively positive. Eight separate
                      buy transactions by five different insiders totaling ₹28
                      Cr shows broad management confidence. The two sell
                      transactions were pre-planned ESOP liquidations (disclosed
                      in advance), not opportunistic selling. When management is
                      buying with their own money, it&apos;s typically a strong
                      signal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Management Confidence Score */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">
              Management Confidence Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-xs text-muted-foreground mb-2">
                  Promoter Activity
                </p>
                <p className="text-sm font-bold text-green-600">🟢 Buying</p>
                <p className="text-xs text-muted-foreground mt-1">
                  (no selling)
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-xs text-muted-foreground mb-2">
                  Insider Transactions
                </p>
                <p className="text-sm font-bold text-green-600">
                  🟢 Net buyers
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  3.5:1 ratio
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-xs text-muted-foreground mb-2">
                  Pledge Level
                </p>
                <p className="text-sm font-bold text-green-600">🟢 Very Low</p>
                <p className="text-xs text-muted-foreground mt-1">0.8%</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2">
                  Share Buyback
                </p>
                <p className="text-sm font-bold">No active</p>
                <p className="text-xs text-muted-foreground mt-1">program</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">
                  Overall Confidence
                </p>
                <p className="text-xl font-bold text-primary">🟢 High</p>
                <p className="text-xs font-bold mt-1">8.5/10</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 5: Bulk & Block Deals */}
      <div className="space-y-4">
        {/* Storytelling Header */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Let&apos;s check what big players are doing - large institutional
            transactions
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🎯 Recent Bulk & Block Deals
          </h2>
        </div>

        {/* Part A: Bulk Deals */}
        <div className="space-y-4">
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm">
              <span className="font-semibold">Bulk Deals</span> = Transactions
              of 0.5%+ of total shares, done on exchange during market hours.
              Visible to all participants.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Recent Bulk Deals (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-semibold">
                        Date
                      </th>
                      <th className="text-left py-3 px-2 font-semibold">
                        Party
                      </th>
                      <th className="text-center py-3 px-2 font-semibold">
                        Type
                      </th>
                      <th className="text-right py-3 px-2 font-semibold">
                        Quantity
                      </th>
                      <th className="text-right py-3 px-2 font-semibold">
                        Value
                      </th>
                      <th className="text-right py-3 px-2 font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkDeals.map((deal, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">{deal.date}</td>
                        <td className="py-3 px-2">{deal.party}</td>
                        <td className="py-3 px-2 text-center">
                          <Badge
                            variant={
                              deal.type === "BUY" ? "success" : "destructive"
                            }
                            className="text-xs"
                          >
                            {deal.type}
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-2">
                          {deal.quantity}
                        </td>
                        <td className="text-right py-3 px-2 font-medium">
                          {deal.value}
                        </td>
                        <td className="text-right py-3 px-2 text-muted-foreground">
                          {deal.percent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Bulk Buys
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    5 deals (₹598 Cr)
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Bulk Sells
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    1 deal (₹87 Cr)
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">
                    Net Activity
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    ₹511 Cr (BUY) 🟢
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-green-500/5">
                <p className="text-sm font-semibold mb-1">Interpretation:</p>
                <p className="text-sm text-muted-foreground">
                  Strong institutional buying via bulk deals
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pattern Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pattern Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Mutual funds dominating buy side (4 out of 5 buys)</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Insurance company booked profits (₹87 Cr sell)</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>
                  Average deal size: ₹119 Cr (significant institutional
                  interest)
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>
                  All buys at prices ₹1,800-₹1,820 range (conviction at current
                  levels)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Part B: Block Deals */}
        <div className="space-y-4">
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
            <p className="text-sm">
              <span className="font-semibold">Block Deals</span> = Large
              off-market transactions between institutions, typically negotiated
              privately. Usually even bigger than bulk deals.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Recent Block Deals (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-semibold">
                        Date
                      </th>
                      <th className="text-left py-3 px-2 font-semibold">
                        Buyer
                      </th>
                      <th className="text-left py-3 px-2 font-semibold">
                        Seller
                      </th>
                      <th className="text-right py-3 px-2 font-semibold">
                        Quantity
                      </th>
                      <th className="text-right py-3 px-2 font-semibold">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockDeals.map((deal, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">{deal.date}</td>
                        <td className="py-3 px-2 text-green-600 font-medium">
                          {deal.buyer}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {deal.seller}
                        </td>
                        <td className="text-right py-3 px-2">
                          {deal.quantity}
                        </td>
                        <td className="text-right py-3 px-2 font-bold">
                          {deal.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Deals
                  </p>
                  <p className="text-lg font-bold">3</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Value
                  </p>
                  <p className="text-lg font-bold">₹970 Cr</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <p className="text-xs text-muted-foreground mb-1">
                    Net Impact
                  </p>
                  <p className="text-sm font-bold text-green-600">
                    Neutral to Positive
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-purple-500/5">
                <p className="text-sm font-semibold mb-1">Analysis:</p>
                <p className="text-sm text-muted-foreground">
                  Block deals show change of hands from short-term to long-term
                  holders. Sovereign wealth fund and pension funds entering
                  (holding period: 5-10 years typically) while FPI and PE funds
                  booking profits after good run. This shift improves quality of
                  investor base.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Combined Interpretation */}
        <Card className="bg-gradient-to-br from-amber-500/5 via-amber-500/5 to-transparent border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-amber-600" />
              Combined Interpretation (Bulk + Block)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>Combined ₹1,568 Cr of large transactions in 30 days</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>Bulk deals show clear net buying (₹511 Cr)</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>
                  Block deals show upgrade in investor quality (LT money in, ST
                  money out)
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>No distress selling or panic visible</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>Large institutional appetite at ₹1,800-₹1,850 range</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 6: Mutual Fund Holdings */}
      <div className="space-y-4">
        {/* Storytelling Header */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Mutual funds represent smart, long-term domestic money. Let&apos;s
            see their activity
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📊 Mutual Fund Activity
          </h2>
        </div>

        {/* Top: Key MF Metrics (Four cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Number of Schemes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold">425</p>
                <Badge variant="success" className="mb-1">
                  +27
                </Badge>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Previous Quarter:
                  </span>
                  <span>398 schemes</span>
                </div>
                <p className="text-green-600 font-medium">
                  Increasing interest
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total MF Holding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold">8.7%</p>
                <Badge variant="success" className="mb-1">
                  +0.4%
                </Badge>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Value:</span>
                  <span className="font-medium">₹11,850 Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Previous Quarter:
                  </span>
                  <span>8.3%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-green-600">+27</p>
                <Badge variant="success" className="mb-1">
                  Net
                </Badge>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schemes Added:</span>
                  <span className="text-green-600">35</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schemes Exited:</span>
                  <span className="text-red-600">8</span>
                </div>
                <p className="text-green-600 font-medium">Net accumulation</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Largest MF Holders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">₹4,200 Cr</p>
              </div>
              <div className="text-xs space-y-1">
                <p className="text-muted-foreground mb-1">
                  Top 5 MFs (35% of MF holding):
                </p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    ICICI Prudential:
                  </span>
                  <span className="font-medium">₹1,450 Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HDFC MF:</span>
                  <span className="font-medium">₹1,120 Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SBI MF:</span>
                  <span className="font-medium">₹890 Cr</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MF Activity Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              MF Activity Trend (Last 4 Quarters)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={mfTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="quarter" className="text-xs" />
                <YAxis
                  yAxisId="left"
                  className="text-xs"
                  label={{
                    value: "Schemes",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  className="text-xs"
                  label={{
                    value: "Stake %",
                    angle: 90,
                    position: "insideRight",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="schemes"
                  name="MF Schemes"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="stake"
                  name="MF Stake %"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Table below chart */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold">Quarter</th>
                    <th className="text-right py-2 font-semibold">Schemes</th>
                    <th className="text-right py-2 font-semibold">
                      MF Stake %
                    </th>
                    <th className="text-right py-2 font-semibold">
                      Value (₹Cr)
                    </th>
                    <th className="text-right py-2 font-semibold">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {mfQuarterlyData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-2 font-medium">{row.quarter}</td>
                      <td className="text-right py-2">{row.schemes}</td>
                      <td className="text-right py-2">{row.stake}</td>
                      <td className="text-right py-2">{row.value}</td>
                      <td className="text-right py-2 text-green-600 font-medium">
                        {row.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-green-500/5">
              <p className="text-sm font-medium text-green-600">
                Pattern: Consistent increase in MF participation for 4 straight
                quarters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Significant MF Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Significant MF Changes (Last Quarter)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Top Increasers */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Top Increasers
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">MF House</th>
                      <th className="text-left py-2 font-semibold">Action</th>
                      <th className="text-right py-2 font-semibold">
                        Change (Cr)
                      </th>
                      <th className="text-right py-2 font-semibold">
                        Current (Cr)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mfIncreasers.map((mf, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-2 font-medium">{mf.mf}</td>
                        <td className="py-2">
                          <Badge
                            variant={
                              mf.action === "New Entry" ? "default" : "success"
                            }
                            className="text-xs"
                          >
                            {mf.action}
                          </Badge>
                        </td>
                        <td className="text-right py-2 text-green-600 font-bold">
                          {mf.change}
                        </td>
                        <td className="text-right py-2 font-medium">
                          {mf.current}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Decreasers */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Top Decreasers
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">MF House</th>
                      <th className="text-left py-2 font-semibold">Action</th>
                      <th className="text-right py-2 font-semibold">
                        Change (Cr)
                      </th>
                      <th className="text-right py-2 font-semibold">
                        Current (Cr)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mfDecreasers.map((mf, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-2 font-medium">{mf.mf}</td>
                        <td className="py-2">
                          <Badge variant="destructive" className="text-xs">
                            {mf.action}
                          </Badge>
                        </td>
                        <td className="text-right py-2 text-red-600 font-bold">
                          {mf.change}
                        </td>
                        <td className="text-right py-2 font-medium">
                          {mf.current}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net MF Activity */}
            <div className="pt-4 border-t">
              <div className="bg-green-500/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net MF Activity:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-green-600">
                      +₹473 Cr
                    </span>
                    <Badge variant="success">Strong Buying 🟢</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Interpretation */}
        <Card className="bg-gradient-to-br from-green-500/5 via-green-500/5 to-transparent border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    AI MF Activity Interpretation
                  </h3>
                  <Badge variant="default" className="text-xs bg-green-600">
                    Professional Endorsement
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mutual fund activity is overwhelmingly positive. 27 new
                  schemes added positions, only 8 exited. Major fund houses like
                  ICICI Prudential and HDFC increased stakes significantly. The
                  steady quarter-on-quarter increase in MF holding (from 7.5% to
                  8.7%) shows growing conviction from professional domestic
                  investors. This is a strong endorsement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 8: Activity Verdict */}
      <div className="space-y-4">
        {/* Storytelling Header */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Let&apos;s synthesize all the activity data - what&apos;s the
            overall message?
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🎯 Activity Assessment
          </h2>
        </div>

        {/* Activity Score Card */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white mb-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">82</div>
                  <div className="text-sm opacity-90">/100</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Strong Accumulation</h3>
                <div className="flex items-center justify-center gap-3">
                  <Badge variant="success" className="text-sm px-4 py-1">
                    🟢 Bullish Sentiment
                  </Badge>
                  <Badge variant="default" className="text-sm px-4 py-1">
                    High Confidence
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground font-medium mt-4">
                  &quot;Smart money is backing this stock across the board&quot;
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signal Summary - Four Quadrants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrant 1: Institutional Activity */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Institutional Activity
                <Badge variant="success" className="ml-auto">
                  🟢 POSITIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    FII buying for 9 out of 12 months (₹4,200 Cr annual)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>DII adding consistently (₹1,800 Cr annual)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Mutual funds increased from 368 to 425 schemes</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Recent acceleration in institutional buying</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Bulk deals show ₹511 Cr net buying</span>
                </div>
              </div>
              <div className="pt-3 border-t flex items-center justify-between">
                <span className="text-sm font-semibold">Signal Strength:</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-6 bg-green-600 rounded-sm"
                      />
                    ))}
                    <div className="w-2 h-6 bg-muted rounded-sm" />
                  </div>
                  <span className="text-lg font-bold text-green-600">9/10</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quadrant 2: Promoter & Insider Confidence */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Promoter & Insider Confidence
                <Badge variant="success" className="ml-auto">
                  🟢 POSITIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Promoter stake stable at 52.4%</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Minimal pledging (0.8% - very low risk)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Insiders net buyers ₹20 Cr (8 buys vs 2 sells)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Management buying with own money</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>No distress signals</span>
                </div>
              </div>
              <div className="pt-3 border-t flex items-center justify-between">
                <span className="text-sm font-semibold">Signal Strength:</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-6 bg-green-600 rounded-sm"
                      />
                    ))}
                    <div className="w-2 h-6 bg-muted rounded-sm" />
                  </div>
                  <span className="text-lg font-bold text-green-600">9/10</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quadrant 3: Ownership Quality */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Ownership Quality
                <Badge variant="success" className="ml-auto">
                  🟢 POSITIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Shift from retail to institutional (quality upgrade)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Long-term investors entering via block deals</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Diverse institutional base (425 MF schemes, 180 FPIs)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Low concentration risk</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Stable, high-quality ownership structure</span>
                </div>
              </div>
              <div className="pt-3 border-t flex items-center justify-between">
                <span className="text-sm font-semibold">Signal Strength:</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-6 bg-green-600 rounded-sm"
                      />
                    ))}
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="w-2 h-6 bg-muted rounded-sm" />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-green-600">8/10</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quadrant 4: Upcoming Catalysts */}
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
                Upcoming Catalysts
                <Badge variant="default" className="ml-auto bg-yellow-600">
                  🟡 NEUTRAL TO POSITIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span>Q2 results on Oct 25 (key event)</span>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span>Dividend ex-date Oct 30 (price support)</span>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span>Board meeting Nov 5 (fundraising discussion)</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Results could disappoint (risk factor)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Multiple positive catalysts ahead</span>
                </div>
              </div>
              <div className="pt-3 border-t flex items-center justify-between">
                <span className="text-sm font-semibold">Signal Strength:</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-6 bg-yellow-600 rounded-sm"
                      />
                    ))}
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-2 h-6 bg-muted rounded-sm" />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-yellow-600">
                    7/10
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Verdict */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Overall Verdict
            </CardTitle>
            <CardDescription>What Activity Data Tells Us</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Strong Points */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Strong Points
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every category of smart money is bullish. FIIs, DIIs, mutual
                funds, promoters, and insiders are all either holding steady or
                actively buying. This unanimous positive stance across different
                investor types is rare and powerful.
              </p>
            </div>

            {/* Confidence Indicators */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">
                Confidence Indicators:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>
                    Institutional flows: ₹6,000 Cr net buying annually
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Insider activity: 3.5:1 buy-sell ratio</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>MF schemes: +57 net additions in 1 year</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Promoter pledge: Near zero (no stress)</span>
                </div>
              </div>
            </div>

            {/* What It Means for You */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                What It Means for You
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When smart money is this aligned, it&apos;s usually a good sign.
                These investors have better access to management, better
                research capabilities, and longer time horizons than retail
                investors. Their collective vote of confidence validates the
                fundamental thesis.
              </p>
            </div>

            {/* Risk Considerations */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Risk Considerations
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Heavy institutional ownership (33.7%) can cause volatility
                    if sentiment shifts
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Retail participation declining - less retail support on dips
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Upcoming results (Oct 25) are key - disappointment could
                    trigger selling
                  </span>
                </div>
              </div>
            </div>

            {/* Action Framework */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-4">Action Framework:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h5 className="font-semibold text-sm mb-2 text-green-600">
                    If You&apos;re Considering Entry
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Activity data supports buying. Smart money is accumulating.
                    Consider building position, especially on dips.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h5 className="font-semibold text-sm mb-2 text-blue-600">
                    If You&apos;re Already Holding
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Hold with confidence. Institutional support provides
                    downside cushion. Trail stops if needed.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <h5 className="font-semibold text-sm mb-2 text-purple-600">
                    If You&apos;re Skeptical
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Hard to be bearish when everyone with an information
                    advantage is buying. If fundamentals concern you, at least
                    acknowledge smart money disagrees.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 9: What's Next */}
      <div className="space-y-4">
        {/* Storytelling Header */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Activity looks good? Here&apos;s what to check next:
          </p>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🔍 What&apos;s Next
          </h2>
        </div>

        {/* Three horizontal action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/research/stock-screener/${symbol}?tab=news`}>
            <Card className="group hover:shadow-lg transition-all cursor-pointer border-primary/20 hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                    <Newspaper className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      Check Latest Developments
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Stay updated on announcements, news, analyst reports
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <span>Go to News Tab</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/research/stock-screener/${symbol}?tab=fundamentals`}>
            <Card className="group hover:shadow-lg transition-all cursor-pointer border-primary/20 hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-green-500/10 text-green-600 group-hover:bg-green-500/20 transition-colors">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      Review the Fundamentals
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Ensure business performance justifies smart money interest
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <span>Go to Fundamentals Tab</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/research/stock-screener/${symbol}?tab=technical`}>
            <Card className="group hover:shadow-lg transition-all cursor-pointer border-primary/20 hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20 transition-colors">
                    <LineChartIcon className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      Check Entry Timing
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      See if charts support entry at current levels
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <span>Go to Technical Tab</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Activity;
