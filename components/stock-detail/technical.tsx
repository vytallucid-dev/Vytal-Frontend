"use client";

/**
 * Technical tab — "Price & Indicators".
 *
 * A VERDICT-FREE data terminal: it shows the standard, universal-formula instruments
 * bare and the user interprets. No buy/sell language, no "trend is bullish", no targets,
 * no score, no named crossovers, no concluding summary — the tab renders instruments;
 * the user concludes. Reference lines (RSI 70/50/30, MACD 0) are NEUTRAL, never verdict
 * zones. The info helpers DEFINE each indicator universally; they never read this stock's
 * value or say what a level "means".
 *
 * Chart engine + series-ref discipline lives in ./price-chart; indicator math in
 * @/lib/indicators. Dropped (bucket-C, would be fabricated): delivery %, impact cost,
 * and everything from the old mock (technical score, support/resistance, named patterns,
 * signal checklists, targets/stops, per-timeframe outlook).
 */

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons, type Icon } from "@/lib/icons";
import { QueryError } from "@/components/ui/query-error";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Panel, SectionEyebrow, tint } from "./health/shared";
import { WhereNext } from "./where-next";
import { useStockOhlcv } from "@/lib/api/hooks/use-stock-ohlcv";
import { priceMetrics } from "@/lib/indicators/metrics";
import {
  PriceChart,
  EMA_PERIODS,
  EMA_LINE_VARS,
  BOLLINGER_VAR,
  RSI_VAR,
  MACD_LINE_VAR,
  type ChartType,
  type Timeframe,
  type EmaToggles,
  type EmaPeriod,
} from "./price-chart";

const ACCENT = "var(--p-mkt)";
const DASH = "—";

// ── universal, definitional help — NEVER references a live value or what a level "means" ──
const HELP = {
  ema: "Exponential moving average — the average closing price over N sessions, weighting recent prices more heavily (multiplier 2/(N+1)). Smooths price to show its direction over that window.",
  bollinger:
    "Bollinger Bands — a 20-session simple moving average (the basis) with an upper and lower band at ±2 standard deviations of the last 20 closes. The bands widen and narrow with volatility; it is a volatility envelope.",
  rsi: "Relative Strength Index (14) — a 0–100 measure of the speed of recent price change, from average gains versus average losses over 14 sessions (Wilder's smoothing). 70, 50 and 30 are conventional reference levels.",
  macd: "MACD (12/26/9) — the MACD line is EMA(12) minus EMA(26) of close; the signal line is the EMA(9) of the MACD line; the histogram is MACD minus signal. It tracks the relationship between two moving averages.",
  week52:
    "The highest high and lowest low over the trailing 52 weeks, and where the current price sits within that range (0% = at the low, 100% = at the high).",
  emaDistance: "The percent difference between the current price and each EMA: (price − EMA) ÷ EMA.",
  volatility:
    "Realized volatility — the sample standard deviation of the last 20 daily returns, annualized by ×√252. A measure of how much the price has fluctuated.",
  volume:
    "Shares traded in the latest session, the 20-session average, and the latest versus that average. Value traded is the rupee turnover (₹ Cr) when reported.",
} as const;

const CHART_TYPES: { value: ChartType; label: string; icon: Icon }[] = [
  { value: "candlestick", label: "Candles", icon: Icons.chartBar },
  { value: "line", label: "Line", icon: Icons.chartLine },
  { value: "area", label: "Area", icon: Icons.graph },
  { value: "bar", label: "Bar", icon: Icons.stack },
];

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "MAX", label: "MAX" },
];

// ── formatters — every number wears .num at the render site ───────────────────
const fmtPrice = (v: number | null) =>
  v == null ? DASH : v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number | null, dp = 1) => (v == null ? DASH : `${v.toFixed(dp)}%`);
const fmtSignedPct = (v: number | null, dp = 1) =>
  v == null ? DASH : `${v > 0 ? "+" : ""}${v.toFixed(dp)}%`;
const fmtInt = (v: number | null) => (v == null ? DASH : Math.round(v).toLocaleString("en-IN"));
const fmtCr = (v: number | null) =>
  v == null ? "N/A" : `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;

/** the neutral up/down convention — a fact, never a buy/sell cue */
const toneColor = (v: number | null) =>
  v == null || v === 0 ? "var(--ink2)" : v > 0 ? "var(--success)" : "var(--danger)";
const clamp = (v: number) => Math.max(0, Math.min(100, v));

export default function Technical() {
  const params = useParams();
  const symbol = ((params?.symbol as string) ?? "").toUpperCase();

  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [timeframe, setTimeframe] = useState<Timeframe>("6M");
  const [emaToggles, setEmaToggles] = useState<EmaToggles>({ 50: false, 100: false, 200: false });
  const [bollingerOn, setBollingerOn] = useState(false);
  const [rsiOn, setRsiOn] = useState(true);
  const [macdOn, setMacdOn] = useState(false);

  const { data, isLoading, isError, error, refetch } = useStockOhlcv(symbol);
  const metrics = useMemo(() => priceMetrics(data?.bars ?? []), [data]);

  return (
    <div>
      <SectionEyebrow
        label="Price chart"
        icon={Icons.chartLine}
        accent={ACCENT}
        pill={data?.bars.length ? `${data.bars.length} sessions` : undefined}
      />

      {isLoading ? (
        <ChartSkeleton />
      ) : isError ? (
        <QueryError
          message={(error as Error)?.message ?? "Failed to load price history"}
          onRetry={() => refetch()}
        />
      ) : !data || data.bars.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Panel className="p-4">
            {/* row 1 · chart type + timeframe */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Segmented<ChartType>
                value={chartType}
                onChange={setChartType}
                options={CHART_TYPES.map((c) => ({ value: c.value, label: c.label, icon: c.icon }))}
              />
              <Segmented<Timeframe> value={timeframe} onChange={setTimeframe} options={TIMEFRAMES} />
            </div>

            {/* row 2 · overlays */}
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="eyebrow mr-1">Overlays</span>
              {EMA_PERIODS.map((p) => (
                <ToggleChip
                  key={p}
                  label={`EMA ${p}`}
                  on={emaToggles[p]}
                  dot={EMA_LINE_VARS[p]}
                  onClick={() => setEmaToggles((prev) => ({ ...prev, [p]: !prev[p] }))}
                />
              ))}
              <InfoTip text={HELP.ema} />
              <ToggleChip
                label="Bollinger"
                on={bollingerOn}
                dot={BOLLINGER_VAR}
                onClick={() => setBollingerOn((v) => !v)}
              />
              <InfoTip text={HELP.bollinger} />
            </div>

            {/* row 3 · sub-panes */}
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="eyebrow mr-1">Panes</span>
              <ToggleChip label="RSI (14)" on={rsiOn} dot={RSI_VAR} onClick={() => setRsiOn((v) => !v)} />
              <InfoTip text={HELP.rsi} />
              <ToggleChip
                label="MACD (12/26/9)"
                on={macdOn}
                dot={MACD_LINE_VAR}
                onClick={() => setMacdOn((v) => !v)}
              />
              <InfoTip text={HELP.macd} />
            </div>

            <PriceChart
              bars={data.bars}
              chartType={chartType}
              timeframe={timeframe}
              emaToggles={emaToggles}
              bollinger={bollingerOn}
              rsi={rsiOn}
              macd={macdOn}
            />
          </Panel>

          {/* ── factual data panels ── */}
          <SectionEyebrow label="Price metrics" icon={Icons.chartBar} accent={ACCENT} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="52-week position" help={HELP.week52}>
              <div className="num text-2xl font-semibold text-ink">
                {fmtPct(metrics.week52PositionPct)}
              </div>
              <div className="mt-0.5 text-[11px] text-ink2">of its 52-week range</div>
              <div className="relative mt-3 h-1.5 rounded-full bg-surface-3">
                {metrics.week52PositionPct != null && (
                  <div
                    className="absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
                    style={{ left: `${clamp(metrics.week52PositionPct)}%` }}
                  />
                )}
              </div>
              <div className="mt-2 flex justify-between text-[11px]">
                <span className="num text-ink2">L {fmtPrice(metrics.week52Low)}</span>
                <span className="num text-ink2">H {fmtPrice(metrics.week52High)}</span>
              </div>
            </MetricCard>

            <MetricCard title="Distance from EMA" help={HELP.emaDistance}>
              <div className="flex flex-col gap-2.5">
                {metrics.emaDistance.map((d) => (
                  <div key={d.period} className="flex items-center justify-between text-[12.5px]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-1 w-3.5 rounded-full"
                        style={{ background: EMA_LINE_VARS[d.period as EmaPeriod] }}
                      />
                      <span className="text-ink2">EMA {d.period}</span>
                    </span>
                    <span className="num font-medium" style={{ color: toneColor(d.distancePct) }}>
                      {fmtSignedPct(d.distancePct)}
                    </span>
                  </div>
                ))}
              </div>
            </MetricCard>

            <MetricCard title="Realized volatility" help={HELP.volatility}>
              <div className="num text-2xl font-semibold text-ink">
                {fmtPct(metrics.volatility.valuePct)}
              </div>
              <div className="mt-0.5 text-[11px] text-ink2">
                {metrics.volatility.period}-day · annualized (×√252)
              </div>
            </MetricCard>

            <MetricCard title="Volume" help={HELP.volume}>
              <div className="flex flex-col gap-2 text-[12.5px]">
                <Row label="Latest" value={fmtInt(metrics.latestVolume)} />
                <Row label="20-day avg" value={fmtInt(metrics.avgVolume20)} />
                <Row
                  label="vs avg"
                  value={fmtSignedPct(metrics.volumeVsAvgPct)}
                  color={toneColor(metrics.volumeVsAvgPct)}
                />
                <Row label="Value traded" value={fmtCr(metrics.tradedValue)} />
              </div>
            </MetricCard>
          </div>
        </>
      )}

      <div className="mt-8">
        <WhereNext symbol={symbol} exclude={["technical"]} />
      </div>
    </div>
  );
}

// ── factual metric card ───────────────────────────────────────────────────────
function MetricCard({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="eyebrow">{title}</span>
        {help && <InfoTip text={help} />}
      </div>
      {children}
    </Panel>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink2">{label}</span>
      <span className="num font-medium text-ink" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}

// ── definitional info affordance — static, universal, never reads a live value ──
function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label="What is this?"
          className="grid h-4 w-4 cursor-help place-items-center rounded-full text-ink3 transition-colors hover:text-ink2"
        >
          <Icons.info weight="regular" className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-[11px] leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}

// ── toggle chip — overlay/pane on-off with a colour swatch (doubles as legend) ──
function ToggleChip({
  label,
  on,
  onClick,
  dot,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
        on ? "border-line2 text-ink" : "border-line text-ink3 hover:text-ink2",
      )}
    >
      {dot && (
        <span
          className="h-1 w-3.5 rounded-full"
          style={{ background: on ? dot : "var(--line3)" }}
        />
      )}
      {label}
    </button>
  );
}

// ── loading skeleton — mirrors the real chart's footprint (no layout jump) ──────
function ChartSkeleton() {
  return (
    <Panel className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="shimmer h-8 w-64 rounded-lg bg-surface-2" />
        <div className="shimmer h-8 w-44 rounded-lg bg-surface-2" />
      </div>
      <div className="mb-2 flex items-center gap-1.5">
        <div className="shimmer h-7 w-24 rounded-md bg-surface-2" />
        <div className="shimmer h-7 w-20 rounded-md bg-surface-2" />
        <div className="shimmer h-7 w-20 rounded-md bg-surface-2" />
        <div className="shimmer h-7 w-24 rounded-md bg-surface-2" />
      </div>
      <div className="mb-3 flex items-center gap-1.5">
        <div className="shimmer h-7 w-24 rounded-md bg-surface-2" />
        <div className="shimmer h-7 w-32 rounded-md bg-surface-2" />
      </div>
      <div className="shimmer h-[596px] w-full rounded-lg bg-surface-2" />
    </Panel>
  );
}

// ── honest-empty — no price history for this stock ────────────────────────────
function EmptyState() {
  return (
    <Panel>
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-xl border" style={tint(ACCENT)}>
          <Icons.chartLine weight="duotone" className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-ink">No price history yet</p>
          <p className="text-[13px] text-ink2">
            We don&apos;t have daily price data for this stock to chart.
          </p>
        </div>
      </div>
    </Panel>
  );
}

// ── segmented control — matches the Results/Events toolbar pattern ────────────
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: Icon }[];
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-1 p-0.5">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              on ? "text-ink" : "text-ink3 hover:text-ink",
            )}
            style={on ? tint(ACCENT) : undefined}
          >
            {o.icon && <o.icon weight={on ? "fill" : "regular"} className="h-3.5 w-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
