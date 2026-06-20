"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Reveal } from "@/components/ui/reveal";
import { changeColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  SectionEyebrow,
  Panel,
  BAND_META,
  LABEL_BAND_ORDER,
} from "@/components/stock-detail/health/shared";
import { pondCharacterRead, niceBounds, BAND_CUTS } from "./lib";
import type {
  PeerGroupAggregate,
  PeerGroupMemberView,
  PeerGroupIdentity,
} from "@/types/peer-group";

const ZONES: { from: number; to: number; band: keyof typeof BAND_META }[] = [
  { from: -Infinity, to: 55, band: "fragile" },
  { from: 55, to: 62, band: "below_par" },
  { from: 62, to: 68, band: "steady" },
  { from: 68, to: 74, band: "healthy" },
  { from: 74, to: Infinity, band: "pristine" },
];

const VB_W = 1000;
const VB_H = 220;
const X0 = 34;
const X1 = 966;
const AXIS_Y = 120;

function PondChart({
  members,
  median,
}: {
  members: PeerGroupMemberView[];
  median: number;
}) {
  const composites = members.map((m) => m.composite);
  const { lo, hi } = niceBounds([...composites, median], 0.08);
  const xo = (v: number) => X0 + ((v - lo) / (hi - lo || 1)) * (X1 - X0);
  const clampX = (x: number) => Math.max(X0, Math.min(X1, x));

  const sorted = [...members].sort((a, b) => a.composite - b.composite);

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block h-auto w-full" preserveAspectRatio="none">
      {/* band-zone tints */}
      {ZONES.map((z) => {
        const x1 = clampX(xo(Math.max(z.from, lo)));
        const x2 = clampX(xo(Math.min(z.to, hi)));
        if (x2 <= x1) return null;
        return (
          <rect
            key={z.band}
            x={x1}
            y={20}
            width={x2 - x1}
            height={160}
            fill={BAND_META[z.band].cssVar}
            opacity={0.06}
          />
        );
      })}

      {/* band cut lines + labels */}
      {BAND_CUTS.filter((c) => c > lo && c < hi).map((c) => {
        const x = xo(c);
        return (
          <g key={c}>
            <line x1={x} y1={20} x2={x} y2={180} stroke="var(--line2)" strokeWidth={1} strokeDasharray="2 4" />
            <text x={x} y={200} textAnchor="middle" className="num" style={{ fontSize: 11, fill: "var(--ink3)" }}>
              {c}
            </text>
          </g>
        );
      })}

      {/* axis */}
      <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke="var(--line2)" strokeWidth={1} />

      {/* median marker */}
      {(() => {
        const x = xo(median);
        return (
          <g>
            <line x1={x} y1={34} x2={x} y2={AXIS_Y} stroke="var(--ink2)" strokeWidth={1.5} />
            <text x={clampX(x)} y={30} textAnchor="middle" className="num" style={{ fontSize: 10, fill: "var(--ink2)" }}>
              median {Math.round(median)}
            </text>
          </g>
        );
      })()}

      {/* member dots, alternating labels */}
      {sorted.map((m, i) => {
        const x = xo(m.composite);
        const col = BAND_META[m.labelBand].cssVar;
        const above = i % 2 === 0;
        const ly = above ? AXIS_Y - 20 : AXIS_Y + 30;
        const dy = above ? AXIS_Y - 8 : AXIS_Y + 8;
        const vy = above ? AXIS_Y - 32 : AXIS_Y + 44;
        return (
          <g key={m.symbol}>
            <line x1={x} y1={AXIS_Y} x2={x} y2={dy} stroke={col} strokeWidth={1} opacity={0.4} />
            <circle cx={x} cy={AXIS_Y} r={5.5} fill={col} />
            <text x={clampX(x)} y={ly} textAnchor="middle" className="num" style={{ fontSize: 10.5, fill: "var(--ink2)" }}>
              {m.symbol}
            </text>
            <text x={clampX(x)} y={vy} textAnchor="middle" className="num" style={{ fontSize: 9, fill: "var(--ink3)" }}>
              {Math.round(m.composite)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BandMix({ dist }: { dist: PeerGroupAggregate["bandDistribution"] }) {
  const total = LABEL_BAND_ORDER.reduce((s, b) => s + dist[b], 0);
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.1em] text-ink3">Band mix</div>
      <div className="flex h-7 gap-0.5 overflow-hidden rounded-lg">
        {LABEL_BAND_ORDER.map((b) => {
          const n = dist[b];
          if (n === 0) return null;
          return (
            <div
              key={b}
              className="num flex items-center justify-center text-[12px] font-medium"
              style={{ flex: n, background: BAND_META[b].cssVar, color: "#0a0b0e" }}
            >
              {n}
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-ink2">
        {LABEL_BAND_ORDER.filter((b) => dist[b] > 0).map((b) => (
          <span key={b} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm" style={{ background: BAND_META[b].cssVar }} />
            {BAND_META[b].label} {dist[b]}
          </span>
        ))}
        {total === 0 && <span className="text-ink3">No members scored.</span>}
      </div>
    </div>
  );
}

function Vital({ k, v, tone }: { k: string; v: React.ReactNode; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2.5">
      <span className="text-[12px] text-ink2">{k}</span>
      <span className="num text-[15px] font-medium" style={tone ? { color: tone } : undefined}>
        {v}
      </span>
    </div>
  );
}

/** Quiet drift read beside the median — up = healthier (success), down = warning/danger,
 *  via the shared changeColor convention. Rendered only when a prior period exists. */
function DriftBadge({ drift, priorPeriodKey }: { drift: number; priorPeriodKey: string | null }) {
  const arrow = drift > 0 ? "▲" : drift < 0 ? "▼" : "·";
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={cn("num text-[12px] font-medium", changeColor(drift))}>
        {arrow} {drift > 0 ? "+" : ""}
        {drift.toFixed(1)}
      </span>
      {priorPeriodKey && <span className="text-[10px] text-ink3">vs {priorPeriodKey}</span>}
    </span>
  );
}

export function PortraitSection({
  aggregate,
  members,
  identity,
  notAtCurrentPeriod,
}: {
  aggregate: PeerGroupAggregate;
  members: PeerGroupMemberView[];
  identity: PeerGroupIdentity;
  notAtCurrentPeriod: { symbol: string; latestPeriod: string }[];
}) {
  const rangeWidth = aggregate.range
    ? Math.round(aggregate.range.max.composite - aggregate.range.min.composite)
    : 0;
  const spread = aggregate.descriptor.split(",")[1]?.trim() ?? "varied";

  return (
    <section>
      <SectionEyebrow label="What kind of pond is this" />
      <Reveal>
        <Panel className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          {/* distribution */}
          <div>
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink3">
              The population, spread by health
            </div>
            <PondChart members={members} median={aggregate.medianComposite} />
            <p className="diagnosis mt-3.5 font-display text-[15px] leading-relaxed text-ink">
              {pondCharacterRead(aggregate, identity.sectorClass)}
            </p>
          </div>

          {/* vitals */}
          <div className="flex flex-col gap-4">
            <BandMix dist={aggregate.bandDistribution} />
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <Vital
                k="Median composite"
                v={
                  <span className="inline-flex items-baseline gap-2.5">
                    <AnimatedNumber value={aggregate.medianComposite} decimals={0} />
                    {aggregate.medianDrift !== null && (
                      <DriftBadge
                        drift={aggregate.medianDrift}
                        priorPeriodKey={aggregate.priorPeriodKey}
                      />
                    )}
                  </span>
                }
              />
              <Vital k="Dispersion (range)" v={`${rangeWidth} pts · ${spread}`} />
              {aggregate.range && (
                <>
                  <Vital
                    k={`Strongest · ${aggregate.range.max.symbol}`}
                    v={Math.round(aggregate.range.max.composite)}
                    tone={BAND_META.pristine.cssVar}
                  />
                  <Vital
                    k={`Weakest · ${aggregate.range.min.symbol}`}
                    v={Math.round(aggregate.range.min.composite)}
                    tone="var(--ink2)"
                  />
                </>
              )}
              <Vital k="Members scored" v={`${aggregate.scoredCount} of ${identity.memberCount}`} />
            </div>
          </div>
        </Panel>
      </Reveal>

      {notAtCurrentPeriod.length > 0 && (
        <p className="mt-2.5 text-[11.5px] text-ink3">
          {notAtCurrentPeriod.length} member{notAtCurrentPeriod.length > 1 ? "s" : ""} not in this
          period&apos;s cross-section (lagging filings):{" "}
          <span className="num text-ink2">
            {notAtCurrentPeriod.map((x) => `${x.symbol} @ ${x.latestPeriod}`).join(", ")}
          </span>
        </p>
      )}
    </section>
  );
}
