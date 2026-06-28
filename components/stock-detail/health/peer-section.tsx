"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import type { IdentitySection, VerdictSection, PeerStandingSection, PillarKey } from "@/types/health";
import { SectionEyebrow, Panel, PILLAR_META, clampPct, fmt } from "./shared";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/ui/chart-tooltip";
import { rankNarrative, PILLAR_TITLE } from "./diagnosis";

const BAND_CUTS: { v: number; cssVar: string; label: string }[] = [
  { v: 55, cssVar: "var(--c-below)", label: "55" },
  { v: 62, cssVar: "var(--c-steady)", label: "62" },
  { v: 68, cssVar: "var(--c-healthy)", label: "68" },
  { v: 74, cssVar: "var(--c-pristine)", label: "74" },
];

function compositeColour(v: number) {
  if (v >= 74) return "var(--c-pristine)";
  if (v >= 68) return "var(--c-healthy)";
  if (v >= 62) return "var(--c-steady)";
  if (v >= 55) return "var(--c-below)";
  return "var(--c-fragile)";
}

export function PeerSection({
  identity,
  verdict,
  peer,
}: {
  identity: IdentitySection;
  verdict: VerdictSection;
  peer: PeerStandingSection;
}) {
  const me = verdict.composite;
  const above = peer.neighbours.above;
  const below = peer.neighbours.below;

  // Distribution axis domain from the points we actually have (me + neighbours).
  // The full roster is NOT in the contract — only the two nearest names — so we
  // plot what's known and say so, rather than fabricate the pack.
  const known = [me, above?.composite, below?.composite].filter(
    (x): x is number => typeof x === "number",
  );
  const lo = Math.max(0, Math.min(...known) - 5);
  const hi = Math.min(100, Math.max(...known) + 5);
  const span = hi - lo || 1;
  const x = (v: number) => 24 + (clampPct(((v - lo) / span) * 100) / 100) * (1000 - 48);

  const pgName = identity.peerGroup?.displayName ?? peer.peerGroupId;
  const narrative = rankNarrative(peer.perPillarRank);

  const chartRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(chartRef);

  return (
    <section>
      <SectionEyebrow
        label="Standing in its peer group" icon={Icons.compare} accent="var(--p-mom)"
        pill={`${pgName} · ${peer.memberCount} scored`}
      />
      <Panel className="grid gap-7 lg:grid-cols-[1.5fr_1fr]">
        {/* ── distribution + neighbours ── */}
        <div>
          <div className="kicker mb-3">Where it sits — by composite</div>
          <div ref={chartRef} className="relative">
          <ChartTooltip tip={tip} />
          <svg viewBox="0 0 1000 92" preserveAspectRatio="none" className="block h-auto w-full">
            {/* band separators within domain */}
            {BAND_CUTS.filter((b) => b.v > lo && b.v < hi).map((b) => (
              <g key={b.v}>
                <line
                  x1={x(b.v)}
                  y1={18}
                  x2={x(b.v)}
                  y2={56}
                  stroke={b.cssVar}
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  opacity={0.4}
                />
                <text x={x(b.v)} y={12} textAnchor="middle" className="num" style={{ fill: b.cssVar, fontSize: 11 }}>
                  {b.label}
                </text>
              </g>
            ))}
            {/* baseline */}
            <line x1={24} y1={44} x2={976} y2={44} stroke="var(--line2)" strokeWidth={1} />
            {/* neighbours */}
            {above && <circle cx={x(above.composite)} cy={44} r={5} fill={compositeColour(above.composite)} opacity={0.75} />}
            {below && <circle cx={x(below.composite)} cy={44} r={5} fill={compositeColour(below.composite)} opacity={0.75} />}
            {/* me */}
            <circle cx={x(me)} cy={44} r={9} fill={compositeColour(me)} stroke="var(--ink)" strokeWidth={2} />
            <text x={x(me)} y={74} textAnchor="middle" className="num" style={{ fill: "var(--ink)", fontSize: 12, fontWeight: 600 }}>
              {identity.symbol} · {fmt(me)}
            </text>
            <text x={x(me)} y={88} textAnchor="middle" className="num" style={{ fill: "var(--ink3)", fontSize: 10 }}>
              #{peer.rank} of {peer.memberCount}
            </text>
            {/* hover hit-targets */}
            {above && (
              <circle
                cx={x(above.composite)} cy={44} r={16} fill="transparent" style={{ cursor: "pointer" }}
                onMouseMove={(e) => show(e, <TipBody title={above.symbol} rows={[{ label: "Composite", value: fmt(above.composite) }, { label: "vs this stock", value: "just above" }]} />)}
                onMouseLeave={hide}
              />
            )}
            {below && (
              <circle
                cx={x(below.composite)} cy={44} r={16} fill="transparent" style={{ cursor: "pointer" }}
                onMouseMove={(e) => show(e, <TipBody title={below.symbol} rows={[{ label: "Composite", value: fmt(below.composite) }, { label: "vs this stock", value: "just below" }]} />)}
                onMouseLeave={hide}
              />
            )}
            <circle
              cx={x(me)} cy={44} r={16} fill="transparent" style={{ cursor: "pointer" }}
              onMouseMove={(e) => show(e, <TipBody title={identity.symbol} rows={[{ label: "Composite", value: fmt(me) }, { label: "Rank", value: `#${peer.rank} of ${peer.memberCount}` }, { label: "Percentile", value: `${peer.percentile.toFixed(0)}th` }]} />)}
              onMouseLeave={hide}
            />
          </svg>
          </div>
          <p className="mt-2 text-[10.5px] italic text-ink3">
            Nearest names shown — the read carries rank &amp; percentile, not the full roster.
          </p>

          <div className="mt-4 flex flex-wrap gap-6">
            <div className="min-w-[160px] flex-1">
              <div className="kicker mb-2">Just above</div>
              {above ? (
                <div className="flex items-center justify-between border-t border-line py-2 text-[12.5px] first:border-t-0">
                  <span className="num">{above.symbol}</span>
                  <span className="num text-ink2">{fmt(above.composite)}</span>
                </div>
              ) : (
                <p className="py-2 text-[12px] text-ink3">Top of the group</p>
              )}
            </div>
            <div className="min-w-[160px] flex-1">
              <div className="kicker mb-2">Just below</div>
              {below ? (
                <div className="flex items-center justify-between border-t border-line py-2 text-[12.5px] first:border-t-0">
                  <span className="num">{below.symbol}</span>
                  <span className="num text-ink2">{fmt(below.composite)}</span>
                </div>
              ) : (
                <p className="py-2 text-[12px] text-ink3">Bottom of the group</p>
              )}
            </div>
          </div>
        </div>

        {/* ── rank card + per-pillar rank ── */}
        <div>
          <div className="kicker mb-3">Rank within the group</div>
          <div className="flex items-baseline gap-2.5">
            <span className="num text-3xl font-medium text-ink">#{peer.rank}</span>
            <span className="text-[12px] text-ink3">
              of {peer.memberCount} · {peer.percentile.toFixed(0)}th percentile
            </span>
          </div>
          {narrative && (
            <p className="mt-2 mb-4 text-[11.5px] leading-relaxed text-ink2">
              Its{" "}
              <b className="font-medium" style={{ color: PILLAR_META[narrative.bestPillar].cssVar }}>
                {PILLAR_TITLE[narrative.bestPillar]} ranks near the top
              </b>
              , while{" "}
              <b className="font-medium" style={{ color: PILLAR_META[narrative.worstPillar].cssVar }}>
                {PILLAR_TITLE[narrative.worstPillar]} lags the group
              </b>
              .
            </p>
          )}

          <div className="mt-4 space-y-3.5">
            {(Object.entries(peer.perPillarRank) as [PillarKey, { rank: number; outOf: number }][]).map(
              ([pillar, r]) => {
                const meta = PILLAR_META[pillar];
                const pos = r.outOf > 1 ? ((r.outOf - r.rank) / (r.outOf - 1)) * 100 : 50;
                return (
                  <div key={pillar}>
                    <div className="mb-1.5 flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-2">
                        <span className={cn("h-1.5 w-1.5 rounded-sm", meta.dot)} />
                        {meta.label}
                      </span>
                      <span className="num font-medium">#{r.rank}</span>
                    </div>
                    <div className="relative h-1.5 rounded bg-surface-3">
                      <span
                        className={cn("absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-surface-1", meta.dot)}
                        style={{ left: `calc(${clampPct(pos)}% - 5px)` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
            <div className="flex justify-between text-[9px] text-ink3">
              <span>weakest in group</span>
              <span>strongest</span>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}
