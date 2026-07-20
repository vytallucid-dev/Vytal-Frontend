"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { DateRange as RdpDateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTransactionMutations } from "@/lib/api/hooks/use-transactions";
import type { Transaction } from "@/types/portfolio";
import { AssetClassChip } from "../asset-class-chip";
import {
  EMPTY_FILTER,
  type LedgerFilter,
  type LedgerSortKey,
  type SortDir,
  TXN_TYPES,
  TXN_TYPE_META,
  filterTransactions,
  ledgerAccounts,
  parseTxnError,
  sortTransactions,
  txnValue,
} from "./lib";

function TypeChip({ t }: { t: Transaction["type"] }) {
  const m = TXN_TYPE_META[t];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium"
      style={{
        color: m.color,
        borderColor: `color-mix(in oklch, ${m.color} 34%, transparent)`,
        background: `color-mix(in oklch, ${m.color} 12%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

// ── the per-row account tag — the account's NAME ("Grow 1"), never the UUID. Neutral, like the class
//    chip. Only rendered when a book has >1 account (a single-account ledger has nothing to say here). ─
function AccountChip({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-[10rem] items-center gap-1 rounded-md border border-line2 bg-surface-2/70 px-1.5 py-0.5 text-[10.5px] font-medium text-ink2">
      <Icons.stack className="size-2.5 shrink-0 text-ink3" />
      <span className="truncate">{name}</span>
    </span>
  );
}

function fmtDate(d: string): string {
  // "YYYY-MM-DD" → "12 Mar 2025" (locale-stable, no timezone shift)
  const [y, m, day] = d.split("-").map(Number);
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

// ── ISO ↔ Date, LOCAL-time (never toISOString — that shifts the day across a timezone) ──────────────
function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The Holding column's primary label — the instrument NAME for EVERY class now that the identifier has
 *  its own ISIN column ("Reliance Industries Ltd", "Kotak Manufacture in India Fund…"). Falls back to the
 *  symbol only if a name is genuinely missing (a demo/mock fixture) — never an ISIN by rule. */
function holdingName(t: Transaction): string {
  return t.name ?? t.symbol;
}
/** The ISIN column's muted reference — a stock shows its TICKER (its human identifier), every other
 *  class shows its ISIN (the true key: a bond's ISIN is NOT its ticker). Falls back to `symbol` when no
 *  ISIN reached the row (a ticker-less fund's `symbol` already IS its ISIN; a fixture keeps the symbol). */
function holdingRef(t: Transaction): string {
  return t.assetClass === "stock" ? t.symbol : (t.isin ?? t.symbol);
}

/** the meaningful ₹/ratio figure a row carries, formatted for the Value column */
function valueDisplay(t: Transaction): { text: string; muted?: boolean } {
  if (t.type === "split" || t.type === "bonus")
    return { text: t.ratio ?? "—", muted: true };
  const v = txnValue(t);
  return v != null
    ? { text: formatINR(v, { compact: true }) }
    : { text: "—", muted: true };
}

// ── the filter bar's shadcn trigger look (compact, app-tokened — mirrors the Holdings picker) ────────
const TRIGGER_CLS =
  "h-8 w-auto gap-1.5 border-line2 bg-surface-2 text-[12px] font-medium text-ink2 hover:text-ink";

// ── the date-range control — a shadcn Calendar (range mode) in a Popover, replacing the two native
//    <input type="date"> boxes. Stores/returns "YYYY-MM-DD" strings so the ISO lexicographic filter is
//    unchanged. Future dates are disabled (a trade date is never in the future). ──────────────────────
function LedgerDateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = from !== "" || to !== "";
  const selected: RdpDateRange | undefined = active
    ? { from: isoToDate(from), to: isoToDate(to) }
    : undefined;
  const label = !active
    ? "All dates"
    : from && to
      ? `${fmtDate(from)} – ${fmtDate(to)}`
      : from
        ? `From ${fmtDate(from)}`
        : `Until ${fmtDate(to)}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-2.5 text-[12px] font-medium transition-colors hover:text-ink",
            active ? "text-ink2" : "text-ink3",
          )}
        >
          <Icons.calendar className="size-3.5 shrink-0 text-ink3" />
          {label}
          <Icons.caretDown className="size-2.5 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(r) =>
            onChange(
              r?.from ? dateToIso(r.from) : "",
              r?.to ? dateToIso(r.to) : "",
            )
          }
          defaultMonth={selected?.to ?? selected?.from ?? new Date()}
          disabled={{ after: new Date() }}
          showOutsideDays={false}
          className="p-0"
          classNames={{
            weekday:
              "flex-1 select-none text-[10px] font-semibold uppercase text-ink3",
            caption_label:
              "num select-none text-[12.5px] font-semibold text-ink",
            // HOVER — a clearly-visible accent wash. The ghost default (hover:bg-surface-2) is near-
            // invisible on dark; `!` beats it. Distinct from SELECTED (solid bg-primary, set on the day
            // button's range/single data-attrs) and from TODAY (an accent ring, no fill). Disabled days
            // carry pointer-events-none, so :hover never fires on them.
            day_button:
              "transition-colors hover:!bg-primary/20 hover:!text-ink",
            today: "rounded-md text-ink ring-1 ring-primary/60 ring-inset",
          }}
        />
        {active && (
          <button
            type="button"
            onClick={() => onChange("", "")}
            className="mt-2 w-full rounded-md border border-line2 px-2 py-1.5 text-[11.5px] text-ink3 transition-colors hover:text-ink"
          >
            Clear dates
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * The ledger table — shared by two surfaces. On the portfolio Transactions tab it is
 * writable (per-row edit/delete, both flowing to the server replay). On the per-account
 * detail page it is `readOnly`: same filter/sort/render, but no edit or delete affordance
 * and no delete-confirm — a single account's ledger is a view, not an editing surface.
 *
 * MULTI-ASSET / MULTI-ACCOUNT: the instrument reads across three columns — ASSET (class chip),
 * HOLDING (the NAME, so a fund reads as its fund name, never its ISIN) and ISIN (the muted reference: a
 * stock's ticker, else the true ISIN). Each row carries its ACCOUNT name; the filter narrows by account
 * (not by instrument — search covers that). The account column + filter self-hide when the ledger
 * touches only one book (so the read-only account-detail ledger shows neither).
 */
export function LedgerTable({
  txns,
  onEdit,
  readOnly = false,
}: {
  txns: Transaction[];
  onEdit?: (t: Transaction) => void;
  readOnly?: boolean;
}) {
  const { remove } = useTransactionMutations();
  const [filter, setFilter] = useState<LedgerFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<{ key: LedgerSortKey; dir: SortDir }>({
    key: "tradeDate",
    dir: "desc",
  });
  const [confirm, setConfirm] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // The books this ledger touches (names, never UUIDs). One account → nothing to filter, and the
  // per-row account tag would just repeat itself, so both self-hide (incl. the read-only single-account
  // detail ledger).
  const accounts = useMemo(() => ledgerAccounts(txns), [txns]);
  const showAccounts = accounts.length > 1;
  const rows = useMemo(
    () =>
      sortTransactions(filterTransactions(txns, filter), sort.key, sort.dir),
    [txns, filter, sort],
  );

  const onSort = (key: LedgerSortKey) =>
    setSort((p) =>
      p.key === key
        ? { key, dir: p.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "symbol" || key === "type" ? "asc" : "desc" },
    );

  const filtersActive =
    filter.search !== "" ||
    filter.account !== "all" ||
    filter.type !== "all" ||
    filter.from !== "" ||
    filter.to !== "";

  async function doDelete() {
    if (!confirm) return;
    setDeleteError(null);
    try {
      await remove.mutateAsync(confirm.id);
      setConfirm(null);
    } catch (e) {
      setDeleteError(
        parseTxnError(e).formError ?? "Couldn't delete. Try again.",
      );
    }
  }

  const SortHead = ({
    label,
    k,
    align = "left",
  }: {
    label: string;
    k: LedgerSortKey;
    align?: "left" | "right";
  }) => {
    const active = sort.key === k;
    return (
      <th
        className={cn(
          "px-2 py-2 font-semibold",
          align === "left" ? "text-left" : "text-right",
        )}
      >
        <button
          type="button"
          onClick={() => onSort(k)}
          className={cn(
            "inline-flex items-center gap-1 transition-colors hover:text-ink2",
            align === "right" && "flex-row-reverse",
            active && "text-ink",
          )}
        >
          {label}
          <Icons.caretDown
            className={cn(
              "size-2.5 transition-all",
              active ? "opacity-100" : "opacity-0",
              active && sort.dir === "asc" && "rotate-180",
            )}
          />
        </button>
      </th>
    );
  };

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-3 sm:p-4">
      {/* filter bar — all shadcn (Select + Calendar popover); search stays a themed text input */}
      <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
        <div className="relative flex-1 sm:max-w-[220px]">
          <Icons.search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink3" />
          <input
            value={filter.search}
            onChange={(e) =>
              setFilter((f) => ({ ...f, search: e.target.value }))
            }
            placeholder="Search name, ticker or note…"
            className="h-8 w-full rounded-lg border border-line2 bg-surface-2 pl-8 pr-2 text-[12px] text-ink outline-none placeholder:text-ink3 focus:border-line3"
          />
        </div>

        {/* type — shadcn Select */}
        <Select
          value={filter.type}
          onValueChange={(v) =>
            setFilter((f) => ({ ...f, type: v as LedgerFilter["type"] }))
          }
        >
          <SelectTrigger className={cn(TRIGGER_CLS, "min-w-[7.5rem]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TXN_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TXN_TYPE_META[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* account — shadcn Select; only when the book has more than one account (names, never UUIDs) */}
        {showAccounts && (
          <Select
            value={filter.account}
            onValueChange={(v) => setFilter((f) => ({ ...f, account: v }))}
          >
            <SelectTrigger className={cn(TRIGGER_CLS, "min-w-[9.5rem]")}>
              <Icons.stack className="size-3.5 shrink-0 text-ink3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* date range — shadcn Calendar popover (replaces the native date inputs) */}
        <LedgerDateRange
          from={filter.from}
          to={filter.to}
          onChange={(from, to) => setFilter((f) => ({ ...f, from, to }))}
        />

        {filtersActive && (
          <button
            type="button"
            onClick={() => setFilter(EMPTY_FILTER)}
            className="text-[11px] text-ink3 underline-offset-2 hover:text-ink hover:underline"
          >
            Clear
          </button>
        )}
        <span className="ml-auto num text-[11px] text-ink3">
          {rows.length} of {txns.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line2 bg-surface-2/40 px-5 py-10 text-center text-[12.5px] text-ink3">
          {filtersActive
            ? "No transactions match these filters."
            : "No transactions yet."}
        </p>
      ) : (
        <>
          {/* desktop table */}
          <div className="custom-scrollbar hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1000px] border-collapse text-[12px]">
              <thead>
                <tr className="text-[9.5px] uppercase tracking-wide text-ink3">
                  <SortHead label="Date" k="tradeDate" />
                  <SortHead label="Type" k="type" />
                  <th className="px-2 py-2 text-left font-semibold">Asset</th>
                  <SortHead label="Holding" k="symbol" />
                  <th className="px-2 py-2 text-left font-semibold">ISIN</th>
                  {showAccounts && (
                    <th className="px-2 py-2 text-left font-semibold">
                      Account
                    </th>
                  )}
                  <th className="px-2 py-2 text-right font-semibold">Qty</th>
                  <th className="px-2 py-2 text-right font-semibold">Price</th>
                  <SortHead label="Value" k="value" align="right" />
                  <th className="px-2 py-2 text-right font-semibold">
                    Charges
                  </th>
                  <th className="px-2 py-2 text-left font-semibold">Notes</th>
                  {!readOnly && <th className="w-16 px-2 py-2" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const val = valueDisplay(t);
                  return (
                    <tr
                      key={t.id}
                      className="border-t border-line transition-colors hover:bg-surface-2/40"
                    >
                      <td className="num px-2 py-2.5 text-ink2">
                        {fmtDate(t.tradeDate)}
                      </td>
                      <td className="px-2 py-2.5">
                        <TypeChip t={t.type} />
                      </td>
                      <td className="px-2 py-2.5">
                        {t.assetClass ? (
                          <AssetClassChip assetClass={t.assetClass} />
                        ) : (
                          <span className="text-ink3">—</span>
                        )}
                      </td>
                      <td className="max-w-[18rem] px-2 py-2.5">
                        <div className="truncate font-medium text-ink">
                          {holdingName(t)}
                        </div>
                      </td>
                      <td className="num max-w-[9rem] truncate px-2 py-2.5 text-[11px] text-ink3">
                        {holdingRef(t)}
                      </td>
                      {showAccounts && (
                        <td className="px-2 py-2.5">
                          {t.accountName ? (
                            <AccountChip name={t.accountName} />
                          ) : (
                            <span className="text-ink3">—</span>
                          )}
                        </td>
                      )}
                      <td className="num px-2 py-2.5 text-right text-ink2">
                        {t.quantity != null ? (
                          t.quantity
                        ) : (
                          <span className="text-ink3">—</span>
                        )}
                      </td>
                      <td className="num px-2 py-2.5 text-right text-ink2">
                        {t.type === "buy" || t.type === "sell" ? (
                          t.price != null ? (
                            formatINR(t.price)
                          ) : (
                            "—"
                          )
                        ) : (
                          <span className="text-ink3">—</span>
                        )}
                      </td>
                      <td
                        className={cn(
                          "num px-2 py-2.5 text-right",
                          val.muted ? "text-ink3" : "text-ink",
                        )}
                      >
                        {val.text}
                      </td>
                      <td className="num px-2 py-2.5 text-right">
                        {t.fees == null ? (
                          <span className="text-ink3">—</span>
                        ) : t.fees === 0 ? (
                          <span className="text-ink3">{formatINR(0)}</span>
                        ) : (
                          <span className="text-ink2">{formatINR(t.fees)}</span>
                        )}
                      </td>
                      <td className="max-w-[11rem] truncate px-2 py-2.5 text-ink3">
                        {t.notes || <span className="text-ink3/60">—</span>}
                      </td>
                      {!readOnly && (
                        <td className="px-2 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEdit?.(t)}
                              aria-label="Edit"
                              className="rounded-md p-1.5 text-ink3 transition-colors hover:bg-surface-2 hover:text-ink"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirm(t);
                                setDeleteError(null);
                              }}
                              aria-label="Delete"
                              className="rounded-md p-1.5 text-ink3 transition-colors hover:bg-surface-2 hover:text-danger"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="space-y-2 md:hidden">
            {rows.map((t) => {
              const val = valueDisplay(t);
              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-line bg-surface-1 p-3"
                >
                  <div className="flex items-center gap-2">
                    <TypeChip t={t.type} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                      {holdingName(t)}
                    </span>
                    <span
                      className={cn(
                        "num shrink-0 text-[13px]",
                        val.muted ? "text-ink3" : "text-ink",
                      )}
                    >
                      {val.text}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {t.assetClass && (
                      <AssetClassChip assetClass={t.assetClass} />
                    )}
                    <span className="num text-[10.5px] text-ink3">
                      {holdingRef(t)}
                    </span>
                    {showAccounts && t.accountName && (
                      <AccountChip name={t.accountName} />
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-[11px] text-ink3">
                    <span className="num">{fmtDate(t.tradeDate)}</span>
                    <span className="num">
                      {t.quantity != null && `${t.quantity} × `}
                      {(t.type === "buy" || t.type === "sell") &&
                      t.price != null
                        ? formatINR(t.price)
                        : ""}
                    </span>
                    {!readOnly && (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit?.(t)}
                          aria-label="Edit"
                          className="rounded p-1 hover:text-ink"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirm(t);
                            setDeleteError(null);
                          }}
                          aria-label="Delete"
                          className="rounded p-1 hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </span>
                    )}
                  </div>
                  {(t.notes || (t.fees != null && t.fees > 0)) && (
                    <p className="mt-1.5 text-[11px] text-ink3">
                      {t.fees != null && t.fees > 0 && (
                        <span className="num">Fee {formatINR(t.fees)}</span>
                      )}
                      {t.fees != null && t.fees > 0 && t.notes && " · "}
                      {t.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* charges note — real fees, manually entered; broker auto-fill is future */}
      <p className="mt-3 border-t border-line px-1 pt-3 text-[10.5px] text-ink3">
        Charges are the fees you enter per transaction — a buy fee raises cost
        basis, a sell fee lowers proceeds, so your returns stay honest. Broker
        auto-fill is future; existing entries with no fee read ₹0.
      </p>

      {/* delete confirm — warns that the correction replays the book. Never mounted read-only. */}
      {!readOnly && (
        <Dialog
          open={!!confirm}
          onOpenChange={(o) => {
            if (!o) {
              setConfirm(null);
              setDeleteError(null);
            }
          }}
        >
          <DialogContent className="border-line bg-surface-1 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-ink">
                Delete this transaction?
              </DialogTitle>
              <DialogDescription className="text-ink3">
                Removing it replays your whole ledger — holdings, health and
                value recompute. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            {confirm && (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[12px] flex-wrap">
                <TypeChip t={confirm.type} />
                <span className="truncate font-semibold text-ink">
                  {holdingName(confirm)}
                </span>
                <span className="num ml-auto shrink-0 text-ink2">
                  {valueDisplay(confirm).text}
                </span>
                <span className="num shrink-0 text-ink3">
                  {fmtDate(confirm.tradeDate)}
                </span>
              </div>
            )}
            {deleteError && (
              <p className="text-[12px] text-danger">{deleteError}</p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirm(null);
                  setDeleteError(null);
                }}
                disabled={remove.isPending}
              >
                Keep it
              </Button>
              <Button
                variant="destructive"
                onClick={doDelete}
                disabled={remove.isPending}
              >
                {remove.isPending && (
                  <Icons.spinner className="size-3.5 animate-spin" />
                )}
                Delete &amp; replay
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
