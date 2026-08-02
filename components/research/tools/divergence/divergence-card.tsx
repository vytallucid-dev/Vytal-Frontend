"use client";

/**
 * Divergence landing-scan card — one row per stock, reading the SAME persisted C-family
 * findings the single view, the stock page and the Hub read (Phase 4). No tool-local
 * taxonomy: the badge is the lead finding's own catalogue name, toned off its severity
 * (or the S1 aligned copy when the stock carries no live divergence). A finding with an
 * unrecognised severity still resolves to a tone (toneOf's default is neutral `ctx`), so
 * an unfamiliar key renders quietly instead of throwing.
 */

import { Card } from "@/components/ui/card";
import { BAND_META } from "@/components/stock-detail/health/shared";
import { cn } from "@/lib/utils";
import { toneOf } from "@/lib/findings/tool-findings";
import type { ToolScanItem } from "@/types/research-tools";

export function DivergenceScanCard({
  item,
  onSelect,
}: {
  item: ToolScanItem;
  onSelect: (symbol: string) => void;
}) {
  const lead = item.findings[0] ?? null;
  const band = BAND_META[item.band];
  const badge = lead
    ? { label: lead.name, color: `var(--${toneOf(lead)})` }
    : item.alignedCopy
      ? { label: item.alignedCopy.name, color: "var(--ink3)" }
      : { label: "Building", color: "var(--ink3)" };
  const verdict = lead?.verdict ?? item.alignedCopy?.verdict ?? null;

  return (
    <button onClick={() => onSelect(item.symbol)} className="block w-full text-left">
      <Card className="lift h-full gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="num text-[13.5px] font-medium text-ink">{item.symbol}</span>
          <span
            className="rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{ color: badge.color, background: `color-mix(in oklab, ${badge.color} 14%, transparent)` }}
          >
            {badge.label}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="num text-[28px] font-medium leading-none text-ink">{Math.round(item.composite)}</span>
          <span className={cn("text-[11px]", band.text)}>{band.label}</span>
        </div>

        {verdict && <p className="line-clamp-2 text-[11px] leading-snug text-ink3">{verdict}</p>}
      </Card>
    </button>
  );
}
