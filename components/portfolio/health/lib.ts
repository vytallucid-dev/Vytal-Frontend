// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO HEALTH TAB — pure derivations over the stored snapshot + holdings. No JSX.
//
// The engine already computed everything: pillars, both deduction ledgers, and the
// fired PF findings (bind/tone/loud all persisted). This file only READS those and
// arranges them for the teaching surface — it NEVER recomputes a score, penalty, pillar
// or PHS weight. The one derivation it does is display arithmetic over holdings (value
// share, health × weight, band dispersion) — the same class the tracker already does,
// never a PHS internal.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Holding,
  PfFinding,
  PfTone,
  PortfolioSnapshot,
  SignalSource,
  SignalsDeduction,
  StockBand,
  StructureDeduction,
  StructureRule,
} from "@/types/portfolio";

// ── constant weights (mirror the engine's K.W_STRUCT / K.W_SIGNAL — for RECONCILING
//    the stored pillars to the published drag, never for recomputing them). ──────────
export const W_STRUCT = 0.3;
export const W_SIGNAL = 0.2;

// ── structure rule identity (A.6) — a short human name + the "why" per rule ─────────
export const STRUCTURE_RULE_META: Record<StructureRule, { title: string; what: string }> = {
  S1: { title: "Single position", what: "one holding carries an outsized share of the book" },
  S2: { title: "Sector pile-up", what: "one sector carries an outsized share of the book" },
  S3: { title: "Thin breadth", what: "weight concentrates into few effective positions" },
  S4: { title: "Over-diversification", what: "more holdings than can be tracked by hand" },
  S5: { title: "Unverified mega-position", what: "a large position we can't yet score" },
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

// ── ledgers (defensive: nullable on the wire for pre-ledger snapshots) ──────────────
export function structureLedger(s: PortfolioSnapshot): StructureDeduction[] {
  return s.structureLedger ?? [];
}
export function signalsLedger(s: PortfolioSnapshot): SignalsDeduction[] {
  return s.signalsLedger ?? [];
}

/** Fired S-rules that actually took points off, largest first. Not-evaluable entries
 *  (points 0 — e.g. S2 killed by unknown-sector weight) are surfaced separately as
 *  honest context, never mixed in as a deduction. */
export function activeStructure(s: PortfolioSnapshot): StructureDeduction[] {
  return structureLedger(s)
    .filter((e) => e.points > 0.005)
    .sort((a, b) => b.points - a.points);
}
export function notEvaluableStructure(s: PortfolioSnapshot): StructureDeduction[] {
  return structureLedger(s).filter((e) => e.points <= 0.005);
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

// ── deduction waterfall (anchor − drags = composite) — reconciled from the stored
//    pillars, NOT recomputed. Σ structure ledger points = the Structure gap; the hit on
//    your score is W_STRUCT of that gap. Same for Signals at W_SIGNAL. ────────────────
export interface DeductionStory {
  quality: number; // the anchor — where the score starts
  structure: number; // stored Structure pillar (0..100)
  signals: number; // stored Signals pillar (0..100)
  constructionDrag: number; // W_STRUCT × (100 − structure) — Structure's hit on the score
  flagsDrag: number; // W_SIGNAL × (100 − signals) — Signals' hit on the score
  coverageDrag: number; // extra the coverage ceiling held back (0 unless it binds)
  composite: number; // the published PHS the drags land on
  structurePoints: number; // Σ ledger points (= the Structure gap 100 − structure)
  signalPoints: number; // Σ ledger points (= the Signals gap 100 − signals)
}

/** Decompose the PUBLISHED snapshot into anchor + drags. null when the book isn't
 *  evaluable (no scored holdings). By construction quality − drags = composite. */
export function deductionStory(s: PortfolioSnapshot): DeductionStory | null {
  if (s.phs == null || s.quality == null) return null;
  const constructionDrag = W_STRUCT * (100 - s.structure);
  const flagsDrag = W_SIGNAL * (100 - s.signals);
  const coverageDrag = s.ceilingApplied && s.phsRaw != null ? Math.max(0, s.phsRaw - s.phs) : 0;
  const structurePoints = structureLedger(s).reduce((a, e) => a + e.points, 0);
  const signalPoints = signalsLedger(s).reduce((a, e) => a + e.points, 0);
  return {
    quality: s.quality,
    structure: s.structure,
    signals: s.signals,
    constructionDrag,
    flagsDrag,
    coverageDrag,
    composite: s.phs,
    structurePoints,
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

/** Triage the NON-coverage findings (PV-family carries the coverage story, surfaced in
 *  its own honest section — routing it here would double-count it). */
export function triageFindings(findings: PfFinding[]): FindingTriage {
  const nonCoverage = findings.filter((f) => f.family !== "PV");
  const rank = (a: PfFinding, b: PfFinding) =>
    TONE_ORDER[a.tone] - TONE_ORDER[b.tone] || findingWeight(b) - findingWeight(a);
  return {
    loud: nonCoverage.filter((f) => f.loud).sort(rank),
    quiet: nonCoverage.filter((f) => !f.loud).sort(rank),
  };
}

/** The PV-family findings that carry the coverage story (loudest / most-severe first). */
export function coverageFindings(findings: PfFinding[]): PfFinding[] {
  return findings
    .filter((f) => f.family === "PV")
    .sort((a, b) => (a.loud === b.loud ? TONE_ORDER[a.tone] - TONE_ORDER[b.tone] : a.loud ? -1 : 1));
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
  const ceiling = numv("ceiling");
  if (ceiling != null) push("ceiling", `held at ${Math.round(ceiling)}`);
  const phsRaw = numv("phsRaw");
  if (phsRaw != null) push("phsRaw", `verified reads ${Math.round(phsRaw)}`);
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

/** Effective breadth (Neff = inverse Herfindahl). Prefer the STORED value the engine
 *  computed (carried on a PC5/PB1 finding bind, else the S3 ledger detail) so the shape
 *  matches the penalty; fall back to a display computation over priced weights. */
export function effectiveBreadth(s: PortfolioSnapshot, holdings: Holding[]): { neff: number; stored: boolean } {
  for (const f of s.firedFindings ?? []) {
    const n = f.bind?.neff;
    if (typeof n === "number") return { neff: n, stored: true };
  }
  const s3 = structureLedger(s).find((e) => e.rule === "S3");
  if (s3) {
    const m = /Neff\s+([\d.]+)/.exec(s3.detail);
    if (m) return { neff: Number(m[1]), stored: true };
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
    const key = h.sector ?? "Unclassified";
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
