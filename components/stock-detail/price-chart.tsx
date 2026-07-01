"use client";

/**
 * PriceChart — the interactive price-chart engine for the Technical tab.
 *
 * Built on lightweight-charts v5, themed to Vytal's calm tokens. A VERDICT-FREE data
 * terminal: it draws the standard, universal-formula instruments bare and the user
 * interprets. There are NO colored verdict-zones, NO named crossovers, NO concluding
 * score or summary anywhere. RSI's 70/50/30 and MACD's 0 are NEUTRAL reference lines,
 * not buy/sell bands. Bollinger is presented as a volatility envelope, not a signal.
 *
 * Series-ref discipline (the foundation overlays attach to):
 *  · chart, main price series, volume, EMA(×3), Bollinger(×3), RSI, MACD(×3) each live
 *    in a ref. The MAIN series is the only one swapped on chart-type change — removed via
 *    its ref and rebuilt synchronously in one effect. Overlays (EMA + Bollinger) are
 *    re-fronted after a main swap so they stay above the candles. RSI/MACD live in their
 *    own panes, added/removed contiguously as they're toggled. Cleanup on unmount.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type Time,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type MouseEventParams,
} from "lightweight-charts";
import type { OhlcvBar } from "@/lib/api/hooks/use-stock-ohlcv";
import { ema, type LinePoint } from "@/lib/indicators/ema";
import { bollinger } from "@/lib/indicators/bollinger";
import { rsi as computeRsi } from "@/lib/indicators/rsi";
import { macd as computeMacd } from "@/lib/indicators/macd";

export type ChartType = "candlestick" | "line" | "area" | "bar";
export type Timeframe = "1M" | "3M" | "6M" | "1Y" | "MAX";

export const EMA_PERIODS = [50, 100, 200] as const;
export type EmaPeriod = (typeof EMA_PERIODS)[number];
export type EmaToggles = Record<EmaPeriod, boolean>;

/** Calm, distinct, NON-verdict token hues (blue/violet/gold) — reference lines, not signals. */
const EMA_VARS: Record<EmaPeriod, [string, string]> = {
  50: ["--p-found", "#5d92d8"],
  100: ["--p-mom", "#a085d8"],
  200: ["--p-mkt", "#d6a652"],
};

/** Same hues as `var(...)` — for toggle dots / legend swatches in the toolbar. */
export const EMA_LINE_VARS: Record<EmaPeriod, string> = {
  50: `var(${EMA_VARS[50][0]})`,
  100: `var(${EMA_VARS[100][0]})`,
  200: `var(${EMA_VARS[200][0]})`,
};

export const BOLLINGER_VAR = "var(--ink2)";
export const RSI_VAR = "var(--p-own)";
export const MACD_LINE_VAR = "var(--p-found)";
export const MACD_SIGNAL_VAR = "var(--p-mkt)";

/** Approx trading sessions per window (used to set the visible range; we already hold the full series). */
const TF_SESSIONS: Record<Timeframe, number> = {
  "1M": 22,
  "3M": 66,
  "6M": 132,
  "1Y": 252,
  MAX: Number.POSITIVE_INFINITY,
};

// region heights (px) → used both as pane stretch factors and to size the chart
const REGION = { price: 380, volume: 84, rsi: 132, macd: 132 };

function chartHeightFor(rsiOn: boolean, macdOn: boolean): number {
  return REGION.price + REGION.volume + (rsiOn ? REGION.rsi : 0) + (macdOn ? REGION.macd : 0);
}

// ── token resolution ──────────────────────────────────────────────────────────
function readVar(el: Element, name: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Normalise a lightweight-charts Time back to our 'YYYY-MM-DD' bar key. */
function timeToKey(t: Time): string {
  if (typeof t === "string") return t;
  if (typeof t === "number") return String(t);
  return `${t.year}-${pad(t.month)}-${pad(t.day)}`;
}

const fmtPrice = (v: number) =>
  v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtVol = (v: number) => {
  if (v >= 1e7) return `${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(2)}L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
};

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

interface MainData {
  candle: CandlestickData<Time>[];
  line: LineData<Time>[];
}
interface BollingerData {
  upper: LinePoint[];
  basis: LinePoint[];
  lower: LinePoint[];
}
interface MacdData {
  line: LinePoint[];
  signal: LinePoint[];
  hist: LinePoint[];
}
interface LegendState {
  bar: OhlcvBar;
  rsi: number | null;
  macd: { macd: number; signal: number; hist: number } | null;
}

export function PriceChart({
  bars,
  chartType,
  timeframe,
  emaToggles,
  bollinger: bollingerOn,
  rsi: rsiOn,
  macd: macdOn,
}: {
  bars: OhlcvBar[];
  chartType: ChartType;
  timeframe: Timeframe;
  emaToggles: EmaToggles;
  bollinger: boolean;
  rsi: boolean;
  macd: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const emaSeriesRef = useRef<Map<EmaPeriod, ISeriesApi<"Line">>>(new Map());
  const bollingerRef = useRef<{
    upper: ISeriesApi<"Line">;
    basis: ISeriesApi<"Line">;
    lower: ISeriesApi<"Line">;
  } | null>(null);
  const rsiRef = useRef<{ line: ISeriesApi<"Line"> } | null>(null);
  const macdRef = useRef<{
    macd: ISeriesApi<"Line">;
    signal: ISeriesApi<"Line">;
    hist: ISeriesApi<"Histogram">;
  } | null>(null);
  const paletteRef = useRef<{
    up: string;
    down: string;
    ema: Record<EmaPeriod, string>;
    band: string;
    rsi: string;
    macdLine: string;
    macdSignal: string;
    ref: string;
  } | null>(null);

  const barByTimeRef = useRef<Map<string, OhlcvBar>>(new Map());
  const rsiByTimeRef = useRef<Map<string, number>>(new Map());
  const macdByTimeRef = useRef<Map<string, { macd: number; signal: number; hist: number }>>(
    new Map(),
  );
  const lastBarRef = useRef<OhlcvBar | null>(null);
  const heightRef = useRef<number>(chartHeightFor(rsiOn, macdOn));

  const [legend, setLegend] = useState<LegendState | null>(null);
  const [chartHeight, setChartHeight] = useState<number>(chartHeightFor(rsiOn, macdOn));

  // ── derived data, mirrored into refs so handlers never depend on array identity ──
  const mainData = useMemo<MainData>(
    () => ({
      candle: bars.map((b) => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close })),
      line: bars.map((b) => ({ time: b.time, value: b.close })),
    }),
    [bars],
  );
  const emaData = useMemo<Record<EmaPeriod, LinePoint[]>>(
    () => ({ 50: ema(bars, 50), 100: ema(bars, 100), 200: ema(bars, 200) }),
    [bars],
  );
  const bollingerData = useMemo<BollingerData>(() => {
    const pts = bollinger(bars, 20, 2);
    return {
      upper: pts.map((p) => ({ time: p.time, value: p.upper })),
      basis: pts.map((p) => ({ time: p.time, value: p.basis })),
      lower: pts.map((p) => ({ time: p.time, value: p.lower })),
    };
  }, [bars]);
  const rsiData = useMemo<LinePoint[]>(() => computeRsi(bars, 14), [bars]);
  const macdData = useMemo<MacdData>(() => {
    const r = computeMacd(bars, 12, 26, 9);
    return { line: r.macdLine, signal: r.signalLine, hist: r.histogram };
  }, [bars]);

  // latest-value refs read by the imperative builders
  const dataRef = useRef(mainData);
  dataRef.current = mainData;
  const emaDataRef = useRef(emaData);
  emaDataRef.current = emaData;
  const bollingerDataRef = useRef(bollingerData);
  bollingerDataRef.current = bollingerData;
  const rsiDataRef = useRef(rsiData);
  rsiDataRef.current = rsiData;
  const macdDataRef = useRef(macdData);
  macdDataRef.current = macdData;

  const togglesRef = useRef({ ema: emaToggles, bollinger: bollingerOn, rsi: rsiOn, macd: macdOn });
  togglesRef.current = { ema: emaToggles, bollinger: bollingerOn, rsi: rsiOn, macd: macdOn };

  // ── helper · (re)build the main price series of the requested type ────────────
  function buildMainSeries(chart: IChartApi, type: ChartType) {
    const pal = paletteRef.current;
    if (!pal) return;
    if (mainSeriesRef.current) {
      chart.removeSeries(mainSeriesRef.current);
      mainSeriesRef.current = null;
    }
    let series: ISeriesApi<SeriesType>;
    if (type === "candlestick") {
      series = chart.addSeries(CandlestickSeries, {
        upColor: pal.up,
        downColor: pal.down,
        borderUpColor: pal.up,
        borderDownColor: pal.down,
        wickUpColor: pal.up,
        wickDownColor: pal.down,
      });
      series.setData(dataRef.current.candle);
    } else if (type === "bar") {
      series = chart.addSeries(BarSeries, { upColor: pal.up, downColor: pal.down, thinBars: false });
      series.setData(dataRef.current.candle);
    } else if (type === "line") {
      series = chart.addSeries(LineSeries, { color: pal.up, lineWidth: 2, priceLineVisible: false });
      series.setData(dataRef.current.line);
    } else {
      series = chart.addSeries(AreaSeries, {
        lineColor: pal.up,
        topColor: `${pal.up}40`,
        bottomColor: `${pal.up}00`,
        lineWidth: 2,
        priceLineVisible: false,
      });
      series.setData(dataRef.current.line);
    }
    mainSeriesRef.current = series;
  }

  // ── helper · re-create pane-0 overlays (Bollinger then EMA) ABOVE the main series ──
  function buildOverlays(chart: IChartApi) {
    const pal = paletteRef.current;
    if (!pal) return;
    const t = togglesRef.current;

    // tear down existing overlays
    for (const s of emaSeriesRef.current.values()) chart.removeSeries(s);
    emaSeriesRef.current.clear();
    if (bollingerRef.current) {
      chart.removeSeries(bollingerRef.current.upper);
      chart.removeSeries(bollingerRef.current.basis);
      chart.removeSeries(bollingerRef.current.lower);
      bollingerRef.current = null;
    }

    // Bollinger first (sits under the EMAs) — neutral grey volatility envelope
    const band = (style: LineStyle, alpha: string) => {
      const s = chart.addSeries(LineSeries, {
        color: `${pal.band}${alpha}`,
        lineWidth: 1,
        lineStyle: style,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        visible: t.bollinger,
      });
      return s;
    };
    const upper = band(LineStyle.Solid, "70");
    const basis = band(LineStyle.Dashed, "aa");
    const lower = band(LineStyle.Solid, "70");
    upper.setData(bollingerDataRef.current.upper);
    basis.setData(bollingerDataRef.current.basis);
    lower.setData(bollingerDataRef.current.lower);
    bollingerRef.current = { upper, basis, lower };

    // EMAs on top
    for (const period of EMA_PERIODS) {
      const line = chart.addSeries(LineSeries, {
        color: pal.ema[period],
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        visible: t.ema[period],
      });
      line.setData(emaDataRef.current[period]);
      emaSeriesRef.current.set(period, line);
    }
  }

  // ── helper · (re)build the RSI / MACD sub-panes at contiguous pane indices ─────
  function buildSubPanes(chart: IChartApi) {
    const pal = paletteRef.current;
    if (!pal) return;
    const t = togglesRef.current;

    // tear down existing sub-pane series
    if (rsiRef.current) {
      chart.removeSeries(rsiRef.current.line);
      rsiRef.current = null;
    }
    if (macdRef.current) {
      chart.removeSeries(macdRef.current.hist);
      chart.removeSeries(macdRef.current.macd);
      chart.removeSeries(macdRef.current.signal);
      macdRef.current = null;
    }
    // collapse any now-empty panes beyond price(0) + volume(1)
    const panes = chart.panes();
    for (let i = panes.length - 1; i >= 2; i--) {
      if (panes[i].getSeries().length === 0) chart.removePane(i);
    }

    let idx = 2;
    if (t.rsi) {
      const line = chart.addSeries(
        LineSeries,
        {
          color: pal.rsi,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
          // fixed 0–100 axis — never autoscaled
          autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
        },
        idx,
      );
      line.setData(rsiDataRef.current);
      // NEUTRAL reference lines — same faint colour, never green/red, never filled zones
      for (const lvl of [70, 50, 30]) {
        line.createPriceLine({
          price: lvl,
          color: pal.ref,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: String(lvl),
        });
      }
      rsiRef.current = { line };
      idx++;
    }
    if (t.macd) {
      const hist = chart.addSeries(
        HistogramSeries,
        { priceLineVisible: false, lastValueVisible: false },
        idx,
      );
      hist.setData(
        macdDataRef.current.hist.map((p) => ({
          time: p.time,
          value: p.value,
          color: p.value >= 0 ? `${pal.up}59` : `${pal.down}59`,
        })),
      );
      const macdLine = chart.addSeries(
        LineSeries,
        { color: pal.macdLine, lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
        idx,
      );
      macdLine.setData(macdDataRef.current.line);
      const signal = chart.addSeries(
        LineSeries,
        { color: pal.macdSignal, lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
        idx,
      );
      signal.setData(macdDataRef.current.signal);
      // neutral zero reference — never annotated, crossings shown but unnamed
      macdLine.createPriceLine({
        price: 0,
        color: pal.ref,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
      });
      macdRef.current = { macd: macdLine, signal, hist };
      idx++;
    }
    applyStretch(chart);
  }

  function applyStretch(chart: IChartApi) {
    const t = togglesRef.current;
    const panes = chart.panes();
    if (panes[0]) panes[0].setStretchFactor(REGION.price);
    if (panes[1]) panes[1].setStretchFactor(REGION.volume);
    let i = 2;
    if (t.rsi && panes[i]) panes[i++].setStretchFactor(REGION.rsi);
    if (t.macd && panes[i]) panes[i++].setStretchFactor(REGION.macd);
  }

  // ── effect 1 · create the chart once + volume + crosshair + resize ────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const root = document.documentElement;
    const ink2 = readVar(root, "--ink2", "#9b9c9c");
    const ink3 = readVar(root, "--ink3", "#62646c");
    const line = readVar(root, "--line", "rgba(255,255,255,0.06)");
    const surface3 = readVar(root, "--surface3", "#20242c");
    paletteRef.current = {
      up: readVar(root, "--rec", "#48ba7c"),
      down: readVar(root, "--crit", "#e2584d"),
      ema: {
        50: readVar(root, EMA_VARS[50][0], EMA_VARS[50][1]),
        100: readVar(root, EMA_VARS[100][0], EMA_VARS[100][1]),
        200: readVar(root, EMA_VARS[200][0], EMA_VARS[200][1]),
      },
      band: ink2,
      rsi: readVar(root, "--p-own", "#4fb6a4"),
      macdLine: readVar(root, "--p-found", "#5d92d8"),
      macdSignal: readVar(root, "--p-mkt", "#d6a652"),
      ref: ink3,
    };
    const fontFamily = getComputedStyle(document.body).fontFamily;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: heightRef.current,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: ink3,
        fontFamily,
        attributionLogo: false,
        fontSize: 11,
        panes: { separatorColor: line, separatorHoverColor: line },
      },
      grid: { vertLines: { color: line }, horzLines: { color: line } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: ink3, width: 1, style: LineStyle.Dotted, labelBackgroundColor: surface3 },
        horzLine: { color: ink3, width: 1, style: LineStyle.Dotted, labelBackgroundColor: surface3 },
      },
      rightPriceScale: { borderColor: line, textColor: ink2 },
      timeScale: { borderColor: line, rightOffset: 4, fixLeftEdge: true, fixRightEdge: true },
    });
    chartRef.current = chart;

    const volume = chart.addSeries(
      HistogramSeries,
      { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false },
      1,
    );
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.15, bottom: 0 } });
    volumeSeriesRef.current = volume;

    buildMainSeries(chart, chartType);
    buildOverlays(chart);
    buildSubPanes(chart);

    const onMove = (param: MouseEventParams) => {
      if (!param.time || !param.point || param.point.x < 0) {
        setLegend(defaultLegend());
        return;
      }
      const key = timeToKey(param.time);
      const bar = barByTimeRef.current.get(key) ?? lastBarRef.current;
      if (!bar) {
        setLegend(null);
        return;
      }
      setLegend({
        bar,
        rsi: rsiByTimeRef.current.get(key) ?? null,
        macd: macdByTimeRef.current.get(key) ?? null,
      });
    };
    chart.subscribeCrosshairMove(onMove);

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && chartRef.current) chartRef.current.resize(w, heightRef.current);
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      emaSeriesRef.current.clear();
      bollingerRef.current = null;
      rsiRef.current = null;
      macdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function defaultLegend(): LegendState | null {
    const bar = lastBarRef.current;
    if (!bar) return null;
    return {
      bar,
      rsi: rsiByTimeRef.current.get(bar.time) ?? null,
      macd: macdByTimeRef.current.get(bar.time) ?? null,
    };
  }

  // ── crosshair lookup maps + default legend (latest bar) ───────────────────────
  useEffect(() => {
    barByTimeRef.current = new Map(bars.map((b) => [b.time, b]));
    rsiByTimeRef.current = new Map(rsiData.map((p) => [p.time, p.value]));
    const sigByTime = new Map(macdData.signal.map((p) => [p.time, p.value]));
    const histByTime = new Map(macdData.hist.map((p) => [p.time, p.value]));
    macdByTimeRef.current = new Map(
      macdData.line.map((p) => [
        p.time,
        {
          macd: p.value,
          signal: sigByTime.get(p.time) ?? NaN,
          hist: histByTime.get(p.time) ?? NaN,
        },
      ]),
    );
    lastBarRef.current = bars.length ? bars[bars.length - 1] : null;
    setLegend(defaultLegend());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bars, rsiData, macdData]);

  // ── effect · swap the main series on chart-type change, re-front overlays ──────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    buildMainSeries(chart, chartType);
    buildOverlays(chart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType]);

  // ── effect · data changed (refetch) → re-apply to existing series ─────────────
  useEffect(() => {
    if (!mainSeriesRef.current) return;
    const isOhlc = chartType === "candlestick" || chartType === "bar";
    mainSeriesRef.current.setData(isOhlc ? mainData.candle : (mainData.line as never));
    for (const period of EMA_PERIODS) emaSeriesRef.current.get(period)?.setData(emaData[period]);
    if (bollingerRef.current) {
      bollingerRef.current.upper.setData(bollingerData.upper);
      bollingerRef.current.basis.setData(bollingerData.basis);
      bollingerRef.current.lower.setData(bollingerData.lower);
    }
    rsiRef.current?.line.setData(rsiData);
    if (macdRef.current) {
      const pal = paletteRef.current!;
      macdRef.current.hist.setData(
        macdData.hist.map((p) => ({
          time: p.time,
          value: p.value,
          color: p.value >= 0 ? `${pal.up}59` : `${pal.down}59`,
        })),
      );
      macdRef.current.macd.setData(macdData.line);
      macdRef.current.signal.setData(macdData.signal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainData, emaData, bollingerData, rsiData, macdData]);

  // ── effect · EMA show/hide — visibility only ──────────────────────────────────
  useEffect(() => {
    for (const period of EMA_PERIODS) {
      emaSeriesRef.current.get(period)?.applyOptions({ visible: emaToggles[period] });
    }
  }, [emaToggles]);

  // ── effect · Bollinger show/hide — visibility only ────────────────────────────
  useEffect(() => {
    if (!bollingerRef.current) return;
    bollingerRef.current.upper.applyOptions({ visible: bollingerOn });
    bollingerRef.current.basis.applyOptions({ visible: bollingerOn });
    bollingerRef.current.lower.applyOptions({ visible: bollingerOn });
  }, [bollingerOn]);

  // ── effect · RSI / MACD pane toggle → rebuild sub-panes + resize chart ─────────
  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;
    buildSubPanes(chart);
    const h = chartHeightFor(rsiOn, macdOn);
    heightRef.current = h;
    setChartHeight(h);
    chart.resize(container.clientWidth, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rsiOn, macdOn]);

  // ── effect · volume bars, faintly tinted by candle direction ──────────────────
  useEffect(() => {
    const vol = volumeSeriesRef.current;
    const pal = paletteRef.current;
    if (!vol || !pal) return;
    vol.setData(
      bars.map((b) => ({
        time: b.time,
        value: b.volume,
        color: b.close >= b.open ? `${pal.up}59` : `${pal.down}59`,
      })) as HistogramData<Time>[],
    );
  }, [bars]);

  // ── effect · timeframe → visible range (we hold the full series) ──────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || bars.length === 0) return;
    const n = TF_SESSIONS[timeframe];
    if (!Number.isFinite(n) || n >= bars.length) {
      chart.timeScale().fitContent();
    } else {
      chart.timeScale().setVisibleLogicalRange({ from: bars.length - n, to: bars.length - 0.5 });
    }
  }, [timeframe, bars]);

  const up = legend ? legend.bar.close >= legend.bar.open : true;

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full" style={{ height: chartHeight }} />

      {legend && (
        <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex max-w-[calc(100%-12px)] flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-line bg-surface-1/80 px-2 py-1.5 text-[10px] backdrop-blur-sm sm:left-3 sm:top-3 sm:max-w-none sm:gap-x-3 sm:px-3 sm:py-2 sm:text-[11px]">
          <span className="num text-ink2">{fmtDate(legend.bar.time)}</span>
          <Stat label="O" value={fmtPrice(legend.bar.open)} />
          <Stat label="H" value={fmtPrice(legend.bar.high)} />
          <Stat label="L" value={fmtPrice(legend.bar.low)} />
          <span className="flex items-center gap-1">
            <span className="text-ink3">C</span>
            <span
              className="num font-semibold"
              style={{ color: up ? "var(--success)" : "var(--danger)" }}
            >
              {fmtPrice(legend.bar.close)}
            </span>
          </span>
          <Stat label="Vol" value={fmtVol(legend.bar.volume)} />
          {rsiOn && legend.rsi != null && (
            <Stat label="RSI" value={legend.rsi.toFixed(1)} color={RSI_VAR} />
          )}
          {macdOn && legend.macd && Number.isFinite(legend.macd.macd) && (
            <span className="flex items-center gap-1">
              <span className="text-ink3">MACD</span>
              <span className="num font-medium" style={{ color: MACD_LINE_VAR }}>
                {legend.macd.macd.toFixed(2)}
              </span>
              {Number.isFinite(legend.macd.signal) && (
                <span className="num font-medium" style={{ color: MACD_SIGNAL_VAR }}>
                  / {legend.macd.signal.toFixed(2)}
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-ink3">{label}</span>
      <span className="num font-medium text-ink" style={color ? { color } : undefined}>
        {value}
      </span>
    </span>
  );
}
