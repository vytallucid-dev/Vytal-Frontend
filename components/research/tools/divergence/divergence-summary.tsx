"use client";

/**
 * The STATIC summary (bottom-right): "whose move?" (which line moved to change the gap — computed
 * from real subtotal deltas, stable on scrub) + "what it means" (the FIRED FINDING's own
 * interpretive boundary, from the catalogue).
 *
 * ⚠ The old header described the second panel as "robust value vs masked caution vs ownership tell".
 * The "robust value" reading is removed, not reworded: fundamentals-ahead-of-price is on the
 * Divergence spec's EXCLUDED list because its evidence conflicts, so no claim about what it has
 * historically meant may be made here at any strength.
 */

import { Panel } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { PillarKey, PatternView } from "@/types/health";
import { buildWhoseMove, type SpreadPoint } from "./divergence-data";
import { findingName } from "@/lib/findings/descriptions";
import { toneOf } from "@/lib/findings/tool-findings";

export function DivergenceSummary({
  spread,
  highPillar,
  lowPillar,
  findings,
}: {
  spread: SpreadPoint[];
  highPillar: PillarKey;
  lowPillar: PillarKey;
  /** The stock's C-family findings, most-severe first. The summary DESCRIBES them; it never
   *  re-derives a configuration of its own (the old `config`/`direction` pair did, on a taxonomy
   *  that mapped to no finding key). */
  findings: PatternView[];
}) {
  const lead = findings[0];
  // The chip names the FIRED FINDING — not a recomputed config token that maps to no key.
  const chipLabel = lead ? findingName(lead.patternKey) : "Aligned";
  const chipColor = lead ? `var(--${toneOf(lead)})` : "var(--ink3)";
  const points = buildWhoseMove(spread, highPillar, lowPillar, findings);

  return (
    <Panel className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="kicker">How to read it</span>
        <span
          className="rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
          style={{
            color: chipColor,
            background: `color-mix(in oklab, ${chipColor} 14%, transparent)`,
          }}
        >
          {chipLabel}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {points.map((pt, i) => {
          const good = pt.tone === "good";
          return (
            <div key={i} className="flex gap-3">
              <span
                className={cn(
                  "grid size-6.5 shrink-0 place-items-center rounded-lg",
                  good ? "bg-rec/12 text-rec" : "bg-high/12 text-high",
                )}
              >
                {good ? (
                  <Icons.check weight="bold" className="size-3.5" />
                ) : (
                  <Icons.warning weight="fill" className="size-3.5" />
                )}
              </span>
              <div>
                <div className="text-[12.5px] font-medium text-ink">{pt.title}</div>
                <div className="mt-0.5 text-[11.5px] leading-relaxed text-ink2">{pt.body}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
