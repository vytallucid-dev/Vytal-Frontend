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

// ── TWO INDEPENDENT HONESTY GATES ON THE RANGE PICKER ───────────────────────────────────────────
//
// (1) STORE DEPTH — the DEEPEST honest range is PER-BOOK, and the backend already knows it
//     (meta.maxRange):
//   • "ALL"  — a stock-only book, whose equity depth comes from daily_prices (not the 4-year weekly
//              store) and can reach further back than 4 years → "All" genuinely is all.
//   • "4Y"   — a blended book: add any non-stock and the series caps at 4y (the weekly store is
//              trimmed to 4y by a DB trigger), so the whole-series button must NOT say "All".
//   So the whole-series option is LABELLED by depth: "All" (stock-only — it truly is the full
//   history) vs "Max" (blended — "everything we hold", never claiming to be all of it). It is
//   ALWAYS present and ALWAYS enabled: it is whatever exists, so it cannot overclaim.
//
// (2) DATA SPAN — a fixed window is only OFFERED when the series actually REACHES it. A 4-day book
//     under a "4Y" button is a label that overclaims the data by three orders of magnitude; the
//     line doesn't change, only the claim above it does. So each fixed window is enabled iff
//     spanDays >= its days, and a book younger than 1M has every fixed window greyed with only
//     the whole-series option live. Span-driven: as history accrues they light up on their own
//     (1M at ≥30d, 6M at ≥182d…) with no future code change. On a data-rich book (years of NAV)
//     every window clears its threshold, so this gate is a NO-OP there.
//
// The two gates are orthogonal: (1) is about how deep our STORE goes, (2) about how old this BOOK
// is. Both must pass for a button to be live.
const FIXED_PERIODS: { key: string; days: number }[] = [
  { key: "1M", days: 30 },
  { key: "6M", days: 182 },
  { key: "1Y", days: 365 },
  { key: "3Y", days: 1095 },
  { key: "4Y", days: 1461 },
];

/** The whole-series option's key — gate (1). "All" only when the book's depth honestly IS all. */
function wholeSeriesKey(maxRange: string | undefined): string {
  return maxRange === "ALL" ? "All" : "Max";
}

/** The visible presets: the fixed windows + the whole-series option, which is ALWAYS present.
 *  (It previously vanished on a blended book, leaving "4Y" to double as "show everything" — which
 *  is precisely the label that overclaims on a young book, and would leave a <1M book with NO
 *  selectable range once gate (2) applies.) */
function periodsFor(maxRange: string | undefined): { key: string; days: number | null }[] {
  return [...FIXED_PERIODS, { key: wholeSeriesKey(maxRange), days: null }];
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
  accountId,
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
   *  says so. `null`/absent ⇒ no broker holdings ⇒ no disclosure. On an account chart this is the
   *  ACCOUNT's gap (zero for a manual book), never the whole book's. */
  brokerGap?: BrokerExcluded | null;
  /** The book's honest deepest range (NAV meta): "ALL" (stock-only) offers the "All" button; "4Y"
   *  (blended) drops it. Drives the uncontrolled picker + its default. Absent ⇒ conservative (no All). */
  maxRange?: string;
  /** ★ THE CRITICAL PAIRING. When set (the account chart), the chart's INTERNAL TWR + benchmark
   *  hooks scope to THIS account — so the Returns (TWR) lens and the vs-Nifty overlay measure the
   *  SAME account as the `series` value line. Absent ⇒ whole-book, exactly as before (Overview /
   *  Performance / Dashboard). A per-account value line with a whole-book overlay would put two
   *  different populations on one chart — the incoherence this prop exists to prevent. */
  accountId?: string;
}) {
  // CONTROLLED when a `range` is supplied (the Performance tab owns one period selector that
  // drives the whole tab): the chart hides its own period buttons and slices to the parent's
  // window — so NEITHER the internal selector NOR its span gating applies there. UNCONTROLLED
  // (Overview / account) keeps its internal selector: the fixed windows + the always-valid
  // whole-series option, each fixed one gated by the book's real span.
  const controlled = range !== undefined;
  const [lens, setLens] = useState<ChartLens>(defaultLens);
  // Uncontrolled (Overview / account): the picker comes from the book's honest maxRange. Available
  // at mount (this chart only renders once NAV data — and its meta — has arrived).
  const wholeKey = wholeSeriesKey(maxRange);
  const periods = periodsFor(maxRange);
  // The WHOLE SERIES' real span (first → last point) — gate (2). Measured off the DATA, never off
  // the selected range label, so the picker can never offer a window the book hasn't lived through.
  // NOTE: distinct from `spanDays` further down, which is the span of the VISIBLE (sliced) window
  // and drives axis date formatting only. This one is the book's age; that one is the view's width.
  const seriesSpanDays =
    series.length >= 2
      ? Math.round((Date.parse(series[series.length - 1].date) - Date.parse(series[0].date)) / 86_400_000)
      : 0;
  /** Is this window honest for this book? The whole-series option (days null) always is — it is
   *  whatever exists. A fixed window needs the span to actually reach it. */
  const rangeEnabled = (days: number | null) => days == null || seriesSpanDays >= days;
  // Default to the whole-series option: the honest "show everything" view, ALWAYS valid whatever
  // exists — so a young book opens correctly with no range special-casing, and a mature one opens
  // on its full history rather than under a fixed label that may outrun the data.
  const [period, setPeriod] = useState(wholeKey);
  // Guard: a selection that no longer fits the span, or a whole-series key that changed with the
  // book's depth (meta arriving late), falls back to the whole-series option.
  const picked = periods.find((p) => p.key === period);
  const effPeriod = picked && rangeEnabled(picked.days) ? period : wholeKey;
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
  // ★ SCOPED BY `accountId` — so the Returns lens and the vs-Nifty overlay are the SAME account as
  //   the `series` value line above (whole-book when accountId is absent, exactly as before).
  const twrQ = usePortfolioTwr(returnsMode, accountId);
  const benchQ = usePortfolioBenchmark(benchOn, accountId);

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
    // effPeriod, not period — a window the span can't honestly support never slices the series.
    // Read off the static FIXED_PERIODS: the whole-series key ("All"/"Max") isn't in it, so it
    // falls through to null = everything we have.
    const days = FIXED_PERIODS.find((p) => p.key === effPeriod)?.days ?? null;
    if (days == null) return series;
    const cutoff = isoMinusDays(series[series.length - 1].date, days);
    const w = series.filter((p) => p.date >= cutoff);
    return w.length >= 2 ? w : series.slice(-2); // keep the chart drawable
  }, [series, effPeriod, controlled, range]);

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

  // ── Compact glance (Dashboard): the returns trajectory + the ONE line that says what it is. ──
  //
  // ⚠ §THE UNLABELLED LINE — why this caption is not optional chrome.
  // This glance sits directly beneath the hero's "total return" figure, and the two are DIFFERENT
  // MEASURES OVER DIFFERENT WINDOWS:
  //   · this line  — TIME-WEIGHTED return, cash-flow-neutral, over the book's WHOLE history (first buy →
  //                  last close). Deposits are removed, so it answers "how did the money perform".
  //   · the figure — unrealized P&L over the ENTERED COST of the positions held right now, with NO time
  //                  window at all (each lot counts from its own purchase date, and sold positions are
  //                  not in it).
  // Both are correct, and on a book that grew by deposits they routinely disagree in SIGN — a red line
  // beside a green number, which reads as a bug and is not one. Nothing on the card said so, so the card
  // was making the reader reconcile two figures it never told them were different questions. That is what
  // this line fixes: the WINDOW and the MEASURE, stated, next to the number they belong to.
  // (The full chart — both lenses, the range picker, the Nifty overlay — is one tap away on /portfolio;
  // a range selector on a 288px glance would rebuild that surface in a panel that exists to be glanced at.)
  if (compact) {
    if (n < 2) return null;
    if (returnsPending) return <div className="h-14 w-full animate-pulse rounded-lg bg-surface-2/50 sm:h-16" />;
    const windowPct = navY[n - 1] - 100;
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
        {/* §THE UNLABELLED LINE — the window and the measure, in the reader's own units. `num` for the
            figures (tabular), and it WRAPS rather than truncating: at 320px this is two lines, and a
            clipped "…time-wei" would be worse than the extra row it costs. */}
        {indexed && (
          <p className="mt-1.5 text-[10px] leading-snug text-ink3">
            <span className="num font-medium" style={{ color: signColor(windowPct) }}>
              {signPctStr(windowPct)}
            </span>{" "}
            since <span className="num">{fmtTooltipDate(sliced[0].date)}</span> · time-weighted, deposits
            removed
          </p>
        )}
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
              {periods.map((p) => {
                // Greyed + unclickable when the book hasn't lived through this window. It enables
                // itself the day the span reaches it — no future code change.
                const enabled = rangeEnabled(p.days);
                return (
                  <button
                    key={p.key}
                    type="button"
                    disabled={!enabled}
                    onClick={() => { setPeriod(p.key); setActiveIdx(null); }}
                    title={enabled ? undefined : "Not enough history yet for this range"}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                      !enabled
                        ? "cursor-not-allowed text-ink3/40"
                        : effPeriod === p.key
                          ? "bg-surface-3 text-ink"
                          : "text-ink3 hover:text-ink2",
                    )}
                  >
                    {p.key}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {n < 2 ? (
        <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-line2 bg-surface-2/50 px-6 text-center text-[12px] text-ink3">
          {/* Never advise a longer period when there ISN'T one: on the whole-series option this is
              already everything we have, so the honest line is that the history is still building. */}
          {effPeriod === wholeKey
            ? `Only ${n} point so far — a line needs two. It draws itself as this book's history grows.`
            : `Only ${n} point in this window yet — pick a longer period.`}
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
