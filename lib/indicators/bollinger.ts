import type { OhlcvBar } from "@/lib/api/hooks/use-stock-ohlcv";
import { smaArray, stdevArray } from "./core";

export interface BollingerPoint {
  time: string;
  upper: number;
  basis: number;
  lower: number;
}

/**
 * Bollinger Bands — a VOLATILITY ENVELOPE around price (not a buy/sell signal).
 *
 * basis = SMA(period) of close; upper = basis + mult·σ; lower = basis − mult·σ,
 * where σ is the population standard deviation of the last `period` closes. Starts
 * after the `period`-bar warm-up — no flat fake line.
 */
export function bollinger(
  bars: OhlcvBar[],
  period = 20,
  mult = 2,
): BollingerPoint[] {
  const closes = bars.map((b) => b.close);
  const basis = smaArray(closes, period);
  const sd = stdevArray(closes, period, 0);

  const out: BollingerPoint[] = [];
  for (let i = 0; i < bars.length; i++) {
    const b = basis[i];
    const s = sd[i];
    if (b == null || s == null) continue;
    out.push({
      time: bars[i].time,
      upper: b + mult * s,
      basis: b,
      lower: b - mult * s,
    });
  }
  return out;
}
