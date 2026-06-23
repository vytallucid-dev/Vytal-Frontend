"use client";

/**
 * Activity tab — quarterly ownership & insider-activity ledger.
 *
 * Wired to GET /api/stocks/:symbol/ownership (useStockOwnership). Every figure
 * traces to a real /ownership field or an honest-empty state; nothing is mocked.
 * Reframed from the old real-time flow dashboard into a quarterly ledger because
 * the data is quarterly, event-driven and ownership-pillar-shaped.
 *
 * Theme: matches the Health tab (components/stock-detail/health/*) — Vytal tokens
 * only, .num on every number, the same eyebrow / panel / hairline rhythm. No raw
 * hex, no raw Tailwind colour names, no scoring surfaces (the ownership SCORE is
 * the Health tab's story — this tab shows who is moving, not a grade).
 */

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { Icons, type Icon } from "@/lib/icons";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/reveal";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { useStockOwnership } from "@/lib/api/hooks/use-stock-ownership";
import type {
  OwnershipSeriesPoint,
  OwnershipHolding,
  OwnershipAnatomy,
  InsiderEvent,
  BlockEvent,
  PledgingPoint,
} from "@/types/research-tools";
import type { FlowCategoryView } from "@/types/health";
import { SectionEyebrow, Panel, shortPeriod, humanizeKey } from "./health/shared";

// ════════════════════════════════════════════════════════════════════════════
// formatters — every number wears .num at the render site
// ════════════════════════════════════════════════════════════════════════════
const DASH = "—";

const fmtPct = (v: number | null | undefined, dp = 1) => (v == null ? DASH : `${v.toFixed(dp)}%`);

function fmtPp(v: number | null | undefined, dp = 2) {
  if (v == null) return DASH;
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}pp`;
}

function fmtSignedCr(v: number | null | undefined, dp = 1) {
  if (v == null) return DASH;
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}₹${Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp })} Cr`;
}

const fmtCr = (v: number | null | undefined, dp = 1) =>
  v == null ? DASH : `₹${v.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp })} Cr`;

const fmtPrice = (v: number | null | undefined) =>
  v == null ? DASH : `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Stringified BigInt share count → compact Indian (e.g. "8.50 L", "1.20 Cr"). */
function fmtShares(s: string | null | undefined) {
  if (s == null) return DASH;
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(2)} L`;
  return n.toLocaleString("en-IN");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(d: string | null | undefined) {
  if (!d) return DASH;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return d;
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} '${m[1].slice(2)}`;
}

// ════════════════════════════════════════════════════════════════════════════
// label maps — lowercase engine codes → display labels
// ════════════════════════════════════════════════════════════════════════════
const PERSON_CATEGORY_LABEL: Record<string, string> = {
  promoter: "Promoter",
  promoter_group: "Promoter group",
  director: "Director",
  kmp: "KMP",
  designated_employee: "Designated employee",
  immediate_relative: "Promoter relative",
  other: "Other",
};
const TXN_LABEL: Record<string, string> = {
  buy: "Buy",
  sell: "Sell",
  pledge: "Pledge",
  revoke_pledge: "Pledge release",
  esos: "ESOP",
  encumber: "Encumber",
  release: "Release",
  other: "Other",
};
const ACQ_MODE_LABEL: Record<string, string> = {
  market: "Open market",
  off_market: "Off-market",
  preferential_allotment: "Preferential",
  inter_se_transfer: "Inter-se transfer",
  esos: "ESOP",
  rights: "Rights",
  gift: "Gift",
};
const labelOf = (map: Record<string, string>, k: string) => map[k] ?? humanizeKey(k);

// ── flow-lane identity ──────────────────────────────────────────────────────
const FLOW_LABEL: Record<FlowCategoryView["category"], string> = {
  A_promoter: "Promoter",
  B_institutional: "Institutional",
  C_insider: "Insider",
  D_block: "Block & bulk",
};
const FLOW_ICON: Record<FlowCategoryView["category"], Icon> = {
  A_promoter: Icons.crown,
  B_institutional: Icons.building,
  C_insider: Icons.eye,
  D_block: Icons.stack,
};
const TREND_GLYPH: Record<string, string> = {
  three_up: "↑↑↑",
  three_down: "↓↓↓",
  mixed: "↕",
  neutral: "→",
};

// ── holding-split parts (donut + trend table), each a token colour ──────────
const HOLDING_PARTS: { key: keyof OwnershipHolding; label: string; cssVar: string }[] = [
  { key: "promoterPct", label: "Promoter", cssVar: "var(--p-mkt)" },
  { key: "fiiPct", label: "FII", cssVar: "var(--p-found)" },
  { key: "diiPct", label: "DII", cssVar: "var(--p-own)" },
  { key: "retailPct", label: "Retail", cssVar: "var(--p-mom)" },
  { key: "othersPct", label: "Others", cssVar: "var(--ink3)" },
];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--surface2)",
    border: "1px solid var(--line2)",
    borderRadius: 10,
    fontSize: 12,
  },
  labelStyle: { color: "var(--ink2)", fontSize: 11 },
} as const;

/** Direction chip — purely descriptive (Rising / Easing / Stable), no advice.
 *  `goodWhenUp=false` flips the tint so a rising pledge reads as concern. */
function dirChip(delta: number | null, goodWhenUp = true) {
  if (delta == null) return { glyph: "→", cls: "text-ink3", word: "Flat" };
  const eps = 0.05;
  if (delta > eps) return { glyph: "↑", cls: goodWhenUp ? "text-healthy" : "text-high", word: "Rising" };
  if (delta < -eps) return { glyph: "↓", cls: goodWhenUp ? "text-high" : "text-healthy", word: "Easing" };
  return { glyph: "→", cls: "text-ink2", word: "Stable" };
}

type WithHolding = OwnershipSeriesPoint & { holding: OwnershipHolding };
const hasHolding = (p: OwnershipSeriesPoint): p is WithHolding => p.holding != null;

// ════════════════════════════════════════════════════════════════════════════
// §3.1 — Flow-lane glance strip
// The 4 ownership flow lanes. C & D carry their own trend/value when their feeds
// wire; today they're dormant. A & B never expose a flow value (engine keys them
// on share-count / FII+DII deltas, not a net number) — so their direction is
// derived honestly from the holding series, never from a score.
// ════════════════════════════════════════════════════════════════════════════
function FlowGlanceStrip({
  current,
  series,
  hasScoredPeriod,
}: {
  current: OwnershipAnatomy | null;
  series: OwnershipSeriesPoint[];
  hasScoredPeriod: boolean;
}) {
  const holdings = series.filter(hasHolding);
  const latest = holdings.at(-1)?.holding ?? null;
  const prior = holdings.at(-2)?.holding ?? null;
  const hasHoldingData = latest != null || current?.holding != null;

  // Nothing to show at all — rare; parent only renders when hasAnyData.
  if (!hasHoldingData && !current) {
    return (
      <section>
        <SectionEyebrow label="Ownership flow" pill="4 lanes" />
        <Panel className="flex flex-col items-center gap-2 py-9 text-center">
          <Icons.chartLine weight="duotone" className="h-8 w-8 text-ink3" />
          <p className="text-[13px] font-medium text-ink">No holding data yet</p>
          <p className="max-w-md text-[12px] text-ink3">
            The flow lanes will appear once shareholding data is reported.
          </p>
        </Panel>
      </section>
    );
  }

  const derivedDelta = (cat: FlowCategoryView["category"]): number | null => {
    if (!latest || !prior) return null;
    if (cat === "A_promoter") {
      if (latest.promoterPct == null || prior.promoterPct == null) return null;
      return latest.promoterPct - prior.promoterPct;
    }
    if (cat === "B_institutional") {
      const a = (latest.fiiPct ?? 0) + (latest.diiPct ?? 0);
      const b = (prior.fiiPct ?? 0) + (prior.diiPct ?? 0);
      if (latest.fiiPct == null && latest.diiPct == null) return null;
      return a - b;
    }
    return null;
  };

  // ── SCORED path: flowCategories is populated (4 real lanes) ────────────────
  if (hasScoredPeriod && current && current.flowCategories.length > 0) {
    return (
      <section>
        <SectionEyebrow label="Ownership flow" pill="4 lanes" />
        <StaggerGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {current.flowCategories.map((f) => {
            const dormant = f.categoryState !== "scored";
            const Glyph = FLOW_ICON[f.category];
            const derive = f.category === "A_promoter" || f.category === "B_institutional";
            const delta = derive ? derivedDelta(f.category) : null;
            const chip = derive ? dirChip(delta) : null;

            return (
              <StaggerItem key={f.category}>
                <div
                  className={cn(
                    "h-full rounded-2xl border bg-surface-1 p-4",
                    dormant ? "border-dashed border-line2" : "border-line",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                        dormant ? "bg-surface-3 text-ink3" : "bg-p-own/10 text-p-own",
                      )}
                    >
                      <Glyph weight="fill" className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[12.5px] font-semibold text-ink">{FLOW_LABEL[f.category]}</span>
                  </div>

                  {dormant ? (
                    <p className="mt-3 text-[11px] italic text-ink3">
                      {f.categoryState === "dormant_no_feed" ? "Awaiting feed" : "No data"}
                    </p>
                  ) : derive ? (
                    <div className="mt-3">
                      <div className={cn("flex items-baseline gap-1.5", chip!.cls)}>
                        <span className="num text-[15px]">{chip!.glyph}</span>
                        <span className="text-[13px] font-medium">{chip!.word}</span>
                      </div>
                      <p className="num mt-1 text-[11px] text-ink3">
                        {delta == null ? "single quarter" : `${fmtPp(delta)} q/q holding`}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="flex items-baseline gap-2 text-ink2">
                        {f.trendState && <span className="num text-[14px]">{TREND_GLYPH[f.trendState] ?? "→"}</span>}
                        <span className="text-[12px]">{f.bandLanded ? humanizeKey(f.bandLanded) : "Neutral"}</span>
                      </div>
                      {f.netFlowValue != null && (
                        <p className="num mt-1 text-[11px] text-ink3">
                          {f.category === "D_block" ? `${fmtPp(f.netFlowValue)} m-cap` : fmtSignedCr(f.netFlowValue)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
        <p className="mt-2.5 text-[11px] italic text-ink3">
          Promoter &amp; institutional direction is read from the quarterly holding split. Insider and block
          lanes activate when their disclosure feeds wire — shown dormant, never hidden.
        </p>
      </section>
    );
  }

  // ── UNSCORED path: flowCategories is [] — build 4 tiles manually ────────────
  // A & B: direction derivable from the holding series right now.
  // C & D: dormant — scored values don't exist yet.
  type UnscoredLane = {
    category: FlowCategoryView["category"];
    live: boolean;
  };
  const unscoredLanes: UnscoredLane[] = [
    { category: "A_promoter", live: true },
    { category: "B_institutional", live: true },
    { category: "C_insider", live: false },
    { category: "D_block", live: false },
  ];

  return (
    <section>
      <SectionEyebrow label="Ownership flow" pill="4 lanes" />
      <StaggerGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {unscoredLanes.map(({ category, live }) => {
          const Glyph = FLOW_ICON[category];
          const delta = live ? derivedDelta(category) : null;
          const chip = live ? dirChip(delta) : null;

          return (
            <StaggerItem key={category}>
              <div
                className={cn(
                  "h-full rounded-2xl border bg-surface-1 p-4",
                  live ? "border-line" : "border-dashed border-line2",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                      live ? "bg-p-own/10 text-p-own" : "bg-surface-3 text-ink3",
                    )}
                  >
                    <Glyph weight="fill" className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[12.5px] font-semibold text-ink">{FLOW_LABEL[category]}</span>
                </div>

                {live ? (
                  <div className="mt-3">
                    <div className={cn("flex items-baseline gap-1.5", chip!.cls)}>
                      <span className="num text-[15px]">{chip!.glyph}</span>
                      <span className="text-[13px] font-medium">{chip!.word}</span>
                    </div>
                    <p className="num mt-1 text-[11px] text-ink3">
                      {delta == null ? "single quarter" : `${fmtPp(delta)} q/q holding`}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] italic text-ink3">Activates once scored</p>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
      <p className="mt-2.5 text-[11px] italic text-ink3">
        Promoter &amp; institutional direction is read from the quarterly holding split. Insider and block
        lanes activate once the period is scored — shown dormant, never hidden.
      </p>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §3.2 — Shareholding pattern (donut + quarterly trend + key changes)
// ════════════════════════════════════════════════════════════════════════════
function ShareholdingDonut({ holding }: { holding: OwnershipHolding }) {
  const parts = HOLDING_PARTS.map((p) => ({ ...p, value: holding[p.key] as number | null })).filter(
    (p) => p.value != null && (p.value as number) > 0,
  ) as { key: string; label: string; cssVar: string; value: number }[];

  if (parts.length === 0) {
    return (
      <div className="grid place-items-center py-10 text-center">
        <p className="text-[12px] text-ink3">No shareholding split reported for this period.</p>
      </div>
    );
  }

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[160px_1fr]">
      <div className="relative mx-auto h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={parts}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={74}
              paddingAngle={2}
              stroke="var(--surface)"
              strokeWidth={2}
              isAnimationActive
              animationDuration={900}
            >
              {parts.map((p) => (
                <Cell key={p.key} fill={p.cssVar} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(2)}%`, ""]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="kicker text-ink3">Promoter</div>
            <div className="num text-[18px] font-semibold text-ink">{fmtPct(holding.promoterPct)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {parts.map((p) => (
          <div key={p.key} className="flex items-center gap-2.5 text-[12.5px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: p.cssVar }} />
            <span className="text-ink2">{p.label}</span>
            <span className="num ml-auto text-ink">{fmtPct(p.value, 2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShareholdingSection({ current, series }: { current: OwnershipAnatomy; series: OwnershipSeriesPoint[] }) {
  const holdings = series.filter(hasHolding);
  const lastN = holdings.slice(-8); // oldest → newest
  const colsNewestFirst = [...lastN].reverse();
  const oldest = lastN[0]?.holding;
  const newest = lastN.at(-1)?.holding;

  // key changes — largest movers over the window, descriptive only
  const movers = HOLDING_PARTS.map((p) => {
    const a = newest?.[p.key] as number | null | undefined;
    const b = oldest?.[p.key] as number | null | undefined;
    const delta = a != null && b != null ? a - b : null;
    return { label: p.label, delta };
  })
    .filter((m) => m.delta != null && Math.abs(m.delta) >= 0.3)
    .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))
    .slice(0, 3);

  const keyChange =
    lastN.length < 2
      ? null
      : movers.length === 0
        ? "Ownership mix held broadly steady across the window."
        : movers.map((m) => `${m.label} ${fmtPp(m.delta)}`).join(" · ");

  return (
    <section>
      <SectionEyebrow label="Shareholding pattern" pill={`as of ${fmtDate(current.holding?.asOnDate)}`} />
      <Panel>
        <ShareholdingDonut holding={current.holding ?? ({} as OwnershipHolding)} />

        {lastN.length >= 2 && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="kicker mb-3">Quarterly trend</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                      Holder
                    </th>
                    {colsNewestFirst.map((p) => (
                      <th
                        key={p.periodKey}
                        className="num px-2 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide text-ink3"
                      >
                        {shortPeriod(p.periodKey)}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                      Δ window
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {HOLDING_PARTS.map((part) => {
                    const a = newest?.[part.key] as number | null | undefined;
                    const b = oldest?.[part.key] as number | null | undefined;
                    const delta = a != null && b != null ? a - b : null;
                    const chip = dirChip(delta);
                    return (
                      <tr key={part.key} className="border-t border-line">
                        <td className="px-2 py-2.5 text-left">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-sm" style={{ background: part.cssVar }} />
                            <span className="text-ink2">{part.label}</span>
                          </span>
                        </td>
                        {colsNewestFirst.map((p) => (
                          <td key={p.periodKey} className="num px-2 py-2.5 text-right text-ink">
                            {fmtPct(p.holding[part.key] as number | null)}
                          </td>
                        ))}
                        <td className={cn("num px-2 py-2.5 text-right", chip.cls)}>{fmtPp(delta)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {keyChange && (
              <p className="num mt-3 text-[11.5px] text-ink2">
                <span className="text-ink3">Over {lastN.length} quarters · </span>
                {keyChange}
              </p>
            )}
          </div>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §3.3 — Promoter & pledging  (+ R1 pledge red-flag sub-surface)
// ════════════════════════════════════════════════════════════════════════════
interface R1Vals {
  pledgeRatioQ: number | null;
  pledgeRatioQ1: number | null;
  qoqRisePp: number | null;
  thresholdPct: number;
  thresholdQoqRisePp: number;
  breaches: string[];
}

function R1FlagCard({ current }: { current: OwnershipAnatomy }) {
  // Calm state — no red-flag. Distinguish "within thresholds" from "no pledge data".
  if (!current.r1Fired) {
    const pledge = current.holding?.pledgedPctOfPromoter;
    const calm =
      pledge == null
        ? "No promoter pledging reported this period."
        : pledge === 0
          ? "No promoter shares are pledged."
          : pledge < 50
            ? `Promoter pledging at ${fmtPct(pledge, 2)} of holding — within the 50% red-flag threshold.`
            : // ≥50% but R1 hasn't run (unscored) — state the level factually, no threshold verdict
              `Promoter pledging at ${fmtPct(pledge, 2)} of promoter holding.`;
    return (
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
        <Icons.success weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-healthy" />
        <div>
          <p className="text-[13px] font-medium text-ink">No pledge red-flag</p>
          <p className="num mt-0.5 text-[12px] text-ink2">{calm}</p>
        </div>
      </div>
    );
  }

  // Firing — severity surface. Render the engine's verbatim breach strings.
  const v = current.r1TriggeringValues as R1Vals | null;
  const easing = v?.qoqRisePp != null && v.qoqRisePp < 0;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-crit/40 bg-crit/12 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-crit/12 text-fragile">
          <Icons.warning weight="fill" className="h-4 w-4" />
        </span>
        <span className="text-[14px] font-semibold text-ink">R1 · Promoter pledge red-flag</span>
        <span className="ml-auto rounded-md border border-crit/40 bg-crit/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-fragile">
          Watch With Care
        </span>
      </div>

      {/* verbatim engine breach language */}
      {v?.breaches?.length ? (
        <ul className="mt-3 space-y-1.5">
          {v.breaches.map((b, i) => (
            <li key={i} className="num flex items-start gap-2 text-[12.5px] text-ink">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fragile" />
              {b}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12.5px] text-ink2">A promoter-pledge red-flag is firing this period.</p>
      )}

      {/* supporting numbers */}
      {v && (
        <div className="mt-3.5 grid gap-2.5 border-t border-crit/40 pt-3.5 sm:grid-cols-3">
          <div>
            <div className="kicker text-ink3">Pledged now</div>
            <div className="num mt-1 text-[14px] text-ink">
              {fmtPct(v.pledgeRatioQ, 2)}
              <span className="ml-1 text-[11px] text-ink3">vs {v.thresholdPct}% bar</span>
            </div>
          </div>
          <div>
            <div className="kicker text-ink3">Prior quarter</div>
            <div className="num mt-1 text-[14px] text-ink">{fmtPct(v.pledgeRatioQ1, 2)}</div>
          </div>
          <div>
            <div className="kicker text-ink3">Quarter move</div>
            <div className={cn("num mt-1 text-[14px]", easing ? "text-healthy" : "text-fragile")}>
              {fmtPp(v.qoqRisePp)}
              <span className="ml-1 text-[11px] text-ink3">{easing ? "easing" : "rising"}</span>
            </div>
          </div>
        </div>
      )}
      <p className="mt-3 border-l-2 border-crit/40 pl-3 text-[11.5px] italic text-ink3">
        A state to investigate — pledged promoter shares can be recalled or sold by lenders on a margin
        shortfall. This describes the disclosure, not an action to take.
      </p>
    </div>
  );
}

function PromoterPledgeSection({
  current,
  series,
  pledging,
}: {
  current: OwnershipAnatomy;
  series: OwnershipSeriesPoint[];
  pledging: PledgingPoint[];
}) {
  const promoterPoints = series
    .filter(hasHolding)
    .map((p) => ({ period: shortPeriod(p.periodKey), promoter: p.holding.promoterPct }))
    .filter((p) => p.promoter != null);

  const pledgePoints = pledging
    .map((p) => {
      const fy = p.fiscalYear.startsWith("FY") ? p.fiscalYear : `FY${p.fiscalYear}`;
      const q = p.quarter.startsWith("Q") ? p.quarter : `Q${p.quarter}`;
      return { period: shortPeriod(`${fy}${q}`), pledge: p.pledgedPctOfPromoter };
    })
    .filter((p) => p.pledge != null);

  const hasPledgeHistory = pledgePoints.length >= 2 && pledgePoints.some((p) => (p.pledge as number) > 0);

  return (
    <section>
      <SectionEyebrow label="Promoter & pledging" pill={`${promoterPoints.length} quarters`} />
      <Panel>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* promoter holding trend */}
          <div>
            <div className="kicker mb-2">Promoter holding</div>
            {promoterPoints.length >= 2 ? (
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={promoterPoints} margin={{ top: 8, right: 10, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} width={38} domain={["auto", "auto"]} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(2)}%`, "Promoter"]} />
                  <Line
                    type="monotone"
                    dataKey="promoter"
                    stroke="var(--p-mkt)"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "var(--p-mkt)" }}
                    activeDot={{ r: 4 }}
                    isAnimationActive
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-[12px] text-ink3">Building history — one quarter so far.</p>
            )}
          </div>

          {/* current pledge stats + history */}
          <div>
            <div className="kicker mb-2">Pledging</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="text-[11px] text-ink3">% of promoter</div>
                <div className="num mt-1 text-[18px] font-semibold text-ink">
                  {fmtPct(current.holding?.pledgedPctOfPromoter, 2)}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="text-[11px] text-ink3">% of total</div>
                <div className="num mt-1 text-[18px] font-semibold text-ink">
                  {fmtPct(current.holding?.pledgedPctOfTotal, 2)}
                </div>
              </div>
            </div>
            {hasPledgeHistory ? (
              <ResponsiveContainer width="100%" height={92}>
                <AreaChart data={pledgePoints} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="pledgeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--crit)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--crit)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, "auto"]} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(2)}%`, "Pledged"]} />
                  <Area
                    type="monotone"
                    dataKey="pledge"
                    stroke="var(--crit)"
                    strokeWidth={1.5}
                    fill="url(#pledgeFill)"
                    isAnimationActive
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="mt-3 text-[11px] italic text-ink3">
                {current.holding?.pledgedPctOfPromoter ? "Pledge history fills in across quarters." : "No promoter pledging on record."}
              </p>
            )}
          </div>
        </div>

        <R1FlagCard current={current} />
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §3.4 — Insider activity (NSE PIT disclosures)
// ════════════════════════════════════════════════════════════════════════════
function InsiderCard({ e }: { e: InsiderEvent }) {
  const isBuy = e.transactionType === "buy";
  const isSell = e.transactionType === "sell";
  const accent = isBuy ? "text-healthy" : isSell ? "text-high" : "text-ink2";
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-3.5">
      <div className="flex items-center gap-2">
        <span className="text-[12.5px] font-medium text-ink">{e.personName}</span>
        <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[9.5px] text-ink3">
          {labelOf(PERSON_CATEGORY_LABEL, e.personCategory)}
        </span>
        <span className={cn("ml-auto text-[11px] font-semibold", accent)}>{labelOf(TXN_LABEL, e.transactionType)}</span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[11.5px] text-ink2">
        <span className="num text-ink">{fmtCr(e.tradeValueCr)}</span>
        <span className="num">{fmtShares(e.securitiesTraded)} sh</span>
        {e.holdingPctDelta != null && <span className="num">{fmtPp(e.holdingPctDelta)}</span>}
        <span className="num ml-auto text-ink3">{fmtDate(e.tradeDate)}</span>
      </div>
      {(e.acquisitionMode || e.regulation) && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-ink3">
          {e.acquisitionMode && (
            <span className="rounded bg-surface-3 px-1.5 py-0.5">{labelOf(ACQ_MODE_LABEL, e.acquisitionMode)}</span>
          )}
          {e.regulation && <span className="num rounded bg-surface-3 px-1.5 py-0.5">Reg {e.regulation}</span>}
        </div>
      )}
    </div>
  );
}

function InsiderSection({ insider, current }: { insider: InsiderEvent[]; current: OwnershipAnatomy | null }) {
  const cLane = current?.flowCategories.find((f) => f.category === "C_insider");
  const dormant = !cLane || cLane.categoryState !== "scored";

  if (insider.length === 0) {
    return (
      <section>
        <SectionEyebrow label="Insider activity" pill="PIT disclosures" />
        <Panel className="flex flex-col items-center gap-2 py-9 text-center">
          <Icons.eye weight="duotone" className="h-8 w-8 text-ink3" />
          <p className="text-[13px] font-medium text-ink">No insider transactions on record</p>
          <p className="max-w-md text-[12px] text-ink3">
            {dormant
              ? "The NSE PIT disclosure feed is not yet wired for this surface — director and promoter trades will list here once it activates."
              : "No SEBI PIT-disclosed insider trades in the current window."}
          </p>
        </Panel>
      </section>
    );
  }

  const buys = insider.filter((e) => e.transactionType === "buy");
  const sells = insider.filter((e) => e.transactionType === "sell");
  const netCr =
    buys.reduce((s, e) => s + (e.tradeValueCr ?? 0), 0) - sells.reduce((s, e) => s + (e.tradeValueCr ?? 0), 0);

  return (
    <section>
      <SectionEyebrow label="Insider activity" pill={`${insider.length} disclosed`} />
      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
          <span className="text-ink2">
            <span className="num text-healthy">{buys.length}</span> buys
          </span>
          <span className="text-ink2">
            <span className="num text-high">{sells.length}</span> sells
          </span>
          <span className="text-ink2">
            Net <span className={cn("num", netCr >= 0 ? "text-healthy" : "text-high")}>{fmtSignedCr(netCr)}</span>
          </span>
          {cLane?.trendState && (
            <span className="num ml-auto text-[11px] text-ink3">trend {TREND_GLYPH[cLane.trendState] ?? "→"}</span>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {buys.length > 0 && (
            <div className="space-y-2.5">
              <div className="kicker text-healthy">Acquired</div>
              {buys.map((e, i) => (
                <InsiderCard key={`b${i}`} e={e} />
              ))}
            </div>
          )}
          {sells.length > 0 && (
            <div className="space-y-2.5">
              <div className="kicker text-high">Sold</div>
              {sells.map((e, i) => (
                <InsiderCard key={`s${i}`} e={e} />
              ))}
            </div>
          )}
        </div>
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §3.5 — Bulk & block deals (single-client rows; no fabricated buyer/seller pairs)
// ════════════════════════════════════════════════════════════════════════════
function DealTable({ rows }: { rows: BlockEvent[] }) {
  const buys = rows.filter((r) => r.transactionType === "buy");
  const sells = rows.filter((r) => r.transactionType === "sell");
  const netCr =
    buys.reduce((s, r) => s + (r.valueCr ?? 0), 0) - sells.reduce((s, r) => s + (r.valueCr ?? 0), 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {["Date", "Client", "Side", "Qty", "Price", "Value"].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "px-2 py-2 text-[9.5px] font-semibold uppercase tracking-wide text-ink3",
                    i >= 3 ? "text-right" : "text-left",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isBuy = r.transactionType === "buy";
              return (
                <tr key={i} className="border-t border-line">
                  <td className="num px-2 py-2.5 text-left text-ink3">{fmtDate(r.dealDate)}</td>
                  <td className="px-2 py-2.5 text-left text-ink">{r.clientName}</td>
                  <td className="px-2 py-2.5 text-left">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        isBuy ? "bg-healthy/10 text-healthy" : "bg-high/10 text-high",
                      )}
                    >
                      {labelOf(TXN_LABEL, r.transactionType)}
                    </span>
                  </td>
                  <td className="num px-2 py-2.5 text-right text-ink2">{fmtShares(r.quantity)}</td>
                  <td className="num px-2 py-2.5 text-right text-ink2">{fmtPrice(r.price)}</td>
                  <td className="num px-2 py-2.5 text-right text-ink">{fmtCr(r.valueCr)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-2.5 text-[11.5px] text-ink2">
        <span>
          <span className="num text-healthy">{buys.length}</span> buy
        </span>
        <span>
          <span className="num text-high">{sells.length}</span> sell
        </span>
        <span>
          Net <span className={cn("num", netCr >= 0 ? "text-healthy" : "text-high")}>{fmtSignedCr(netCr)}</span>
        </span>
      </div>
    </div>
  );
}

function DealsSection({ block, current }: { block: BlockEvent[]; current: OwnershipAnatomy | null }) {
  const dLane = current?.flowCategories.find((f) => f.category === "D_block");
  const dormant = !dLane || dLane.categoryState !== "scored";
  const bulk = block.filter((b) => b.dealType === "bulk");
  const blk = block.filter((b) => b.dealType === "block");

  if (block.length === 0) {
    return (
      <section>
        <SectionEyebrow label="Bulk & block deals" pill="NSE bhavcopy" />
        <Panel className="flex flex-col items-center gap-2 py-9 text-center">
          <Icons.stack weight="duotone" className="h-8 w-8 text-ink3" />
          <p className="text-[13px] font-medium text-ink">No bulk or block deals on record</p>
          <p className="max-w-md text-[12px] text-ink3">
            {dormant
              ? "The NSE bulk/block-deal feed is not yet wired for this surface — large single-counterparty trades will list here once it activates."
              : "No qualifying bulk or block deals in the current window."}
          </p>
        </Panel>
      </section>
    );
  }

  return (
    <section>
      <SectionEyebrow label="Bulk & block deals" pill={`${block.length} deals`} />
      <div className="grid gap-3.5 lg:grid-cols-2">
        {bulk.length > 0 && (
          <Panel>
            <div className="kicker mb-3">Bulk deals</div>
            <DealTable rows={bulk} />
          </Panel>
        )}
        {blk.length > 0 && (
          <Panel>
            <div className="kicker mb-3">Block deals</div>
            <DealTable rows={blk} />
          </Panel>
        )}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §3.6 — Institutional ownership, quarterly (combined FII + DII; not split)
// Sourced from the holding series — the institutional flow LANE exposes no net
// value, so we plot the real combined position each quarter, honestly captioned.
// ════════════════════════════════════════════════════════════════════════════
function InstitutionalSection({ series }: { series: OwnershipSeriesPoint[] }) {
  const points = series
    .filter(hasHolding)
    .map((p) => {
      const { fiiPct, diiPct } = p.holding;
      const inst = fiiPct == null && diiPct == null ? null : (fiiPct ?? 0) + (diiPct ?? 0);
      return { period: shortPeriod(p.periodKey), inst, fii: fiiPct, dii: diiPct };
    })
    .filter((p) => p.inst != null);

  return (
    <section>
      <SectionEyebrow label="Institutional ownership" pill="quarterly · combined" />
      <Panel>
        {points.length >= 2 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="instFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--p-found)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--p-found)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} width={38} domain={["auto", "auto"]} />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number, name) => [`${v.toFixed(2)}%`, name === "inst" ? "FII + DII" : name]}
                />
                <Area
                  type="monotone"
                  dataKey="inst"
                  name="inst"
                  stroke="var(--p-found)"
                  strokeWidth={2}
                  fill="url(#instFill)"
                  dot={{ r: 2.5, fill: "var(--p-found)" }}
                  activeDot={{ r: 4 }}
                  isAnimationActive
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="mt-3 text-[11px] italic text-ink3">
              Combined FII + DII share of the company each quarter. Our feed reports institutional holding
              quarterly and does not split foreign from domestic flow — this is a position over time, not a
              monthly or FII-vs-DII flow read.
            </p>
          </>
        ) : (
          <p className="py-8 text-center text-[12px] text-ink3">
            Building history — an institutional trend needs at least two scored quarters.
          </p>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §3.7 — Ownership read transparency  (mechanics, not a score)
// ════════════════════════════════════════════════════════════════════════════
function baselineText(o: OwnershipAnatomy): string {
  const r = o.baselineReason ?? "";
  if (r.includes("established")) return `Established history — baseline ${o.baseline}`;
  if (r.includes("insufficient")) return `Insufficient history — baseline ${o.baseline}`;
  return `${humanizeKey(r)} — baseline ${o.baseline}`;
}

function TransparencySection({ current }: { current: OwnershipAnatomy }) {
  const penalties = [
    { k: "Sustained distribution", v: current.penalties.r2 },
    { k: "Prolonged DII exit", v: current.penalties.r6 },
    { k: "Prolonged FII exit", v: current.penalties.prolongedFii },
  ].filter((p) => p.v !== 0);

  return (
    <section>
      <SectionEyebrow label="How this reads" pill="ownership mechanics" />
      <Panel>
        <div className="flex items-start gap-3">
          <Icons.info weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-p-own" />
          <div className="flex-1">
            <p className="text-[12.5px] text-ink2">{baselineText(current)}</p>
            <p className="mt-1 text-[11.5px] text-ink3">
              Period {shortPeriod(current.periodKey)} · as of {fmtDate(current.asOfDate)}. The ownership
              grade itself lives on the Health tab; this is the read behind it.
            </p>
          </div>
        </div>

        {penalties.length > 0 ? (
          <div className="mt-4 border-t border-line pt-3.5">
            <div className="kicker mb-2.5">Active deductions</div>
            <div className="space-y-1.5">
              {penalties.map((p) => (
                <div key={p.k} className="flex items-center justify-between text-[12px]">
                  <span className="text-ink2">{p.k}</span>
                  <span className="num text-fragile">{p.v.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 border-t border-line pt-3.5 text-[11.5px] italic text-ink3">
            No distribution or institutional-exit deductions are active this period.
          </p>
        )}
      </Panel>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §3.8 — AI summary slot  (Phase-2 preview — wired to nothing, clearly marked)
// ════════════════════════════════════════════════════════════════════════════
function AiSummarySlot() {
  return (
    <section>
      <SectionEyebrow label="Ownership narrative" pill="preview" />
      <div className="rounded-2xl border border-dashed border-line2 bg-surface-1/60 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-p-mom/30 bg-p-mom/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-p-mom">
            <Icons.spark weight="fill" className="h-3 w-3" />
            AI · Phase 2 preview
          </span>
          <span className="text-[11px] text-ink3">Not live — sample of how this will read</span>
        </div>
        <p className="diagnosis mt-3 max-w-[46em] text-[13.5px] text-ink2 opacity-80">
          “Institutional holders increased their combined position for a third consecutive quarter while
          promoter holding stayed broadly flat. No promoter shares are pledged. Insider disclosures over the
          window were limited to two small director acquisitions, with no recorded selling.”
        </p>
        <p className="mt-3 text-[11px] italic text-ink3">
          A generated, state-describing summary of the ownership picture above will appear here in Phase 2.
          It will describe what changed — never recommend an action.
        </p>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §3.9 — What's next nav
// ════════════════════════════════════════════════════════════════════════════
const NAV_CARDS: { tab: string; icon: Icon; title: string; desc: string }[] = [
  { tab: "news", icon: Icons.news, title: "Latest developments", desc: "Announcements, disclosures & coverage" },
  { tab: "fundamentals", icon: Icons.chartBar, title: "The fundamentals", desc: "Whether performance backs the interest" },
  { tab: "technical", icon: Icons.chartLine, title: "Price structure", desc: "Where the chart sits right now" },
];

function WhatsNextNav({ symbol }: { symbol: string }) {
  return (
    <section>
      <SectionEyebrow label="Where to look next" />
      <div className="grid gap-3.5 md:grid-cols-3">
        {NAV_CARDS.map(({ tab, icon: Glyph, title, desc }) => (
          <Link
            key={tab}
            href={`/research/stock-screener/${symbol}?tab=${tab}`}
            className="lift group rounded-2xl border border-line bg-surface-1 p-5 transition-colors hover:border-line2"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-3 text-ink2 transition-colors group-hover:bg-p-own/10 group-hover:text-p-own">
              <Glyph weight="fill" className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-[14px] font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-[12px] text-ink3">{desc}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink2 transition-colors group-hover:text-ink">
              Open {tab} tab
              <Icons.arrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Activity tab
// ════════════════════════════════════════════════════════════════════════════
export default function Activity() {
  const params = useParams();
  const symbol = (params.symbol as string) ?? "";
  const { data, isLoading, isError, error, refetch } = useStockOwnership(symbol, 12);

  if (isLoading) return <QuerySkeleton rows={6} rowHeight="h-16" className="mt-8" />;
  if (isError)
    return (
      <QueryError
        message={(error as Error)?.message ?? "Failed to load ownership activity"}
        onRetry={() => refetch()}
        className="mt-8"
      />
    );
  if (!data) return null;

  const { current, series, pledging, events, hasScoredPeriod } = data;

  // Ledger-data presence is INDEPENDENT of scoring. Activity is a ledger, not a score
  // surface — raw data shows whenever it exists; only score-derived sections gate on a
  // scored period (handled per-section below).
  const hasHoldingData = current?.holding != null || series.some(hasHolding);
  const hasAnyData = hasHoldingData || pledging.length > 0 || events.insider.length > 0 || events.block.length > 0;

  // Full honest-empty ONLY when there is genuinely no ownership data of any kind.
  if (!hasAnyData) {
    return (
      <div className="mt-6">
        <Panel className="flex flex-col items-center gap-3 py-14 text-center">
          <Icons.building weight="duotone" className="h-10 w-10 text-ink3" />
          <p className="font-medium text-ink">No ownership data available for {data.name || symbol.toUpperCase()} yet</p>
          <p className="max-w-sm text-sm text-ink3">
            No shareholding pattern, pledging, insider or bulk/block-deal records are on file for this stock.
            They will appear here as the disclosure feeds report them.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      {/* score-derived flow lanes — quiet-empties itself when unscored */}
      <Reveal>
        <FlowGlanceStrip current={current} series={series} hasScoredPeriod={hasScoredPeriod} />
      </Reveal>

      {/* data-backed sections — render whenever their underlying rows exist */}
      {hasHoldingData && current && (
        <>
          <Reveal>
            <ShareholdingSection current={current} series={series} />
          </Reveal>
          <Reveal>
            <PromoterPledgeSection current={current} series={series} pledging={pledging} />
          </Reveal>
        </>
      )}
      <Reveal>
        <InsiderSection insider={events.insider} current={current} />
      </Reveal>
      <Reveal>
        <DealsSection block={events.block} current={current} />
      </Reveal>
      {hasHoldingData && (
        <Reveal>
          <InstitutionalSection series={series} />
        </Reveal>
      )}

      {/* score-mechanics read — only meaningful with a scored period */}
      {hasScoredPeriod && current && (
        <Reveal>
          <TransparencySection current={current} />
        </Reveal>
      )}
      <Reveal>
        <AiSummarySlot />
      </Reveal>
      <Reveal>
        <WhatsNextNav symbol={symbol} />
      </Reveal>
    </div>
  );
}
