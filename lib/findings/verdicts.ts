// lib/findings/verdicts.ts
//
// THE verdict catalog — File 1 §5's prescribed sentence for EVERY fired finding, rendered
// from the real breaching stat in the evidence / triggeringValues JSON (never a generic
// template). One renderer per canonical key; P11/P12/P13 reproduce File 1's LOCKED copy
// verbatim from the evidence series. The dispatcher falls back to the engine's own
// assembled `verbatim`/`verdict` string (also File-1 copy, also real numbers) for any key
// without an explicit renderer, then to a generic last resort.
//
// RETIRED / UNBUILT: P2 (→ R6), P3 (→ R1) are consolidated and NOT registered by the engine;
// P9 (capex) is unbuilt. They have NO display slot here — deliberately no entries.

import { familyOf, type Family, PILLAR_LABEL } from "./classify";
import { findingName } from "@/lib/finding-names";

type Ev = Record<string, unknown>;

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const f = (v: unknown, d = 1): string => {
  const n = num(v);
  return n === null ? "—" : n.toFixed(d);
};
const signed = (v: unknown, d = 2): string => {
  const n = num(v);
  if (n === null) return "—";
  return n >= 0 ? `+${n.toFixed(d)}` : n.toFixed(d);
};
const abs1 = (v: unknown, d = 1): string => {
  const n = num(v);
  return n === null ? "—" : Math.abs(n).toFixed(d);
};
const pl = (k: unknown): string => PILLAR_LABEL[str(k)] ?? str(k);
/** "30.8 → 29.1 → 28.0" from an evidence opmSeries (P11/P12 locked copy). */
const opmArrow = (v: unknown): string =>
  Array.isArray(v) ? (v as { opm?: unknown }[]).map((p) => f(p.opm, 1)).join(" → ") : "";

// ── the catalog (one File-1 sentence per fired key, bound to evidence) ─────────
export const VERDICTS: Record<string, (ev: Ev) => string> = {
  // ── A · Critical red flags (§5A — names the flag + the single breaching stat) ──
  ownership_R1_pledge: (ev) => {
    const pct = num(ev.pledgeRatioQ);
    const rise = num(ev.qoqRisePp);
    const pctTxt = pct !== null ? `${pct.toFixed(1)}%` : "above the 50% line";
    if (rise !== null && rise > 10) {
      return `Pledged holding rose ${rise.toFixed(1)}pp this quarter to ${pctTxt} of promoter stake — a financing-stress signal that overrides the composite.`;
    }
    return `Promoter pledged holding is at ${pctTxt} of promoter stake — a financing-stress signal that overrides the composite.`;
  },
  ownership_R2_promoter_exit: (ev) =>
    `Promoter exit — promoter holding fell ${f(ev.promoterPctDropPp, 2)}pp into ${str(ev.currentPeriod)} (past the ${f(ev.thresholdPp, 0)}pp line), a genuine sell-down — not a QIP/rights dilution.`,
  foundation_R3_earnings_quality: (ev) => {
    const yrs = num(ev.consecutiveYears);
    const series = Array.isArray(ev.series) ? (ev.series as { fy?: unknown }[]) : [];
    const span = series.length ? `${str(series[0].fy)}–${str(series[series.length - 1].fy)}` : str(ev.latestPeriod);
    return `Earnings quality breakdown — net profit has exceeded operating cash flow for ${yrs ?? "≥4"} straight years (${span}).`;
  },
  foundation_R4_debt_explosion: (ev) =>
    `Debt explosion — debt-to-equity reached ${f(ev.deRatioLatest, 2)}× in ${str(ev.latestPeriod)}, crossing ${f(ev.threshold, 0)}× for the first time in 5 years.`,
  foundation_R5_interest_coverage: (ev) =>
    `Interest coverage collapse — TTM interest coverage held below ${f(ev.threshold, 1)}× for ${num(ev.consecutiveQuarters) ?? "≥2"} straight quarters (latest ${f(ev.latestTtmIC, 2)}×).`,
  ownership_R6_distribution: (ev) =>
    `Distribution pattern — promoter ${signed(ev.promoterDeltaPp)}pp and FII ${signed(ev.fiiDeltaPp)}pp both cut while retail absorbed ${signed(ev.retailDeltaPp)}pp, same quarter (${str(ev.currentPeriod)}).`,

  // ── E · Patterns (§5E — locked copy for P11/P12/P13; field-bound for the rest) ──
  ownership_P1_clean_rotation: (ev) =>
    `Clean institutional rotation — DII added (${signed(ev.diiDeltaPp)}pp) as FII trimmed (${f(ev.fiiDeltaPp, 2)}pp) with the promoter steady, into ${str(ev.period)}.`,
  ownership_P4_dual_exit: (ev) =>
    `Dual institutional exit — FII (${f(ev.fiiDeltaPp, 2)}pp) and DII (${f(ev.diiDeltaPp, 2)}pp) both cut in the same quarter (${str(ev.period)}).`,
  ownership_P5_insider_distress: (ev) => {
    const n = num(ev.distinctSellers) ?? 1;
    return `Insider-confirmed distress — ${n} insider${n > 1 ? "s" : ""} sold a net ₹${f(ev.netSellCr, 0)} Cr on an already-weak name (composite ${f(ev.composite, 0)}).`;
  },
  ownership_P6_insider_conviction: (ev) =>
    `Insider conviction — ${num(ev.distinctBuyers) ?? 1} directors/KMP bought a net ₹${f(ev.netBuyCr, 0)} Cr over the last quarter.`,
  foundation_P7_accruals: (ev) => {
    const ocf = num(ev.ocf);
    const period = str(ev.latestPeriod);
    if (ocf !== null && ocf < 0) {
      return `Accruals divergence — operating cash flow was negative (−₹${f(-ocf, 0)} Cr) against ₹${f(ev.netProfit, 0)} Cr net profit in ${period}: earnings entirely unbacked by operating cash.`;
    }
    return `Accruals divergence — operating cash backed only ${num(ev.cashBackPct) ?? "—"}% of ${period} net profit (₹${f(ev.accrualsGap, 0)} Cr of profit not converted to cash).`;
  },
  foundation_P8_receivables: (ev) => {
    const rev = num(ev.revenueGrowthPct);
    const dir = rev !== null && rev >= 0 ? "grew" : "fell";
    return `Capital tied in receivables — receivables grew ${f(ev.receivablesGrowthPct, 1)}% in ${str(ev.latestPeriod)} while revenue ${dir} ${abs1(rev)}% (a ${f(ev.outpacePp, 1)}pp gap).`;
  },
  ownership_P10_promoter_defense: (ev) => {
    const mkt = num(ev.marketPillar);
    const n = num(ev.buyTxns) ?? 0;
    return `Promoter defense buying — the promoter bought a net ₹${f(ev.promoterNetBuyCr, 0)} Cr (${n} trade${n === 1 ? "" : "s"}) into price weakness${mkt !== null ? ` (Market ${Math.round(mkt)})` : ""}.`;
  },
  // P11/P12/P13 — File 1 LOCKED copy, realized from the evidence series (verbatim render).
  momentum_P11_margin_compression: (ev) => {
    const ser = opmArrow(ev.opmSeries);
    return ser ? `Operating margin has been compressing for ${num(ev.quartersOfDecline) ?? ""} quarters: ${ser}.` : "";
  },
  momentum_P12_margin_recovery: (ev) => {
    const ser = opmArrow(ev.opmSeries);
    return ser ? `Operating margin recovering from trough: ${ser}.` : "";
  },
  momentum_P13_revenue_inflection: (ev) => {
    const prior = num(ev.priorTtmGrowthPct);
    const latest = num(ev.latestTtmGrowthPct);
    if (prior === null || latest === null) return "";
    const delta = num(ev.deltaPp);
    const accel = delta !== null ? delta > 0 : latest > prior;
    return `Revenue growth ${accel ? "accelerated" : "decelerated"} from ${prior.toFixed(1)}% to ${latest.toFixed(1)}%.`;
  },

  // ── C · Divergence (§5C — the read layer consolidates the family; each sub-type's
  //        File-1 sentence is authored here so the consolidated card can compose them) ──
  divergence_C1_price_ahead: (ev) =>
    `Price (${f(ev.market, 0)}) sits ${f(ev.gap, 1)} pts above its fundamentals (F${f(ev.foundation, 0)} / M${f(ev.momentum, 0)}) — a wide gap.`,
  divergence_C2_ownership_vs_fundamentals: (ev) => {
    const fnd = f(ev.foundation, 0), own = f(ev.ownership, 0), g = f(ev.gap, 0);
    return str(ev.subtype) === "exit_under_strength"
      ? `Owners stepping back beneath a holding floor — Foundation ${fnd} but Ownership only ${own} (a ${g}pt gap).`
      : `Smart money building under weakness — Ownership ${own} above a weak Foundation ${fnd} (a ${g}pt gap, the regime-robust tell).`;
  },
  divergence_C3_floor_trajectory_split: (ev) => {
    const fnd = f(ev.foundation, 0), m = f(ev.momentum, 0), g = f(ev.gap, 0);
    return ev.floorLed
      ? `Floor–trajectory split — a strong Foundation ${fnd} over weak Momentum ${m} (a ${g}pt gap): the balance sheet holds while the near-term trajectory lags.`
      : `Floor–trajectory split — Momentum ${m} running well ahead of Foundation ${fnd} (a ${g}pt gap): the trajectory outruns the floor.`;
  },
  divergence_C_over_time_widening: (ev) =>
    `Price-vs-fundamentals gap widening — up from ${f(ev.recentLowGap, 1)} to ${f(ev.currentGap, 1)} pts over recent snapshots (a developing divergence, not yet wide).`,

  // ── B / D · Trajectory crosses (§5B / §5D) ──
  trajectory_B_deterioration: (ev) => {
    const variant = str(ev.variant);
    const where =
      variant === "pillar"
        ? `${pl(ev.leg)} slipped below its strong mark`
        : variant === "out_of_pristine"
          ? "composite fell below 74, out of Pristine"
          : "composite fell out of Healthy";
    return `Sliding from a high base — ${where}, sustained ${num(ev.sustainedSnapshots) ?? "≥2"} snapshots — an early risk-regime change, typically before price reacts.`;
  },
  trajectory_D_recovery: (ev) => {
    const where = ev.isPillar ? `${pl(ev.leg)} leads the recovery` : "composite crossed up out of Below-par";
    return `Turning up out of weakness — ${where}, sustained ${num(ev.sustainedSnapshots) ?? "≥2"} snapshots.`;
  },

  // ── F · Composition (§5F) ──
  composition_F1_atypical: (ev) => {
    const band = str(ev.band).replace("_", "-");
    return `A ${f(ev.composite, 0)} that isn't a typical ${band} — ${pl(ev.maskingPillar)} runs ${f(ev.maskingDevPp, 0)}pp above its band-typical (masking) while ${pl(ev.laggingPillar)} sits ${abs1(ev.laggingDevPp, 0)}pp below.`;
  },
  trajectory_F2_composition_shift: (ev) => {
    const held = ev.compositeHeld as { prior?: unknown; current?: unknown } | undefined;
    const prior = held ? f(held.prior, 0) : "—";
    const current = held ? f(held.current, 0) : "—";
    const lead = ev.leaderChanged ? ` — lead passed from ${pl(ev.leaderPrior)} to ${pl(ev.leaderCurrent)}` : "";
    return `Mix shifted while the score held (${prior}→${current})${lead}.`;
  },

  // ── G · Convergence (§5G) ──
  trajectory_G_convergence: (ev) => {
    const healthy = str(ev.type) === "healthy_resolution";
    const peak = f(ev.peakSpread, 1), cur = f(ev.currentSpread, 1);
    return healthy
      ? `Converging — the ${pl(ev.laggardPillar)} laggard rose ${f(ev.laggardRosePp, 1)}pp, closing a ${peak}pp pillar gap to ${cur}pp (healthy resolution).`
      : `Converging — the ${pl(ev.leaderPillar)} leader fell ${f(ev.leaderFellPp, 1)}pp, closing a ${peak}pp pillar gap to ${cur}pp (deterioration convergence).`;
  },

  // ── H · Ownership events (§5H) ──
  ownership_H_block_events: (ev) => {
    const n = num(ev.deals) ?? 0;
    const net = num(ev.netCr) ?? 0;
    const lean = net > 0 ? "net buying" : net < 0 ? "net selling" : "two-sided";
    return `Ownership event — ${n} block/bulk deal${n === 1 ? "" : "s"} (₹${f(ev.grossCr, 0)} Cr, ${lean}) this window.`;
  },

  // ── I · Band transition (§5I) ──
  trajectory_I_band_transition: (ev) => `Crossed into ${str(ev.toBand)}.`,
};

/** Generic last-resort copy when no renderer matched and the engine wrote no sentence. */
function genericVerdict(key: string): string {
  const name = findingName(key);
  return familyOf(key) === "A"
    ? `${name} — an override condition that takes precedence over the composite score.`
    : `${name} — a conditional signal; review the evidence below.`;
}

/**
 * The verdict SENTENCE for a finding, bound to its evidence JSON. Prefers File 1's authored
 * copy; falls back to the engine's own assembled `verbatim`/`verdict` string, then generic.
 */
export function renderVerdict(key: string, evidence: unknown): string {
  const ev = (evidence && typeof evidence === "object" ? evidence : {}) as Ev;
  const fn = VERDICTS[key];
  if (fn) {
    try {
      const out = fn(ev);
      if (out) return out;
    } catch {
      /* fall through to the engine-assembled string */
    }
  }
  return str(ev.verbatim) || str(ev.verdict) || genericVerdict(key);
}

// ── per-family "doesn't mean" interpretive boundary (File 1 §5, verbatim) ──────
const DOESNT_MEAN: Record<Family, string> = {
  A: "a hard risk/quality warning to investigate — not a prediction the stock will fall.",
  B: "review your thesis, not sell — an early risk read, not a price call.",
  C: "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today.",
  D: "a coincident health inflection worth investigating — not a buy, not a guaranteed continuation; strongest read against a calm pond.",
  E: "a condition to look at — not a trade signal.",
  F: "a place to investigate, not a re-rate signal.",
  G: "the move isn't over, and which way it resolved depends on which pillar moved — not buy/sell.",
  H: "risk/flow context, not a verdict.",
  I: "a band change to note — not a buy/sell call.",
};

export function doesntMean(key: string): string {
  return DOESNT_MEAN[familyOf(key)];
}
