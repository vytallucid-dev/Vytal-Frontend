/**
 * Centralized demo data for the revamped shell, dashboard and landing page so
 * every surface tells a consistent story. (Mock — wire to the backend later.)
 */

export const marketIndices = [
  { name: "NIFTY 50", value: 24350.45, change: 0.78, spark: [50, 52, 51, 54, 53, 57, 58, 60, 59, 63] },
  { name: "SENSEX", value: 80125.3, change: 0.64, spark: [60, 61, 59, 62, 63, 62, 65, 66, 68, 70] },
  { name: "BANK NIFTY", value: 51280.9, change: 1.12, spark: [40, 42, 44, 43, 46, 48, 47, 50, 52, 55] },
  { name: "NIFTY IT", value: 41560.2, change: -0.34, spark: [70, 69, 71, 68, 67, 66, 67, 65, 64, 63] },
];

export const portfolioSummary = {
  totalValue: 1245800,
  invested: 920000,
  dayChange: 28500,
  dayChangePct: 2.35,
  totalReturnPct: 24.58,
  healthScore: 82,
  healthTrend: 5,
  holdingsCount: 15,
  sectorsCount: 8,
  valueSeries: [
    850000, 868000, 890000, 905000, 880000, 940000, 985000, 1010000, 1060000,
    1095000, 1150000, 1188000, 1210000, 1245800,
  ],
};

export const topHoldings = [
  { symbol: "HDFCBANK", name: "HDFC Bank", value: 182040, weight: 14.6, day: 1.5, health: 85, spark: [40, 42, 41, 44, 46, 45, 48, 50] },
  { symbol: "TCS", name: "Tata Consultancy", value: 164800, weight: 13.2, day: 0.8, health: 88, spark: [60, 61, 63, 62, 65, 66, 68, 70] },
  { symbol: "RELIANCE", name: "Reliance Ind.", value: 147600, weight: 11.8, day: -0.4, health: 83, spark: [55, 54, 56, 53, 52, 54, 53, 51] },
  { symbol: "INFY", name: "Infosys", value: 124500, weight: 10.0, day: 2.1, health: 79, spark: [44, 46, 45, 48, 50, 52, 51, 54] },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", value: 98200, weight: 7.9, day: -1.2, health: 80, spark: [70, 69, 71, 68, 66, 67, 65, 64] },
];

export const portfolioHealthBreakdown = [
  { key: "Profitability", score: 85, hint: "Strong margins & ROE across holdings" },
  { key: "Growth", score: 80, hint: "Healthy double-digit earnings momentum" },
  { key: "Stability", score: 88, hint: "Low leverage, consistent earnings" },
  { key: "Efficiency", score: 82, hint: "Capital converts to cash efficiently" },
  { key: "Valuation", score: 72, hint: "Slightly rich vs sector — watch entries" },
];

export const marketNews = [
  {
    id: 1,
    tag: "Markets",
    title: "Nifty closes at record high as banking & IT lead broad rally",
    source: "Mint",
    time: "12m ago",
    impact: "positive" as const,
  },
  {
    id: 2,
    tag: "Earnings",
    title: "HDFC Bank Q2 net profit jumps 18% YoY, beats street estimates",
    source: "ET Markets",
    time: "48m ago",
    impact: "positive" as const,
  },
  {
    id: 3,
    tag: "Policy",
    title: "RBI holds repo rate steady; commentary stays cautiously hawkish",
    source: "Reuters",
    time: "2h ago",
    impact: "neutral" as const,
  },
  {
    id: 4,
    tag: "Sector",
    title: "IT majors slip as US clients defer discretionary tech spend",
    source: "Bloomberg",
    time: "3h ago",
    impact: "negative" as const,
  },
];

export const recentAlerts = [
  { id: 1, symbol: "HDFCBANK", text: "Crossed your target of ₹1,800", time: "2h ago", kind: "target" as const },
  { id: 2, symbol: "INFY", text: "Health Score improved 76 → 79", time: "5h ago", kind: "health" as const },
  { id: 3, symbol: "BAJFINANCE", text: "Down 1.2% on heavy volume", time: "6h ago", kind: "move" as const },
  { id: 4, symbol: "TCS", text: "Earnings report due tomorrow", time: "1d ago", kind: "event" as const },
];

export const aiInsights = [
  {
    id: 1,
    title: "Rebalance suggested",
    body: "Banking is now 38% of your book. Trimming 5% into pharma would lift your diversification score to 84.",
    priority: "high" as const,
    tag: "Portfolio",
  },
  {
    id: 2,
    title: "Quality entry forming",
    body: "INFY's Health Score rose to 79 while price held support at ₹1,840 — your watchlist target zone.",
    priority: "medium" as const,
    tag: "Watchlist",
  },
  {
    id: 3,
    title: "Valuation watch",
    body: "Your portfolio's valuation pillar sits at 72. Two holdings trade above their 5-yr median P/E.",
    priority: "medium" as const,
    tag: "Health",
  },
];

export const trendingToday = [
  { symbol: "LT", name: "Larsen & Toubro", sector: "Construction", price: 3620.1, change: 1.74, health: 84, rating: "Strong Buy", reason: "Bagged ₹15,000 Cr infra order; order book at a record high.", spark: [40, 42, 41, 45, 48, 47, 52, 55, 54, 58] },
  { symbol: "INFY", name: "Infosys", sector: "Technology", price: 1880.2, change: 2.1, health: 79, rating: "Buy", reason: "Raised FY guidance on strong large-deal momentum.", spark: [44, 46, 45, 48, 50, 52, 51, 54, 56, 58] },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: "Pharma", price: 1762.9, change: 1.1, health: 78, rating: "Buy", reason: "US FDA clears key facility; specialty pipeline on track.", spark: [50, 49, 51, 53, 52, 55, 54, 57, 58, 60] },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Auto", price: 980.5, change: 2.6, health: 72, rating: "Accumulate", reason: "JLR volumes beat estimates; EV roadmap upgraded.", spark: [30, 33, 35, 34, 38, 41, 43, 42, 46, 49] },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", price: 1144.8, change: 0.95, health: 82, rating: "Strong Buy", reason: "Best-in-class asset quality; NIMs hold up post-RBI hold.", spark: [60, 61, 62, 61, 63, 64, 66, 65, 67, 68] },
  { symbol: "DMART", name: "Avenue Supermarts", sector: "Retail", price: 4120.5, change: -1.3, health: 75, rating: "Hold", reason: "Footfalls recover but margins pressured by new-store mix.", spark: [70, 69, 68, 67, 66, 67, 65, 64, 63, 62] },
];

export const sectorAllocation = [
  { sector: "Banking", weight: 28, value: 348824, color: "var(--chart-1)" },
  { sector: "Technology", weight: 23, value: 286534, color: "var(--chart-2)" },
  { sector: "Energy", weight: 16, value: 199328, color: "var(--chart-3)" },
  { sector: "Auto", weight: 13, value: 161954, color: "var(--chart-4)" },
  { sector: "Pharma", weight: 11, value: 137038, color: "var(--chart-5)" },
  { sector: "Others", weight: 9, value: 112122, color: "var(--muted-foreground)" },
];

export const upcomingEvents = [
  { date: "Jun 18", symbol: "HDFCBANK", title: "Q1 FY26 Results", type: "Earnings", impact: "high" as const },
  { date: "Jun 20", symbol: "RELIANCE", title: "Ex-Dividend ₹10", type: "Dividend", impact: "medium" as const },
  { date: "Jun 24", symbol: "TCS", title: "Board Meeting", type: "Corporate", impact: "low" as const },
  { date: "Jun 27", symbol: "INFY", title: "AGM", type: "Corporate", impact: "low" as const },
];

export const watchlistPreview = [
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", price: 1755.2, change: 0.6, health: 81 },
  { symbol: "TITAN", name: "Titan Company", price: 3290.0, change: -0.9, health: 77 },
  { symbol: "DMART", name: "Avenue Supermarts", price: 4120.5, change: 1.3, health: 75 },
];

/* ---- Portfolio: full holdings + value series ---- */
export interface Holding {
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  avgCost: number;
  ltp: number;
  day: number; // % day change
  health: number;
  spark: number[];
}

export const holdings: Holding[] = [
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", qty: 100, avgCost: 1640, ltp: 1820.4, day: 1.5, health: 85, spark: [40, 42, 41, 44, 46, 45, 48, 50] },
  { symbol: "TCS", name: "Tata Consultancy", sector: "Technology", qty: 40, avgCost: 3550, ltp: 4120.0, day: 0.8, health: 88, spark: [60, 61, 63, 62, 65, 66, 68, 70] },
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", qty: 50, avgCost: 2480, ltp: 2945.6, day: -0.4, health: 83, spark: [55, 54, 56, 53, 52, 54, 53, 51] },
  { symbol: "INFY", name: "Infosys", sector: "Technology", qty: 66, avgCost: 1420, ltp: 1880.2, day: 2.1, health: 79, spark: [44, 46, 45, 48, 50, 52, 51, 54] },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", qty: 120, avgCost: 920, ltp: 1144.8, day: 0.95, health: 82, spark: [50, 52, 51, 54, 56, 55, 58, 60] },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "Financial Services", qty: 14, avgCost: 6800, ltp: 7210.5, day: -1.2, health: 80, spark: [70, 69, 71, 68, 66, 67, 65, 64] },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Construction", qty: 28, avgCost: 2950, ltp: 3620.1, day: 1.74, health: 84, spark: [42, 45, 48, 47, 52, 55, 54, 58] },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Automotive", qty: 8, avgCost: 11200, ltp: 12880.0, day: -0.58, health: 81, spark: [60, 62, 61, 63, 62, 64, 63, 65] },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: "Pharmaceuticals", qty: 55, avgCost: 1480, ltp: 1762.9, day: 1.1, health: 78, spark: [50, 49, 51, 53, 55, 54, 57, 60] },
  { symbol: "ITC", name: "ITC Ltd", sector: "FMCG", qty: 300, avgCost: 410, ltp: 478.3, day: 0.32, health: 76, spark: [44, 45, 46, 45, 47, 48, 47, 49] },
  { symbol: "TITAN", name: "Titan Company", sector: "Consumer Durables", qty: 30, avgCost: 3050, ltp: 3290.0, day: -0.9, health: 77, spark: [55, 56, 54, 53, 52, 54, 53, 52] },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Automotive", qty: 90, avgCost: 720, ltp: 980.5, day: 2.6, health: 72, spark: [30, 33, 35, 38, 41, 43, 46, 49] },
];

export const portfolioValueSeries = [
  { m: "Jul", value: 850000, invested: 800000 },
  { m: "Aug", value: 905000, invested: 820000 },
  { m: "Sep", value: 880000, invested: 840000 },
  { m: "Oct", value: 985000, invested: 860000 },
  { m: "Nov", value: 1010000, invested: 875000 },
  { m: "Dec", value: 1095000, invested: 890000 },
  { m: "Jan", value: 1150000, invested: 905000 },
  { m: "Feb", value: 1188000, invested: 912000 },
  { m: "Mar", value: 1210000, invested: 918000 },
  { m: "Apr", value: 1232000, invested: 920000 },
  { m: "May", value: 1218000, invested: 920000 },
  { m: "Jun", value: 1245800, invested: 920000 },
];

export const portfolioReturns = [
  { label: "1 Day", you: 2.35, nifty: 0.78 },
  { label: "1 Week", you: 3.1, nifty: 1.4 },
  { label: "1 Month", you: 6.2, nifty: 3.1 },
  { label: "3 Months", you: 11.8, nifty: 6.4 },
  { label: "1 Year", you: 24.58, nifty: 12.8 },
  { label: "3Y CAGR", you: 22.4, nifty: 14.1 },
];

/* ---- Watchlist ---- */
export interface WatchItem {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  d1: number; // 1d %
  d7: number; // 7d %
  mcap: string;
  health: number;
  target: number;
  favorite: boolean;
  spark: number[];
}

export const watchlist: WatchItem[] = [
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking", price: 1755.2, d1: 0.6, d7: 2.4, mcap: "₹3.5L Cr", health: 81, target: 1900, favorite: true, spark: [50, 51, 52, 51, 53, 54, 56, 58] },
  { symbol: "TITAN", name: "Titan Company", sector: "Consumer", price: 3290.0, d1: -0.9, d7: -1.8, mcap: "₹2.9L Cr", health: 77, target: 3600, favorite: true, spark: [60, 59, 58, 57, 56, 57, 55, 54] },
  { symbol: "DMART", name: "Avenue Supermarts", sector: "Retail", price: 4120.5, d1: 1.3, d7: 3.1, mcap: "₹2.7L Cr", health: 75, target: 4500, favorite: false, spark: [40, 42, 43, 45, 47, 46, 49, 51] },
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: "Consumer", price: 2890.0, d1: -1.4, d7: -3.2, mcap: "₹2.8L Cr", health: 68, target: 3100, favorite: false, spark: [70, 68, 67, 66, 64, 65, 63, 61] },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", price: 1456.0, d1: 1.8, d7: 4.2, mcap: "₹8.2L Cr", health: 80, target: 1600, favorite: true, spark: [42, 44, 46, 48, 47, 50, 52, 55] },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", sector: "Pharma", price: 5240.0, d1: 0.4, d7: 1.1, mcap: "₹1.4L Cr", health: 74, target: 5600, favorite: false, spark: [55, 56, 55, 57, 58, 57, 59, 60] },
  { symbol: "ADANIGREEN", name: "Adani Green Energy", sector: "Power", price: 985.3, d1: 3.4, d7: 6.8, mcap: "₹1.6L Cr", health: 62, target: 1100, favorite: false, spark: [30, 33, 36, 35, 40, 44, 47, 51] },
  { symbol: "DABUR", name: "Dabur India", sector: "FMCG", price: 512.6, d1: -0.3, d7: 0.6, mcap: "₹0.9L Cr", health: 73, target: 560, favorite: false, spark: [50, 50, 49, 51, 52, 51, 52, 53] },
];
