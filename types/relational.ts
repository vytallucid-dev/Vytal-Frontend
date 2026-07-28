// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// RELATIONAL L4 (the reader-relative Overview card) — the finished state the backend service emits.
//
// Wire shape of GET /api/v1/relational/stock/:stockId (behind optionalAuth), per the Overview Pattern
// Library §1.4. The backend authors this object because the AI layer consumes the SAME object (§6.2) —
// so `claim`, `gloss`, and `doesntMean` arrive RENDERED. The card renders them verbatim and never
// authors, rewords, or re-templates a sentence.
//
// Opaque, never rendered: `sourceRef`, `entryId`, `family`, `weight` (ladderRung / relationalWeight).
// Never rendered in this slice: `negatives` (the AI layer's payload) and `meta.degradations`.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

export type RelationalMode =
  | "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7" | "M8" | "M9" | "M10" | "M11" | "M12";

export type RelationalFamily = "UO" | "UH" | "UN" | "UD" | "UE" | "UG" | "ELEVATED";
export type RelationalTemporalClass = "CONDITION" | "TRANSITION" | "CLOCK_EVENT";

/** One resolved slot. Ordering is the backend's arbitration ladder and MUST NOT be re-sorted client-side
 *  (§2.3 stability). `arithmetic` carries the structured numbers behind the claim — the source for badges
 *  (never re-parse the rendered sentence). It deliberately never carries `magnitude`. */
export interface ResolvedEntry {
  entryId: string; // opaque — never rendered
  family: RelationalFamily; // used to distinguish reader-fact vs object-fact; never rendered
  claim: string; // a RENDERED sentence — render verbatim
  gloss: string | null; // already resolved per the reader's aiLevel — render if present, never choose
  temporalClass: RelationalTemporalClass;
  standingSince: { label: string; snapshotCount: number } | null; // duration annotation (never reorders)
  isNewSinceLastLook: boolean; // "new" pill — an annotation, never a reordering
  weight: { ladderRung: number; relationalWeight: number }; // opaque — never rendered
  arithmetic: Record<string, unknown> | null; // structured quantities behind the claim (badge source)
  interpretationCeiling: string | null; // AI-layer boundary — not rendered
  doesntMean: string; // a RENDERED interpretive boundary — render verbatim (the ≠ treatment)
  sourceRef: string; // opaque — never rendered
}

export interface RelationalNegative {
  fact: string;
  detail: Record<string, unknown> | null;
}

export interface RelationalDegradation {
  prerequisite: string;
  effect: string;
}

export interface RelationalState {
  mode: RelationalMode;
  header: { entryId: string; claim: string; gloss: string | null };
  slots: ResolvedEntry[]; // ordered, capped by mode — render in order, never re-sort
  overflow: ResolvedEntry[]; // the rest of the standing set, revealed on expand
  negatives: RelationalNegative[]; // AI-layer payload — never rendered
  meta: {
    resolvedAt: string;
    snapshotGeneration: string | null;
    lastLookLabel: string | null;
    degradations: RelationalDegradation[]; // not rendered this slice
  };
}
