"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { Holding, HoldingsResponse, HoldingsTotals } from "@/types/portfolio";

// ── raw wire shape (money as Decimal strings) → normalized numbers ──────────────
interface RawHolding {
  symbol: string;
  name: string;
  sector: string | null;
  quantity: string;
  avgCost: string;
  investedValue: string;
  realizedPnl: string;
  currentPrice: number | null;
  marketValue: number | null;
  dayChangePct: number | null;
  dayChangeValue: number | null;
  unrealizedPnl: number | null;
  health: number | null;
  band: Holding["band"];
  healthAsOf: string | null;
  tier: Holding["tier"];
  weight: number;
}
interface RawTotals {
  positions: number;
  pricedPositions: number;
  investedValue: string;
  realizedPnlAll: string;
  currentValue: string;
  unrealizedPnl: string;
  dayChangeValue: string;
  dayChangePct: string | null;
}
interface RawHoldings {
  holdings: RawHolding[];
  totals: RawTotals;
}

const n = (s: string) => Number(s);

function normalize(raw: RawHoldings): HoldingsResponse {
  const holdings: Holding[] = raw.holdings.map((h) => ({
    symbol: h.symbol,
    name: h.name,
    sector: h.sector,
    quantity: n(h.quantity),
    avgCost: n(h.avgCost),
    investedValue: n(h.investedValue),
    realizedPnl: n(h.realizedPnl),
    currentPrice: h.currentPrice,
    marketValue: h.marketValue,
    dayChangePct: h.dayChangePct,
    dayChangeValue: h.dayChangeValue,
    unrealizedPnl: h.unrealizedPnl,
    health: h.health,
    band: h.band,
    healthAsOf: h.healthAsOf,
    tier: h.tier,
    weight: h.weight,
  }));
  const totals: HoldingsTotals = {
    positions: raw.totals.positions,
    pricedPositions: raw.totals.pricedPositions,
    investedValue: n(raw.totals.investedValue),
    realizedPnlAll: n(raw.totals.realizedPnlAll),
    currentValue: n(raw.totals.currentValue),
    unrealizedPnl: n(raw.totals.unrealizedPnl),
    dayChangeValue: n(raw.totals.dayChangeValue),
    dayChangePct: raw.totals.dayChangePct == null ? null : n(raw.totals.dayChangePct),
  };
  return { holdings, totals };
}

/**
 * The authenticated user's materialized holdings (qty>0), enriched with the live
 * read layer (price / health / tier). Read-only projection of the FIFO replay;
 * money fields are normalized to numbers here so components render directly.
 */
export function useHoldings() {
  return useQuery<HoldingsResponse>({
    queryKey: ["me", "portfolio", "holdings"],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: RawHoldings }>("/api/v1/me/holdings");
      return normalize(r.data);
    },
  });
}
