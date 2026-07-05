"use client";

import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Holding } from "@/types/portfolio";
import { STOCK_BAND_LABEL, holdingHealthColor } from "../lib";
import { Funnel } from "./shared";

const pnlColor = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const signPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

function returnPct(h: Holding): number | null {
  if (h.unrealizedPnl == null || h.investedValue <= 0) return null;
  return (h.unrealizedPnl / h.investedValue) * 100;
}

function HealthCell({ h, compact }: { h: Holding; compact?: boolean }) {
  const color = holdingHealthColor(h);
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
      {/* label hidden on the compact (table) layout to keep the row from overflowing */}
      <span className={cn("text-[11px] text-ink2", compact && "hidden lg:inline")}>
        {h.band ? STOCK_BAND_LABEL[h.band] : "Unscored"}
      </span>
      <span className="num w-4 text-right font-medium" style={{ color }}>
        {h.health ?? "—"}
      </span>
    </span>
  );
}

export function HoldingsPreview({
  holdings,
  onOpenHoldings,
}: {
  holdings: Holding[];
  onOpenHoldings: () => void;
}) {
  const top = [...holdings].sort((a, b) => b.weight - a.weight).slice(0, 8);

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
      {/* desktop table */}
      <div className="custom-scrollbar -mx-1 hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-[9.5px] uppercase tracking-wide text-ink3">
              <th className="px-1.5 py-2 text-left font-semibold">Holding</th>
              <th className="px-1.5 py-2 text-center font-semibold">Weight</th>
              <th className="px-1.5 py-2 text-center font-semibold">Value</th>
              <th className="px-1.5 py-2 text-center font-semibold">Today</th>
              <th className="px-1.5 py-2 text-center font-semibold">Return</th>
              <th className="px-1.5 py-2 text-center font-semibold">Health</th>
            </tr>
          </thead>
          <tbody>
            {top.map((h) => {
              const rp = returnPct(h);
              return (
                <tr key={h.symbol} className="border-t border-line transition-colors hover:bg-surface-2/50">
                  <td className="px-1.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: holdingHealthColor(h) }} />
                      <div className="min-w-0">
                        <p className="num font-semibold text-ink">{h.symbol}</p>
                        <p className="max-w-[9rem] truncate text-[11px] text-ink3">{h.sector ?? "Unclassified"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="num px-1.5 py-2.5 text-center text-ink2">{(h.weight * 100).toFixed(1)}%</td>
                  <td className="num px-1.5 py-2.5 text-center text-ink">
                    {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : "—"}
                  </td>
                  <td className={cn("num px-1.5 py-2.5 text-center", h.dayChangePct != null ? pnlColor(h.dayChangePct) : "text-ink3")}>
                    {h.dayChangePct != null ? signPct(h.dayChangePct) : "—"}
                  </td>
                  <td className={cn("num px-1.5 py-2.5 text-center", rp != null ? pnlColor(rp) : "text-ink3")}>
                    {rp != null ? signPct(rp) : "—"}
                  </td>
                  <td className="px-1.5 py-2.5 text-center">
                    <HealthCell h={h} compact />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <div className="space-y-2 md:hidden">
        {top.map((h) => {
          const rp = returnPct(h);
          return (
            <div key={h.symbol} className="rounded-xl border border-line bg-surface-2/50 p-3">
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: holdingHealthColor(h) }} />
                <div className="min-w-0 flex-1">
                  <p className="num font-semibold text-ink">{h.symbol}</p>
                  <p className="truncate text-[11px] text-ink3">{h.sector ?? "Unclassified"}</p>
                </div>
                <div className="text-right">
                  <p className="num text-[13px] text-ink">
                    {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : "—"}
                  </p>
                  <p className={cn("num text-[11px]", rp != null ? pnlColor(rp) : "text-ink3")}>
                    {rp != null ? signPct(rp) : "—"}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-[11px]">
                <span className="num text-ink3">{(h.weight * 100).toFixed(1)}% of book</span>
                <HealthCell h={h} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end border-t border-line pt-4">
        <Funnel onClick={onOpenHoldings}>See all {holdings.length} holdings</Funnel>
      </div>
    </div>
  );
}
