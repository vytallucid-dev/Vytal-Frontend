/**
 * The InvestIQ Health Score model — shared between the Health Score listing page
 * and the dedicated methodology page so the explanation and the data never drift.
 */

import { Icons, type Icon } from "@/lib/icons";

export type PillarKey =
  | "profitability"
  | "growth"
  | "stability"
  | "efficiency"
  | "valuation"
  | "momentum"
  | "trend"
  | "activity"
  | "sentiment";

export interface Pillar {
  key: PillarKey;
  label: string;
  short: string; // short column header
  icon: Icon;
  weight: number; // % contribution to composite
  summary: string; // one-liner
  measures: string[]; // underlying metrics
}

export interface HealthCategory {
  id: "fundamentals" | "technical" | "institutional";
  title: string;
  blurb: string;
  weight: number; // category weight %
  tint: string; // tailwind text color
  pillars: Pillar[];
}

export const healthModel: HealthCategory[] = [
  {
    id: "fundamentals",
    title: "Fundamentals",
    blurb: "Is the underlying business actually good?",
    weight: 55,
    tint: "text-success",
    pillars: [
      {
        key: "profitability",
        label: "Profitability",
        short: "Profit",
        icon: Icons.coins,
        weight: 14,
        summary: "How efficiently the company turns revenue into profit.",
        measures: ["Return on Equity", "Net & Operating Margin", "Return on Capital Employed"],
      },
      {
        key: "growth",
        label: "Growth",
        short: "Growth",
        icon: Icons.trendUp,
        weight: 12,
        summary: "Quality and consistency of revenue & earnings expansion.",
        measures: ["Revenue CAGR", "Profit CAGR", "EPS growth", "Book value growth"],
      },
      {
        key: "stability",
        label: "Stability",
        short: "Stability",
        icon: Icons.shield,
        weight: 13,
        summary: "Balance-sheet strength and earnings reliability.",
        measures: ["Debt / Equity", "Interest coverage", "Current ratio", "Earnings consistency"],
      },
      {
        key: "efficiency",
        label: "Efficiency",
        short: "Efficiency",
        icon: Icons.bolt,
        weight: 9,
        summary: "How well capital converts into real, spendable cash.",
        measures: ["Asset turnover", "Cash conversion", "Working-capital days", "FCF / profit"],
      },
      {
        key: "valuation",
        label: "Valuation",
        short: "Value",
        icon: Icons.scales,
        weight: 7,
        summary: "Whether the price is fair vs history and peers.",
        measures: ["P/E vs history", "P/B", "EV/EBITDA", "PEG", "Dividend yield"],
      },
    ],
  },
  {
    id: "technical",
    title: "Technical",
    blurb: "What is price action telling us right now?",
    weight: 25,
    tint: "text-info",
    pillars: [
      {
        key: "momentum",
        label: "Momentum",
        short: "Momentum",
        icon: Icons.pulse,
        weight: 13,
        summary: "Strength of the current move without being overbought.",
        measures: ["RSI", "MACD", "Stochastic", "Relative strength"],
      },
      {
        key: "trend",
        label: "Trend",
        short: "Trend",
        icon: Icons.chartLine,
        weight: 12,
        summary: "Alignment of short, medium and long-term trends.",
        measures: ["Moving-average stack", "Higher highs/lows", "Channel structure"],
      },
    ],
  },
  {
    id: "institutional",
    title: "Institutional",
    blurb: "What is the smart money doing?",
    weight: 20,
    tint: "text-primary",
    pillars: [
      {
        key: "activity",
        label: "Activity",
        short: "Activity",
        icon: Icons.building,
        weight: 11,
        summary: "Institutional flows and large-deal footprints.",
        measures: ["FII / DII net flows", "Bulk & block deals", "Delivery ratio"],
      },
      {
        key: "sentiment",
        label: "Sentiment",
        short: "Sentiment",
        icon: Icons.brain,
        weight: 9,
        summary: "Promoter conviction and ownership quality.",
        measures: ["Promoter holding & pledge", "Insider buying", "MF participation"],
      },
    ],
  },
];

export const allPillars = healthModel.flatMap((c) => c.pillars);

export interface ScoredStock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  score: number;
  rankDelta: number; // QoQ change in score
  pillars: Record<PillarKey, number>;
}

export const scoredStocks: ScoredStock[] = [
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", price: 1820.4, change: 1.52, score: 85, rankDelta: 3, pillars: { profitability: 88, growth: 82, stability: 90, efficiency: 85, valuation: 70, momentum: 75, trend: 80, activity: 85, sentiment: 78 } },
  { symbol: "TCS", name: "Tata Consultancy", sector: "Technology", price: 4120.0, change: 0.84, score: 88, rankDelta: 2, pillars: { profitability: 94, growth: 80, stability: 92, efficiency: 90, valuation: 68, momentum: 78, trend: 84, activity: 82, sentiment: 86 } },
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", price: 2945.6, change: -0.42, score: 83, rankDelta: 1, pillars: { profitability: 85, growth: 80, stability: 85, efficiency: 82, valuation: 75, momentum: 78, trend: 82, activity: 80, sentiment: 75 } },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", price: 1144.8, change: 0.95, score: 82, rankDelta: 4, pillars: { profitability: 85, growth: 78, stability: 87, efficiency: 83, valuation: 75, momentum: 73, trend: 78, activity: 82, sentiment: 76 } },
  { symbol: "INFY", name: "Infosys", sector: "Technology", price: 1880.2, change: 2.1, score: 79, rankDelta: 3, pillars: { profitability: 86, growth: 74, stability: 88, efficiency: 84, valuation: 72, momentum: 70, trend: 72, activity: 76, sentiment: 74 } },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Construction", price: 3620.1, change: 1.74, score: 84, rankDelta: 5, pillars: { profitability: 80, growth: 86, stability: 82, efficiency: 78, valuation: 73, momentum: 84, trend: 86, activity: 88, sentiment: 82 } },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "Financial Services", price: 7210.5, change: -1.2, score: 80, rankDelta: -2, pillars: { profitability: 90, growth: 88, stability: 70, efficiency: 80, valuation: 60, momentum: 66, trend: 70, activity: 78, sentiment: 80 } },
  { symbol: "ITC", name: "ITC Ltd", sector: "FMCG", price: 478.3, change: 0.32, score: 76, rankDelta: 1, pillars: { profitability: 84, growth: 62, stability: 90, efficiency: 80, valuation: 78, momentum: 64, trend: 70, activity: 72, sentiment: 70 } },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Automotive", price: 12880.0, change: -0.58, score: 81, rankDelta: 2, pillars: { profitability: 82, growth: 80, stability: 86, efficiency: 79, valuation: 70, momentum: 74, trend: 80, activity: 80, sentiment: 78 } },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: "Pharmaceuticals", price: 1762.9, change: 1.1, score: 78, rankDelta: 3, pillars: { profitability: 80, growth: 78, stability: 82, efficiency: 76, valuation: 68, momentum: 76, trend: 78, activity: 74, sentiment: 76 } },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Automotive", price: 980.5, change: 2.6, score: 72, rankDelta: 6, pillars: { profitability: 70, growth: 84, stability: 64, efficiency: 70, valuation: 66, momentum: 82, trend: 80, activity: 78, sentiment: 70 } },
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: "Consumer Durables", price: 2890.0, change: -1.4, score: 68, rankDelta: -4, pillars: { profitability: 82, growth: 58, stability: 84, efficiency: 78, valuation: 50, momentum: 52, trend: 56, activity: 60, sentiment: 64 } },
  { symbol: "ZEEL", name: "Zee Entertainment", sector: "Media", price: 138.7, change: -2.8, score: 54, rankDelta: -3, pillars: { profitability: 52, growth: 48, stability: 58, efficiency: 55, valuation: 70, momentum: 44, trend: 46, activity: 52, sentiment: 50 } },
  { symbol: "IDEA", name: "Vodafone Idea", sector: "Telecom", price: 12.4, change: 3.1, score: 38, rankDelta: 2, pillars: { profitability: 22, growth: 40, stability: 28, efficiency: 35, valuation: 60, momentum: 48, trend: 40, activity: 42, sentiment: 36 } },
];
