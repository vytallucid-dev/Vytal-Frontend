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
  preClose: number | null;
  tradingDaysSinceFiling: number;
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

export interface ViewerAi {
  available: boolean;
  headline: string | null;
  content: string | null;
  keyPoints: string[] | null;
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
