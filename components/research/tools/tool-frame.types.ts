/**
 * THE FRAME SEAM — the contract every research tool (Trajectory / Divergence /
 * Ownership) fills to drop into the shared <ToolFrame>.
 *
 * ── What the FRAME owns (never re-implemented by a tool) ──────────────────────
 *   • the responsive single-view GRID (desktop 50/50, mobile single-column)
 *   • the shared HOVER/SCRUB state (one "active datapoint", below)
 *   • DUAL-ENTRY (cold landing scan ↔ warm single view) off `symbol`
 *   • the NAME-SWITCHER (reskinned sheet) + typeahead over the scored universe
 *   • the WINDOW switcher (1Y/2Y/3Y → 4/8/12)
 *   • the promoted-READ slot (full-width, above the grid)
 *   • the FUNNEL-BACK link, the top strip, loading / error / empty chrome
 *
 * ── What a TOOL supplies (the slots below) ────────────────────────────────────
 *   (a) a centerpiece CHART — half-width-ready, takes the active datapoint + an
 *       onActiveChange callback, draws the scrub marker (renderChart)
 *   (b) the hover-READOUT content for the active datapoint (renderReadout)
 *   (c) the static SUMMARY content (renderSummary)
 *   (d) the promoted READ (promotedRead) + header chips + identity
 *   (e) a landing-scan data source + card renderer (LandingSlots)
 *
 * The active datapoint is the ONE source of truth: the chart SETS it, the readout
 * READS it — they can never desync.
 */

import type { ReactNode } from "react";
import type { Icon } from "@/lib/icons";
import type { ScoredStockLite } from "@/types/research-tools";

/**
 * THE WINDOW MODEL — a discriminated union carrying BOTH cadences behind one prop.
 *   • quarterly → slices the per-quarter `trajectory.series` (the original 1Y/2Y/3Y)
 *   • daily     → slices `trajectory.dailySeries` to the last N calendar days (60/30/15D)
 *   • custom    → slices `dailySeries` to an arbitrary start–end (clamped to retention)
 * The daily/custom modes read the SAME payload — the health endpoint always ships
 * `dailySeries` + `resultDays` regardless of the fetch's quarter count — so switching
 * cadence is a pure client-side re-slice; only `quarters` re-keys the fetch.
 */
export type QuarterCount = 4 | 8 | 12;
export type DayCount = 60 | 30 | 15;
export type ToolWindow =
  | { mode: "quarterly"; quarters: QuarterCount }
  | { mode: "daily"; days: DayCount }
  | { mode: "custom"; start: string; end: string };

/** The default resting window — 3Y quarterly (preserves the original tool behaviour). */
export const DEFAULT_WINDOW: ToolWindow = { mode: "quarterly", quarters: 12 };

/** The quarter count a window fetches with. Daily/custom keep the full 3Y quarterly
 *  series available (and a stable query key) while they re-slice the daily series. */
export function windowQuarters(w: ToolWindow): QuarterCount {
  return w.mode === "quarterly" ? w.quarters : 12;
}

/** Stable identity string for a window — used to reset the shared scrub state on change
 *  (a plain object prop would be a new ref every render). */
export function windowKey(w: ToolWindow): string {
  if (w.mode === "quarterly") return `q${w.quarters}`;
  if (w.mode === "daily") return `d${w.days}`;
  return `c${w.start}_${w.end}`;
}

export const QUARTER_OPTIONS: { label: string; value: QuarterCount }[] = [
  { label: "1Y", value: 4 },
  { label: "2Y", value: 8 },
  { label: "3Y", value: 12 },
];

export const DAY_OPTIONS: { label: string; value: DayCount }[] = [
  { label: "60D", value: 60 },
  { label: "30D", value: 30 },
  { label: "15D", value: 15 },
];

/**
 * The shared hover/scrub state. `index` is a position into the tool's WINDOWED
 * series; `null` = resting (chart + readout both fall back to the latest point).
 * Tool-agnostic on purpose — the frame holds it, the tool interprets it.
 */
export interface ActiveDatapoint {
  index: number | null;
}

export interface ChipSpec {
  label: string;
  /** CSS color (var or token) for text + hairline border tint. */
  color?: string;
  /** CSS color for a leading dot. */
  dot?: string;
}

/** The promoted read banner — interpretation sentence above the grid. */
export interface PromotedRead {
  /** drives the banner accent. */
  tone: "rec" | "high" | "ctx" | "crit" | "neutral";
  title: string;
  body: string;
  /** masked/deferred caveat (e.g. hot pond) — null when not applicable. */
  note?: string | null;
}

/** Tool identity + landing copy. */
export interface ToolMeta {
  id: string;
  name: string;
  Icon: Icon;
  /** accent color (CSS var) for the tool glyph + landing hero. */
  accentVar: string;
  landingTitle: string;
  landingSubtitle: string;
  landingEyebrow: string;
  scopeTag: string;
  searchPlaceholder: string;
}

/** The SINGLE (warm) view a tool supplies. */
export interface SingleViewSlots {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** honest blocking full-state (frame renders a calm panel). Default title is
   *  "{name} isn't scored yet"; pass `title` to override (e.g. "No data for …" when a
   *  tool blanks on data-absence rather than score-absence). */
  notScored?: { reason: string; title?: string } | null;
  /** honest single-period "building history" state (frame renders a panel). */
  buildingHistory?: boolean;
  /** Available daily-history bounds (raw ISO, oldest→newest) — the retention envelope the
   *  custom-range picker clamps to. null when the stock has no daily score history yet
   *  (the switcher then disables the daily/custom options). */
  dailyBounds?: { first: string; last: string } | null;
  identity: { name: string; ticker: string; sub: string };
  chips: ChipSpec[];
  promotedRead: PromotedRead | null;
  /** funnel-back: /research/stock-screener/[symbol]?tab=health */
  funnelBackHref: string;
  /** left column — the centerpiece chart, sized to its column. Receives the shared
   *  active datapoint + setter so the chart drives the readout. */
  renderChart: (active: ActiveDatapoint, setActive: (a: ActiveDatapoint) => void) => ReactNode;
  /** top-right — the LIVE readout, updates as `active` changes. */
  renderReadout: (active: ActiveDatapoint) => ReactNode;
  /** bottom-right — the static summary / interpretation. */
  renderSummary: () => ReactNode;
}

/** The LANDING (cold) scan a tool supplies. The hero search is frame-owned
 *  (a scored-universe typeahead); these cards are the curated "top picks". */
export interface LandingSlots<T = unknown> {
  items: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  renderCard: (item: T, onSelect: (symbol: string) => void) => ReactNode;
  /** key extractor for list rendering. */
  keyOf: (item: T) => string;
}

export interface ToolFrameProps {
  meta: ToolMeta;
  /** null → cold landing; set → warm single view. */
  symbol: string | null;
  window: ToolWindow;
  onWindowChange: (w: ToolWindow) => void;
  onSelectSymbol: (symbol: string) => void;
  onHome: () => void;
  /** scored universe for the name-switcher + typeahead. */
  stocks: ScoredStockLite[] | undefined;
  stocksLoading?: boolean;
  landing: LandingSlots;
  single: SingleViewSlots | null;
}
