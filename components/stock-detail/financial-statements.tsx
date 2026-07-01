"use client";

/**
 * Financial statements section — the VERIFICATION FLOOR beneath the interpretation cards.
 * Renders the three raw statement tables (P&L, Balance Sheet, Cash Flow) in a
 * collapsible section, open by default. Family-aware: each family gets its own row set
 * drawn from its real payload fields. Honest "—" for every null; no fabrication.
 *
 * Layout: periods as columns, line-items as rows (standard statement orientation).
 * Quarterly P&L: last 8 quarters visible, show-all toggle. Annual P&L / Balance Sheet /
 * Cash Flow render the annualSeries (oldest→newest), last 5 years visible with a show-all
 * toggle. Honest "—" per null cell, per year — a year that didn't disclose a line dashes
 * it. A stock with one year on file shows a single column (narrow, not broken).
 */

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Panel, shortPeriod, tint } from "./health/shared";
import type {
  FundamentalsView,
  AnnualSnapshot,
  QuarterPoint,
  BankingQuarter,
  BankingAnnual,
  NbfcQuarter,
  NbfcAnnual,
  LifeInsuranceQuarter,
  LifeInsuranceAnnual,
  GeneralInsuranceQuarter,
  GeneralInsuranceAnnual,
} from "@/types/fundamentals";
// The statement row-structure (labels, ordering, grouped hierarchy, indent/bold treatment)
// + the cell formatters live in the SHARED statement-lines module — the single source of
// truth reused by the comparison Fundamentals tab. This component owns only the table
// CHROME (tabs, windowing, show-all) and wires the shared line-defs into it.
import {
  DASH,
  type StmtRow,
  type AnnualLine,
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
} from "./statement-lines";

// ── generic multi-period statement table (periods as columns) ─────────────────
// `highlightPeriod` (optional) marks ONE column — the Result Viewer's anchor period — so
// the viewed filing's column stands out (same calm bg-surface-2 the spine's current row uses).
function StmtTable({
  periods,
  rows,
  note,
  highlightPeriod,
}: {
  periods: string[];
  rows: StmtRow[];
  note?: string;
  highlightPeriod?: string;
}) {
  if (periods.length === 0) {
    return <p className="py-6 text-center text-[12px] text-ink3">No data available for this statement.</p>;
  }
  const hlIdx = highlightPeriod ? periods.indexOf(highlightPeriod) : -1;
  return (
    <div>
      {note && <p className="mb-2 text-[11px] text-ink3 italic">{note}</p>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="min-w-[168px] px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink3">
                Line item
              </th>
              {periods.map((p, j) => (
                <th
                  key={p}
                  className={cn(
                    "min-w-[88px] px-2 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide",
                    j === hlIdx ? "bg-surface-2 text-ink2" : "text-ink3",
                  )}
                >
                  {p}
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
                    key={j}
                    className={cn(
                      "num px-2 py-[7px] text-right",
                      v === DASH ? "text-ink3" : row.isMargin ? "text-ink2" : "text-ink",
                      row.isBold && "font-semibold",
                      j === hlIdx && "bg-surface-2",
                    )}
                  >
                    {v}
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

// ── windowing constants ───────────────────────────────────────────────────────
const MAX_Q = 8;
const MAX_YEARS = 5;

// ── quarterly P&L anchor helper (Result Viewer) ───────────────────────────────
// Given the full quarters (oldest→newest) + an anchor periodKey, decide whether the anchor
// falls outside the default last-MAX_Q window (→ start expanded) and return the anchor's
// display label for column highlighting. Shared by every family's quarterly P&L branch.
function quarterlyAnchor(
  quarters: { periodKey: string }[],
  anchorPeriodKey?: string,
): { startExpanded: boolean; highlightLabel?: string } {
  if (!anchorPeriodKey) return { startExpanded: false };
  const exists = quarters.some((q) => q.periodKey === anchorPeriodKey);
  if (!exists) return { startExpanded: false }; // viewed period not in the series → no anchor
  const inWindow = quarters.slice(-MAX_Q).some((q) => q.periodKey === anchorPeriodKey);
  return { startExpanded: !inWindow, highlightLabel: shortPeriod(anchorPeriodKey) };
}

// ── show-all toggle (quarters or years) ───────────────────────────────────────
function ShowAllToggle({
  total,
  max,
  unit,
  showAll,
  onToggle,
}: {
  total: number;
  max: number;
  unit: string;
  showAll: boolean;
  onToggle: () => void;
}) {
  if (total <= max) return null;
  return (
    <button
      onClick={onToggle}
      className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[11.5px] text-ink2 transition-colors hover:text-ink"
    >
      {showAll ? "Show recent only" : `Show all ${total} ${unit}`}
      <Icons.caretDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
    </button>
  );
}

// ── annual statement table — one line-def per row, mapped across every year ────
// Each year of the (oldest→newest) series becomes a COLUMN, exactly like the quarterly
// table does with quarters: last MAX_YEARS visible, show-all expands the rest. A
// single-year stock renders one column. Honest "—" per null cell (the line-def's value()
// returns DASH for that year). AnnualLine<T> is imported from the shared statement-lines module.
function buildAnnualRows<T>(items: T[], lines: AnnualLine<T>[]): StmtRow[] {
  return lines.map((ln) => ({
    label: ln.label,
    values: items.map(ln.value),
    indent: ln.indent,
    isMargin: ln.isMargin,
    isBold: ln.isBold,
  }));
}

function AnnualStmtTable<T extends { fiscalYear: string }>({
  series,
  lines,
  note,
  highlightYear,
}: {
  series: T[]; // oldest → newest
  lines: AnnualLine<T>[];
  note?: string;
  /** Result Viewer anchor: the viewed result's fiscalYear. When it falls outside the default
   *  last-MAX_YEARS window, the table opens expanded so the anchored year is visible. */
  highlightYear?: string;
}) {
  // Anchored year outside the default window → start expanded so it's on screen.
  const anchorOutOfWindow =
    highlightYear != null &&
    series.length > MAX_YEARS &&
    series.slice(-MAX_YEARS).every((a) => a.fiscalYear !== highlightYear) &&
    series.some((a) => a.fiscalYear === highlightYear);
  const [showAll, setShowAll] = useState(anchorOutOfWindow);
  if (series.length === 0) {
    return <p className="py-6 text-center text-[12px] text-ink3">No annual figures available.</p>;
  }
  const visible = showAll ? series : series.slice(-MAX_YEARS);
  return (
    <div>
      <StmtTable
        periods={visible.map((a) => a.fiscalYear)}
        rows={buildAnnualRows(visible, lines)}
        note={note}
        highlightPeriod={highlightYear}
      />
      <ShowAllToggle total={series.length} max={MAX_YEARS} unit="years" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
    </div>
  );
}

// ── statement type tabs ───────────────────────────────────────────────────────
type StmtType = "pl" | "bs" | "cf";

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
            active === t.id
              ? "bg-surface-3 text-ink"
              : "cursor-pointer text-ink3 hover:text-ink2",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── quarterly / annual sub-toggle ─────────────────────────────────────────────
function PeriodToggle({
  active,
  onChange,
}: {
  active: "q" | "a";
  onChange: (p: "q" | "a") => void;
}) {
  return (
    <div className="mb-3 inline-flex rounded-md border border-line bg-surface-2 p-0.5">
      {(["q", "a"] as const).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded px-2.5 py-0.5 text-[10.5px] font-medium transition-colors",
            active === p ? "bg-surface-3 text-ink" : "cursor-pointer text-ink3 hover:text-ink2",
          )}
        >
          {p === "q" ? "Quarterly" : "Annual"}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Non-financial statements
// ════════════════════════════════════════════════════════════════════════════

function NfPL({
  quarters,
  annualSeries,
  anchorPeriodKey,
  anchorFiscalYear,
}: {
  quarters: QuarterPoint[];
  annualSeries: AnnualSnapshot[];
  anchorPeriodKey?: string;
  anchorFiscalYear?: string;
}) {
  const anchor = quarterlyAnchor(quarters, anchorPeriodKey);
  const [mode, setMode] = useState<"q" | "a">("q");
  const [showAll, setShowAll] = useState(anchor.startExpanded);

  if (mode === "q") {
    const qVisible = showAll ? quarters : quarters.slice(-MAX_Q);
    return (
      <div>
        <PeriodToggle active={mode} onChange={setMode} />
        <StmtTable periods={qVisible.map((q) => shortPeriod(q.periodKey))} rows={nfPlQuarterRows(qVisible)} highlightPeriod={anchor.highlightLabel} />
        <ShowAllToggle total={quarters.length} max={MAX_Q} unit="quarters" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
      </div>
    );
  }

  return (
    <div>
      <PeriodToggle active={mode} onChange={setMode} />
      <AnnualStmtTable series={annualSeries} lines={nfPlLines} highlightYear={anchorFiscalYear} />
    </div>
  );
}

function NfBS({ annualSeries, anchorFiscalYear }: { annualSeries: AnnualSnapshot[]; anchorFiscalYear?: string }) {
  return (
    <AnnualStmtTable
      series={annualSeries}
      lines={nfBsLines}
      note={'"—" means not separately disclosed in the filing.'}
      highlightYear={anchorFiscalYear}
    />
  );
}

function NfCF({ annualSeries, anchorFiscalYear }: { annualSeries: AnnualSnapshot[]; anchorFiscalYear?: string }) {
  return <AnnualStmtTable series={annualSeries} lines={nfCfLines} highlightYear={anchorFiscalYear} />;
}

// ════════════════════════════════════════════════════════════════════════════
// Banking statements
// ════════════════════════════════════════════════════════════════════════════

function BkPL({
  quarters,
  annualSeries,
  anchorPeriodKey,
  anchorFiscalYear,
}: {
  quarters: BankingQuarter[];
  annualSeries: BankingAnnual[];
  anchorPeriodKey?: string;
  anchorFiscalYear?: string;
}) {
  const anchor = quarterlyAnchor(quarters, anchorPeriodKey);
  const [mode, setMode] = useState<"q" | "a">("q");
  const [showAll, setShowAll] = useState(anchor.startExpanded);

  if (mode === "q") {
    const qVisible = showAll ? quarters : quarters.slice(-MAX_Q);
    return (
      <div>
        <PeriodToggle active={mode} onChange={setMode} />
        <StmtTable periods={qVisible.map((q) => shortPeriod(q.periodKey))} rows={bkPlQuarterRows(qVisible)} highlightPeriod={anchor.highlightLabel} />
        <ShowAllToggle total={quarters.length} max={MAX_Q} unit="quarters" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
      </div>
    );
  }

  return (
    <div>
      <PeriodToggle active={mode} onChange={setMode} />
      <AnnualStmtTable series={annualSeries} lines={bkPlLines} highlightYear={anchorFiscalYear} />
    </div>
  );
}

function BkBS({ annualSeries, anchorFiscalYear }: { annualSeries: BankingAnnual[]; anchorFiscalYear?: string }) {
  return <AnnualStmtTable series={annualSeries} lines={bkBsLines} highlightYear={anchorFiscalYear} />;
}

function BkCF({ annualSeries, anchorFiscalYear }: { annualSeries: BankingAnnual[]; anchorFiscalYear?: string }) {
  return <AnnualStmtTable series={annualSeries} lines={bkCfLines} highlightYear={anchorFiscalYear} />;
}

// ════════════════════════════════════════════════════════════════════════════
// NBFC statements
// ════════════════════════════════════════════════════════════════════════════

function NbfcPL({
  quarters,
  annualSeries,
  anchorPeriodKey,
  anchorFiscalYear,
}: {
  quarters: NbfcQuarter[];
  annualSeries: NbfcAnnual[];
  anchorPeriodKey?: string;
  anchorFiscalYear?: string;
}) {
  const anchor = quarterlyAnchor(quarters, anchorPeriodKey);
  const [mode, setMode] = useState<"q" | "a">("q");
  const [showAll, setShowAll] = useState(anchor.startExpanded);

  if (mode === "q") {
    const qVisible = showAll ? quarters : quarters.slice(-MAX_Q);
    return (
      <div>
        <PeriodToggle active={mode} onChange={setMode} />
        <StmtTable periods={qVisible.map((q) => shortPeriod(q.periodKey))} rows={nbfcPlQuarterRows(qVisible)} highlightPeriod={anchor.highlightLabel} />
        <ShowAllToggle total={quarters.length} max={MAX_Q} unit="quarters" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
      </div>
    );
  }

  return (
    <div>
      <PeriodToggle active={mode} onChange={setMode} />
      <AnnualStmtTable series={annualSeries} lines={nbfcPlLines} highlightYear={anchorFiscalYear} />
    </div>
  );
}

function NbfcBS({ annualSeries, anchorFiscalYear }: { annualSeries: NbfcAnnual[]; anchorFiscalYear?: string }) {
  return (
    <AnnualStmtTable
      series={annualSeries}
      lines={nbfcBsLines}
      note={'Non-deposit-taking NBFCs show "—" for deposits liabilities.'}
      highlightYear={anchorFiscalYear}
    />
  );
}

function NbfcCF({ annualSeries, anchorFiscalYear }: { annualSeries: NbfcAnnual[]; anchorFiscalYear?: string }) {
  return <AnnualStmtTable series={annualSeries} lines={nbfcCfLines} highlightYear={anchorFiscalYear} />;
}

// ════════════════════════════════════════════════════════════════════════════
// Life Insurance statements
// ════════════════════════════════════════════════════════════════════════════

function LiPL({
  quarters,
  annualSeries,
  anchorPeriodKey,
  anchorFiscalYear,
}: {
  quarters: LifeInsuranceQuarter[];
  annualSeries: LifeInsuranceAnnual[];
  anchorPeriodKey?: string;
  anchorFiscalYear?: string;
}) {
  const anchor = quarterlyAnchor(quarters, anchorPeriodKey);
  const [mode, setMode] = useState<"q" | "a">("q");
  const [showAll, setShowAll] = useState(anchor.startExpanded);

  if (mode === "q") {
    const qVisible = showAll ? quarters : quarters.slice(-MAX_Q);
    return (
      <div>
        <PeriodToggle active={mode} onChange={setMode} />
        <StmtTable
          periods={qVisible.map((q) => shortPeriod(q.periodKey))}
          rows={liPlQuarterRows(qVisible)}
          note="Income from investments and change in valuation of liabilities can be negative (mark-to-market)."
          highlightPeriod={anchor.highlightLabel}
        />
        <ShowAllToggle total={quarters.length} max={MAX_Q} unit="quarters" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
      </div>
    );
  }

  return (
    <div>
      <PeriodToggle active={mode} onChange={setMode} />
      <AnnualStmtTable
        series={annualSeries}
        lines={liPlLines}
        note="Income from investments and change in valuation of liabilities can be negative (mark-to-market)."
        highlightYear={anchorFiscalYear}
      />
    </div>
  );
}

function LiBS({ annualSeries, anchorFiscalYear }: { annualSeries: LifeInsuranceAnnual[]; anchorFiscalYear?: string }) {
  return <AnnualStmtTable series={annualSeries} lines={liBsLines} highlightYear={anchorFiscalYear} />;
}

// ════════════════════════════════════════════════════════════════════════════
// General Insurance statements
// ════════════════════════════════════════════════════════════════════════════

function GiPL({
  quarters,
  annualSeries,
  anchorPeriodKey,
  anchorFiscalYear,
}: {
  quarters: GeneralInsuranceQuarter[];
  annualSeries: GeneralInsuranceAnnual[];
  anchorPeriodKey?: string;
  anchorFiscalYear?: string;
}) {
  const anchor = quarterlyAnchor(quarters, anchorPeriodKey);
  const [mode, setMode] = useState<"q" | "a">("q");
  const [showAll, setShowAll] = useState(anchor.startExpanded);

  if (mode === "q") {
    const qVisible = showAll ? quarters : quarters.slice(-MAX_Q);
    return (
      <div>
        <PeriodToggle active={mode} onChange={setMode} />
        <StmtTable
          periods={qVisible.map((q) => shortPeriod(q.periodKey))}
          rows={giPlQuarterRows(qVisible)}
          note="Combined ratio above 100% = underwriting loss before investment income. Underwriting profit/loss can be negative."
          highlightPeriod={anchor.highlightLabel}
        />
        <ShowAllToggle total={quarters.length} max={MAX_Q} unit="quarters" showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
      </div>
    );
  }

  return (
    <div>
      <PeriodToggle active={mode} onChange={setMode} />
      <AnnualStmtTable
        series={annualSeries}
        lines={giPlLines}
        note="Combined ratio above 100% = underwriting loss before investment income. Underwriting profit/loss can be negative."
        highlightYear={anchorFiscalYear}
      />
    </div>
  );
}

function GiBS({ annualSeries, anchorFiscalYear }: { annualSeries: GeneralInsuranceAnnual[]; anchorFiscalYear?: string }) {
  return (
    <AnnualStmtTable
      series={annualSeries}
      lines={giBsLines}
      note="Investments is its own line — not reconciled against total assets (GI convention)."
      highlightYear={anchorFiscalYear}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Family dispatcher
// ════════════════════════════════════════════════════════════════════════════

function StmtContent({
  view,
  stmt,
  anchorPeriodKey,
  anchorFiscalYear,
}: {
  view: FundamentalsView;
  stmt: StmtType;
  anchorPeriodKey?: string;
  anchorFiscalYear?: string;
}) {
  if (view.family === "non_financial" && view.nonFinancial) {
    const nf = view.nonFinancial;
    if (stmt === "pl") return <NfPL quarters={nf.quarters} annualSeries={nf.annualSeries} anchorPeriodKey={anchorPeriodKey} anchorFiscalYear={anchorFiscalYear} />;
    if (stmt === "bs") return <NfBS annualSeries={nf.annualSeries} anchorFiscalYear={anchorFiscalYear} />;
    return <NfCF annualSeries={nf.annualSeries} anchorFiscalYear={anchorFiscalYear} />;
  }
  if (view.family === "banking" && view.banking) {
    const bk = view.banking;
    if (stmt === "pl") return <BkPL quarters={bk.quarters} annualSeries={bk.annualSeries} anchorPeriodKey={anchorPeriodKey} anchorFiscalYear={anchorFiscalYear} />;
    if (stmt === "bs") return <BkBS annualSeries={bk.annualSeries} anchorFiscalYear={anchorFiscalYear} />;
    return <BkCF annualSeries={bk.annualSeries} anchorFiscalYear={anchorFiscalYear} />;
  }
  if (view.family === "nbfc" && view.nbfc) {
    const nb = view.nbfc;
    if (stmt === "pl") return <NbfcPL quarters={nb.quarters} annualSeries={nb.annualSeries} anchorPeriodKey={anchorPeriodKey} anchorFiscalYear={anchorFiscalYear} />;
    if (stmt === "bs") return <NbfcBS annualSeries={nb.annualSeries} anchorFiscalYear={anchorFiscalYear} />;
    return <NbfcCF annualSeries={nb.annualSeries} anchorFiscalYear={anchorFiscalYear} />;
  }
  if (view.family === "life_insurance" && view.lifeInsurance) {
    const li = view.lifeInsurance;
    if (stmt === "pl") return <LiPL quarters={li.quarters} annualSeries={li.annualSeries} anchorPeriodKey={anchorPeriodKey} anchorFiscalYear={anchorFiscalYear} />;
    if (stmt === "bs") return <LiBS annualSeries={li.annualSeries} anchorFiscalYear={anchorFiscalYear} />;
    return <p className="py-6 text-center text-[12px] text-ink3">Cash flow is not served for life insurance.</p>;
  }
  if (view.family === "general_insurance" && view.generalInsurance) {
    const gi = view.generalInsurance;
    if (stmt === "pl") return <GiPL quarters={gi.quarters} annualSeries={gi.annualSeries} anchorPeriodKey={anchorPeriodKey} anchorFiscalYear={anchorFiscalYear} />;
    if (stmt === "bs") return <GiBS annualSeries={gi.annualSeries} anchorFiscalYear={anchorFiscalYear} />;
    return <p className="py-6 text-center text-[12px] text-ink3">Cash flow is not served for general insurance.</p>;
  }
  return (
    <p className="py-6 text-center text-[12px] text-ink3">
      Financial statements for this sector are being built.
    </p>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Main export — collapsible eyebrow + Panel with tabs
// ════════════════════════════════════════════════════════════════════════════

const ACCENT = "var(--p-found)";
const HAS_CF = new Set(["non_financial", "banking", "nbfc"]);

export function FinancialStatements({
  view,
  anchorPeriodKey,
  anchorFiscalYear,
}: {
  view: FundamentalsView;
  /** Result Viewer only: the viewed filing's periodKey (highlights that quarterly column and
   *  opens the quarterly window to include it). Omitted on the per-stock page → latest-default. */
  anchorPeriodKey?: string;
  /** Result Viewer only: the viewed filing's fiscalYear (highlights that year's column in the
   *  annual P&L/BS/CF and opens the window to include it). */
  anchorFiscalYear?: string;
}) {
  const [open, setOpen] = useState(true);
  const [stmt, setStmt] = useState<StmtType>("pl");

  const tabs: { id: StmtType; label: string }[] = [
    { id: "pl", label: "Profit & Loss" },
    { id: "bs", label: "Balance Sheet" },
    ...(HAS_CF.has(view.family) ? [{ id: "cf" as StmtType, label: "Cash Flow" }] : []),
  ];

  // Switch to P&L if CF tab disappears (family switch)
  const activeStmt = tabs.some((t) => t.id === stmt) ? stmt : "pl";

  return (
    <section>
      {/* Collapsible eyebrow — mirrors SectionEyebrow markup exactly, with a caret added */}
      <div
        className="mb-4 mt-8 flex cursor-pointer select-none items-center gap-2.5"
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
      >
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border"
          style={tint(ACCENT) as CSSProperties}
        >
          <Icons.stack weight="duotone" className="h-4 w-4" />
        </span>
        <span className="eyebrow shrink-0">Financial statements</span>
        <span
          className="h-px flex-1"
          style={{ background: `color-mix(in oklch, ${ACCENT} 20%, var(--line))` }}
        />
        <span
          className="num shrink-0 rounded-full border px-2.5 py-1 text-[11px] tracking-normal"
          style={tint(ACCENT, 10, 26) as CSSProperties}
        >
          Raw figures
        </span>
        <Icons.caretDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink3 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
      </div>

      {open && (
        <Panel>
          <p className="mb-4 text-[11.5px] text-ink3">
            The reported figures, as filed — verify the analysis above against the source. "—" means
            not separately disclosed in the filing.
            {anchorPeriodKey && (
              <> The period you&apos;re viewing is highlighted.</>
            )}
          </p>
          <StmtTabs active={activeStmt} onChange={setStmt} tabs={tabs} />
          <StmtContent
            view={view}
            stmt={activeStmt}
            anchorPeriodKey={anchorPeriodKey}
            anchorFiscalYear={anchorFiscalYear}
          />
        </Panel>
      )}
    </section>
  );
}
