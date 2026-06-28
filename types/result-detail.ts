// Types for the per-result viewer — GET /api/v1/results/:symbol[?period=FY26Q4]
// (v1 { success, data } envelope). Mirrors the backend read-model
// (src/scoring/read/result-detail.types.ts). Money ₹ Cr; growth/margins PERCENT.
// Every block honest-empties independently; nothing here is an estimate or a verdict.

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
}

export interface ResultDetailResponse {
  success: boolean;
  data: ResultDetailData;
}
