"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { Panel } from "@/components/stock-detail/health/shared";
import { cn } from "@/lib/utils";
import { flagLabel } from "./lib";
import type { UniverseHealthView } from "@/types/universe-view";
import type { PathologyCensusItem } from "@/types/peer-group";

// ── concern classification from the pathology key ─────────────────────────────
type Concern = "ownership" | "fundamentals" | "momentum" | "other";
function concernOf(key: string): Concern {
  const k = key.toLowerCase();
  if (k.startsWith("ownership")) return "ownership";
  if (k.startsWith("momentum")) return "momentum";
  if (k.startsWith("fundamentals") || k.startsWith("foundation")) return "fundamentals";
  return "other";
}

type FilterId = "all" | "red_flags" | "ownership" | "fundamentals" | "momentum" | "recovery";
const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "red_flags", label: "Red flags" },
  { id: "ownership", label: "Ownership" },
  { id: "fundamentals", label: "Fundamentals" },
  { id: "momentum", label: "Momentum" },
  { id: "recovery", label: "Constructive" },
];

function severityTone(sev: string | null): { color: string; bg: string; bd: string } {
  const s = (sev ?? "").toLowerCase();
  if (s === "critical") return { color: "var(--crit)", bg: "var(--crit-bg)", bd: "var(--crit-bd)" };
  if (s === "high") return { color: "var(--high)", bg: "var(--high-bg)", bd: "var(--high-bd)" };
  return { color: "var(--ink3)", bg: "var(--surface3)", bd: "var(--line2)" };
}

function flagDescription(key: string): string {
  if (key === "ownership_R1_pledge")
    return "Promoter pledged holding is rising — a financing-stress signal that overrides the composite. A hard ownership-quality check.";
  return "An auto-tier red flag that overrides the composite until it clears.";
}

// ── red-flag card (real) ───────────────────────────────────────────────────────
function RedFlagCard({ p }: { p: PathologyCensusItem }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--crit-bd)",
        borderLeft: "3px solid var(--crit)",
        background: "linear-gradient(180deg,var(--crit-bg),transparent 70%),var(--surface)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-[9px]"
          style={{ background: "var(--crit-bg)", color: "var(--crit)" }}
        >
          <Icons.warning className="size-4" />
        </span>
        <span className="text-[14px] font-semibold">
          {flagLabel(p.key)}
          <span className="num ml-2" style={{ color: "var(--crit)" }}>
            {p.members.join(", ")}
          </span>
        </span>
        <span
          className="ml-auto shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
          style={{ color: "var(--crit)", background: "var(--crit-bg)", borderColor: "var(--crit-bd)" }}
        >
          Watch with care
        </span>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink2">{flagDescription(p.key)}</p>
      <p className="mt-2 text-[11.5px] italic text-ink3">
        Reach: {p.reach} ({p.memberCount} of {p.outOf} scored) — a single-name concern, not a universe signal.
      </p>
    </div>
  );
}

// ── pattern card (renders only when real patterns fire) ───────────────────────
function PatternCard({ p }: { p: PathologyCensusItem }) {
  const tone = severityTone(p.severity);
  return (
    <div
      className="mb-2 rounded-xl border border-line bg-surface-1 p-3.5"
      style={{ borderLeft: `3px solid ${tone.color}` }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] font-semibold">{flagLabel(p.key)}</span>
        <span className="num ml-auto text-[12px] font-medium" style={{ color: tone.color }}>
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

function DormantCard({ title, tag, desc }: { title: string; tag: string; desc: string }) {
  return (
    <div className="mb-2.5 rounded-xl border border-dashed border-line2 p-3.5">
      <div className="flex items-center gap-2.5 text-ink3">
        <span className="text-[13px] font-medium text-ink2">{title}</span>
        <span className="ml-auto rounded-[5px] border border-line2 px-2 py-0.5 text-[9px] uppercase tracking-wide text-ink3">
          {tag}
        </span>
      </div>
      <p className="mt-1.5 text-[11.5px] text-ink3">{desc}</p>
    </div>
  );
}

function PatternsEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface-1 py-10 text-center">
      <Icons.success weight="duotone" className="size-8 text-healthy" />
      <p className="text-[13px] font-medium text-ink">No patterns firing this snapshot</p>
      <p className="max-w-sm text-[11.5px] text-ink3">
        No momentum, ownership, or fundamentals pattern clusters across the scored universe this
        period. The pattern engine is live; it is simply quiet.
      </p>
    </div>
  );
}

// ── side summary ───────────────────────────────────────────────────────────────
function DistroRow({ label, n, max, color }: { label: string; n: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[12px]">
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

  const redFlags = useMemo(() => view.pathology.filter((p) => p.kind === "red_flag"), [view.pathology]);
  const patterns = useMemo(() => view.pathology.filter((p) => p.kind === "pattern"), [view.pathology]);

  const matches = (p: PathologyCensusItem) => {
    switch (filter) {
      case "all":
        return true;
      case "red_flags":
        return p.kind === "red_flag";
      case "ownership":
        return concernOf(p.key) === "ownership";
      case "fundamentals":
        return concernOf(p.key) === "fundamentals";
      case "momentum":
        return concernOf(p.key) === "momentum";
      case "recovery":
        return (p.severity ?? "").toLowerCase() === "positive" || p.key.includes("recovery");
      default:
        return true;
    }
  };

  const shownFlags = redFlags.filter(matches);
  const patternsByConcern: Record<Concern, PathologyCensusItem[]> = {
    ownership: [],
    fundamentals: [],
    momentum: [],
    other: [],
  };
  for (const p of patterns.filter(matches)) patternsByConcern[concernOf(p.key)].push(p);
  const anyPatterns = patterns.filter(matches).length > 0;

  // by-severity counts (real)
  const sevCounts = { critical: 0, high: 0, other: 0 };
  for (const p of view.pathology) {
    const s = (p.severity ?? "").toLowerCase();
    if (s === "critical") sevCounts.critical += p.memberCount;
    else if (s === "high") sevCounts.high += p.memberCount;
    else sevCounts.other += p.memberCount;
  }
  const sevMax = Math.max(sevCounts.critical, sevCounts.high, sevCounts.other, 1);

  const concernCounts: Record<Concern, number> = { ownership: 0, fundamentals: 0, momentum: 0, other: 0 };
  for (const p of view.pathology) concernCounts[concernOf(p.key)] += p.memberCount;
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

          <Tier title="Patterns" count={anyPatterns ? undefined : "0 firing"}>
            {anyPatterns ? (
              <>
                {(["momentum", "ownership", "fundamentals", "other"] as Concern[]).map((c) =>
                  patternsByConcern[c].length ? (
                    <div key={c} className="mb-3">
                      <div className="mb-1.5 text-[10px] uppercase tracking-wide text-ink3">{c} patterns</div>
                      {patternsByConcern[c].map((p) => (
                        <PatternCard key={p.key} p={p} />
                      ))}
                    </div>
                  ) : null,
                )}
              </>
            ) : (
              <PatternsEmpty />
            )}
          </Tier>

          <Tier title="Pending data integration">
            <DormantCard
              title="P5 · Insider-Confirmed Distress · P6 · Insider Conviction"
              tag="insider feed"
              desc="Live once the NSE PIT insider feed is confirmed and scoring. Capability present; no coverage implied."
            />
            <DormantCard
              title="P10 · Promoter Defense Buying"
              tag="block-deal feed"
              desc="Live once the block-deal feed is confirmed and scoring."
            />
            <DormantCard
              title="P9 · Capex Cycle"
              tag="capex unavailable"
              desc="Requires capex intensity, not in the current data stack. Renders when ingested."
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
          <Panel>
            <div className="mb-2 eyebrow">Sector-wide check</div>
            <p className="text-[12px] leading-relaxed text-ink2">
              No flag or pattern reaches across more than a fifth of any peer group this snapshot —
              nothing is dampened. When a signal goes group-wide, its magnitude is halved and the card
              is marked <span className="italic">sector-wide</span>.
            </p>
          </Panel>
        </div>
      </div>
    </Reveal>
  );
}
