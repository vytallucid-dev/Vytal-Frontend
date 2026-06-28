import type { OhlcvBar } from "@/lib/api/hooks/use-stock-ohlcv";
import { emaArray } from "./core";
import type { LinePoint } from "./core";

export interface MacdResult {
  /** EMA(fast) − EMA(slow) of close */
  macdLine: LinePoint[];
  /** EMA(signalPeriod) of the MACD line */
  signalLine: LinePoint[];
  /** MACD − signal */
  histogram: LinePoint[];
}

/**
 * Moving Average Convergence Divergence — MACD(12/26/9).
 *
 * MACD line = EMA(fast) − EMA(slow) of close. Signal = EMA(signalPeriod) of the MACD
 * line. Histogram = MACD − signal. Each series starts where it is first defined; no
 * warm-up is faked. Crossings are computable from the data — we never name them.
 */
export function macd(
  bars: OhlcvBar[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MacdResult {
  const closes = bars.map((b) => b.close);
  const emaFast = emaArray(closes, fast);
  const emaSlow = emaArray(closes, slow);

  const macdLine: LinePoint[] = [];
  for (let i = 0; i < bars.length; i++) {
    const f = emaFast[i];
    const s = emaSlow[i];
    if (f == null || s == null) continue;
    macdLine.push({ time: bars[i].time, value: f - s });
  }

  // signal = EMA(signalPeriod) over the compacted MACD line
  const sig = emaArray(
    macdLine.map((p) => p.value),
    signalPeriod,
  );
  const signalLine: LinePoint[] = [];
  const histogram: LinePoint[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (sig[i] == null) continue;
    signalLine.push({ time: macdLine[i].time, value: sig[i] as number });
    histogram.push({
      time: macdLine[i].time,
      value: macdLine[i].value - (sig[i] as number),
    });
  }

  return { macdLine, signalLine, histogram };
}
