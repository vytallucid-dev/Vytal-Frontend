"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { Icons } from "@/lib/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  EMPTY_FILTER,
  type LedgerFilter,
  type LedgerSortKey,
  type SortDir,
  TXN_TYPES,
  TXN_TYPE_META,
  filterTransactions,
  parseTxnError,
  sortTransactions,
  txnValue,
} from "./lib";

function TypeChip({ t }: { t: Transaction["type"] }) {
  const m = TXN_TYPE_META[t];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium"
      style={{ color: m.color, borderColor: `color-mix(in oklch, ${m.color} 34%, transparent)`, background: `color-mix(in oklch, ${m.color} 12%, transparent)` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

function fmtDate(d: string): string {
  // "YYYY-MM-DD" → "12 Mar 2025" (locale-stable, no timezone shift)
  const [y, m, day] = d.split("-").map(Number);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** the meaningful ₹/ratio figure a row carries, formatted for the Value column */
function valueDisplay(t: Transaction): { text: string; muted?: boolean } {
  if (t.type === "split" || t.type === "bonus") return { text: t.ratio ?? "—", muted: true };
  const v = txnValue(t);
  return v != null ? { text: formatINR(v, { compact: true }) } : { text: "—", muted: true };
}

const SELECT_CLS =
  "num rounded-md border border-line2 bg-surface-2 px-2 py-1.5 text-[12px] text-ink2 outline-none focus:border-line3";

export function LedgerTable({ txns, onEdit }: { txns: Transaction[]; onEdit: (t: Transaction) => void }) {
  const { remove } = useTransactionMutations();
  const [filter, setFilter] = useState<LedgerFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<{ key: LedgerSortKey; dir: SortDir }>({ key: "tradeDate", dir: "desc" });
  const [confirm, setConfirm] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const symbols = useMemo(() => [...new Set(txns.map((t) => t.symbol))].sort(), [txns]);
  const rows = useMemo(
    () => sortTransactions(filterTransactions(txns, filter), sort.key, sort.dir),
    [txns, filter, sort],
  );

  const onSort = (key: LedgerSortKey) =>
    setSort((p) => (p.key === key ? { key, dir: p.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "symbol" || key === "type" ? "asc" : "desc" }));

  const filtersActive = filter.search !== "" || filter.symbol !== "all" || filter.type !== "all" || filter.from !== "" || filter.to !== "";

  async function doDelete() {
    if (!confirm) return;
    setDeleteError(null);
    try {
      await remove.mutateAsync(confirm.id);
      setConfirm(null);
    } catch (e) {
      setDeleteError(parseTxnError(e).formError ?? "Couldn't delete. Try again.");
    }
  }

  const SortHead = ({ label, k, align = "left" }: { label: string; k: LedgerSortKey; align?: "left" | "right" }) => {
    const active = sort.key === k;
    return (
      <th className={cn("px-2 py-2 font-semibold", align === "left" ? "text-left" : "text-right")}>
        <button
          type="button"
          onClick={() => onSort(k)}
          className={cn("inline-flex items-center gap-1 transition-colors hover:text-ink2", align === "right" && "flex-row-reverse", active && "text-ink")}
        >
          {label}
          <Icons.caretDown className={cn("size-2.5 transition-all", active ? "opacity-100" : "opacity-0", active && sort.dir === "asc" && "rotate-180")} />
        </button>
      </th>
    );
  };

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-3 sm:p-4">
      {/* filter bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
        <div className="relative flex-1 sm:max-w-[220px]">
          <Icons.search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink3" />
          <input
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search ticker or note…"
            className="h-8 w-full rounded-md border border-line2 bg-surface-2 pl-8 pr-2 text-[12px] text-ink outline-none placeholder:text-ink3 focus:border-line3"
          />
        </div>
        <select value={filter.symbol} onChange={(e) => setFilter((f) => ({ ...f, symbol: e.target.value }))} className={SELECT_CLS}>
          <option value="all">All holdings</option>
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value as LedgerFilter["type"] }))} className={SELECT_CLS}>
          <option value="all">All types</option>
          {TXN_TYPES.map((t) => (
            <option key={t} value={t}>
              {TXN_TYPE_META[t].label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-[11px] text-ink3">
          from
          <Input type="date" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} className="num h-8 w-[132px] text-[12px]" />
        </label>
        <label className="flex items-center gap-1 text-[11px] text-ink3">
          to
          <Input type="date" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} className="num h-8 w-[132px] text-[12px]" />
        </label>
        {filtersActive && (
          <button type="button" onClick={() => setFilter(EMPTY_FILTER)} className="text-[11px] text-ink3 underline-offset-2 hover:text-ink hover:underline">
            Clear
          </button>
        )}
        <span className="ml-auto num text-[11px] text-ink3">
          {rows.length} of {txns.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line2 bg-surface-2/40 px-5 py-10 text-center text-[12.5px] text-ink3">
          {filtersActive ? "No transactions match these filters." : "No transactions yet."}
        </p>
      ) : (
        <>
          {/* desktop table */}
          <div className="custom-scrollbar hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-[12px]">
              <thead>
                <tr className="text-[9.5px] uppercase tracking-wide text-ink3">
                  <SortHead label="Date" k="tradeDate" />
                  <SortHead label="Type" k="type" />
                  <SortHead label="Holding" k="symbol" />
                  <th className="px-2 py-2 text-right font-semibold">Qty</th>
                  <th className="px-2 py-2 text-right font-semibold">Price</th>
                  <SortHead label="Value" k="value" align="right" />
                  <th className="px-2 py-2 text-right font-semibold">Charges</th>
                  <th className="px-2 py-2 text-left font-semibold">Notes</th>
                  <th className="w-16 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const val = valueDisplay(t);
                  return (
                    <tr key={t.id} className="border-t border-line transition-colors hover:bg-surface-2/40">
                      <td className="num px-2 py-2.5 text-ink2">{fmtDate(t.tradeDate)}</td>
                      <td className="px-2 py-2.5">
                        <TypeChip t={t.type} />
                      </td>
                      <td className="num px-2 py-2.5 font-semibold text-ink">{t.symbol}</td>
                      <td className="num px-2 py-2.5 text-right text-ink2">{t.quantity != null ? t.quantity : <span className="text-ink3">—</span>}</td>
                      <td className="num px-2 py-2.5 text-right text-ink2">
                        {t.type === "buy" || t.type === "sell" ? (t.price != null ? formatINR(t.price) : "—") : <span className="text-ink3">—</span>}
                      </td>
                      <td className={cn("num px-2 py-2.5 text-right", val.muted ? "text-ink3" : "text-ink")}>{val.text}</td>
                      <td className="num px-2 py-2.5 text-right">
                        {t.fees == null ? (
                          <span className="text-ink3">—</span>
                        ) : t.fees === 0 ? (
                          <span className="text-ink3">{formatINR(0)}</span>
                        ) : (
                          <span className="text-ink2">{formatINR(t.fees)}</span>
                        )}
                      </td>
                      <td className="max-w-[14rem] truncate px-2 py-2.5 text-ink3">{t.notes || <span className="text-ink3/60">—</span>}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => onEdit(t)} aria-label="Edit" className="rounded-md p-1.5 text-ink3 transition-colors hover:bg-surface-2 hover:text-ink">
                            <Pencil className="size-3.5" />
                          </button>
                          <button type="button" onClick={() => { setConfirm(t); setDeleteError(null); }} aria-label="Delete" className="rounded-md p-1.5 text-ink3 transition-colors hover:bg-surface-2 hover:text-danger">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
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
                <div key={t.id} className="rounded-xl border border-line bg-surface-1 p-3">
                  <div className="flex items-center gap-2">
                    <TypeChip t={t.type} />
                    <span className="num font-semibold text-ink">{t.symbol}</span>
                    <span className={cn("num ml-auto", val.muted ? "text-ink3" : "text-ink")}>{val.text}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-[11px] text-ink3">
                    <span className="num">{fmtDate(t.tradeDate)}</span>
                    <span className="num">
                      {t.quantity != null && `${t.quantity} × `}
                      {(t.type === "buy" || t.type === "sell") && t.price != null ? formatINR(t.price) : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <button type="button" onClick={() => onEdit(t)} aria-label="Edit" className="rounded p-1 hover:text-ink">
                        <Pencil className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => { setConfirm(t); setDeleteError(null); }} aria-label="Delete" className="rounded p-1 hover:text-danger">
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </div>
                  {(t.notes || (t.fees != null && t.fees > 0)) && (
                    <p className="mt-1.5 text-[11px] text-ink3">
                      {t.fees != null && t.fees > 0 && <span className="num">Fee {formatINR(t.fees)}</span>}
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
        Charges are the fees you enter per transaction — a buy fee raises cost basis, a sell fee lowers proceeds, so your
        returns stay honest. Broker auto-fill is future; existing entries with no fee read ₹0.
      </p>

      {/* delete confirm — warns that the correction replays the book */}
      <Dialog open={!!confirm} onOpenChange={(o) => { if (!o) { setConfirm(null); setDeleteError(null); } }}>
        <DialogContent className="border-line bg-surface-1 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-ink">Delete this transaction?</DialogTitle>
            <DialogDescription className="text-ink3">
              Removing it replays your whole ledger — holdings, health and value recompute. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          {confirm && (
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[12px]">
              <TypeChip t={confirm.type} />
              <span className="num font-semibold text-ink">{confirm.symbol}</span>
              <span className="num ml-auto text-ink2">{valueDisplay(confirm).text}</span>
              <span className="num text-ink3">{fmtDate(confirm.tradeDate)}</span>
            </div>
          )}
          {deleteError && <p className="text-[12px] text-danger">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirm(null); setDeleteError(null); }} disabled={remove.isPending}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={doDelete} disabled={remove.isPending}>
              {remove.isPending && <Icons.spinner className="size-3.5 animate-spin" />}
              Delete &amp; replay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
