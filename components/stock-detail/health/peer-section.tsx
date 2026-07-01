"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import type { IdentitySection, VerdictSection, PeerStandingSection, PillarKey, PillarView } from "@/types/health";
import { SectionEyebrow, Panel, PILLAR_META, clampPct, fmt, lensAccentKey, lensAccentVars } from "./shared";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/ui/chart-tooltip";
import { rankNarrative, PILLAR_TITLE } from "./diagnosis";
import { getMetricLabel } from "@/lib/health/metric-labels";

// ── §3 · the FIELD half of the lens story — one line, only when a field-verdict is
//    active: a pillar-level LP2/LP3 (preferred, broadest), or a notable metric-level
//    LM3/LM4. It states whether the stock leads/trails the field AND what that says
//    about the FIELD — context, never a stock pass/fail (§0.2). ──────────────────────
function fieldRead(pillars: PillarView[]): { text: string; tone: string; fieldVerdict: string | null } | null {
  // 1) Pillar-wide field-verdict (LP2 field-lifted / LP3 elite-field).
  for (const pillar of ["foundation", "momentum"] as PillarKey[]) {
    const p = pillars.find((x) => x.pillar === pillar);
    const lp = p?.lensPillarPatterns?.find((x) => x.fieldVerdict != null);
    if (!lp) continue;
    const name = PILLAR_TITLE[pillar];
    if (lp.fieldVerdict === "PG_WEAK")
      return { text: lp.verdict ?? `Leads the field — but the field is weak on ${name} right now. Its relative strength is the pond being low, not the stock being strong.`, tone: lp.tone, fieldVerdict: lp.fieldVerdict };
    return { text: lp.verdict ?? `Trails the field — but this is an exceptional peer group on ${name}. The stock lags an elite field, not a weak one.`, tone: lp.tone, fieldVerdict: lp.fieldVerdict };
  }
  // 2) A notable (top-level) metric-level field-verdict (LM3 weak-field / LM4 elite-field).
  for (const pillar of ["foundation", "momentum"] as PillarKey[]) {
    const p = pillars.find((x) => x.pillar === pillar);
    const mt = p?.metrics?.find((m) => m.lensPattern?.fieldVerdict != null && m.lensPattern.role === "top_level");
    if (!mt || !mt.lensPattern) continue;
    const label = getMetricLabel(mt.metricKey).label;
    if (mt.lensPattern.fieldVerdict === "PG_WEAK")
      return { text: mt.lensPattern.verdict ?? `Leads the field on ${label} despite sitting below its bar — the field is weak there, not uniquely this stock.`, tone: mt.lensPattern.tone, fieldVerdict: mt.lensPattern.fieldVerdict };
    return { text: mt.lensPattern.verdict ?? `Trails the field on ${label} despite clearing its bar — an elite field on that metric, not a weak stock.`, tone: mt.lensPattern.tone, fieldVerdict: mt.lensPattern.fieldVerdict };
  }
  return null;
}

function FieldReadLine({ pillars }: { pillars: PillarView[] }) {
  const read = fieldRead(pillars);
  if (!read) return null;
  const v = lensAccentVars(lensAccentKey(read.tone, read.fieldVerdict));
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px] leading-relaxed" style={{ borderColor: v.bd, background: v.bg, color: "var(--ink2)" }}>
      <Icons.compare weight="duotone" className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: v.color }} />
      <span>{read.text}</span>
    </div>
  );
}

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
  pillars,
}: {
  identity: IdentitySection;
  verdict: VerdictSection;
  peer: PeerStandingSection;
  pillars: PillarView[];
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
      <FieldReadLine pillars={pillars} />
      <Panel className="grid gap-7 lg:grid-cols-[1.5fr_1fr]">
        {/* ── distribution + neighbours ── */}
        <div>
          <div className="kicker mb-3">Where it sits — by composite</div>
          {/* Fixed-height wrapper: dots + labels render as HTML overlays (not SVG-scaled),
              so they stay perfectly round and legibly sized regardless of container width —
              an SVG stretched to a narrow mobile width would otherwise shrink both together. */}
          <div ref={chartRef} className="relative h-28 sm:h-24">
            <ChartTooltip tip={tip} />
            <svg viewBox="0 0 1000 92" preserveAspectRatio="none" className="absolute inset-0 block h-full w-full">
              {/* band separators within domain */}
              {BAND_CUTS.filter((b) => b.v > lo && b.v < hi).map((b) => (
                <line
                  key={b.v}
                  x1={x(b.v)}
                  y1={18}
                  x2={x(b.v)}
                  y2={56}
                  stroke={b.cssVar}
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  opacity={0.4}
                />
              ))}
              {/* baseline */}
              <line x1={24} y1={44} x2={976} y2={44} stroke="var(--line2)" strokeWidth={1} />
            </svg>

            {/* band-cut number labels */}
            {BAND_CUTS.filter((b) => b.v > lo && b.v < hi).map((b) => (
              <span
                key={b.v}
                className="num absolute top-0 -translate-x-1/2 text-[11px] sm:text-[10.5px]"
                style={{ left: `${x(b.v) / 10}%`, color: b.cssVar }}
              >
                {b.label}
              </span>
            ))}

            {/* neighbours */}
            {above && (
              <div
                className="absolute top-[47.8%] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full opacity-75"
                style={{ left: `${x(above.composite) / 10}%`, width: 12, height: 12, background: compositeColour(above.composite) }}
                onMouseMove={(e) => show(e, <TipBody title={above.symbol} rows={[{ label: "Composite", value: fmt(above.composite) }, { label: "vs this stock", value: "just above" }]} />)}
                onMouseLeave={hide}
              />
            )}
            {below && (
              <div
                className="absolute top-[47.8%] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full opacity-75"
                style={{ left: `${x(below.composite) / 10}%`, width: 12, height: 12, background: compositeColour(below.composite) }}
                onMouseMove={(e) => show(e, <TipBody title={below.symbol} rows={[{ label: "Composite", value: fmt(below.composite) }, { label: "vs this stock", value: "just below" }]} />)}
                onMouseLeave={hide}
              />
            )}

            {/* me */}
            <div
              className="absolute top-[47.8%] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2"
              style={{
                left: `${x(me) / 10}%`,
                width: 20,
                height: 20,
                background: compositeColour(me),
                borderColor: "var(--ink)",
              }}
              onMouseMove={(e) => show(e, <TipBody title={identity.symbol} rows={[{ label: "Composite", value: fmt(me) }, { label: "Rank", value: `#${peer.rank} of ${peer.memberCount}` }, { label: "Percentile", value: `${peer.percentile.toFixed(0)}th` }]} />)}
              onMouseLeave={hide}
            />
            <div
              className="num pointer-events-none absolute top-[80%] -translate-x-1/2 whitespace-nowrap text-[13px] font-semibold sm:text-[13.5px]"
              style={{ left: `${x(me) / 10}%`, color: "var(--ink)" }}
            >
              {identity.symbol} · {fmt(me)}
            </div>
            <div
              className="num pointer-events-none absolute top-[97%] -translate-x-1/2 whitespace-nowrap text-[11px] sm:text-[11.5px]"
              style={{ left: `${x(me) / 10}%`, color: "var(--ink3)" }}
            >
              #{peer.rank} of {peer.memberCount}
            </div>
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
                        className={cn("absolute inset-y-0 left-0 rounded", meta.dot)}
                        style={{ width: `${clampPct(pos)}%` }}
                      />
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
