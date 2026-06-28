// lib/peer-group/config.ts
//
// PEER-GROUP CONFIG — the static map that lets the Overview / Fundamentals tabs analyse
// "each group on its own terms". One entry per pond, keyed by the PG id used by
// GET /api/peer-groups. The 24 groups are stable, so this is a static .ts file, NOT a
// DB table.
//
// ─────────────────────────────────────────────────────────────────────────────────────
// WHAT'S IN HERE — both halves are settled:
//
//   keyMetrics[]   → SEEDED FROM REAL ENGINE DATA. For every CORE group the metric set is
//                    derived from that group's actual `metricDistributions[]` on
//                    GET /api/peer-groups/:id/health — i.e. the foundation/momentum metrics
//                    the health engine genuinely scores it on (run against the live endpoint
//                    on 2026-06-26). Each `key` maps to a REAL field in the fundamentals
//                    read-model (types/fundamentals.ts). Codes were resolved via
//                    lib/health/metric-labels.ts (F1=ROCE, M1=Operating Margin, NIM, GNPA…).
//                    Not guessed.
//
//   whatBinds      → REVIEWED & VERIFIED editorial. Grounded in the ACTUAL members[] and the
//   character        ACTUAL scored metrics; the sector-economics framing has been signed off.
//   lensChip       → short header chip, e.g. "Banking lens".
//
// CASA (banking): the engine scores it (appears in metricDistributions) AND the read
// fundamentals API now surfaces it as a tiered quarterly value (banking.casa.current) — the
// deep-metrics cell reads each member's value, no longer a backend gap. Quarterly + tiered:
// the value always travels with its quarter (see lib/casa-display.ts).
//
// SCOPE NOTE (real vs recon): the live /api/peer-groups returns 23 ponds — 13 SCORED (core,
// fully populated below) + 10 UNSCORED (alternates, stubbed). The recon assumed 14 core /
// 10 alt (=24); the 14th expected core ("Large-Cap Auto Ancillaries") is present but NOT yet
// scored on the live engine, so it is stubbed as an alternate with a note. Core groups are
// the day-one deliverable; alternates ship universal-fundamentals-only via graceful fallback
// (empty keyMetrics).
// ─────────────────────────────────────────────────────────────────────────────────────

import type { IndustryFamily } from "@/types/fundamentals";

export type KeyMetricUnit = "pct" | "ratio" | "cr" | "rupees" | "x";

export interface PeerGroupKeyMetric {
  /** Maps to a REAL field in the fundamentals payload (types/fundamentals.ts):
   *  non_financial → nonFinancial.annual.*; banking → banking.annual.* (or quarters). */
  key: string;
  label: string;
  unit: KeyMetricUnit;
  /** Which industry family can DISPLAY this metric (gates the cell by family). */
  family: IndustryFamily;
  /** "scored" = seeded from the group's metricDistributions; "universal" = always-available
   *  fundamentals shown for every group regardless of scoring. */
  source: "scored" | "universal";
  /** Present only for a known data gap (e.g. CASA) — the cell honest-empties. */
  note?: string;
}

export interface PeerGroupConfig {
  /** Matches the PG id returned by GET /api/peer-groups. */
  id: string;
  /** Convenience label (the live displayName) — not load-bearing, eases review. */
  displayName: string;
  /** Reviewed & verified — what economically binds these companies. */
  whatBinds: string;
  /** Reviewed & verified — the group's economic character. */
  character: string;
  /** Short header chip, e.g. "Banking lens". */
  lensChip: string;
  /** SEEDED from real metricDistributions (core) / [] for alternates (universal fallback). */
  keyMetrics: PeerGroupKeyMetric[];
}

// ── Shared metric atoms (real fundamentals fields) ───────────────────────────────────
// Non-financial — nonFinancial.annual.* (+ quarters for the TTM margin reads).
const NF = {
  roce: { key: "roce", label: "ROCE", unit: "pct", family: "non_financial", source: "scored" } as PeerGroupKeyMetric,
  roe: { key: "roe", label: "ROE", unit: "pct", family: "non_financial", source: "scored" } as PeerGroupKeyMetric,
  operatingMargin: { key: "operatingMargin", label: "Operating Margin", unit: "pct", family: "non_financial", source: "scored" } as PeerGroupKeyMetric,
  netMargin: { key: "netMargin", label: "Net Margin", unit: "pct", family: "non_financial", source: "scored" } as PeerGroupKeyMetric,
  debtToEquity: { key: "debtToEquity", label: "Debt / Equity", unit: "ratio", family: "non_financial", source: "scored" } as PeerGroupKeyMetric,
  interestCoverage: { key: "interestCoverage", label: "Interest Coverage", unit: "x", family: "non_financial", source: "scored" } as PeerGroupKeyMetric,
  // universal growth — always shown, not group-scored
  profitGrowthYoy: { key: "profitGrowthYoy", label: "Profit Growth (YoY)", unit: "pct", family: "non_financial", source: "universal" } as PeerGroupKeyMetric,
  revenueGrowthYoy: { key: "revenueGrowthYoy", label: "Revenue Growth (YoY)", unit: "pct", family: "non_financial", source: "universal" } as PeerGroupKeyMetric,
} as const;

// Banking — banking.annual.* (NIM/ROA/asset-quality/capital). All scored except growth.
const BK = {
  nim: { key: "nim", label: "Net Interest Margin", unit: "pct", family: "banking", source: "scored" } as PeerGroupKeyMetric,
  gnpaPct: { key: "gnpaPct", label: "Gross NPA", unit: "pct", family: "banking", source: "scored" } as PeerGroupKeyMetric,
  nnpaPct: { key: "nnpaPct", label: "Net NPA", unit: "pct", family: "banking", source: "scored" } as PeerGroupKeyMetric,
  pcr: { key: "pcr", label: "Provision Coverage", unit: "pct", family: "banking", source: "scored" } as PeerGroupKeyMetric,
  roaDisclosed: { key: "roaDisclosed", label: "Return on Assets", unit: "pct", family: "banking", source: "scored" } as PeerGroupKeyMetric,
  tier1: { key: "tier1", label: "Tier-1 Capital", unit: "pct", family: "banking", source: "scored" } as PeerGroupKeyMetric,
  costToIncome: { key: "costToIncome", label: "Cost-to-Income", unit: "pct", family: "banking", source: "scored" } as PeerGroupKeyMetric,
  // DATA GAP: engine scores CASA, but the read fundamentals API does not surface it (lives
  // in BankSupplementary). Included so the lens knows it's a key bank metric; cell honest-empties.
  casa: { key: "casa", label: "CASA Ratio", unit: "pct", family: "banking", source: "scored" } as PeerGroupKeyMetric,
  // universal growth — always shown
  niiGrowthYoy: { key: "niiGrowthYoy", label: "NII Growth (YoY)", unit: "pct", family: "banking", source: "universal" } as PeerGroupKeyMetric,
  patGrowthYoy: { key: "patGrowthYoy", label: "Profit Growth (YoY)", unit: "pct", family: "banking", source: "universal" } as PeerGroupKeyMetric,
} as const;

export const PEER_GROUP_CONFIG: Record<string, PeerGroupConfig> = {
  // ══════════════════════════════════════════════════════════════════════════════════
  // CORE (13) — fully populated. keyMetrics seeded from live metricDistributions.
  // ══════════════════════════════════════════════════════════════════════════════════

  // Auto OEMs — Cyclical. Members: BAJAJ-AUTO, EICHERMOT, HEROMOTOCO, M&M, TVSMOTOR,
  // ASHOKLEY, MARUTI. Scored on F1/F2 (ROCE/ROE), F4/F5 (leverage/coverage), M1/M2 (margins).
  "f2e4dc19-7bae-4588-ae21-e07af4e102a6": {
    id: "f2e4dc19-7bae-4588-ae21-e07af4e102a6",
    displayName: "Large-Cap Auto OEMs",
    whatBinds: "Seven listed vehicle makers (BAJAJ-AUTO, EICHERMOT, HEROMOTOCO, M&M, TVSMOTOR, ASHOKLEY, MARUTI) whose results turn on the demand cycle, input-cost (steel/aluminium) swings and product mix. Volume-and-margin businesses.",
    character: "Cyclical. The engine scores them primarily on returns (ROCE/ROE), operating margin and balance-sheet leverage — the levers that separate a through-cycle compounder from a volume-chaser.",
    lensChip: "Auto OEM lens",
    keyMetrics: [NF.roce, NF.operatingMargin, NF.netMargin, NF.debtToEquity, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // Private Banks — Cyclical (banking). Members: KOTAKBANK, FEDERALBNK, ICICIBANK, AXISBANK,
  // HDFCBANK, INDUSINDBK. Scored on NIM, asset quality (GNPA/NNPA/PCR), ROA, Tier-1, C/I, CASA.
  "e4426208-0b44-4f06-b889-32a2f224a8e2": {
    id: "e4426208-0b44-4f06-b889-32a2f224a8e2",
    displayName: "Large-Cap Private Banks",
    whatBinds: "Six large private-sector banks (KOTAKBANK, FEDERALBNK, ICICIBANK, AXISBANK, HDFCBANK, INDUSINDBK). Bound by a spread-and-credit-risk model: lend at a margin, keep the book clean, hold enough capital.",
    character: "Read on a bank-risk lens, not a P&L lens. The engine scores margin (NIM), asset quality (GNPA/NNPA/PCR), profitability (ROA), capital (Tier-1), efficiency (cost-to-income) and deposit-franchise quality (CASA).",
    lensChip: "Banking lens",
    keyMetrics: [BK.nim, BK.gnpaPct, BK.nnpaPct, BK.pcr, BK.roaDisclosed, BK.tier1, BK.costToIncome, BK.casa, BK.niiGrowthYoy, BK.patGrowthYoy],
  },

  // PSU Banks — Cyclical (banking). Members: INDIANB, SBIN, BANKBARODA, UNIONBANK, CANBK, PNB.
  "eb9ad796-ecc3-4142-a579-85b38ef82d62": {
    id: "eb9ad796-ecc3-4142-a579-85b38ef82d62",
    displayName: "Large-Cap PSU Banks",
    whatBinds: "Six government-majority banks (INDIANB, SBIN, BANKBARODA, UNIONBANK, CANBK, PNB). Same spread-and-credit model as private peers, but with state ownership shaping capital, growth appetite and the asset-quality cycle.",
    character: "Same banking lens as private banks — NIM, asset quality, ROA, Tier-1, cost-to-income, CASA — typically read against a heavier legacy-NPA history and a different capital profile.",
    lensChip: "Banking lens",
    keyMetrics: [BK.nim, BK.gnpaPct, BK.nnpaPct, BK.pcr, BK.roaDisclosed, BK.tier1, BK.costToIncome, BK.casa, BK.niiGrowthYoy, BK.patGrowthYoy],
  },

  // Capital Goods & Industrial — Cyclical. Members: CUMMINSIND, POWERINDIA, ABB, THERMAX,
  // HONAUT, SIEMENS, BHEL, LT. Execution/order-driven; scored on returns, margin, coverage.
  "6eab6d89-82af-42de-a827-a735fac1f2e9": {
    id: "6eab6d89-82af-42de-a827-a735fac1f2e9",
    displayName: "Large-Cap Capital Goods & Industrial",
    whatBinds: "Eight industrial equipment and engineering names (CUMMINSIND, POWERINDIA, ABB, THERMAX, HONAUT, SIEMENS, BHEL, LT). Order-book-and-execution businesses geared to the capex cycle.",
    character: "Cyclical. Scored on capital efficiency (ROCE), operating margin, interest coverage and leverage — the read on whether order growth is converting to profitable, well-funded execution.",
    lensChip: "Capital goods lens",
    keyMetrics: [NF.roce, NF.operatingMargin, NF.interestCoverage, NF.debtToEquity, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // Defense — Cyclical. Members: SOLARINDS, HAL, BEL, MAZDOCK, GRSE, BDL, COCHINSHIP.
  // Mostly state-owned order-book platforms.
  "46f3b73e-7708-4d79-b67f-b5f7605a8300": {
    id: "46f3b73e-7708-4d79-b67f-b5f7605a8300",
    displayName: "Large-Cap Defense",
    whatBinds: "Seven defence-sector names (SOLARINDS, HAL, BEL, MAZDOCK, GRSE, BDL, COCHINSHIP) — largely PSU shipyards and electronics/ordnance makers running on a government order book.",
    character: "Cyclical by classification, but order-book-led. Scored on returns (ROCE), operating and net margin and leverage — long-cycle execution against advances-funded balance sheets.",
    lensChip: "Defense lens",
    keyMetrics: [NF.roce, NF.operatingMargin, NF.netMargin, NF.debtToEquity, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // Cement — Commodity. Members: SHREECEM, ULTRACEMCO, JKCEMENT, ACC, RAMCOCEM, AMBUJACEM,
  // DALBHARAT. Capacity-and-cost cyclical.
  "8d594a60-d014-4d64-9318-6afb546a40fd": {
    id: "8d594a60-d014-4d64-9318-6afb546a40fd",
    displayName: "Large-Cap Cement",
    whatBinds: "Seven cement makers (SHREECEM, ULTRACEMCO, JKCEMENT, ACC, RAMCOCEM, AMBUJACEM, DALBHARAT). A regional, capacity-and-utilisation commodity — pricing power and energy/freight cost are the swing factors.",
    character: "Commodity. Scored on operating margin (the cost/pricing read), capital efficiency (ROCE), leverage and interest coverage — capacity expansions are debt-funded, so the balance sheet matters.",
    lensChip: "Cement lens",
    keyMetrics: [NF.operatingMargin, NF.roce, NF.debtToEquity, NF.interestCoverage, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // Consumer Durables & Electrical — Cyclical. Members: POLYCAB, HAVELLS, DIXON, BLUESTARCO,
  // CROMPTON, VOLTAS.
  "78b13053-7f12-4940-b98a-2adeb0333d51": {
    id: "78b13053-7f12-4940-b98a-2adeb0333d51",
    displayName: "Large-Cap Consumer Durables & Electrical",
    whatBinds: "Six durables and electrical names (POLYCAB, HAVELLS, DIXON, BLUESTARCO, CROMPTON, VOLTAS). Brand-and-distribution-led demand against a manufacturing cost base; mixes pure brands with contract manufacturers.",
    character: "Cyclical. Scored on returns (ROCE), operating and net margin and leverage — the read on pricing/brand strength versus the thin-margin manufacturing tail.",
    lensChip: "Durables lens",
    keyMetrics: [NF.roce, NF.operatingMargin, NF.netMargin, NF.debtToEquity, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // FMCG — Quality. Members: MARICO, ITC, COLPAL, BRITANNIA, HINDUNILVR, DABUR, TATACONSUM,
  // GODREJCP. Asset-light, high-return staples.
  "196c7697-8e81-45d1-9cd0-429262c2fa8c": {
    id: "196c7697-8e81-45d1-9cd0-429262c2fa8c",
    displayName: "Large-Cap FMCG",
    whatBinds: "Eight branded staples makers (MARICO, ITC, COLPAL, BRITANNIA, HINDUNILVR, DABUR, TATACONSUM, GODREJCP). Asset-light, distribution-moated businesses where volume growth and gross-margin defence drive the result.",
    character: "Quality. Scored on high returns (ROCE/ROE) and margin (operating/net) — the classic compounder profile where capital efficiency and pricing power, not leverage, carry the story.",
    lensChip: "FMCG lens",
    keyMetrics: [NF.roce, NF.roe, NF.operatingMargin, NF.netMargin, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // IT Services — Quality. Members: INFY, TCS, HCLTECH, WIPRO, TECHM. Debt-free; no coverage
  // metric scored (M5 absent), reflecting net-cash balance sheets.
  "7a494af2-0958-47fa-b1b4-2aebe8f936a3": {
    id: "7a494af2-0958-47fa-b1b4-2aebe8f936a3",
    displayName: "Large-Cap IT Services",
    whatBinds: "Five IT-services majors (INFY, TCS, HCLTECH, WIPRO, TECHM). People-and-utilisation businesses selling discretionary tech spend; results turn on deal flow, billing rates and currency.",
    character: "Quality. Net-cash, asset-light — the engine scores them on returns (ROCE/ROE) and margin (operating/net), not leverage (no interest-coverage metric is scored for this group).",
    lensChip: "IT services lens",
    keyMetrics: [NF.roce, NF.roe, NF.operatingMargin, NF.netMargin, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // Metals & Mining — Commodity. Members: NATIONALUM, HINDZINC, VEDL, TATASTEEL, SAIL,
  // HINDALCO, JSWSTEEL, JINDALSTEL. Price-taker, leveraged.
  "909f5e45-0ac4-45ff-aa6f-f7a1971486a5": {
    id: "909f5e45-0ac4-45ff-aa6f-f7a1971486a5",
    displayName: "Large-Cap Metals & Mining",
    whatBinds: "Eight metals and mining names (NATIONALUM, HINDZINC, VEDL, TATASTEEL, SAIL, HINDALCO, JSWSTEEL, JINDALSTEL). Global-price-taker commodities where the LME/realisation cycle and cost position drive earnings.",
    character: "Commodity. Scored on operating margin (the cost/realisation read), ROCE, leverage and interest coverage — these are capital-heavy, debt-funded businesses where the balance sheet decides who survives the trough.",
    lensChip: "Metals lens",
    keyMetrics: [NF.operatingMargin, NF.roce, NF.debtToEquity, NF.interestCoverage, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // Oil & Gas — Commodity. Members: BPCL, ONGC, PETRONET, IOC, HINDPETRO, OIL, GAIL, RELIANCE.
  "a20b9840-1f4e-4685-8ef5-817db7544d54": {
    id: "a20b9840-1f4e-4685-8ef5-817db7544d54",
    displayName: "Large-Cap Oil & Gas",
    whatBinds: "Eight energy names (BPCL, ONGC, PETRONET, IOC, HINDPETRO, OIL, GAIL, RELIANCE) spanning upstream, refining/marketing and gas. Crude-price and refining/marketing-margin exposed, several with regulated/PSU dynamics.",
    character: "Commodity. Scored on operating margin, ROCE, leverage and interest coverage — large, capital-intensive balance sheets whose returns swing with the crude and cracking cycle.",
    lensChip: "Oil & gas lens",
    keyMetrics: [NF.operatingMargin, NF.roce, NF.debtToEquity, NF.interestCoverage, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // Pharma — Quality. Members: LUPIN, DIVISLAB, CIPLA, DRREDDY, TORNTPHARM, AUROPHARMA,
  // SUNPHARMA, MANKIND, ZYDUSLIFE, GLENMARK.
  "912206f4-71e3-4f63-a64d-40977a280cf7": {
    id: "912206f4-71e3-4f63-a64d-40977a280cf7",
    displayName: "Large-Cap Pharma",
    whatBinds: "Ten pharma names (LUPIN, DIVISLAB, CIPLA, DRREDDY, TORNTPHARM, AUROPHARMA, SUNPHARMA, MANKIND, ZYDUSLIFE, GLENMARK). R&D-and-regulatory businesses balancing domestic-branded and US-generic exposure.",
    character: "Quality. Scored on returns (ROCE/ROE) and margin (operating/net) — capital efficiency and product mix, not leverage, define the better franchises.",
    lensChip: "Pharma lens",
    keyMetrics: [NF.roce, NF.roe, NF.operatingMargin, NF.netMargin, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // Power & Utilities — Defensive. Members: ADANIPOWER, POWERGRID, JSWENERGY, TORNTPOWER,
  // NHPC, NTPC, TATAPOWER. NOTE: this group's scored set uses the OPM overrides (F1_OPM /
  // M1_OPM_TTM → operating margin) reflecting regulated-utility economics.
  "d3c72f87-caed-44f1-b67f-863b39e939c5": {
    id: "d3c72f87-caed-44f1-b67f-863b39e939c5",
    displayName: "Large-Cap Power & Utilities",
    whatBinds: "Seven power and utility names (ADANIPOWER, POWERGRID, JSWENERGY, TORNTPOWER, NHPC, NTPC, TATAPOWER) spanning generation and transmission. Largely regulated/long-PPA, asset-heavy returns.",
    character: "Defensive. The engine scores this group with operating-margin overrides (regulated-utility economics) alongside ROCE, leverage and interest coverage — debt-funded asset bases where coverage and margin stability matter more than growth.",
    lensChip: "Utilities lens",
    keyMetrics: [NF.operatingMargin, NF.roce, NF.debtToEquity, NF.interestCoverage, NF.profitGrowthYoy, NF.revenueGrowthYoy],
  },

  // ══════════════════════════════════════════════════════════════════════════════════
  // ALTERNATES (10) — UNSCORED on the live engine. Stubbed: real id + lensChip, empty
  // keyMetrics (tabs fall back to universal fundamentals), empty editorial.
  // ══════════════════════════════════════════════════════════════════════════════════

  // NOTE: recon expected this as a 14th CORE group, but it is not yet scored on the live
  // engine — stubbed as an alternate until metricDistributions exist for it.
  "9979eed1-b45e-49f0-bac3-11baec19b208": {
    id: "9979eed1-b45e-49f0-bac3-11baec19b208",
    displayName: "Large-Cap Auto Ancillaries",
    whatBinds: "",
    character: "",
    lensChip: "Auto ancillary lens",
    keyMetrics: [],
  },
  "da40a058-4b51-41b6-999e-36add4269c86": {
    id: "da40a058-4b51-41b6-999e-36add4269c86",
    displayName: "Large-Cap AMCs & Exchanges",
    whatBinds: "",
    character: "",
    lensChip: "Capital markets lens",
    keyMetrics: [],
  },
  "5e304ce2-e67a-403e-b247-0c2aca59a2ad": {
    id: "5e304ce2-e67a-403e-b247-0c2aca59a2ad",
    displayName: "Large-Cap Specialty Chemicals",
    whatBinds: "",
    character: "",
    lensChip: "Specialty chemicals lens",
    keyMetrics: [],
  },
  "7b98630c-6541-4e39-8618-2bce7f0da5d7": {
    id: "7b98630c-6541-4e39-8618-2bce7f0da5d7",
    displayName: "Large-Cap Paints",
    whatBinds: "",
    character: "",
    lensChip: "Paints lens",
    keyMetrics: [],
  },
  "9e5f4789-9aa1-4e13-9425-08321ba0d20a": {
    id: "9e5f4789-9aa1-4e13-9425-08321ba0d20a",
    displayName: "Large-Cap Retail & Apparel",
    whatBinds: "",
    character: "",
    lensChip: "Retail lens",
    keyMetrics: [],
  },
  "dae8f883-e13e-494d-be88-33b417bf3d0a": {
    id: "dae8f883-e13e-494d-be88-33b417bf3d0a",
    displayName: "Large-Cap Housing Finance",
    whatBinds: "",
    character: "",
    lensChip: "Housing finance lens",
    keyMetrics: [],
  },
  "029e47ae-f88e-475a-b538-f06ff7d0ee8f": {
    id: "029e47ae-f88e-475a-b538-f06ff7d0ee8f",
    displayName: "Large-Cap NBFCs",
    whatBinds: "",
    character: "",
    lensChip: "NBFC lens",
    keyMetrics: [],
  },
  "ae8a107c-75ba-4212-9ccb-941c54146cb8": {
    id: "ae8a107c-75ba-4212-9ccb-941c54146cb8",
    displayName: "Large-Cap Hospitals & Diagnostics",
    whatBinds: "",
    character: "",
    lensChip: "Healthcare lens",
    keyMetrics: [],
  },
  "c9242a86-a525-4195-9ffc-0a87baeeef69": {
    id: "c9242a86-a525-4195-9ffc-0a87baeeef69",
    displayName: "Large-Cap Real Estate",
    whatBinds: "",
    character: "",
    lensChip: "Real estate lens",
    keyMetrics: [],
  },
  "f9bc1bb7-a0e7-4e87-87ce-1bbf4db97354": {
    id: "f9bc1bb7-a0e7-4e87-87ce-1bbf4db97354",
    displayName: "Large-Cap Telecom & Towers",
    whatBinds: "",
    character: "",
    lensChip: "Telecom lens",
    keyMetrics: [],
  },
};

/** Resolve a group's config by its /api/peer-groups id. null when unknown — callers
 *  fall back to universal fundamentals (never fabricate). */
export function getPeerGroupConfig(id: string): PeerGroupConfig | null {
  return PEER_GROUP_CONFIG[id] ?? null;
}
