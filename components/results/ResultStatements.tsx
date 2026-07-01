"use client";

/**
 * RESULT-VIEWER statement tables — a FOCUSED result-comparison layout (this vs prior vs
 * year-ago) with growth columns. Viewer-SPECIFIC: it answers "how is THIS result vs the
 * obvious comparisons" — the earnings-analysis triad — NOT the full historical trend table
 * (that's the per-stock Fundamentals page, which is untouched and reuses the same line-defs).
 *
 * It REUSES the shared family line-defs (statement-lines.ts) verbatim — same rows, same
 * grouped hierarchy (bold headers/totals, indented components), same honest "—" — and just
 * renders fewer, focused COLUMNS:
 *   • Quarterly P&L  → This Q | Prev Q | Year-ago Q | QoQ% | YoY%
 *   • Annual P&L / BS / CF → This Year | Prev Year | YoY%
 * Comparison periods resolve by period key / fiscal year; a missing one dashes its value AND
 * its growth (honest — never a fabricated 0% or a divide-by-zero).
 *
 * Growth is a FACT, not a verdict — a rise isn't "good", a fall isn't "bad". Sign carries the
 * direction; colour is a MUTED positive/negative (heavily softened toward ink), never the
 * alarming red/green of a price ticker.
 */

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Panel, tint, shortPeriod } from "@/components/stock-detail/health/shared";
import type { FundamentalsView } from "@/types/fundamentals";
import {
  DASH,
  type StmtRow,
  type AnnualLine,
  type StmtType,
  nfPlQuarterRows,
  nfPlLines,
  nfBsLines,
  nfCfLines,
  bkPlQuarterRows,
  bkPlLines,
  bkBsLines,
  bkCfLines,
  nbfcPlQuarterRows,
  nbfcPlLines,
  nbfcBsLines,
  nbfcCfLines,
  liPlQuarterRows,
  liPlLines,
  liBsLines,
  giPlQuarterRows,
  giPlLines,
  giBsLines,
} from "@/components/stock-detail/statement-lines";

// ── growth: parse the DISPLAYED cell back to a number, compute % change, format ──
// The shared line-defs render every cell through fmtCr / fmtPct / fmtX (₹…Cr, …%, …×) or a
// literal "—" for section headers. Parsing the displayed string keeps growth exactly
// consistent with what the user sees, and needs ZERO change to the shared defs. "—" → null.
function parseStmtCell(s: string): number | null {
  if (s === DASH || s.trim() === "") return null;
  // strip ₹, " Cr", "%", "×", thousands separators; normalise the unicode minus.
  const cleaned = s
    .replace(/₹/g, "")
    .replace(/\s*Cr\s*/gi, "")
    .replace(/%/g, "")
    .replace(/×/g, "")
    .replace(/,/g, "")
    .replace(/−/g, "-")
    .trim();
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** (cur − base) / |base| × 100, guarded: null base / zero base / non-finite → null (honest
 *  dash, never a fake 0% or ∞/NaN). A newly-disclosed line with no prior therefore dashes. */
function growthPct(cur: number | null, base: number | null): number | null {
  if (cur == null || base == null || base === 0) return null;
  const g = ((cur - base) / Math.abs(base)) * 100;
  return Number.isFinite(g) ? g : null;
}

/** Signed "+18.2%" / "−5.4%" / "—". Sign carries direction; no colour here. */
function fmtGrowth(v: number | null): string {
  if (v == null) return DASH;
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(1)}%`;
}

/** MUTED directional tint — a rise/fall read at a glance without the price-ticker alarm.
 *  Softens the semantic tokens heavily toward ink so it stays factual, not a casino signal. */
function growthTone(v: number | null): string {
  if (v == null || v === 0) return "var(--ink3)";
  return v > 0
    ? "color-mix(in oklch, var(--success) 55%, var(--ink2))"
    : "color-mix(in oklch, var(--danger) 55%, var(--ink2))";
}

// ── a focused statement row: labels + N value cells + M growth cells ──────────
type FocusRow = {
  label: string;
  indent?: boolean;
  isBold?: boolean;
  isMargin?: boolean;
  values: string[]; // formatted value columns (2 or 3)
  growth: (number | null)[]; // growth columns (1 for annual, 2 for quarterly)
};

function FocusedTable({
  valueHeaders,
  growthHeaders,
  rows,
  note,
}: {
  valueHeaders: string[];
  growthHeaders: string[];
  rows: FocusRow[];
  note?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[12px] text-ink3">No data available for this statement.</p>;
  }
  return (
    <div>
      {note && <p className="mb-2 text-[11px] italic text-ink3">{note}</p>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="min-w-[168px] px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                Line item
              </th>
              {valueHeaders.map((h) => (
                <th key={h} className="min-w-[96px] px-2 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                  {h}
                </th>
              ))}
              {growthHeaders.map((h) => (
                <th key={h} className="min-w-[76px] px-2 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.label}-${i}`} className="border-t border-line">
                <td
                  className={cn(
                    "px-2 py-[7px] text-left text-[11.5px]",
                    row.indent ? "pl-5 text-ink3" : "text-ink2",
                    row.isBold && "font-semibold text-ink",
                  )}
                >
                  {row.label}
                </td>
                {row.values.map((v, j) => (
                  <td
                    key={`v${j}`}
                    className={cn(
                      "num px-2 py-[7px] text-right",
                      v === DASH ? "text-ink3" : row.isMargin ? "text-ink2" : "text-ink",
                      row.isBold && "font-semibold",
                    )}
                  >
                    {v}
                  </td>
                ))}
                {row.growth.map((g, j) => (
                  <td
                    key={`g${j}`}
                    className="num px-2 py-[7px] text-right text-[11px]"
                    style={{ color: growthTone(g) }}
                  >
                    {fmtGrowth(g)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── build FocusRows from the shared line-defs ─────────────────────────────────

/** Annual (P&L/BS/CF): This Year | Prev Year | YoY%. Reuses the AnnualLine<T> defs verbatim. */
function annualFocusRows<T>(
  lines: AnnualLine<T>[],
  thisSnap: T | null,
  prevSnap: T | null,
): FocusRow[] {
  return lines.map((ln) => {
    const thisStr = thisSnap ? ln.value(thisSnap) : DASH;
    const prevStr = prevSnap ? ln.value(prevSnap) : DASH;
    const yoy = growthPct(parseStmtCell(thisStr), parseStmtCell(prevStr));
    return {
      label: ln.label,
      indent: ln.indent,
      isBold: ln.isBold,
      isMargin: ln.isMargin,
      values: [thisStr, prevStr],
      growth: [yoy],
    };
  });
}

/** Quarterly P&L: This Q | Prev Q | Year-ago Q | QoQ% | YoY%. Reuses the family's quarterly
 *  row-builder (feeding it one quarter yields that quarter's formatted column). The row
 *  STRUCTURE (labels/order/treatment) is identical for any input, so the template comes from
 *  whichever period is present; each period then fills its value or dashes. */
function quarterlyFocusRows(
  buildRows: (qs: never[]) => StmtRow[],
  thisQ: unknown | null,
  prevQ: unknown | null,
  yearAgoQ: unknown | null,
): FocusRow[] {
  const one = (q: unknown | null): StmtRow[] | null =>
    q ? buildRows([q] as never[]) : null;
  const tRows = one(thisQ);
  const pRows = one(prevQ);
  const yRows = one(yearAgoQ);
  const template = tRows ?? pRows ?? yRows ?? [];
  return template.map((r, i) => {
    const tStr = tRows ? tRows[i].values[0] : DASH;
    const pStr = pRows ? pRows[i].values[0] : DASH;
    const yStr = yRows ? yRows[i].values[0] : DASH;
    const tNum = parseStmtCell(tStr);
    const qoq = growthPct(tNum, parseStmtCell(pStr));
    const yoy = growthPct(tNum, parseStmtCell(yStr));
    return {
      label: r.label,
      indent: r.indent,
      isBold: r.isBold,
      isMargin: r.isMargin,
      values: [tStr, pStr, yStr],
      growth: [qoq, yoy],
    };
  });
}

// ── period resolution ─────────────────────────────────────────────────────────

/** "FY26Q4" → { prevKey: "FY26Q3", yearAgoKey: "FY25Q4" }. Q1→prev is Q4 of the prior FY. */
function quarterlyNeighbors(periodKey: string): { prevKey: string | null; yearAgoKey: string | null } {
  const m = periodKey.match(/^FY(\d{2})Q([1-4])$/);
  if (!m) return { prevKey: null, yearAgoKey: null };
  const fy = Number(m[1]);
  const q = Number(m[2]);
  const prevKey = q === 1 ? `FY${String(fy - 1).padStart(2, "0")}Q4` : `FY${m[1]}Q${q - 1}`;
  const yearAgoKey = `FY${String(fy - 1).padStart(2, "0")}Q${q}`;
  return { prevKey, yearAgoKey };
}

/** "FY26" → "FY25". null on malformed. */
function prevFiscalYear(fy: string): string | null {
  const m = fy.match(/^FY(\d{2})$/);
  if (!m) return null;
  return `FY${String(Number(m[1]) - 1).padStart(2, "0")}`;
}

// ── per-family defs bundle ─────────────────────────────────────────────────────
type FamilyDefs = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plLines: AnnualLine<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bsLines: AnnualLine<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cfLines: AnnualLine<any>[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plQuarter: (qs: any[]) => StmtRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quarters: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  annualSeries: any[];
};

function defsFor(view: FundamentalsView): FamilyDefs | null {
  switch (view.family) {
    case "non_financial":
      return view.nonFinancial
        ? { plLines: nfPlLines, bsLines: nfBsLines, cfLines: nfCfLines, plQuarter: nfPlQuarterRows, quarters: view.nonFinancial.quarters, annualSeries: view.nonFinancial.annualSeries }
        : null;
    case "banking":
      return view.banking
        ? { plLines: bkPlLines, bsLines: bkBsLines, cfLines: bkCfLines, plQuarter: bkPlQuarterRows, quarters: view.banking.quarters, annualSeries: view.banking.annualSeries }
        : null;
    case "nbfc":
      return view.nbfc
        ? { plLines: nbfcPlLines, bsLines: nbfcBsLines, cfLines: nbfcCfLines, plQuarter: nbfcPlQuarterRows, quarters: view.nbfc.quarters, annualSeries: view.nbfc.annualSeries }
        : null;
    case "life_insurance":
      return view.lifeInsurance
        ? { plLines: liPlLines, bsLines: liBsLines, cfLines: null, plQuarter: liPlQuarterRows, quarters: view.lifeInsurance.quarters, annualSeries: view.lifeInsurance.annualSeries }
        : null;
    case "general_insurance":
      return view.generalInsurance
        ? { plLines: giPlLines, bsLines: giBsLines, cfLines: null, plQuarter: giPlQuarterRows, quarters: view.generalInsurance.quarters, annualSeries: view.generalInsurance.annualSeries }
        : null;
    default:
      return null;
  }
}

// ── statement type tabs (P&L / Balance Sheet / Cash Flow) ─────────────────────
function StmtTabs({
  active,
  onChange,
  tabs,
}: {
  active: StmtType;
  onChange: (t: StmtType) => void;
  tabs: { id: StmtType; label: string }[];
}) {
  return (
    <div className="mb-4 inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
            active === t.id ? "bg-surface-3 text-ink" : "cursor-pointer text-ink3 hover:text-ink2",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

const ACCENT = "var(--p-found)";
const HAS_CF = new Set(["non_financial", "banking", "nbfc"]);

/**
 * The focused Result-Viewer statements. `anchorPeriodKey` (the viewed result's period,
 * e.g. FY26Q4) drives the "this quarter" column; `anchorFiscalYear` drives "this year".
 */
export function ResultStatements({
  view,
  anchorPeriodKey,
  anchorFiscalYear,
}: {
  view: FundamentalsView;
  anchorPeriodKey: string; // the viewed result's periodKey (e.g. "FY26Q4")
  anchorFiscalYear: string; // the viewed result's fiscalYear (e.g. "FY26")
}) {
  const [open, setOpen] = useState(true);
  const [stmt, setStmt] = useState<StmtType>("pl");

  const defs = defsFor(view);

  const tabs: { id: StmtType; label: string }[] = [
    { id: "pl", label: "Profit & Loss" },
    { id: "bs", label: "Balance Sheet" },
    ...(HAS_CF.has(view.family) ? [{ id: "cf" as StmtType, label: "Cash Flow" }] : []),
  ];
  const activeStmt = tabs.some((t) => t.id === stmt) ? stmt : "pl";

  // Is the viewed result a quarter (so the P&L gets the 3-column quarterly triad) or an
  // annual/Q4 anchor? The P&L quarterly view uses the quarters[] triad; BS/CF are annual-only.
  const isQuarterAnchor = /^FY\d{2}Q[1-4]$/.test(anchorPeriodKey);

  return (
    <section>
      {/* Collapsible eyebrow — mirrors the per-stock page's Financial-statements section. */}
      <div
        className="mb-4 mt-8 flex cursor-pointer select-none items-center gap-2.5"
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border" style={tint(ACCENT) as CSSProperties}>
          <Icons.stack weight="duotone" className="h-4 w-4" />
        </span>
        <span className="eyebrow shrink-0">Financial statements</span>
        <span className="h-px flex-1" style={{ background: `color-mix(in oklch, ${ACCENT} 20%, var(--line))` }} />
        <span className="num shrink-0 rounded-full border px-2.5 py-1 text-[11px] tracking-normal" style={tint(ACCENT, 10, 26) as CSSProperties}>
          This vs prior · year-ago
        </span>
        <Icons.caretDown className={cn("h-4 w-4 shrink-0 text-ink3 transition-transform duration-200", !open && "-rotate-90")} />
      </div>

      {open && (
        <Panel>
          <p className="mb-4 text-[11.5px] text-ink3">
            This result against its obvious comparisons — the prior period and the year-ago period —
            with growth. "—" means not separately disclosed, or no comparison period on file. Growth is
            a fact, not a verdict.
          </p>
          <StmtTabs active={activeStmt} onChange={setStmt} tabs={tabs} />
          {defs ? (
            <StmtBody
              defs={defs}
              stmt={activeStmt}
              family={view.family}
              anchorPeriodKey={anchorPeriodKey}
              anchorFiscalYear={anchorFiscalYear}
              isQuarterAnchor={isQuarterAnchor}
            />
          ) : (
            <p className="py-6 text-center text-[12px] text-ink3">Financial statements for this sector are being built.</p>
          )}
        </Panel>
      )}
    </section>
  );
}

function StmtBody({
  defs,
  stmt,
  family,
  anchorPeriodKey,
  anchorFiscalYear,
  isQuarterAnchor,
}: {
  defs: FamilyDefs;
  stmt: StmtType;
  family: string;
  anchorPeriodKey: string;
  anchorFiscalYear: string;
  isQuarterAnchor: boolean;
}) {
  // Insurers have no CF (honest absence).
  if (stmt === "cf" && !defs.cfLines) {
    return (
      <p className="py-6 text-center text-[12px] text-ink3">
        Cash flow is not reported for {family === "life_insurance" ? "life" : "general"} insurers — this
        statement is honestly absent.
      </p>
    );
  }

  // ── QUARTERLY P&L — This Q | Prev Q | Year-ago Q | QoQ% | YoY% ──
  if (stmt === "pl" && isQuarterAnchor) {
    const { prevKey, yearAgoKey } = quarterlyNeighbors(anchorPeriodKey);
    const byKey = (k: string | null) => (k ? defs.quarters.find((q) => q.periodKey === k) ?? null : null);
    const thisQ = byKey(anchorPeriodKey);
    const prevQ = byKey(prevKey);
    const yearAgoQ = byKey(yearAgoKey);
    if (!thisQ && !prevQ && !yearAgoQ) {
      return (
        <p className="py-6 text-center text-[12px] text-ink3">
          The viewed quarter isn&apos;t in the fundamentals series yet — statements will fill in once it
          is ingested.
        </p>
      );
    }
    const rows = quarterlyFocusRows(defs.plQuarter, thisQ, prevQ, yearAgoQ);
    return (
      <FocusedTable
        valueHeaders={[
          shortPeriod(anchorPeriodKey),
          prevKey ? shortPeriod(prevKey) : "Prev Q",
          yearAgoKey ? shortPeriod(yearAgoKey) : "Year ago",
        ]}
        growthHeaders={["QoQ %", "YoY %"]}
        rows={rows}
      />
    );
  }

  // ── ANNUAL (P&L when annual/Q4 anchor, or BS / CF) — This Year | Prev Year | YoY% ──
  // Anchor to the viewed FY when it exists in the series, else the latest annual year.
  const series = defs.annualSeries;
  const anchoredSnap = series.find((a) => a.fiscalYear === anchorFiscalYear) ?? null;
  const thisSnap = anchoredSnap ?? (series.length ? series[series.length - 1] : null);
  const thisFy = thisSnap?.fiscalYear ?? anchorFiscalYear;
  const prevFy = prevFiscalYear(thisFy);
  const prevSnap = prevFy ? series.find((a) => a.fiscalYear === prevFy) ?? null : null;

  if (!thisSnap) {
    return <p className="py-6 text-center text-[12px] text-ink3">No annual figures available.</p>;
  }

  const lines = stmt === "pl" ? defs.plLines : stmt === "bs" ? defs.bsLines : defs.cfLines!;
  const rows = annualFocusRows(lines, thisSnap, prevSnap);
  const note =
    stmt === "pl" && isQuarterAnchor
      ? "The viewed result is a quarter; the annual statements show its fiscal year (full-year), latest on file."
      : undefined;

  return (
    <FocusedTable
      valueHeaders={[thisFy, prevFy ?? "Prev Yr"]}
      growthHeaders={["YoY %"]}
      rows={rows}
      note={note}
    />
  );
}
