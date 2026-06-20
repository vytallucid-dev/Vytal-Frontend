"use client";

/**
 * Divergence landing-scan card — one tension per card, typed by config and tagged
 * widening/narrowing. Mirrors the TrajectoryScanCard pattern (Card · lift · tokens);
 * the mini chart is the fixed pair's GAP over time, coloured by direction.
 */

import { Card } from "@/components/ui/card";
import { BAND_META } from "@/components/stock-detail/health/shared";
import { cn } from "@/lib/utils";
import type { DivergenceScanItem } from "@/types/research-tools";
import { CONFIG_META, DIRECTION_META, pillarLabel } from "./divergence-data";

function GapSpark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <div className="h-[44px] rounded-md bg-surface-2" />;
  const w = 240;
  const h = 44;
  const pad = 4;
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xo = (i: number) => pad + (i * (w - 2 * pad)) / (values.length - 1);
  const yo = (v: number) => pad + (1 - (v - min) / span) * (h - 2 * pad);
  const line = values.map((v, i) => `${xo(i).toFixed(1)},${yo(v).toFixed(1)}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity={0.13} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export function DivergenceScanCard({
  item,
  onSelect,
}: {
  item: DivergenceScanItem;
  onSelect: (symbol: string) => void;
}) {
  const cfg = CONFIG_META[item.config];
  const dir = DIRECTION_META[item.direction];
  const band = BAND_META[item.band];

  return (
    <button onClick={() => onSelect(item.symbol)} className="block w-full text-left">
      <Card className="lift h-full gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="num text-[13.5px] font-medium text-ink">{item.symbol}</span>
          <span
            className="rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{ color: cfg.color, background: `color-mix(in oklab, ${cfg.color} 14%, transparent)` }}
          >
            {cfg.label}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="num text-[28px] font-medium leading-none text-ink">{item.gap.toFixed(0)}</span>
          <span className="num text-[11px]" style={{ color: dir.color }}>
            {dir.arrow} {dir.label}
          </span>
        </div>

        <GapSpark values={item.spark} color={dir.color} />

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-ink3">
            {pillarLabel(item.highPillar)} <span className="text-ink2">ahead of</span> {pillarLabel(item.lowPillar)}
          </span>
          <span className={cn("text-[10.5px]", band.text)}>{band.label}</span>
        </div>
      </Card>
    </button>
  );
}
