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
// catalogue version at generation: ae33035947b52266
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/** The catalogue document version these constants were generated from. Compared against the SERVED
 *  version at runtime — a mismatch means a deploy shipped a frontend built against different copy,
 *  which the provider reports loudly rather than rendering two vocabularies at once. */
export const GENERATED_FROM_VERSION = "ae33035947b52266";

/** key → display name. */
export const GEN_FINDING_NAMES: Record<string, string> = {
  "composition_F1_atypical": "Atypical Composition",
  "divergence_consolidated": "Divergence",
  "divergence_D1_price_ahead_quality": "Price Ahead of Quality",
  "divergence_D2_price_ahead_trajectory": "Price Ahead of Trajectory",
  "divergence_D3_ownership_building_weak_foundation": "Ownership Building Against a Weak Foundation",
  "divergence_D4_ownership_exiting_healthy": "Ownership Exiting a Healthy Business",
  "divergence_D5_laggard_catching_up": "Laggard Catching Up",
  "divergence_D6_quality_rolling_over": "Quality Rolling Over",
  "divergence_D7_trajectory_breaking_base_holds": "Trajectory Breaking While the Base Holds",
  "divergence_S1_aligned": "Aligned — No Tension",
  "divergence_S2_sticky_divergence": "Sticky Divergence",
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
  "trajectory_B_T2_deterioration_high_base": "Deterioration from a High Base",
  "trajectory_B_T3_falling_out_of_pristine": "Falling Out of Pristine",
  "trajectory_B_T6_momentum_breaking_into_weak": "Momentum Breaking Into Weak",
  "trajectory_B_T9_foundation_weak_declining": "Foundation Weak and Still Declining",
  "trajectory_D_T1_recovery_low_zone": "Recovery from the Low Zone",
  "trajectory_D_T4_recovering_out_of_below_par": "Recovering Out of Below Par",
  "trajectory_D_T5_foundation_out_of_weak": "Foundation Growing Out of the Weak Zone",
  "trajectory_D_T7_momentum_improving_while_weak": "Momentum Improving While Still Weak",
  "trajectory_D_T8_foundation_strong_improving": "Foundation Strong and Still Improving",
  "trajectory_F2_composition_shift": "Composition Shift"
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
  "divergence_consolidated": {
    "concern": "trajectory",
    "description": "Two or more pillar reads of this company disagree materially. The parts of the score are telling different stories about the same business.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_D1_price_ahead_quality": {
    "concern": "trajectory",
    "description": "The market is paying far more than the underlying quality of the business justifies. Foundation is a slow-moving read on how fundamentally sound a company is, so when price runs away from it the market is changing what it is willing to pay for a given level of quality. A re-rating story — structural and slower-moving.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_D2_price_ahead_trajectory": {
    "concern": "trajectory",
    "description": "The market is pricing a turn the results have not delivered. Momentum reads how the business is trending right now, so a gap here is about earnings expectations rather than quality. Faster-moving and noisier than the quality version, and more likely to resolve quickly in either direction, because a single set of results can close it.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_D3_ownership_building_weak_foundation": {
    "concern": "ownership",
    "description": "Institutions are increasing their stake in a business whose published fundamentals look weak. That is a deliberate, costly decision taken against the visible evidence, which is what makes it informative — someone with a better view is putting real money behind a thesis the numbers do not yet reflect.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_D4_ownership_exiting_healthy": {
    "concern": "ownership",
    "description": "Institutions have cut their position while the business still reads as healthy on the published numbers. The exit tends to precede the deterioration showing up in the financials.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_D5_laggard_catching_up": {
    "concern": "trajectory",
    "description": "A fundamentally sound business whose trajectory had fallen behind is now turning up. The weaker pillar is converging toward the stronger one — and the direction of convergence is the whole point, because the same improvement moving away from a weak base reads very differently.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_D6_quality_rolling_over": {
    "concern": "trajectory",
    "description": "A high-quality business the market has already priced as high-quality, whose only fresh input — the trajectory — has turned down. When quality is fully priced in, there is no upside surprise left to deliver, and a cooling trajectory is the thing that tends to matter.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_D7_trajectory_breaking_base_holds": {
    "concern": "trajectory",
    "description": "The balance sheet is still intact but the operating trajectory has broken into weakness. This is early — the base has not deteriorated yet, but the direction has changed. The intact balance sheet does not cushion it.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_S1_aligned": {
    "concern": "trajectory",
    "description": "The market's view and the business's condition agree. Nothing is unresolved. This is a genuinely useful reading, not an empty one — most of a screening tool's value is telling you where you do not need to look.",
    "doesntMean": "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
    "family": "C"
  },
  "divergence_S2_sticky_divergence": {
    "concern": "trajectory",
    "description": "Foundation and Momentum have disagreed materially for more than one reading and are not converging. At this distance neither pillar reliably closes the gap at the next reading. The tension is real and unresolved — the state is readable, the timing is not.",
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
  "trajectory_B_T2_deterioration_high_base": {
    "concern": "trajectory",
    "description": "A business that was in good shape is measurably weakening — the overall score has fallen materially from a strong starting point. This is the kind of change worth reviewing your reasons for holding it. How much weight it carries depends on the market phase, which is why this reading always shows the phase it fired in.",
    "doesntMean": "review your thesis, not sell — an early risk read, not a price call.",
    "family": "B"
  },
  "trajectory_B_T3_falling_out_of_pristine": {
    "concern": "trajectory",
    "description": "This business has slipped out of the top health band. That band is defined as fully priced — a company already recognised as excellent — so falling out of it means the one thing supporting a premium rating has started to slip. Whether this carries a directional read depends entirely on the market phase.",
    "doesntMean": "review your thesis, not sell — an early risk read, not a price call.",
    "family": "B"
  },
  "trajectory_B_T6_momentum_breaking_into_weak": {
    "concern": "trajectory",
    "description": "The operating trajectory has broken into weak territory. The balance sheet may still be intact, but the direction of the business has changed. This reading is located at the trajectory pillar's own weak mark rather than a borrowed one — measured at the wrong threshold, the same condition reads the opposite way.",
    "doesntMean": "review your thesis, not sell — an early risk read, not a price call.",
    "family": "B"
  },
  "trajectory_B_T9_foundation_weak_declining": {
    "concern": "trajectory",
    "description": "A business that was already weak is continuing to deteriorate. Not a dramatic break — steady erosion from a low base. Of all the trajectory readings tested, this one had the poorest odds of the price holding up: roughly two-thirds of cases fell.",
    "doesntMean": "review your thesis, not sell — an early risk read, not a price call.",
    "family": "B"
  },
  "trajectory_D_T1_recovery_low_zone": {
    "concern": "trajectory",
    "description": "A struggling business is genuinely turning — the overall score has risen materially from a weak starting point. This is a real improvement in the underlying fundamentals rather than a price move: on shifts of this size the non-price pillars contribute most of the change. The market has typically already begun repricing it by the time this shows.",
    "doesntMean": "a coincident health inflection worth investigating — not a buy, not a guaranteed continuation; strongest read against a calm pond.",
    "family": "D"
  },
  "trajectory_D_T4_recovering_out_of_below_par": {
    "concern": "trajectory",
    "description": "This business has moved out of below-par territory into steady — a recovery that has held long enough to cross a band. Directional only: the sample behind this reading was not preserved, so it has not been established with the confidence of the other trajectory patterns.",
    "doesntMean": "a coincident health inflection worth investigating — not a buy, not a guaranteed continuation; strongest read against a calm pond.",
    "family": "D"
  },
  "trajectory_D_T5_foundation_out_of_weak": {
    "concern": "trajectory",
    "description": "The latest results moved the balance-sheet reading out of weak territory — a real improvement from a low base, and the most consistent of the single-pillar improvements observed. Notably it is the small gains that carried this: large jumps in the same reading did not.",
    "doesntMean": "a coincident health inflection worth investigating — not a buy, not a guaranteed continuation; strongest read against a calm pond.",
    "family": "D"
  },
  "trajectory_D_T7_momentum_improving_while_weak": {
    "concern": "trajectory",
    "description": "Still weak, but improving — the trajectory has turned up from a low base, the earliest point at which a recovery becomes visible in the numbers. On the larger improvements the price has usually already moved by the time the reading catches up.",
    "doesntMean": "a coincident health inflection worth investigating — not a buy, not a guaranteed continuation; strongest read against a calm pond.",
    "family": "D"
  },
  "trajectory_D_T8_foundation_strong_improving": {
    "concern": "trajectory",
    "description": "An already-strong business that is still strengthening — the balance-sheet reading sits above its strong mark and has risen again. Uncommon, and one of the more consistent positive readings on the strong side of the range.",
    "doesntMean": "a coincident health inflection worth investigating — not a buy, not a guaranteed continuation; strongest read against a calm pond.",
    "family": "D"
  },
  "trajectory_F2_composition_shift": {
    "concern": "trajectory",
    "description": "The overall score held steady since the last snapshot, but the mix beneath it moved — either one pillar shifted markedly, or a different pillar is now the strongest of the four. What's driving the number has changed, even though the number hasn't.",
    "doesntMean": "a place to investigate, not a re-rate signal.",
    "family": "F"
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
