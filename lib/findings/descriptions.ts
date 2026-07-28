/**
 * THE ONE CATALOG — static, rule-level copy for stock findings.
 *
 * WHAT THIS IS
 * ------------
 * The single home for every piece of STATIC finding copy: the per-finding `description`
 * (what the rule means), the display `FINDING_NAMES` (titles), the per-family and per-lens
 * "doesn't-mean" interpretive boundaries, and the verbatim three-lens `LM_/LP_CATALOG`
 * faces (label · read · doesn't-mean · tone · field-verdict). None of it needs evidence, so
 * it renders on EVERY surface — including the census surfaces (Health Hub → Flags & Patterns,
 * peer-group pathology) whose payload carries no evidence at all.
 *
 * THE TWO LAYERS — do not conflate
 * --------------------------------
 *   description (HERE)  — static, rule-level.  "What this pattern means."         Any surface.
 *   VERDICTS (verdicts.ts) — dynamic, per-stock. "What happened at this company."  Per-stock only.
 * They compose. A verdict never substitutes for a description and vice versa.
 *
 * COPY DISCIPLINE (non-negotiable — these definitions are load-bearing)
 * --------------------------------------------------------------------
 * Every string below is derived from the locked specs (Master Spec Parts XII–XIII, StockPage
 * Rules Spec §5, Three-Lens Pattern Library) and is transcribed VERBATIM. They describe **what
 * happens at the company / in the field**, never what the finding does to our score. "Overrides
 * the composite until it clears" is engine-speak and is exactly what this catalog replaces.
 *
 * Rules for any future edit:
 *   - Describe the company, never the scoring mechanism.
 *   - No advice, no prediction, no buy/sell framing. A red flag is "go look hard", not "it will fall".
 *   - If a description is missing, render TITLE ONLY. Never a generic filler sentence —
 *     filler pretends to explain, which is worse than silence.
 *   - The lens faces are protected by the backend no-forward-language guard; do not paraphrase.
 *
 * NOT HERE (a different layer, deliberately):
 *   - VERDICTS (per-stock instance sentences) → verdicts.ts (needs evidence numbers).
 *   - Portfolio findings                       → portfolio/phs/copy.ts (the book, not a company).
 */

import { familyOf, type Family } from "./classify";
import { N_FAMILY_COPY, N_FAMILY_DOESNT_MEAN } from "@/lib/n-family-copy";

export type FindingFamily =
  | "A" // red flags
  | "B" // deterioration
  | "C" // divergence
  | "D" // recovery
  | "E" // patterns
  | "F" // composition
  | "G" // convergence
  | "H" // ownership events
  | "I" // band transition
  | "N"; // notable (constructive mirrors — display-only)

/** Hub → Flags & Patterns bucketing. "trajectory" is the new fourth bucket (see build note). */
export type FindingConcern = "ownership" | "fundamentals" | "momentum" | "trajectory";

export interface FindingDescription {
  description: string;
  family: FindingFamily;
  concern: FindingConcern;
  /** Per-entry interpretive boundary (amendment §2 — a finding's OWN "doesn't-mean" line, which
   *  wins over its family's mandatory line). Optional: absent → the family line is used. Only
   *  Family N carries per-entry lines today. */
  doesntMean?: string;
}

// Family N (Notable) — descriptions DERIVED from the supplied spec copy (lib/n-family-copy.ts),
// never re-typed here, so the strings stay verbatim spec text and single-sourced. Concern follows
// the key prefix: foundation_N1–N4 → fundamentals, ownership_N5–N7 → ownership (never orphaned).
// We consume ONLY the static fields (description / doesntMean) — the instance-level `verdict`
// function is consumed separately by verdicts.ts, keeping the two layers apart.
const N_DESCRIPTIONS: Record<string, FindingDescription> = Object.fromEntries(
  Object.entries(N_FAMILY_COPY).map(([key, c]) => [
    key,
    {
      description: c.description,
      family: "N" as FindingFamily,
      concern: (key.startsWith("ownership") ? "ownership" : "fundamentals") as FindingConcern,
      doesntMean: c.doesntMean,
    },
  ]),
);

/** Keyed on the exact engine key emitted by RedFlag.flagKey / ScorePattern.patternKey. */
export const FINDING_DESCRIPTIONS: Record<string, FindingDescription> = {
  // Family N (Notable) — constructive mirrors; descriptions render on evidence-free surfaces
  // (the Hub census board) so N patterns are never title-only there. Derived from spec copy above.
  ...N_DESCRIPTIONS,

  // ───────────────────────────────────────────────────────────────────────────
  // Family A · Critical red flags (R1–R6) — Master Spec §13.2, locked triggers
  // Hard failure indicators. Fire regardless of composite.
  // ───────────────────────────────────────────────────────────────────────────

  // R1 · Pledging Crisis
  ownership_R1_pledge: {
    description:
      "Promoters have pledged more than half their stake as loan collateral, or sharply increased what's pledged in a single quarter. Pledged shares can be sold by the lender if the loan sours, so heavy pledging is a financing-stress signal about the promoters.",
    family: "A",
    concern: "ownership",
  },

  // R2 · Promoter Exit
  ownership_R2_promoter_exit: {
    description:
      "Promoter holding fell by more than 5 percentage points in a single quarter — and not because of a fundraise that diluted everyone. The people who run the company reduced their own ownership materially and quickly.",
    family: "A",
    concern: "ownership",
  },

  // R3 · Earnings Quality Breakdown
  foundation_R3_earnings_quality: {
    description:
      "Reported net profit has exceeded operating cash flow for four or more consecutive periods. Profit is being booked that the business isn't converting into cash, and the gap has persisted long enough to be structural rather than timing.",
    family: "A",
    concern: "fundamentals",
  },

  // R4 · Debt Explosion
  foundation_R4_debt_explosion: {
    description:
      "Debt-to-equity has crossed 3× for the first time in five years. The balance sheet has taken on leverage well beyond anything in its recent history.",
    family: "A",
    concern: "fundamentals",
  },

  // R5 · Interest Coverage Collapse
  foundation_R5_interest_coverage: {
    description:
      "Operating profit has covered interest costs less than 1.5 times for two or more consecutive quarters. The company is earning barely more than it owes its lenders.",
    family: "A",
    concern: "fundamentals",
  },

  // R6 · Distribution Pattern
  ownership_R6_distribution: {
    description:
      "In the same quarter, promoters reduced, foreign institutions reduced, and retail holding rose. The better-informed owners sold and smaller shareholders absorbed the shares.",
    family: "A",
    concern: "ownership",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Family E · Patterns (P1–P13) — Master Spec §12.3, closed catalog
  // Conditional cross-metric / cross-pillar relationships. Modest score effect by design.
  // (P2, P3 retired from ALL_RULES; P9 unbuilt — no entries, they cannot fire.)
  // ───────────────────────────────────────────────────────────────────────────

  // P1 · Clean Institutional Rotation
  ownership_P1_clean_rotation: {
    description:
      "Domestic institutions bought while foreign institutions sold, with promoter holding essentially unchanged. Ownership changed hands between professional investors rather than being distributed outward.",
    family: "E",
    concern: "ownership",
  },

  // P4 · Dual Institutional Exit
  ownership_P4_dual_exit: {
    description:
      "Both foreign and domestic institutions reduced their holdings in the same period. Two independent sets of professional investors stepped back at the same time.",
    family: "E",
    concern: "ownership",
  },

  // P5 · Insider-Confirmed Distress
  ownership_P5_insider_distress: {
    description:
      "Insider transactions confirm the ownership stress already visible in the shareholding data — the people closest to the company have been selling their own holdings.",
    family: "E",
    concern: "ownership",
  },

  // P6 · Insider Conviction
  ownership_P6_insider_conviction: {
    description:
      "Company insiders have been buying their own stock. The people with the most direct knowledge of the business added to their positions.",
    family: "E",
    concern: "ownership",
  },

  // P7 · Accruals Divergence
  foundation_P7_accruals: {
    description:
      "Reported profit is running ahead of cash generation. Earnings are being recognised faster than the cash behind them actually arrives.",
    family: "E",
    concern: "fundamentals",
  },

  // P8 · Capital Tied in Receivables
  foundation_P8_receivables: {
    description:
      "Receivable days are climbing faster than revenue. A growing share of the company's capital is sitting in money customers owe rather than working in the business.",
    family: "E",
    concern: "fundamentals",
  },

  // P10 · Promoter Defense Buying
  ownership_P10_promoter_defense: {
    description:
      "Promoters bought their own stock through block deals while the price sat near a multi-quarter low. Insiders added to their stake at depressed levels.",
    family: "E",
    concern: "ownership",
  },

  // P11 · Quarterly Margin Compression
  momentum_P11_margin_compression: {
    description:
      "Operating margin has fallen for three or more consecutive trailing-twelve-month windows. Profitability is eroding as a sustained trend, not a single soft quarter.",
    family: "E",
    concern: "momentum",
  },

  // P12 · Quarterly Margin Recovery
  momentum_P12_margin_recovery: {
    description:
      "Operating margin has risen for two or more consecutive trailing-twelve-month windows from a recent trough. Profitability has turned up off a low.",
    family: "E",
    concern: "momentum",
  },

  // P13 · TTM Revenue Inflection
  momentum_P13_revenue_inflection: {
    description:
      "The trailing-twelve-month revenue growth rate changed by at least 3 percentage points against the prior window — a clear acceleration or deceleration in the pace of growth.",
    family: "E",
    concern: "momentum",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Structural families B / C / D / F / G / H / I — StockPage Rules Spec §5
  // These fire and persist today but resolve to concern "other" and never reach the
  // Hub board. They are among the most decision-relevant findings in the system.
  // ───────────────────────────────────────────────────────────────────────────

  // B · Deterioration from a High Base
  trajectory_B_deterioration: {
    description:
      "The composite, or one pillar, has crossed down out of strong territory and stayed there across at least two snapshots. A company that was solid is sliding — a change in risk profile that usually shows up before price reacts.",
    family: "B",
    concern: "trajectory",
  },

  // C1 · Price Ahead of Fundamentals
  divergence_C1_price_ahead: {
    description:
      "The Market read sits well above what Foundation and Momentum support. Price has run ahead of the business underneath it.",
    family: "C",
    concern: "trajectory",
  },

  // C2 · Ownership Against Fundamentals
  divergence_C2_ownership_vs_fundamentals: {
    description:
      "Ownership behaviour contradicts the fundamentals — either owners are stepping back from a business that looks sound, or building into one that looks weak. Both are worth understanding; the second is the classic smart-money tell.",
    family: "C",
    concern: "trajectory",
  },

  // C3 · Floor–Trajectory Split
  divergence_C3_floor_trajectory_split: {
    description:
      "Foundation and Momentum are far apart — a sound balance sheet with deteriorating trends, or improving trends built on a weak base. What the company is and where it's heading disagree.",
    family: "C",
    concern: "trajectory",
  },

  // C · Divergence Widening (over time)
  divergence_C_over_time_widening: {
    description:
      "A pillar gap that was already notable has widened further over recent snapshots. The disagreement between two reads of this company is growing rather than resolving.",
    family: "C",
    concern: "trajectory",
  },

  // C · Divergence (consolidated)
  divergence_consolidated: {
    description:
      "Two or more pillar reads of this company disagree materially. The parts of the score are telling different stories about the same business.",
    family: "C",
    concern: "trajectory",
  },

  // D · Recovery from Weakness
  trajectory_D_recovery: {
    description:
      "The composite, or one pillar, has turned up out of weak territory and held the improvement. In this program's testing, recovery from weakness has been the most durable signal observed — stated descriptively, not as a forecast.",
    family: "D",
    concern: "trajectory",
  },

  // F1 · Atypical Composition
  composition_F1_atypical: {
    description:
      "The four pillars are distributed unusually for a company at this score. The same composite can be built from very different mixes, and this one isn't the typical shape for its band.",
    family: "F",
    concern: "trajectory",
  },

  // F2 · Composition Shift
  trajectory_F2_composition_shift: {
    description:
      "The mix across the four pillars changed materially since the last snapshot even though the overall score held. What's driving the number has changed, even though the number hasn't.",
    family: "F",
    concern: "trajectory",
  },

  // G · Convergence
  trajectory_G_convergence: {
    description:
      "A pillar gap that was previously wide has narrowed. Which way it closed matters: the laggard rising is a different story from the leader falling.",
    family: "G",
    concern: "trajectory",
  },

  // H · Ownership Events
  ownership_H_block_events: {
    description:
      "A significant block or bulk deal, or a material change in pledged shares, occurred this period. An ownership event worth noting as flow and risk context.",
    family: "H",
    concern: "ownership",
  },

  // I · Band Transition
  trajectory_I_band_transition: {
    description:
      "The composite crossed a band boundary — into Healthy on the way up, or into Below-par on the way down.",
    family: "I",
    concern: "trajectory",
  },
};

/**
 * Resolve a finding's static description.
 * Returns null when absent — callers render TITLE ONLY.
 * NEVER substitute a generic sentence: filler that pretends to explain is worse than silence.
 */
export function findingDescription(key: string): string | null {
  return FINDING_DESCRIPTIONS[key]?.description ?? null;
}

/** Concern bucket for Hub grouping. Null when unknown — caller decides placement, never invents one. */
export function findingConcern(key: string): FindingConcern | null {
  return FINDING_DESCRIPTIONS[key]?.concern ?? null;
}

export function findingFamily(key: string): FindingFamily | null {
  return FINDING_DESCRIPTIONS[key]?.family ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TITLES — canonical display names for every fired flag/pattern key (moved verbatim
// from the former lib/finding-names.ts). Keys match exactly what the scoring engine
// persists to score_red_flags.flagKey / score_patterns.patternKey. RETIRED / UNBUILT
// have NO entry by design: P2 (→ R6), P3 (→ R1), P9 (capex, unbuilt).
// ═══════════════════════════════════════════════════════════════════════════════
export const FINDING_NAMES: Record<string, string> = {
  // ── N · Notable (constructive mirrors) — names derived from spec copy, never re-typed ──
  ...Object.fromEntries(Object.entries(N_FAMILY_COPY).map(([key, c]) => [key, c.name])),

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

// ═══════════════════════════════════════════════════════════════════════════════
// "DOESN'T MEAN" — the interpretive boundary (moved verbatim from verdicts.ts). Every
// card must carry one (Rules Spec card anatomy). Two sources: the per-family boundary
// (A–I) and the three-lens escalation boundary (lens_lm3/lm7/lp2/lp5).
// ═══════════════════════════════════════════════════════════════════════════════

// ── per-family "doesn't mean" interpretive boundary (File 1 §5, verbatim) ──────
// TOTAL BY CONSTRUCTION (amendment §2): every family MUST carry a boundary line, so this is a
// total Record<Family, …> — a missing family is a COMPILE error, not a runtime blank. Family N's
// line is spec copy, imported from n-family-copy.ts (N_FAMILY_DOESNT_MEAN), never authored here.
const DOESNT_MEAN: Record<Family, string> = {
  A: "a hard risk/quality warning to investigate — not a prediction the stock will fall.",
  B: "review your thesis, not sell — an early risk read, not a price call.",
  C: "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
  D: "a coincident health inflection worth investigating — not a buy, not a guaranteed continuation; strongest read against a calm pond.",
  E: "a condition to look at — not a trade signal.",
  F: "a place to investigate, not a re-rate signal.",
  G: "the move isn't over, and which way it resolved depends on which pillar moved — not buy/sell.",
  H: "risk/flow context, not a verdict.",
  I: "a band change to note — not a buy/sell call.",
  N: N_FAMILY_DOESNT_MEAN, // Family N (Notable) — verbatim spec copy (amendment §4.1)
};

// Three-Lens escalations (lens_lm3/lm7/lp2/lp5) carry their own no-prediction boundary —
// field-verdicts are CONTEXT (about the field), never a stock call.
const LENS_DOESNT_MEAN: Record<string, string> = {
  lm3: "where the weakness lives — in the field, not uniquely this name; not a forecast the field recovers.",
  lm7: "a hard quality read on this metric to investigate — not a prediction the stock falls.",
  lp2: "the pillar leads a weak pond — its relative strength is a field artifact, not a forecast.",
  lp5: "broad self-deterioration to investigate — an early breadth read, not a price call.",
};

export function doesntMean(key: string): string {
  const lens = /^lens_(lm3|lm7|lp2|lp5)_/.exec(key);
  if (lens) return LENS_DOESNT_MEAN[lens[1]] ?? DOESNT_MEAN.E;
  // §2 resolution order: the finding's OWN line (per-entry, where the catalog has one — Family N)
  // → its family's mandatory line. DOESNT_MEAN is now TOTAL, so the family fallback is never empty.
  return FINDING_DESCRIPTIONS[key]?.doesntMean ?? DOESNT_MEAN[familyOf(key)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// THREE-LENS CATALOG (LM1–8 metric · LP1–6 pillar) — label · read · doesn't-mean ·
// tone · field-verdict, transcribed VERBATIM from the backend lens-patterns/catalog.ts
// (itself verbatim from Vytal_Three_Lens_Pattern_Library_v1.md §2/§3/§4). The engine's
// wire drops read + doesn't-mean (face() ships only id/label/tone/fieldVerdict), so this
// is the ONLY frontend home for the prose. Keyed by uppercase id (LM3, LP2) as emitted.
//
// All 14 have entries: only LM3/LM7/LP2/LP5 escalate to findings; the other 10 are quiet
// by design ("loud at the extremes, quiet in the middle") but still render as per-stock
// pillar-breakdown pills, so they need copy too.
// ═══════════════════════════════════════════════════════════════════════════════

export type LensFieldVerdict = "PG_WEAK" | "PG_STRONG" | null;

export interface LensCatalogFace {
  id: string;
  /** §4 faces-table label (VERBATIM). */
  label: string;
  /** §4 tone token (VERBATIM). */
  tone: string;
  fieldVerdict: LensFieldVerdict;
  /** §2/§3 "Read" face (VERBATIM). */
  read: string;
  /** §2/§3 "Doesn't mean" face (VERBATIM). Empty for LP1–6 (the databank left them blank). */
  doesntMean: string;
}

// ── Metric-level catalog (LM1–8) ─────────────────────────────────────────────────
export const LM_CATALOG: Record<string, LensCatalogFace> = {
  LM1: {
    id: "LM1",
    label: "Strong & still climbing",
    tone: "Constructive",
    fieldVerdict: null,
    read: "This metric clears its bar, leads the peer field, and is improving against its own history — strength on all three lenses.",
    doesntMean:
      "a sound, improving metric — not a forecast that it continues, and not a buy signal. Already-strong metrics are already priced.",
  },
  LM2: {
    id: "LM2",
    label: "Best-in-class, but flattening",
    tone: "Neutral→Caution",
    fieldVerdict: null,
    read: "Still clears its bar and leads the peer field — but it has stopped improving against its own history. A peak-and-hold (or a peak-and-ease), not a deterioration.",
    doesntMean:
      "the leader is faltering or that decline is coming — only that this metric is no longer *outpacing itself*. A flattening at the top is not a fall.",
  },
  LM3: {
    id: "LM3",
    label: "Below bar — leads a weak field", // §2 prose: "Below bar — but leads a weak field"
    tone: "Caution (field)",
    fieldVerdict: "PG_WEAK",
    read: "This metric sits below its absolute bar — sub-par in universal terms — yet it is *above* the peer-group average. The read is about the field: this peer group is weak on this metric right now, and the stock is simply the strongest of a struggling set.",
    doesntMean:
      "the stock is fine on this metric — it is below the universal bar. And being best-of-a-weak-field is not a forecast that the field recovers. It is a statement about *where the weakness lives* — in the field, not uniquely in this name.",
  },
  LM4: {
    id: "LM4",
    label: "Clears bar — in an elite field", // §2 prose: "Clears the bar — in an elite field"
    tone: "Neutral (field)",
    fieldVerdict: "PG_STRONG",
    read: "This metric clears its absolute bar — sound in universal terms — but sits *below* the peer-group average. The read is about the field: this is an exceptional peer group, and the stock lags not because it is weak, but because the company it keeps is elite.",
    doesntMean:
      "the stock is weak on this metric — it clears the universal bar. Trailing an elite field is not a flaw; it is context. Do not read 'below peer mean' as 'bad' here.",
  },
  LM5: {
    id: "LM5",
    label: "Weak & behind — but turning up",
    tone: "Constructive/Caution",
    fieldVerdict: null,
    read: "Below its bar and below the peer field — weak on both absolute and competitive lenses — but it is *improving against its own history*. A low-base turn, visible only because the trend lens is read separately.",
    doesntMean:
      "a recovery that will complete, or a buy. Improvement off a weak base is a real, observed change in *this metric's own arc* — not a prediction it reaches the bar or the field. The Source of Truth's recovery findings live at the pillar level and carry their own evidence; this is the metric-level echo, descriptive only.",
  },
  LM6: {
    id: "LM6",
    label: "Lead eroding — converging to field", // §2 prose: "converging to the field"
    tone: "Caution",
    fieldVerdict: null,
    read: "Still above its absolute bar, but its edge over the peer field has narrowed to roughly the field average, and it is declining against its own history. The competitive separation is eroding.",
    doesntMean:
      "the stock is now weak — it still clears the bar. Converging to the field average is a loss of *relative* lead, not a fall into weakness.",
  },
  LM7: {
    id: "LM7",
    label: "Weak on every lens",
    tone: "Concern",
    fieldVerdict: null,
    read: "Below its absolute bar, below the peer field, and declining against its own history. Weak on all three lenses simultaneously — no offsetting read.",
    doesntMean:
      "a prediction the stock falls — it is a hard quality/risk read on *this metric*, not a price call. Weak-on-all-three is a reason to investigate the metric, not a sell.",
  },
  LM8: {
    id: "LM8",
    label: "Quiet weak spot",
    tone: "Caution",
    fieldVerdict: null,
    read: "This metric is below its bar and below the peer field and not improving — but its pillar reads acceptable because other metrics carry it. Flagged so the weak spot is visible, not buried in the average.",
    doesntMean:
      "the pillar's score is wrong — the aggregate is honest. This simply surfaces *which* component is the soft one inside an otherwise-acceptable pillar.",
  },
};

// ── Pillar-level catalog (LP1–6) ─────────────────────────────────────────────────
// Labels + tones + field-verdicts from §4; "read" from the §3.2 Meaning column (VERBATIM).
export const LP_CATALOG: Record<string, LensCatalogFace> = {
  LP1: {
    id: "LP1",
    label: "Broad strength",
    tone: "Constructive",
    fieldVerdict: null,
    read: "The pillar is strong on most metrics, absolutely *and* vs the field. Genuine breadth.",
    doesntMean: "",
  },
  LP2: {
    id: "LP2",
    label: "Field-lifted",
    tone: "Caution (field)",
    fieldVerdict: "PG_WEAK",
    read: "Most metrics trail their bars but beat the field — **the pillar's relative strength is a weak-field artifact** (the LM3 story, aggregated). The pillar leads the pond, but the pond is low.",
    doesntMean: "",
  },
  LP3: {
    id: "LP3",
    label: "Field-suppressed (elite field)",
    tone: "Neutral (field)",
    fieldVerdict: "PG_STRONG",
    read: "Most metrics clear their bars but trail the field — **an elite peer group** (the LM4 story, aggregated). The pillar is sound; the field is exceptional.",
    doesntMean: "",
  },
  LP4: {
    id: "LP4",
    label: "Improving breadth",
    tone: "Constructive",
    fieldVerdict: null,
    read: "A *majority* of the pillar's metrics are improving against their own history — broad self-improvement, regardless of absolute/peer level.",
    doesntMean: "",
  },
  LP5: {
    id: "LP5",
    label: "Eroding breadth",
    tone: "Caution→Concern",
    fieldVerdict: null,
    read: "A majority of the pillar's metrics are sliding against their own history — broad self-deterioration. The early, breadth-based read of a pillar losing altitude.",
    doesntMean: "",
  },
  LP6: {
    id: "LP6",
    label: "Hollow pillar (strong but fading)",
    tone: "Caution",
    fieldVerdict: null,
    read: "Most metrics still clear their bars, but most are *declining* — the pillar's absolute standing is intact but its momentum-within-itself is broadly negative. A strong-but-fading pillar.",
    doesntMean: "",
  },
};

/** Resolve a three-lens face by its uppercase id (LM3 / LP2 / …). null for unknown ids. */
export function lensCatalogFace(idUpper: string): LensCatalogFace | null {
  return LM_CATALOG[idUpper] ?? LP_CATALOG[idUpper] ?? null;
}

/**
 * The interpretive boundary for a three-lens face, by uppercase id. Prefers the pattern-
 * library face's own "Doesn't mean" (LM1–8 have them); falls back to the family-level lens
 * boundary for the escalating ids (LP2/LP5, whose face doesn't-mean the databank left blank),
 * then to the generic pattern boundary. Never empty — every lens card carries a boundary.
 */
export function lensDoesntMean(idUpper: string): string {
  const face = lensCatalogFace(idUpper);
  if (face?.doesntMean) return face.doesntMean;
  return LENS_DOESNT_MEAN[idUpper.toLowerCase()] ?? DOESNT_MEAN.E ?? "";
}
