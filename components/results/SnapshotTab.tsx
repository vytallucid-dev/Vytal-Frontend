"use client";

import { ResultsPageData, changeArrow, formatCrore, formatPct } from "@/lib/results-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Flame, Sparkles, Trophy, TrendingUp, Zap } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SnapshotTabProps {
  data: ResultsPageData;
  onTabChange: (tab: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ChangeCell({
  value,
  label,
  bold = false,
}: {
  value: number | null;
  label: string;
  bold?: boolean;
}) {
  if (value == null) return null;
  const arrow = changeArrow(value);
  const isPos = value > 0.5;
  const isNeg = value < -0.5;
  const color = isPos
    ? "text-emerald-500"
    : isNeg
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <div className={`flex items-center gap-1 text-xs ${color} ${bold ? "font-semibold" : "font-normal"}`}>
      <span>{arrow}</span>
      <span>
        {formatPct(Math.abs(value))} {label}
      </span>
    </div>
  );
}

function TaxRateLine({
  current,
  prevQ,
}: {
  current: number;
  prevQ: number | null;
}) {
  const deltaBps = prevQ != null ? Math.round((current - prevQ) * 100) : null;
  const bigMove = deltaBps != null && Math.abs(deltaBps) > 200;
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground leading-tight">
        Effective tax rate:{" "}
        <span className="font-medium text-foreground">{current.toFixed(1)}%</span>
        {prevQ != null && (
          <span className="ml-1">(prev Q: {prevQ.toFixed(1)}%)</span>
        )}
      </p>
      {bigMove && deltaBps != null && (
        <Badge
          variant="outline"
          className={`text-[9px] px-1.5 py-0 ${
            deltaBps > 0
              ? "text-amber-500 border-amber-500/30 bg-amber-500/5"
              : "text-blue-500 border-blue-500/30 bg-blue-500/5"
          }`}
        >
          {deltaBps > 0 ? "+" : ""}{deltaBps} bps vs prev Q
        </Badge>
      )}
    </div>
  );
}

function HeroCard({
  label,
  value,
  yoy,
  qoq,
  taxRateLine,
}: {
  label: string;
  value: number;
  yoy: number | null;
  qoq: number | null;
  taxRateLine?: { current: number; prevQ: number | null };
}) {
  return (
    <Card className="flex-1 min-w-[calc(50%-0.5rem)] lg:min-w-0 border-border/50 bg-gradient-to-br from-background to-muted/10">
      <CardContent className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          {label}
        </p>
        <p className="text-2xl lg:text-3xl font-bold tabular-nums leading-none mb-3">
          {formatCrore(value)}
        </p>
        <div className="space-y-0.5">
          <ChangeCell value={yoy} label="YoY" bold />
          <ChangeCell value={qoq} label="QoQ" />
        </div>
        {taxRateLine && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <TaxRateLine current={taxRateLine.current} prevQ={taxRateLine.prevQ} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Market Reaction ──────────────────────────────────────────────────────────

interface MarketReactionProps {
  priceHistory: ResultsPageData["priceHistory"];
  filingDate: string;
}

function MarketReaction({ priceHistory, filingDate }: MarketReactionProps) {
  if (priceHistory.length === 0) return null;

  // Filing was after market close on Oct 17, so T+1 reaction = Oct 18
  // T-1 base = Oct 16 close
  const filingDay = filingDate.slice(0, 10); // YYYY-MM-DD
  const filingIdx = priceHistory.findIndex((p) => p.date === filingDay);

  const getDay = (offset: number) => {
    // offset relative to filing day index: -1 = T-1, 0 = T+0, 1 = T+1, etc.
    const idx = filingIdx + offset;
    return idx >= 0 && idx < priceHistory.length ? priceHistory[idx] : null;
  };

  const tMinus1 = getDay(-1);
  const baseClose = tMinus1?.close ?? null;

  const calcPct = (close: number | undefined) => {
    if (!close || !baseClose) return null;
    return ((close - baseClose) / baseClose) * 100;
  };

  const keyDays = [
    { label: "T-1", day: getDay(-1) },
    { label: "T+0", day: getDay(0) },
    { label: "T+1", day: getDay(1) },
    { label: "T+5", day: getDay(5) },
    { label: "T+10", day: getDay(10) },
  ];

  // Sparkline data spanning the whole window
  const sparkData = priceHistory.map((p) => ({ close: p.close, date: p.date }));

  const t10 = getDay(10);
  const t10Pct = t10 ? calcPct(t10.close) : null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Market Reaction</CardTitle>
        <p className="text-xs text-muted-foreground">
          Filed{" "}
          {new Date(filingDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          (after market close) · Prices vs T-1 close
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price table */}
        <div className="grid grid-cols-5 gap-2">
          {keyDays.map(({ label, day }) => {
            const pct = day ? calcPct(day.close) : null;
            const isPos = pct != null && pct > 0.1;
            const isNeg = pct != null && pct < -0.1;
            return (
              <div key={label} className="text-center">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                  {label}
                </p>
                <p className="text-sm font-bold tabular-nums">
                  {day ? `₹${day.close.toLocaleString("en-IN")}` : "—"}
                </p>
                <p
                  className={`text-[10px] font-medium tabular-nums ${
                    isPos
                      ? "text-emerald-500"
                      : isNeg
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {pct == null
                    ? "—"
                    : label === "T-1"
                      ? "base"
                      : `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`}
                </p>
              </div>
            );
          })}
        </div>

        {/* Sparkline */}
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="close"
              stroke="var(--primary)"
              strokeWidth={1.5}
              fill="url(#sparkGradient)"
              dot={false}
              activeDot={{ r: 3, fill: "var(--primary)" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 11,
              }}
              formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Close"]}
              labelFormatter={(l: string) => l}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary line */}
        {t10Pct != null && (
          <p className="text-xs text-muted-foreground">
            Stock{" "}
            <span className={t10Pct > 0 ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
              {t10Pct > 0 ? "gained" : "lost"} {Math.abs(t10Pct).toFixed(1)}%
            </span>{" "}
            over 10 trading days following the result announcement.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── AI Quick Take ────────────────────────────────────────────────────────────

function AiQuickTake({
  aiSummary,
  onTabChange,
}: {
  aiSummary: ResultsPageData["aiSummary"];
  onTabChange: (tab: string) => void;
}) {
  if (!aiSummary) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-purple-500 mb-3">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-semibold uppercase tracking-wide">AI Quick Take</p>
          </div>
          <p className="text-sm text-muted-foreground italic">
            AI analysis is being generated — check back in a few minutes.
          </p>
        </CardContent>
      </Card>
    );
  }

  // First ~50 words of content
  const words = aiSummary.content.split(" ");
  const snippet = words.slice(0, 55).join(" ") + (words.length > 55 ? "…" : "");

  return (
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-purple-500">
          <Sparkles className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm font-semibold uppercase tracking-wide">AI Quick Take</p>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">{snippet}</p>

        <button
          onClick={() => onTabChange("context")}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          Read full analysis in Context tab
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </CardContent>
    </Card>
  );
}

// ─── Margin Pulse ─────────────────────────────────────────────────────────────

function MarginPulse({
  current,
  prevQuarter,
  sameQtrLastYear,
}: {
  current: ResultsPageData["current"];
  prevQuarter: ResultsPageData["prevQuarter"];
  sameQtrLastYear: ResultsPageData["sameQuarterLastYear"];
}) {
  const bps = (a: number, b: number | undefined) =>
    b != null ? Math.round((a - b) * 100) : null;
  const fmtBps = (v: number | null) => {
    if (v == null) return "—";
    const sign = v > 0 ? "+" : "";
    return `${sign}${v} bps`;
  };
  const bpsColor = (v: number | null) =>
    v == null
      ? "text-muted-foreground"
      : v > 0
        ? "text-emerald-500"
        : v < 0
          ? "text-red-500"
          : "text-muted-foreground";

  const metrics = [
    {
      label: "Operating Margin",
      value: current.operatingMargin,
      bpsYoy: bps(current.operatingMargin, sameQtrLastYear?.operatingMargin),
      bpsQoq: bps(current.operatingMargin, prevQuarter?.operatingMargin),
    },
    {
      label: "Net Margin",
      value: current.netMargin,
      bpsYoy: bps(current.netMargin, sameQtrLastYear?.netMargin),
      bpsQoq: bps(current.netMargin, prevQuarter?.netMargin),
    },
  ];

  return (
    <Card className="border-border/50">
      <CardContent className="p-0 divide-y divide-border/40">
        {metrics.map((m) => {
          const bigMove = Math.abs(m.bpsYoy ?? 0) > 100;
          return (
            <div
              key={m.label}
              className={`flex items-center justify-between px-5 py-3 gap-4 ${
                bigMove ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{m.label}</p>
                {bigMove && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                    Notable
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-6">
                <p className="text-lg font-bold tabular-nums">{m.value.toFixed(1)}%</p>
                <div className="text-right space-y-0.5 min-w-[90px]">
                  <p className={`text-xs font-semibold ${bpsColor(m.bpsYoy)}`}>
                    {fmtBps(m.bpsYoy)} YoY
                  </p>
                  <p className={`text-xs ${bpsColor(m.bpsQoq)}`}>
                    {fmtBps(m.bpsQoq)} QoQ
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Peer Rank Card ────────────────────────────────────────────────────────────

function PeerRankCard({
  peers,
  peerGroupName,
  current,
  onTabChange,
}: {
  peers: ResultsPageData["peers"];
  peerGroupName: string;
  current: ResultsPageData["current"];
  onTabChange: (tab: string) => void;
}) {
  const filedPeers = peers.filter((p) => p.filed);
  const totalPeers = peers.length;
  const filedCount = filedPeers.length;
  const totalParticipants = filedCount + 1;

  const computeRank = (
    currentVal: number | null,
    peerVals: (number | null)[]
  ): number | null => {
    if (currentVal == null) return null;
    const valid = peerVals.filter((v): v is number => v != null);
    const all = [currentVal, ...valid].sort((a, b) => b - a);
    const idx = all.indexOf(currentVal);
    return idx >= 0 ? idx + 1 : null;
  };

  const computeAvg = (vals: (number | null)[]): number | null => {
    const valid = vals.filter((v): v is number => v != null);
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  };

  const fmtVal = (v: number | null, isGrowth: boolean) => {
    if (v == null) return "—";
    const sign = isGrowth && v > 0 ? "+" : "";
    return `${sign}${v.toFixed(1)}%`;
  };

  const metricRows = [
    {
      label: "Revenue YoY",
      currentVal: current.revenueYoy,
      peerVals: filedPeers.map((p) => p.revenueYoy),
      isGrowth: true,
    },
    {
      label: "Net Profit YoY",
      currentVal: current.profitYoy,
      peerVals: filedPeers.map((p) => p.profitYoy),
      isGrowth: true,
    },
    {
      label: "Operating Margin",
      currentVal: current.operatingMargin,
      peerVals: filedPeers.map((p) => p.operatingMargin),
      isGrowth: false,
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Peer Rank</CardTitle>
          <Badge variant="outline" className="text-[10px] px-2 py-0">
            {current.quarter} {current.fiscalYear}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {peerGroupName}
          {filedCount > 0 && (
            <span>
              {" · "}
              {filedCount} peer{filedCount !== 1 ? "s" : ""} reported
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        {filedCount === 0 ? (
          <p className="text-sm text-muted-foreground py-1">
            {totalPeers === 0
              ? "First in peer group to report this quarter."
              : `Peers haven't reported ${current.quarter} ${current.fiscalYear} yet. Check back as filings come in.`}
          </p>
        ) : (
          <>
            {filedCount <= 2 && totalPeers > filedCount && (
              <p className="text-[10px] text-muted-foreground mb-3">
                Limited peer data — {filedCount} of {totalPeers} have reported
              </p>
            )}
            <div className="space-y-2.5">
              {metricRows.map((m) => {
                const rank = computeRank(m.currentVal, m.peerVals);
                const avg = computeAvg(m.peerVals);
                const isFirst = rank === 1;
                const isLast = rank != null && rank === totalParticipants;
                const aboveAvg =
                  !isLast && avg != null && m.currentVal != null && m.currentVal > avg;
                const belowAvg =
                  !isLast && avg != null && m.currentVal != null && m.currentVal < avg;

                return (
                  <div key={m.label} className="flex items-center gap-2">
                    {rank != null ? (
                      <span
                        className={`inline-flex items-center justify-center w-7 h-5 rounded-full text-[10px] font-bold flex-shrink-0 tabular-nums ${
                          isFirst
                            ? "bg-primary/20 text-primary"
                            : "border border-border/60 text-muted-foreground"
                        }`}
                      >
                        #{rank}
                      </span>
                    ) : (
                      <span className="w-7 h-5 flex-shrink-0" />
                    )}
                    <p className="text-xs text-muted-foreground flex-1 min-w-0">
                      {m.label}
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {fmtVal(m.currentVal, m.isGrowth)}
                    </p>
                    {avg != null && (
                      <p
                        className={`text-[10px] tabular-nums text-right min-w-[72px] ${
                          isLast
                            ? "text-muted-foreground"
                            : aboveAvg
                              ? "text-emerald-500"
                              : belowAvg
                                ? "text-red-500"
                                : "text-muted-foreground"
                        }`}
                      >
                        avg {fmtVal(avg, m.isGrowth)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="pt-3 mt-3 border-t border-border/40">
              <button
                onClick={() => onTabChange("pnl")}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                See full peer comparison
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Quarter Highlights Strip ──────────────────────────────────────────────────

function QuarterHighlightsStrip({
  current,
  trend,
}: {
  current: ResultsPageData["current"];
  trend: ResultsPageData["trend"];
}) {
  type ChipStyle = "default" | "muted" | "amber";
  interface Chip {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Icon: any;
    label: string;
    style: ChipStyle;
  }

  const chips: Chip[] = [];

  // 1. All-time high revenue
  const prevRevenues = trend.slice(0, -1).map((r) => r.revenue);
  if (prevRevenues.length === 0 || current.revenue > Math.max(...prevRevenues)) {
    chips.push({
      Icon: TrendingUp,
      label:
        trend.length >= 8
          ? "All-time high revenue"
          : "Highest revenue in available history",
      style: "default",
    });
  }

  // 2. Best op margin in 8Q
  if (chips.length < 4) {
    const maxOp = Math.max(...trend.map((r) => r.operatingMargin));
    if (current.operatingMargin >= maxOp) {
      chips.push({ Icon: Trophy, label: "Best op margin in 8Q", style: "default" });
    }
  }
  // Best net margin in 8Q
  if (chips.length < 4) {
    const maxNet = Math.max(...trend.map((r) => r.netMargin));
    if (current.netMargin >= maxNet) {
      chips.push({ Icon: Trophy, label: "Best net margin in 8Q", style: "default" });
    }
  }

  // 3. Profit growth streak
  if (chips.length < 4) {
    let streakLen = 0;
    for (let i = trend.length - 1; i >= 0; i--) {
      if ((trend[i].profitYoy ?? -1) > 0) streakLen++;
      else break;
    }
    let prevStreakLen = 0;
    for (let i = trend.length - 2; i >= 0; i--) {
      if ((trend[i].profitYoy ?? -1) > 0) prevStreakLen++;
      else break;
    }
    const brokStreak = (current.profitYoy ?? 0) <= 0;
    if (!brokStreak && streakLen >= 3) {
      chips.push({
        Icon: Flame,
        label: `${streakLen}Q net profit growth streak`,
        style: "default",
      });
    } else if (brokStreak && prevStreakLen >= 3) {
      chips.push({
        Icon: Flame,
        label: `Profit growth streak ended after ${prevStreakLen}Q`,
        style: "muted",
      });
    }
  }

  // 4. Other income share
  if (chips.length < 4 && current.profitBeforeTax > 0) {
    const share = (current.otherIncome / current.profitBeforeTax) * 100;
    if (share >= 5) {
      chips.push({
        Icon: Zap,
        label: `Other income share: ${share.toFixed(1)}%`,
        style: share > 15 ? "amber" : "default",
      });
    }
  }

  if (chips.length === 0) return null;

  const chipClass: Record<ChipStyle, string> = {
    default: "border-border/60 text-foreground/80 bg-muted/20",
    muted: "border-border/40 text-muted-foreground bg-transparent",
    amber: "border-amber-500/30 text-amber-600 bg-amber-500/5",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, i) => (
        <Badge
          key={i}
          variant="outline"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${chipClass[chip.style]}`}
        >
          <chip.Icon className="w-3 h-3 flex-shrink-0" />
          {chip.label}
        </Badge>
      ))}
    </div>
  );
}

// ─── Navigate Strip ───────────────────────────────────────────────────────────

function NavigateStrip({ onTabChange }: { onTabChange: (tab: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[
        {
          tab: "pnl",
          title: "Dive into the numbers",
          desc: "Full income statement, waterfall, 8-quarter trend",
        },
        {
          tab: "context",
          title: "Read the full analysis",
          desc: "AI commentary, news, peer context",
        },
        {
          tab: "context",
          title: "See how peers performed",
          desc: "Side-by-side with sector peers this quarter",
        },
      ].map((item) => (
        <button
          key={item.title}
          onClick={() => onTabChange(item.tab)}
          className="text-left p-4 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-muted/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium group-hover:text-primary transition-colors">
              {item.title}
            </p>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs text-muted-foreground">{item.desc}</p>
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SnapshotTab({ data, onTabChange }: SnapshotTabProps) {
  const {
    current,
    prevQuarter,
    sameQuarterLastYear,
    priceHistory,
    aiSummary,
    trend,
    stock,
    peers,
    peerGroupName,
  } = data;

  // Compute OP and PBT YoY/QoQ from comparison rows
  const opYoy =
    sameQuarterLastYear
      ? ((current.operatingProfit - sameQuarterLastYear.operatingProfit) /
          sameQuarterLastYear.operatingProfit) *
        100
      : null;
  const opQoq =
    prevQuarter
      ? ((current.operatingProfit - prevQuarter.operatingProfit) /
          prevQuarter.operatingProfit) *
        100
      : null;
  const pbtYoy =
    sameQuarterLastYear
      ? ((current.profitBeforeTax - sameQuarterLastYear.profitBeforeTax) /
          sameQuarterLastYear.profitBeforeTax) *
        100
      : null;
  const pbtQoq =
    prevQuarter
      ? ((current.profitBeforeTax - prevQuarter.profitBeforeTax) /
          prevQuarter.profitBeforeTax) *
        100
      : null;

  // Effective tax rate (Change 4)
  const currentTaxRate =
    current.profitBeforeTax > 0
      ? (current.tax / current.profitBeforeTax) * 100
      : null;
  const prevTaxRate =
    prevQuarter != null && prevQuarter.profitBeforeTax > 0
      ? (prevQuarter.tax / prevQuarter.profitBeforeTax) * 100
      : null;

  return (
    <div className="space-y-6">
      {/* 1.1 — Headline Numbers */}
      <div className="flex flex-wrap gap-3">
        <HeroCard
          label="Revenue"
          value={current.revenue}
          yoy={current.revenueYoy}
          qoq={current.revenueQoq}
        />
        <HeroCard
          label="Operating Profit"
          value={current.operatingProfit}
          yoy={opYoy}
          qoq={opQoq}
        />
        <HeroCard
          label="Profit Before Tax"
          value={current.profitBeforeTax}
          yoy={pbtYoy}
          qoq={pbtQoq}
        />
        <HeroCard
          label="Net Profit"
          value={current.netProfit}
          yoy={current.profitYoy}
          qoq={current.profitQoq}
          taxRateLine={
            currentTaxRate != null
              ? { current: currentTaxRate, prevQ: prevTaxRate }
              : undefined
          }
        />
      </div>

      {/* 1.2 — Margin Pulse | Peer Rank */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          Margin Pulse
        </h2>
        <div
          className={`grid gap-4 ${
            peerGroupName ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          <MarginPulse
            current={current}
            prevQuarter={prevQuarter}
            sameQtrLastYear={sameQuarterLastYear}
          />
          {peerGroupName && (
            <PeerRankCard
              peers={peers}
              peerGroupName={peerGroupName}
              current={current}
              onTabChange={onTabChange}
            />
          )}
        </div>
      </div>

      {/* 1.3 — Quarter Highlights Strip */}
      {trend.length > 0 && (
        <QuarterHighlightsStrip current={current} trend={trend} />
      )}

      {/* 1.3 + 1.4 — Two column: Market Reaction + AI Quick Take */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Market Reaction
          </h2>
          <MarketReaction
            priceHistory={priceHistory}
            filingDate={current.filingDate}
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            AI Take
          </h2>
          <AiQuickTake aiSummary={aiSummary} onTabChange={onTabChange} />
        </div>
      </div>

      {/* 1.5 — Navigate deeper */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          Go Deeper
        </h2>
        <NavigateStrip onTabChange={onTabChange} />
      </div>
    </div>
  );
}
