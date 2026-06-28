import type { OhlcvBar } from "@/lib/api/hooks/use-stock-ohlcv";
import type { LinePoint } from "./core";

/**
 * Relative Strength Index — Wilder's RSI(14).
 *
 * Seed avgGain/avgLoss = simple average of the first `period` gains/losses, then
 * Wilder smoothing: avg = (avg·(period−1) + current)/period. RS = avgGain/avgLoss,
 * RSI = 100 − 100/(1+RS) (RSI = 100 when avgLoss is 0). 0–100. Starts after warm-up.
 */
export function rsi(bars: OhlcvBar[], period = 14): LinePoint[] {
  const n = bars.length;
  if (n < period + 1) return [];

  const c = bars.map((b) => b.close);
  const out: LinePoint[] = [];

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = c[i] - c[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out.push({
    time: bars[period].time,
    value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss),
  });

  for (let i = period + 1; i < n; i++) {
    const d = c[i] - c[i - 1];
    const g = d >= 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out.push({
      time: bars[i].time,
      value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss),
    });
  }
  return out;
}
