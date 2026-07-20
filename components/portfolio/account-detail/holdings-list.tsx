"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Holding } from "@/types/portfolio";
import { holdingClass, returnPct } from "@/components/portfolio/lib";
import { HoldingDisclosure } from "@/components/portfolio/holding-disclosure";

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT DETAIL · HOLDINGS — a purpose-built, read-only list of ONE account's positions.
// Deliberately NOT the portfolio Holdings table: that surface renders health, band, weight
// (% of the whole book) and a concentration read — all of which are portfolio-level reads
// that would be wrong, or forbidden, scoped to a single account. This shows only what an
// account honestly owns: quantity, avg cost, invested, current value, unrealised P&L.
//
// Avg cost / invested here are THIS account's own FIFO figures — the /me/holdings union is
// per-account, so each line already carries this account's lot queue (never blended).
//
// A position we can't price (e.g. an instrument with no live close) shows its REASON via the SERVED
// disclosure note rendered under the row — the absence is stated, not implied. The numeric cell shows a
// plain "—" (no number exists); the note beneath it says why. Coupon / by-design notes ride the same line.
// ─────────────────────────────────────────────────────────────────────────────

const pnlColor = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const signPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;

function PnlCell({ h }: { h: Holding }) {
  if (h.unrealizedPnl == null) return <span className="text-ink3">—</span>;
  const rp = returnPct(h);
  return (
    <div className={cn("num leading-tight", pnlColor(h.unrealizedPnl))}>
      <div>{signINR(h.unrealizedPnl)}</div>
      {rp != null && <div className="text-[10px] opacity-80">{signPct(rp)}</div>}
    </div>
  );
}

export function AccountHoldings({ holdings }: { holdings: Holding[] }) {
  if (holdings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line2 bg-surface-2/40 px-5 py-10 text-center text-[12.5px] text-ink3">
        No holdings in this book yet.
      </p>
    );
  }

  const rows = [...holdings].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-3 sm:p-4">
      {/* desktop table */}
      <div className="custom-scrollbar hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] border-collapse text-[12px]">
          <thead>
            <tr className="text-[9.5px] uppercase tracking-wide text-ink3">
              <th className="px-1.5 py-2 text-left font-semibold">Holding</th>
              <th className="px-1.5 py-2 text-right font-semibold">Qty</th>
              <th className="px-1.5 py-2 text-right font-semibold">Avg cost</th>
              <th className="px-1.5 py-2 text-right font-semibold">Invested</th>
              <th className="px-1.5 py-2 text-right font-semibold">Current</th>
              <th className="px-1.5 py-2 text-right font-semibold">Unrealised P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <Fragment key={h.symbol}>
                <tr className={cn("border-t border-line", h.disclosureNotes?.length && "border-b-0")}>
                  <td className="px-1.5 py-2.5">
                    <div className="min-w-0">
                      <p className="num font-semibold text-ink">{h.symbol}</p>
                      <p className="max-w-[13rem] truncate text-[11px] text-ink3">{h.name}</p>
                      <p className="truncate text-[10px] text-ink3/80">{holdingClass(h)}</p>
                    </div>
                  </td>
                  <td className="num px-1.5 py-2.5 text-right text-ink2">{h.quantity}</td>
                  <td className="num px-1.5 py-2.5 text-right text-ink2">{formatINR(h.avgCost)}</td>
                  <td className="num px-1.5 py-2.5 text-right text-ink2">{formatINR(h.investedValue, { compact: true })}</td>
                  <td className="num px-1.5 py-2.5 text-right text-ink">
                    {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : <span className="text-ink3">—</span>}
                  </td>
                  <td className="px-1.5 py-2.5 text-right">
                    <div className="flex justify-end">
                      <PnlCell h={h} />
                    </div>
                  </td>
                </tr>
                {/* the served REASON(s) — unpriced / by-design / coupon — verbatim, under the row it explains */}
                {h.disclosureNotes?.length ? (
                  <tr>
                    <td colSpan={6} className="px-1.5 pb-2.5">
                      <HoldingDisclosure notes={h.disclosureNotes} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <div className="space-y-2 md:hidden">
        {rows.map((h) => (
          <div key={h.symbol} className="rounded-xl border border-line bg-surface-1 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="num text-[13.5px] font-semibold text-ink">{h.symbol}</p>
                <p className="truncate text-[11px] text-ink3">{holdingClass(h)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="num text-[13px] text-ink">
                  {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : <span className="text-ink3">—</span>}
                </p>
                <div className="mt-0.5 flex justify-end text-[11px]">
                  <PnlCell h={h} />
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-line/60 pt-2 text-[11px] text-ink3">
              <span className="num">{h.quantity} × {formatINR(h.avgCost)}</span>
              <span className="num">{formatINR(h.investedValue, { compact: true })} invested</span>
            </div>
            {/* the served REASON(s) — verbatim, beneath the card */}
            {h.disclosureNotes?.length ? (
              <div className="mt-2 border-t border-line/60 pt-2">
                <HoldingDisclosure notes={h.disclosureNotes} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
