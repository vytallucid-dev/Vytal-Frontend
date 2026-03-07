// Mock data for quarterly financial results

export interface QuarterlyMetric {
  metric: string;
  latest: number | string;
  qoq: number | string;
  yoy: number | string;
  change: number;
  changeType: "yoy" | "qoq";
  unit: "cr" | "%" | "rs" | "bps" | "number";
  isSurprise?: boolean;
  surpriseType?: "positive" | "negative";
}

export interface MarginMetric {
  metric: string;
  latest: number;
  qoq: number;
  yoy: number;
  change: number;
  unit: "%" | "bps";
}

export interface QuarterlyResult {
  id: string;
  companyName: string;
  symbol: string;
  quarter: string;
  fiscalYear: string;
  announcementDate: string;
  sector: string;
  healthScore: number;
  
  // Core metrics for overview
  metrics: QuarterlyMetric[];
  
  // Margin details
  margins: MarginMetric[];
  
  // Historical data for charts (8 quarters)
  historical: {
    quarters: string[];
    revenue: number[];
    pat: number[];
    ebitda: number[];
    eps: number[];
    netMargin: number[];
    operatingMargin: number[];
    grossMargin: number[];
    ebitdaMargin: number[];
    totalAssets: number[];
    totalDebt: number[];
  };
  
  // Cost breakdown for margin waterfall
  costBreakdown: {
    revenue: number;
    cogs: number;
    operatingExpenses: number;
    otherIncome: number;
    depreciation: number;
    interest: number;
    tax: number;
    netProfit: number;
  };
  
  // AI summary
  aiSummary: {
    performanceSummary: string;
    keyPositives: string[];
    areasOfConcern: string[];
    qoqAnalysis: string;
    bottomLine: string;
  };
  
  // Original documents
  documents: {
    resultsPdf?: string;
    presentation?: string;
    concallTranscript?: string;
  };
}

// Sample data for HDFC Bank Q2 FY25
export const hdfcBankQ2FY25: QuarterlyResult = {
  id: "hdfc-bank-q2-fy25",
  companyName: "HDFC BANK",
  symbol: "HDFCBANK",
  quarter: "Q2",
  fiscalYear: "FY25",
  announcementDate: "Oct 20, 2024",
  sector: "Banking",
  healthScore: 85,
  
  metrics: [
    {
      metric: "Revenue",
      latest: 25400,
      qoq: 24200,
      yoy: 21600,
      change: 17.6,
      changeType: "yoy",
      unit: "cr",
      isSurprise: true,
      surpriseType: "positive"
    },
    {
      metric: "PAT",
      latest: 12800,
      qoq: 12100,
      yoy: 10800,
      change: 18.5,
      changeType: "yoy",
      unit: "cr",
      isSurprise: true,
      surpriseType: "positive"
    },
    {
      metric: "EBITDA",
      latest: 18200,
      qoq: 17400,
      yoy: 15600,
      change: 16.7,
      changeType: "yoy",
      unit: "cr"
    },
    {
      metric: "Net Margin",
      latest: 16.4,
      qoq: 16.2,
      yoy: 15.8,
      change: 60,
      changeType: "yoy",
      unit: "bps",
      isSurprise: true,
      surpriseType: "positive"
    },
    {
      metric: "Operating Margin",
      latest: 24.2,
      qoq: 23.8,
      yoy: 25.1,
      change: -90,
      changeType: "yoy",
      unit: "bps",
      isSurprise: true,
      surpriseType: "negative"
    },
    {
      metric: "EPS",
      latest: 24.5,
      qoq: 23.2,
      yoy: 20.8,
      change: 17.8,
      changeType: "yoy",
      unit: "rs"
    },
    {
      metric: "Total Assets",
      latest: 845000,
      qoq: 820000,
      yoy: 750000,
      change: 12.7,
      changeType: "yoy",
      unit: "cr"
    },
    {
      metric: "Total Debt",
      latest: 120000,
      qoq: 115000,
      yoy: 105000,
      change: 14.3,
      changeType: "yoy",
      unit: "cr",
      isSurprise: true,
      surpriseType: "negative"
    },
    {
      metric: "NII",
      latest: 21500,
      qoq: 20800,
      yoy: 18400,
      change: 16.8,
      changeType: "yoy",
      unit: "cr"
    },
    {
      metric: "CASA Ratio",
      latest: 42.8,
      qoq: 43.2,
      yoy: 44.5,
      change: -1.7,
      changeType: "yoy",
      unit: "%"
    }
  ],
  
  margins: [
    {
      metric: "Gross Margin",
      latest: 42.5,
      qoq: 41.8,
      yoy: 40.2,
      change: 230,
      unit: "bps"
    },
    {
      metric: "Operating Margin",
      latest: 24.2,
      qoq: 23.8,
      yoy: 25.1,
      change: -90,
      unit: "bps"
    },
    {
      metric: "EBITDA Margin",
      latest: 28.5,
      qoq: 27.9,
      yoy: 27.2,
      change: 130,
      unit: "bps"
    },
    {
      metric: "Net Margin",
      latest: 16.4,
      qoq: 16.2,
      yoy: 15.8,
      change: 60,
      unit: "bps"
    }
  ],
  
  historical: {
    quarters: ["Q1'23", "Q2'23", "Q3'23", "Q4'23", "Q1'24", "Q2'24", "Q3'24", "Q4'24"],
    revenue: [19200, 21600, 22100, 22800, 23400, 24200, 24800, 25400],
    pat: [9600, 10800, 11200, 11500, 11800, 12100, 12400, 12800],
    ebitda: [13800, 15600, 16100, 16500, 16900, 17400, 17800, 18200],
    eps: [18.5, 20.8, 21.5, 22.1, 22.7, 23.2, 23.8, 24.5],
    netMargin: [15.0, 15.8, 16.0, 15.9, 16.1, 16.2, 16.3, 16.4],
    operatingMargin: [25.5, 25.1, 24.8, 24.5, 24.3, 23.8, 24.0, 24.2],
    grossMargin: [39.8, 40.2, 40.5, 40.9, 41.2, 41.8, 42.1, 42.5],
    ebitdaMargin: [26.8, 27.2, 27.4, 27.6, 27.7, 27.9, 28.2, 28.5],
    totalAssets: [680000, 750000, 780000, 795000, 810000, 820000, 832000, 845000],
    totalDebt: [95000, 105000, 108000, 110000, 112000, 115000, 117000, 120000]
  },
  
  costBreakdown: {
    revenue: 100,
    cogs: -57.5,
    operatingExpenses: -18.3,
    otherIncome: 4.3,
    depreciation: -3.2,
    interest: -0.8,
    tax: -9.6,
    netProfit: 16.4
  },
  
  aiSummary: {
    performanceSummary: "HDFC Bank reported strong Q2 results with revenue growing 17.6% YoY to ₹25,400 Cr. Profit grew even faster at 18.5%, reaching ₹12,800 Cr. The bank continues to demonstrate robust fundamentals with improving net margins.",
    keyPositives: [
      "Revenue growth ahead of sector average (12%)",
      "Net margins improved 60 bps to 16.4%",
      "EPS grew 17.8%, indicating strong shareholder returns",
      "NII growth of 16.8% shows healthy core banking performance"
    ],
    areasOfConcern: [
      "Operating margin compressed 90 bps due to rising costs",
      "Debt grew faster (14.3%) than assets (12.7%)",
      "CASA ratio declined to 42.8% from 44.5% YoY",
      "Interest expenses up 22% QoQ"
    ],
    qoqAnalysis: "Revenue up 5% from last quarter, showing steady momentum. Most metrics stable with slight improvements. Sequential growth indicates consistent operational performance.",
    bottomLine: "Strong quarter overall. Growth remains healthy but watch cost pressures and leverage trends going forward. The bank maintains its leadership position with solid fundamentals."
  },
  
  documents: {
    resultsPdf: "/documents/hdfc-bank-q2-fy25-results.pdf",
    presentation: "/documents/hdfc-bank-q2-fy25-presentation.pdf",
    concallTranscript: "/documents/hdfc-bank-q2-fy25-concall.pdf"
  }
};

// Sample data for TCS Q3 FY24 (IT Sector)
export const tcsQ3FY24: QuarterlyResult = {
  id: "tcs-q3-fy24",
  companyName: "TCS",
  symbol: "TCS",
  quarter: "Q3",
  fiscalYear: "FY24",
  announcementDate: "Jan 12, 2024",
  sector: "Information Technology",
  healthScore: 82,
  
  metrics: [
    {
      metric: "Revenue",
      latest: 60583,
      qoq: 59162,
      yoy: 58229,
      change: 4.0,
      changeType: "yoy",
      unit: "cr"
    },
    {
      metric: "PAT",
      latest: 12502,
      qoq: 11895,
      yoy: 11392,
      change: 9.7,
      changeType: "yoy",
      unit: "cr",
      isSurprise: true,
      surpriseType: "positive"
    },
    {
      metric: "EBITDA",
      latest: 16850,
      qoq: 16120,
      yoy: 15480,
      change: 8.9,
      changeType: "yoy",
      unit: "cr"
    },
    {
      metric: "Net Margin",
      latest: 20.6,
      qoq: 20.1,
      yoy: 19.6,
      change: 100,
      changeType: "yoy",
      unit: "bps",
      isSurprise: true,
      surpriseType: "positive"
    },
    {
      metric: "Operating Margin",
      latest: 24.8,
      qoq: 24.3,
      yoy: 23.5,
      change: 130,
      changeType: "yoy",
      unit: "bps"
    },
    {
      metric: "EPS",
      latest: 34.2,
      qoq: 32.5,
      yoy: 31.1,
      change: 10.0,
      changeType: "yoy",
      unit: "rs"
    },
    {
      metric: "Total Assets",
      latest: 185000,
      qoq: 178000,
      yoy: 165000,
      change: 12.1,
      changeType: "yoy",
      unit: "cr"
    },
    {
      metric: "Total Debt",
      latest: 8500,
      qoq: 8200,
      yoy: 7800,
      change: 9.0,
      changeType: "yoy",
      unit: "cr"
    },
    {
      metric: "TCV",
      latest: 9200,
      qoq: 8100,
      yoy: 7500,
      change: 22.7,
      changeType: "yoy",
      unit: "cr",
      isSurprise: true,
      surpriseType: "positive"
    },
    {
      metric: "Attrition",
      latest: 12.5,
      qoq: 13.8,
      yoy: 15.2,
      change: -2.7,
      changeType: "yoy",
      unit: "%",
      isSurprise: true,
      surpriseType: "positive"
    }
  ],
  
  margins: [
    {
      metric: "Gross Margin",
      latest: 48.2,
      qoq: 47.5,
      yoy: 46.8,
      change: 140,
      unit: "bps"
    },
    {
      metric: "Operating Margin",
      latest: 24.8,
      qoq: 24.3,
      yoy: 23.5,
      change: 130,
      unit: "bps"
    },
    {
      metric: "EBITDA Margin",
      latest: 27.8,
      qoq: 27.2,
      yoy: 26.6,
      change: 120,
      unit: "bps"
    },
    {
      metric: "Net Margin",
      latest: 20.6,
      qoq: 20.1,
      yoy: 19.6,
      change: 100,
      unit: "bps"
    }
  ],
  
  historical: {
    quarters: ["Q1'23", "Q2'23", "Q3'23", "Q4'23", "Q1'24", "Q2'24", "Q3'24", "Q4'24"],
    revenue: [55309, 56305, 58229, 59381, 59692, 59162, 60583, 61734],
    pat: [10846, 11074, 11392, 11695, 11925, 11895, 12502, 12850],
    ebitda: [14721, 15012, 15480, 15964, 16205, 16120, 16850, 17245],
    eps: [29.6, 30.2, 31.1, 32.0, 32.6, 32.5, 34.2, 35.1],
    netMargin: [19.6, 19.7, 19.6, 19.7, 20.0, 20.1, 20.6, 20.8],
    operatingMargin: [23.1, 23.3, 23.5, 23.8, 24.0, 24.3, 24.8, 25.1],
    grossMargin: [45.8, 46.1, 46.8, 47.0, 47.2, 47.5, 48.2, 48.5],
    ebitdaMargin: [26.6, 26.7, 26.6, 26.9, 27.2, 27.2, 27.8, 27.9],
    totalAssets: [158000, 161000, 165000, 170000, 175000, 178000, 185000, 190000],
    totalDebt: [7200, 7500, 7800, 8000, 8100, 8200, 8500, 8600]
  },
  
  costBreakdown: {
    revenue: 100,
    cogs: -51.8,
    operatingExpenses: -23.4,
    otherIncome: 2.1,
    depreciation: -2.8,
    interest: -0.3,
    tax: -3.2,
    netProfit: 20.6
  },
  
  aiSummary: {
    performanceSummary: "TCS delivered a strong Q3 performance with revenue growing 4.0% YoY to ₹60,583 Cr. Net profit jumped 9.7% to ₹12,502 Cr, driven by improved operational efficiency and margin expansion.",
    keyPositives: [
      "Net margin expanded by 100 bps to 20.6%",
      "TCV (Total Contract Value) grew 22.7%, indicating strong deal pipeline",
      "Attrition declined to 12.5% from 15.2% YoY, improving talent retention",
      "Operating margin improved 130 bps showing better cost management"
    ],
    areasOfConcern: [
      "Revenue growth at 4% is below historical average of 8-10%",
      "QoQ revenue grew only 2.4%, showing sequential slowdown",
      "BFSI vertical showing weakness with flat growth"
    ],
    qoqAnalysis: "Revenue up 2.4% QoQ with margin expansion continuing. Deal wins remain strong but revenue conversion taking time. Operational metrics improving across the board.",
    bottomLine: "Solid quarter with focus on profitability over growth. Margins at multi-quarter highs. Deal momentum strong but macro headwinds impacting near-term revenue growth."
  },
  
  documents: {
    resultsPdf: "/documents/tcs-q3-fy24-results.pdf",
    presentation: "/documents/tcs-q3-fy24-presentation.pdf",
    concallTranscript: "/documents/tcs-q3-fy24-concall.pdf"
  }
};

// Helper functions
export function formatMetricValue(value: number | string, unit: string): string {
  if (typeof value === "string") return value;
  
  switch (unit) {
    case "cr":
      return `₹${value.toLocaleString("en-IN")} Cr`;
    case "%":
      return `${value.toFixed(1)}%`;
    case "rs":
      return `₹${value.toFixed(2)}`;
    case "bps":
      return `${value} bps`;
    case "number":
      return value.toLocaleString("en-IN");
    default:
      return value.toString();
  }
}

export function getChangeArrow(change: number): string {
  return change >= 0 ? "↗" : "↘";
}

export function getChangeColor(change: number, metric: string): string {
  // For costs/debt/attrition, negative is good
  const inverseMetrics = ["Total Debt", "Attrition", "Operating Expenses"];
  const isInverse = inverseMetrics.some(m => metric.includes(m));
  
  if (isInverse) {
    return change > 0 ? "text-red-500" : "text-green-500";
  }
  
  return change >= 0 ? "text-green-500" : "text-red-500";
}

// Export all available results
export const allResults: QuarterlyResult[] = [
  hdfcBankQ2FY25,
  tcsQ3FY24
];
