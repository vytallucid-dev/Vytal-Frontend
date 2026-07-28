"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/ui/reveal";
import { Icons, type Icon } from "@/lib/icons";
import { Panel, SectionEyebrow, BAND_META } from "@/components/stock-detail/health/shared";
import { cn } from "@/lib/utils";
import { compositeBand } from "./lib";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getMetricLabel } from "@/lib/health/metric-labels";
import {
  prepareCensus,
  accentVars,
  lensCatalogFace,
  lensDoesntMean,
  type PreparedCensus,
  type Concern,
} from "@/lib/findings";
import type { UniverseHealthView } from "@/types/universe-view";

// ── lens-pattern face resolver ────────────────────────────────────────────────
// The lens census carries dynamic `lens_<id>_<suffix>` keys (id = lm3/lm7/lp2/lp5;
// suffix = metricKey for LM, pillar for LP). The census has no evidence, so we resolve the
// verbatim face — label · read · doesn't-mean — from the ONE catalog (lens-patterns copy,
// moved frontend-side). The lens_<id>_<suffix> → uppercase-id transform lives only here.
const PILLAR_TITLE: Record<string, string> = {
  foundation: "Foundation",
  momentum: "Momentum",
};

interface LensMeta {
  lensId: string; // "LM3" | "LM7" | "LP2" | "LP5"
  scope: "metric" | "pillar";
  label: string; // catalog label (card title)
  read: string; // catalog "Read" — the descriptive body
  doesntMean: string; // catalog "Doesn't mean" (face, or the family-lens fallback)
  context: string; // the metric label (LM) or pillar name (LP)
}

/** Parse a `lens_<id>_<suffix>` census key into its display face, sourced from the catalog.
 *  Falls back gracefully for any unknown lens id (future keys still render, never crash). */
function lensMetaOf(key: string): LensMeta {
  const m = /^lens_([a-z]+\d+)_(.+)$/.exec(key);
  const idUpper = (m?.[1] ?? "").toUpperCase();
  const suffix = m?.[2] ?? key;
  const face = lensCatalogFace(idUpper);
  const scope: "metric" | "pillar" = idUpper.startsWith("LP") ? "pillar" : "metric";
  const context =
    scope === "pillar" ? (PILLAR_TITLE[suffix] ?? suffix) : getMetricLabel(suffix).label;
  return {
    lensId: idUpper,
    scope,
    label: face?.label ?? idUpper,
    read: face?.read ?? "",
    doesntMean: lensDoesntMean(idUpper),
    context,
  };
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

const SCREENER_HREF = (symbol: string) => `/research/stock-screener/${symbol}`;

// ── Investigate affordance — 1 member jumps straight to its screener page; N members
// open a light picker modal (select → jump). Uniform across flag / pattern / lens cards. ─
function InvestigateButton({ members, title }: { members: string[]; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (members.length === 0) return null;

  if (members.length === 1) {
    return (
      <Link
        href={SCREENER_HREF(members[0])}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line2 bg-surface-1 px-2 py-1 text-[10.5px] font-medium text-ink2 transition-colors hover:border-line3 hover:text-ink"
      >
        Investigate
        <Icons.arrowUpRight className="size-3" />
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line2 bg-surface-1 px-2 py-1 text-[10.5px] font-medium text-ink2 transition-colors hover:border-line3 hover:text-ink"
      >
        Investigate
        <span className="num text-ink3">{members.length}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95%] sm:max-w-sm border-line2 bg-surface-1 text-ink">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-medium">{title}</DialogTitle>
            <DialogDescription className="text-[12px] text-ink3">
              {members.length} names firing this. Pick one to open its screener.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-1 grid max-h-[50vh] grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3">
            {members.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(SCREENER_HREF(s));
                }}
                className="num inline-flex items-center justify-between gap-1.5 rounded-lg border border-line2 bg-surface-2 px-2.5 py-1.5 text-[12px] text-ink2 transition-colors hover:border-line3 hover:bg-surface-3 hover:text-ink"
              >
                {s}
                <Icons.arrowUpRight className="size-3 text-ink3" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
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
  const chipStyle = accentChip(p.accent);
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: a.bd,
        borderLeft: `3px solid ${a.color}`,
        background: `linear-gradient(180deg,${a.bg},transparent 70%),var(--surface)`,
      }}
    >
      <div className="flex flex-wrap items-center gap-2.5">
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
          className="ml-auto hidden shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:inline-flex"
          style={chipStyle}
        >
          Watch with care
        </span>
      </div>
      <span
        className="mt-2 inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:hidden"
        style={chipStyle}
      >
        Watch with care
      </span>
      {/* Static, rule-level description — what the flag means ABOUT THE COMPANY. Title-only
          when the catalog has no entry (never a generic filler sentence). */}
      {p.description && <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink2">{p.description}</p>}
      {/* The interpretive boundary — what this does NOT mean. */}
      <p className="mt-2 border-l-2 border-line2 pl-2.5 text-[11.5px] italic text-ink3">{p.doesntMean}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11.5px] italic text-ink3">
          Reach: {p.reach} ({p.memberCount} of {p.outOf} scored) — {p.reach === "isolated" ? "a single-name concern, not a universe signal." : p.reach === "widespread" ? "a group-wide read, not company-specific." : "a shared cluster worth watching."}
        </p>
        <InvestigateButton members={p.members} title={p.name} />
      </div>
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
      {/* Static description — what this pattern MEANS. This is where Insider Conviction /
          Accruals Divergence / Capital Tied in Receivables / Quarterly Margin Compression
          finally read as findings about the company. Title-only when absent. */}
      {p.description && <p className="mt-2 text-[12px] leading-relaxed text-ink2">{p.description}</p>}
      <p className="mt-2 border-l-2 border-line2 pl-2.5 text-[11px] italic text-ink3">{p.doesntMean}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="num text-[11.5px] text-ink2">{p.members.join(" · ")}</div>
        <InvestigateButton members={p.members} title={p.name} />
      </div>
    </div>
  );
}

// ── lens-pattern card (three-lens LM/LP) — same card language as PatternCard, with an
// LM/LP scope chip + the metric/pillar context. Descriptive, never predictive. ──────────
function LensPatternCard({ p }: { p: PreparedCensus }) {
  const a = accentVars(p.accent);
  const meta = lensMetaOf(p.key);
  return (
    <div
      className="mb-2 rounded-xl border border-line bg-surface-1 p-3.5"
      style={{ borderLeft: `3px solid ${a.color}` }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="num shrink-0 rounded-[5px] px-1.5 py-0.5 text-[9px] font-semibold tracking-wide"
          style={accentChip(p.accent)}
        >
          {meta.lensId}
        </span>
        <span className="text-[13px] font-semibold">{meta.label}</span>
        <span className="truncate text-[11px] text-ink3">
          {meta.scope === "metric" ? "metric" : "pillar"} · {meta.context}
        </span>
        <span className="num ml-auto shrink-0 text-[12px] font-medium" style={{ color: a.color }}>
          {p.memberCount}/{p.outOf}
        </span>
      </div>
      {/* Catalog "Read" — the descriptive body (was dropped by the wire; now sourced here). */}
      {meta.read && <p className="mt-2 text-[12px] leading-relaxed text-ink2">{meta.read}</p>}
      {/* The interpretive boundary — field-verdicts are context, never a stock call. */}
      {meta.doesntMean && (
        <p className="mt-2 border-l-2 border-line2 pl-2.5 text-[11px] italic text-ink3">{meta.doesntMean}</p>
      )}
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="num text-[11.5px] text-ink2">{p.members.join(" · ")}</div>
        <InvestigateButton members={p.members} title={`${meta.lensId} · ${meta.label}`} />
      </div>
    </div>
  );
}

// ── section heading system ────────────────────────────────────────────────────
// Two levels, both on the app's SectionEyebrow theme so every label reads with life:
//  · Tier (L1)     — SectionEyebrow with a tinted icon chip + accent hairline + count pill.
//  · SubEyebrow (L2) — SectionEyebrow's lighter no-icon variant (accent bar + tinted
//    hairline + compact count), for the concern / LM-LP sub-groups nested inside a tier.
function Tier({
  title,
  count,
  icon,
  accent,
  children,
}: {
  title: string;
  count?: string;
  icon?: Icon;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <SectionEyebrow className="mb-3 mt-0" label={title} icon={icon} accent={accent} pill={count} />
      {children}
    </div>
  );
}

function SubEyebrow({ label, count, accent = "var(--p-found)" }: { label: string; count?: string; accent?: string }) {
  return (
    <div className="mb-2 flex items-center gap-2.5">
      <span className="h-3 w-[3px] shrink-0 rounded-full" style={{ background: accent }} />
      <span className="eyebrow shrink-0">{label}</span>
      <span className="h-px min-w-4 flex-1" style={{ background: `color-mix(in oklch, ${accent} 20%, var(--line))` }} />
      {count && <span className="num shrink-0 text-[10px] tracking-normal text-ink3">{count}</span>}
    </div>
  );
}

// concern → pillar identity accent (mirrors the "By concern" distribution colours)
const CONCERN_ACCENT: Record<Concern, string> = {
  ownership: "var(--p-own)",
  fundamentals: "var(--p-found)",
  momentum: "var(--p-mom)",
  trajectory: "var(--p-mkt)",
  other: "var(--ink3)",
};

// The three concern tiers displayed under Patterns, plus the new "trajectory" bucket that
// finally surfaces the structural B/C/D/F/G/I cards (deterioration, divergence, recovery,
// composition, convergence, band transition) the board used to hide under concern "other".
const PATTERN_CONCERNS: Concern[] = ["ownership", "fundamentals", "momentum", "trajectory"];
const CONCERN_GROUP_LABEL: Record<Concern, string> = {
  ownership: "Ownership patterns",
  fundamentals: "Fundamentals patterns",
  momentum: "Momentum patterns",
  trajectory: "Trajectory & divergence",
  other: "Other",
};

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

const EDGE_THRESHOLD = 3; // the "within N pts of a band line" window (mirrors edgeWatchers)

// Direction identity — a name either sits just ABOVE a floor (about to drop, amber) or just
// BELOW a ceiling (about to rise, green). Colour + icon carry the risk/opportunity read.
const EDGE_META = {
  down: { accent: "var(--high)", bd: "var(--high-bd)", bg: "var(--high-bg)", icon: Icons.trendDown, title: "Near dropping a band", lead: "drops to" },
  up: { accent: "var(--rec)", bd: "var(--rec-bd)", bg: "var(--rec-bg)", icon: Icons.trendUp, title: "Near rising a band", lead: "reaches" },
} as const;

// One watcher row — reads as: {symbol} · {current composite, band-coloured} · a proximity
// meter that fills as the score nears the line (full = imminent crossing) · how many points
// and which band it would move to. The whole row jumps to the stock's trajectory tool.
function EdgeRow({ w, dir }: { w: EdgeWatcher; dir: "down" | "up" }) {
  const m = EDGE_META[dir];
  const bandColor = BAND_META[compositeBand(w.composite)].cssVar;
  // fill = imminence: gap 0 → full (touching the line), gap = THRESHOLD → nearly empty.
  const fill = Math.max(6, Math.min(100, (1 - w.gap / EDGE_THRESHOLD) * 100));
  const gap = w.gap.toFixed(1);
  return (
    <Link
      href={`/research/trajectory?symbol=${w.symbol}`}
      className="group -mx-1.5 block rounded-lg px-1.5 py-2 transition-colors hover:bg-surface-2"
    >
      <div className="flex items-center gap-2">
        <span className="num min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">{w.symbol}</span>
        <span
          className="num shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-semibold"
          style={{ color: bandColor, background: `color-mix(in oklch, ${bandColor} 12%, transparent)` }}
        >
          {w.composite.toFixed(1)}
        </span>
        <Icons.arrowUpRight className="size-3 shrink-0 text-ink3 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-1.5 flex items-center gap-2.5">
        <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${fill}%`, background: m.accent, opacity: 0.9 }}
          />
        </span>
        <span className="shrink-0 whitespace-nowrap text-[10.5px] text-ink3">
          <span className="num font-medium" style={{ color: m.accent }}>
            {gap}
          </span>{" "}
          pt{gap === "1.0" ? "" : "s"} {dir === "down" ? "↓" : "↑"} {m.lead}{" "}
          <span className="text-ink2">{w.toBand}</span>
        </span>
      </div>
    </Link>
  );
}

function EdgeCard({ dir, watchers }: { dir: "down" | "up"; watchers: EdgeWatcher[] }) {
  const m = EDGE_META[dir];
  const Glyph = m.icon;
  return (
    <div className="rounded-xl border bg-surface-1 p-3.5" style={{ borderColor: m.bd }}>
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ background: m.bg, color: m.accent }}>
          <Glyph className="size-4" />
        </span>
        <span className="text-[12.5px] font-semibold text-ink">{m.title}</span>
        <span className="num ml-auto text-[12px] font-medium" style={{ color: m.accent }}>
          {watchers.length}
        </span>
      </div>
      <div className="flex flex-col divide-y divide-line">
        {watchers.map((w) => (
          <EdgeRow key={w.symbol + dir} w={w} dir={dir} />
        ))}
      </div>
    </div>
  );
}

function ThresholdWatchSection({ atRisk, approaching }: { atRisk: EdgeWatcher[]; approaching: EdgeWatcher[] }) {
  if (atRisk.length === 0 && approaching.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface-1 px-4 py-5 text-center text-[12px] text-ink3">
        Nothing approaching a band edge within 3 pts this snapshot.
      </div>
    );
  }
  const both = atRisk.length > 0 && approaching.length > 0;
  return (
    <div className="flex flex-col gap-3">
      <div className={cn("grid grid-cols-1 gap-3", both && "lg:grid-cols-2")}>
        {atRisk.length > 0 && <EdgeCard dir="down" watchers={atRisk} />}
        {approaching.length > 0 && <EdgeCard dir="up" watchers={approaching} />}
      </div>
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

  // Three-lens (LM/LP) census — its own family, prepared with the same machinery, then
  // split metric-level (LM) vs pillar-level (LP) for a light sub-grouping.
  const lens = useMemo(() => prepareCensus(view.lensPathology ?? []), [view.lensPathology]);
  const lensMetric = useMemo(() => lens.filter((p) => lensMetaOf(p.key).scope === "metric"), [lens]);
  const lensPillar = useMemo(() => lens.filter((p) => lensMetaOf(p.key).scope === "pillar"), [lens]);

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
    trajectory: [],
    other: [],
  };
  for (const p of patterns.filter(matches)) patternsByConcern[p.concern].push(p);
  // Count every displayed concern tier — now INCLUDING trajectory (the structural
  // deterioration / divergence / recovery / composition cards the board used to hide).
  const matchedPatternCount = PATTERN_CONCERNS.reduce((n, c) => n + patternsByConcern[c].length, 0);

  // by-severity counts (over the shared accent map — crit / high / everything-else)
  const sevCounts = { critical: 0, high: 0, other: 0 };
  for (const p of prepared) {
    if (p.accent === "crit") sevCounts.critical += p.memberCount;
    else if (p.accent === "high") sevCounts.high += p.memberCount;
    else sevCounts.other += p.memberCount;
  }
  const sevMax = Math.max(sevCounts.critical, sevCounts.high, sevCounts.other, 1);

  const concernCounts: Record<Concern, number> = { ownership: 0, fundamentals: 0, momentum: 0, trajectory: 0, other: 0 };
  for (const p of prepared) concernCounts[p.concern] += p.memberCount;
  const concernMax = Math.max(...Object.values(concernCounts), 1);

  return (
    <Reveal>
      {/* header */}
      <SectionEyebrow
        className="mb-3 mt-0"
        label="Warnings console"
        icon={Icons.warning}
        accent="var(--high)"
        pill={`across the scored universe · ${view.scoredUniverseSize} names`}
      />

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
          <Tier title="Critical · Watch with care" count={`${shownFlags.length} firing`} icon={Icons.warning} accent="var(--crit)">
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

          <Tier title="Patterns" count={`${matchedPatternCount} firing`} icon={Icons.stack} accent="var(--p-mkt)">
            {PATTERN_CONCERNS.map((c) => (
              <div key={c} className="mb-4">
                <SubEyebrow label={CONCERN_GROUP_LABEL[c]} count={`${patternsByConcern[c].length} firing`} accent={CONCERN_ACCENT[c]} />
                {patternsByConcern[c].length > 0 ? (
                  patternsByConcern[c].map((p) => <PatternCard key={p.key} p={p} />)
                ) : (
                  <div className="rounded-lg border border-line bg-surface-1 px-3 py-2.5 text-[11.5px] text-ink3">
                    {c === "trajectory"
                      ? "No trajectory or divergence cards this snapshot."
                      : `No ${c} patterns this snapshot.`}
                  </div>
                )}
              </div>
            ))}
            {matchedPatternCount === 0 && (
              <p className="mt-0.5 text-[11px] italic text-ink3">
                Pattern engine is live — every category quiet this snapshot.
              </p>
            )}
          </Tier>

          <Tier title="Lens patterns · Cross-lens signals" count={`${lens.length} firing`} icon={Icons.compare} accent="var(--p-own)">
            <p className="mb-2.5 text-[11px] text-ink3">
              The three-lens (LM/LP) library — where a metric or pillar disagrees across its
              absolute bar, its peer field, and its own history. Descriptive reads on where the
              tension sits, never a forecast.
            </p>
            {lens.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div>
                  <SubEyebrow label="Metric-level (LM)" count={`${lensMetric.length} firing`} accent="var(--p-found)" />
                  {lensMetric.length > 0 ? (
                    lensMetric.map((p) => <LensPatternCard key={p.key} p={p} />)
                  ) : (
                    <div className="rounded-lg border border-line bg-surface-1 px-3 py-2.5 text-[11.5px] text-ink3">
                      No metric-level lens patterns this snapshot.
                    </div>
                  )}
                </div>
                <div>
                  <SubEyebrow label="Pillar-level (LP)" count={`${lensPillar.length} firing`} accent="var(--p-mom)" />
                  {lensPillar.length > 0 ? (
                    lensPillar.map((p) => <LensPatternCard key={p.key} p={p} />)
                  ) : (
                    <div className="rounded-lg border border-line bg-surface-1 px-3 py-2.5 text-[11.5px] text-ink3">
                      No pillar-level lens patterns this snapshot.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-surface-1 px-4 py-6 text-center text-[12px] text-ink3">
                No cross-lens patterns firing this snapshot — no metric or pillar is in three-lens disagreement.
              </div>
            )}
          </Tier>

          <Tier title="Threshold watch · Near a band edge" icon={Icons.target} accent="var(--high)">
            <ThresholdWatchSection
              atRisk={edgeWatchers.atRisk}
              approaching={edgeWatchers.approaching}
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
