// Types for the per-result viewer — GET /api/v1/results/:symbol[?period=FY26Q4]
// (v1 { success, data } envelope). Mirrors the backend read-model
// (src/scoring/read/result-detail.types.ts). Money ₹ Cr; growth/margins PERCENT.
// Every block honest-empties independently; nothing here is an estimate or a verdict.

import type { FindingsSection, LabelBand } from "./health";

export interface ViewerQuarter {
  periodKey: string;
  quarter: string;
  fiscalYear: string;
  reportDate: string;
  filingDate: string;
  resultType: string;
  xbrlUrl: string;

  revenue: number | null;
  revenueLabel: string;
  revenueYoy: number | null;
  revenueQoq: number | null;

  operatingProfit: number | null; // non-financial only
  profitBeforeTax: number | null;
  tax: number | null;
  netProfit: number | null;
  profitYoy: number | null;
  profitQoq: number | null;

  operatingMargin: number | null; // non-financial only
  netMargin: number | null;
  margin: number | null;
  marginLabel: string;
}

export interface ReactionPoint {
  date: string;
  close: number;
  /** ⚠ SERVED BUT UNREAD, and it cannot do the job it looks like it does — it is an exact
   *  date match, so it is `false` on EVERY point of a weekend or holiday filing, which is
   *  precisely the case a filing-day flag would be reached for. The marker positions off
   *  `filingDate` against a time axis instead. See the note in SnapshotTab. */
  isFilingDay: boolean;
}

export type ReactionState = "complete" | "forming" | "unavailable";

export interface MarketReaction {
  reactionState: ReactionState;
  available: boolean;
  filingDate: string;
  windowFrom: string;
  windowTo: string;
  points: ReactionPoint[];
  /** Last close STRICTLY BEFORE filingDate — never the filing day's own. */
  preClose: number | null;
  /** Closes strictly after filingDate. 0 ⇔ a forming window that has not opened yet. */
  tradingDaysSinceFiling: number;
  /** Window length in trading days, derived server-side from the served window. Approximate
   *  (holidays unmodelled) — always render it prefixed "~". */
  expectedTradingDays: number;
}

export interface ViewerNews {
  id: string;
  headline: string;
  summary: string | null;
  source: string;
  category: string | null;
  publishedAt: string;
  url: string | null;
  pdfUrl: string | null;
  sentiment: string | null;
}

/** The stored Quarter in Brief for the VIEWED period. Mirrors the backend read-model exactly
 *  (src/scoring/read/result-detail.types.ts).
 *
 *  `available:false` covers three states that are all one thing to a reader: never generated,
 *  generation refused, or hidden because a correction moved the figures it was written from. A brief
 *  is whole or absent — there is no partial one. */
export interface ViewerAi {
  available: boolean;
  /** The prose, under a fixed set of headings. The ONLY model-written field here. */
  content: string | null;
  /** The COMPUTED verdict — rendered as a badge, never written by the model.
   *  Null with `available:true` is a real state: prose that supported no verdict. */
  verdictKey: string | null;
  verdictLabel: string | null;
  /** ★ PINNED. The as-of date of the health snapshot the brief's health section was written from,
   *  or null when the stock carried no score at generation time.
   *
   *  It must be rendered ADJACENT TO THE SCORE the brief quotes. The health score is recalculated on
   *  ordinary trading days, so the Health tab and this brief can legitimately show different figures
   *  for the same quarter — DIXON moved 65.1 → 65.0 in hours with no filing. This date is the only
   *  thing that makes that difference legible rather than a contradiction. */
  scoredAsOf: string | null;
  modelVersion: string | null;
  generatedAt: string | null;
}

export interface ViewerCorpEvent {
  eventType: string;
  eventDate: string;
  description: string | null;
  dividendAmount: number | null;
  dividendType: string | null;
  exDate: string | null;
  recordDate: string | null;
}

export interface ViewerPeer {
  symbol: string;
  name: string;
  revenueYoy: number | null;
  profitYoy: number | null;
  margin: number | null;
  marginLabel: string;
  filed: boolean;
}

export interface PeriodRef {
  periodKey: string;
  quarter: string;
  fiscalYear: string;
}

/** Scoring context for the viewed result. composite/band are FOR THE VIEWED PERIOD (from the
 *  trajectory series), not the latest snapshot. compositeShift is a whole-snapshot move from the
 *  prior in-force period — frame it as "composite moved ±X from {priorPeriodKey}", NOT caused by
 *  this result. findings are the engine's CURRENT set (latest snapshot); they describe the viewed
 *  result only when latestPeriodKey === the viewed period. All honest-empty (null) when unscored. */
export interface ResultHealthBlock {
  scored: boolean;
  latestPeriodKey: string | null;
  periodComposite: number | null;
  periodBand: LabelBand | null;
  compositeShift: { delta: number; priorPeriodKey: string } | null;
  findings: FindingsSection | null;
}

/** Family tag for the annual block. */
export type ResultFamily =
  | "non_financial"
  | "banking"
  | "nbfc"
  | "life_insurance"
  | "general_insurance";

/** One labeled annual line. value is ₹ Cr (unit "cr") or ₹ per-share (unit "rupees"). null when
 *  the line is undisclosed in the filing — an honest "—". */
export interface AnnualLine {
  key: string;
  label: string;
  value: number | null;
  unit: "cr" | "rupees";
}

/** Annual (full-year) CF + BS-headline for the viewed result — family-appropriate. Present only
 *  when annualState === "available". `cashFlow` is null for insurers (their annual carries no
 *  cash-flow statement — render "n/a for insurers", not an empty box). Per-line nulls → "—". */
export interface AnnualResultBlock {
  family: ResultFamily;
  fiscalYear: string;
  balanceSheet: AnnualLine[];
  cashFlow: AnnualLine[] | null;
  perShare: AnnualLine[];
}

/** available — block present (the family's annual FY matches this result); not_filed — no annual
 *  row matches this result's FY yet (older quarter, or year-end annual not on file). */
export type AnnualResultState = "available" | "not_filed";

export interface ResultDetailData {
  symbol: string;
  name: string;
  sector: string | null;
  industryType: string;
  basis: string;

  current: ViewerQuarter;
  prevQuarter: ViewerQuarter | null;
  sameQuarterLastYear: ViewerQuarter | null;
  spine: ViewerQuarter[];
  periodsAvailable: PeriodRef[];

  marketReaction: MarketReaction;
  news: ViewerNews[];
  ai: ViewerAi;
  corporateEvents: ViewerCorpEvent[];
  peers: ViewerPeer[];
  peerGroupName: string | null;

  health: ResultHealthBlock | null;
  annual: AnnualResultBlock | null;
  annualState: AnnualResultState;
}

export interface ResultDetailResponse {
  success: boolean;
  data: ResultDetailData;
}
