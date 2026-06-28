"use client";

/**
 * The dedicated PEER-GROUP comparison VIEW — two FIELDS side by side, multi-tab.
 *
 * This is the distribution sibling of the stock ComparisonView. It compares the CHARACTER
 * of two fields (their health spread, dispersion, pillar medians, flag prevalence, rosters)
 * — never point estimates, and NEVER a winner. "Field A's median is higher" is a fact about
 * a distribution; it says nothing about whether A holds the better individual member, and we
 * never imply it does. Sector-specific metric distributions are aligned ONLY when the two
 * fields are the same family (same metric set); otherwise they are shown separately. Member
 * rosters are two INDEPENDENT lists — never row-paired as if member i of A pairs with i of B.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { BAND_META, PILLAR_META } from "@/components/stock-detail/health/shared";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import type {
  PeerGroupHealthView,
  PeerGroupMemberView,
} from "@/types/peer-group";
import type { LabelBand, PillarKey } from "@/types/health";
import {
  A_HUE,
  B_HUE,
  Panel,
  SectionTitle,
  HonestEmpty,
  InfoTip,
} from "../view/shared";
import {
  BandDistributionPaired,
  PillarMediansPaired,
  DispersionStrips,
  MetricDistRow,
  SingleMetricDist,
  MetricBandLegend,
  type DispersionField,
} from "./pg-charts";

const INDUSTRY_LABEL: Record<string, string> = {
  banking: "Banking",
  non_financial: "Non-Financial",
  mixed: "Mixed",
};
function familyLabel(path: string | null): string {
  return (path && INDUSTRY_LABEL[path]) || "Unclassified";
}

const TABS = [
  { id: "overview", label: "Field Overview" },
  { id: "health", label: "Health Distribution" },
  { id: "structure", label: "Structure" },
  { id: "rosters", label: "Rosters" },
  { id: "metrics", label: "Sector Metrics" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function PgComparisonView({
  a,
  b,
}: {
  a: PeerGroupHealthView;
  b: PeerGroupHealthView;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const activeTab = ((params.get("tab") as TabId) ?? "overview") as TabId;

  function setTab(tab: TabId) {
    const p = new URLSearchParams(params.toString());
    p.set("tab", tab);
    router.replace(`?${p.toString()}`, { scroll: false });
  }

  const aLabel = a.identity.displayName;
  const bLabel = b.identity.displayName;
  const pathA = a.identity.industryPath;
  const pathB = b.identity.industryPath;
  // Same-family gate (build #1's rule): both classified, identical, and not "mixed".
  const sameFamily = pathA != null && pathA !== "mixed" && pathA === pathB;

  // Cross-field member selection → opens a stock-vs-stock comparison. Two independent
  // rosters, but a member of either may be picked; pairing is the USER's choice, not implied.
  const [selected, setSelected] = useState<string[]>([]);
  function toggleSelect(symbol: string) {
    setSelected((prev) => {
      if (prev.includes(symbol)) return prev.filter((s) => s !== symbol);
      if (prev.length >= 2) return [prev[1], symbol];
      return [...prev, symbol];
    });
  }

  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6">
      <Header a={a} b={b} sameFamily={sameFamily} />

      {/* Tab bar — thin pillar-coloured underline marks the active tab. */}
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
        {activeTab === "overview" && <OverviewTab a={a} b={b} sameFamily={sameFamily} />}
        {activeTab === "health" && <HealthTab a={a} b={b} />}
        {activeTab === "structure" && <StructureTab a={a} b={b} />}
        {activeTab === "rosters" && (
          <RostersTab a={a} b={b} selected={selected} onToggle={toggleSelect} />
        )}
        {activeTab === "metrics" && <MetricsTab a={a} b={b} sameFamily={sameFamily} />}
      </div>

      {/* Cross-roster compare bar — appears once two members are selected. */}
      {selected.length === 2 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <Link
            href={`/comparison/${selected[0]}-vs-${selected[1]}`}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
          >
            <Icons.scales className="h-4 w-4" />
            <span className="num">
              Compare {selected[0]} vs {selected[1]}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Header -------------------------------- */

function FieldChip({ view, hue }: { view: PeerGroupHealthView; hue: string }) {
  const id = view.identity;
  return (
    <div className="flex-1 rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: hue }} />
        <span className="text-base font-semibold text-ink">{id.displayName}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink3">
        {id.sector && <span>{id.sector.displayName}</span>}
        <span className="rounded-full bg-line2 px-2 py-0.5 font-medium">
          {familyLabel(id.industryPath)}
        </span>
        <span className="num">{id.memberCount} members</span>
      </div>
      {view.aggregate?.descriptor && (
        <p className="mt-2 text-xs text-ink2">Field character: {view.aggregate.descriptor}</p>
      )}
    </div>
  );
}

function Header({
  a,
  b,
  sameFamily,
}: {
  a: PeerGroupHealthView;
  b: PeerGroupHealthView;
  sameFamily: boolean;
}) {
  const aFam = familyLabel(a.identity.industryPath);
  const bFam = familyLabel(b.identity.industryPath);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-ink3">
        <Icons.scales weight="duotone" className="h-4 w-4" />
        <span className="text-sm font-medium">Field comparison</span>
        <Link
          href="/comparison"
          className="ml-auto text-xs text-ink3 transition-colors hover:text-ink2 hover:underline hover:underline-offset-3"
        >
          ← Back to comparison
        </Link>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <FieldChip view={a} hue={A_HUE} />
        <span className="self-center rounded-full border border-line bg-surface-1 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink3">
          vs
        </span>
        <FieldChip view={b} hue={B_HUE} />
      </div>

      {/* Comparability banner */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          sameFamily ? "border-healthy/30 bg-healthy/5" : "border-line2 bg-surface-1",
        )}
      >
        <div className="flex items-start gap-2.5">
          <span className={cn("mt-0.5 shrink-0", sameFamily ? "text-healthy" : "text-ctx")}>
            {sameFamily ? (
              <Icons.check className="h-4 w-4" />
            ) : (
              <Icons.info className="h-4 w-4" />
            )}
          </span>
          <p className="text-xs text-ink2">
            {sameFamily ? (
              <>
                <span className="font-medium text-ink">Both {aFam} fields.</span> Universal
                health, spread and dispersion measures compare directly, and so do the
                sector-specific metric distributions (same metric set).
              </>
            ) : (
              <>
                <span className="font-medium text-ink">
                  Different field types ({aFam} vs {bFam}).
                </span>{" "}
                Universal measures — health spread, band mix, dispersion — compare directly.
                Each field&apos;s sector-specific metric distributions are shown separately,
                not aligned. A field median never implies its members are the better picks.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Overview ------------------------------- */

function PairedStat({
  label,
  info,
  a,
  b,
}: {
  label: string;
  info?: string;
  a: React.ReactNode;
  b: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
      <span className="flex flex-1 items-center gap-1.5 text-sm text-ink2">
        {label}
        {info && <InfoTip text={info} />}
      </span>
      <span className="num w-28 text-right text-sm font-medium" style={{ color: A_HUE }}>
        {a}
      </span>
      <span className="num w-28 text-right text-sm font-medium" style={{ color: B_HUE }}>
        {b}
      </span>
    </div>
  );
}

function redFlagRate(view: PeerGroupHealthView): number | null {
  const n = view.identity.memberCount;
  if (!n) return null;
  return (view.aggregate?.redFlagMemberCount ?? 0) / n;
}

function OverviewTab({
  a,
  b,
  sameFamily,
}: {
  a: PeerGroupHealthView;
  b: PeerGroupHealthView;
  sameFamily: boolean;
}) {
  const aAgg = a.aggregate;
  const bAgg = b.aggregate;
  const aRate = redFlagRate(a);
  const bRate = redFlagRate(b);

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle
          icon={Icons.compass}
          accent="var(--p-found)"
          hint="The two fields being compared, what binds each, and how directly they line up."
          info="A 'field' is a peer group — a set of companies bound by the same business model. We compare their distributions (the shape of the whole group), not any single company. 'Field character' is the templated read of the group's median band and spread."
        >
          What we&apos;re comparing
        </SectionTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <FieldChip view={a} hue={A_HUE} />
          <FieldChip view={b} hue={B_HUE} />
        </div>
        <p className="mt-2.5 text-xs text-ink3">
          {sameFamily
            ? "Same field type — every measure, including sector-specific metric distributions, compares directly."
            : "Different field types — universal distribution measures compare directly; sector-specific metrics are shown separately."}
        </p>
      </div>

      <div>
        <SectionTitle
          icon={Icons.health}
          accent="var(--p-found)"
          hint="Headline universal aggregates, stated for each field. Both shown equally — no field is ranked the 'winner'."
          info="These five measures are family-agnostic, so any two fields compare directly. A higher median is a fact about the group's centre — it never implies that field holds the better individual companies."
        >
          Field aggregates
        </SectionTitle>
        {aAgg && bAgg ? (
          <Panel>
            <div className="mb-1 flex items-center justify-end gap-3 text-[11px] font-medium">
              <span className="w-28 text-right" style={{ color: A_HUE }}>
                {a.identity.displayName}
              </span>
              <span className="w-28 text-right" style={{ color: B_HUE }}>
                {b.identity.displayName}
              </span>
            </div>
            <PairedStat
              label="Median composite"
              info="The middle member's 0–100 health score — half the field scores above it, half below. More robust to outliers than the mean."
              a={aAgg.medianComposite.toFixed(1)}
              b={bAgg.medianComposite.toFixed(1)}
            />
            <PairedStat
              label="Mean composite"
              info="The simple average of every scored member's composite. Compared with the median, a gap between the two hints at a skewed field (a few outliers pulling the average)."
              a={aAgg.meanComposite.toFixed(1)}
              b={bAgg.meanComposite.toFixed(1)}
            />
            <PairedStat
              label="Members (scored)"
              info="Roster size, with the number actually folded into this period's aggregate in parentheses. Members at an older period aren't scored into the snapshot."
              a={`${a.identity.memberCount} (${aAgg.scoredCount})`}
              b={`${b.identity.memberCount} (${bAgg.scoredCount})`}
            />
            <PairedStat
              label="% red-flagged"
              info="Share of the field firing at least one critical red flag — a RATE, not a raw count. Rates are comparable across different-size fields; raw counts (e.g. 3-of-6 vs 5-of-14) would mislead."
              a={aRate == null ? "—" : `${(aRate * 100).toFixed(0)}%`}
              b={bRate == null ? "—" : `${(bRate * 100).toFixed(0)}%`}
            />
          </Panel>
        ) : (
          <HonestEmpty>One of these fields has no scored snapshot to aggregate.</HonestEmpty>
        )}
      </div>
    </div>
  );
}

/* ------------------------- Health Distribution ------------------------- */

function HealthTab({ a, b }: { a: PeerGroupHealthView; b: PeerGroupHealthView }) {
  const aAgg = a.aggregate;
  const bAgg = b.aggregate;
  const aLabel = a.identity.displayName;
  const bLabel = b.identity.displayName;

  if (!aAgg || !bAgg) {
    return <HonestEmpty>Both fields need a scored snapshot to compare distributions.</HonestEmpty>;
  }

  const dispersionFields: DispersionField[] = [
    {
      label: aLabel,
      hue: A_HUE,
      members: a.members.map((m) => ({ symbol: m.symbol, composite: m.composite })),
      median: aAgg.medianComposite,
      p25: aAgg.dispersion.p25,
      p75: aAgg.dispersion.p75,
      min: aAgg.range?.min.composite ?? aAgg.medianComposite,
      max: aAgg.range?.max.composite ?? aAgg.medianComposite,
      stdDev: aAgg.dispersion.stdDev,
      iqr: aAgg.dispersion.iqr,
    },
    {
      label: bLabel,
      hue: B_HUE,
      members: b.members.map((m) => ({ symbol: m.symbol, composite: m.composite })),
      median: bAgg.medianComposite,
      p25: bAgg.dispersion.p25,
      p75: bAgg.dispersion.p75,
      min: bAgg.range?.min.composite ?? bAgg.medianComposite,
      max: bAgg.range?.max.composite ?? bAgg.medianComposite,
      stdDev: bAgg.dispersion.stdDev,
      iqr: bAgg.dispersion.iqr,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle
          icon={Icons.chartBar}
          accent="var(--p-found)"
          hint="What share of each field sits in each health band — the SHAPE of the spread. A field bunched at the top reads differently from one spread thin."
          info="Each bar is that band's share of the field (member counts normalised to a percentage), so two different-size fields compare fairly. Bands run Pristine (≥74) → Healthy → Steady → Below par → Fragile (<55). The trailing number is the raw member count. Hover a bar for its exact share and count."
        >
          Health spread
        </SectionTitle>
        <Panel>
          <BandDistributionPaired
            aDist={aAgg.bandDistribution}
            bDist={bAgg.bandDistribution}
            aLabel={aLabel}
            bLabel={bLabel}
          />
        </Panel>
      </div>

      <div>
        <SectionTitle
          icon={Icons.pulse}
          accent="var(--p-mom)"
          hint="Each field on one 0–100 composite axis: every member as a dot, the IQR box, and the median tick. How healthy, and how tight or spread."
          info="Each dot is one member's composite — hover it for the symbol and score. The shaded box is the interquartile range (IQR — the middle 50% of members); the solid tick is the median. A narrow box means a cohesive field; a wide one means scattered quality. σ is the standard deviation, IQR the p25–p75 width."
        >
          Median &amp; dispersion
        </SectionTitle>
        <Panel>
          <DispersionStrips fields={dispersionFields} />
        </Panel>
      </div>

      <div>
        <SectionTitle
          icon={Icons.stack}
          accent="var(--p-found)"
          hint="The four pillar medians for each field — universal 0–100, so they compare directly. The distribution-level analog of the score shape."
          info="Foundation (balance-sheet strength), Momentum (recent trajectory), Market (price structure) and Ownership (register quality) — each a 0–100 sub-score. These use the same scale for every family, so the medians compare directly. Shown as the field's median pillar, not any one member's. Hover a bar for the exact median."
        >
          Pillar medians
        </SectionTitle>
        <Panel>
          <PillarMediansPaired
            aMedians={aAgg.pillarMedians}
            bMedians={bAgg.pillarMedians}
            aLabel={aLabel}
            bLabel={bLabel}
          />
        </Panel>
      </div>

      <div>
        <SectionTitle
          icon={Icons.compare}
          accent="var(--p-mkt)"
          hint="The lowest and highest composite member in each field — stated per field, a factual edge of each distribution."
          info="The single weakest and strongest member by composite in each field — the edges of the distribution, not its typical. A wide gap between lowest and highest echoes the dispersion above. These are per-field facts and aren't paired across the two fields."
        >
          Range
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RangeCard view={a} hue={A_HUE} />
          <RangeCard view={b} hue={B_HUE} />
        </div>
      </div>
    </div>
  );
}

function RangeCard({ view, hue }: { view: PeerGroupHealthView; hue: string }) {
  const range = view.aggregate?.range;
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: hue }} />
        <span className="text-sm font-semibold text-ink">{view.identity.displayName}</span>
      </div>
      {range ? (
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink3">Lowest</span>
            <span className="num text-ink2">
              {range.min.symbol} · {range.min.composite.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink3">Highest</span>
            <span className="num text-ink2">
              {range.max.symbol} · {range.max.composite.toFixed(1)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink3">No range on file.</p>
      )}
    </div>
  );
}

/* ------------------------------ Structure ------------------------------ */

function StructureTab({ a, b }: { a: PeerGroupHealthView; b: PeerGroupHealthView }) {
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle
          icon={Icons.shield}
          accent="var(--c-fragile)"
          hint="Share of each field firing at least one critical red flag — a RATE, not a raw count. Comparing raw counts across different-size fields misleads; the rate does not."
          info="A red flag is a hard, rules-based warning (e.g. a covenant breach or sharp deterioration). The big number is the rate = flagged members ÷ roster size; the line below shows the raw count it came from. Three flagged of six (50%) is a heavier burden than five of fourteen (36%) — even though five is the bigger raw number. The rate makes that visible."
        >
          Red-flag prevalence
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RedFlagCard view={a} hue={A_HUE} />
          <RedFlagCard view={b} hue={B_HUE} />
        </div>
      </div>

      <div>
        <SectionTitle
          icon={Icons.stack}
          accent="var(--p-found)"
          hint="Field size — roster and how many carried a scored snapshot this period."
          info="Field size sets the context for every rate above: a 6-member field moves a lot on one company, a 14-member field far less. It's shown for transparency, never as a quality signal — a bigger field isn't a better one."
        >
          Field size
        </SectionTitle>
        <Panel>
          <div className="mb-1 flex items-center justify-end gap-3 text-[11px] font-medium">
            <span className="w-28 text-right" style={{ color: A_HUE }}>
              {a.identity.displayName}
            </span>
            <span className="w-28 text-right" style={{ color: B_HUE }}>
              {b.identity.displayName}
            </span>
          </div>
          <PairedStat
            label="Members (roster)"
            info="Every company bound into the peer group, scored or not."
            a={a.identity.memberCount}
            b={b.identity.memberCount}
          />
          <PairedStat
            label="Scored this period"
            info="Members with an in-force snapshot at the current period — the ones actually folded into the aggregates. Roster members at an older period are excluded."
            a={a.aggregate?.scoredCount ?? "—"}
            b={b.aggregate?.scoredCount ?? "—"}
          />
        </Panel>
      </div>

      <div className="rounded-xl border border-line2 bg-surface-1 px-4 py-3 text-xs text-ink3">
        Size concentration (leader market-cap share) needs per-member market caps, which
        aren&apos;t part of this view — so it&apos;s deliberately left out rather than estimated.
      </div>
    </div>
  );
}

function RedFlagCard({ view, hue }: { view: PeerGroupHealthView; hue: string }) {
  const n = view.identity.memberCount;
  const flagged = view.aggregate?.redFlagMemberCount ?? 0;
  const rate = n ? flagged / n : null;
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: hue }} />
        <span className="text-sm font-semibold text-ink">{view.identity.displayName}</span>
      </div>
      <div className="num text-2xl font-semibold text-ink">
        {rate == null ? "—" : `${(rate * 100).toFixed(0)}%`}
      </div>
      <p className="num mt-0.5 text-xs text-ink3">
        {flagged} of {n} members flagged
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line/60">
        <div
          className="h-full rounded-full bg-fragile"
          style={{ width: `${rate == null ? 0 : Math.min(100, rate * 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------- Rosters ------------------------------- */

type RosterSort = "composite_desc" | "composite_asc" | "name";

const SORT_LABELS: Record<RosterSort, string> = {
  composite_desc: "Composite ↓",
  composite_asc: "Composite ↑",
  name: "A – Z",
};

function sortMembers(members: PeerGroupMemberView[], sort: RosterSort): PeerGroupMemberView[] {
  const copy = [...members];
  switch (sort) {
    case "composite_desc":
      return copy.sort((x, y) => y.composite - x.composite);
    case "composite_asc":
      return copy.sort((x, y) => x.composite - y.composite);
    case "name":
      return copy.sort((x, y) => x.symbol.localeCompare(y.symbol));
  }
}

function RostersTab({
  a,
  b,
  selected,
  onToggle,
}: {
  a: PeerGroupHealthView;
  b: PeerGroupHealthView;
  selected: string[];
  onToggle: (symbol: string) => void;
}) {
  return (
    <div className="space-y-3">
      <SectionTitle
        icon={Icons.menu}
        accent="var(--p-found)"
        hint="Each field's members, ranked WITHIN its own field. Two independent lists — a member of one is never paired against a member of the other. Tap two (from either side) to open a stock-vs-stock comparison."
        info="Two independent lists, each sorted within its own field — position #3 on the left has no relationship to #3 on the right. Click a ticker to open its stock page, or tick any two (from either side) to launch a full stock-vs-stock comparison. Universal measures only; family-specific metrics live on the Sector Metrics tab."
      >
        Member rosters
      </SectionTitle>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Roster view={a} hue={A_HUE} selected={selected} onToggle={onToggle} />
        <Roster view={b} hue={B_HUE} selected={selected} onToggle={onToggle} />
      </div>
    </div>
  );
}

function Roster({
  view,
  hue,
  selected,
  onToggle,
}: {
  view: PeerGroupHealthView;
  hue: string;
  selected: string[];
  onToggle: (symbol: string) => void;
}) {
  const [sort, setSort] = useState<RosterSort>("composite_desc");
  const members = useMemo(() => sortMembers(view.members, sort), [view.members, sort]);

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: hue }} />
          <span className="truncate text-sm font-semibold text-ink">
            {view.identity.displayName}
          </span>
          <span className="num shrink-0 text-xs text-ink3">{view.members.length}</span>
          <InfoTip text="Each row: the rank within this field, the ticker (click to open), a trajectory arrow (↑ improving · ↓ deteriorating), the 0–100 composite, and the health band. The four thin bars below are the Foundation / Momentum / Market / Ownership pillars (0–100). Use the checkbox to pick two members to compare." />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface-1 px-2 py-1 text-xs text-ink2 outline-none transition-colors hover:border-line3 focus-visible:border-line3"
            >
              <span>{SORT_LABELS[sort]}</span>
              <Icons.caretDown className="h-3 w-3 text-ink3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-36">
            <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as RosterSort)}>
              {(["composite_desc", "composite_asc", "name"] as RosterSort[]).map((v) => (
                <DropdownMenuRadioItem key={v} value={v} className="text-xs">
                  {SORT_LABELS[v]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {members.length === 0 ? (
        <HonestEmpty>No members on file.</HonestEmpty>
      ) : (
        <ul className="space-y-1.5">
          {members.map((m, i) => (
            <RosterRow
              key={m.symbol}
              member={m}
              rank={i + 1}
              selected={selected.includes(m.symbol)}
              onToggle={() => onToggle(m.symbol)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

const TRAJ_META: Record<string, { icon: typeof Icons.trendUp; color: string }> = {
  improving: { icon: Icons.trendUp, color: "var(--c-healthy)" },
  deteriorating: { icon: Icons.trendDown, color: "var(--c-fragile)" },
  stable: { icon: Icons.pulse, color: "var(--ink3)" },
};

function RosterRow({
  member,
  rank,
  selected,
  onToggle,
}: {
  member: PeerGroupMemberView;
  rank: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const band = BAND_META[member.labelBand as LabelBand];
  const traj = member.trajectoryMarker ? TRAJ_META[member.trajectoryMarker] : null;
  const TrajIcon = traj?.icon;

  return (
    <li
      className={cn(
        "group relative rounded-lg border px-3 py-2 transition-colors",
        selected ? "border-line3 bg-line2/30" : "border-line hover:bg-line2/20",
      )}
    >
      {/* Pillar-scores tooltip — dark-surfaced, shown on row hover */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-xl border border-line bg-surface-1 p-2.5 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink3">
          Pillar scores
        </div>
        {(["foundation", "momentum", "market", "ownership"] as PillarKey[]).map((pk) => {
          const score = member.pillars[pk];
          const meta = PILLAR_META[pk];
          return (
            <div key={pk} className="flex items-center justify-between gap-2 py-0.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.cssVar }} />
                <span className="text-[11px] text-ink2">{meta.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-line/60">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, score))}%`,
                      background: meta.cssVar,
                    }}
                  />
                </div>
                <span className="num w-6 text-right text-[11px] font-semibold text-ink">
                  {score.toFixed(0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          aria-label={`Select ${member.symbol} to compare`}
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[10px] transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-line2 text-ink3 hover:border-line3",
          )}
        >
          {selected ? <Icons.check className="h-3 w-3" /> : <span className="num">{rank}</span>}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/research/stock-screener/${member.symbol}`}
              className="num truncate text-sm font-semibold text-ink transition-colors hover:text-p-found"
            >
              {member.symbol}
            </Link>
            {TrajIcon && (
              <TrajIcon className="h-3.5 w-3.5 shrink-0" style={{ color: traj!.color }} />
            )}
          </div>
          <p className="truncate text-[11px] text-ink3">{member.name}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="num text-sm font-semibold text-ink">
            {member.composite.toFixed(1)}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              band.bg,
              band.text,
            )}
          >
            {band.label}
          </span>
        </div>
      </div>

      {/* compact 4-pillar strip — universal 0–100, a per-member shape */}
      <div className="mt-1.5 flex items-center gap-1">
        {(["foundation", "momentum", "market", "ownership"] as PillarKey[]).map((pk) => (
          <div key={pk} className="h-1 flex-1 overflow-hidden rounded-full bg-line/60">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, member.pillars[pk]))}%`,
                background: PILLAR_META[pk].cssVar,
              }}
            />
          </div>
        ))}
      </div>
    </li>
  );
}

/* --------------------------- Sector Metrics ---------------------------- */

function MetricsTab({
  a,
  b,
  sameFamily,
}: {
  a: PeerGroupHealthView;
  b: PeerGroupHealthView;
  sameFamily: boolean;
}) {
  const aLabel = a.identity.displayName;
  const bLabel = b.identity.displayName;

  if (sameFamily) {
    const bByKey = new Map(b.metricDistributions.map((m) => [m.metricKey, m]));
    const pillars: ("foundation" | "momentum")[] = ["foundation", "momentum"];

    const groups = pillars
      .map((pillar) => ({
        pillar,
        metrics: a.metricDistributions.filter(
          (m) => m.pillar === pillar && bByKey.has(m.metricKey),
        ),
      }))
      .filter((g) => g.metrics.length > 0);

    if (groups.length === 0) {
      return <HonestEmpty>No shared metric distributions on file for these fields.</HonestEmpty>;
    }

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-healthy/30 bg-healthy/5 px-4 py-3 text-xs text-ink2">
          <span className="font-medium text-ink">
            Both {familyLabel(a.identity.industryPath)} fields.
          </span>{" "}
          Each metric&apos;s distribution is aligned by key — how each field&apos;s members
          spread across the metric&apos;s condition bands. Same metric, two fields, no winner.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MetricBandLegend />
          <InfoTip text="Each metric's bar shows how that field's members spread across the metric's condition bands — Excellent → Distress, best to worst. Segment width is the share of members in that band, so the bar is the SHAPE of the field on that metric. 'peer μ' (shown when the sample is large enough) is the group mean ± one standard deviation (σ) of the raw value." />
        </div>
        {groups.map((g) => (
          <div key={g.pillar}>
            <SectionTitle
              accent={PILLAR_META[g.pillar].cssVar}
              hint={`${PILLAR_META[g.pillar].label} metrics — the family's own set, aligned across both fields.`}
              info={
                g.pillar === "foundation"
                  ? "Foundation metrics gauge structural strength — for banks, things like Tier-1 capital, gross NPAs and provision coverage. Both fields are the same family, so the metric set is identical and aligns row-for-row."
                  : "Momentum metrics gauge the recent trajectory — for banks, things like NIM, net interest income growth and pre-provision profit. Same family means the same metric set, aligned row-for-row across both fields."
              }
            >
              {PILLAR_META[g.pillar].label} metrics
            </SectionTitle>
            <div className="space-y-3">
              {g.metrics.map((m) => (
                <MetricDistRow
                  key={m.metricKey}
                  metricKey={m.metricKey}
                  a={m}
                  b={bByKey.get(m.metricKey) ?? null}
                  aLabel={aLabel}
                  bLabel={bLabel}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Cross-family / mixed → NEVER align. Show each field's own metric set, separately.
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line2 bg-surface-1 px-4 py-3 text-xs text-ink3">
        <span className="font-medium text-ink2">
          Different field types ({familyLabel(a.identity.industryPath)} vs{" "}
          {familyLabel(b.identity.industryPath)}).
        </span>{" "}
        These fields use different metric sets, so each is shown on its own below — they are
        not directly comparable across field types (a banking field&apos;s NIM spread is not
        a non-financial field&apos;s ROCE spread).
      </div>
      <MetricBandLegend />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SeparateMetricColumn view={a} hue={A_HUE} />
        <SeparateMetricColumn view={b} hue={B_HUE} />
      </div>
    </div>
  );
}

function SeparateMetricColumn({ view, hue }: { view: PeerGroupHealthView; hue: string }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: hue }} />
        <span className="text-sm font-semibold text-ink">{view.identity.displayName}</span>
        <span className="text-xs text-ink3">· {familyLabel(view.identity.industryPath)}</span>
      </div>
      {view.metricDistributions.length === 0 ? (
        <HonestEmpty>No metric distributions on file.</HonestEmpty>
      ) : (
        <div className="space-y-3">
          {view.metricDistributions.map((m) => (
            <SingleMetricDist key={m.metricKey} metricKey={m.metricKey} dist={m} hue={hue} />
          ))}
        </div>
      )}
    </div>
  );
}
