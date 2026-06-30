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

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WhereNext } from "./where-next";
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
  Legend,
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
import { SectionEyebrow, Panel, shortPeriod, humanizeKey } from "./health/shared";
import { color } from "framer-motion";

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
  itemStyle: { color: "var(--ink)" }
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
// §3.1 — Flow-lane glance strip — FIVE per-lane-honest cards
// The five ownership lanes are NOT identically shaped; each is rendered to the
// data that actually exists:
//   • FII / DII  — HOLDING-shaped. No separate net-₹ flow exists (the engine keys
//     institutional flow on the COMBINED FII+DII delta), so each card reads its
//     direction + figure straight from the quarterly holding series.
//   • Promoter   — FLOW-shaped & fully wired: current stake %, q/q change, pledge.
//   • Insider    — FLOW-shaped but DORMANT today (PIT feed unwired, events.insider
//     empty). Honest "activates once reported" state; the populated path computes a
//     net ₹ FE-side from buys−sells so it lights up automatically when events land.
//   • Bulk/Block — FLOW-shaped, DORMANT today (bulk/block feed unwired). Same honest
//     dormant state; populated path ready (last-period value + deal count).
// Direction tags are DESCRIPTIVE (Accumulating / Net buyers / Stable), never "BUY".
// A dormant feed shows the honest state, never a fabricated figure.
// ════════════════════════════════════════════════════════════════════════════

// A flow card's resolved render-state — one of three honest shapes.
type FlowCard = {
  key: string;
  label: string;
  icon: Icon;
  /** descriptive direction tag (Accumulating / Net buyers / Stable / Dormant) */
  tag: { word: string; cls: string };
  /** what / when context line under the title */
  whatWhen: string;
} & (
  | { shape: "value"; hero: string; heroCls: string; rows: [string, string] }
  | { shape: "dormant"; dormantLine: string }
);

/** Holding-direction tag from a q/q % delta — descriptive, never advice.
 *  Up reads "Accumulating", down "Reducing", flat "Steady". */
function holdingTag(delta: number | null) {
  if (delta == null) return { word: "Single quarter", cls: "text-ink3" };
  const eps = 0.05;
  if (delta > eps) return { word: "Accumulating", cls: "text-healthy" };
  if (delta < -eps) return { word: "Reducing", cls: "text-high" };
  return { word: "Steady", cls: "text-ink2" };
}

/** Count consecutive trailing quarters the holding % moved the same direction as
 *  `delta` (net buyers / net sellers run length) — a factual streak, not a score. */
function holdingStreak(holds: OwnershipHolding[], key: "fiiPct" | "diiPct", delta: number | null): number {
  if (delta == null || Math.abs(delta) <= 0.05) return 0;
  const dir = Math.sign(delta);
  let n = 0;
  for (let i = holds.length - 1; i > 0; i--) {
    const a = holds[i][key];
    const b = holds[i - 1][key];
    if (a == null || b == null) break;
    if (Math.sign(a - b) !== dir || a - b === 0) break;
    n++;
  }
  return n;
}

function FlowGlanceStrip({
  current,
  series,
  events,
}: {
  current: OwnershipAnatomy | null;
  series: OwnershipSeriesPoint[];
  events: { insider: InsiderEvent[]; block: BlockEvent[] };
}) {
  const holdings = series.filter(hasHolding).map((p) => p.holding);
  const latest = holdings.at(-1) ?? current?.holding ?? null;
  const prior = holdings.at(-2) ?? null;
  const hasHoldingData = latest != null;

  // Nothing to show at all — rare; parent only renders when hasAnyData.
  if (!hasHoldingData && !current) {
    return (
      <section>
        <SectionEyebrow label="Ownership flow" icon={Icons.stack} accent="var(--p-own)" pill="5 lanes" />
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

  const qoqDelta = (key: "promoterPct" | "fiiPct" | "diiPct"): number | null => {
    if (!latest || !prior) return null;
    const a = latest[key];
    const b = prior[key];
    return a == null || b == null ? null : a - b;
  };

  // ── FII / DII — HOLDING-shaped ────────────────────────────────────────────
  const holdingCard = (key: "fiiPct" | "diiPct", label: string, icon: Icon): FlowCard => {
    const pct = latest?.[key] ?? null;
    const delta = qoqDelta(key);
    const tag = holdingTag(delta);
    const streak = holdingStreak(holdings, key, delta);
    const sideWord = delta != null && delta > 0.05 ? "net buyers" : delta != null && delta < -0.05 ? "net sellers" : "flat";
    const trendRow =
      streak >= 1
        ? `${sideWord} · ${streak} ${streak === 1 ? "quarter" : "quarters"}`
        : prior == null
          ? "single quarter so far"
          : "no sustained run";
    return {
      key,
      label,
      icon,
      tag,
      whatWhen: "Holding share · latest quarter",
      shape: "value",
      hero: fmtPct(pct, 1),
      heroCls: tag.cls,
      rows: [delta == null ? "— q/q" : `${fmtPp(delta)} q/q`, trendRow],
    };
  };

  // ── Promoter — FLOW-shaped (fully wired) ──────────────────────────────────
  const promoterCard = (): FlowCard => {
    const pct = latest?.promoterPct ?? null;
    const delta = qoqDelta("promoterPct");
    const tag =
      delta == null
        ? { word: "Single quarter", cls: "text-ink3" }
        : delta > 0.05
          ? { word: "Rising", cls: "text-healthy" }
          : delta < -0.05
            ? { word: "Reducing", cls: "text-high" }
            : { word: "Stable", cls: "text-ink2" };
    const pledged = latest?.pledgedPctOfPromoter ?? null;
    const pledgeWord =
      pledged == null ? "" : pledged === 0 ? "none pledged" : pledged < 5 ? "very low" : pledged < 25 ? "moderate" : pledged < 50 ? "elevated" : "high";
    return {
      key: "promoter",
      label: "Promoter",
      icon: Icons.crown,
      tag,
      whatWhen: "Stake held · latest quarter",
      shape: "value",
      hero: fmtPct(pct, 1),
      heroCls: tag.cls,
      rows: [
        delta == null ? "— q/q" : `${fmtPp(delta)} q/q`,
        pledged == null ? "pledge —" : `${fmtPct(pledged, 1)} pledged${pledgeWord ? ` · ${pledgeWord}` : ""}`,
      ],
    };
  };

  // ── Insider — FLOW-shaped, DORMANT until the PIT feed wires ────────────────
  const insiderCard = (events: InsiderEvent[]): FlowCard => {
    const lane = current?.flowCategories.find((f) => f.category === "C_insider");
    const dormant = events.length === 0 && (!lane || lane.categoryState !== "scored");
    if (dormant) {
      return {
        key: "insider",
        label: "Insider",
        icon: Icons.eye,
        tag: { word: "Dormant", cls: "text-ink3" },
        whatWhen: "PIT disclosures",
        shape: "dormant",
        dormantLine: "Awaiting feed · activates once reported",
      };
    }
    // Populated path — net ₹ over the disclosed window, computed FE-side.
    const buys = events.filter((e) => e.transactionType === "buy");
    const sells = events.filter((e) => e.transactionType === "sell");
    const net =
      buys.reduce((s, e) => s + (e.tradeValueCr ?? 0), 0) - sells.reduce((s, e) => s + (e.tradeValueCr ?? 0), 0);
    const tag = net > 0 ? { word: "Net buyers", cls: "text-healthy" } : net < 0 ? { word: "Net sellers", cls: "text-high" } : { word: "Balanced", cls: "text-ink2" };
    return {
      key: "insider",
      label: "Insider",
      icon: Icons.eye,
      tag,
      whatWhen: "Net · last ~90d",
      shape: "value",
      hero: fmtSignedCr(net),
      heroCls: tag.cls,
      rows: [
        `${buys.length} ${buys.length === 1 ? "buy" : "buys"} · ${fmtCr(buys.reduce((s, e) => s + (e.tradeValueCr ?? 0), 0))}`,
        `${sells.length} ${sells.length === 1 ? "sell" : "sells"} · ${fmtCr(sells.reduce((s, e) => s + (e.tradeValueCr ?? 0), 0))}`,
      ],
    };
  };

  // ── Bulk/Block — FLOW-shaped, DORMANT until the bhavcopy feed wires ────────
  const blockCard = (events: BlockEvent[]): FlowCard => {
    const lane = current?.flowCategories.find((f) => f.category === "D_block");
    const dormant = events.length === 0 && (!lane || lane.categoryState !== "scored");
    if (dormant) {
      return {
        key: "block",
        label: "Bulk / block",
        icon: Icons.stack,
        tag: { word: "Dormant", cls: "text-ink3" },
        whatWhen: "NSE bhavcopy",
        shape: "dormant",
        dormantLine: "Awaiting feed · activates once reported",
      };
    }
    // Populated path — last-period net value + deal count + notable counterparty.
    const buys = events.filter((e) => e.transactionType === "buy");
    const sells = events.filter((e) => e.transactionType === "sell");
    const net = buys.reduce((s, e) => s + (e.valueCr ?? 0), 0) - sells.reduce((s, e) => s + (e.valueCr ?? 0), 0);
    const tag = net > 0 ? { word: "Net buyers", cls: "text-healthy" } : net < 0 ? { word: "Net sellers", cls: "text-high" } : { word: "Balanced", cls: "text-ink2" };
    const top = [...events].sort((a, b) => (b.valueCr ?? 0) - (a.valueCr ?? 0))[0];
    return {
      key: "block",
      label: "Bulk / block",
      icon: Icons.stack,
      tag,
      whatWhen: "Net · current window",
      shape: "value",
      hero: fmtSignedCr(net),
      heroCls: tag.cls,
      rows: [
        `${events.length} ${events.length === 1 ? "deal" : "deals"}`,
        top ? `${top.clientName}` : "—",
      ],
    };
  };

  const cards: FlowCard[] = [
    holdingCard("fiiPct", "FII", Icons.building),
    holdingCard("diiPct", "DII", Icons.coins),
    promoterCard(),
    insiderCard(events.insider),
    blockCard(events.block),
  ];

  return (
    <section>
      <SectionEyebrow label="Ownership flow" icon={Icons.stack} accent="var(--p-own)" pill="5 lanes" />
      <StaggerGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => {
          const Glyph = c.icon;
          const dormant = c.shape === "dormant";
          return (
            <StaggerItem key={c.key}>
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
                  <span className="text-[12.5px] font-semibold text-ink">{c.label}</span>
                  <span className={cn("ml-auto text-[10.5px] font-medium", c.tag.cls)}>{c.tag.word}</span>
                </div>
                <p className="mt-1 text-[10.5px] text-ink3">{c.whatWhen}</p>

                {c.shape === "dormant" ? (
                  <p className="mt-3 text-[11px] italic text-ink3">{c.dormantLine}</p>
                ) : (
                  <div className="mt-2.5">
                    <div className={cn("num text-[18px] font-semibold", c.heroCls)}>{c.hero}</div>
                    <div className="mt-2 space-y-1 border-t border-line pt-2 text-[11px] text-ink2">
                      <p className="num">{c.rows[0]}</p>
                      <p className="num text-ink3">{c.rows[1]}</p>
                    </div>
                  </div>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
      <p className="mt-2.5 text-[11px] italic text-ink3">
        FII &amp; DII direction is read from the quarterly holding split (no separate net-₹ flow is reported).
        Promoter shows the wired stake &amp; pledge. Insider and bulk/block lanes activate once their disclosure
        feeds report — shown dormant, never fabricated.
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
            <Tooltip
              {...TOOLTIP_STYLE}
              cursor={false}
              formatter={(v: number, name: string) => [`${v.toFixed(2)}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
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
      <SectionEyebrow label="Shareholding pattern" icon={Icons.user} accent="var(--p-own)" pill={`as of ${fmtDate(current.holding?.asOnDate)}`} />
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
      <SectionEyebrow label="Promoter & pledging" icon={Icons.warning} accent="var(--p-mkt)" pill={`${promoterPoints.length} quarters`} />
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
        <SectionEyebrow label="Insider activity" icon={Icons.eye} accent="var(--p-mom)" pill="PIT disclosures" />
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
      <SectionEyebrow label="Insider activity" icon={Icons.eye} accent="var(--p-mom)" pill={`${insider.length} disclosed`} />
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
        <SectionEyebrow label="Bulk & block deals" icon={Icons.coins} accent="var(--p-found)" pill="NSE bhavcopy" />
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
      <SectionEyebrow label="Bulk & block deals" icon={Icons.coins} accent="var(--p-found)" pill={`${block.length} deals`} />
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
// §3.6 — Institutional ownership, quarterly
// Sourced from the holding series. A mode toggle switches between the COMBINED
// FII+DII position (default) and FII vs DII plotted as two separate lines — the
// per-point fii/dii fields are already carried, so foreign/domestic divergence is
// visible without any backend change. Honestly captioned per mode.
// ════════════════════════════════════════════════════════════════════════════
const INST_NAME: Record<string, string> = { inst: "FII + DII", fii: "FII", dii: "DII" };

function InstitutionalSection({ series }: { series: OwnershipSeriesPoint[] }) {
  const [mode, setMode] = useState<"combined" | "split">("combined");

  const points = series
    .filter(hasHolding)
    .map((p) => {
      const { fiiPct, diiPct } = p.holding;
      const inst = fiiPct == null && diiPct == null ? null : (fiiPct ?? 0) + (diiPct ?? 0);
      return { period: shortPeriod(p.periodKey), inst, fii: fiiPct, dii: diiPct };
    })
    .filter((p) => p.inst != null);

  const instFormatter = (v: number, name: string): [string, string] => [`${v.toFixed(2)}%`, INST_NAME[name] ?? name];

  return (
    <section>
      <SectionEyebrow
        label="Institutional ownership"
        icon={Icons.building}
        accent="var(--p-found)"
        pill={`quarterly · ${mode === "combined" ? "combined" : "FII vs DII"}`}
      />
      <Panel>
        {points.length >= 2 ? (
          <>
            {/* mode toggle — Combined (default) vs FII vs DII */}
            <div className="mb-3 flex justify-end">
              <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5 text-[11px]">
                {([
                  { id: "combined", label: "Combined" },
                  { id: "split", label: "FII vs DII" },
                ] as const).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-medium transition-colors",
                      mode === m.id ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              {mode === "combined" ? (
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
                  <Tooltip {...TOOLTIP_STYLE} formatter={instFormatter} />
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
              ) : (
                <LineChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--ink3)", fontSize: 10 }} axisLine={false} tickLine={false} width={38} domain={["auto", "auto"]} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={instFormatter} />
                  <Legend
                    iconType="plainline"
                    wrapperStyle={{ fontSize: 11, color: "var(--ink3)" }}
                    formatter={(name: string) => INST_NAME[name] ?? name}
                  />
                  <Line
                    type="monotone"
                    dataKey="fii"
                    name="fii"
                    stroke="var(--p-found)"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "var(--p-found)" }}
                    activeDot={{ r: 4 }}
                    connectNulls
                    isAnimationActive
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="dii"
                    name="dii"
                    stroke="var(--p-own)"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "var(--p-own)" }}
                    activeDot={{ r: 4 }}
                    connectNulls
                    isAnimationActive
                    animationDuration={1000}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
            <p className="mt-3 text-[11px] italic text-ink3">
              {mode === "combined" ? (
                <>
                  Combined FII + DII share of the company each quarter. Our feed reports institutional holding
                  quarterly and does not split foreign from domestic flow — this is a position over time, not a
                  monthly or FII-vs-DII flow read.
                </>
              ) : (
                <>
                  FII and DII share plotted separately each quarter, so foreign-versus-domestic divergence is
                  visible. Quarterly holding positions over time — not a monthly flow read.
                </>
              )}
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
      <SectionEyebrow label="How this reads" icon={Icons.info} accent="var(--p-mkt)" pill="ownership mechanics" />
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
      <SectionEyebrow label="Ownership narrative" icon={Icons.brain} accent="var(--p-mom)" pill="preview" />
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

// §3.9 — What's next nav now uses the shared, colourful WhereNext (../where-next).

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
      {/* five per-lane-honest flow cards — quiet-empties itself when no holding data */}
      <Reveal>
        <FlowGlanceStrip current={current} series={series} events={events} />
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
        <WhereNext symbol={symbol} exclude={["activity"]} />
      </Reveal>
    </div>
  );
}
