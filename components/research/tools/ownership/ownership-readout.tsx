"use client";

/**
 * The LIVE readout (top-right). At the scrubbed period: the holding split, the
 * institutional total + its move since the prior period (the derived flow), and the
 * pledge ratio (% of promoter holding, from share counts). Reads the frame's active
 * datapoint; resting → latest. No Foundation line — the floor lives in the strip.
 */

import { Panel } from "@/components/stock-detail/health/shared";
import type { ActiveDatapoint } from "../tool-frame.types";
import { HOLD_LANES, inst, type HoldingPoint } from "./ownership-data";

const signed = (x: number) => `${x > 0 ? "+" : ""}${x.toFixed(1)}`;

export function OwnershipReadout({
  points,
  active,
  r1 = false,
}: {
  points: HoldingPoint[];
  active: ActiveDatapoint;
  /** R1 pledge red flag firing (current period) — escalates the pledge treatment. */
  r1?: boolean;
}) {
  const n = points.length;
  const i = active.index ?? n - 1;
  const p = points[i];
  const prev = i > 0 ? points[i - 1] : null;
  const instNow = inst(p);
  const instPrev = prev ? inst(prev) : null;
  const instDelta = instPrev != null ? instNow - instPrev : null;
  const fiiDelta = prev ? p.fii - prev.fii : null;
  const diiDelta = prev ? p.dii - prev.dii : null;
  // pledged slice of the promoter bar (% of the promoter bar's own length).
  const pledgedPct =
    p.pledgedPctOfPromoter != null && p.pledgedPctOfPromoter > 0 ? p.pledgedPctOfPromoter : null;

  return (
    <Panel className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="kicker">Holdings, at this point</span>
        <span className="text-[11px] italic text-ink3">hover / tap the chart</span>
      </div>

      <div className="num mb-2 text-[12px] tracking-wide text-ink3">{p.period}</div>

      <div className="flex flex-col gap-2.5">
        {HOLD_LANES.map((lane) => {
          const v = p[lane.key];
          // On the PROMOTER row, split the bar: gold with a red pledged sub-portion at its
          // base (red length = pledgedPct% of the promoter bar). Mirrors the chart's red.
          const isPromoter = lane.key === "promoter";
          const barW = Math.max(0, Math.min(100, v));
          const redW = isPromoter && pledgedPct != null ? barW * (pledgedPct / 100) : 0;
          return (
            <div key={lane.key} className="flex items-center gap-2.5 text-[12.5px]">
              <span className="flex w-20 shrink-0 items-center gap-2">
                <span className="size-2.5 rounded-sm" style={{ background: lane.color }} />
                {lane.label}
              </span>
              <span className="relative h-1.5 flex-1 overflow-hidden rounded bg-surface-3">
                <span
                  className="block h-full rounded transition-[width] duration-150"
                  style={{ width: `${barW}%`, background: lane.color }}
                />
                {redW > 0 && (
                  // hazard-hatch, not a flat block — reads as a flagged portion of the
                  // promoter bar underneath it, never a separate holder.
                  <span
                    className="absolute inset-y-0 left-0 rounded-l"
                    style={{
                      width: `${redW}%`,
                      background:
                        "repeating-linear-gradient(45deg, var(--crit) 0 2px, color-mix(in oklch, var(--crit) 30%, transparent) 2px 4px)",
                    }}
                  />
                )}
              </span>
              <span className="num w-9 shrink-0 text-right text-ink">{v.toFixed(1)}</span>
            </div>
          );
        })}

        <div className="my-1 h-px bg-line" />

        {/* institutional total + the derived flow move */}
        <div className="flex items-center gap-2.5 text-[12.5px]">
          <span className="w-20 shrink-0 font-medium text-ink">Institutional</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded bg-surface-3">
            <span
              className="block h-full rounded"
              style={{ width: `${Math.max(0, Math.min(100, instNow))}%`, background: "linear-gradient(90deg,var(--p-found),var(--p-mom))" }}
            />
          </span>
          <span className="num w-9 shrink-0 text-right font-semibold text-ink">{instNow.toFixed(1)}</span>
        </div>

        {instDelta != null && (
          <div className="text-[11px] text-ink3">
            since prior ·{" "}
            <span style={{ color: instDelta > 0 ? "var(--rec)" : instDelta < 0 ? "var(--crit)" : "var(--ink3)" }}>
              inst {signed(instDelta)}pp
            </span>
            {fiiDelta != null && <> (FII {signed(fiiDelta)} · DII {signed(diiDelta ?? 0)})</>}
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink3">
          pledge ·{" "}
          {pledgedPct != null ? (
            r1 ? (
              // R1 firing — escalate to the crit treatment used across the tool.
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--crit)", background: "color-mix(in oklab, var(--crit) 14%, transparent)" }}
                >
                  R1
                </span>
                <span className="num font-medium" style={{ color: "var(--crit)" }}>
                  {pledgedPct.toFixed(1)}% of promoter holding pledged — above its mark
                </span>
              </span>
            ) : (
              <span className="num" style={{ color: "var(--high)" }}>
                {pledgedPct.toFixed(1)}% of promoter holding pledged
              </span>
            )
          ) : (
            <span className="text-ink2">none</span>
          )}
        </div>
      </div>
    </Panel>
  );
}
