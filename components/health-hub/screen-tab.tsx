"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { useChartTooltip, useElementWidth, ChartTooltip, TipBody } from "@/components/ui/chart-tooltip";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/lib/icons";
import { healthColorVar } from "@/lib/format";
import { getMetricLabel } from "@/lib/health/metric-labels";
import { cn } from "@/lib/utils";
import {
  accentVars,
  prepareMemberFindings,
  type PreparedMemberFinding,
  DENSITY_EMPTY_PILL,
} from "@/lib/findings";
import { BAND_META, LABEL_BAND_ORDER, PILLAR_META, SectionEyebrow } from "@/components/stock-detail/health/shared";
import type { LabelBand, PillarKey } from "@/types/health";
import type { UniverseHealthView, UniverseMemberView } from "@/types/universe-view";
import {
  bestWorstPillar,
  compositeBand,
  flagLabel,
  isRedistributed,
  recoveryMovers,
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
  const total = view.scoredUniverseSize || counts.reduce((s, n) => s + n, 0) || 1;
  const chartRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(chartRef);
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">The scored universe — census</span>
        <span className="num text-[11px] text-ink2">{view.scoredUniverseSize} names</span>
      </div>
      <div className="grid sm:flex flex-wrap items-center gap-6">
        <div className="w-full min-w-0 flex-1 sm:w-auto sm:min-w-[220px]">
          <h2 className="font-display text-[21px] font-medium">Where the market sits</h2>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink2">
            The crowded middle is where the score says least — the edges are where to look.
          </p>
          <p className="mt-2 text-[10.5px] text-ink3">Tip: click any band to filter the table below.</p>
        </div>
        <div className="w-full min-w-0 flex-[1.3] sm:w-auto sm:min-w-[300px]">
          <div ref={chartRef} className="relative flex h-24 items-end gap-1.5">
            <ChartTooltip tip={tip} />
            {LABEL_BAND_ORDER.map((band, i) => {
              const active = bandFilter === band;
              return (
                <button
                  key={band}
                  type="button"
                  onClick={() => onBand(active ? null : band)}
                  onMouseMove={(e) =>
                    show(
                      e,
                      <TipBody
                        title={BAND_META[band].label}
                        rows={[
                          { label: "Names", value: String(counts[i]) },
                          { label: "Share", value: `${((counts[i] / total) * 100).toFixed(0)}%` },
                        ]}
                      />,
                    )
                  }
                  onMouseLeave={hide}
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

// ── condition filters (the mode row, reworked) ───────────────────────────────────
// A UNIFORM taxonomy: every filter is the same KIND of thing — a SPECIFIC, named
// per-member condition (a fired flag/pattern, a trajectory state, a wide spread, a
// recovery) that a member either satisfies or doesn't. The set is DATA-DRIVEN: built
// from what actually fires on real members this snapshot, so there are never dead
// filters — a condition with zero members simply doesn't appear.
interface ScreenFilter {
  id: string;
  label: string;
  /** one-line honest note of what the condition means (neutral, no verdict). */
  note: string;
  count: number;
  match: (m: UniverseMemberView) => boolean;
}

// The specific P-series pattern filters now live inside the "Patterns ▾" dropdown, not
// the row — so there's no crowding cap: the menu holds ALL distinct firing patterns.

// Structural pattern keys the pattern-filter builder MUST skip — they duplicate a
// dedicated filter (Recovery / Wide divergence) or are too generic/structural to be a
// clean, decision-useful pattern button (their signal already lives in the trajectory /
// divergence conditions). Editable: add/remove keys here to tune the row manually.
const SUPPRESSED_PATTERN_KEYS: ReadonlySet<string> = new Set([
  // dup of the Recovery filter
  "trajectory_D_recovery",
  // dup of the Wide divergence filter
  "divergence_C1_price_ahead",
  "divergence_C2_ownership_vs_fundamentals",
  "divergence_C3_floor_trajectory_split",
  "divergence_C_over_time_widening",
  "divergence_consolidated",
  // structural / trajectory — covered by the dedicated Slipping/Firming conditions or too generic
  "trajectory_B_deterioration",
  "trajectory_G_convergence",
  "trajectory_I_band_transition",
  "trajectory_F2_composition_shift",
  "composition_F1_atypical",
]);

function buildConditionFilters(view: UniverseHealthView): {
  core: ScreenFilter[];
  patterns: ScreenFilter[];
} {
  const members = view.members;
  const recoverySet = new Set(recoveryMovers(view).map((r) => r.symbol));
  const stamp = (f: Omit<ScreenFilter, "count">): ScreenFilter => ({
    ...f,
    count: members.filter(f.match).length,
  });

  // ── CORE — the fixed, always-shown buttons (stable, repeatedly reached-for). "Red flags"
  // collapses ALL fired flags into one condition (any auto-tier flag firing). ──
  const coreDefs: Omit<ScreenFilter, "count">[] = [
    {
      id: "red_flags",
      label: "Red flags",
      note: "Any auto-tier red flag firing",
      match: (m) => m.firedFlags.length > 0,
    },
    {
      id: "wide_divergence",
      label: "Divergence",
      // ⚠ NO THRESHOLD IN COPY. This read "Two pillars ≥ 25 pts apart" and went stale the day
      //   Phase 2 moved the material cut to 12 — a rule typed into prose cannot follow the engine.
      //   The number a reader needs is the stock's OWN gap, which the row already prints.
      note: "The widest pillar spread on this stock",
      match: (m) => m.divergence.flag === "wide",
    },
    {
      id: "recovery",
      label: "Recovery",
      note: "Rising from a weak base (prior composite below Steady)",
      match: (m) => recoverySet.has(m.symbol),
    },
    {
      id: "slipping",
      label: "Slipping",
      note: "Composite deteriorating quarter-on-quarter",
      match: (m) => m.trajectoryMarker === "deteriorating",
    },
    {
      id: "firming",
      label: "Firming",
      note: "Composite improving quarter-on-quarter",
      match: (m) => m.trajectoryMarker === "improving",
    },
  ];
  const core: ScreenFilter[] = coreDefs.map(stamp);

  // ── PATTERNS — data-driven, collapsed into the dropdown. Every distinct fired P-series
  // key (structural duplicates suppressed), reach-sorted. No cap — a menu, not a row. ──
  const patternCounts = new Map<string, number>();
  for (const m of members)
    for (const p of m.firedPatterns) {
      if (SUPPRESSED_PATTERN_KEYS.has(p.patternKey)) continue;
      patternCounts.set(p.patternKey, (patternCounts.get(p.patternKey) ?? 0) + 1);
    }
  const patterns: ScreenFilter[] = [...patternCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) =>
      stamp({
        id: `pattern:${key}`,
        label: flagLabel(key),
        note: `${flagLabel(key)} — a scored pattern firing on these names`,
        match: (m) => m.firedPatterns.some((p) => p.patternKey === key),
      }),
    )
    .filter((f) => f.count > 0);

  return { core, patterns };
}

// ── one condition-filter button (uniform with the old mode-row styling) ──────────
function ConditionButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors",
        active
          ? "border-line3 bg-surface-3 font-medium text-ink"
          : "border-line2 bg-surface-1 text-ink2 hover:border-line3 hover:text-ink",
      )}
    >
      {label}
      <span className="num text-ink3">{count}</span>
    </button>
  );
}

// ── "Patterns ▾" dropdown — collapses the variable P-series pattern filters into one
// control. Data-driven contents (all firing patterns, reach-sorted). The trigger label
// reflects the active pick so the single-select state is visible even when tucked away. ─
function PatternsMenu({
  patterns,
  active,
  onSelect,
}: {
  patterns: ScreenFilter[];
  active: ScreenFilter | null;
  onSelect: (id: string) => void;
}) {
  // Honest-empty: no P-series patterns firing → a disabled, non-opening control.
  if (patterns.length === 0) {
    return (
      <button
        type="button"
        disabled
        title="No patterns firing this snapshot"
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3 py-1.5 text-[12px] text-ink3/50"
      >
        Patterns
        <Icons.caretDown className="size-3 opacity-50" />
      </button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors",
            active
              ? "border-line3 bg-surface-3 font-medium text-ink"
              : "border-line2 bg-surface-1 text-ink2 hover:border-line3 hover:text-ink",
          )}
        >
          {active ? `Pattern: ${active.label}` : "Patterns"}
          <Icons.caretDown className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[240px] border-line2 bg-surface-1">
        {patterns.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onSelect={() => onSelect(p.id)}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-6 text-[12.5px] text-ink2 focus:bg-surface-3 focus:text-ink",
              active?.id === p.id && "bg-surface-3 text-ink",
            )}
          >
            <span>{p.label}</span>
            <span className="num text-ink3">{p.count}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

// ════════════════════════════════════════════════════════════════════════════════
// THE EXPANDED ROW — it leads with WHAT FIRED, from the catalogue.
//
// The row payload has always carried `firedFlags` / `firedPatterns` (retired keys already dropped
// server-side); this table already read both, but only to build its FILTERS. The expansion showed a
// templated sentence and a spread chip instead — a proxy for the findings, one field over from the
// findings themselves. It now renders the findings.
//
// ── WHAT IS RENDERED, AND WHAT CANNOT BE ──────────────────────────────────────────────────────────
// name · description, resolved from the catalogue by `prepareMemberFindings`, ordered by the shared
// File-1 A→I ladder (orderRankOf → severityWeight → key) — the same ordering the stock page and the
// Flags board use, so one stock's findings can never sequence differently here. The interpretive
// boundary line does NOT render on this surface — see MemberFindingCard's note.
//
// NOT a verdict. A verdict is bound to the stock's evidence numbers, and this payload carries no
// evidence — only keys, severity and display state. The catalogue's static rule-level DESCRIPTION is
// the layer that exists for exactly this case. Inventing a verdict from what is here would be
// writing a sentence about numbers we do not have.
// ════════════════════════════════════════════════════════════════════════════════

/** How many finding cards the expansion renders before deferring to the stock page.
 *
 *  Chosen from the live distribution, not by taste: across the 94 scored names, with the C-family
 *  consolidated, the per-stock card count runs 0–7 with a mean of 2.6 — 0:4 · 1:22 · 2:24 · 3:22 ·
 *  4:12 · 5:5 · 6:2 · 7:3. A cap of 4 renders EVERY card for 89% of names, so the "+N more" line is
 *  the exception rather than the standard state (a cap of 3 would truncate 23% of the universe).
 *  And because the order is the risk-first A→I ladder, what gets cut is always the quietest end —
 *  composition · convergence · ownership events · band transition · notable — never a red flag and
 *  never a divergence. Raising it to 5 buys 6 more points of coverage for a materially taller row
 *  inside a table meant to be scanned. */
const FINDING_CAP = 4;

const LENS_PILLAR_TITLE: Record<string, string> = { foundation: "Foundation", momentum: "Momentum" };

/** A lens finding's instance coordinate as a label — WHICH metric (LM) or WHICH pillar (LP). The
 *  same resolution the Flags board applies. Without it, a stock firing LM3 on two metrics renders
 *  two identically-titled cards, because the face label names the SHAPE, not the field. */
function lensContext(f: PreparedMemberFinding): string | null {
  if (!f.lensSuffix) return null;
  return f.key.startsWith("lens_lp")
    ? (LENS_PILLAR_TITLE[f.lensSuffix] ?? f.lensSuffix)
    : getMetricLabel(f.lensSuffix).label;
}

// ── the heading — FACTS ONLY, no verb that evaluates the company ──────────────────
// name · band label. That is the whole sentence: no "sits in", no "is in good shape". The two
// pillar facts ("Momentum leads (93)" / weakest pillar) are real facts too, but they are NOT
// re-typed into this line — they live in the badges directly below, in full (pillar + value), so
// stating them again here would be the exact duplication §2b below resolves for the spread line.
// Every colour is a token already used elsewhere for this exact meaning: BAND_META.cssVar is the
// same one HealthCell paints the Health column with, one row up.
function MemberHeading({ m }: { m: UniverseMemberView }) {
  const meta = BAND_META[compositeBand(m.composite)];
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-display text-[15px] font-medium text-ink">{m.name}</span>
      <span
        className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
        style={{ color: meta.cssVar }}
      >
        <span className="size-1.5 rounded-full" style={{ background: meta.cssVar }} />
        {meta.label}
      </span>
    </div>
  );
}

/** One pillar badge — "Strongest" is a fact (argmax). The second badge is relabelled "Weakest":
 *  argmin carries no threshold and no relation to any fired finding, so a word implying concern
 *  ("Watch", "Drag") would claim something the arithmetic doesn't say — CUMMINSIND's Ownership is a
 *  perfectly healthy 75, lowest of four only because four numbers need a lowest. The pillar dot uses
 *  the pillar's own IDENTITY colour (PILLAR_META — the same token the table's other pillar reads use
 *  for this pillar everywhere), never a good/bad accent: identity carries no claim, semantic
 *  accents (--rec/--high) do — which is exactly why they're not used here. */
function PillarBadge({ tag, pillarKey, value }: { tag: string; pillarKey: PillarKey; value: number }) {
  const meta = PILLAR_META[pillarKey];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-3 px-2.5 py-1 text-[11.5px]">
      <span className="size-2 shrink-0 rounded-full" style={{ background: meta.cssVar }} />
      <span className="text-ink2">{tag}</span>
      <span className="font-medium text-ink">{PILLAR_LABEL[pillarKey]}</span>
      <span className="num font-semibold text-ink">{Math.round(value)}</span>
    </span>
  );
}

/** The findings pointer — the shared density read (classify.ts `densityOf`), reused VERBATIM from
 *  the stock page's own findings pill (findings-section.tsx): loud → "N findings", quiet → "context
 *  only", empty → the shared DENSITY_EMPTY_PILL. Not a new variant — the same three words, the same severity-aware
 *  split (a Critical flag and three context notes never collapse into the same label), just placed
 *  here as the line that tells the reader where the rest lives, per the owner's shape: heading, then
 *  findings, then this. The lead dot marks a red flag leading (`ordered[0].family === "A"`) — a
 *  fact already computed by the shared A→I ladder, not a new read. */
function FindingsPointer({
  ordered,
  count,
  density,
  hidden,
}: {
  ordered: PreparedMemberFinding[];
  count: number;
  density: "loud" | "quiet" | "empty";
  hidden: number;
}) {
  const label = density === "loud" ? `${count} finding${count === 1 ? "" : "s"}` : density === "quiet" ? "context only" : DENSITY_EMPTY_PILL;
  const leadsWithFlag = ordered[0]?.family === "A";
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink2">
      {leadsWithFlag && <span className="size-1.5 shrink-0 rounded-full" style={{ background: "var(--crit)" }} />}
      <span className="font-medium text-ink">{label}</span>
      {hidden > 0 && (
        <span>
          · <span className="num">{hidden}</span> more on the full analysis.
        </span>
      )}
    </p>
  );
}

/** One fired finding, compact. Every string is the catalogue's — this component authors none.
 *
 *  ⚠ NO BOUNDARY LINE HERE, ON PURPOSE. `doesntMean` is mandatory where a finding is read in FULL —
 *  the stock page, the tool pages — and stays mandatory there (nothing here touches those). This
 *  card is a pointer INTO that full read, not the read itself: `Full analysis →`, one click away, is
 *  where the boundary renders. Dropping it here is what keeps this card a pointer rather than a
 *  second, partial copy of the real thing.
 *
 *  Name renders in `ink`, not the accent colour — the accent still carries the severity signal in
 *  full via the dot, the border and the tinted background; on the `crit` tile specifically, the
 *  accent-coloured text alone measured 4.36:1 against its own tile, short of AA (4.5:1) — `ink` on
 *  the same tile clears 15:1+ on every accent, so severity reads at a glance from three tokens that
 *  don't ride on text-colour contrast, and the text itself is legible outright. */
function MemberFindingCard({ f }: { f: PreparedMemberFinding }) {
  const a = accentVars(f.accent);
  const ctx = lensContext(f);
  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: a.bd, background: a.bg }}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="size-1.5 shrink-0 rounded-full" style={{ background: a.color }} />
        <span className="text-[12.5px] font-semibold text-ink">{f.name}</span>
        {ctx && <span className="text-[11px] text-ink2">{ctx}</span>}
        {f.divergenceCount && f.divergenceCount > 2 ? (
          <span className="num text-[10px] text-ink2">+{f.divergenceCount - 2} more</span>
        ) : null}
        {f.displayState !== "active" && (
          <span className="rounded-md border border-line2 px-1.5 py-px text-[8.5px] uppercase tracking-wider text-ink2">
            {f.displayState === "dampened" ? "sector-wide" : "pending feed"}
          </span>
        )}
      </div>
      {/* Consolidated divergence — name the sub-types that actually fired. Without this the reader
          gets the family word ("Divergence") where the stock page names the pattern. */}
      {f.subTypes?.length ? (
        <p className="mt-1 text-[11px] text-ink2">{f.subTypes.map((s) => s.name).join(" · ")}</p>
      ) : null}
      {/* Static, rule-level description, clamped to 2 lines — the full string is untouched (never
          rewritten to fit); only the DISPLAY is capped, so it stays selectable/readable in full via
          the DOM and on `Full analysis →`. Title-only when the catalogue has no entry — never filler. */}
      {f.description && (
        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-ink2">{f.description}</p>
      )}
    </div>
  );
}

function MemberDetail({ m }: { m: UniverseMemberView }) {
  const { ordered, density, count } = useMemo(() => prepareMemberFindings(m), [m]);
  const shown = ordered.slice(0, FINDING_CAP);
  const hidden = count - shown.length;
  const { best, worst } = bestWorstPillar(m.pillars);

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-5 p-4 sm:grid-cols-[auto_1fr] sm:items-start">
      <div className="flex items-center gap-4">
        <HealthRing score={m.composite} size={84} strokeWidth={7} showLabel />
      </div>
      <div className="min-w-0 space-y-3">
        <MemberHeading m={m} />

        <div className="flex flex-wrap gap-1.5">
          <PillarBadge tag="Strongest" pillarKey={best.key} value={best.v} />
          <PillarBadge tag="Weakest" pillarKey={worst.key} value={worst.v} />
        </div>

        {count > 0 && (
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {shown.map((f) => (
              <MemberFindingCard key={f.key} f={f} />
            ))}
          </div>
        )}

        <FindingsPointer ordered={ordered} count={count} density={density} hidden={hidden} />

        {/* ── THE PILLAR SPREAD — THE GAP ALONE, NOT THE PILLARS AGAIN ──────────────────────────────
            Served arithmetic: max − min over SCORED pillar subtotals, banded by the canonical
            GAP_MATERIAL / GAP_STRETCHED (findings/divergence/bands.ts). Correct, and deliberately
            demoted beneath the findings.

            ⚠ THE EVALUATIVE WORD IS GONE ON PURPOSE. This read "Wide pillar spread · 18", and a
            reader reasonably concludes something is diverging — but the descriptor cannot say
            whether D1, D5, S2 or NOTHING is firing. On the live universe, 34 of 94 names carry a
            surfaced spread with NO D-family finding behind it at all (DABUR: a 39-point spread and
            an empty fired set). The bands file says it outright: "a SPREAD DESCRIPTOR for display,
            not a pattern claim — do not re-derive a pattern from it." So it states the distance and
            nothing else.

            ⚠ THE PILLAR NAMES ARE GONE FROM THIS LINE TOO — the badges above now carry them
            (Strongest / Weakest, pillar + value), and bestWorstPillar's pair reproduces this exact
            gap on 94/94 members, so naming "Momentum vs Ownership" here as well would say the same
            two numbers twice. This line's only job left is the distance.

            The gap and the flag are BOTH the backend's — nothing here re-derives either. The
            `flag !== "none"` gate is the backend's §1.1 suppression of the 8–11 minor band ("a gap
            exists but carries no demonstrated meaning — do not surface"), kept intact. */}
        {m.divergence.flag !== "none" && (
          <p className="text-[11.5px] text-ink2">
            Pillar spread · <span className="num font-medium text-ink">{Math.round(m.divergence.gap)}</span> apart
          </p>
        )}

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
  const [condition, setCondition] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("composite");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── MOBILE FIX — the expansion must not inherit the glance table's scroll width ────────────────
  //
  // The glance grid is `min-w-[900px]` inside `overflow-x-auto` on purpose (8 dense columns; a
  // sticky Stock column stays pinned while the rest scrolls — a standard, low-risk pattern for a
  // wide data table, kept as-is here). The problem was never that table; it's that the expansion
  // used to live in a `<td colSpan={8}>` of that SAME table, so its box was ALSO at least 900px wide
  // on every screen. Tailwind's `sm:`/`lg:` breakpoints inside it correctly key off the real
  // viewport (they're media queries, not container queries) — a 380px phone never lit `sm:`, so the
  // ring+content pair and the card grid WERE already stacking to one column — but that correctly
  // "mobile" single column still rendered inside a ≥900px-wide box, so reading it meant scrolling
  // horizontally past the exact content that was supposedly already stacked for you.
  //
  // Fix: measure the SCROLL CONTAINER's own visible width (`useElementWidth`, the same hook
  // `chart-tooltip.tsx` already exports for this) and pin the expansion to it — `position: sticky;
  // left: 0` (identical mechanism to the Stock column's own pinning) holds it at the scrolled-to
  // left edge, and an explicit `width` in px — not a `100%`/`100vw` guess — clamps it to exactly
  // what's visible, however a sidebar or page padding have already changed that. On desktop, where
  // the container is usually wider than 900px and nothing scrolls, this measures larger than the
  // table and the expansion simply renders full width, unchanged from before.
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollWidth = useElementWidth(scrollRef, 0);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const m of view.members) if (m.sector) set.add(m.sector.displayName);
    return ["All", ...Array.from(set).sort()];
  }, [view.members]);

  // The live condition-filter set (data-driven). `core` are the fixed buttons; `patterns`
  // populate the dropdown. One `condition` string drives single-select across both.
  const filters = useMemo(() => buildConditionFilters(view), [view]);
  // Guard: if the active id is no longer live (data refetched), fall back to Overview.
  const activeFilter = condition
    ? [...filters.core, ...filters.patterns].find((f) => f.id === condition) ?? null
    : null;
  const activePattern = filters.patterns.find((f) => f.id === condition) ?? null;

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
      if (activeFilter && !activeFilter.match(m)) return false;
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
  }, [view.members, query, sector, bandFilter, sortKey, sortDir, activeFilter]);

  return (
    <div className="flex flex-col gap-3.5">
      <SectionEyebrow
        className="mb-0 mt-0"
        label="Screen the universe"
        icon={Icons.screener}
        accent="var(--p-found)"
        pill={`${view.members.length} names`}
      />

      {/* condition lens — fixed core buttons + a "Patterns ▾" dropdown for the variable
          P-series patterns. One condition active at a time (buttons + dropdown mutually
          exclusive); each binds to a real per-member condition that fires this snapshot. */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <ConditionButton
            label="All"
            count={view.members.length}
            active={!activeFilter}
            onClick={() => setCondition(null)}
          />
          {filters.core.map((f) => (
            <ConditionButton
              key={f.id}
              label={f.label}
              count={f.count}
              active={condition === f.id}
              onClick={() => setCondition(condition === f.id ? null : f.id)}
            />
          ))}
          <PatternsMenu patterns={filters.patterns} active={activePattern} onSelect={setCondition} />
        </div>
        {activeFilter && (
          <p className="text-[11px] text-ink3">
            <span className="text-ink2">{activeFilter.label}</span> — {activeFilter.note}.
          </p>
        )}
      </div>

      <Census view={view} bandFilter={bandFilter} onBand={setBandFilter} />

      {/* controls — search + sector dropdown (left) · health-band capsules (right) */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol or name…"
              className="h-10 w-full rounded-xl border border-line2 bg-surface-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink3 focus:border-pristine/40"
            />
          </div>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="h-10 w-full rounded-xl border-line2 bg-surface-2 text-sm text-ink sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "All" ? "All sectors" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <div ref={scrollRef} className="custom-scrollbar overflow-x-auto p-2 sm:p-3">
          <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line2">
                <th className=" bg-surface-1 px-3 pb-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-ink3">
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
                      <td className="  px-3 py-2.5">
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
                          {/* Pinned to the visible edge of the scroll container (same mechanism as the
                              sticky Stock column) and clamped to its MEASURED width — see the note by
                              `scrollWidth` above. `scrollWidth || undefined`: 0 before the first
                              measurement falls through to unconstrained (`width: undefined`), never a
                              collapsed 0px box. */}
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            style={{ position: "sticky", left: 0, width: scrollWidth || undefined }}
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

export function ScreenTab({ view }: { view: UniverseHealthView }) {
  return (
    <Reveal>
      <OverviewTable view={view} />
    </Reveal>
  );
}
