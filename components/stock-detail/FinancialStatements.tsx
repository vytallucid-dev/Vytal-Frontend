"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  defaultFinancialStatements,
  type AnnualRow,
  type CAGRCard,
  type QuarterlyRow,
} from "@/lib/financial-statements-data";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Download, FileText, Layers } from "lucide-react";
import { useState } from "react";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Format a number in Indian comma style (1,23,45,678) */
function formatIndian(n: number | string | null): string {
  if (n === null || n === undefined) return "—";
  if (typeof n === "string") return n; // already formatted / percentage

  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  if (abs >= 10000000) {
    // ≥ 1 Cr – use Indian grouping
    const s = Math.round(abs).toString();
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return `${sign}${grouped ? grouped + "," : ""}${last3}`;
  }

  return `${sign}${Math.round(abs).toLocaleString("en-IN")}`;
}

/** Choose a text-color class based on value sign */
function valueColor(v: number | string | null): string {
  if (v === null || typeof v === "string") return "";
  if (v < 0) return "text-red-500";
  return "";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TableProps<T extends QuarterlyRow | AnnualRow> {
  periods: string[];
  rows: T[];
}

function ExpandableTable<T extends QuarterlyRow | AnnualRow>({
  periods,
  rows,
}: TableProps<T>) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(idx: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  return (
    <div className="relative overflow-x-auto rounded-md border border-border/60">
      <table className="w-full text-xs border-collapse">
        {/* Header */}
        <thead>
          <tr className="border-b border-border/60 bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/50 backdrop-blur-sm text-left py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide min-w-[190px] whitespace-nowrap border-r border-border/60 shadow-[1px_0_0_0_hsl(var(--border)/0.4)]">
              Particulars
            </th>
            {periods.map((p) => (
              <th
                key={p}
                className="text-right py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap min-w-[92px]"
              >
                {p}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border/30">
          {rows.map((row, rowIdx) => {
            const isSection = "isSectionHeader" in row && row.isSectionHeader;
            const isTotal = "isTotal" in row && row.isTotal;
            const isBold = row.bold;
            const isExpanded = expanded.has(rowIdx);
            const hasChildren = row.expandable && row.subItems?.length;

            // Determine sticky-cell background per row type
            const stickyBg = isSection
              ? "bg-muted/60"
              : isTotal
                ? "bg-primary/[0.04]"
                : "bg-background";

            return (
              <>
                {/* Main row */}
                <tr
                  key={rowIdx}
                  className={cn(
                    "group transition-colors",
                    isSection && "bg-muted/60",
                    isTotal && "bg-primary/[0.04]",
                    !isSection && !isTotal && "hover:bg-muted/20",
                    hasChildren && "cursor-pointer select-none",
                  )}
                  onClick={() => hasChildren && toggle(rowIdx)}
                >
                  {/* Metric name — sticky */}
                  <td
                    className={cn(
                      "sticky left-0 z-10 py-2 px-3 border-r border-border/40 whitespace-nowrap shadow-[1px_0_0_0_hsl(var(--border)/0.3)]",
                      stickyBg,
                      isSection
                        ? "font-semibold text-[10px] uppercase tracking-widest text-muted-foreground"
                        : isBold
                          ? "font-semibold text-foreground"
                          : "text-foreground/80",
                    )}
                  >
                    {isSection ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-3 rounded-full bg-primary/60 shrink-0" />
                        {row.metric}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {hasChildren ? (
                          <span className="flex items-center justify-center w-4 h-4 rounded bg-muted group-hover:bg-muted/80 transition-colors shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-primary" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            )}
                          </span>
                        ) : (
                          <span className="w-4 h-4 shrink-0" />
                        )}
                        <span>{row.metric}</span>
                      </span>
                    )}
                  </td>

                  {/* Value cells */}
                  {isSection
                    ? periods.map((_, ci) => (
                        <td key={ci} className="py-2 px-3 bg-muted/60" />
                      ))
                    : row.values.map((v, ci) => (
                        <td
                          key={ci}
                          className={cn(
                            "text-right py-2 px-3 font-mono tabular-nums tracking-tight",
                            isBold ? "font-semibold" : "font-normal",
                            valueColor(v),
                          )}
                        >
                          {formatIndian(v)}
                        </td>
                      ))}
                </tr>

                {/* Expanded sub-rows */}
                {hasChildren &&
                  isExpanded &&
                  row.subItems?.map((sub, si) => (
                    <tr
                      key={`${rowIdx}-sub-${si}`}
                      className="border-t border-border/20 bg-muted/[0.04] hover:bg-muted/15 transition-colors"
                    >
                      <td className="sticky left-0 z-10 bg-muted/[0.04] py-1.5 px-3 border-r border-border/30 whitespace-nowrap pl-9 shadow-[1px_0_0_0_hsl(var(--border)/0.2)]">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="w-3 h-px bg-border/60 shrink-0" />
                          {sub.label}
                        </span>
                      </td>
                      {sub.values.map((v, ci) => (
                        <td
                          key={ci}
                          className={cn(
                            "text-right py-1.5 px-3 font-mono tabular-nums tracking-tight text-muted-foreground",
                            valueColor(v),
                          )}
                        >
                          {formatIndian(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CAGRSection({ cards }: { cards: CAGRCard[] }) {
  return (
    <div className="mt-6 pt-5 border-t border-border/40">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Growth &amp; Returns Summary
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-md border border-border/50 bg-muted/20 px-3 py-3 space-y-2"
          >
            <p className="text-[11px] font-semibold text-foreground/70 leading-tight">
              {card.title}
            </p>
            <div className="space-y-1">
              {card.rows.map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground">{row.label}</span>
                  <span
                    className={cn(
                      "text-xs font-mono font-semibold",
                      row.value.startsWith("-") ? "text-red-500" : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type TabKey = "quarterly" | "profitLoss" | "balanceSheet" | "cashFlow";

const TABS: { key: TabKey; label: string }[] = [
  { key: "quarterly", label: "Quarterly Results" },
  { key: "profitLoss", label: "Profit & Loss" },
  { key: "balanceSheet", label: "Balance Sheet" },
  { key: "cashFlow", label: "Cash Flows" },
];

export default function FinancialStatements() {
  const [activeTab, setActiveTab] = useState<TabKey>("quarterly");
  const [viewType, setViewType] = useState<"consolidated" | "standalone">("consolidated");

  const data = defaultFinancialStatements[viewType];

  function handleExportCSV() {
    const tabData = data[activeTab];
    const rows: string[][] = [];

    // Header
    rows.push(["Particulars", ...tabData.periods]);

    const allRows =
      activeTab === "profitLoss"
        ? (tabData as typeof data.profitLoss).rows
        : activeTab === "balanceSheet"
          ? (tabData as typeof data.balanceSheet).rows
          : activeTab === "cashFlow"
            ? (tabData as typeof data.cashFlow).rows
            : (tabData as typeof data.quarterly).rows;

    allRows.forEach((row) => {
      if ("isSectionHeader" in row && row.isSectionHeader) return;
      rows.push([row.metric, ...row.values.map((v) => (v === null ? "" : String(v)))]);
    });

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial-statements-${activeTab}-${viewType}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="financial-statements" className="mt-12">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-tight">Financial Statements</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Figures in ₹ Crores &nbsp;·&nbsp;
              <button
                onClick={() =>
                  setViewType((v) => (v === "consolidated" ? "standalone" : "consolidated"))
                }
                className="text-primary underline underline-offset-2 hover:no-underline focus:outline-none"
              >
                View {viewType === "consolidated" ? "Standalone" : "Consolidated"}
              </button>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-7 px-2.5"
            onClick={handleExportCSV}
          >
            <Download className="w-3 h-3" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 px-2.5" disabled>
            <FileText className="w-3 h-3" />
            PDF
          </Button>
        </div>
      </div>

      <Card className="border border-border/60 shadow-sm">
        {/* Tab bar */}
        <div className="flex items-center border-b border-border/50 overflow-x-auto overflow-y-hidden bg-muted/20">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px focus:outline-none",
                activeTab === tab.key
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}

          <div className="ml-auto flex items-center px-3">
            <button
              onClick={() =>
                setViewType((v) => (v === "consolidated" ? "standalone" : "consolidated"))
              }
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors focus:outline-none",
                viewType === "consolidated"
                  ? "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
                  : "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20",
              )}
            >
              {viewType === "consolidated" ? "Consolidated" : "Standalone"}
            </button>
          </div>
        </div>

        <CardContent className="p-3">
          {activeTab === "quarterly" && (
            <ExpandableTable
              periods={data.quarterly.periods}
              rows={data.quarterly.rows}
            />
          )}

          {activeTab === "profitLoss" && (
            <>
              <ExpandableTable
                periods={data.profitLoss.periods}
                rows={data.profitLoss.rows}
              />
              <CAGRSection cards={data.profitLoss.cagrCards} />
            </>
          )}

          {activeTab === "balanceSheet" && (
            <ExpandableTable
              periods={data.balanceSheet.periods}
              rows={data.balanceSheet.rows}
            />
          )}

          {activeTab === "cashFlow" && (
            <ExpandableTable
              periods={data.cashFlow.periods}
              rows={data.cashFlow.rows}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
