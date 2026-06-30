"use client";

/**
 * §6 — Peer Comparison Table. DISPLAY — standing, NOT a leaderboard.
 * Source: /health (the stock's peer group id + identity) + /peer-groups/:id/health
 * (the roster, each member's health standing, and per-metric member ratios — one
 * fetch, no N+1 /fundamentals calls). The current stock's row is marked, never ranked #1.
 *
 * FORBIDDEN (and absent here): ranking by price or market cap, "best/largest in group"
 * framing, P/E-premium verdicts, and a price/return column placed beside the health
 * column (the banned juxtaposition). Rows default to ordering by HEALTH STANDING
 * (strongest → weakest) — a factual sort by composite, so a row's position means
 * something. No winner is declared. Ratio columns are family-aware (banks show bank
 * ratios, non-financials show theirs) — the user reads where the stock sits.
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { usePeerGroupHealth } from "@/lib/api/hooks/use-peer-group-health";
import type { PeerGroupHealthView } from "@/types/peer-group";
import { getMetricLabel } from "@/lib/health/metric-labels";
import { Panel, BAND_META } from "../health/shared";
import { Section, HonestEmpty, LoadingBlock, fmtByUnit } from "./shared";

const MAX_RATIO_COLS = 4;

// Family-relevant ratio priority — the metric set already used across the Health
// surfaces (getMetricLabel). Banking PGs carry named codes (Tier1/GNPA/ROA…),
// non-financial PGs carry F-codes. Ordering by this priority (then falling back to
// the backend order for anything unlisted) makes the columns meaningful for the
// peer group's family instead of an arbitrary first-4. All scoring ratios — never
// P/E or P/B, so no valuation lens leaks in.
const FAMILY_RATIO_PRIORITY: string[] = [
  // Banking (PG5 private / PG6 PSU)
  "GNPA", "NNPA", "ROA", "Tier1", "PCR", "CASA", "CI",
  // Non-financial (PG1–PG4, PG7–PG11)
  "F1", "F2", "F1_OPM", "F4", "F5", "F3", "F8", "F9", "F10", "F7", "F6",
];

function ratioColumns(view: PeerGroupHealthView) {
  // Foundation metric distributions are already family-shaped by the backend (a bank
  // PG carries Tier1/GNPA/…, a non-financial PG carries F1–F10). Order them by the
  // family-relevant priority so the most meaningful ratios head the table, then take
  // the top columns — NOT an arbitrary first-4.
  const foundation = view.metricDistributions.filter((d) => d.pillar === "foundation");
  const rank = (key: string) => {
    const i = FAMILY_RATIO_PRIORITY.indexOf(key);
    return i === -1 ? FAMILY_RATIO_PRIORITY.length : i;
  };
  return [...foundation]
    .sort((a, b) => rank(a.metricKey) - rank(b.metricKey))
    .slice(0, MAX_RATIO_COLS)
    .map((d) => {
      const meta = getMetricLabel(d.metricKey);
      const bySymbol = new Map(d.members.map((m) => [m.symbol, m.rawValue]));
      return { metricKey: d.metricKey, label: meta.label, unit: meta.unit, bySymbol };
    });
}

// A sortable column: the health-standing column (default) or a ratio column.
type SortKey = { kind: "standing" } | { kind: "ratio"; metricKey: string };
type SortDir = "asc" | "desc";

export function PeersSection({ symbol }: { symbol: string }) {
  const { data: health } = useStockHealth(symbol);
  const peerGroupId = health?.identity.peerGroup?.id ?? "";
  const { data: pg, isLoading } = usePeerGroupHealth(peerGroupId);

  // Default sort: HEALTH STANDING, strongest → weakest. This is a factual ordering,
  // not a verdict — a row's position simply reflects its composite. Headers are
  // clickable to re-sort; the standing default is the meaningful baseline.
  const [sortKey, setSortKey] = useState<SortKey>({ kind: "standing" });
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  if (health && !peerGroupId) {
    return (
      <Section id="overview-peers" label="Peer comparison" icon={Icons.compare} accent="var(--p-found)">
        <HonestEmpty>No peer group assigned for this stock yet.</HonestEmpty>
      </Section>
    );
  }
  if (isLoading || !pg) {
    return (
      <Section id="overview-peers" label="Peer comparison" icon={Icons.compare} accent="var(--p-found)">
        <LoadingBlock className="h-48" />
      </Section>
    );
  }
  if (!pg.scored || pg.members.length === 0) {
    return (
      <Section id="overview-peers" label="Peer comparison" icon={Icons.compare} accent="var(--p-found)">
        <HonestEmpty>Peer-group standing not yet available.</HonestEmpty>
      </Section>
    );
  }

  const cols = ratioColumns(pg);

  // Click a header to sort by it; clicking the active column flips direction.
  // Standing toggles default-strongest-first; ratios default-highest-first.
  const onSort = (key: SortKey) => {
    const sameCol =
      (key.kind === "standing" && sortKey.kind === "standing") ||
      (key.kind === "ratio" && sortKey.kind === "ratio" && key.metricKey === sortKey.metricKey);
    if (sameCol) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const ratioByKey = new Map(cols.map((c) => [c.metricKey, c.bySymbol]));
  const valueFor = (m: (typeof pg.members)[number]): number | null => {
    if (sortKey.kind === "standing") return m.composite;
    return ratioByKey.get(sortKey.metricKey)?.get(m.symbol) ?? null;
  };
  // Sort by the active column. Default standing-desc = strongest → weakest, so a
  // row's POSITION means something. Nulls always sink to the bottom; ties hold a
  // stable symbol order. Ordering by standing is a factual sort, never a verdict.
  const rows = [...pg.members].sort((a, b) => {
    const va = valueFor(a);
    const vb = valueFor(b);
    if (va == null && vb == null) return a.symbol.localeCompare(b.symbol);
    if (va == null) return 1;
    if (vb == null) return -1;
    if (va === vb) return a.symbol.localeCompare(b.symbol);
    return sortDir === "desc" ? vb - va : va - vb;
  });

  const isActive = (key: SortKey) =>
    key.kind === "standing"
      ? sortKey.kind === "standing"
      : sortKey.kind === "ratio" && sortKey.metricKey === key.metricKey;
  const sortGlyph = (key: SortKey) => (isActive(key) ? (sortDir === "desc" ? "↓" : "↑") : "");

  return (
    <Section id="overview-peers" label="Peer comparison" icon={Icons.compare} accent="var(--p-found)" pill={pg.identity.displayName}>
      <Panel className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-[11px] text-ink3">
                <th className="px-4 py-3 font-medium">Company</th>
                {cols.map((c) => {
                  const key: SortKey = { kind: "ratio", metricKey: c.metricKey };
                  return (
                    <th key={c.metricKey} className="px-3 py-3 text-right font-medium">
                      <button
                        type="button"
                        onClick={() => onSort(key)}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-ink2",
                          isActive(key) && "text-ink2",
                        )}
                      >
                        {c.label}
                        <span className="num w-2 text-[10px]">{sortGlyph(key)}</span>
                      </button>
                    </th>
                  );
                })}
                <th className="px-4 py-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => onSort({ kind: "standing" })}
                    className={cn(
                      "inline-flex items-center gap-1 transition-colors hover:text-ink2",
                      isActive({ kind: "standing" }) && "text-ink2",
                    )}
                  >
                    Health standing
                    <span className="num w-2 text-[10px]">{sortGlyph({ kind: "standing" })}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const isCurrent = m.symbol === symbol;
                const band = BAND_META[m.labelBand];
                return (
                  <tr
                    key={m.symbol}
                    className={cn(
                      "border-b border-line/60 last:border-0",
                      isCurrent && "bg-surface-2",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isCurrent && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />}
                        <span className={cn("num font-medium", isCurrent ? "text-ink" : "text-ink2")}>{m.symbol}</span>
                      </div>
                    </td>
                    {cols.map((c) => (
                      <td key={c.metricKey} className="num px-3 py-3 text-right text-ink2">
                        {fmtByUnit(c.bySymbol.get(m.symbol), c.unit)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <span className={cn("num inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px]", band.bg, band.border, band.text)}>
                        {m.composite.toFixed(1)}
                        <span className="text-[10px]">{band.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3.5">
          <p className="text-[11.5px] text-ink3">Where it sits among peers — ordered by health standing, with family-relevant ratios. A factual sort, not a verdict — no winner crowned.</p>
          <Link
            href={`/research/peer-groups/${peerGroupId}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
          >
            Peer group
            <Icons.arrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </Panel>
    </Section>
  );
}
