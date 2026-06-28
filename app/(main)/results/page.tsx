"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icons";
import { healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/reveal";
import { Panel, SectionEyebrow, tint } from "@/components/stock-detail/health/shared";
import {
  toneColor,
  fmtSignedPct,
  fmtPct,
  fmtMarketCap,
  DASH,
  Chip,
  HonestEmpty,
  LoadingBlock,
} from "@/components/stock-detail/overview/shared";
import { useResultsList } from "@/lib/api/hooks/use-results-list";
import type { ReportedResultItem, UpcomingResultItem } from "@/types/results";

/* ------------------------------------------------------------------ helpers */

const WEEK_MS = 7 * 86_400_000;

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtFullDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const money = (cr: number | null) => (cr == null ? DASH : fmtMarketCap(cr));

const avg = (vals: (number | null)[]): number | null => {
  const v = vals.filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

/* derive honest highlight chips from the real, stored facts of a result */
function highlightsFor(r: ReportedResultItem): string[] {
  const out: string[] = [];
  if (r.revenueYoy != null) out.push(`${r.revenueLabel} ${fmtSignedPct(r.revenueYoy)} YoY`);
  if (r.profitYoy != null) out.push(`Net profit ${fmtSignedPct(r.profitYoy)} YoY`);
  if (r.margin != null) out.push(`${r.marginLabel} ${fmtPct(r.margin)}`);
  if (r.profitQoq != null) out.push(`Profit ${fmtSignedPct(r.profitQoq)} QoQ`);
  return out.slice(0, 4);
}

/* ---------------------------------------------------------------- primitives */

/** Calm KPI tile — label + a single `.num` value, optional directional colour. */
function Kpi({ label, value, color = "var(--ink)" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="text-[11px] text-ink3">{label}</div>
      <div className="num mt-1 text-[18px] font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

/** Health score chip — tinted by the condition band (the same scale the Health tab uses),
 *  honest-dash when the stock isn't scored. NOT placed beside any price/return figure. */
function HealthChip({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line text-[10px] text-ink3">
        {DASH}
      </span>
    );
  }
  return (
    <span
      className="num grid size-9 shrink-0 place-items-center rounded-lg border text-[13px] font-semibold"
      style={tint(healthColorVar(score))}
    >
      {Math.round(score)}
    </span>
  );
}

/** A small headline-number tile inside a feed card — value (.num) + optional signed YoY. */
function MiniStat({ label, value, delta }: { label: string; value: string; delta?: number | null }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
      <div className="truncate text-[10px] text-ink3">{label}</div>
      <div className="num mt-0.5 text-[12.5px] font-semibold text-ink">{value}</div>
      {delta != null ? (
        <div className="num text-[10.5px]" style={{ color: toneColor(delta) }}>
          {fmtSignedPct(delta)} YoY
        </div>
      ) : (
        <div className="num text-[10.5px] text-ink3">{DASH}</div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- filters */

type Filter = "reported" | "week" | "scored" | "upcoming";

const FILTERS: { key: Filter; label: string; icon: typeof Icons.results }[] = [
  { key: "reported", label: "Reported", icon: Icons.chartBar },
  { key: "week", label: "This week", icon: Icons.calendar },
  { key: "scored", label: "Scored", icon: Icons.shield },
  { key: "upcoming", label: "Upcoming", icon: Icons.target },
];

const FILTER_ACCENT = "var(--p-found)";
const cardGrid = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

/* --------------------------------------------------------------------- page */

export default function ResultsPage() {
  const [filter, setFilter] = useState<Filter>("reported");
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useResultsList({ limit: 250 });

  const reported = useMemo<ReportedResultItem[]>(() => data?.data.reported ?? [], [data]);
  const upcoming = useMemo<UpcomingResultItem[]>(() => data?.data.upcoming ?? [], [data]);
  const counts = data?.data.counts;

  const now = Date.now();
  const isThisWeek = (iso: string) => {
    const dt = now - new Date(iso).getTime();
    return dt >= 0 && dt <= WEEK_MS;
  };

  const scoredCount = useMemo(
    () => reported.filter((r) => r.healthScore != null).length,
    [reported],
  );

  const stats = useMemo(
    () => ({
      reportedThisWeek:
        counts?.reportedThisWeek ?? reported.filter((r) => isThisWeek(r.filingDate)).length,
      upcomingCount: counts?.upcoming ?? upcoming.length,
      avgRev: avg(reported.map((r) => r.revenueYoy)),
      avgProfit: avg(reported.map((r) => r.profitYoy)),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reported, upcoming, counts],
  );

  const q = query.toLowerCase();
  const matchReported = (r: ReportedResultItem) =>
    r.symbol.toLowerCase().includes(q) ||
    r.name.toLowerCase().includes(q) ||
    (r.sector ?? "").toLowerCase().includes(q);
  const matchUpcoming = (r: UpcomingResultItem) =>
    r.symbol.toLowerCase().includes(q) ||
    r.name.toLowerCase().includes(q) ||
    (r.sector ?? "").toLowerCase().includes(q);

  const filteredReported = useMemo(
    () =>
      reported
        .filter((r) =>
          filter === "week"
            ? isThisWeek(r.filingDate)
            : filter === "scored"
              ? r.healthScore != null
              : true,
        )
        .filter(matchReported)
        .sort((a, b) => +new Date(b.filingDate) - +new Date(a.filingDate)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reported, filter, query],
  );

  const filteredUpcoming = useMemo(
    () => upcoming.filter(matchUpcoming).sort((a, b) => +new Date(a.eventDate) - +new Date(b.eventDate)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [upcoming, query],
  );

  // Top growers — REAL fundamental signal (net-profit YoY), capped at the top 10.
  const topGrowers = useMemo(
    () =>
      [...reported]
        .filter((r) => r.profitYoy != null)
        .sort((a, b) => (b.profitYoy ?? 0) - (a.profitYoy ?? 0))
        .slice(0, 10),
    [reported],
  );

  const counts4: Record<Filter, number> = {
    reported: counts?.reported ?? reported.length,
    week: stats.reportedThisWeek,
    scored: scoredCount,
    upcoming: stats.upcomingCount,
  };

  const showingUpcoming = filter === "upcoming";

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col">
      {/* ---------------------------------------------------------------- Hero */}
      <Reveal>
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border"
              style={tint("var(--p-found)")}
            >
              <Icons.results weight="duotone" className="h-4 w-4" />
            </span>
            <span className="eyebrow">Quarterly Results</span>
          </div>

          <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
            Earnings, decoded
          </h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink3">
            Every quarterly result, scored by the InvestIQ Health Score — so you see what actually
            changed, not just the numbers.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Kpi label="Reported this week" value={`${stats.reportedThisWeek}`} />
            <Kpi label="Upcoming" value={`${stats.upcomingCount}`} />
            <Kpi
              label="Avg revenue growth"
              value={fmtSignedPct(stats.avgRev)}
              color={toneColor(stats.avgRev)}
            />
            <Kpi
              label="Avg profit growth"
              value={fmtSignedPct(stats.avgProfit)}
              color={toneColor(stats.avgProfit)}
            />
          </div>
        </Panel>
      </Reveal>

      {/* ------------------------------------------------------- Filters + search */}
      <Reveal className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-0.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  !active && "border-line bg-surface-1 text-ink3 hover:border-line2 hover:text-ink",
                )}
                style={active ? tint(FILTER_ACCENT) : undefined}
              >
                <f.icon weight={active ? "fill" : "regular"} className="h-3.5 w-3.5" />
                {f.label}
                <span
                  className={cn(
                    "num rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    active ? "bg-surface-1/60" : "bg-surface-3 text-ink3",
                  )}
                >
                  {counts4[f.key]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-64">
          <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or sector…"
            className="h-9 w-full rounded-lg border border-line bg-surface-1 pl-9 pr-3 text-[13px] text-ink outline-none transition-colors placeholder:text-ink3 focus:border-line3"
          />
        </div>
      </Reveal>

      {/* --------------------------------------------------------- Loading / error */}
      {isLoading ? (
        <div className={cn("mt-8", cardGrid)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingBlock key={i} className="h-44" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-8">
          <HonestEmpty>The results feed is unavailable right now. Please try again shortly.</HonestEmpty>
        </div>
      ) : (
        <>
          {/* --------------------------------------------------------- Top growers */}
          {!showingUpcoming && topGrowers.length > 0 && (
            <section>
              <SectionEyebrow
                label="Top growers"
                icon={Icons.trendUp}
                accent="var(--p-mom)"
                pill="Top 10 · net-profit YoY"
              />
              <StaggerGroup
                inView={false}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
              >
                {topGrowers.map((m) => (
                  <StaggerItem key={m.symbol}>
                    <Link
                      href={`/results/${m.symbol}?tab=snapshot`}
                      className="flex h-full flex-col gap-1.5 rounded-xl border border-line bg-surface-1 p-3 transition-colors hover:border-line3 hover:bg-surface-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-ink">{m.symbol}</span>
                        <span
                          className="num text-[12.5px] font-semibold"
                          style={{ color: toneColor(m.profitYoy) }}
                        >
                          {fmtSignedPct(m.profitYoy)}
                        </span>
                      </div>
                      <span className="num text-[10.5px] text-ink3">Net profit YoY · {m.periodLabel}</span>
                      <span className="mt-auto truncate text-[10.5px] text-ink3">{m.sector ?? DASH}</span>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </section>
          )}

          {/* ----------------------------------------------------- Upcoming feed */}
          {showingUpcoming ? (
            <section>
              <SectionEyebrow
                label="Earnings calendar"
                icon={Icons.calendar}
                accent="var(--p-mkt)"
                pill={`${filteredUpcoming.length} upcoming`}
              />
              {filteredUpcoming.length === 0 ? (
                <HonestEmpty>
                  No scheduled result dates match — check back as board-meeting filings come in.
                </HonestEmpty>
              ) : (
                <StaggerGroup inView={false} className={cardGrid}>
                  {filteredUpcoming.map((u) => (
                    <StaggerItem key={`${u.symbol}-${u.eventDate}`}>
                      <Link href={`/results/${u.symbol}?tab=snapshot`} className="block h-full">
                        <Panel className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-line3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-[15px] font-semibold text-ink">{u.symbol}</h3>
                              <p className="mt-0.5 truncate text-[12px] text-ink2">{u.name}</p>
                              <p className="text-[11px] text-ink3">{u.sector ?? DASH}</p>
                            </div>
                            <Chip tone={u.isConfirmed ? "accent" : "neutral"}>
                              {u.isConfirmed ? "Confirmed" : "Tentative"}
                            </Chip>
                          </div>
                          <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2">
                            <span
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border"
                              style={tint("var(--p-mkt)")}
                            >
                              <Icons.calendar weight="duotone" className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="text-[10px] text-ink3">Result date</div>
                              <div className="num text-[13.5px] font-semibold text-ink">
                                {fmtFullDay(u.eventDate)}
                              </div>
                            </div>
                          </div>
                          {u.description && (
                            <p className="mt-auto line-clamp-2 text-[11.5px] leading-relaxed text-ink3">
                              {u.description}
                            </p>
                          )}
                        </Panel>
                      </Link>
                    </StaggerItem>
                  ))}
                </StaggerGroup>
              )}
            </section>
          ) : (
            /* ----------------------------------------------------- Results feed */
            <section>
              <SectionEyebrow
                label={filter === "scored" ? "Scored results" : "Earnings feed"}
                icon={filter === "scored" ? Icons.shield : Icons.chartBar}
                accent="var(--p-found)"
                pill={`${filteredReported.length} result${filteredReported.length === 1 ? "" : "s"}`}
              />

              {filteredReported.length === 0 ? (
                <HonestEmpty className="flex flex-col items-center gap-3">
                  <span>
                    {filter === "scored"
                      ? "No scored results match — try a different filter or clear your search."
                      : "No results match — try a different filter or clear your search."}
                  </span>
                  <button
                    onClick={() => {
                      setFilter("reported");
                      setQuery("");
                    }}
                    className="rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
                  >
                    Reset filters
                  </button>
                </HonestEmpty>
              ) : (
                <StaggerGroup inView={false} className={cardGrid}>
                  {filteredReported.map((r) => (
                    <StaggerItem key={r.symbol}>
                      <Link href={`/results/${r.symbol}?tab=snapshot`} className="block h-full">
                        <Panel className="flex h-full flex-col gap-3.5 p-4 transition-colors hover:border-line3">
                          {/* header */}
                          <div className="flex items-start gap-3">
                            <HealthChip score={r.healthScore} />
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-[15px] font-semibold leading-tight text-ink">
                                {r.symbol}
                              </h3>
                              <p className="mt-0.5 truncate text-[12px] text-ink2">{r.name}</p>
                              <p className="text-[11px] text-ink3">{r.sector ?? DASH}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="num inline-block rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink2">
                                {r.periodLabel}
                              </span>
                              <p className="num mt-1 flex items-center justify-end gap-1 text-[10.5px] text-ink3">
                                <Icons.calendar weight="regular" className="h-3 w-3" />
                                {fmtDay(r.filingDate)}
                              </p>
                            </div>
                          </div>

                          {/* headline numbers */}
                          <div className="grid grid-cols-3 gap-2">
                            <MiniStat label={r.revenueLabel} value={money(r.revenue)} delta={r.revenueYoy} />
                            <MiniStat label="Net profit" value={money(r.netProfit)} delta={r.profitYoy} />
                            <MiniStat
                              label={r.marginLabel}
                              value={r.margin != null ? fmtPct(r.margin) : DASH}
                            />
                          </div>

                          {/* AI quick take — only when a REAL summary exists */}
                          {r.aiHeadline && (
                            <div
                              className="flex gap-2.5 rounded-lg border bg-surface-2 p-2.5"
                              style={{ borderColor: "color-mix(in oklch, var(--p-mkt) 26%, transparent)" }}
                            >
                              <Icons.spark weight="fill" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-p-mkt" />
                              <div>
                                <div className="kicker" style={{ color: "var(--p-mkt)" }}>
                                  AI quick take
                                </div>
                                <p className="mt-0.5 text-[12.5px] leading-snug text-ink2">{r.aiHeadline}</p>
                              </div>
                            </div>
                          )}

                          {/* highlight chips — derived from real YoY/QoQ facts */}
                          <div className="mt-auto flex flex-wrap gap-1.5">
                            {highlightsFor(r).map((h) => (
                              <Chip key={h}>{h}</Chip>
                            ))}
                          </div>
                        </Panel>
                      </Link>
                    </StaggerItem>
                  ))}
                </StaggerGroup>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
