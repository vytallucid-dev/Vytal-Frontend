"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingDown, TrendingUp } from "lucide-react";
import FinancialStatements from "@/components/stock-detail/FinancialStatements";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(217, 91%, 60%)" },
  profit: { label: "Net Profit", color: "hsl(142, 76%, 36%)" },
  gross: { label: "Gross Margin", color: "hsl(217, 91%, 60%)" },
  operating: { label: "Operating Margin", color: "hsl(262, 83%, 58%)" },
  net: { label: "Net Margin", color: "hsl(142, 76%, 36%)" },
};

const Fundamentals = () => {
  const params = useParams();
  const symbol = params.symbol as string;
  // Revenue & Profit data (Last 5 years quarterly)
  const revenueData = [
    { period: "Q1'20", revenue: 18500, profit: 3800 },
    { period: "Q2'20", revenue: 19200, profit: 4100 },
    { period: "Q3'20", revenue: 20100, profit: 4350 },
    { period: "Q4'20", revenue: 21500, profit: 4650 },
    { period: "Q1'21", revenue: 22200, profit: 4900 },
    { period: "Q2'21", revenue: 23800, profit: 5250 },
    { period: "Q3'21", revenue: 24500, profit: 5500 },
    { period: "Q4'21", revenue: 25800, profit: 5850 },
    { period: "Q1'22", revenue: 26500, profit: 6100 },
    { period: "Q2'22", revenue: 27200, profit: 6350 },
    { period: "Q3'22", revenue: 26800, profit: 6200 },
    { period: "Q4'22", revenue: 28200, profit: 6650 },
    { period: "Q1'23", revenue: 27800, profit: 6550 },
    { period: "Q2'23", revenue: 28500, profit: 6800 },
    { period: "Q3'23", revenue: 29800, profit: 7100 },
    { period: "Q4'23", revenue: 30500, profit: 7250 },
    { period: "Q1'24", revenue: 29500, profit: 7100 },
    { period: "Q2'24", revenue: 31800, profit: 7650 },
    { period: "Q3'24", revenue: 30200, profit: 7200 },
    { period: "Q4'24", revenue: 32500, profit: 7800 },
  ];

  // Margin evolution data (Annual)
  const marginData = [
    { year: "FY20", gross: 42.5, operating: 26.8, net: 22.1 },
    { year: "FY21", gross: 43.2, operating: 27.1, net: 22.8 },
    { year: "FY22", gross: 43.8, operating: 27.5, net: 23.2 },
    { year: "FY23", gross: 44.5, operating: 27.8, net: 23.8 },
    { year: "FY24", gross: 45.2, operating: 28.2, net: 24.5 },
  ];

  return (
    <div className="mt-8 space-y-12">
      {/* SECTION 1: FINANCIAL PERFORMANCE OVERVIEW */}
      <section id="financial-performance">
        <p className="text-muted-foreground mb-6 text-lg">
          Now let's look at the actual financial performance over time
        </p>

        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              💰 Financial Track Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* PART A: Revenue & Profit Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* LEFT: Dual-axis Chart (60%) */}
              <div className="lg:col-span-3">
                <h4 className="font-semibold mb-4">
                  Revenue & Profit Growth (Last 5 Years)
                </h4>
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <ComposedChart data={revenueData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="period"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      yAxisId="left"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      label={{
                        value: "Revenue (₹ Cr)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      label={{
                        value: "Profit (₹ Cr)",
                        angle: 90,
                        position: "insideRight",
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      fill="hsl(217, 91%, 60%)"
                      opacity={0.7}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="profit"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(142, 76%, 36%)", r: 3 }}
                    />
                  </ComposedChart>
                </ChartContainer>
              </div>

              {/* RIGHT: Recent Quarterly Performance (40%) */}
              <div className="lg:col-span-2">
                <h4 className="font-semibold mb-4">
                  Recent Quarterly Performance
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">
                          Quarter
                        </th>
                        <th className="text-right py-2 font-semibold">
                          Revenue
                        </th>
                        <th className="text-right py-2 font-semibold">YoY</th>
                        <th className="text-right py-2 font-semibold">
                          Profit
                        </th>
                        <th className="text-right py-2 font-semibold">YoY</th>
                        <th className="text-right py-2 font-semibold">
                          Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3">Q4 FY24</td>
                        <td className="text-right font-mono">₹32,500</td>
                        <td className="text-right text-green-500 font-semibold">
                          +14%
                        </td>
                        <td className="text-right font-mono">₹7,800</td>
                        <td className="text-right text-green-500 font-semibold">
                          +18%
                        </td>
                        <td className="text-right font-mono">24.0%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3">Q3 FY24</td>
                        <td className="text-right font-mono">₹30,200</td>
                        <td className="text-right text-green-500 font-semibold">
                          +12%
                        </td>
                        <td className="text-right font-mono">₹7,200</td>
                        <td className="text-right text-green-500 font-semibold">
                          +16%
                        </td>
                        <td className="text-right font-mono">23.8%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3">Q2 FY24</td>
                        <td className="text-right font-mono">₹31,800</td>
                        <td className="text-right text-green-500 font-semibold">
                          +16%
                        </td>
                        <td className="text-right font-mono">₹7,650</td>
                        <td className="text-right text-green-500 font-semibold">
                          +20%
                        </td>
                        <td className="text-right font-mono">24.1%</td>
                      </tr>
                      <tr>
                        <td className="py-3">Q1 FY24</td>
                        <td className="text-right font-mono">₹29,500</td>
                        <td className="text-right text-green-500 font-semibold">
                          +13%
                        </td>
                        <td className="text-right font-mono">₹7,100</td>
                        <td className="text-right text-green-500 font-semibold">
                          +17%
                        </td>
                        <td className="text-right font-mono">24.1%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 space-y-2 text-sm">
                  <p className="font-semibold mb-3">Key Insights:</p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    <span>
                      Consistent double-digit revenue growth for 12+ quarters
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    <span>
                      Profit growing faster than revenue (margin expansion)
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    <span>
                      Q2 FY24 was strongest quarter (festive season effect)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* PART B: Margin Evolution */}
            <div className="border-t pt-8">
              <h4 className="font-semibold mb-6 text-lg">
                Profitability Margins Over Time
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Chart */}
                <div className="lg:col-span-3">
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <LineChart data={marginData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="year"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        label={{
                          value: "Margin (%)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                        domain={[0, 50]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="gross"
                        stroke="hsl(217, 91%, 60%)"
                        strokeWidth={3}
                        dot={{ fill: "hsl(217, 91%, 60%)", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="operating"
                        stroke="hsl(262, 83%, 58%)"
                        strokeWidth={3}
                        dot={{ fill: "hsl(262, 83%, 58%)", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="net"
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth={3}
                        dot={{ fill: "hsl(142, 76%, 36%)", r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>

                {/* Margin Cards */}
                <div className="lg:col-span-2 space-y-3">
                  <p className="font-semibold mb-2 text-sm">
                    Current Margin Levels:
                  </p>

                  <Card className="border-l-4 border-l-blue-500 bg-blue-500/5 p-0">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Gross Margin
                          </p>
                          <p className="text-xl font-bold">45.2%</p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +1.8
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500 bg-purple-500/5 p-0">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Operating Margin
                          </p>
                          <p className="text-xl font-bold">28.2%</p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +0.8
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500 bg-green-500/5 p-0">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Net Margin
                          </p>
                          <p className="text-xl font-bold">24.5%</p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +1.2
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* AI Insight */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border italic">
                <p className="text-sm">
                  <span className="font-semibold not-italic">AI Insight:</span>{" "}
                  Margins have expanded across the board, indicating improving
                  operational efficiency and pricing power. Net margin
                  improvement of 1.2 percentage points over 3 years is
                  significant at this scale.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 2: FINANCIAL STATEMENTS TABLES */}
      <FinancialStatements />

      {/* SECTION 3: BALANCE SHEET SNAPSHOT */}
      <section id="balance-sheet">
        <p className="text-muted-foreground mb-6 text-lg">
          Let's check the balance sheet - the financial foundation
        </p>

        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              🏛️ Balance Sheet Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* COLUMN 1: Assets */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="bg-blue-500/5">
                  <CardTitle className="text-lg">Assets</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-semibold text-lg">
                        Total Assets
                      </span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +11%
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold font-mono">₹85,000 Cr</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <p className="font-semibold text-sm mb-3">Breakdown:</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Fixed Assets</span>
                          <span className="font-mono">₹29,750 Cr</span>
                        </div>
                        <div
                          className="h-2 bg-blue-500/30 rounded"
                          style={{ width: "35%" }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          35%
                        </p>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Current Assets</span>
                          <span className="font-mono">₹38,250 Cr</span>
                        </div>
                        <div
                          className="h-2 bg-blue-500/50 rounded"
                          style={{ width: "45%" }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          45%
                        </p>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Investments</span>
                          <span className="font-mono">₹12,750 Cr</span>
                        </div>
                        <div
                          className="h-2 bg-blue-500/70 rounded"
                          style={{ width: "15%" }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          15%
                        </p>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Intangibles</span>
                          <span className="font-mono">₹4,250 Cr</span>
                        </div>
                        <div
                          className="h-2 bg-blue-500/90 rounded"
                          style={{ width: "5%" }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">5%</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                      Quality: Healthy mix with good liquidity
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* COLUMN 2: Liabilities */}
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader className="bg-amber-500/5">
                  <CardTitle className="text-lg">Liabilities</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-semibold text-lg">
                        Total Liabilities
                      </span>
                    </div>
                    <p className="text-3xl font-bold font-mono">₹28,500 Cr</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Debt</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">
                          ₹18,200 Cr
                        </span>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          -5%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Other Liabilities</span>
                      <span className="font-mono font-semibold">
                        ₹10,300 Cr
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Debt-to-Assets
                      </span>
                      <span className="font-mono font-semibold text-green-500">
                        21.4%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      (Low - Good)
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                      Quality: Conservative leverage
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* COLUMN 3: Equity */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="bg-green-500/5">
                  <CardTitle className="text-lg">Equity</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-semibold text-lg">
                        Shareholder Equity
                      </span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +15%
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold font-mono">₹56,500 Cr</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Book Value/Share</span>
                      <span className="font-mono font-semibold">₹820</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Reserves</span>
                      <span className="font-mono font-semibold">
                        ₹48,200 Cr
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Retained Earnings</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                        Growing
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                      Quality: Strong capital base
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Ratios */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-green-500/5">
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Debt/Equity
                  </p>
                  <p className="text-2xl font-bold font-mono">0.35</p>
                  <Badge className="mt-2 bg-green-500/10 text-green-500 border-green-500/20">
                    🟢 Low
                  </Badge>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5">
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Current Ratio
                  </p>
                  <p className="text-2xl font-bold font-mono">1.85</p>
                  <Badge className="mt-2 bg-green-500/10 text-green-500 border-green-500/20">
                    🟢 Healthy
                  </Badge>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5">
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Quick Ratio
                  </p>
                  <p className="text-2xl font-bold font-mono">1.42</p>
                  <Badge className="mt-2 bg-green-500/10 text-green-500 border-green-500/20">
                    🟢 Good
                  </Badge>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/5">
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Equity Multiplier
                  </p>
                  <p className="text-2xl font-bold font-mono">1.50</p>
                  <Badge className="mt-2 bg-blue-500/10 text-blue-500 border-blue-500/20">
                    Conservative
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 4: CASH FLOW QUALITY */}
      <section id="cash-flow">
        <p className="text-muted-foreground mb-6 text-lg">
          Profit is opinion, cash is fact. Let's trace the cash movements
        </p>

        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              💵 Cash Flow Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Cash Flow Waterfall */}
            <div>
              <h4 className="font-semibold mb-6 text-lg">
                Cash Flow Waterfall (FY24)
              </h4>
              <div className="flex items-end justify-around h-64 border-b pb-4">
                {/* Starting Cash */}
                <div className="flex flex-col items-center">
                  <div
                    className="bg-blue-500/20 w-20 rounded-t"
                    style={{ height: "120px" }}
                  >
                    <div className="flex items-end justify-center h-full pb-2">
                      <span className="text-xs font-semibold">₹8.5K</span>
                    </div>
                  </div>
                  <p className="text-xs text-center mt-2 font-semibold">
                    Starting
                    <br />
                    Cash
                  </p>
                </div>

                {/* Operating CF */}
                <div className="flex flex-col items-center">
                  <div
                    className="bg-green-500/30 w-20 rounded-t"
                    style={{ height: "180px" }}
                  >
                    <div className="flex items-end justify-center h-full pb-2">
                      <span className="text-xs font-semibold text-green-600">
                        +₹12.5K
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-center mt-2 font-semibold text-green-600">
                    Operating
                    <br />
                    CF
                  </p>
                </div>

                {/* Investing CF */}
                <div className="flex flex-col items-center">
                  <div
                    className="bg-red-500/30 w-20 rounded-t"
                    style={{ height: "60px" }}
                  >
                    <div className="flex items-end justify-center h-full pb-2">
                      <span className="text-xs font-semibold text-red-600">
                        -₹4.3K
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-center mt-2 font-semibold text-red-600">
                    Investing
                    <br />
                    CF
                  </p>
                </div>

                {/* Financing CF */}
                <div className="flex flex-col items-center">
                  <div
                    className="bg-red-500/30 w-20 rounded-t"
                    style={{ height: "40px" }}
                  >
                    <div className="flex items-end justify-center h-full pb-2">
                      <span className="text-xs font-semibold text-red-600">
                        -₹2.8K
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-center mt-2 font-semibold text-red-600">
                    Financing
                    <br />
                    CF
                  </p>
                </div>

                {/* Ending Cash */}
                <div className="flex flex-col items-center">
                  <div
                    className="bg-green-500/20 w-20 rounded-t"
                    style={{ height: "200px" }}
                  >
                    <div className="flex items-end justify-center h-full pb-2">
                      <span className="text-xs font-semibold">₹13.9K</span>
                    </div>
                  </div>
                  <p className="text-xs text-center mt-2 font-semibold">
                    Ending
                    <br />
                    Cash
                  </p>
                  <Badge className="mt-1 bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                    +63% YoY
                  </Badge>
                </div>
              </div>
            </div>

            {/* Three-column breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* COLUMN 1: Operating Cash Flow */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="bg-green-500/5">
                  <CardTitle className="text-base">
                    Operating Cash Flow
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">OCF</span>
                    <span className="font-mono font-bold text-xl">
                      ₹12,500 Cr
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-muted-foreground">vs Net Profit</span>
                    <span className="font-mono">₹10,850 Cr</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Conversion Ratio</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        1.15x 🟢
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs italic pt-2">
                    "Real earnings, not paper profits"
                  </p>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">5Y OCF CAGR</span>
                      <span className="font-mono font-semibold text-green-500">
                        16.5%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* COLUMN 2: Investing Cash Flow */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="bg-blue-500/5">
                  <CardTitle className="text-base">
                    Investing Cash Flow
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-mono font-bold text-xl">
                      (₹4,300 Cr)
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capex</span>
                      <span className="font-mono">₹3,800 Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Acquisitions
                      </span>
                      <span className="font-mono">₹500 Cr</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capex/Sales</span>
                      <span className="font-mono">2.9%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Moderate)
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">FCF (OCF - Capex)</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        ₹8,700 Cr 🟢
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* COLUMN 3: Financing Cash Flow */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="bg-purple-500/5">
                  <CardTitle className="text-base">
                    Financing Cash Flow
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-mono font-bold text-xl">
                      (₹2,800 Cr)
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Debt Repayment
                      </span>
                      <span className="font-mono">₹1,850 Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dividends</span>
                      <span className="font-mono">₹950 Cr</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Payout Ratio
                      </span>
                      <span className="font-mono">35%</span>
                    </div>
                  </div>
                  <p className="text-xs italic pt-2 border-t">
                    Priority: "Debt reduction + shareholder returns"
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Interpretation */}
            <div className="p-4 bg-muted/50 rounded-lg border italic">
              <p className="text-sm mb-2">
                <span className="font-semibold not-italic">
                  AI Interpretation:
                </span>
              </p>
              <p className="text-sm leading-relaxed">
                Excellent cash flow profile. OCF of 115% of profit shows
                earnings quality is high - no accounting gimmickry. Free cash
                flow of ₹8,700 Cr gives management flexibility for growth,
                dividends, or debt reduction. Company is prioritizing debt
                paydown while maintaining dividend - conservative and
                shareholder-friendly approach.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 5: RETURN METRICS DEEP-DIVE */}
      <section id="profitability-metrics">
        <p className="text-muted-foreground mb-6 text-lg">
          How efficiently does the company use capital?
        </p>

        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              📊 Return on Capital Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Four metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CARD 1: ROE */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="bg-green-500/5">
                  <CardTitle className="text-sm">
                    Return on Equity (ROE)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="text-center">
                    <p className="text-4xl font-bold font-mono">17.2%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">5Y Average</span>
                      <span className="font-mono">16.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trend</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Improving
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peer Rank</span>
                      <span className="font-semibold">Top 15%</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      ROE Trend (8Q)
                    </p>
                    <div className="h-12 flex items-end justify-around gap-1">
                      {[16.2, 16.5, 16.7, 16.9, 17.0, 17.1, 17.0, 17.2].map(
                        (val, idx) => (
                          <div
                            key={idx}
                            className="flex-1 bg-green-500/30 rounded-t"
                            style={{ height: `${(val / 17.2) * 100}%` }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: ROCE */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="bg-blue-500/5">
                  <CardTitle className="text-sm">
                    Return on Capital Employed
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="text-center">
                    <p className="text-4xl font-bold font-mono">16.8%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Cost of Capital
                      </span>
                      <span className="font-mono">~11.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Economic Profit
                      </span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                        +5.4% ✓
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trend</span>
                      <span className="font-semibold">→ Stable</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs italic text-center">
                      "Creating value"
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3: ROA */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="bg-purple-500/5">
                  <CardTitle className="text-sm">Return on Assets</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="text-center">
                    <p className="text-4xl font-bold font-mono">12.5%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Asset Intensity
                      </span>
                      <span className="font-semibold">Moderate</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Efficiency</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                        Good
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trend</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +0.8 pts
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-center">
                      Better than <span className="font-semibold">70%</span> of
                      market
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 4: FCF Yield */}
              <Card className="border-l-4 border-l-cyan-500">
                <CardHeader className="bg-cyan-500/5">
                  <CardTitle className="text-sm">
                    Free Cash Flow Yield
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="text-center">
                    <p className="text-4xl font-bold font-mono">6.96%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      FCF Yield
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FCF</span>
                      <span className="font-mono">₹8,700 Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Market Cap</span>
                      <span className="font-mono">₹1.25L Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        vs Earnings Yield
                      </span>
                      <span className="font-mono">5.4%</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs w-full justify-center">
                      Quality: Cash-rich business
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* DuPont Analysis */}
            <div className="border-t pt-8">
              <h4 className="font-semibold mb-6 text-lg">
                DuPont Analysis Breakdown
              </h4>

              <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">ROE</p>
                    <p className="text-4xl font-bold font-mono text-primary">
                      17.2%
                    </p>
                  </div>

                  <div className="text-2xl font-bold">=</div>

                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <Card className="bg-background">
                      <CardContent className="pt-4 px-6">
                        <p className="text-xs text-muted-foreground mb-1">
                          Net Margin
                        </p>
                        <p className="text-2xl font-bold font-mono">24.5%</p>
                        <Badge className="mt-2 bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Strong
                        </Badge>
                      </CardContent>
                    </Card>

                    <div className="text-xl font-bold">×</div>

                    <Card className="bg-background">
                      <CardContent className="pt-4 px-6">
                        <p className="text-xs text-muted-foreground mb-1">
                          Asset Turnover
                        </p>
                        <p className="text-2xl font-bold font-mono">0.82x</p>
                        <Badge className="mt-2 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
                          Moderate
                        </Badge>
                      </CardContent>
                    </Card>

                    <div className="text-xl font-bold">×</div>

                    <Card className="bg-background">
                      <CardContent className="pt-4 px-6">
                        <p className="text-xs text-muted-foreground mb-1">
                          Equity Multiplier
                        </p>
                        <p className="text-2xl font-bold font-mono">0.86x</p>
                        <Badge className="mt-2 bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                          Conservative
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg border italic">
                <p className="text-sm mb-2">
                  <span className="font-semibold not-italic">
                    Interpretation:
                  </span>
                </p>
                <p className="text-sm leading-relaxed">
                  High ROE is driven primarily by exceptional margins (24.5%).
                  Asset turnover is moderate, which is normal for this sector.
                  Low equity multiplier (0.86x) shows conservative leverage -
                  company isn't using debt to juice returns, making the ROE more
                  sustainable.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      

      {/* SECTION 6: WHAT'S NEXT (Navigation) */}
      <section id="whats-next">
        <p className="text-muted-foreground mb-6 text-lg">
          Got the fundamentals? Here's what to explore next:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/research/stock-screener/${symbol}?tab=news`}>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="text-4xl">💎</div>
                  <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    Check if Price Makes Sense
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    See detailed valuation analysis and fair value estimates
                  </p>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    → Go to Valuation Tab
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/research/stock-screener/${symbol}?tab=technical`}>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="text-4xl">📈</div>
                  <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    See the Chart
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Check price trends, momentum, and technical indicators
                  </p>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    → Go to Technical Tab
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/research/stock-screener/${symbol}?tab=activity`}>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="text-4xl">🏢</div>
                  <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    Who's Buying/Selling
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Track institutional investors and insider activity
                  </p>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    → Go to Activity Tab
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Fundamentals;
