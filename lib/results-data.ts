// Sector-agnostic schema for the Quarterly Results Viewer
// All monetary values in ₹ Crore unless noted

// ─── Domain Types ───────────────────────────────────────────────────────────

export interface QuarterlyResultRow {
  id: string;
  stockId: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  fiscalYear: string; // e.g. "FY26"
  reportDate: string; // period end date (ISO)
  filingDate: string; // date filed with NSE (ISO)
  resultType: "consolidated" | "standalone";
  xbrlUrl: string;

  // P&L (₹ Cr) — null if not disclosed
  revenue: number;
  expenses: number;
  operatingProfit: number;
  otherIncome: number;
  depreciation: number;
  interest: number;
  profitBeforeTax: number;
  tax: number;
  netProfit: number;

  // Margins (%)
  operatingMargin: number;
  netMargin: number;

  // Growth (%) vs prior periods — null for first-ever quarter
  revenueQoq: number | null;
  revenueYoy: number | null;
  profitQoq: number | null;
  profitYoy: number | null;
}

export interface Fundamental {
  stockId: string;
  fiscalYear: string;
  roe: number; // %
  roce: number; // %
  netMarginAnnual: number; // %
  debtToEquity: number;
  eps: number; // ₹
  bookValuePerShare: number; // ₹
  pe: number; // TTM
  dividendYield: number; // %
}

export interface DailyPrice {
  stockId: string;
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockNews {
  id: string;
  stockId: string;
  headline: string;
  summary: string;
  source: string;
  category: string; // "NSE Announcement" | "Economic Times" | "Mint" | etc.
  publishedAt: string; // ISO date
  externalUrl: string;
  pdfUrl?: string;
  sentiment?: "positive" | "negative" | "neutral";
}

export interface AiSummary {
  id: string;
  stockId: string;
  summaryType: "earnings_analysis" | "annual_review" | "news_brief";
  headline: string;
  content: string;
  keyPoints: {
    positives: string[];
    concerns: string[];
  };
  qoqAnalysis: string;
  bottomLine: string;
  modelVersion: string;
  generatedAt: string; // ISO
}

export interface CorporateEvent {
  id: string;
  stockId: string;
  eventType: "dividend" | "bonus" | "split" | "agm" | "egm" | "rights" | "buyback";
  eventDate: string; // ISO
  description: string;
  value?: number; // e.g., dividend per share
  exDate?: string;
  recordDate?: string;
}

export interface PeerResult {
  ticker: string;
  companyName: string;
  revenueYoy: number | null; // %
  profitYoy: number | null; // %
  operatingMargin: number | null; // %
  filingDate: string | null;
  filed: boolean;
}

// ─── Aggregate Page Data ────────────────────────────────────────────────────

export interface ResultsPageData {
  stock: {
    stockId: string;
    companyName: string;
    ticker: string;
    sector: string;
    subSector?: string;
  };

  current: QuarterlyResultRow;
  prevQuarter: QuarterlyResultRow | null; // QoQ base
  sameQuarterLastYear: QuarterlyResultRow | null; // YoY base
  trend: QuarterlyResultRow[]; // 8 quarters, chronological, latest last

  // Quarter navigator
  prevQuarterNav: { quarter: string; fiscalYear: string } | null;
  nextQuarterNav: { quarter: string; fiscalYear: string } | null;

  // Context
  fundamental: Fundamental | null;
  priceHistory: DailyPrice[]; // T-2 to T+12 around filingDate
  news: StockNews[]; // within filingDate ± 3 days
  aiSummary: AiSummary | null;
  corporateEvents: CorporateEvent[];
  peers: PeerResult[];
  peerGroupName: string | null;
}

// ─── Mock Data — HDFC Bank Q2 FY26 ─────────────────────────────────────────

const STOCK_ID = "hdfcbank";

// 8-quarter trend rows (Q3 FY24 → Q2 FY26), chronological
const trendRows: QuarterlyResultRow[] = [
  {
    id: "q3-fy24",
    stockId: STOCK_ID,
    quarter: "Q3",
    fiscalYear: "FY24",
    reportDate: "2023-12-31",
    filingDate: "2024-01-18",
    resultType: "consolidated",
    xbrlUrl: "https://nsearchives.nseindia.com/corporate/xbrl/hdfcbank-q3fy24.xml",
    revenue: 56000,
    expenses: 37520,
    operatingProfit: 18480,
    otherIncome: 1000,
    depreciation: 780,
    interest: 1800,
    profitBeforeTax: 16900,
    tax: 4076,
    netProfit: 12824,
    operatingMargin: 33.0,
    netMargin: 22.9,
    revenueQoq: 2.8,
    revenueYoy: 11.5,
    profitQoq: 3.1,
    profitYoy: 13.2,
  },
  {
    id: "q4-fy24",
    stockId: STOCK_ID,
    quarter: "Q4",
    fiscalYear: "FY24",
    reportDate: "2024-03-31",
    filingDate: "2024-04-20",
    resultType: "consolidated",
    xbrlUrl: "https://nsearchives.nseindia.com/corporate/xbrl/hdfcbank-q4fy24.xml",
    revenue: 57500,
    expenses: 38295,
    operatingProfit: 19205,
    otherIncome: 1050,
    depreciation: 800,
    interest: 1900,
    profitBeforeTax: 17555,
    tax: 4330,
    netProfit: 13225,
    operatingMargin: 33.4,
    netMargin: 23.0,
    revenueQoq: 2.7,
    revenueYoy: 12.1,
    profitQoq: 3.1,
    profitYoy: 13.8,
  },
  {
    id: "q1-fy25",
    stockId: STOCK_ID,
    quarter: "Q1",
    fiscalYear: "FY25",
    reportDate: "2024-06-30",
    filingDate: "2024-07-19",
    resultType: "consolidated",
    xbrlUrl: "https://nsearchives.nseindia.com/corporate/xbrl/hdfcbank-q1fy25.xml",
    revenue: 57800,
    expenses: 38320,
    operatingProfit: 19480,
    otherIncome: 1100,
    depreciation: 830,
    interest: 1950,
    profitBeforeTax: 17800,
    tax: 4410,
    netProfit: 13390,
    operatingMargin: 33.7,
    netMargin: 23.2,
    revenueQoq: 0.5,
    revenueYoy: 10.2,
    profitQoq: 1.3,
    profitYoy: 11.4,
  },
  {
    id: "q2-fy25",
    stockId: STOCK_ID,
    quarter: "Q2",
    fiscalYear: "FY25",
    reportDate: "2024-09-30",
    filingDate: "2024-10-19",
    resultType: "consolidated",
    xbrlUrl: "https://nsearchives.nseindia.com/corporate/xbrl/hdfcbank-q2fy25.xml",
    revenue: 59920,
    expenses: 39560,
    operatingProfit: 20360,
    otherIncome: 1180,
    depreciation: 880,
    interest: 1980,
    profitBeforeTax: 18680,
    tax: 4400,
    netProfit: 14280,
    operatingMargin: 34.0,
    netMargin: 23.8,
    revenueQoq: 3.7,
    revenueYoy: 12.3,
    profitQoq: 6.8,
    profitYoy: 14.6,
  },
  {
    id: "q3-fy25",
    stockId: STOCK_ID,
    quarter: "Q3",
    fiscalYear: "FY25",
    reportDate: "2024-12-31",
    filingDate: "2025-01-18",
    resultType: "consolidated",
    xbrlUrl: "https://nsearchives.nseindia.com/corporate/xbrl/hdfcbank-q3fy25.xml",
    revenue: 62000,
    expenses: 40800,
    operatingProfit: 21200,
    otherIncome: 1280,
    depreciation: 895,
    interest: 2050,
    profitBeforeTax: 19535,
    tax: 4717,
    netProfit: 14818,
    operatingMargin: 34.2,
    netMargin: 23.9,
    revenueQoq: 3.5,
    revenueYoy: 10.7,
    profitQoq: 3.8,
    profitYoy: 15.5,
  },
  {
    id: "q4-fy25",
    stockId: STOCK_ID,
    quarter: "Q4",
    fiscalYear: "FY25",
    reportDate: "2025-03-31",
    filingDate: "2025-04-19",
    resultType: "consolidated",
    xbrlUrl: "https://nsearchives.nseindia.com/corporate/xbrl/hdfcbank-q4fy25.xml",
    revenue: 63800,
    expenses: 41789,
    operatingProfit: 22011,
    otherIncome: 1350,
    depreciation: 905,
    interest: 2120,
    profitBeforeTax: 20336,
    tax: 4962,
    netProfit: 15374,
    operatingMargin: 34.5,
    netMargin: 24.1,
    revenueQoq: 2.9,
    revenueYoy: 10.9,
    profitQoq: 3.7,
    profitYoy: 16.3,
  },
  {
    id: "q1-fy26",
    stockId: STOCK_ID,
    quarter: "Q1",
    fiscalYear: "FY26",
    reportDate: "2025-06-30",
    filingDate: "2025-07-19",
    resultType: "consolidated",
    xbrlUrl: "https://nsearchives.nseindia.com/corporate/xbrl/hdfcbank-q1fy26.xml",
    revenue: 66180,
    expenses: 43510,
    operatingProfit: 22670,
    otherIncome: 1210,
    depreciation: 910,
    interest: 2090,
    profitBeforeTax: 20880,
    tax: 4810,
    netProfit: 16070,
    operatingMargin: 34.3,
    netMargin: 24.3,
    revenueQoq: 3.7,
    revenueYoy: 14.5,
    profitQoq: 4.5,
    profitYoy: 20.0,
  },
  {
    id: "q2-fy26",
    stockId: STOCK_ID,
    quarter: "Q2",
    fiscalYear: "FY26",
    reportDate: "2025-09-30",
    filingDate: "2025-10-17",
    resultType: "consolidated",
    xbrlUrl: "https://nsearchives.nseindia.com/corporate/xbrl/hdfcbank-q2fy26.xml",
    revenue: 68420,
    expenses: 44240,
    operatingProfit: 24180,
    otherIncome: 1420,
    depreciation: 920,
    interest: 2180,
    profitBeforeTax: 22500,
    tax: 5680,
    netProfit: 16820,
    operatingMargin: 35.3,
    netMargin: 24.6,
    revenueQoq: 3.4,
    revenueYoy: 14.2,
    profitQoq: 4.7,
    profitYoy: 17.8,
  },
];

const fundamental: Fundamental = {
  stockId: STOCK_ID,
  fiscalYear: "FY25",
  roe: 17.2,
  roce: 16.8,
  netMarginAnnual: 24.5,
  debtToEquity: 0.35,
  eps: 68.4,
  bookValuePerShare: 485,
  pe: 18.5,
  dividendYield: 1.2,
};

// Price history around filing date Oct 17, 2025 (after-market)
// T-2=Oct 15, T-1=Oct 16, T+0=Oct 17 (filing day, price unchanged),
// T+1=Oct 18, ..., T+10=Oct 31 (approx, skipping weekends)
const priceHistory: DailyPrice[] = [
  { stockId: STOCK_ID, date: "2025-10-13", open: 1798, high: 1812, low: 1792, close: 1803, volume: 12500000 },
  { stockId: STOCK_ID, date: "2025-10-14", open: 1803, high: 1815, low: 1798, close: 1808, volume: 11800000 },
  { stockId: STOCK_ID, date: "2025-10-15", open: 1808, high: 1820, low: 1804, close: 1805, volume: 13200000 },
  { stockId: STOCK_ID, date: "2025-10-16", open: 1805, high: 1818, low: 1802, close: 1810, volume: 12100000 },
  { stockId: STOCK_ID, date: "2025-10-17", open: 1810, high: 1825, low: 1808, close: 1812, volume: 14500000 }, // Filing day
  { stockId: STOCK_ID, date: "2025-10-18", open: 1830, high: 1865, low: 1828, close: 1852, volume: 28900000 }, // T+1 reaction
  { stockId: STOCK_ID, date: "2025-10-21", open: 1852, high: 1872, low: 1848, close: 1865, volume: 18200000 },
  { stockId: STOCK_ID, date: "2025-10-22", open: 1865, high: 1878, low: 1860, close: 1872, volume: 15600000 },
  { stockId: STOCK_ID, date: "2025-10-23", open: 1872, high: 1888, low: 1868, close: 1880, volume: 14800000 },
  { stockId: STOCK_ID, date: "2025-10-24", open: 1880, high: 1900, low: 1875, close: 1894, volume: 16400000 }, // T+5
  { stockId: STOCK_ID, date: "2025-10-27", open: 1894, high: 1902, low: 1885, close: 1897, volume: 13200000 },
  { stockId: STOCK_ID, date: "2025-10-28", open: 1897, high: 1908, low: 1892, close: 1899, volume: 12800000 },
  { stockId: STOCK_ID, date: "2025-10-29", open: 1899, high: 1910, low: 1895, close: 1901, volume: 11900000 },
  { stockId: STOCK_ID, date: "2025-10-30", open: 1901, high: 1912, low: 1897, close: 1900, volume: 11400000 },
  { stockId: STOCK_ID, date: "2025-10-31", open: 1900, high: 1915, low: 1896, close: 1902, volume: 12100000 }, // T+10
];

const news: StockNews[] = [
  {
    id: "n1",
    stockId: STOCK_ID,
    headline: "HDFC Bank declares Q2 FY26 results — net profit rises 17.8% YoY",
    summary:
      "HDFC Bank reported net profit of ₹16,820 Cr for Q2 FY26, up 17.8% year-on-year. Revenue grew 14.2% to ₹68,420 Cr. Operating margin expanded 130 bps to 35.3%.",
    source: "NSE Announcement",
    category: "NSE Announcement",
    publishedAt: "2025-10-17T18:30:00+05:30",
    externalUrl: "https://nseindia.com/companies/results",
    pdfUrl: "https://nsearchives.nseindia.com/corporate/results/hdfcbank-q2fy26.pdf",
    sentiment: "positive",
  },
  {
    id: "n2",
    stockId: STOCK_ID,
    headline: "HDFC Bank Q2: Operating margin hits 35.3% — a new 8-quarter high",
    summary:
      "Analysts note the bank's cost efficiency gains as operating expenses grew slower than revenue. The 130 bps margin expansion was the key takeaway from an otherwise in-line set of numbers.",
    source: "Economic Times",
    category: "Economic Times",
    publishedAt: "2025-10-18T09:15:00+05:30",
    externalUrl: "https://economictimes.com/hdfc-bank-q2-results",
    sentiment: "positive",
  },
  {
    id: "n3",
    stockId: STOCK_ID,
    headline: "HDFC Bank profit growth steady but interest costs warrant attention",
    summary:
      "While top-line growth remained healthy, interest expenses rose 10% QoQ. Analysts are watching the cost of funds trajectory heading into Q3.",
    source: "Mint",
    category: "Mint",
    publishedAt: "2025-10-18T11:30:00+05:30",
    externalUrl: "https://livemint.com/hdfc-bank-q2-analysis",
    sentiment: "neutral",
  },
  {
    id: "n4",
    stockId: STOCK_ID,
    headline: "HDFC Bank sets record quarterly net profit at ₹16,820 Cr",
    summary:
      "The lender posted its highest-ever quarterly earnings, driven by revenue growth across segments. Management guidance points to continued double-digit growth in FY26.",
    source: "Business Standard",
    category: "Business Standard",
    publishedAt: "2025-10-19T08:45:00+05:30",
    externalUrl: "https://business-standard.com/hdfc-bank-q2-fy26",
    sentiment: "positive",
  },
  {
    id: "n5",
    stockId: STOCK_ID,
    headline: "HDFC Bank post-result rally: Stock up 2.3% on T+1 as investors cheer margins",
    summary:
      "Shares of HDFC Bank rose 2.3% on the first trading day following results, outperforming Nifty 50 by approximately 1.8% on the day.",
    source: "Reuters",
    category: "Reuters",
    publishedAt: "2025-10-19T16:30:00+05:30",
    externalUrl: "https://reuters.com/hdfc-bank-results-rally",
    sentiment: "positive",
  },
];

const aiSummary: AiSummary = {
  id: "ai-1",
  stockId: STOCK_ID,
  summaryType: "earnings_analysis",
  headline: "Strong all-round quarter — margins hit multi-year highs",
  content:
    "HDFC Bank delivered a strong Q2 FY26, with revenue and net profit both growing at double-digit rates on a year-on-year basis. Operating margin expanded 130 basis points to 35.3% — the highest in eight quarters — driven by slower growth in operating expenses relative to revenue. Net profit of ₹16,820 Cr is an all-time quarterly high for the bank. The pace of QoQ growth in operating profit (+6.7%) was notably ahead of revenue growth (+3.4%), underscoring improving operating leverage. Depreciation and interest charges remained contained, leaving a larger share of operating profit intact at the net profit level.",
  keyPoints: {
    positives: [
      "Revenue grew 14.2% YoY to ₹68,420 Cr, broad-based across segments",
      "Operating margin at 35.3% is the highest in 8 quarters (+130 bps YoY)",
      "Net profit of ₹16,820 Cr is a new all-time quarterly record",
      "Operating leverage visible: expenses grew 11.8% while revenue grew 14.2%",
      "PBT growth of 20.5% YoY — tax efficiency improving",
    ],
    concerns: [
      "Interest expense up 10.1% QoQ — cost of funds trending higher",
      "Revenue QoQ growth of 3.4% is steady but below the 3.7% seen in Q1 FY26",
    ],
  },
  qoqAnalysis:
    "Sequentially, revenue grew 3.4% from Q1 FY26 (₹66,180 Cr). Operating profit grew faster at 6.7%, showing operating leverage. Net profit advanced 4.7% QoQ. The key QoQ story is the 100 bps expansion in operating margin — unusual for a single quarter and suggests either a step-down in cost run-rate or a high-income quarter. Interest expenses rose 4.3% QoQ, which is something to watch as the cost of funds has been under pressure industry-wide.",
  bottomLine:
    "A very strong quarter — both in absolute terms and relative to the company's own trajectory. The combination of double-digit topline growth and meaningful margin expansion is unusual and signals genuine operating leverage. The only flag is rising interest costs. If the bank sustains margins above 34% in Q3, the full-year picture looks excellent. Recommend watching expense trends in the next quarter.",
  modelVersion: "gemini-2.5-flash",
  generatedAt: "2025-10-17T20:00:00+05:30",
};

const corporateEvents: CorporateEvent[] = [
  {
    id: "ce1",
    stockId: STOCK_ID,
    eventType: "dividend",
    eventDate: "2025-10-17",
    description: "Interim dividend declared alongside Q2 FY26 results",
    value: 19.5,
    exDate: "2025-10-28",
    recordDate: "2025-10-29",
  },
  {
    id: "ce2",
    stockId: STOCK_ID,
    eventType: "agm",
    eventDate: "2025-11-14",
    description: "Annual General Meeting scheduled",
  },
];

const peers: PeerResult[] = [
  {
    ticker: "ICICIBANK",
    companyName: "ICICI Bank",
    revenueYoy: 12.8,
    profitYoy: 15.2,
    operatingMargin: 34.8,
    filingDate: "2025-10-19",
    filed: true,
  },
  {
    ticker: "AXISBANK",
    companyName: "Axis Bank",
    revenueYoy: 13.5,
    profitYoy: 14.7,
    operatingMargin: 32.1,
    filingDate: "2025-10-22",
    filed: true,
  },
  {
    ticker: "KOTAKBANK",
    companyName: "Kotak Mahindra Bank",
    revenueYoy: 11.2,
    profitYoy: 12.9,
    operatingMargin: 33.5,
    filingDate: "2025-10-20",
    filed: true,
  },
  {
    ticker: "INDUSINDBK",
    companyName: "IndusInd Bank",
    revenueYoy: null,
    profitYoy: null,
    operatingMargin: null,
    filingDate: null,
    filed: false,
  },
];

// ─── Main Export ─────────────────────────────────────────────────────────────

export const hdfcBankQ2FY26Data: ResultsPageData = {
  stock: {
    stockId: STOCK_ID,
    companyName: "HDFC Bank",
    ticker: "HDFCBANK",
    sector: "Banking & Finance",
    subSector: "Large-Cap Private Banks",
  },
  current: trendRows[7], // Q2 FY26
  prevQuarter: trendRows[6], // Q1 FY26
  sameQuarterLastYear: trendRows[3], // Q2 FY25
  trend: trendRows, // all 8, oldest first

  prevQuarterNav: { quarter: "Q1", fiscalYear: "FY26" },
  nextQuarterNav: null, // This is the latest quarter

  fundamental,
  priceHistory,
  news,
  aiSummary,
  corporateEvents,
  peers,
  peerGroupName: "Large-Cap Private Banks",
};

// Helper: format quarter label for display
export function formatQuarterLabel(row: QuarterlyResultRow): string {
  return `${row.quarter} ${row.fiscalYear}`;
}

// Helper: format ₹ Cr with Indian number system
export function formatCrore(value: number | null | undefined): string {
  if (value == null) return "—";
  return `₹${value.toLocaleString("en-IN")} Cr`;
}

// Helper: format % change with sign and direction
export function formatPct(value: number | null | undefined, decimals = 1): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

// Helper: format basis points
export function formatBps(current: number, prior: number): string {
  const bps = Math.round((current - prior) * 100);
  const sign = bps > 0 ? "+" : "";
  return `${sign}${bps} bps`;
}

// Helper: direction arrow
export function changeArrow(value: number | null | undefined): "▲" | "▼" | "▬" {
  if (value == null) return "▬";
  if (value > 0.5) return "▲";
  if (value < -0.5) return "▼";
  return "▬";
}
