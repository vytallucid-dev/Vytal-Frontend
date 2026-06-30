"use client";

/**
 * Recent insider + block-deal activity per stock, A/B side by side — a compact NET SUMMARY from
 * LIVE events (NOT the per-transaction ledger; that lives on the stock Activity tab). For each
 * stock and each type we show total buy value vs sell value + buy/sell counts over the window.
 *
 * Honest-empty is PER STOCK and PER TYPE — a stock with insider activity but no block deals shows
 * the insider summary and an honest "no block/bulk deals" line (exactly how the Activity tab
 * treats a stock with 0 block deals). FACTUAL: both stocks shown equally, no winner — more buying
 * isn't "better", so the net is neutral-styled, never good/bad coloured.
 */

import { formatCompact } from "@/lib/format";
import { Icons } from "@/lib/icons";
import type { Comparee } from "@/types/compare";
import { A_HUE, B_HUE, SectionTitle } from "./shared";

interface SideSummary {
  count: number;
  buyCount: number;
  sellCount: number;
  buyVal: number;
  sellVal: number;
  /** true when ≥1 event carried a real value to sum (so net/value lines are honest). */
  hasValue: boolean;
}

/** Net buy-vs-sell summary over the window. Only buy/sell move the value net; other insider
 *  transaction types (pledge / esos / inter-se …) aren't buys or sells, so they don't inflate
 *  it. Null values are skipped from the sum, never fabricated. */
function summarize(events: { transactionType: string; value: number | null }[]): SideSummary {
  let buyVal = 0;
  let sellVal = 0;
  let buyCount = 0;
  let sellCount = 0;
  let hasValue = false;
  for (const e of events) {
    const isBuy = e.transactionType === "buy";
    const isSell = e.transactionType === "sell";
    if (isBuy) buyCount += 1;
    else if (isSell) sellCount += 1;
    if (e.value != null && (isBuy || isSell)) {
      hasValue = true;
      if (isBuy) buyVal += e.value;
      else sellVal += e.value;
    }
  }
  return { count: events.length, buyCount, sellCount, buyVal, sellVal, hasValue };
}

const cr = (v: number) => `₹${formatCompact(v)} Cr`;
const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

function ActivitySide({
  title,
  emptyText,
  summary,
}: {
  title: string;
  emptyText: string;
  summary: SideSummary;
}) {
  if (summary.count === 0) {
    return (
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-ink3">{title}</div>
        <p className="mt-0.5 text-[12px] text-ink3">{emptyText}</p>
      </div>
    );
  }
  const net = summary.buyVal - summary.sellVal;
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink3">{title}</div>
      {summary.hasValue ? (
        <div className="num mt-0.5 text-[13px] text-ink">
          {cr(summary.buyVal)} bought · {cr(summary.sellVal)} sold
        </div>
      ) : (
        <div className="mt-0.5 text-[12px] text-ink3">Trade values not disclosed</div>
      )}
      <div className="mt-0.5 text-[11.5px] text-ink3">
        {summary.hasValue && (
          <>
            <span className="num text-ink2">
              net {net >= 0 ? "+" : "−"}
              {cr(Math.abs(net))}
            </span>
            {" · "}
          </>
        )}
        <span className="num">
          {plural(summary.buyCount, "buy")}, {plural(summary.sellCount, "sell")}
        </span>
      </div>
    </div>
  );
}

function ActivityCard({ entity, hue }: { entity: Comparee; hue: string }) {
  const insider = summarize(
    entity.events.insider.map((e) => ({ transactionType: e.transactionType, value: e.tradeValueCr })),
  );
  const block = summarize(
    entity.events.block.map((e) => ({ transactionType: e.transactionType, value: e.valueCr })),
  );

  return (
    <div className="flex-1 rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-1.5 text-xs text-ink3">
        <span className="h-2 w-2 rounded-full" style={{ background: hue }} />
        <span className="num">{entity.symbol}</span>
      </div>
      <div className="mt-3 space-y-3">
        <ActivitySide title="Insider" emptyText="No recent insider activity" summary={insider} />
        <div className="h-px bg-line" />
        <ActivitySide title="Block / bulk" emptyText="No recent block / bulk deals" summary={block} />
      </div>
    </div>
  );
}

export function OwnershipActivity({ a, b }: { a: Comparee; b: Comparee }) {
  return (
    <div>
      <SectionTitle
        icon={Icons.pulse}
        accent="var(--p-own)"
        hint="Net insider & block-deal activity over the window, stated per stock — a summary, not the full ledger. The two are shown side by side, not compared."
      >
        Recent activity
      </SectionTitle>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ActivityCard entity={a} hue={A_HUE} />
        <ActivityCard entity={b} hue={B_HUE} />
      </div>
    </div>
  );
}
