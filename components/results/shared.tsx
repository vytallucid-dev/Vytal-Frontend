"use client";

/**
 * Shared primitives for the Results viewer tabs — re-exports the calm Health/Overview
 * vocabulary (Panel, SectionEyebrow, tint, MiniSpark, toneColor, fmt*) so the viewer
 * reads as one product with the rest of the app, plus a few result-specific helpers.
 * Tokens only; no glass/aurora/gradient. Every helper is DISPLAY/honest — no verdicts.
 */

import { toneColor, fmtSignedPct, fmtPct, fmtMarketCap, DASH } from "@/components/stock-detail/overview/shared";

export { toneColor, fmtSignedPct, fmtPct, fmtMarketCap, DASH };
export { Panel, SectionEyebrow, tint, MiniSpark, sparkSeries, shortPeriod } from "@/components/stock-detail/health/shared";
export { Chip, HonestEmpty } from "@/components/stock-detail/overview/shared";

/** ₹ Cr (with L Cr rollover) or honest dash. */
export const fmtCr = (v: number | null | undefined): string => (v == null ? DASH : fmtMarketCap(v));

/** Guarded % change cur vs base (base = denominator). null on missing/zero base. */
export function pctChange(cur: number | null | undefined, base: number | null | undefined): number | null {
  if (cur == null || base == null || base === 0) return null;
  return ((cur - base) / Math.abs(base)) * 100;
}

/** Basis-point delta between two PERCENT values (cur − base) × 100. */
export function bps(cur: number | null | undefined, base: number | null | undefined): number | null {
  if (cur == null || base == null) return null;
  return Math.round((cur - base) * 100);
}

/** Signed "+120 bps" / "−40 bps" / dash. */
export function fmtBps(v: number | null): string {
  if (v == null) return DASH;
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)} bps`;
}

/** A labelled headline-number tile — value (.num) + optional signed YoY / QoQ rows. */
export function MetricTile({
  label,
  value,
  yoy,
  qoq,
}: {
  label: string;
  value: string;
  yoy?: number | null;
  qoq?: number | null;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="truncate text-[11px] text-ink3">{label}</div>
      <div className="num mt-1 text-[14px] sm:text-[18px] font-semibold text-ink">{value}</div>
      {(yoy !== undefined || qoq !== undefined) && (
        <div className="mt-1.5 flex flex-col gap-0.5">
          {yoy !== undefined && (
            <span className="num text-[11px]" style={{ color: toneColor(yoy) }}>
              {fmtSignedPct(yoy)} <span className="text-ink3">YoY</span>
            </span>
          )}
          {qoq !== undefined && (
            <span className="num text-[11px]" style={{ color: toneColor(qoq) }}>
              {fmtSignedPct(qoq)} <span className="text-ink3">QoQ</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
