"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { Panel } from "@/components/stock-detail/health/shared";
import { cn } from "@/lib/utils";
import { prepareCensus, accentVars, type PreparedCensus, type Concern } from "@/lib/findings";
import type { UniverseHealthView } from "@/types/universe-view";

type FilterId = "all" | "red_flags" | "ownership" | "fundamentals" | "momentum" | "recovery";
const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "red_flags", label: "Red flags" },
  { id: "ownership", label: "Ownership" },
  { id: "fundamentals", label: "Fundamentals" },
  { id: "momentum", label: "Momentum" },
  { id: "recovery", label: "Constructive" },
];

function flagDescription(key: string): string {
  if (key === "ownership_R1_pledge")
    return "Promoter pledged holding has crossed 50% of their stake, or risen sharply in one quarter — a financing-stress signal that overrides the composite. A hard ownership-quality check.";
  return "An auto-tier red flag that overrides the composite until it clears.";
}

const accentChip = (accent: PreparedCensus["accent"]) => {
  const a = accentVars(accent);
  return { color: a.color, background: a.bg, borderColor: a.bd } as const;
};

function StateChip({ p }: { p: PreparedCensus }) {
  if (p.displayState === "dampened")
    return (
      <span className="num shrink-0 rounded-[5px] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide" style={accentChip(p.accent)}>
        sector-wide
      </span>
    );
  if (p.displayState === "pending_data_integration")
    return (
      <span className="shrink-0 rounded-[5px] border border-dashed border-line2 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-ink3">
        pending feed
      </span>
    );
  return null;
}

// ── red-flag card (real) ───────────────────────────────────────────────────────
function RedFlagCard({ p }: { p: PreparedCensus }) {
  const a = accentVars(p.accent);
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: a.bd,
        borderLeft: `3px solid ${a.color}`,
        background: `linear-gradient(180deg,${a.bg},transparent 70%),var(--surface)`,
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-[9px]" style={{ background: a.bg, color: a.color }}>
          <Icons.warning className="size-4" />
        </span>
        <span className="text-[14px] font-semibold">
          {p.name}
          <span className="num ml-2" style={{ color: a.color }}>
            {p.members.join(", ")}
          </span>
        </span>
        <span
          className="ml-auto shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
          style={accentChip(p.accent)}
        >
          Watch with care
        </span>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink2">{flagDescription(p.key)}</p>
      <p className="mt-2 text-[11.5px] italic text-ink3">
        Reach: {p.reach} ({p.memberCount} of {p.outOf} scored) — {p.reach === "isolated" ? "a single-name concern, not a universe signal." : p.reach === "widespread" ? "a group-wide read, not company-specific." : "a shared cluster worth watching."}
      </p>
    </div>
  );
}

// ── pattern card (renders only when real patterns fire) ───────────────────────
function PatternCard({ p }: { p: PreparedCensus }) {
  const a = accentVars(p.accent);
  return (
    <div
      className="mb-2 rounded-xl border border-line bg-surface-1 p-3.5"
      style={{ borderLeft: `3px solid ${a.color}` }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] font-semibold">{p.name}</span>
        <StateChip p={p} />
        <span className="num ml-auto text-[12px] font-medium" style={{ color: a.color }}>
          {p.memberCount}/{p.outOf}
        </span>
      </div>
      <div className="num mt-2 text-[11.5px] text-ink2">{p.members.join(" · ")}</div>
    </div>
  );
}

function Tier({ title, count, children }: { title: string; count?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="mb-2.5 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink3">
        {title}
        <span className="h-px flex-1 bg-line" />
        {count && <span className="num tracking-normal text-ink2">{count}</span>}
      </h4>
      {children}
    </div>
  );
}

function FeedStatusCard({
  title,
  live,
  dormant,
  total,
  rulesNote,
}: {
  title: string;
  live: number;
  dormant: number;
  total: number;
  rulesNote: string;
}) {
  const allLive = total > 0 && dormant === 0;
  const allDormant = total === 0 || live === 0;
  const tag = allLive
    ? "live"
    : allDormant
    ? "pending feed"
    : `${live} live · ${dormant} pending`;
  const desc = allLive
    ? `Feed active across all ${total} scored names. ${rulesNote}`
    : allDormant
    ? `Feed not yet active. ${rulesNote}`
    : `Feed active for ${live} of ${total} names — ${dormant} on pre-activation snapshots, self-heal on next rescore. ${rulesNote}`;
  return (
    <div className={cn("mb-2.5 rounded-xl border p-3.5", allDormant ? "border-dashed border-line2" : "border-line bg-surface-1")}>
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] font-medium text-ink2">{title}</span>
        <span className="ml-auto rounded-[5px] border border-line2 px-2 py-0.5 text-[9px] uppercase tracking-wide text-ink3">
          {tag}
        </span>
      </div>
      <p className="mt-1.5 text-[11.5px] text-ink3">{desc}</p>
    </div>
  );
}

// ── threshold watch: band-edge proximity ─────────────────────────────────────
// Canonical band edges from label.ts (lower-bound-inclusive):
// <55 Fragile | [55,62) Below Par | [62,68) Steady | [68,74) Healthy | ≥74 Pristine
const BAND_EDGES: Record<string, { lower: number; upper: number; nextDown: string; nextUp: string }> = {
  fragile:   { lower: -Infinity, upper: 55,       nextDown: "—",         nextUp: "Below par" },
  below_par: { lower: 55,        upper: 62,        nextDown: "Fragile",   nextUp: "Steady"    },
  steady:    { lower: 62,        upper: 68,        nextDown: "Below par", nextUp: "Healthy"   },
  healthy:   { lower: 68,        upper: 74,        nextDown: "Steady",    nextUp: "Pristine"  },
  pristine:  { lower: 74,        upper: Infinity,  nextDown: "Healthy",   nextUp: "—"         },
};

type EdgeWatcher = { symbol: string; composite: number; gap: number; direction: "down" | "up"; toBand: string };

function ThresholdWatchSection({ atRisk, approaching }: { atRisk: EdgeWatcher[]; approaching: EdgeWatcher[] }) {
  if (atRisk.length === 0 && approaching.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface-1 px-4 py-5 text-center text-[12px] text-ink3">
        Nothing approaching a band edge within 3 pts this snapshot.
      </div>
    );
  }
  const WatchRow = ({ w }: { w: EdgeWatcher }) => (
    <div className="flex items-baseline gap-2 py-2 text-[12px]">
      <span className="num w-20 shrink-0 font-medium text-ink">{w.symbol}</span>
      <span className="num text-ink2">{w.composite.toFixed(1)}</span>
      <span className="ml-auto text-right text-[11.5px] text-ink3">
        {w.gap.toFixed(1)} pt{w.gap.toFixed(1) !== "1.0" ? "s" : ""}{" "}
        {w.direction === "down" ? `above ${w.toBand} floor` : `below ${w.toBand} floor`}
      </span>
    </div>
  );
  return (
    <div className="flex flex-col gap-3">
      {atRisk.length > 0 && (
        <div>
          <div className="mb-1.5 text-[10px] uppercase tracking-wide text-ink3">Near dropping a band</div>
          <div className="divide-y divide-line rounded-xl border border-line bg-surface-1 px-3">
            {atRisk.map((w) => <WatchRow key={w.symbol + "d"} w={w} />)}
          </div>
        </div>
      )}
      {approaching.length > 0 && (
        <div>
          <div className="mb-1.5 text-[10px] uppercase tracking-wide text-ink3">Near rising a band</div>
          <div className="divide-y divide-line rounded-xl border border-line bg-surface-1 px-3">
            {approaching.map((w) => <WatchRow key={w.symbol + "u"} w={w} />)}
          </div>
        </div>
      )}
      <p className="text-[11px] italic text-ink3">
        Band-edge proximity only — derived from composite vs canonical thresholds (55 / 62 / 68 / 74).
        Flag-trigger proximity (e.g. pledge ratio approaching R1) requires per-stock detail not yet in the universe contract.
      </p>
    </div>
  );
}

// ── side summary ───────────────────────────────────────────────────────────────
function DistroRow({ label, n, max, color }: { label: string; n: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[12px]" title={`${label}: ${n} member-instance${n === 1 ? "" : "s"}`}>
      <span className="w-[120px] shrink-0 text-ink2">{label}</span>
      <span className="h-[7px] flex-1 overflow-hidden rounded-[4px] bg-surface-3">
        <span className="block h-full rounded-[4px]" style={{ width: `${max ? (n / max) * 100 : 0}%`, background: color }} />
      </span>
      <span className="num w-6 shrink-0 text-right text-[11.5px] text-ink2">{n}</span>
    </div>
  );
}

export function FlagsTab({ view }: { view: UniverseHealthView }) {
  const [filter, setFilter] = useState<FilterId>("all");

  // Shared read-layer: A→I order, C-family consolidated, shared accent + display names —
  // identical to the stock §5 and PG pathology surfaces. The board then facets by concern.
  const prepared = useMemo(() => prepareCensus(view.pathology), [view.pathology]);
  const redFlags = useMemo(() => prepared.filter((p) => p.kind === "red_flag"), [prepared]);
  const patterns = useMemo(() => prepared.filter((p) => p.kind === "pattern"), [prepared]);

  const matches = (p: PreparedCensus) => {
    switch (filter) {
      case "all":
        return true;
      case "red_flags":
        return p.kind === "red_flag";
      case "ownership":
        return p.concern === "ownership";
      case "fundamentals":
        return p.concern === "fundamentals";
      case "momentum":
        return p.concern === "momentum";
      case "recovery":
        return p.accent === "rec";
      default:
        return true;
    }
  };

  const cCounts = useMemo(() => {
    let live = 0, dormant = 0;
    for (const m of view.members) {
      const s = m.flowCategoryStates?.C_insider;
      if (s === "scored") live++;
      else if (s) dormant++;
    }
    return { live, dormant, total: live + dormant };
  }, [view.members]);

  const dCounts = useMemo(() => {
    let live = 0, dormant = 0;
    for (const m of view.members) {
      const s = m.flowCategoryStates?.D_block;
      if (s === "scored") live++;
      else if (s) dormant++;
    }
    return { live, dormant, total: live + dormant };
  }, [view.members]);

  const edgeWatchers = useMemo(() => {
    const THRESHOLD = 3;
    const atRisk: EdgeWatcher[] = [];
    const approaching: EdgeWatcher[] = [];
    for (const m of view.members) {
      if (m.firedFlags.length > 0) continue; // already flagged — not a "near edge" candidate
      const e = BAND_EDGES[m.labelBand];
      if (!e) continue;
      if (isFinite(e.lower)) {
        const gap = m.composite - e.lower;
        if (gap >= 0 && gap <= THRESHOLD) {
          atRisk.push({ symbol: m.symbol, composite: m.composite, gap, direction: "down", toBand: e.nextDown });
        }
      }
      if (isFinite(e.upper)) {
        const gap = e.upper - m.composite;
        if (gap >= 0 && gap <= THRESHOLD) {
          approaching.push({ symbol: m.symbol, composite: m.composite, gap, direction: "up", toBand: e.nextUp });
        }
      }
    }
    atRisk.sort((a, b) => a.gap - b.gap);
    approaching.sort((a, b) => a.gap - b.gap);
    return { atRisk: atRisk.slice(0, 6), approaching: approaching.slice(0, 6) };
  }, [view.members]);

  const shownFlags = redFlags.filter(matches);
  const patternsByConcern: Record<Concern, PreparedCensus[]> = {
    ownership: [],
    fundamentals: [],
    momentum: [],
    other: [],
  };
  for (const p of patterns.filter(matches)) patternsByConcern[p.concern].push(p);
  // Count only the three displayed concern tiers (File 2 §5 — the structural divergence/
  // trajectory/composition cards are a stock-§5 / Briefing concern, not the warnings console).
  const matchedPatternCount =
    patternsByConcern.ownership.length + patternsByConcern.fundamentals.length + patternsByConcern.momentum.length;

  // by-severity counts (over the shared accent map — crit / high / everything-else)
  const sevCounts = { critical: 0, high: 0, other: 0 };
  for (const p of prepared) {
    if (p.accent === "crit") sevCounts.critical += p.memberCount;
    else if (p.accent === "high") sevCounts.high += p.memberCount;
    else sevCounts.other += p.memberCount;
  }
  const sevMax = Math.max(sevCounts.critical, sevCounts.high, sevCounts.other, 1);

  const concernCounts: Record<Concern, number> = { ownership: 0, fundamentals: 0, momentum: 0, other: 0 };
  for (const p of prepared) concernCounts[p.concern] += p.memberCount;
  const concernMax = Math.max(...Object.values(concernCounts), 1);

  return (
    <Reveal>
      {/* header */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="eyebrow shrink-0">Warnings console</span>
        <span className="h-px flex-1 bg-line" />
        <span className="shrink-0 rounded-full border border-line2 bg-surface-2 px-2.5 py-0.5 text-[11px] text-ink2">
          across the scored universe · {view.scoredUniverseSize} names
        </span>
      </div>

      {/* filters (functional) */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-[12px] transition-colors",
              filter === f.id
                ? "border-line3 bg-surface-3 font-medium text-ink"
                : "border-line2 bg-surface-1 text-ink2 hover:border-line3 hover:text-ink",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3.5">
        {/* main column */}
        <div className="col-span-12 lg:col-span-8">
          <Tier title="Critical · Watch with care" count={`${shownFlags.length} firing`}>
            {shownFlags.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {shownFlags.map((p) => (
                  <RedFlagCard key={p.key} p={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-surface-1 px-4 py-6 text-center text-[12px] text-ink3">
                No red flags in this view.
              </div>
            )}
          </Tier>

          <Tier title="Patterns" count={`${matchedPatternCount} firing`}>
            {(["ownership", "fundamentals", "momentum"] as Concern[]).map((c) => (
              <div key={c} className="mb-4">
                <div className="mb-1.5 flex items-center gap-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink3">{c} patterns</span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="num text-[10px] tracking-normal text-ink3">{patternsByConcern[c].length} firing</span>
                </div>
                {patternsByConcern[c].length > 0 ? (
                  patternsByConcern[c].map((p) => <PatternCard key={p.key} p={p} />)
                ) : (
                  <div className="rounded-lg border border-line bg-surface-1 px-3 py-2.5 text-[11.5px] text-ink3">
                    No {c} patterns this snapshot.
                  </div>
                )}
              </div>
            ))}
            {matchedPatternCount === 0 && (
              <p className="mt-0.5 text-[11px] italic text-ink3">
                Pattern engine is live — all three categories quiet this snapshot.
              </p>
            )}
          </Tier>

          <Tier title="Threshold watch · Near a band edge">
            <ThresholdWatchSection
              atRisk={edgeWatchers.atRisk}
              approaching={edgeWatchers.approaching}
            />
          </Tier>

          <Tier title="Ownership feed status">
            <FeedStatusCard
              title="C · Insider-trade activity"
              live={cCounts.live}
              dormant={cCounts.dormant}
              total={cCounts.total}
              rulesNote="Scores C1 cluster-buy, C2 cluster-sell, and C3 sub-cluster signals from NSE PIT insider disclosures."
            />
            <FeedStatusCard
              title="D · Block-deal flow"
              live={dCounts.live}
              dormant={dCounts.dormant}
              total={dCounts.total}
              rulesNote="Scores net block-deal activity against market-cap — drives the promoter-defense signal."
            />
          </Tier>
        </div>

        {/* side summary */}
        <div className="col-span-12 flex flex-col gap-3.5 lg:col-span-4">
          <Panel>
            <div className="mb-3 eyebrow">By severity</div>
            <div className="flex flex-col gap-2.5">
              <DistroRow label="Critical" n={sevCounts.critical} max={sevMax} color="var(--crit)" />
              <DistroRow label="High" n={sevCounts.high} max={sevMax} color="var(--high)" />
              <DistroRow label="Other" n={sevCounts.other} max={sevMax} color="var(--ink3)" />
            </div>
          </Panel>
          <Panel>
            <div className="mb-3 eyebrow">By concern</div>
            <div className="flex flex-col gap-2.5">
              <DistroRow label="Ownership" n={concernCounts.ownership} max={concernMax} color="var(--p-own)" />
              <DistroRow label="Momentum" n={concernCounts.momentum} max={concernMax} color="var(--p-mom)" />
              <DistroRow label="Fundamentals" n={concernCounts.fundamentals} max={concernMax} color="var(--p-found)" />
            </div>
          </Panel>
        </div>
      </div>
    </Reveal>
  );
}
