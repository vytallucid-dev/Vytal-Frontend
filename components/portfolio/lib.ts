// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO OVERVIEW — pure derivations over the snapshot + holdings. No JSX.
// Every value here is a READ or a tracker figure (value share, P&L, day move) — NEVER
// a re-computed score, pillar, penalty or health weight. Those come from the snapshot
// verbatim. Findings are surfaced descriptive, with tone → colour, copy as-is.
// ─────────────────────────────────────────────────────────────────────────────
import { healthColorVar } from "@/lib/format";
import { assetClassLabel } from "@/lib/asset-class";
import type {
  BrokerExcluded,
  ConstructionBand,
  Holding,
  PfFinding,
  PfTone,
  PhsBand,
  PortfolioSnapshot,
  StockBand,
} from "@/types/portfolio";

// ── WHAT A HOLDING IS, ON ONE LINE — the sector slot, told the truth ────────────────────────────
//
// THE BUG THIS FIXES. Every surface rendered `h.sector ?? "Unclassified"`, in fourteen places. An
// ETF has no stock, therefore no sector — the backend correctly sends `sector: null` — and each of
// those fourteen sites then printed "Unclassified" over it. That word claims we TRIED to classify
// the thing and FAILED: a coverage gap. It is not. An ETF does not HAVE a sector; the concept does
// not apply to it. Dressing a design absence up as a data failure is the one thing this codebase
// refuses to do, and it was doing it in fourteen places.
//
// So the slot answers the question it was always FOR — "what is this line?" — with the true answer
// for the kind of thing it is:
//   • a NON-STOCK        → its class ("ETF", "Mutual fund", "REIT"…). Not a fallback: it is the
//                          better answer. A sector was never going to be more useful than this.
//   • a STOCK, no sector → "Unclassified". THAT is a genuine coverage gap (a bare stock admitted
//                          from a broker feed carries sectorId: null), and the honest word for it.
//   • class unknown      → the sector fallback, unchanged. Demo/mock fixtures carry no assetClass,
//                          and a missing class is not licence to assert one.
//
// ONE helper, thirteen call sites. Fourteen hand-copied fallbacks is HOW this happened — the fix is
// not thirteen better copies.
export const UNCLASSIFIED = "Unclassified";

/** The one-line answer to "what is this holding?" — its sector if that is a thing it can have,
 *  otherwise its asset class. Never asserts a sector over something that cannot have one.
 *  Also the SECTOR-CUT BUCKET KEY (allocation donut, groups, sector count), so a book's ETFs
 *  bucket as "ETF" rather than pooling into the genuine-gap bucket alongside real stocks. */
export function holdingClass(h: Pick<Holding, "sector" | "assetClass">): string {
  if (h.assetClass && h.assetClass !== "stock") return assetClassLabel(h.assetClass);
  return h.sector ?? UNCLASSIFIED;
}

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
  Precarious: { label: "Precarious", color: "#db6a6a" }, // (Stage 6) renamed from Fragile
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

/** The ₹ broker-linked value the ledgered series/XIRR leaves out — or null when there is nothing to
 *  disclose. A gap needs a real, positive value: no broker leg, a zero count, or a broker leg we could
 *  not price is NOT a gap (a zero-rupee "gap" would be noise). ONE rule, shared by the NAV-chart caption
 *  AND the Performance summary tile disclosure, so the chart and the tiles can never disagree about
 *  whether a gap exists. */
export function brokerGapValue(gap: BrokerExcluded | null | undefined): number | null {
  if (!gap || gap.count <= 0 || gap.approxValue == null || gap.approxValue <= 0) return null;
  return gap.approxValue;
}

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

// ── allocation glance (Class / Sector / Stock / Market-cap) ─────────────────────
// (Multi-asset X2) `class` is the fourth cut — the FIRST question a mixed book asks ("what KINDS of
// things do I own — equity, debt, funds, REIT?"), where the other three all silently assume equities.
// It buckets by asset class, NOT by sector: see holdingAssetClassKey vs holdingClass.
export type AllocationMode = "class" | "sector" | "stock" | "marketcap";
export interface AllocSegment {
  key: string;
  label: string;
  weight: number; // 0..1 (share of priced book value)
  color: string;
  meta?: string;
}

// Eight distinct hues — the widest single-donut palette (the Stock cut can name up to 8 slices). Reused
// by the Sector cut too. NONE of these is the reserved Others grey, so a NAMED slice never collides with
// the catch-all wedge.
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

/** The RESERVED neutral for the catch-all "Others"/"Other" wedge — a muted grey that NO named slice
 *  ever uses (SECTOR_PALETTE / CLASS_BUCKET_PALETTE / TIER_META tiers are all disjoint from it), so the
 *  catch-all always reads as the catch-all and never collides with a real holding (the 360ONE-vs-Others
 *  grey clash). One home for the grey, referenced by every fold. */
export const OTHERS_COLOR = "var(--ink3)";

/** The STOCK CUT's own named-slice palette — DELIBERATELY SEPARATE from SECTOR_PALETTE (which the
 *  Sector cut still owns, byte-identical) so widening this one can never touch the Sector cut's colours.
 *
 *  Nine hues, not the requested ten — reported, per the brief's own fallback rule ("if you can only get
 *  ~9 cleanly distinct, report it and cap named stocks there"). SECTOR_PALETTE's 8 are the full set of
 *  design-system hues that carry no OTHER meaning in this app; every remaining token was rejected for a
 *  concrete reason, not roundness:
 *    · --c-fragile / --crit (red)   → the app's own "bad / danger" colour. Painting a stock red would
 *      read as "this holding is struggling", which a pure size-driven allocation slice is not saying.
 *    · --rec (green)                → identical hex to --c-healthy, already hue #6 — not a tenth hue,
 *      the same one twice.
 *    · --high (amber)               → sits within a few degrees of --c-steady (hue #7) / --c-below
 *      (hue #8) already in the set; a third amber-family tone stops being tell-apart-able on a thin ring.
 *  --ctx (slate blue-grey) is genuinely new hue territory AND already carries a neutral/informational
 *  meaning elsewhere (the Neutral finding tone, the coverage bar's "awaiting" tint) — no borrowed alarm
 *  colour, no duplicate. That is the ninth and last hue this palette can add without either lying about
 *  a stock's condition or asking two wedges to look like one. */
const STOCK_PALETTE = [...SECTOR_PALETTE, "var(--ctx)"];

/** The "+N more stocks" overflow wedge — stocks beyond the named cap. Distinct from EVERY named hue
 *  (STOCK_PALETTE) and from the reserved Others grey (OTHERS_COLOR): a lighter, warmer neutral built by
 *  mixing --ink2 into --ink3, so it reads as "a paler shade of the ink scale" rather than a stray hue —
 *  legible as "more of the same kind of thing, just not enumerated" without ever being mistaken for the
 *  non-stock "Others" bucket sitting right next to it in the same ring. */
export const OVERFLOW_STOCKS_COLOR = "color-mix(in oklch, var(--ink2) 55%, var(--ink3) 45%)";

export const TIER_META: Record<string, { label: string; color: string }> = {
  large: { label: "Large cap", color: "var(--p-found)" },
  mid: { label: "Mid cap", color: "var(--p-mkt)" },
  small: { label: "Small cap", color: "var(--p-mom)" },
  // ONLY a STOCK reaches this now — and for a stock it is honest: we know it is an equity and we do
  // not know its tier. A FUND never lands here; it has no market-cap tier to be unclassified ABOUT.
  // See holdingTierKey.
  unknown: { label: UNCLASSIFIED, color: "var(--ink3)" },
};

/** The market-cap bucket a holding belongs in — THE SAME LAW AS holdingClass(), on the other axis.
 *
 *  An ETF has no market-cap tier. The backend sends `tier: "unknown"` for it (tier is keyed on
 *  stock_id, which a fund has not got), and TIER_META rendered that as "Unclassified" — claiming we
 *  tried to size the thing and failed. We did not: a fund is not a company and has no market cap to
 *  band. So a non-stock buckets under its CLASS, exactly as it does for sector.
 *
 *  Returns a KEY, not a label — stocks keep their tier id (so TIER_META keeps owning tier colours
 *  and copy), non-stocks carry their class label. The two namespaces cannot collide: no asset-class
 *  label is "large" / "mid" / "small" / "unknown". */
export function holdingTierKey(h: Pick<Holding, "tier" | "assetClass">): string {
  if (h.assetClass && h.assetClass !== "stock") return assetClassLabel(h.assetClass);
  return h.tier;
}

/** Colours for CLASS buckets — shared by the CLASS cut and the MARKET-CAP cut's non-stock buckets.
 *  DELIBERATELY DISJOINT from TIER_META's three tier colours: SECTOR_PALETTE's first three entries ARE
 *  --p-found / --p-mom / --p-mkt, so reusing it here painted the "ETF" slice the exact colour of "Large
 *  cap" — two different answers, one colour, in the same donut. These five collide with no tier and not
 *  with --ink3 (the grey "Other" / honest-gap colour). --p-own (teal) is the fifth: the ownership pillar
 *  hue, and the ONLY pillar colour that is not a tier colour, so it extends the run without collision.
 *  Five is the ceiling the design language allows here (the sixth condition colour, --c-fragile red, is
 *  reserved for bad/health) — so the class cut FOLDS its long tail into a grey "Other" rather than wrap
 *  past five (foldTail), and never chases a sixth hue. */
const CLASS_BUCKET_PALETTE = ["var(--c-pristine)", "var(--c-healthy)", "var(--c-steady)", "var(--c-below)", "var(--p-own)"];

/** Label + colour for a holdingTierKey bucket. A class bucket is NOT a tier: it takes a real colour,
 *  never the grey honest-gap colour — same reasoning as an "ETF" sector bucket. */
export function tierMeta(key: string, i: number): { label: string; color: string } {
  return TIER_META[key] ?? { label: key, color: CLASS_BUCKET_PALETTE[i % CLASS_BUCKET_PALETTE.length] };
}

/** The asset-class bucket a holding belongs in — THE CLASS-CUT KEY (allocation donut + group-by),
 *  the fourth cut's spine. THE SAME LAW AS holdingClass()/holdingTierKey(), on a third axis.
 *
 *  NOT holdingClass(). That is the SECTOR key: for a stock it returns its SECTOR, so equities scatter
 *  across sector buckets, and it falls back to the class label ONLY for a non-stock. The class cut asks
 *  the OTHER question — "what KIND of thing is this?" — so EVERY stock buckets as one "Stock", never by
 *  sector. Returns the raw enum as the key (label + colour come from classMeta). A holding with no class
 *  (a demo/mock fixture) buckets under UNCLASSIFIED — an absent class is not licence to assert one, the
 *  exact complement of holdingClass()'s branch.
 *
 *  GOLD FOLDS IN HERE, BY OMISSION. A gold ETF is `assetClass: "etf"` — the holding wire carries no
 *  category or gold flag (holdings-controller sends the raw enum only), so a gold ETF keys as "etf" and
 *  lands in the "ETF" bucket. That is deliberate: a folded gold ETF is honest, where a fabricated
 *  "Gold 0%" built off name-guessing would not be. */
export function holdingAssetClassKey(h: Pick<Holding, "assetClass">): string {
  return h.assetClass ?? UNCLASSIFIED;
}

/** Label + colour for a class bucket. Labels come from the EXISTING assetClassLabel vocabulary — never
 *  a second label set. A real class takes a CLASS_BUCKET_PALETTE colour (disjoint from the tier hues, so
 *  an "Equity"/"Stock" slice never borrows "Large cap"'s colour); the genuine no-class gap takes the
 *  grey honest-gap colour, exactly as an unclassified sector or tier does. */
export function classMeta(key: string, i: number): { label: string; color: string } {
  if (key === UNCLASSIFIED) return { label: UNCLASSIFIED, color: "var(--ink3)" };
  return { label: assetClassLabel(key), color: CLASS_BUCKET_PALETTE[i % CLASS_BUCKET_PALETTE.length] };
}

/** Fold a cut's long tail — every bucket under `floor` (share of priced value) — into a single grey
 *  "Other" wedge, so the palette never wraps past its five colours and the ring stays legible.
 *
 *  HONEST, NOT HIDDEN. The grey slice NAMES how many buckets it folds ("Other · 3 classes") — the same
 *  contract as the discovery list's nullSortCount: a count the user can see and reconstruct from
 *  (shown Σ + Other = whole), never a silently-dropped slice. Only fires on a GENUINE tail (≥2 sub-floor
 *  buckets): a lone small bucket keeps its real name and colour rather than being greyed for no
 *  compaction. `noun` is the unit the folded buckets ARE — "class" for the class cut, "group" for the
 *  market-cap cut (its buckets are tiers AND classes, so the honest generic).
 *
 *  Applied ONLY to the class + market-cap cuts (both draw from CLASS_BUCKET_PALETTE and can wrap). The
 *  sector cut has its own grey UNCLASSIFIED handling and an 8-wide SECTOR_PALETTE; the stock cut is
 *  per-position and folded at the display layer by count. `segs` must already be sorted value-desc. */
function foldTail(segs: AllocSegment[], noun: string, floor = 0.05): AllocSegment[] {
  const tail = segs.filter((s) => s.weight < floor);
  if (tail.length < 2) return segs; // a lone small slice stays named — folding one buys nothing
  const keep = segs.filter((s) => s.weight >= floor);
  const restWeight = tail.reduce((s, x) => s + x.weight, 0);
  // Pluralize honestly: "class" → "classes" (sibilant ending), "group" → "groups". tail is always ≥2
  // here (the guard above), so this is always the plural, but the singular branch keeps it correct.
  const plural = tail.length === 1 ? noun : /[sxz]$|[cs]h$/.test(noun) ? `${noun}es` : `${noun}s`;
  return [
    ...keep,
    { key: "__other", label: `Other · ${tail.length} ${plural}`, weight: restWeight, color: "var(--ink3)" },
  ];
}

export function buildAllocation(holdings: Holding[], mode: AllocationMode): AllocSegment[] {
  const priced = holdings.filter((h) => h.marketValue != null && h.marketValue > 0);
  const total = priced.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  if (total <= 0) return [];

  if (mode === "stock") {
    // ── THE STOCK CUT IS CATEGORICAL, NOT SIZE-DRIVEN ──────────────────────────────────────────────
    // "My stocks, individually; everything else is Other." A non-stock is Other BY DEFINITION here — a
    // fund / bond / ETF / REIT / T-bill never earns its own wedge no matter how large its slice or how
    // few holdings are in view. That is the fix: the size-fold left a 6-holding Test Book showing every
    // non-stock individually, because each slice cleared the percentage floor. This rule doesn't consult
    // slice size at all. (Contrast Class / Sector / Market-cap, which DO fold by size via foldTail — a
    // tiny sector SHOULD fold there. Both behaviours are intended, and different.)
    const isStockHolding = (h: Holding) => !h.assetClass || h.assetClass === "stock";
    const stocks = priced.filter(isStockHolding).sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));
    const nonStocks = priced.filter((h) => !isStockHolding(h));
    // TWO overflow buckets, TWO meanings — never merged:
    //   · "+N more stocks"  — stocks beyond the named cap. Still stocks; they never vanish into the
    //     non-stock bucket just because the ring ran out of colours for them.
    //   · "Others"          — non-stocks, always, regardless of size or count (unchanged).
    const named = stocks.slice(0, STOCK_PALETTE.length);
    const overflowStocks = stocks.slice(STOCK_PALETTE.length);
    const segs: AllocSegment[] = named.map((h, i) => ({
      key: h.symbol,
      label: h.symbol,
      weight: (h.marketValue ?? 0) / total,
      // A DISTINCT hue per stock — never holdingHealthColor(), whose grey for an unscored name (360ONE)
      // collided with the grey "Others". The reserved grey now belongs to Others alone.
      color: STOCK_PALETTE[i],
      meta: holdingClass(h),
    }));
    if (overflowStocks.length > 0) {
      const w = overflowStocks.reduce((s, h) => s + (h.marketValue ?? 0), 0) / total;
      segs.push({
        key: "__more_stocks",
        label: `+${overflowStocks.length} more stocks`,
        weight: w,
        color: OVERFLOW_STOCKS_COLOR,
        meta: "beyond the top " + STOCK_PALETTE.length,
      });
    }
    if (nonStocks.length > 0) {
      const w = nonStocks.reduce((s, h) => s + (h.marketValue ?? 0), 0) / total;
      segs.push({ key: "__others", label: `Others (${nonStocks.length})`, weight: w, color: OTHERS_COLOR, meta: "funds, bonds & more" });
    }
    return segs;
  }

  if (mode === "class") {
    const byClass = new Map<string, number>();
    for (const h of priced) {
      const k = holdingAssetClassKey(h); // a stock buckets as "Stock", never by its sector; gold folds into "ETF"
      byClass.set(k, (byClass.get(k) ?? 0) + (h.marketValue ?? 0));
    }
    const segs = [...byClass.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, val], i) => {
        const m = classMeta(key, i);
        return { key, label: m.label, weight: val / total, color: m.color };
      });
    return foldTail(segs, "class"); // long tail → grey "Other · N classes", so the 5-colour palette never wraps
  }

  if (mode === "marketcap") {
    const byTier = new Map<string, number>();
    for (const h of priced) {
      const k = holdingTierKey(h); // a fund buckets as "ETF", not as an unclassified market cap
      byTier.set(k, (byTier.get(k) ?? 0) + (h.marketValue ?? 0));
    }
    const segs = [...byTier.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, val], i) => {
        const m = tierMeta(key, i);
        return { key, label: m.label, weight: val / total, color: m.color };
      });
    return foldTail(segs, "group"); // shares CLASS_BUCKET_PALETTE, so it wraps too — fold the tail identically
  }

  // sector
  const bySector = new Map<string, number>();
  for (const h of priced) {
    const key = holdingClass(h);
    bySector.set(key, (bySector.get(key) ?? 0) + (h.marketValue ?? 0));
  }
  return [...bySector.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([sector, val], i) => ({
      key: sector,
      label: sector,
      weight: val / total,
      // The grey is the HONEST-GAP colour, and it still lands on exactly the honest gap: only a
      // stock we could not classify reaches this label now. An "ETF" bucket is a REAL category and
      // takes a real palette colour — the rule did not change, its input got truthful.
      color: sector === UNCLASSIFIED ? "var(--ink3)" : SECTOR_PALETTE[i % SECTOR_PALETTE.length],
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
export function sortHoldings<T extends Holding>(holdings: T[], key: HoldingSortKey, dir: SortDir): T[] {
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
export interface HoldingGroup<T extends Holding = Holding> {
  key: string;
  label: string;
  color: string;
  holdings: T[];
  value: number; // Σ marketValue of priced members
  weight: number; // Σ book weight (0..1)
  invested: number;
  unrealizedPnl: number | null; // Σ where priced; null when none priced
}

/** Partition holdings by the active allocation cut. "stock" is inherently per-position
 *  (no grouping) → returns []; the table renders flat. Sector/tier colours & order match
 *  the donut so the two views read as one cut. Generic over the row type so a richer row
 *  (the Holdings tab's per-entity `HoldingRow`) survives grouping with its extra fields intact. */
export function buildGroups<T extends Holding>(holdings: T[], cut: AllocationMode): HoldingGroup<T>[] {
  if (cut === "stock") return [];

  const buckets = new Map<string, T[]>();
  for (const h of holdings) {
    const key = cut === "marketcap" ? holdingTierKey(h) : cut === "class" ? holdingAssetClassKey(h) : holdingClass(h);
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
        ? tierMeta(r.key, i)
        : cut === "class"
          ? classMeta(r.key, i)
          : {
              label: r.key,
              color: r.key === UNCLASSIFIED ? "var(--ink3)" : SECTOR_PALETTE[i % SECTOR_PALETTE.length],
            };
    return { ...r, label: meta.label, color: meta.color };
  });
}

// ── SECTOR DIVERSIFICATION — a true number over what we can SEE, and what we can't ─────────────
//
// THE BUG THIS FIXES, AND IT IS THE OPPOSITE OF THE LAST ONE. `sectorCount` counted the buckets
// holdingClass() returns — so a book's ETFs landed in a bucket called "ETF" and were counted as ONE
// SECTOR. NIFTYBEES is fifty companies across every sector in the index: the most diversified thing
// a user can own, counted as the narrowest. That is not a mislabel, it is a diversification claim
// that is precisely backwards. ("Unclassified" was wrong too, just differently — a mystery bucket
// instead of a false one. Neither was ever true.)
//
// WHY WE DO NOT JUST CLASSIFY THE FUND. An ETF's sector composition is UNKNOWABLE TO US: we hold no
// fund constituents — no table, no source, no ingestion. That is a Phase-2 gap and it is not this
// module's to close. Estimating it, or folding funds into an "Other" sector, would be the same lie
// with a softer name.
//
// SO: COUNT WHAT WE CAN SEE, AND SAY WHAT WE CANNOT. Sectors are counted over STOCKS ONLY, and the
// read carries the weight it could not see inside so every surface can disclose it. This is the
// pattern Health already uses (a true, uncapped number + a mandatory coverage line) — a coverage
// FAILURE and a design ABSENCE are different things, and neither is allowed to quietly move a
// number up or down.
export interface DiversificationRead {
  top3: number; // 0..1 share of top-3 positions — VALUE-based, unaffected by any of the above
  /** Distinct sectors among the STOCKS — the only holdings whose sector we can know.
   *  null ⇒ THE QUESTION DOES NOT APPLY to this book (nothing priced is a stock). Deliberately not
   *  0: "0 sectors" is a claim about a book that has none, and the truth is that a book of pure
   *  funds has no sector read at all. Render it as an absence, never as a zero. */
  sectorCount: number | null;
  /** 0..1 — the share of priced book value `sectorCount` was actually measured over. */
  sectorCoverage: number;
  /** 0..1 — priced book value sitting in funds/ETFs/trusts we cannot see inside.
   *  0 ⇒ a pure-equity book: nothing is hidden, so there is NOTHING TO DISCLOSE. Don't disclose an
   *  absence — that is its own kind of noise. */
  unseenWeight: number;
  largest: { symbol: string; weight: number } | null;
}

/** Can we know this holding's sector? Only a stock has one. A holding with NO class (a demo/mock
 *  fixture) counts as one — the exact complement of holdingClass()'s branch, written against the
 *  same condition so the two cannot drift: an absent class is not licence to assert "fund" any more
 *  than it was licence to assert a sector. */
function sectorKnowable(h: Pick<Holding, "assetClass">): boolean {
  return !h.assetClass || h.assetClass === "stock";
}

export function diversificationRead(holdings: Holding[]): DiversificationRead {
  const priced = holdings.filter((h) => h.marketValue != null && h.marketValue > 0);
  const total = priced.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  const sorted = [...priced].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));
  const top3 = total > 0 ? sorted.slice(0, 3).reduce((s, h) => s + (h.marketValue ?? 0), 0) / total : 0;
  const largest = sorted[0] && total > 0 ? { symbol: sorted[0].symbol, weight: (sorted[0].marketValue ?? 0) / total } : null;

  // Sectors over STOCKS ONLY — see the header. holdingClass() still supplies the key, so a stock
  // with no sector lands in the genuine-gap bucket exactly as it did.
  const stocks = priced.filter(sectorKnowable);
  const stockValue = stocks.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  const sectorCoverage = total > 0 ? stockValue / total : 0;

  return {
    top3,
    sectorCount: stocks.length > 0 ? new Set(stocks.map((h) => holdingClass(h))).size : null,
    sectorCoverage,
    unseenWeight: total > 0 ? 1 - sectorCoverage : 0,
    largest,
  };
}

/** The sector number, or an honest dash when the question does not apply. NEVER "0". */
export function sectorCountLabel(d: DiversificationRead): string {
  return d.sectorCount == null ? "—" : String(d.sectorCount);
}

/** The MANDATORY coverage line, compact register (a stat's `sub`, a KPI tile).
 *  null ⇒ nothing to disclose (pure-equity book). */
export function sectorCoverageShort(d: DiversificationRead): string | null {
  if (d.unseenWeight <= 0) return null;
  if (d.sectorCount == null) return "funds & ETFs only";
  return `across ${Math.round(d.sectorCoverage * 100)}% of book`;
}

/** The MANDATORY coverage line, prose register — same rule, same numbers, for surfaces with room.
 *  null ⇒ nothing to disclose. Rides WITH the number on every render; never a tooltip or footnote. */
export function sectorCoverageNote(d: DiversificationRead): string | null {
  if (d.unseenWeight <= 0) return null;
  if (d.sectorCount == null) {
    return "No sector read — this book is funds and ETFs, and we can't see inside them to know what they hold.";
  }
  return `Covering ${Math.round(d.sectorCoverage * 100)}% of your book — the other ${Math.round(
    d.unseenWeight * 100,
  )}% sits in funds and ETFs we can't see inside.`;
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
