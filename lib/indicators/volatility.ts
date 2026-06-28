import type { OhlcvBar } from "@/lib/api/hooks/use-stock-ohlcv";
import { stdevArray } from "./core";

export interface VolatilityResult {
  period: number;
  annualized: boolean;
  /** as a percentage (e.g. 24.3 = 24.3%), or null when there isn't enough history */
  valuePct: number | null;
}

/**
 * Realized volatility — the sample standard deviation of the last `period` daily
 * simple returns, optionally annualized by ×√252. Returned as a percentage.
 * A measure of how much price has fluctuated; purely descriptive.
 */
export function realizedVolatility(
  bars: OhlcvBar[],
  period = 20,
  annualize = true,
): VolatilityResult {
  if (bars.length < period + 1) {
    return { period, annualized: annualize, valuePct: null };
  }
  const closes = bars.map((b) => b.close);
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push(closes[i] / closes[i - 1] - 1);
  }
  const sd = stdevArray(returns, period, 1); // sample stdev
  const last = sd[sd.length - 1];
  if (last == null) return { period, annualized: annualize, valuePct: null };

  const v = annualize ? last * Math.sqrt(252) : last;
  return { period, annualized: annualize, valuePct: v * 100 };
}
