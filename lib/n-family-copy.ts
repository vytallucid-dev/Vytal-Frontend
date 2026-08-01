/**
 * Family N (Notable) — the VERDICT TEMPLATES, and nothing else.
 *
 * ⚠️ EVERY STRING HERE IS SPEC COPY (Vytal Family N Amendment v1.0 §3, §4). Do not reword, shorten,
 *    "improve", or regenerate. If something reads wrong, report it — do not edit it.
 *
 * ── ★ STAGE 6 · THREE OF THE FOUR FIELDS LEFT THIS FILE ───────────────────────────────────────────
 * The amendment §4.0 defines four fields per rule: name · description · verdict · doesn't-mean.
 * Three of them are STATIC, so they are now authored once in Vytal-Backend/src/catalogue/, served
 * over HTTP, and generated into ./findings/generated/copy.generated.ts as the bundled fallback.
 * Keeping a second hand-maintained copy of them here is precisely the drift the migration removed.
 *
 * `verdict` could not go with them, and the reason is not an oversight:
 *
 *   ★ A VERDICT IS A FUNCTION, NOT A STRING. It interpolates the fired instance's own numbers
 *     ("for 6 straight years", "from 1.8× to 0.6×"), so it cannot be JSON and cannot be served from
 *     the catalogue endpoint. The BACKEND holds the authoritative copy of these same templates
 *     (src/catalogue/n-family-copy.ts) and renders the sentence onto the finding row; what remains
 *     here is the FALLBACK renderer for a payload that arrives without one.
 *
 *   The two are proved character-identical by the verdict-identity harness. If you change a template,
 *   change it in the backend first and mirror it here — the harness fails otherwise.
 *
 * ── THE RULE THESE TEMPLATES OBEY ─────────────────────────────────────────────────────────────────
 * REGISTER DISCIPLINE (§4.2) — prohibited in every field: excellent · strong (as a verdict;
 * "strengthened" as a described change is fine) · quality · impressive · healthy · well-positioned
 * · attractive · solid · robust · compelling · reassuring.
 * The test: if the sentence would read as a reason to buy when lifted out of context, rewrite it.
 *
 * EVIDENCE KEYS: each template reads exactly the keys the engine build writes. If a key is missing at
 * runtime the renderer falls back to the static description rather than interpolating "undefined" —
 * the guard lives in verdicts.ts (N_REQUIRED_KEYS), where it can see the evidence.
 */

/** One rule's instance-level template. Reads engine evidence; per-stock surfaces only. */
export interface NFamilyVerdictCopy {
  verdict: (ev: Record<string, unknown>) => string;
}

export const N_FAMILY_COPY: Record<string, NFamilyVerdictCopy> = {
  foundation_N1_cash_backed_earnings: {
    verdict: (ev) => `Reported profit has converted to cash for ${ev.years} straight years.`,
  },

  foundation_N2_working_capital: {
    verdict: (ev) => `Receivables have grown slower than revenue for ${ev.years} years.`,
  },

  foundation_N3_deleveraging: {
    verdict: (ev) =>
      `Debt relative to equity has fallen for ${ev.years} straight years, from ${ev.deFrom}× to ${ev.deTo}×.`,
  },

  foundation_N4_coverage_strengthening: {
    verdict: (ev) =>
      `Interest coverage has strengthened for ${ev.quarters} straight quarters, from a thin ${ev.troughCoverage}×.`,
  },

  ownership_N5_dual_institutional_build: {
    verdict: (ev) =>
      `Both foreign and domestic institutions added in the same quarter — FII ${ev.fiiDeltaPp}pp, DII ${ev.diiDeltaPp}pp.`,
  },

  ownership_N6_promoter_accumulation: {
    verdict: (ev) =>
      `Promoters have increased their holding for ${ev.quarters} straight quarters — up ${ev.cumulativePp}pp.`,
  },

  ownership_N7_pledge_release: {
    verdict: (ev) =>
      `Pledged promoter shares have fallen from ${ev.pledgeFromPct}% to ${ev.pledgeToPct}% of their holding.`,
  },
};
