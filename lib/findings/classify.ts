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
// F composition · G convergence · H ownership events · I band transition.
export type Family = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

// The four design-token accents (globals.css --crit / --high / --rec / --ctx).
export type Accent = "crit" | "high" | "rec" | "ctx";

// File 1 §5E — the three mandatory pattern display states.
export type DisplayState = "active" | "pending_data_integration" | "dampened";

// Hub-Flags concern tiers (File 2 §5). Structural cards (divergence/trajectory/
// composition) are not part of File 2's pattern-by-concern taxonomy → "other".
export type Concern = "ownership" | "fundamentals" | "momentum" | "other";

/**
 * Map a canonical finding key to its File-1 §5 family. The engine writes every
 * non-red-flag (B/C/D/E/F/G/H/I) into score_patterns with a family-prefixed key, so
 * the read layer recovers the family from the key shape. Order of tests matters.
 */
export function familyOf(key: string): Family {
  if (/_R\d+_/.test(key)) return "A"; // ownership_R1_pledge … foundation_R5_interest_coverage
  if (key.startsWith("divergence_")) return "C"; // C1 / C2 / C3 / C-over-time
  if (key.startsWith("trajectory_B_")) return "B";
  if (key.startsWith("trajectory_D_")) return "D";
  if (key.startsWith("trajectory_G_")) return "G";
  if (key.startsWith("trajectory_I_")) return "I";
  if (key.startsWith("trajectory_F2_") || key.startsWith("composition_F1_")) return "F";
  if (key.startsWith("ownership_H_")) return "H";
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

export function accentOf(severity: string | null | undefined): Accent {
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
const BASE_RANK: Record<Family, number> = { A: 1, B: 2, C: 3, D: 4, E: 6, F: 7, G: 8, H: 9, I: 10 };
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
const LOUD_FAMILIES: Family[] = ["A", "B", "C", "D", "E"];

/** Loud when ANY of families A–E fire; quiet when only F–I fire; empty when none. */
export function densityOf(keys: Iterable<string>): Density {
  const fams = new Set<Family>();
  for (const k of keys) fams.add(familyOf(k));
  if (fams.size === 0) return "empty";
  return LOUD_FAMILIES.some((f) => fams.has(f)) ? "loud" : "quiet";
}

// File 1 §5 density-state header copy (verbatim).
export const DENSITY_QUIET_HEADER = "Quiet — only context, nothing pressing";
export const DENSITY_EMPTY_COPY =
  "Nothing notable. Steady, average-zone — sound but unremarkable. No divergence, no transition, no flag. You can move on.";

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
export function concernOf(key: string): Concern {
  const fam = familyOf(key);
  if (fam !== "A" && fam !== "E") return "other"; // structural cards aren't a File-2 pattern concern
  const k = key.toLowerCase();
  if (k.startsWith("ownership")) return "ownership";
  if (k.startsWith("momentum")) return "momentum";
  if (k.startsWith("foundation") || k.startsWith("fundamentals")) return "fundamentals";
  return "other";
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
