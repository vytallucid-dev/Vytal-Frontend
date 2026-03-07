"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stock, Sector, indianStocks } from "@/lib/indian-stocks-data";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { SelectionRectangle } from "@/components/comparison/SelectionRectangle";
import { SelectionModal } from "@/components/comparison/SelectionModal";

type SelectionType = "stock" | "sector" | null;
type SelectionItem = Stock | Sector | null;

function ComparisonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectionType, setSelectionType] = useState<SelectionType>(null);
  const [leftSelection, setLeftSelection] = useState<SelectionItem>(null);
  const [rightSelection, setRightSelection] = useState<SelectionItem>(null);
  const [activeRectangle, setActiveRectangle] = useState<"left" | "right" | null>(null);

  // Pre-fill selections from URL params
  useEffect(() => {
    const leftParam = searchParams.get("left");
    const rightParam = searchParams.get("right");

    if (leftParam) {
      const leftStock = indianStocks.find(
        (stock) => stock.symbol.toUpperCase() === leftParam.toUpperCase()
      );
      if (leftStock) {
        setLeftSelection(leftStock);
        setSelectionType("stock");
      }
    }

    if (rightParam) {
      const rightStock = indianStocks.find(
        (stock) => stock.symbol.toUpperCase() === rightParam.toUpperCase()
      );
      if (rightStock) {
        setRightSelection(rightStock);
        setSelectionType("stock");
      }
    }
  }, [searchParams]);

  const handleLeftSelect = () => {
    setActiveRectangle("left");
  };

  const handleRightSelect = () => {
    setActiveRectangle("right");
  };

  const handleStockSelect = (item: Stock | Sector, type: "stock" | "sector") => {
    if (!selectionType) {
      setSelectionType(type);
    }

    if (activeRectangle === "left") {
      setLeftSelection(item);
    } else if (activeRectangle === "right") {
      setRightSelection(item);
    }
    setActiveRectangle(null);
  };

  const handleRemoveLeft = () => {
    setLeftSelection(null);
    if (!rightSelection) {
      setSelectionType(null);
    }
  };

  const handleRemoveRight = () => {
    setRightSelection(null);
    if (!leftSelection) {
      setSelectionType(null);
    }
  };

  const handleCompare = () => {
    if (leftSelection && rightSelection) {
      if ("symbol" in leftSelection && "symbol" in rightSelection) {
        // Stock comparison
        const leftSlug = leftSelection.symbol.toLowerCase();
        const rightSlug = rightSelection.symbol.toLowerCase();
        router.push(`/comparison/${leftSlug}-vs-${rightSlug}`);
      } else if ("id" in leftSelection && "id" in rightSelection) {
        // Sector comparison
        const leftSlug = leftSelection.id;
        const rightSlug = rightSelection.id;
        router.push(`/comparison/${leftSlug}-vs-${rightSlug}`);
      }
    }
  };

  const canCompare = leftSelection && rightSelection;

  return (
    <div className="flex flex-col h-max w-full">
      {/* Header */}
      <div className="text-center py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">
          Comparison Tool
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
          Compare stocks or sectors side-by-side
        </p>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8">
        {/* Selection Rectangles */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 w-full max-w-6xl">
          {/* Left Rectangle */}
          <SelectionRectangle
            selection={leftSelection}
            onSelect={handleLeftSelect}
            onRemove={handleRemoveLeft}
          />

          {/* VS Text */}
          <div className="flex items-center justify-center">
            <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-muted-foreground/30">
              VS
            </span>
          </div>

          {/* Right Rectangle */}
          <SelectionRectangle
            selection={rightSelection}
            onSelect={handleRightSelect}
            onRemove={handleRemoveRight}
          />
        </div>

        {/* Compare Button */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="lg"
            disabled={!canCompare}
            onClick={handleCompare}
            className="px-8 py-6 text-lg font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/90 transition-all shadow-lg hover:shadow-xl"
          >
            Compare →
          </Button>
        </motion.div>
      </div>

      {/* Selection Modal */}
      <SelectionModal
        isOpen={activeRectangle !== null}
        onClose={() => setActiveRectangle(null)}
        onSelect={handleStockSelect}
        selectedItem={
          activeRectangle === "left" ? leftSelection : rightSelection
        }
        excludedItem={
          activeRectangle === "left" ? rightSelection : leftSelection
        }
        selectionType={selectionType}
        onRemove={
          activeRectangle === "left" ? handleRemoveLeft : handleRemoveRight
        }
      />
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <ComparisonContent />
    </Suspense>
  );
}
