"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Stock } from "@/lib/indian-stocks-data";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// Band → chip token (the locked Vytal condition scale used app-wide).
const BAND_CHIP: Record<string, string> = {
  pristine: "bg-pristine/15 text-pristine",
  healthy: "bg-healthy/15 text-healthy",
  steady: "bg-steady/15 text-steady",
  below_par: "bg-below/15 text-below",
  fragile: "bg-fragile/15 text-fragile",
};
const BAND_LABEL: Record<string, string> = {
  pristine: "Pristine",
  healthy: "Healthy",
  steady: "Steady",
  below_par: "Below par",
  fragile: "Fragile",
};

interface StockAutocompleteProps {
  stocks: Stock[];
  onStockSelect?: (stock: Stock) => void;
  placeholder?: string;
}

export function StockAutocomplete({
  stocks,
  onStockSelect,
  placeholder = "Search stocks by ticker or company name...",
}: StockAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLButtonElement[]>([]);
  const router = useRouter();

  // Filter stocks based on search term
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const filtered = stocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStocks(filtered.slice(0, 10)); // Show max 10 results
      setIsOpen(filtered.length > 0);
      setHighlightedIndex(-1);
    } else {
      setFilteredStocks([]);
      setIsOpen(false);
    }
  }, [searchTerm, stocks]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredStocks.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredStocks.length) {
          handleStockSelect(filteredStocks[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleStockSelect = (stock: Stock) => {
    setSearchTerm(`${stock.symbol} - ${stock.name}`);
    setIsOpen(false);
    setHighlightedIndex(-1);

    if (onStockSelect) {
      onStockSelect(stock);
    } else {
      // Only navigate to stock screener if no custom handler is provided
      router.push(`/research/stock-screener/${stock.symbol}`);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="font-bold text-primary">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm.trim().length > 0 && filteredStocks.length > 0) {
              setIsOpen(true);
            }
          }}
          className="w-full h-16 pl-16 pr-6 text-lg rounded-2xl border-2 border-border bg-background/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-300 placeholder:text-muted-foreground/50 shadow-lg"
        />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && filteredStocks.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-background border-2 border-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm"
          >
            <div className="max-h-88 overflow-y-auto hidden-scrollbar">
              {filteredStocks.map((stock, index) => (
                <button
                  key={stock.symbol}
                  ref={(el) => {
                    if (el) itemRefs.current[index] = el;
                  }}
                  onClick={() => handleStockSelect(stock)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full text-left px-6 py-2.5 transition-all duration-200 border-b border-border/50 last:border-b-0 ${
                    highlightedIndex === index
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">
                          {highlightMatch(stock.symbol, searchTerm)}
                        </span>
                        {stock.scored === undefined ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {stock.exchange}
                          </span>
                        ) : stock.scored && stock.band ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              BAND_CHIP[stock.band] ?? "bg-primary/10 text-primary"
                            }`}
                          >
                            {BAND_LABEL[stock.band] ?? stock.band}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                            Not scored
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {highlightMatch(stock.name, searchTerm)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results message */}
      {searchTerm.trim().length > 0 && filteredStocks.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-background border-2 border-border rounded-2xl shadow-2xl p-6 text-center">
          <p className="text-muted-foreground">
            No stocks found matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
