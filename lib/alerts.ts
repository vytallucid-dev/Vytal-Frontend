// ─────────────────────────────────────────────────────────────────────────────
// ALERTS — pure derivations (no JSX, no fetching). Phrasing for the create-modal
// preview, the management-list condition, and the fired-events feed — plus the small
// domain constants (band order/labels, finding catalog, per-type repeat defaults).
//
// The feed phrases DISCRETE crossings in the PAST tense ("dropped below Steady") — a
// crossing that happened once, never a standing status. Band labels/colours mirror the
// watchlist BAND_META (same --c-* vars); kept local so this stays a leaf module.
// ─────────────────────────────────────────────────────────────────────────────

import type { LabelBand } from "@/types/health";
import type { Alert, AlertOperator, AlertRepeatMode, AlertType, AlertEvent } from "@/types/alerts";
import { FINDING_NAMES, findingName } from "@/lib/findings/descriptions";

// ── band identity (fragile < below_par < steady < healthy < pristine) ───────────────
export const BAND_ORDER: LabelBand[] = ["fragile", "below_par", "steady", "healthy", "pristine"];
export const BAND_LABEL: Record<LabelBand, string> = {
  fragile: "Fragile",
  below_par: "Below par",
  steady: "Steady",
  healthy: "Healthy",
  pristine: "Pristine",
};
export const BAND_CVAR: Record<LabelBand, string> = {
  fragile: "var(--c-fragile)",
  below_par: "var(--c-below)",
  steady: "var(--c-steady)",
  healthy: "var(--c-healthy)",
  pristine: "var(--c-pristine)",
};
export const bandLabel = (b: LabelBand | null | undefined): string => (b ? BAND_LABEL[b] : "—");

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ── finding catalog for the picker (specific finding, or "any new finding") ────────────────────────
//
// ★ 1d · THE PICKER FETCHES ITS OWN 1.9 KB PROJECTION, NOT THE 54 KB DOCUMENT.
//
// This list used to be built at MODULE EVAL from the bundled FINDING_NAMES — which is why it could
// not simply read the catalogue store: a module-eval constant is computed before any fetch has
// happened, so it would freeze the bundled names for the life of the tab no matter what the endpoint
// later returned. It now has a hook (`useFindingOptions`) with a real loading state.
//
// The picker takes GET /api/v1/catalogue/names — key → name and nothing else. A dropdown has no use
// for descriptions, boundaries, families or concerns, and 54 KB to draw a <select> is the kind of
// cost nobody notices until it is a bundle review.
//
// ⚠ FINDING_OPTIONS IS RETAINED AS THE FALLBACK LIST, and the hook returns it while loading and on
// failure — so the picker is never empty and a reader can always set an alert.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
export interface FindingOption {
  key: string;
  name: string;
}

const byName = (a: FindingOption, b: FindingOption) => a.name.localeCompare(b.name);

/** The BUNDLED list — the fallback, and what the hook returns while the 1.9 KB fetch is in flight. */
export const FINDING_OPTIONS: FindingOption[] = Object.entries(FINDING_NAMES)
  .map(([key, name]) => ({ key, name }))
  .sort(byName);

/** Build the option list from a served name map. Same shape, same ordering, one source. */
export const findingOptionsFrom = (names: Record<string, string>): FindingOption[] =>
  Object.entries(names)
    .map(([key, name]) => ({ key, name }))
    .sort(byName);

/**
 * The display name for a finding key. Reads the SERVED catalogue first (via the same store the four
 * resolvers use), then the bundled map, then the raw key.
 *
 * ⚠ This is a function, not a constant, so it picks up the served name the moment the store hydrates
 * — which is what lets the alert LIST and the fired-events FEED speak the canonical vocabulary
 * without either of them being touched.
 */
export const findingLabel = (key: string): string => findingName(key);

// ── per-type accent — three DISTINCT hues (blue / violet / amber) so the type is legible
//    at a glance and never two-of-a-kind. Shared by the modal, the bell, and the manage
//    row so every alert surface speaks the same colour language. ──────────────────────
export const ALERT_TYPE_TINT: Record<AlertType, string> = {
  price: "var(--primary)", // cool blue (#4ea1e6)
  health_band: "var(--p-mom)", // violet (#a085d8)
  finding: "var(--high)", // amber (#e0a13e)
};

// ── per-type sensible repeat default (overridable by the user) ───────────────────────
// Price is usually a one-time target ("tell me when it hits ₹X"); health is a standing
// watch you want re-notified on each fresh crossing; a new finding likewise.
export const DEFAULT_REPEAT: Record<AlertType, AlertRepeatMode> = {
  price: "one_shot",
  health_band: "repeating",
  finding: "repeating",
};

export const REPEAT_COPY: Record<AlertRepeatMode, { label: string; blurb: string }> = {
  one_shot: { label: "Once", blurb: "Notifies once, then turns itself off." },
  repeating: { label: "Repeating", blurb: "Notifies on each fresh crossing — not daily while it stays." },
};

// ── ₹ formatting for thresholds ─────────────────────────────────────────────────────
export function fmtInr(v: number): string {
  const whole = Number.isInteger(v);
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

// ── condition predicate — reads naturally after "<symbol> …" (present tense) ─────────
interface ConditionShape {
  type: AlertType;
  operator: AlertOperator;
  thresholdPrice: number | null;
  thresholdBand: LabelBand | null;
  findingKey: string | null;
}
export function conditionPredicate(a: ConditionShape): string {
  if (a.type === "price") {
    const p = a.thresholdPrice != null ? fmtInr(a.thresholdPrice) : "—";
    return a.operator === "above" ? `price rises above ${p}` : `price drops below ${p}`;
  }
  if (a.type === "health_band") {
    const b = bandLabel(a.thresholdBand);
    return a.operator === "above" ? `health rises above ${b}` : `health drops below ${b}`;
  }
  // finding
  return a.findingKey ? `flags “${findingLabel(a.findingKey)}”` : "flags any new finding";
}

/** The live modal preview: "We'll alert you when TCS's price drops below ₹1,400." */
export function draftPreview(a: ConditionShape, symbol: string): string {
  return `We’ll alert you when ${symbol} ${conditionPredicate(a)}.`;
}

// ── the fired-events feed — a DISCRETE past-tense crossing, split symbol / text ──────
const findingNamesFromSnapshot = (snapshot: string): string =>
  snapshot
    .split(",")
    .map((k) => findingLabel(k.trim()))
    .filter(Boolean)
    .join(", ") || snapshot;

/**
 * Phrase one fired event. Uses the joined alert (by alertId) for the operator + threshold
 * (the crossing the user set); the event's `snapshot` is the value AT fire (used for the
 * finding key, and as a price fallback). Events never outlive their alert (cascade), so
 * `alert` is normally present; the snapshot-only fallback is defensive.
 */
export function eventPhrase(ev: AlertEvent, alert?: Alert): { symbol: string; text: string } {
  const symbol = ev.symbol ?? alert?.symbol ?? "—";
  if (alert?.type === "price") {
    const p = alert.thresholdPrice != null ? fmtInr(alert.thresholdPrice) : `₹${ev.snapshot}`;
    return { symbol, text: alert.operator === "above" ? `crossed ${p}` : `fell below ${p}` };
  }
  if (alert?.type === "health_band") {
    const b = alert.thresholdBand ? BAND_LABEL[alert.thresholdBand] : ev.snapshot;
    return { symbol, text: alert.operator === "above" ? `rose above ${b}` : `dropped below ${b}` };
  }
  if (alert?.type === "finding") {
    return { symbol, text: `new finding — ${findingNamesFromSnapshot(ev.snapshot)}` };
  }
  return { symbol, text: ev.snapshot };
}

// ── relative time for the feed ("just now" / "3h ago" / "2 days ago" / "5 Jul") ──────
export function relativeTime(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const min = Math.floor((now - t) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day} days ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
