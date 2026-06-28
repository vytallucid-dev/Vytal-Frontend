"use client";

/**
 * PER-PILLAR METRIC DEPTH — expands each pillar's subtotal into the constituent metrics
 * the health view already computed (Foundation/Momentum → `metrics[]`, Market →
 * `marketSubs[]`, Ownership → `ownership`). Pure pass-through: the compare service forwarded
 * these verbatim; nothing is re-scored here.
 *
 * ALIGNMENT (same gate as the fundamentals familyContext):
 *   • Foundation & Momentum metric KEYS are family-specific. SAME-family → lined up in one
 *     paired table by key. CROSS-family → each company's metrics shown SEPARATELY (the keys
 *     differ; they are never forced into a shared row).
 *   • Market sub-components (A1–D1) and the Ownership score structure are UNIVERSAL — same
 *     keys for any company — so they always line up.
 *
 * NO WINNER: both value columns are styled identically; there is no winner column and no
 * highlight of the "better" value. The small band dot on a value is that metric's OWN
 * condition band (exactly as the single-stock Health tab shows it) — shown equally for A and
 * B, it is a fact about each value, not a verdict between them. Honest "—" for absent /
 * missing metrics; suppressed metrics are dimmed, never fabricated.
 */

import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import {
  PILLAR_META,
  METRIC_BAND_META,
  fmt,
} from "@/components/stock-detail/health/shared";
import { getMetricLabel, getMarketSubLabel } from "@/lib/health/metric-labels";
import type {
  PillarKey,
  PillarView,
  MetricView,
  MarketSubView,
  OwnershipDetail,
  MetricBand,
  FlowCategoryKey,
} from "@/types/health";
import type { ComparisonView as ComparisonViewModel } from "@/types/compare";
import { A_HUE, B_HUE, Panel, SectionTitle, HonestEmpty } from "./shared";

const PILLAR_ORDER: PillarKey[] = ["foundation", "momentum", "market", "ownership"];

/* --------------------------- value + table shells --------------------------- */

interface PairRow {
  key: string;
  label: string;
  code?: string;
  aDisplay: string;
  bDisplay: string;
  aBand: MetricBand | null;
  bBand: MetricBand | null;
  aDim: boolean;
  bDim: boolean;
}

/** A single value cell — value in neutral ink, prefixed by its own condition-band dot
 *  (identical treatment for A and B). Dimmed when the metric wasn't scored. */
function ValueCell({
  display,
  band,
  dim,
}: {
  display: string;
  band: MetricBand | null;
  dim: boolean;
}) {
  const meta = band ? METRIC_BAND_META[band] : null;
  return (
    <span className={cn("inline-flex items-center justify-end gap-1.5", dim && "opacity-50")}>
      {meta && <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />}
      <span className="num text-ink">{display}</span>
    </span>
  );
}

/** The paired side-by-side metric table — A | B, no winner column, no highlight. */
function PairedTable({
  aLabel,
  bLabel,
  rows,
}: {
  aLabel: string;
  bLabel: string;
  rows: PairRow[];
}) {
  if (rows.length === 0) {
    return <HonestEmpty>No metric detail for this pillar.</HonestEmpty>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-1 text-left">
            <th className="px-4 py-2.5 font-medium text-ink3">Metric</th>
            <th className="px-4 py-2.5 text-right font-semibold">
              <span className="num" style={{ color: A_HUE }}>{aLabel}</span>
            </th>
            <th className="px-4 py-2.5 text-right font-semibold">
              <span className="num" style={{ color: B_HUE }}>{bLabel}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.key}
              className={cn("border-b border-line last:border-0", i % 2 === 1 && "bg-surface-1/50")}
            >
              <td className="px-4 py-2.5">
                <span className="text-ink2">{r.label}</span>
                {r.code && (
                  <span className="num ml-1.5 text-[10px] uppercase tracking-wider text-ink3">
                    {r.code}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <ValueCell display={r.aDisplay} band={r.aBand} dim={r.aDim} />
              </td>
              <td className="px-4 py-2.5 text-right">
                <ValueCell display={r.bDisplay} band={r.bBand} dim={r.bDim} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Cross-family case for foundation/momentum: ONE company's metric list, standalone. */
function SingleMetricList({
  hue,
  symbol,
  familyLabel,
  metrics,
}: {
  hue: string;
  symbol: string;
  familyLabel: string;
  metrics: MetricView[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: hue }} />
        <span className="num text-sm font-semibold text-ink">{symbol}</span>
        <span className="text-xs text-ink3">· {familyLabel} metrics</span>
      </div>
      {metrics.length === 0 ? (
        <HonestEmpty>No metric detail on file.</HonestEmpty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <tbody>
              {metrics.map((m, i) => (
                <tr
                  key={m.metricKey}
                  className={cn(
                    "border-b border-line last:border-0",
                    i % 2 === 1 && "bg-surface-1/50",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span className="text-ink2">{getMetricLabel(m.metricKey).label}</span>
                    <span className="num ml-1.5 text-[10px] uppercase tracking-wider text-ink3">
                      {m.metricKey}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ValueCell
                      display={metricDisplay(m)}
                      band={m.scoreState === "scored" ? m.l1Band : null}
                      dim={m.scoreState !== "scored"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ row builders ------------------------------- */

/** Raw value for a metric. Honest "—" when absent or when the value is missing
 *  (missing_renorm); suppressed/neutral metrics still show their real input, dimmed. */
function metricDisplay(m?: MetricView): string {
  if (!m) return "—";
  if (m.scoreState === "missing_renorm") return "—";
  return fmt(m.rawValue, 2);
}

function metricRows(aMetrics: MetricView[], bMetrics: MetricView[]): PairRow[] {
  const bByKey = new Map(bMetrics.map((m) => [m.metricKey, m]));
  const seen = new Set<string>();
  const rows: PairRow[] = [];
  const push = (key: string, am?: MetricView, bm?: MetricView) =>
    rows.push({
      key,
      label: getMetricLabel(key).label,
      code: key,
      aDisplay: metricDisplay(am),
      bDisplay: metricDisplay(bm),
      aBand: am && am.scoreState === "scored" ? am.l1Band : null,
      bBand: bm && bm.scoreState === "scored" ? bm.l1Band : null,
      aDim: !am || am.scoreState !== "scored",
      bDim: !bm || bm.scoreState !== "scored",
    });
  for (const am of aMetrics) {
    seen.add(am.metricKey);
    push(am.metricKey, am, bByKey.get(am.metricKey));
  }
  for (const bm of bMetrics) {
    if (!seen.has(bm.metricKey)) push(bm.metricKey, undefined, bm);
  }
  return rows;
}

function subDisplay(s?: MarketSubView): string {
  if (!s || !s.available || s.rawValue == null) return "—";
  return fmt(s.rawValue, 2);
}

function marketRows(aSubs: MarketSubView[], bSubs: MarketSubView[]): PairRow[] {
  const bByKey = new Map(bSubs.map((s) => [s.subComponent, s]));
  const seen = new Set<string>();
  const rows: PairRow[] = [];
  const push = (key: string, as?: MarketSubView, bs?: MarketSubView) =>
    rows.push({
      key,
      label: getMarketSubLabel(key).label,
      code: key,
      aDisplay: subDisplay(as),
      bDisplay: subDisplay(bs),
      aBand: as && as.available ? as.band : null,
      bBand: bs && bs.available ? bs.band : null,
      aDim: !as || !as.available,
      bDim: !bs || !bs.available,
    });
  for (const as of aSubs) {
    seen.add(as.subComponent);
    push(as.subComponent, as, bByKey.get(as.subComponent));
  }
  for (const bs of bSubs) {
    if (!seen.has(bs.subComponent)) push(bs.subComponent, undefined, bs);
  }
  return rows;
}

const FLOW_ORDER: { key: FlowCategoryKey; label: string }[] = [
  { key: "A_promoter", label: "Promoter flow" },
  { key: "B_institutional", label: "Institutional flow" },
  { key: "C_insider", label: "Insider flow" },
  { key: "D_block", label: "Block / bulk flow" },
];

function ownershipRows(ao: OwnershipDetail | null, bo: OwnershipDetail | null): PairRow[] {
  const rows: PairRow[] = [];
  const scoreRow = (key: string, label: string, av: number | null, bv: number | null) =>
    rows.push({
      key,
      label,
      aDisplay: av == null ? "—" : fmt(av, 1),
      bDisplay: bv == null ? "—" : fmt(bv, 1),
      aBand: null,
      bBand: null,
      aDim: av == null,
      bDim: bv == null,
    });

  scoreRow("baseline", "Baseline", ao?.baseline ?? null, bo?.baseline ?? null);
  scoreRow(
    "pledging",
    "Pledging adjustment",
    ao?.pledgingAdjustment ?? null,
    bo?.pledgingAdjustment ?? null,
  );

  const aFlow = new Map((ao?.flowCategories ?? []).map((f) => [f.category, f]));
  const bFlow = new Map((bo?.flowCategories ?? []).map((f) => [f.category, f]));
  for (const fc of FLOW_ORDER) {
    const af = aFlow.get(fc.key);
    const bf = bFlow.get(fc.key);
    scoreRow(
      fc.key,
      fc.label,
      af && af.categoryState === "scored" ? af.cappedSubScore : null,
      bf && bf.categoryState === "scored" ? bf.cappedSubScore : null,
    );
  }

  scoreRow("final", "Final ownership score", ao?.finalOwnership ?? null, bo?.finalOwnership ?? null);
  return rows;
}

/* ------------------------------- per pillar -------------------------------- */

function pillarHint(pillarKey: PillarKey, comparableDirectly: boolean): string {
  switch (pillarKey) {
    case "foundation":
    case "momentum":
      return comparableDirectly
        ? "Same family — these metrics share definitions and line up directly."
        : "Different families use different metric sets here, so each company's metrics are shown on their own.";
    case "market":
      return "Universal price-structure sub-components — the same set for any company.";
    case "ownership":
      return "Holding-score components — universal structure, lined up for both.";
  }
}

function PillarBlock({
  pillarKey,
  view,
  comparableDirectly,
}: {
  pillarKey: PillarKey;
  view: ComparisonViewModel;
  comparableDirectly: boolean;
}) {
  const { a, b } = view;
  const ap = a.pillars.find((p) => p.pillar === pillarKey) ?? null;
  const bp = b.pillars.find((p) => p.pillar === pillarKey) ?? null;
  if (!ap && !bp) return null;

  const meta = PILLAR_META[pillarKey];
  const aLabel = a.symbol;
  const bLabel = b.symbol;

  let body: React.ReactNode = null;

  if (pillarKey === "foundation" || pillarKey === "momentum") {
    const am = ap?.metrics ?? [];
    const bm = bp?.metrics ?? [];
    body = comparableDirectly ? (
      <PairedTable aLabel={aLabel} bLabel={bLabel} rows={metricRows(am, bm)} />
    ) : (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SingleMetricList hue={A_HUE} symbol={aLabel} familyLabel={a.familyLabel} metrics={am} />
        <SingleMetricList hue={B_HUE} symbol={bLabel} familyLabel={b.familyLabel} metrics={bm} />
      </div>
    );
  } else if (pillarKey === "market") {
    body = (
      <PairedTable
        aLabel={aLabel}
        bLabel={bLabel}
        rows={marketRows(ap?.marketSubs ?? [], bp?.marketSubs ?? [])}
      />
    );
  } else {
    body = (
      <PairedTable
        aLabel={aLabel}
        bLabel={bLabel}
        rows={ownershipRows(ap?.ownership ?? null, bp?.ownership ?? null)}
      />
    );
  }

  return (
    <Panel>
      <SectionTitle accent={meta.cssVar} hint={pillarHint(pillarKey, comparableDirectly)}>
        {meta.label}
      </SectionTitle>
      {body}
    </Panel>
  );
}

/* -------------------------------- section ---------------------------------- */

export function PillarMetricsSection({ view }: { view: ComparisonViewModel }) {
  const comparableDirectly = view.familyContext.comparableDirectly;
  return (
    <div className="space-y-5">
      <SectionTitle
        icon={Icons.stack}
        accent="var(--p-found)"
        hint={
          comparableDirectly
            ? "The metrics inside each pillar, lined up where both companies share the same family set."
            : "The metrics inside each pillar. Foundation and Momentum differ by family (shown per company); Market and Ownership structure are universal and line up."
        }
      >
        Pillar metrics
      </SectionTitle>
      {PILLAR_ORDER.map((pk) => (
        <PillarBlock
          key={pk}
          pillarKey={pk}
          view={view}
          comparableDirectly={comparableDirectly}
        />
      ))}
    </div>
  );
}
