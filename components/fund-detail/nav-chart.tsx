"use client";

/**
 * NavChart — a single-series NAV/price line for the fund detail page. Deliberately much
 * simpler than stock-detail/price-chart.tsx (no candles, no overlays, no sub-panes): one
 * AreaSeries, themed the same way (CSS-var token reads at mount), a crosshair tooltip legend.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type AreaData,
  type MouseEventParams,
} from "lightweight-charts";

export interface NavPoint {
  time: string; // YYYY-MM-DD
  value: number;
}

function readVar(el: Element, name: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

function fmtDateLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function NavChart({
  points,
  height = 260,
  valueLabel = "NAV",
  valuePrefix = "₹",
}: {
  points: NavPoint[];
  height?: number;
  valueLabel?: string;
  valuePrefix?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  const [legend, setLegend] = useState<NavPoint | null>(points.length ? points[points.length - 1] : null);

  const data = useMemo<AreaData<Time>[]>(() => points.map((p) => ({ time: p.time, value: p.value })), [points]);
  const byTimeRef = useRef<Map<string, NavPoint>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const root = document.documentElement;
    const primary = readVar(root, "--primary", "#4ea1e6");
    const ink2 = readVar(root, "--ink2", "#9b9c9c");
    const ink3 = readVar(root, "--ink3", "#62646c");
    const line = readVar(root, "--line", "rgba(255,255,255,0.06)");
    const surface3 = readVar(root, "--surface3", "#20242c");
    const fontFamily = getComputedStyle(document.body).fontFamily;

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: ink3,
        fontFamily,
        attributionLogo: false,
        fontSize: 11,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: line } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: ink3, width: 1, style: LineStyle.Dotted, labelBackgroundColor: surface3 },
        horzLine: { visible: false, labelVisible: false },
      },
      rightPriceScale: { borderColor: line, textColor: ink2 },
      timeScale: { borderColor: line, rightOffset: 4, fixLeftEdge: true, fixRightEdge: true },
    });
    chartRef.current = chart;

    const series = chart.addSeries(AreaSeries, {
      lineColor: primary,
      topColor: `color-mix(in oklch, ${primary} 44%, transparent)`,
      bottomColor: `color-mix(in oklch, ${primary} 6%, transparent)`,
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerRadius: 3.5,
    });
    series.setData(pointsRef.current.map((p) => ({ time: p.time, value: p.value })));
    seriesRef.current = series;
    chart.timeScale().fitContent();

    const onMove = (param: MouseEventParams) => {
      if (!param.time) {
        setLegend(pointsRef.current.length ? pointsRef.current[pointsRef.current.length - 1] : null);
        return;
      }
      const key = typeof param.time === "string" ? param.time : String(param.time);
      setLegend(byTimeRef.current.get(key) ?? null);
    };
    chart.subscribeCrosshairMove(onMove);

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && chartRef.current) chartRef.current.resize(w, height);
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    byTimeRef.current = new Map(points.map((p) => [p.time, p]));
    seriesRef.current?.setData(data);
    chartRef.current?.timeScale().fitContent();
    setLegend(points.length ? points[points.length - 1] : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, data]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full" style={{ height }} />
      {legend && (
        <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex items-baseline gap-2 rounded-lg border border-line bg-surface-1/85 px-2.5 py-1.5 text-[11px] backdrop-blur-sm">
          <span className="num text-ink3">{fmtDateLabel(legend.time)}</span>
          <span className="num font-semibold text-ink">
            {valuePrefix}
            {legend.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-ink3">{valueLabel}</span>
        </div>
      )}
    </div>
  );
}
