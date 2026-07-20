"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/ui/query-error";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/reveal";
import { Panel, SectionEyebrow, tint } from "@/components/stock-detail/health/shared";
import { useFundsBrowse } from "@/lib/api/hooks/use-funds-browse";
import { Segmented, TogglePill, MultiSelectFacet } from "@/components/fund-discovery/controls";
import { FundCard, GrowerCard } from "@/components/fund-discovery/fund-card";
import type { FundAssetClass, FundsQuery } from "@/types/funds-browse";

// No `sort` — the return-sorted highlight now lives in the "Top growers" strip, and the browse
// grid stays name-ordered (the backend default). One fewer control, one fewer coverage caveat.
interface Filters {
  q: string;
  assetClass: FundAssetClass | null;
  category: string[];
  fundHouse: string[];
  plan: "direct" | "regular" | null;
  includeDormant: boolean;
}

const EMPTY: Filters = {
  q: "",
  assetClass: null,
  category: [],
  fundHouse: [],
  plan: null,
  includeDormant: false,
};

function filtersFromUrl(sp: URLSearchParams): Filters {
  const assetClass = sp.get("assetClass");
  const plan = sp.get("plan");
  return {
    q: sp.get("q") ?? "",
    assetClass: assetClass === "mutual_fund" || assetClass === "etf" ? assetClass : null,
    category: sp.getAll("category"),
    fundHouse: sp.getAll("fundHouse"),
    plan: plan === "direct" || plan === "regular" ? plan : null,
    includeDormant: sp.get("includeDormant") === "true",
  };
}

function filtersToQuery(f: Filters): FundsQuery {
  return {
    q: f.q || undefined,
    assetClass: f.assetClass ?? undefined,
    category: f.category.length ? f.category : undefined,
    fundHouse: f.fundHouse.length ? f.fundHouse : undefined,
    plan: f.plan ?? undefined,
    includeDormant: f.includeDormant || undefined,
    limit: 24,
  };
}

const cardGrid = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

/** Calm KPI tile — label + a single `.num` value (the Results page's hero-stat shape).
 *  While `loading`, the value is replaced by a shimmer bar so the tile never flashes a
 *  fabricated "—" before the headline query lands. The label stays put (it's static),
 *  so nothing reflows when the number arrives. */
function Kpi({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="text-[11px] text-ink3">{label}</div>
      {loading ? (
        <div className="shimmer mt-1.5 h-4.5 w-14 rounded-md bg-surface-3" aria-hidden />
      ) : (
        <div className="num mt-1 text-[18px] font-semibold text-ink">{value}</div>
      )}
    </div>
  );
}

export default function FundDiscoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL is the shareable source at mount; local state drives the UI thereafter.
  const [filters, setFilters] = useState<Filters>(() => filtersFromUrl(new URLSearchParams(searchParams.toString())));
  // The text field updates instantly; `q` in `filters` is debounced so we don't refetch per keystroke.
  const [qInput, setQInput] = useState(filters.q);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === qInput ? f : { ...f, q: qInput })), 250);
    return () => clearTimeout(t);
  }, [qInput]);

  // reflect committed filters into the URL (replace, so the back button isn't polluted per change)
  useEffect(() => {
    const p = new URLSearchParams();
    if (filters.q) p.set("q", filters.q);
    if (filters.assetClass) p.set("assetClass", filters.assetClass);
    for (const c of filters.category) p.append("category", c);
    for (const h of filters.fundHouse) p.append("fundHouse", h);
    if (filters.plan) p.set("plan", filters.plan);
    if (filters.includeDormant) p.set("includeDormant", "true");
    const qs = p.toString();
    router.replace(qs ? `/research/funds?${qs}` : "/research/funds", { scroll: false });
  }, [filters, router]);

  const query = useMemo(() => filtersToQuery(filters), [filters]);
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFundsBrowse(query);

  // Top growers + headline stats — a small, UNFILTERED query (highest trailing 1-year return,
  // nulls last). Its first page also carries the whole-catalogue facets/total, so the header
  // numbers stay stable no matter how the user filters the grid below.
  const { data: topData, isLoading: overviewLoading } = useFundsBrowse(
    useMemo(() => ({ sort: "ret1y", limit: 10 }) as FundsQuery, []),
  );
  const overview = topData?.pages[0];
  const topGrowers = overview?.results ?? [];
  const overviewTotal = overview?.total ?? null;
  const etfCount = overview?.facets.assetClass.find((a) => a.value === "etf")?.count ?? null;
  const houseCount = overview?.facets.fundHouse.length ?? null;
  const catCount = overview?.facets.category.length ?? null;

  const first = data?.pages[0];
  const rows = useMemo(() => data?.pages.flatMap((p) => p.results) ?? [], [data]);
  const total = first?.total ?? 0;

  const activeFilterCount =
    (filters.q ? 1 : 0) +
    (filters.assetClass ? 1 : 0) +
    filters.category.length +
    filters.fundHouse.length +
    (filters.plan ? 1 : 0) +
    (filters.includeDormant ? 1 : 0);

  const clearAll = () => {
    setQInput("");
    setFilters(EMPTY);
  };

  // ── infinite scroll — a sentinel below the grid fetches the next page as it nears the
  //    viewport (rootMargin preloads before it's actually visible). Replaces "Load more". ──
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rows.length]);

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col">
      {/* ---------------------------------------------------------------- Hero */}
      <Reveal>
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border" style={tint("var(--p-found)")}>
              <Icons.chartLine weight="duotone" className="h-4 w-4" />
            </span>
            <span className="eyebrow">Funds Research</span>
          </div>

          <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
            Every fund, measured the same way
          </h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink3">
            Browse every mutual fund and ETF we track — filter by category, fund house and plan. A
            missing return means unknown, never last.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Kpi label="Instruments tracked" value={overviewTotal != null ? overviewTotal.toLocaleString("en-IN") : "—"} loading={overviewLoading} />
            <Kpi label="ETFs" value={etfCount != null ? etfCount.toLocaleString("en-IN") : "—"} loading={overviewLoading} />
            <Kpi label="Fund houses" value={houseCount != null ? houseCount.toLocaleString("en-IN") : "—"} loading={overviewLoading} />
            <Kpi label="Categories" value={catCount != null ? catCount.toLocaleString("en-IN") : "—"} loading={overviewLoading} />
          </div>
        </Panel>
      </Reveal>

      {/* ------------------------------------------------------------ Top growers */}
      {topGrowers.length > 0 && (
        <section>
          <SectionEyebrow label="Top growers" icon={Icons.trendUp} accent="var(--p-mom)" pill="Top 10 · 1-year return" />
          <StaggerGroup inView={false} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {topGrowers.map((row) => (
              <StaggerItem key={row.familyId}>
                <GrowerCard row={row} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      )}

      {/* ------------------------------------------------------ Discover the universe */}
      <section className="mt-2">
        <SectionEyebrow
          label="The fund universe"
          icon={Icons.compass}
          accent="var(--p-found)"
          pill={overviewTotal != null ? `${overviewTotal.toLocaleString("en-IN")} in all` : undefined}
        />

        {/* filters + search */}
        <Reveal className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<FundAssetClass>
            ariaLabel="Asset class"
            value={filters.assetClass}
            onChange={(v) => setFilters((f) => ({ ...f, assetClass: v }))}
            options={[
              { value: null, label: "All" },
              { value: "mutual_fund", label: "Mutual funds" },
              { value: "etf", label: "ETFs" },
            ]}
          />
          <Segmented<"direct" | "regular">
            ariaLabel="Plan"
            value={filters.plan}
            onChange={(v) => setFilters((f) => ({ ...f, plan: v }))}
            options={[
              { value: null, label: "Any plan" },
              { value: "direct", label: "Direct" },
              { value: "regular", label: "Regular" },
            ]}
          />
          {first?.facets && (
            <>
              <MultiSelectFacet
                label="Category"
                options={first.facets.category}
                selected={filters.category}
                onChange={(next) => setFilters((f) => ({ ...f, category: next }))}
              />
              <MultiSelectFacet
                label="Fund house"
                options={first.facets.fundHouse}
                selected={filters.fundHouse}
                onChange={(next) => setFilters((f) => ({ ...f, fundHouse: next }))}
              />
            </>
          )}
          <TogglePill
            active={filters.includeDormant}
            onToggle={() => setFilters((f) => ({ ...f, includeDormant: !f.includeDormant }))}
          >
            Include dormant
          </TogglePill>
          {activeFilterCount > 0 && (
            <button type="button" onClick={clearAll} className="text-[11.5px] text-primary hover:underline">
              Clear all
            </button>
          )}
        </div>

        <div className="relative lg:w-64 lg:shrink-0">
          <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search by fund name or house…"
            aria-label="Search funds"
            className="h-9 w-full rounded-lg border border-line bg-surface-1 pl-9 pr-8 text-[13px] text-ink outline-none transition-colors placeholder:text-ink3 focus:border-line3"
          />
          {qInput && (
            <button
              type="button"
              onClick={() => setQInput("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink3 hover:text-ink"
            >
              <Icons.close className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </Reveal>

      {/* count line */}
      {!isLoading && !isError && (
        <p className="mt-3 text-[12.5px] text-ink2">
          <span className="num font-medium text-ink">{total.toLocaleString("en-IN")}</span>{" "}
          {total === 1 ? "instrument" : "instruments"}
          {!filters.includeDormant && (
            <span className="text-ink3"> · dormant hidden — toggle above to include them</span>
          )}
        </p>
      )}

      {/* ------------------------------------------------------------------ Grid */}
      {isLoading ? (
        <div className={cn("mt-5", cardGrid)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-44 rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-5">
          <QueryError message={(error as Error)?.message ?? "Failed to load funds."} onRetry={() => refetch()} />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-line2 bg-surface-1 px-6 py-14 text-center">
          <Icons.search weight="duotone" className="mx-auto mb-3 h-8 w-8 text-ink3" />
          <p className="font-medium text-ink">No instruments match these filters</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink3">
            {activeFilterCount > 0
              ? "Try removing a category, fund house or plan filter — or broaden the search."
              : "Nothing here. Include dormant funds to widen the catalogue."}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={clearAll}>
            Clear all filters
          </Button>
        </div>
      ) : (
        <>
          <StaggerGroup inView={false} className={cn("mt-5", cardGrid)}>
            {rows.map((row) => (
              <StaggerItem key={row.familyId}>
                <FundCard row={row} />
              </StaggerItem>
            ))}
          </StaggerGroup>

          {/* infinite-scroll sentinel + bottom loader */}
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          <div className="mt-6 flex flex-col items-center gap-2">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-[12px] text-ink3">
                <Icons.spinner className="h-4 w-4 animate-spin" />
                Loading more…
              </div>
            )}
            {!hasNextPage && (
              <p className="text-[11.5px] text-ink3">
                Showing all <span className="num">{rows.length.toLocaleString("en-IN")}</span> of{" "}
                <span className="num">{total.toLocaleString("en-IN")}</span>
              </p>
            )}
          </div>
        </>
      )}
      </section>
    </div>
  );
}
