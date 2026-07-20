// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO HEALTH TAB — pure derivations over the stored snapshot + holdings. No JSX.
//
// The engine already computed everything: pillars, both deduction ledgers, and the
// fired PF findings (bind/tone/loud all persisted). This file only READS those and
// arranges them for the teaching surface — it NEVER recomputes a score, penalty, pillar
// or health weight. The one derivation it does is display arithmetic over holdings (value
// share, health × weight, band dispersion) — the same class the tracker already does,
// never a stored-score internal.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Holding,
  PfFinding,
  PfTone,
  PortfolioSnapshot,
  SignalSource,
  SignalsDeduction,
  StockBand,
  CDeduction,
  ConstructionRule,
} from "@/types/portfolio";
import { allFindings, flagsDragOf, holdingClass } from "../lib";
// The flags-drag weight + expression live in ONE place (../lib flagsDragOf) — Signals is the
// only term besides Quality in the v1.2 Health Score, and this file reconciles through that
// shared helper rather than carrying its own copy of W_SIGNAL.

// ── (Construction v2 Stage 6) construction rule identity — a short human name + the "why" per C-rule.
//    Keyed on C1…C6 (the S-rule meta is gone; the S-rules feed no display now). ─────────
export const CONSTRUCTION_RULE_META: Record<ConstructionRule, { title: string; what: string }> = {
  C1: { title: "Entity concentration", what: "one issuer carries an outsized share of the book" },
  C2: { title: "Entity breadth", what: "name-risk weight sits in too few effective issuers" },
  C3: { title: "Sector concentration", what: "one sector carries an outsized share of the book" },
  C4: { title: "Sector breadth", what: "sectored weight sits in too few effective sectors" },
  C5: { title: "Fund-house concentration", what: "one AMC carries an outsized share of your funds" },
  C6: { title: "Monitorability", what: "more holdings than can comfortably be tracked by hand" },
};

// ── signal source identity (A.7) — the winning red-flag kind per flagged holding ────
export const SIGNAL_SOURCE_META: Record<SignalSource, { label: string; tone: PfTone }> = {
  distress: { label: "Distress band", tone: "Concern" },
  critical: { label: "Critical red flag", tone: "Concern" },
  high: { label: "High red flag", tone: "Caution" },
  medium: { label: "Medium red flag", tone: "Caution" },
  lp5: { label: "Broad erosion", tone: "Caution" },
  lp6: { label: "Fading strength", tone: "Neutral" },
};

// ── ledgers — each nested in its read (structure on construction, signals on health).
//    Defensive: nullable on the wire; signalsLedger empty when there's no health read. ──
/** (Stage 6) the C1–C6 ledger, verbatim off the wire. null (legacy/no-holding row) → []. */
export function constructionRules(s: PortfolioSnapshot): CDeduction[] {
  return s.constructionRead.rules ?? [];
}
export function signalsLedger(s: PortfolioSnapshot): SignalsDeduction[] {
  return (s.healthRead?.signalsLedger as SignalsDeduction[] | undefined) ?? [];
}

/** Fired C-rules that actually took points off, largest first. */
export function firedRules(s: PortfolioSnapshot): CDeduction[] {
  return constructionRules(s)
    .filter((e) => e.points > 0.005)
    .sort((a, b) => b.points - a.points);
}
/** Rules with NO subject to measure — not-evaluable ≠ clean. §9.4's panel lists these as "not applicable". */
export function notEvaluableRules(s: PortfolioSnapshot): CDeduction[] {
  return constructionRules(s).filter((e) => !e.evaluable);
}
/** Rules that HAD a subject and took nothing off — "checked, clean". */
export function cleanRules(s: PortfolioSnapshot): CDeduction[] {
  return constructionRules(s).filter((e) => e.evaluable && e.points <= 0.005);
}

/** Per-holding Signals deductions, largest first. Empty ⇒ no active red flags. */
export function activeSignals(s: PortfolioSnapshot): SignalsDeduction[] {
  return signalsLedger(s)
    .filter((e) => e.points > 0.005)
    .sort((a, b) => b.points - a.points);
}

/** Symbols that fired a Signals deduction — used to mark flagged holdings for attention. */
export function flaggedSymbols(s: PortfolioSnapshot): Set<string> {
  return new Set(signalsLedger(s).map((e) => e.symbol));
}

// ── the Health waterfall (v1.2 — the two-step spine) — Quality anchor, ONE deduction for
//    active red flags, landing at Health. Reconciled from the stored Signals pillar, NOT
//    recomputed. Nothing about construction or coverage enters here — that is the whole
//    decoupling: Health answers "are the things I own sound?", not "is the book built well?" ──
export interface DeductionStory {
  quality: number; // the anchor — where the score starts (Quality of the businesses)
  signals: number; // stored Signals pillar (0..100)
  flagsDrag: number; // W_SIGNAL × (100 − signals) — the ONLY hit on the Health Score
  health: number; // the published Health Score the drag lands on
  signalPoints: number; // Σ signals ledger points (= the Signals gap 100 − signals)
}

/** Decompose the PUBLISHED Health Score into anchor − the one flags deduction. null when
 *  the book isn't evaluable (no scored holdings). By construction quality − flagsDrag ≈ health. */
export function deductionStory(s: PortfolioSnapshot): DeductionStory | null {
  const h = s.healthRead;
  if (!h || h.value == null || h.quality == null) return null;
  const flagsDrag = flagsDragOf(h.signals);
  const signalPoints = signalsLedger(s).reduce((a, e) => a + e.points, 0);
  return {
    quality: h.quality,
    signals: h.signals,
    flagsDrag,
    health: h.value,
    signalPoints,
  };
}

// ── Quality anchor composition — Quality has no stored per-holding ledger, so we DERIVE
//    each scored holding's contribution from the holdings read (health × renormalized
//    weight), exactly as the engine's A.5 weighted mean does. PQ1/PQ4 findings name the
//    movers; this shows the arithmetic behind the anchor. ─────────────────────────────
export interface QualityContribution {
  symbol: string;
  health: number;
  weight: number; // book weight by value (0..1)
  share: number; // weight renormalized over SCORED holdings (0..1) — the A.5 weight
  contribution: number; // share × health — how many of the Quality points this name adds
}
export function qualityContributions(holdings: Holding[]): QualityContribution[] {
  const scored = holdings.filter((h) => h.health != null && h.marketValue != null && h.marketValue > 0);
  const scoredValue = scored.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  if (scoredValue <= 0) return [];
  return scored
    .map((h) => {
      const share = (h.marketValue ?? 0) / scoredValue;
      return {
        symbol: h.symbol,
        health: h.health as number,
        weight: h.weight,
        share,
        contribution: share * (h.health as number),
      };
    })
    .sort((a, b) => b.contribution - a.contribution);
}

// ── PF finding triage (Part B) — loud headline vs quiet texture ─────────────────────
const TONE_ORDER: Record<PfTone, number> = { Concern: 0, Caution: 1, Neutral: 2, Constructive: 3 };

/** A finding's capital weight, for within-tone ordering. Findings whose bind carries a
 *  `weight` (concentration / exposure / coverage) sort by it; the rest (cross-pillar PX,
 *  which speak to the whole book) fall to 0 and sort after — they still headline. */
export function findingWeight(f: PfFinding): number {
  const w = f.bind?.weight;
  return typeof w === "number" ? w : 0;
}

export interface FindingTriage {
  loud: PfFinding[]; // headline cards — Concern → Constructive, then heavier capital first
  quiet: PfFinding[]; // secondary texture — present, never suppressed, not headlined
}

/** Triage a set of findings into loud (headline cards) vs quiet (texture). PV is filtered
 *  defensively — the coverage family renders in its own section (see ../lib coverageFindings),
 *  so routing it through the findings grid would double-count it. Feed this the health
 *  patterns (PQ/PS/PX) or the construction findings (PC/PB). */
export function triageFindings(findings: PfFinding[]): FindingTriage {
  const nonCoverage = findings.filter((f) => f.family !== "PV");
  const rank = (a: PfFinding, b: PfFinding) =>
    TONE_ORDER[a.tone] - TONE_ORDER[b.tone] || findingWeight(b) - findingWeight(a);
  return {
    loud: nonCoverage.filter((f) => f.loud).sort(rank),
    quiet: nonCoverage.filter((f) => !f.loud).sort(rank),
  };
}

/** Order PV coverage findings loudest-first (the coverage section renders these). */
export function orderCoverageFindings(findings: PfFinding[]): PfFinding[] {
  return [...findings].sort((a, b) => (a.loud === b.loud ? TONE_ORDER[a.tone] - TONE_ORDER[b.tone] : a.loud ? -1 : 1));
}

/** Is this a cross-pillar (PX) finding — the richest, naming a tension the single
 *  number blended away. Field-weak (PX5) stays Neutral and is never a warning. */
export function isCrossPillar(f: PfFinding): boolean {
  return f.family === "PX";
}

// ── bind → exact-value chips (the "receipts": 60%, Neff 1.92, 42% of value) ──────────
const pct1 = (w: number) => `${(w * 100).toFixed(1)}%`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface BindChip {
  key: string;
  text: string;
}

/** Render the exact numbers a finding was built from, verbatim from its stored bind —
 *  never recomputed. Only recognized keys surface; the order is stable and readable. */
export function bindChips(f: PfFinding): BindChip[] {
  const b = f.bind ?? {};
  const chips: BindChip[] = [];
  const push = (key: string, text: string) => chips.push({ key, text });
  const numv = (k: string): number | null => (typeof b[k] === "number" ? (b[k] as number) : null);

  if (typeof b.symbol === "string") push("symbol", b.symbol);
  if (typeof b.sector === "string") push("sector", b.sector);
  if (Array.isArray(b.symbols)) push("symbols", (b.symbols as unknown[]).join(", "));

  const weight = numv("weight");
  if (weight != null) push("weight", `${pct1(weight)} of value`);
  const neff = numv("neff");
  if (neff != null) push("neff", `Neff ${neff.toFixed(2)}`);
  const holdingCount = numv("holdingCount");
  if (holdingCount != null) push("holdingCount", `${holdingCount} holdings`);
  const quality = numv("quality");
  if (quality != null) push("quality", `Quality ${Math.round(quality)}`);
  const structure = numv("structure");
  if (structure != null) push("structure", `Structure ${Math.round(structure)}`);
  const signals = numv("signals");
  if (signals != null) push("signals", `Signals ${Math.round(signals)}`);
  const health = numv("health");
  if (health != null) push("health", `health ${Math.round(health)}`);
  if (typeof b.band === "string") push("band", cap(b.band));
  if (typeof b.healthBand === "string") push("healthBand", cap(b.healthBand as string));
  const minH = numv("minScoredHealth");
  if (minH != null) push("minScoredHealth", `min ${Math.round(minH)}`);
  const coverage = numv("coverage");
  if (coverage != null) push("coverage", `${pct1(coverage)} covered`);
  const maxSectorW = numv("maxSectorWeight");
  if (maxSectorW != null) push("maxSectorWeight", `top sector ${pct1(maxSectorW)}`);

  return chips;
}

// ── the descriptive sentence for a finding (spec Read, else its label) ──────────────
export function findingRead(f: PfFinding): string {
  return f.read ?? f.label;
}

// ── SHAPE — the book's structure, driven by the real inputs the ledgers penalized ───
/** The book's largest position + top-3 concentration (value share over priced book). */
export interface ConcentrationRead {
  largest: { symbol: string; weight: number } | null;
  top3: number;
  top3Names: { symbol: string; weight: number }[];
}
export function concentrationRead(holdings: Holding[]): ConcentrationRead {
  const priced = holdings.filter((h) => h.marketValue != null && h.marketValue > 0);
  const total = priced.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  if (total <= 0) return { largest: null, top3: 0, top3Names: [] };
  const sorted = [...priced].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));
  const named = sorted.slice(0, 3).map((h) => ({ symbol: h.symbol, weight: (h.marketValue ?? 0) / total }));
  return {
    largest: named[0] ?? null,
    top3: named.reduce((s, n) => s + n.weight, 0),
    top3Names: named,
  };
}

/** Effective breadth (Neff = inverse Herfindahl). Prefer the STORED value the engine computed —
 *  (Stage 7) C2's `metrics.neff`, else a PC5/PB1 finding bind — so the shape matches the penalty; fall
 *  back to a display computation over priced weights. NEVER parses ledger prose.
 *
 *  (Stage 7) This reads `metrics`, not `firedSubject`. It is a strict improvement: `firedSubject` is null
 *  when a rule is CLEAN, so a well-diversified book — the one whose Neff is most worth showing — used to
 *  fall through to the client-side recomputation below and render `stored: false`. The engine's own Neff
 *  is now available whether or not the rule fired. C2 is preferred over C4: C2's Neff is over ENTITIES
 *  (what "effective positions" means to a reader); C4's is over sector totals, a different question. */
export function effectiveBreadth(s: PortfolioSnapshot, holdings: Holding[]): { neff: number; stored: boolean } {
  const c2 = constructionRules(s).find((e) => e.rule === "C2");
  if (typeof c2?.metrics?.neff === "number") return { neff: c2.metrics.neff, stored: true };
  for (const f of allFindings(s)) {
    const n = f.bind?.neff;
    if (typeof n === "number") return { neff: n, stored: true };
  }
  const priced = holdings.filter((h) => h.marketValue != null && h.marketValue > 0);
  const total = priced.reduce((sum, h) => sum + (h.marketValue ?? 0), 0);
  if (total <= 0) return { neff: 0, stored: false };
  const sumSq = priced.reduce((sum, h) => {
    const w = (h.marketValue ?? 0) / total;
    return sum + w * w;
  }, 0);
  return { neff: sumSq > 0 ? 1 / sumSq : 0, stored: false };
}

/** Sector splits (value share, largest first) — the S2 pile-up made visible. */
export interface SectorSlice {
  sector: string;
  weight: number;
}
export function sectorSlices(holdings: Holding[]): SectorSlice[] {
  const priced = holdings.filter((h) => h.marketValue != null && h.marketValue > 0);
  const total = priced.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  if (total <= 0) return [];
  const by = new Map<string, number>();
  for (const h of priced) {
    const key = holdingClass(h);
    by.set(key, (by.get(key) ?? 0) + (h.marketValue ?? 0));
  }
  return [...by.entries()].map(([sector, v]) => ({ sector, weight: v / total })).sort((a, b) => b.weight - a.weight);
}

// ── capital-across-health-band dispersion — the old tab's "average hides the spread".
//    SCORED holdings grouped by their own condition band, weighted by book value share.
//    Unscored capital surfaces honestly as its own slice (never folded into a band). ──
export interface BandSlice {
  band: StockBand | "unscored";
  weight: number; // share of TOTAL book value (0..1)
}
const BAND_DISPERSION_ORDER: (StockBand | "unscored")[] = [
  "pristine",
  "healthy",
  "steady",
  "below_par",
  "fragile",
  "unscored",
];
export function capitalByBand(holdings: Holding[]): BandSlice[] {
  const priced = holdings.filter((h) => h.marketValue != null && h.marketValue > 0);
  const total = priced.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  if (total <= 0) return [];
  const by = new Map<StockBand | "unscored", number>();
  for (const h of priced) {
    const key: StockBand | "unscored" = h.band ?? "unscored";
    by.set(key, (by.get(key) ?? 0) + (h.marketValue ?? 0));
  }
  return BAND_DISPERSION_ORDER.filter((b) => (by.get(b) ?? 0) > 0).map((b) => ({
    band: b,
    weight: (by.get(b) ?? 0) / total,
  }));
}

// ── holdings ordering for the depth section — attention names lead, then by weight ───
export interface HoldingRank {
  holding: Holding;
  weak: boolean; // own band fragile / below-par
  flagged: boolean; // fired a Signals deduction
  unscored: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// COMBINED-BOOK AGGREGATION — one row per ISSUER ENTITY, matching the Construction engine.
//
// The Health tab is a WHOLE-PORTFOLIO view — it is NOT account-scoped, and the Construction engine
// already collapses holdings by issuer (`entityKeyOf` = `isin.slice(0,7)` for name-risk). The raw
// /me/holdings list is per-(account,instrument), so RELIANCE-in-two-accounts renders twice while the
// engine counts it once. This groups the LIVE list on the SAME key the engine used — `entityKey` for
// name-risk (RELIANCE's two accounts, an NTPC stock+bond → one row), falling back to `isin` for
// baskets/gold/sovereign (never aggregated by issuer, but still merged across accounts by instrument).
//
//   · weight is SUMMED across every account & instrument in the entity.
//   · the headline score is the entity's EQUITY — a bond carries no score, so it never competes; the
//     expand breaks the parts out. We NEVER key on instrumentId, and NEVER blend a stock and a bond.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
/** (Holdings tab) One account's stake in an instrument or entity — its ₹ and its book-weight share.
 *  Preserved through aggregation so a collapsed row can say WHICH accounts hold it (RELIANCE →
 *  "Grow 1 · demo") without a second fetch. Additive: the Health tab reads none of these fields. */
export interface AccountShare {
  accountId: string;
  accountName: string;
  marketValue: number | null;
  weight: number; // 0..1 book weight
}
/** (Holdings tab) One instrument of an entity, merged across accounts, plus WHICH accounts hold it.
 *  Powers the entity expand: a multi-instrument entity (NTPC stock+bond) breaks out by instrument. */
export interface EntityInstrument {
  instrument: Holding; // instrument-merged (its own avg cost, invested, current, P&L)
  accounts: AccountShare[]; // the accounts holding THIS instrument
}

export interface EntityHolding {
  key: string; // the group key — entityKey ?? isin ?? symbol
  displayName: string; // the representative's symbol — the equity's ticker where there is one
  representative: Holding; // drives display name + tier (equity if present, else scored, else heaviest)
  constituents: Holding[]; // the entity's instruments, each already merged across accounts (weight summed)
  weight: number; // Σ book weight across every account & instrument in the entity
  marketValue: number | null;
  health: number | null; // the SCORED equity's score — null ⇒ no scored equity (a by-design disclosure row)
  band: Holding["band"];
  tier: Holding["tier"];
  multiInstrument: boolean; // >1 distinct instrument (an NTPC stock+bond) → the expand breaks them out
  equity: Holding | null; // the stock constituent — what the row-expand's pillars/three-lens read
  disclosureNotes: NonNullable<Holding["disclosureNotes"]>;
  // ── (Holdings tab, ADDITIVE — the Health tab reads none of the fields below) ──────────────────────
  //   The entity-level tracker figures a positions row needs. Money SUMS across the collapsed
  //   instruments; avgCost / LTP / price-stamp are per-instrument and DO NOT sum — they are carried only
  //   for a single-instrument entity, and are `null` for a genuine multi-instrument one (never a
  //   fabricated blend across a stock and a bond — the expand shows each instrument's own basis instead).
  invested: number; // Σ constituents.investedValue
  unrealizedPnl: number | null; // marketValue − invested (guarded)
  realizedPnl: number; // Σ constituents.realizedPnl
  dayChangeValue: number | null; // Σ per-instrument ₹ day moves (over the instruments that have one)
  dayChangePct: number | null; // dayChangeValue ÷ prevValue of exactly those instruments
  avgCost: number | null; // single-instrument → blended over accounts; multi → null (don't fabricate)
  currentPrice: number | null; // single-instrument → the LTP; multi → null
  priceSource: string | null; // single-instrument → who priced it (for the price stamp); multi → null
  priceAsOf: string | null; // single-instrument → the day the price belongs to; multi → null
  accounts: AccountShare[]; // distinct accounts this entity touches, ₹-desc (the "held in" indicator)
  instruments: EntityInstrument[]; // per-instrument breakdown, each with its accounts (the expand)
}

/** Sum two possibly-null ₹ figures, staying null only when BOTH are absent (`null ≠ 0`). */
function sumMaybe(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}

/** The per-account shares of ONE instrument's raw rows (the union is per-(account,instrument), so
 *  there is at most one row per account here). ₹-desc so the heaviest account leads. */
function accountSharesOf(rows: Holding[]): AccountShare[] {
  const m = new Map<string, AccountShare>();
  for (const r of rows) {
    const id = r.accountId ?? "—";
    const cur = m.get(id);
    if (cur) {
      cur.marketValue = sumMaybe(cur.marketValue, r.marketValue);
      cur.weight += r.weight;
    } else {
      // The label is the account NAME; the id is the key ONLY, never a fallback label — a raw UUID is
      // not a human-readable account. accountName is served on every live row.
      m.set(id, { accountId: id, accountName: r.accountName || "Unnamed account", marketValue: r.marketValue, weight: r.weight });
    }
  }
  return [...m.values()].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));
}

/** Merge the per-(account,instrument) rows of ONE instrument into a single line. Value / quantity /
 *  invested / day-change / realized SUM across accounts; avg cost blends (Σinvested ÷ Σqty); current
 *  price and day-change % are per-share and identical across accounts, so the first row's carry through.
 *  (Money-complete since the Holdings tab reads these fields; the Health tab reads none of them, so its
 *  constituents are behaviourally unchanged — a single-account instrument merges to exactly itself.) */
function mergeAccounts(rows: Holding[]): Holding {
  const base: Holding = { ...rows[0]! };
  if (rows.length === 1) return base;
  let qty = 0, mv = 0, mvHas = false, inv = 0, dcv = 0, dcvHas = false, wt = 0, rp = 0;
  for (const h of rows) {
    wt += h.weight;
    qty += h.quantity;
    inv += h.investedValue;
    rp += h.realizedPnl;
    if (h.marketValue != null) { mv += h.marketValue; mvHas = true; }
    if (h.dayChangeValue != null) { dcv += h.dayChangeValue; dcvHas = true; }
  }
  base.weight = wt;
  base.quantity = qty;
  base.investedValue = inv;
  base.realizedPnl = rp;
  base.marketValue = mvHas ? mv : null;
  base.dayChangeValue = dcvHas ? dcv : null;
  base.avgCost = qty > 0 ? inv / qty : rows[0]!.avgCost; // blended weighted-avg cost of the same instrument
  base.unrealizedPnl = base.marketValue != null ? base.marketValue - inv : null;
  // currentPrice / dayChangePct / priceSource / priceAsOf are per-share facts, identical across the
  // accounts holding one instrument — the spread of rows[0] already carries the right values.
  return base;
}

/** Collapse the raw per-account holdings list into one entry per issuer entity (the engine's key). */
export function aggregateHoldings(holdings: Holding[]): EntityHolding[] {
  // 1 — group by the engine's issuer key, falling back to the instrument's isin (then symbol).
  const byEntity = new Map<string, Holding[]>();
  for (const h of holdings) {
    const key = h.entityKey ?? h.isin ?? h.symbol;
    const g = byEntity.get(key);
    if (g) g.push(h);
    else byEntity.set(key, [h]);
  }
  const out: EntityHolding[] = [];
  for (const [key, rows] of byEntity) {
    // 2 — inside an entity, merge each instrument across accounts (RELIANCE's two account lines → one),
    //     KEEPING each instrument's per-account rows so the expand can break them out.
    const byInstrument = new Map<string, Holding[]>();
    for (const h of rows) {
      const ik = h.isin ?? h.symbol;
      const g = byInstrument.get(ik);
      if (g) g.push(h);
      else byInstrument.set(ik, [h]);
    }
    const instruments: EntityInstrument[] = [...byInstrument.values()]
      .map((accountRows) => ({ instrument: mergeAccounts(accountRows), accounts: accountSharesOf(accountRows) }))
      .sort((a, b) => (b.instrument.marketValue ?? 0) - (a.instrument.marketValue ?? 0));
    const constituents = instruments.map((i) => i.instrument);
    // 3 — the equity drives the headline (a bond has no score). displayName follows the engine's
    //     `displayNameFor` (prefer the equity's ticker), never a blended anything.
    const equity = constituents.find((c) => c.assetClass === "stock") ?? null;
    const scored = constituents.find((c) => c.health != null) ?? null; // a scored holding is always a stock
    const representative = equity ?? scored ?? constituents[0]!;
    const mvs = constituents.map((c) => c.marketValue).filter((v): v is number => v != null);
    const marketValue = mvs.length ? mvs.reduce((s, v) => s + v, 0) : null;
    const invested = constituents.reduce((s, c) => s + c.investedValue, 0);
    const realizedPnl = constituents.reduce((s, c) => s + c.realizedPnl, 0);
    const unrealizedPnl = marketValue != null ? marketValue - invested : null;
    // Day figures over exactly the instruments that HAVE one — a NAV-priced fund has no previous NAV, so
    // it contributes value but no day-change; the % is measured against the capital it was measured on.
    const movers = constituents.filter((c) => c.dayChangeValue != null && c.marketValue != null);
    const dayChangeValue = movers.length ? movers.reduce((s, c) => s + (c.dayChangeValue ?? 0), 0) : null;
    const prevValue = movers.reduce((s, c) => s + ((c.marketValue ?? 0) - (c.dayChangeValue ?? 0)), 0);
    const dayChangePct = dayChangeValue != null && prevValue > 0 ? (dayChangeValue / prevValue) * 100 : null;
    const single = constituents.length === 1;
    // entity accounts = union across the entity's instruments (an account's ₹ summed over the
    // instruments of this issuer it holds).
    const acctMap = new Map<string, AccountShare>();
    for (const inst of instruments) {
      for (const a of inst.accounts) {
        const cur = acctMap.get(a.accountId);
        if (cur) { cur.marketValue = sumMaybe(cur.marketValue, a.marketValue); cur.weight += a.weight; }
        else acctMap.set(a.accountId, { ...a });
      }
    }
    const accounts = [...acctMap.values()].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));
    out.push({
      key,
      displayName: representative.symbol,
      representative,
      constituents,
      weight: constituents.reduce((s, c) => s + c.weight, 0),
      marketValue,
      health: scored?.health ?? null,
      band: scored?.band ?? null,
      tier: representative.tier,
      multiInstrument: constituents.length > 1,
      equity,
      disclosureNotes: representative.disclosureNotes ?? [],
      invested,
      unrealizedPnl,
      realizedPnl,
      dayChangeValue,
      dayChangePct,
      avgCost: single ? constituents[0]!.avgCost : null,
      currentPrice: single ? constituents[0]!.currentPrice : null,
      priceSource: single ? (constituents[0]!.priceSource ?? null) : null,
      priceAsOf: single ? (constituents[0]!.priceAsOf ?? null) : null,
      accounts,
      instruments,
    });
  }
  return out;
}

export interface EntityRank {
  entity: EntityHolding;
  weak: boolean;
  flagged: boolean;
  unscored: boolean;
}
/** Sort entities by weight × attention — the SAME rule as `rankedHoldings`, over the aggregated set. */
export function rankedEntities(entities: EntityHolding[], flagged: Set<string>): EntityRank[] {
  return entities
    .map((e) => ({
      entity: e,
      weak: e.band === "fragile" || e.band === "below_par",
      flagged: e.constituents.some((c) => flagged.has(c.symbol)),
      unscored: e.health == null,
    }))
    .sort((a, b) => {
      const attnA = (a.weak || a.flagged ? 1 : 0) - (a.unscored ? 0.5 : 0);
      const attnB = (b.weak || b.flagged ? 1 : 0) - (b.unscored ? 0.5 : 0);
      if (attnA !== attnB) return attnB - attnA;
      return b.entity.weight - a.entity.weight;
    });
}

/** Sort by weight × attention: weak/flagged names lead (they earn the look), then heavier
 *  first; sound scored names stay calm; unscored sink but are never hidden. */
export function rankedHoldings(holdings: Holding[], flagged: Set<string>): HoldingRank[] {
  return holdings
    .map((h) => ({
      holding: h,
      weak: h.band === "fragile" || h.band === "below_par",
      flagged: flagged.has(h.symbol),
      unscored: h.health == null,
    }))
    .sort((a, b) => {
      const attnA = (a.weak || a.flagged ? 1 : 0) - (a.unscored ? 0.5 : 0);
      const attnB = (b.weak || b.flagged ? 1 : 0) - (b.unscored ? 0.5 : 0);
      if (attnA !== attnB) return attnB - attnA;
      return b.holding.weight - a.holding.weight;
    });
}
