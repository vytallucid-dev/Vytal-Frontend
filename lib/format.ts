/**
 * Shared formatting + health-score helpers for the Vytal design system.
 * Indian numbering conventions (lakh / crore) where appropriate.
 */

export function formatINR(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    const abs = Math.abs(value);
    if (abs >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `₹${(value / 1e5).toFixed(2)}L`;
    if (abs >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value: number, withSign = true) {
  const sign = value > 0 && withSign ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatCompact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}

/**
 * Health-score CONDITION SCALE — the locked 5-band identity of the design system.
 * red → amber → gold → green → COOL BLUE (pristine is deliberately not green).
 * Drives color, label and Tailwind token across the whole app.
 */
export type HealthBand = "fragile" | "below" | "steady" | "healthy" | "pristine";

/**
 * THE CUTS, as data — lower-bound-inclusive, ordered high→low, mirroring the backend's single
 * source (scoring/composite/label.ts LABEL_BAND_MAP: <55 Fragile | [55,62) Below par |
 * [62,68) Steady | [68,74) Healthy | ≥74 Pristine).
 *
 * ★ EXPORTED ON PURPOSE. The methodology page publishes these ranges to readers, and a page that
 * hand-types "68 – 74" beside a `healthBand()` that says something else is exactly the drift this
 * whole change exists to remove. One table: the classifier reads it, the page renders it.
 * (Publishing them is not a moat breach — they already ship in this client bundle, and they label
 * a number the reader can already see. They say nothing about how that number was BUILT.)
 */
export const HEALTH_BAND_CUTS: readonly { band: HealthBand; min: number }[] = [
  { band: "pristine", min: 74 },
  { band: "healthy", min: 68 },
  { band: "steady", min: 62 },
  { band: "below", min: 55 },
  { band: "fragile", min: -Infinity },
];

export function healthBand(score: number): HealthBand {
  return (HEALTH_BAND_CUTS.find((c) => score >= c.min) ?? HEALTH_BAND_CUTS[HEALTH_BAND_CUTS.length - 1]).band;
}

const BAND_LABEL: Record<HealthBand, string> = {
  pristine: "Pristine",
  healthy: "Healthy",
  steady: "Steady",
  below: "Below par",
  fragile: "Fragile",
};

const BAND_VAR: Record<HealthBand, string> = {
  pristine: "var(--c-pristine)",
  healthy: "var(--c-healthy)",
  steady: "var(--c-steady)",
  below: "var(--c-below)",
  fragile: "var(--c-fragile)",
};

const BAND_TEXT: Record<HealthBand, string> = {
  pristine: "text-pristine",
  healthy: "text-healthy",
  steady: "text-steady",
  below: "text-below",
  fragile: "text-fragile",
};

export function healthLabel(score: number) {
  return BAND_LABEL[healthBand(score)];
}

/** Display a health/condition SCORE as a whole number — the ONE place the app rounds a score for
 *  display, so every surface reads it the same way. A score is a judgement shown to a person: the
 *  fourth decimal of `55.9149` is noise, not signal. ⚠ NOT for calculation receipts — a deduction
 *  ledger's `−6.21` is a proof and keeps its decimals; this is only for the headline score a user reads. */
export function roundScore(score: number): number {
  return Math.round(score);
}

/** Returns the CSS color VAR string for a health score (use in inline styles / SVG). */
export function healthColorVar(score: number) {
  return BAND_VAR[healthBand(score)];
}

/** Tailwind text class for a health score. */
export function healthTextClass(score: number) {
  return BAND_TEXT[healthBand(score)];
}

export function changeColor(value: number) {
  return value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-muted-foreground";
}
