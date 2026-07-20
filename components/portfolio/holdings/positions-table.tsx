"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { Icons } from "@/lib/icons";
import {
  type AllocationMode,
  type HoldingGroup,
  type HoldingSortKey,
  type SortDir,
  STOCK_BAND_LABEL,
  buildGroups,
  holdingClass,
  holdingHealthColor,
  returnPct,
  sortHoldings,
} from "../lib";
import { RowExpand } from "./row-expand";
import { HoldingDisclosure } from "../holding-disclosure";
import { type HoldingRow, heldInLabel } from "./aggregate";

const pnlText = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const signPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const signINRc = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;
const Dash = () => <span className="text-ink3">—</span>;

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
  return cut === "marketcap" ? "market cap" : cut === "class" ? "class" : "sector";
}

// ── health cell: band label + score for a scored name. For an UNSCORED holding the SERVED disclosure
//    note (by-design fund/ETF, unpriced, …) carries the reason inline — a bare "—" only when nothing is
//    served (a stock still awaiting its first score). The note is never faked and never a lone dash. ──
function HealthCell({ h }: { h: HoldingRow }) {
  const color = holdingHealthColor(h);
  if (h.health == null) {
    return h.disclosureNotes?.length ? (
      <HoldingDisclosure notes={h.disclosureNotes} variant="inline" className="justify-end" />
    ) : (
      <Dash />
    );
  }
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      <span className="text-[11px] text-ink3">{h.band ? STOCK_BAND_LABEL[h.band] : "—"}</span>
      <span className="num w-5 text-right font-medium" style={{ color }}>
        {Math.round(h.health)}
      </span>
    </span>
  );
}

// ── the small weight bar — width relative to the largest position (viz), number absolute ──
function WeightCell({ h, maxWeight }: { h: HoldingRow; maxWeight: number }) {
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

// ── the "held in" line — WHICH account(s) hold this entity. Makes the account dimension visible even
//    when unfiltered (the core Phase-2 win). A multi-instrument issuer also wears a "N×" badge. ──
function HeldIn({ h }: { h: HoldingRow }) {
  const label = heldInLabel(h.entity.accounts);
  if (!label) return null;
  return (
    <p className="flex items-center gap-1 truncate text-[10px] text-ink3/70">
      <Icons.stack className="size-2.5 shrink-0" />
      <span className="truncate">{label}</span>
    </p>
  );
}

function InstrumentsBadge({ h }: { h: HoldingRow }) {
  if (!h.entity.multiInstrument) return null;
  return (
    <span
      title={`${h.entity.instruments.length} instruments of one issuer — expand to see each`}
      className="shrink-0 rounded border border-line2 px-1 py-px text-[8.5px] uppercase tracking-wide text-ink3"
    >
      {h.entity.instruments.length}×
    </span>
  );
}

// ── one holding row (desktop) + its inline expand ─────────────────────────────
function Row({
  h,
  maxWeight,
  expanded,
  onToggle,
  activeAccount,
  scoped,
  colCount,
}: {
  h: HoldingRow;
  maxWeight: number;
  expanded: boolean;
  onToggle: () => void;
  activeAccount: string | null;
  scoped?: boolean;
  colCount: number;
}) {
  const rp = returnPct(h);
  const multi = h.entity.multiInstrument; // a stock+bond issuer: qty / avg cost / LTP don't sum → dash
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
            {/* the leading dot encodes HEALTH on the portfolio table; scoped (health-free) mode uses a
                neutral bullet, never a health colour. */}
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: scoped ? "var(--ink3)" : holdingHealthColor(h) }}
            />
            <div className="min-w-0">
              {/* NAME leads — for every asset class (a fund is "Bandhan Small Cap Fund", not its ISIN) */}
              <p className="flex items-center gap-1.5 font-semibold text-ink">
                <span className="min-w-0 max-w-[13rem] truncate">{h.name ?? h.symbol}</span>
                <InstrumentsBadge h={h} />
              </p>
              {/* the identifier + class, muted — a stock's ticker, a fund/bond's ISIN */}
              <p className="num max-w-[13rem] truncate text-[10.5px] text-ink3">
                {h.symbol}
                <span className="text-ink3/70"> · {holdingClass(h)}</span>
              </p>
              {!scoped && <HeldIn h={h} />}
            </div>
          </div>
        </td>
        <td className="num px-1.5 py-2.5 text-right text-ink2">{multi ? <Dash /> : h.quantity}</td>
        <td className="num px-1.5 py-2.5 text-right text-ink2">{multi ? <Dash /> : formatINR(h.avgCost)}</td>
        <td className="num px-1.5 py-2.5 text-right text-ink2">
          {h.currentPrice != null ? formatINR(h.currentPrice) : <Dash />}
        </td>
        <td className="num px-1.5 py-2.5 text-right text-ink2">{formatINR(h.investedValue, { compact: true })}</td>
        <td className="num px-1.5 py-2.5 text-right text-ink">
          {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : <Dash />}
        </td>
        <td className="px-1.5 py-2.5 text-right">
          {h.dayChangePct != null ? (
            <div className={cn("num leading-tight", pnlText(h.dayChangePct))}>
              <div>{signPct(h.dayChangePct)}</div>
              {h.dayChangeValue != null && <div className="text-[10px] opacity-80">{signINRc(h.dayChangeValue)}</div>}
            </div>
          ) : (
            <Dash />
          )}
        </td>
        <td className="px-1.5 py-2.5 text-right">
          {h.unrealizedPnl != null ? (
            <div className={cn("num leading-tight", pnlText(h.unrealizedPnl))}>
              <div>{signINRc(h.unrealizedPnl)}</div>
              {rp != null && <div className="text-[10px] opacity-80">{signPct(rp)}</div>}
            </div>
          ) : (
            <Dash />
          )}
        </td>
        <td className="px-1.5 py-2.5">
          <WeightCell h={h} maxWeight={maxWeight} />
        </td>
        {!scoped && (
          <td className="px-1.5 py-2.5 text-right">
            <HealthCell h={h} />
          </td>
        )}
      </tr>
      {/* inline expand — a full-width row; enter animates height, collapse unmounts cleanly
          (AnimatePresence can't orchestrate exit through a non-motion <tr> inside <tbody>) */}
      {expanded && (
        <tr>
          <td colSpan={colCount} className="p-0">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line2 bg-surface-3/60 shadow-inner"
            >
              <RowExpand row={h} activeAccount={activeAccount} scoped={scoped} />
            </motion.div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── group header row (spans the table; carries the group's roll-up) ───────────
function GroupHeader({ g, scoped, colCount }: { g: HoldingGroup<HoldingRow>; scoped?: boolean; colCount: number }) {
  return (
    <tr className="bg-surface-2/40">
      <td colSpan={colCount} className="px-2 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: g.color }} />
          <span className="text-[12px] font-semibold text-ink">{g.label}</span>
          <span className="text-[11px] text-ink3">
            {g.holdings.length} holding{g.holdings.length === 1 ? "" : "s"}
          </span>
          <span className="ml-auto flex items-center gap-3 text-[11px]">
            <span className="num text-ink2">{(g.weight * 100).toFixed(1)}% {scoped ? "of account" : "of book"}</span>
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
function MobileCard({
  h,
  expanded,
  onToggle,
  activeAccount,
  scoped,
}: {
  h: HoldingRow;
  expanded: boolean;
  onToggle: () => void;
  activeAccount: string | null;
  scoped?: boolean;
}) {
  const rp = returnPct(h);
  return (
    <div className={cn("rounded-xl border border-line bg-surface-1", expanded && "border-line2")}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-2.5 p-3 text-left">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: scoped ? "var(--ink3)" : holdingHealthColor(h) }}
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
            <span className="min-w-0 truncate">{h.name ?? h.symbol}</span>
            <InstrumentsBadge h={h} />
          </p>
          <p className="num truncate text-[11px] text-ink3">
            {h.symbol} · {holdingClass(h)}
          </p>
          {!scoped && <HeldIn h={h} />}
        </div>
        <div className="shrink-0 text-right">
          <p className="num text-[13px] text-ink">
            {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : "—"}
          </p>
          <p className={cn("num text-[11px]", rp != null ? pnlText(rp) : "text-ink3")}>
            {rp != null ? signPct(rp) : "—"}
          </p>
        </div>
        <Icons.caretRight className={cn("size-3.5 shrink-0 text-ink3 transition-transform", expanded && "rotate-90")} />
      </button>
      <div className="flex items-center justify-between gap-2 border-t border-line/60 px-3 py-2 text-[11px]">
        <span className="num shrink-0 text-ink3">{(h.weight * 100).toFixed(1)}% {scoped ? "of account" : "of book"}</span>
        <span className="grid sm:inline-flex min-w-0 items-center gap-2">
          <span className={cn("num shrink-0", h.dayChangePct != null ? pnlText(h.dayChangePct) : "text-ink3")}>
            {h.dayChangePct != null ? signPct(h.dayChangePct) : "—"} today
          </span>
          {!scoped && <HealthCell h={h} />}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line2 bg-surface-3/60 shadow-inner"
          >
            <RowExpand row={h} activeAccount={activeAccount} scoped={scoped} />
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
  activeAccount,
  scoped,
}: {
  holdings: HoldingRow[];
  cut: AllocationMode;
  grouped: boolean;
  onGroupedChange: (g: boolean) => void;
  sort: { key: HoldingSortKey; dir: SortDir };
  onSort: (key: HoldingSortKey) => void;
  activeAccount: string | null;
  /** Account-detail (health-free, single-account) mode: drops the Health column + cell, the band-dot
   *  health colour, the "awaiting score" coverage note, the "held in" account line, and relabels weight
   *  "of account". Weights are expected pre-renormalized to the account by the caller. */
  scoped?: boolean;
}) {
  // open-set keyed by the ENTITY key (stable id), not the display symbol
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Health-free scoped mode drops the Health column entirely; colCount keeps the expand/group colSpans
  // in step with whichever column set is live.
  const cols = scoped ? COLS.filter((c) => c.key !== "health") : COLS;
  const colCount = cols.length + 1; // + the caret column

  const maxWeight = holdings.reduce((m, h) => Math.max(m, h.weight), 0);
  // STOCKS still awaiting a first score. A non-stock (fund/ETF/REIT/bond…) is by-design unscored and
  // carries its own served note per row, so it is NOT "awaiting coverage" and must not be counted here.
  // Scoped (health-free) mode never surfaces a coverage note, so it doesn't compute one.
  const awaitingScore = scoped ? [] : holdings.filter((h) => h.health == null && !h.disclosureNotes?.length);

  // grouping is meaningful only for sector / market-cap / class cuts; "stock" is always flat
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
            {cols.map((c) => (
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
            <tr className="text-xs uppercase tracking-wide text-ink3">
              <th className="w-6" />
              {cols.map((c) => {
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
                  <GroupRows key={g.key} g={g} sort={sort} maxWeight={maxWeight} open={open} toggle={toggle} activeAccount={activeAccount} scoped={scoped} colCount={colCount} />
                ))
              : flatSorted.map((h) => (
                  <Row key={h.entity.key} h={h} maxWeight={maxWeight} expanded={open.has(h.entity.key)} onToggle={() => toggle(h.entity.key)} activeAccount={activeAccount} scoped={scoped} colCount={colCount} />
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
                  <MobileCard key={h.entity.key} h={h} expanded={open.has(h.entity.key)} onToggle={() => toggle(h.entity.key)} activeAccount={activeAccount} scoped={scoped} />
                ))}
              </div>
            ))
          : flatSorted.map((h) => (
              <MobileCard key={h.entity.key} h={h} expanded={open.has(h.entity.key)} onToggle={() => toggle(h.entity.key)} activeAccount={activeAccount} scoped={scoped} />
            ))}
      </div>

      {/* honest coverage note — STOCKS awaiting a score only; by-design non-stocks state their own reason
          on the row (never blank-faked, never miscounted as "awaiting"). */}
      {awaitingScore.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line px-1 pt-3 text-[11.5px] text-ink3">
          <span className="size-2 rounded-full bg-ink3/60" />
          <span className="num text-ink2">{awaitingScore.length}</span> holding{awaitingScore.length === 1 ? "" : "s"} not scored
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
  activeAccount,
  scoped,
  colCount,
}: {
  g: HoldingGroup<HoldingRow>;
  sort: { key: HoldingSortKey; dir: SortDir };
  maxWeight: number;
  open: Set<string>;
  toggle: (key: string) => void;
  activeAccount: string | null;
  scoped?: boolean;
  colCount: number;
}) {
  return (
    <>
      <GroupHeader g={g} scoped={scoped} colCount={colCount} />
      {sortHoldings(g.holdings, sort.key, sort.dir).map((h) => (
        <Row key={h.entity.key} h={h} maxWeight={maxWeight} expanded={open.has(h.entity.key)} onToggle={() => toggle(h.entity.key)} activeAccount={activeAccount} scoped={scoped} colCount={colCount} />
      ))}
    </>
  );
}
