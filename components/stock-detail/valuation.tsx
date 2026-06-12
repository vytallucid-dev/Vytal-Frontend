import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  TrendingDown,
  TrendingUpDown,
  Building2,
  Newspaper,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const Valuation = () => {
  const params = useParams();
  const symbol = params.symbol as string;
  // Mock data - replace with real data from props/API
  const stockData = {
    symbol: "HDFCBANK",
    currentPrice: 1820,
    priceChange: 58,
    priceChangePercent: 3.2,
    marketCap: "12.5 Lakh Cr",
    sectorRank: 3,
    sector: "Banking",
    fiftyTwoWeekLow: 1420,
    fiftyTwoWeekHigh: 1950,
    pe: 18.5,
    sectorPE: 14.2,
    pb: 2.3,
    sectorPB: 1.8,
    evEbitda: 12.5,
    sectorEvEbitda: 10.8,
    dividendYield: 1.2,
    sectorDividendYield: 2.8,
  };

  // Calculate 52-week position
  const range = stockData.fiftyTwoWeekHigh - stockData.fiftyTwoWeekLow;
  const position = stockData.currentPrice - stockData.fiftyTwoWeekLow;
  const percentagePosition = (position / range) * 100;

  const distanceFromLow = stockData.currentPrice - stockData.fiftyTwoWeekLow;
  const distanceFromHigh = stockData.fiftyTwoWeekHigh - stockData.currentPrice;
  const percentFromLow = (
    (distanceFromLow / stockData.fiftyTwoWeekLow) *
    100
  ).toFixed(1);
  const percentFromHigh = (
    (distanceFromHigh / stockData.currentPrice) *
    100
  ).toFixed(1);

  // Helper function to get assessment badge
  const getAssessmentBadge = (
    current: number,
    average: number,
    lowerIsBetter = false,
  ) => {
    const diff = ((current - average) / average) * 100;
    const absDiff = Math.abs(diff);

    if (lowerIsBetter) {
      if (diff < -20)
        return {
          color: "🟢",
          text: "Higher",
          variant: "default" as const,
          value: `+${absDiff.toFixed(0)}%`,
        };
      if (diff > 20)
        return {
          color: "🔴",
          text: "Lower",
          variant: "destructive" as const,
          value: `-${absDiff.toFixed(0)}%`,
        };
      return {
        color: "🟡",
        text: "Premium",
        variant: "secondary" as const,
        value: `+${absDiff.toFixed(0)}%`,
      };
    } else {
      if (diff > 20)
        return {
          color: "🟡",
          text: "Premium",
          variant: "secondary" as const,
          value: `+${absDiff.toFixed(0)}%`,
        };
      if (diff < -20)
        return {
          color: "🟢",
          text: "Discount",
          variant: "default" as const,
          value: `-${absDiff.toFixed(0)}%`,
        };
      return {
        color: "🟡",
        text: "In-line",
        variant: "outline" as const,
        value: `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`,
      };
    }
  };

  const peAssessment = getAssessmentBadge(stockData.pe, stockData.sectorPE);
  const pbAssessment = getAssessmentBadge(stockData.pb, stockData.sectorPB);
  const evEbitdaAssessment = getAssessmentBadge(
    stockData.evEbitda,
    stockData.sectorEvEbitda,
  );
  const dividendAssessment = getAssessmentBadge(
    stockData.dividendYield,
    stockData.sectorDividendYield,
    true,
  );

  // Additional data for Section 2 & 3
  const valuationStory = {
    premiumVsSector: 30,
    roe: 17.2,
    sectorROE: 15.8,
    expectedGrowth: "14-18%",
    peg: 1.04,
    historicalPE: {
      fiveYearHigh: 22.5,
      fiveYearLow: 11.8,
      fiveYearAvg: 16.2,
      percentile: 72,
      current: 18.5,
      monthlyData: [
        { month: "Jan'21", pe: 16.5 },
        { month: "Apr'21", pe: 17.2 },
        { month: "Jul'21", pe: 18.8 },
        { month: "Oct'21", pe: 20.5 },
        { month: "Dec'21", pe: 22.5 },
        { month: "Mar'22", pe: 19.8 },
        { month: "Jun'22", pe: 17.5 },
        { month: "Sep'22", pe: 16.2 },
        { month: "Dec'22", pe: 15.8 },
        { month: "Mar'23", pe: 16.5 },
        { month: "Jun'23", pe: 17.8 },
        { month: "Sep'23", pe: 18.2 },
        { month: "Dec'23", pe: 17.5 },
        { month: "Mar'24", pe: 18.0 },
        { month: "Jun'24", pe: 18.8 },
        { month: "Sep'24", pe: 18.5 },
        { month: "Dec'24", pe: 18.5 },
      ],
    },
  };

  // Peer comparison data for Section 4
  const peerData = [
    {
      company: "HDFC Bank",
      symbol: "HDFCBANK",
      price: 1820,
      pe: 18.5,
      pb: 2.3,
      evEbitda: 12.5,
      dividendYield: 1.2,
      roe: 17.2,
      isCurrent: true,
      marketCap: 1250000, // in crores for bubble size
    },
    {
      company: "ICICI Bank",
      symbol: "ICICIBANK",
      price: 1180,
      pe: 16.2,
      pb: 2.1,
      evEbitda: 11.0,
      dividendYield: 2.5,
      roe: 16.8,
      isCurrent: false,
      marketCap: 880000,
    },
    {
      company: "Kotak Bank",
      symbol: "KOTAKBANK",
      price: 1950,
      pe: 20.5,
      pb: 2.6,
      evEbitda: 13.8,
      dividendYield: 0.8,
      roe: 16.2,
      isCurrent: false,
      marketCap: 420000,
    },
    {
      company: "Axis Bank",
      symbol: "AXISBANK",
      price: 1120,
      pe: 14.8,
      pb: 1.8,
      evEbitda: 9.5,
      dividendYield: 3.2,
      roe: 14.5,
      isCurrent: false,
      marketCap: 380000,
    },
    {
      company: "SBI",
      symbol: "SBIN",
      price: 720,
      pe: 12.5,
      pb: 1.4,
      evEbitda: 8.2,
      dividendYield: 3.8,
      roe: 13.8,
      isCurrent: false,
      marketCap: 650000,
    },
  ];

  // Calculate peer averages for comparison
  const peerAverages = {
    pe: peerData.reduce((sum, p) => sum + p.pe, 0) / peerData.length,
    pb: peerData.reduce((sum, p) => sum + p.pb, 0) / peerData.length,
    evEbitda:
      peerData.reduce((sum, p) => sum + p.evEbitda, 0) / peerData.length,
    dividendYield:
      peerData.reduce((sum, p) => sum + p.dividendYield, 0) / peerData.length,
    roe: peerData.reduce((sum, p) => sum + p.roe, 0) / peerData.length,
  };

  // Helper function for peer comparison cell styling
  const getPeerCellStyle = (
    value: number,
    average: number,
    lowerIsBetter = false,
  ) => {
    const diff = ((value - average) / average) * 100;
    if (lowerIsBetter) {
      if (diff < -5) return "text-green-600 dark:text-green-500 font-semibold";
      if (diff > 5) return "text-red-600 dark:text-red-500";
      return "";
    } else {
      if (diff > 5) return "text-green-600 dark:text-green-500 font-semibold";
      if (diff < -5) return "text-red-600 dark:text-red-500";
      return "";
    }
  };

  const getValuationScore = (peer: (typeof peerData)[0]) => {
    const peScore = (peerAverages.pe - peer.pe) / peerAverages.pe;
    const roeScore = (peer.roe - peerAverages.roe) / peerAverages.roe;
    const totalScore = peScore + roeScore;

    if (totalScore > 0.15)
      return { badge: "🟢 Cheap", variant: "default" as const };
    if (totalScore > 0.05)
      return { badge: "🟢 Value", variant: "default" as const };
    if (totalScore > -0.05)
      return { badge: "🟢 Fair", variant: "outline" as const };
    if (totalScore > -0.15)
      return { badge: "🟡 Premium", variant: "secondary" as const };
    return { badge: "🟡 Premium", variant: "secondary" as const };
  };

  // PEG Analysis data for Section 5
  const pegData = {
    currentPE: 18.5,
    expectedGrowth: 17.8,
    currentPEG: 1.04,
    scenarios: [
      {
        growth: "20%+",
        peg: 0.93,
        assessment: "🟢 Attractive",
        label: "upside",
      },
      {
        growth: "15-18%",
        peg: "1.04-1.23",
        assessment: "🟡 Fair",
        label: "base",
      },
      {
        growth: "12-14%",
        peg: "1.32-1.54",
        assessment: "🔴 Expensive",
        label: "downside",
      },
    ],
    peerPEG: [
      {
        company: "HDFC Bank",
        pe: 18.5,
        growth: 17.8,
        peg: 1.04,
        score: "Fair",
      },
      {
        company: "ICICI Bank",
        pe: 16.2,
        growth: 16.5,
        peg: 0.98,
        score: "Good value",
      },
      {
        company: "Kotak Bank",
        pe: 20.5,
        growth: 12.8,
        peg: 1.6,
        score: "Expensive",
      },
      {
        company: "Axis Bank",
        pe: 14.8,
        growth: 15.2,
        peg: 0.97,
        score: "Good value",
      },
      {
        company: "SBI",
        pe: 12.5,
        growth: 13.2,
        peg: 0.95,
        score: "Decent value",
      },
    ],
  };

  // Intrinsic Value data for Section 6
  const intrinsicValue = {
    currentEPS: 98.4,
    currentBookValue: 820,
    peMethod: {
      fairPE: 16.5,
      fairValue: 1624,
      variance: 12.0,
      interpretation: "Slightly expensive by P/E method",
    },
    pbMethod: {
      fairPB: 2.1,
      fairValue: 1722,
      variance: 5.7,
      interpretation: "Marginally above fair value",
    },
    dcfMethod: {
      growthRate: "15% for 5Y, 10% terminal",
      discountRate: 12,
      intrinsicRangeLow: 1650,
      intrinsicRangeHigh: 1850,
      interpretation: "Fairly valued if assumptions hold",
    },
    fairValueRange: {
      undervalued: 1400,
      fairLow: 1650,
      fairHigh: 1900,
      overvalued: 2100,
    },
  };

  // Valuation Risks data for Section 7
  const valuationRisks = {
    multipleCompression: {
      risk: "P/E could fall back to historical average",
      impact:
        "If P/E drops from 18.5x to 16.2x (5Y avg) with flat earnings, stock falls 12.4%",
      probability: "🟡 Moderate",
      trigger:
        "Market sentiment shift, sector rotation, disappointment in results",
    },
    growthDisappointment: {
      risk: "If growth slows below expectations",
      impact:
        "Stock priced for 15-18% growth. If actual is 10-12%, re-rating likely",
      probability: "🟡 Moderate",
      trigger: "Economic slowdown, rising competition, margin pressure",
    },
    risingRate: {
      risk: "Higher interest rates make stocks less attractive",
      impact: "Discount rates rise → valuations compress across market",
      probability: "🟢 Low (Currently)",
      trigger: "RBI rate hikes, inflation concerns",
    },
    scenarios: [
      {
        scenario: "Best Case (Bull)",
        epsGrowth: "20%",
        pe: "20.0x",
        price: 2360,
        return: "+30%",
        probability: "20%",
      },
      {
        scenario: "Base Case (Expected)",
        epsGrowth: "16%",
        pe: "18.5x",
        price: 2100,
        return: "+15%",
        probability: "50%",
      },
      {
        scenario: "Mild Disappointment",
        epsGrowth: "12%",
        pe: "16.0x",
        price: 1840,
        return: "+1%",
        probability: "20%",
      },
      {
        scenario: "Worst Case (Bear)",
        epsGrowth: "8%",
        pe: "14.0x",
        price: 1620,
        return: "-11%",
        probability: "10%",
      },
    ],
  };
  const pegAnalysis = {
    peerPEG: [
      {
        company: "HDFC Bank",
        pe: 18.5,
        growth: 17.8,
        peg: 1.04,
        score: "Fair",
      },
      {
        company: "ICICI Bank",
        pe: 16.2,
        growth: 16.5,
        peg: 0.98,
        score: "Good value",
      },
      {
        company: "Kotak Bank",
        pe: 20.5,
        growth: 12.8,
        peg: 1.6,
        score: "Expensive",
      },
      {
        company: "Axis Bank",
        pe: 14.8,
        growth: 15.2,
        peg: 0.97,
        score: "Good value",
      },
      {
        company: "SBI",
        pe: 12.5,
        growth: 13.2,
        peg: 0.95,
        score: "Decent value",
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Storytelling Introduction */}
      <div
        id="valuation-snapshot"
        className="text-sm text-muted-foreground italic"
      >
        "Let's start with what you're paying for this stock today"
      </div>

      {/* Section Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          💰 Current Price & Valuation
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Understanding what you pay and what you get
        </p>
      </div>

      {/* TOP CARD: Price Context */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold">
                ₹{stockData.currentPrice.toLocaleString("en-IN")}
              </CardTitle>
              <div className="flex items-center gap-2">
                {stockData.priceChangePercent >= 0 ? (
                  <div className="flex items-center text-green-600 dark:text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="font-semibold">
                      +₹{stockData.priceChange} (+{stockData.priceChangePercent}
                      %)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600 dark:text-red-500">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    <span className="font-semibold">
                      ₹{stockData.priceChange} ({stockData.priceChangePercent}%)
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">Today</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">Market Cap</div>
              <div className="text-xl font-bold">₹{stockData.marketCap}</div>
              <Badge variant="secondary" className="text-xs">
                #{stockData.sectorRank} in {stockData.sector}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Visual Price Position Indicator */}
          <div className="space-y-3">
            <div className="text-sm font-medium">52-Week Price Range</div>

            {/* Price Range Visualization */}
            <div className="space-y-2">
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                  style={{ width: "100%" }}
                />
                <div
                  className="absolute h-6 w-6 bg-primary border-4 border-background rounded-full shadow-lg -top-2"
                  style={{ left: `calc(${percentagePosition}% - 12px)` }}
                />
              </div>

              {/* Range Labels */}
              <div className="flex justify-between items-center text-xs">
                <div className="text-left">
                  <div className="font-medium">52W Low</div>
                  <div className="text-muted-foreground">
                    ₹{stockData.fiftyTwoWeekLow.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Current Price</div>
                  <div className="text-primary font-bold">
                    ₹{stockData.currentPrice.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {percentagePosition.toFixed(0)}% of 52W range
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">52W High</div>
                  <div className="text-muted-foreground">
                    ₹{stockData.fiftyTwoWeekHigh.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            {/* Distance Markers */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Card className="bg-muted/50">
                <CardContent className="p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">
                    From 52W Low
                  </div>
                  <div className="font-semibold text-green-600 dark:text-green-500">
                    +{percentFromLow}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ₹{distanceFromLow.toLocaleString("en-IN")} above
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">
                    From 52W High
                  </div>
                  <div className="font-semibold text-red-600 dark:text-red-500">
                    -{percentFromHigh}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ₹{distanceFromHigh.toLocaleString("en-IN")} below
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Status */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Current Status:
                </span>
                <Badge variant="secondary" className="font-semibold">
                  Near recent highs
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FOUR KEY VALUATION METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: Price-to-Earnings (P/E) */}
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500 overflow-hidden group">
          <div className="bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Price-to-Earnings
                </p>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stockData.pe}x
                </div>
              </div>
              <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                💰
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              Pay ₹{stockData.pe} for every ₹1 of earnings
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Sector Avg</span>
                <span className="font-semibold">{stockData.sectorPE}x</span>
              </div>
              <Badge
                variant={peAssessment.variant}
                className="w-full justify-center text-xs py-0.5"
              >
                {peAssessment.color} {peAssessment.text}
              </Badge>
            </div>

            <div className="mt-3 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
              <p className="text-xs text-muted-foreground italic">
                💡 Higher = strong growth expected
              </p>
            </div>
          </div>
        </Card>

        {/* CARD 2: Price-to-Book (P/B) */}
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500 overflow-hidden group">
          <div className="bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Price-to-Book
                </p>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stockData.pb}x
                </div>
              </div>
              <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                📚
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              Paying {stockData.pb}x book value of assets
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Sector Avg</span>
                <span className="font-semibold">{stockData.sectorPB}x</span>
              </div>
              <Badge
                variant={pbAssessment.variant}
                className="w-full justify-center text-xs py-0.5"
              >
                {pbAssessment.color} {pbAssessment.text}
              </Badge>
            </div>

            <div className="mt-3 pt-2 border-t border-purple-200/50 dark:border-purple-800/50">
              <p className="text-xs text-muted-foreground italic">
                💡 &gt;2x suggests quality premium
              </p>
            </div>
          </div>
        </Card>

        {/* CARD 3: EV/EBITDA */}
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500 overflow-hidden group">
          <div className="bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  EV/EBITDA
                </p>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stockData.evEbitda}x
                </div>
              </div>
              <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                🏢
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {stockData.evEbitda}x operating profit
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Sector Avg</span>
                <span className="font-semibold">
                  {stockData.sectorEvEbitda}x
                </span>
              </div>
              <Badge
                variant={evEbitdaAssessment.variant}
                className="w-full justify-center text-xs py-0.5"
              >
                {evEbitdaAssessment.color} {evEbitdaAssessment.text}
              </Badge>
            </div>

            <div className="mt-3 pt-2 border-t border-green-200/50 dark:border-green-800/50">
              <p className="text-xs text-muted-foreground italic">
                💡 Accounts for debt structure
              </p>
            </div>
          </div>
        </Card>

        {/* CARD 4: Dividend Yield */}
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-amber-500 overflow-hidden group">
          <div className="bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Dividend Yield
                </p>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stockData.dividendYield}%
                </div>
              </div>
              <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                💵
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              ₹{stockData.dividendYield} per ₹100 invested
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Sector Avg</span>
                <span className="font-semibold">
                  {stockData.sectorDividendYield}%
                </span>
              </div>
              <Badge
                variant={dividendAssessment.variant}
                className="w-full justify-center text-xs py-0.5"
              >
                {dividendAssessment.color} {dividendAssessment.text}
              </Badge>
            </div>

            <div className="mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
              <p className="text-xs text-muted-foreground italic">
                💡 Retaining cash for growth
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION 2: VALUATION STORY */}
      <div id="valuation-story" className="space-y-4 pt-8 border-t">
        {/* Storytelling Introduction */}
        <div className="text-sm text-muted-foreground italic">
          "Here's what these valuations tell us about market expectations:"
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            📖 Understanding the Valuation
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            What the numbers reveal about market expectations and investment fit
          </p>
        </div>

        {/* Three Narrative Insight Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* CARD 1: Premium Pricing Reality */}
          <Card className="border-l-4 border-l-amber-500 hover:shadow-xl transition-all overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <CardHeader className="pb-3 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-bold">
                  💰 Premium Pricing Reality
                </CardTitle>
                <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                  ⚠️
                </div>
              </div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 pt-1">
                +{valuationStory.premiumVsSector}%
              </div>
              <p className="text-xs text-muted-foreground">vs sector average</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                At P/E of {stockData.pe}x, {stockData.symbol} trades at a
                significant premium to the {stockData.sector.toLowerCase()}{" "}
                sector average of {stockData.sectorPE}x. Premiums exist when a
                company has better quality. The question: does quality justify
                it?
              </p>

              <div className="space-y-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  📊 Quick Facts
                </div>
                <div className="grid gap-1.5">
                  <div className="flex justify-between items-center p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded">
                    <span className="text-xs text-muted-foreground">
                      Premium paid:
                    </span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      +{valuationStory.premiumVsSector}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded">
                    <span className="text-xs text-muted-foreground">
                      Quality (ROE):
                    </span>
                    <span className="text-xs font-bold">
                      {valuationStory.roe}% vs {valuationStory.sectorROE}%
                    </span>
                  </div>
                  <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded">
                    <span className="text-xs font-bold">
                      Better quality, higher price
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: Growth Expectations Baked In */}
          <Card className="border-l-4 border-l-blue-500 hover:shadow-xl transition-all overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <CardHeader className="pb-3 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-bold">
                  📈 Growth Expectations Baked In
                </CardTitle>
                <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                  🎯
                </div>
              </div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 pt-1">
                PEG: {valuationStory.peg}
              </div>
              <p className="text-xs text-muted-foreground">
                fair if growth delivers
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                PEG of {valuationStory.peg} suggests growth rate (
                {valuationStory.expectedGrowth}) justifies the P/E. Market
                expects maintained track record - consistent growth with stable
                margins. Any disappointment will hurt. Price expects good news.
              </p>

              <div className="space-y-2 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  📊 Quick Facts
                </div>
                <div className="grid gap-1.5">
                  <div className="flex justify-between items-center p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded">
                    <span className="text-xs text-muted-foreground">
                      Expected growth:
                    </span>
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">
                      {valuationStory.expectedGrowth}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded">
                    <span className="text-xs text-muted-foreground">
                      Current P/E:
                    </span>
                    <span className="text-xs font-bold">{stockData.pe}x</span>
                  </div>
                  <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded">
                    <span className="text-xs font-bold">
                      Excellence priced in
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: Value vs Quality Trade-off */}
          <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-all overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
            <CardHeader className="pb-3 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-bold">
                  ⚖️ Value vs Quality Trade-off
                </CardTitle>
                <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                  💎
                </div>
              </div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400 pt-1">
                Quality ≠ Cheap
              </div>
              <p className="text-xs text-muted-foreground">
                but worth the premium?
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Not a 'cheap' stock by any measure, but quality companies rarely
                are. Question isn't 'is it cheap?' but 'is quality worth the
                premium?' If you value predictability and lower risk -
                acceptable. Value hunters - look elsewhere.
              </p>

              <div className="space-y-2 pt-2 border-t border-green-200/50 dark:border-green-800/50">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  🎯 Investment Fit
                </div>
                <div className="grid gap-1.5">
                  <div className="flex items-center gap-2 p-2 bg-green-50/50 dark:bg-green-950/20 rounded">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                      ✓
                    </span>
                    <span className="text-xs">
                      <span className="font-semibold">Quality investors:</span>{" "}
                      Yes
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50/50 dark:bg-yellow-950/20 rounded">
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                      ~
                    </span>
                    <span className="text-xs">
                      <span className="font-semibold">GARP:</span> Maybe
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-red-50/50 dark:bg-red-950/20 rounded">
                    <span className="text-red-600 dark:text-red-400 font-bold text-sm">
                      ✗
                    </span>
                    <span className="text-xs">
                      <span className="font-semibold">Value hunters:</span> No
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 3: HISTORICAL VALUATION CONTEXT */}
      <div id="historical-context" className="space-y-4 pt-8 border-t">
        {/* Storytelling Introduction */}
        <div className="text-sm text-muted-foreground italic">
          "Let's see how current valuation compares to its own history"
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            📊 Historical Valuation Bands
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Where does current valuation sit in the historical context?
          </p>
        </div>

        {/* P/E Band Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>5-Year P/E Ratio Bands</CardTitle>
            <CardDescription>
              Track historical valuation ranges and see where we are today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chart Container */}
              <div className="relative h-64 border rounded-lg p-4 bg-muted/20">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-muted-foreground">
                  <div>25</div>
                  <div>20</div>
                  <div>15</div>
                  <div>10</div>
                </div>

                {/* Chart area */}
                <div className="ml-12 mr-4 h-full relative">
                  {/* Background bands */}
                  <div className="absolute inset-0 flex flex-col">
                    {/* Max band (top) */}
                    <div className="flex-1 bg-red-100/30 dark:bg-red-900/10 border-b border-red-200/50 dark:border-red-800/30 relative">
                      <span className="absolute right-2 top-1 text-xs text-red-600 dark:text-red-400">
                        Max: {valuationStory.historicalPE.fiveYearHigh}x
                      </span>
                    </div>

                    {/* 75th percentile */}
                    <div className="flex-1 bg-orange-100/40 dark:bg-orange-900/20 border-b border-orange-200/50 dark:border-orange-800/30 relative">
                      <span className="absolute right-2 top-1 text-xs text-orange-600 dark:text-orange-400">
                        75th: 19.8x
                      </span>
                    </div>

                    {/* Median band */}
                    <div className="flex-1 bg-yellow-100/40 dark:bg-yellow-900/20 border-b-2 border-yellow-500/50 relative">
                      <span className="absolute right-2 top-1 text-xs text-yellow-600 dark:text-yellow-400">
                        Median: {valuationStory.historicalPE.fiveYearAvg}x
                      </span>
                      {/* Current P/E marker */}
                      <div className="absolute left-1/2 top-0 -mt-1">
                        <div className="relative">
                          <div className="absolute -left-3 -top-1 w-6 h-6 bg-primary border-4 border-background rounded-full shadow-lg z-10" />
                          <div className="absolute -left-20 -top-8 text-xs font-bold text-primary whitespace-nowrap">
                            ← You are here:{" "}
                            {valuationStory.historicalPE.current}x
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 25th percentile */}
                    <div className="flex-1 bg-green-100/40 dark:bg-green-900/20 border-b border-green-200/50 dark:border-green-800/30 relative">
                      <span className="absolute right-2 top-1 text-xs text-green-600 dark:text-green-400">
                        25th: 14.5x
                      </span>
                    </div>

                    {/* Min band (bottom) */}
                    <div className="flex-1 bg-green-100/30 dark:bg-green-900/10 relative">
                      <span className="absolute right-2 bottom-1 text-xs text-green-600 dark:text-green-400">
                        Min: {valuationStory.historicalPE.fiveYearLow}x
                      </span>
                    </div>
                  </div>
                </div>

                {/* X-axis timeline */}
                <div className="absolute bottom-0 left-12 right-4 flex justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>2020</span>
                  <span>2021</span>
                  <span>2022</span>
                  <span>2023</span>
                  <span>2024</span>
                  <span>Now</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800" />
                  <span className="text-muted-foreground">Peak Territory</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-500" />
                  <span className="text-muted-foreground">Median Range</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800" />
                  <span className="text-muted-foreground">Attractive Zone</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Context Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* COLUMN 1: Current Position */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">Current Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Current P/E:
                  </span>
                  <span className="text-xl font-bold">
                    {valuationStory.historicalPE.current}x
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Percentile:
                  </span>
                  <Badge variant="secondary" className="font-semibold">
                    {valuationStory.historicalPE.percentile}nd
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground italic pt-1">
                  Higher than {valuationStory.historicalPE.percentile}% of last
                  5 years
                </p>
              </div>

              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    From median:
                  </span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-500">
                    +
                    {(
                      ((valuationStory.historicalPE.current -
                        valuationStory.historicalPE.fiveYearAvg) /
                        valuationStory.historicalPE.fiveYearAvg) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="pt-2">
                  <Badge variant="outline" className="w-full justify-center">
                    Above average, not at peak
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COLUMN 2: Peak & Trough */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">Peak & Trough</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    5Y High:
                  </span>
                  <div className="text-right">
                    <div className="font-bold">
                      {valuationStory.historicalPE.fiveYearHigh}x
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Dec 2021
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">5Y Low:</span>
                  <div className="text-right">
                    <div className="font-bold">
                      {valuationStory.historicalPE.fiveYearLow}x
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Mar 2020
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    vs High:
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-500">
                    -
                    {(
                      ((valuationStory.historicalPE.fiveYearHigh -
                        valuationStory.historicalPE.current) /
                        valuationStory.historicalPE.fiveYearHigh) *
                      100
                    ).toFixed(0)}
                    % cheaper
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">vs Low:</span>
                  <span className="font-semibold text-red-600 dark:text-red-500">
                    +
                    {(
                      ((valuationStory.historicalPE.current -
                        valuationStory.historicalPE.fiveYearLow) /
                        valuationStory.historicalPE.fiveYearLow) *
                      100
                    ).toFixed(0)}
                    % higher
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COLUMN 3: Mean Reversion Risk */}
          <Card className="hover:shadow-lg transition-shadow border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-base">Mean Reversion Risk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    5Y Average:
                  </span>
                  <span className="text-xl font-bold">
                    {valuationStory.historicalPE.fiveYearAvg}x
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Premium to avg:
                  </span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-500">
                    +
                    {(
                      ((valuationStory.historicalPE.current -
                        valuationStory.historicalPE.fiveYearAvg) /
                        valuationStory.historicalPE.fiveYearAvg) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    If P/E reverts to mean:
                  </span>
                  <div className="font-semibold text-red-600 dark:text-red-500 mt-1">
                    Stock could fall{" "}
                    {(
                      ((valuationStory.historicalPE.current -
                        valuationStory.historicalPE.fiveYearAvg) /
                        valuationStory.historicalPE.current) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <div className="pt-2">
                  <Badge variant="secondary" className="w-full justify-center">
                    🟡 Moderate Risk
                  </Badge>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Elevated but not extreme
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Interpretation */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-2xl">🤖</div>
              <div className="flex-1 space-y-2">
                <div className="font-semibold">AI Interpretation</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stock is trading in the upper range of its historical
                  valuation, at the {valuationStory.historicalPE.percentile}nd
                  percentile. It's not at peak levels (was{" "}
                  {valuationStory.historicalPE.fiveYearHigh}x in late 2021), but
                  definitely above its 5-year average of{" "}
                  {valuationStory.historicalPE.fiveYearAvg}x. If business
                  performance disappoints or market sentiment shifts, there's
                  risk of 'multiple compression' - P/E falling back toward
                  average, even if earnings stay flat.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: PEER VALUATION COMPARISON */}
      <div id="peer-valuation" className="space-y-4 pt-8 border-t">
        {/* Storytelling Introduction */}
        <div className="text-sm text-muted-foreground italic">
          "Let's see how this stock is valued relative to competitors"
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            ⚖️ Peer Valuation Benchmarking
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Compare valuations across banking sector leaders
          </p>
        </div>

        {/* Detailed Comparison Table */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Banking Sector Valuation Comparison</CardTitle>
            <CardDescription>
              Color coded: Green = Better than peers, Red = Worse than peers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-semibold">
                      Company
                    </th>
                    <th className="text-right py-3 px-2 font-semibold">
                      Price
                    </th>
                    <th className="text-right py-3 px-2 font-semibold">P/E</th>
                    <th className="text-right py-3 px-2 font-semibold">P/B</th>
                    <th className="text-right py-3 px-2 font-semibold">
                      EV/EBITDA
                    </th>
                    <th className="text-right py-3 px-2 font-semibold">
                      Div Yield
                    </th>
                    <th className="text-right py-3 px-2 font-semibold">ROE</th>
                    <th className="text-left py-3 px-2 font-semibold">
                      Valuation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {peerData.map((peer) => {
                    const score = getValuationScore(peer);
                    return (
                      <tr
                        key={peer.symbol}
                        className={`border-b ${
                          peer.isCurrent
                            ? "bg-primary/10 border-primary/30 font-medium"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <td className="py-3 px-2">
                          {peer.company}
                          {peer.isCurrent && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Current
                            </Badge>
                          )}
                        </td>
                        <td className="text-right py-3 px-2">
                          ₹{peer.price.toLocaleString("en-IN")}
                        </td>
                        <td
                          className={`text-right py-3 px-2 ${getPeerCellStyle(peer.pe, peerAverages.pe, true)}`}
                        >
                          {peer.pe}x
                        </td>
                        <td
                          className={`text-right py-3 px-2 ${getPeerCellStyle(peer.pb, peerAverages.pb, true)}`}
                        >
                          {peer.pb}x
                        </td>
                        <td
                          className={`text-right py-3 px-2 ${getPeerCellStyle(peer.evEbitda, peerAverages.evEbitda, true)}`}
                        >
                          {peer.evEbitda}x
                        </td>
                        <td
                          className={`text-right py-3 px-2 ${getPeerCellStyle(peer.dividendYield, peerAverages.dividendYield)}`}
                        >
                          {peer.dividendYield}%
                        </td>
                        <td
                          className={`text-right py-3 px-2 ${getPeerCellStyle(peer.roe, peerAverages.roe)}`}
                        >
                          {peer.roe}%
                        </td>
                        <td className="text-left py-3 px-2">
                          <Badge variant={score.variant}>{score.badge}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/30">
                    <td className="py-3 px-2 font-semibold">Peer Average</td>
                    <td className="text-right py-3 px-2">-</td>
                    <td className="text-right py-3 px-2 font-semibold">
                      {peerAverages.pe.toFixed(1)}x
                    </td>
                    <td className="text-right py-3 px-2 font-semibold">
                      {peerAverages.pb.toFixed(1)}x
                    </td>
                    <td className="text-right py-3 px-2 font-semibold">
                      {peerAverages.evEbitda.toFixed(1)}x
                    </td>
                    <td className="text-right py-3 px-2 font-semibold">
                      {peerAverages.dividendYield.toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-2 font-semibold">
                      {peerAverages.roe.toFixed(1)}%
                    </td>
                    <td className="text-left py-3 px-2">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Scatter Plot Visualization */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Quality vs Price Scatter Plot</CardTitle>
            <CardDescription>
              P/E (price paid) vs ROE (quality received) - Position relative to
              fair value line
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-92 border rounded-lg p-8 bg-muted/20">
              {/* Axes labels */}
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-muted-foreground">
                P/E Ratio (Price Paid) →
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground">
                ROE % (Quality) →
              </div>

              {/* Chart area */}
              <div className="ml-8 mr-4 mb-8 mt-4 h-[85%] relative">
                {/* Y-axis (P/E) */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-muted-foreground">
                  <div>25</div>
                  <div>20</div>
                  <div>15</div>
                  <div>10</div>
                  <div>5</div>
                </div>

                {/* X-axis (ROE) */}
                <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-muted-foreground">
                  <div>10%</div>
                  <div>12%</div>
                  <div>14%</div>
                  <div>16%</div>
                  <div>18%</div>
                  <div>20%</div>
                </div>

                {/* Grid and fair value line */}
                <div className="absolute inset-0 ml-8 mb-6">
                  {/* Fair value diagonal line */}
                  <svg className="absolute inset-0 w-full h-full">
                    <line
                      x1="0"
                      y1="100%"
                      x2="100%"
                      y2="0"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="text-primary/50"
                    />
                  </svg>
                  <div className="absolute top-2 right-2 text-xs text-primary/70 font-medium">
                    ← Fair Value Zone
                  </div>
                  <div className="absolute top-1/4 left-1/4 text-xs text-muted-foreground rotate-[-45deg]">
                    Expensive
                  </div>
                  <div className="absolute bottom-1/4 right-1/4 text-xs text-muted-foreground rotate-[-45deg]">
                    Cheap
                  </div>

                  {/* Plot peer bubbles */}
                  {peerData.map((peer) => {
                    // Position calculation (ROE 10-20% maps to 0-100%, P/E 5-25 maps to 100%-0%)
                    const xPos = ((peer.roe - 10) / 10) * 100;
                    const yPos = 100 - ((peer.pe - 5) / 20) * 100;
                    const size = Math.sqrt(peer.marketCap / 10000); // Scale bubble size

                    return (
                      <div
                        key={peer.symbol}
                        className="absolute transition-all hover:scale-110 cursor-pointer group"
                        style={{
                          left: `${xPos}%`,
                          top: `${yPos}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <div
                          className={`rounded-full border-2 flex items-center justify-center ${
                            peer.isCurrent
                              ? "bg-primary border-primary shadow-lg"
                              : "bg-background border-muted-foreground/30"
                          }`}
                          style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            minWidth: "40px",
                            minHeight: "40px",
                          }}
                        >
                          <span
                            className={`text-xs font-bold ${peer.isCurrent ? "text-primary-foreground" : "text-foreground"}`}
                          >
                            {peer.symbol.slice(0, 4)}
                          </span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover border rounded-lg p-2 shadow-lg whitespace-nowrap text-xs z-10">
                          <div className="font-semibold">{peer.company}</div>
                          <div className="text-muted-foreground">
                            P/E: {peer.pe}x | ROE: {peer.roe}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 text-xs pt-4 border-t mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary border-2 border-primary" />
                <span className="text-muted-foreground">Current Stock</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-background border-2 border-muted-foreground/30" />
                <span className="text-muted-foreground">Peers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground">
                  Bubble size = Market Cap
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interpretation Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">
              📊 Valuation Positioning Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                  →
                </span>
                <p className="text-muted-foreground">
                  <strong>
                    HDFC trades at 2nd highest P/E but also has 2nd highest ROE
                  </strong>{" "}
                  - The premium pricing reflects quality
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                  →
                </span>
                <p className="text-muted-foreground">
                  <strong>
                    Premium of 30% over sector seems justified by 9% higher ROE
                  </strong>{" "}
                  - You pay more but get better returns
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                  →
                </span>
                <p className="text-muted-foreground">
                  <strong>Kotak more expensive with lower ROE</strong> - HDFC
                  relatively better value for quality
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                  →
                </span>
                <p className="text-muted-foreground">
                  <strong>
                    Axis and SBI offer value but with lower quality (ROE 14-15%)
                  </strong>{" "}
                  - Cheaper but higher risk
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                  →
                </span>
                <p className="text-muted-foreground">
                  <strong>
                    Trade-off: Pay premium for quality or buy cheaper with more
                    risk
                  </strong>{" "}
                  - Investment style dependent
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 5: GROWTH-ADJUSTED VALUATION (PEG Analysis) */}
      <div id="peg-analysis" className="space-y-4 pt-8 border-t">
        {/* Storytelling Introduction */}
        <div className="text-sm text-muted-foreground italic">
          "Is the price justified by growth? Let's check"
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            🚀 Growth vs Price Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Understanding if growth justifies the valuation premium
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT COLUMN (60%) - PEG Explanation */}
          <div className="lg:col-span-3 space-y-4">
            {/* Educational Box */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-lg">💡 What is PEG Ratio?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center py-4 bg-background/50 rounded-lg border">
                  <div className="text-2xl font-bold">
                    PEG Ratio = P/E ÷ Growth Rate
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  It tells you if you're paying too much for growth
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs pt-2">
                  <div className="text-center p-2 bg-green-100 dark:bg-green-900/20 rounded border border-green-300 dark:border-green-800">
                    <div className="font-bold text-green-700 dark:text-green-400">
                      PEG &lt; 1
                    </div>
                    <div className="text-muted-foreground">Good Value</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded border border-yellow-300 dark:border-yellow-800">
                    <div className="font-bold text-yellow-700 dark:text-yellow-400">
                      PEG 1-1.5
                    </div>
                    <div className="text-muted-foreground">Fair</div>
                  </div>
                  <div className="text-center p-2 bg-red-100 dark:bg-red-900/20 rounded border border-red-300 dark:border-red-800">
                    <div className="font-bold text-red-700 dark:text-red-400">
                      PEG &gt; 2
                    </div>
                    <div className="text-muted-foreground">Expensive</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Analysis */}
            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Current PEG Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      P/E Ratio
                    </div>
                    <div className="text-2xl font-bold">
                      {pegData.currentPE}x
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Expected Growth
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                      {pegData.expectedGrowth}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      PEG Ratio
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {pegData.currentPEG}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Assessment:</span>
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Fair (Growth justifies P/E)
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    At {pegData.currentPE}x P/E with {pegData.expectedGrowth}%
                    growth, you're paying about ₹{pegData.currentPEG} for each
                    percentage point of growth. This is considered reasonable -
                    not a bargain, but not egregious. The valuation is
                    growth-appropriate.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Scenario Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scenario Analysis</CardTitle>
                <CardDescription>
                  What happens if growth expectations change?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-semibold">
                          If Growth Is:
                        </th>
                        <th className="text-center py-2 px-3 font-semibold">
                          Then PEG Would Be:
                        </th>
                        <th className="text-left py-2 px-3 font-semibold">
                          Assessment:
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pegData.scenarios.map((scenario, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-3">
                            <div className="font-medium">{scenario.growth}</div>
                            <div className="text-xs text-muted-foreground">
                              ({scenario.label})
                            </div>
                          </td>
                          <td className="text-center py-3 px-3 font-semibold">
                            {scenario.peg}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="outline">
                              {scenario.assessment}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN (40%) - Peer PEG Comparison */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Peer PEG Comparison</CardTitle>
                <CardDescription>
                  Growth-adjusted value across peers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">
                          Company
                        </th>
                        <th className="text-right py-2 font-semibold">P/E</th>
                        <th className="text-right py-2 font-semibold">
                          Growth
                        </th>
                        <th className="text-right py-2 font-semibold">PEG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pegData.peerPEG.map((peer, idx) => (
                        <tr
                          key={idx}
                          className={`border-b ${
                            peer.company === "HDFC Bank"
                              ? "bg-primary/10 font-medium"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <td className="py-3">
                            {peer.company}
                            {peer.company === "HDFC Bank" && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                You
                              </Badge>
                            )}
                          </td>
                          <td className="text-right py-3">{peer.pe}x</td>
                          <td className="text-right py-3">{peer.growth}%</td>
                          <td className="text-right py-3 font-semibold">
                            {peer.peg}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bar Chart */}
                <div className="pt-4 border-t">
                  <div className="text-xs font-semibold text-muted-foreground mb-3">
                    PEG RATIO COMPARISON
                  </div>
                  <div className="space-y-3">
                    {pegData.peerPEG.map((peer, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span
                            className={
                              peer.company === "HDFC Bank"
                                ? "font-semibold"
                                : ""
                            }
                          >
                            {peer.company}
                          </span>
                          <span className="font-semibold">{peer.peg}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              peer.company === "HDFC Bank"
                                ? "bg-primary"
                                : peer.peg < 1
                                  ? "bg-green-500"
                                  : peer.peg < 1.3
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min((peer.peg / 2) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                    <span>0</span>
                    <span>1.0 (Fair)</span>
                    <span>2.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Insight */}
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="text-base">💡 Key Insight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  HDFC's PEG of {pegData.currentPEG} is middle-of-pack. ICICI
                  and Axis offer better growth-adjusted value. Kotak is more
                  expensive for slower growth. SBI is cheapest but growth
                  expectations are modest. Choose based on your risk-reward
                  preference.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* SECTION 6: INTRINSIC VALUE ESTIMATES */}
      <div id="intrinsic-value" className="space-y-4 pt-8 border-t">
        {/* Storytelling Introduction */}
        <div className="text-sm text-muted-foreground italic">
          "Let's estimate what the business might be fundamentally worth"
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            💎 Fair Value Assessment
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Multiple approaches to estimate intrinsic value
          </p>
        </div>

        {/* DISCLAIMER BOX */}
        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700 border-2">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">
                  Important Disclaimer
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Valuation is not an exact science. These are estimates based
                  on assumptions. Different methods give different answers. Use
                  as reference, not absolute truth.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* THREE VALUATION APPROACHES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Approach 1: PE-Based Valuation */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">Approach 1: P/E Based</CardTitle>
              <CardDescription>
                Historical average with quality premium
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Fair P/E estimate:
                  </span>
                  <span className="font-semibold">
                    {intrinsicValue.peMethod.fairPE}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current EPS:</span>
                  <span className="font-semibold">
                    ₹{intrinsicValue.currentEPS}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fair Value:</span>
                    <span className="text-xl font-bold text-primary">
                      ₹
                      {intrinsicValue.peMethod.fairValue.toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="font-semibold">
                    ₹{stockData.currentPrice.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Variance:</span>
                  <Badge variant="destructive" className="font-semibold">
                    +{intrinsicValue.peMethod.variance}%
                  </Badge>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground italic">
                  {intrinsicValue.peMethod.interpretation}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Approach 2: PB-Based Valuation */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">Approach 2: P/B Based</CardTitle>
              <CardDescription>
                Sector average with quality adjustment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Fair P/B estimate:
                  </span>
                  <span className="font-semibold">
                    {intrinsicValue.pbMethod.fairPB}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Book Value/Share:
                  </span>
                  <span className="font-semibold">
                    ₹{intrinsicValue.currentBookValue}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fair Value:</span>
                    <span className="text-xl font-bold text-primary">
                      ₹
                      {intrinsicValue.pbMethod.fairValue.toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="font-semibold">
                    ₹{stockData.currentPrice.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Variance:</span>
                  <Badge variant="secondary" className="font-semibold">
                    +{intrinsicValue.pbMethod.variance}%
                  </Badge>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground italic">
                  {intrinsicValue.pbMethod.interpretation}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Approach 3: DCF-Based Estimate */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">Approach 3: DCF Based</CardTitle>
              <CardDescription>Discounted cash flow model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assumptions:</span>
                  <span className="font-semibold text-xs text-right">
                    {intrinsicValue.dcfMethod.growthRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount rate:</span>
                  <span className="font-semibold">
                    {intrinsicValue.dcfMethod.discountRate}%
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Fair Value Range:
                    </span>
                    <span className="text-base font-bold text-primary">
                      ₹
                      {intrinsicValue.dcfMethod.intrinsicRangeLow.toLocaleString(
                        "en-IN",
                      )}{" "}
                      - ₹
                      {intrinsicValue.dcfMethod.intrinsicRangeHigh.toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="font-semibold">
                    ₹{stockData.currentPrice.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Assessment:</span>
                  <Badge variant="outline" className="font-semibold">
                    Within range
                  </Badge>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground italic">
                  {intrinsicValue.dcfMethod.interpretation}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CONSENSUS VIEW - Visual Gauge */}
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle>Consensus Fair Value Range</CardTitle>
            <CardDescription>
              Where does current price sit relative to estimated fair value?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Gauge */}
            <div className="space-y-3">
              <div className="relative h-12">
                {/* Background gradient bar */}
                <div className="absolute top-4 left-0 right-0 h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />

                {/* Range markers */}
                <div className="absolute top-0 left-0 right-0 flex justify-between text-xs">
                  <div className="flex flex-col items-start">
                    <div className="h-8 w-px bg-foreground/30" />
                    <span className="text-muted-foreground mt-1">
                      Undervalued
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-px bg-foreground/50" />
                    <span className="text-muted-foreground mt-1 font-semibold">
                      Fair Zone
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="h-8 w-px bg-foreground/30" />
                    <span className="text-muted-foreground mt-1">
                      Overvalued
                    </span>
                  </div>
                </div>

                {/* Current price marker */}
                <div
                  className="absolute top-2"
                  style={{
                    left: `${
                      ((stockData.currentPrice -
                        intrinsicValue.fairValueRange.undervalued) /
                        (intrinsicValue.fairValueRange.overvalued -
                          intrinsicValue.fairValueRange.undervalued)) *
                      100
                    }%`,
                  }}
                >
                  <div className="relative -translate-x-1/2">
                    <div className="w-8 h-8 bg-primary border-4 border-background rounded-full shadow-lg" />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-primary">
                      Current
                    </div>
                  </div>
                </div>
              </div>

              {/* Price labels */}
              <div className="flex justify-between text-xs pt-8">
                <div className="text-center">
                  <div className="font-semibold">
                    ₹
                    {intrinsicValue.fairValueRange.undervalued.toLocaleString(
                      "en-IN",
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">
                    ₹
                    {intrinsicValue.fairValueRange.fairLow.toLocaleString(
                      "en-IN",
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">
                    ₹{stockData.currentPrice.toLocaleString("en-IN")}
                  </div>
                  <div className="text-primary mt-1">↑ Current</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">
                    ₹
                    {intrinsicValue.fairValueRange.fairHigh.toLocaleString(
                      "en-IN",
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">
                    ₹
                    {intrinsicValue.fairValueRange.overvalued.toLocaleString(
                      "en-IN",
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Consensus Assessment */}
            <div className="pt-4 border-t">
              <div className="text-sm font-semibold mb-3">
                Method Consensus:
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">
                    PE Method
                  </div>
                  <div className="text-xs font-semibold">
                    Slightly expensive
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">
                    PB Method
                  </div>
                  <div className="text-xs font-semibold">Marginally rich</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">
                    DCF Method
                  </div>
                  <div className="text-xs font-semibold">Fair</div>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/30">
                  <div className="text-xs text-muted-foreground mb-1">
                    Overall
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    🟡 Fair to Slightly Expensive
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Summary */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-2xl">🤖</div>
              <div className="flex-1 space-y-2">
                <div className="font-semibold">AI Summary</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Most methods suggest stock is trading at or slightly above
                  intrinsic value. There's no significant margin of safety here
                  - you're paying roughly what it's worth, maybe 5-12% more. Not
                  egregiously overvalued, but not a bargain either. Best suited
                  for quality-focused investors willing to pay fair price for
                  good business.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 7: VALUATION RISKS & CONSIDERATIONS */}
      <div id="valuation-risks" className="space-y-4 pt-8 border-t">
        {/* Storytelling Introduction */}
        <div className="text-sm text-muted-foreground italic">
          "What risks come with buying at current valuation?"
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            ⚠️ Valuation Risk Assessment
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Understanding downside scenarios and what could go wrong
          </p>
        </div>

        {/* THREE RISK CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CARD 1: Multiple Compression Risk */}
          <Card className="border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">📉</span>
                Multiple Compression Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Risk
                  </div>
                  <p className="text-sm">
                    {valuationRisks.multipleCompression.risk}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Impact
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {valuationRisks.multipleCompression.impact}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">
                      Probability:
                    </span>
                    <Badge variant="secondary">
                      {valuationRisks.multipleCompression.probability}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Trigger:
                    </div>
                    <p className="text-xs">
                      {valuationRisks.multipleCompression.trigger}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: Growth Disappointment Risk */}
          <Card className="border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Growth Disappointment Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Risk
                  </div>
                  <p className="text-sm">
                    {valuationRisks.growthDisappointment.risk}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Impact
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {valuationRisks.growthDisappointment.impact}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">
                      Probability:
                    </span>
                    <Badge variant="secondary">
                      {valuationRisks.growthDisappointment.probability}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Trigger:
                    </div>
                    <p className="text-xs">
                      {valuationRisks.growthDisappointment.trigger}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: Rising Rate Risk */}
          <Card className="border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">💹</span>
                Rising Rate Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Risk
                  </div>
                  <p className="text-sm">{valuationRisks.risingRate.risk}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Impact
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {valuationRisks.risingRate.impact}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">
                      Probability:
                    </span>
                    <Badge variant="default">
                      {valuationRisks.risingRate.probability}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Trigger:
                    </div>
                    <p className="text-xs">
                      {valuationRisks.risingRate.trigger}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SCENARIO ANALYSIS TABLE */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>2-Year Return Scenarios</CardTitle>
            <CardDescription>
              What returns can you expect under different scenarios? (Current
              price: ₹{stockData.currentPrice.toLocaleString("en-IN")})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-3 px-2 font-semibold">
                      Scenario
                    </th>
                    <th className="text-center py-3 px-2 font-semibold">
                      EPS Growth
                    </th>
                    <th className="text-center py-3 px-2 font-semibold">P/E</th>
                    <th className="text-right py-3 px-2 font-semibold">
                      Price
                    </th>
                    <th className="text-right py-3 px-2 font-semibold">
                      Return
                    </th>
                    <th className="text-center py-3 px-2 font-semibold">
                      Probability
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {valuationRisks.scenarios.map((scenario, idx) => (
                    <tr
                      key={idx}
                      className={`border-b ${
                        scenario.scenario.includes("Best")
                          ? "bg-green-50 dark:bg-green-950/20"
                          : scenario.scenario.includes("Base")
                            ? "bg-blue-50 dark:bg-blue-950/20 font-medium"
                            : scenario.scenario.includes("Worst")
                              ? "bg-red-50 dark:bg-red-950/20"
                              : "hover:bg-muted/50"
                      }`}
                    >
                      <td className="py-3 px-2">
                        {scenario.scenario}
                        {scenario.scenario.includes("Base") && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Most Likely
                          </Badge>
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {scenario.epsGrowth}
                      </td>
                      <td className="text-center py-3 px-2">{scenario.pe}</td>
                      <td className="text-right py-3 px-2 font-semibold">
                        ₹{scenario.price.toLocaleString("en-IN")}
                      </td>
                      <td
                        className={`text-right py-3 px-2 font-bold ${
                          scenario.return.startsWith("+")
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500"
                        }`}
                      >
                        {scenario.return}
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="outline">{scenario.probability}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expected Value Calculation */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                <div>
                  <div className="text-sm font-semibold">
                    Probability-Weighted Expected Return
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Based on scenario probabilities
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                  +12.3%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Interpretation */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-2xl">🤖</div>
              <div className="flex-1 space-y-2">
                <div className="font-semibold">AI Risk Interpretation</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  At current valuation, you have moderate upside (+15% base
                  case) but also downside risk (-11% worst case). The
                  risk-reward is skewed slightly positive but not hugely
                  compelling. You're not getting a fat margin of safety.
                  Suitable if you're confident in business quality and can
                  tolerate 10-15% drawdowns. Not ideal for aggressive value
                  seekers or risk-averse investors.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 8: INVESTMENT DECISION FRAMEWORK */}
      <div id="investment-framework" className="space-y-4 pt-8 border-t">
        {/* Storytelling Introduction */}
        <div className="text-sm text-muted-foreground italic">
          "Let's tie it all together - what does this valuation mean for YOU?"
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            🎯 Valuation Verdict
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            What does current valuation mean for your investment decision?
          </p>
        </div>

        {/* OVERALL VALUATION SCORE CARD */}
        <Card className="border-4 border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-8 pb-6">
            <div className="text-center space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Overall Valuation Score
                </div>
                <div className="text-6xl font-bold text-primary mb-2">
                  70<span className="text-3xl">/100</span>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  🟡 Fair to Slightly Expensive
                </Badge>
              </div>
              <div className="max-w-2xl mx-auto pt-4 border-t">
                <p className="text-lg font-semibold text-foreground">
                  Quality business at quality price - no margin of safety
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FOR DIFFERENT INVESTOR TYPES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMN 1: Quality Investor */}
          <Card className="border-2 border-green-200 dark:border-green-800 hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
                <CardTitle className="text-lg">
                  If You're a Quality Investor
                </CardTitle>
              </div>
              <CardDescription className="text-xs italic">
                Seek best businesses, willing to pay fair price
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✅</span>
                  <span className="font-bold text-green-700 dark:text-green-400">
                    Yes, this works for you
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Reasoning
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You prioritize quality over price. HDFC offers exactly that -
                  strong fundamentals, predictable performance, lower risk. The
                  premium is the price you pay for sleep-well factor. Current
                  valuation isn't cheap but isn't excessive for quality.
                </p>
              </div>

              <div className="pt-3 border-t">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Recommended Action
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium">
                    ✓ Can invest, but maybe average-in over time rather than
                    lump sum
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COLUMN 2: Value Hunter */}
          <Card className="border-2 border-red-200 dark:border-red-800 hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
                <CardTitle className="text-lg">
                  If You're a Value Hunter
                </CardTitle>
              </div>
              <CardDescription className="text-xs italic">
                Seek bargains, want margin of safety
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">❌</span>
                  <span className="font-bold text-red-700 dark:text-red-400">
                    Not ideal for your style
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Reasoning
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stock is trading at premium valuations with little margin of
                  safety. If you're hunting for 'cheap' stocks where Mr. Market
                  has created opportunity, look elsewhere. Axis Bank or SBI
                  offer better value metrics, though with higher risk.
                </p>
              </div>

              <div className="pt-3 border-t">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Recommended Action
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium">
                    ⏳ Wait for correction (10-15% dip) or skip this one
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COLUMN 3: Growth-Focused */}
          <Card className="border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                <CardTitle className="text-lg">
                  If You're Growth-Focused
                </CardTitle>
              </div>
              <CardDescription className="text-xs italic">
                Willing to pay up for high growth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚠️</span>
                  <span className="font-bold text-yellow-700 dark:text-yellow-400">
                    Moderate fit
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Reasoning
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Growth of 15-18% is good but not explosive. If you want
                  25-30%+ growth, you'll need to look at different sectors
                  (tech, consumer discretionary). This is 'growth at reasonable
                  price' not pure growth. The valuation already prices in the
                  growth.
                </p>
              </div>

              <div className="pt-3 border-t">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Recommended Action
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium">
                    🤔 Consider if you want steady compounding, not if you want
                    rockets
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KEY TAKEAWAYS */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-lg">📋 What You Need to Know</CardTitle>
            <CardDescription>
              Key valuation takeaways at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-bold">
                  →
                </span>
                <p className="text-sm font-medium">
                  You're paying fair price for excellent quality
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-bold">
                  →
                </span>
                <p className="text-sm font-medium">
                  Limited margin of safety - price already reflects good news
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-bold">
                  →
                </span>
                <p className="text-sm font-medium">
                  Best for long-term quality investors, not value seekers
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-bold">
                  →
                </span>
                <p className="text-sm font-medium">
                  Downside protected by fundamentals, upside limited by
                  valuation
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-bold">
                  →
                </span>
                <p className="text-sm font-medium">
                  Time horizon should be 3-5+ years, not 6-12 months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 9: WHAT'S NEXT (Navigation) */}
      <div id="whats-next" className="space-y-4 pt-8 border-t">
        {/* Storytelling Introduction */}
        <div className="text-sm text-muted-foreground italic">
          "Made up your mind about valuation? Here's what to check next:"
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">🧭 What's Next?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Continue your analysis journey
          </p>
        </div>

        {/* Three Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CARD 1: Technical Tab */}
          <Card className="border-2 hover:shadow-lg transition-all group">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <TrendingUpDown className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    See the Technical Picture
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Check price trends, support/resistance, momentum indicators
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/research/stock-screener/${symbol}?tab=technical`}
                  >
                    <Badge
                      variant="outline"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      📈 Go to Technical Tab →
                    </Badge>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: Activity Tab */}
          <Card className="border-2 hover:shadow-lg transition-all group">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    Who's Buying This Stock?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    See institutional flows, insider activity, ownership
                    patterns
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/research/stock-screener/${symbol}?tab=activity`}
                  >
                    <Badge
                      variant="outline"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      🏢 Go to Activity Tab →
                    </Badge>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: News Tab */}
          <Card className="border-2 hover:shadow-lg transition-all group">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Newspaper className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Check Latest News</h3>
                  <p className="text-sm text-muted-foreground">
                    Stay updated on recent developments and announcements
                  </p>
                </div>
                <div className="pt-2">
                  <Link href={`/research/stock-screener/${symbol}?tab=news`}>
                    <Badge
                      variant="outline"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      📰 Go to News Tab →
                    </Badge>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final CTA */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember: Valuation is just one piece of the puzzle. Consider
              fundamentals, technicals, and your own financial goals before
              making any investment decision.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Valuation;
