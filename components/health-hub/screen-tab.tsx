"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BAND_META, PILLAR_META, LABEL_BAND_ORDER } from "@/components/stock-detail/health/shared";
import type { LabelBand, PillarKey } from "@/types/health";
import type { UniverseHealthView, UniverseMemberView } from "@/types/universe-view";
import {
  bestWorstPillar,
  compositeBand,
  isRedistributed,
  memberVerdict,
  PILLAR_LABEL,
} from "./lib";

// ── census (clickable band distribution) ──────────────────────────────────────
function Census({
  view,
  bandFilter,
  onBand,
}: {
  view: UniverseHealthView;
  bandFilter: LabelBand | null;
  onBand: (b: LabelBand | null) => void;
}) {
  const dist = view.aggregate!.bandDistribution;
  const counts = LABEL_BAND_ORDER.map((b) => dist[b]);
  const max = Math.max(...counts, 1);
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">The scored universe — census</span>
        <span className="num text-[11px] text-ink2">{view.scoredUniverseSize} names</span>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="min-w-[220px] flex-1">
          <h2 className="font-display text-[21px] font-medium">Where the market sits</h2>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink2">
            The crowded middle is where the score says least — the edges are where to look.
          </p>
          <p className="mt-2 text-[10.5px] text-ink3">Tip: click any band to filter the table below.</p>
        </div>
        <div className="min-w-[300px] flex-[1.3]">
          <div className="flex h-24 items-end gap-1.5">
            {LABEL_BAND_ORDER.map((band, i) => {
              const active = bandFilter === band;
              return (
                <button
                  key={band}
                  type="button"
                  onClick={() => onBand(active ? null : band)}
                  className="flex h-full flex-1 cursor-pointer flex-col items-center justify-end gap-1.5 transition-opacity hover:opacity-85"
                >
                  <span className="num text-[12px] font-medium" style={{ color: active ? BAND_META[band].cssVar : "var(--ink)" }}>
                    {counts[i]}
                  </span>
                  <span
                    className="w-full rounded-t-[5px] transition-all"
                    style={{
                      height: `${Math.max(4, (counts[i] / max) * 100)}%`,
                      background: BAND_META[band].cssVar,
                      boxShadow: active ? `0 0 0 2px var(--bg), 0 0 0 3px ${BAND_META[band].cssVar}` : undefined,
                    }}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5">
            {LABEL_BAND_ORDER.map((band) => (
              <div key={band} className="flex-1 text-center text-[10px] text-ink3">
                {BAND_META[band].label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── mode switcher ──────────────────────────────────────────────────────────────
type Mode = "overview" | "divergence" | "recovery" | "ride" | "composition";
const MODES: { id: Mode; label: string; icon: React.ReactNode; live: boolean }[] = [
  { id: "overview", label: "Overview", icon: <Icons.results className="size-3.5" />, live: true },
  { id: "divergence", label: "Divergence", icon: <Icons.compare className="size-3.5" />, live: false },
  { id: "recovery", label: "Recovery", icon: <Icons.trendUp className="size-3.5" />, live: false },
  { id: "ride", label: "Risk / ride", icon: <Icons.pulse className="size-3.5" />, live: false },
  { id: "composition", label: "Composition", icon: <Icons.chartBar className="size-3.5" />, live: false },
];

// ── pillar cell ────────────────────────────────────────────────────────────────
function PillarCell({ value }: { value: number }) {
  if (isRedistributed(value)) {
    return <span className="text-ink3">—</span>;
  }
  const c = healthColorVar(value);
  return (
    <span
      className="num inline-block min-w-9 rounded-md px-1.5 py-1 text-[12px] font-medium"
      style={{ color: c, background: `color-mix(in oklch, ${c} 12%, transparent)` }}
    >
      {Math.round(value)}
    </span>
  );
}

/** Health band chip — colour-coded label (its own column). */
function HealthCell({ composite }: { composite: number }) {
  const band = compositeBand(composite);
  const meta = BAND_META[band];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[11px] font-medium"
      style={{ color: meta.cssVar, background: `color-mix(in oklch, ${meta.cssVar} 12%, transparent)` }}
    >
      <span className="size-[7px] rounded-full" style={{ background: meta.cssVar }} />
      {meta.label}
    </span>
  );
}

/** Composite score — numeric, colour-coded by band (its own column). */
function CompositeCell({ composite }: { composite: number }) {
  const c = healthColorVar(composite);
  return (
    <span
      className="num inline-block min-w-9 rounded-md px-2 py-1 text-[12.5px] font-semibold"
      style={{ color: c, background: `color-mix(in oklch, ${c} 14%, transparent)` }}
    >
      {Math.round(composite)}
    </span>
  );
}

function TrajectoryCell({ m }: { m: UniverseMemberView }) {
  if (m.trajectoryDelta == null || m.trajectoryMarker == null) {
    return <span className="text-ink3">—</span>;
  }
  const up = m.trajectoryMarker === "improving";
  const down = m.trajectoryMarker === "deteriorating";
  const color = up ? "var(--rec)" : down ? "var(--high)" : "var(--ink3)";
  return (
    <span className="num inline-flex items-center gap-1 text-[12px]" style={{ color }}>
      {up ? "↗" : down ? "↘" : "→"}
      {m.trajectoryDelta > 0 ? "+" : ""}
      {Math.round(m.trajectoryDelta)}
    </span>
  );
}

// ── expanded row (preserved interaction: ring + verdict + best/worst + funnels) ─
function MemberDetail({ m }: { m: UniverseMemberView }) {
  const { best, worst } = bestWorstPillar(m.pillars);
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="flex items-center gap-4">
        <HealthRing score={m.composite} size={84} strokeWidth={7} showLabel />
      </div>
      <div className="space-y-3">
        <p className="font-display text-[14px] italic leading-snug text-ink2">{memberVerdict(m)}</p>
        <div className="flex flex-wrap gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
            style={{ color: "var(--rec)", borderColor: "var(--rec-bd)", background: "var(--rec-bg)" }}
          >
            <span className="size-2 rounded-full" style={{ background: PILLAR_META[best.key].cssVar }} />
            Strongest: {PILLAR_LABEL[best.key]} ({Math.round(best.v)})
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
            style={{ color: "var(--high)", borderColor: "var(--high-bd)", background: "var(--high-bg)" }}
          >
            <span className="size-2 rounded-full" style={{ background: PILLAR_META[worst.key].cssVar }} />
            Watch: {PILLAR_LABEL[worst.key]} ({Math.round(worst.v)})
          </span>
          {m.divergence.flag !== "none" && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-3 px-2.5 py-1 text-xs text-ink2">
              {m.divergence.flag === "wide" ? "Wide" : "Notable"} pillar spread · {Math.round(m.divergence.gap)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link href={`/research/stock-screener/${m.symbol}`}>
              Full analysis
              <Icons.arrowRight weight="bold" className="size-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="h-8 text-ink2">
            <Link href="/health-score/methodology">How this is scored</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── sortable header ──────────────────────────────────────────────────────────
type SortKey = "composite" | PillarKey | "trajectory";
function Th({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  k?: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  align?: "left" | "center" | "right";
}) {
  const active = k && sortKey === k;
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink3",
        align === "right" && "text-right",
        align === "center" && "text-center",
        k && "cursor-pointer select-none hover:text-ink2",
      )}
      onClick={k ? () => onSort(k) : undefined}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" && "flex-row-reverse")}>
        {label}
        {active && <span className="text-ink2">{sortDir === "desc" ? "▾" : "▴"}</span>}
      </span>
    </th>
  );
}

/** Health-band filter capsule — colour-coded, click to toggle (shares state with the
 *  census bar-click). */
function BandCapsule({
  band,
  active,
  onClick,
}: {
  band: LabelBand | null;
  active: boolean;
  onClick: () => void;
}) {
  const meta = band ? BAND_META[band] : null;
  const color = meta ? meta.cssVar : "var(--ink2)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
      style={
        active
          ? { borderColor: color, background: `color-mix(in oklch, ${color} 14%, transparent)`, color }
          : { borderColor: "var(--line2)", color: "var(--ink2)" }
      }
    >
      {meta && <span className="size-[7px] rounded-full" style={{ background: color }} />}
      {meta ? meta.label : "All bands"}
    </button>
  );
}

function OverviewTable({ view }: { view: UniverseHealthView }) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>("All");
  const [bandFilter, setBandFilter] = useState<LabelBand | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("composite");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const m of view.members) if (m.sector) set.add(m.sector.displayName);
    return ["All", ...Array.from(set).sort()];
  }, [view.members]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = view.members.filter((m) => {
      if (sector !== "All" && m.sector?.displayName !== sector) return false;
      if (bandFilter && compositeBand(m.composite) !== bandFilter) return false;
      if (q && !m.symbol.toLowerCase().includes(q) && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
    const val = (m: UniverseMemberView): number =>
      sortKey === "composite"
        ? m.composite
        : sortKey === "trajectory"
          ? m.trajectoryDelta ?? -Infinity
          : m.pillars[sortKey];
    return [...filtered].sort((a, b) => (sortDir === "desc" ? val(b) - val(a) : val(a) - val(b)));
  }, [view.members, query, sector, bandFilter, sortKey, sortDir]);

  return (
    <div className="flex flex-col gap-3.5">
      <Census view={view} bandFilter={bandFilter} onBand={setBandFilter} />

      {/* controls — row 1: search (left) + health-band capsules (right) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol or name…"
              className="h-10 w-full rounded-xl border border-line2 bg-surface-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink3 focus:border-pristine/40"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <BandCapsule band={null} active={!bandFilter} onClick={() => setBandFilter(null)} />
            {[...LABEL_BAND_ORDER].reverse().map((b) => (
              <BandCapsule
                key={b}
                band={b}
                active={bandFilter === b}
                onClick={() => setBandFilter(bandFilter === b ? null : b)}
              />
            ))}
          </div>
        </div>
        {/* row 2: sector filters */}
        <div className="flex flex-wrap gap-1.5">
          {sectors.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSector(s)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all",
                sector === s
                  ? "bg-surface-3 text-ink ring-1 ring-line3"
                  : "border border-line2 bg-surface-1 text-ink2 hover:text-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="rounded-xl border border-line bg-surface-1">
        <div className="px-5 pt-4 text-[11.5px] text-ink2">
          Every name in scope with its four real pillars. Click a row for the verdict and funnels.
          {bandFilter && (
            <button
              onClick={() => setBandFilter(null)}
              className="ml-2 rounded-md bg-surface-3 px-2 py-0.5 text-[10px] text-ink2 hover:text-ink"
            >
              filtered: {BAND_META[bandFilter].label} ✕
            </button>
          )}
          <span className="num ml-2 text-ink3">· {rows.length} shown</span>
        </div>
        <div className="custom-scrollbar overflow-x-auto p-2 sm:p-3">
          <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line2">
                <th className="sticky left-0 z-10 bg-surface-1 px-3 pb-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-ink3">
                  Stock
                </th>
                <th className="whitespace-nowrap px-3 pb-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-ink3">
                  Health
                </th>
                <Th label="Composite" k="composite" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Foundation" k="foundation" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="center" />
                <Th label="Momentum" k="momentum" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="center" />
                <Th label="Market" k="market" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="center" />
                <Th label="Ownership" k="ownership" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="center" />
                <Th label="Trajectory Δ" k="trajectory" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const isOpen = expanded === m.symbol;
                return (
                  <Fragment key={m.symbol}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : m.symbol)}
                      className={cn(
                        "cursor-pointer border-b border-line transition-colors hover:bg-surface-2",
                        isOpen && "bg-surface-2",
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-surface-1 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Icons.caretRight
                            className={cn("size-3.5 shrink-0 text-ink3 transition-transform", isOpen && "rotate-90")}
                          />
                          <div className="min-w-0">
                            <p className="num font-medium leading-tight">{m.symbol}</p>
                            <p className="truncate text-[10px] text-ink3">{m.sector?.displayName ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <HealthCell composite={m.composite} />
                      </td>
                      <td className="px-3 py-2.5">
                        <CompositeCell composite={m.composite} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <PillarCell value={m.pillars.foundation} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <PillarCell value={m.pillars.momentum} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <PillarCell value={m.pillars.market} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <PillarCell value={m.pillars.ownership} />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <TrajectoryCell m={m} />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={8} className="bg-surface-2/40 p-0">
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <MemberDetail m={m} />
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="p-10 text-center text-sm text-ink3">No stocks match your filters.</div>
        )}
      </div>
    </div>
  );
}

function ModeSoon({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line2 px-8 py-16 text-center">
      <Icons.spark className="mx-auto mb-3.5 size-7 text-ink3 opacity-60" />
      <h3 className="font-display text-[19px] font-medium text-ink2">{label} view — coming soon</h3>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-ink3">
        This mode re-shapes the same census around {label.toLowerCase()}. The Overview table is the
        live workbench today; the other lenses light up as the read-models land.
      </p>
    </div>
  );
}

export function ScreenTab({ view }: { view: UniverseHealthView }) {
  const [mode, setMode] = useState<Mode>("overview");
  return (
    <Reveal>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors",
              mode === m.id
                ? "border-line3 bg-surface-3 font-medium text-ink"
                : "border-line2 bg-surface-1 text-ink2 hover:border-line3 hover:text-ink",
            )}
          >
            {m.icon}
            {m.label}
            {!m.live && (
              <span className="rounded-[4px] border border-line2 px-1.5 py-px text-[8.5px] uppercase tracking-wider text-ink3">
                soon
              </span>
            )}
          </button>
        ))}
      </div>

      {mode === "overview" ? (
        <OverviewTable view={view} />
      ) : (
        <ModeSoon label={MODES.find((m) => m.id === mode)!.label} />
      )}
    </Reveal>
  );
}
