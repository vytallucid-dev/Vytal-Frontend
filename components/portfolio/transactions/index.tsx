"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Icons } from "@/lib/icons";
import { useTransactions } from "@/lib/api/hooks/use-transactions";
import type { HoldingsTotals, Transaction } from "@/types/portfolio";
import { SummaryStrip } from "./summary-strip";
import { LedgerTable } from "./ledger-table";

/**
 * Portfolio TRANSACTIONS — the ledger tab. Reads GET /me/transactions (the append-only
 * source of truth) and shows a summary strip + the sortable/filterable ledger. Writes
 * happen only through the global side-sheet (opened via onAdd / onEdit) → the backend
 * replays into holdings/PHS/NAV → the whole portfolio tree re-reads. Realized P&L is the
 * server's figure (from holdings totals), read as-is — never recomputed here.
 */
export function TransactionsTab({
  totals,
  onAdd,
  onEdit,
}: {
  totals?: HoldingsTotals;
  onAdd: () => void;
  onEdit: (t: Transaction) => void;
}) {
  const q = useTransactions();

  if (q.isLoading) return <QuerySkeleton rows={6} rowHeight="h-16" className="mt-6" />;
  if (q.isError) {
    return <QueryError message={(q.error as Error)?.message ?? "Failed to load your ledger"} onRetry={() => q.refetch()} className="mt-6" />;
  }

  const txns = q.data ?? [];

  // Front door: a brand-new user (or a fully-cleared ledger) lands on the add CTA.
  if (txns.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-line2 px-8 py-16 text-center">
        <Icons.coins weight="duotone" className="mx-auto mb-3 size-8 text-ink3 opacity-60" />
        <h3 className="font-display text-[20px] font-semibold text-ink2">Your ledger is empty</h3>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink3">
          Add your first transaction and everything downstream builds itself — holdings, weighted health, allocation and
          value all replay from what you enter. Nothing is charted or scored until then.
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

  return (
    <div className="flex flex-col pb-4">
      <SectionEyebrow label="What your ledger totals" icon={Icons.coins} accent="var(--p-mkt)" />
      <Reveal>
        <SummaryStrip txns={txns} realizedPnl={totals?.realizedPnlAll ?? null} />
      </Reveal>

      <SectionEyebrow
        label="Every transaction"
        pill={`${txns.length} entr${txns.length === 1 ? "y" : "ies"}`}
        icon={Icons.stack}
        accent="var(--c-pristine)"
      />
      <Reveal>
        <LedgerTable txns={txns} onEdit={onEdit} />
      </Reveal>
    </div>
  );
}
