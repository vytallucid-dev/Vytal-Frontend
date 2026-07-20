"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO CHART — one shared component, TWO LENSES, honestly separated:
//
//  • VALUE   (₹ NAV over time) — "how big is my book". The raw market-value area chart.
//    Grows with deposits AND performance, so it can climb green while returns are negative —
//    it answers "what's it worth", never "how am I doing".
//  • RETURNS (time-weighted return, GET /me/portfolio/twr, indexed to 100) — "how have my
//    investments actually done". Cash-flow-neutral: deposits/sells don't read as return, so a
//    deposit-driven book reads flat and a real gain climbs. This is the honest performance answer.
//
// The vs-Nifty benchmark overlay belongs with the RETURNS lens (both lines TWR-indexed to 100,
// carry-forward aligned onto the visible NAV days). It is left exactly as it was — the toggle
// simply only appears in the Returns lens.
//
// Placements: Overview + Performance render the toggle (default Returns). The Dashboard renders
// `compact` — a chrome-less glance locked to Returns, so its mini-line agrees with the hero's
// total-return number instead of contradicting it.
//
// Custom responsive SVG (trajectory/price-chart approach): scrubbable, HTML label overlay,
// adaptive y-domain. Read-only — series are the truth; selectors slice, nothing is recomputed.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useRef, useState } from "react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePortfolioBenchmark } from "@/lib/api/hooks/use-portfolio-benchmark";
import { usePortfolioTwr } from "@/lib/api/hooks/use-portfolio-twr";
import type { BrokerExcluded, NavPoint } from "@/types/portfolio";
import { brokerGapValue } from "../lib";
import { Kicker } from "./shared";

/** The two lenses over the same chart. */
export type ChartLens = "value" | "returns";

// The DEEPEST honest range is PER-BOOK, and the backend already knows it (meta.maxRange):
//   • "ALL"  — a stock-only book, whose equity depth comes from daily_prices (not the 4-year weekly
//              store) and can reach further back than 4 years → "All" genuinely is all, so it renders.
//   • "4Y"   — a blended book: add any non-stock and the series caps at 4y (the weekly store is
//              trimmed to 4y by a DB trigger), so "All" is dropped and 4Y is the ceiling.
// The picker changing with the book is the honest signal — not a bug, and never a flat guess.
const ALL_PERIODS: { key: string; days: number | null }[] = [
  { key: "1M", days: 30 },
  { key: "6M", days: 182 },
  { key: "1Y", days: 365 },
  { key: "3Y", days: 1095 },
  { key: "4Y", days: 1461 },
  { key: "All", days: null },
];
/** Visible presets for a book whose series honestly reaches `maxRange`: "ALL" keeps the "All"
 *  button, anything else (blended → "4Y") drops it. Undefined (meta not in yet) is conservative. */
function periodsFor(maxRange: string | undefined): { key: string; days: number | null }[] {
  return maxRange === "ALL" ? ALL_PERIODS : ALL_PERIODS.slice(0, 5);
}
/** Default preset: the whole history ("All") when it's honestly offered, else the 4Y ceiling. */
function defaultPeriod(maxRange: string | undefined): string {
  return maxRange === "ALL" ? "All" : "4Y";
}

const NIFTY_COLOR = "var(--ctx)"; // muted blue-grey reference line
const VBW = 800; // viewBox width (stretched to the container via preserveAspectRatio="none")

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dParts = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return { y, m, d }; };
const fmtTooltipDate = (iso: string) => { const { y, m, d } = dParts(iso); return `${d} ${MON[m - 1]} ${y}`; };
const fmtAxisDate = (iso: string, longSpan: boolean) => {
  const { y, m, d } = dParts(iso);
  return longSpan ? `${MON[m - 1]} '${String(y).slice(2)}` : `${d} ${MON[m - 1]}`;
};
function isoMinusDays(iso: string, days: number): string {
  const dt = new Date(iso + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
}
const pathFrom = (ys: number[], xOf: (i: number) => number, yOf: (v: number) => number) =>
  ys.map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");

// index value → signed % return from the window base (100), and its up/down colour.
const signPctStr = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`;
const signColor = (v: number) => (v >= 0 ? "var(--success)" : "var(--danger)");

/** The ₹ broker gap to disclose, or null when there is nothing honest to say (no broker
 *  holdings, or a broker leg with no priced value). A zero-rupee "gap" is not a gap — `brokerGapValue`
 *  (shared from ../lib, so the tiles and this caption agree) encodes that rule. */

/** Carry-forward align a sorted series onto `dates`: each date takes the last value ≤ it
 *  (a gap reuses the prior value; null until the first). The one gap rule that was right. */
function carryForward<T extends { date: string }>(pts: T[], val: (p: T) => number, dates: string[]): (number | null)[] {
  let j = 0;
  let last: number | null = null;
  return dates.map((d) => {
    while (j < pts.length && pts[j].date <= d) { last = val(pts[j]); j++; }
    return last;
  });
}

/** Carry-forward a series onto `dates` and re-index to 100 at the window's first point.
 *  Returns null until the window's base is resolvable (needs ≥2 points + a base value). */
function indexTo100<T extends { date: string }>(pts: T[] | undefined, val: (p: T) => number, dates: string[]): number[] | null {
  if (!pts?.length || dates.length < 2) return null;
  const at = carryForward(pts, val, dates);
  const base = at[0];
  if (base == null || base === 0) return null;
  return at.map((v) => ((v ?? base) / base) * 100);
}

export function NavChart({
  series,
  range,
  defaultLens = "returns",
  lockLens = false,
  compact = false,
  brokerGap,
  maxRange,
}: {
  series: NavPoint[];
  range?: { start: string | null; end: string | null };
  /** Which lens the chart opens on. Overview/Performance default to Returns. */
  defaultLens?: ChartLens;
  /** Hide the lens toggle and pin the lens (Dashboard = locked Returns). */
  lockLens?: boolean;
  /** Chrome-less glance variant: no header/axes/scrub/caption, short height (Dashboard hero). */
  compact?: boolean;
  /** (Ruling C) The broker-linked holdings the ledgered series can't reach, from the NAV meta.
   *  When non-zero, the chart discloses the gap — the series covers less than the overview, and
   *  says so. `null`/absent ⇒ no broker holdings ⇒ no disclosure. */
  brokerGap?: BrokerExcluded | null;
  /** The book's honest deepest range (NAV meta): "ALL" (stock-only) offers the "All" button; "4Y"
   *  (blended) drops it. Drives the uncontrolled picker + its default. Absent ⇒ conservative (no All). */
  maxRange?: string;
}) {
  // CONTROLLED when a `range` is supplied (the Performance tab owns one period selector that
  // drives the whole tab): the chart hides its own period buttons and slices to the parent's
  // window. UNCONTROLLED (Overview) keeps its internal 1M/6M/1Y/3Y/4Y selector.
  const controlled = range !== undefined;
  const [lens, setLens] = useState<ChartLens>(defaultLens);
  // Uncontrolled (Overview): the picker + its default come from the book's honest maxRange. Available
  // at mount (this chart only renders once NAV data — and its meta — has arrived).
  const [period, setPeriod] = useState(() => defaultPeriod(maxRange));
  const periods = periodsFor(maxRange);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [benchmark, setBenchmark] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // (Ruling C) The ledgered series omits broker-linked holdings that the overview includes — when
  // that gap is real, the chart names it (below) on every surface, compact included. Never a warning.
  const gapValue = brokerGapValue(brokerGap);

  // compact is always a locked glance; the toggle never renders there.
  const effectiveLens: ChartLens = lockLens || compact ? defaultLens : lens;
  const returnsMode = effectiveLens === "returns";
  // The vs-Nifty comparison belongs with the Returns lens only (it's an index-to-100 overlay,
  // meaningless against a ₹ value line) and never on the compact glance.
  const showBenchmarkToggle = returnsMode && !compact;
  const benchOn = benchmark && showBenchmarkToggle;

  // Returns needs TWR; the comparison additionally needs the Nifty series. Both lazy.
  const twrQ = usePortfolioTwr(returnsMode);
  const benchQ = usePortfolioBenchmark(benchOn);

  // Client-side slice for the selectors — honest-short: a window younger than the history
  // simply returns fewer points (never padded).
  const sliced = useMemo(() => {
    if (series.length === 0) return series;
    if (controlled) {
      const start = range?.start ?? null;
      const end = range?.end ?? null;
      let w = series;
      if (start) w = w.filter((p) => p.date >= start);
      if (end) w = w.filter((p) => p.date <= end);
      return w.length >= 2 ? w : series.slice(-2);
    }
    const days = ALL_PERIODS.find((p) => p.key === period)?.days ?? null;
    if (days == null) return series;
    const cutoff = isoMinusDays(series[series.length - 1].date, days);
    const w = series.filter((p) => p.date >= cutoff);
    return w.length >= 2 ? w : series.slice(-2); // keep the chart drawable
  }, [series, period, controlled, range]);

  const n = sliced.length;
  const dates = useMemo(() => sliced.map((p) => p.date), [sliced]);

  // ── Returns lens: the portfolio's TWR, carry-forward aligned onto the visible NAV days and
  //    re-indexed to 100 at the window start. TWR is already cash-flow-neutral (a deposit
  //    doesn't move it) — re-indexing to a later start just gives the return FROM that start. ──
  const twrIndexed = useMemo(
    () => (returnsMode ? indexTo100(twrQ.data?.series, (p) => p.twrIndex, dates) : null),
    [returnsMode, twrQ.data, dates],
  );
  // ── vs-Nifty overlay: same index-to-100 treatment (no cash flows, so a plain rebase). ──
  const niftyIndexed = useMemo(
    () => (benchOn ? indexTo100(benchQ.data?.series, (p) => p.close, dates) : null),
    [benchOn, benchQ.data, dates],
  );

  const indexed = returnsMode && twrIndexed != null; // y-axis is index-based (return), not ₹
  const showNifty = benchOn && indexed && niftyIndexed != null;

  // Returns lens is asked for but its series hasn't arrived yet → a loading beat, NOT the ₹
  // line (showing value while "Returns" is selected would be a lie).
  const returnsPending = returnsMode && n >= 2 && twrIndexed == null;

  // y-domain fits the visible spread (both lines in comparison mode) with a little padding.
  const navY = indexed ? twrIndexed! : sliced.map((p) => p.value);
  const niftyY = showNifty ? niftyIndexed! : null;

  const { lo, hi } = useMemo(() => {
    const ys = niftyY ? [...navY, ...niftyY] : navY;
    if (ys.length === 0) return { lo: 0, hi: 1 };
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const pad = (max - min) * 0.1 || max * 0.05 || 1;
    return { lo: Math.max(0, min - pad), hi: max + pad };
  }, [navY, niftyY]);

  // Geometry: the line spans the FULL plot width — the y-labels are OVERLAID on the plot at the
  // left edge (with a subtle backing), so no gutter is reserved and there is no leading gap. Only
  // the LEFT inset was reclaimed (X0 58 → 2); the right edge (X1) is unchanged, so the endpoint
  // sits exactly where it did. The compact glance already used the whole width (no axes).
  const X0 = compact ? 3 : 2;
  const X1 = compact ? 797 : 792;
  const Y0 = compact ? 6 : 14;
  const Y1 = compact ? 74 : 214;
  const VBH = compact ? 80 : 260;

  const xOf = (i: number) => (n <= 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (n - 1));
  const yOf = (v: number) => Y0 + ((hi - v) / (hi - lo || 1)) * (Y1 - Y0);
  const leftPct = (i: number) => (xOf(i) / VBW) * 100;
  const topPct = (y: number) => (y / VBH) * 100;

  const idx = activeIdx != null ? Math.min(activeIdx, n - 1) : n - 1;
  const scrubbing = activeIdx != null && !compact;

  // Colour: ₹ value AND returns-solo → green/red by the line's own direction (both are a P&L /
  // gain read, so up=good is honest). vs-Nifty comparison → theme blue, a neutral comparison
  // identity (an always-red line reads "bad"; the signed % beside it carries up/down).
  const up = navY[n - 1] >= (indexed ? 100 : navY[0]);
  const navColor = showNifty ? "var(--primary)" : up ? "var(--success)" : "var(--danger)";

  const navPath = pathFrom(navY, xOf, yOf);
  const areaPath = n >= 2 ? `${navPath} L${xOf(n - 1).toFixed(1)},${Y1} L${xOf(0).toFixed(1)},${Y1} Z` : "";
  const niftyPath = niftyY ? pathFrom(niftyY, xOf, yOf) : "";

  const spanDays = n >= 2 ? (Date.parse(sliced[n - 1].date) - Date.parse(sliced[0].date)) / 86_400_000 : 0;
  const longSpan = spanDays > 120;

  const xStep = Math.max(1, Math.ceil(n / 5));
  const xLabelIdx = sliced.map((_, i) => i).filter((i) => i % xStep === 0 || i === n - 1);
  const yTicks = indexed ? [hi, 100, lo] : [hi, (hi + lo) / 2, lo];
  const yFmt = (v: number) => (indexed ? Math.round(v).toString() : formatINR(v, { compact: true }));

  const benchLoading = benchOn && !showNifty && (benchQ.isLoading || twrQ.isLoading);
  const benchError = benchOn && (benchQ.isError || twrQ.isError);

  const title = showNifty
    ? "Performance vs Nifty 50"
    : returnsMode
      ? "Portfolio return over time"
      : "Portfolio value over time";

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || n < 2 || compact) return;
    const rect = svg.getBoundingClientRect();
    const vbx = ((e.clientX - rect.left) / rect.width) * VBW;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(xOf(i) - vbx);
      if (d < bd) { bd = d; best = i; }
    }
    setActiveIdx(best);
  };

  // ── Compact glance (Dashboard): just the returns trajectory, no chrome. ──
  if (compact) {
    if (n < 2) return null;
    if (returnsPending) return <div className="h-14 w-full animate-pulse rounded-lg bg-surface-2/50 sm:h-16" />;
    return (
      <div>
        <div className="relative h-14 w-full select-none sm:h-16" aria-label={title} role="img">
          <svg viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="navFillCompact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={navColor} stopOpacity={0.28} />
                <stop offset="100%" stopColor={navColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#navFillCompact)" />
            <path d={navPath} fill="none" stroke={navColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <span
            className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${leftPct(n - 1)}%`, top: `${topPct(yOf(navY[n - 1]))}%`, background: navColor }}
          />
        </div>
        {/* Dashboard's honest minimum: the same gap, one compact line — a silent mini-chart is the
            same lie in a smaller box. */}
        {gapValue != null && (
          <p className="mt-1.5 text-[10px] leading-snug text-ink3">
            Ledgered only · <span className="num">{formatINR(gapValue, { compact: true })}</span> broker-linked not shown
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* header — kicker · lens toggle · vs-Nifty toggle (returns only) · period selector */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Kicker>{title}</Kicker>
        <div className="grid min-[350px]:flex items-center gap-2">
          {/* Value / Returns lens toggle */}
          {!lockLens && (
            <div className="flex gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5">
              {(["returns", "value"] as ChartLens[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => { setLens(l); setActiveIdx(null); }}
                  aria-pressed={effectiveLens === l}
                  title={l === "returns"
                    ? "Time-weighted return — how your investments performed, deposits stripped out"
                    : "₹ portfolio value over time — grows with deposits and performance"}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    effectiveLens === l ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
                  )}
                >
                  {l === "returns" ? "Returns" : "Value"}
                </button>
              ))}
            </div>
          )}
          {/* vs-Nifty comparison — only in the Returns lens (untouched behaviour) */}
          {showBenchmarkToggle && (
            <button
              type="button"
              onClick={() => setBenchmark((b) => !b)}
              aria-pressed={benchmark}
              title="Compare performance vs Nifty 50 — time-weighted return, both indexed to 100"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
                benchmark ? "border-line3 bg-surface-3 text-ink" : "border-line2 bg-surface-2 text-ink3 hover:text-ink2",
              )}
            >
              <span
                className={cn("size-1.5 rounded-full", benchmark && (benchQ.isFetching || twrQ.isFetching) && "animate-pulse")}
                style={{ background: benchmark ? NIFTY_COLOR : "var(--ink3)" }}
              />
              vs Nifty 50
            </button>
          )}
          {/* internal period selector — hidden when a parent drives the window (controlled) */}
          {!controlled && (
            <div className="flex gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5">
              {periods.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => { setPeriod(p.key); setActiveIdx(null); }}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    period === p.key ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
                  )}
                >
                  {p.key}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {n < 2 ? (
        <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-line2 bg-surface-2/50 px-6 text-center text-[12px] text-ink3">
          Only {n} point in this window yet — pick a longer period.
        </div>
      ) : returnsPending ? (
        <div className="h-[210px] w-full animate-pulse rounded-xl bg-surface-2/50 sm:h-[240px]" />
      ) : (
        <div className="relative h-[210px] w-full select-none sm:h-[240px]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VBW} ${VBH}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full cursor-crosshair touch-pan-y"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setActiveIdx(null)}
            role="img"
            aria-label={indexed ? "Portfolio return over time, indexed to 100" : "Portfolio value over time"}
          >
            <defs>
              <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={navColor} stopOpacity={0.22} />
                <stop offset="100%" stopColor={navColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* y gridlines (the 100 base line reads a touch stronger in the returns lens) */}
            {yTicks.map((t, k) => (
              <line
                key={k}
                x1={X0}
                y1={yOf(t)}
                x2={X1}
                y2={yOf(t)}
                stroke="var(--line)"
                strokeDasharray="2 5"
                strokeOpacity={indexed && Math.round(t) === 100 ? 0.9 : 0.5}
              />
            ))}

            {/* area fill under the portfolio line (both lenses) */}
            <path d={areaPath} fill="url(#navFill)" />

            {/* benchmark line (muted reference) under the portfolio line */}
            {niftyPath && (
              <path d={niftyPath} fill="none" stroke={NIFTY_COLOR} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
            )}

            {/* portfolio line */}
            <path d={navPath} fill="none" stroke={navColor} strokeWidth={showNifty ? 2.25 : 2} strokeLinejoin="round" strokeLinecap="round" />

            {/* scrub guide line (the dot markers are HTML — below — so they stay round) */}
            {scrubbing && (
              <line x1={xOf(idx)} y1={Y0} x2={xOf(idx)} y2={Y1} stroke="var(--ink3)" strokeDasharray="3 3" strokeOpacity={0.8} />
            )}
          </svg>

          {/* ── HTML overlay: legible axis labels + scrub readout ── */}
          {/* y-labels OVERLAID on the plot at the left edge (no reserved gutter → the line is
              full-width). A subtle surface backing keeps them legible over the faint area/line. */}
          {yTicks.map((t, k) => (
            <span
              key={k}
              className="num pointer-events-none absolute left-0 -translate-y-1/2 whitespace-nowrap rounded bg-surface-1/80 px-1 text-[10.5px] text-ink3"
              style={{ top: `${topPct(yOf(t))}%` }}
            >
              {yFmt(t)}
            </span>
          ))}
          {xLabelIdx.map((i) => (
            <span
              key={i}
              className="num pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-[10.5px] text-ink3"
              style={{ left: `${Math.min(Math.max(leftPct(i), 4), 97)}%`, top: `${topPct(Y1) + 4}%` }}
            >
              {fmtAxisDate(sliced[i].date, longSpan)}
            </span>
          ))}

          {/* markers — HTML so they stay PERFECT CIRCLES despite the non-uniformly stretched SVG */}
          <span
            className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${leftPct(n - 1)}%`, top: `${topPct(yOf(navY[n - 1]))}%`, background: navColor }}
          />
          {niftyY && (
            <span
              className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${leftPct(n - 1)}%`, top: `${topPct(yOf(niftyY[n - 1]))}%`, background: NIFTY_COLOR }}
            />
          )}
          {scrubbing && (
            <>
              <span
                className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                style={{ left: `${leftPct(idx)}%`, top: `${topPct(yOf(navY[idx]))}%`, background: "var(--surface-1)", borderColor: navColor }}
              />
              {niftyY && (
                <span
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                  style={{ left: `${leftPct(idx)}%`, top: `${topPct(yOf(niftyY[idx]))}%`, background: "var(--surface-1)", borderColor: NIFTY_COLOR }}
                />
              )}
            </>
          )}

          {/* scrub tooltip — value(s) / return(s) at the hovered date */}
          {scrubbing && (
            <div
              className="pointer-events-none absolute flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-line2 bg-surface-3 px-2.5 py-1 text-[12px] shadow-lg"
              style={{ left: `${Math.min(Math.max(leftPct(idx), 16), 84)}%`, top: `${topPct(Y0)}%` }}
            >
              <span className="num text-ink3">{fmtTooltipDate(sliced[idx].date)}</span>
              {showNifty ? (
                <>
                  <span className="num font-semibold">
                    <span style={{ color: navColor }}>You {navY[idx].toFixed(1)}</span>{" "}
                    <span style={{ color: signColor(navY[idx] - 100) }}>({signPctStr(navY[idx] - 100)})</span>
                  </span>
                  <span className="num font-semibold">
                    <span style={{ color: NIFTY_COLOR }}>Nifty {niftyY![idx].toFixed(1)}</span>{" "}
                    <span style={{ color: signColor(niftyY![idx] - 100) }}>({signPctStr(niftyY![idx] - 100)})</span>
                  </span>
                </>
              ) : indexed ? (
                <span className="num font-semibold">
                  <span style={{ color: navColor }}>{navY[idx].toFixed(1)}</span>{" "}
                  <span style={{ color: signColor(navY[idx] - 100) }}>({signPctStr(navY[idx] - 100)})</span>
                </span>
              ) : (
                <span className="num font-semibold text-ink">{formatINR(sliced[idx].value, { compact: true })}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* caption — comparison legend, returns explainer, or a loading/unavailable hint */}
      {showNifty ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[3px] w-3.5 rounded" style={{ background: navColor }} /> Portfolio
            <span className="num" style={{ color: signColor(navY[n - 1] - 100) }}>
              {signPctStr(navY[n - 1] - 100)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[3px] w-3.5 rounded" style={{ background: NIFTY_COLOR }} /> Nifty 50
            <span className="num" style={{ color: signColor(niftyY![n - 1] - 100) }}>
              {signPctStr(niftyY![n - 1] - 100)}
            </span>
          </span>
          <span>
            Return, indexed to <span className="num text-ink2">100</span> at{" "}
            <span className="num text-ink2">{fmtTooltipDate(sliced[0].date)}</span> · time-weighted (deposits &amp; sells
            removed) — the ₹ chart shows value, this shows performance.
          </span>
        </div>
      ) : returnsMode && !returnsPending && n >= 2 ? (
        benchLoading ? (
          <p className="mt-2.5 text-[11px] text-ink3">Loading the Nifty 50 comparison…</p>
        ) : benchError ? (
          <p className="mt-2.5 text-[11px] text-ink3">Comparison unavailable right now — try again shortly.</p>
        ) : (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[3px] w-3.5 rounded" style={{ background: navColor }} /> Return
              <span className="num" style={{ color: signColor(navY[n - 1] - 100) }}>{signPctStr(navY[n - 1] - 100)}</span>
            </span>
            <span>
              Time-weighted, indexed to <span className="num text-ink2">100</span> at{" "}
              <span className="num text-ink2">{fmtTooltipDate(sliced[0].date)}</span> — deposits &amp; sells removed, so
              it&apos;s how your holdings performed, not money added.
            </span>
          </div>
        )
      ) : null}

      {/* (Ruling C) The series is ledger-only; the overview sums the manual ⊎ broker union. When the
          book carries broker-linked holdings, name what the line leaves out — factual, not a warning.
          Broker holdings have no transaction dates, so they can't be drawn; the endpoint stays pinned
          to the ledgered value on purpose. */}
      {gapValue != null && (
        <p className="mt-2.5 text-[11px] leading-relaxed text-ink3">
          This series covers your <span className="text-ink2">ledgered holdings</span>.{" "}
          <span className="num text-ink2">{formatINR(gapValue, { compact: true })}</span> in broker-linked holdings
          isn&apos;t included.
        </p>
      )}
    </div>
  );
}
