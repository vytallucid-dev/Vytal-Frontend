"use client";

/**
 * Price tab — both stocks' returns + 52-week position as a factual side-by-side table,
 * plus a rebased path overlay. Fetches /price per stock (the comparison payload carries
 * only point returns; the overlay needs the daily series). FACTUAL: no "outperformed
 * therefore better", no momentum verdict — the two paths are shown, the user reads them.
 */

import { useStockPrice } from "@/lib/api/hooks/use-stock-price";
import { Icons } from "@/lib/icons";
import { SkeletonLine } from "@/components/ui/query-skeleton";
import {
  Panel,
  SectionTitle,
  HonestEmpty,
  CompareTable,
  type CompareRow,
} from "./shared";
import { PriceOverlay } from "./price-overlay";

export function PriceTab({
  aSymbol,
  bSymbol,
  aLabel,
  bLabel,
}: {
  aSymbol: string;
  bSymbol: string;
  aLabel: string;
  bLabel: string;
}) {
  const aQ = useStockPrice(aSymbol);
  const bQ = useStockPrice(bSymbol);

  if (aQ.isLoading || bQ.isLoading) {
    return (
      <Panel>
        <SkeletonLine className="mb-3 w-1/3" />
        <div className="h-72 rounded-lg bg-surface-2" />
      </Panel>
    );
  }

  const a = aQ.data;
  const b = bQ.data;

  const returnRows: CompareRow[] = [
    { key: "r1m", label: "1-Month Return", unit: "pct", a: a?.stock.returns.r1m ?? null, b: b?.stock.returns.r1m ?? null },
    { key: "r3m", label: "3-Month Return", unit: "pct", a: a?.stock.returns.r3m ?? null, b: b?.stock.returns.r3m ?? null },
    { key: "r6m", label: "6-Month Return", unit: "pct", a: a?.stock.returns.r6m ?? null, b: b?.stock.returns.r6m ?? null },
    { key: "r1y", label: "1-Year Return", unit: "pct", a: a?.stock.returns.r1y ?? null, b: b?.stock.returns.r1y ?? null },
    { key: "r3y", label: "3-Year Return", unit: "pct", a: a?.stock.returns.r3y ?? null, b: b?.stock.returns.r3y ?? null },
  ];

  const positionRows: CompareRow[] = [
    { key: "price", label: "Current Price", unit: "rupees", a: a?.current.price ?? null, b: b?.current.price ?? null },
    { key: "hi", label: "52-Week High", unit: "rupees", a: a?.current.week52High ?? null, b: b?.current.week52High ?? null },
    { key: "lo", label: "52-Week Low", unit: "rupees", a: a?.current.week52Low ?? null, b: b?.current.week52Low ?? null },
    { key: "fromHi", label: "% from 52W High", unit: "pct", a: a?.current.pctFrom52WHigh ?? null, b: b?.current.pctFrom52WHigh ?? null },
    { key: "fromLo", label: "% from 52W Low", unit: "pct", a: a?.current.pctFrom52WLow ?? null, b: b?.current.pctFrom52WLow ?? null },
  ];

  const anyPrice = Boolean(a?.hasPrice || b?.hasPrice);

  return (
    <div className="space-y-6">
      <Panel>
        <SectionTitle
          icon={Icons.chartLine}
          accent="var(--p-mkt)"
          hint="Both paths indexed to 100 at the period start — the shape is the comparison."
        >
          Price paths
        </SectionTitle>
        {anyPrice ? (
          <PriceOverlay
            aLabel={aLabel}
            bLabel={bLabel}
            aSeries={a?.stock.series ?? []}
            bSeries={b?.stock.series ?? []}
          />
        ) : (
          <HonestEmpty>Price data not available for either stock.</HonestEmpty>
        )}
      </Panel>

      <div>
        <SectionTitle
          icon={Icons.trendUp}
          accent="var(--p-mkt)"
          hint="Trailing returns over standard windows, stated as fact."
        >
          Returns
        </SectionTitle>
        <CompareTable aLabel={aLabel} bLabel={bLabel} rows={returnRows} />
      </div>

      <div>
        <SectionTitle icon={Icons.target} accent="var(--p-mkt)">
          Price position
        </SectionTitle>
        <CompareTable aLabel={aLabel} bLabel={bLabel} rows={positionRows} />
      </div>
    </div>
  );
}
