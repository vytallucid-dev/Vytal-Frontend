"use client";

import { StockAutocomplete } from "@/components/stock-autocomplete";
import { TrendingUp, TrendingDown, Star, FileText } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { indianStocks, Stock } from "@/lib/indian-stocks-data";
import { useRouter } from "next/navigation";

// Sample stocks with recent results
const recentResults = [
  { ticker: "HDFCBANK", name: "HDFC Bank", trend: "up" },
  { ticker: "TCS", name: "Tata Consultancy Services", trend: "up" },
  { ticker: "INFY", name: "Infosys Ltd", trend: "up" },
  { ticker: "RELIANCE", name: "Reliance Industries", trend: "up" },
  { ticker: "ICICIBANK", name: "ICICI Bank", trend: "up" },
  { ticker: "TATAMOTORS", name: "Tata Motors", trend: "down" },
  { ticker: "BHARTIARTL", name: "Bharti Airtel", trend: "up" },
  { ticker: "ITC", name: "ITC Ltd", trend: "up" },
];

export default function ResultsSearchPage() {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const router = useRouter();

  const handleStockClick = (ticker: string) => {
    router.push(`/results/${ticker}`);
  };

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    router.push(`/results/${stock.symbol}`);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-12 pt-0">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mx-auto text-center space-y-12"
      >
        {/* Title and Description */}
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
          >
            Quarterly Results
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Search and view detailed quarterly results with AI-powered analysis, margins, and comprehensive visualizations
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex items-center justify-center gap-2 mt-3"
          >
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs font-medium text-primary">Current Quarter: Q4 FY26</span>
            </div>
          </motion.div>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <StockAutocomplete 
            stocks={indianStocks}
            onStockSelect={handleStockSelect}
            placeholder="Search for company results by ticker or name..."
          />
        </motion.div>

        {/* Recent Results */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Recent Results</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-8 max-w-3xl mx-auto">
            {recentResults.map((stock, index) => (
              <motion.button
                key={stock.ticker}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.5 + (index * 0.05),
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
                onClick={() => handleStockClick(stock.ticker)}
                className={`
                  group relative px-4 py-2 rounded-full border transition-all duration-300 hover:scale-105 hover:shadow-lg
                  ${selectedStock?.symbol === stock.ticker 
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                    : 'bg-background/60 border-border/50 hover:border-primary/50 hover:bg-background/80'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{stock.ticker}</span>
                  <div className="flex items-center gap-1">
                    {stock.trend === "up" ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>
                <span className="text-xs opacity-70 hidden group-hover:block absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-background border border-border rounded px-2 py-1 shadow-lg">
                  {stock.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Subtle background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-3/4 left-3/4 w-24 h-24 bg-green-500/5 rounded-full blur-2xl" />
        </div>
      </motion.div>
    </div>
  );
}
