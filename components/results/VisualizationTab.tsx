"use client";

import { QuarterlyResult } from "@/lib/quarterly-results-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { TrendingUp, DollarSign, Percent, TrendingDown } from "lucide-react";

interface VisualizationTabProps {
  result: QuarterlyResult;
}

export default function VisualizationTab({ result }: VisualizationTabProps) {
  const { historical } = result;

  // Prepare chart data
  const revenueData = historical.quarters.map((quarter, index) => ({
    quarter,
    revenue: historical.revenue[index],
  }));

  const patData = historical.quarters.map((quarter, index) => ({
    quarter,
    pat: historical.pat[index],
  }));

  const marginData = historical.quarters.map((quarter, index) => ({
    quarter,
    netMargin: historical.netMargin[index],
    operatingMargin: historical.operatingMargin[index],
  }));

  const epsData = historical.quarters.map((quarter, index) => ({
    quarter,
    eps: historical.eps[index],
  }));

  const revenueVsProfitData = historical.quarters.map((quarter, index) => ({
    quarter,
    revenue: historical.revenue[index],
    pat: historical.pat[index],
  }));

  const debtVsAssetsData = historical.quarters.map((quarter, index) => ({
    quarter,
    assets: historical.totalAssets[index],
    debt: historical.totalDebt[index],
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}
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
      <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-purple-500 mb-1">8-Quarter Trend Analysis</p>
          <p className="text-muted-foreground">
            Visual representation of key metrics over the last 8 quarters. Latest quarter is highlighted.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Trend */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="quarter" 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  fill="#22c55e" 
                  radius={[6, 6, 0, 0]}
                  name="Revenue (₹ Cr)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: PAT Trend */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              PAT Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={patData}>
                <defs>
                  <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="quarter" 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="pat" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#colorPat)"
                  name="PAT (₹ Cr)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Margin Trends */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Percent className="h-5 w-5 text-orange-500" />
              Margin Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="quarter" 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                  domain={[0, 30]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="netMargin" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Net Margin (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="operatingMargin" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 4 }}
                  name="Operating Margin (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4: EPS Progression */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              EPS Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={epsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="quarter" 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="eps" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]}
                  name="EPS (₹)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 5: Revenue vs Profit */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-violet-500" />
              Revenue vs Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={revenueVsProfitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="quarter" 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="rect"
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#8b5cf6" 
                  radius={[6, 6, 0, 0]}
                  name="Revenue (₹ Cr)"
                />
                <Bar 
                  dataKey="pat" 
                  fill="#06b6d4" 
                  radius={[6, 6, 0, 0]}
                  name="PAT (₹ Cr)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 6: Debt vs Assets */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-amber-500" />
              Debt vs Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={debtVsAssetsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="quarter" 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af' }}
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="assets" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                  name="Total Assets (₹ Cr)"
                />
                <Line 
                  type="monotone" 
                  dataKey="debt" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  name="Total Debt (₹ Cr)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
