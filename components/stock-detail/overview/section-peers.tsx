"use client";

/**
 * §6 — Peer Comparison Table. DISPLAY — standing, NOT a leaderboard.
 * Source: /health (the stock's peer group id + identity) + /peer-groups/:id/health
 * (the roster, each member's health standing, and per-metric member ratios — one
 * fetch, no N+1 /fundamentals calls). The current stock's row is marked, never ranked #1.
 *
 * FORBIDDEN (and absent here): ranking by price or market cap, "best/largest in group"
 * framing, P/E-premium verdicts, and a price/return column placed beside the health
 * column (the banned juxtaposition). Rows are ordered ALPHABETICALLY — crowns no winner.
 * Shows fundamental ratios + health standing only; the user reads where the stock sits.
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { usePeerGroupHealth } from "@/lib/api/hooks/use-peer-group-health";
import type { PeerGroupHealthView } from "@/types/peer-group";
import { getMetricLabel } from "@/lib/health/metric-labels";
import { Panel, BAND_META } from "../health/shared";
import { Section, HonestEmpty, LoadingBlock, DASH, fmtByUnit } from "./shared";

const MAX_RATIO_COLS = 4;

function ratioColumns(view: PeerGroupHealthView) {
  // Foundation metric distributions → the ratio columns (these are scoring ratios:
  // ROCE/ROE/leverage/GNPA… — NEVER P/E or P/B, so no valuation lens leaks in).
  return view.metricDistributions
    .filter((d) => d.pillar === "foundation")
    .slice(0, MAX_RATIO_COLS)
    .map((d) => {
      const meta = getMetricLabel(d.metricKey);
      const bySymbol = new Map(d.members.map((m) => [m.symbol, m.rawValue]));
      return { metricKey: d.metricKey, label: meta.label, unit: meta.unit, bySymbol };
    });
}

export function PeersSection({ symbol }: { symbol: string }) {
  const { data: health } = useStockHealth(symbol);
  const peerGroupId = health?.identity.peerGroup?.id ?? "";
  const { data: pg, isLoading } = usePeerGroupHealth(peerGroupId);

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
  // Alphabetical ordering — deliberately NOT ranked (crowns no winner).
  const rows = [...pg.members].sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <Section id="overview-peers" label="Peer comparison" icon={Icons.compare} accent="var(--p-found)" pill={pg.identity.displayName}>
      <Panel className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-[11px] text-ink3">
                <th className="px-4 py-3 font-medium">Company</th>
                {cols.map((c) => (
                  <th key={c.metricKey} className="px-3 py-3 text-right font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Health standing</th>
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
          <p className="text-[11.5px] text-ink3">Where it sits among peers — fundamental ratios and health standing. No winner crowned.</p>
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
