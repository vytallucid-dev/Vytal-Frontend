"use client";

/**
 * The LIVE readout (top-right). Reads the frame's active datapoint — the composite +
 * four pillar values at the scrubbed period. Resting (active.index null) → latest.
 * This card and the chart share one state, so they can never desync.
 */

import { Panel, PILLAR_META } from "@/components/stock-detail/health/shared";
import { healthLabel } from "@/lib/format";
import type { ActiveDatapoint } from "../tool-frame.types";
import type { WindowPoint } from "../window-slice";

const PILLARS: ("foundation" | "momentum" | "market" | "ownership")[] = [
  "foundation",
  "momentum",
  "market",
  "ownership",
];

export function TrajectoryReadout({
  points,
  isDaily,
  active,
}: {
  points: WindowPoint[];
  isDaily: boolean;
  active: ActiveDatapoint;
}) {
  const n = points.length;
  const i = active.index ?? n - 1;
  const p = points[i];
  const delta = p.composite - points[0].composite;
  const deltaColor = delta < 0 ? "var(--high)" : delta > 0 ? "var(--rec)" : "var(--ink3)";

  return (
    <Panel className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="kicker">At this point</span>
        <span className="text-[11px] italic text-ink3">hover / tap the chart</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="shrink-0">
          <div className="num text-[12px] tracking-wide text-ink3">{p.x}</div>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="num text-[38px] font-medium leading-none text-ink">
              {p.composite.toFixed(0)}
            </span>
            <span className="hero-name text-[16px] text-ink2">{healthLabel(p.composite)}</span>
          </div>
          <div className="num mt-1.5 text-[11.5px]" style={{ color: deltaColor }}>
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)} over {isDaily ? "range" : "window"}
          </div>
        </div>

        <div className="flex min-w-[220px] flex-1 flex-col gap-2.5">
          {PILLARS.map((key) => {
            const meta = PILLAR_META[key];
            const v = p[key] as number;
            return (
              <div key={key} className="flex items-center gap-2.5 text-[12px]">
                <span className="flex w-[78px] shrink-0 items-center gap-2">
                  <span className="size-[7px] rounded-sm" style={{ background: meta.cssVar }} />
                  {meta.label}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded bg-surface-3">
                  <span
                    className="block h-full rounded transition-[width] duration-150"
                    style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: meta.cssVar }}
                  />
                </span>
                <span className="num w-7 shrink-0 text-right text-ink">{v.toFixed(0)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
