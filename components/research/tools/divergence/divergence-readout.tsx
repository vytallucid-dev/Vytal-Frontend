"use client";

/**
 * The LIVE readout (top-right). At the scrubbed period: the gap size, the direction
 * over the window, and the two pillar values. Reads the frame's active datapoint —
 * resting (null) → latest. Shares one state with the chart, never desyncs.
 */

import { Panel, PILLAR_META } from "@/components/stock-detail/health/shared";
import type { PillarKey } from "@/types/health";
import type { DivergenceDirection } from "@/types/research-tools";
import type { ActiveDatapoint } from "../tool-frame.types";
import { DIRECTION_META, type SpreadPoint } from "./divergence-data";

export function DivergenceReadout({
  spread,
  highPillar,
  lowPillar,
  direction,
  active,
}: {
  spread: SpreadPoint[];
  highPillar: PillarKey;
  lowPillar: PillarKey;
  direction: DivergenceDirection;
  active: ActiveDatapoint;
}) {
  const n = spread.length;
  const i = active.index ?? n - 1;
  const p = spread[i];
  const gap0 = spread[0].gap;
  const windowDelta = Math.round(p.gap - gap0);
  const widened = windowDelta > 0;
  const dir = DIRECTION_META[direction];

  const rows: { key: PillarKey; v: number }[] = [
    { key: highPillar, v: p.high },
    { key: lowPillar, v: p.low },
  ];

  return (
    <Panel className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="kicker">The gap, at this point</span>
        <span className="text-[11px] italic text-ink3">hover / tap the chart</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="shrink-0">
          <div className="num text-[12px] tracking-wide text-ink3">{p.period}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-[38px] font-medium leading-none text-ink">{p.gap.toFixed(0)}</span>
            <span className="text-[13px] text-ink2">pts</span>
          </div>
          <div
            className="num mt-1.5 inline-flex items-center gap-1 text-[11.5px]"
            style={{ color: widened ? "var(--high)" : windowDelta < 0 ? "var(--rec)" : "var(--ink3)" }}
          >
            {widened ? "▲ widened" : windowDelta < 0 ? "▼ narrowed" : "• flat"} {Math.abs(windowDelta)} over window
          </div>
        </div>

        <div className="flex min-w-[220px] flex-1 flex-col gap-2.5">
          {rows.map(({ key, v }) => {
            const meta = PILLAR_META[key];
            return (
              <div key={key} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="flex w-24 shrink-0 items-center gap-2">
                  <span className="size-2 rounded-sm" style={{ background: meta.cssVar }} />
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
          <div className="mt-0.5 text-[11px] text-ink3">
            direction · <span style={{ color: dir.color }}>{dir.label}</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
