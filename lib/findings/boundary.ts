// lib/findings/boundary.ts
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE INTERPRETIVE-BOUNDARY RENDER TRANSFORM — one home for how a `doesntMean` string becomes pixels.
//
// ── WHAT WAS WRONG ────────────────────────────────────────────────────────────────────────────────
// Twelve render sites printed the stored string RAW into an italic, left-bordered <p>. The portfolio
// library stores its boundaries in a compressed notation — every one of its 41 strings begins with
// "≠", and 24 of them carry a second or third mid-string — so a reader on the portfolio page literally
// saw:
//
//     ≠ the position is a mistake, ≠ it will fall, ≠ trim it. Concentration is a fact about how much…
//
// A sighted reader decodes that; a screen reader announces "not equal to the position is a mistake,
// not equal to it will fall, not equal to trim it", which is not a sentence in any language. And the
// stock-finding registry stores the SAME field in a different register entirely — a bare lowercase
// fragment with no subject ("a hard risk/quality warning to investigate — not a prediction the stock
// will fall") — which rendered raw is a floating clause hanging off nothing.
//
// ── WHY THIS IS A RENDER FIX AND NOT A COPY FIX ───────────────────────────────────────────────────
// Both string sets are BACKEND copy with other consumers: the catalogue endpoint serves them, the
// bundled fallback bakes them, and the chat grounds on them. Rewriting 41 portfolio strings to match
// the stock register (or the reverse) is a copy decision with a blast radius, and it is not this.
// Nothing below changes a stored byte. It reads the SHAPE the copy is already written in and gives
// that shape the presentation it always assumed it had.
//
// ── THE SHAPE → LABEL MAP, AND WHY IT IS TWO LABELS AND NOT ONE ───────────────────────────────────
// The honest finding is that ONE label cannot cover both registers, because the field name is a lie
// for one of them. Test it:
//
//   "Doesn't mean" + portfolio  → "Doesn't mean: the position is a mistake · it will fall · trim it"
//                                 ✓ exactly what the copy says.
//   "Doesn't mean" + stock      → "Doesn't mean: a hard risk/quality warning to investigate…"
//                                 ✗ ACTIVELY FALSE. It IS a warning to investigate; that is the point
//                                   of the sentence. The stock register is a "read it as X, not Y"
//                                   line stored in a field called doesntMean.
//   "How to read it" + stock    → ✓ reads correctly across all 35 (and all 4 lens boundaries).
//   "How to read it" + portfolio→ ✗ inverts the meaning of every clause.
//
// So the label is derived from the string's shape, not authored, and there are two of them. Making it
// one label is a COPY change (rewrite one register into the other's voice) and belongs to whoever owns
// that copy — see the note at the end of this file.
//
// ── HOW IT READS ALOUD, WHICH IS THE POINT ────────────────────────────────────────────────────────
//   negations : "Doesn't mean." — list, 3 items — "the position is a mistake" — "it will fall" —
//               "trim it". Then the trailing prose as its own paragraph. The glyph never reaches the
//               accessibility tree at all; it is not replaced by a word, it is replaced by STRUCTURE.
//   scope     : "How to read it." — "a hard risk/quality warning to investigate — not a prediction the
//               stock will fall."
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/** The glyph, built from its code point. Never type it as a literal in a comparison — see the header. */
export const NOT_EQUAL = String.fromCharCode(0x2260);

export type BoundaryShape = "negations" | "scope";

export interface BoundaryParts {
  shape: BoundaryShape;
  /** The visible micro-label. Derived from `shape`, never authored, never empty. */
  label: string;
  /** "negations" only: each ≠-marked clause with the marker stripped. Empty array for "scope". */
  clauses: string[];
  /** The prose that follows the clause run. For "scope" this is the whole string. May be "". */
  prose: string;
}

export const BOUNDARY_LABEL: Readonly<Record<BoundaryShape, string>> = {
  negations: "Doesn't mean",
  scope: "How to read it",
};

/**
 * Split a last-segment on its FIRST sentence break, so "trim it. Concentration is a fact…" becomes
 * the clause "trim it" plus the prose that explains it.
 *
 * The break is a full stop followed by whitespace and then a capital. Requiring the capital is what
 * keeps "e.g." and "i.e." from splitting; the single-capital-initial case ("U.S. Treasury") is guarded
 * separately because that one IS followed by a capital. Both guards are belt-and-braces — the corpus
 * is 41 frozen strings and verify-boundary-render.ts walks every one of them on every build.
 */
function splitAtFirstSentence(s: string): [clause: string, prose: string] {
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] !== ".") continue;
    if (!/\s/.test(s[i + 1] ?? "")) continue;
    const rest = s.slice(i + 1).replace(/^\s+/, "");
    if (!/^[A-Z]/.test(rest)) continue;
    // "U.S. Treasury" / "J. Doe" — a lone capital before the stop is an initial, not a sentence end.
    const before = s.slice(0, i);
    if (/(?:^|[\s.])[A-Z]$/.test(before)) continue;
    return [before.trim(), rest.trim()];
  }
  return [s.trim(), ""];
}

/** Trim a clause's trailing separator (", " or ". ") — it belonged to the notation, not the sentence. */
const stripSeparator = (s: string): string => s.trim().replace(/[,.;]$/, "").trim();

/**
 * Parse a stored boundary string into its render parts. PURE — no React, no imports, safe to run in a
 * build-time gate. Returns "scope" for anything without the glyph, which is the correct default: a
 * string that does not use the notation is prose and is rendered as prose.
 */
export function boundaryParts(text: string): BoundaryParts {
  const raw = (text ?? "").trim();
  if (!raw.includes(NOT_EQUAL)) {
    return { shape: "scope", label: BOUNDARY_LABEL.scope, clauses: [], prose: raw };
  }

  const segments = raw.split(NOT_EQUAL);
  // Anything before the first marker is prose that leads the line. No stored string does this today;
  // handling it keeps the transform total rather than merely lucky.
  const lead = segments.shift()?.trim() ?? "";

  const clauses: string[] = [];
  let prose = "";
  segments.forEach((segment, i) => {
    const s = segment.trim();
    if (!s) return;
    if (i < segments.length - 1) {
      clauses.push(stripSeparator(s));
      return;
    }
    const [clause, rest] = splitAtFirstSentence(s);
    if (clause) clauses.push(stripSeparator(clause));
    prose = rest;
  });

  if (lead) prose = prose ? `${lead} ${prose}` : lead;
  // Degenerate input (the glyph with nothing after it) falls back to prose rather than an empty list.
  if (clauses.length === 0) return { shape: "scope", label: BOUNDARY_LABEL.scope, clauses: [], prose: prose || raw };

  return { shape: "negations", label: BOUNDARY_LABEL.negations, clauses, prose };
}

// ── ⚠ THE COPY DECISION THIS DELIBERATELY DOES NOT MAKE ───────────────────────────────────────────
// The two registers now PRESENT consistently — same component, same label slot, same visual weight,
// both announced as complete thoughts. Their VOICE still differs, and no render can close that:
//
//   portfolio : enumerates what the finding does not claim   ("the position is a mistake · it will fall")
//   stock     : states the scope positively, then negates    ("a … warning to investigate — not a prediction")
//
// Collapsing them to one voice means rewriting one register into the other, in the backend, where the
// catalogue endpoint and the chat both read it. That is a copy call. What is safe to say from here is
// which direction is cheaper: the stock register is 35 entries resolved from 10 family lines + 7
// per-entry lines + 4 lens lines (21 strings), the portfolio register is 41 strings. Neither is free.
