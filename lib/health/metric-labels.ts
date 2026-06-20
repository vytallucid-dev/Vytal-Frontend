export interface MetricMeta {
  label: string;
  unit?: string;
}

// Flat map is sufficient — metric codes don't overlap between banking and non-financial PGs.
// Banking PG5/PG6 use named codes (GNPA, CASA…); non-financial use F1–F10 / M1–M5.
const METRIC_MAP: Record<string, MetricMeta> = {
  // ── Foundation: Non-financial (PG1–PG4, PG7–PG11) ─────────────────────────
  F1:         { label: "ROCE",                       unit: "%" },
  F2:         { label: "ROE",                        unit: "%" },
  F3:         { label: "Cash Conversion",            unit: "ratio" },
  F4:         { label: "Debt / Equity",              unit: "ratio" },
  F5:         { label: "Interest Coverage",          unit: "×" },
  F6:         { label: "Receivables Days",           unit: "days" },
  F7:         { label: "Asset Turnover",             unit: "×" },
  F8:         { label: "FCF / PAT (4y avg)",         unit: "ratio" },
  F9:         { label: "OCF Consistency",            unit: "%" },
  F10:        { label: "Revenue 3y CAGR",            unit: "%" },
  F1_OPM:     { label: "Operating Margin",           unit: "%" },  // PG8 power/utilities override

  // ── Foundation: Banking (PG5 private / PG6 PSU) ────────────────────────────
  Tier1:      { label: "Tier-1 Capital",             unit: "%" },
  GNPA:       { label: "Gross NPA",                  unit: "%" },
  NNPA:       { label: "Net NPA",                    unit: "%" },
  PCR:        { label: "Provision Coverage",         unit: "%" },
  ROA:        { label: "Return on Assets",           unit: "%" },
  CI:         { label: "Cost-to-Income",             unit: "%" },
  CASA:       { label: "CASA Ratio",                 unit: "%" },

  // ── Momentum: Non-financial (M1–M5) ────────────────────────────────────────
  M1:         { label: "Operating Margin (TTM)",     unit: "%" },
  M2:         { label: "Net Margin (TTM)",           unit: "%" },
  M3:         { label: "Revenue YoY (TTM)",          unit: "%" },
  M4:         { label: "Net Profit YoY (TTM)",       unit: "%" },
  M5:         { label: "Interest Coverage (TTM)",    unit: "×" },
  M1_OPM_TTM: { label: "Operating Margin (TTM)",     unit: "%" },  // PG8 override

  // ── Momentum: Banking ──────────────────────────────────────────────────────
  NIM:        { label: "Net Interest Margin (TTM)",  unit: "%" },
  PPOP:       { label: "Pre-Provision Profit YoY",   unit: "%" },
  NII:        { label: "Net Interest Income YoY",    unit: "%" },
  NPyoy:      { label: "Net Profit YoY",             unit: "%" },
  GNPAttm:    { label: "Gross NPA (TTM)",            unit: "%" },
};

// Market sub-components — universal across all PGs
const MARKET_SUB_MAP: Record<string, MetricMeta> = {
  A1: { label: "52-week Range Position",         unit: "%" },
  A2: { label: "3-year Range Position",          unit: "%" },
  B1: { label: "Position vs 200-Day MA",         unit: "%" },
  B2: { label: "Quarter Trend (HH / HL)",        unit: "of 6" },
  B3: { label: "Recent Move (vol-normalised)",   unit: "%" },
  C1: { label: "Relative Strength vs Sector",   unit: "pp" },
  D1: { label: "Volatility vs Sector Baseline", unit: "ratio" },
};

/** Returns the human label + unit for a foundation/momentum metric code.
 *  Unknown codes fall back to the code itself — no fabrication. */
export function getMetricLabel(metricKey: string): MetricMeta {
  return METRIC_MAP[metricKey] ?? { label: metricKey };
}

/** Returns the human label for a market sub-component code (A1, B2, etc.).
 *  Unknown codes fall back to the code itself. */
export function getMarketSubLabel(subComponent: string): MetricMeta {
  return MARKET_SUB_MAP[subComponent] ?? { label: subComponent };
}

// ── Codes not yet confidently identified ────────────────────────────────────
// (empty — all known codes from the scoring engine are mapped above)
export const UNKNOWN_METRIC_CODES: string[] = [];
