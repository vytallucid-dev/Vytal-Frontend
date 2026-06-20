/**
 * Shared formatting + health-score helpers for the InvestIQ design system.
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

export function healthBand(score: number): HealthBand {
  if (score >= 74) return "pristine";
  if (score >= 68) return "healthy";
  if (score >= 62) return "steady";
  if (score >= 55) return "below";
  return "fragile";
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
