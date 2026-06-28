"use client";

/**
 * §2 — Price Performance. DISPLAY, highest verdict-risk → kept PURE FACTUAL.
 * Source: /price (stock series + Nifty 50 + sector index, returns precomputed).
 *
 * Shows: a rebased multi-line chart (stock vs Nifty vs sector) over a selectable
 * period, return cards (1M/3M/6M/1Y/3Y) each beside the same-window index return,
 * and distance from the 52W high/low. There is NO "outperformer", NO trend verdict,
 * NO 🟢, NO momentum language — just the numbers and the lines. The user reads it.
 * Index lines honest-empty for any window the index history can't reach (no fabrication).
 */

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Icons } from "@/lib/icons";
import { useStockPrice } from "@/lib/api/hooks/use-stock-price";
import type { PriceSeriesPoint, PricePeriodKey, StockPriceView } from "@/types/price";
import { Panel } from "../health/shared";
import { Section, HonestEmpty, LoadingBlock, DASH, fmtSignedPct, fmtPrice, toneColor } from "./shared";

const DAY = 86_400_000;
const PERIODS: { key: PricePeriodKey; days: number; returnKey: keyof StockPriceView["stock"]["returns"] }[] = [
  { key: "1M", days: 30, returnKey: "r1m" },
  { key: "3M", days: 91, returnKey: "r3m" },
  { key: "6M", days: 182, returnKey: "r6m" },
  { key: "1Y", days: 365, returnKey: "r1y" },
  { key: "3Y", days: 1095, returnKey: "r3y" },
];

// Line identity colours (which line is which) — NOT condition grading.
const LINE = {
  stock: "var(--ink)",
  nifty: "var(--ink3)",
  sector: "var(--p-mkt)",
} as const;

function within(series: PriceSeriesPoint[], days: number): PriceSeriesPoint[] {
  if (!series.length) return [];
  const latestMs = new Date(series[series.length - 1].date).getTime();
  const startMs = latestMs - days * DAY;
  return series.filter((p) => new Date(p.date).getTime() >= startMs);
}

function closeOnOrBefore(series: PriceSeriesPoint[], dateMs: number): number | null {
  let pick: number | null = null;
  for (const p of series) {
    if (new Date(p.date).getTime() <= dateMs) pick = p.close;
    else break;
  }
  return pick;
}

interface ChartRow {
  date: string;
  stock: number | null;
  nifty: number | null;
  sector: number | null;
}

export function PriceSection({ symbol }: { symbol: string }) {
  const { data: price, isLoading } = useStockPrice(symbol);
  const [period, setPeriod] = useState<PricePeriodKey>("1Y");

  const days = PERIODS.find((p) => p.key === period)!.days;

  const { rows, niftyShown, sectorShown } = useMemo(() => {
    if (!price?.stock.series.length) return { rows: [] as ChartRow[], niftyShown: false, sectorShown: false };
    const sWin = within(price.stock.series, days);
    if (sWin.length < 2) return { rows: [] as ChartRow[], niftyShown: false, sectorShown: false };
    const sBase = sWin[0].close;
    const startMs = new Date(sWin[0].date).getTime();
    // Honest rebasing: an index can only join the comparison if it has a close at-or-before
    // the window START (so all lines share the same 100-point). Otherwise its line is omitted.
    const niftyBase = price.benchmark ? closeOnOrBefore(price.benchmark.series, startMs) : null;
    const sectorBase = price.sector ? closeOnOrBefore(price.sector.series, startMs) : null;
    const rows: ChartRow[] = sWin.map((p) => {
      const dMs = new Date(p.date).getTime();
      const nClose = price.benchmark ? closeOnOrBefore(price.benchmark.series, dMs) : null;
      const secClose = price.sector ? closeOnOrBefore(price.sector.series, dMs) : null;
      return {
        date: p.date,
        stock: sBase > 0 ? Math.round((p.close / sBase) * 1000) / 10 : null,
        nifty: niftyBase && nClose ? Math.round((nClose / niftyBase) * 1000) / 10 : null,
        sector: sectorBase && secClose ? Math.round((secClose / sectorBase) * 1000) / 10 : null,
      };
    });
    return { rows, niftyShown: niftyBase != null, sectorShown: sectorBase != null };
  }, [price, days]);

  return (
    <Section id="overview-price" label="Price performance" icon={Icons.chartLine} accent="var(--p-mkt)">
      {isLoading ? (
        <LoadingBlock className="h-80" />
      ) : !price?.hasPrice ? (
        <HonestEmpty>Price data not available for this stock.</HonestEmpty>
      ) : (
        <div className="space-y-3">
          <Panel>
            {/* Period selector + legend */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink3">
                <LegendDot color={LINE.stock} label={symbol} />
                {niftyShown && <LegendDot color={LINE.nifty} label={price.benchmark?.label ?? "Nifty 50"} />}
                {sectorShown && <LegendDot color={LINE.sector} label={price.sector?.label ?? "Sector"} />}
              </div>
              <div className="flex gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`num rounded-md px-2.5 py-1 text-[11px] transition-colors ${
                      period === p.key
                        ? "border border-line2 bg-surface-2 text-ink"
                        : "border border-transparent text-ink3 hover:text-ink2"
                    }`}
                  >
                    {p.key}
                  </button>
                ))}
              </div>
            </div>

            {rows.length < 2 ? (
              <HonestEmpty>Not enough price history for this period.</HonestEmpty>
            ) : (
              <>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rows} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                      <CartesianGrid stroke="var(--line)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "var(--ink3)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: "var(--line)" }}
                        minTickGap={48}
                        tickFormatter={(d: string) => d.slice(2)}
                      />
                      <YAxis
                        tick={{ fill: "var(--ink3)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        domain={["auto", "auto"]}
                        width={42}
                        tickFormatter={(v: number) => `${v}`}
                      />
                      <ReferenceLine y={100} stroke="var(--line2)" strokeDasharray="3 3" />
                      <Tooltip
                        contentStyle={{
                          background: "var(--surface2)",
                          border: "1px solid var(--line2)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
                        formatter={(value: number, name: string) => {
                          const delta = value - 100;
                          const txt = `${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)}%`;
                          const label = name === "stock" ? symbol : name === "nifty" ? "Nifty 50" : price.sector?.label ?? "Sector";
                          return [txt, label];
                        }}
                      />
                      <Line type="monotone" dataKey="stock" stroke={LINE.stock} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                      {niftyShown && (
                        <Line type="monotone" dataKey="nifty" stroke={LINE.nifty} strokeWidth={1.4} strokeDasharray="4 3" dot={false} connectNulls isAnimationActive={false} />
                      )}
                      {sectorShown && (
                        <Line type="monotone" dataKey="sector" stroke={LINE.sector} strokeWidth={1.4} dot={false} connectNulls isAnimationActive={false} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="num mt-1 text-[10.5px] text-ink3">Indexed to 100 at period start.</p>
                {(!niftyShown || !sectorShown) && (
                  <p className="mt-1 text-[10.5px] text-ink3">
                    {!niftyShown && "Nifty"}
                    {!niftyShown && !sectorShown && " and "}
                    {!sectorShown && "sector-index"} comparison unavailable for this period (index history doesn&apos;t reach back this far).
                  </p>
                )}
              </>
            )}
          </Panel>

          {/* Return cards — stock return + same-window index return, factual */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {PERIODS.map((p) => {
              const s = price.stock.returns[p.returnKey];
              const n = price.benchmark?.returns[p.returnKey] ?? null;
              const sec = price.sector?.returns[p.returnKey] ?? null;
              return (
                <div key={p.key} className="rounded-xl border border-line bg-surface-2 p-3.5">
                  <div className="num text-[11px] text-ink3">{p.key}</div>
                  <div className="num mt-1 text-[17px] font-semibold" style={{ color: s == null ? "var(--ink3)" : toneColor(s) }}>
                    {s == null ? DASH : fmtSignedPct(s)}
                  </div>
                  <div className="num mt-1.5 space-y-0.5 text-[10.5px] text-ink3">
                    <div>Nifty {n == null ? DASH : fmtSignedPct(n)}</div>
                    {price.sector && <div className="truncate">{price.sector.label.replace(/^Nifty /, "")} {sec == null ? DASH : fmtSignedPct(sec)}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 52-week position — current-state facts */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-line bg-surface-2 p-3.5">
              <div className="text-[11px] text-ink3">From 52-week high</div>
              <div className="num mt-1 text-[16px] font-semibold text-ink">
                {price.current.pctFrom52WHigh != null ? fmtSignedPct(price.current.pctFrom52WHigh) : DASH}
              </div>
              <div className="num mt-0.5 text-[10.5px] text-ink3">high {fmtPrice(price.current.week52High)}</div>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-3.5">
              <div className="text-[11px] text-ink3">From 52-week low</div>
              <div className="num mt-1 text-[16px] font-semibold text-ink">
                {price.current.pctFrom52WLow != null ? fmtSignedPct(price.current.pctFrom52WLow) : DASH}
              </div>
              <div className="num mt-0.5 text-[10.5px] text-ink3">low {fmtPrice(price.current.week52Low)}</div>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="num">{label}</span>
    </span>
  );
}
