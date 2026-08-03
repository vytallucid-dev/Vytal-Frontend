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

  /** The COMPUTED Quarter in Brief verdict label for THIS period ("Grew, margins thinner").
   *
   *  ⚠ NOT model output, and not a headline. The backend derives it from the quarter's own figures
   *  and stores it beside the prose; the model never sees it, so it cannot be restated or softened.
   *
   *  Null covers three things that are one thing to a reader — no brief written, a brief hidden
   *  because a correction moved its inputs, or a brief whose figures supported no verdict (MMTC has
   *  prose and no verdict). All three render as no badge, never as an empty one. */
  quarterBriefVerdict: string | null;
}

export interface UpcomingResultItem {
  symbol: string;
  name: string;
  sector: string | null;
  eventDate: string; // YYYY-MM-DD
  isConfirmed: boolean;
  description: string | null;
}

/** Which half of the feed a request pages over — one request, one half, one cursor. */
export type ResultsFeedKind = "reported" | "upcoming";

/** One PAGE of one half. `cursor` is opaque: hand it back verbatim for the next page.
 *  `total` counts the whole set matching the query's filters, NOT the page. */
export interface ResultsFeedPage<T> {
  feed: ResultsFeedKind;
  items: T[];
  total: number;
  cursor: string | null; // null once the feed is exhausted
  hasMore: boolean;
}

export interface ResultsFeedResponse<T> {
  success: boolean;
  data: ResultsFeedPage<T>;
}

/** Whole-feed context for the landing header — deliberately NOT part of a page, so the
 *  stats and chip counts don't shift as the reader scrolls or searches. */
export interface ResultsOverview {
  counts: {
    reported: number;
    reportedThisWeek: number;
    scored: number;
    upcoming: number;
  };
  averages: {
    revenueYoy: number | null; // % — mean across results that report it, nulls excluded
    profitYoy: number | null; // %
  };
  topGrowers: ReportedResultItem[]; // highest net-profit YoY first
}

export interface ResultsOverviewResponse {
  success: boolean;
  data: ResultsOverview;
}

/** Feed filters. `days` / `scored` apply to the reported half; `upcomingDays` to the other. */
export interface ResultsFeedParams {
  q?: string;
  days?: number;
  scored?: boolean;
  upcomingDays?: number;
  limit?: number;
  enabled?: boolean;
}
