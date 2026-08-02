"use client";

/**
 * Landing-scan card — one "most-interesting journey" per card, reading the SAME
 * persisted B/D-family findings the single view, the stock page and the Hub read
 * (Phase 4). No tool-local taxonomy: the badge is the lead finding's own catalogue
 * name, toned off its severity. §1.6 — a stock with no T pattern is genuinely quiet
 * ("Stable"), not empty. A finding with an unrecognised severity still resolves to a
 * tone (toneOf's default is neutral `ctx`), so an unfamiliar key renders quietly
 * instead of throwing.
 */

import { Card } from "@/components/ui/card";
import { BAND_META } from "@/components/stock-detail/health/shared";
import { healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toneOf } from "@/lib/findings/tool-findings";
import type { ToolScanItem } from "@/types/research-tools";

export function TrajectoryScanCard({
  item,
  onSelect,
}: {
  item: ToolScanItem;
  onSelect: (symbol: string) => void;
}) {
  const band = BAND_META[item.band];
  const lead = item.findings[0] ?? null;
  const badge = lead ? { label: lead.name, color: `var(--${toneOf(lead)})` } : { label: "Stable", color: "var(--ink3)" };

  return (
    <button onClick={() => onSelect(item.symbol)} className="block w-full text-left">
      <Card className="lift h-full gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="num text-[13.5px] font-medium text-ink">{item.symbol}</span>
          <span
            className="rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{
              color: badge.color,
              background: `color-mix(in oklab, ${badge.color} 14%, transparent)`,
            }}
          >
            {badge.label}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="num text-[28px] font-medium leading-none" style={{ color: healthColorVar(item.composite) }}>
            {Math.round(item.composite)}
          </span>
          <span className={cn("text-[11px]", band.text)}>{band.label}</span>
        </div>

        {lead?.verdict && <p className="line-clamp-2 text-[11px] leading-snug text-ink3">{lead.verdict}</p>}
      </Card>
    </button>
  );
}
