/**
 * TOOL SEPARATION + THE TOOL READ — the frontend half of the one-source rule.
 *
 * ── ★ WHAT CHANGED IN PHASE 4 ─────────────────────────────────────────────────────────────────────
 * The two research tools used to RECOMPUTE their patterns client-side, with their own copies of the
 * 15 / 25 / 1.0 constants and a vocabulary (wide|notable|none, value|price_ahead|ownership|mixed)
 * that matched no finding key. They also carried hand-authored verdict banks with thresholds typed
 * into the prose — which is how the divergence tool ended up saying "Two pillars ≥ 25 pts apart" on
 * screen after Phase 2 moved the material cut to 12.
 *
 * Both tools now read the SAME persisted findings the stock page and the Hub read. This module is
 * the only thing between the health payload and the tool: it partitions by FAMILY and hands back the
 * finding's own catalogue copy. It computes nothing.
 *
 * ── SEPARATION IS BY FAMILY, MIRRORING THE BACKEND ────────────────────────────────────────────────
 *   divergence → family C      (D1–D7, S2)
 *   trajectory → families B, D (T1–T9)
 * Both specs state the boundary from opposite sides: single-pillar readings belong to Trajectory and
 * are "deliberately absent" from Divergence, and two-pillar readings vice versa. Keying on family
 * (rather than a key list) means a new pattern reaches its tool by being NAMED correctly, and a
 * forgotten list entry cannot silently hide it.
 *
 * ⚠ Keep TOOL_FAMILIES in step with Vytal-Backend/src/catalogue/tool-families.ts. The backend filters
 *   the landing scan; this filters the single view. They must agree or a stock's tool page and its
 *   tool landing card will disagree — the exact class of bug this phase removes.
 */

import { familyOf, severityWeight, type Family } from "./classify";
import type { PatternView } from "@/types/health";

export type ToolId = "divergence" | "trajectory";

/** The families each tool renders. Mirrors the backend's TOOL_FAMILIES. */
export const TOOL_FAMILIES: Readonly<Record<ToolId, readonly Family[]>> = {
  divergence: ["C"],
  trajectory: ["B", "D"],
};

export function belongsToTool(key: string, tool: ToolId): boolean {
  return (TOOL_FAMILIES[tool] as readonly string[]).includes(familyOf(key));
}

/**
 * The findings this tool may render, most-severe first.
 *
 * ⚠ Retired keys need no filter here: the backend drops them at all nine read boundaries, so a
 * retired row cannot reach this payload. Re-filtering would imply the backend guarantee is unreliable.
 */
export function findingsForTool(patterns: readonly PatternView[] | undefined, tool: ToolId): PatternView[] {
  if (!patterns?.length) return [];
  return patterns.filter((p) => belongsToTool(p.patternKey, tool)).slice().sort(byTierThenSeverity);
}

// ★ SEVERITY_RANK IS GONE — it was the FOURTH transcription of one ordering (the backend catalogue,
//   tool-scan.service.ts, health-view.service.ts, and here). `severityWeight` is classify.ts’s, which
//   is the catalogue’s own eight-token order; a local copy stays correct only until someone adds a
//   ninth token to one of them.

/**
 * ★ CARD ORDER: TIER, THEN SEVERITY, THEN KEY.
 *
 * §1.2 grades divergence tension by TIER (material → stretched → extreme) and the RULE stamps it, so
 * tier leads. Severity breaks ties; the key terminates the order so two equally-ranked cards cannot
 * swap places between renders. Untiered patterns — every crossing and every movement — sort AFTER
 * tiered ones rather than at zero: "no tier" is a real position in the order, not a missing number.
 */
const TIER_ORDER: Readonly<Record<string, number>> = { extreme: 0, stretched: 1, material: 2 };
const tierRank = (p: PatternView): number => TIER_ORDER[(p.tier ?? "").toLowerCase()] ?? 8;
/**
 * ★ FORMED BEFORE BUILDING, ahead of every other key.
 *
 * A completed shape and a forming one are not two intensities of one card — one carries a measured
 * claim, the other carries none at all. Ordering by tier first would interleave them, putting an
 * EXTREME-gap Building card above a MATERIAL-gap Formed one and burying the only card on the stock
 * that is entitled to say anything.
 */
const stateRank = (p: PatternView): number => (p.state === "building" ? 1 : 0);

const byTierThenSeverity = (a: PatternView, b: PatternView): number =>
  stateRank(a) - stateRank(b) ||
  tierRank(a) - tierRank(b) ||
  severityWeight(a.severity) - severityWeight(b.severity) ||
  a.patternKey.localeCompare(b.patternKey);

/** Read a number out of a finding's evidence. Numbers come from EVIDENCE, never from prose — that
 *  separation is what stops a threshold going stale inside a copy string. */
export function evidenceNumber(p: PatternView, field: string): number | null {
  const ev = p.evidence as Record<string, unknown> | null;
  const v = ev?.[field];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Read a string out of a finding's evidence. */
export function evidenceString(p: PatternView, field: string): string | null {
  const ev = p.evidence as Record<string, unknown> | null;
  const v = ev?.[field];
  return typeof v === "string" ? v : null;
}

/**
 * The regime PHASE STAMPED ON THIS FINDING when it fired — never the live sector phase.
 *
 * ── ★ STAMPED vs LIVE MUST NEVER BE CONFLATED ─────────────────────────────────────────────────────
 * A fired card's phase is a historical fact: "this T3 occurred during a HOT phase" is what the study
 * measured (−5.2%, 29% positive). The sector's phase TODAY is present-tense landing context. If a
 * card rendered the live phase, a T3 that fired in HOT would silently become NORMAL weeks later and
 * lose the directional read it was entitled to — or gain one it never had.
 * So: a CARD reads this function. A LANDING may show the live phase, labelled as current, and must
 * never write it onto a card.
 */
export function stampedRegime(p: PatternView): string | null {
  const ev = p.evidence as Record<string, unknown> | null;
  const stamp = ev?.regimeAtEvent as { regime?: unknown } | undefined;
  return stamp && typeof stamp.regime === "string" ? stamp.regime : null;
}

/** The tone a finding's severity maps to, for the tool banner. Structural on `severity`
 *  alone, so it reads equally off a single-view PatternView or a scan-row ToolFinding —
 *  one severity→tone law, not a per-shape copy of it. */
export function toneOf(p: { severity: string | null | undefined }): "rec" | "high" | "ctx" | "crit" {
  const s = (p.severity ?? "").toLowerCase();
  if (s === "critical" || s === "red") return "crit";
  if (s === "high" || s === "amber") return "high";
  if (s === "recovery" || s === "green") return "rec";
  return "ctx";
}
