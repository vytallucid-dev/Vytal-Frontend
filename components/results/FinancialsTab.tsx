"use client";

import { QuarterlyResult } from "@/lib/quarterly-results-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";

interface FinancialsTabProps {
  result: QuarterlyResult;
}

export default function FinancialsTab({ result }: FinancialsTabProps) {
  const { margins, historical, costBreakdown } = result;

  // Get latest quarter data for calculations
  const latestRevenue = historical.revenue[historical.revenue.length - 1];
  const latestPAT = historical.pat[historical.pat.length - 1];
  const latestEBITDA = historical.ebitda[historical.ebitda.length - 1];

  // Calculate absolute values from percentages
  const grossProfit = (margins[0].latest / 100) * latestRevenue;
  const operatingProfit = (margins[1].latest / 100) * latestRevenue;

  // Prepare margin trend data
  const marginTrendData = historical.quarters.map((quarter, index) => ({
    quarter,
    grossMargin: historical.grossMargin[index],
    operatingMargin: historical.operatingMargin[index],
    ebitdaMargin: historical.ebitdaMargin[index],
    netMargin: historical.netMargin[index],
  }));

  // Helper functions
  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')} Cr`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 50) return <ArrowUpRight className="h-4 w-4" />;
    if (change < -50) return <ArrowDownRight className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 50) return "text-green-500 bg-green-500/10";
    if (change < -50) return "text-red-500 bg-red-500/10";
    return "text-muted-foreground bg-muted/30";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-blue-500 mb-1">Financial Breakdown</p>
          <p className="text-muted-foreground">
            Complete financial overview with absolute values and performance metrics
          </p>
        </div>
      </div>

      {/* Key Financial Metrics - Simple Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Revenue</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(latestRevenue)}</div>
              <div className="text-xs text-muted-foreground">Latest Quarter</div>
            </div>
          </CardContent>
        </Card>

        {/* EBITDA */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>EBITDA</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(latestEBITDA)}</div>
              <div className="text-xs text-blue-500">{formatPercent(margins[2].latest)} margin</div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Profit */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Percent className="h-4 w-4" />
                <span>Operating Profit</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(operatingProfit)}</div>
              <div className="text-xs text-orange-500">{formatPercent(margins[1].latest)} margin</div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Net Profit (PAT)</span>
              </div>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(latestPAT)}</div>
              <div className="text-xs text-green-500">{formatPercent(margins[3].latest)} margin</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profitability Metrics */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Profitability Margins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {margins.map((margin, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                <div className="flex-1">
                  <div className="font-semibold mb-1">{margin.metric}</div>
                  <div className="text-sm text-muted-foreground">Current vs Previous Quarter</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{formatPercent(margin.latest)}</div>
                    <div className="text-xs text-muted-foreground">Mar 2024</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg text-muted-foreground">{formatPercent(margin.qoq)}</div>
                    <div className="text-xs text-muted-foreground">Dec 2023</div>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${getChangeColor(margin.change)}`}>
                    {getChangeIcon(margin.change)}
                    <span className="text-sm font-semibold">{margin.change > 0 ? '+' : ''}{margin.change} bps</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue to Profit Breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Revenue to Profit Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Revenue */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="font-semibold">Total Revenue</span>
              <div className="text-right">
                <div className="font-bold text-green-500">{formatCurrency(latestRevenue)}</div>
                <div className="text-sm text-green-600">100%</div>
              </div>
            </div>

            {/* Less: COGS */}
            <div className="flex items-center gap-3 pl-6">
              <div className="w-0.5 h-8 bg-border"></div>
              <div className="flex-1 flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="font-medium">Less: Cost of Goods Sold</span>
                <div className="text-right">
                  <div className="font-semibold text-red-500">-{formatCurrency((costBreakdown.cogs / 100) * latestRevenue)}</div>
                  <div className="text-sm text-red-600">-{costBreakdown.cogs}%</div>
                </div>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="font-semibold">= Gross Profit</span>
              <div className="text-right">
                <div className="font-bold text-blue-500">{formatCurrency(grossProfit)}</div>
                <div className="text-sm text-blue-600">{formatPercent(margins[0].latest)}</div>
              </div>
            </div>

            {/* Less: Operating Expenses */}
            <div className="flex items-center gap-3 pl-6">
              <div className="w-0.5 h-8 bg-border"></div>
              <div className="flex-1 flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="font-medium">Less: Operating Expenses</span>
                <div className="text-right">
                  <div className="font-semibold text-red-500">-{formatCurrency((costBreakdown.operatingExpenses / 100) * latestRevenue)}</div>
                  <div className="text-sm text-red-600">-{costBreakdown.operatingExpenses}%</div>
                </div>
              </div>
            </div>

            {/* Operating Profit */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <span className="font-semibold">= Operating Profit (EBIT)</span>
              <div className="text-right">
                <div className="font-bold text-orange-500">{formatCurrency(operatingProfit)}</div>
                <div className="text-sm text-orange-600">{formatPercent(margins[1].latest)}</div>
              </div>
            </div>

            {/* Other Items */}
            <div className="flex items-center gap-3 pl-6">
              <div className="w-0.5 h-32 bg-border"></div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-sm font-medium">Add: Other Income</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-500">+{formatCurrency((costBreakdown.otherIncome / 100) * latestRevenue)}</div>
                    <div className="text-xs text-green-600">+{costBreakdown.otherIncome}%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-sm font-medium">Less: Depreciation</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-500">-{formatCurrency((costBreakdown.depreciation / 100) * latestRevenue)}</div>
                    <div className="text-xs text-red-600">-{costBreakdown.depreciation}%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-sm font-medium">Less: Interest</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-500">-{formatCurrency((costBreakdown.interest / 100) * latestRevenue)}</div>
                    <div className="text-xs text-red-600">-{costBreakdown.interest}%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-sm font-medium">Less: Tax</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-500">-{formatCurrency((costBreakdown.tax / 100) * latestRevenue)}</div>
                    <div className="text-xs text-red-600">-{costBreakdown.tax}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <span className="font-bold text-lg">= Net Profit (PAT)</span>
              <div className="text-right">
                <div className="font-bold text-2xl text-purple-500">{formatCurrency(latestPAT)}</div>
                <div className="text-sm text-purple-600 font-semibold">{formatPercent(costBreakdown.netProfit)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Margin Trends Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Margin Trends (8 Quarters)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={marginTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="quarter" 
                tick={{ fill: '#9ca3af' }}
                fontSize={12}
              />
              <YAxis 
                tick={{ fill: '#9ca3af' }}
                fontSize={12}
                domain={[0, 50]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="grossMargin" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Gross Margin"
              />
              <Line 
                type="monotone" 
                dataKey="operatingMargin" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Operating Margin"
              />
              <Line 
                type="monotone" 
                dataKey="ebitdaMargin" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="EBITDA Margin"
              />
              <Line 
                type="monotone" 
                dataKey="netMargin" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Net Margin"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
