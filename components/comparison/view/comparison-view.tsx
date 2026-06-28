"use client";

/**
 * The dedicated comparison VIEW — multi-tab side-by-side, rendered off the /api/compare
 * payload (useComparison). The alignment service already decided what is honestly
 * comparable; this component PRESENTS what the payload declares, faithfully.
 *
 * THE NON-NEGOTIABLE: no winner, anywhere. No win-tally, no per-metric winner highlight,
 * no "better/healthier", no ✓/✗. Both values are shown equally; the user judges. Family-
 * specific metrics are NEVER lined up cross-family (the payload separates them into
 * familyContext, gated on comparableDirectly). Peer ranks are never compared across
 * different peer groups (peerStandingComparable). The two stocks are two neutral hues.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { PILLAR_META } from "@/components/stock-detail/health/shared";
import type { PillarKey } from "@/types/health";
import type {
  ClassContext,
  ComparisonView as ComparisonViewModel,
  Comparee,
  UniversalMetric,
} from "@/types/compare";
import {
  A_HUE,
  B_HUE,
  CompareTable,
  FamilyMetricList,
  HonestEmpty,
  LegendAB,
  Panel,
  SectionTitle,
  formatMetricValue,
  type CompareRow,
} from "./shared";
import { PillarRadar } from "./pillar-radar";
import { OwnershipBars } from "./ownership-bars";
import { PillarMetricsSection } from "./pillar-metrics";
import { TrajectoryOverlay } from "./trajectory-overlay";
import { FindingColumns } from "./finding-columns";
import { PriceTab } from "./price-tab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "health", label: "Health" },
  { id: "fundamentals", label: "Fundamentals" },
  { id: "price", label: "Price" },
  { id: "ownership", label: "Ownership" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** Pull a subset of the universal axis (by key) into table rows — preserving the
 *  payload's labels/units. The payload is the single source of truth; we never invent. */
function rowsFor(metrics: UniversalMetric[], keys: string[]): CompareRow[] {
  const byKey = new Map(metrics.map((m) => [m.key, m]));
  return keys
    .map((k) => byKey.get(k))
    .filter((m): m is UniversalMetric => Boolean(m))
    .map((m) => ({ key: m.key, label: m.label, unit: m.unit, a: m.aValue, b: m.bValue }));
}

const HEALTH_KEYS = [
  "composite",
  "band",
  "trajectoryMarker",
  "divergenceFlag",
  "divergenceGap",
  "foundation",
  "momentum",
  "market",
  "ownership",
];
const FUND_UNIVERSAL_KEYS = [
  "roe",
  "patGrowthYoy",
  "basicEps",
  "bookValuePerShare",
  "totalAssets",
  "netWorth",
];
const OWNERSHIP_KEYS = ["promoterPct", "fiiPct", "diiPct", "pledgedPctOfPromoter"];

export function ComparisonView({ view }: { view: ComparisonViewModel }) {
  const router = useRouter();
  const params = useSearchParams();
  const activeTab = ((params.get("tab") as TabId) ?? "overview") as TabId;

  function setTab(tab: TabId) {
    const p = new URLSearchParams(params.toString());
    p.set("tab", tab);
    router.replace(`?${p.toString()}`, { scroll: false });
  }

  const { a, b } = view;

  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6">
      <Header view={view} />

      {/* Tab bar — matches the stock-detail page: a thin pillar-coloured underline marks
          the active tab (no thick border, no sticky backdrop-blur / glass). */}
      <div className="mt-6 border-b border-line">
        <div className="flex gap-1 overflow-x-auto overflow-y-hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative shrink-0 whitespace-nowrap px-4 py-2.5 text-[13px] font-medium transition-colors",
                activeTab === t.id ? "text-ink" : "text-ink3 hover:text-ink2",
              )}
            >
              {t.label}
              {activeTab === t.id && (
                <span
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full"
                  style={{ background: "var(--p-found)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "overview" && <OverviewTab view={view} setTab={setTab} />}
        {activeTab === "health" && <HealthTab view={view} />}
        {activeTab === "fundamentals" && <FundamentalsTab view={view} />}
        {activeTab === "price" && (
          <PriceTab aSymbol={a.symbol} bSymbol={b.symbol} aLabel={a.symbol} bLabel={b.symbol} />
        )}
        {activeTab === "ownership" && <OwnershipTab view={view} />}
      </div>
    </div>
  );
}

/* ------------------------------- Header -------------------------------- */

function EntityCard({ entity, hue }: { entity: Comparee; hue: string }) {
  return (
    <div className="flex-1 rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: hue }} />
        <span className="num text-base font-semibold text-ink">{entity.symbol}</span>
      </div>
      <p className="mt-1 truncate text-sm text-ink2">{entity.name}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink3">
        {entity.identity.sector && <span>{entity.identity.sector.displayName}</span>}
        <span className="rounded-full bg-line2 px-2 py-0.5 font-medium">
          {entity.familyLabel}
        </span>
      </div>
    </div>
  );
}

function Header({ view }: { view: ComparisonViewModel }) {
  const { a, b, comparability, warnings } = view;
  const crossFamily = comparability === "cross_family";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-ink3">
        <Icons.scales weight="duotone" className="h-4 w-4" />
        <span className="text-sm font-medium">Comparison</span>
        <Link
          href="/comparison"
          className="ml-auto text-xs text-ink3 transition-colors hover:text-ink2 hover:underline hover:underline-offset-3"
        >
          ← Back to comparison
        </Link>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <EntityCard entity={a} hue={A_HUE} />
        <span className="self-center rounded-full border border-line bg-surface-1 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink3">
          vs
        </span>
        <EntityCard entity={b} hue={B_HUE} />
      </div>

      {/* Comparability banner */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          crossFamily ? "border-line2 bg-surface-1" : "border-healthy/30 bg-healthy/5",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className={cn("mt-0.5 shrink-0", crossFamily ? "text-ctx" : "text-healthy")}>
            {crossFamily ? (
              <Icons.info className="h-4 w-4" />
            ) : (
              <Icons.check className="h-4 w-4" />
            )}
          </span>
          <div className="space-y-1">
            <p className="text-ink2 text-xs">
              {crossFamily ? (
                <>
                  <span className="font-medium text-ink">
                    Different families ({a.familyLabel} vs {b.familyLabel}).
                  </span>{" "}
                  Universal measures compare directly; sector-specific metrics are shown
                  separately and aren&apos;t directly comparable.
                </>
              ) : (
                <>
                  <span className="font-medium text-ink">
                    Same family ({a.familyLabel}).
                  </span>{" "}
                  Financial metrics line up directly across both.
                </>
              )}
            </p>
            {warnings.length > 0 && (
              <ul className="list-inside space-y-0.5 text-xs text-ink3">
                {warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Overview ------------------------------- */

function pillarData(view: ComparisonViewModel) {
  const { a, b } = view;
  return [
    { pillar: "Foundation", a: a.universal.foundation, b: b.universal.foundation },
    { pillar: "Momentum", a: a.universal.momentum, b: b.universal.momentum },
    { pillar: "Market", a: a.universal.market, b: b.universal.market },
    { pillar: "Ownership", a: a.universal.ownership, b: b.universal.ownership },
  ];
}

function CompositeBadge({ entity, hue }: { entity: Comparee; hue: string }) {
  const c = entity.universal.composite;
  const band = entity.universal.band;
  return (
    <div className="flex-1 rounded-xl border border-line bg-surface-1 p-4 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs text-ink3">
        <span className="h-2 w-2 rounded-full" style={{ background: hue }} />
        <span className="num">{entity.symbol}</span>
      </div>
      <div className="num mt-1 text-3xl font-semibold text-ink">
        {c !== null ? c.toFixed(1) : "—"}
      </div>
      <div className="mt-0.5 text-xs text-ink3">
        {band ? formatMetricValue(band, "band") : "Not scored"}
      </div>
    </div>
  );
}

/* A · Identity — both entities established side by side, A-hue / B-hue. The "what they do"
   editorial isn't part of the compare payload (zero-new-fetch), so each column links to the
   stock's full profile rather than fabricating one. */
function IdentityColumn({ entity, hue }: { entity: Comparee; hue: string }) {
  const id = entity.identity;
  return (
    <div className="flex-1 rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: hue }} />
        <span className="num text-base font-semibold text-ink">{entity.symbol}</span>
        <span className="rounded-full bg-line2 px-2 py-0.5 text-[11px] font-medium text-ink3">
          {entity.familyLabel}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink2">{entity.name}</p>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink3">Sector</dt>
          <dd className="truncate text-right text-ink2">{id.sector?.displayName ?? "—"}</dd>
        </div>
        {id.sectorClass && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink3">Class</dt>
            <dd className="text-right font-medium text-ink2">{id.sectorClass}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink3">Peer group</dt>
          <dd className="truncate text-right text-ink2">{id.peerGroup?.displayName ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink3">As of</dt>
          <dd className="num text-right text-ink2">{id.asOfDate || "—"}</dd>
        </div>
      </dl>
      <Link
        href={`/research/stock-screener/${entity.symbol}`}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink2 transition-colors hover:text-ink"
      >
        Full profile
        <Icons.arrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/* D · Where they differ most — the four pillar subtotals sorted by absolute gap. FACTUAL:
   the gap is a number; the two values are shown equally (A-hue / B-hue) with NO highlight of
   the higher. It routes attention to the dimensions worth examining (each row opens Health),
   never "A wins this pillar". */
function PillarGapList({
  view,
  onOpenHealth,
}: {
  view: ComparisonViewModel;
  onOpenHealth: () => void;
}) {
  const { a, b } = view;
  const pillars: { key: PillarKey; a: number | null; b: number | null }[] = [
    { key: "foundation", a: a.universal.foundation, b: b.universal.foundation },
    { key: "momentum", a: a.universal.momentum, b: b.universal.momentum },
    { key: "market", a: a.universal.market, b: b.universal.market },
    { key: "ownership", a: a.universal.ownership, b: b.universal.ownership },
  ];
  const rows = pillars
    .map((p) => ({ ...p, gap: p.a !== null && p.b !== null ? Math.abs(p.a - p.b) : null }))
    .sort((x, y) => {
      if (x.gap === null && y.gap === null) return 0;
      if (x.gap === null) return 1;
      if (y.gap === null) return -1;
      return y.gap - x.gap;
    });

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const meta = PILLAR_META[r.key];
        return (
          <button
            key={r.key}
            type="button"
            onClick={onOpenHealth}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-1 px-4 py-3 text-left transition-colors hover:border-line2"
          >
            <span className="h-3.5 w-[3px] shrink-0 rounded-full" style={{ background: meta.cssVar }} />
            <span className="w-24 shrink-0 text-sm font-medium text-ink">{meta.label}</span>
            <span className="num text-sm font-semibold" style={{ color: A_HUE }}>
              {r.a !== null ? r.a.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-ink3">vs</span>
            <span className="num text-sm font-semibold" style={{ color: B_HUE }}>
              {r.b !== null ? r.b.toFixed(1) : "—"}
            </span>
            <span className="ml-auto flex items-center gap-2.5">
              {r.gap !== null && (
                <span className="num rounded-full border border-line2 px-2.5 py-0.5 text-xs text-ink2">
                  gap {r.gap.toFixed(1)}
                </span>
              )}
              <Icons.arrowRight className="h-3.5 w-3.5 text-ink3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* F · Pond context — each entity's PG heat as a fact about ITS OWN peer group. The two are
   NOT compared (different ponds, different distributions). */
const POND_TONE: Record<"hot" | "warm" | "calm", string> = {
  hot: "var(--high)",
  warm: "var(--ctx)",
  calm: "var(--p-mkt)",
};
function PondCard({ entity, hue }: { entity: Comparee; hue: string }) {
  const pm = entity.pondMask;
  return (
    <div className="flex-1 rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-1.5 text-xs text-ink3">
        <span className="h-2 w-2 rounded-full" style={{ background: hue }} />
        <span className="num">{entity.symbol}</span>
      </div>
      {pm ? (
        <>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: POND_TONE[pm.heat] }} />
            <span className="text-sm font-semibold capitalize text-ink">{pm.heat} pond</span>
          </div>
          <p className="num mt-0.5 text-xs text-ink3">
            {pm.trailingMovePct !== null
              ? `Peer-group median ~21d move ${pm.trailingMovePct > 0 ? "+" : ""}${pm.trailingMovePct.toFixed(1)}%`
              : "Trailing move not on file."}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-ink3">No pond reading on file.</p>
      )}
    </div>
  );
}

function ClassContextNote({ ctx }: { ctx: ClassContext }) {
  return (
    <p className="mt-1.5 text-xs text-ink3">
      <span className="font-medium text-ink2">
        {ctx.sameClass ? ctx.aClass : `${ctx.aClass} · ${ctx.bClass}`}
      </span>
      {" — "}
      {ctx.note}
    </p>
  );
}

function OverviewTab({
  view,
  setTab,
}: {
  view: ComparisonViewModel;
  setTab: (tab: TabId) => void;
}) {
  const { a, b, comparability } = view;
  const crossFamily = comparability === "cross_family";
  const hasPond = Boolean(a.pondMask || b.pondMask);

  return (
    <div className="space-y-8">
      {/* A · Identity side by side */}
      <div>
        <SectionTitle
          icon={Icons.compass}
          accent="var(--p-found)"
          hint="The two businesses being compared, and how directly they line up."
        >
          What we&apos;re comparing
        </SectionTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <IdentityColumn entity={a} hue={A_HUE} />
          <IdentityColumn entity={b} hue={B_HUE} />
        </div>
        <p className="mt-2.5 text-xs text-ink3">
          {crossFamily
            ? `Different families (${a.familyLabel} vs ${b.familyLabel}) — universal measures compare directly; sector-specific ones are shown separately and aren't directly comparable.`
            : `Same family (${a.familyLabel}) — financial metrics line up directly across both.`}
        </p>
        {view.classContext && <ClassContextNote ctx={view.classContext} />}
      </div>

      {/* Health at a glance — the composite for each */}
      <div>
        <SectionTitle
          icon={Icons.health}
          accent="var(--p-found)"
          hint="Health composite — the family-agnostic 0–100 score, shown for each."
        >
          Health at a glance
        </SectionTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <CompositeBadge entity={a} hue={A_HUE} />
          <CompositeBadge entity={b} hue={B_HUE} />
        </div>
      </div>

      {/* B · Score shape — the pillar radar */}
      <Panel>
        <SectionTitle
          icon={Icons.stack}
          accent="var(--p-found)"
          hint="Where each is strong or soft across the four pillars — the shape of the difference."
        >
          Score shape
        </SectionTitle>
        <div className="mb-1 flex justify-end">
          <LegendAB aLabel={a.symbol} bLabel={b.symbol} />
        </div>
        <PillarRadar aLabel={a.symbol} bLabel={b.symbol} data={pillarData(view)} />
      </Panel>

      {/* C · Trajectory overlay — the temporal shape of difference (centerpiece) */}
      <Panel>
        <SectionTitle
          icon={Icons.chartLine}
          accent="var(--p-mom)"
          hint="Each company's health composite over time, on one 0–100 axis — converging, diverging, or moving apart. The paths are shown; you read them."
        >
          Trajectory over time
        </SectionTitle>
        <div className="mb-1 flex justify-end">
          <LegendAB aLabel={a.symbol} bLabel={b.symbol} />
        </div>
        <TrajectoryOverlay
          aLabel={a.symbol}
          bLabel={b.symbol}
          aSeries={a.trajectorySeries}
          bSeries={b.trajectorySeries}
        />
      </Panel>

      {/* D · Where they differ most — pillar-gap orientation */}
      <div>
        <SectionTitle
          icon={Icons.compare}
          accent="var(--p-found)"
          hint="The four pillars, ordered by the size of the gap between the two scores — a factual pointer to where they differ, not a verdict. Tap to open the Health detail."
        >
          Where they differ most
        </SectionTitle>
        <PillarGapList view={view} onOpenHealth={() => setTab("health")} />
      </div>

      {/* E · Findings — two independent per-entity lists, never row-paired */}
      <div>
        <SectionTitle
          icon={Icons.pulse}
          accent="var(--p-mkt)"
          hint="What fired for each company this period — shown as two independent lists. A pattern present for one and absent for the other is simply absent; the lists are not lined up against each other."
        >
          Notable findings
        </SectionTitle>
        <FindingColumns a={a} b={b} />
      </div>

      {/* F · Pond / context — per entity, explicitly NOT cross-compared */}
      {hasPond && (
        <div>
          <SectionTitle
            icon={Icons.fire}
            accent="var(--p-mom)"
            hint="Each company's peer-group price climate, stated on its own. The two ponds are different groups — these are not compared to each other."
          >
            Peer-group climate
          </SectionTitle>
          <div className="flex flex-col gap-3 sm:flex-row">
            <PondCard entity={a} hue={A_HUE} />
            <PondCard entity={b} hue={B_HUE} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Health -------------------------------- */

function PeerStandingCard({ entity, hue }: { entity: Comparee; hue: string }) {
  const ps = entity.peerStanding;
  return (
    <div className="flex-1 rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-1.5 text-xs text-ink3">
        <span className="h-2 w-2 rounded-full" style={{ background: hue }} />
        <span className="num">{entity.symbol}</span>
      </div>
      {ps ? (
        <>
          <div className="num mt-1 text-lg font-semibold text-ink">
            Rank {ps.rank}
            <span className="text-sm font-normal text-ink3"> of {ps.memberCount}</span>
          </div>
          <p className="mt-0.5 text-xs text-ink2">{ps.peerGroupName ?? "Peer group"}</p>
          <p className="num text-xs text-ink3">{ps.percentile}th percentile within its group</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-ink3">No peer standing on file.</p>
      )}
    </div>
  );
}

function HealthTab({ view }: { view: ComparisonViewModel }) {
  const { a, b } = view;
  const rows = rowsFor(view.universalMetrics, HEALTH_KEYS);

  return (
    <div className="space-y-6">
      <Panel>
        <SectionTitle
          icon={Icons.stack}
          accent="var(--p-found)"
          hint="The four pillar subtotals overlaid — same 0–100 scale for any family."
        >
          Pillar profile
        </SectionTitle>
        <div className="mb-1 flex justify-end">
          <LegendAB aLabel={a.symbol} bLabel={b.symbol} />
        </div>
        <PillarRadar aLabel={a.symbol} bLabel={b.symbol} data={pillarData(view)} />
      </Panel>

      <div>
        <SectionTitle
          icon={Icons.health}
          accent="var(--p-found)"
          hint="Exact scores, band, trajectory and divergence — stated for each, not ranked."
        >
          Health detail
        </SectionTitle>
        <CompareTable aLabel={a.symbol} bLabel={b.symbol} rows={rows} />
      </div>

      {/* Per-pillar metric depth — the metrics inside each pillar. */}
      <PillarMetricsSection view={view} />

      <div>
        <SectionTitle
          icon={Icons.crown}
          accent="var(--p-found)"
          hint={
            view.peerStandingComparable
              ? "Both sit in the same peer group, so their ranks are directly comparable."
              : "Each rank is relative to its OWN peer group — these are not compared across different groups."
          }
        >
          Peer standing
        </SectionTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PeerStandingCard entity={a} hue={A_HUE} />
          <PeerStandingCard entity={b} hue={B_HUE} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Fundamentals ----------------------------- */

function FundamentalsTab({ view }: { view: ComparisonViewModel }) {
  const { a, b, familyContext } = view;
  const universalRows = rowsFor(view.universalMetrics, FUND_UNIVERSAL_KEYS);

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle
          icon={Icons.coins}
          accent="var(--p-found)"
          hint="Cross-family measures present in every company — these compare directly."
        >
          Universal metrics
        </SectionTitle>
        <CompareTable aLabel={a.symbol} bLabel={b.symbol} rows={universalRows} />
      </div>

      {familyContext.comparableDirectly ? (
        // Same family → the family-specific set lines up directly, side by side.
        <div>
          <SectionTitle
            icon={Icons.building}
            accent="var(--p-found)"
            hint={`${a.familyLabel}-specific measures — both companies are ${a.familyLabel}, so these line up directly.`}
          >
            {a.familyLabel} metrics
          </SectionTitle>
          <CompareTable
            aLabel={a.symbol}
            bLabel={b.symbol}
            rows={familyContext.a.map((m) => {
              const bm = familyContext.b.find((x) => x.key === m.key);
              return {
                key: m.key,
                label: m.label,
                unit: m.unit,
                a: m.value,
                b: bm?.value ?? null,
              };
            })}
          />
        </div>
      ) : (
        // Cross family → render each side's family metrics in SEPARATE labeled sections.
        // Explicitly NOT a side-by-side — the payload separated them; we honor it.
        <div className="space-y-4">
          <div className="rounded-xl border border-line2 bg-surface-1 px-4 py-3 text-xs text-ink3">
            These two are in different families, so each one&apos;s sector-specific
            metrics are shown on their own below — they are not directly comparable to the
            other&apos;s.
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: A_HUE }} />
                <span className="text-sm font-semibold text-ink">
                  {a.familyLabel}-specific
                </span>
              </div>
              <p className="mb-2 text-xs text-ink3">
                Only meaningful within {a.familyLabel}.
              </p>
              <FamilyMetricList hue={A_HUE} rows={familyContext.a} />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: B_HUE }} />
                <span className="text-sm font-semibold text-ink">
                  {b.familyLabel}-specific
                </span>
              </div>
              <p className="mb-2 text-xs text-ink3">
                Only meaningful within {b.familyLabel}.
              </p>
              <FamilyMetricList hue={B_HUE} rows={familyContext.b} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Ownership ------------------------------- */

function OwnershipTab({ view }: { view: ComparisonViewModel }) {
  const { a, b } = view;
  const rows = rowsFor(view.universalMetrics, OWNERSHIP_KEYS);
  const aH = { promoter: a.universal.promoterPct, fii: a.universal.fiiPct, dii: a.universal.diiPct };
  const bH = { promoter: b.universal.promoterPct, fii: b.universal.fiiPct, dii: b.universal.diiPct };
  const hasComposition = [aH, bH].some(
    (h) => h.promoter !== null || h.fii !== null || h.dii !== null,
  );

  return (
    <div className="space-y-6">
      {hasComposition && (
        <Panel>
          <SectionTitle
            icon={Icons.sector}
            accent="var(--p-own)"
            hint="How each company's register splits across promoter, institutions and public — parts of one whole."
          >
            Ownership composition
          </SectionTitle>
          <OwnershipBars aLabel={a.symbol} bLabel={b.symbol} a={aH} b={bH} />
        </Panel>
      )}

      <div>
        <SectionTitle
          icon={Icons.building}
          accent="var(--p-own)"
          hint="Holding split and promoter pledge — universal, compares freely."
        >
          Ownership detail
        </SectionTitle>
        {rows.length > 0 ? (
          <CompareTable aLabel={a.symbol} bLabel={b.symbol} rows={rows} />
        ) : (
          <HonestEmpty>Ownership data not available for these stocks.</HonestEmpty>
        )}
      </div>
    </div>
  );
}
