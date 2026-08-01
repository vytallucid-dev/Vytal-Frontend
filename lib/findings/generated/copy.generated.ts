// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ⚠⚠ MACHINE-GENERATED. DO NOT EDIT. ⚠⚠
//
// Generated from the backend copy catalogue by Vytal-Backend/src/scripts/gen-frontend-fallback.ts.
// Every string below is a copy of a string authored in src/catalogue/ — that is the ONE home. Editing
// this file edits a cache, not a source: the next regeneration silently reverts you, and CI fails in
// the meantime (verify-fallback-fresh.ts).
//
// ── WHAT THIS FILE IS FOR ─────────────────────────────────────────────────────────────────────────
// It is the BUNDLED FALLBACK. When GET /api/v1/catalogue is cold, slow or down, the four resolvers
// (findingName / findingDescription / doesntMean / lensCatalogFace) read these constants instead, so
// a reader sees the complete copy they always saw rather than title-only cards. The catalogue endpoint
// is therefore not a single point of failure for the product's vocabulary.
//
// ── TO CHANGE ANY STRING HERE ─────────────────────────────────────────────────────────────────────
//   1. edit it in Vytal-Backend/src/catalogue/
//   2. npx tsx src/scripts/gen-frontend-fallback.ts
//   3. commit BOTH repos
//
// catalogue version at generation: 1d33f5f19e6ddf50
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/** The catalogue document version these constants were generated from. Compared against the SERVED
 *  version at runtime — a mismatch means a deploy shipped a frontend built against different copy,
 *  which the provider reports loudly rather than rendering two vocabularies at once. */
export const GENERATED_FROM_VERSION = "1d33f5f19e6ddf50";

/** key → display name. */
export const GEN_FINDING_NAMES: Record<string, string> = {
  "composition_F1_atypical": "Atypical Composition",
  "divergence_C_over_time_widening": "Divergence Widening",
  "divergence_C1_price_ahead": "Price Ahead of Fundamentals",
  "divergence_C2_ownership_vs_fundamentals": "Ownership Against Fundamentals",
  "divergence_C3_floor_trajectory_split": "Floor–Trajectory Split",
  "divergence_consolidated": "Divergence",
  "foundation_N1_cash_backed_earnings": "Cash-backed earnings",
  "foundation_N2_working_capital": "Working-capital discipline",
  "foundation_N3_deleveraging": "Sustained deleveraging",
  "foundation_N4_coverage_strengthening": "Coverage strengthening",
  "foundation_P7_accruals": "Accruals Divergence",
  "foundation_P8_receivables": "Capital Tied in Receivables",
  "foundation_R3_earnings_quality": "Earnings Quality Breakdown",
  "foundation_R4_debt_explosion": "Debt Explosion",
  "foundation_R5_interest_coverage": "Interest Coverage Collapse",
  "momentum_P11_margin_compression": "Quarterly Margin Compression",
  "momentum_P12_margin_recovery": "Quarterly Margin Recovery",
  "momentum_P13_revenue_inflection": "TTM Revenue Inflection",
  "ownership_H_block_events": "Ownership Events",
  "ownership_N5_dual_institutional_build": "Dual institutional build",
  "ownership_N6_promoter_accumulation": "Promoter accumulation",
  "ownership_N7_pledge_release": "Pledge release",
  "ownership_P1_clean_rotation": "Clean Institutional Rotation",
  "ownership_P10_promoter_defense": "Promoter Defense Buying",
  "ownership_P4_dual_exit": "Dual Institutional Exit",
  "ownership_P5_insider_distress": "Insider-Confirmed Distress",
  "ownership_P6_insider_conviction": "Insider Conviction",
  "ownership_R1_pledge": "Pledging Crisis",
  "ownership_R2_promoter_exit": "Promoter Exit",
  "ownership_R6_distribution": "Distribution Pattern",
  "trajectory_B_deterioration": "Deterioration from a High Base",
  "trajectory_D_recovery": "Recovery from Weakness",
  "trajectory_F2_composition_shift": "Composition Shift",
  "trajectory_G_convergence": "Convergence",
  "trajectory_I_band_transition": "Band Transition"
};

/** key → { description, family, concern, doesntMean }. `doesntMean` is already RESOLVED. */
export const GEN_FINDING_DESCRIPTIONS: Record<
  string,
  { description: string; family: string; concern: string; doesntMean: string }
> = {
  "composition_F1_atypical": {
    "concern": "trajectory",
    "description": "The four pillars are distributed unusually for a company at this score. The same composite can be built from very different mixes, and this one isn't the typical shape for its band.",
    "doesntMean": "a place to investigate, not a re-rate signal.",
    "family": "F"
  },
  "divergence_C_over_time_widening": {
    "concern": "trajectory",
    "description": "The gap between how this company's share price reads and what the business underneath supports was already notable, and has widened further over recent snapshots. Price and fundamentals are drifting further apart rather than converging.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_C1_price_ahead": {
    "concern": "trajectory",
    "description": "The Market read sits well above what Foundation and Momentum support. Price has run ahead of the business underneath it.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_C2_ownership_vs_fundamentals": {
    "concern": "trajectory",
    "description": "Ownership behaviour contradicts the fundamentals — either owners are stepping back from a business that looks sound, or building into one that looks weak. Both are worth understanding; the second is the classic smart-money tell.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_C3_floor_trajectory_split": {
    "concern": "trajectory",
    "description": "Foundation and Momentum are far apart — a sound balance sheet with deteriorating trends, or improving trends built on a weak base. What the company is and where it's heading disagree.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_consolidated": {
    "concern": "trajectory",
    "description": "Two or more pillar reads of this company disagree materially. The parts of the score are telling different stories about the same business.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "foundation_N1_cash_backed_earnings": {
    "concern": "fundamentals",
    "description": "Operating cash flow has covered reported profit across consecutive years — earnings converting to cash rather than accumulating as accruals.",
    "doesntMean": "cash conversion describes accounting quality, not growth, not valuation, and not a floor under the price.",
    "family": "N"
  },
  "foundation_N2_working_capital": {
    "concern": "fundamentals",
    "description": "Revenue has grown faster than receivables across consecutive years — sales converting to collections rather than to outstanding balances.",
    "doesntMean": "collection discipline is a working-capital fact. It says nothing about demand, margins, or whether growth continues.",
    "family": "N"
  },
  "foundation_N3_deleveraging": {
    "concern": "fundamentals",
    "description": "Borrowings relative to net worth have fallen across consecutive years — a decline wide enough to reflect repayment or equity accumulation rather than measurement drift.",
    "doesntMean": "a falling ratio can come from repayment or from equity growth, and the two are different. Lower leverage is less fragility, not more return.",
    "family": "N"
  },
  "foundation_N4_coverage_strengthening": {
    "concern": "fundamentals",
    "description": "Trailing interest coverage has improved across consecutive quarters from a thin starting level — debt-service capacity rebuilding, not a comfortable ratio drifting higher.",
    "doesntMean": "improving coverage describes debt-service capacity recovering. It is not a statement about earnings quality or about the level being comfortable now.",
    "family": "N"
  },
  "foundation_P7_accruals": {
    "concern": "fundamentals",
    "description": "Operating cash flow covered less than half of reported profit in the latest financial year. Earnings are being recognised well ahead of the cash behind them actually arriving.",
    "doesntMean": "a condition to look at — not a trade signal.",
    "family": "E"
  },
  "foundation_P8_receivables": {
    "concern": "fundamentals",
    "description": "Money owed by customers grew far faster than revenue over the latest financial year. A growing share of the company's capital is sitting in receivables rather than working in the business.",
    "doesntMean": "a condition to look at — not a trade signal.",
    "family": "E"
  },
  "foundation_R3_earnings_quality": {
    "concern": "fundamentals",
    "description": "Reported net profit has exceeded operating cash flow for four or more consecutive years. Profit is being booked that the business isn't converting into cash, and the gap has persisted long enough to be structural rather than timing.",
    "doesntMean": "a hard risk/quality warning to investigate — not a prediction the stock will fall.",
    "family": "A"
  },
  "foundation_R4_debt_explosion": {
    "concern": "fundamentals",
    "description": "Debt-to-equity has crossed 3× for the first time in the company's recent annual accounts — no earlier year on file breached it. The balance sheet has taken on leverage well beyond anything in that history.",
    "doesntMean": "a hard risk/quality warning to investigate — not a prediction the stock will fall.",
    "family": "A"
  },
  "foundation_R5_interest_coverage": {
    "concern": "fundamentals",
    "description": "Earnings before interest and tax have covered interest costs less than 1.5 times, measured over the trailing twelve months, for two consecutive quarters. The company is earning barely more than it owes its lenders.",
    "doesntMean": "a hard risk/quality warning to investigate — not a prediction the stock will fall.",
    "family": "A"
  },
  "momentum_P11_margin_compression": {
    "concern": "momentum",
    "description": "Operating margin has fallen for two or more consecutive quarters. Profitability is eroding across successive quarters rather than dipping in a single soft one.",
    "doesntMean": "a condition to look at — not a trade signal.",
    "family": "E"
  },
  "momentum_P12_margin_recovery": {
    "concern": "momentum",
    "description": "Operating margin has risen for two or more consecutive quarters from a recent trough. Profitability has turned up off a low.",
    "doesntMean": "a condition to look at — not a trade signal.",
    "family": "E"
  },
  "momentum_P13_revenue_inflection": {
    "concern": "momentum",
    "description": "The trailing-twelve-month revenue growth rate changed by at least 5 percentage points against the prior quarter's — a clear acceleration or deceleration in the pace of growth.",
    "doesntMean": "a condition to look at — not a trade signal.",
    "family": "E"
  },
  "ownership_H_block_events": {
    "concern": "ownership",
    "description": "A significant block or bulk deal was recorded in the last quarter. An ownership event worth noting as flow and risk context.",
    "doesntMean": "risk/flow context, not a verdict.",
    "family": "H"
  },
  "ownership_N5_dual_institutional_build": {
    "concern": "ownership",
    "description": "Foreign and domestic institutional holdings both increased in the same quarter — two owner classes adding at once, rather than one rotating into the other.",
    "doesntMean": "institutional flow is what owners did last quarter, not what the stock will do. It is not agreement, not conviction, and not a signal to follow.",
    "family": "N"
  },
  "ownership_N6_promoter_accumulation": {
    "concern": "ownership",
    "description": "Promoters' absolute shareholding has risen across consecutive quarters — shares actually acquired, not a percentage lifted by a shrinking share count.",
    "doesntMean": "promoters buying is a disclosure fact. Insiders are not always right, and their reasons are not visible.",
    "family": "N"
  },
  "ownership_N7_pledge_release": {
    "concern": "ownership",
    "description": "Pledged promoter shares have fallen as a proportion of promoter holding — financing encumbrance being unwound at the promoter level, which is separate from the operating business.",
    "doesntMean": "a falling pledge is reduced financing stress at the promoter level. It says nothing about the operating business.",
    "family": "N"
  },
  "ownership_P1_clean_rotation": {
    "concern": "ownership",
    "description": "Domestic institutions bought meaningfully while foreign institutions trimmed only slightly, with promoter holding essentially unchanged. Ownership changed hands between professional investors rather than being distributed outward.",
    "doesntMean": "a condition to look at — not a trade signal.",
    "family": "E"
  },
  "ownership_P10_promoter_defense": {
    "concern": "ownership",
    "description": "Promoters bought their own stock at a time when its share price was not reading strongly. The people who control the company added to their stake while the market was unenthusiastic about it.",
    "doesntMean": "a condition to look at — not a trade signal.",
    "family": "E"
  },
  "ownership_P4_dual_exit": {
    "concern": "ownership",
    "description": "Both foreign and domestic institutions reduced their holdings in the same period. Two independent sets of professional investors stepped back at the same time.",
    "doesntMean": "a condition to look at — not a trade signal.",
    "family": "E"
  },
  "ownership_P5_insider_distress": {
    "concern": "ownership",
    "description": "The people closest to the company have been selling their own holdings, at a company whose overall health already reads weak. Insider selling into existing weakness reads differently from a routine trim on a sound business.",
    "doesntMean": "a condition to look at — not a trade signal.",
    "family": "E"
  },
  "ownership_P6_insider_conviction": {
    "concern": "ownership",
    "description": "Directors and key management have been buying their own stock. The people running the business day to day added to their own positions.",
    "doesntMean": "a condition to look at — not a trade signal.",
    "family": "E"
  },
  "ownership_R1_pledge": {
    "concern": "ownership",
    "description": "Promoters have pledged more than half their stake as loan collateral, or sharply increased what's pledged in a single quarter. Pledged shares can be sold by the lender if the loan sours, so heavy pledging is a financing-stress signal about the promoters.",
    "doesntMean": "a hard risk/quality warning to investigate — not a prediction the stock will fall.",
    "family": "A"
  },
  "ownership_R2_promoter_exit": {
    "concern": "ownership",
    "description": "Promoter holding fell by more than 5 percentage points between one shareholding filing and the next — and not because of a fundraise that diluted everyone. The people who run the company reduced their own ownership materially and quickly.",
    "doesntMean": "a hard risk/quality warning to investigate — not a prediction the stock will fall.",
    "family": "A"
  },
  "ownership_R6_distribution": {
    "concern": "ownership",
    "description": "In the same quarter, promoters reduced, foreign institutions reduced, and retail holding rose. The better-informed owners sold and smaller shareholders absorbed the shares.",
    "doesntMean": "a hard risk/quality warning to investigate — not a prediction the stock will fall.",
    "family": "A"
  },
  "trajectory_B_deterioration": {
    "concern": "trajectory",
    "description": "The composite, or one pillar, has crossed down out of strong territory and stayed there across at least two snapshots. A company that was solid is sliding — a change in risk profile that usually shows up before price reacts.",
    "doesntMean": "review your thesis, not sell — an early risk read, not a price call.",
    "family": "B"
  },
  "trajectory_D_recovery": {
    "concern": "trajectory",
    "description": "The composite, or one pillar, has turned up out of weak territory and held the improvement. In this program's testing, recovery from weakness has been the most durable signal observed — stated descriptively, not as a forecast.",
    "doesntMean": "a coincident health inflection worth investigating — not a buy, not a guaranteed continuation; strongest read against a calm pond.",
    "family": "D"
  },
  "trajectory_F2_composition_shift": {
    "concern": "trajectory",
    "description": "The overall score held steady since the last snapshot, but the mix beneath it moved — either one pillar shifted markedly, or a different pillar is now the strongest of the four. What's driving the number has changed, even though the number hasn't.",
    "doesntMean": "a place to investigate, not a re-rate signal.",
    "family": "F"
  },
  "trajectory_G_convergence": {
    "concern": "trajectory",
    "description": "A pillar gap that was previously notable has narrowed. Which way it closed matters: the laggard rising is a different story from the leader falling.",
    "doesntMean": "the move isn't over, and which way it resolved depends on which pillar moved — not buy/sell.",
    "family": "G"
  },
  "trajectory_I_band_transition": {
    "concern": "trajectory",
    "description": "The composite crossed into Healthy on the way up, or into Below-par on the way down — the two boundaries either side of the middle of the scale.",
    "doesntMean": "a band change to note — not a buy/sell call.",
    "family": "I"
  }
};

/** Family letter → the mandatory interpretive boundary. Total over A–I + N. */
export const GEN_FAMILY_DOESNT_MEAN: Record<string, string> = {
  "A": "a hard risk/quality warning to investigate — not a prediction the stock will fall.",
  "B": "review your thesis, not sell — an early risk read, not a price call.",
  "C": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
  "D": "a coincident health inflection worth investigating — not a buy, not a guaranteed continuation; strongest read against a calm pond.",
  "E": "a condition to look at — not a trade signal.",
  "F": "a place to investigate, not a re-rate signal.",
  "G": "the move isn't over, and which way it resolved depends on which pillar moved — not buy/sell.",
  "H": "risk/flow context, not a verdict.",
  "I": "a band change to note — not a buy/sell call.",
  "N": "Already-sound is already priced. A constructive finding describes what has held, not what will continue, and never that the stock is worth buying."
};

/** Lowercase escalating face id → the lens boundary. */
export const GEN_LENS_DOESNT_MEAN: Record<string, string> = {
  "lm3": "where the weakness lives — in the field, not uniquely this name; not a forecast the field recovers.",
  "lm7": "a hard quality read on this metric to investigate — not a prediction the stock falls.",
  "lp2": "the pillar leads a weak pond — its relative strength is a field artifact, not a forecast.",
  "lp5": "broad self-deterioration to investigate — an early breadth read, not a price call."
};

/** Metric-level three-lens faces (LM1–LM8). */
export const GEN_LM_CATALOG = {
  "LM1": {
    "doesntMean": "a sound, improving metric — not a forecast that it continues, and not a buy signal. Already-strong metrics are already priced.",
    "fieldVerdict": null,
    "id": "LM1",
    "label": "Strong & still climbing",
    "read": "This metric clears its bar, leads the peer field, and is improving against its own history — strength on all three lenses.",
    "tone": "Constructive"
  },
  "LM2": {
    "doesntMean": "the leader is faltering or that decline is coming — only that this metric is no longer *outpacing itself*. A flattening at the top is not a fall.",
    "fieldVerdict": null,
    "id": "LM2",
    "label": "Best-in-class, but flattening",
    "read": "Still clears its bar and leads the peer field — but it has stopped improving against its own history. A peak-and-hold (or a peak-and-ease), not a deterioration.",
    "tone": "Neutral→Caution"
  },
  "LM3": {
    "doesntMean": "the stock is fine on this metric — it is below the universal bar. And being best-of-a-weak-field is not a forecast that the field recovers. It is a statement about *where the weakness lives* — in the field, not uniquely in this name.",
    "fieldVerdict": "PG_WEAK",
    "id": "LM3",
    "label": "Below bar — leads a weak field",
    "read": "This metric sits below its absolute bar — sub-par in universal terms — yet it is *above* the peer-group average. The read is about the field: this peer group is weak on this metric right now, and the stock is simply the strongest of a struggling set.",
    "tone": "Caution (field)"
  },
  "LM4": {
    "doesntMean": "the stock is weak on this metric — it clears the universal bar. Trailing an elite field is not a flaw; it is context. Do not read 'below peer mean' as 'bad' here.",
    "fieldVerdict": "PG_STRONG",
    "id": "LM4",
    "label": "Clears bar — in an elite field",
    "read": "This metric clears its absolute bar — sound in universal terms — but sits *below* the peer-group average. The read is about the field: this is an exceptional peer group, and the stock lags not because it is weak, but because the company it keeps is elite.",
    "tone": "Neutral (field)"
  },
  "LM5": {
    "doesntMean": "a recovery that will complete, or a buy. Improvement off a weak base is a real, observed change in *this metric's own arc* — not a prediction it reaches the bar or the field. The Source of Truth's recovery findings live at the pillar level and carry their own evidence; this is the metric-level echo, descriptive only.",
    "fieldVerdict": null,
    "id": "LM5",
    "label": "Weak & behind — but turning up",
    "read": "Below its bar and below the peer field — weak on both absolute and competitive lenses — but it is *improving against its own history*. A low-base turn, visible only because the trend lens is read separately.",
    "tone": "Constructive/Caution"
  },
  "LM6": {
    "doesntMean": "the stock is now weak — it still clears the bar. Converging to the field average is a loss of *relative* lead, not a fall into weakness.",
    "fieldVerdict": null,
    "id": "LM6",
    "label": "Lead eroding — converging to field",
    "read": "Still above its absolute bar, but its edge over the peer field has narrowed to roughly the field average, and it is declining against its own history. The competitive separation is eroding.",
    "tone": "Caution"
  },
  "LM7": {
    "doesntMean": "a prediction the stock falls — it is a hard quality/risk read on *this metric*, not a price call. Weak-on-all-three is a reason to investigate the metric, not a sell.",
    "fieldVerdict": null,
    "id": "LM7",
    "label": "Weak on every lens",
    "read": "Below its absolute bar, below the peer field, and declining against its own history. Weak on all three lenses simultaneously — no offsetting read.",
    "tone": "Concern"
  },
  "LM8": {
    "doesntMean": "the pillar's score is wrong — the aggregate is honest. This simply surfaces *which* component is the soft one inside an otherwise-acceptable pillar.",
    "fieldVerdict": null,
    "id": "LM8",
    "label": "Quiet weak spot",
    "read": "This metric is below its bar and below the peer field and not improving — but its pillar reads acceptable because other metrics carry it. Flagged so the weak spot is visible, not buried in the average.",
    "tone": "Caution"
  }
} as const;

/** Pillar-level three-lens faces (LP1–LP6). */
export const GEN_LP_CATALOG = {
  "LP1": {
    "doesntMean": "a condition to look at — not a trade signal.",
    "fieldVerdict": null,
    "id": "LP1",
    "label": "Broad strength",
    "read": "The pillar is strong on most metrics, absolutely *and* vs the field. Genuine breadth.",
    "tone": "Constructive"
  },
  "LP2": {
    "doesntMean": "the pillar leads a weak pond — its relative strength is a field artifact, not a forecast.",
    "fieldVerdict": "PG_WEAK",
    "id": "LP2",
    "label": "Field-lifted",
    "read": "Most metrics trail their bars but beat the field — **the pillar's relative strength is a weak-field artifact** (the LM3 story, aggregated). The pillar leads the pond, but the pond is low.",
    "tone": "Caution (field)"
  },
  "LP3": {
    "doesntMean": "a condition to look at — not a trade signal.",
    "fieldVerdict": "PG_STRONG",
    "id": "LP3",
    "label": "Field-suppressed (elite field)",
    "read": "Most metrics clear their bars but trail the field — **an elite peer group** (the LM4 story, aggregated). The pillar is sound; the field is exceptional.",
    "tone": "Neutral (field)"
  },
  "LP4": {
    "doesntMean": "a condition to look at — not a trade signal.",
    "fieldVerdict": null,
    "id": "LP4",
    "label": "Improving breadth",
    "read": "A *majority* of the pillar's metrics are improving against their own history — broad self-improvement, regardless of absolute/peer level.",
    "tone": "Constructive"
  },
  "LP5": {
    "doesntMean": "broad self-deterioration to investigate — an early breadth read, not a price call.",
    "fieldVerdict": null,
    "id": "LP5",
    "label": "Eroding breadth",
    "read": "A majority of the pillar's metrics are sliding against their own history — broad self-deterioration. The early, breadth-based read of a pillar losing altitude.",
    "tone": "Caution→Concern"
  },
  "LP6": {
    "doesntMean": "a condition to look at — not a trade signal.",
    "fieldVerdict": null,
    "id": "LP6",
    "label": "Hollow pillar (strong but fading)",
    "read": "Most metrics still clear their bars, but most are *declining* — the pillar's absolute standing is intact but its momentum-within-itself is broadly negative. A strong-but-fading pillar.",
    "tone": "Caution"
  }
} as const;
