"use client";

import {
  ResultsPageData,
  QuarterlyResultRow,
  changeArrow,
  Fundamental,
  PeerResult,
} from "@/lib/results-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3, ExternalLink, TrendingUp } from "lucide-react";

interface PnlTrendsTabProps {
  data: ResultsPageData;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(a: number, b: number): number {
  return ((a - b) / b) * 100;
}

function fmtCr(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("en-IN");
}

function fmtPctCell(v: number | null): string {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function fmtBpsCell(cur: number, ref: number): string {
  const bps = Math.round((cur - ref) * 100);
  return `${bps > 0 ? "+" : ""}${bps} bp`;
}

function ChangeChip({ value }: { value: number | null }) {
  if (value == null)
    return <span className="text-muted-foreground text-xs">—</span>;
  const pos = value > 0.5;
  const neg = value < -0.5;
  const arrow = changeArrow(value);
  return (
    <span
      className={`text-xs font-medium tabular-nums ${
        pos
          ? "text-emerald-500"
          : neg
            ? "text-red-500"
            : "text-muted-foreground"
      }`}
    >
      {arrow} {fmtPctCell(Math.abs(value))}
    </span>
  );
}

// Accounting style: positive → plain, negative → (parentheses)
function accounting(v: number): string {
  if (v < 0) return `(${Math.abs(v).toLocaleString("en-IN")})`;
  return v.toLocaleString("en-IN");
}

// ─── Section 2.1: Income Statement Table ─────────────────────────────────────

interface LineItemRow {
  label: string;
  current: number;
  prev: number | null;
  yoy: number | null;
  isSubtotal?: boolean;
  isMargin?: boolean; // margin % row — indented, muted
  indent?: boolean;
  unit?: "cr" | "pct"; // default cr
  negativeAccounting?: boolean; // wrap negatives in ()
}

function IncomeStatementTable({
  current,
  prevQ,
  sameQly,
}: {
  current: QuarterlyResultRow;
  prevQ: QuarterlyResultRow | null;
  sameQly: QuarterlyResultRow | null;
}) {
  const rows: LineItemRow[] = [
    {
      label: "Revenue",
      current: current.revenue,
      prev: prevQ?.revenue ?? null,
      yoy: sameQly?.revenue ?? null,
    },
    {
      label: "Expenses",
      current: -current.expenses,
      prev: prevQ ? -prevQ.expenses : null,
      yoy: sameQly ? -sameQly.expenses : null,
      negativeAccounting: true,
    },
    {
      label: "Operating Profit",
      current: current.operatingProfit,
      prev: prevQ?.operatingProfit ?? null,
      yoy: sameQly?.operatingProfit ?? null,
      isSubtotal: true,
    },
    {
      label: "Operating Margin",
      current: current.operatingMargin,
      prev: prevQ?.operatingMargin ?? null,
      yoy: sameQly?.operatingMargin ?? null,
      isMargin: true,
      unit: "pct",
    },
    {
      label: "Other Income",
      current: current.otherIncome,
      prev: prevQ?.otherIncome ?? null,
      yoy: sameQly?.otherIncome ?? null,
      indent: true,
    },
    {
      label: "Depreciation",
      current: -current.depreciation,
      prev: prevQ ? -prevQ.depreciation : null,
      yoy: sameQly ? -sameQly.depreciation : null,
      indent: true,
      negativeAccounting: true,
    },
    {
      label: "Interest",
      current: -current.interest,
      prev: prevQ ? -prevQ.interest : null,
      yoy: sameQly ? -sameQly.interest : null,
      indent: true,
      negativeAccounting: true,
    },
    {
      label: "Profit Before Tax",
      current: current.profitBeforeTax,
      prev: prevQ?.profitBeforeTax ?? null,
      yoy: sameQly?.profitBeforeTax ?? null,
      isSubtotal: true,
    },
    {
      label: "Tax",
      current: -current.tax,
      prev: prevQ ? -prevQ.tax : null,
      yoy: sameQly ? -sameQly.tax : null,
      negativeAccounting: true,
    },
    {
      label: "Net Profit",
      current: current.netProfit,
      prev: prevQ?.netProfit ?? null,
      yoy: sameQly?.netProfit ?? null,
      isSubtotal: true,
    },
    {
      label: "Net Margin",
      current: current.netMargin,
      prev: prevQ?.netMargin ?? null,
      yoy: sameQly?.netMargin ?? null,
      isMargin: true,
      unit: "pct",
    },
  ];

  const colQ = `${current.quarter} ${current.fiscalYear}`;
  const colPrev = prevQ ? `${prevQ.quarter} ${prevQ.fiscalYear}` : null;
  const colYoy = sameQly ? `${sameQly.quarter} ${sameQly.fiscalYear}` : null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full text-sm border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-muted/40 border-b border-border/50">
            <th className="text-left font-semibold py-3 px-4 text-xs uppercase tracking-wide text-muted-foreground w-[40%]">
              Line Item · All values ₹ Cr
            </th>
            <th className="text-right font-semibold py-3 px-4 min-w-[120px]">
              <span className="block text-sm">{colQ}</span>
              <span className="block text-[10px] font-normal text-muted-foreground">
                Current
              </span>
            </th>
            {colPrev && (
              <th className="text-right font-medium py-3 px-4 min-w-[120px] text-muted-foreground">
                <span className="block text-sm">{colPrev}</span>
                <span className="block text-[10px] font-normal">QoQ base</span>
              </th>
            )}
            {colYoy && (
              <th className="text-right font-medium py-3 px-4 min-w-[120px] text-muted-foreground">
                <span className="block text-sm">{colYoy}</span>
                <span className="block text-[10px] font-normal">YoY base</span>
              </th>
            )}
            <th className="text-right font-semibold py-3 px-4 min-w-[80px]">
              YoY%
            </th>
            <th className="text-right font-semibold py-3 px-4 pr-5 min-w-[80px]">
              QoQ%
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isPct = row.unit === "pct";

            const displayCurrent = isPct
              ? `${row.current.toFixed(1)}%`
              : row.negativeAccounting
                ? accounting(row.current)
                : fmtCr(row.current);

            const displayPrev =
              row.prev == null
                ? "—"
                : isPct
                  ? `${row.prev.toFixed(1)}%`
                  : row.negativeAccounting
                    ? accounting(row.prev)
                    : fmtCr(row.prev);

            const displayYoy =
              row.yoy == null
                ? "—"
                : isPct
                  ? `${row.yoy.toFixed(1)}%`
                  : row.negativeAccounting
                    ? accounting(row.yoy)
                    : fmtCr(row.yoy);

            // Compute changes
            let yoyChange: string = "—";
            let qoqChange: string = "—";
            let yoyPos: boolean | null = null;
            let qoqPos: boolean | null = null;

            if (!row.isMargin) {
              const absC = Math.abs(row.current);
              const absY = row.yoy != null ? Math.abs(row.yoy) : null;
              const absP = row.prev != null ? Math.abs(row.prev) : null;

              if (absY != null && absY !== 0) {
                const v = pct(absC, absY);
                yoyChange = `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
                // For expense rows, cost reduction is good
                yoyPos = row.negativeAccounting ? v < 0 : v > 0;
              }
              if (absP != null && absP !== 0) {
                const v = pct(absC, absP);
                qoqChange = `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
                qoqPos = row.negativeAccounting ? v < 0 : v > 0;
              }
            } else {
              // Margin rows show bps
              if (row.yoy != null) {
                const bps = Math.round((row.current - row.yoy) * 100);
                yoyChange = `${bps > 0 ? "+" : ""}${bps} bp`;
                yoyPos = bps > 0;
              }
              if (row.prev != null) {
                const bps = Math.round((row.current - row.prev) * 100);
                qoqChange = `${bps > 0 ? "+" : ""}${bps} bp`;
                qoqPos = bps > 0;
              }
            }

            const rowClass = row.isSubtotal
              ? "border-t border-b border-border/50 bg-muted/20"
              : row.isMargin
                ? "bg-muted/5"
                : "hover:bg-muted/10 transition-colors border-b border-border/20 last:border-0";

            const labelClass = row.isMargin
              ? "pl-8 text-xs text-muted-foreground italic"
              : row.indent
                ? "pl-6 text-muted-foreground"
                : row.isSubtotal
                  ? "font-semibold"
                  : "";

            const valueClass = row.isSubtotal
              ? "font-bold"
              : row.isMargin
                ? "text-xs text-muted-foreground"
                : "";

            return (
              <tr key={i} className={rowClass}>
                <td className={`py-2.5 px-4 text-sm ${labelClass}`}>
                  {row.label}
                </td>
                <td
                  className={`text-right py-2.5 px-4 tabular-nums ${valueClass}`}
                >
                  {displayCurrent}
                </td>
                {colPrev && (
                  <td className="text-right py-2.5 px-4 tabular-nums text-muted-foreground text-xs">
                    {displayPrev}
                  </td>
                )}
                {colYoy && (
                  <td className="text-right py-2.5 px-4 tabular-nums text-muted-foreground text-xs">
                    {displayYoy}
                  </td>
                )}
                <td
                  className={`text-right py-2.5 px-4 tabular-nums text-xs font-medium ${
                    yoyPos == null
                      ? "text-muted-foreground"
                      : yoyPos
                        ? "text-emerald-500"
                        : "text-red-500"
                  }`}
                >
                  {yoyChange}
                </td>
                <td
                  className={`text-right py-2.5 px-4 pr-5 tabular-nums text-xs font-medium ${
                    qoqPos == null
                      ? "text-muted-foreground"
                      : qoqPos
                        ? "text-emerald-500"
                        : "text-red-500"
                  }`}
                >
                  {qoqChange}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Source attribution */}
      <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          Source: NSE XBRL filing (filed{" "}
          {new Date(current.filingDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          ).{" "}
          <a
            href={current.xbrlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 hover:text-foreground underline"
          >
            View raw filing <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Section 2.2: P&L Waterfall ──────────────────────────────────────────────

function PnlWaterfall({ current }: { current: QuarterlyResultRow }) {
  // Build waterfall data
  // Each entry: name, base (transparent spacer), value (visible bar), absolute, type
  const items = [
    {
      name: "Revenue",
      absolute: current.revenue,
      start: 0,
      end: current.revenue,
      type: "positive",
    },
    {
      name: "Expenses",
      absolute: current.expenses,
      start: current.operatingProfit,
      end: current.revenue,
      type: "negative",
    },
    {
      name: "Op. Profit",
      absolute: current.operatingProfit,
      start: 0,
      end: current.operatingProfit,
      type: "subtotal",
    },
    {
      name: "Other Inc.",
      absolute: current.otherIncome,
      start: current.operatingProfit,
      end: current.operatingProfit + current.otherIncome,
      type: "positive",
    },
    {
      name: "Deprec.",
      absolute: current.depreciation,
      start:
        current.operatingProfit + current.otherIncome - current.depreciation,
      end: current.operatingProfit + current.otherIncome,
      type: "negative",
    },
    {
      name: "Interest",
      absolute: current.interest,
      start: current.profitBeforeTax,
      end: current.operatingProfit + current.otherIncome - current.depreciation,
      type: "negative",
    },
    {
      name: "PBT",
      absolute: current.profitBeforeTax,
      start: 0,
      end: current.profitBeforeTax,
      type: "subtotal",
    },
    {
      name: "Tax",
      absolute: current.tax,
      start: current.netProfit,
      end: current.profitBeforeTax,
      type: "negative",
    },
    {
      name: "Net Profit",
      absolute: current.netProfit,
      start: 0,
      end: current.netProfit,
      type: "total",
    },
  ];

  const chartData = items.map((item) => ({
    name: item.name,
    base: Math.min(item.start, item.end),
    value: Math.abs(item.end - item.start),
    absolute: item.absolute,
    type: item.type,
  }));

  const BAR_COLORS: Record<string, string> = {
    positive: "var(--success)",
    negative: "var(--danger)",
    subtotal: "var(--p-found)",
    total: "var(--p-mom)",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = items.find((i) => i.name === label);
      const type = item?.type ?? "";
      const color = BAR_COLORS[type] ?? "inherit";
      return (
        <div className="bg-background border border-border rounded-lg p-2.5 shadow-lg text-xs">
          <p className="font-semibold mb-1">{label}</p>
          <p style={{ color }}>
            ₹{(item?.absolute ?? 0).toLocaleString("en-IN")} Cr
          </p>
        </div>
      );
    }
    return null;
  };

  const opPct = ((current.operatingProfit / current.revenue) * 100).toFixed(0);
  const npPct = ((current.netProfit / current.revenue) * 100).toFixed(0);
  const pbtPct = ((current.profitBeforeTax / current.revenue) * 100).toFixed(0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Revenue to Net Profit Flow
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How ₹{current.revenue.toLocaleString("en-IN")} Cr of revenue becomes ₹
          {current.netProfit.toLocaleString("en-IN")} Cr of net profit
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.3}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Transparent spacer bar */}
            <Bar dataKey="base" stackId="wf" fill="transparent" />
            {/* Colored value bar */}
            <Bar dataKey="value" stackId="wf" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={BAR_COLORS[entry.type] ?? "var(--ink3)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Interpretation */}
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          For every ₹100 of revenue this quarter, ₹{opPct} was operating profit,
          ₹{pbtPct} made it past depreciation and interest, and ₹{npPct} was
          retained after tax.
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {[
            { label: "Positive / Addition", color: "var(--success)" },
            { label: "Deduction", color: "var(--danger)" },
            { label: "Sub-total", color: "var(--p-found)" },
            { label: "Net Profit", color: "var(--p-mom)" },
          ].map((l) => (
            <div
              key={l.label}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: l.color }}
              />
              {l.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section 2.3: 8-Quarter Trend ────────────────────────────────────────────

function EightQuarterTrend({
  trend,
  currentId,
}: {
  trend: QuarterlyResultRow[];
  currentId: string;
}) {
  const chartData = trend.map((row) => ({
    quarter: `${row.quarter}'${row.fiscalYear.slice(2)}`,
    revenue: row.revenue,
    netProfit: row.netProfit,
    id: row.id,
    isCurrent: row.id === currentId,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-xs space-y-1">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} style={{ color: entry.color }}>
              {entry.name}: ₹{entry.value.toLocaleString("en-IN")} Cr
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Highlight current quarter bar
  const CustomBar = (props: any) => {
    const { x, y, width, height, isCurrent } = props;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isCurrent ? "var(--p-found)" : "color-mix(in oklab, var(--p-found) 50%, transparent)"}
        rx={4}
        ry={4}
      />
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          8-Quarter Trend
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Revenue (bars, left axis) · Net Profit (line, right axis) ·{" "}
          <span className="text-blue-500 font-medium">
            Current quarter highlighted
          </span>
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.3}
            />
            <XAxis
              dataKey="quarter"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="rect" />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              name="Revenue (₹ Cr)"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isCurrent ? "var(--p-found)" : "color-mix(in oklab, var(--p-found) 31%, transparent)"}
                />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="netProfit"
              name="Net Profit (₹ Cr)"
              stroke="var(--success)"
              strokeWidth={2}
              dot={{ fill: "var(--success)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Section 2.4: Margin Evolution ───────────────────────────────────────────

function MarginEvolution({ trend }: { trend: QuarterlyResultRow[] }) {
  const chartData = trend.map((row) => ({
    quarter: `${row.quarter}'${row.fiscalYear.slice(2)}`,
    opMargin: row.operatingMargin,
    netMargin: row.netMargin,
  }));

  // Summary chips
  const first = trend[0];
  const last = trend[trend.length - 1];
  const opDelta = Math.round(
    (last.operatingMargin - first.operatingMargin) * 100,
  );
  const netDelta = Math.round((last.netMargin - first.netMargin) * 100);

  // Volatility: std dev of operating margin
  const values = trend.map((r) => r.operatingMargin);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const volatility = stdDev < 0.5 ? "Low" : stdDev < 1.5 ? "Medium" : "High";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-xs space-y-1">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Y domain — tight to actual range
  const allMargins = trend.flatMap((r) => [r.operatingMargin, r.netMargin]);
  const minY = Math.floor(Math.min(...allMargins)) - 2;
  const maxY = Math.ceil(Math.max(...allMargins)) + 2;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-orange-500" />
          Margin Evolution (8 Quarters)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.3}
            />
            <XAxis
              dataKey="quarter"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              domain={[minY, maxY]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="line" />
            <Line
              type="monotone"
              dataKey="opMargin"
              name="Operating Margin"
              stroke="var(--warning)"
              strokeWidth={2}
              dot={{ fill: "var(--warning)", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="netMargin"
              name="Net Margin"
              stroke="var(--p-mom)"
              strokeWidth={2}
              dot={{ fill: "var(--p-mom)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge
            variant="outline"
            className={`text-xs ${opDelta > 0 ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" : "text-red-500 border-red-500/30 bg-red-500/5"}`}
          >
            Op Margin 8Q trend: {opDelta > 0 ? "+" : ""}
            {opDelta} bps
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${netDelta > 0 ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" : "text-red-500 border-red-500/30 bg-red-500/5"}`}
          >
            Net Margin 8Q trend: {netDelta > 0 ? "+" : ""}
            {netDelta} bps
          </Badge>
          <Badge variant="outline" className="text-xs">
            Volatility: {volatility}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section 2.5: Growth Trajectory ─────────────────────────────────────────

function GrowthTrajectory({ trend }: { trend: QuarterlyResultRow[] }) {
  // Mini-trend: last 4 quarters' YoY signals
  const last4 = trend.slice(-4);

  const arrowFor = (v: number | null) => {
    if (v == null) return "▬";
    if (v > 1) return "▲";
    if (v < -1) return "▼";
    return "▬";
  };

  const latest = trend[trend.length - 1];

  const opYoyLatest =
    trend.length >= 5
      ? pct(latest.operatingProfit, trend[trend.length - 5].operatingProfit)
      : null;

  const opMargDelta =
    trend.length >= 2
      ? (latest.operatingMargin - trend[trend.length - 5]?.operatingMargin) *
        100
      : null;

  const netMargDelta =
    trend.length >= 2
      ? (latest.netMargin - trend[trend.length - 5]?.netMargin) * 100
      : null;

  const cards = [
    {
      label: "Revenue YoY Growth",
      value: latest.revenueYoy,
      unit: "%",
      trail: last4.map((r) => arrowFor(r.revenueYoy)),
    },
    {
      label: "Net Profit YoY Growth",
      value: latest.profitYoy,
      unit: "%",
      trail: last4.map((r) => arrowFor(r.profitYoy)),
    },
    {
      label: "Op. Margin Change (8Q)",
      value: opMargDelta != null ? Math.round(opMargDelta) : null,
      unit: "bps",
      trail: last4.map((r, i) => {
        if (i === 0 || !trend[trend.length - 4 + i - 1]) return "▬";
        const prev = trend[trend.length - 4 + i - 1];
        const delta = r.operatingMargin - prev.operatingMargin;
        return arrowFor(delta * 100);
      }),
    },
    {
      label: "Net Margin Change (8Q)",
      value: netMargDelta != null ? Math.round(netMargDelta) : null,
      unit: "bps",
      trail: last4.map((r, i) => {
        if (i === 0 || !trend[trend.length - 4 + i - 1]) return "▬";
        const prev = trend[trend.length - 4 + i - 1];
        const delta = r.netMargin - prev.netMargin;
        return arrowFor(delta * 100);
      }),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const isPos = card.value != null && card.value > 0;
        const isNeg = card.value != null && card.value < 0;
        return (
          <Card key={card.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {card.label}
              </p>
              <p
                className={`text-2xl font-bold tabular-nums mb-3 ${
                  isPos ? "text-emerald-500" : isNeg ? "text-red-500" : ""
                }`}
              >
                {card.value == null
                  ? "—"
                  : `${card.value > 0 ? "+" : ""}${card.value.toFixed(card.unit === "bps" ? 0 : 1)}${card.unit === "bps" ? " bps" : "%"}`}
              </p>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">
                  Last 4Q trend:
                </p>
                <p className="text-base tracking-widest">
                  {card.trail.map((arrow, i) => (
                    <span
                      key={i}
                      className={
                        arrow === "▲"
                          ? "text-emerald-500"
                          : arrow === "▼"
                            ? "text-red-500"
                            : "text-muted-foreground"
                      }
                    >
                      {arrow}
                    </span>
                  ))}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Peer Benchmark ─────────────────────────────────────────────────────────

function PeerBenchmark({
  peers,
  peerGroupName,
  currentTicker,
  currentRevenueYoy,
  currentProfitYoy,
  currentOpMargin,
}: {
  peers: PeerResult[];
  peerGroupName: string | null;
  currentTicker: string;
  currentRevenueYoy: number | null;
  currentProfitYoy: number | null;
  currentOpMargin: number;
}) {
  if (peers.length === 0) return null;

  const fmtPct = (v: number | null) => {
    if (v == null) return "—";
    return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
  };

  const fmtMargin = (v: number | null) =>
    v == null ? "—" : `${v.toFixed(1)}%`;

  const filedPeers = peers.filter((p) => p.filed);
  const avgRevYoy =
    filedPeers.filter((p) => p.revenueYoy != null).length > 0
      ? filedPeers.reduce((s, p) => s + (p.revenueYoy ?? 0), 0) /
        filedPeers.filter((p) => p.revenueYoy != null).length
      : null;
  const avgProfitYoy =
    filedPeers.filter((p) => p.profitYoy != null).length > 0
      ? filedPeers.reduce((s, p) => s + (p.profitYoy ?? 0), 0) /
        filedPeers.filter((p) => p.profitYoy != null).length
      : null;
  const avgMargin =
    filedPeers.filter((p) => p.operatingMargin != null).length > 0
      ? filedPeers.reduce((s, p) => s + (p.operatingMargin ?? 0), 0) /
        filedPeers.filter((p) => p.operatingMargin != null).length
      : null;

  const pctColor = (v: number | null) =>
    v == null ? "text-muted-foreground" : v > 0 ? "text-emerald-500" : "text-red-500";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">How Peers Reported</CardTitle>
        {peerGroupName && (
          <p className="text-xs text-muted-foreground">
            Peer group: {peerGroupName}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-muted/40 border-y border-border/50">
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Company
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Revenue YoY
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Net Profit YoY
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Op. Margin
                </th>
                <th className="text-right py-2.5 px-4 pr-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Filed
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-primary/5 border-b border-border/30">
                <td className="py-2.5 px-4 font-semibold">
                  {currentTicker}
                  <Badge className="ml-2 text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                    ← You
                  </Badge>
                </td>
                <td className={`text-right py-2.5 px-4 tabular-nums font-medium ${pctColor(currentRevenueYoy)}`}>
                  {fmtPct(currentRevenueYoy)}
                </td>
                <td className={`text-right py-2.5 px-4 tabular-nums font-medium ${pctColor(currentProfitYoy)}`}>
                  {fmtPct(currentProfitYoy)}
                </td>
                <td className="text-right py-2.5 px-4 tabular-nums font-medium">
                  {fmtMargin(currentOpMargin)}
                </td>
                <td className="text-right py-2.5 px-4 pr-5 text-xs text-muted-foreground">
                  —
                </td>
              </tr>

              {peers.map((peer) => (
                <tr
                  key={peer.ticker}
                  className="border-b border-border/20 hover:bg-muted/20 transition-colors last:border-0"
                >
                  <td className="py-2.5 px-4 font-medium text-muted-foreground">
                    {peer.ticker}
                    <span className="block text-[10px] text-muted-foreground/60">
                      {peer.companyName}
                    </span>
                  </td>
                  <td className={`text-right py-2.5 px-4 tabular-nums text-xs ${pctColor(peer.revenueYoy)}`}>
                    {peer.filed ? fmtPct(peer.revenueYoy) : "Not yet reported"}
                  </td>
                  <td className={`text-right py-2.5 px-4 tabular-nums text-xs ${pctColor(peer.profitYoy)}`}>
                    {peer.filed ? fmtPct(peer.profitYoy) : "—"}
                  </td>
                  <td className="text-right py-2.5 px-4 tabular-nums text-xs text-muted-foreground">
                    {peer.filed ? fmtMargin(peer.operatingMargin) : "—"}
                  </td>
                  <td className="text-right py-2.5 px-4 pr-5 text-xs text-muted-foreground">
                    {peer.filingDate
                      ? new Date(peer.filingDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Pending"}
                  </td>
                </tr>
              ))}

              <tr className="bg-muted/30 border-t border-border/50">
                <td className="py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                  Peer avg (simple mean)
                </td>
                <td className={`text-right py-2.5 px-4 tabular-nums text-xs ${pctColor(avgRevYoy)}`}>
                  {fmtPct(avgRevYoy)}
                </td>
                <td className={`text-right py-2.5 px-4 tabular-nums text-xs ${pctColor(avgProfitYoy)}`}>
                  {fmtPct(avgProfitYoy)}
                </td>
                <td className="text-right py-2.5 px-4 tabular-nums text-xs text-muted-foreground">
                  {fmtMargin(avgMargin)}
                </td>
                <td className="py-2.5 px-4 pr-5" />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-border/40 bg-muted/10">
          <p className="text-[10px] text-muted-foreground">
            Click any peer to view their result for the same quarter.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Annual Lens ─────────────────────────────────────────────────────────────

function AnnualLens({ fundamental }: { fundamental: Fundamental | null }) {
  if (!fundamental) return null;

  const ratios = [
    { label: "ROE", value: `${fundamental.roe.toFixed(1)}%` },
    { label: "ROCE", value: `${fundamental.roce.toFixed(1)}%` },
    { label: "Net Margin", value: `${fundamental.netMarginAnnual.toFixed(1)}%` },
    { label: "Debt / Equity", value: fundamental.debtToEquity.toFixed(2) },
    { label: "EPS", value: `₹${fundamental.eps.toFixed(1)}` },
    { label: "Book Value / Share", value: `₹${fundamental.bookValuePerShare.toLocaleString("en-IN")}` },
    { label: "P/E (TTM)", value: fundamental.pe.toFixed(1) },
    { label: "Dividend Yield", value: `${fundamental.dividendYield.toFixed(1)}%` },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Annual Context · {fundamental.fiscalYear}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Full-year {fundamental.fiscalYear} numbers from the latest annual
          report. Quarterly results don't include all ratios — this gives the
          long-term lens.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ratios.map((r) => (
            <div
              key={r.label}
              className="p-3 rounded-lg border border-border/40 bg-muted/10"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                {r.label}
              </p>
              <p className="text-lg font-bold tabular-nums">{r.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PnlTrendsTab({ data }: PnlTrendsTabProps) {
  const { current, prevQuarter, sameQuarterLastYear, trend, stock, peers, peerGroupName, fundamental } = data;

  return (
    <div className="space-y-8">
      {/* 2.5 — Growth Trajectory */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
          Growth Trajectory
        </h2>
        <GrowthTrajectory trend={trend} />
      </section>

      {/* 2.1 — Income Statement */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
          Income Statement
        </h2>
        <IncomeStatementTable
          current={current}
          prevQ={prevQuarter}
          sameQly={sameQuarterLastYear}
        />
      </section>

      {/* 2.2 — Waterfall */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
          P&L Waterfall
        </h2>
        <PnlWaterfall current={current} />
      </section>

      {/* 2.3 — Peer Benchmark */}
      {peers.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            Peer Benchmark
          </h2>
          <PeerBenchmark
            peers={peers}
            peerGroupName={peerGroupName}
            currentTicker={stock.ticker}
            currentRevenueYoy={current.revenueYoy}
            currentProfitYoy={current.profitYoy}
            currentOpMargin={current.operatingMargin}
          />
        </section>
      )}

      {/* 2.4 — Annual Context */}
      {fundamental && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            Annual Context
          </h2>
          <AnnualLens fundamental={fundamental} />
        </section>
      )}

      {/* 2.5 — 8-Quarter Trend */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
          8-Quarter Trend
        </h2>
        <EightQuarterTrend trend={trend} currentId={current.id} />
      </section>

      {/* 2.4 — Margin Evolution */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
          Margin Evolution
        </h2>
        <MarginEvolution trend={trend} />
      </section>
    </div>
  );
}
