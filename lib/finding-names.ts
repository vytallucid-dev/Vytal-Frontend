/**
 * Canonical display names for every fired flag/pattern key, sourced from the spec
 * (Vytal_StockPage_Sections_2_and_5_Rules_Spec_v1 §5 — File 1). The keys match exactly
 * what the scoring engine persists to score_red_flags.flagKey / score_patterns.patternKey.
 *
 * The full active catalog is the engine's ALL_RULES registry: red flags R1–R6, patterns
 * P1/P4–P8/P10–P13, and the structural families B/C/D/F/G/H/I (also written to
 * score_patterns). RETIRED / UNBUILT have NO entry, by design:
 *   • P2 (Distribution to Retail) — consolidated into R6, not registered.
 *   • P3 (Promoter Stress)        — consolidated into R1, not registered.
 *   • P9 (Capex Cycle)            — unbuilt (capex unavailable).
 *
 * All three surfaces (stock §5 findings, PG pathology census, Hub Flags board) read names
 * from here so every surface uses the same display copy.
 */
export const FINDING_NAMES: Record<string, string> = {
  // ── A · Red flags (R-series) ──────────────────────────────────────────────────
  ownership_R1_pledge:             "Pledging Crisis",
  ownership_R2_promoter_exit:      "Promoter Exit",
  foundation_R3_earnings_quality:  "Earnings Quality Breakdown",
  foundation_R4_debt_explosion:    "Debt Explosion",
  foundation_R5_interest_coverage: "Interest Coverage Collapse",
  ownership_R6_distribution:       "Distribution Pattern",

  // ── E · Patterns (P-series; P2/P3/P9 deliberately absent) ─────────────────────
  ownership_P1_clean_rotation:     "Clean Institutional Rotation",
  ownership_P4_dual_exit:          "Dual Institutional Exit",
  ownership_P5_insider_distress:   "Insider-Confirmed Distress",
  ownership_P6_insider_conviction: "Insider Conviction",
  foundation_P7_accruals:          "Accruals Divergence",
  foundation_P8_receivables:       "Capital Tied in Receivables",
  ownership_P10_promoter_defense:  "Promoter Defense Buying",
  momentum_P11_margin_compression: "Quarterly Margin Compression",
  momentum_P12_margin_recovery:    "Quarterly Margin Recovery",
  momentum_P13_revenue_inflection: "TTM Revenue Inflection",

  // ── B/C/D/F/G/H/I · Structural cards (written to score_patterns) ───────────────
  trajectory_B_deterioration:           "Deterioration from a High Base",
  divergence_C1_price_ahead:            "Price Ahead of Fundamentals",
  divergence_C2_ownership_vs_fundamentals: "Ownership Against Fundamentals",
  divergence_C3_floor_trajectory_split: "Floor–Trajectory Split",
  divergence_C_over_time_widening:      "Divergence Widening",
  divergence_consolidated:              "Divergence",
  trajectory_D_recovery:                "Recovery from Weakness",
  composition_F1_atypical:              "Atypical Composition",
  trajectory_F2_composition_shift:      "Composition Shift",
  trajectory_G_convergence:             "Convergence",
  ownership_H_block_events:             "Ownership Events",
  trajectory_I_band_transition:         "Band Transition",
};

/**
 * Look up the spec display name for a flag/pattern key. Falls back to a
 * humanized form of the raw key for unknown/future keys.
 */
export function findingName(key: string): string {
  if (FINDING_NAMES[key]) return FINDING_NAMES[key];
  return key
    .replace(/^(?:ownership|momentum|foundation|fundamentals|trajectory|divergence|composition)_/i, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}
