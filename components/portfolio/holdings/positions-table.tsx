"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { Icons } from "@/lib/icons";
import type { Holding } from "@/types/portfolio";
import {
  type AllocationMode,
  type HoldingGroup,
  type HoldingSortKey,
  type SortDir,
  STOCK_BAND_LABEL,
  buildGroups,
  holdingHealthColor,
  returnPct,
  sortHoldings,
} from "../lib";
import { RowExpand } from "./row-expand";

const COL_COUNT = 11; // caret + 10 data columns (expand row spans all)

const pnlText = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const signPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const signINRc = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;

interface ColDef {
  key: HoldingSortKey;
  label: string;
  align: "left" | "right";
  defaultDir: SortDir; // the direction a fresh click on this column starts at
}
// numeric/value columns default to descending (biggest first); name defaults to A→Z
const COLS: ColDef[] = [
  { key: "symbol", label: "Holding", align: "left", defaultDir: "asc" },
  { key: "quantity", label: "Qty", align: "right", defaultDir: "desc" },
  { key: "avgCost", label: "Avg cost", align: "right", defaultDir: "desc" },
  { key: "currentPrice", label: "LTP", align: "right", defaultDir: "desc" },
  { key: "investedValue", label: "Invested", align: "right", defaultDir: "desc" },
  { key: "marketValue", label: "Current", align: "right", defaultDir: "desc" },
  { key: "dayChangePct", label: "Day", align: "right", defaultDir: "desc" },
  { key: "unrealizedPnl", label: "Total P&L", align: "right", defaultDir: "desc" },
  { key: "weight", label: "Weight", align: "right", defaultDir: "desc" },
  { key: "health", label: "Health", align: "right", defaultDir: "desc" },
];

function groupLabel(cut: AllocationMode): string {
  return cut === "marketcap" ? "market cap" : "sector";
}

// ── health cell: band dot + label + score. Unscored → grey dot + "—" (never faked) ──
function HealthCell({ h }: { h: Holding }) {
  const color = holdingHealthColor(h);
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      <span className="text-[11px] text-ink3">{h.band ? STOCK_BAND_LABEL[h.band] : "—"}</span>
      <span className="num w-5 text-right font-medium" style={{ color }}>
        {h.health ?? "—"}
      </span>
    </span>
  );
}

// ── the small weight bar — width relative to the largest position (viz), number absolute ──
function WeightCell({ h, maxWeight }: { h: Holding; maxWeight: number }) {
  const pct = maxWeight > 0 ? (h.weight / maxWeight) * 100 : 0;
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-surface-3 lg:block">
        <div className="h-full rounded-full bg-ink3/70" style={{ width: `${pct}%` }} />
      </div>
      <span className="num w-9 text-right text-ink2">{(h.weight * 100).toFixed(1)}%</span>
    </div>
  );
}

// ── one holding row (desktop) + its inline expand ─────────────────────────────
function Row({
  h,
  maxWeight,
  expanded,
  onToggle,
}: {
  h: Holding;
  maxWeight: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rp = returnPct(h);
  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "cursor-pointer border-t border-line transition-colors hover:bg-surface-2/50",
          expanded && "bg-surface-2/40",
        )}
      >
        <td className="py-2.5 pl-1 pr-0.5 align-middle">
          <Icons.caretRight
            className={cn("size-3.5 text-ink3 transition-transform", expanded && "rotate-90")}
          />
        </td>
        <td className="px-1.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ background: holdingHealthColor(h) }} />
            <div className="min-w-0">
              <p className="num font-semibold text-ink">{h.symbol}</p>
              <p className="max-w-[11rem] truncate text-[11px] text-ink3">{h.name}</p>
              <p className="truncate text-[10px] text-ink3/80">{h.sector ?? "Unclassified"}</p>
            </div>
          </div>
        </td>
        <td className="num px-1.5 py-2.5 text-right text-ink2">{h.quantity}</td>
        <td className="num px-1.5 py-2.5 text-right text-ink2">{formatINR(h.avgCost)}</td>
        <td className="num px-1.5 py-2.5 text-right text-ink2">
          {h.currentPrice != null ? formatINR(h.currentPrice) : <span className="text-ink3">—</span>}
        </td>
        <td className="num px-1.5 py-2.5 text-right text-ink2">{formatINR(h.investedValue, { compact: true })}</td>
        <td className="num px-1.5 py-2.5 text-right text-ink">
          {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : <span className="text-ink3">—</span>}
        </td>
        <td className="px-1.5 py-2.5 text-right">
          {h.dayChangePct != null ? (
            <div className={cn("num leading-tight", pnlText(h.dayChangePct))}>
              <div>{signPct(h.dayChangePct)}</div>
              {h.dayChangeValue != null && <div className="text-[10px] opacity-80">{signINRc(h.dayChangeValue)}</div>}
            </div>
          ) : (
            <span className="text-ink3">—</span>
          )}
        </td>
        <td className="px-1.5 py-2.5 text-right">
          {h.unrealizedPnl != null ? (
            <div className={cn("num leading-tight", pnlText(h.unrealizedPnl))}>
              <div>{signINRc(h.unrealizedPnl)}</div>
              {rp != null && <div className="text-[10px] opacity-80">{signPct(rp)}</div>}
            </div>
          ) : (
            <span className="text-ink3">—</span>
          )}
        </td>
        <td className="px-1.5 py-2.5">
          <WeightCell h={h} maxWeight={maxWeight} />
        </td>
        <td className="px-1.5 py-2.5 text-right">
          <HealthCell h={h} />
        </td>
      </tr>
      {/* inline expand — a full-width row; enter animates height, collapse unmounts cleanly
          (AnimatePresence can't orchestrate exit through a non-motion <tr> inside <tbody>) */}
      {expanded && (
        <tr>
          <td colSpan={COL_COUNT} className="p-0">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line bg-surface-2/25"
            >
              <RowExpand holding={h} />
            </motion.div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── group header row (spans the table; carries the group's roll-up) ───────────
function GroupHeader({ g }: { g: HoldingGroup }) {
  return (
    <tr className="bg-surface-2/40">
      <td colSpan={COL_COUNT} className="px-2 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: g.color }} />
          <span className="text-[12px] font-semibold text-ink">{g.label}</span>
          <span className="text-[11px] text-ink3">
            {g.holdings.length} holding{g.holdings.length === 1 ? "" : "s"}
          </span>
          <span className="ml-auto flex items-center gap-3 text-[11px]">
            <span className="num text-ink2">{(g.weight * 100).toFixed(1)}% of book</span>
            <span className="num text-ink">{formatINR(g.value, { compact: true })}</span>
            {g.unrealizedPnl != null && (
              <span className={cn("num", pnlText(g.unrealizedPnl))}>{signINRc(g.unrealizedPnl)}</span>
            )}
          </span>
        </div>
      </td>
    </tr>
  );
}

// ── mobile card (compact; same expand) ────────────────────────────────────────
function MobileCard({ h, expanded, onToggle }: { h: Holding; expanded: boolean; onToggle: () => void }) {
  const rp = returnPct(h);
  return (
    <div className={cn("rounded-xl border border-line bg-surface-1", expanded && "border-line2")}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-2.5 p-3 text-left">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: holdingHealthColor(h) }} />
        <div className="min-w-0 flex-1">
          <p className="num font-semibold text-ink">{h.symbol}</p>
          <p className="truncate text-[11px] text-ink3">{h.sector ?? "Unclassified"}</p>
        </div>
        <div className="text-right">
          <p className="num text-[13px] text-ink">
            {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : "—"}
          </p>
          <p className={cn("num text-[11px]", rp != null ? pnlText(rp) : "text-ink3")}>
            {rp != null ? signPct(rp) : "—"}
          </p>
        </div>
        <Icons.caretRight className={cn("size-3.5 shrink-0 text-ink3 transition-transform", expanded && "rotate-90")} />
      </button>
      <div className="flex items-center justify-between border-t border-line/60 px-3 py-2 text-[11px]">
        <span className="num text-ink3">{(h.weight * 100).toFixed(1)}% of book</span>
        <span className="inline-flex items-center gap-2">
          <span className={cn("num", h.dayChangePct != null ? pnlText(h.dayChangePct) : "text-ink3")}>
            {h.dayChangePct != null ? signPct(h.dayChangePct) : "—"} today
          </span>
          <HealthCell h={h} />
        </span>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line"
          >
            <RowExpand holding={h} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PositionsTable({
  holdings,
  cut,
  grouped,
  onGroupedChange,
  sort,
  onSort,
}: {
  holdings: Holding[];
  cut: AllocationMode;
  grouped: boolean;
  onGroupedChange: (g: boolean) => void;
  sort: { key: HoldingSortKey; dir: SortDir };
  onSort: (key: HoldingSortKey) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (sym: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else next.add(sym);
      return next;
    });

  const maxWeight = holdings.reduce((m, h) => Math.max(m, h.weight), 0);
  const unscored = holdings.filter((h) => h.health == null);

  // grouping is meaningful only for sector / market-cap cuts; "stock" is always flat
  const canGroup = cut !== "stock";
  const isGrouped = grouped && canGroup;
  const groups = isGrouped ? buildGroups(holdings, cut) : [];
  const flatSorted = sortHoldings(holdings, sort.key, sort.dir);

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-3 sm:p-4">
      {/* control bar — group-by ties to the allocation cut above */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5">
            <button
              type="button"
              onClick={() => onGroupedChange(false)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                !isGrouped ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
              )}
            >
              Flat
            </button>
            <button
              type="button"
              disabled={!canGroup}
              onClick={() => onGroupedChange(true)}
              title={canGroup ? undefined : "Choose Sector or Market cap above to group"}
              className={cn(
                "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                isGrouped ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
                !canGroup && "cursor-not-allowed opacity-40 hover:text-ink3",
              )}
            >
              By {groupLabel(cut)}
            </button>
          </div>
          {isGrouped && <span className="text-[11px] text-ink3">matches the allocation view above</span>}
        </div>

        {/* mobile sort control (desktop sorts via headers) */}
        <label className="flex items-center gap-1.5 text-[11px] text-ink3 md:hidden">
          Sort
          <select
            value={sort.key}
            onChange={(e) => onSort(e.target.value as HoldingSortKey)}
            className="num rounded-md border border-line2 bg-surface-2 px-2 py-1 text-[11px] text-ink2"
          >
            {COLS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* desktop table */}
      <div className="custom-scrollbar hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-[12px]">
          <thead>
            <tr className="text-[9.5px] uppercase tracking-wide text-ink3">
              <th className="w-6" />
              {COLS.map((c) => {
                const active = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={cn(
                      "px-1.5 py-2 font-semibold",
                      c.align === "left" ? "text-left" : "text-right",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-ink2",
                        c.align === "right" && "flex-row-reverse",
                        active && "text-ink",
                      )}
                    >
                      {c.label}
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
              })}
            </tr>
          </thead>
          <tbody>
            {isGrouped
              ? groups.map((g) => (
                  <GroupRows key={g.key} g={g} sort={sort} maxWeight={maxWeight} open={open} toggle={toggle} />
                ))
              : flatSorted.map((h) => (
                  <Row key={h.symbol} h={h} maxWeight={maxWeight} expanded={open.has(h.symbol)} onToggle={() => toggle(h.symbol)} />
                ))}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <div className="space-y-3 md:hidden">
        {isGrouped
          ? groups.map((g) => (
              <div key={g.key} className="space-y-2">
                <div className="flex items-center gap-2 px-1 pt-1">
                  <span className="size-2.5 rounded-[3px]" style={{ background: g.color }} />
                  <span className="text-[12px] font-semibold text-ink">{g.label}</span>
                  <span className="num ml-auto text-[11px] text-ink3">{(g.weight * 100).toFixed(1)}%</span>
                </div>
                {sortHoldings(g.holdings, sort.key, sort.dir).map((h) => (
                  <MobileCard key={h.symbol} h={h} expanded={open.has(h.symbol)} onToggle={() => toggle(h.symbol)} />
                ))}
              </div>
            ))
          : flatSorted.map((h) => (
              <MobileCard key={h.symbol} h={h} expanded={open.has(h.symbol)} onToggle={() => toggle(h.symbol)} />
            ))}
      </div>

      {/* honest coverage note — never blank-faked */}
      {unscored.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line px-1 pt-3 text-[11.5px] text-ink3">
          <span className="size-2 rounded-full bg-ink3/60" />
          <span className="num text-ink2">{unscored.length}</span> holding{unscored.length === 1 ? "" : "s"} not scored
          yet — shown with an honest “—”, never a stand-in number.
        </p>
      )}
    </div>
  );
}

// grouped desktop body: a header row + its sorted holdings (split out to keep JSX flat)
function GroupRows({
  g,
  sort,
  maxWeight,
  open,
  toggle,
}: {
  g: HoldingGroup;
  sort: { key: HoldingSortKey; dir: SortDir };
  maxWeight: number;
  open: Set<string>;
  toggle: (sym: string) => void;
}) {
  return (
    <>
      <GroupHeader g={g} />
      {sortHoldings(g.holdings, sort.key, sort.dir).map((h) => (
        <Row key={h.symbol} h={h} maxWeight={maxWeight} expanded={open.has(h.symbol)} onToggle={() => toggle(h.symbol)} />
      ))}
    </>
  );
}
