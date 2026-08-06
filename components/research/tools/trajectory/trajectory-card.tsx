"use client";

/**
 * Landing-scan card — one "most-interesting journey" per card, reading the SAME
 * persisted B/D-family findings the single view, the stock page and the Hub read
 * (Phase 4). No tool-local taxonomy: the badge is the lead finding's own catalogue
 * name, toned off its severity. §1.6 — a stock with no T pattern is genuinely quiet
 * ("Stable"), not empty. A finding with an unrecognised severity still resolves to a
 * tone (toneOf's default is neutral `ctx`), so an unfamiliar key renders quietly
 * instead of throwing.
 *
 * ── THE CARD IS A RECORDING, NOT A SENTENCE ───────────────────────────────────────
 * The verdict paragraph is gone and the sparkline is back: four cards' worth of
 * two-line prose is not scannable, and the ONE thing a trajectory landing exists to
 * show — the shape of the path — was the thing missing from it. The prose still leads
 * the single view (the promoted read), where there is room to read it.
 *
 * ⚠ THE BADGE SITS BELOW THE SPARK, NOT IN THE HEADER. Catalogue finding names run to
 * ~30 characters ("Momentum improving while weak"); sharing the header row with the
 * ticker squeezed both into a jumble and pushed the badge into two ragged lines. Below
 * the spark it owns a full-width row and can wrap without moving anything else.
 */

import { Card } from "@/components/ui/card";
import { bandMeta } from "@/components/stock-detail/health/shared";
import { HEALTH_BAND_CUTS, healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toneOf } from "@/lib/findings/tool-findings";
import { ScanSpark, type SparkZone } from "../scan-spark";
import type { ToolScanItem } from "@/types/research-tools";

/**
 * The CONDITION BANDS behind the trajectory spark — the same cuts the score itself is labelled
 * by (lib/format#HEALTH_BAND_CUTS), so a line that climbs out of a tinted zone climbed out of
 * that band, and a flat line inside one reads as flat.
 *
 * Clipped to the drawn range: each band spans [cut, next cut up), with the top open-ended
 * upwards and fragile (min −Infinity) open-ended downwards, so both clamp to the frame rather
 * than dropping out of it. Zones therefore appear only where the path actually crosses them.
 */
function bandZones(values: number[]): SparkZone[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const lo = min - span * 0.12;
  const hi = max + span * 0.12;

  return HEALTH_BAND_CUTS.map((c, i, arr) => ({
    key: c.band,
    from: Math.max(Number.isFinite(c.min) ? c.min : lo, lo),
    to: Math.min(i === 0 ? hi : arr[i - 1].min, hi),
  }))
    .filter((z) => z.to > z.from)
    .map((z) => ({ ...z, color: healthColorVar(z.from) }));
}

export function TrajectoryScanCard({
  item,
  onSelect,
}: {
  item: ToolScanItem;
  onSelect: (symbol: string) => void;
}) {
  // item.band arrives off the wire, so an unrecognised value is possible. bandMeta() is the one
  // place that rule lives — neutral styling, raw value as the label, never a throw.
  const band = bandMeta(item.band);
  const lead = item.findings[0] ?? null;
  const badge = lead ? { label: lead.name, color: `var(--${toneOf(lead)})` } : { label: "Stable", color: "var(--ink3)" };
  const extra = Math.max(0, item.findings.length - 1);

  return (
    <button onClick={() => onSelect(item.symbol)} className="block w-full text-left">
      <Card className="lift h-full gap-3 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="num text-[13.5px] font-medium text-ink">{item.symbol}</span>
          <span className={cn("text-[10.5px]", band.text)}>{band.label}</span>
        </div>

        <div className="flex min-w-0 items-baseline gap-2">
          <span className="num shrink-0 text-[28px] font-medium leading-none" style={{ color: healthColorVar(item.composite) }}>
            {Math.round(item.composite)}
          </span>
          {/* the pond, so a reader who filtered by peer group can see WHY a card is here.
              min-w-0 lets it ellipsize instead of pushing the score off the card. */}
          {item.peerGroup && (
            <span className="min-w-0 truncate text-[10.5px] text-ink3" title={item.peerGroup.displayName}>
              {item.peerGroup.displayName}
            </span>
          )}
        </div>

        <ScanSpark
          values={item.spark}
          color={badge.color}
          zones={item.spark.length >= 2 ? bandZones(item.spark) : undefined}
          ariaLabel={`${item.symbol} composite over the last ${item.spark.length} scored quarters`}
        />

        {/* the lead finding's own catalogue name — its own row, free to wrap */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{
              color: badge.color,
              background: `color-mix(in oklab, ${badge.color} 14%, transparent)`,
            }}
          >
            {badge.label}
          </span>
          {/* the card leads with ONE finding; this says so rather than hiding the rest */}
          {extra > 0 && <span className="num text-[9.5px] text-ink3">+{extra}</span>}
        </div>
      </Card>
    </button>
  );
}
