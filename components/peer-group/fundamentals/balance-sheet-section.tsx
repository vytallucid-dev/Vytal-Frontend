"use client";

import { useRef } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/peer-group/chart-tooltip";
import type { FundamentalsRow } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────────────
// §D · Balance sheet & cash — a SORTED HORIZONTAL BAR RANKING (the third visual type, not
// another scatter). Non-financial: leverage (D/E) with cash conversion alongside. Banking:
// asset quality (GNPA) with cost-to-income. Factual — sorted, but NO crown / no "strongest"
// badge / no buy-sell. The capex-unavailable note is honoured: we rank stored ratios only.
// ─────────────────────────────────────────────────────────────────────────────────────

const BAR = "var(--p-found)";

interface RankItem {
  symbol: string;
  primary: number; // bar metric
  secondaryText: string; // companion value, formatted
}

function RankBars({
  rows,
  pickPrimary,
  pickSecondary,
  unit,
  ascending,
  primaryLabel,
  secondaryLabel,
}: {
  rows: FundamentalsRow[];
  pickPrimary: (r: FundamentalsRow) => number | null;
  pickSecondary: (r: FundamentalsRow) => string;
  unit: "ratio" | "pct";
  ascending: boolean;
  primaryLabel: string;
  secondaryLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(containerRef);

  const items: RankItem[] = rows
    .map((r) => ({ symbol: r.symbol, primary: pickPrimary(r), secondaryText: pickSecondary(r) }))
    .filter((i): i is RankItem => i.primary != null)
    .sort((a, b) => (ascending ? a.primary - b.primary : b.primary - a.primary));

  if (items.length === 0) {
    return <p className="py-6 text-center text-[13px] text-ink3">No member reports this metric yet.</p>;
  }

  const max = Math.max(...items.map((i) => Math.abs(i.primary)), 0.0001);
  const fmtPrimary = (v: number) => (unit === "ratio" ? `${v.toFixed(2)}×` : `${v.toFixed(1)}%`);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <ChartTooltip tip={tip} />
      {items.map((i) => (
        <div
          key={i.symbol}
          className="flex cursor-default items-center gap-3 rounded py-0.5 transition-colors hover:bg-surface-2"
          onMouseMove={(e) =>
            show(
              e,
              <TipBody
                title={i.symbol}
                rows={[
                  { label: primaryLabel, value: fmtPrimary(i.primary) },
                  { label: secondaryLabel, value: i.secondaryText },
                ]}
              />,
            )
          }
          onMouseLeave={hide}
        >
          <div className="num w-24 shrink-0 truncate text-[12px] text-ink2">{i.symbol}</div>
          <div className="relative h-4 flex-1">
            <div
              className="absolute inset-y-0.5 left-0 rounded-sm"
              style={{ width: `${(Math.abs(i.primary) / max) * 100}%`, background: BAR, opacity: 0.55 }}
            />
          </div>
          <div className="num w-16 shrink-0 text-right text-[12px] font-medium text-ink">
            {fmtPrimary(i.primary)}
          </div>
          <div className="num w-24 shrink-0 text-right text-[11px] text-ink3">{i.secondaryText}</div>
        </div>
      ))}
    </div>
  );
}

export function BalanceSheetSection({
  rows,
  isBanking,
}: {
  rows: FundamentalsRow[];
  isBanking: boolean;
}) {
  return (
    <section>
      <SectionEyebrow
        label={isBanking ? "Asset quality & efficiency" : "Balance sheet & cash"}
        icon={Icons.shield}
        accent="var(--p-found)"
        pill={isBanking ? "GNPA · Cost/Income" : "Leverage · Cash"}
      />
      <Reveal>
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-ink3">
            <span>{isBanking ? "Gross NPA (lower → top)" : "Debt / Equity (lower → top)"}</span>
            <span>{isBanking ? "Cost/Income" : "Cash conv. (OCF/PAT)"}</span>
          </div>
          {isBanking ? (
            <RankBars
              rows={rows}
              pickPrimary={(r) => r.gnpa}
              pickSecondary={(r) => (r.costToIncome != null ? `${r.costToIncome.toFixed(1)}%` : "—")}
              unit="pct"
              ascending
              primaryLabel="Gross NPA"
              secondaryLabel="Cost/Income"
            />
          ) : (
            <RankBars
              rows={rows}
              pickPrimary={(r) => r.debtToEquity}
              pickSecondary={(r) => (r.cashConversion != null ? `${r.cashConversion.toFixed(2)}×` : "—")}
              unit="ratio"
              ascending
              primaryLabel="Debt / Equity"
              secondaryLabel="Cash conv."
            />
          )}
          <p className="mt-3 text-[11.5px] text-ink3">
            {isBanking
              ? "Members sorted by gross NPA with cost-to-income alongside — the balance-sheet strength read for banks. Sorted for legibility, not as a ranking to act on."
              : "Members sorted by debt-to-equity with operating-cash conversion (OCF ÷ PAT) alongside. Sorted for legibility, not a recommendation; cash conversion uses operating cash flow, not free cash flow (capex-dependent fields are shown only where stored)."}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
