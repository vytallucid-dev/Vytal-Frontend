// PG Ownership tab — pure derivations (no JSX). Turns each member's per-stock
// OwnershipSeriesView into the standings row + the field-flows substrate. Every value
// is real-or-null; nothing is fabricated.

import type { OwnershipSeriesView, OwnershipHolding } from "@/types/research-tools";
import type { StandingsRow } from "@/components/peer-group/standings-table";

/** One member's ownership standings row. promoter/fii/dii/public are the latest split;
 *  instDeltaQoq is the most-recent quarter-on-quarter change in institutional (FII+DII)
 *  share. windowDelta is institutional change across the whole loaded window. */
export interface OwnershipRow extends StandingsRow {
  promoter: number | null;
  fii: number | null;
  dii: number | null;
  /** non-promoter, non-institutional float (retail). promoter+fii+dii+public ≈ 100. */
  public: number | null;
  /** institutional (FII+DII) share now — the flows substrate. */
  instNow: number | null;
  /** institutional change vs the immediately prior quarter (pp). */
  instDeltaQoq: number | null;
  /** institutional change across the loaded window, earliest→latest (pp). */
  windowDelta: number | null;
  /** as-on date of the latest holding split (for honest labelling). */
  asOnDate: string | null;
}

/** Sum of the non-null institutional legs; null only when BOTH are null. */
function instShare(h: OwnershipHolding | null): number | null {
  if (!h) return null;
  const legs = [h.fiiPct, h.diiPct].filter((v): v is number => v != null);
  return legs.length ? legs.reduce((s, v) => s + v, 0) : null;
}

/** Build a standings row from a member's ownership view. When the member has no holding
 *  data, every metric is null (the row renders honest "—"), identity still present. */
export function deriveOwnershipRow(
  symbol: string,
  name: string,
  view: OwnershipSeriesView | null,
  pending: boolean,
): OwnershipRow {
  const base: OwnershipRow = {
    symbol,
    name,
    pending,
    promoter: null,
    fii: null,
    dii: null,
    public: null,
    instNow: null,
    instDeltaQoq: null,
    windowDelta: null,
    asOnDate: null,
  };
  if (!view) return base;

  // series is oldest→newest; keep only points that carry a real holding split.
  const withHolding = view.series.filter((p) => p.holding != null);
  if (withHolding.length === 0) return base;

  const latest = withHolding[withHolding.length - 1];
  const prior = withHolding.length >= 2 ? withHolding[withHolding.length - 2] : null;
  const earliest = withHolding[0];
  const h = latest.holding!;

  const instNow = instShare(h);
  const instPrior = prior ? instShare(prior.holding) : null;
  const instEarliest = instShare(earliest.holding);

  return {
    ...base,
    promoter: h.promoterPct,
    fii: h.fiiPct,
    dii: h.diiPct,
    public: h.retailPct, // retail IS the public float; `others` duplicates it in the source
    instNow,
    instDeltaQoq:
      instNow != null && instPrior != null ? round1(instNow - instPrior) : null,
    windowDelta:
      instNow != null && instEarliest != null && withHolding.length >= 2
        ? round1(instNow - instEarliest)
        : null,
    asOnDate: h.asOnDate,
  };
}

export const round1 = (x: number) => Math.round(x * 10) / 10;

/** Field-level institutional aggregate — averages across members that HAVE data.
 *  Used for the calm "where the field sits" line above the flows ranking. */
export function fieldAverages(rows: OwnershipRow[]): {
  avgFii: number | null;
  avgDii: number | null;
  withData: number;
} {
  const fiis = rows.map((r) => r.fii).filter((v): v is number => v != null);
  const diis = rows.map((r) => r.dii).filter((v): v is number => v != null);
  const avg = (xs: number[]) =>
    xs.length ? round1(xs.reduce((s, v) => s + v, 0) / xs.length) : null;
  return {
    avgFii: avg(fiis),
    avgDii: avg(diis),
    withData: rows.filter((r) => r.fii != null || r.dii != null).length,
  };
}
