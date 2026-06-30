"use client";

import { useState } from "react";
import { Icons } from "@/lib/icons";
import { SectionEyebrow, PILLAR_META } from "@/components/stock-detail/health/shared";
import { getMetricLabel } from "@/lib/health/metric-labels";
import type { PeerMetricDistribution } from "@/types/peer-group";
import type { MetricBand, LensRead } from "@/types/health";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────────
// THE underlying record — at parity with the stock-page raw-floor. Orientation is
// FLIPPED vs the old PG floor: rows = METRICS, columns = stock MEMBERS. Each cell is a
// member's raw value for that metric (unit-formatted, the hero). Expanding a metric row
// reveals each member's three-lens reads (vs bar / vs field / vs trend) — RAW reference
// values, never z-scores; honest "—" where a lens isn't evaluable. Per the PG contract,
// L3 (vs trend) is a plain STATE read, almost always the calm "building history" empty —
// NO sparkline ever on PG (the view is a cross-section, not a per-stock trend). The floor
// stays interpretation-free: NO lens-pattern labels here (that's the Field-Lens section /
// explorer). All / Foundation / Momentum filters which metric ROWS show.
// ─────────────────────────────────────────────────────────────────────────────────

const METRIC_BAND_VAR: Record<MetricBand, string> = {
  excellent: "var(--c-pristine)",
  good: "var(--c-healthy)",
  acceptable: "var(--c-steady)",
  concerning: "var(--c-below)",
  distress: "var(--c-fragile)",
};

type FloorFilter = "all" | "foundation" | "momentum";
type SortKey = "metric" | "median";

function fmtVal(v: number, unit?: string): string {
  const d = unit === "×" || unit === "ratio" ? 2 : Math.abs(v) >= 100 ? 0 : 1;
  return v.toFixed(d);
}
/** Absolute raw value WITH its unit — the floor's hero rendering ("18.4%", "0.42×"). */
function fmtRawWithUnit(v: number, unit?: string): string {
  const base = fmtVal(v, unit);
  switch (unit) {
    case "%": return `${base}%`;
    case "×": case "ratio": return `${base}×`;
    case "days": return `${base} days`;
    case "pp": return `${base}pp`;
    default: return base;
  }
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** L3 trend state → calm label. PG L3 is mostly the "building history" empty state. */
function trendStateLabel(l3: LensRead): string {
  if (l3.evaluable) {
    switch (l3.state) {
      case "improving": return "improving";
      case "declining": return "declining";
      case "flat": return "flat";
    }
  }
  // honest-empty — name WHY from the reason (building_history is the common case)
  return l3.reason === "building_history" ? "building history" : "—";
}

export function RawFloorSection({
  metrics,
}: {
  metrics: PeerMetricDistribution[];
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FloorFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("metric");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Stable union of member symbols across all metrics → the columns.
  const memberCols: string[] = [];
  const seen = new Set<string>();
  for (const dist of metrics) {
    for (const m of dist.members) {
      if (!seen.has(m.symbol)) { seen.add(m.symbol); memberCols.push(m.symbol); }
    }
  }
  memberCols.sort((a, b) => a.localeCompare(b));

  // Rows = metrics, filtered by pillar.
  const rows = filter === "all" ? metrics : metrics.filter((m) => m.pillar === filter);

  const sortedRows = [...rows].sort((a, b) => {
    if (sortKey === "metric") {
      const al = getMetricLabel(a.metricKey).label.toLowerCase();
      const bl = getMetricLabel(b.metricKey).label.toLowerCase();
      return al < bl ? -sortDir : al > bl ? sortDir : 0;
    }
    const am = median(a.members.map((m) => m.rawValue));
    const bm = median(b.members.map((m) => m.rawValue));
    return (am - bm) * sortDir;
  });

  const onSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(key === "metric" ? 1 : -1); }
    setExpanded(null);
  };

  if (metrics.length === 0) return null;

  return (
    <section>
      <SectionEyebrow label="The underlying record" icon={Icons.stack} accent="var(--p-own)" pill="every number behind the scores" />
      <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-3 text-ink2">
            <Icons.stack className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-[14px] font-semibold text-ink">Show the underlying data</span>
            <span className="block text-[12px] text-ink3">
              Every metric across the field — each member&apos;s raw value, and the three lenses behind
              its score. Metrics down, members across; sortable, on demand.
            </span>
          </span>
          <Icons.caretDown className={cn("size-5 shrink-0 text-ink3 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="px-5 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
              <p className="text-[11px] italic text-ink3">
                Click any metric to expand each member&apos;s three-lens breakdown. Quarterly/annual
                reported series is a later enrichment — current-period values shown.
              </p>
              {/* All / Foundation / Momentum — filters the metric ROWS */}
              <div className="inline-flex shrink-0 rounded-lg border border-line2 bg-surface-2 p-0.5 text-[11px]">
                {(["all", "foundation", "momentum"] as FloorFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { setFilter(f); setExpanded(null); }}
                    className={cn(
                      "rounded-md px-3 py-1 font-medium capitalize transition-colors",
                      filter === f ? "bg-surface-1 text-ink shadow-sm" : "text-ink3 hover:text-ink2",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th
                      onClick={() => onSort("metric")}
                      className="sticky left-0 z-10 cursor-pointer select-none whitespace-nowrap border-b border-line2 bg-surface-1 px-3 py-2.5 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink3 hover:text-ink2"
                    >
                      Metric {sortKey === "metric" && <span className="text-steady">{sortDir < 0 ? "▼" : "▲"}</span>}
                    </th>
                    {memberCols.map((sym) => (
                      <th
                        key={sym}
                        className="num whitespace-nowrap border-b border-line2 px-3 py-2.5 text-right text-[9.5px] font-semibold uppercase tracking-wide text-ink3"
                      >
                        {sym}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((dist) => (
                    <MetricRow
                      key={dist.metricKey}
                      dist={dist}
                      memberCols={memberCols}
                      isExp={expanded === dist.metricKey}
                      onToggle={() => setExpanded((e) => (e === dist.metricKey ? null : dist.metricKey))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10.5px] italic text-ink3">
              Raw values and the three lenses behind each score — Foundation &amp; Momentum metrics. The
              &ldquo;vs trend&rdquo; lens reads the member&apos;s own history; on the field cross-section
              it is mostly still building, shown as state, never a chart.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function BandChip({ band }: { band: MetricBand | null }) {
  if (!band) return <span className="text-ink3">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink2">
      <span className="size-2 rounded-sm" style={{ background: METRIC_BAND_VAR[band] }} />
      {band}
    </span>
  );
}

function MetricRow({
  dist,
  memberCols,
  isExp,
  onToggle,
}: {
  dist: PeerMetricDistribution;
  memberCols: string[];
  isExp: boolean;
  onToggle: () => void;
}) {
  const meta = getMetricLabel(dist.metricKey);
  const unit = meta.unit;
  const bySym = new Map(dist.members.map((m) => [m.symbol, m]));

  return (
    <>
      <tr className="group hover:bg-surface-2">
        <td
          onClick={onToggle}
          className="sticky left-0 z-10 cursor-pointer whitespace-nowrap border-b border-line bg-surface-1 px-3 py-2.5 text-left group-hover:bg-surface-2"
        >
          <span className="mr-1 text-[10px] text-ink3">{isExp ? "▾" : "▸"}</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ background: PILLAR_META[dist.pillar].cssVar }} />
            <span className="font-medium text-ink">{meta.label}</span>
            <span className="num text-[9px] uppercase tracking-wider text-ink3">{dist.metricKey}</span>
          </span>
        </td>
        {memberCols.map((sym) => {
          const cell = bySym.get(sym);
          const dim = cell ? cell.scoreState !== "scored" : false;
          return (
            <td
              key={sym}
              className={cn(
                "num whitespace-nowrap border-b border-line px-3 py-2.5 text-right font-medium text-ink",
                dim && "opacity-50",
              )}
              style={cell?.l1Band ? { color: METRIC_BAND_VAR[cell.l1Band] } : undefined}
            >
              {cell ? fmtRawWithUnit(cell.rawValue, unit) : <span className="text-ink3">—</span>}
            </td>
          );
        })}
      </tr>
      {isExp && (
        <tr>
          <td colSpan={memberCols.length + 1} className="border-b border-line2 bg-surface-2 p-0">
            <LensDetail dist={dist} memberCols={memberCols} />
          </td>
        </tr>
      )}
    </>
  );
}

/** A single raw reference value (bar / peer μ / own-history μ), honest "—" when the lens
 *  isn't evaluable. For L3 we show the STATE word (building history / improving…), never a μ. */
function Ref({ value, unit }: { value: number | null | undefined; unit?: string }) {
  return (
    <span className="num text-ink2">
      {value == null ? <span className="text-ink3">—</span> : fmtVal(value, unit)}
    </span>
  );
}

function LensDetail({ dist, memberCols }: { dist: PeerMetricDistribution; memberCols: string[] }) {
  const meta = getMetricLabel(dist.metricKey);
  const unit = meta.unit;
  const dirText =
    (dist.direction ?? "higher_better") === "higher_better" ? "Higher is healthier" : "Lower is healthier";
  // Render EVERY roster member, honest-empty for those without a score row on this metric —
  // consistent with the main grid (a thin metric shows all members, "—" where not scored).
  const bySym = new Map(dist.members.map((m) => [m.symbol, m]));
  const scoredCount = dist.members.filter((m) => m.scoreState === "scored").length;

  return (
    <div className="p-4">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[13px] font-medium text-ink">{meta.label}</span>
        <span className="num text-[9px] uppercase tracking-wider text-ink3">{dist.metricKey}</span>
        <span className="text-[10.5px] text-ink3">· {dirText}</span>
        {scoredCount < memberCols.length && (
          <span className="text-[10.5px] text-ink3">
            · {scoredCount} of {memberCols.length} members scored on this metric
          </span>
        )}
      </div>
      <div className="mb-3 text-[11px] text-ink3">
        Each member&apos;s value against the three lenses — vs its bar, vs the field, vs its own trend.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
              <th className="border-b border-line px-3 py-2 text-left">Member</th>
              <th className="border-b border-line px-3 py-2 text-right">Raw</th>
              <th className="border-b border-line px-3 py-2 text-right">vs bar</th>
              <th className="border-b border-line px-3 py-2 text-right">vs field</th>
              <th className="border-b border-line px-3 py-2 text-right">vs trend</th>
              <th className="border-b border-line px-3 py-2 text-right">Band</th>
            </tr>
          </thead>
          <tbody>
            {memberCols.map((sym) => {
              const m = bySym.get(sym);
              // Member has no score row for this metric → honest-empty row, never hidden.
              if (!m) {
                return (
                  <tr key={sym} className="opacity-50">
                    <td className="num whitespace-nowrap border-b border-line px-3 py-2 text-left font-medium text-ink2">
                      {sym}
                    </td>
                    <td className="border-b border-line px-3 py-2 text-right text-ink3">—</td>
                    <td className="border-b border-line px-3 py-2 text-right text-ink3">—</td>
                    <td className="border-b border-line px-3 py-2 text-right text-ink3">—</td>
                    <td className="border-b border-line px-3 py-2 text-right">
                      <span className="text-[10.5px] italic text-ink3">not scored</span>
                    </td>
                    <td className="border-b border-line px-3 py-2 text-right text-ink3">—</td>
                  </tr>
                );
              }
              const lens = m.lens;
              const dim = m.scoreState !== "scored";
              return (
                <tr key={sym} className={cn("hover:bg-surface-3/40", dim && "opacity-60")}>
                  <td className="num whitespace-nowrap border-b border-line px-3 py-2 text-left font-medium text-ink">
                    {sym}
                  </td>
                  <td className="num border-b border-line px-3 py-2 text-right font-medium text-ink">
                    {fmtRawWithUnit(m.rawValue, unit)}
                  </td>
                  {/* vs bar — L1 referenceValue (the acceptable bar) */}
                  <td className="border-b border-line px-3 py-2 text-right">
                    <Ref value={lens && lens.l1.evaluable ? lens.l1.referenceValue : null} unit={unit} />
                  </td>
                  {/* vs field — L2 referenceValue (peer μ) */}
                  <td className="border-b border-line px-3 py-2 text-right">
                    <Ref value={lens && lens.l2.evaluable ? lens.l2.referenceValue : null} unit={unit} />
                  </td>
                  {/* vs trend — L3 STATE (no μ, no chart); mostly "building history" */}
                  <td className="border-b border-line px-3 py-2 text-right">
                    {lens ? (
                      <span className={cn("text-[11.5px]", lens.l3.evaluable ? "text-ink2" : "italic text-ink3")}>
                        {trendStateLabel(lens.l3)}
                      </span>
                    ) : (
                      <span className="text-ink3">—</span>
                    )}
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right">
                    <BandChip band={m.l1Band} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10.5px] italic text-ink3">
        Raw is the reported value; vs bar / vs field are the absolute reference points (the acceptable
        bar and the field average), not z-scores. vs trend is the member&apos;s own-history state —
        deferred &ldquo;building history&rdquo; where too few quarters exist yet. Members not scored on
        this metric show &ldquo;—&rdquo;, never hidden.
      </p>
    </div>
  );
}
