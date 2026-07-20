"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { Icons } from "@/lib/icons";
import type { BrokerCatalogEntry, Holding } from "@/types/portfolio";
import { STOCK_BAND_LABEL, holdingClass, holdingHealthColor } from "../lib";
import { HoldingDisclosure } from "../holding-disclosure";
import { useAccounts, useBrokerCatalog } from "@/lib/api/hooks/use-accounts";
import { accountKind, brokerHue, brokerLabel } from "../accounts/lib";
import { aggregateBook, type HoldingRow } from "../holdings/aggregate";
import type { AccountShare } from "../health/lib";
import { Funnel } from "./shared";

const pnlColor = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const signPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

function returnPct(h: Holding): number | null {
  if (h.unrealizedPnl == null || h.investedValue <= 0) return null;
  return (h.unrealizedPnl / h.investedValue) * 100;
}

/** NAME leads over a raw ISIN (the standing rule): a fund whose ticker fell back to its ISIN
 *  (`symbol === isin`) shows its instrument name; a stock keeps its real ticker. */
function displayName(h: HoldingRow): { text: string; ticker: boolean } {
  const isIsinFallback = !!h.isin && h.symbol === h.isin;
  return isIsinFallback ? { text: h.name ?? h.symbol, ticker: false } : { text: h.symbol, ticker: true };
}

// per-broker colour is shared from accounts/lib (brokerHue) — one source for every surface.

interface AcctMeta {
  broker: string;
  kind: "verified" | "stated";
}

/** A VISIBLE coloured broker chip — its own per-broker colour so a Zerodha holding and a Groww
 *  holding read apart at a glance (never the near-invisible grey it was). */
function BrokerPill({ broker, catalogue }: { broker: string; catalogue: BrokerCatalogEntry[] | undefined }) {
  const hue = brokerHue(broker);
  return (
    <span
      className="shrink-0 rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide"
      style={{ color: hue, background: `color-mix(in oklch, ${hue} 20%, transparent)`, borderColor: `color-mix(in oklch, ${hue} 38%, transparent)`, borderWidth: 1 }}
    >
      {brokerLabel(broker, catalogue, undefined)}
    </span>
  );
}

/** A neutral account badge — the account NAME as a proper chip (never plain text, never a UUID).
 *  Used for every account; a Verified account additionally wears its coloured broker badge. */
function AccountChip({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-[7rem] shrink-0 items-center gap-1 rounded border border-line2 bg-surface-2 px-1.5 py-px text-[9.5px] text-ink2">
      <span className="truncate">{name}</span>
    </span>
  );
}

// ── which accounts hold this entity + their broker. ONE group per account (₹-desc, capped for a
//    preview): the account NAME as a neutral BADGE (always — never plain text, never a UUID), plus a
//    coloured broker badge for a genuinely broker-linked (Verified) account (where the data comes from
//    that feed). A manual account shows its name as the neutral badge only — no invented broker. So a
//    split like RELIANCE renders as two neutral account badges; a Verified holding reads as its
//    account badge + a coloured broker badge; a mixed entity reads "[My Holdings][ZERODHA] [demo]". ──
const MAX_ACCT_CHIPS = 2;
function AccountBrokerBadges({
  accounts,
  acctMeta,
  catalogue,
}: {
  accounts: AccountShare[];
  acctMeta: Map<string, AcctMeta>;
  catalogue: BrokerCatalogEntry[] | undefined;
}) {
  if (!accounts.length) return null;
  const shown = accounts.slice(0, MAX_ACCT_CHIPS);
  const overflow = accounts.length - shown.length;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px]">
      <Icons.stack className="size-2.5 shrink-0 text-ink3" />
      {shown.map((a) => {
        const meta = acctMeta.get(a.accountId);
        return (
          <span key={a.accountId} className="inline-flex items-center gap-1">
            <AccountChip name={a.accountName} />
            {meta?.kind === "verified" && <BrokerPill broker={meta.broker} catalogue={catalogue} />}
          </span>
        );
      })}
      {overflow > 0 && <span className="shrink-0 text-ink3">+{overflow}</span>}
    </p>
  );
}

function HealthCell({ h, compact }: { h: Holding; compact?: boolean }) {
  const color = holdingHealthColor(h);
  // Unscored → the SERVED disclosure note carries the reason inline (by-design fund/ETF, unpriced, …);
  // never the faked "Unscored" label. A bare "—" only for a stock still awaiting its first score.
  if (h.health == null) {
    return h.disclosureNotes?.length ? (
      <HoldingDisclosure notes={h.disclosureNotes} variant="inline" className="justify-end" />
    ) : (
      <span className="text-[11px] text-ink3">—</span>
    );
  }
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
      {/* label hidden on the compact (table) layout to keep the row from overflowing */}
      <span className={cn("text-[11px] text-ink2", compact && "hidden lg:inline")}>
        {h.band ? STOCK_BAND_LABEL[h.band] : "—"}
      </span>
      <span className="num w-4 text-right font-medium" style={{ color }}>
        {Math.round(h.health)}
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
  // ONE row per ISSUER ENTITY — the SAME `aggregateBook` the Holdings tab uses, so RELIANCE-in-two-
  // accounts (and a stock/bond issuer) appears ONCE here, matching Holdings/Health. Not a fork.
  const rows = useMemo(() => aggregateBook(holdings).rows, [holdings]);
  const top = useMemo(() => [...rows].sort((a, b) => b.weight - a.weight).slice(0, 8), [rows]);

  // Broker per account lives on /me/accounts (the holdings wire carries only the account NAME), so the
  // badge derives the broker from the account. Existing endpoints, cached — no backend change.
  const accountsQ = useAccounts();
  const catalogueQ = useBrokerCatalog();
  const acctMeta = useMemo(() => {
    const m = new Map<string, AcctMeta>();
    for (const a of accountsQ.data ?? []) m.set(a.id, { broker: a.broker, kind: accountKind(a) });
    return m;
  }, [accountsQ.data]);

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
              const name = displayName(h);
              return (
                <tr key={h.entity.key} className="border-t border-line transition-colors hover:bg-surface-2/50">
                  <td className="px-1.5 py-2.5">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: holdingHealthColor(h) }} />
                      <div className="min-w-0">
                        <p className={cn("max-w-[12rem] truncate font-semibold text-ink", name.ticker && "num")}>{name.text}</p>
                        <p className="max-w-[12rem] truncate text-[11px] text-ink3">{holdingClass(h)}</p>
                        <AccountBrokerBadges accounts={h.entity.accounts} acctMeta={acctMeta} catalogue={catalogueQ.data} />
                      </div>
                    </div>
                  </td>
                  <td className="num px-1.5 py-2.5 text-center  text-ink2">{(h.weight * 100).toFixed(1)}%</td>
                  <td className="num px-1.5 py-2.5 text-center  text-ink">
                    {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : "—"}
                  </td>
                  <td className={cn("num px-1.5 py-2.5 text-center ", h.dayChangePct != null ? pnlColor(h.dayChangePct) : "text-ink3")}>
                    {h.dayChangePct != null ? signPct(h.dayChangePct) : "—"}
                  </td>
                  <td className={cn("num px-1.5 py-2.5 text-center ", rp != null ? pnlColor(rp) : "text-ink3")}>
                    {rp != null ? signPct(rp) : "—"}
                  </td>
                  <td className="px-1.5 py-2.5 text-center ">
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
          const name = displayName(h);
          return (
            <div key={h.entity.key} className="rounded-xl border border-line bg-surface-2/50 p-3">
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: holdingHealthColor(h) }} />
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-[13.5px] font-semibold text-ink", name.ticker && "num")}>{name.text}</p>
                  <p className="truncate text-[11px] text-ink3">{holdingClass(h)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num text-[13px] text-ink">
                    {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : "—"}
                  </p>
                  <p className={cn("num text-[11px]", rp != null ? pnlColor(rp) : "text-ink3")}>
                    {rp != null ? signPct(rp) : "—"}
                  </p>
                </div>
              </div>
              <AccountBrokerBadges accounts={h.entity.accounts} acctMeta={acctMeta} catalogue={catalogueQ.data} />
              <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-[11px]">
                <span className="num text-ink3">{(h.weight * 100).toFixed(1)}% of book</span>
                <HealthCell h={h} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end border-t border-line pt-4">
        {/* the ENTITY count — matches the KPI, the header and Holdings/Health (never raw positions) */}
        <Funnel onClick={onOpenHoldings}>See all {rows.length} holdings</Funnel>
      </div>
    </div>
  );
}
