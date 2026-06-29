"use client";

// §2 · METRIC MODAL — the EVIDENCE behind the three lenses for one metric. It never
// repeats the row (value/score/bar/chips/pattern); it shows the proof: the score
// ladder (L1), the own-history trajectory (L3, held-aware), and the peer field (L2).
// History only — no projection anywhere. Honest-empty in any block renders that block's
// missing state, never a fabricated chart.

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { MetricView, MetricBand, PeerDistribution } from "@/types/health";
import { getMetricLabel } from "@/lib/health/metric-labels";
import {
  BandLadder,
  HeldAwareLine,
  LensPatternPill,
  MetricStateChip,
  clampPct,
} from "./shared";

const BAND_TITLE: Record<MetricBand, string> = {
  excellent: "Excellent",
  good: "Good",
  acceptable: "Acceptable",
  concerning: "Concerning",
  distress: "Distress",
};

/** "18.4 lands in Good — above 16.0, below Excellent's 22.0" from the ladder + raw. */
function landsInSentence(m: MetricView): string | null {
  const l = m.bandLadder;
  if (!l || l.activeBand == null || m.rawValue == null) return null;
  const hb = l.direction === "higher_better";
  const raw = m.rawValue.toFixed(2);
  const band = BAND_TITLE[l.activeBand];
  switch (l.activeBand) {
    case "excellent":
      return `${raw} lands in Excellent — ${hb ? "at or above" : "at or below"} ${l.excellent.toFixed(2)}, the top of the scale.`;
    case "good":
      return `${raw} lands in Good — ${hb ? "above" : "below"} ${l.good.toFixed(2)}, ${hb ? "below" : "above"} Excellent's ${l.excellent.toFixed(2)}.`;
    case "acceptable":
      return `${raw} lands in Acceptable — ${hb ? "above" : "below"} ${l.acceptable.toFixed(2)}, ${hb ? "below" : "above"} Good's ${l.good.toFixed(2)}.`;
    case "concerning":
      return `${raw} lands in Concerning — ${hb ? "above" : "below"} ${l.concerning.toFixed(2)}, ${hb ? "below" : "above"} Acceptable's ${l.acceptable.toFixed(2)}.`;
    case "distress":
      return `${raw} lands in Distress — ${hb ? "below" : "above"} the Concerning bar of ${l.concerning.toFixed(2)}.`;
    default:
      return `${raw} lands in ${band}.`;
  }
}

function Block({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-surface-3 text-[9px] font-semibold text-ink2">{n}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink3">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── Block 3 · peer field (L2 visual) ──────────────────────────────────────────────
function PeerFieldViz({ pd }: { pd: PeerDistribution }) {
  const vals = pd.members.map((m) => m.value);
  const lo = Math.min(...vals, pd.mean);
  const hi = Math.max(...vals, pd.mean);
  const span = hi - lo || 1;
  const pad = span * 0.1;
  const mn = lo - pad;
  const mx = hi + pad;
  const x = (v: number) => 20 + (clampPct(((v - mn) / (mx - mn)) * 100) / 100) * 460;
  const f2 = (v: number) => v.toFixed(2);
  return (
    <div>
      <svg viewBox="0 0 500 78" className="block h-auto w-full">
        {/* baseline */}
        <line x1={20} y1={46} x2={480} y2={46} stroke="var(--line2)" strokeWidth={1} />
        {/* mean marker */}
        <line x1={x(pd.mean)} y1={20} x2={x(pd.mean)} y2={52} stroke="var(--ink3)" strokeWidth={1} strokeDasharray="3 3" />
        <text x={x(pd.mean)} y={14} textAnchor="middle" className="num" style={{ fill: "var(--ink3)", fontSize: 9 }}>
          field μ {f2(pd.mean)}
        </text>
        {/* peer members */}
        {pd.members.filter((m) => !m.isSelf).map((m, i) => (
          <circle key={`${m.symbol}-${i}`} cx={x(m.value)} cy={46} r={4} fill="var(--ctx)" opacity={0.6} />
        ))}
        {/* this stock */}
        <circle cx={x(pd.selfValue)} cy={46} r={7} fill="var(--accent)" stroke="var(--ink)" strokeWidth={2} />
        <text x={x(pd.selfValue)} y={70} textAnchor="middle" className="num" style={{ fill: "var(--ink)", fontSize: 10, fontWeight: 600 }}>
          {f2(pd.selfValue)}
        </text>
      </svg>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="text-ink2">
          Ranks <b className="font-semibold text-ink">{pd.rank}</b>
          <span className="text-ink3"> of {pd.outOf}</span> in the field
        </span>
        {!pd.usable && (
          <span className="text-[10.5px] italic text-ink3">field-verdict withheld — only {pd.members.length} peers</span>
        )}
      </div>
    </div>
  );
}

export function MetricModal({ m, pillarLabel, children }: { m: MetricView; pillarLabel: string; children: React.ReactNode }) {
  const meta = getMetricLabel(m.metricKey);
  const lands = landsInSentence(m);
  const l3 = m.lens?.l3;
  const l3Evaluable = Boolean(l3?.evaluable && l3.series.length >= 2);
  const bp = m.barProvenance;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl gap-0 border-line bg-surface-1 p-0 text-ink">
        {/* header */}
        <div className="border-b border-line px-5 py-4">
          <DialogTitle asChild>
            <h3 className="flex items-baseline gap-2 text-[15px] font-semibold text-ink">
              {meta.label}
              <span className="num text-[10px] uppercase tracking-wider text-ink3">{m.metricKey}</span>
            </h3>
          </DialogTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink3">
            <span>{pillarLabel}</span>
            {m.metricState !== "scored" && <MetricStateChip state={m.metricState} />}
            {m.lensPattern && (
              <LensPatternPill
                label={m.lensPattern.label}
                tone={m.lensPattern.tone}
                fieldVerdict={m.lensPattern.fieldVerdict}
                role={m.lensPattern.role}
              />
            )}
          </div>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {/* ── Block 1 · score ladder (lead) ── */}
          <Block n={1} title="Score ladder — value vs the bar">
            {m.bandLadder ? (
              <div className="space-y-2.5">
                {lands && <p className="text-[12.5px] leading-relaxed text-ink2">{lands}</p>}
                <BandLadder ladder={m.bandLadder} rawValue={m.rawValue} />
                <p className="text-[10.5px] leading-relaxed text-ink3">
                  Thresholds derived from this peer group&rsquo;s distribution — not assumed.
                  {bp ? ` Recalibrated ${bp.recalibratedAt}.` : ""}
                  {bp?.inheritedFromPeerGroupId ? " Bars inherited from the parent peer group." : ""}
                </p>
              </div>
            ) : (
              <p className="text-[12px] italic text-ink3">No bar set for this metric — it can&rsquo;t be placed on an absolute scale.</p>
            )}
          </Block>

          {/* ── Block 2 · trajectory (L3, held-aware) ── */}
          <Block n={2} title="Trajectory — its own history">
            {l3Evaluable && l3 ? (
              <div>
                <div className="mb-1.5 flex items-center gap-2 text-[11.5px] text-ink2">
                  Own-history trend:
                  <span className="font-semibold capitalize text-ink">{l3.state.replace("_", " ")}</span>
                </div>
                <HeldAwareLine
                  points={l3.series.map((p) => ({ value: p.rawValue }))}
                  color="var(--p-mom)"
                  width={460}
                  height={96}
                  refValue={l3.referenceValue}
                  refLabel="own-history μ"
                />
                <p className="mt-1 text-[10.5px] text-ink3">{l3.series.length} quarters of reported history — no projection, history only.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-line2 bg-surface-2 px-4 py-5 text-center">
                <p className="text-[12px] font-medium text-ink2">Building history</p>
                <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-ink3">
                  Not enough reported own-history yet to read a trend
                  {m.l3WindowN != null ? ` (${m.l3WindowN} ${m.l3WindowN === 1 ? "quarter" : "quarters"} so far)` : ""}.
                  This becomes a real trajectory as history accrues — nothing is assumed in the meantime.
                </p>
              </div>
            )}
          </Block>

          {/* ── Block 3 · peer field (L2 visual) ── */}
          <Block n={3} title="Peer field — vs the only fair comparison">
            {m.peerDistribution && m.peerDistribution.members.length >= 2 ? (
              <PeerFieldViz pd={m.peerDistribution} />
            ) : (
              <p className="text-[12px] italic text-ink3">
                Peer field not available for this metric — too few peers scored it to draw a distribution.
              </p>
            )}
          </Block>
        </div>
      </DialogContent>
    </Dialog>
  );
}
