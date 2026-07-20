"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Icons } from "@/lib/icons";
import type { Holding, HoldingsTotals, Transaction, XirrResponse } from "@/types/portfolio";
import { useAccounts, useBrokerCatalog, usePatchAccount } from "@/lib/api/hooks/use-accounts";
import { useBrokerStatus } from "@/lib/api/hooks/use-brokers";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { useTransactions } from "@/lib/api/hooks/use-transactions";
import { accountKind, accountStatsMap, brokerLabel, countLabel } from "@/components/portfolio/accounts/lib";
import { type AllocationMode, type HoldingSortKey, type SortDir } from "@/components/portfolio/lib";
import { LedgerTable } from "@/components/portfolio/transactions/ledger-table";
import { aggregateBook } from "@/components/portfolio/holdings/aggregate";
import { AllocationLayer } from "@/components/portfolio/holdings/allocation-layer";
import { PositionsTable } from "@/components/portfolio/holdings/positions-table";
import { Attribution } from "@/components/portfolio/performance/attribution";
import { ReturnsBreakdown } from "@/components/portfolio/performance/breakdown";
import { ReturnsSummary } from "@/components/portfolio/performance/summary";
import { dividendIncome } from "@/components/portfolio/performance/lib";
import { AccountHeader } from "./header";
import { StatedActions } from "./stated-actions";
import { VerifiedActions } from "./verified-actions";
import { cashflowsFromLedger, computeXirr } from "./xirr";

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT DETAIL — one book, on its own, as a SCOPED MINI-PORTFOLIO. One scroll, no tab bar:
// the portfolio's Holdings + Performance surfaces reused verbatim, each fed this account's slice
// (`accountHoldings = holdings.filter(h => h.accountId === id)`). Five surfaces:
//   1 · Returns scalars — Total return, XIRR (client-computed over THIS book's ledger), Current /
//       Invested, Day change ₹. (ReturnsSummary in `scoped` mode.)
//   2 · Allocation donut — composition of just this account (its own 100%). (AllocationLayer.)
//   3 · Holdings — the RICH positions table in `scoped` mode: full cost-basis expand, fund NAV
//       sparkline, class chips, realized P&L per row, account-RELATIVE weight — and ZERO health.
//   4 · Attribution — this account's contributors / detractors. (Attribution.)
//   5 · Returns breakdown — P&L by sector/class + realized/unrealized, fed per-account inputs.
//
// THE LAW OF THIS PAGE — HEALTH-FREE. No score / band / pillar / finding / coverage-of-health /
// red-flag / health colour anywhere. The rich table is mounted `scoped`, which drops its Health
// column, band-dot colour, "awaiting score" note and the entire HealthMini pillar block (so
// `useStockHealth` is never even fetched); the four other surfaces read only money fields.
//
// OMITTED, on purpose (no per-account source — never faked): the value-over-time chart, TWR,
// vs-Nifty alpha and best/worst-day are all whole-book, series-based measures with no per-account
// NAV series. They stay on the portfolio Performance tab; here the day-change ₹ is the "today" read.
//
// Two composed shapes, still honest: Verified (broker feed) keeps its "no transaction history"
// note; Stated (manual) keeps its own read-only ledger below the surfaces.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE = "mx-auto w-full min-w-0";

function BackLink() {
  return (
    <Link
      href="/portfolio?tab=accounts"
      className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink3 transition-colors hover:text-ink2"
    >
      <Icons.arrowLeft className="size-3.5" />
      Back to accounts
    </Link>
  );
}

export function AccountDetail({ accountId }: { accountId: string }) {
  const accountsQ = useAccounts();
  const holdQ = useHoldings();
  // A SECOND holdings read, with fully-exited (qty 0) rows, ONLY to sum an accurate per-account
  // realized P&L — a book the user fully exited would otherwise vanish from the held-only feed. The
  // held feed still drives every display surface; this one contributes a single number.
  const exitedHoldQ = useHoldings({ includeExited: true });
  const { data: catalogue } = useBrokerCatalog();
  const { data: brokerStatus } = useBrokerStatus();
  // User-wide ledger — the connect dialog's warning states the earliest trade month, attributable
  // only against the whole user's ledger (NOT the account-scoped read the ledger table uses).
  const userTxnsQ = useTransactions();
  // This account's own ledger (scoped) — feeds the client XIRR + dividends. Same query key the
  // ledger table below issues, so React Query serves both from one request.
  const acctTxnsQ = useTransactions(accountId);
  const patch = usePatchAccount();

  // Local view state for the scoped Holdings + Allocation surfaces (the SHARED cut drives both).
  const [cut, setCut] = useState<AllocationMode>("class");
  const [grouped, setGrouped] = useState(false);
  const [sort, setSort] = useState<{ key: HoldingSortKey; dir: SortDir }>({ key: "weight", dir: "desc" });
  const onSort = (key: HoldingSortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "symbol" ? "asc" : "desc" },
    );

  const loading = accountsQ.isLoading || holdQ.isLoading;
  const isError = accountsQ.isError || holdQ.isError;

  if (loading) {
    return (
      <div className={PAGE}>
        <BackLink />
        <QuerySkeleton rows={5} rowHeight="h-16" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={PAGE}>
        <BackLink />
        <QueryError
          message={(accountsQ.error as Error)?.message ?? (holdQ.error as Error)?.message ?? "Failed to load this account"}
          onRetry={() => {
            accountsQ.refetch();
            holdQ.refetch();
          }}
        />
      </div>
    );
  }

  const account = (accountsQ.data ?? []).find((a) => a.id === accountId);

  if (!account) {
    return (
      <div className={PAGE}>
        <BackLink />
        <div className="rounded-2xl border border-dashed border-line2 px-8 py-16 text-center">
          <Icons.prohibit weight="duotone" className="mx-auto mb-3 size-8 text-ink3 opacity-70" />
          <h1 className="font-display text-[20px] font-semibold text-ink2">Account not found</h1>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink3">
            This book doesn’t exist, or it isn’t one of yours. It may have been removed.
          </p>
        </div>
      </div>
    );
  }

  const holdings = holdQ.data?.holdings ?? [];
  const accountHoldings = holdings.filter((h) => h.accountId === account.id);
  const value = accountStatsMap(holdings).get(account.id)?.value ?? null;
  const label = brokerLabel(account.broker, catalogue, brokerStatus?.available);
  const kind = accountKind(account);
  const isStated = kind === "stated";

  // Inline rename is unconditional server-side, so both kinds get it. The action bar differs:
  //   • Stated   (Stage 2) — connect / retag / move / delete
  //   • Verified (Stage 3) — sync / pause · resume / rescue / delete
  const onRename = async (name: string) => {
    await patch.mutateAsync({ id: account.id, body: { name } });
  };
  const actions = isStated ? (
    <StatedActions
      account={account}
      accounts={accountsQ.data ?? []}
      transactions={userTxnsQ.data}
      catalogue={catalogue}
      adapted={brokerStatus?.available}
    />
  ) : (
    <VerifiedActions
      account={account}
      accounts={accountsQ.data ?? []}
      holdingCount={accountHoldings.length}
      catalogue={catalogue}
      adapted={brokerStatus?.available}
    />
  );

  return (
    <div className={PAGE}>
      <AccountHeader
        account={account}
        label={label}
        value={value}
        holdingCount={accountHoldings.length}
        onRename={onRename}
        actions={actions}
      />

      {accountHoldings.length === 0 ? (
        // An empty book — nothing to compose. State it plainly (no zero-filled tiles or charts).
        <>
          <SectionEyebrow label="Holdings" pill="0 holdings" icon={Icons.portfolio} accent="var(--c-pristine)" />
          <p className="rounded-xl border border-dashed border-line2 bg-surface-2/40 px-5 py-10 text-center text-[12.5px] text-ink3">
            No holdings in this book yet.
          </p>
        </>
      ) : (
        <ScopedPortfolio
          account={account}
          accountHoldings={accountHoldings}
          holdings={holdings}
          exitedHoldings={exitedHoldQ.data?.holdings ?? null}
          acctTxns={acctTxnsQ.data ?? []}
          txnsLoading={acctTxnsQ.isLoading}
          cut={cut}
          onCut={setCut}
          grouped={grouped}
          onGrouped={setGrouped}
          sort={sort}
          onSort={onSort}
        />
      )}

      {kind === "verified" ? (
        // A broker feed is a snapshot of what you hold now — it carries no dates and no past.
        // State that once, plainly (not as a warning); there is deliberately no ledger below.
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-line bg-surface-1/60 px-4 py-3.5">
          <Icons.shield weight="duotone" className="mt-0.5 size-4 shrink-0 text-ink3" />
          <p className="text-[12.5px] leading-relaxed text-ink2">
            These holdings come straight from {label}’s feed — a live snapshot of what you hold now. A broker feed
            carries no dates and no past, so this book has no transaction history by design.
          </p>
        </div>
      ) : (
        // ── Stated only — this account's own ledger, read-only ──
        <>
          <SectionEyebrow
            label="Transactions"
            pill={countLabel(account.transactionCount, "transaction")}
            icon={Icons.coins}
            accent="var(--p-mkt)"
          />
          <AccountLedger accountId={account.id} />
        </>
      )}
    </div>
  );
}

// ── The scoped mini-portfolio: five reused surfaces, each fed this account's slice. Split out so all
//    the per-account derivations live in one place, computed only when the account actually has holdings. ──
function ScopedPortfolio({
  account,
  accountHoldings,
  holdings,
  exitedHoldings,
  acctTxns,
  txnsLoading,
  cut,
  onCut,
  grouped,
  onGrouped,
  sort,
  onSort,
}: {
  account: { id: string };
  accountHoldings: Holding[];
  holdings: Holding[];
  exitedHoldings: Holding[] | null;
  acctTxns: Transaction[];
  txnsLoading: boolean;
  cut: AllocationMode;
  onCut: (m: AllocationMode) => void;
  grouped: boolean;
  onGrouped: (g: boolean) => void;
  sort: { key: HoldingSortKey; dir: SortDir };
  onSort: (key: HoldingSortKey) => void;
}) {
  // ── Same-population money (the honesty the by-account chart uses): a PRICED row feeds both the
  //    invested and current sums; an unpriced row feeds neither. Current = Σ marketValue over priced
  //    rows — byte-for-byte the header's "Value" (accountStatsMap). ──
  const priced = accountHoldings.filter((h) => h.marketValue != null);
  const currentValue = priced.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  const investedValue = priced.reduce((s, h) => s + h.investedValue, 0);
  const unrealized = accountHoldings.reduce((s, h) => s + (h.unrealizedPnl ?? 0), 0);
  const dayRows = accountHoldings.filter((h) => h.dayChangeValue != null);
  const dayChange = dayRows.length ? dayRows.reduce((s, h) => s + (h.dayChangeValue ?? 0), 0) : null;

  // Realized — from the include-exited feed so a FULLY-EXITED position in this book still counts;
  // falls back to the held feed until that read lands (both carry per-row realizedPnl + accountId).
  const realizedRows = (exitedHoldings ?? holdings).filter((h) => h.accountId === account.id);
  const realizedPnlAll = realizedRows.reduce((s, h) => s + h.realizedPnl, 0);

  const dividends = dividendIncome(acctTxns);

  // Rich-table rows: aggregate this account's slice to per-entity rows (idempotent on a single-account
  // slice — RELIANCE stays one row, an NTPC stock+bond stays one entity), then RENORMALIZE weight to
  // the account (the server `weight` is "% of book" — wrong scoped to one book). Bar-scaling and the
  // weight sort are invariant to the denominator, so this only fixes the displayed number; the `scoped`
  // prop relabels it "of this account".
  const scopedRows = (() => {
    const rows = aggregateBook(accountHoldings).rows;
    const denom = rows.reduce((s, r) => s + (r.marketValue ?? 0), 0);
    return rows.map((r) => ({ ...r, weight: denom > 0 ? (r.marketValue ?? 0) / denom : 0 }));
  })();

  // XIRR — client-side, over THIS account's ledger cashflows + its current value as the terminal flow,
  // dated to the latest price the book carries (data-derived, so it needs no wall-clock and stays honest
  // even on a weekend). The same pure solver the backend runs whole-book; the per-account route doesn't exist.
  const priceDates = priced.map((h) => h.priceAsOf).filter((d): d is string => !!d).sort();
  const txnDates = acctTxns.map((t) => t.tradeDate).sort();
  const terminalDate = priceDates.length ? priceDates[priceDates.length - 1] : txnDates.length ? txnDates[txnDates.length - 1] : null;
  const xirrResult = computeXirr(cashflowsFromLedger(acctTxns, currentValue, terminalDate));
  const xirr: XirrResponse = {
    xirrPct: xirrResult.xirrPct,
    state: xirrResult.state,
    method: xirrResult.method,
    flowCount: xirrResult.flowCount,
    currentValue: currentValue > 0 ? currentValue : null,
    firstDate: xirrResult.firstDate,
    lastDate: xirrResult.lastDate,
    days: xirrResult.days,
    meta: { basis: "this account's ledger", terminalBasis: "current value", annualized: true },
  };

  // A per-account totals object (same shape the whole-book surfaces read) — every field is THIS
  // account's, so ReturnsSummary / ReturnsBreakdown never touch a whole-book number.
  const totals: HoldingsTotals = {
    positions: accountHoldings.length,
    pricedPositions: priced.length,
    investedValue,
    realizedPnlAll,
    currentValue,
    unrealizedPnl: unrealized,
    dayChangeValue: dayChange ?? 0,
    dayChangePct: null,
  };

  return (
    <>
      {/* 1 · Returns — the four honest per-account scalars */}
      <SectionEyebrow label="This account's returns" pill="return · XIRR" icon={Icons.trendUp} accent="var(--success)" />
      <Reveal>
        <ReturnsSummary
          scoped
          holdings={accountHoldings}
          totals={totals}
          xirr={xirr}
          xirrLoading={txnsLoading}
          dayChange={dayChange}
        />
      </Reveal>

      {/* 2 · Allocation — composition scoped to this account (its own 100%) */}
      <SectionEyebrow label="How this account is spread" pill="by value" icon={Icons.sector} accent="var(--p-own)" />
      <Reveal>
        <AllocationLayer holdings={accountHoldings} cut={cut} onCutChange={onCut} />
      </Reveal>

      {/* 3 · Holdings — the rich table, health-free & account-scoped */}
      <SectionEyebrow
        label="Holdings"
        pill={countLabel(accountHoldings.length, "holding")}
        icon={Icons.portfolio}
        accent="var(--c-pristine)"
      />
      <Reveal>
        <PositionsTable
          scoped
          holdings={scopedRows}
          cut={cut}
          grouped={grouped}
          onGroupedChange={onGrouped}
          sort={sort}
          onSort={onSort}
          activeAccount={null}
        />
      </Reveal>

      {/* 4 · Attribution — this account's contributors / detractors (shares renormalize to the slice) */}
      <SectionEyebrow label="What drove this account" pill="by ₹ · share of net" icon={Icons.scales} accent="var(--p-own)" />
      <Reveal>
        <Attribution holdings={accountHoldings} />
      </Reveal>

      {/* 5 · Returns breakdown — P&L by sector/class + realized/unrealized, all per-account */}
      <SectionEyebrow label="Returns breakdown" pill="realized · unrealized · by sector / class" icon={Icons.coins} accent="var(--p-found)" />
      <Reveal>
        <ReturnsBreakdown holdings={accountHoldings} totals={totals} dividends={dividends} />
      </Reveal>
    </>
  );
}

// This account's ledger — GET /me/transactions?accountId, rendered read-only in the shared
// LedgerTable (same rows, filter and sort as the portfolio tab; no edit/delete, no summary
// strip). Mounted only for a Stated account, so the scoped read never fires for a Verified one.
function AccountLedger({ accountId }: { accountId: string }) {
  const q = useTransactions(accountId);

  if (q.isLoading) return <QuerySkeleton rows={4} rowHeight="h-14" />;
  if (q.isError) {
    return (
      <QueryError
        message={(q.error as Error)?.message ?? "Failed to load this ledger"}
        onRetry={() => q.refetch()}
      />
    );
  }

  const txns = q.data ?? [];
  if (txns.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line2 bg-surface-2/40 px-5 py-10 text-center text-[12.5px] text-ink3">
        No transactions recorded in this book yet.
      </p>
    );
  }

  return (
    <Reveal>
      <LedgerTable txns={txns} readOnly />
    </Reveal>
  );
}
