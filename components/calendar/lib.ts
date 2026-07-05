// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR — pure derivations over the market-wide events feed + the held lens.
// No JSX, no fetching. This surface answers ONE question: "which upcoming catalysts
// should I pay attention to, mine first?" — a prioritized view, not a dumb grid.
//
// The Vytal layer here is the HELD JOIN: an event on a stock you own is a potential
// catalyst against a health you can read (its band). Everything is real or honest-null:
//   • an event on an unscored held name shows, with an honest "not scored" health note;
//   • a market event carries no health context (we only hold bands for owned names);
//   • sector is the backend's displayName already — never a DB key.
// Events only — no price/buy/sell/target lives here.
// ─────────────────────────────────────────────────────────────────────────────

import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfToday,
} from "date-fns";
import { Icons, type Icon } from "@/lib/icons";
import type { CalendarEvent } from "@/lib/api/hooks/use-events-calendar";
import type { Holding, StockBand } from "@/types/portfolio";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── per-type identity (label · glyph · accent) — mirrors the stock-detail Events tab so
//    an event reads the same wherever it appears. Unknown NSE types fall back gracefully. ─
export const TYPE_META: Record<string, { label: string; icon: Icon; accent: string }> = {
  earnings:      { label: "Earnings",      icon: Icons.chartBar, accent: "var(--c-steady)" },
  dividend:      { label: "Dividend",      icon: Icons.coins,    accent: "var(--p-found)" },
  bonus:         { label: "Bonus issue",   icon: Icons.spark,    accent: "var(--p-mom)" },
  split:         { label: "Stock split",   icon: Icons.scales,   accent: "var(--p-mom)" },
  buyback:       { label: "Buyback",       icon: Icons.target,   accent: "var(--p-own)" },
  board_meeting: { label: "Board meeting", icon: Icons.building, accent: "var(--p-own)" },
  agm:           { label: "AGM",           icon: Icons.crown,    accent: "var(--p-own)" },
  rights:        { label: "Rights issue",  icon: Icons.stack,    accent: "var(--p-own)" },
  record_date:   { label: "Record date",   icon: Icons.calendar, accent: "var(--p-mkt)" },
};
export function typeMeta(t: string): { label: string; icon: Icon; accent: string } {
  return TYPE_META[t] ?? { label: cap(t.replace(/_/g, " ")), icon: Icons.calendar, accent: "var(--p-own)" };
}

// ── filter grouping — the human-facing event-type buckets (§Filters). Splits/bonuses/
//    buybacks/rights/record-dates fold into "Corporate action". ────────────────────────
export type TypeGroup = "earnings" | "dividend" | "corporate_action" | "board_meeting" | "agm";
export const TYPE_GROUP_META: Record<TypeGroup, { label: string; icon: Icon }> = {
  earnings:         { label: "Earnings", icon: Icons.chartBar },
  dividend:         { label: "Dividend", icon: Icons.coins },
  corporate_action: { label: "Corporate action", icon: Icons.spark },
  board_meeting:    { label: "Board meeting", icon: Icons.building },
  agm:              { label: "AGM", icon: Icons.crown },
};
export const TYPE_GROUP_ORDER: TypeGroup[] = [
  "earnings",
  "dividend",
  "corporate_action",
  "board_meeting",
  "agm",
];
export function typeGroupOf(t: string): TypeGroup {
  if (t === "earnings") return "earnings";
  if (t === "dividend") return "dividend";
  if (t === "board_meeting") return "board_meeting";
  if (t === "agm") return "agm";
  return "corporate_action"; // bonus · split · buyback · rights · record_date · unknown
}

// ── impact tiers (priority ladder) — high(violet) > medium(gold) > low(grey). Matches
//    the Events-tab IMPACT_DOT language for one coherent legend across the app. ─────────
export type Impact = "high" | "medium" | "low";
export const IMPACT_META: Record<Impact, { label: string; color: string; rank: number }> = {
  high:   { label: "High",   color: "var(--p-mom)", rank: 0 },
  medium: { label: "Medium", color: "var(--p-mkt)", rank: 1 },
  low:    { label: "Low",    color: "var(--ink3)",  rank: 2 },
};
export function impactOf(level: string): Impact {
  return level === "high" ? "high" : level === "medium" ? "medium" : "low";
}

// ── band identity (composite condition scale) — the held stock's stored band, keyed by
//    band (never re-derived from a rounded health). ───────────────────────────────────
export const BAND_META: Record<StockBand, { label: string; color: string }> = {
  fragile:   { label: "Fragile",   color: "var(--c-fragile)" },
  below_par: { label: "Below par", color: "var(--c-below)" },
  steady:    { label: "Steady",    color: "var(--c-steady)" },
  healthy:   { label: "Healthy",   color: "var(--c-healthy)" },
  pristine:  { label: "Pristine",  color: "var(--c-pristine)" },
};

// ── horizon buckets — the timeline's spine (§Main). ──────────────────────────────────
export type Horizon = "this_week" | "next_week" | "this_month" | "later";
export const HORIZON_ORDER: Horizon[] = ["this_week", "next_week", "this_month", "later"];
export const HORIZON_META: Record<Horizon, { label: string }> = {
  this_week:  { label: "This week" },
  next_week:  { label: "Next week" },
  this_month: { label: "This month" },
  later:      { label: "Later" },
};

// ── the held lens (from the user's materialized holdings). scored ⇔ a real band exists. ─
export interface HeldInfo {
  band: StockBand | null;
  health: number | null;
  scored: boolean;
}
export function buildHeldIndex(holdings: Holding[]): Map<string, HeldInfo> {
  const m = new Map<string, HeldInfo>();
  for (const h of holdings) {
    m.set(h.symbol, {
      band: h.band,
      health: h.health,
      scored: h.band != null && h.health != null,
    });
  }
  return m;
}

// ── the enriched event — the calendar row's full read (event + held join + timing). ────
export interface CalEvent extends CalendarEvent {
  date: Date; // parsed eventDate (local midnight)
  exDateObj: Date | null;
  daysAway: number; // calendar days from today (0 = today)
  horizon: Horizon;
  impact: Impact;
  typeGroup: TypeGroup;
  isHeld: boolean;
  held: HeldInfo | null; // present ⇔ isHeld
}

// ── date bounds (computed once per mount) ────────────────────────────────────────────
export interface Bounds {
  today: Date;
  weekEnd: Date; // end of this ISO week (Sun)
  nextWeekEnd: Date; // end of next ISO week
  monthEnd: Date; // end of this month
}
export function computeBounds(): Bounds {
  const today = startOfToday();
  // On a weekend the calendar week is spent (markets shut), so "This week" reads best as
  // the business week about to start — roll the week window forward. "days away" chips
  // stay truthful (they're measured off the real today, not the rolled base).
  const dow = today.getDay(); // 0 Sun … 6 Sat
  const base = dow === 0 || dow === 6 ? addWeeks(today, 1) : today;
  return {
    today,
    weekEnd: endOfWeek(base, { weekStartsOn: 1 }),
    nextWeekEnd: endOfWeek(addWeeks(base, 1), { weekStartsOn: 1 }),
    monthEnd: endOfMonth(today),
  };
}
function horizonOf(d: Date, b: Bounds): Horizon {
  if (d <= b.weekEnd) return "this_week"; // includes today (and any tz straggler)
  if (d <= b.nextWeekEnd) return "next_week";
  if (d <= b.monthEnd) return "this_month";
  return "later";
}

export function enrichEvents(
  events: CalendarEvent[],
  held: Map<string, HeldInfo>,
  b: Bounds,
): CalEvent[] {
  return events.map((e) => {
    const date = parseISO(e.eventDate);
    const heldInfo = held.get(e.symbol) ?? null;
    return {
      ...e,
      date,
      exDateObj: e.exDate ? parseISO(e.exDate) : null,
      daysAway: differenceInCalendarDays(date, b.today),
      horizon: horizonOf(date, b),
      impact: impactOf(e.impactLevel),
      typeGroup: typeGroupOf(e.eventType),
      isHeld: heldInfo != null,
      held: heldInfo,
    };
  });
}

// ── ranking: held-first, then date, then impact (the timeline's within-horizon order) ──
export function sortForTimeline(events: CalEvent[]): CalEvent[] {
  return [...events].sort((a, z) => {
    if (a.isHeld !== z.isHeld) return a.isHeld ? -1 : 1;
    if (a.daysAway !== z.daysAway) return a.daysAway - z.daysAway;
    return IMPACT_META[a.impact].rank - IMPACT_META[z.impact].rank;
  });
}
export function groupByHorizon(events: CalEvent[]): Record<Horizon, CalEvent[]> {
  const g: Record<Horizon, CalEvent[]> = { this_week: [], next_week: [], this_month: [], later: [] };
  for (const e of events) g[e.horizon].push(e);
  for (const k of HORIZON_ORDER) g[k] = sortForTimeline(g[k]);
  return g;
}

// ── the spotlight: the single most important upcoming event. Held & high-impact win,
//    then any high-impact, then any held, then the nearest of the rest — nearest inside
//    each tier. Guarantees a pick whenever any event exists. ──────────────────────────
function spotlightTier(e: CalEvent): number {
  return (e.impact === "high" ? 0 : 2) + (e.isHeld ? 0 : 1);
}
export function selectSpotlight(all: CalEvent[]): CalEvent | null {
  if (all.length === 0) return null;
  return [...all].sort((a, z) => {
    const t = spotlightTier(a) - spotlightTier(z);
    if (t !== 0) return t;
    if (a.daysAway !== z.daysAway) return a.daysAway - z.daysAway;
    return IMPACT_META[a.impact].rank - IMPACT_META[z.impact].rank;
  })[0];
}

// ── KPIs (the "do I need to pay attention this week" strip) — computed over the FULL
//    dataset (the honest snapshot, independent of the timeline filters). ──────────────
export interface Kpis {
  heldThisWeekCount: number;
  heldThisWeekSymbols: string[];
  highImpactThisWeek: number;
  nextHeldEarnings: CalEvent | null;
  nextAnyEarnings: CalEvent | null;
  exDivThisWeekCount: number;
  nextExDiv: CalEvent | null;
}
export function computeKpis(all: CalEvent[], b: Bounds): Kpis {
  const heldSyms = new Set<string>();
  let highImpactThisWeek = 0;
  for (const e of all) {
    if (e.horizon !== "this_week") continue;
    if (e.isHeld) heldSyms.add(e.symbol);
    if (e.impact === "high") highImpactThisWeek++;
  }

  const earnings = all.filter((e) => e.eventType === "earnings");
  const nextHeldEarnings =
    [...earnings.filter((e) => e.isHeld)].sort((a, z) => a.daysAway - z.daysAway)[0] ?? null;
  const nextAnyEarnings = [...earnings].sort((a, z) => a.daysAway - z.daysAway)[0] ?? null;

  const exDiv = all
    .filter((e) => e.exDateObj != null && differenceInCalendarDays(e.exDateObj, b.today) >= 0)
    .sort((a, z) => a.exDateObj!.getTime() - z.exDateObj!.getTime());
  const exDivThisWeekCount = exDiv.filter((e) => e.exDateObj! <= b.weekEnd).length;

  return {
    heldThisWeekCount: heldSyms.size,
    heldThisWeekSymbols: [...heldSyms],
    highImpactThisWeek,
    nextHeldEarnings,
    nextAnyEarnings,
    exDivThisWeekCount,
    nextExDiv: exDiv[0] ?? null,
  };
}

// ── filters (§Filters) — single-select per category + a held/all lens toggle. ─────────
export interface CalendarFilters {
  type: TypeGroup | "all";
  impact: Impact | "all";
  sector: string | "all";
  heldOnly: boolean;
}
export const DEFAULT_FILTERS: CalendarFilters = {
  type: "all",
  impact: "all",
  sector: "all",
  heldOnly: false,
};
export function activeFilterCount(f: CalendarFilters): number {
  let n = 0;
  if (f.type !== "all") n++;
  if (f.impact !== "all") n++;
  if (f.sector !== "all") n++;
  if (f.heldOnly) n++;
  return n;
}
export function applyFilters(events: CalEvent[], f: CalendarFilters): CalEvent[] {
  return events.filter((e) => {
    if (f.heldOnly && !e.isHeld) return false;
    if (f.type !== "all" && e.typeGroup !== f.type) return false;
    if (f.impact !== "all" && e.impact !== f.impact) return false;
    if (f.sector !== "all" && (e.sector ?? "") !== f.sector) return false;
    return true;
  });
}
export function typeGroupOptions(events: CalEvent[]): TypeGroup[] {
  const present = new Set(events.map((e) => e.typeGroup));
  return TYPE_GROUP_ORDER.filter((g) => present.has(g));
}
export function sectorOptions(events: CalEvent[]): string[] {
  const s = new Set<string>();
  for (const e of events) if (e.sector) s.add(e.sector);
  return [...s].sort((a, z) => a.localeCompare(z));
}

// ── formatting ───────────────────────────────────────────────────────────────────────
export const fmtRupee = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const fmtDate = (d: Date) => format(d, "d MMM"); // "6 Jul"
export const fmtDay = (d: Date) => format(d, "EEE"); // "Mon"
export const fmtFull = (d: Date) => format(d, "EEE, d MMM yyyy"); // "Mon, 6 Jul 2026"
export function daysAwayLabel(daysAway: number): string {
  if (daysAway <= 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  if (daysAway < 7) return `In ${daysAway} days`;
  if (daysAway < 14) return "Next week";
  return `In ${Math.round(daysAway / 7)} weeks`;
}

/** The event's own headline detail (₹/share · ratio · results), if the type carries one.
 *  Returns null when the type has no structured detail beyond its dates. */
export function eventDetail(e: CalEvent): string | null {
  switch (e.eventType) {
    case "dividend":
      if (e.dividendAmount != null) {
        return `${fmtRupee(e.dividendAmount)}/sh${e.dividendType ? ` · ${cap(e.dividendType)}` : ""}`;
      }
      return e.description ? null : "To be considered";
    case "bonus":
      return e.bonusRatio ? `Bonus ${e.bonusRatio}` : null;
    case "split":
      return e.splitRatio ? `Split ${e.splitRatio}` : null;
    case "earnings":
      return "Quarterly results";
    default:
      return null;
  }
}

/** The held health context sentence for a row/spotlight, plus the rounded composite score
 *  (null ⇔ unscored held). null return ⇔ not a held name. */
export function healthContext(
  e: CalEvent,
): { text: string; band: StockBand | null; score: number | null } | null {
  if (!e.isHeld || !e.held) return null;
  if (!e.held.scored || e.held.band == null) return { text: "Held · not scored", band: null, score: null };
  const score = e.held.health != null ? Math.round(e.held.health) : null;
  return { text: `Held · currently ${BAND_META[e.held.band].label}`, band: e.held.band, score };
}

// ── date-range window (the timeline's presets + custom range, §3) ────────────────────
export type RangePresetKey = "all" | "today" | "tomorrow" | "this_week" | "this_month" | "custom";
export interface DateRange {
  from: Date;
  to: Date;
}
export const RANGE_PRESETS: { key: Exclude<RangePresetKey, "custom">; label: string }[] = [
  { key: "all", label: "All upcoming" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "this_week", label: "This week" },
  { key: "this_month", label: "This month" },
];

/** The concrete [from,to] window for a preset. null ⇔ "all" (no restriction). */
export function presetRange(key: Exclude<RangePresetKey, "custom">, b: Bounds): DateRange | null {
  switch (key) {
    case "all":
      return null;
    case "today":
      return { from: b.today, to: b.today };
    case "tomorrow": {
      const t = addDays(b.today, 1);
      return { from: t, to: t };
    }
    case "this_week":
      return { from: b.today, to: b.weekEnd };
    case "this_month":
      return { from: b.today, to: b.monthEnd };
  }
}

/** Human label for the active range control (button face). */
export function rangeLabel(preset: RangePresetKey, custom: DateRange | null): string {
  if (preset === "custom" && custom) {
    return isSameDayLoose(custom.from, custom.to)
      ? fmtDate(custom.from)
      : `${fmtDate(custom.from)} – ${fmtDate(custom.to)}`;
  }
  return RANGE_PRESETS.find((p) => p.key === preset)?.label ?? "All upcoming";
}
function isSameDayLoose(a: Date, z: Date) {
  return format(a, "yyyy-MM-dd") === format(z, "yyyy-MM-dd");
}

/** Filter to events whose date falls inside [from,to] (inclusive, day-granular). */
export function eventsInRange(events: CalEvent[], range: DateRange | null): CalEvent[] {
  if (!range) return events;
  const lo = startOfDay(range.from).getTime();
  const hi = endOfDay(range.to).getTime();
  return events.filter((e) => {
    const t = e.date.getTime();
    return t >= lo && t <= hi;
  });
}
