"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AssetClass, DisclosureNote, Holding, HoldingsResponse, HoldingsTotals } from "@/types/portfolio";

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
  accountId: string; // per-account line from listUnifiedPositions (used by the Accounts + Holdings tabs)
  accountName: string; // (Holdings tab · account dimension) the account's display name — was served-but-dropped
  isin: string | null; // (combined-book display) the dedup spine
  entityKey: string | null; // (combined-book display) the engine's issuer key — group by `entityKey ?? isin`
  assetClass: AssetClass | null; // what KIND of thing this is — see Holding.assetClass
  priceSource: string | null; // (Holdings tab · price stamp) stock_price | exchange_close | amfi_nav — was dropped
  priceAsOf: string | null; // (Holdings tab · price stamp) the day this price belongs to (ISO) — was dropped
  instrumentId: string | null; // (series sparkline) the key for /instruments/:id/series — newly served
  schemeCode: string | null; // (fund link) AMFI scheme code, funds/ETFs only — newly served
  disclosureNotes: DisclosureNote[]; // (X3) served { code, cls, sentence }[] — rendered verbatim
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
    accountId: h.accountId,
    accountName: h.accountName,
    isin: h.isin,
    entityKey: h.entityKey,
    assetClass: h.assetClass,
    priceSource: h.priceSource,
    priceAsOf: h.priceAsOf,
    instrumentId: h.instrumentId,
    schemeCode: h.schemeCode,
    // (X3) served { code, cls, sentence }[] — no money, no re-derivation; carried through verbatim.
    disclosureNotes: h.disclosureNotes ?? [],
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
 * The authenticated user's materialized holdings, enriched with the live read layer
 * (price / health / tier). Read-only projection of the FIFO replay; money fields are
 * normalized to numbers here so components render directly.
 *
 * `includeExited` flips the ONE existing query param the endpoint already parses: the
 * default feed is held positions (qty>0), and `{ includeExited: true }` additionally
 * returns fully-exited (qty 0) rows — each still carrying its `accountId` + cumulative
 * `realizedPnl`. The account-detail page uses that variant to sum an ACCURATE per-account
 * realized figure (a book the user fully exited would otherwise silently vanish from the
 * held feed). The cache key carries the flag so the two reads never collide, and the
 * default call is byte-for-byte unchanged (every existing caller keeps the held-only feed).
 */
export function useHoldings(opts?: { includeExited?: boolean; enabled?: boolean }) {
  const includeExited = opts?.includeExited ?? false;
  return useQuery<HoldingsResponse>({
    queryKey: includeExited ? ["me", "portfolio", "holdings", "includeExited"] : ["me", "portfolio", "holdings"],
    enabled: opts?.enabled ?? true,
    queryFn: async () => {
      const url = includeExited ? "/api/v1/me/holdings?includeExited=true" : "/api/v1/me/holdings";
      const r = await apiFetch<{ success: boolean; data: RawHoldings }>(url);
      return normalize(r.data);
    },
  });
}
