// lib/findings/index.ts
//
// The findings read-layer's public surface. Two preparers turn the engine's raw, unordered
// fired set into the ordered/consolidated/coloured/masked shape the UI renders:
//   • prepareStockFindings — the rich per-stock §5 surface (verdict sentences + evidence).
//   • prepareCensus        — the aggregate boards (PG pathology + Hub Flags), member census.
// Both share ONE ordering (File 1 §5 A→I), ONE accent map, and ONE C-family consolidation,
// so the three surfaces can never drift. No fire-logic: we only order/format what was written.

import type { RedFlagView, PatternView } from "@/types/health";
import type { PathologyCensusItem, PathologyReach } from "@/types/peer-group";
import {
  accentOf,
  concernOf,
  densityOf,
  familyOf,
  isPriceLinked,
  isTrajectoryCard,
  orderRankOf,
  severityWeight,
  CALIBRATION_CAVEAT,
  MASK_NOTE,
  SHORT_WINDOW_CAVEAT,
  type Accent,
  type Concern,
  type Density,
  type DisplayState,
  type Family,
} from "./classify";
import { doesntMean, findingConcern, findingDescription, findingName, lensFindingName } from "./descriptions";
import { renderVerdict } from "./verdicts";
import { catalogueSource, reportFallback } from "./catalogue-store";

export * from "./classify";
export * from "./descriptions";
export * from "./verdicts";
export * from "./evidence-shape";
export * from "./catalogue-store";

/** The concern bucket for a census row. The CATALOG's assignment wins (it knows the structural
 *  B/C/D/F/G/I cards belong to "trajectory" and rehomes ownership_H to "ownership"); classify's
 *  key-shape concernOf is only the fallback for keys the catalog doesn't carry (→ "other"), so a
 *  known finding is never orphaned. */
/**
 * ★ THE CATALOGUE DECIDES, AND AN UNKNOWN KEY THROWS.
 *
 * ⚠ THIS USED TO FALL THROUGH TO `"other"`. The Hub renders four concern groups and has no row for a
 * fifth, so a finding landing in `other` was counted in the census header and then appeared under no
 * group at all — present in a number, absent from every list. Nothing errored.
 *
 * The only route here is a key the catalogue does not carry, which means this mirror has drifted from
 * the backend. That is a build-time defect. It should fail the first time it renders rather than file
 * a real finding nowhere and let the counts quietly disagree with the lists.
 */
function concernFor(key: string): Concern {
  const c = findingConcern(key) ?? concernOf(key);
  if (!c) {
    throw new Error(
      `concernFor: "${key}" resolves to no concern. The catalogue serves four (ownership, foundation, ` +
        `momentum, trajectory) and this key matched none — the frontend catalogue mirror has drifted ` +
        `from the backend. Re-run the copy generator; do not add a fallback bucket.`,
    );
  }
  return c;
}

// ── §5 stock surface ───────────────────────────────────────────────────────────
export interface PreparedFinding {
  key: string;
  family: Family;
  kind: "red_flag" | "pattern";
  name: string;
  accent: Accent;
  severity: string | null;
  displayState: DisplayState;
  /** Effective §5E score impact; a dampened pattern carries the HALVED value. null for red
   *  flags + structural cards. */
  magnitude: number | null;
  /** The File-1 verdict sentence, bound to this finding's real evidence numbers. */
  verdict: string;
  doesntMean: string;
  evidence: Record<string, unknown> | null;
  /** read-layer mask: present only when the card is price-linked AND the pond is hot. */
  maskNote: string | null;
  /** documented limitations (current-calibration bands, shallow trajectory window). */
  caveats: string[];
  orderRank: number;
  /** For the consolidated divergence card only — the ≤2 displayed sub-type sentences. */
  subTypes?: { key: string; name: string; verdict: string; evidence: Record<string, unknown> | null }[];
  /** Total C sub-types fired (so the card can say "+N more" beyond the 2 shown). */
  divergenceCount?: number;
}

const asObj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : null;

const SHORT_WINDOW_MAX = 3; // a trajectory read over ≤3 snapshots is "shallow history"

function caveatsFor(key: string, ev: Record<string, unknown> | null): string[] {
  if (!isTrajectoryCard(key) || !ev) return [];
  const out: string[] = [];
  if (typeof ev.calibration === "string") out.push(CALIBRATION_CAVEAT);
  const series = Array.isArray(ev.trajectory) ? ev.trajectory : Array.isArray(ev.gapTrajectory) ? ev.gapTrajectory : null;
  if (series && series.length > 0 && series.length <= SHORT_WINDOW_MAX) out.push(SHORT_WINDOW_CAVEAT);
  return out;
}

/**
 * ★ STAGE 5 · THE VERDICT NOW ARRIVES ON THE ROW.
 *
 * A verdict is an (evidence) => string function bound to THIS stock's numbers, so it cannot be served
 * from the catalogue endpoint — the backend renders it onto the finding row instead (Stage 3). This is
 * the repoint: prefer the server's sentence; fall back to the bundled renderer.
 *
 * ⚠ `renderVerdict(key, evidence)` KEEPS ITS SIGNATURE and keeps working. It is no longer the first
 * authority, it is the fallback — which is exactly what 5b requires. A dead backend, or a payload
 * predating Stage 3, still produces the same sentence it always did.
 */
function verdictFor(key: string, ev: Record<string, unknown> | null, served: string | null | undefined): string {
  if (typeof served === "string" && served.length > 0) return served;
  // Only a signal when the catalogue IS live: a row without a verdict then means a backend older than
  // Stage 3, which is a deploy-order problem worth seeing rather than a cold start.
  if (catalogueSource() === "catalogue") reportFallback("verdict-missing", `verdict for "${key}" was not on the row`);
  return renderVerdict(key, ev);
}

function toFinding(
  key: string,
  kind: "red_flag" | "pattern",
  severity: string | null,
  displayState: DisplayState,
  magnitude: number | null,
  evidence: unknown,
  pondHot: boolean,
  servedVerdict?: string | null,
): PreparedFinding {
  const ev = asObj(evidence);
  const priceLinked = isPriceLinked(key);
  const family = familyOf(key);
  // Lens findings (lens_lm3/lm7/lp2/lp5) have runtime-composed keys, so `findingName` would mangle
  // them. P2: resolve the FACE from the catalogue and use its label; the evidence label is now the
  // fallback rather than the source, so a relabelled face no longer leaves old rows on the old word.
  const name = key.startsWith("lens_") ? lensFindingName(key, ev?.label) : findingName(key);
  return {
    key,
    family,
    kind,
    name,
    accent: accentOf(severity, family),
    severity,
    displayState,
    magnitude,
    verdict: verdictFor(key, ev, servedVerdict),
    doesntMean: doesntMean(key),
    evidence: ev,
    maskNote: priceLinked && pondHot ? MASK_NOTE : null,
    caveats: caveatsFor(key, ev),
    orderRank: orderRankOf(key, severity),
  };
}

/** Consolidate every fired C-family finding into ONE divergence card (File 1 §5C — max 2
 *  sub-types shown). Severity/accent/order follow the WIDEST sub-type. Returns null if no
 *  divergence fired. */
function consolidateDivergence(cFindings: PreparedFinding[], pondHot: boolean): PreparedFinding | null {
  if (cFindings.length === 0) return null;
  // Dominant first: wide (high) before notable (medium), then by severity weight.
  const sorted = [...cFindings].sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity));
  const shown = sorted.slice(0, 2);
  const lead = sorted[0];
  const anyWide = sorted.some((c) => severityWeight(c.severity) <= severityWeight("high"));
  const priceLinked = sorted.some((c) => isPriceLinked(c.key));
  const caveats = Array.from(new Set(sorted.flatMap((c) => c.caveats)));
  return {
    key: "divergence_consolidated",
    family: "C",
    kind: "pattern",
    name: shown.length > 1 ? "Divergence — two gaps at once" : "Divergence",
    accent: lead.accent,
    severity: lead.severity,
    displayState: sorted.find((c) => c.displayState !== "active")?.displayState ?? "active",
    magnitude: null, // structural divergence card — no §5E magnitude
    verdict: shown.map((c) => c.verdict).join(" "),
    doesntMean: lead.doesntMean,
    evidence: lead.evidence,
    maskNote: priceLinked && pondHot ? MASK_NOTE : null,
    caveats,
    orderRank: anyWide ? 3 : 5, // C wide → slot 3, notable → slot 5 (File 1 ordering)
    subTypes: shown.map((c) => ({ key: c.key, name: c.name, verdict: c.verdict, evidence: c.evidence })),
    divergenceCount: sorted.length,
  };
}

export interface StockFindings {
  ordered: PreparedFinding[];
  density: Density;
  count: number;
}

/**
 * Build the §5 surface: every fired finding ordered A→I, the C-family consolidated into one
 * card, each card coloured by severity, masked when price-linked + pond-hot, and carrying its
 * File-1 verdict sentence. `pondHot` is a read-layer signal (the stock's PG is price-stretched).
 */
export function prepareStockFindings(
  findings: { redFlags: RedFlagView[]; patterns: PatternView[] },
  opts: { pondHot?: boolean } = {},
): StockFindings {
  const pondHot = opts.pondHot ?? false;
  const flags = findings.redFlags.map((rf) =>
    toFinding(rf.flagKey, "red_flag", rf.severity, "active", null, rf.triggeringValues, pondHot, rf.verdict),
  );
  const pats = findings.patterns.map((p) =>
    toFinding(p.patternKey, "pattern", p.severity, (p.displayState as DisplayState) ?? "active", p.magnitude ?? null, p.evidence, pondHot, p.verdict),
  );

  const all = [...flags, ...pats];
  const density = densityOf(all.map((x) => x.key));

  // Pull the C-family out and replace with one consolidated card.
  const cFindings = all.filter((x) => x.family === "C");
  const rest = all.filter((x) => x.family !== "C");
  const consolidated = consolidateDivergence(cFindings, pondHot);
  const merged = consolidated ? [...rest, consolidated] : rest;

  merged.sort((a, b) => a.orderRank - b.orderRank || severityWeight(a.severity) - severityWeight(b.severity) || a.key.localeCompare(b.key));

  return { ordered: merged, density, count: merged.length };
}

// ── aggregate boards (PG pathology census · Hub Flags board) ────────────────────
export interface PreparedCensus {
  key: string;
  family: Family;
  kind: "red_flag" | "pattern";
  concern: Concern;
  name: string;
  /** Static, rule-level description (catalog). null → the surface renders TITLE ONLY, never filler. */
  description: string | null;
  /** The interpretive boundary — every census card must carry one (Rules Spec card anatomy). */
  doesntMean: string;
  accent: Accent;
  severity: string | null;
  displayState: DisplayState;
  memberCount: number;
  outOf: number;
  members: string[];
  reach: PathologyReach;
  orderRank: number;
  /** Consolidated divergence row: the ≤2 dominant sub-type names + total fired. */
  subTypes?: { key: string; name: string }[];
  divergenceCount?: number;
}

function reachOf(n: number, m: number): PathologyReach {
  if (n <= 1) return "isolated";
  if (m > 0 && n / m >= 0.5) return "widespread";
  return "cluster";
}

function toCensus(item: PathologyCensusItem): PreparedCensus {
  const family = familyOf(item.key);
  return {
    key: item.key,
    family,
    kind: item.kind,
    concern: concernFor(item.key),
    name: findingName(item.key),
    description: findingDescription(item.key),
    doesntMean: doesntMean(item.key),
    accent: accentOf(item.severity, family),
    severity: item.severity,
    displayState: (item.displayState as DisplayState) ?? "active",
    memberCount: item.memberCount,
    outOf: item.outOf,
    members: item.members,
    reach: item.reach,
    orderRank: orderRankOf(item.key, item.severity),
  };
}

function consolidateCensusDivergence(rows: PreparedCensus[]): PreparedCensus | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity));
  const lead = sorted[0];
  const members = Array.from(new Set(sorted.flatMap((r) => r.members))).sort();
  const outOf = Math.max(...sorted.map((r) => r.outOf));
  const anyWide = sorted.some((c) => severityWeight(c.severity) <= severityWeight("high"));
  return {
    key: "divergence_consolidated",
    family: "C",
    kind: "pattern",
    concern: concernFor("divergence_consolidated"),
    name: "Divergence",
    description: findingDescription("divergence_consolidated"),
    doesntMean: doesntMean("divergence_consolidated"),
    accent: lead.accent,
    severity: lead.severity,
    displayState: sorted.find((r) => r.displayState !== "active")?.displayState ?? "active",
    memberCount: members.length,
    outOf,
    members,
    reach: reachOf(members.length, outOf),
    orderRank: anyWide ? 3 : 5,
    subTypes: sorted.slice(0, 2).map((r) => ({ key: r.key, name: r.name })),
    divergenceCount: sorted.length,
  };
}

/**
 * Prepare an aggregate census (PG pathology / Hub Flags): each row classified + coloured +
 * named via the SAME maps as §5, the C-family consolidated into one divergence row, all sorted
 * A→I. Surfaces then group/filter (e.g. Hub Flags by concern) over this prepared set.
 */
export function prepareCensus(items: PathologyCensusItem[]): PreparedCensus[] {
  const rows = items.map(toCensus);
  const cRows = rows.filter((r) => r.family === "C");
  const rest = rows.filter((r) => r.family !== "C");
  const consolidated = consolidateCensusDivergence(cRows);
  const merged = consolidated ? [...rest, consolidated] : rest;
  merged.sort((a, b) => a.orderRank - b.orderRank || severityWeight(a.severity) - severityWeight(b.severity) || b.memberCount - a.memberCount || a.key.localeCompare(b.key));
  return merged;
}
