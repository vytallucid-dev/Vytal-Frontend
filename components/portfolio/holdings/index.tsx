"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Holding, HoldingsTotals } from "@/types/portfolio";
import { type AllocationMode, type HoldingSortKey, type SortDir } from "../lib";
import { AllocationLayer } from "./allocation-layer";
import { PositionsTable } from "./positions-table";
import { type HoldingRow, accountOptions, aggregateBook, rowTouchesAccount } from "./aggregate";

/**
 * Portfolio HOLDINGS & ALLOCATION — the workhorse positions ledger with the allocation
 * layer absorbed on top. Tracker-first: money and weight lead, health is ONE column +
 * a band dot + an opt-in expand. Everything READS the holdings snapshot proven on the
 * Overview — no client-side score or weight recompute.
 *
 * ONE INSTRUMENT = ONE HOLDING (the account fix). Rows are per ISSUER ENTITY — the SAME collapse
 * the Health tab does — so RELIANCE-in-two-accounts is one row and an NTPC stock + bond is one row.
 *
 * TWO ACCOUNT FILTERS, EACH HONEST FOR ITS OWN SECTION (they answer DIFFERENT questions, and say so):
 *   · the DONUT filter renormalizes to the chosen account — "what is the shape of my Grow 1 holdings",
 *     its own 100%, RELIANCE's slice being its share OF Grow 1.
 *   · the TABLE filter narrows the LIST to holdings that touch the account, but every weight stays
 *     WHOLE-BOOK — the table is the portfolio view, so RELIANCE still reads 20.6% of book.
 * A single shared filter conflated the two (a donut wedge disagreeing with a table %); splitting them
 * lets each do the right thing for its section. Account-scoped math is the account detail page's job.
 */
const ALL = "__all"; // Radix Select reserves "" — the sentinel for the unfiltered (All accounts) option

export function HoldingsTab({ holdings, totals }: { holdings: Holding[]; totals: HoldingsTotals }) {
  // the SHARED cut — drives both the donut and the table's group-by (§1 ↔ §2)
  const [cut, setCut] = useState<AllocationMode>("sector");
  const [grouped, setGrouped] = useState(false);
  const [sort, setSort] = useState<{ key: HoldingSortKey; dir: SortDir }>({ key: "weight", dir: "desc" });
  // per-section account filters — INDEPENDENT (see the header). Both default to All accounts.
  const [donutAccount, setDonutAccount] = useState<string | null>(null);
  const [tableAccount, setTableAccount] = useState<string | null>(null);

  const onSort = (key: HoldingSortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "symbol" ? "asc" : "desc" },
    );

  // Aggregate the WHOLE book to per-entity rows + the instrument-merged donut list.
  const { rows, instruments } = useMemo(() => aggregateBook(holdings), [holdings]);
  const accounts = useMemo(() => accountOptions(holdings), [holdings]);
  const nameOf = (id: string | null) => (id == null ? null : accounts.find((a) => a.id === id)?.name ?? null);

  // ── DONUT — renormalizes to the chosen account (its own 100%). Unfiltered = whole-book,
  //    instrument-merged (RELIANCE once at full value); filtered = that account's raw positions
  //    (account-scoped values — RELIANCE's slice is its Grow-1 portion). ──
  const donutHoldings = useMemo(
    () => (donutAccount == null ? instruments : holdings.filter((h) => h.accountId === donutAccount)),
    [donutAccount, holdings, instruments],
  );

  // ── TABLE — narrows the LIST to rows that TOUCH the account; every weight stays whole-portfolio. ──
  const visibleRows = useMemo<HoldingRow[]>(
    () => (tableAccount == null ? rows : rows.filter((r) => rowTouchesAccount(r, tableAccount))),
    [rows, tableAccount],
  );

  const tableName = nameOf(tableAccount);
  const donutName = nameOf(donutAccount);
  // Reconciliation (unfiltered table only): how many raw account positions collapsed into these rows.
  const collapsedFrom = tableAccount == null && holdings.length > rows.length ? holdings.length : null;

  return (
    <div className="flex flex-col pb-4">
      {/* §1 · Allocation layer — the absorbed cut, with its OWN account filter (composition view) */}
      <SectionEyebrow label="How your capital is spread" pill="by value" icon={Icons.sector} accent="var(--p-own)" />
      <FilterRow
        accounts={accounts}
        value={donutAccount}
        onChange={setDonutAccount}
        note={donutName ? `Showing ${donutName}'s composition — its own 100%` : "Your whole book's composition"}
      />
      <Reveal>
        <AllocationLayer holdings={donutHoldings} cut={cut} onCutChange={setCut} />
      </Reveal>

      {/* §2 · Positions table — the heart, with its OWN account filter (narrows the list, whole-book weights) */}
      <SectionEyebrow
        label="Your positions"
        pill={`${visibleRows.length} holding${visibleRows.length === 1 ? "" : "s"}`}
        icon={Icons.portfolio}
        accent="var(--c-pristine)"
      />
      <FilterRow
        accounts={accounts}
        value={tableAccount}
        onChange={setTableAccount}
        note={
          tableName
            ? `Holdings held in ${tableName} · weights are of your whole portfolio`
            : "All accounts · weights are of your whole portfolio"
        }
      />
      {collapsedFrom != null && <ReconNote from={collapsedFrom} to={rows.length} />}
      <Reveal>
        {visibleRows.length === 0 ? (
          <EmptyAccount name={tableName} />
        ) : (
          <PositionsTable
            holdings={visibleRows}
            cut={cut}
            grouped={grouped}
            onGroupedChange={setGrouped}
            sort={sort}
            onSort={onSort}
            activeAccount={tableAccount}
          />
        )}
      </Reveal>
    </div>
  );
}

// ── a per-section account filter (shadcn Select) + its one-line note of what it does ──────────────
//    A book with a single account has no dimension to filter, so the whole row hides.
function FilterRow({
  accounts,
  value,
  onChange,
  note,
}: {
  accounts: { id: string; name: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
  note: string;
}) {
  if (accounts.length <= 1) return null;
  return (
    <div className="mb-3 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? null : v)}>
        <SelectTrigger className="h-8 w-auto min-w-[9.5rem] gap-1.5 border-line2 bg-surface-2 text-[12.5px] font-medium text-ink2 hover:text-ink">
          <Icons.stack className="size-3.5 shrink-0 text-ink3" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All accounts</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* the caption — makes each filter's DIFFERENT behaviour legible, never a mystery */}
      <span className={cn("text-[11.5px] leading-relaxed", value != null ? "text-ink2" : "text-ink3")}>{note}</span>
    </div>
  );
}

// ── count reconciliation — so "18 holdings" over "20 positions" never reads as a bug ──────────────
function ReconNote({ from, to }: { from: number; to: number }) {
  return (
    <p className="-mt-1 mb-2 flex flex-wrap items-center gap-x-1.5 px-1 text-[11px] leading-relaxed text-ink3">
      <Icons.info className="size-3 shrink-0" />
      Combined from <span className="num text-ink2">{from}</span> account positions —{" "}
      one instrument is one line even when it&apos;s held in several accounts, and a company&apos;s stock and bond
      count as one holding.
    </p>
  );
}

// ── an account with no open positions — honest empty, never a blank ───────────────────────────────
function EmptyAccount({ name }: { name: string | null }) {
  return (
    <div className="rounded-xl border border-dashed border-line2 bg-surface-2/40 px-6 py-12 text-center">
      <Icons.stack className="mx-auto mb-2 size-6 text-ink3 opacity-60" />
      <p className="text-[13px] text-ink2">Nothing held in {name ?? "this account"} yet.</p>
      <p className="mx-auto mt-1 max-w-sm text-[11.5px] leading-relaxed text-ink3">
        This book has no open positions right now — add a transaction to it, or show all accounts to see your whole
        portfolio.
      </p>
    </div>
  );
}
