// PG Fundamentals tab — derivations + family-aware column sets (JSX cells live here so the
// columns stay declarative). Turns each member's family-dispatched fundamentals read into a
// single family-tagged row. Every value is real-or-null; family-inapplicable metrics are
// ABSENT (no empty columns), genuinely-missing member values render honest "—". NO health
// framing, NO winner, NO buy/sell.

import type { ReactNode } from "react";
import type { FundamentalsView, IndustryFamily } from "@/types/fundamentals";
import type {
  StandingsRow,
  StandingsColumn,
} from "@/components/peer-group/standings-table";

/** One member's fundamentals row — a superset; only the family-applicable fields are
 *  populated (the rest stay null and their columns never appear for that family). */
export interface FundamentalsRow extends StandingsRow {
  family: IndustryFamily | null;
  // growth (YoY — recon: multi-year CAGR not stored, so we use YoY, never fabricate CAGR)
  revenueGrowth: number | null; // nf: revenueGrowthYoy · banking: NII growth YoY
  profitGrowth: number | null; // nf: profitGrowthYoy · banking: patGrowthYoy
  // profitability & returns
  operatingMargin: number | null; // nf only
  netMargin: number | null; // nf: annual · banking: latest quarter (annual has none)
  roe: number | null; // both
  roce: number | null; // nf only
  roa: number | null; // banking only (roaDisclosed)
  nim: number | null; // banking only
  // balance sheet / asset quality / cash
  debtToEquity: number | null; // nf only
  cashConversion: number | null; // nf only — OCF / PAT (ratio)
  gnpa: number | null; // banking only
  costToIncome: number | null; // banking only
}

export const round2 = (x: number) => Math.round(x * 100) / 100;

const n = (x: number | null | undefined): number | null => (x == null ? null : x);

export function deriveFundamentalsRow(
  symbol: string,
  name: string,
  fund: FundamentalsView | null,
  pending: boolean,
): FundamentalsRow {
  const base: FundamentalsRow = {
    symbol,
    name,
    pending,
    family: fund?.family ?? null,
    revenueGrowth: null,
    profitGrowth: null,
    operatingMargin: null,
    netMargin: null,
    roe: null,
    roce: null,
    roa: null,
    nim: null,
    debtToEquity: null,
    cashConversion: null,
    gnpa: null,
    costToIncome: null,
  };
  if (!fund || !fund.built) return base;

  if (fund.family === "non_financial") {
    const a = fund.nonFinancial?.annual;
    if (a) {
      base.revenueGrowth = n(a.revenueGrowthYoy);
      base.profitGrowth = n(a.profitGrowthYoy);
      base.operatingMargin = n(a.operatingMargin);
      base.netMargin = n(a.netMargin);
      base.roe = n(a.roe);
      base.roce = n(a.roce);
      base.debtToEquity = n(a.debtToEquity);
      if (a.cashFromOperating != null && a.netProfit != null && a.netProfit > 0)
        base.cashConversion = round2(a.cashFromOperating / a.netProfit);
    }
  } else if (fund.family === "banking") {
    const a = fund.banking?.annual;
    if (a) {
      base.revenueGrowth = n(a.niiGrowthYoy); // NII is the bank "revenue" proxy
      base.profitGrowth = n(a.patGrowthYoy);
      base.nim = n(a.nim);
      base.gnpa = n(a.gnpaPct);
      base.roe = n(a.roe);
      base.roa = n(a.roaDisclosed);
      base.costToIncome = n(a.costToIncome);
    }
    // banking annual carries no net margin — use the latest quarter (honest basis label).
    const q = fund.banking?.quarters?.at(-1);
    if (q) base.netMargin = n(q.netMargin);
  }

  return base;
}

/** The PG's dominant family — first resolved member. */
export function resolveFamily(rows: FundamentalsRow[]): IndustryFamily | null {
  return rows.find((r) => r.family != null)?.family ?? null;
}

/** Median of the real (non-null) values. */
export function median(values: (number | null)[]): number | null {
  const xs = values.filter((v): v is number => v != null).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

// ── neutral cell formatters (no good/bad colouring — the rule forbids judgment) ──
const Dash = () => <span className="text-ink3">—</span>;

function PctCell({ v, signed = false }: { v: number | null; signed?: boolean }) {
  if (v == null) return <Dash />;
  const s = signed && v > 0 ? "+" : "";
  return <span className="num text-ink">{`${s}${v.toFixed(1)}%`}</span>;
}
function RatioCell({ v }: { v: number | null }) {
  if (v == null) return <Dash />;
  return <span className="num text-ink">{`${v.toFixed(2)}×`}</span>;
}

function col(
  key: string,
  header: string,
  hint: string,
  sortValue: (r: FundamentalsRow) => number | null,
  render: (r: FundamentalsRow) => ReactNode,
  defaultDir: "asc" | "desc" = "desc",
): StandingsColumn<FundamentalsRow> {
  return { key, header, hint, sortValue, render, defaultDir };
}

/** FAMILY-AWARE columns — only the metrics REAL for this family appear; a bank PG never
 *  shows an empty ROCE / D-E column, a non-fin PG never shows NIM / GNPA. */
export function fundamentalsColumns(family: IndustryFamily | null): {
  columns: StandingsColumn<FundamentalsRow>[];
  initialSortKey: string;
} {
  if (family === "banking") {
    return {
      initialSortKey: "roe",
      columns: [
        col("revenueGrowth", "NII growth", "YoY", (r) => r.revenueGrowth, (r) => <PctCell v={r.revenueGrowth} signed />),
        col("profitGrowth", "Profit growth", "YoY", (r) => r.profitGrowth, (r) => <PctCell v={r.profitGrowth} signed />),
        col("nim", "NIM", "%", (r) => r.nim, (r) => <PctCell v={r.nim} />),
        col("gnpa", "GNPA", "%", (r) => r.gnpa, (r) => <PctCell v={r.gnpa} />),
        col("netMargin", "Net margin", "latest Q", (r) => r.netMargin, (r) => <PctCell v={r.netMargin} />),
        col("roe", "ROE", "%", (r) => r.roe, (r) => <PctCell v={r.roe} />),
        col("roa", "ROA", "%", (r) => r.roa, (r) => <PctCell v={r.roa} />),
        col("costToIncome", "Cost/Income", "%", (r) => r.costToIncome, (r) => <PctCell v={r.costToIncome} />, "asc"),
      ],
    };
  }
  // non_financial (and the harmless default for any other family that ever renders here)
  return {
    initialSortKey: "roce",
    columns: [
      col("revenueGrowth", "Rev growth", "YoY", (r) => r.revenueGrowth, (r) => <PctCell v={r.revenueGrowth} signed />),
      col("profitGrowth", "Profit growth", "YoY", (r) => r.profitGrowth, (r) => <PctCell v={r.profitGrowth} signed />),
      col("operatingMargin", "Op margin", "%", (r) => r.operatingMargin, (r) => <PctCell v={r.operatingMargin} />),
      col("netMargin", "Net margin", "%", (r) => r.netMargin, (r) => <PctCell v={r.netMargin} />),
      col("roe", "ROE", "%", (r) => r.roe, (r) => <PctCell v={r.roe} />),
      col("roce", "ROCE", "%", (r) => r.roce, (r) => <PctCell v={r.roce} />),
      col("debtToEquity", "D/E", "×", (r) => r.debtToEquity, (r) => <RatioCell v={r.debtToEquity} />, "asc"),
      col("cashConversion", "Cash conv.", "OCF/PAT", (r) => r.cashConversion, (r) => <RatioCell v={r.cashConversion} />),
    ],
  };
}
