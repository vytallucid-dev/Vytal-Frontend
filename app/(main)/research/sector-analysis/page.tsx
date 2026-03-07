"use client";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Building2,
  DollarSign,
  Percent,
  Volume2,
  Zap,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

// Sample sector data with comprehensive metrics
const sectorData = [
  {
    sector: "Technology",
    performance: 8.5,
    marketCap: "12.8T",
    companies: 156,
    avgPE: 28.5,
    divYield: 1.2,
    volatility: "Medium",
    volume: "High",
    momentum: 85,
    topStocks: [
      { ticker: "AAPL", performance: 12.3, marketCap: "2.8T" },
      { ticker: "MSFT", performance: 9.1, marketCap: "2.4T" },
      { ticker: "GOOGL", performance: 7.8, marketCap: "1.6T" },
      { ticker: "NVDA", performance: 15.2, marketCap: "1.1T" },
    ],
  },
  {
    sector: "Healthcare",
    performance: 6.2,
    marketCap: "4.2T",
    companies: 89,
    avgPE: 22.1,
    divYield: 2.8,
    volatility: "Low",
    volume: "Medium",
    momentum: 72,
    topStocks: [
      { ticker: "JNJ", performance: 5.1, marketCap: "456B" },
      { ticker: "PFE", performance: 4.8, marketCap: "234B" },
      { ticker: "UNH", performance: 8.9, marketCap: "523B" },
      { ticker: "MRNA", performance: 12.4, marketCap: "45B" },
    ],
  },
  {
    sector: "Financial",
    performance: 4.1,
    marketCap: "6.8T",
    companies: 124,
    avgPE: 18.7,
    divYield: 3.2,
    volatility: "Medium",
    volume: "High",
    momentum: 68,
    topStocks: [
      { ticker: "JPM", performance: 3.8, marketCap: "567B" },
      { ticker: "BAC", performance: 2.9, marketCap: "298B" },
      { ticker: "WFC", performance: 1.2, marketCap: "234B" },
      { ticker: "GS", performance: 6.7, marketCap: "145B" },
    ],
  },
  {
    sector: "Energy",
    performance: -2.1,
    marketCap: "2.1T",
    companies: 67,
    avgPE: 12.4,
    divYield: 5.8,
    volatility: "High",
    volume: "Medium",
    momentum: 45,
    topStocks: [
      { ticker: "XOM", performance: -1.8, marketCap: "389B" },
      { ticker: "CVX", performance: -0.9, marketCap: "287B" },
      { ticker: "COP", performance: -3.2, marketCap: "156B" },
      { ticker: "EOG", performance: -2.8, marketCap: "89B" },
    ],
  },
  {
    sector: "Consumer Discretionary",
    performance: 3.7,
    marketCap: "3.9T",
    companies: 198,
    avgPE: 24.8,
    divYield: 1.9,
    volatility: "Medium",
    volume: "High",
    momentum: 76,
    topStocks: [
      { ticker: "AMZN", performance: 5.2, marketCap: "1.4T" },
      { ticker: "TSLA", performance: 8.9, marketCap: "785B" },
      { ticker: "HD", performance: 2.1, marketCap: "345B" },
      { ticker: "NKE", performance: 1.8, marketCap: "178B" },
    ],
  },
  {
    sector: "Communication",
    performance: 1.9,
    marketCap: "2.8T",
    companies: 45,
    avgPE: 21.3,
    divYield: 2.4,
    volatility: "Medium",
    volume: "Medium",
    momentum: 62,
    topStocks: [
      { ticker: "META", performance: 3.4, marketCap: "789B" },
      { ticker: "NFLX", performance: 2.8, marketCap: "167B" },
      { ticker: "DIS", performance: -0.5, marketCap: "234B" },
      { ticker: "VZ", performance: 0.8, marketCap: "156B" },
    ],
  },
  {
    sector: "Consumer Staples",
    performance: 2.8,
    marketCap: "1.8T",
    companies: 78,
    avgPE: 19.6,
    divYield: 3.5,
    volatility: "Low",
    volume: "Low",
    momentum: 58,
    topStocks: [
      { ticker: "PG", performance: 3.1, marketCap: "389B" },
      { ticker: "KO", performance: 2.9, marketCap: "267B" },
      { ticker: "PEP", performance: 2.2, marketCap: "234B" },
      { ticker: "WMT", performance: 3.8, marketCap: "456B" },
    ],
  },
  {
    sector: "Industrials",
    performance: 5.4,
    marketCap: "3.2T",
    companies: 234,
    avgPE: 20.9,
    divYield: 2.7,
    volatility: "Medium",
    volume: "Medium",
    momentum: 78,
    topStocks: [
      { ticker: "BA", performance: 4.2, marketCap: "145B" },
      { ticker: "CAT", performance: 6.8, marketCap: "178B" },
      { ticker: "GE", performance: 5.9, marketCap: "123B" },
      { ticker: "MMM", performance: 3.7, marketCap: "89B" },
    ],
  },
];

const getPerformanceColor = (performance: number) => {
  if (performance >= 7)
    return "from-emerald-500/20 to-green-600/30 text-foreground border-emerald-400/20";
  if (performance >= 4)
    return "from-green-400/20 to-emerald-500/25 text-foreground border-green-300/20";
  if (performance >= 1)
    return "from-amber-400/20 to-yellow-500/25 text-foreground border-amber-300/20";
  if (performance >= -2)
    return "from-orange-400/20 to-red-500/25 text-foreground border-orange-300/20";
  return "from-red-500/20 to-rose-600/30 text-foreground border-red-400/20";
};

const getStockPerformanceColor = (performance: number) => {
  if (performance >= 7) return "text-green-400";
  if (performance >= 3) return "text-green-300";
  if (performance >= 0) return "text-yellow-300";
  return "text-red-300";
};

const getVolatilityColor = (volatility: string) => {
  if (volatility === "Low") return "text-emerald-600 font-medium";
  if (volatility === "Medium") return "text-amber-600 font-medium";
  return "text-rose-600 font-medium";
};

const getVolumeIcon = (volume: string) => {
  if (volume === "High")
    return <Volume2 className="w-4 h-4 text-muted-foreground" />;
  if (volume === "Medium")
    return <Volume2 className="w-4 h-4 text-muted-foreground/80" />;
  return <Volume2 className="w-4 h-4 text-muted-foreground/60" />;
};

const handleSectorClick = (sector: string) => {
  // Navigate to detailed sector page
  window.location.href = `/research/sector-analysis/${sector.toLowerCase().replace(/\s+/g, "-")}`;
};

const SectorAnalysisPage = () => {
  return (
    <div className="space-y-6 py-6 px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Sector Analysis
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore market sectors through an interactive heatmap showing
          performance and top stocks
        </p>

        {/* Performance Legend */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-emerald-500/30 to-green-600/40 rounded border border-emerald-500/20"></div>
            <span>Strong Growth (7%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-amber-400/30 to-yellow-500/40 rounded border border-amber-400/20"></div>
            <span>Moderate (1-7%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-red-500/30 to-rose-600/40 rounded border border-red-500/20"></div>
            <span>Decline (-2%+)</span>
          </div>
        </div>
      </motion.div>

      {/* Heatmap Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {sectorData.map((sector, index) => (
          <motion.div
            key={sector.sector}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.3 + index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            onClick={() => handleSectorClick(sector.sector)}
            className={`
              relative cursor-pointer rounded-2xl border backdrop-blur-sm transition-all duration-300 overflow-hidden group hover:scale-[1.02] hover:shadow-lg
              bg-gradient-to-br ${getPerformanceColor(sector.performance)}
              h-64 shadow-sm hover:shadow-md
            `}
          >
            {/* Subtle glassmorphism overlay */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

            {/* Content */}
            <div className="p-6 relative z-10 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-foreground">
                    {sector.sector}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{sector.companies} companies</span>
                  </div>
                </div>
              </div>

              {/* Key Metrics - Simplified */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-center">
                  <Badge className="text-sm font-bold bg-purple-500/20 text-purple-200">
                    {sector.avgPE}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-2">P/E Ratio</div>
                </div>
                <div className="text-center">
                  <Badge className="text-sm font-bold bg-blue-500/20 text-blue-200 ">
                    {sector.marketCap}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-2">
                    Market Cap
                  </div>
                </div>
                <div className="text-center">
                  <Badge
                    variant={
                      sector.performance >= 0 ? "success" : "destructive"
                    }
                    className={`text-sm font-bold`}
                  >
                    {sector.performance >= 0 ? "+" : ""}
                    {sector.performance}%
                  </Badge>
                  <div className="text-xs mt-2 text-muted-foreground">YTD</div>
                </div>
              </div>

              {/* Bottom Section - Simplified */}
              <div className="mt-auto">
                {/* Momentum Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2 text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Momentum
                    </span>
                    <span className="font-semibold text-foreground">
                      {sector.momentum}%
                    </span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sector.momentum}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                    />
                  </div>
                </div>

                {/* Click indicator */}
                <div className="text-center text-xs text-muted-foreground/75 group-hover:text-muted-foreground transition-colors">
                  Click for detailed analysis
                </div>
              </div>
            </div>

            {/* Subtle background pattern */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/15 transition-all duration-500"></div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default SectorAnalysisPage;
