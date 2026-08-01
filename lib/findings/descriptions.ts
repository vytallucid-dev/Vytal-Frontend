/**
 * THE STOCK-FINDING COPY LAYER — resolvers over the served catalogue, with a GENERATED fallback.
 *
 * ★ STAGE 6 — THIS FILE NO LONGER AUTHORS COPY. It authors TYPES and RESOLUTION ORDER; every string
 * it returns comes from one of two places, and both trace to the same home:
 *
 *   SERVED     GET /api/v1/catalogue, hydrated once into ./catalogue-store by CatalogueProvider.
 *   FALLBACK   ./generated/copy.generated.ts — MACHINE-GENERATED from that same backend catalogue,
 *              committed so the frontend builds and renders with no backend at all.
 *
 * ── ⚠ WHY A FALLBACK EXISTS AT ALL, AND WHY IT IS GENERATED ────────────────────────────────────────
 * Deleting it would make the endpoint a single point of failure for every finding name, description
 * and boundary in the product — and the failure mode, title-only cards, reads as a styling glitch
 * rather than an outage, so nobody would report it. Keeping it HAND-MAINTAINED would restore the two
 * homes this whole migration existed to remove. Generated is neither: one authoring home, a cache of
 * it here, and a CI gate that fails the build when the cache is stale.
 *
 * ── THE TWO LAYERS — do not conflate ───────────────────────────────────────────────────────────────
 *   description (HERE)     static, rule-level.  "What this pattern means."        Any surface.
 *   VERDICT (verdicts.ts)  dynamic, per-stock.  "What happened at this company."  Per-stock only,
 *                          and now rendered SERVER-side onto the finding row (Stage 3); the local
 *                          renderer is its fallback.
 *
 * ── ⚠ THE OLD "RENDER TITLE ONLY WHEN ABSENT" PATH IS GONE ────────────────────────────────────────
 * It was written for a world where one finding might lack a description. In a world where copy is
 * fetched, it meant every card on every surface losing its explanatory line at once, silently. The
 * backend registry is now TOTAL over its key vocabulary — a finding without copy is a compile error
 * — and this file always has the generated fallback beneath it. There is no missing case left.
 *
 * NOT HERE (a different layer, deliberately):
 *   - VERDICTS (per-stock instance sentences) → verdicts.ts (needs evidence numbers).
 *   - Portfolio findings                      → the PHS payload carries its own boundary inline.
 */

import { familyOf, type Family } from "./classify";
import {
  GEN_FAMILY_DOESNT_MEAN,
  GEN_FINDING_DESCRIPTIONS,
  GEN_FINDING_NAMES,
  GEN_LENS_DOESNT_MEAN,
  GEN_LM_CATALOG,
  GEN_LP_CATALOG,
} from "./generated/copy.generated";
import {
  catalogueSource,
  familyBoundary,
  lensBoundary,
  lensEntry,
  reportFallback,
  stockEntry,
} from "./catalogue-store";

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

/** Keyed on the exact engine key emitted by RedFlag.flagKey / ScorePattern.patternKey.
 *
 *  ★ STAGE 6 — GENERATED, NOT AUTHORED. Every entry comes from the backend catalogue via
 *  copy.generated.ts. It is the BUNDLED FALLBACK for a cold or failed catalogue fetch, and CI fails
 *  if it drifts from the catalogue it mirrors (verify-fallback-fresh.ts). Do not edit the strings
 *  here or in the generated file — edit Vytal-Backend/src/catalogue/ and regenerate. */
export const FINDING_DESCRIPTIONS: Record<string, FindingDescription> =
  GEN_FINDING_DESCRIPTIONS as Record<string, FindingDescription>;

/**
 * Resolve a finding's static description.
 * Returns null when absent — callers render TITLE ONLY.
 * NEVER substitute a generic sentence: filler that pretends to explain is worse than silence.
 */
export function findingDescription(key: string): string | null {
  const served = stockEntry(key);
  if (served) return served.description;
  const bundled = FINDING_DESCRIPTIONS[key]?.description ?? null;
  // Only worth a signal when the catalogue IS live and simply does not carry the key — that is a
  // genuine reconciliation gap. A cold read is reported once by the resolver below, not per key.
  if (catalogueSource() === "catalogue" && bundled) reportFallback("key-missing", `description for "${key}"`);
  return bundled;
}

/** Concern bucket for Hub grouping. Null when unknown — caller decides placement, never invents one. */
export function findingConcern(key: string): FindingConcern | null {
  return stockEntry(key)?.concern ?? FINDING_DESCRIPTIONS[key]?.concern ?? null;
}

export function findingFamily(key: string): FindingFamily | null {
  return stockEntry(key)?.family ?? FINDING_DESCRIPTIONS[key]?.family ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TITLES — canonical display names. GENERATED from the catalogue. RETIRED / UNBUILT keys have NO
// entry by design and cannot acquire one: P2 (→ R6), P3 (→ R1) are deregistered, P9 (capex) unbuilt,
// and the backend gate refuses copy for a key nothing emits.
// ═══════════════════════════════════════════════════════════════════════════════
export const FINDING_NAMES: Record<string, string> = GEN_FINDING_NAMES;


/**
 * Look up the spec display name for a flag/pattern key. Falls back to a
 * humanized form of the raw key for unknown/future keys.
 */
export function findingName(key: string): string {
  const served = stockEntry(key);
  if (served) return served.name;
  if (FINDING_NAMES[key]) {
    if (catalogueSource() === "catalogue") reportFallback("key-missing", `name for "${key}"`);
    return FINDING_NAMES[key];
  }
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
// TOTAL BY CONSTRUCTION (amendment §2): every family MUST carry a boundary line. The backend map it
// is generated from is a total Record over the ten families, so a missing family is a compile error
// THERE — which is the one place it can now be introduced. Family N's line is spec copy.
const DOESNT_MEAN: Record<Family, string> = GEN_FAMILY_DOESNT_MEAN as Record<Family, string>;


// Three-Lens escalations (lens_lm3/lm7/lp2/lp5) carry their own no-prediction boundary —
// field-verdicts are CONTEXT (about the field), never a stock call.
const LENS_DOESNT_MEAN: Record<string, string> = GEN_LENS_DOESNT_MEAN;


export function doesntMean(key: string): string {
  const lens = /^lens_(lm3|lm7|lp2|lp5)_/.exec(key);
  if (lens) return lensBoundary(lens[1]) ?? LENS_DOESNT_MEAN[lens[1]] ?? DOESNT_MEAN.E;
  // The SERVED entry already carries a RESOLVED boundary (the backend applied the §2 order at build
  // time: the finding's own line → its family's mandatory line), so there is nothing left to resolve.
  const served = stockEntry(key);
  if (served) return served.doesntMean;
  // §2 resolution order: the finding's OWN line (per-entry, where the catalog has one — Family N)
  // → its family's mandatory line. DOESNT_MEAN is now TOTAL, so the family fallback is never empty.
  const fam = familyOf(key);
  return FINDING_DESCRIPTIONS[key]?.doesntMean ?? familyBoundary(fam) ?? DOESNT_MEAN[fam];
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
export const LM_CATALOG: Record<string, LensCatalogFace> = GEN_LM_CATALOG as unknown as Record<string, LensCatalogFace>;


// ── Pillar-level catalog (LP1–6) ─────────────────────────────────────────────────
// Labels + tones + field-verdicts from §4; "read" from the §3.2 Meaning column (VERBATIM).
export const LP_CATALOG: Record<string, LensCatalogFace> = GEN_LP_CATALOG as unknown as Record<string, LensCatalogFace>;


/** Resolve a three-lens face by its uppercase id (LM3 / LP2 / …). null for unknown ids.
 *  Served first (the backend's pattern library is the original transcription; the maps below are the
 *  frontend's duplicate of it and become the fallback). The served entry names its fields `name` /
 *  `description`; the local shape calls them `label` / `read` — mapped, never re-worded. */
export function lensCatalogFace(idUpper: string): LensCatalogFace | null {
  const served = lensEntry(idUpper);
  if (served) {
    return {
      id: served.key,
      label: served.name,
      tone: served.tone,
      fieldVerdict: served.fieldVerdict,
      read: served.description,
      doesntMean: served.doesntMean,
    };
  }
  return LM_CATALOG[idUpper] ?? LP_CATALOG[idUpper] ?? null;
}

/**
 * The interpretive boundary for a three-lens face, by uppercase id. Prefers the pattern-
 * library face's own "Doesn't mean" (LM1–8 have them); falls back to the family-level lens
 * boundary for the escalating ids (LP2/LP5, whose face doesn't-mean the databank left blank),
 * then to the generic pattern boundary. Never empty — every lens card carries a boundary.
 */
/**
 * ★ P2 · The composed-key → FACE ID transform, in ONE place on this side of the wire.
 * `lens_lm3_NII` → "LM3" · `lens_lp5_foundation` → "LP5" · anything else → null.
 * Mirrors the backend's `faceIdOfLensKey`; the suffix is an instance coordinate (which metric, which
 * pillar), never part of the identity.
 */
export function faceIdOfLensKey(key: string): string | null {
  const m = /^lens_(lm[1-8]|lp[1-6])_/.exec(key);
  return m ? m[1].toUpperCase() : null;
}

/**
 * ★ P2 · The display name for a runtime-composed lens finding key.
 *
 * `findingName` cannot answer this — a `lens_*` key is not in any registry and its humanize form
 * would read "Lens lm3 NII". The engine carries the face label on the row's evidence, which is where
 * this used to be read from directly; that is a name arriving from a PERSISTED payload rather than
 * from the catalogue, so a face relabelled today would keep rendering yesterday's word on every
 * historical row. Resolve the FACE first (served catalogue → bundled library), then fall back to the
 * evidence label, then to the humanized key.
 */
export function lensFindingName(key: string, evidenceLabel?: unknown): string {
  const id = faceIdOfLensKey(key);
  const face = id ? lensCatalogFace(id) : null;
  if (face?.label) return face.label;
  if (typeof evidenceLabel === "string" && evidenceLabel.trim()) return evidenceLabel;
  return findingName(key);
}

export function lensDoesntMean(idUpper: string): string {
  const face = lensCatalogFace(idUpper);
  if (face?.doesntMean) return face.doesntMean;
  const lower = idUpper.toLowerCase();
  return lensBoundary(lower) ?? LENS_DOESNT_MEAN[lower] ?? familyBoundary("E") ?? DOESNT_MEAN.E ?? "";
}
