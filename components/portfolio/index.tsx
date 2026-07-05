"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePortfolioSnapshot } from "@/lib/api/hooks/use-portfolio-snapshot";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Transaction } from "@/types/portfolio";
import { PORTFOLIO_TABS, type PortfolioTab } from "./tabs";
import { PHS_BAND_META, attentionHoldings, phsColor } from "./lib";
import { OverviewTab } from "./overview";
import { HoldingsTab } from "./holdings";
import { HealthTab } from "./health";
import { PerformanceTab } from "./performance";
import { TransactionsTab } from "./transactions";
import { TransactionSheet } from "./transaction-sheet";

// ─────────────────────────────────────────────────────────────────────────────
// The Portfolio surface — shared chrome (header + tab row) with the live tabs
// rendering inside it. Overview + Holdings are live and read-only over GET /me/portfolio
// (the pre-computed PHS snapshot) + GET /me/holdings. The remaining tabs follow the same
// pattern and are honestly marked `soon`. Chrome matches docs/vytal_portfolio_health_tab.
// ─────────────────────────────────────────────────────────────────────────────

function ComingSoon({ tab, onBack }: { tab: PortfolioTab; onBack: () => void }) {
  const meta = PORTFOLIO_TABS.find((t) => t.id === tab)!;
  const Icon = meta.icon;
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line2 px-8 py-16 text-center">
      <Icon weight="duotone" className="mx-auto mb-3 size-8 text-ink3 opacity-60" />
      <h3 className="font-display text-[20px] font-semibold text-ink2">{meta.label} — building next</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink3">
        This tab runs the same read-only pattern the Overview does — rendered over your pre-computed snapshot, never
        recomputed on the client. It lights up here as it&apos;s built; no placeholder data stands in until then.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3.5 py-2 text-[12px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
      >
        <Icons.arrowLeft className="size-3.5" />
        Back to Overview
      </button>
    </div>
  );
}

function EmptyPortfolio({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line2 px-8 py-20 text-center">
      <Icons.portfolio weight="duotone" className="mx-auto mb-4 size-8 text-ink3 opacity-60" />
      <h3 className="font-display text-[20px] font-semibold text-ink2">Your portfolio is empty</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink3">
        Add your first transaction and this fills in — value, weighted health, allocation and what&apos;s moving. Nothing
        is shown until then, by design: we never chart or score a book we can&apos;t see.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-110"
      >
        <Icons.plus className="size-3.5" />
        Add your first transaction
      </button>
    </div>
  );
}

export function PortfolioHub() {
  // Deep-linkable tab: other surfaces (e.g. the dashboard) link to /portfolio?tab=health
  // or ?tab=holdings and land directly on that tab. Falls back to Overview for any unknown value.
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: PortfolioTab = PORTFOLIO_TABS.some((t) => t.id === tabParam)
    ? (tabParam as PortfolioTab)
    : "overview";
  const [tab, setTab] = useState<PortfolioTab>(initialTab);
  // the global add/edit side-sheet — one instance, opened from the header (any tab),
  // the empty-state CTA, and per-row edit. editing=null → add mode; a txn → edit mode.
  const [sheet, setSheet] = useState<{ open: boolean; editing: Transaction | null }>({ open: false, editing: null });
  const openAdd = () => setSheet({ open: true, editing: null });
  const openEdit = (t: Transaction) => setSheet({ open: true, editing: t });

  const snapQ = usePortfolioSnapshot();
  const holdQ = useHoldings();

  const snapshot = snapQ.data?.snapshot ?? null;
  const holdings = holdQ.data?.holdings ?? [];
  const totals = holdQ.data?.totals;
  const hasHoldings = snapQ.data?.hasHoldings ?? holdings.length > 0;
  const dataReady = Boolean(holdQ.data && snapQ.data);

  const attn = attentionHoldings(holdings);
  const bandLabel = snapshot?.band ? PHS_BAND_META[snapshot.band].label : null;

  const loading = snapQ.isLoading || holdQ.isLoading;
  const isError = snapQ.isError || holdQ.isError;

  const summary: { k: string; v: string; color?: string }[] = [
    {
      k: "Weighted health",
      v: dataReady ? (snapshot?.phs != null ? `${snapshot.phs} · ${bandLabel}` : "Building") : "—",
      color: snapshot?.band ? phsColor(snapshot.band) : undefined,
    },
    { k: "Coverage", v: dataReady && snapshot ? `${Math.round(snapshot.coverage * 100)}%` : "—" },
    { k: "Needs attention", v: dataReady ? String(attn.count) : "—", color: attn.count > 0 ? "var(--high)" : undefined },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      {/* ── header ── */}
      <div className=" pt-1">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-ink2">Portfolio</span>
          {/* the front door — persistent across every tab */}
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground transition-[filter] hover:brightness-110"
          >
            <Icons.plus className="size-3.5" />
            Add transaction
          </button>
        </div>
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">My Portfolio</h1>
            <p className="mt-1 text-[12.5px] text-ink2">
              {dataReady && totals ? (
                <>
                  <span className="num">{totals.positions}</span> holding{totals.positions === 1 ? "" : "s"} ·{" "}
                  <span className="num">{formatINR(totals.investedValue, { compact: true })}</span> invested
                </>
              ) : (
                "Loading your book…"
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.map((s) => (
              <div key={s.k} className="flex flex-col gap-0.5 rounded-lg border border-line bg-surface-1 px-3.5 py-2">
                <span className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">{s.k}</span>
                <span className="num text-[16px] font-medium" style={s.color ? { color: s.color } : undefined}>
                  {s.v}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-0.5 overflow-x-auto hidden-scrollbar">
          {PORTFOLIO_TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-[13px] font-medium transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-ink3 hover:text-ink",
                )}
              >
                <Icon className="size-[15px]" />
                {t.label}
                {!t.live && (
                  <span className="rounded-[4px] border border-line2 px-1.5 py-px text-[8.5px] uppercase tracking-wider text-ink3">
                    soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── body ── (Overview · Holdings · Health · Performance · Transactions are live) ── */}
      {tab !== "overview" &&
      tab !== "holdings" &&
      tab !== "transactions" &&
      tab !== "health" &&
      tab !== "performance" ? (
        <ComingSoon tab={tab} onBack={() => setTab("overview")} />
      ) : loading ? (
        <QuerySkeleton rows={6} rowHeight="h-20" className="mt-6" />
      ) : isError ? (
        <QueryError
          message={
            (snapQ.error as Error)?.message ??
            (holdQ.error as Error)?.message ??
            "Failed to load your portfolio"
          }
          onRetry={() => {
            snapQ.refetch();
            holdQ.refetch();
          }}
          className="mt-6"
        />
      ) : tab === "transactions" ? (
        // The ledger renders off its OWN read (not gated by open-holdings) so a fully
        // exited or brand-new book can still reach its history / the add CTA.
        <TransactionsTab totals={totals} onAdd={openAdd} onEdit={openEdit} />
      ) : !hasHoldings || holdings.length === 0 || !totals ? (
        <EmptyPortfolio onAdd={openAdd} />
      ) : tab === "holdings" ? (
        <HoldingsTab holdings={holdings} totals={totals} />
      ) : tab === "health" ? (
        // read-only over the pre-computed snapshot (pillars, both ledgers, PF findings) +
        // per-holding health; snapshot may be null (pending) → the tab shows its honest
        // "preparing"/"building" state until the next mutation/nightly refresh lands.
        <HealthTab snapshot={snapshot} holdings={holdings} totals={totals} />
      ) : tab === "performance" ? (
        // the returns/accountability surface — read-only over NAV / TWR / benchmark / XIRR.
        // STRICTLY health-free by design (the one tab where "healthy → profitable" must
        // never be implied); returns green/red is the only signal here.
        <PerformanceTab holdings={holdings} totals={totals} />
      ) : (
        // snapshot may be null (pending) — the tracker still renders; the health band
        // shows its honest "preparing" state until the next mutation/nightly refresh.
        <OverviewTab snapshot={snapshot} holdings={holdings} totals={totals} onOpenTab={setTab} />
      )}

      {/* the one writing surface — global, non-modal-feel side sheet */}
      <TransactionSheet
        open={sheet.open}
        onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))}
        editing={sheet.editing}
      />
    </div>
  );
}
