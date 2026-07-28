"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// useStockAttentionTracking — the stock-detail page's attention wiring, in one hook.
//   · VIEW  — fires when the stock resolves (and on navigating to a different stock).
//   · CURRENT STOCK — published so deep section-expand emitters need no prop threading.
//   · TAB DWELL — emits a `tab` event for the (stock, tab) being LEFT, with a coarse dwell, whenever the
//     tab OR the stock changes, and once more on unmount. Dwell is attributed to the stock+tab that were
//     active DURING it (captured in a ref), so navigating between stocks never mis-attributes a dwell.
//
// All work is inside effects — nothing runs on render, nothing blocks. Enqueues are O(1) in-memory;
// the tracker flushes on its own timer / on page-hide.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";
import { setCurrentStock, trackStockView, trackStockTab } from "./activity-tracker";

export function useStockAttentionTracking(stockId: string | null, activeTab: string): void {
  // VIEW — on the stock resolving / changing.
  useEffect(() => {
    if (stockId) trackStockView(stockId);
  }, [stockId]);

  // CURRENT STOCK — for section-expand emitters; cleared on leave.
  useEffect(() => {
    setCurrentStock(stockId);
    return () => setCurrentStock(null);
  }, [stockId]);

  // TAB DWELL — the ref holds the (stock, tab) currently being dwelled on and when it started.
  const dwell = useRef<{ stockId: string | null; tab: string; enteredAt: number }>({
    stockId,
    tab: activeTab,
    enteredAt: Date.now(),
  });

  useEffect(() => {
    const cur = dwell.current;
    const now = Date.now();
    // The tab or the stock changed → the PRIOR (stock, tab) was left; emit its dwell against THAT stock.
    if (cur.stockId && (cur.tab !== activeTab || cur.stockId !== stockId)) {
      trackStockTab(cur.stockId, cur.tab, now - cur.enteredAt);
    }
    dwell.current = { stockId, tab: activeTab, enteredAt: now };
  }, [stockId, activeTab]);

  // Final dwell on true unmount (empty deps → the cleanup reads the latest ref).
  useEffect(
    () => () => {
      const cur = dwell.current;
      if (cur.stockId) trackStockTab(cur.stockId, cur.tab, Date.now() - cur.enteredAt);
    },
    [],
  );
}
