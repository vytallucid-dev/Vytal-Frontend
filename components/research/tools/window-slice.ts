/**
 * SHARED WINDOW SLICING — the one place both research tools (Trajectory / Divergence)
 * turn a `ToolWindow` + the health payload's trajectory block into the exact points a
 * chart draws. Quarterly windows slice the per-quarter `series`; daily windows slice
 * `dailySeries` to the last N calendar days; custom slices to an arbitrary start–end
 * (clamped to whatever daily retention actually holds — never fabricated).
 *
 * The daily/custom modes read the SAME payload the tools already fetch — the health
 * endpoint always ships `dailySeries` + `resultDays` regardless of the fetch's quarter
 * count — so this is a pure client-side re-slice. See health-view.service.ts.
 */

import { shortPeriod } from "@/components/stock-detail/health/shared";
import type {
  TrajectoryPoint,
  DailyTrajectoryPoint,
  ResultDayMarker,
} from "@/types/health";
import type { ToolWindow } from "./tool-frame.types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-06-29" → "29 Jun" for the daily x-axis. */
export function shortDay(asOfDate: string): string {
  const [, m, d] = asOfDate.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? m}`;
}

/** One windowed point, cadence-agnostic. `x` is the axis label (short period on a
 *  quarterly window, short day on daily/custom); `asOfDate` + `periodKey` are present
 *  only on daily points (used for result-marker matching + custom clamping). */
export interface WindowPoint {
  x: string;
  asOfDate: string | null;
  periodKey: string | null;
  composite: number;
  foundation: number;
  momentum: number;
  market: number;
  ownership: number;
}

/** A result-day marker positioned onto the current daily window (x-value that exists
 *  in the sliced points). Empty on quarterly windows / when none land in-window. */
export interface ResultMark {
  x: string;
  periodKey: string;
}

export interface SlicedWindow {
  points: WindowPoint[];
  /** true on daily + custom windows — F/M render held (dashed), info line shows. */
  isDaily: boolean;
  /** result-day markers inside the window (daily/custom only). */
  resultMarks: ResultMark[];
  /** honest note when a custom start predates available daily history. */
  clampedEarlier: boolean;
  /** short pill label — "N quarters" / "N days". */
  pillLabel: string;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function fromQuarterly(pt: TrajectoryPoint): WindowPoint {
  return {
    x: shortPeriod(pt.periodKey),
    asOfDate: null,
    periodKey: null,
    composite: r1(pt.composite),
    foundation: r1(pt.foundation),
    momentum: r1(pt.momentum),
    market: r1(pt.market),
    ownership: r1(pt.ownership),
  };
}

function fromDaily(pt: DailyTrajectoryPoint): WindowPoint {
  return {
    x: shortDay(pt.asOfDate),
    asOfDate: pt.asOfDate,
    periodKey: pt.periodKey,
    composite: r1(pt.composite),
    foundation: r1(pt.foundation),
    momentum: r1(pt.momentum),
    market: r1(pt.market),
    ownership: r1(pt.ownership),
  };
}

/** The available daily-history bounds (raw ISO), or null when there's no usable daily
 *  history. Powers the custom-range picker clamp + the switcher's daily-enabled gate. */
export function dailyBoundsOf(
  dailySeries: DailyTrajectoryPoint[] | undefined,
): { first: string; last: string } | null {
  const d = dailySeries ?? [];
  if (d.length < 2) return null;
  return { first: d[0].asOfDate, last: d[d.length - 1].asOfDate };
}

/**
 * Slice the trajectory block to the selected window. `series` is the per-quarter
 * series; `dailySeries` / `resultDays` are the daily block (both already on the
 * payload). Custom bounds clamp to available history — never extended past retention.
 */
export function sliceWindow(
  window: ToolWindow,
  series: TrajectoryPoint[],
  dailySeries: DailyTrajectoryPoint[] | undefined,
  resultDays: ResultDayMarker[] | undefined,
): SlicedWindow {
  const daily = (dailySeries ?? []).map(fromDaily);
  const dailyFirst = daily.length ? daily[0].asOfDate! : null;
  const dailyLast = daily.length ? daily[daily.length - 1].asOfDate! : null;

  if (window.mode === "quarterly") {
    const all = series.map(fromQuarterly);
    const points = window.quarters === Infinity ? all : all.slice(-window.quarters);
    return {
      points,
      isDaily: false,
      resultMarks: [],
      clampedEarlier: false,
      pillLabel: `${points.length} quarters`,
    };
  }

  // ── daily / custom: slice the daily series on real asOfDate ──
  let points: WindowPoint[];
  let clampedEarlier = false;
  if (window.mode === "custom") {
    const start = window.start || dailyFirst || "";
    const end = window.end || dailyLast || "";
    points = daily.filter((p) => (!start || p.asOfDate! >= start) && (!end || p.asOfDate! <= end));
    clampedEarlier = !!window.start && !!dailyFirst && window.start < dailyFirst;
  } else {
    // fixed daily window: last N calendar days back from the latest daily point.
    if (dailyLast) {
      const cutoff = new Date(new Date(dailyLast).getTime() - window.days * 24 * 60 * 60 * 1000);
      points = daily.filter((p) => new Date(p.asOfDate!) >= cutoff);
    } else {
      points = [];
    }
  }

  const winXs = new Set(points.map((p) => p.x));
  const resultMarks: ResultMark[] = (resultDays ?? [])
    .map((r) => ({ x: shortDay(r.asOfDate), periodKey: r.periodKey }))
    .filter((r) => winXs.has(r.x));

  return {
    points,
    isDaily: true,
    resultMarks,
    clampedEarlier,
    pillLabel: `${points.length} days`,
  };
}

// ── held-aware cadence model (mirrors the Health-tab section) ──────────────────────
// Market & Ownership recompute daily (their score moves day-to-day); Foundation &
// Momentum step only per quarter. On a DAILY window the x-axis is finer than F/M's
// clock, so those two lines render HELD (dashed) — flat between quarter steps, which is
// TRUE, not interpolated. On a quarterly window nothing is held.
export type LineKey = "composite" | "foundation" | "momentum" | "market" | "ownership";
const PILLAR_IS_DAILY: Record<LineKey, boolean> = {
  composite: true, // moves daily (Market + Ownership feed it)
  foundation: false,
  momentum: false,
  market: true,
  ownership: true,
};
/** A line is HELD when the chart is daily but the line's own clock is quarterly. */
export function isHeld(key: LineKey, isDailyWindow: boolean): boolean {
  return isDailyWindow && !PILLAR_IS_DAILY[key];
}
