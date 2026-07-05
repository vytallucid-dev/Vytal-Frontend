// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO OVERVIEW — pure derivations over the snapshot + holdings. No JSX.
// Every value here is a READ or a tracker figure (value share, P&L, day move) — NEVER
// a re-computed score, pillar, penalty or PHS weight. Those come from the snapshot
// verbatim. Findings are surfaced descriptive, with tone → colour, copy as-is.
// ─────────────────────────────────────────────────────────────────────────────
import { healthColorVar } from "@/lib/format";
import type {
  Holding,
  PfFinding,
  PfTone,
  PhsBand,
  PortfolioSnapshot,
  StockBand,
} from "@/types/portfolio";

// ── PHS band → condition palette (best → worst; the app's locked identity) ──────
export const PHS_BAND_META: Record<PhsBand, { label: string; color: string }> = {
  Strong: { label: "Strong", color: "var(--c-pristine)" },
  Steady: { label: "Steady", color: "var(--c-healthy)" },
  Mixed: { label: "Mixed", color: "var(--c-steady)" },
  Fragile: { label: "Fragile", color: "var(--c-below)" },
  Weak: { label: "Weak", color: "var(--c-fragile)" },
};

export function phsColor(band: PhsBand | null): string {
  return band ? PHS_BAND_META[band].color : "var(--ink3)";
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

// ── pillar mini-bars (from the snapshot; read-only) ─────────────────────────────
export interface PillarRow {
  key: "quality" | "structure" | "signals";
  label: string;
  value: number | null;
  color: string;
  note: string;
  isSoft: boolean;
}
export function pillarRows(s: PortfolioSnapshot): PillarRow[] {
  const soft = weakestPillar(s);
  const base: Omit<PillarRow, "isSoft">[] = [
    { key: "quality", label: "Quality", value: s.quality, color: "var(--p-found)", note: "health of your scored holdings" },
    { key: "structure", label: "Structure", value: s.structure, color: "var(--p-own)", note: "concentration & breadth" },
    { key: "signals", label: "Signals", value: s.signals, color: "var(--p-mom)", note: "active red flags" },
  ];
  return base.map((r) => ({ ...r, isSoft: r.key === soft }));
}

/** Which pillar is the soft spot (lowest of the three real values). */
export function weakestPillar(s: PortfolioSnapshot): "quality" | "structure" | "signals" {
  const entries: [PillarRow["key"], number][] = [
    ["quality", s.quality ?? 100],
    ["structure", s.structure],
    ["signals", s.signals],
  ];
  return entries.sort((a, b) => a[1] - b[1])[0][0];
}

// ── score composition (Overview health card) — anchor + deductions ──────────────
// The published model, NOT three peers: Quality is the ANCHOR; Structure & Signals are
// penalty-only (start 100, only subtract). The engine's formula (portfolio-spec 1.0):
//   PHS = Quality − 0.30×(100−Structure) − 0.20×(100−Signals), then coverage ceiling.
// This decomposes the ALREADY-PUBLISHED snapshot into that story so the card shows WHY
// 66 lands at 59 — it never recomputes the score (phs/quality/structure/signals are read
// verbatim; the drags are a display split of the same stored numbers).
const W_STRUCT = 0.3; // Structure penalty weight (mirrors the engine's K.W_STRUCT)
const W_SIGNAL = 0.2; // Signals penalty weight (mirrors the engine's K.W_SIGNAL)

export interface ScoreBreakdown {
  quality: number; // the anchor — where the score starts
  constructionDrag: number; // 0.30×(100−structure) — points Structure took off (≥0)
  flagsDrag: number; // 0.20×(100−signals) — points Signals took off (≥0; 0 = no red flags)
  coverageDrag: number; // extra points the coverage ceiling held back (0 unless it binds)
  composite: number; // the published PHS the deductions land on
}

/** Decompose the published PHS into anchor + deductions. Returns null when the book
 *  isn't evaluable (no scored holdings / no PHS) — the card shows its building state then.
 *  By construction quality − constructionDrag − flagsDrag − coverageDrag = composite. */
export function scoreBreakdown(s: PortfolioSnapshot): ScoreBreakdown | null {
  if (s.phs == null || s.quality == null) return null;
  const constructionDrag = W_STRUCT * (100 - s.structure);
  const flagsDrag = W_SIGNAL * (100 - s.signals);
  // When the coverage ceiling binds, the published phs sits below the raw quality−drags
  // read; surface that gap as its own honest deduction so the arithmetic still lands on phs.
  const coverageDrag = s.ceilingApplied && s.phsRaw != null ? Math.max(0, s.phsRaw - s.phs) : 0;
  return { quality: s.quality, constructionDrag, flagsDrag, coverageDrag, composite: s.phs };
}
