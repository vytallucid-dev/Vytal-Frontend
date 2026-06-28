/**
 * Types for the Disclosures & Announcements tab — the real StockNews row as returned
 * by GET /api/v1/news/:symbol (the `/api/v1/*` envelope: `{ success, data }`).
 *
 * Two genuine streams share one row shape, distinguished by `sourceType`:
 *   • "nse_announcement" — official NSE regulatory filings. `headline` is a raw
 *     filing-type BUCKET ("Updates", "ESOP/ESOS/ESPS"); the real "what happened"
 *     lives in `summary`. Has `pdfUrl`.
 *   • "google_news" — press coverage. `headline` is the real article title;
 *     `category` is the publication name; has `externalUrl`.
 *
 * Every field is the schema's real field — null AI fields (`sentiment`) and
 * not-yet-extracted content are surfaced honestly, never fabricated.
 */

export type NewsSourceType = "nse_announcement" | "google_news";

/** Extraction lifecycle — only "extracted" rows have full text available. */
export type ExtractionStatus =
  | "not_applicable"
  | "pending"
  | "extracted"
  | "failed"
  | "skipped";

/** A single StockNews row (list view — `contentText` omitted unless withContent). */
export interface StockNewsItem {
  id: string;
  sourceType: NewsSourceType;
  /** NSE: raw filing-type bucket. Google: real article title. */
  headline: string;
  /** NSE: the real filing excerpt (hero field). Google: RSS snippet. May be null. */
  summary: string | null;
  contentText?: string | null;
  contentSource: string | null;
  contentTokens: number | null;
  /** NSE: official NSE category (often null). Google: publication name. */
  category: string | null;
  subcategory: string | null;
  /** NSE: direct PDF attachment link. */
  pdfUrl: string | null;
  /** Google: article URL (may be paywalled). */
  externalUrl: string | null;
  isHighImpact: boolean;
  extractionStatus: ExtractionStatus;
  /** ISO timestamp. */
  publishedAt: string;
}

export interface NewsPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Body of GET /api/v1/news/:symbol — the `{ success, data }` envelope. */
export interface StockNewsResponse {
  success: boolean;
  data: {
    symbol: string;
    name: string;
    news: StockNewsItem[];
    pagination: NewsPagination;
  };
}

/** Query params accepted by the endpoint (mirrors backend NewsQuerySchema). */
export interface StockNewsParams {
  /** Which stream. "all" returns both. */
  type?: "all" | NewsSourceType;
  /** Lookback window in days (1–365, backend default 90). */
  days?: number;
  /** Page size (1–50, backend default 20). */
  limit?: number;
  page?: number;
  /** Filter to high-impact rows only. */
  highImpact?: boolean;
}
