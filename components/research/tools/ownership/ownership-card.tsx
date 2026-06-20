"use client";

/**
 * Ownership landing-scan card — one flow/pledge tell per card. Mirrors the
 * Trajectory/Divergence card pattern; the mini chart is institutional share
 * (FII+DII) over time, coloured by the tell.
 */

import { Card } from "@/components/ui/card";
import { BAND_META } from "@/components/stock-detail/health/shared";
import { cn } from "@/lib/utils";
import type { OwnershipScanItem, OwnershipTell } from "@/types/research-tools";

const TELL_META: Record<OwnershipTell, { label: string; color: string }> = {
  pledge_r1: { label: "Pledge R1", color: "var(--crit)" },
  pledge_high: { label: "High pledging", color: "var(--high)" },
  distribution: { label: "Distribution", color: "var(--crit)" },
  accumulation: { label: "Accumulation", color: "var(--rec)" },
  rotation: { label: "Rotation", color: "var(--ctx)" },
  flat: { label: "Steady", color: "var(--ink3)" },
};

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <div className="h-[44px] rounded-md bg-surface-2" />;
  const w = 240;
  const h = 44;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xo = (i: number) => pad + (i * (w - 2 * pad)) / (values.length - 1);
  const yo = (v: number) => pad + (1 - (v - min) / span) * (h - 2 * pad);
  const line = values.map((v, i) => `${xo(i).toFixed(1)},${yo(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" preserveAspectRatio="none">
      <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

function summaryLine(item: OwnershipScanItem): string {
  if (item.tell === "pledge_r1" || item.tell === "pledge_high")
    return item.pledgedPctOfPromoter != null
      ? `${item.pledgedPctOfPromoter.toFixed(0)}% of promoter holding pledged`
      : "Promoter pledging elevated";
  if (item.instDelta != null) {
    if (item.tell === "rotation")
      return `FII ${item.fiiDelta != null ? (item.fiiDelta > 0 ? "+" : "") + item.fiiDelta.toFixed(1) : "?"} · DII ${item.diiDelta != null ? (item.diiDelta > 0 ? "+" : "") + item.diiDelta.toFixed(1) : "?"}pp`;
    return `Institutional ${item.instDelta > 0 ? "+" : ""}${item.instDelta.toFixed(1)}pp`;
  }
  return "Ownership steady";
}

export function OwnershipScanCard({
  item,
  onSelect,
}: {
  item: OwnershipScanItem;
  onSelect: (symbol: string) => void;
}) {
  const tell = TELL_META[item.tell];
  const band = BAND_META[item.band];

  return (
    <button onClick={() => onSelect(item.symbol)} className="block w-full text-left">
      <Card className="lift h-full gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="num text-[13.5px] font-medium text-ink">{item.symbol}</span>
          <span
            className="rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{ color: tell.color, background: `color-mix(in oklab, ${tell.color} 14%, transparent)` }}
          >
            {tell.label}
          </span>
        </div>

        <Spark values={item.spark} color={tell.color} />

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-ink2">{summaryLine(item)}</span>
          <span className={cn("text-[10.5px]", band.text)}>{band.label}</span>
        </div>
      </Card>
    </button>
  );
}
