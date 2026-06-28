import type { OhlcvBar } from "@/lib/api/hooks/use-stock-ohlcv";
import { ema } from "./ema";
import { realizedVolatility, type VolatilityResult } from "./volatility";

export interface EmaDistance {
  period: number;
  ema: number | null;
  /** (current − EMA) / EMA, as a percentage */
  distancePct: number | null;
}

export interface PriceMetrics {
  current: number | null;
  week52High: number | null;
  week52Low: number | null;
  /** 0 = at the 52-week low, 100 = at the 52-week high */
  week52PositionPct: number | null;
  emaDistance: EmaDistance[];
  volatility: VolatilityResult;
  latestVolume: number | null;
  avgVolume20: number | null;
  /** latest volume vs the 20-session average, as a percentage */
  volumeVsAvgPct: number | null;
  /** ₹ Cr turnover for the latest session, or null when not reported */
  tradedValue: number | null;
}

const EMA_PERIODS = [50, 100, 200];
const WEEK52_SESSIONS = 252;
const VOL_WINDOW = 20;

/** All factual, non-predictive price metrics derivable from the OHLCV we already hold. */
export function priceMetrics(bars: OhlcvBar[]): PriceMetrics {
  const n = bars.length;
  const empty: PriceMetrics = {
    current: null,
    week52High: null,
    week52Low: null,
    week52PositionPct: null,
    emaDistance: EMA_PERIODS.map((p) => ({ period: p, ema: null, distancePct: null })),
    volatility: realizedVolatility(bars, VOL_WINDOW, true),
    latestVolume: null,
    avgVolume20: null,
    volumeVsAvgPct: null,
    tradedValue: null,
  };
  if (n === 0) return empty;

  const last = bars[n - 1];
  const current = last.close;

  const window = bars.slice(Math.max(0, n - WEEK52_SESSIONS));
  const week52High = Math.max(...window.map((b) => b.high));
  const week52Low = Math.min(...window.map((b) => b.low));
  const range = week52High - week52Low;
  const week52PositionPct = range > 0 ? ((current - week52Low) / range) * 100 : null;

  const emaDistance: EmaDistance[] = EMA_PERIODS.map((p) => {
    const series = ema(bars, p);
    const e = series.length ? series[series.length - 1].value : null;
    return {
      period: p,
      ema: e,
      distancePct: e != null && e !== 0 ? ((current - e) / e) * 100 : null,
    };
  });

  const avgVolume20 =
    n >= VOL_WINDOW
      ? bars.slice(n - VOL_WINDOW).reduce((a, b) => a + b.volume, 0) / VOL_WINDOW
      : null;
  const volumeVsAvgPct =
    avgVolume20 && avgVolume20 > 0 ? ((last.volume - avgVolume20) / avgVolume20) * 100 : null;

  return {
    current,
    week52High,
    week52Low,
    week52PositionPct,
    emaDistance,
    volatility: realizedVolatility(bars, VOL_WINDOW, true),
    latestVolume: last.volume,
    avgVolume20,
    volumeVsAvgPct,
    tradedValue: last.tradedValue,
  };
}
