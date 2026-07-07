// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO OVERVIEW — pure derivations over the snapshot + holdings. No JSX.
// Every value here is a READ or a tracker figure (value share, P&L, day move) — NEVER
// a re-computed score, pillar, penalty or health weight. Those come from the snapshot
// verbatim. Findings are surfaced descriptive, with tone → colour, copy as-is.
// ─────────────────────────────────────────────────────────────────────────────
import { healthColorVar } from "@/lib/format";
import type {
  ConstructionBand,
  Holding,
  PfFinding,
  PfTone,
  PhsBand,
  PortfolioSnapshot,
  StockBand,
} from "@/types/portfolio";

// ── PALETTES (Part A3) — three DELIBERATELY-DISTINCT band languages, so the two reads
//    never read as two scores of the same thing. Hexes are the design source of truth. ──

// Health band (best → worst) — rich & saturated: the premium read.
export const HEALTH_BAND_META: Record<PhsBand, { label: string; color: string }> = {
  Strong: { label: "Strong", color: "#4ea1e6" },
  Steady: { label: "Steady", color: "#4fb6a4" },
  Mixed: { label: "Mixed", color: "#d6a652" },
  Fragile: { label: "Fragile", color: "#e08a4c" },
  Weak: { label: "Weak", color: "#db6a6a" },
};
export function healthColor(band: PhsBand | null): string {
  return band ? HEALTH_BAND_META[band].color : "var(--ink3)";
}

// Construction band (Structure, best → worst) — cooler / structural, so it never reads
// as a health score. The blueprint palette.
export const CONSTRUCTION_BAND_META: Record<ConstructionBand, { label: string; color: string }> = {
  "Well-built": { label: "Well-built", color: "#5fa88f" },
  Solid: { label: "Solid", color: "#6f9bb0" },
  Concentrated: { label: "Concentrated", color: "#c9a94a" },
  Lopsided: { label: "Lopsided", color: "#d98c4a" },
  Fragile: { label: "Fragile", color: "#db6a6a" },
};
export function constructionColor(band: ConstructionBand | null): string {
  return band ? CONSTRUCTION_BAND_META[band].color : "var(--ink3)";
}

// The blueprint accent (construction read's slate identity) + the two-tone waterfall drags
// (construction = amber "shape cost", signal = red "flag cost", coverage = slate) + the
// coverage-bar segment colours (scored / awaiting-with-shimmer / untracked).
export const BLUEPRINT_ACCENT = "#6f9bb0";
export const DRAG_COLOR = { construction: "#d0954e", signal: "#cf6a6a", coverage: "#6f9bb0" } as const;
export const COVERAGE_COLOR = { scored: "#4ea1e6", awaiting: "#6f9bb0", untracked: "#3a4048" } as const;
export const POSITIVE_COLOR = "#5bb98c";

/** Route to a symbol's per-stock health page (the link-out target for holdings + findings). */
export function stockHealthHref(symbol: string): string {
  return `/research/stock-screener/${encodeURIComponent(symbol)}?tab=health`;
}

// ── finding tone → severity tokens (soft fill + border + ink) ───────────────────
export const TONE_META: Record<PfTone, { color: string; bg: string; border: string }> = {
  Constructive: { color: "var(--rec)", bg: "var(--rec-bg)", border: "var(--rec-bd)" },
  Neutral: { color: "var(--ctx)", bg: "var(--ctx-bg)", border: "var(--ctx-bd)" },
  Caution: { color: "var(--high)", bg: "var(--high-bg)", border: "var(--high-bd)" },
  Concern: { color: "var(--crit)", bg: "var(--crit-bg)", border: "var(--crit-bd)" },
};

// ── stock condition band → label + colour (per-holding health) ──────────────────
export const STOCK_BAND_LABEL: Record<StockBand, string> = {
  fragile: "Fragile",
  below_par: "Below par",
  steady: "Steady",
  healthy: "Healthy",
  pristine: "Pristine",
};

/** Colour for a holding's health — by numeric composite (single source: format.ts).
 *  Unscored → neutral grey (never a fake band colour). */
export function holdingHealthColor(h: Pick<Holding, "health">): string {
  return h.health == null ? "var(--ink3)" : healthColorVar(h.health);
}

// ── the descriptive sentence for a finding (spec Read, else label) ──────────────
export function findingRead(f: PfFinding): string {
  return f.read ?? f.label;
}

/** The single Tier-1 synthesis line: the loudest, most-severe fired finding's read.
 *  Descriptive, not advice. null when nothing meaningful fired. */
export function pickSynthesis(findings: PfFinding[]): PfFinding | null {
  const order: Record<PfTone, number> = { Concern: 0, Caution: 1, Neutral: 2, Constructive: 3 };
  const ranked = [...findings].sort((a, b) => {
    if (a.loud !== b.loud) return a.loud ? -1 : 1;
    return order[a.tone] - order[b.tone];
  });
  return ranked[0] ?? null;
}

// ── finding family identity (Part B2e/B3d) — badge label + colour. Construction families
//    (PC/PB) wear the blueprint slate; health families wear their own accents. ───────────
export const FAMILY_META: Record<string, { label: string; color: string }> = {
  PC: { label: "Concentration", color: BLUEPRINT_ACCENT },
  PB: { label: "Breadth", color: BLUEPRINT_ACCENT },
  PQ: { label: "Quality", color: "#5d92d8" },
  PS: { label: "Signals", color: "#cf6a6a" },
  PX: { label: "Cross-pillar", color: "#a085d8" },
  PV: { label: "Coverage", color: BLUEPRINT_ACCENT },
};

// ── the two-read finding partition (read verbatim off the snapshot; never re-derived).
//    Union of both reads = every fired finding (byte-identical to the flat firedFindings). ─
export function allFindings(s: PortfolioSnapshot): PfFinding[] {
  return [...s.constructionRead.findings, ...(s.healthRead?.findings ?? [])];
}
/** PC/PB — the construction read owns these (concentration & breadth). */
export function concentrationFindings(s: PortfolioSnapshot): PfFinding[] {
  return allFindings(s).filter((f) => f.family === "PC" || f.family === "PB");
}
/** PQ/PS/PX — the health read's "what the number hid" (coverage PV is surfaced separately). */
export function healthPatternFindings(s: PortfolioSnapshot): PfFinding[] {
  return allFindings(s).filter((f) => f.family === "PQ" || f.family === "PS" || f.family === "PX");
}
/** PV — the coverage/visibility story (rendered in the coverage section, not the findings grid). */
export function coverageFindings(s: PortfolioSnapshot): PfFinding[] {
  return allFindings(s).filter((f) => f.family === "PV");
}

// ── attention: holdings whose own health is weak (Fragile / Below par) ──────────
export interface AttentionRead {
  count: number;
  names: string[]; // symbols
}
export function attentionHoldings(holdings: Holding[]): AttentionRead {
  const weak = holdings
    .filter((h) => h.band === "fragile" || h.band === "below_par")
    .sort((a, b) => (a.health ?? 0) - (b.health ?? 0));
  return { count: weak.length, names: weak.map((h) => h.symbol) };
}

// ── coverage honesty line (law 2) ───────────────────────────────────────────────
export function unscoredCount(holdings: Holding[]): number {
  return holdings.filter((h) => h.health == null).length;
}

// ── allocation glance (Sector / Stock / Market-cap) ─────────────────────────────
export type AllocationMode = "sector" | "stock" | "marketcap";
export interface AllocSegment {
  key: string;
  label: string;
  weight: number; // 0..1 (share of priced book value)
  color: string;
  meta?: string;
}

const SECTOR_PALETTE = [
  "var(--p-found)",
  "var(--p-mom)",
  "var(--p-mkt)",
  "var(--p-own)",
  "var(--c-pristine)",
  "var(--c-healthy)",
  "var(--c-steady)",
  "var(--c-below)",
];

export const TIER_META: Record<string, { label: string; color: string }> = {
  large: { label: "Large cap", color: "var(--p-found)" },
  mid: { label: "Mid cap", color: "var(--p-mkt)" },
  small: { label: "Small cap", color: "var(--p-mom)" },
  unknown: { label: "Unclassified", color: "var(--ink3)" },
};

export function buildAllocation(holdings: Holding[], mode: AllocationMode): AllocSegment[] {
  const priced = holdings.filter((h) => h.marketValue != null && h.marketValue > 0);
  const total = priced.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  if (total <= 0) return [];

  if (mode === "stock") {
    return [...priced]
      .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))
      .map((h) => ({
        key: h.symbol,
        label: h.symbol,
        weight: (h.marketValue ?? 0) / total,
        color: holdingHealthColor(h),
        meta: h.sector ?? undefined,
      }));
  }

  if (mode === "marketcap") {
    const byTier = new Map<string, number>();
    for (const h of priced) byTier.set(h.tier, (byTier.get(h.tier) ?? 0) + (h.marketValue ?? 0));
    return [...byTier.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tier, val]) => ({
        key: tier,
        label: (TIER_META[tier] ?? TIER_META.unknown).label,
        weight: val / total,
        color: (TIER_META[tier] ?? TIER_META.unknown).color,
      }));
  }

  // sector
  const bySector = new Map<string, number>();
  for (const h of priced) {
    const key = h.sector ?? "Unclassified";
    bySector.set(key, (bySector.get(key) ?? 0) + (h.marketValue ?? 0));
  }
  return [...bySector.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([sector, val], i) => ({
      key: sector,
      label: sector,
      weight: val / total,
      color: sector === "Unclassified" ? "var(--ink3)" : SECTOR_PALETTE[i % SECTOR_PALETTE.length],
    }));
}

/** A position's total (unrealized) return %, over invested cost. null ⇒ unpriced. */
export function returnPct(h: Holding): number | null {
  if (h.unrealizedPnl == null || h.investedValue <= 0) return null;
  return (h.unrealizedPnl / h.investedValue) * 100;
}

// ── positions-table sort (pure) — every key reads a holding field verbatim ──────
export type HoldingSortKey =
  | "symbol"
  | "quantity"
  | "avgCost"
  | "currentPrice"
  | "investedValue"
  | "marketValue"
  | "dayChangePct"
  | "unrealizedPnl"
  | "weight"
  | "health";
export type SortDir = "asc" | "desc";

const SORT_VALUE: Record<HoldingSortKey, (h: Holding) => number | string | null> = {
  symbol: (h) => h.symbol,
  quantity: (h) => h.quantity,
  avgCost: (h) => h.avgCost,
  currentPrice: (h) => h.currentPrice,
  investedValue: (h) => h.investedValue,
  marketValue: (h) => h.marketValue,
  dayChangePct: (h) => h.dayChangePct,
  unrealizedPnl: (h) => h.unrealizedPnl,
  weight: (h) => h.weight,
  health: (h) => h.health,
};

/** Sort a copy by any column. Nulls (unpriced / unscored) ALWAYS sink to the bottom,
 *  either direction — an honest "no read" never outranks a real value. */
export function sortHoldings(holdings: Holding[], key: HoldingSortKey, dir: SortDir): Holding[] {
  const get = SORT_VALUE[key];
  const factor = dir === "asc" ? 1 : -1;
  return [...holdings].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "string" && typeof vb === "string") return factor * va.localeCompare(vb);
    return factor * ((va as number) - (vb as number));
  });
}

// ── positions-table group-by (pure) — ties to the allocation cut (§1 ↔ §2) ──────
export interface HoldingGroup {
  key: string;
  label: string;
  color: string;
  holdings: Holding[];
  value: number; // Σ marketValue of priced members
  weight: number; // Σ book weight (0..1)
  invested: number;
  unrealizedPnl: number | null; // Σ where priced; null when none priced
}

/** Partition holdings by the active allocation cut. "stock" is inherently per-position
 *  (no grouping) → returns []; the table renders flat. Sector/tier colours & order match
 *  the donut so the two views read as one cut. */
export function buildGroups(holdings: Holding[], cut: AllocationMode): HoldingGroup[] {
  if (cut === "stock") return [];

  const buckets = new Map<string, Holding[]>();
  for (const h of holdings) {
    const key = cut === "marketcap" ? h.tier : h.sector ?? "Unclassified";
    const arr = buckets.get(key);
    if (arr) arr.push(h);
    else buckets.set(key, [h]);
  }

  const rows = [...buckets.entries()].map(([key, hs]) => {
    const priced = hs.filter((h) => h.marketValue != null && h.marketValue > 0);
    const value = priced.reduce((s, h) => s + (h.marketValue ?? 0), 0);
    const weight = hs.reduce((s, h) => s + h.weight, 0);
    const invested = hs.reduce((s, h) => s + h.investedValue, 0);
    const withPnl = hs.filter((h) => h.unrealizedPnl != null);
    const unrealizedPnl = withPnl.length ? withPnl.reduce((s, h) => s + (h.unrealizedPnl ?? 0), 0) : null;
    return { key, holdings: hs, value, weight, invested, unrealizedPnl };
  });

  // order by priced value desc (matches the donut), unpriced-only groups sink to the end
  rows.sort((a, b) => b.value - a.value || b.weight - a.weight);

  return rows.map((r, i) => {
    const meta =
      cut === "marketcap"
        ? TIER_META[r.key] ?? TIER_META.unknown
        : {
            label: r.key,
            color: r.key === "Unclassified" ? "var(--ink3)" : SECTOR_PALETTE[i % SECTOR_PALETTE.length],
          };
    return { ...r, label: meta.label, color: meta.color };
  });
}

export interface DiversificationRead {
  top3: number; // 0..1 share of top-3 positions
  sectorCount: number;
  largest: { symbol: string; weight: number } | null;
}
export function diversificationRead(holdings: Holding[]): DiversificationRead {
  const priced = holdings.filter((h) => h.marketValue != null && h.marketValue > 0);
  const total = priced.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  const sorted = [...priced].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));
  const top3 = total > 0 ? sorted.slice(0, 3).reduce((s, h) => s + (h.marketValue ?? 0), 0) / total : 0;
  const sectors = new Set(priced.map((h) => h.sector ?? "Unclassified"));
  const largest = sorted[0] && total > 0 ? { symbol: sorted[0].symbol, weight: (sorted[0].marketValue ?? 0) / total } : null;
  return { top3, sectorCount: sectors.size, largest };
}

// ── what's moving — two distinct reads ──────────────────────────────────────────
/** Today's movers by day %. Only holdings with a real dayChangePct. */
export function todaysMovers(holdings: Holding[], n = 3): { gainers: Holding[]; losers: Holding[] } {
  const withDay = holdings.filter((h) => h.dayChangePct != null);
  const up = [...withDay].filter((h) => (h.dayChangePct ?? 0) > 0).sort((a, b) => (b.dayChangePct ?? 0) - (a.dayChangePct ?? 0));
  const down = [...withDay].filter((h) => (h.dayChangePct ?? 0) < 0).sort((a, b) => (a.dayChangePct ?? 0) - (b.dayChangePct ?? 0));
  return { gainers: up.slice(0, n), losers: down.slice(0, n) };
}

export interface ContributionRow {
  holding: Holding;
  pnl: number; // ₹ unrealized
  contribution: number | null; // share of net total return (null when total ≈ 0)
}
/** Contributors & detractors driving TOTAL return by ₹ (unrealized). */
export function contributions(holdings: Holding[], n = 3): { contributors: ContributionRow[]; detractors: ContributionRow[] } {
  const withPnl = holdings.filter((h) => h.unrealizedPnl != null);
  const totalReturn = withPnl.reduce((s, h) => s + (h.unrealizedPnl ?? 0), 0);
  const rows: ContributionRow[] = withPnl.map((h) => ({
    holding: h,
    pnl: h.unrealizedPnl ?? 0,
    contribution: Math.abs(totalReturn) > 1 ? (h.unrealizedPnl ?? 0) / totalReturn : null,
  }));
  const contributors = [...rows].filter((r) => r.pnl > 0).sort((a, b) => b.pnl - a.pnl).slice(0, n);
  const detractors = [...rows].filter((r) => r.pnl < 0).sort((a, b) => a.pnl - b.pnl).slice(0, n);
  return { contributors, detractors };
}

// ── Health score composition (v1.2 — the decoupling) — anchor − the ONE deduction ─────
// Health is NOT a blend of three pillars. It is Quality (the anchor over your scored
// holdings) reduced ONLY by active red flags: Health = Quality − 0.20×(100−Signals). No
// structure term, no coverage cap — those belong to the standalone Construction read and
// the coverage/confidence layer, never to this number. This decomposes the ALREADY-
// PUBLISHED snapshot into that two-step story so a card can show WHY it lands where it
// does; it never recomputes the score (quality/signals/health are read verbatim; the
// flags-drag is a display split of the same stored numbers).
// The ONE Health deduction, single source of truth (v1.2). Both the Overview-card
// breakdown (scoreBreakdown, below) and the Health-tab waterfall (health/lib deductionStory)
// reconcile through `flagsDragOf` — there is no second copy of the weight or the expression
// anywhere on the client. Mirrors the engine's K.W_SIGNAL; never a recompute of the score.
export const W_SIGNAL = 0.2; // Signals penalty weight (mirrors the engine's K.W_SIGNAL)

/** Points active red flags subtract from the Quality anchor: W_SIGNAL×(100−Signals). The
 *  ONLY term besides Quality in the Health Score — a display split of the same stored
 *  Quality/Signals the engine already published, never a recomputed number. */
export function flagsDragOf(signals: number): number {
  return W_SIGNAL * (100 - signals);
}

export interface ScoreBreakdown {
  quality: number; // the anchor — where the score starts
  flagsDrag: number; // 0.20×(100−signals) — the ONLY deduction in Health (0 = no red flags)
  health: number; // the published Health Score the deduction lands on
}

/** Decompose the published Health Score into anchor − the one flags deduction. Returns null
 *  when the book isn't evaluable (no scored holdings). By construction quality − flagsDrag ≈
 *  health. Nothing about construction or coverage touches this — that is the whole v1.2 point. */
export function scoreBreakdown(s: PortfolioSnapshot): ScoreBreakdown | null {
  const h = s.healthRead;
  if (!h || h.value == null || h.quality == null) return null;
  return { quality: h.quality, flagsDrag: flagsDragOf(h.signals), health: h.value };
}
