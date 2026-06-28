"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────────────
// THE Standings primitive — the shared spine for every NON-health PG lens.
//
//   • Rows    = members.
//   • Columns = LENS METRICS, passed as a column config (each tab supplies its own).
//   • Sortable by any column (incl. the member column), asc/desc on header click.
//   • Click a member row  → its stock page (caller supplies the href, tab-aware).
//   • Select two members  → /comparison/A-vs-B (the built comparison view).
//   • Arrived-from member  → highlighted throughout.
//   • Calm theme, `.num` numbers, honest "—" for nulls. NO winner / best-in-group crown —
//     it ranks and contrasts on data, never picks.
//
// Generic over the row type R; the Valuation / Fundamentals / Overview tabs reuse this
// EXACT component with a different `columns` array. Build concrete (ownership) here.
// ─────────────────────────────────────────────────────────────────────────────────────

export type SortDir = "asc" | "desc";

/** Every standings row carries member identity + a progressive-load flag. Lens fields
 *  extend this (e.g. promoter/fii/dii). `pending` rows render metric placeholders. */
export interface StandingsRow {
  symbol: string;
  name: string;
  /** member's data hasn't resolved yet — metric cells show a placeholder, not "—". */
  pending?: boolean;
}

export interface StandingsColumn<R extends StandingsRow> {
  /** stable id (also the sort key). */
  key: string;
  header: string;
  /** optional sub-label under the header (e.g. units). */
  hint?: string;
  align?: "left" | "right";
  /** the value to sort by; null sorts LAST in both directions (honest-empty). */
  sortValue: (row: R) => number | string | null;
  /** the rendered cell. Owns its own "—" for nulls. */
  render: (row: R) => ReactNode;
  /** direction applied on the FIRST click of this header (default "desc"). */
  defaultDir?: SortDir;
}

export interface StandingsTableProps<R extends StandingsRow> {
  rows: R[];
  /** LENS metric columns — the member column is intrinsic (rendered by the table). */
  columns: StandingsColumn<R>[];
  /** member row → stock page href (caller decides the tab). */
  rowHref: (symbol: string) => string;
  /** two-member compare href. Default: /comparison/A-vs-B (the built view's slug). */
  compareHref?: (a: string, b: string) => string;
  /** the member the user arrived from — highlighted throughout. */
  highlightSymbol?: string | null;
  initialSort?: { key: string; dir: SortDir };
  /** header for the intrinsic member column. */
  memberHeader?: string;
  /** enable the select-two→compare affordance (default true). */
  selectable?: boolean;
}

const MEMBER_KEY = "__member__";

function defaultCompareHref(a: string, b: string) {
  return `/comparison/${a}-vs-${b}`;
}

export function StandingsTable<R extends StandingsRow>({
  rows,
  columns,
  rowHref,
  compareHref = defaultCompareHref,
  highlightSymbol,
  initialSort,
  memberHeader = "Company",
  selectable = true,
}: StandingsTableProps<R>) {
  const router = useRouter();
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>(
    initialSort ?? { key: MEMBER_KEY, dir: "asc" },
  );
  const [selected, setSelected] = useState<string[]>([]);

  const colByKey = useMemo(() => {
    const m = new Map<string, StandingsColumn<R>>();
    columns.forEach((c) => m.set(c.key, c));
    return m;
  }, [columns]);

  const sortedRows = useMemo(() => {
    const dir = sort.dir;
    const getVal = (row: R): number | string | null => {
      if (sort.key === MEMBER_KEY) return row.symbol;
      return colByKey.get(sort.key)?.sortValue(row) ?? null;
    };
    return [...rows].sort((ra, rb) => {
      const a = getVal(ra);
      const b = getVal(rb);
      const an = a == null;
      const bn = b == null;
      if (an && bn) return ra.symbol.localeCompare(rb.symbol);
      if (an) return 1; // nulls last, regardless of direction
      if (bn) return -1;
      if (typeof a === "string" || typeof b === "string") {
        const c = String(a).localeCompare(String(b));
        return dir === "asc" ? c : -c;
      }
      return dir === "asc" ? a - b : b - a;
    });
  }, [rows, sort, colByKey]);

  function onHeaderClick(key: string, defaultDir: SortDir) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: defaultDir },
    );
  }

  function toggleSelect(symbol: string) {
    setSelected((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol].slice(-2), // cap at two — keep the latest pair
    );
  }

  const sortIndicator = (key: string) =>
    sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : "";

  return (
    <div className="relative">
      <div className="overflow-x-auto rounded-xl border border-line bg-surface-1">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink3">
              {selectable && <th className="w-9 px-2 py-2.5" aria-hidden />}
              {/* intrinsic member column */}
              <th className="px-3 py-2.5 text-left font-medium">
                <button
                  type="button"
                  onClick={() => onHeaderClick(MEMBER_KEY, "asc")}
                  className="inline-flex items-center gap-1 transition-colors hover:text-ink2"
                >
                  {memberHeader}
                  <span className="num text-[9px]">{sortIndicator(MEMBER_KEY)}</span>
                </button>
              </th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5 font-medium",
                    c.align === "left" ? "text-left" : "text-right",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onHeaderClick(c.key, c.defaultDir ?? "desc")}
                    className={cn(
                      "inline-flex items-center gap-1 transition-colors hover:text-ink2",
                      c.align === "left" ? "" : "flex-row-reverse",
                    )}
                    title={c.hint}
                  >
                    <span>{c.header}</span>
                    <span className="num text-[9px]">{sortIndicator(c.key)}</span>
                  </button>
                  {c.hint && (
                    <div className="mt-0.5 text-[9px] font-normal normal-case tracking-normal text-ink3">
                      {c.hint}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const isHighlight =
                !!highlightSymbol && row.symbol === highlightSymbol;
              const isSelected = selected.includes(row.symbol);
              return (
                <tr
                  key={row.symbol}
                  onClick={() => router.push(rowHref(row.symbol))}
                  className={cn(
                    "group cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2",
                    isHighlight && "bg-primary/[0.06]",
                    isSelected && "bg-primary/[0.04]",
                  )}
                >
                  {selectable && (
                    <td
                      className="px-2 py-2.5 align-middle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(row.symbol);
                      }}
                    >
                      <span
                        className={cn(
                          "grid size-[18px] place-items-center rounded border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-line2 bg-surface group-hover:border-ink3",
                        )}
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label={`Select ${row.symbol} to compare`}
                      >
                        {isSelected && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {isHighlight && (
                        <span
                          className="h-3.5 w-[3px] shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0">
                        <div className="num truncate font-medium text-ink group-hover:text-primary">
                          {row.symbol}
                          {isHighlight && (
                            <span className="ml-1.5 rounded-full border border-primary/30 px-1.5 py-px text-[9px] uppercase tracking-wider text-primary">
                              you
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11px] text-ink3">{row.name}</div>
                      </div>
                    </div>
                  </td>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-3 py-2.5",
                        c.align === "left" ? "text-left" : "text-right",
                      )}
                    >
                      {row.pending ? (
                        <span className="inline-block h-3 w-10 animate-pulse rounded bg-line2/60 align-middle" />
                      ) : (
                        c.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* select-two → compare. Calm action bar, no winner framing. */}
      {selectable && selected.length > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3.5 py-2.5">
          <span className="text-[12px] text-ink2">
            {selected.length === 1 ? (
              <>
                <span className="num text-ink">{selected[0]}</span> selected — pick one more to
                compare
              </>
            ) : (
              <>
                Compare <span className="num text-ink">{selected[0]}</span> vs{" "}
                <span className="num text-ink">{selected[1]}</span>
              </>
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-[12px] text-ink3 transition-colors hover:text-ink2"
            >
              Clear
            </button>
            {selected.length === 2 && (
              <Link
                href={compareHref(selected[0], selected[1])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
              >
                Compare
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
