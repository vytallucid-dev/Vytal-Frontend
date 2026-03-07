"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QuarterlyResult,
  formatMetricValue,
  getChangeArrow,
  getChangeColor,
} from "@/lib/quarterly-results-data";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  PieChart,
  BarChart3,
} from "lucide-react";
import { Button } from "../ui/button";

interface OverviewTabProps {
  result: QuarterlyResult;
}

export default function OverviewTab({ result }: OverviewTabProps) {
  const formatChange = (change: number, unit: string) => {
    const arrow = getChangeArrow(change);
    const absChange = Math.abs(change);

    if (unit === "bps") {
      return `${arrow} ${absChange > 0 ? "+" : ""}${change} bps`;
    } else if (unit === "%") {
      return `${arrow} ${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
    } else {
      return `${arrow} ${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
    }
  };

  const getSurpriseIcon = (type?: "positive" | "negative") => {
    if (type === "positive") return "🟢";
    if (type === "negative") return "⚠️";
    return null;
  };

  // Extract key metrics for dashboard cards
  const getMetric = (name: string) =>
    result.metrics.find((m) => m.metric === name);

  const revenue = getMetric("Revenue");
  const netProfit = getMetric("PAT");
  const netMargin = getMetric("Net Margin");
  const eps = getMetric("EPS");
  const nii = getMetric("NII");
  const casaRatio = getMetric("CASA Ratio");

  const keyMetrics = [
    {
      title: "Revenue",
      value: revenue?.latest,
      change: revenue?.change,
      changeType: revenue?.changeType,
      unit: revenue?.unit,
      icon: DollarSign,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      isSurprise: revenue?.isSurprise,
      surpriseType: revenue?.surpriseType,
    },
    {
      title: "PAT",
      value: netProfit?.latest,
      change: netProfit?.change,
      changeType: netProfit?.changeType,
      unit: netProfit?.unit,
      icon: TrendingUp,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
      isSurprise: netProfit?.isSurprise,
      surpriseType: netProfit?.surpriseType,
    },
    {
      title: "Net Margin",
      value: netMargin?.latest,
      change: netMargin?.change,
      changeType: netMargin?.changeType,
      unit: netMargin?.unit,
      icon: Percent,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
      isSurprise: netMargin?.isSurprise,
      surpriseType: netMargin?.surpriseType,
    },
    {
      title: "EPS",
      value: eps?.latest,
      change: eps?.change,
      changeType: eps?.changeType,
      unit: eps?.unit,
      icon: Target,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
      isSurprise: eps?.isSurprise,
      surpriseType: eps?.surpriseType,
    },
  ];

  const performanceMetrics = [
    {
      title: "NII",
      value: nii?.latest,
      change: nii?.change,
      unit: nii?.unit,
      icon: PieChart,
    },
    {
      title: "CASA Ratio",
      value: casaRatio?.latest,
      change: casaRatio?.change,
      unit: casaRatio?.unit,
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: All Metrics Combined */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key Metrics - More Compact */}
          <div className="flex flex-wrap gap-3">
            {keyMetrics.map((metric, index) => (
              <Card
                key={index}
                className="flex-1 min-w-[calc(50%-0.375rem)] sm:min-w-[calc(33.333%-0.5rem)] lg:min-w-[calc(25%-0.5625rem)] border-border/50 bg-gradient-to-br from-background to-muted/20 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`${metric.iconBg} p-2 rounded-lg`}>
                      <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
                    </div>
                    {metric.isSurprise && (
                      <span className="text-sm">
                        {getSurpriseIcon(metric.surpriseType)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-lg font-bold">
                      {metric.value !== undefined &&
                        formatMetricValue(
                          metric.value,
                          metric.unit === "bps" ? "%" : metric.unit || "%",
                        )}
                    </p>
                    <div className="flex items-center gap-1">
                      {metric.change && metric.change > 0 ? (
                        <Badge
                          variant={"success"}
                          className="bg-green-500/10 text-green-600"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          <span className="text-xs font-semibold">
                            {metric.unit === "bps"
                              ? `${metric.change} bps`
                              : `${metric.change.toFixed(1)}%`}
                          </span>
                        </Badge>
                      ) : metric.change && metric.change < 0 ? (
                        <Badge
                          variant={"destructive"}
                          className="bg-red-500/10 text-red-600"
                        >
                          <ArrowDownRight className="h-3 w-3" />
                          <span className="text-xs font-semibold">
                            {metric.unit === "bps"
                              ? `${Math.abs(metric.change)} bps`
                              : `${Math.abs(metric.change).toFixed(1)}%`}
                          </span>
                        </Badge>
                      ) : null}
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {metric.changeType}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Indicators - More Compact */}
          <div className="flex flex-wrap gap-3">
            {performanceMetrics.map((metric, index) => (
              <Card
                key={index}
                className="flex-1 min-w-[calc(50%-0.375rem)] border-border/50"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-1.5 rounded-lg">
                        <metric.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {metric.title}
                        </p>
                        <p className="text-lg font-bold">
                          {metric.value !== undefined &&
                            formatMetricValue(
                              metric.value,
                              metric.unit === "bps" ? "%" : metric.unit || "%",
                            )}
                        </p>
                      </div>
                    </div>
                    {metric.change && (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                          metric.change > 0
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {metric.change > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="text-xs font-semibold">
                          {metric.change > 0 ? "+" : ""}
                          {metric.unit === "bps"
                            ? `${metric.change} bps`
                            : `${metric.change.toFixed(1)}%`}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Presentation & Company Info */}
        <div className="lg:col-span-1">
          <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Presentation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Presented By */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Presented By
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">
                        SD
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        Sashidhar Jagdishan
                      </p>
                      <p className="text-xs text-muted-foreground">MD & CEO</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-600">
                        SK
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        Srinivasan Vaidyanathan
                      </p>
                      <p className="text-xs text-muted-foreground">CFO</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border/50"></div>

              {/* Key Highlights */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Key Highlights
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                    <p className="text-xs text-muted-foreground">
                      Strong credit growth of{" "}
                      <span className="font-semibold text-foreground">
                        15.2%
                      </span>{" "}
                      YoY
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                    <p className="text-xs text-muted-foreground">
                      CASA ratio maintained at{" "}
                      <span className="font-semibold text-foreground">
                        42.5%
                      </span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                    <p className="text-xs text-muted-foreground">
                      Asset quality stable with GNPA at{" "}
                      <span className="font-semibold text-foreground">
                        1.26%
                      </span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                    <p className="text-xs text-muted-foreground">
                      Digital transactions up{" "}
                      <span className="font-semibold text-foreground">28%</span>{" "}
                      QoQ
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-500/20 bg-blue-500/5 py-4">
        <CardContent className="px-4 py-0">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-500 mb-1">
                3-Way Comparison Analysis
              </p>
              <p className="text-muted-foreground">
                Comparing <span className="font-medium">Mar 2024 (Latest)</span>{" "}
                with <span className="font-medium">Dec 2023 (QoQ)</span> and{" "}
                <span className="font-medium">Mar 2023 (YoY)</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Comparison Table */}

      <h2>Detailed Metrics Comparison</h2>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
              <TableHead className="font-semibold text-foreground py-3 px-4">
                Metric
              </TableHead>
              <TableHead className="font-semibold text-foreground text-right py-3 px-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm">Latest</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Mar 2024
                  </span>
                </div>
              </TableHead>
              <TableHead className="font-medium text-muted-foreground text-right py-3 px-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs">QoQ</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Dec 2023
                  </span>
                </div>
              </TableHead>
              <TableHead className="font-medium text-muted-foreground text-right py-3 px-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs">YoY</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Mar 2023
                  </span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground text-right py-3 px-4 pr-6">
                Change
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.metrics.map((metric, index) => (
              <TableRow
                key={index}
                className="hover:bg-muted/20 transition-colors border-b border-border/30 last:border-0"
              >
                <TableCell className="font-medium py-3 px-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span>{metric.metric}</span>
                    {metric.isSurprise && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 font-medium ${
                          metric.surpriseType === "positive"
                            ? "bg-green-500/10 text-green-600 border-green-500/30"
                            : "bg-orange-500/10 text-orange-600 border-orange-500/30"
                        }`}
                      >
                        {metric.surpriseType === "positive"
                          ? "Surprise"
                          : "Alert"}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold py-3 px-4 text-sm">
                  {formatMetricValue(
                    metric.latest,
                    metric.unit === "bps" ? "%" : metric.unit,
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground py-3 px-4 text-xs">
                  {formatMetricValue(
                    metric.qoq,
                    metric.unit === "bps" ? "%" : metric.unit,
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground py-3 px-4 text-xs">
                  {formatMetricValue(
                    metric.yoy,
                    metric.unit === "bps" ? "%" : metric.unit,
                  )}
                </TableCell>
                <TableCell className="text-right py-3 px-4 pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <Badge
                      className={`text-[11px] px-2 py-0.5 font-semibold ${
                        metric.change > 0
                          ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                      }`}
                    >
                      {formatChange(metric.change, metric.unit)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground uppercase font-medium">
                      {metric.changeType}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Legend and Insights */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            About Surprise Flags
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Metrics are automatically flagged when they deviate significantly
            from historical patterns. Here's what each flag means:
          </p>

          <div className="space-y-4">
            {/* Surprise Badge */}
            <div className="flex items-start gap-3">
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 font-medium bg-green-500/10 text-green-600 border-green-500/30 mt-0.5"
              >
                Surprise
              </Badge>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Positive Surprise</p>
                <p className="text-xs text-muted-foreground">
                  Indicates exceptional performance that exceeded expectations.
                  Appears when:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside ml-2">
                  <li>Growth exceeds 20% above the 4-quarter average</li>
                  <li>Margins improve by more than 100 basis points</li>
                  <li>
                    Revenue or profit beats historical growth trend
                    significantly
                  </li>
                </ul>
              </div>
            </div>

            {/* Alert Badge */}
            <div className="flex items-start gap-3">
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 font-medium bg-orange-500/10 text-orange-600 border-orange-500/30 mt-0.5"
              >
                Alert
              </Badge>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Area of Concern</p>
                <p className="text-xs text-muted-foreground">
                  Highlights metrics that require attention due to
                  underperformance. Appears when:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside ml-2">
                  <li>
                    Performance drops more than 20% below the 4-quarter average
                  </li>
                  <li>Margins decline by over 100 basis points</li>
                  <li>Debt levels or expenses increase unexpectedly</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Results Section */}
      <div className="mt-6 border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold mb-4">View Previous Results</h3>
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground hover:text-foreground"
          >
            Q1 FY25 (Jul 2024)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground hover:text-foreground"
          >
            Q4 FY24 (Apr 2024)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground hover:text-foreground"
          >
            Q3 FY24 (Jan 2024)
          </Button>
        </div>
      </div>
    </div>
  );
}
