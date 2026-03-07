"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Calculator,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import React, { useMemo, useState } from "react";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stock: NewHolding) => void;
  currentPortfolioValue: number;
  currentSectorAllocation: { sector: string; percentage: number }[];
}

interface NewHolding {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice: number;
  healthScore: number;
  sector: string;
  marketCap: "Large" | "Mid" | "Small";
  investmentType?: "growth" | "dividend" | "value" | "speculation" | "other";
  targetPrice?: number;
  stopLoss?: number;
  notes?: string;
  tags?: string[];
}

interface StockSearchResult {
  symbol: string;
  name: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  healthScore: number;
  sector: string;
  marketCap: "Large" | "Mid" | "Small";
}

const AddStockModal = ({
  isOpen,
  onClose,
  onAdd,
  currentPortfolioValue,
  currentSectorAllocation,
}: AddStockModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(
    null,
  );

  // Form fields
  const [quantity, setQuantity] = useState<string>("");
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [investmentType, setInvestmentType] = useState<string>("growth");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Mock stock database for search
  const stockDatabase: StockSearchResult[] = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      currentPrice: 175.25,
      dayChange: 3.5,
      dayChangePercent: 2.04,
      healthScore: 88,
      sector: "Technology",
      marketCap: "Large",
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      currentPrice: 368.5,
      dayChange: -1.85,
      dayChangePercent: -0.5,
      healthScore: 85,
      sector: "Technology",
      marketCap: "Large",
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      currentPrice: 142.8,
      dayChange: 1.43,
      dayChangePercent: 1.01,
      healthScore: 82,
      sector: "Technology",
      marketCap: "Large",
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      currentPrice: 485.5,
      dayChange: 15.2,
      dayChangePercent: 3.23,
      healthScore: 86,
      sector: "Technology",
      marketCap: "Large",
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      currentPrice: 215.3,
      dayChange: -4.25,
      dayChangePercent: -1.96,
      healthScore: 32,
      sector: "Automotive",
      marketCap: "Large",
    },
    {
      symbol: "HDFC",
      name: "HDFC Bank",
      currentPrice: 1625,
      dayChange: 16.25,
      dayChangePercent: 1.01,
      healthScore: 78,
      sector: "Financials",
      marketCap: "Large",
    },
    {
      symbol: "RELIANCE",
      name: "Reliance Industries",
      currentPrice: 2450,
      dayChange: 36.75,
      dayChangePercent: 1.52,
      healthScore: 72,
      sector: "Energy",
      marketCap: "Large",
    },
    {
      symbol: "TCS",
      name: "Tata Consultancy Services",
      currentPrice: 3550,
      dayChange: 35.5,
      dayChangePercent: 1.01,
      healthScore: 80,
      sector: "Technology",
      marketCap: "Large",
    },
    {
      symbol: "INFY",
      name: "Infosys Limited",
      currentPrice: 1450,
      dayChange: 14.5,
      dayChangePercent: 1.01,
      healthScore: 75,
      sector: "Technology",
      marketCap: "Large",
    },
    {
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      currentPrice: 152.3,
      dayChange: -1.22,
      dayChangePercent: -0.79,
      healthScore: 79,
      sector: "Consumer",
      marketCap: "Large",
    },
  ];

  const watchlistQuickAdd = ["NVDA", "AMZN", "RELIANCE"];

  // Filter stocks based on search
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return stockDatabase.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  // Calculations
  const calculations = useMemo(() => {
    if (!selectedStock || !quantity || !purchasePrice) {
      return {
        totalInvestment: 0,
        currentValue: 0,
        unrealizedPL: 0,
        returnPercent: 0,
        newPortfolioValue: 0,
        newWeight: 0,
      };
    }

    const qty = parseFloat(quantity);
    const avgPrice = parseFloat(purchasePrice);
    const totalInvestment = qty * avgPrice;
    const currentValue = qty * selectedStock.currentPrice;
    const unrealizedPL = currentValue - totalInvestment;
    const returnPercent = (unrealizedPL / totalInvestment) * 100;
    const newPortfolioValue = currentPortfolioValue + totalInvestment;
    const newWeight = (totalInvestment / newPortfolioValue) * 100;

    return {
      totalInvestment,
      currentValue,
      unrealizedPL,
      returnPercent,
      newPortfolioValue,
      newWeight,
    };
  }, [selectedStock, quantity, purchasePrice, currentPortfolioValue]);

  // Portfolio impact calculations
  const portfolioImpact = useMemo(() => {
    if (!selectedStock || !calculations.totalInvestment) {
      return {
        sectorChange: { from: 0, to: 0 },
        healthChange: { from: 74, to: 74 },
        warnings: [],
      };
    }

    // Calculate new sector allocation
    const currentSector = currentSectorAllocation.find(
      (s) => s.sector === selectedStock.sector,
    );
    const currentSectorPercent = currentSector?.percentage || 0;
    const newSectorPercent =
      currentSectorPercent + calculations.newWeight * 0.8; // Approximate

    // Generate warnings
    const warnings: string[] = [];
    if (newSectorPercent > 30) {
      warnings.push(
        `⚠️ This will make ${selectedStock.sector} ${newSectorPercent.toFixed(
          1,
        )}% of your portfolio (high concentration)`,
      );
    }
    if (selectedStock.healthScore < 50) {
      warnings.push(
        `⚠️ This stock has a Health Score of ${selectedStock.healthScore} (poor) - are you sure?`,
      );
    }
    if (calculations.newWeight > 20) {
      warnings.push(
        `⚠️ This position will be ${calculations.newWeight.toFixed(
          1,
        )}% of your portfolio (very large)`,
      );
    }
    if (
      warnings.length === 0 &&
      newSectorPercent < 30 &&
      selectedStock.healthScore >= 70
    ) {
      warnings.push(
        `✅ Good diversification move! This balances your sectors.`,
      );
    }

    return {
      sectorChange: { from: currentSectorPercent, to: newSectorPercent },
      healthChange: { from: 74, to: 74.5 }, // Mock calculation
      warnings,
    };
  }, [selectedStock, calculations, currentSectorAllocation]);

  const handleSelectStock = (stock: StockSearchResult) => {
    setSelectedStock(stock);
    setPurchasePrice(stock.currentPrice.toString());
    setSearchQuery("");
    setStep(2);
  };

  const handleQuickAdd = (symbol: string) => {
    const stock = stockDatabase.find((s) => s.symbol === symbol);
    if (stock) {
      handleSelectStock(stock);
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedStock) setStep(2);
    else if (step === 2 && quantity && purchasePrice) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
  };

  const handleAddStock = (action: "analyze" | "alert" | "just-add") => {
    if (!selectedStock || !quantity || !purchasePrice) return;

    const newHolding: NewHolding = {
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      quantity: parseFloat(quantity),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      currentPrice: selectedStock.currentPrice,
      healthScore: selectedStock.healthScore,
      sector: selectedStock.sector,
      marketCap: selectedStock.marketCap,
      investmentType: investmentType as any,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      notes: notes || undefined,
      tags: notes
        ? notes
            .split(" ")
            .filter((word) => word.startsWith("#"))
            .map((tag) => tag.substring(1))
        : undefined,
    };

    onAdd(newHolding);
    handleReset();
    onClose();

    // Handle different actions
    if (action === "analyze") {
      // Navigate to stock analysis page
      console.log("Navigate to analysis for", selectedStock.symbol);
    } else if (action === "alert") {
      // Open alert modal
      console.log("Open alert modal for", selectedStock.symbol);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSearchQuery("");
    setSelectedStock(null);
    setQuantity("");
    setPurchasePrice("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setInvestmentType("growth");
    setTargetPrice("");
    setStopLoss("");
    setNotes("");
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getHealthBadgeColor = (score: number) => {
    if (score >= 80)
      return "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/20";
    if (score >= 60)
      return "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/20";
    if (score >= 40)
      return "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/20";
    return "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/20";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto hidden-scrollbar">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-primary ">
            🎯 Add Stock to Portfolio
          </DialogTitle>
          <DialogDescription className="text-base">
            Build your wealth, one smart pick at a time
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                  step >= s
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/20 scale-105"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1.5 mx-3 rounded-full transition-all ${
                    step > s ? "bg-primary shadow-sm" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Find the Stock */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-3">Find Your Stock</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol or name (e.g., AAPL, Apple)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Search Results */}
            {filteredStocks.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {filteredStocks.map((stock) => (
                  <Card
                    key={stock.symbol}
                    className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary/50 hover:scale-[1.02]"
                    onClick={() => handleSelectStock(stock)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-lg">
                              {stock.symbol}
                            </h4>
                            <Badge
                              variant="outline"
                              className={getHealthBadgeColor(stock.healthScore)}
                            >
                              Health: {stock.healthScore}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {stock.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{stock.sector}</span>
                            <span>•</span>
                            <span>{stock.marketCap} Cap</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            ₹{stock.currentPrice.toFixed(2)}
                          </p>
                          <p
                            className={`text-sm font-medium ${
                              stock.dayChangePercent >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {stock.dayChangePercent >= 0 ? "+" : ""}
                            {stock.dayChangePercent.toFixed(2)}% today
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Quick Add from Watchlist */}
            {!searchQuery && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Quick Add from Watchlist:
                </p>
                <div className="flex gap-2">
                  {watchlistQuickAdd.map((symbol) => {
                    const stock = stockDatabase.find(
                      (s) => s.symbol === symbol,
                    );
                    return stock ? (
                      <Button
                        key={symbol}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAdd(symbol)}
                        className="flex items-center gap-2"
                      >
                        {symbol}
                        <Badge variant="secondary" className="text-xs">
                          {stock.healthScore}
                        </Badge>
                      </Button>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Purchase Details */}
        {step === 2 && selectedStock && (
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg">{selectedStock.symbol}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedStock.name}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Change
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6">Purchase Details</h3>

              <div className="space-y-5">
                {/* Quantity */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="150"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="pr-20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      shares
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calculator className="w-3 h-3" />
                    Buying in lots? Use calculator
                  </p>
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Purchase Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="145.50"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="pl-8 pr-32"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      per share
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: ₹{selectedStock.currentPrice.toFixed(2)}{" "}
                    (auto-filled)
                  </p>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="text-sm font-medium mb-1 flex items-center gap-2">
                    Purchase Date <span className="text-red-500">*</span>
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </label>
                  <Input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* Live Calculations */}
                {quantity && purchasePrice && (
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-900">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold">Live Calculation</h4>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total Investment:
                        </span>
                        <span className="font-bold">
                          ₹{calculations.totalInvestment.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Current Value:
                        </span>
                        <span className="font-bold">
                          ₹{calculations.currentValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-blue-200 dark:border-blue-900">
                        <span className="text-muted-foreground">
                          Unrealized P&L:
                        </span>
                        <span
                          className={`font-bold ${
                            calculations.unrealizedPL >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {calculations.unrealizedPL >= 0 ? "+" : ""}₹
                          {calculations.unrealizedPL.toLocaleString()} (
                          {calculations.returnPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Import from Broker */}
                <Button variant="outline" className="w-full" disabled>
                  <Upload className="w-4 h-4 mr-2" />
                  Import from Broker Statement
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Investment Context (Optional) */}
        {step === 3 && selectedStock && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Investment Context</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Optional: Helps you track your investment thesis
              </p>

              <div className="space-y-4">
                {/* Investment Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Why are you buying this?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "growth", label: "Long-term Growth" },
                      { value: "dividend", label: "Dividend Income" },
                      { value: "value", label: "Value Play" },
                      { value: "speculation", label: "Speculation" },
                    ].map((type) => (
                      <Button
                        key={type.value}
                        variant={
                          investmentType === type.value ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setInvestmentType(type.value)}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1  flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Target Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="200.00"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1  flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Stop Loss
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="130.00"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes/Tags */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Notes & Tags
                  </label>
                  <Input
                    placeholder="Add notes or tags (use # for tags, e.g., #tech-leaders #long-term)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tags help you organize and filter your holdings
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation Preview */}
        {step === 4 && selectedStock && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                📊 Portfolio Impact Preview
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                See how this stock will affect your portfolio
              </p>

              <div className="space-y-4">
                {/* Adding Summary */}
                <Card className="border-2 border-primary">
                  <CardContent className="pt-4 space-y-2">
                    <h4 className="font-semibold">Adding to Portfolio:</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {selectedStock.symbol} - {selectedStock.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{quantity} shares</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Investment:</span>
                      <span className="font-bold">
                        ₹{calculations.totalInvestment.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">
                        Weight in Portfolio:
                      </span>
                      <span className="font-bold text-primary">
                        ~{calculations.newWeight.toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Portfolio Changes */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    Changes to Your Portfolio:
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">
                        {selectedStock.sector} Sector:
                      </span>
                      <span className="font-medium">
                        {portfolioImpact.sectorChange.from.toFixed(1)}% →{" "}
                        {portfolioImpact.sectorChange.to.toFixed(1)}%
                        {portfolioImpact.sectorChange.to >
                          portfolioImpact.sectorChange.from && (
                          <TrendingUp className="inline w-3 h-3 ml-1 text-green-600" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">
                        Avg Health Score:
                      </span>
                      <span className="font-medium">
                        {portfolioImpact.healthChange.from} →{" "}
                        {portfolioImpact.healthChange.to}
                        <Sparkles className="inline w-3 h-3 ml-1 text-yellow-600" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">
                        {selectedStock.marketCap} Cap:
                      </span>
                      <span className="font-medium">
                        +{calculations.newWeight.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Quick Take */}
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-2 border-purple-200 dark:border-purple-900">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">🤖 AI Quick Take</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedStock.healthScore >= 80
                            ? `Great fundamentals! ${selectedStock.symbol} has excellent health metrics. `
                            : selectedStock.healthScore >= 60
                              ? `Solid choice. ${selectedStock.symbol} shows good fundamentals. `
                              : `⚠️ Caution: ${selectedStock.symbol} has a low health score. `}
                          {portfolioImpact.sectorChange.to > 30
                            ? `However, this increases your ${
                                selectedStock.sector
                              } exposure to ${portfolioImpact.sectorChange.to.toFixed(
                                1,
                              )}%. Consider balancing with other sectors.`
                            : `This helps diversify your portfolio across sectors.`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Warnings */}
                {portfolioImpact.warnings.length > 0 && (
                  <div className="space-y-2">
                    {portfolioImpact.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                          warning.startsWith("✅")
                            ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
                            : "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900"
                        }`}
                      >
                        {warning.startsWith("✅") ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                        )}
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <Button
            variant="ghost"
            onClick={step === 1 ? onClose : handleBack}
            className="min-w-24"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          <div className="flex gap-3">
            {step < 3 && (
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !selectedStock) ||
                  (step === 2 && (!quantity || !purchasePrice))
                }
                className="min-w-32"
                size="lg"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {step === 3 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAddStock("just-add")}
                  size="lg"
                >
                  Skip
                </Button>
                <Button onClick={handleNext} size="lg" className="min-w-32">
                  Review
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {step === 4 && (
              <Button onClick={() => handleAddStock("just-add")} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add to Portfolio
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStockModal;
