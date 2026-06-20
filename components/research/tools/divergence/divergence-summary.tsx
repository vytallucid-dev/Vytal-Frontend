"use client";

/**
 * The STATIC summary (bottom-right) — the asymmetric interpretation: "whose move?"
 * (which line moved to change the gap) + "what it means" (robust value vs masked
 * caution vs ownership tell). Templated from real subtotal deltas; stable on scrub.
 */

import { Panel } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { PillarKey } from "@/types/health";
import type { DivergenceConfig, DivergenceDirection } from "@/types/research-tools";
import { CONFIG_META, buildWhoseMove, type SpreadPoint } from "./divergence-data";

export function DivergenceSummary({
  spread,
  highPillar,
  lowPillar,
  config,
  direction,
}: {
  spread: SpreadPoint[];
  highPillar: PillarKey;
  lowPillar: PillarKey;
  config: DivergenceConfig;
  direction: DivergenceDirection;
}) {
  const points = buildWhoseMove(spread, highPillar, lowPillar, config, direction);

  return (
    <Panel className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="kicker">How to read it</span>
        <span
          className="rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
          style={{
            color: CONFIG_META[config].color,
            background: `color-mix(in oklab, ${CONFIG_META[config].color} 14%, transparent)`,
          }}
        >
          {CONFIG_META[config].label}
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
