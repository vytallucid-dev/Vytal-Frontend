// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO — frontend view types over the /api/v1/me/* read layer.
//
//   GET /api/v1/me/portfolio  → PortfolioSnapshotResponse (the pre-computed PHS)
//   GET /api/v1/me/holdings    → HoldingsResponse (materialized positions + live read)
//
// The snapshot is READ-ONLY: every score / pillar / penalty / coverage figure is
// computed server-side (portfolio-spec 1.1) and rendered as-is. The frontend NEVER
// recomputes a score, penalty or PHS weight. Position display weights and P&L are
// tracker arithmetic (value share, current − invested) — not PHS internals.
// ─────────────────────────────────────────────────────────────────────────────

/** PHS band scale (A.9) — distinct from the stock condition scale. */
export type PhsBand = "Strong" | "Steady" | "Mixed" | "Fragile" | "Weak";

/** Copy-only tiers (portfolio-spec 1.1, Change 2). STORAGE + Part B copy selector — never
 *  a score input (the PHS is byte-identical with or without them). structureTier from
 *  holding count N; capitalTier from total book value. */
export type StructureTier = "Starter" | "Building" | "Established";
export type CapitalTier = "Modest" | "Moderate" | "Substantial";

/** Fired portfolio finding tone (drives colour; rendered descriptive, never advice). */
export type PfTone = "Constructive" | "Neutral" | "Caution" | "Concern";

/** One fired portfolio finding (Part B) — copy + tone, rendered verbatim. */
export interface PfFinding {
  id: string; // "PC1"
  family: string; // PC | PB | PQ | PS | PV | PX
  label: string; // spec-verbatim short label
  tone: PfTone;
  loud: boolean; // top-level vs supporting
  bind: Record<string, unknown>; // exact values the copy was built from (never recomputed)
  read?: string; // spec-verbatim sentence (values filled) when the spec provides one
}

// ── deduction ledgers (Structure + Signals) — the engine's penalty tables, persisted
//    verbatim (portfolio-spec 1.1 A.6/A.7). The Health tab RENDERS these; it never
//    recomputes a penalty. Each entry's `points` is the positive magnitude subtracted
//    from that pillar's 100 floor. Structure/Signals are penalty-only, so a book with
//    an empty ledger simply took nothing off (calm, not blank).

/** Structure penalty rules (A.6): S1 single position · S2 sector pile-up · S3 thin
 *  breadth (Neff) · S4 over-diversification · S5 unverified mega-position. */
export type StructureRule = "S1" | "S2" | "S3" | "S4" | "S5";

/** One fired Structure rule. `points` = magnitude subtracted (0 for an honest
 *  not-evaluable entry, e.g. S2 killed by too much unknown-sector weight — `detail`
 *  says why). `symbol` present only for per-holding rules (S1, S5). */
export interface StructureDeduction {
  rule: StructureRule;
  points: number;
  detail: string; // human-readable, spec-derived (e.g. "HDFCBANK 60.0% > 25% → −25.00")
  symbol?: string;
}

/** The winning per-holding red-flag source Signals deducted on (headline-first, then
 *  single-largest — never two lenses summed on one name). */
export type SignalSource = "distress" | "critical" | "high" | "medium" | "lp5" | "lp6";

/** One per-holding Signals deduction. `points` = base magnitude × book weight, clamped. */
export interface SignalsDeduction {
  symbol: string;
  weight: number; // book weight of the flagged holding (0..1)
  source: SignalSource;
  points: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TWO-READ CONTRACT (portfolio-spec 1.2 — DECOUPLING) — one snapshot, two independent reads:
//   • constructionRead — ALWAYS present. Standalone Structure (full strength) + its band +
//     PC/PB findings + tier context. (Needs zero scored holdings.)
//   • healthRead — NULLABLE (present only when scoredWeight > 0). The Health Score (= Quality
//     − 0.20×(100−Signals), TRUE/UNCAPPED — no structure term, no ceiling) + band, Quality,
//     Signals, a Provisional tag, pillarProfile + lensProfile, and PQ/PS/PX/PV findings.
//   • headlineSlot — "health" if healthRead exists, else "construction".
//   • coverageState — the coverage story BOTH reads reference (the honesty layer for Health).
// The FE renders these verbatim; it never recomputes a score, penalty, weight or number.
// ─────────────────────────────────────────────────────────────────────────────

/** Which read leads the surface: the health number when there's a scored book, else the
 *  construction read (a 0-scored book is a construction read only). */
export type HeadlineSlot = "health" | "construction";

/** Construction band — a display band over the (already-computed) Structure pillar.
 *  ≥90 Well-built · 75–89 Solid · 60–74 Concentrated · 40–59 Lopsided · <40 Fragile. */
export type ConstructionBand = "Well-built" | "Solid" | "Concentrated" | "Lopsided" | "Fragile";

/** The coverage story both reads reference. Weights are from the frozen snapshot; counts
 *  are a live "N of M scored" read over the current book. */
export interface CoverageState {
  scoredWeight: number; // 0..1 (= the snapshot's coverage, c)
  recognizedUnscoredWeight: number; // 0..1 (large/mid, not yet scored)
  smallUnscoredWeight: number; // 0..1 (small/micro, not yet scored)
  scoredCount: number; // holdings with a score (live count)
  totalCount: number; // open holdings (live count)
  totalValue: number; // ₹ book value (denominator; lets the UI reconstruct ₹ splits)
  unlockTrigger: boolean; // recognized-unscored capital exists → scoring it raises coverage (1.2: lifts the confidence tag, never the number)
}

/** Construction read — ALWAYS present (the book's shape; needs no scored holdings). */
export interface ConstructionRead {
  value: number; // Structure pillar 0..100 (verbatim; penalty-only)
  band: ConstructionBand;
  structureTier: StructureTier | null; // Starter | Building | Established (pre-1.1 ⇒ null)
  capitalTier: CapitalTier | null; // Modest | Moderate | Substantial (pre-1.1 ⇒ null)
  findings: PfFinding[]; // PC + PB — OR every fired finding when there is NO health read
  structureLedger: StructureDeduction[]; // the S-rule evidence (nullable-defaulted upstream)
}

/** (1.2 Change 4) Book pillar means — position-weighted over scored holdings, renormalized
 *  over scored weight (Quality's denominator). Characterizes where the quality comes from. */
export interface PillarProfile {
  foundation: number; // 0..100
  momentum: number;
  market: number;
  ownership: number;
}

/** (1.2 Change 5) findings-CHARACTER shares of the book's fired lens findings by nature.
 *  Shares sum to 1. null ⇔ no lens patterns fired. NOT score attribution — the UI must never
 *  say "X% of your health is peer-relative"; it is a character read of the FINDINGS. */
export type LensProfile = { absolute: number; peer: number; trend: number } | null;

/** Health read — NULLABLE, present only when scoredWeight > 0. The Health Score (TRUE,
 *  uncapped) and everything that explains it. null for a 0-scored (construction-only) book. */
export interface HealthRead {
  value: number | null; // the Health Score — TRUE / UNCAPPED (was "PHS"); present ⇒ integer
  band: PhsBand | null;
  quality: number | null; // the anchor
  signals: number; // penalty-only — the ONLY term in Health besides Quality
  evaluable: boolean; // always true when this read is present
  provisional: boolean; // (1.2 Change 3) coverage < 40% → "Provisional" tag (ceiling retired)
  findings: PfFinding[]; // PQ + PS + PX + PV
  signalsLedger: SignalsDeduction[]; // the red-flag evidence
  pillarProfile: PillarProfile | null; // (1.2 Change 4)
  lensProfile: LensProfile; // (1.2 Change 5) null ⇔ no lens patterns fired
}

/** The pre-computed Portfolio Health Score snapshot, presentation-split into two named
 *  reads over the SAME stored values (no recompute; byte-identical to the flat shape). */
export interface PortfolioSnapshot {
  id: string;
  headlineSlot: HeadlineSlot;
  coverageState: CoverageState;
  constructionRead: ConstructionRead; // ALWAYS present
  healthRead: HealthRead | null; // null ⇔ scoredWeight = 0
  constantVersion: string;
  asOf: string; // ISO
}

export interface PortfolioSnapshotResponse {
  snapshot: PortfolioSnapshot | null;
  hasHoldings: boolean;
}

/** Stock condition band (per-holding health). */
export type StockBand = "fragile" | "below_par" | "steady" | "healthy" | "pristine";
export type McapTier = "large" | "mid" | "small" | "unknown";

/** One materialized holding, enriched with the live read layer. Money fields are
 *  normalized to numbers by the hook; null ⇒ honestly unavailable (never faked). */
export interface Holding {
  symbol: string;
  name: string;
  sector: string | null;
  quantity: number;
  avgCost: number;
  investedValue: number;
  realizedPnl: number;
  currentPrice: number | null;
  marketValue: number | null;
  dayChangePct: number | null; // stock % move at last close
  dayChangeValue: number | null; // position ₹ move at last close
  unrealizedPnl: number | null; // marketValue − invested
  health: number | null; // stock composite 0..100 (null ⇒ unscored)
  band: StockBand | null;
  healthAsOf: string | null;
  tier: McapTier;
  weight: number; // book weight by value (0..1)
}

export interface HoldingsTotals {
  positions: number;
  pricedPositions: number;
  investedValue: number;
  realizedPnlAll: number;
  currentValue: number;
  unrealizedPnl: number;
  dayChangeValue: number;
  dayChangePct: number | null;
}

export interface HoldingsResponse {
  holdings: Holding[];
  totals: HoldingsTotals;
}

// ── Ledger (transactions) — GET/POST/PATCH/DELETE /api/v1/me/transactions ─────────
/** The five ledger event types the backend accepts (fifo-engine + corporate actions).
 *  buy/sell touch the register; split/bonus reshape lots by a ratio; dividend is a cash
 *  event that never touches the register. */
export type TransactionType = "buy" | "sell" | "split" | "bonus" | "dividend";

/** One ledger row, normalized from the wire (money as strings → numbers). The ledger is
 *  the SOURCE OF TRUTH; holdings/PHS/NAV are replayed from it server-side on every write.
 *  Per-type field meaning:
 *   • buy/sell   → quantity + price (₹/share); value = qty×price
 *   • dividend   → price carries the cash AMOUNT (₹); quantity null (never hits the register)
 *   • split/bonus→ ratio "a:b"; quantity/price null (factor (a+b)/b reshapes the lots) */
export interface Transaction {
  id: string;
  symbol: string;
  type: TransactionType;
  quantity: number | null;
  price: number | null;
  fees: number | null; // ₹ total charges (brokerage+STT+…); folds into basis/proceeds server-side; null = none recorded
  tradeDate: string; // "YYYY-MM-DD"
  ratio: string | null; // "a:b" for split/bonus
  notes: string | null;
  createdAt: string; // ISO
}

/** POST body (add). tradeDate is "YYYY-MM-DD"; per-type required fields validated both
 *  client-side and by the backend Zod schema. */
export interface TransactionInput {
  symbol: string;
  type: TransactionType;
  tradeDate: string;
  quantity?: number;
  price?: number;
  fees?: number; // optional ₹ charge (≥0); absent = 0
  ratio?: string;
  notes?: string;
}

/** PATCH body — symbol/stock is NOT editable server-side (correct the numbers/type/date). */
export type TransactionPatch = Omit<TransactionInput, "symbol">;

// ── NAV series (value-over-time) — GET /api/v1/me/portfolio/nav ──────────────────
/** One trading-day point of portfolio market value. */
export interface NavPoint {
  date: string; // "YYYY-MM-DD"
  value: number; // ₹ at that day's closes
}
export interface NavMeta {
  period: string;
  firstDate: string | null; // first buy's first trading day (full range)
  lastDate: string | null; // last close ("at last close")
  points: number; // points in this response
  totalPoints: number; // points in the full series
  symbolsWithoutPrice: string[]; // held names with no close (contributed 0)
  basis: string; // "eod_close"
  currency: string; // "INR"
}
export interface NavResponse {
  series: NavPoint[];
  meta: NavMeta;
}

// ── Benchmark index series (Nifty 50) — GET /api/v1/me/portfolio/benchmark ───────
/** One trading-day close of the benchmark index. */
export interface BenchmarkPoint {
  date: string; // "YYYY-MM-DD"
  close: number; // index level
}
export interface BenchmarkMeta {
  indexName: string; // "Nifty 50"
  period: string;
  firstDate: string | null;
  lastDate: string | null;
  points: number;
  basis: string; // "eod_close"
}
export interface BenchmarkResponse {
  series: BenchmarkPoint[];
  meta: BenchmarkMeta;
}

// ── TWR (time-weighted return) — GET /api/v1/me/portfolio/twr ────────────────────
/** One trading-day point of cumulative time-weighted return, indexed to 100 at start. */
export interface TwrPoint {
  date: string; // "YYYY-MM-DD"
  twrIndex: number; // cumulative TWR, 100 = the first day
}
export interface TwrScalars {
  totalTwrPct: number | null; // cumulative TWR % (index − 100)
  annualizedPct: number | null; // CAGR of the index; null when span < ~30d
  days: number;
  firstDate: string | null;
  lastDate: string | null;
}
export interface TwrResponse {
  series: TwrPoint[];
  scalars: TwrScalars;
  meta: { basis: string; indexedTo: number };
}

// ── XIRR (money-weighted / internal rate of return) — GET /api/v1/me/portfolio/xirr ──
/** Why a book has no XIRR (honest null, never a garbage number). */
export type XirrState =
  | "ok"
  | "empty" // no cashflows
  | "single_cashflow" // < 2 flows → undefined
  | "no_sign_change" // all one sign → no root exists
  | "insufficient_history" // span too short to annualize honestly
  | "non_convergent"; // solver didn't pin a root

/** The money-weighted return: the annual rate that zeroes the ledger's dated cashflows +
 *  current value. The COMPLEMENT to TWR ("what did my timing earn" vs "how did picks do").
 *  `xirrPct` is null on any non-"ok" state; `state` says why. */
export interface XirrResponse {
  xirrPct: number | null; // annualized money-weighted return %
  state: XirrState;
  method: "newton" | "bisection" | null; // how it converged
  flowCount: number; // dated cashflows solved (incl. the terminal value)
  currentValue: number | null; // ₹ terminal value at last close
  firstDate: string | null; // first cashflow (first buy)
  lastDate: string | null; // terminal (as-of last close)
  days: number; // span first → terminal
  meta: { basis: string; terminalBasis: string; annualized: boolean };
}
