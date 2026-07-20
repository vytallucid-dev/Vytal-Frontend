"use client";

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH-HISTORY CHART — the daily Health + Construction series (portfolio_score_history),
// shared verbatim between Overview (compact) and the Health tab (full). ONE component; the
// `compact` prop drops the apparatus (toggle chips · period selector · how-to · scrub tip),
// never the chart itself. Finalized against docs/vytal_health_history_v2.html (interaction
// contract) + docs/vytal_health_history_fills.html (dual-area + compact contract).
//
// TWO AREAS, ALWAYS. Health and Construction each render as a filled gradient area + a top
// stroke, on ONE fixed 0–100 axis. Construction is drawn FIRST (behind), Health ON TOP, both
// fills ≤30% top-opacity fading to transparent — the lower series stays readable through the
// upper one at a crossover (validated in the prototype; raising opacity past ~30% muddies).
//
// FIXED, STABLE SERIES COLOURS — never band-tinted. Health = green (the quality identity),
// Construction = gold (var(--p-mkt), the market accent its co-hero shares). A time-series
// LINE must not recolour as its value crosses a band threshold — the value's HEIGHT already
// carries that — and a fixed, distinct pair is exactly what lets the two fills overlap clean.
//
// FIXED 0–100 Y-AXIS, NEVER AUTO-SCALED. An absolute score has a real floor/ceiling (unlike
// ₹ value or TWR); auto-fitting to the visible min/max would exaggerate a small move into a
// dramatic swing. The axis always spans the full range so a line's STEEPNESS is honest.
//
// NULL IS NEVER ZERO. `structure` (Construction) is null on any row from before that column
// shipped (forward-only — see the backend recon). A null point is SKIPPED — no dot, no zero,
// no bridged line, no fill: each series splits into contiguous non-null RUNS (`runsOf`), and
// Construction's area begins wherever its data begins. It is never padded backward to match
// Health's length; a shorter Construction line beside a longer Health line is the truth.
//
// NO COVERAGE, NO NIFTY. Coverage is off this chart entirely (it competed with the score
// axis). Nifty is a rebased return line — a different KIND of quantity from an absolute
// score — so it is a category error here and never appears.
// ─────────────────────────────────────────────────────────────────────────────
import { useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { useScoreHistory } from "@/lib/api/hooks/use-score-history";
import type { ScoreHistoryPoint } from "@/types/portfolio";
import { POSITIVE_COLOR } from "./lib";

// The two STABLE series identities (see the header). Health green ≈ the prototype's #5bb89a
// (POSITIVE_COLOR, #5bb98c); Construction gold = var(--p-mkt) (#d6a652 ≈ the prototype's
// #d9a75a), the same market accent the Construction co-hero wears.
const HEALTH_COLOR = POSITIVE_COLOR;
const CONSTRUCTION_COLOR = "var(--p-mkt)";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dParts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
};
const fmtDate = (iso: string) => {
  const { y, m, d } = dParts(iso);
  return `${d} ${MON[m - 1]} ${y}`;
};
const fmtMonthYear = (iso: string) => {
  const { y, m } = dParts(iso);
  return `${MON[m - 1]} ${y}`;
};
const fmtAxisDate = (iso: string, longSpan: boolean) => {
  const { y, m, d } = dParts(iso);
  // Over a multi-year window a bare "5 Nov" is year-ambiguous, so switch to "Nov '21".
  return longSpan ? `${MON[m - 1]} '${String(y).slice(2)}` : `${d} ${MON[m - 1]}`;
};
/** iso − N days, UTC (no TZ drift) — the window cutoff for the period selector. */
function isoMinusDays(iso: string, days: number): string {
  const dt = new Date(iso + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
}

// ── period windows (by real calendar days — the series is DAILY, so never by point-count) ──
// 1M is the important add for a YOUNG series; 3Y is dropped so the row stays five buttons wide.
// A fixed range is only OFFERED when the book's real span reaches its window (see rangeEnabled) —
// selecting "5Y" over two days of data was the bug this closes.
type PeriodKey = "1M" | "6M" | "1Y" | "5Y" | "MAX";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1M", label: "1M" },
  { key: "6M", label: "6M" },
  { key: "1Y", label: "1Y" },
  { key: "5Y", label: "5Y" },
  { key: "MAX", label: "Max" },
];
const WINDOW_DAYS: Record<PeriodKey, number | null> = { "1M": 30, "6M": 182, "1Y": 365, "5Y": 1825, MAX: null };

/** Pluralize honestly: "1 day", "2 days". */
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/** The story's leading time phrase — derived from the REAL distance between the first and last
 *  VISIBLE point, never from the selected range button. A two-day book reads "Since yesterday",
 *  not "over the last 5 years". Day-granular dates, so spanDays is a whole number. */
function timePhrase(wpts: ScoreHistoryPoint[]): string {
  if (wpts.length <= 1) return "Today";
  const spanDays = Math.round((Date.parse(wpts[wpts.length - 1].date) - Date.parse(wpts[0].date)) / 86_400_000);
  if (spanDays <= 1) return "Since yesterday";
  if (spanDays < 30) return `Over the last ${plural(spanDays, "day")}`;
  if (spanDays < 730) return `Over the last ${plural(Math.round(spanDays / 30.44), "month")}`;
  return `Over the last ${plural(Math.round(spanDays / 365.25), "year")}`;
}

interface Pt {
  i: number;
  date: string;
  v: number;
}

/** Split a series into contiguous NON-NULL runs over one field. A null breaks the run —
 *  it is never bridged and never treated as 0. A run of length 1 is a lone dot (nothing
 *  to draw a line to); length ≥2 draws a path (and, here, an area). Preserved verbatim from
 *  the first build — the null-handling spine of this chart. */
function runsOf(points: ScoreHistoryPoint[], pick: (p: ScoreHistoryPoint) => number | null): Pt[][] {
  const runs: Pt[][] = [];
  let cur: Pt[] = [];
  points.forEach((p, i) => {
    const v = pick(p);
    if (v == null) {
      if (cur.length) runs.push(cur);
      cur = [];
    } else {
      cur.push({ i, date: p.date, v });
    }
  });
  if (cur.length) runs.push(cur);
  return runs;
}

const strokePath = (pts: Pt[], xOf: (i: number) => number, yOf: (v: number) => number) =>
  pts.map((p, k) => `${k === 0 ? "M" : "L"}${xOf(p.i).toFixed(1)},${yOf(p.v).toFixed(1)}`).join(" ");

/** The area under a run: its stroke path, then down to the baseline and closed. Only spans
 *  the run's own extent, so a null gap leaves a gap in the fill — never a bridge to zero. */
const areaPath = (pts: Pt[], xOf: (i: number) => number, yOf: (v: number) => number, baseY: number) => {
  if (pts.length < 2) return "";
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${strokePath(pts, xOf, yOf)} L${xOf(last.i).toFixed(1)},${baseY.toFixed(1)} L${xOf(first.i).toFixed(1)},${baseY.toFixed(1)} Z`;
};

// ── the story sentence — data-driven, window-aware, DESCRIBES movement, never advises.
//    Ported branch-for-branch from docs/vytal_health_history_v2.html's story()/dir(). ──
type Dir = { steady: boolean; up: boolean };
function dirOf(a: number, b: number): Dir {
  const d = b - a;
  if (Math.abs(d) <= 2) return { steady: true, up: false };
  return { steady: false, up: d > 0 };
}

function StorySentence({
  wpts,
  showH,
  showC,
}: {
  wpts: ScoreHistoryPoint[];
  showH: boolean;
  showC: boolean;
}) {
  const H = (t: string | number) => (
    <span className="num font-semibold" style={{ color: HEALTH_COLOR }}>
      {t}
    </span>
  );
  const C = (t: string | number) => (
    <span className="num font-semibold" style={{ color: CONSTRUCTION_COLOR }}>
      {t}
    </span>
  );

  const first = wpts[0];
  const last = wpts[wpts.length - 1];
  // ONE point → "Today" and a from/to would be a lie (there is nowhere to move from). The phrase
  // is the REAL span of the visible window, so it stays true as the button/window changes.
  const single = wpts.length === 1;
  const phrase = timePhrase(wpts);

  const cFirst = wpts.find((p) => p.structure != null)?.structure ?? null;
  const cLast = [...wpts].reverse().find((p) => p.structure != null)?.structure ?? null;

  const parts: React.ReactNode[] = [];
  const hDir = dirOf(first.phs, last.phs);
  if (showH) {
    parts.push(
      single ? (
        <>your {H("Health")} is {H(last.phs)}</>
      ) : hDir.steady ? (
        <>your {H("Health")} held steady around {H(last.phs)}</>
      ) : (
        <>your {H("Health")} {hDir.up ? "rose" : "fell"} from {H(first.phs)} to {H(last.phs)}</>
      ),
    );
  }
  const cDir = cFirst != null && cLast != null ? dirOf(cFirst, cLast) : null;
  if (showC && cFirst != null && cLast != null && cDir) {
    parts.push(
      single ? (
        <>{C("Construction")} is {C(cLast)}</>
      ) : cDir.steady ? (
        <>{C("Construction")} stayed near {C(cLast)}</>
      ) : (
        <>{C("Construction")} {cDir.up ? "rose" : "fell"} from {C(cFirst)} to {C(cLast)}</>
      ),
    );
  }

  // meaning clause — describe/interpret, NEVER prescribe. (A both-down window points to the
  // Health tab for detail: a pointer to information, explicitly not "you should" act.)
  //
  // ⚠ ONE DELIBERATE DEVIATION FROM THE PROTOTYPE'S story(): its branch-2 guard was
  // `(hSteady || !hd)`, which ALSO matches Health-FELL — so it shadowed the both-down branch
  // (branch 4), leaving that pointer clause unreachable, and it asserted "stayed sound" over a
  // book whose Health actually dropped. Tightened to `hDir.steady`: the "stayed sound" copy now
  // fires only when Health truly held (Construction alone fell), and a genuine both-down window
  // falls through to the Health-tab pointer, which the brief calls out as a required case.
  let meaning = "";
  if (single) {
    meaning = ""; // one point: nothing has moved, so there is nothing to interpret
  } else if (showH && showC && cDir) {
    if (!hDir.steady && !cDir.steady && hDir.up !== cDir.up) {
      meaning = hDir.up
        ? " — your businesses strengthened even as the book's structure loosened."
        : " — the book was rebuilt more soundly even as business quality softened.";
    } else if (hDir.steady && !cDir.steady && !cDir.up) {
      meaning = " — the businesses you own stayed sound, but the book became more concentrated.";
    } else if (!hDir.steady && hDir.up && !cDir.steady && cDir.up) {
      meaning = " — both the businesses and the way they're assembled improved.";
    } else if (!hDir.steady && !hDir.up && !cDir.steady && !cDir.up) {
      meaning = " — both softened; worth understanding which holdings drove it on the Health tab.";
    } else {
      meaning = " — the two moved largely in step.";
    }
  } else if (showH && !showC) {
    meaning = " — this is the quality of your scoreable businesses only, not how the book is built.";
  } else if (showC && !showH) {
    meaning = " — this is how your book is assembled, independent of the businesses' quality.";
  }

  if (parts.length === 0) return <>Select a score to see how it moved.</>;
  return (
    <>
      {phrase},{" "}
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 ? " while " : ""}
          {p}
        </span>
      ))}
      {meaning}
    </>
  );
}

// ── honest non-chart states ───────────────────────────────────────────────────
function LoadingSkeleton({ compact }: { compact: boolean }) {
  return <div className={cn("w-full animate-pulse rounded-xl bg-surface-2/50", compact ? "h-[180px]" : "h-[220px]")} />;
}
function ErrorNote() {
  return <p className="py-6 text-center text-[12px] text-ink3">Health history couldn&apos;t load right now.</p>;
}
/** No row has ever been written — the honest pre-tracking state (not an error). */
function NoHistoryYet() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line2 bg-surface-2/40 px-6 py-8 text-center">
      <Icons.chartLine weight="duotone" className="size-6 text-ink3 opacity-70" />
      <p className="text-[12.5px] text-ink2">Your health history starts once your first score computes.</p>
      <p className="max-w-sm text-[11px] leading-relaxed text-ink3">
        Nothing is back-filled — it begins the day your book is first scored and fills forward daily from there.
      </p>
    </div>
  );
}
/** Exactly one row — a line needs two points, so state the one real value (no from/to), led by
 *  the honest "Today" phrase. The value tiles keep the numbers glanceable beneath the sentence. */
function SingleDayState({ point }: { point: ScoreHistoryPoint }) {
  const items = [
    { label: "Health", value: point.phs, color: HEALTH_COLOR },
    ...(point.structure != null ? [{ label: "Construction", value: point.structure, color: CONSTRUCTION_COLOR }] : []),
  ];
  return (
    <div className="rounded-lg border border-dashed border-line2 bg-surface-2/40 px-5 py-5">
      <p className="font-serif text-[13.5px] leading-relaxed text-ink2">
        <StorySentence wpts={[point]} showH showC />
      </p>
      <div className="mt-3.5 flex flex-wrap items-center gap-5 border-t border-line pt-3.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2.5">
            <span className="size-3 shrink-0 rounded-full" style={{ background: it.color }} />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-ink3">{it.label}</p>
              <p className="num text-[20px] font-medium leading-none" style={{ color: it.color }}>
                {it.value}
              </p>
            </div>
          </div>
        ))}
        <p className="ml-auto max-w-[16rem] text-[11px] leading-relaxed text-ink3">
          One day tracked so far — not enough for a line yet. It grows into one as your book keeps computing.
        </p>
      </div>
    </div>
  );
}

export function HealthHistoryChart({ compact = false, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  const q = useScoreHistory();
  const gid = useId().replace(/:/g, "");
  const full = q.data?.series ?? [];

  // controls (full only). Compact pins both-on + the whole (Max) window.
  const [showH, setShowH] = useState(true);
  const [showC, setShowC] = useState(true);
  // Default to Max — the honest "show everything" view. It is ALWAYS valid (whatever exists),
  // so a young book opens correctly with no range special-casing, and a mature one opens on its
  // full history rather than a truncating fixed window.
  const [period, setPeriod] = useState<PeriodKey>("MAX");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // The book's REAL span (first→last of the whole series). A fixed range is only OFFERED when the
  // span reaches its window: with two days of data, 1M/6M/1Y/5Y all exceed the span and are
  // disabled — only Max is honest. As history accrues they light up on their own (no later code).
  const fullSpanDays =
    full.length >= 2 ? Math.round((Date.parse(full[full.length - 1].date) - Date.parse(full[0].date)) / 86_400_000) : 0;
  const rangeEnabled = (key: PeriodKey) => key === "MAX" || fullSpanDays >= (WINDOW_DAYS[key] as number);

  // Guard against a selection whose range no longer fits the span (defensive — disabled buttons
  // can't be clicked, so this only bites if the data shrank under a stale selection): fall to Max.
  const effPeriod: PeriodKey = compact ? "MAX" : rangeEnabled(period) ? period : "MAX";
  const hOn = compact ? true : showH;
  const cOn = compact ? true : showC;

  // window the DAILY series by real calendar days off the last point (never by point-count).
  const wpts = useMemo(() => {
    if (full.length === 0) return full;
    const days = WINDOW_DAYS[effPeriod];
    if (days == null) return full;
    const cutoff = isoMinusDays(full[full.length - 1].date, days);
    return full.filter((p) => p.date >= cutoff);
  }, [full, effPeriod]);

  const n = wpts.length;

  // Geometry — one fixed 0..100 plot (coverage lane removed). Stretched viewBox + HTML overlay
  // labels (perfect-circle dots, crisp text), the same approach the NAV chart uses.
  const VBW = 1000;
  const X0 = compact ? 4 : 34;
  const X1 = 996;
  const plotTop = 8;
  const plotBottom = compact ? 172 : 196;
  const VBH = compact ? 180 : 224; // full reserves a bottom band for x-axis date labels
  const baseY = plotBottom;

  const xOf = (i: number) => (n <= 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (n - 1));
  const yOf = (v: number) => plotTop + ((100 - v) / 100) * (plotBottom - plotTop);
  const leftPct = (i: number) => (xOf(i) / VBW) * 100;
  const topPct = (y: number) => (y / VBH) * 100;

  const healthRuns = useMemo(() => runsOf(wpts, (p) => p.phs), [wpts]);
  const structureRuns = useMemo(() => runsOf(wpts, (p) => p.structure), [wpts]);
  const showAllDots = n <= 14; // dots at every point while sparse; endpoints-only once dense

  // latest values across the FULL series (chips / current values read the current book).
  const latestH = full.length ? full[full.length - 1].phs : null;
  const latestC = [...full].reverse().find((p) => p.structure != null)?.structure ?? null;
  // where Construction's data first begins (full series) — for the honesty caption.
  const constructionFirst = full.find((p) => p.structure != null) ?? null;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || n < 2) return; // compact scrubs too now (the tooltip is shared)
    const rect = svg.getBoundingClientRect();
    const vbx = ((e.clientX - rect.left) / rect.width) * VBW;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(xOf(i) - vbx);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    setActiveIdx(best);
  };

  if (q.isLoading) return <LoadingSkeleton compact={compact} />;
  if (q.isError) return <ErrorNote />;
  if (full.length === 0) return <NoHistoryYet />;
  if (full.length === 1) return <SingleDayState point={full[0]} />;

  const scrubbing = activeIdx != null; // compact scrubs too
  const idx = activeIdx != null ? Math.min(activeIdx, n - 1) : n - 1;
  const activePoint = wpts[idx];
  // First · middle · last (deduped) — the prototype's spacing, and it never crowds the last
  // label the way an every-Nth stride does when the last stride lands adjacent to the end.
  const xLabelIdx = [...new Set([0, Math.floor((n - 1) / 2), n - 1])];
  const spanDays = (Date.parse(wpts[n - 1].date) - Date.parse(wpts[0].date)) / 86_400_000;
  const longSpan = spanDays > 120;

  // ── the SVG plot + HTML overlays — shared by both variants (compact just omits chrome) ──
  const plot = (
    <div className={cn("relative w-full select-none", compact ? "h-[172px]" : "h-[206px]")}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VBW} ${VBH}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full cursor-crosshair touch-pan-y"
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => setActiveIdx(null)}
        role="img"
        aria-label="Health and Construction scores over time"
      >
        <defs>
          <linearGradient id={`gH-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={HEALTH_COLOR} stopOpacity={0.3} />
            <stop offset="1" stopColor={HEALTH_COLOR} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`gC-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={CONSTRUCTION_COLOR} stopOpacity={0.24} />
            <stop offset="1" stopColor={CONSTRUCTION_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* fixed 0 / 50 / 100 gridlines — never data-fitted */}
        {[0, 50, 100].map((t) => (
          <line key={t} x1={X0} y1={yOf(t)} x2={X1} y2={yOf(t)} stroke="var(--line)" strokeDasharray="2 5" strokeOpacity={t === 50 ? 0.5 : 0.35} />
        ))}

        {/* Construction — area + stroke FIRST (behind), only where non-null */}
        {cOn &&
          structureRuns.map((run, ri) =>
            run.length >= 2 ? (
              <g key={`c-${ri}`}>
                <path d={areaPath(run, xOf, yOf, baseY)} fill={`url(#gC-${gid})`} />
                <path d={strokePath(run, xOf, yOf)} fill="none" stroke={CONSTRUCTION_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            ) : null,
          )}
        {/* Health — area + stroke ON TOP (keeps the lower series readable at a crossover) */}
        {hOn &&
          healthRuns.map((run, ri) =>
            run.length >= 2 ? (
              <g key={`h-${ri}`}>
                <path d={areaPath(run, xOf, yOf, baseY)} fill={`url(#gH-${gid})`} />
                <path d={strokePath(run, xOf, yOf)} fill="none" stroke={HEALTH_COLOR} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            ) : null,
          )}

        {scrubbing && <line x1={xOf(idx)} y1={plotTop} x2={xOf(idx)} y2={plotBottom} stroke="var(--ink3)" strokeDasharray="3 3" strokeOpacity={0.6} />}
      </svg>

      {/* dots — HTML overlay so they stay perfect circles under the non-uniform SVG stretch */}
      {cOn &&
        structureRuns.flatMap((run) =>
          (showAllDots ? run : [run[run.length - 1]]).map((p) => (
            <span
              key={`cd-${p.i}`}
              className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${leftPct(p.i)}%`, top: `${topPct(yOf(p.v))}%`, background: CONSTRUCTION_COLOR }}
            />
          )),
        )}
      {/* a lone non-null Construction point (run length 1) draws only as a ring — never a line */}
      {cOn &&
        structureRuns
          .filter((r) => r.length === 1)
          .map((r) => (
            <span
              key={`cdot-${r[0].i}`}
              className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{ left: `${leftPct(r[0].i)}%`, top: `${topPct(yOf(r[0].v))}%`, background: "var(--surface-1)", borderColor: CONSTRUCTION_COLOR }}
            />
          ))}
      {hOn &&
        healthRuns.flatMap((run) =>
          (showAllDots ? run : [run[run.length - 1]]).map((p) => (
            <span
              key={`hd-${p.i}`}
              className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${leftPct(p.i)}%`, top: `${topPct(yOf(p.v))}%`, background: HEALTH_COLOR }}
            />
          )),
        )}

      {/* scrub markers + tooltip (full only) — respects toggles, has NO coverage row */}
      {scrubbing && (
        <>
          {hOn && (
            <span
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{ left: `${leftPct(idx)}%`, top: `${topPct(yOf(activePoint.phs))}%`, background: "var(--surface-1)", borderColor: HEALTH_COLOR }}
            />
          )}
          {cOn && activePoint.structure != null && (
            <span
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{ left: `${leftPct(idx)}%`, top: `${topPct(yOf(activePoint.structure))}%`, background: "var(--surface-1)", borderColor: CONSTRUCTION_COLOR }}
            />
          )}
          <div
            className="pointer-events-none absolute flex -translate-x-1/2 flex-col gap-1 whitespace-nowrap rounded-md border border-line2 bg-surface-3 px-2.5 py-1.5 text-[11px] shadow-lg"
            style={{ left: `${Math.min(Math.max(leftPct(idx), 16), 84)}%`, top: `${topPct(plotTop)}%` }}
          >
            <span className="num text-ink3">{fmtDate(activePoint.date)}</span>
            {hOn && (
              <span className="num font-semibold" style={{ color: HEALTH_COLOR }}>
                Health {activePoint.phs}
              </span>
            )}
            {cOn && (
              <span
                className="num font-semibold"
                style={{ color: activePoint.structure != null ? CONSTRUCTION_COLOR : "var(--ink3)" }}
              >
                {activePoint.structure != null ? `Construction ${activePoint.structure}` : "Construction — not yet tracked"}
              </span>
            )}
          </div>
        </>
      )}

      {/* y-axis score labels (full only) */}
      {!compact &&
        [0, 50, 100].map((t) => (
          <span
            key={t}
            className="num pointer-events-none absolute -translate-x-full -translate-y-1/2 whitespace-nowrap pr-2 text-[10px] text-ink3"
            style={{ left: `${(X0 / VBW) * 100}%`, top: `${topPct(yOf(t))}%` }}
          >
            {t}
          </span>
        ))}

      {/* x-axis date labels (full only) */}
      {!compact &&
        xLabelIdx.map((i) => (
          <span
            key={i}
            className="num pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-[10px] text-ink3"
            style={{ left: `${Math.min(Math.max(leftPct(i), 4), 96)}%`, top: `${topPct(plotBottom) + 5}%` }}
          >
            {fmtAxisDate(wpts[i].date, longSpan)}
          </span>
        ))}
    </div>
  );

  // ── COMPACT (Overview) — the glance: current values, the chart at normal height, the
  //    one-line story. The chart SCRUBS (same tooltip as full). NOT a whole-card tap-through —
  //    people click a chart to READ it, not to leave the page; only the explicit button navigates. ──
  if (compact) {
    return (
      <div className="rounded-xl border border-line bg-surface-1 p-4 sm:p-5">
        <div className="flex-wrap min-[400px]:flex-nowrap mb-3 flex items-center gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="size-2.5 shrink-0 translate-y-px rounded-[3px]" style={{ background: HEALTH_COLOR }} />
            <span className="text-[11px] text-ink3">Health</span>
            <span className="num text-[17px] font-medium" style={{ color: HEALTH_COLOR }}>
              {latestH}
            </span>
          </div>
          <div className=" flex items-baseline gap-1.5">
            <span className="size-2.5 shrink-0 translate-y-px rounded-[3px]" style={{ background: CONSTRUCTION_COLOR }} />
            <span className="text-[11px] text-ink3">Construction</span>
            <span className="num text-[17px] font-medium" style={{ color: latestC != null ? CONSTRUCTION_COLOR : "var(--ink3)" }}>
              {latestC ?? "—"}
            </span>
          </div>
          {onOpen && (
            <button
              type="button"
              onClick={onOpen}
              className="min-[400px]:ml-auto inline-flex shrink-0 items-center gap-1 rounded-md border border-line2 px-2.5 py-1 text-[11px] text-ink3 transition-colors hover:border-line3 hover:text-ink"
            >
              See full history
              <Icons.arrowUpRight className="size-3" />
            </button>
          )}
        </div>
        {plot}
        <p className="mt-3 border-t border-line pt-2.5 font-serif text-[12.5px] leading-relaxed text-ink2">
          <StorySentence wpts={wpts} showH showC />
        </p>
      </div>
    );
  }

  // ── FULL (Health tab) — toggle chips · period selector · story · chart · how-to · caption ──
  return (
    <div>
      {/* controls: toggle chips + period selector */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="flex gap-2">
          <ToggleChip label="Health" value={latestH} color={HEALTH_COLOR} on={showH} onClick={() => setShowH((v) => (v && !showC ? v : !v))} />
          <ToggleChip label="Construction" value={latestC} color={CONSTRUCTION_COLOR} on={showC} onClick={() => setShowC((v) => (v && !showH ? v : !v))} />
        </div>
        <div className="ml-auto flex gap-0.5 rounded-lg border border-line2 bg-surface-2 p-0.5">
          {PERIODS.map((p) => {
            const enabled = rangeEnabled(p.key);
            return (
              <button
                key={p.key}
                type="button"
                disabled={!enabled}
                onClick={() => {
                  setPeriod(p.key);
                  setActiveIdx(null);
                }}
                title={enabled ? undefined : "Not enough history yet for this range"}
                className={cn(
                  "num rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  !enabled
                    ? "cursor-not-allowed text-ink3/40"
                    : effPeriod === p.key
                      ? "bg-surface-3 text-ink"
                      : "text-ink3 hover:text-ink2",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* the narration — recomputes from the window's real endpoints; describes, never advises.
          Its leading phrase is the REAL span (item 2), so it never claims "5 years" for 2 days. */}
      <p className="mb-4 rounded-xl border border-line bg-surface-2/50 px-4 py-3 font-serif text-[13.5px] leading-relaxed text-ink2">
        <StorySentence wpts={wpts} showH={showH} showC={showC} />
      </p>

      {n < 2 ? (
        <div className="flex h-[206px] items-center justify-center rounded-xl border border-dashed border-line2 bg-surface-2/40 px-6 text-center text-[12px] text-ink3">
          Only {n} point in this window — pick a longer period to see the line.
        </div>
      ) : (
        plot
      )}

      {/* how to read this — static explainer (never changes with the data) */}
      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink3">How to read this</p>
        <div className="grid gap-2">
          <HowToRow color={HEALTH_COLOR}>
            <b className="font-semibold text-ink2">Health</b> — the quality of the businesses in your book we can score,
            0 to 100. It answers &ldquo;are the things I own sound?&rdquo; and reflects only the part of your book that&apos;s
            individual companies.
          </HowToRow>
          <HowToRow color={CONSTRUCTION_COLOR}>
            <b className="font-semibold text-ink2">Construction</b> — how well your whole book is built: concentration,
            breadth, balance, 0 to 100. It answers &ldquo;is this book safely put together?&rdquo; — independent of the
            businesses&apos; quality.
          </HowToRow>
          <HowToRow color="var(--line2)">
            They move <b className="font-semibold text-ink2">independently</b> and are never combined. A book can hold
            great businesses assembled riskily (high Health, low Construction) — or the reverse. Watching them apart is
            the point.
          </HowToRow>
        </div>
        <p className="num mt-3.5 text-[11px] text-ink3">
          Tracking since {fmtDate(full[0].date)}
          {constructionFirst && constructionFirst.date !== full[0].date && (
            <> · Construction from {fmtMonthYear(constructionFirst.date)}</>
          )}
        </p>
      </div>
    </div>
  );
}

// ── toggle chip — the last-on chip is inert (can't disable both series) ──
function ToggleChip({
  label,
  value,
  color,
  on,
  onClick,
}: {
  label: string;
  value: number | null;
  color: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12.5px] transition-opacity",
        on ? "text-ink2" : "text-ink3 opacity-50",
      )}
    >
      <span className="h-1 w-3 rounded-sm" style={{ background: on ? color : "var(--ink3)" }} />
      {label}
      <span className="num text-[12px]" style={{ color: on ? color : "var(--ink3)" }}>
        {value ?? "—"}
      </span>
    </button>
  );
}

function HowToRow({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-[12px] leading-relaxed text-ink3">
      <span className="mt-1.5 h-1 w-3 shrink-0 rounded-sm" style={{ background: color }} />
      <span>{children}</span>
    </div>
  );
}
