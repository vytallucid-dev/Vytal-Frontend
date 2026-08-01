/**
 * THE PUBLISHED MODEL OF HEALTH — the copy the methodology page renders.
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * ★ WHAT THIS FILE IS NOW, AND WHAT IT USED TO BE.
 *
 * It used to hold a nine-pillar "InvestIQ" model (Fundamentals / Technical / Institutional;
 * Profitability · Growth · Stability · Efficiency · Valuation · Momentum · Trend · Activity ·
 * Sentiment) with invented per-pillar weights and fourteen hand-typed stock rows. None of it was
 * the live engine. It was the reason the AI context layer spent tokens disowning our own page.
 *
 * The live engine has FOUR pillars. This file now describes THOSE, and nothing else. The ONLY
 * numbers left in it are the band cuts, re-exported from lib/format so they cannot drift — and
 * those label a score a reader already sees rather than revealing how it was built. There is no
 * worked-example data here at all: the page FETCHES it.
 *
 * ── THE ONE RULE FOR EDITING THIS FILE ────────────────────────────────────────────────────────
 * MECHANISM IN, CALIBRATION OUT. This file may say WHAT a pillar measures, HOW the pieces combine,
 * and WHAT happens when something is missing. It must NEVER carry:
 *   · a metric bar / cut value, or anything a bar could be derived from
 *   · a PILLAR WEIGHT or a per-metric weight — see the note below
 *   · a native-zone bound, a peer formula, or a finding's firing threshold
 * Ground truth for everything here is the BACKEND: scoring/composite/weights.ts (the four weights),
 * scoring/composite/label.ts (the bands), scoring/pillars/assemble.ts (the floor + neutral-hold),
 * scoring/lenses (the three lenses). If this file and the engine disagree, the engine is right and
 * this file is a bug.
 *
 * ── ★ WEIGHTS: THE ORDER SHIPS, THE NUMBERS DO NOT. (Operator ruling, reversing an earlier one.) ──
 * A previous version of this file carried `weight: 35 / 25 / 20 / 20` and the methodology page
 * printed them. That is reversed: no numeric pillar weight appears on any reader-facing surface.
 *
 * ⚠ BUT THE ORDERING STAYS, AND REMOVING IT WOULD BE ITS OWN LIE. Four pillars listed with nothing
 * said about their relative pull reads as four EQUAL pillars, which is false in a second direction
 * — and worse than the first, because it is the reading a reader arrives at unprompted. So
 * `rank` + `pull` below say Foundation carries the most, then Momentum, then Market and Ownership
 * equally. That is true, it is already inferable from the product, and it teaches something real.
 *
 * The rank is ORDINAL ONLY. Never re-introduce a number, a percentage, a bar width proportional to
 * a weight, or a per-pillar contribution — a contribution divided by its subtotal IS the weight.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

import { Icons, type Icon } from "@/lib/icons";
import { HEALTH_BAND_CUTS, type HealthBand } from "@/lib/format";
import type { PillarKey } from "@/types/health";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE FOUR PILLARS. Order mirrors PILLAR_WEIGHTS in Vytal-Backend/src/scoring/composite/weights.ts
// (universally locked, never per-peer-group, never fitted). ★ The ORDER is mirrored; the VALUES are
// not carried here at all — see the weights note in the file header.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

export interface PillarDoc {
  key: PillarKey;
  label: string;
  /** 1 = heaviest. Ordinal ONLY — two pillars may share a rank. Never a number a weight
   *  could be read off; `pull` is the words a reader actually sees. */
  rank: number;
  /** How this pillar's weight is described in prose. No magnitudes, no proportions. */
  pull: string;
  icon: Icon;
  /** The question the pillar answers, in a reader's words. */
  asks: string;
  /** What it actually reads. No thresholds, no weights — the things, not the cuts. */
  reads: string;
  /** The misreading this pillar attracts, closed off explicitly. */
  notThis: string;
}

export const PILLAR_DOCS: PillarDoc[] = [
  {
    key: "foundation",
    label: "Foundation",
    rank: 1,
    pull: "Carries the most weight",
    icon: Icons.shield,
    asks: "Is this a fundamentally strong business?",
    reads:
      "How profitably the company turns capital into earnings, how solid the balance sheet is, and how much of its profit arrives as actual cash. For a bank or lender it reads the equivalents instead — how much capital cushions the loan book, and how many loans go bad.",
    notThis:
      "It is not a view on the share price, and not a growth forecast. It describes the business as it stands.",
  },
  {
    key: "momentum",
    label: "Momentum",
    rank: 2,
    pull: "Second-heaviest",
    icon: Icons.trendUp,
    asks: "Which way are those fundamentals travelling?",
    reads:
      "The trajectory of earnings, revenue and margins — growing and steady, or slipping and choppy — read on trailing twelve-month figures so a single odd quarter doesn't set the tone.",
    notThis:
      "This is fundamental momentum, not price momentum. It never looks at the share price, and it is not an RSI or MACD signal. A stock can rise while Momentum falls.",
  },
  {
    key: "market",
    label: "Market",
    rank: 3,
    pull: "Lightest, equal with Ownership",
    icon: Icons.chartLine,
    asks: "What has the share price been doing?",
    reads:
      "The only pillar that reads price, purely as price behaviour: where the price sits inside its own range, its trend, how it has done against its sector peers, and how volatile it has been relative to that sector.",
    notThis:
      "Backward-looking by construction. A strong Market pillar is current technical strength, never a signal about what happens next.",
  },
  {
    key: "ownership",
    label: "Ownership",
    rank: 3,
    pull: "Lightest, equal with Market",
    icon: Icons.building,
    asks: "Who owns the company, and how is that shifting?",
    reads:
      "Promoter commitment and any pledging of their shares as loan collateral, institutional participation, and insider and bulk-deal activity across filed disclosures.",
    notThis:
      "Ownership records what owners did, not what they know. Insiders are not always right and their reasons are not visible.",
  },
];

/** The ordering, as one sentence — the single place it is worded, so the page and any future
 *  surface say it the same way. Ordinal, never numeric. */
export const PILLAR_ORDER_NOTE =
  "Foundation carries the most weight, then Momentum, then Market and Ownership equally. The exact split is not published.";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE FIVE BANDS — ranges DERIVED from lib/format's HEALTH_BAND_CUTS, never re-typed. The labels
// and the reader-facing sentence live here; the numbers come from the classifier itself.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

export interface BandDoc {
  band: HealthBand;
  label: string;
  /** "62 – 68" / "74 and above" / "below 55" — built from the cuts, not typed. */
  range: string;
  meaning: string;
}

const BAND_COPY: Record<HealthBand, { label: string; meaning: string }> = {
  pristine: {
    label: "Pristine",
    meaning:
      "Sound on every reading we take. Little left for the numbers to reveal — which usually means the market has already noticed.",
  },
  healthy: {
    label: "Healthy",
    meaning: "Sound overall, with no reading pulling hard against the rest.",
  },
  steady: {
    label: "Steady",
    meaning: "Holding together, with something in the mix worth understanding before you rely on it.",
  },
  below: {
    label: "Below par",
    meaning: "More than one reading is weak. The company is under real strain somewhere.",
  },
  fragile: {
    label: "Fragile",
    meaning: "Weak across the readings that matter most. Treat everything here as needing a hard look.",
  },
};

/** Bands strongest→weakest, with ranges computed from the live cut table. */
export const BAND_DOCS: BandDoc[] = HEALTH_BAND_CUTS.map((cut, i) => {
  const upper = i === 0 ? null : HEALTH_BAND_CUTS[i - 1].min;
  const lower = Number.isFinite(cut.min) ? cut.min : null;
  const range =
    upper === null ? `${lower} and above` : lower === null ? `below ${upper}` : `${lower} – ${upper}`;
  return { band: cut.band, range, ...BAND_COPY[cut.band] };
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE WORKED EXAMPLE — a SYMBOL, not data. The page fetches this stock's real snapshot and renders
// whatever comes back. Nothing about it is authored here: not the score, not the band, not the
// pillar values, not the metric list.
//
// ★ WHY A FIXED SYMBOL AND NOT A ROTATING ONE: a page whose example changes under the reader can't
// be checked, and a screenshot of it can't be trusted. Fixed and live is the only combination that
// is both stable and true.
//
// ★ WHY THIS ONE: MARUTI sits mid-ladder (Steady, mid-band — not hugging a cut), is a non-financial
// so its metric set is the one most readers will meet, and carries a COMPLETE decomposition (all
// four pillars genuinely scored, every Foundation and Momentum metric scored). A top-of-ladder
// example teaches the top of the ladder; this one teaches the ladder. If it ever stops being
// scored the page says so plainly rather than inventing a stand-in — see the unscored state.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
export const WORKED_EXAMPLE_SYMBOL = "MARUTI";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE SECOND LAYER — mechanism, published. Each entry is something the engine genuinely does that
// changes how a score should be read. None of them names a threshold.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

export interface MechanismDoc {
  id: string;
  title: string;
  icon: Icon;
  body: string;
}

export const MECHANISM_DOCS: MechanismDoc[] = [
  {
    id: "lenses",
    title: "Every metric is read three ways at once",
    icon: Icons.compass,
    body:
      "Each Foundation and Momentum metric is scored against a fixed bar (is this good in absolute terms?), against the company's peer group (is it good versus the only fair comparison set?), and against the company's own history (is it improving, flat or declining?). When the three agree, the metric is simply strong or weak. The information is in their disagreement: below the bar but above peers says the whole field is weak on that metric — a verdict about the pond, not the fish. Above the bar but below peers says the company is fine and its peers are exceptional. We separate those two readings rather than averaging them away.",
  },
  {
    id: "peer-relative",
    title: "Comparisons are made inside a peer group",
    icon: Icons.building,
    body:
      "A metric is judged against references fitted to the company's own peer group, not the whole market. That is what lets a Health Score of 80 in pharma mean the same soundness as an 80 in metals — the scores are built to be comparable across sectors. Where a peer group is too small or too uniform to give a usable cross-section, the peer reading is reported as unavailable rather than computed anyway.",
  },
  {
    id: "redistribution",
    title: "A missing pillar is removed, not zeroed",
    icon: Icons.scales,
    body:
      "When a pillar cannot be scored — no price history for Market, say — it is taken out of the blend entirely and the remaining pillars' weights are rescaled to sum to 100%, keeping their proportions to each other. It is never scored as zero, because a zero would be a claim we have not earned. The applied weights are stored with every snapshot, so a past score always reproduces.",
  },
  {
    id: "floor",
    title: "A thin pillar is dropped rather than guessed",
    icon: Icons.warningTriangle,
    body:
      "A pillar only scores if enough of its metrics are actually present. Below that floor the whole pillar is excluded and redistribution takes over. And a composite only exists if Foundation is present and at least two pillars survive: a 'health score' with no fundamentals is not one, and a single pillar renormalised to 100% is that pillar wearing a different name. Below either condition the stock is recorded as unscored — a real, informative state, not a gap.",
  },
  {
    id: "neutral-hold",
    title: "Some metrics are held neutral instead of dropped",
    icon: Icons.pause,
    body:
      "A handful of metrics — a bank's supplementary disclosures, for instance — are not always filed. Dropping one would quietly hand its weight to whatever else happened to be present, which changes the score for a reason that has nothing to do with the company. Those metrics are instead held at a neutral value and kept in the pillar at their normal weight, so an absent disclosure neither rewards nor punishes.",
  },
  {
    id: "refresh",
    title: "The score moves when the company files",
    icon: Icons.refresh,
    body:
      "Foundation, Momentum and Ownership are re-read when new results and shareholding disclosures land — quarterly, for most companies. Market re-reads on price and moves in between. Each snapshot is stored whole, with the weights and band mapping that produced it, so history is never rewritten by a later change to the model.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ⚠ THE INTERPRETIVE BOUNDARY — rendered at the foot of the page.
//
// ★ THIS LINE NEEDS THE OPERATOR'S LEGAL SIGN-OFF BEFORE IT IS RELIED ON. Today this posture is
// enforced in code for the CHATBOT only (the non-advisory spine + the price-target guardrail). It
// has never been stated as a PRODUCT disclaimer. Publishing it here is a new claim about what the
// product is, and it is not an engineering decision. Do not reword it to sound stronger or softer
// without that sign-off.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
export const NOT_ADVICE_NOTE =
  "A Health Score describes how sound a company looks right now, on filed disclosures and price history. It is not investment advice, not a recommendation, and not a price target — nothing here predicts what a share price will do. Vytal is an analysis tool; what you do with it is your decision.";
