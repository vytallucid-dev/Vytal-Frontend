"use client";

/**
 * Landing-scan card — one "most-interesting journey" per card. Translates the
 * prototype's `.pcard` onto the real PG-index card pattern (Card · lift · band
 * tokens) and a mini composite sparkline from the scan's `spark` series.
 */

import { Card } from "@/components/ui/card";
import { BAND_META } from "@/components/stock-detail/health/shared";
import { healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StockScanItem } from "@/types/research-tools";
import { MARKER_TONE } from "./trajectory-data";

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return <div className="h-[44px] rounded-md bg-surface-2" />;
  }
  const w = 240;
  const h = 44;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xo = (i: number) => pad + (i * (w - 2 * pad)) / (values.length - 1);
  const yo = (v: number) => pad + (1 - (v - min) / span) * (h - 2 * pad);
  const d = values.map((v, i) => `${xo(i).toFixed(1)},${yo(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" preserveAspectRatio="none">
      <polyline points={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export function TrajectoryScanCard({
  item,
  onSelect,
}: {
  item: StockScanItem;
  onSelect: (symbol: string) => void;
}) {
  const band = BAND_META[item.band];
  const tone = item.marker ? MARKER_TONE[item.marker] : { word: "Building", color: "var(--ink3)" };
  const sparkColor =
    item.marker === "improving"
      ? "var(--rec)"
      : item.marker === "deteriorating"
        ? "var(--high)"
        : "var(--ctx)";

  return (
    <button onClick={() => onSelect(item.symbol)} className="block w-full text-left">
      <Card className="lift h-full gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="num text-[13.5px] font-medium text-ink">{item.symbol}</span>
          <span
            className="rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{
              color: tone.color,
              background: `color-mix(in oklab, ${tone.color} 14%, transparent)`,
            }}
          >
            {tone.word}
          </span>
        </div>

        <Sparkline values={item.spark} color={sparkColor} />

        <div className="flex items-center justify-between gap-2">
          <span className="num text-[10.5px] text-ink3">
            now · <span style={{ color: healthColorVar(item.composite) }}>{Math.round(item.composite)}</span>{" "}
            <span className={cn(band.text)}>{band.label}</span>
          </span>
          {item.delta != null && (
            <span
              className="num text-[10.5px]"
              style={{ color: item.delta < 0 ? "var(--high)" : item.delta > 0 ? "var(--rec)" : "var(--ink3)" }}
            >
              {item.delta > 0 ? "▲" : item.delta < 0 ? "▼" : "•"} {Math.abs(item.delta).toFixed(1)}
            </span>
          )}
        </div>
      </Card>
    </button>
  );
}
