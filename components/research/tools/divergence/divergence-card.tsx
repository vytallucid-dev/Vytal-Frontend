"use client";

/**
 * Divergence landing-scan card — one row per stock, reading the SAME persisted C-family
 * findings the single view, the stock page and the Hub read (Phase 4). No tool-local
 * taxonomy: the badge is the lead finding's own catalogue name, toned off its severity
 * (or the S1 aligned copy when the stock carries no live divergence). A finding with an
 * unrecognised severity still resolves to a tone (toneOf's default is neutral `ctx`), so
 * an unfamiliar key renders quietly instead of throwing.
 *
 * ── THE CARD IS A RECORDING, NOT A SENTENCE ───────────────────────────────────────────
 * The verdict paragraph is gone and the mini chart is back — mirroring the trajectory card.
 * The prose still leads the single view (the promoted read), where there is room to read it.
 *
 * ── ★ TWO LINES, BECAUSE A DIVERGENCE IS BETWEEN TWO PILLARS ──────────────────────────
 * Trajectory's card plots one line (the composite). This one plots the PAIR — the high leg
 * and the low leg, in their own pillar colours, with the enclosed area filled and the current
 * gap printed inside it. A single derived magnitude would answer "how much" while hiding the
 * two things a reader of this tool actually asks first: which pillar is ahead, and of what.
 *
 * It is served, not derived here: the backend fixes the pair from the current snapshot with
 * `pillarSpread` (the one spread implementation, the same call alignedState makes) and reads
 * those two pillars backwards. This file scales and draws them. It does NOT label the shape —
 * widening/narrowing is on the spec's EXCLUDED list (−1.1%/44% positive, and it INVERTS in
 * banks) — so no directional colour, arrow or word appears. The gap NUMBER is a measurement of
 * the drawn lines, never a threshold: "≥ 25 pts apart" is the kind of rule-in-prose that went
 * stale when Phase 2 moved the material cut to 12. Whether a gap is material stays the
 * D-rules' answer, and it reaches the card as the badge.
 *
 * ⚠ THE BADGE SITS BELOW THE CHART, NOT IN THE HEADER — catalogue finding names run past 30
 * characters ("Ownership Exiting a Healthy Business"), and sharing the header row with the
 * ticker squeezed both into a jumble. Below the chart it can wrap without moving anything else.
 */

import { Card } from "@/components/ui/card";
import { BAND_META, PILLAR_META } from "@/components/stock-detail/health/shared";
import { healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toneOf } from "@/lib/findings/tool-findings";
import { ScanSparkPair } from "../scan-spark";
import type { PillarKey } from "@/types/health";
import type { ToolScanItem } from "@/types/research-tools";

const pillar = (key: string) => PILLAR_META[key as PillarKey] ?? null;

export function DivergenceScanCard({
  item,
  onSelect,
}: {
  item: ToolScanItem;
  onSelect: (symbol: string) => void;
}) {
  const lead = item.findings[0] ?? null;
  const band = BAND_META[item.band];
  const extra = Math.max(0, item.findings.length - 1);

  // ⚠ THREE STATES, NOT FOUR. A fired finding, or the S1 aligned reading, or NOTHING — a stock
  //   with too few scored pillars to compare has no reading, and a placeholder badge would be
  //   inventing one. Silence is the honest render; the chart is already absent for the same
  //   reason, so the card simply says less rather than saying something untrue.
  const badge = lead
    ? { label: lead.name, color: `var(--${toneOf(lead)})` }
    : item.alignedCopy
      ? { label: item.alignedCopy.name, color: "var(--ink3)" }
      : null;

  // Served by the divergence scan only; null when fewer than two pillars are scored.
  const legs = item.spreadSpark;
  const high = legs ? pillar(legs.highPillar) : null;
  const low = legs ? pillar(legs.lowPillar) : null;

  return (
    <button onClick={() => onSelect(item.symbol)} className="block w-full text-left">
      <Card className="lift h-full gap-3 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="num text-[13.5px] font-medium text-ink">{item.symbol}</span>
          <span className={cn("text-[10.5px]", band.text)}>{band.label}</span>
        </div>

        <div className="flex min-w-0 items-baseline gap-2">
          <span
            className="num shrink-0 text-[28px] font-medium leading-none"
            style={{ color: healthColorVar(item.composite) }}
          >
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

        {legs && high && low && (
          <ScanSparkPair
            points={legs.points}
            highColor={high.cssVar}
            lowColor={low.cssVar}
            ariaLabel={`${item.symbol}: ${high.label} against ${low.label} over the last ${legs.points.length} scored quarters`}
          />
        )}

        {/* badge (the finding) + which two lines the chart drew */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          <span className="flex items-center gap-1.5">
            {badge && (
              <span
                className="rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: badge.color, background: `color-mix(in oklab, ${badge.color} 14%, transparent)` }}
              >
                {badge.label}
              </span>
            )}
            {/* the card leads with ONE finding; this says so rather than hiding the rest */}
            {extra > 0 && <span className="num text-[9.5px] text-ink3">+{extra}</span>}
          </span>

          {high && low && (
            <span className="flex items-center gap-2 text-[9.5px] text-ink3">
              <Leg meta={high} />
              <Leg meta={low} />
            </span>
          )}
        </div>
      </Card>
    </button>
  );
}

/** One legend entry — the dot carries the pillar's fixed colour, the same token the line uses. */
function Leg({ meta }: { meta: { label: string; cssVar: string } }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="size-1.5 rounded-full" style={{ background: meta.cssVar }} />
      {meta.label}
    </span>
  );
}
