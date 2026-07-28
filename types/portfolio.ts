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
  family: string; // PC | PB | PQ | PS | PV | PX | PI
  label: string; // spec-verbatim short label
  tone: PfTone;
  loud: boolean; // top-level vs supporting
  bind: Record<string, unknown>; // exact values the copy was built from (never recomputed)
  read?: string; // spec-verbatim sentence (values filled) when the spec provides one
  /**
   * ★ (Stage 9) The "this doesn't mean…" clause — backend-authored (copy.ts), served on EVERY finding,
   * rendered verbatim. It is the hedge that stops a descriptive finding being read as a verdict, and it
   * belongs one tap away in the reference layer (never in the story's prose — §4). Optional on the wire
   * only so demo/mock fixtures need not carry it; the live payload always sends it.
   */
  doesntMean?: string;
  /**
   * ★ (Stage 10b) A stitchable fragment — present ⇔ the finding is story-eligible (PC/PB + the two
   * headline PI facts). The story composer spends it; the FE never renders it directly (the composed
   * `story.text` already contains it). Carried on the type so a renderer can tell a story-eligible
   * finding from reference texture. Absent on PD (reference-only) and the quiet PI facts.
   */
  storyClause?: string;
  /**
   * ★ (Stage 10a batch 3) PRESENT ⇔ THE FINDING FIRED WITHOUT AN ANSWER. Set only by the PI family.
   *
   * ⚠ A RENDERER THAT IGNORES THIS FIELD SHIPS THE BUG THE FIELD EXISTS TO PREVENT. A not-evaluable PI1
   * carries `bind.premium === null` — draw it in the normal finding chrome and you get "Trading away from
   * NAV" over a blank number, which reads as a premium of zero. It is not zero; we did not measure it.
   * `read` already says so in words and the panel must not contradict it in layout.
   *
   * `cls` decides the SHAPE, exactly as it does on the backend (null-reasons.ts):
   *   our_gap / world_gap / not_a_gap — an absence. Render it as one.
   *   ★ refused — NOT an absence. A number exists and we declined to publish it, because our own quality
   *     gate caught something. Rendering this as "unavailable" tells the user we are missing data when
   *     what actually happened is that we protected them from a wrong number. It is the most Vytal state
   *     in the payload and the easiest one to flatten into a grey dash.
   */
  notEvaluable?: {
    reason: string; // the machine code — an OmissionCode / NullReason. Never prose; never rendered raw.
    cls: "our_gap" | "world_gap" | "not_a_gap" | "refused";
  };
}

// ── deduction ledgers (Structure + Signals) — the engine's penalty tables, persisted
//    verbatim (portfolio-spec 1.1 A.6/A.7). The Health tab RENDERS these; it never
//    recomputes a penalty. Each entry's `points` is the positive magnitude subtracted
//    from that pillar's 100 floor. Structure/Signals are penalty-only, so a book with
//    an empty ledger simply took nothing off (calm, not blank).

/** Structure penalty rules (A.6): S1 single position · S2 sector pile-up · S3 thin
 *  breadth (Neff) · S4 over-diversification · S5 unverified mega-position. */

// (Construction v2 Stage 9 §15) `StructureRule` + `StructureDeduction` are DELETED with S1–S5.
// A TYPE FOR A THING THAT NO LONGER EXISTS is the phantom-citation disease in type form: it LOOKS like it
// describes reality, it invites trust, and it describes nothing. Worse than dead code — it is
// DOCUMENTATION THE COMPILER ENDORSES. Both formed a closed loop here (StructureRule referenced only by
// StructureDeduction; StructureDeduction referenced by nothing, in either repo). Construction is C1–C6
// (`ConstructionRule`); the `structure` COLUMN now carries `construction.net`.

/** The winning per-holding red-flag source Signals deducted on (headline-first, then
 *  single-largest — never two lenses summed on one name). */
export type SignalSource = "distress" | "critical" | "high" | "medium" | "lp5" | "lp6";

/** One per-holding Signals deduction. `points` = base magnitude × book weight, clamped. */
export interface SignalsDeduction {
  symbol: string;
  weight: number; // SCORED-slice share of the flagged holding (w_i / sumWScored, 0..1) — the denominator the deduction was computed over, NOT the whole-book share
  source: SignalSource;
  points: number;
  // whole-book share of the flagged holding (0..1) — the true "of book" number, matching the
  // Holdings table and PS1. OPTIONAL: a pre-thread snapshot carries no bookWeight; render null-safe
  // (fall back to `weight`) until the book's next rescore threads it.
  bookWeight?: number | null;
  // ── the WINNING finding's identity (backend thread). OPTIONAL/nullable: a snapshot served from
  //    before the identity thread (its fingerprint didn't change) carries the old ledger, so these are
  //    absent until the book's next rescore. Render null-safe — fall back to the `source` label alone. ──
  flagKey?: string | null; // e.g. "ownership_R6_distribution"; null for a band-derived distress headline
  title?: string | null; // e.g. "Distribution Pattern" — what fired, beside the severity
  read?: string | null; // the finding's short read / verdict; null when the source carries none
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

/** Construction band — a display band over the Construction Net (C1–C6). (Stage 6) recut for the
 *  [~20,100] range: ≥85 Well-built · 70–84 Solid · 55–69 Concentrated · 40–54 Lopsided · <40 Precarious.
 *  Bottom band renamed Fragile → Precarious (Fragile is also a Health band — one collision removed). */
export type ConstructionBand = "Well-built" | "Solid" | "Concentrated" | "Lopsided" | "Precarious";

/** (Construction v2 Stage 6) the archetype label — descriptive composition, never good/bad, never scored. */
export type Archetype = "Income-led" | "Commodity-led" | "Stock-led" | "Fund-led" | "Blended";

/** (Stage 6) overlapping composition-exposure lenses (a bond is name-risk AND debt). */
export interface Exposures {
  nameRisk: number;
  basket: number;
  debt: number;
  commodity: number;
}

/** (Stage 6) the structured subject a Construction rule fired on — the FE renders from THESE fields,
 *  never by parsing `detail`. null when clean or not-evaluable. */
export type FiredSubject =
  | { kind: "entity"; label: string; weight: number }
  | { kind: "sector"; label: string; weight: number }
  | { kind: "house"; label: string; weight: number }
  | { kind: "breadth" } // (Stage 7) the numbers moved to `metrics` — a measurement is not a subject
  | { kind: "count"; count: number };

/** (Stage 7) what a rule MEASURED — present whether or not it fired. `firedSubject` is a fire-time
 *  artifact (null when clean), but a clean C2 still measured its Neff; until Stage 7 that number
 *  survived only inside `detail` prose, which is exactly what these structured fields exist to avoid. */
export interface CMetrics {
  neff?: number; // C2 → Neff over entities · C4 → Neff over sector totals
  target?: number; // C2 → the target · C4 → min(target, Neff_unit)
  neffUnit?: number; // C4 only — Neff over UNITS (entities post-aggregation), never positions
  houseUnknown?: number; // C5 only — fund-product share whose house did not resolve
}

/** (Stage 6) one Construction rule (C1…C6), verbatim off `construction_data.rules`. */
export type ConstructionRule = "C1" | "C2" | "C3" | "C4" | "C5" | "C6";
export interface CDeduction {
  rule: ConstructionRule;
  evaluable: boolean; // false ⇔ NO SUBJECT (not-evaluable ≠ clean-0) — the evaluability panel reads it
  points: number;
  subjectShare: number; // whole-book share the rule's subject occupies
  firedSubject: FiredSubject | null;
  metrics: CMetrics | null; // (Stage 7) measurements — present even when the rule is clean
  detail: string; // human copy ONLY — never a data source
}

/** The coverage story both reads reference. Weights are from the frozen snapshot; counts
 *  are a live "N of M scored" read over the current book. */
export interface CoverageState {
  scoredWeight: number; // 0..1 (= the snapshot's coverage, c)
  recognizedUnscoredWeight: number; // 0..1 (large/mid, not yet scored)
  smallUnscoredWeight: number; // 0..1 (small/micro, not yet scored)
  /** (Stage 9) "N of M" — counted server-side over the SAME aggregated book the coverage % is made of,
   *  and frozen beside it. NOT a live count: it used to be one, over a different population, which is how
   *  "Covers 1 of 1 holdings · 100% of book value" rendered for a three-position book. Null on pre-2.0
   *  rows with no construction_data — render the % alone rather than a fabricated "0 of 0". */
  scoredCount: number | null;
  totalCount: number | null;
  totalValue: number; // ₹ book value (denominator; lets the UI reconstruct ₹ splits)
  unlockTrigger: boolean; // recognized-unscored capital exists → scoring it raises coverage (1.2: lifts the confidence tag, never the number)
}

/** Construction read — ALWAYS present (the book's shape; needs no scored holdings). (Stage 6) the
 *  evidence is now the C1–C6 ledger; `archetype`/`exposures`/`rules`/`gross` are null on legacy /
 *  no-holding rows (no construction_data) → the FE degrades to value + band. */
export interface ConstructionRead {
  value: number; // the Construction Net 0..100 (verbatim)
  band: ConstructionBand; // recut cutoffs · bottom band Precarious
  archetype: Archetype | null; // Stock-led | Fund-led | Blended | Income-led | Commodity-led
  exposures: Exposures | null; // composition shares
  rules: CDeduction[] | null; // [C1…C6] — the evaluability panel + ShapePicture read THESE structured fields
  gross: number | null; // C1+C2 decomposition (never a competing score)
  capitalTier: CapitalTier | null; // (Stage 6) COPY INPUT ONLY — never a badge. structureTier retired.
  findings: PfFinding[]; // PC + PB — OR every fired finding when there is NO health read
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

/** (Stage 10b) One narrative beat. `movement` is 1–4; `used` are the finding ids it SPENT (everything
 *  else is in `reference`). The FE renders `text` as continuous prose — no header, no box (§3). */
export interface StoryMovement {
  movement: 1 | 2 | 3 | 4;
  text: string;
  used: string[];
}

/** (Stage 10b) The composed storyboard. Composed at read from the fired set — stored nowhere.
 *
 *  ⚠ `reference` HOLDS EVERY FIRED FINDING, INCLUDING THE ONES `used` NAMES. Nothing is suppressed
 *  (§9.3) — the story PICKS, the reference KEEPS. A renderer that hides a finding because it appears in
 *  `used` would be deleting from the catalog to avoid a repeat; the correct move is to render the
 *  reference in full and let the prose sit above it. The Doesn't-mean lives on each reference item, one
 *  tap away (§4) — it is deliberately NOT in `text`. */
export interface Storyboard {
  movements: StoryMovement[];
  text: string; // the whole story, stitched — what the reader reads first
  used: string[];
  reference: PfFinding[]; // everything fired, ranked; nothing dropped
}

/** The pre-computed Portfolio Health Score snapshot, presentation-split into two named
 *  reads over the SAME stored values (no recompute; byte-identical to the flat shape). */
export interface PortfolioSnapshot {
  id: string;
  headlineSlot: HeadlineSlot;
  coverageState: CoverageState;
  constructionRead: ConstructionRead; // ALWAYS present
  healthRead: HealthRead | null; // null ⇔ scoredWeight = 0
  /** (Stage 10b) The storyboard, or null (pre-2.0 row / no scored holdings). */
  story: Storyboard | null;
  constantVersion: string;
  asOf: string; // ISO
}

export interface PortfolioSnapshotResponse {
  snapshot: PortfolioSnapshot | null;
  hasHoldings: boolean;
  /**
   * (Construction v2 Stage 10a) The PD family — disclosures. Panel 6, reference-only, ALWAYS.
   *
   * ★ IT SITS BESIDE `snapshot`, NOT INSIDE IT, AND THE PLACEMENT IS THE POINT. Every other finding on
   * this page describes the USER'S BOOK. A PD finding describes VYTAL: what our data does not carry, and
   * whose gap that is. Different subject — so it is not part of the snapshot, it is not persisted with
   * one, and it is served even when `snapshot` is null (its truth never depended on the book).
   *
   * ⚠ NEVER RENDER THESE AS CAUTIONS ABOUT THE HOLDINGS. "No credit ratings" means WE cannot source
   * them, not that the bonds are unrated — the misreading these sentences exist to block is the reader
   * taking our gap and attributing it to their money. Every one carries a `doesntMean` that says so.
   * They are Neutral and quiet by construction, and none carries a `storyClause`: reference-only means
   * ineligible for the story, enforced by the absence of the field rather than by a filter.
   */
  referenceFindings: PfFinding[];
  /**
   * (X3) The disclosure channel — what we hold but could not value, what we value but never score, and
   * which accounts are frozen. Served ALWAYS (even when `snapshot` is null). Money fields ride as strings
   * (the snapshot hook does not normalize them); the frontend renders the served `note` objects and does
   * not do arithmetic on them here. Mirrors the backend `PortfolioDisclosure` + `constructionValuation`.
   */
  disclosure: PortfolioDisclosure;
}

/** A position we hold but could NOT price. `note` is the served { code, cls, sentence } for its
 *  `unpricedReason` — the SAME note the /me/holdings row carries, so the summary and the row never
 *  disagree. `note` is null only on the defensive no-reason path. */
export interface DisclosureHeldNotValued {
  symbol: string;
  accountId: string;
  accountName: string;
  source: "manual" | "broker";
  quantity: string;
  brokerCurrentValue: string | null;
  stale: boolean;
  lastSyncedAt: string | null;
  unpricedReason: string | null;
  note: DisclosureNote | null;
}

/** A position we CAN value but never score (a fund/ETF/REIT/bond…). Valued capital, deliberately unjudged. */
export interface DisclosureHeldNotScored {
  symbol: string;
  accountId: string;
  accountName: string;
  source: "manual" | "broker";
  quantity: string;
  marketValue: string;
  priceSource: string;
  priceAsOf: string | null;
  assetClass: string;
  isin: string;
  category: string | null;
  stale: boolean;
  lastSyncedAt: string | null;
}

/** A severed account whose holdings are a frozen last-known snapshot. `ageDays` grows daily (read-time). */
export interface DisclosureStaleAccount {
  accountId: string;
  accountName: string;
  broker: string | null;
  lastSyncedAt: string | null;
  ageDays: number | null;
  positions: number;
}

/** `data.disclosure` — the aggregate disclosure channel (see PortfolioSnapshotResponse.disclosure). */
export interface PortfolioDisclosure {
  heldNotValued: DisclosureHeldNotValued[];
  heldNotScored: DisclosureHeldNotScored[];
  positionCount: number;
  heldNotScoredValue: string;
  staleAccounts: DisclosureStaleAccount[];
  staleAccountCount: number;
  oldestSyncAgeDays: number | null;
  unvaluedValue: string;
  unvaluedShare: number;
  constructionProvisional: boolean;
}

// ── DISCLOSURE TAXONOMY (X3) — the four-class tone + the served, composed note ──────────────────────
/** WHOSE gap (or non-gap) a disclosure is — the backend's `NullReasonClass`, verbatim. It picks the
 *  render TONE only; it never picks words. `our_gap`/`world_gap` = a limit (light caution), `not_a_gap` =
 *  the instrument's nature (neutral, by-design), `refused` = a deliberate withholding (firmer). */
export type NullReasonClass = "our_gap" | "world_gap" | "not_a_gap" | "refused";

/** One rendered disclosure, composed BACKEND-SIDE and authoritative. `sentence` is rendered verbatim —
 *  the frontend never composes, maps, or rewrites it, and there is no code→sentence map on the client.
 *  `cls` chooses colour/weight/icon only. See `HoldingDisclosure`. */
export interface DisclosureNote {
  code: string; // machine code (held_not_scored | no_instrument | … | coupon_income_not_tracked | …)
  cls: NullReasonClass;
  sentence: string; // the served prose — render as-is
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
  /** The account this position sits in — a per-account line from listUnifiedPositions. Present on
   *  the live wire; optional here so demo/mock fixtures need not carry it. */
  accountId?: string;
  /** (Combined-book display) The immutable security id + the Construction engine's issuer key
   *  (`isin.slice(0,7)` for name-risk; null for baskets/gold/sovereign). Served so the Health holdings
   *  table can group ACROSS ACCOUNTS by the SAME key the engine collapses on — RELIANCE in two accounts
   *  = one entity, an NTPC stock+bond = one entity. The display groups on `entityKey ?? isin`. Optional
   *  (like accountId) so demo/mock fixtures need not carry them. */
  isin?: string | null;
  entityKey?: string | null;
  /** WHAT KIND OF THING THIS IS. The backend has always sent it (holdings-controller); this hook
   *  simply never mapped it, which is why every surface fell back to `sector` alone and printed
   *  "Unclassified" over an ETF — a sector it was never going to have. Read it through
   *  `holdingClass()`, never bare. Optional (like accountId) so demo/mock fixtures need not carry
   *  it; absent ⇒ we don't know the class, and the sector fallback stands. */
  assetClass?: AssetClass | null;
  /** (X3) Every disclosure this holding carries — held-not-scored (by-design), unpriced (our gap), a
   *  coupon/discount code — each as a served { code, cls, sentence }. Rendered verbatim by
   *  `HoldingDisclosure`; NEVER re-composed here. Empty for a scored, priced, non-coupon holding.
   *  Optional (like accountId/assetClass) so demo/mock fixtures need not carry it; absent ⇒ treat as []. */
  disclosureNotes?: DisclosureNote[];
  /** (Holdings tab · account dimension) The account's display NAME — served by /me/holdings beside
   *  `accountId`, previously dropped by the hook. Optional (like accountId) so demo/mock fixtures need
   *  not carry it. Lets a holdings row show WHICH account(s) hold it without a second fetch. */
  accountName?: string;
  /** (Holdings tab · price stamp) WHO priced this row and the day the price belongs to. `priceSource` is
   *  `stock_price | exchange_close | amfi_nav`; `priceAsOf` is an ISO date. Both served by /me/holdings and
   *  previously dropped by the hook. A NAV must never render as "at last close" — see `priceStamp()`.
   *  Optional so demo/mock fixtures need not carry them; absent ⇒ no stamp shown. */
  priceSource?: string | null;
  priceAsOf?: string | null;
  /** (Stored-series sparkline) The catalogue instrument id — the KEY for
   *  GET /instruments/:instrumentId/series (the stored weekly NAV the holdings expand charts for a
   *  fund/ETF/listed non-stock). Served by /me/holdings; optional so demo/mock fixtures need not carry it. */
  instrumentId?: string | null;
  /** (Fund-page link) The instrument's AMFI scheme code — funds/ETFs only; `null` for
   *  stock/bond/gsec/sgb/reit/invit. The key for the /research/funds/{schemeCode} link; the FE gates the
   *  link on its presence. Served by /me/holdings; optional for demo/mock fixtures. */
  schemeCode?: string | null;
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

// ── Accounts (the books holdings live in) — GET /me/accounts ───────────────────────
/** An account's lifecycle. `manual` = the user's own ledger (Stated). `linked_live` /
 *  `linked_stale` = broker-fed (Verified). */
export type AccountState = "manual" | "linked_live" | "linked_stale";

/** Liveness of a broker-linked account. `null` for a Stated (manual) account — nothing syncs. */
export interface AccountStaleness {
  isStale: boolean; // true ⇔ linked_stale (the feed is severed; data is frozen, still real)
  lastSyncedAt: string | null; // ISO; null ⇒ never synced
  ageDays: number | null; // whole days since the last sync (derived server-side at read time)
  sessionState: "live" | "dead" | null;
  brokerAccountRef: string | null; // which demat (non-secret) — disambiguates two books at one broker
}

/** One portfolio account (a book of holdings) → the serialize() shape in accounts-controller.ts.
 *  NOTE: `broker` is NOT NULL in the schema — the controller's stale "null = pure-manual" comment
 *  is wrong; it is typed non-nullable here. It is an enum id, never rendered raw (resolved to a
 *  catalogue label). */
export interface Account {
  id: string;
  name: string;
  broker: string;
  brokerConnectionId: string | null;
  state: AccountState;
  manualEntryAllowed: boolean;
  staleness: AccountStaleness | null;
  transactionCount: number;
  holdingCount: number;
  createdAt: string;
  updatedAt: string;
}

/** One row of the create-account broker picker → GET /me/accounts/brokers (pickableBrokers()). */
export interface BrokerCatalogEntry {
  id: string;
  displayName: string;
  logoRef: string;
  /** Has a working adapter ⇒ an account tagged with it can be connected to the real feed. The
   *  ONLY source of "can this be linked" — never hardcode a broker list. */
  linkable: boolean;
}

// ── Broker connections (the live feed side) — GET /me/brokers ──────────────────────
/** Static per-broker identity (BrokerMeta). The `available` list on the status response is THE
 *  "adapted set": every broker with a working adapter — the complete source for "can this be
 *  connected", and the ONLY place `mock`'s label ("Mock Broker") is exposed (it is excluded from
 *  the pickable account catalogue by design). Pairs with BrokerCatalogEntry.linkable so the UI
 *  never hardcodes a broker id. */
export interface BrokerMeta {
  id: string;
  displayName: string;
  logoRef: string;
}

/** One of the user's broker connections → the view() shape in lifecycle.ts. The feed behind a
 *  Verified account. We use `id` (the address for sync/link) and `lastSyncedAt` (liveness). */
export interface BrokerConnectionView {
  id: string;
  broker: string;
  brokerAccountRef: string;
  linkedAccountId: string | null; // the §2.3-bound account, or null while integrated-but-unlinked
  displayName: string;
  logoRef: string;
  enabled: boolean;
  state: "active" | "inactive";
  sessionState: "live" | "dead";
  sessionExpiresAt: string | null;
  lastSyncedAt: string | null;
  holdingsCount: number;
  createdAt: string;
  updatedAt: string;
}

/** GET /me/brokers → the user's connections + the adapted set (implemented brokers). */
export interface BrokerStatus {
  connections: BrokerConnectionView[];
  available: BrokerMeta[];
}

/** POST /brokers/:broker/auth/initiate → the interactive (OAuth) login URL to redirect to. */
export interface BrokerAuthInitiation {
  broker: string;
  authUrl: string;
}

// ── Transfer (move a whole manual book to safety before linking) — POST /accounts/:id/transfer-all ──
/** One instrument's before→after on the destination (money as Decimal strings, verbatim). Surfaced
 *  so a transfer can SHOW what moved without recomputing anything. */
export interface PositionDelta {
  symbol: string;
  quantityBefore: string;
  quantityAfter: string;
  avgCostBefore: string;
  avgCostAfter: string;
  realizedPnlBefore: string;
  realizedPnlAfter: string;
}

/** One synthetic buy written by a RESCUE (linked → Stated). Quantity + costPerShare are the
 *  broker's real figures; `tradeDate` is FABRICATED — the broker feed carries no purchase date, so
 *  it is the day the shares were last verified held (dateOnly(syncedAt)). Surfaced by the backend
 *  SPECIFICALLY so the UI can show that date; it must never be hidden or softened. `note` is the
 *  greppable rescue tag written onto the ledger row. */
export interface RescuedBuy {
  symbol: string;
  quantity: string;
  costPerShare: string;
  tradeDate: string; // "YYYY-MM-DD" — FABRICATED (not the real purchase date)
  note: string;
}

/** POST /accounts/:id/transfer-all → data. `kind:"manual_all"` for the whole-account move; with
 *  deleteSource:false the source survives (sourceKept:true, no deletedAccount). `kind:"rescue"`
 *  (linked → same-broker Stated, via the DELETE rescue door) additionally carries `rescued` — the
 *  synthetic buys, with their FABRICATED dates — and always deletes the source (connectionForgotten). */
export interface TransferResult {
  kind: "manual" | "manual_all" | "rescue";
  sourceAccountId: string;
  destinationAccountId: string;
  merged: boolean;
  dedupedCorporateActions: { symbol: string; type: string; tradeDate: string; ratio: string | null }[];
  destination: PositionDelta[];
  deletedAccount?: { id: string; name: string; connectionForgotten?: true };
  sourceKept?: boolean;
  /** rescue only — the synthetic buys written, surfaced so the fabricated DATE is visible. */
  rescued?: RescuedBuy[];
}

/** The 400 `confirmation_required` preview the rescue door returns for `confirm:false`: what WOULD
 *  be rescued, before anything is written. `tradeDate` is the FABRICATED date each synthetic buy
 *  will carry — the backend computes it (same rule as the write) so the confirm renders the exact
 *  date the ledger will record, never a second derivation. */
export interface RescuePreview {
  willRescue: { symbol: string; quantity: string; costPerShare: string; tradeDate: string }[];
  willDeleteAccount: string;
}

/** POST /me/accounts body. */
export interface CreateAccountInput {
  name: string;
  broker: string;
}

// ── Instrument catalogue search (universe-wide) — GET /api/v1/instruments/search ──────
/** The asset classes the catalogue publishes (instruments.asset_class). Kept as a string union for
 *  labelling/grouping; the wire sends the raw enum and unknown future values degrade gracefully. */
export type AssetClass = "stock" | "etf" | "bond" | "gsec" | "sgb" | "mutual_fund" | "reit" | "invit";

/** One search hit. `symbol` is null for 17,567 funds (no ticker at all); `isin` is the unambiguous
 *  key the picker submits. `assetClass` is the raw enum so the client can label + group; `isActive`
 *  marks a dormant/matured/delisted row (still addable by ISIN, but shown as inactive). */
export interface InstrumentSearchResult {
  isin: string;
  symbol: string | null;
  name: string;
  assetClass: string;
  isActive: boolean;
}

/** GET /api/v1/instruments/search → the response (returned DIRECTLY, no {success,data} envelope).
 *  `hasMore` is NEVER omitted — a capped list that looks complete is a lie, so the UI can always say
 *  "showing N of many"; `cursor` is the opaque keyset for the next page. */
export interface InstrumentSearchResponse {
  results: InstrumentSearchResult[];
  hasMore: boolean;
  cursor: string | null;
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
  /** The instrument's human-readable NAME (e.g. "Kotak Manufacture in India Fund…", "Reliance
   *  Industries Ltd"), carried on the /me/transactions wire (Instrument.name is NOT NULL). Optional
   *  here so demo/mock fixtures need not set it. The ledger prefers this over `symbol` as the visible
   *  holding label, so a ticker-less fund reads as its name, never its ISIN. */
  name?: string;
  type: TransactionType;
  quantity: number | null;
  price: number | null;
  fees: number | null; // ₹ total charges (brokerage+STT+…); folds into basis/proceeds server-side; null = none recorded
  tradeDate: string; // "YYYY-MM-DD"
  ratio: string | null; // "a:b" for split/bonus
  notes: string | null;
  createdAt: string; // ISO
  /** The instrument's asset class (stock | etf | bond | gsec | sgb | mutual_fund | reit | invit),
   *  carried on the /me/transactions wire. Optional here so demo/mock fixtures need not set it. Lets
   *  the ledger show a class chip and edit mode the coupon-bearing disclosure for a bond/gsec/sgb. */
  assetClass?: string;
  /** The account (book) this row lives in — carried on the /me/transactions wire (NOT NULL there).
   *  Optional here so demo/mock fixtures need not set it. The KEY the ledger's account filter narrows
   *  on; the account is FIXED at create (PATCH can't re-parent). */
  accountId?: string;
  /** The account's DISPLAY name ("Grow 1"/"demo"/"Test Book") — carried on the /me/transactions wire
   *  (PortfolioAccount.name is NOT NULL). Optional here so demo/mock fixtures need not set it. Shown as
   *  the per-row account chip + the account filter's option labels — NEVER the raw UUID. */
  accountName?: string;
  /** The instrument's ISIN — carried on the /me/transactions wire. Optional here so demo/mock fixtures
   *  need not set it. The ledger's muted reference column shows this for a fund/bond (a bond's ISIN is
   *  NOT its ticker), and the ticker/symbol for a stock; the NAME is the primary label. */
  isin?: string;
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
  /** Which account (book) this transaction lands in. Optional on the wire — absent, the backend
   *  resolves a single-account user's lone account — but the sheet ALWAYS sends it when the user has
   *  a Stated account, because the backend refuses to guess for a multi-account user (400
   *  account_required); that missing inference is exactly what broke manual entry. */
  accountId?: string;
}

/** PATCH body — symbol/stock AND account are NOT editable server-side (the instrument and the book
 *  are both fixed at create); correct the numbers/type/date only. Mirrors the backend
 *  `Base.partial().omit({ symbol, accountId })`. */
export type TransactionPatch = Omit<TransactionInput, "symbol" | "accountId">;

// ── NAV series (value-over-time) — GET /api/v1/me/portfolio/nav ──────────────────
/** One trading-day point of portfolio market value. */
export interface NavPoint {
  date: string; // "YYYY-MM-DD"
  value: number; // ₹ at that day's closes
}
/** (Ruling C) What the ledgered series OMITS: broker-linked holdings that appear in the overview
 *  (the manual ⊎ broker union) but have no transaction history to draw, so the chart cannot reach
 *  them. Served on the NAV meta so the chart can DISCLOSE the gap rather than sit silently below the
 *  overview. `null` on the wire when there are no broker holdings — an absence carries no disclosure. */
export interface BrokerExcluded {
  count: number; // broker-linked holdings excluded from the series
  approxValue: number | null; // ₹ broker-reported currentValue of those holdings (best-effort)
}
export interface NavMeta {
  period: string;
  /** true ⇔ the book holds a non-stock instrument → the series is capped at 4Y (R6), no "All". */
  blended?: boolean;
  /** The deepest range the series can honestly offer: "4Y" for a blended book, else "ALL". */
  maxRange?: string;
  firstDate: string | null; // first buy's first trading day (full range)
  lastDate: string | null; // last close ("at last close")
  points: number; // points in this response
  totalPoints: number; // points in the full series
  symbolsWithoutPrice: string[]; // held names with no close (contributed 0)
  /** (Ruling C) The broker-linked gap, or null when the book has no broker holdings. */
  brokerHoldingsExcluded?: BrokerExcluded | null;
  basis: string; // "eod_close_live_endpoint"
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

// ── Score history (the daily Health/Construction series) — GET /api/v1/me/score-history ──
/** One day's stored PHS-write values. A row exists only for a day that had an EVALUABLE
 *  compute (phs non-null), so `phs` is always present. `structure` (Construction Net) is
 *  null on every row written before that column shipped — forward-only, never backfilled;
 *  a chart must skip a null point, never draw it as 0. `quality`/`signals` ride along for a
 *  future line but are not charted by default (Health's own internals). */
export interface ScoreHistoryPoint {
  date: string; // "YYYY-MM-DD"
  phs: number; // Health, 0..100 — always present
  quality: number | null;
  signals: number | null;
  structure: number | null; // Construction Net, 0..100 — null ⇒ not yet captured that day
  coverage: number | null; // 0..1 — scored value share that day
}
export interface ScoreHistoryResponse {
  series: ScoreHistoryPoint[];
}
