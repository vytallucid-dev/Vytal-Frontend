"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatINR, roundScore } from "@/lib/format";
import { Icons } from "@/lib/icons";
import { assetClassLabel } from "@/lib/asset-class";
import { useStockOhlcv } from "@/lib/api/hooks/use-stock-ohlcv";
import { useInstrumentSeries } from "@/lib/api/hooks/use-instruments";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import {
  MiniSpark,
  PILLAR_META,
  SPARK_MIN_POINTS,
} from "@/components/stock-detail/health/shared";
import type { PillarKey } from "@/types/health";
import type { Holding } from "@/types/portfolio";
import { STOCK_BAND_LABEL, holdingHealthColor, returnPct } from "../lib";
import { HoldingDisclosure } from "../holding-disclosure";
import { type HoldingRow, heldInLabel, priceStamp } from "./aggregate";
import type { AccountShare, EntityInstrument } from "./aggregate";

const pnlText = (v: number) =>
  v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2";
const signPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v))}`;

const PILLAR_ORDER: PillarKey[] = [
  "foundation",
  "momentum",
  "market",
  "ownership",
];

// ── a small labelled figure ──────────────────────────────────────────────────
function Fig({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[9.5px] uppercase tracking-[0.09em] text-ink3">
        {label}
      </p>
      <p
        className={cn(
          "num mt-0.5 truncate text-[13px] font-medium",
          tone ?? "text-ink",
        )}
      >
        {value}
      </p>
      {sub && <p className="num truncate text-[10px] text-ink3">{sub}</p>}
    </div>
  );
}

// ── the price sparkline — lazy per-symbol OHLCV; honest-omit under 3 real points. STOCKS ONLY: a fund's
//    "symbol" is its ISIN and the OHLCV endpoint is equity-only, so we never query it for a non-stock. ──
function PriceSpark({ symbol }: { symbol: string }) {
  const q = useStockOhlcv(symbol);
  if (q.isLoading)
    return <div className="shimmer h-[38px] w-full rounded-md bg-surface-2" />;
  const closes = (q.data?.bars ?? []).slice(-60).map((b) => b.close);
  if (closes.length < SPARK_MIN_POINTS) {
    return (
      <p className="text-[11px] italic text-ink3">Price history unavailable.</p>
    );
  }
  const up = closes[closes.length - 1] >= closes[0];
  return (
    // Stacked (chart over caption) so the chart gets the column's full width in the right-hand slot,
    // instead of sharing a row with its label — reads as a proper mini chart, not a cramped strip.
    <div className="flex flex-col items-start gap-1.5">
      <MiniSpark
        points={closes}
        color={up ? "var(--rec)" : "var(--crit)"}
        width={240}
        height={48}
        fill
      />
      <span className="num text-[10px] text-ink3">
        last {closes.length} sessions · at close
      </span>
    </div>
  );
}

// ── whether a class charts from the STORED weekly series (funds/ETFs) vs the equity OHLCV path ──
function isFundClass(ac: string | null | undefined): boolean {
  return ac === "mutual_fund" || ac === "etf";
}

// ── the "Price" section shell — eyebrow + top border, shared by every sparkline variant ──────────
function PriceSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-line pt-3.5">
      <p className="mb-2 text-[9.5px] uppercase tracking-[0.09em] text-ink3">
        Price
      </p>
      {children}
    </div>
  );
}

// ── a STORED weekly series drawn — NAV (funds) or a weekly close (listed non-stocks). NEVER "at close"
//    for a NAV: the sub-label is driven by the series' own `source`, so a weekly NAV reads "NAV · weekly". ──
function WeeklySparkLine({
  values,
  source,
}: {
  values: number[];
  source: string | null;
}) {
  const up = values[values.length - 1] >= values[0];
  const kind = source === "market_close" ? "weekly close" : "NAV · weekly";
  return (
    // Stacked (chart over caption) — same reasoning as the OHLCV spark; fills the right column cleanly.
    <div className="flex flex-col items-start gap-1.5">
      <MiniSpark
        points={values}
        color={up ? "var(--rec)" : "var(--crit)"}
        width={240}
        height={48}
        fill
      />
      <span className="num text-[10px] text-ink3">
        last {values.length} weeks · {kind}
      </span>
    </div>
  );
}

// ── FUND / ETF sparkline — from the STORED weekly NAV (never live mfapi). `coverage:"none"` is the
//    backfill-not-run state: an honest "still building", NEVER a broken empty chart and NEVER a live
//    fallback — it fills in as the weekly backfill runs. `partial`/`full` draw what exists. ──
function FundSparkBody({ instrumentId }: { instrumentId: string }) {
  const q = useInstrumentSeries(instrumentId, 350); // the last 350 / 7 = 50 weeks, not the full series (the sparkline is small)
  if (q.isLoading)
    return <div className="shimmer h-[38px] w-full rounded-md bg-surface-2" />;
  // Only the LATEST 50 weeks — a small sparkline shouldn't cram ~4 years of NAV into 200px (the stock
  // spark caps to the last 60 sessions for the same reason). Coverage is still read off the FULL series.
  const values = (q.data?.points ?? []).map((p) => p.value).slice(-50);
  if (q.data?.coverage === "none" || values.length < SPARK_MIN_POINTS) {
    return (
      <p className="text-[11px] italic text-ink3">
        Price history is still building — it fills in as we backfill NAVs.
      </p>
    );
  }
  return <WeeklySparkLine values={values} source={q.data?.source ?? null} />;
}

// ── LISTED non-stock (bond / G-Sec / SGB / REIT / InvIT) — a series exists ONLY if the instrument has
//    stored weekly-close rows. Most have none, and that is BY DESIGN (a bond has no NAV chart), not a
//    gap — so the WHOLE section renders only when there is a real series; otherwise nothing at all (no
//    empty "Price" header, no apology). Never a detail-page link — there is no page for these. ──
function ListedSparkSection({ instrumentId }: { instrumentId: string }) {
  const q = useInstrumentSeries(instrumentId, 350); // the last 350 / 7 = 50 weeks, not the full series (the sparkline is small)
  if (q.isLoading)
    return <div className="shimmer h-[38px] w-full rounded-md bg-surface-2" />;
  // Only the LATEST 50 weeks — a small sparkline shouldn't cram ~4 years of NAV into 200px (the stock
  // spark caps to the last 60 sessions for the same reason). Coverage is still read off the FULL series.
  const values = (q.data?.points ?? []).map((p) => p.value);
  if (q.data?.coverage === "none" || values.length < SPARK_MIN_POINTS)
    return null;
  return (
    <PriceSection>
      <WeeklySparkLine values={values} source={q.data?.source ?? null} />
    </PriceSection>
  );
}

// ── the health mini — band + score from the entity's representative; the 4 pillars lazy-fetched.
//    Unscored holdings (funds/ETFs/bonds) never fetch — they get their SERVED disclosure note. ──
function HealthMini({ holding }: { holding: Holding }) {
  const scored = holding.health != null;
  const q = useStockHealth(scored ? holding.symbol : "");
  const color = holdingHealthColor(holding);

  if (!scored) {
    // A non-stock (fund/ETF/REIT/bond…) carries SERVED disclosure notes — by-design "we don't judge
    // this", a coupon caveat, an unpriced reason. Render them verbatim. A STOCK still awaiting its first
    // score has no served note; it keeps the honest "not yet scored" line.
    if (holding.disclosureNotes?.length) {
      return (
        <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-3">
          <HoldingDisclosure notes={holding.disclosureNotes} />
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-3.5 py-3">
        <p className="text-[12px] text-ink2">Not yet scored</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink3">
          Vytal doesn&apos;t cover this name yet, so there&apos;s no health read
          to show — we don&apos;t invent one. The tracker figures above are live
          all the same.
        </p>
      </div>
    );
  }

  const pillars = q.data?.pillars ?? null;

  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-ink2">Health</span>
        <span className="inline-flex items-baseline gap-1.5">
          <span className="text-[11px] text-ink3">
            {holding.band ? STOCK_BAND_LABEL[holding.band] : "—"}
          </span>
          <span className="num text-[18px] font-semibold" style={{ color }}>
            {roundScore(holding.health!)}
          </span>
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
        {q.isLoading &&
          PILLAR_ORDER.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="w-[68px] text-[10.5px] text-ink3">
                {PILLAR_META[k].label}
              </span>
              <div className="shimmer h-1.5 flex-1 rounded-full bg-surface-3" />
            </div>
          ))}
        {pillars &&
          PILLAR_ORDER.map((k) => {
            const p = pillars.find((x) => x.pillar === k);
            const v = p?.subtotal ?? null;
            const meta = PILLAR_META[k];
            return (
              <div key={k} className="flex items-center gap-2">
                <span className="w-[68px] shrink-0 text-[10.5px] text-ink3">
                  {meta.label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${v ?? 0}%`, background: meta.cssVar }}
                  />
                </div>
                <span
                  className="num w-6 shrink-0 text-right text-[10.5px] font-medium"
                  style={{ color: meta.cssVar }}
                >
                  {v == null ? "—" : Math.round(v)}
                </span>
              </div>
            );
          })}
        {q.isError && (
          <p className="col-span-2 text-[11px] italic text-ink3">
            Pillar breakdown couldn&apos;t load right now.
          </p>
        )}
      </div>
    </div>
  );
}

// ── an in-expand funnel link (routes out of the portfolio surface) ────────────
function ExpandFunnel({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3 py-1.5 text-[12px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
    >
      {children}
      <Icons.arrowUpRight className="size-3" />
    </button>
  );
}

// ── one account's stake in a holding, as a compact chip. Highlights the filtered account. ──────────
function AccountChip({
  a,
  share,
  active,
}: {
  a: AccountShare;
  share: number | null;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px]",
        active ? "border-primary/60 bg-primary/5" : "border-line bg-surface-1",
      )}
    >
      <Icons.stack
        className={cn("size-3 shrink-0", active ? "text-primary" : "text-ink3")}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          active ? "font-medium text-ink" : "text-ink2",
        )}
      >
        {a.accountName}
      </span>
      <span className="num shrink-0 text-ink">
        {a.marketValue != null
          ? formatINR(a.marketValue, { compact: true })
          : "—"}
      </span>
      {share != null && (
        <span className="num shrink-0 text-ink3">
          {Math.round(share * 100)}%
        </span>
      )}
    </div>
  );
}

// ── the entity breakdown: BY ACCOUNT for a single instrument spread across books (RELIANCE), or BY
//    INSTRUMENT for a multi-instrument issuer (NTPC stock + bond), each with its own basis + accounts. ──
function Breakdown({
  row,
  activeAccount,
  scoped,
}: {
  row: HoldingRow;
  activeAccount: string | null;
  scoped?: boolean;
}) {
  const e = row.entity;

  if (e.multiInstrument) {
    return (
      <div className="mt-4 border-t border-line pt-3.5">
        <p className="mb-2 text-[9.5px] uppercase tracking-[0.09em] text-ink3">
          {e.instruments.length} instruments of one issuer
        </p>
        <div className="flex flex-col gap-2">
          {e.instruments.map((inst) => (
            <InstrumentRow
              key={inst.instrument.isin ?? inst.instrument.symbol}
              inst={inst}
              activeAccount={activeAccount}
              scoped={scoped}
            />
          ))}
        </div>
      </div>
    );
  }

  // Account-SCOPED: you're already inside one account, so the "across N accounts" chip grid is
  // redundant (and self-hides anyway — a scoped slice has one account per entity). Suppress it.
  if (!scoped && e.accounts.length > 1) {
    return (
      <div className="mt-4 border-t border-line pt-3.5">
        <p className="mb-2 text-[9.5px] uppercase tracking-[0.09em] text-ink3">
          Across {e.accounts.length} accounts
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {e.accounts.map((a) => (
            <AccountChip
              key={a.accountId}
              a={a}
              share={
                e.marketValue != null && e.marketValue > 0
                  ? (a.marketValue ?? 0) / e.marketValue
                  : null
              }
              active={a.accountId === activeAccount}
            />
          ))}
        </div>
      </div>
    );
  }

  // single instrument, single account — no breakdown to draw; the row's "held in" already names it.
  return null;
}

// ── one instrument line inside a multi-instrument entity — its class, own basis, accounts, own read. ──
function InstrumentRow({
  inst,
  activeAccount,
  scoped,
}: {
  inst: EntityInstrument;
  activeAccount: string | null;
  scoped?: boolean;
}) {
  const h = inst.instrument;
  const rp = returnPct(h);
  const touchesActive =
    activeAccount != null &&
    inst.accounts.some((a) => a.accountId === activeAccount);
  return (
    <div
      className={cn(
        "rounded-md border bg-surface-1 px-3 py-2",
        touchesActive ? "border-primary/50" : "border-line",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {/* NAME leads here too; the ISIN/ticker sits muted below */}
        <span className="min-w-0 truncate text-[12px] font-semibold text-ink">
          {h.name ?? h.symbol}
        </span>
        {h.assetClass && (
          <span className="shrink-0 rounded border border-line2 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-ink3">
            {assetClassLabel(h.assetClass)}
          </span>
        )}
        <span className="num ml-auto shrink-0 text-[11px] text-ink3">
          {h.quantity} × {formatINR(h.avgCost)}
        </span>
      </div>
      <p className="num text-[10px] text-ink3/70">{h.symbol}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="num text-ink3">
          invested{" "}
          <span className="text-ink2">
            {formatINR(h.investedValue, { compact: true })}
          </span>
        </span>
        <span className="num text-ink3">
          current{" "}
          <span className="text-ink2">
            {h.marketValue != null
              ? formatINR(h.marketValue, { compact: true })
              : "—"}
          </span>
        </span>
        {h.unrealizedPnl != null && (
          <span className={cn("num", pnlText(h.unrealizedPnl))}>
            {signINR(h.unrealizedPnl)}
            {rp != null && (
              <span className="ml-1 opacity-80">({signPct(rp)})</span>
            )}
          </span>
        )}
        {/* health-free scoped mode drops the per-constituent score; a served disclosure note (unpriced,
            by-design, coupon) is NOT health and rides along in both modes. */}
        {!scoped && h.health != null ? (
          <span
            className="num ml-auto font-medium"
            style={{ color: holdingHealthColor(h) }}
          >
            {roundScore(h.health)}
          </span>
        ) : h.disclosureNotes?.length ? (
          <span className="ml-auto">
            <HoldingDisclosure notes={h.disclosureNotes} variant="inline" />
          </span>
        ) : null}
      </div>
      {/* the "held in" account line is redundant on a single-account page — suppress it there */}
      {!scoped && (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-ink3/80">
          <Icons.stack className="size-2.5 shrink-0" />
          {heldInLabel(inst.accounts)}
        </p>
      )}
    </div>
  );
}

export function RowExpand({
  row,
  activeAccount,
  scoped,
}: {
  row: HoldingRow;
  activeAccount: string | null;
  /** Account-detail (health-free, single-account) mode: no HealthMini (so `useStockHealth` never
   *  fetches), no health-page link, no account breakdown, weight labelled "of this account". */
  scoped?: boolean;
}) {
  const router = useRouter();
  const e = row.entity;
  const rp = returnPct(row);
  const multi = e.multiInstrument;
  const equity = e.equity; // the scored stock — drives the OHLCV spark + the stock links
  const rep = e.representative; // the entity's lead instrument — its class decides the non-stock path
  const fund = !equity && isFundClass(rep.assetClass); // a fund/ETF entity (never a stock-led one)
  const ltpStamp = priceStamp(row.priceSource, row.priceAsOf);

  // The RIGHT column stacks: [HealthMini — non-scoped only] · the price sparkline (stock OHLCV / fund
  // NAV) · the class link buttons beneath it. A listed non-stock (bond/G-Sec/REIT/T-bill) has neither
  // an OHLCV/NAV spark nor a detail page, so in scoped mode its right column would be empty — we drop it
  // and let the left span full-width (its stored weekly series, if any, sits in the left). Building the
  // element here is lazy: PriceSpark/FundSparkBody only fetch when React actually renders them below.
  const rightSpark = equity ? (
    <PriceSpark symbol={equity.symbol} />
  ) : fund && rep.instrumentId ? (
    <FundSparkBody instrumentId={rep.instrumentId} />
  ) : null;
  const hasButtons = !!equity || (fund && !!rep.schemeCode);
  const showRight = !scoped || rightSpark != null || hasButtons;

  return (
    <div className={cn("grid gap-5 px-3 py-4 sm:px-4", showRight && "lg:grid-cols-[1.5fr_1fr]")}>
      {/* left — tracker detail + breakdown + (for a stock) sparkline */}
      <div className="min-w-0">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-4">
          <Fig
            label="LTP"
            value={row.currentPrice != null ? formatINR(row.currentPrice) : "—"}
            sub={
              row.currentPrice != null
                ? (ltpStamp ?? undefined)
                : multi
                  ? "per instrument — see below"
                  : undefined
            }
          />
          <Fig
            label="Day change"
            value={row.dayChangePct != null ? signPct(row.dayChangePct) : "—"}
            tone={
              row.dayChangePct != null ? pnlText(row.dayChangePct) : "text-ink3"
            }
            sub={
              row.dayChangeValue != null
                ? signINR(row.dayChangeValue)
                : undefined
            }
          />
          <Fig
            label="Qty × avg"
            value={multi ? "—" : `${row.quantity} × ${formatINR(row.avgCost)}`}
            sub={multi ? "mixed instruments" : undefined}
          />
          <Fig label="Invested" value={formatINR(row.investedValue)} />
          <Fig
            label="Current value"
            value={row.marketValue != null ? formatINR(row.marketValue) : "—"}
          />
          <Fig
            label="Total P&L"
            value={row.unrealizedPnl != null ? signINR(row.unrealizedPnl) : "—"}
            tone={
              row.unrealizedPnl != null
                ? pnlText(row.unrealizedPnl)
                : "text-ink3"
            }
            sub={rp != null ? signPct(rp) : undefined}
          />
          <Fig
            label="Realized P&L"
            value={row.realizedPnl !== 0 ? signINR(row.realizedPnl) : "—"}
            tone={
              row.realizedPnl !== 0 ? pnlText(row.realizedPnl) : "text-ink3"
            }
            sub={row.realizedPnl !== 0 ? "booked" : "none booked"}
          />
          <Fig
            label="Weight"
            value={`${(row.weight * 100).toFixed(1)}%`}
            sub={scoped ? "of this account" : "of book"}
          />
        </div>

        <Breakdown row={row} activeAccount={activeAccount} scoped={scoped} />

        {/* PRICE (left) — ONLY the listed non-stock stored weekly series (bond/G-Sec/REIT/InvIT), and
            ONLY when one exists (else nothing — a bond has no NAV chart, by design). These classes have
            no right column, so their series lives here, full-width. The stock OHLCV and fund NAV
            sparklines live in the RIGHT column, above their link buttons. */}
        {!equity && !fund && rep.instrumentId ? (
          <ListedSparkSection instrumentId={rep.instrumentId} />
        ) : null}
      </div>

      {/* right — [HealthMini · non-scoped] · the price sparkline on top · the class link buttons beneath
          it. The sparkline gets its own room here (a proper mini chart), and the buttons tuck under it
          instead of floating in dead space. Stock: OHLCV spark + Stock page / Trajectory. Fund/ETF: NAV
          spark + Fund page (gated on schemeCode; a fund's ISIN-as-symbol never goes to the stock
          screener). In scoped (health-free) mode the HealthMini is never mounted (so useStockHealth never
          fires) and the Health-page link is dropped. */}
      {showRight && (
        <div className="flex flex-col gap-3 lg:border-l lg:border-line lg:pl-5">
          {!scoped && <HealthMini holding={rep} />}
          {rightSpark && (
            <div>
              <p className="mb-1.5 text-[9.5px] uppercase tracking-[0.09em] text-ink3">Price</p>
              {rightSpark}
            </div>
          )}
          {equity ? (
            <div className="flex flex-wrap gap-2">
              <ExpandFunnel
                onClick={() =>
                  router.push(`/research/stock-screener/${equity.symbol}`)
                }
              >
                Stock page
              </ExpandFunnel>
              {!scoped && (
                <ExpandFunnel
                  onClick={() =>
                    router.push(
                      `/research/stock-screener/${equity.symbol}?tab=health`,
                    )
                  }
                >
                  Health page
                </ExpandFunnel>
              )}
              <ExpandFunnel
                onClick={() =>
                  router.push(`/research/trajectory?symbol=${equity.symbol}`)
                }
              >
                Trajectory
              </ExpandFunnel>
            </div>
          ) : fund && rep.schemeCode ? (
            <div className="flex flex-wrap gap-2">
              <ExpandFunnel
                onClick={() => router.push(`/research/funds/${rep.schemeCode}`)}
              >
                Fund page
              </ExpandFunnel>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
