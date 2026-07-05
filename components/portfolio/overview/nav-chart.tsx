"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO NAV CHART — the value hero's ₹ value-over-time curve (GET /me/portfolio/nav),
// with an optional Nifty 50 PERFORMANCE comparison (toggle).
//
// TWO DIFFERENT QUESTIONS, honestly separated:
//  • toggle OFF → "what's my book worth": the raw ₹ NAV area chart (unchanged).
//  • toggle ON  → "how did the money perform vs the market": portfolio TIME-WEIGHTED
//    RETURN (GET /me/portfolio/twr) vs Nifty 50, BOTH indexed to 100 at the window start.
//    TWR is cash-flow-neutral — deposits/sells don't read as return — so it's a fair
//    comparison (raw-NAV-rebased conflated inflows with alpha; that was the bug). The index
//    is carry-forward aligned onto the NAV trading days (no zip-by-date dropping of points).
//
// Custom responsive SVG (trajectory/price-chart approach): scrubbable, HTML label overlay,
// adaptive y-domain. Read-only — series are the truth; selectors slice, nothing is recomputed.
// Descriptive only: it shows over/underperformance, no "you're winning" verdict.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useRef, useState } from "react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePortfolioBenchmark } from "@/lib/api/hooks/use-portfolio-benchmark";
import { usePortfolioTwr } from "@/lib/api/hooks/use-portfolio-twr";
import type { NavPoint } from "@/types/portfolio";
import { Kicker } from "./shared";

const PERIODS: { key: string; days: number | null }[] = [
  { key: "1M", days: 30 },
  { key: "6M", days: 182 },
  { key: "1Y", days: 365 },
  { key: "3Y", days: 1095 },
  { key: "All", days: null },
];

const NIFTY_COLOR = "var(--ctx)"; // muted blue-grey reference line

// viewBox geometry (stretched to the container via preserveAspectRatio="none").
const VBW = 800;
const VBH = 260;
const X0 = 58; // left gutter for y-labels
const X1 = 792;
const Y0 = 14;
const Y1 = 214; // plot floor; x-labels sit below in the HTML overlay

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

export function NavChart({ series, range }: { series: NavPoint[]; range?: { start: string | null; end: string | null } }) {
  // CONTROLLED when a `range` is supplied (the Performance tab owns one period selector
  // that drives the whole tab): the chart hides its own period buttons and slices to the
  // parent's window. UNCONTROLLED (Overview) keeps its internal 1M/6M/1Y/3Y/All selector.
  const controlled = range !== undefined;
  const [period, setPeriod] = useState("All");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [benchmark, setBenchmark] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const benchQ = usePortfolioBenchmark(benchmark);
  const twrQ = usePortfolioTwr(benchmark);

  // Client-side slice for the selectors — honest-short: a window younger than the
  // history simply returns fewer points (never padded).
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
    const days = PERIODS.find((p) => p.key === period)?.days ?? null;
    if (days == null) return series;
    const cutoff = isoMinusDays(series[series.length - 1].date, days);
    const w = series.filter((p) => p.date >= cutoff);
    return w.length >= 2 ? w : series.slice(-2); // keep the chart drawable
  }, [series, period, controlled, range]);

  const n = sliced.length;

  // ── comparison overlay: portfolio TWR vs Nifty, BOTH re-indexed to 100 at the window
  //    start. TWR is already cash-flow-neutral (a deposit doesn't move it) — re-indexing
  //    to a later start just gives the return FROM that start. Nifty (no cash flows) rebases
  //    to 100 the same way. Both carry-forward aligned onto the visible NAV dates. ──
  const overlay = useMemo(() => {
    const nifty = benchQ.data?.series;
    const twr = twrQ.data?.series;
    if (!benchmark || !nifty?.length || !twr?.length || n < 2) return null;
    const dates = sliced.map((p) => p.date);
    const twrAt = carryForward(twr, (p) => p.twrIndex, dates);
    const niftyAt = carryForward(nifty, (p) => p.close, dates);
    if (twrAt[0] == null || niftyAt[0] == null) return null;
    const twrBase = twrAt[0];
    const niftyBase = niftyAt[0];
    return {
      portfolio: twrAt.map((v) => ((v ?? twrBase) / twrBase) * 100),
      nifty: niftyAt.map((c) => ((c ?? niftyBase) / niftyBase) * 100),
    };
  }, [benchmark, benchQ.data, twrQ.data, sliced, n]);

  const rebased = overlay != null;

  // y-domain fits the visible spread (both lines in comparison mode) with a little padding.
  const { lo, hi } = useMemo(() => {
    const ys = rebased ? [...overlay!.portfolio, ...overlay!.nifty] : sliced.map((p) => p.value);
    if (ys.length === 0) return { lo: 0, hi: 1 };
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const pad = (max - min) * 0.1 || max * 0.05 || 1;
    return { lo: Math.max(0, min - pad), hi: max + pad };
  }, [sliced, rebased, overlay]);

  const xOf = (i: number) => (n <= 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (n - 1));
  const yOf = (v: number) => Y0 + ((hi - v) / (hi - lo || 1)) * (Y1 - Y0);
  const leftPct = (i: number) => (xOf(i) / VBW) * 100;
  const topPct = (y: number) => (y / VBH) * 100;

  const idx = activeIdx != null ? Math.min(activeIdx, n - 1) : n - 1;
  const scrubbing = activeIdx != null;
  // ₹ value chart: green/red by the portfolio's own direction (P&L domain).
  // vs-Nifty comparison: the theme blue — a neutral comparison identity, NOT a good/bad
  // signal (an always-red line reads as "bad"; the signed % beside it carries up/down).
  const up = sliced[n - 1].value >= sliced[0].value;
  const navColor = rebased ? "var(--primary)" : up ? "var(--success)" : "var(--danger)";

  const navY = rebased ? overlay!.portfolio : sliced.map((p) => p.value);
  const niftyY = rebased ? overlay!.nifty : null;

  const navPath = pathFrom(navY, xOf, yOf);
  // area fill under the portfolio line in BOTH modes (value ₹ chart AND the vs-Nifty view).
  const areaPath = n >= 2 ? `${navPath} L${xOf(n - 1).toFixed(1)},${Y1} L${xOf(0).toFixed(1)},${Y1} Z` : "";
  const niftyPath = niftyY ? pathFrom(niftyY, xOf, yOf) : "";

  const spanDays = n >= 2 ? (Date.parse(sliced[n - 1].date) - Date.parse(sliced[0].date)) / 86_400_000 : 0;
  const longSpan = spanDays > 120;

  const xStep = Math.max(1, Math.ceil(n / 5));
  const xLabelIdx = sliced.map((_, i) => i).filter((i) => i % xStep === 0 || i === n - 1);
  const yTicks = rebased ? [hi, 100, lo] : [hi, (hi + lo) / 2, lo];
  const yFmt = (v: number) => (rebased ? Math.round(v).toString() : formatINR(v, { compact: true }));

  const benchLoading = benchmark && (benchQ.isLoading || twrQ.isLoading) && !rebased;
  const benchError = benchmark && (benchQ.isError || twrQ.isError);

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || n < 2) return;
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

  return (
    <div>
      {/* header — kicker · Nifty comparison toggle (live) · period selector */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Kicker>{rebased ? "Performance vs Nifty 50" : "Portfolio value over time"}</Kicker>
        <div className="flex items-center gap-2">
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
          {/* internal period selector — hidden when a parent drives the window (controlled) */}
          {!controlled && (
            <div className="flex gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5">
              {PERIODS.map((p) => (
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
            aria-label={rebased ? "Portfolio return vs Nifty 50, indexed to 100" : "Portfolio value over time"}
          >
            <defs>
              <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={navColor} stopOpacity={0.22} />
                <stop offset="100%" stopColor={navColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* y gridlines (the 100 base line reads a touch stronger in comparison mode) */}
            {yTicks.map((t, k) => (
              <line
                key={k}
                x1={X0}
                y1={yOf(t)}
                x2={X1}
                y2={yOf(t)}
                stroke="var(--line)"
                strokeDasharray="2 5"
                strokeOpacity={rebased && Math.round(t) === 100 ? 0.9 : 0.5}
              />
            ))}

            {/* area fill under the portfolio line (both modes) */}
            <path d={areaPath} fill="url(#navFill)" />

            {/* benchmark line (muted reference) under the portfolio line */}
            {niftyPath && (
              <path d={niftyPath} fill="none" stroke={NIFTY_COLOR} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
            )}

            {/* portfolio line */}
            <path d={navPath} fill="none" stroke={navColor} strokeWidth={rebased ? 2.25 : 2} strokeLinejoin="round" strokeLinecap="round" />

            {/* scrub guide line (the dot markers are HTML — below — so they stay round) */}
            {scrubbing && (
              <line x1={xOf(idx)} y1={Y0} x2={xOf(idx)} y2={Y1} stroke="var(--ink3)" strokeDasharray="3 3" strokeOpacity={0.8} />
            )}
          </svg>

          {/* ── HTML overlay: legible axis labels + scrub readout ── */}
          {yTicks.map((t, k) => (
            <span
              key={k}
              className="num pointer-events-none absolute -translate-x-full -translate-y-1/2 whitespace-nowrap pr-2 text-[10.5px] text-ink3"
              style={{ left: `${(X0 / VBW) * 100}%`, top: `${topPct(yOf(t))}%` }}
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

          {/* scrub tooltip — value(s) + signed % return at the hovered date */}
          {scrubbing && (
            <div
              className="pointer-events-none absolute flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-line2 bg-surface-3 px-2.5 py-1 text-[12px] shadow-lg"
              style={{ left: `${Math.min(Math.max(leftPct(idx), 16), 84)}%`, top: `${topPct(Y0)}%` }}
            >
              <span className="num text-ink3">{fmtTooltipDate(sliced[idx].date)}</span>
              {rebased ? (
                <>
                  <span className="num font-semibold">
                    <span style={{ color: navColor }}>You {overlay!.portfolio[idx].toFixed(1)}</span>{" "}
                    <span style={{ color: signColor(overlay!.portfolio[idx] - 100) }}>({signPctStr(overlay!.portfolio[idx] - 100)})</span>
                  </span>
                  <span className="num font-semibold">
                    <span style={{ color: NIFTY_COLOR }}>Nifty {overlay!.nifty[idx].toFixed(1)}</span>{" "}
                    <span style={{ color: signColor(overlay!.nifty[idx] - 100) }}>({signPctStr(overlay!.nifty[idx] - 100)})</span>
                  </span>
                </>
              ) : (
                <span className="num font-semibold text-ink">{formatINR(sliced[idx].value, { compact: true })}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* caption — comparison legend (performance, not value), or a loading/unavailable hint */}
      {rebased ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[3px] w-3.5 rounded" style={{ background: navColor }} /> Portfolio
            <span className="num" style={{ color: signColor(overlay!.portfolio[n - 1] - 100) }}>
              {signPctStr(overlay!.portfolio[n - 1] - 100)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[3px] w-3.5 rounded" style={{ background: NIFTY_COLOR }} /> Nifty 50
            <span className="num" style={{ color: signColor(overlay!.nifty[n - 1] - 100) }}>
              {signPctStr(overlay!.nifty[n - 1] - 100)}
            </span>
          </span>
          <span>
            Return, indexed to <span className="num text-ink2">100</span> at{" "}
            <span className="num text-ink2">{fmtTooltipDate(sliced[0].date)}</span> · time-weighted (deposits &amp; sells
            removed) — the ₹ chart shows value, this shows performance.
          </span>
        </div>
      ) : benchLoading ? (
        <p className="mt-2.5 text-[11px] text-ink3">Loading the Nifty 50 comparison…</p>
      ) : benchError ? (
        <p className="mt-2.5 text-[11px] text-ink3">Comparison unavailable right now — try again shortly.</p>
      ) : null}
    </div>
  );
}
