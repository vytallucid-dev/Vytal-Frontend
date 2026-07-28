// ─────────────────────────────────────────────────────────────────────────────
// WATCHLIST — pure derivations over the read-join. No JSX, no fetching.
//
// This surface answers ONE question per row: "what's changed since I got interested?"
// The hero is the HEALTH since-you-added read (held / firmed / slipped) — the
// Vytal-specific insight nobody else shows. Price delta is the quieter second read.
//
// READ-ONLY, and strict about it:
//   • Band colour is keyed off the STORED `band` (LabelBand), NEVER re-derived from the
//     rounded `health` — a score at a band boundary (e.g. 61.6 → below_par, rounds to 62)
//     would otherwise mis-colour. The engine's band is authoritative.
//   • The finding/verdict glance is BASE wording (finding name / lens label) — it never
//     enriches client-side; it funnels to the stock page for the full reconciled read.
//   • Nothing here fabricates a score, band, finding or verdict for an unscored pin.
// ─────────────────────────────────────────────────────────────────────────────

import type { LabelBand } from "@/types/health";
import type { WatchlistEntry, WatchlistLensVerdict } from "@/types/watchlist";
import type { OhlcvBar } from "@/lib/api/hooks/use-stock-ohlcv";
import { accentOf, accentVars, compareFindings, type Accent } from "@/lib/findings/classify";
import { findingName } from "@/lib/findings/descriptions";

// ── band identity (composite condition scale) — label + colour, keyed by band ───
export const BAND_META: Record<LabelBand, { label: string; cssVar: string; text: string }> = {
  fragile:   { label: "Fragile",   cssVar: "var(--c-fragile)",  text: "text-fragile"  },
  below_par: { label: "Below par", cssVar: "var(--c-below)",    text: "text-below"    },
  steady:    { label: "Steady",    cssVar: "var(--c-steady)",   text: "text-steady"   },
  healthy:   { label: "Healthy",   cssVar: "var(--c-healthy)",  text: "text-healthy"  },
  pristine:  { label: "Pristine",  cssVar: "var(--c-pristine)", text: "text-pristine" },
};

const BAND_ORDER: Record<LabelBand, number> = {
  fragile: 0, below_par: 1, steady: 2, healthy: 3, pristine: 4,
};

export function bandLabel(b: LabelBand | null): string {
  return b ? BAND_META[b].label : "—";
}
export function bandColor(b: LabelBand | null): string {
  return b ? BAND_META[b].cssVar : "var(--ink3)";
}

// ── the HERO read: health since you added ───────────────────────────────────────
// Compares the immutable pin-time band against the current band. "held" / "firmed" /
// "slipped" are the calm, factual phrasings (no advice). null ⇒ the row is unscored and
// has no health baseline to compare — the since-added read degrades to price-only.
export type HealthMoveKind = "held" | "firmed" | "slipped" | "new_scored";
export interface HealthSinceAdded {
  kind: HealthMoveKind;
  phrase: string;
  direction: "up" | "down" | "flat";
  fromBand: LabelBand | null;
  toBand: LabelBand;
  delta: number | null; // health − pinnedHealth (points), server-provided
}

export function healthSinceAdded(e: WatchlistEntry): HealthSinceAdded | null {
  if (!e.scored || e.band == null) return null; // unscored → no health hero (price-only)
  const to = e.band;
  const from = e.pinnedBand;
  const delta = e.healthDelta;

  if (from == null) {
    // pinned before the stock carried a score — an honest "it started being scored"
    // read, not a comparison (no baseline band existed).
    return {
      kind: "new_scored",
      phrase: `scored since added — now ${BAND_META[to].label}`,
      direction: "flat",
      fromBand: null,
      toBand: to,
      delta,
    };
  }

  const cmp = BAND_ORDER[to] - BAND_ORDER[from];
  if (cmp > 0) {
    return { kind: "firmed", phrase: `firmed to ${BAND_META[to].label}`, direction: "up", fromBand: from, toBand: to, delta };
  }
  if (cmp < 0) {
    return {
      kind: "slipped",
      phrase: `slipped ${BAND_META[from].label} → ${BAND_META[to].label}`,
      direction: "down",
      fromBand: from,
      toBand: to,
      delta,
    };
  }
  // same band held — the band is the read; the ± point drift is the nuance (arrow follows it)
  const drift = delta ?? 0;
  return {
    kind: "held",
    phrase: `held at ${BAND_META[to].label}`,
    direction: drift > 0 ? "up" : drift < 0 ? "down" : "flat",
    fromBand: from,
    toBand: to,
    delta,
  };
}

// ── the quieter second read: price since you added ──────────────────────────────
export interface PriceSinceAdded {
  pct: number;
  direction: "up" | "down" | "flat";
}
export function priceSinceAdded(e: WatchlistEntry): PriceSinceAdded | null {
  if (e.priceChangePct == null) return null;
  const p = e.priceChangePct;
  return { pct: p, direction: p > 0.05 ? "up" : p < -0.05 ? "down" : "flat" };
}

// ── 7d sparkline + 7D return, derived client-side from the SAME OHLCV read the holdings
//    row-expand uses (query key ["stock", symbol, "ohlcv"] — so the row sparkline and the
//    sheet chart share one fetch; nothing is added to the list payload). Honest-omit when
//    <3 points: no line is drawn rather than a misleading two-dot stub. ─────────────────
export const SPARK_MIN_POINTS = 3;
const SESSIONS_1M = 21; // ~one trading month

export interface SparkRead {
  closes: number[]; // last ≤7 session closes, ascending (chart order)
  return7d: number | null; // (last − first) / first × 100 over the ~7-session window
  return1m: number | null; // ~21-session (monthly) return; null when history is shorter
}

/** Trailing reads from ascending OHLCV bars: the 7-session sparkline + its 7D return, and
 *  a ~1-month (21-session) return. Returns null when too short to read honestly (<3 points)
 *  or absent; 1M is null on its own when the window doesn't reach a full month. */
export function sparkFromBars(bars: OhlcvBar[] | undefined, sessions = 7): SparkRead | null {
  if (!bars || bars.length < SPARK_MIN_POINTS) return null;
  const closes = bars.slice(-sessions).map((b) => b.close);
  if (closes.length < SPARK_MIN_POINTS) return null;
  const first = closes[0];
  const last = closes[closes.length - 1];
  const return7d = first > 0 ? ((last - first) / first) * 100 : null;

  let return1m: number | null = null;
  if (bars.length > SESSIONS_1M) {
    const past = bars[bars.length - 1 - SESSIONS_1M].close;
    if (past > 0) return1m = ((last - past) / past) * 100;
  }
  return { closes, return7d, return1m };
}

// ── the finding / verdict glance — ONE base-wording line, funnels to the stock page ──
// Priority mirrors the §5 spine (risk before opportunity): a fired red flag, else a fired
// pattern (both ordered by the canonical A→I + severity comparator), else the BASE
// three-lens verdict (pillar roll-ups first). A scored row with nothing fired reads a calm
// "No flags". Unscored → null (the not-scored state carries the row instead).
export interface Glance {
  kind: "flag" | "pattern" | "lens" | "clean";
  label: string;
  accent: Accent;
  detail: boolean; // a supporting-detail lens read (vs a top-level one)
}

// tone → accent (§0.2), mirrors stock-detail/health `lensAccentKey`: a FIELD-VERDICT is
// CONTEXT (amber/neutral), never styled good/bad — so it resolves to high/ctx, never
// rec(green)/crit(red). Kept local so this lib stays free of the health component tree.
function lensAccent(tone: string, fieldVerdict: string | null): Accent {
  if (fieldVerdict === "PG_WEAK") return "high";
  if (fieldVerdict === "PG_STRONG") return "ctx";
  const t = tone.toLowerCase();
  if (t.includes("concern")) return "crit";
  if (t.includes("caution")) return "high";
  if (t.includes("constructive")) return "rec";
  return "ctx";
}

const ACCENT_WEIGHT: Record<Accent, number> = { crit: 0, high: 1, rec: 2, ctx: 3 };
function lensRank(v: WatchlistLensVerdict): number {
  return (v.role === "top_level" ? 0 : 10) + ACCENT_WEIGHT[lensAccent(v.tone, v.fieldVerdict)];
}

export function watchlistGlance(e: WatchlistEntry): Glance | null {
  if (!e.scored) return null;

  const flagsPats = [
    ...e.findings.redFlags.map((f) => ({ key: f.flagKey, severity: f.severity, kind: "flag" as const })),
    ...e.findings.patterns.map((p) => ({ key: p.patternKey, severity: p.severity, kind: "pattern" as const })),
  ];
  if (flagsPats.length > 0) {
    const top = [...flagsPats].sort(compareFindings)[0];
    return { kind: top.kind, label: findingName(top.key), accent: accentOf(top.severity), detail: false };
  }

  const lens = [...e.threeLens.pillarPatterns, ...e.threeLens.metricPatterns];
  if (lens.length > 0) {
    const top = [...lens].sort((a, b) => lensRank(a) - lensRank(b))[0];
    return {
      kind: "lens",
      label: top.label,
      accent: lensAccent(top.tone, top.fieldVerdict),
      detail: top.role !== "top_level",
    };
  }

  return { kind: "clean", label: "No flags", accent: "ctx", detail: false };
}

/** CSS custom-property bundle for a glance accent (matches globals.css --crit/-bg/-bd …). */
export function glanceVars(accent: Accent): { color: string; bg: string; bd: string } {
  return accentVars(accent);
}

// ── sorting (pure) — every key reads a row field verbatim; nulls (unscored / unpriced)
//    ALWAYS sink to the bottom either direction, so an honest "no read" never outranks a
//    real value. Default is addedAt desc (most-recently pinned first — the server order). ─
export type WatchSortKey = "addedAt" | "band" | "sinceAdded" | "dayChange" | "marketCap" | "symbol";
export type SortDir = "asc" | "desc";

const SORT_VALUE: Record<WatchSortKey, (e: WatchlistEntry) => number | string | null> = {
  addedAt: (e) => e.addedAt, // ISO strings sort lexicographically = chronologically
  band: (e) => e.health,
  sinceAdded: (e) => e.healthDelta,
  dayChange: (e) => e.dayChangePct,
  marketCap: (e) => e.marketCap,
  symbol: (e) => e.symbol,
};

export function sortWatchlist(entries: WatchlistEntry[], key: WatchSortKey, dir: SortDir): WatchlistEntry[] {
  const get = SORT_VALUE[key];
  const factor = dir === "asc" ? 1 : -1;
  return [...entries].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1; // nulls sink regardless of direction
    if (vb == null) return -1;
    if (typeof va === "string" && typeof vb === "string") return factor * va.localeCompare(vb);
    return factor * ((va as number) - (vb as number));
  });
}

// ── header summary — a since-you-added-oriented glance (not a portfolio-style total) ──
export interface WatchlistSummary {
  total: number;
  scored: number;
  firmed: number;
  slipped: number;
}
export function watchlistSummary(entries: WatchlistEntry[]): WatchlistSummary {
  let scored = 0, firmed = 0, slipped = 0;
  for (const e of entries) {
    if (e.scored) scored++;
    const h = healthSinceAdded(e);
    if (h?.kind === "firmed") firmed++;
    else if (h?.kind === "slipped") slipped++;
  }
  return { total: entries.length, scored, firmed, slipped };
}
