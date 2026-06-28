"use client";

/**
 * §4 — Competitive Standing block. DISCIPLINE A — built VERBATIM to
 * `Vytal_Overview_Competitive_Standing_Spec_v1.md` + the 3 mandatory recon corrections.
 * This is a pure projection of already-derived /health signals — it computes nothing,
 * generates NO AI free-text. Deterministic template assembly only.
 *
 * Two states, decided by ONE check — is a live Critical Red Flag (R1–R6) present?
 *   • CAUTION  — reuse the §5 findings module (verdict + doesntMean verbatim), render a
 *     "Watch With Care" strip, SUPPRESS strengths, funnel to Health §5. Stop.
 *   • STANDING — deterministic synthesis line (priority table §3, plain-word pillar map)
 *     + 2–3 top-quartile chips (§4) + the §5 doesntMean line + funnel.
 *
 * The 3 corrections (mandatory):
 *   1. Top-quartile test = l2Score > 67.4 (0–100). sampleN===4 edge (l2Score null) →
 *      fall back to l1Band === "excellent".
 *   2. Chip floor = peer.sampleN >= 4 (NOT peer.usable, which means ≥5).
 *   3. Solo-PG guard — peerStanding present but memberCount <= 1 → no real peer
 *      comparison → fall to Priority 6 (mid-pack); never crown a solo stock.
 * Market is NEVER featured (no chip, never the lead pillar). Sector-class switch on
 * Foundation floor chips. Mask caveat only on the price-linked Priority-1 clause.
 */

import { Icons } from "@/lib/icons";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import type { HealthSnapshotView, PillarKey, PillarView, MetricView, SectorClass } from "@/types/health";
import { prepareStockFindings, accentVars } from "@/lib/findings";
import { getMetricLabel } from "@/lib/health/metric-labels";
import { Panel, PILLAR_META } from "../health/shared";
import { Section, Chip, HonestEmpty, LoadingBlock, Funnel } from "./shared";

const TOP_QUARTILE_L2 = 67.4; // correction 1 — l2Score is 0–100
const CHIP_SAMPLE_FLOOR = 4; // correction 2 — peer.sampleN >= 4 (not peer.usable)

const DOESNT_MEAN =
  "Standing within its peer group — a selection and quality read, not a signal it will outperform.";
const CAUTION_STRENGTHS_NOTE =
  "This company has strengths — see the full health breakdown — but a critical flag takes priority here.";
const MASK_CAVEAT = "— the pond is hot, so price-linked reads may be deferred.";

// Plain-word pillar map (display only — never expose pillar jargon on Overview).
// Market is intentionally absent: it is never featured as a standing strength.
function pillarPlainWord(pillar: PillarKey, foundationIsCapitalEff: boolean): string {
  switch (pillar) {
    case "foundation":
      return foundationIsCapitalEff ? "capital efficiency" : "financial strength";
    case "momentum":
      return "improving fundamentals";
    case "ownership":
      return "institutional backing";
    default:
      return "";
  }
}

interface Strength {
  pillar: PillarKey;
  metricKey: string;
  label: string;
  l2: number | null;
}

/** A metric sits top-quartile-within-PG (correction 1) on a fair base (correction 2). */
function isTopQuartile(m: MetricView): boolean {
  if (!m.peer || m.peer.sampleN < CHIP_SAMPLE_FLOOR) return false; // correction 2 floor
  if (m.l2Score != null) return m.l2Score > TOP_QUARTILE_L2; // correction 1
  return m.peer.sampleN === 4 && m.l1Band === "excellent"; // correction 1 sampleN===4 edge
}

// Foundation "floor" metrics where the sector-class switch governs the wording
// (leverage / capital adequacy). Non-financial D/E (F4) + banking capital (Tier1/CET1).
const FLOOR_METRICS = new Set(["F4", "Tier1", "CET1"]);

function sectorBucket(sc: SectorClass): "cyclical" | "quality" | "neutral" {
  if (sc === "Commodity" || sc === "Cyclical" || sc === "PSU") return "cyclical";
  if (sc === "Quality" || sc === "Defensive") return "quality";
  return "neutral";
}

/** Chip copy — peer-relative fact, neutral-toned. Foundation floor chips switch wording
 *  by sector-class (Commodity/Cyclical/PSU → "solvent through the cycle", never calm/safe;
 *  Quality/Defensive → "structural strength"). */
function chipText(s: Strength, sc: SectorClass): string {
  if (s.pillar === "foundation" && FLOOR_METRICS.has(s.metricKey)) {
    const bucket = sectorBucket(sc);
    if (bucket === "cyclical") return `Solvent through the cycle — top-quartile ${s.label} in peer group`;
    if (bucket === "quality") return `Structural strength — top-quartile ${s.label} in peer group`;
  }
  return `Top-quartile ${s.label} in peer group`;
}

/** Select 2–3 strength chips: top-quartile-within-PG metrics, ordered by pillar weight
 *  (Foundation → Momentum). Market is never a chip; Ownership has no metric-level l2Score,
 *  so it produces no metric chip (we never fabricate one). */
function selectStrengths(pillars: PillarView[]): Strength[] {
  const order: PillarKey[] = ["foundation", "momentum"];
  const out: Strength[] = [];
  for (const key of order) {
    const p = pillars.find((x) => x.pillar === key);
    if (!p?.metrics) continue;
    const picks = p.metrics
      .filter(isTopQuartile)
      .sort((a, b) => (b.l2Score ?? 0) - (a.l2Score ?? 0))
      .map((m) => ({ pillar: key, metricKey: m.metricKey, label: getMetricLabel(m.metricKey).label, l2: m.l2Score }));
    out.push(...picks);
  }
  return out.slice(0, 3);
}

interface Synthesis {
  text: string;
  maskCaveat: boolean;
}

/** Deterministic synthesis line (spec §3 priority table). Pure template selection,
 *  first qualifying priority wins. NO model text. */
function buildSynthesis(health: HealthSnapshotView, strengths: Strength[]): Synthesis {
  const ps = health.peerStanding;
  const pillars = health.pillars;
  const byKey = new Map(pillars.map((p) => [p.pillar, p] as const));
  const zone = (k: PillarKey) => byKey.get(k)?.nativeZone.position ?? null;
  const isStrong = (k: PillarKey) => zone(k) === "above_native";

  // Correction 3 — solo-PG guard: peerStanding present but memberCount <= 1 → no real
  // peer comparison → fall to Priority 6, never crown a solo stock.
  const hasPeers = !!ps && ps.memberCount > 1;

  // leading non-market pillar = best per-pillar rank (tie-break by weight order).
  const weightOrder: PillarKey[] = ["foundation", "momentum", "ownership"];
  let leadPillar: PillarKey = "foundation";
  if (ps) {
    let best = Infinity;
    for (const k of weightOrder) {
      const r = ps.perPillarRank[k]?.rank;
      if (r != null && r < best) {
        best = r;
        leadPillar = k;
      }
    }
  }
  const foundationIsCapEff = strengths.some((s) => s.pillar === "foundation" && (s.metricKey === "F1" || s.metricKey === "F2"));
  const rankClause = ps
    ? `ranks #${ps.perPillarRank[leadPillar]?.rank ?? ps.rank} of ${ps.perPillarRank[leadPillar]?.outOf ?? ps.memberCount} on ${pillarPlainWord(leadPillar, foundationIsCapEff)}`
    : "";
  const floorClause = "its balance-sheet floor holds up better than its rank suggests";

  const aboveAverage = !!ps && ps.percentile > 50;
  const belowAverage = !!ps && ps.percentile < 50;
  const topThree = !!ps && ps.rank <= 3;
  const anyStrong = isStrong("foundation") || isStrong("momentum") || isStrong("ownership");
  const foundationAtLeastMid = zone("foundation") === "in_native" || zone("foundation") === "above_native";
  const recoveryFiring = (health.findings?.patterns ?? []).some((p) => p.patternKey.startsWith("trajectory_D"));
  const pondHot = health.verdict?.pondMask?.isHot ?? false;

  // Priority table §3 — first that qualifies wins. Solo → Priority 6.
  if (hasPeers && recoveryFiring) {
    return { text: `Turning up out of a weak patch, and ${rankClause}.`, maskCaveat: pondHot }; // P1 (price-linked)
  }
  if (hasPeers && topThree && anyStrong) {
    return { text: `One of the stronger names in its peer group — ${rankClause}.`, maskCaveat: false }; // P2
  }
  if (hasPeers && aboveAverage) {
    return { text: `Sits above its peer-group average — ${rankClause}.`, maskCaveat: false }; // P3
  }
  if (hasPeers && belowAverage && foundationAtLeastMid) {
    return { text: `Below its peer-group average, but structurally sound — ${floorClause}.`, maskCaveat: false }; // P4
  }
  if (hasPeers && belowAverage && !foundationAtLeastMid) {
    return { text: "Among the weaker names in its peer group on current health.", maskCaveat: false }; // P5
  }
  return { text: "Sits mid-pack in its peer group — sound but unremarkable.", maskCaveat: false }; // P6
}

// ── CAUTION strip — reuses the §5 findings verdict/doesntMean verbatim ──────────
function CautionStrip({ health, symbol }: { health: HealthSnapshotView; symbol: string }) {
  const critical = (health.findings?.redFlags ?? []).filter((rf) => rf.tier === "auto");
  const prepared = prepareStockFindings(
    { redFlags: critical, patterns: [] },
    { pondHot: health.verdict?.pondMask?.isHot ?? false },
  );
  const lead = prepared.ordered.find((f) => f.kind === "red_flag") ?? prepared.ordered[0];
  if (!lead) return null;
  const a = accentVars(lead.accent);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-1 p-5">
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: a.color }} />
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: a.bg, color: a.color }}>
          <Icons.warning weight="fill" className="h-4 w-4" />
        </span>
        <span className="text-[14px] font-semibold text-ink">{lead.name}</span>
        <span
          className="ml-auto shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: a.color, background: a.bg, borderColor: a.bd }}
        >
          Watch With Care
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink2">{lead.verdict}</p>
      <p className="mt-3 border-l-2 border-line2 pl-3 text-[11.5px] italic text-ink3">{lead.doesntMean}</p>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
        <p className="text-[11.5px] text-ink3">{CAUTION_STRENGTHS_NOTE}</p>
        <Funnel tab="health" symbol={symbol} label="Full health" />
      </div>
    </div>
  );
}

export function StandingSection({ symbol }: { symbol: string }) {
  const { data: health, isLoading } = useStockHealth(symbol);

  if (isLoading) {
    return (
      <Section id="overview-standing" label="Competitive standing" icon={Icons.shield} accent="var(--p-mom)">
        <LoadingBlock className="h-40" />
      </Section>
    );
  }

  // Gate on scoring status (spec §7) — never fabricate a rank for an unscored stock.
  if (!health?.scored || !health.verdict) {
    return (
      <Section id="overview-standing" label="Competitive standing" icon={Icons.shield} accent="var(--p-mom)">
        <HonestEmpty>Health standing not yet available for this stock.</HonestEmpty>
      </Section>
    );
  }

  // The branch: is a live Critical Red Flag (R1–R6, tier==="auto") present?
  const hasCriticalFlag = (health.findings?.redFlags ?? []).some((rf) => rf.tier === "auto");

  if (hasCriticalFlag) {
    return (
      <Section id="overview-standing" label="Competitive standing" icon={Icons.shield} accent="var(--p-mom)">
        <CautionStrip health={health} symbol={symbol} />
      </Section>
    );
  }

  // STANDING state — deterministic synthesis + chips + doesntMean + funnel.
  const strengths = selectStrengths(health.pillars);
  const synth = buildSynthesis(health, strengths);
  const sc = health.identity.sectorClass;

  return (
    <Section id="overview-standing" label="Competitive standing" icon={Icons.shield} accent="var(--p-mom)">
      <Panel>
        {/* Synthesis line leads */}
        <p className="font-display text-[16px] leading-relaxed text-ink">
          {synth.text}
          {synth.maskCaveat && <span className="text-ink3"> {MASK_CAVEAT}</span>}
        </p>

        {/* 2–3 supporting strength chips (dropped entirely when none qualify) */}
        {strengths.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {strengths.map((s) => (
              <Chip key={`${s.pillar}-${s.metricKey}`} tone="accent" dot={PILLAR_META[s.pillar].cssVar}>
                {chipText(s, sc)}
              </Chip>
            ))}
          </div>
        )}

        {/* The doesn't-mean boundary + funnel */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-[11.5px] italic text-ink3">{DOESNT_MEAN}</p>
          <Funnel tab="health" symbol={symbol} label="Full health" />
        </div>
      </Panel>
    </Section>
  );
}
