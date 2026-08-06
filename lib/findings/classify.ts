// lib/findings/classify.ts
//
// The SHARED findings read-layer — classification + ordering primitives. Built once,
// consumed by all three surfaces (stock §5 findings, PG pathology census, Hub Flags
// board) so they can NEVER drift. This module only ORDERS / CLASSIFIES / COLORS the
// fired set the engine wrote — it never decides whether something fires (no fire-logic
// in the UI). Everything here is keyed off the canonical finding KEY the engine persists
// to score_red_flags.flagKey / score_patterns.patternKey.
//
// Reference: Vytal_StockPage_Sections_2_and_5_Rules_Spec_v1.md (File 1) §5 — the A→I
// card sequence, the severity→accent law, the density-as-triage rule, and the hot-pond
// mask. File 2 (Health Hub Data Bank) §5/§7 reuse the SAME ordering + colour here.

// ── families (File 1 §5 A→I) ──────────────────────────────────────────────────
// A red flags · B deterioration · C divergence · D recovery · E patterns ·
// F composition · G convergence · H ownership events · I band transition ·
// N notable (constructive mirrors — DISPLAY-ONLY; never touches scoring/persistence).
import { findingFamily, type FindingConcern } from "./descriptions";

export type Family = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "N";

// The four design-token accents (globals.css --crit / --high / --rec / --ctx).
export type Accent = "crit" | "high" | "rec" | "ctx";

// File 1 §5E — the three mandatory pattern display states.
export type DisplayState = "active" | "pending_data_integration" | "dampened";

// Hub-Flags concern tiers (File 2 §5) + the "trajectory" bucket the catalog assigns to the
// structural cards (divergence / trajectory / composition) so they reach the Hub board
// instead of being orphaned. concernOf() below is the LEGACY key-shape fallback and never
// returns "trajectory"; the authoritative concern is the catalog's (findingConcern), applied
// in index.ts's census mapping — see `concernFor()`. "other" remains for truly-unknown keys.
/**
 * ★ THE CATALOGUE'S FOUR VALUES, RE-EXPORTED — NOT A FIFTH LOCAL COPY.
 *
 * ⚠ `other` IS REMOVED, AND THAT IS A DELIBERATE BEHAVIOUR CHANGE. It was the bucket for "the
 * key-shape fallback did not recognise this", and the Hub has no row for it — so a finding landing
 * there was counted in the census and rendered under no concern at all. Silent miscategorisation.
 *
 * The only way a key resolves outside the four is that this mirror has drifted from the backend
 * catalogue, which is a build defect, not a runtime state worth rendering. `concernFor` throws.
 */
export type Concern = FindingConcern;

/**
 * Map a canonical finding key to its File-1 §5 family. The engine writes every
 * non-red-flag (B/C/D/E/F/G/H/I) into score_patterns with a family-prefixed key, so
 * the read layer recovers the family from the key shape. Order of tests matters.
 */
export function familyOf(key: string): Family {
  // ★ THE CATALOGUE FIRST. `findingFamily` reads the served entry — the same byte the backend's own
  //   `familyOf` returns — so the two cannot disagree about any key the catalogue carries.
  const served = findingFamily(key);
  if (served) return served as Family;
  // ⚠ THE KEY-SHAPE TESTS SURVIVE FOR ONE REASON, AND IT IS NOT "just in case": composed lens keys
  //   (`lens_lm3_<metric>` — one key per metric that has ever fired) are deliberately NOT catalogued,
  //   so nothing can serve their family. They run only when the catalogue has no answer, which makes
  //   them a last resort rather than a second authority.
  if (/_R\d+_/.test(key)) return "A"; // ownership_R1_pledge … foundation_R5_interest_coverage
  if (key.startsWith("divergence_")) return "C"; // C1 / C2 / C3 / C-over-time
  if (key.startsWith("trajectory_B_")) return "B";
  if (key.startsWith("trajectory_D_")) return "D";
  if (key.startsWith("trajectory_G_")) return "G";
  if (key.startsWith("trajectory_I_")) return "I";
  if (key.startsWith("trajectory_F2_") || key.startsWith("composition_F1_")) return "F";
  if (key.startsWith("ownership_H_")) return "H";
  // Notable (N) constructive mirrors — e.g. foundation_N1_cash_backed. `_N\d+_` needs a digit
  // after N, so it cannot match `_NG…` any more than `_P\d+_` matches `_PG3_`; placed before the
  // `_P\d+_` / fallthrough tests so an N key can never be shadowed into E.
  if (/_N\d+_/.test(key)) return "N";
  if (/_P\d+_/.test(key)) return "E"; // ownership/foundation/momentum P-patterns
  return "E"; // unknown pattern → safest bucket (still rendered, never dropped)
}

// ── severity → accent (one canonical map; File 1 §5 universal display law) ─────
// Engine persists FAMILY-NATIVE severity: red flags = critical; structural cards =
// high/medium/low/recovery; E-patterns = red/amber/green. File 1 collapses these onto
// the four design accents — Critical/Red → crit, High/Amber → high, Recovery/Green →
// rec (labelled "recovering", never green-as-buy), Medium/Low → ctx (neutral context).
const ACCENT_BY_SEVERITY: Record<string, Accent> = {
  critical: "crit",
  red: "crit",
  high: "high",
  amber: "high",
  recovery: "rec",
  green: "rec",
  medium: "ctx",
  low: "ctx",
  // pattern-direction fallbacks the census sometimes carries instead of a severity token
  negative: "high",
  positive: "rec",
};

// Family N (Notable) always takes the constructive accent (the same one `rec` yields), REGARDLESS
// of persisted severity — a READ-LAYER mapping only. N never persists an engine severity token
// (it's display-only), so its tone is decided here at read time, not in the scored/persisted path.
export function accentOf(severity: string | null | undefined, family?: Family): Accent {
  if (family === "N") return "rec";
  return ACCENT_BY_SEVERITY[(severity ?? "").toLowerCase()] ?? "ctx";
}

/** CSS custom-property bundle for an accent (matches globals.css --crit / -bg / -bd). */
export function accentVars(accent: Accent): { color: string; bg: string; bd: string } {
  return { color: `var(--${accent})`, bg: `var(--${accent}-bg)`, bd: `var(--${accent}-bd)` };
}

// A "wide" divergence reads as severity High (File 1 §5C: High when wide, else Medium).
// Used both for accent and for the C wide/notable order-split.
function isWideTier(severity: string | null | undefined): boolean {
  const s = (severity ?? "").toLowerCase();
  return s === "high" || s === "critical" || s === "red";
}

// ── ordering (File 1 §5 strict A→I, with the C wide/notable split) ─────────────
// 1 red flags · 2 deterioration · 3 divergence-WIDE · 4 recovery · 5 divergence-
// NOTABLE · 6 patterns · 7 composition · 8 convergence · 9 ownership events ·
// 10 band transition.  "risk before opportunity, signal before context."
// N sits LAST — a constructive, display-only mirror is the least urgent, quietest context, so it
// orders after the informational band-transition (I), well clear of the loud risk-first region.
const BASE_RANK: Record<Family, number> = { A: 1, B: 2, C: 3, D: 4, E: 6, F: 7, G: 8, H: 9, I: 10, N: 11 };
export function orderRankOf(key: string, severity: string | null | undefined): number {
  const fam = familyOf(key);
  if (fam === "C") return isWideTier(severity) ? 3 : 5; // wide → slot 3, notable → slot 5
  return BASE_RANK[fam];
}

// Secondary sort inside an order rank: more-severe first, then stable by key.
const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 0, red: 1, high: 2, amber: 3, recovery: 4, green: 5, medium: 6, low: 7,
};
export function severityWeight(severity: string | null | undefined): number {
  return SEVERITY_WEIGHT[(severity ?? "").toLowerCase()] ?? 9;
}

/** Total order for the A→I sequence: `[orderRank, severityWeight, key]`. */
export function compareFindings(
  a: { key: string; severity: string | null | undefined },
  b: { key: string; severity: string | null | undefined },
): number {
  return (
    orderRankOf(a.key, a.severity) - orderRankOf(b.key, b.severity) ||
    severityWeight(a.severity) - severityWeight(b.severity) ||
    a.key.localeCompare(b.key)
  );
}

// ── density (File 1 §5 — this IS the triage signal; build exactly) ─────────────
export type Density = "loud" | "quiet" | "empty";
// N (Notable) is deliberately ABSENT — a constructive mirror is QUIET context and must never push the
// page into the loud "look hard" density state. (Before N was its own family it fell through to E and
// would have read as loud; that is exactly the inversion this wiring exists to prevent.)
const LOUD_FAMILIES: Family[] = ["A", "B", "C", "D", "E"];

/** Loud when ANY of families A–E fire; quiet when only F–I fire; empty when none. */
export function densityOf(keys: Iterable<string>): Density {
  const fams = new Set<Family>();
  for (const k of keys) fams.add(familyOf(k));
  if (fams.size === 0) return "empty";
  return LOUD_FAMILIES.some((f) => fams.has(f)) ? "loud" : "quiet";
}

// File 1 §5 density-state header copy.
export const DENSITY_QUIET_HEADER = "Quiet — only context, nothing pressing";

/** ── THE EMPTY DENSITY — ONE FACT, TWO SHAPES, FIVE SURFACES ───────────────────────────────────────
 *
 *  An empty finding set means NO RULE FIRED, and that is the whole of what it means. It is not
 *  evidence about the band and not evidence about the spread. Anything either of these strings says
 *  has to hold for EVERY empty case whatever its band and whatever its gap — which leaves exactly the
 *  state label, twice, at the two lengths the surfaces need.
 *
 *  ⚠ NOT File 1 §5 VERBATIM ANY MORE, ON PURPOSE. The spec's line read "Nothing notable. Steady,
 *  average-zone — sound but unremarkable. No divergence, no transition, no flag. You can move on."
 *  Three of those clauses are claims the finding set cannot make, and on the live universe all three
 *  were false where it rendered. The four names with an empty set are BAJAJ-AUTO (pristine, 16),
 *  HEROMOTOCO (pristine, 24), DABUR (below_par, 39) and MARUTI (steady, 20):
 *
 *    · "Steady, average-zone" ASSERTS A BAND. False for three of the four. The band is served and
 *      rendered elsewhere on the page — this line never needs to restate it, and cannot.
 *    · "No divergence" ASSERTS A SPREAD. False for all four — every one carries a `wide` served
 *      divergence flag, and the same page prints DABUR's 39-point spread a few hundred pixels away.
 *      An empty fired set says NOTHING about the spread: 34 of 94 live names carry a surfaced spread
 *      with no D-family finding behind it (see screen-tab.tsx's pillar-spread note).
 *    · "You can move on" tells the reader to STOP LOOKING — on a stock whose pillars are 39 apart.
 *
 *  ★ WHY THESE ARE CONSTANTS AND NOT FIVE AUTHORED STRINGS. The false line survived a full pass on
 *  this exact copy because a SECOND, hand-written copy of it sat in watchlist/quick-look-sheet.tsx
 *  making the identical band-and-spread claim, gated on the identical `count === 0`, and importing
 *  nothing. Replacing the constant did not reach it. Five surfaces stating one fact in five sets of
 *  words is not a style problem — it is five places for the claim to regrow, and only one of them
 *  gets looked at. Every empty-density surface imports one of these two. NONE authors its own.
 *
 *  ⚠ NO SCOPE WORD IN EITHER STRING, DELIBERATELY. The two surfaces that carried one ("this period",
 *  "for this result") both state that scope in the header IMMEDIATELY ABOVE the empty state — the
 *  comparison's section hint ("What fired for each company this period…") and HealthContext's own
 *  ("Flags this result triggered" / "Latest health findings (as of …)"). The scope word was echoing
 *  its own header, so generalising loses nothing; and a scope word baked in here would be WRONG on
 *  the two surfaces that have no period frame at all (the watchlist sheet, the Screener row). */
export const DENSITY_EMPTY_COPY = "No pattern or red flag fired.";

/** The same fact at pill length, for the density label the stock page and the Screener share.
 *
 *  ⚠ REPLACES "all clear", WHICH WAS A VERDICT ON THE STOCK. "All clear" is the idiom for a check
 *  that came back clean AND was comprehensive over its subject. The finding set is neither: the
 *  Screener prints this pill inches from "Pillar spread · 39 apart", and 34 of 94 live names carry a
 *  surfaced spread no D-family rule covers. Claiming completeness the engine does not have is the
 *  same failure as the old panel copy, one size down. "none fired" names the finding set and stops —
 *  and it sits in the register of its two siblings, "context only" and "3 findings". */
export const DENSITY_EMPTY_PILL = "none fired";

// ── hot-pond mask modifier (File 1 §5 / File 2 §7 — read-layer, never stored) ──
// Price-linked cards (B, C1, D — and §2 ride) carry the caveat when the stock's PG pond
// is hot. Non-price cards (fundamental red flags, ownership, composition, convergence)
// are unaffected — their truth doesn't depend on the tape.
export const MASK_NOTE =
  "The pond is hot — price-linked reads may be deferred; look for the catalyst.";

export function isPriceLinked(key: string): boolean {
  return (
    key.startsWith("trajectory_B_") || // B deterioration
    key === "divergence_C1_price_ahead" || // C1 price-ahead-of-fundamentals
    key.startsWith("trajectory_D_") // D recovery (most-masked, File 1)
  );
}

// ── concern tier (File 2 §5 Hub Flags — Ownership / Fundamentals / Momentum) ───
export function concernOf(key: string): Concern | null {
  const fam = familyOf(key);
  // A / E, and now N (constructive mirrors), resolve to a real concern via the key prefix; structural
  // cards aren't a File-2 pattern concern. N MUST be admitted here — before it became a real family it
  // resolved only by accident (landing in E); creating the family would otherwise orphan it to "other".
  if (fam !== "A" && fam !== "E" && fam !== "N") return null;
  const k = key.toLowerCase();
  if (k.startsWith("ownership")) return "ownership";
  if (k.startsWith("momentum")) return "momentum";
  if (k.startsWith("foundation") || k.startsWith("fundamentals")) return "fundamentals";
  return null;
}

// ── trajectory / historical caveats (File 1 documented limitations) ────────────
// Trajectory findings (B/D/F2/G/I/C-over-time) carry a `calibration` evidence note —
// historical bands are computed under TODAY's bars, not as-of-period. Surface it.
export const CALIBRATION_CAVEAT = "Historical bands use today's calibration.";
// Shallow-history stocks: the trajectory was read over only a few snapshots — note it.
export const SHORT_WINDOW_CAVEAT = "Short history — read over only a few snapshots.";

const TRAJECTORY_PREFIXES = ["trajectory_", "divergence_C_over_time"];
export function isTrajectoryCard(key: string): boolean {
  return TRAJECTORY_PREFIXES.some((p) => key.startsWith(p));
}

export const PILLAR_LABEL: Record<string, string> = {
  foundation: "Foundation",
  momentum: "Momentum",
  market: "Market",
  ownership: "Ownership",
};
