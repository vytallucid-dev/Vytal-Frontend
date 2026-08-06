"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { VERDICT_DOESNT_MEAN } from "@/components/results/shared";
import {
  useReportedResults,
  useUpcomingResults,
  useResultsOverview,
  RESULTS_PAGE_SIZE,
} from "@/lib/api/hooks/use-results-list";
import type { ReportedResultItem, UpcomingResultItem } from "@/types/results";

/* ------------------------------------------------------------------ helpers */

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtFullDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const money = (cr: number | null) => (cr == null ? DASH : fmtMarketCap(cr));

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

/** Calm KPI tile — label + a single `.num` value, optional directional colour.
 *  While `loading`, the value is replaced by a shimmer bar so the tile never flashes a
 *  fabricated "0"/"—" before the feed lands. The label stays put (it's static), so
 *  nothing reflows when the number arrives. */
function Kpi({
  label,
  value,
  color = "var(--ink)",
  loading,
}: {
  label: string;
  value: string;
  color?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="text-[11px] text-ink3">{label}</div>
      {loading ? (
        <div className="shimmer mt-1.5 h-4.5 w-14 rounded-md bg-surface-3" aria-hidden />
      ) : (
        <div className="num mt-1 text-[18px] font-semibold" style={{ color }}>
          {value}
        </div>
      )}
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

/** "This week" is the same 7-day window the backend counts for the chip beside it. */
const WEEK_DAYS = 7;

/* --------------------------------------------------------------------- page */

export default function ResultsPage() {
  const [filter, setFilter] = useState<Filter>("reported");

  // The field updates instantly; the committed term is debounced, so a search is one
  // request per pause rather than one per keystroke — every term is a fresh server query.
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(queryInput), 250);
    return () => clearTimeout(t);
  }, [queryInput]);

  const showingUpcoming = filter === "upcoming";

  // The header stats, the chip counts and the growers strip describe the WHOLE feed, so
  // they come from their own read — never from a page, which would silently mean "of the
  // twelve cards on screen".
  const { data: overview, isLoading: overviewLoading } = useResultsOverview();

  // Exactly one half is on screen at a time, so only that half fetches. The other stays
  // cached and resumes where the reader left it.
  const reportedFeed = useReportedResults({
    q: query,
    days: filter === "week" ? WEEK_DAYS : undefined,
    scored: filter === "scored",
    enabled: !showingUpcoming,
  });
  const upcomingFeed = useUpcomingResults({ q: query, enabled: showingUpcoming });

  const active = showingUpcoming ? upcomingFeed : reportedFeed;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = active;

  const reportedRows = useMemo(
    () => reportedFeed.data?.pages.flatMap((p) => p.items) ?? [],
    [reportedFeed.data],
  );
  const upcomingRows = useMemo(
    () => upcomingFeed.data?.pages.flatMap((p) => p.items) ?? [],
    [upcomingFeed.data],
  );

  const total = active.data?.pages[0]?.total ?? 0;
  const shown = showingUpcoming ? upcomingRows.length : reportedRows.length;
  // The first page is still in flight — distinct from "loaded, and empty".
  const loadingFirstPage = active.isLoading || (active.isFetching && shown === 0 && !active.isError);

  const counts = overview?.counts;
  const counts4: Record<Filter, number | null> = {
    reported: counts?.reported ?? null,
    week: counts?.reportedThisWeek ?? null,
    scored: counts?.scored ?? null,
    upcoming: counts?.upcoming ?? null,
  };

  const topGrowers = overview?.topGrowers ?? [];

  /* ── infinite scroll — a sentinel below the grid pulls the next page as it nears the
   *    viewport (rootMargin preloads before it's actually visible). Same mechanic as the
   *    funds browse grid. ── */
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, shown, filter]);

  /** Sentinel + the bottom loader. Shared by both halves — one is mounted at a time. */
  const feedFooter = (noun: string) => (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      <div className="mt-6 flex flex-col items-center gap-2" aria-live="polite">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-[12px] text-ink3">
            <Icons.spinner className="h-4 w-4 animate-spin" />
            Loading more…
          </div>
        )}
        {!hasNextPage && total > RESULTS_PAGE_SIZE && (
          <p className="text-[11.5px] text-ink3">
            Showing all <span className="num">{total.toLocaleString("en-IN")}</span> {noun}
          </p>
        )}
      </div>
    </>
  );

  /** Placeholder cards for the page being fetched — the grid grows into the loader
   *  instead of jumping when the cards land. Never more than the page size. */
  const pendingSkeletons = isFetchingNextPage
    ? Array.from({ length: Math.min(RESULTS_PAGE_SIZE, Math.max(0, total - shown)) })
    : [];

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
            Every quarterly result, scored by the Vytal Health Score — so you see what actually
            changed, not just the numbers.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Kpi
              label="Reported this week"
              value={`${counts?.reportedThisWeek ?? 0}`}
              loading={overviewLoading}
            />
            <Kpi label="Upcoming" value={`${counts?.upcoming ?? 0}`} loading={overviewLoading} />
            <Kpi
              label="Avg revenue growth"
              value={fmtSignedPct(overview?.averages.revenueYoy ?? null)}
              color={toneColor(overview?.averages.revenueYoy ?? null)}
              loading={overviewLoading}
            />
            <Kpi
              label="Avg profit growth"
              value={fmtSignedPct(overview?.averages.profitYoy ?? null)}
              color={toneColor(overview?.averages.profitYoy ?? null)}
              loading={overviewLoading}
            />
          </div>
        </Panel>
      </Reveal>

      {/* ------------------------------------------------------- Filters + search */}
      <Reveal className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 hidden-scrollbar flex items-center gap-2 overflow-x-auto px-1 pb-0.5">
          {FILTERS.map((f) => {
            const activeChip = filter === f.key;
            const count = counts4[f.key];
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  !activeChip && "border-line bg-surface-1 text-ink3 hover:border-line2 hover:text-ink",
                )}
                style={activeChip ? tint(FILTER_ACCENT) : undefined}
              >
                <f.icon weight={activeChip ? "fill" : "regular"} className="h-3.5 w-3.5" />
                {f.label}
                <span
                  className={cn(
                    "num rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    activeChip ? "bg-surface-1/60" : "bg-surface-3 text-ink3",
                  )}
                >
                  {count == null ? DASH : count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-64">
          <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search company or sector…"
            aria-label="Search results"
            className="h-9 w-full rounded-lg border border-line bg-surface-1 pl-9 pr-8 text-[13px] text-ink outline-none transition-colors placeholder:text-ink3 focus:border-line3"
          />
          {queryInput && (
            <button
              type="button"
              onClick={() => setQueryInput("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink3 hover:text-ink"
            >
              <Icons.close className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </Reveal>

      {/* --------------------------------------------------------- Loading / error */}
      {active.isError ? (
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
                pill={`Top ${topGrowers.length} · net-profit YoY`}
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
                pill={loadingFirstPage ? undefined : `${total} upcoming`}
              />
              {loadingFirstPage ? (
                <div className={cardGrid}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <LoadingBlock key={i} className="h-44" />
                  ))}
                </div>
              ) : upcomingRows.length === 0 ? (
                <HonestEmpty>
                  No scheduled result dates match — check back as board-meeting filings come in.
                </HonestEmpty>
              ) : (
                <>
                  <StaggerGroup inView={false} className={cardGrid}>
                    {upcomingRows.map((u: UpcomingResultItem) => (
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
                    {pendingSkeletons.map((_, i) => (
                      <LoadingBlock key={`upcoming-pending-${i}`} className="h-44" />
                    ))}
                  </StaggerGroup>
                  {feedFooter("upcoming results")}
                </>
              )}
            </section>
          ) : (
            /* ----------------------------------------------------- Results feed */
            <section>
              <SectionEyebrow
                label={filter === "scored" ? "Scored results" : "Earnings feed"}
                icon={filter === "scored" ? Icons.shield : Icons.chartBar}
                accent="var(--p-found)"
                pill={
                  loadingFirstPage ? undefined : `${total} result${total === 1 ? "" : "s"}`
                }
              />

              {loadingFirstPage ? (
                <div className={cardGrid}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <LoadingBlock key={i} className="h-44" />
                  ))}
                </div>
              ) : reportedRows.length === 0 ? (
                <HonestEmpty className="flex flex-col items-center gap-3">
                  <span>
                    {filter === "scored"
                      ? "No scored results match — try a different filter or clear your search."
                      : "No results match — try a different filter or clear your search."}
                  </span>
                  <button
                    onClick={() => {
                      setFilter("reported");
                      setQueryInput("");
                    }}
                    className="rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
                  >
                    Reset filters
                  </button>
                </HonestEmpty>
              ) : (
                <>
                  <StaggerGroup inView={false} className={cardGrid}>
                    {reportedRows.map((r: ReportedResultItem) => (
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

                            {/* ── Quarter in Brief verdict — only when one was computed ──────────
                                ★ MONOCHROME, NOT THE --p-mkt TINTED CARD IT REPLACED. This box sits
                                inches from HealthChip, which is a coloured scale that DOES mean
                                better/worse. Two coloured scales on one card get read as one scale,
                                and a tinted "Grew" would be taken as Vytal calling the quarter good —
                                a claim the verdict explicitly does not make.
                                ⚠ The glyph is the neutral presence marker, not a direction: the feed
                                read-model ships the LABEL only, and inferring a direction from label
                                text here would put a second, ungoverned copy of the verdict rules in
                                the frontend. The word carries the direction; the detail card, which
                                has the key, carries the directional glyph. */}
                            {r.quarterBriefVerdict && (
                              <div className="rounded-lg border border-line2 bg-surface-2 p-2.5">
                                <div className="flex items-start gap-2">
                                  <Icons.circleDot
                                    weight="fill"
                                    className="mt-0.75 h-3.5 w-3.5 shrink-0 text-ink3"
                                  />
                                  <div className="min-w-0">
                                    <div className="kicker text-ink3">Quarter in Brief</div>
                                    {/* ⚠ WRAPS, NEVER TRUNCATES — "Grew, margins thinner" clipped to
                                        "Grew, margins…" reads as its own opposite. */}
                                    <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-ink">
                                      {r.quarterBriefVerdict}
                                    </p>
                                  </div>
                                </div>
                                {/* ★ SHIPS WITH THE BADGE. One string, defined once in
                                    components/results/shared.tsx and gated against the backend. */}
                                <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink3">
                                  {VERDICT_DOESNT_MEAN}
                                </p>
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
                    {pendingSkeletons.map((_, i) => (
                      <LoadingBlock key={`reported-pending-${i}`} className="h-44" />
                    ))}
                  </StaggerGroup>
                  {feedFooter(total === 1 ? "result" : "results")}
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
