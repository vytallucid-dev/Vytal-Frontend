"use client";

/**
 * The STATIC summary (bottom-right) — the "What happened" journey timeline, built
 * from real band/pillar crossings + corporate events. Stable (does not change on
 * scrub), unlike the live readout above it.
 */

import { Panel } from "@/components/stock-detail/health/shared";
import type { TrajectorySection } from "@/types/health";
import { buildTimeline } from "./trajectory-data";

export function TrajectorySummary({ trajectory }: { trajectory: TrajectorySection }) {
  const items = buildTimeline(trajectory);

  return (
    <Panel className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="kicker">What happened</span>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-[12px] text-ink3">No notable crossings or events in this window.</p>
      ) : (
        <div className="relative">
          {items.map((it, i) => (
            <div key={i} className="relative pb-4 pl-6 last:pb-0.5">
              {i !== items.length - 1 && (
                <span className="absolute left-[5px] top-3.5 bottom-0 w-px bg-line" />
              )}
              <span
                className="absolute left-0 top-[3px] size-3 rounded-full border-2 border-background"
                style={{ background: it.dotColor }}
              />
              <div className="num text-[10.5px] text-ink3">{it.when}</div>
              <div className="mt-0.5 text-[13px] text-ink">
                {it.text}
                <span className="ml-1.5 text-[9px] uppercase tracking-wide text-ink3">{it.tag}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
