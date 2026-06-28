import type { OhlcvBar } from "@/lib/api/hooks/use-stock-ohlcv";
import { emaArray } from "./core";
import type { LinePoint } from "./core";

export type { LinePoint } from "./core";

/**
 * Exponential moving average of close over `period` sessions.
 *
 * Standard EMA (k = 2/(period+1), SMA-seeded) — see {@link emaArray}. Returns points
 * only from the first index where the EMA is defined; the warm-up window has no value,
 * so we don't draw a flat fake line.
 */
export function ema(bars: OhlcvBar[], period: number): LinePoint[] {
  const arr = emaArray(
    bars.map((b) => b.close),
    period,
  );
  const out: LinePoint[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (arr[i] != null) out.push({ time: bars[i].time, value: arr[i] as number });
  }
  return out;
}
