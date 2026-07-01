"use client";

/**
 * COMPARISON statement rendering — the family-aware statement surface of the Fundamentals
 * tab. It reuses the SAME per-family line-definitions the per-stock Fundamentals page uses
 * (from stock-detail/statement-lines) so the two surfaces render statements line-for-line
 * identically — grouped hierarchy, bold headers/totals, indented components, honest "—".
 *
 * Two shapes, driven by the payload's `comparableDirectly`:
 *   • SAME-FAMILY  → full P&L / BS / CF side-by-side. Each line shows A | B for the LATEST
 *                    annual period by default; an expand toggle per statement reveals each
 *                    stock's own multi-year history. No winner, no highlight — two columns.
 *   • CROSS-FAMILY → each stock's OWN full statements, rendered separately and labeled with
 *                    symbol + family, never force-aligned into shared rows.
 *
 * NON-NEGOTIABLE (mirrors the rest of the comparison view): no winner, no ✓/✗, no
 * highlight-the-bigger-value. The two entities are two calm identity hues.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { shortPeriod } from "@/components/stock-detail/health/shared";
import { A_HUE, B_HUE } from "./shared";
import type { CompareeStatements } from "@/types/compare";
import {
  DASH,
  type AnnualLine,
  type StmtRow,
  nfPlLines,
  nfBsLines,
  nfCfLines,
  nfPlQuarterRows,
  bkPlLines,
  bkBsLines,
  bkCfLines,
  bkPlQuarterRows,
  nbfcPlLines,
  nbfcBsLines,
  nbfcCfLines,
  nbfcPlQuarterRows,
  liPlLines,
  liBsLines,
  liPlQuarterRows,
  giPlLines,
  giBsLines,
  giPlQuarterRows,
} from "@/components/stock-detail/statement-lines";

const MAX_YEARS = 5;
const MAX_Q = 8;

type StmtKind = "pl" | "bs" | "cf";

/** The per-family line-defs + quarterly-row builder, resolved from the discriminated union.
 *  Insurers carry no CF (cf = null). Typed loosely at the boundary because the union is
 *  narrowed by `family`; every access below is on the matching family's own series. */
type FamilyDefs = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pl: AnnualLine<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bs: AnnualLine<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cf: AnnualLine<any>[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plQuarter: (qs: any[]) => StmtRow[];
};

function defsFor(family: CompareeStatements["family"]): FamilyDefs {
  switch (family) {
    case "non_financial":
      return { pl: nfPlLines, bs: nfBsLines, cf: nfCfLines, plQuarter: nfPlQuarterRows };
    case "banking":
      return { pl: bkPlLines, bs: bkBsLines, cf: bkCfLines, plQuarter: bkPlQuarterRows };
    case "nbfc":
      return { pl: nbfcPlLines, bs: nbfcBsLines, cf: nbfcCfLines, plQuarter: nbfcPlQuarterRows };
    case "life_insurance":
      return { pl: liPlLines, bs: liBsLines, cf: null, plQuarter: liPlQuarterRows };
    case "general_insurance":
      return { pl: giPlLines, bs: giBsLines, cf: null, plQuarter: giPlQuarterRows };
  }
}

// ── low-level cells ─────────────────────────────────────────────────────────

/** A label cell honoring the shared indent/bold treatment. */
function labelCell(label: string, indent?: boolean, isBold?: boolean) {
  return (
    <td
      className={cn(
        "px-3 py-[7px] text-left text-[11.5px]",
        indent ? "pl-6 text-ink3" : "text-ink2",
        isBold && "font-semibold text-ink",
      )}
    >
      {label}
    </td>
  );
}

/** A value cell — dashed when the formatted value is DASH, never styled by magnitude. */
function valueCell(v: string, isMargin?: boolean, isBold?: boolean, key?: string | number) {
  return (
    <td
      key={key}
      className={cn(
        "num px-3 py-[7px] text-right text-[11.5px]",
        v === DASH ? "text-ink3" : isMargin ? "text-ink2" : "text-ink",
        isBold && "font-semibold",
      )}
    >
      {v}
    </td>
  );
}

// ── SAME-FAMILY: one ANNUAL statement, A | B for the shared selected year, expand →
// per-stock history. The year is chosen by the ONE annual-year anchor in SameFamilyStatements,
// so P&L, Balance Sheet and Cash Flow all move together. A side that lacks the selected year
// dashes (honest). Used for BS + CF here (the P&L has its own basis-aware block).

function SideBySideStatement({
  title,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lines,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aSeries,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bSeries,
  selectedYear,
  aLabel,
  bLabel,
  note,
}: {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lines: AnnualLine<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aSeries: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bSeries: any[];
  /** The shared annual anchor year (fiscalYear). Both sides show THIS year (or dash). */
  selectedYear: string;
  aLabel: string;
  bLabel: string;
  note?: string;
}) {
  const [showHistory, setShowHistory] = useState(false);

  const aSnap = aSeries.find((s) => s.fiscalYear === selectedYear) ?? null;
  const bSnap = bSeries.find((s) => s.fiscalYear === selectedYear) ?? null;
  const aPeriod = aSnap ? selectedYear : "—";
  const bPeriod = bSnap ? selectedYear : "—";

  if (aSeries.length === 0 && bSeries.length === 0) {
    return (
      <div>
        <StatementHeading title={title} />
        <p className="rounded-lg border border-dashed border-line2 bg-surface-1 px-4 py-6 text-center text-[12px] text-ink3">
          No annual figures available for this statement.
        </p>
      </div>
    );
  }

  return (
    <div>
      <StatementHeading
        title={title}
        showHistory={showHistory}
        onToggle={() => setShowHistory((s) => !s)}
        canExpand={aSeries.length > 1 || bSeries.length > 1}
      />
      {note && <p className="mb-2 text-[11px] italic text-ink3">{note}</p>}

      {/* The shared-selected annual year, A | B side by side */}
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface-1">
              <th className="min-w-[168px] px-3 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                Line item
              </th>
              <th className="min-w-[96px] px-3 py-2 text-right text-[10px] font-semibold">
                <span className="num" style={{ color: A_HUE }}>
                  {aLabel}
                </span>
                <span className="ml-1 text-[9px] font-normal text-ink3">{aPeriod}</span>
              </th>
              <th className="min-w-[96px] px-3 py-2 text-right text-[10px] font-semibold">
                <span className="num" style={{ color: B_HUE }}>
                  {bLabel}
                </span>
                <span className="ml-1 text-[9px] font-normal text-ink3">{bPeriod}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((ln, i) => (
              <tr key={`${ln.label}-${i}`} className="border-t border-line">
                {labelCell(ln.label, ln.indent, ln.isBold)}
                {valueCell(aSnap ? ln.value(aSnap) : DASH, ln.isMargin, ln.isBold, "a")}
                {valueCell(bSnap ? ln.value(bSnap) : DASH, ln.isMargin, ln.isBold, "b")}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded: each stock's own multi-year history, stacked (per-stock columns) */}
      {showHistory && (
        <div className="mt-3 space-y-3">
          <PerStockHistory hue={A_HUE} label={aLabel} lines={lines} series={aSeries} />
          <PerStockHistory hue={B_HUE} label={bLabel} lines={lines} series={bSeries} />
        </div>
      )}
    </div>
  );
}

function StatementHeading({
  title,
  showHistory,
  onToggle,
  canExpand,
}: {
  title: string;
  showHistory?: boolean;
  onToggle?: () => void;
  canExpand?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h4 className="text-[13px] font-semibold text-ink">{title}</h4>
      {onToggle && canExpand && (
        <button
          onClick={onToggle}
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-ink2 transition-colors hover:text-ink"
        >
          {showHistory ? "Hide history" : "Show per-year history"}
          <Icons.caretDown className={cn("h-3.5 w-3.5 transition-transform", showHistory && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

/** One entity's OWN multi-year statement — years as columns (oldest→newest, last MAX_YEARS).
 *  Reused for both the same-family history expand AND the cross-family per-stock blocks. */
function PerStockHistory({
  hue,
  label,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lines,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series,
}: {
  hue: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lines: AnnualLine<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: any[];
}) {
  const [showAll, setShowAll] = useState(false);
  if (series.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line2 bg-surface-1 px-4 py-4 text-center text-[12px] text-ink3">
        No annual figures on file for {label}.
      </p>
    );
  }
  const visible = showAll ? series : series.slice(-MAX_YEARS);
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: hue }} />
        <span className="num text-[11px] font-semibold" style={{ color: hue }}>
          {label}
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface-1">
              <th className="min-w-[168px] px-3 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                Line item
              </th>
              {visible.map((a) => (
                <th
                  key={a.fiscalYear}
                  className="min-w-[84px] px-3 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide text-ink3"
                >
                  {a.fiscalYear}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((ln, i) => (
              <tr key={`${ln.label}-${i}`} className="border-t border-line">
                {labelCell(ln.label, ln.indent, ln.isBold)}
                {visible.map((a, j) => valueCell(ln.value(a), ln.isMargin, ln.isBold, j))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {series.length > MAX_YEARS && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[11px] text-ink2 transition-colors hover:text-ink"
        >
          {showAll ? "Show recent only" : `Show all ${series.length} years`}
          <Icons.caretDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

/** One entity's OWN quarterly P&L — quarters as columns (last MAX_Q). Cross-family blocks
 *  show it beneath the annual statements so each stock reads as a full statement set. */
function PerStockQuarterly({
  hue,
  label,
  rows,
  periods,
}: {
  hue: string;
  label: string;
  rows: StmtRow[];
  periods: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  if (periods.length === 0) return null;
  const sliceFrom = showAll ? 0 : Math.max(0, periods.length - MAX_Q);
  const vp = periods.slice(sliceFrom);
  const vr = rows.map((r) => ({ ...r, values: r.values.slice(sliceFrom) }));
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: hue }} />
        <span className="num text-[11px] font-semibold" style={{ color: hue }}>
          {label} · quarterly P&amp;L
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface-1">
              <th className="min-w-[168px] px-3 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                Line item
              </th>
              {vp.map((p) => (
                <th
                  key={p}
                  className="min-w-[84px] px-3 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide text-ink3"
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vr.map((r, i) => (
              <tr key={`${r.label}-${i}`} className="border-t border-line">
                {labelCell(r.label, r.indent, r.isBold)}
                {r.values.map((v, j) => valueCell(v, r.isMargin, r.isBold, j))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {periods.length > MAX_Q && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[11px] text-ink2 transition-colors hover:text-ink"
        >
          {showAll ? "Show recent only" : `Show all ${periods.length} quarters`}
          <Icons.caretDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

// ── SAME-FAMILY P&L with a period selector (Annual ↔ Quarterly + pick a period) ──
// Unlike BS/CF (annual only), the P&L has both an annual series AND a quarterly series
// forwarded on `statements`. This block lets the user switch basis and pick a specific
// period; the A | B columns then show THAT period for both stocks. A period only one stock
// has → that side dashes (honest). The multi-year "Show per-year history" expand is kept
// as-is (it's the multi-period view); the selector controls the single-period default.

type PlRow = { label: string; aVal: string; bVal: string; indent?: boolean; isBold?: boolean; isMargin?: boolean };

/** Build the single-period A|B rows for the ANNUAL basis: match each side's snapshot by
 *  fiscalYear, apply the shared line-defs, dash a side that lacks the year. */
function annualPlRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lines: AnnualLine<any>[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aSnap: any | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bSnap: any | null,
): PlRow[] {
  return lines.map((ln) => ({
    label: ln.label,
    aVal: aSnap ? ln.value(aSnap) : DASH,
    bVal: bSnap ? ln.value(bSnap) : DASH,
    indent: ln.indent,
    isBold: ln.isBold,
    isMargin: ln.isMargin,
  }));
}

/** Build the single-period A|B rows for the QUARTERLY basis. The shared `plQuarter` builder
 *  maps a quarter list → StmtRow[]; feeding it a single quarter yields one value per line.
 *  The row STRUCTURE (labels/order/treatment) is identical for any input, so the template
 *  comes from whichever side has the quarter; each side then fills its own value or dashes. */
function quarterlyPlRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plQuarter: (qs: any[]) => StmtRow[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aQ: any | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bQ: any | null,
): PlRow[] {
  const template = plQuarter([aQ ?? bQ].filter(Boolean));
  const aRows = aQ ? plQuarter([aQ]) : null;
  const bRows = bQ ? plQuarter([bQ]) : null;
  return template.map((r, i) => ({
    label: r.label,
    aVal: aRows ? aRows[i].values[0] : DASH,
    bVal: bRows ? bRows[i].values[0] : DASH,
    indent: r.indent,
    isBold: r.isBold,
    isMargin: r.isMargin,
  }));
}

/** Small segmented Annual/Quarterly toggle — mirrors the per-stock page's period toggle. */
function BasisToggle({ basis, onChange }: { basis: "a" | "q"; onChange: (b: "a" | "q") => void }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-surface-2 p-0.5">
      {(["a", "q"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded px-2.5 py-0.5 text-[10.5px] font-medium transition-colors",
            basis === v ? "bg-surface-3 text-ink" : "cursor-pointer text-ink3 hover:text-ink2",
          )}
        >
          {v === "a" ? "Annual" : "Quarterly"}
        </button>
      ))}
    </div>
  );
}

function SameFamilyPL({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  annualLines,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plQuarter,
  aStatements,
  bStatements,
  aLabel,
  bLabel,
  annualPeriods,
  annualSel,
  onAnnualChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  annualLines: AnnualLine<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plQuarter: (qs: any[]) => StmtRow[];
  aStatements: CompareeStatements;
  bStatements: CompareeStatements;
  aLabel: string;
  bLabel: string;
  /** The shared annual anchor — lifted to SameFamilyStatements so the year selection drives
   *  P&L + BS + CF together. When basis = Annual the P&L follows it; when basis = Quarterly
   *  the P&L follows the quarter picker while this still governs BS/CF above/below. */
  annualPeriods: string[];
  annualSel: string;
  onAnnualChange: (v: string) => void;
}) {
  const aAnnual = aStatements.annualSeries;
  const bAnnual = bStatements.annualSeries;
  const aQuarters = aStatements.quarters;
  const bQuarters = bStatements.quarters;

  // Quarter option list — UNION of both sides (a quarter only one stock has stays selectable;
  // the other side dashes). Newest-first for the picker. (Annual list is passed in shared.)
  const quarterKeys = unionNewestFirst(
    aQuarters.map((q) => q.periodKey),
    bQuarters.map((q) => q.periodKey),
  );

  const [basis, setBasis] = useState<"a" | "q">("a");
  const [quarterSel, setQuarterSel] = useState<string>(quarterKeys[0] ?? "");
  const [showHistory, setShowHistory] = useState(false);

  const hasAnnual = annualPeriods.length > 0;
  const hasQuarterly = quarterKeys.length > 0;

  let rows: PlRow[];
  let aPeriodLabel: string;
  let bPeriodLabel: string;
  if (basis === "a") {
    const period = annualSel || annualPeriods[0] || "";
    const aSnap = aAnnual.find((s) => s.fiscalYear === period) ?? null;
    const bSnap = bAnnual.find((s) => s.fiscalYear === period) ?? null;
    rows = annualPlRows(annualLines, aSnap, bSnap);
    aPeriodLabel = aSnap ? period : "—";
    bPeriodLabel = bSnap ? period : "—";
  } else {
    const period = quarterSel || quarterKeys[0] || "";
    const aQ = aQuarters.find((q) => q.periodKey === period) ?? null;
    const bQ = bQuarters.find((q) => q.periodKey === period) ?? null;
    rows = quarterlyPlRows(plQuarter, aQ, bQ);
    aPeriodLabel = aQ ? shortPeriod(period) : "—";
    bPeriodLabel = bQ ? shortPeriod(period) : "—";
  }

  return (
    <div>
      {/* Heading row: title on the left, the multi-year history toggle on the right. */}
      <StatementHeading
        title="Profit & Loss"
        showHistory={showHistory}
        onToggle={() => setShowHistory((s) => !s)}
        canExpand={aAnnual.length > 1 || bAnnual.length > 1}
      />

      {/* Basis + period selector — controls the single-period A|B shown below. The Annual
          year selector is the SHARED anchor (drives BS + CF too); the Quarterly picker is
          P&L-only. */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <BasisToggle
          basis={basis}
          onChange={(b) => {
            // guard: don't switch to quarterly if there are no quarters (defensive)
            if (b === "q" && !hasQuarterly) return;
            if (b === "a" && !hasAnnual) return;
            setBasis(b);
          }}
        />
        {basis === "a" ? (
          <PeriodSelect
            value={annualSel || annualPeriods[0] || ""}
            options={annualPeriods}
            onChange={onAnnualChange}
            format={(p) => p}
          />
        ) : (
          <PeriodSelect
            value={quarterSel || quarterKeys[0] || ""}
            options={quarterKeys}
            onChange={setQuarterSel}
            format={(p) => shortPeriod(p)}
          />
        )}
      </div>

      {/* Single-period A | B table */}
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface-1">
              <th className="min-w-[168px] px-3 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                Line item
              </th>
              <th className="min-w-[96px] px-3 py-2 text-right text-[10px] font-semibold">
                <span className="num" style={{ color: A_HUE }}>{aLabel}</span>
                <span className="ml-1 text-[9px] font-normal text-ink3">{aPeriodLabel}</span>
              </th>
              <th className="min-w-[96px] px-3 py-2 text-right text-[10px] font-semibold">
                <span className="num" style={{ color: B_HUE }}>{bLabel}</span>
                <span className="ml-1 text-[9px] font-normal text-ink3">{bPeriodLabel}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.label}-${i}`} className="border-t border-line">
                {labelCell(r.label, r.indent, r.isBold)}
                {valueCell(r.aVal, r.isMargin, r.isBold, "a")}
                {valueCell(r.bVal, r.isMargin, r.isBold, "b")}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Multi-year history expand — unchanged (annual per-stock columns). */}
      {showHistory && (
        <div className="mt-3 space-y-3">
          <PerStockHistory hue={A_HUE} label={aLabel} lines={annualLines} series={aAnnual} />
          <PerStockHistory hue={B_HUE} label={bLabel} lines={annualLines} series={bAnnual} />
        </div>
      )}
    </div>
  );
}

/** A styled native <select> for period picking — one value, applied to both A and B. */
function PeriodSelect({
  value,
  options,
  onChange,
  format,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  format: (v: string) => string;
}) {
  if (options.length === 0) return null;
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-md border border-line bg-surface-2 py-0.5 pl-2.5 pr-7 text-[10.5px] font-medium text-ink2 transition-colors hover:text-ink focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {format(o)}
          </option>
        ))}
      </select>
      <Icons.caretDown className="pointer-events-none absolute right-2 h-3 w-3 text-ink3" />
    </div>
  );
}

/** Union of two ordered period lists, de-duped, sorted newest-first. Fiscal years ("FY26")
 *  and quarter keys ("FY26Q4") both sort correctly as descending strings. */
function unionNewestFirst(xs: string[], ys: string[]): string[] {
  return Array.from(new Set([...xs, ...ys])).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

// ── SAME-FAMILY block ─────────────────────────────────────────────────────────

export function SameFamilyStatements({
  aStatements,
  bStatements,
  aLabel,
  bLabel,
}: {
  aStatements: CompareeStatements;
  bStatements: CompareeStatements;
  aLabel: string;
  bLabel: string;
}) {
  // Same-family ⇒ both share the family; use A's to resolve defs (B matches by contract).
  const defs = defsFor(aStatements.family);
  const aAnnual = aStatements.annualSeries;
  const bAnnual = bStatements.annualSeries;

  // THE SHARED ANNUAL ANCHOR — one fiscal year governs all three annual statements (P&L when
  // its basis is Annual, plus Balance Sheet and Cash Flow always). Picking FY24 moves the whole
  // set to FY24, so you never see a FY24 P&L beside a FY26 balance sheet. UNION of both stocks'
  // years (a year only one has stays pickable; the other side dashes), newest-first, default
  // latest. It stays fixed while the P&L basis is Quarterly, so BS/CF hold a coherent year.
  const annualPeriods = unionNewestFirst(
    aAnnual.map((s) => s.fiscalYear),
    bAnnual.map((s) => s.fiscalYear),
  );
  const [annualSel, setAnnualSel] = useState<string>(annualPeriods[0] ?? "");
  const selectedYear = annualSel || annualPeriods[0] || "";

  return (
    <div className="space-y-6">
      {/* P&L has a basis toggle (Annual ↔ Quarterly) — only the P&L has a quarterly series.
          Its Annual year selector is the SHARED anchor that also drives BS + CF below. */}
      <SameFamilyPL
        annualLines={defs.pl}
        plQuarter={defs.plQuarter}
        aStatements={aStatements}
        bStatements={bStatements}
        aLabel={aLabel}
        bLabel={bLabel}
        annualPeriods={annualPeriods}
        annualSel={selectedYear}
        onAnnualChange={setAnnualSel}
      />
      <SideBySideStatement
        title="Balance Sheet"
        lines={defs.bs}
        aSeries={aAnnual}
        bSeries={bAnnual}
        selectedYear={selectedYear}
        aLabel={aLabel}
        bLabel={bLabel}
      />
      {defs.cf ? (
        <SideBySideStatement
          title="Cash Flow"
          lines={defs.cf}
          aSeries={aAnnual}
          bSeries={bAnnual}
          selectedYear={selectedYear}
          aLabel={aLabel}
          bLabel={bLabel}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-line2 bg-surface-1 px-4 py-4 text-center text-[12px] text-ink3">
          Cash flow is not reported for {aStatements.family === "life_insurance" ? "life" : "general"}{" "}
          insurers — this statement is honestly absent for both.
        </p>
      )}
    </div>
  );
}

// ── CROSS-FAMILY block — each stock's own statements, labeled, not row-aligned ──

function OwnStatements({
  statements,
  label,
  hue,
}: {
  statements: CompareeStatements;
  label: string;
  hue: string;
}) {
  const defs = defsFor(statements.family);
  const familyLabel: Record<CompareeStatements["family"], string> = {
    non_financial: "Non-Financial",
    banking: "Banking",
    nbfc: "NBFC",
    life_insurance: "Life Insurance",
    general_insurance: "General Insurance",
  };
  const periods = statements.quarters.map((q) => shortPeriod(q.periodKey));
  const quarterRows = defs.plQuarter(statements.quarters);

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: hue }} />
        <span className="num text-[13px] font-semibold text-ink">{label}</span>
        <span className="rounded-full bg-line2 px-2 py-0.5 text-[10px] font-medium text-ink3">
          {familyLabel[statements.family]}
        </span>
      </div>
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-[12px] font-semibold text-ink2">Profit &amp; Loss (annual)</h4>
          <PerStockHistory hue={hue} label={label} lines={defs.pl} series={statements.annualSeries} />
        </div>
        <div>
          <h4 className="mb-2 text-[12px] font-semibold text-ink2">Balance Sheet (annual)</h4>
          <PerStockHistory hue={hue} label={label} lines={defs.bs} series={statements.annualSeries} />
        </div>
        {defs.cf && (
          <div>
            <h4 className="mb-2 text-[12px] font-semibold text-ink2">Cash Flow (annual)</h4>
            <PerStockHistory hue={hue} label={label} lines={defs.cf} series={statements.annualSeries} />
          </div>
        )}
        {periods.length > 0 && (
          <PerStockQuarterly hue={hue} label={label} rows={quarterRows} periods={periods} />
        )}
      </div>
    </div>
  );
}

export function CrossFamilyStatements({
  aStatements,
  bStatements,
  aLabel,
  bLabel,
}: {
  aStatements: CompareeStatements;
  bStatements: CompareeStatements;
  aLabel: string;
  bLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <OwnStatements statements={aStatements} label={aLabel} hue={A_HUE} />
      <OwnStatements statements={bStatements} label={bLabel} hue={B_HUE} />
    </div>
  );
}
