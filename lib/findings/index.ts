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
import { findingName } from "@/lib/finding-names";
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
import { doesntMean, renderVerdict } from "./verdicts";

export * from "./classify";
export * from "./verdicts";

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

function toFinding(
  key: string,
  kind: "red_flag" | "pattern",
  severity: string | null,
  displayState: DisplayState,
  magnitude: number | null,
  evidence: unknown,
  pondHot: boolean,
): PreparedFinding {
  const ev = asObj(evidence);
  const priceLinked = isPriceLinked(key);
  return {
    key,
    family: familyOf(key),
    kind,
    name: findingName(key),
    accent: accentOf(severity),
    severity,
    displayState,
    magnitude,
    verdict: renderVerdict(key, ev),
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
    toFinding(rf.flagKey, "red_flag", rf.severity, "active", null, rf.triggeringValues, pondHot),
  );
  const pats = findings.patterns.map((p) =>
    toFinding(p.patternKey, "pattern", p.severity, (p.displayState as DisplayState) ?? "active", p.magnitude ?? null, p.evidence, pondHot),
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
  return {
    key: item.key,
    family: familyOf(item.key),
    kind: item.kind,
    concern: concernOf(item.key),
    name: findingName(item.key),
    accent: accentOf(item.severity),
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
    concern: "other",
    name: "Divergence",
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
