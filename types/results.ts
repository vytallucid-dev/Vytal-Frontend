// Types for the Results landing feed — GET /api/v1/results (v1 { success, data } envelope).
// Mirrors the backend read-model (src/scoring/read/results-list.types.ts). Every value
// is real or honest-null; money is ₹ Crore, growth/margin are PERCENT. NO market
// reaction, NO estimate-relative "beat/miss" — those are absent from the data.

export interface ReportedResultItem {
  symbol: string;
  name: string;
  sector: string | null;
  industryType: string;

  quarter: string;
  fiscalYear: string;
  periodLabel: string; // "Q2 FY26"
  reportDate: string; // YYYY-MM-DD
  filingDate: string; // YYYY-MM-DD
  resultType: string; // "consolidated" | "standalone"

  revenue: number | null; // ₹ Cr
  revenueLabel: string; // "Revenue" | "Net interest income" | "Net premium" | …
  revenueYoy: number | null; // %
  revenueQoq: number | null; // %

  netProfit: number | null; // ₹ Cr
  profitYoy: number | null; // %
  profitQoq: number | null; // %

  margin: number | null; // %
  marginLabel: string; // "Op margin" | "Net margin"
  netMargin: number | null; // %

  xbrlUrl: string;

  healthScore: number | null; // composite (0–100) when scored, else null
  aiHeadline: string | null; // real earnings_analysis headline when present, else null
}

export interface UpcomingResultItem {
  symbol: string;
  name: string;
  sector: string | null;
  eventDate: string; // YYYY-MM-DD
  isConfirmed: boolean;
  description: string | null;
}

export interface ResultsListData {
  reported: ReportedResultItem[];
  upcoming: UpcomingResultItem[];
  counts: {
    reported: number;
    upcoming: number;
    reportedThisWeek: number;
  };
}

export interface ResultsListResponse {
  success: boolean;
  data: ResultsListData;
}

export interface ResultsListParams {
  filter?: "reported" | "upcoming" | "all";
  days?: number;
  upcomingDays?: number;
  limit?: number;
}
