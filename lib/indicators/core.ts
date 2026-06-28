/** A single point on an overlay/indicator line, in lightweight-charts' shape. */
export interface LinePoint {
  /** business-day string 'YYYY-MM-DD' */
  time: string;
  value: number;
}

/**
 * Array-based EMA primitive — the single source of truth for exponential averaging.
 * Returns an array aligned to `values`, `null` during the warm-up window. Seeded with
 * the SMA of the first `period` values, then EMA[i] = v[i]*k + EMA[i-1]*(1-k), k=2/(period+1).
 */
export function emaArray(values: number[], period: number): (number | null)[] {
  const n = values.length;
  const out: (number | null)[] = new Array(n).fill(null);
  if (period <= 0 || n < period) return out;

  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let prev = sum / period;
  out[period - 1] = prev;
  for (let i = period; i < n; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Trailing simple moving average, aligned to `values`, `null` during warm-up. */
export function smaArray(values: number[], period: number): (number | null)[] {
  const n = values.length;
  const out: (number | null)[] = new Array(n).fill(null);
  if (period <= 0 || n < period) return out;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/**
 * Trailing standard deviation over `period`, aligned to `values`, `null` during warm-up.
 * `ddof` = delta degrees of freedom: 0 → population (Bollinger convention), 1 → sample.
 */
export function stdevArray(
  values: number[],
  period: number,
  ddof = 0,
): (number | null)[] {
  const n = values.length;
  const out: (number | null)[] = new Array(n).fill(null);
  if (period <= 0 || n < period || period - ddof <= 0) return out;

  for (let i = period - 1; i < n; i++) {
    let mean = 0;
    for (let j = i - period + 1; j <= i; j++) mean += values[j];
    mean /= period;
    let v = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = values[j] - mean;
      v += d * d;
    }
    out[i] = Math.sqrt(v / (period - ddof));
  }
  return out;
}
