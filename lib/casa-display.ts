// Shared CASA honest-tiered-display helpers — ONE source for the §0 rule across every
// surface that shows CASA (stock-detail banking tab, PG deep-metrics, anywhere else).
//
// CASA is quarterly and tiered. The display NEVER shows a bare value — always with its
// quarter — and reads `source` + `isCurrent` to pick one of four honest states:
//   • source "quarter" + isCurrent       → plain current ("34.5% · FY27/Q1"). No warning.
//   • source "quarter" + NOT isCurrent    → plain, with the quarter ("34.1% · FY26/Q4").
//        THE COMMON CASE — it is the legitimate latest entered data, NOT a stale/alarm state.
//   • source "legacy_live"                → soft-stale ("34% · legacy value"), a pre-migration value.
//   • source "none"                       → honest-empty ("—"), never a fabricated number.

import type { BankingCasaCurrent, FundamentalsView } from "@/types/fundamentals";

export type CasaTier = "current" | "quarter" | "legacy" | "empty";

/** Pull the CASA `current` block off a fundamentals view. Banking-only — null for every
 *  other family (a non-bank never carries CASA), and null before the view resolves. */
export function readCasaCurrent(view: FundamentalsView | null): BankingCasaCurrent | null {
  return view?.banking?.casa?.current ?? null;
}

/** Resolve the honest display tier (§0). `empty` covers both source "none" and a null value. */
export function casaTier(c: BankingCasaCurrent | null): CasaTier {
  if (!c || c.source === "none" || c.value == null) return "empty";
  if (c.source === "legacy_live") return "legacy";
  return c.isCurrent ? "current" : "quarter";
}

/** The numeric CASA value to fold into a distribution / median — real entered values only
 *  (quarter or legacy). `empty`/`none` → null so it is EXCLUDED from the median, never 0. */
export function casaDistributionValue(c: BankingCasaCurrent | null): number | null {
  return casaTier(c) === "empty" ? null : (c as BankingCasaCurrent).value;
}

/** Whether the tier is soft-stale (legacy) — the ONLY tier that warrants a subtle "stale"
 *  accent. A non-current `quarter` is NOT soft-stale (it's the legitimate latest data). */
export function isCasaSoftStale(c: BankingCasaCurrent | null): boolean {
  return casaTier(c) === "legacy";
}

/** The honest quarter/tier context suffix (§0): the quarter label for a real quarter
 *  ("FY26/Q4"), "legacy value" for legacy, "" for empty. Never alarms a non-current quarter. */
export function casaContextLabel(c: BankingCasaCurrent | null): string {
  switch (casaTier(c)) {
    case "current":
    case "quarter":
      return (c as BankingCasaCurrent).quarter ?? "";
    case "legacy":
      return "legacy value";
    default:
      return "";
  }
}

/** The single quarter shared by every real-valued member, or null when they span more than
 *  one quarter (or any real value is legacy, i.e. quarter-less). Drives the group "as of FYxx/Qn"
 *  context on a CASA median row — honest only when the whole group is on one quarter. */
export function uniformCasaQuarter(views: (FundamentalsView | null)[]): string | null {
  const quarters = new Set<string>();
  for (const v of views) {
    const c = readCasaCurrent(v);
    if (casaTier(c) === "empty") continue;
    if (!c?.quarter) return null; // a legacy real value has no quarter → not uniform
    quarters.add(c.quarter);
  }
  return quarters.size === 1 ? [...quarters][0] : null;
}
