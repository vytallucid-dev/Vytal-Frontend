"use client";

/**
 * Ownership tool — the orchestrator. Fills the SAME five <ToolFrame> slots
 * (zero frame edits). Reads the ownership SERIES (the new differentiating endpoint)
 * for the holding split / pledging / flows, and the HEALTH snapshot for the
 * Foundation floor (the floor-check input) + sector. The flow signal is derived from
 * holding-split deltas; pledge from share counts.
 */

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/lib/icons";
import { useScoredStocks, useStockScan, useStockScanFacets } from "@/lib/api/hooks/use-stocks";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { useStockOwnership } from "@/lib/api/hooks/use-stock-ownership";
import {
  EMPTY_SCAN_FILTERS,
  scanFilterCount,
  type ScanFilters,
  type OwnershipScanItem,
  type OwnershipTell,
} from "@/types/research-tools";
import { BAND_META } from "@/components/stock-detail/health/shared";
import type { LabelBand } from "@/types/health";
import { ToolFrame } from "../tool-frame";
import { ScanFilterBar, relabel } from "../scan-filters";
import {
  windowQuarters,
  type SingleViewSlots,
  type ToolMeta,
  type ToolWindow,
} from "../tool-frame.types";
import { WINDOW_PARAM, paramsForStockSwitch, parseWindow, writeWindowParam } from "../tool-url-state";
import { OwnershipChart } from "./ownership-chart";
import { OwnershipReadout } from "./ownership-readout";
import { OwnershipSummary } from "./ownership-summary";
import { OwnershipScanCard, TELL_META } from "./ownership-card";
import {
  buildHoldingPoints,
  windowDeltas,
  pledgeStateOf,
  floorCheck,
  buildOwnershipRead,
  buildOwnershipChips,
} from "./ownership-data";

const OWNERSHIP_META: ToolMeta = {
  id: "ownership",
  name: "Ownership",
  Icon: Icons.building,
  accentVar: "var(--p-own)",
  landingTitle: "Who's buying, who's selling",
  landingSubtitle:
    "Promoter, FII, DII and retail flows read against the soundness of the business. Pick a flow tell to study, or search any name.",
  landingEyebrow: "Ownership tells in your scope",
  scopeTag: "ranked by tell",
  searchPlaceholder: "Search a stock — e.g. ASHOKLEY, Cummins India…",
};

export function OwnershipTool() {
  const router = useRouter();
  const params = useSearchParams();
  const symbol = params.get("symbol")?.toUpperCase() || null;

  // Ownership stays quarterly — it reads the ownership ledger (per-filing), not the daily
  // score series. It rides the shared window contract via the quarter count, and passes NO
  // `dailyBounds` key at all, so the switcher's daily/custom group is not rendered.
  // ⚠ NOT "rendered disabled" — that is the `dailyBounds: null` case, which means "this tool does
  //   daily, but this stock has none yet". Omitting the key entirely means "this tool does not do
  //   daily", and the group is absent. See SingleViewSlots.dailyBounds for the three-way contract.
  // ★ URL STATE (`?window=`), READ NOT HELD — replacing a useState window plus a render-body reset
  //   block that existed only to clear it on stock switch. See tool-url-state.ts.
  //   ⚠ ON THIS TOOL THE WINDOW IS A SERVER-SIDE SLICE, not a client re-slice: `quarters` is a fetch
  //     argument to BOTH queries below, and nothing here calls sliceWindow. That is also why no
  //     `dailyBounds` is passed to the frame — the daily/custom options stay dormant, so a URL
  //     carrying `window=d60` would leave every quarterly button unselected. It cannot arrive from a
  //     stock switch (the scope rule drops daily/custom), only from a hand-edited or cross-tool URL,
  //     and it degrades to a 12-quarter fetch rather than breaking.
  const windowParam = params.get(WINDOW_PARAM);
  const window = useMemo(() => parseWindow(windowParam), [windowParam]);
  const quarters = windowQuarters(window);

  const onWindowChange = useCallback(
    (w: ToolWindow) => {
      const next = new URLSearchParams(Array.from(params.entries()));
      writeWindowParam(next, w);
      router.replace(`/research/ownership?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  // ★ STOCK SWITCHING — `replace` once a stock is open, `push` from the landing. Landing → stock is
  //   a real destination; stock → stock re-frames the same page and must not stack.
  //   ⚠ THE `symbol` TEST IS LOAD-BEARING — replacing unconditionally would consume the LANDING's own
  //     entry on the first pick, leaving no way back to it.
  const onSelectSymbol = useCallback(
    (s: string) => {
      const url = `/research/ownership?${paramsForStockSwitch(params, s).toString()}`;
      if (symbol) router.replace(url);
      else router.push(url);
    },
    [params, router, symbol],
  );

  const stocksQ = useScoredStocks();

  // ── Landing filters — bands · peer group · tell, all multi-select ────────────────────
  // ★ Held here and sent to the SERVER, never applied to `scanRows`. The scan is cursor-paged,
  //   so the client holds only the pages it has scrolled to; filtering those would filter a
  //   prefix of the ranking and hide matches on a page nobody fetched. The narrowing is part of
  //   the query key, so a change starts a fresh page-1 fetch and the frame's infinite-scroll
  //   sentinel then pages the NARROWED ranking the same way.
  //
  // ⚠ THE THIRD DIMENSION IS THE TELL, NOT A PATTERN. Ownership reads shareholding flow, not the
  //   findings engine, so it fires nothing the other two tools' `patterns` filter would match.
  //   It rides the SAME filter (one param, one facet list, one pager path) against its own
  //   field — only the word the reader sees changes. See ToolScanFilters.patterns.
  const [filters, setFilters] = useState<ScanFilters>(EMPTY_SCAN_FILTERS);
  const isFiltered = scanFilterCount(filters) > 0;

  // Landing scan — cursor-paged; the frame's sentinel asks for the next page.
  const scanQ = useStockScan<OwnershipScanItem>("ownership", !symbol, filters);
  const scanRows = useMemo(
    () => scanQ.data?.pages.flatMap((p) => p.items),
    [scanQ.data],
  );
  // Filter OPTIONS come off the scan itself (only values that return cards), with counts
  // cross-filtered against the other dropdowns' selections.
  const facetsQ = useStockScanFacets("ownership", !symbol, filters);
  const healthQ = useStockHealth(symbol ?? "", quarters);
  const ownQ = useStockOwnership(symbol ?? "", quarters);

  const health = healthQ.data;
  const ownView = ownQ.data ?? null;
  // The ownership ledger is RAW data — it renders whenever its rows exist, independent of
  // scoring. Only the score-derived layer (ownership grade chip, floor-check, score verdict)
  // gates on a scored period.
  const hasScoredPeriod = ownView?.hasScoredPeriod ?? false;

  // the Foundation floor (current period) — the only thing the floor-check needs.
  const foundation = useMemo(() => {
    const f = health?.pillars?.find((p) => p.pillar === "foundation");
    return f && f.state === "scored" ? f.subtotal : null;
  }, [health]);

  const holdingPoints = useMemo(
    () => (ownView ? buildHoldingPoints(ownView.series) : []),
    [ownView],
  );
  const deltas = useMemo(() => windowDeltas(holdingPoints), [holdingPoints]);
  const pledge = useMemo(() => pledgeStateOf(ownView?.current ?? null), [ownView]);
  const fc = useMemo(() => floorCheck(foundation, deltas.inst), [foundation, deltas.inst]);

  const isLoading = healthQ.isLoading || ownQ.isLoading;
  const isError = healthQ.isError || ownQ.isError;
  const loaded = !isLoading && !isError;

  // Ledger-data presence is INDEPENDENT of scoring. The tool blanks ONLY when there is no
  // ownership data of any kind (no holding split, pledging, insider or block). An
  // unscored-but-has-data stock renders its ledger; the score-derived layer quiet-empties.
  const hasLedgerData = Boolean(
    ownView &&
      (holdingPoints.length > 0 ||
        ownView.pledging.length > 0 ||
        ownView.events.insider.length > 0 ||
        ownView.events.block.length > 0),
  );
  const notScored =
    loaded && symbol && !hasLedgerData
      ? {
          title: `No ownership data for ${ownView?.name ?? symbol}`,
          reason:
            "No shareholding pattern, pledging, insider or bulk/block-deal records are on file for this stock yet — they'll appear here as the disclosure feeds report them.",
        }
      : null;

  const single: SingleViewSlots | null = symbol
    ? {
        isLoading,
        isError,
        onRetry: () => {
          void healthQ.refetch();
          void ownQ.refetch();
        },
        notScored,
        // ★ `=== 1`, NOT `<= 1` — AND THAT IS THE BUG FIX. `hasLedgerData` (above) declares this
        //   stock worth rendering when it has ANY of holding-split / pledging / insider / block
        //   rows. A stock with pledging or deal records but NO holding series has zero
        //   holdingPoints, so `<= 1` raised building-history — and the frame's building-history
        //   branch replaces the WHOLE grid, `renderSummary` included, which is where
        //   OwnershipSummary renders the very ledger `hasLedgerData` just confirmed exists. The
        //   tool proved it had data and then hid it behind "only one quarter so far".
        //   Zero holding points now falls through to the grid: the chart and readout return null
        //   (they already guard on length) and the ledger renders. Exactly one point is the real
        //   building-history case — a series that has started and cannot be drawn yet.
        // The copy is the TOOL's: these are shareholding FILINGS, not scored quarters. The frame
        // used to assert "scored" here on every tool's behalf, which was untrue of this one.
        buildingHistory:
          loaded && !notScored && holdingPoints.length === 1
            ? {
                title: "Only one filed quarter so far",
                body: `A holding journey needs at least two filings to draw. As ${symbol} files further shareholding patterns, the split will fill in here.`,
              }
            : null,
        identity: {
          name: ownView?.name ?? health?.identity?.name ?? symbol,
          ticker: symbol,
          sub: health?.identity
            ? `${symbol} · ${health.identity.sector?.displayName ?? health.identity.industryPath}`
            : symbol,
        },
        chips: ownView ? buildOwnershipChips(ownView.current, deltas, pledge, hasScoredPeriod) : [],
        promotedRead: ownView ? buildOwnershipRead(ownView.current, deltas, pledge, fc, hasScoredPeriod) : null,
        funnelBackHref: `/research/stock-screener/${symbol}?tab=health`,
        renderChart: (active, setActive) =>
          holdingPoints.length >= 2 ? (
            <OwnershipChart points={holdingPoints} active={active} onActiveChange={setActive} />
          ) : null,
        renderReadout: (active) =>
          holdingPoints.length ? (
            <OwnershipReadout points={holdingPoints} active={active} r1={pledge.r1} />
          ) : null,
        renderSummary: () =>
          ownView ? <OwnershipSummary view={ownView} floor={fc} symbol={symbol} /> : null,
      }
    : null;

  return (
    <ToolFrame
      meta={OWNERSHIP_META}
      symbol={symbol}
      window={window}
      onWindowChange={onWindowChange}
      onSelectSymbol={onSelectSymbol}
      // ★ ALWAYS `push` — must work when the reader arrived at `?symbol=` DIRECTLY (the health
      //   page's ownership link, a shared URL) with no landing entry behind them. `router.back()`
      //   would leave the tool; `replace` would make Back land on the landing again.
      onHome={() => router.push("/research/ownership")}
      stocks={stocksQ.data}
      stocksLoading={stocksQ.isLoading}
      landing={{
        items: scanRows,
        isLoading: scanQ.isLoading,
        isError: scanQ.isError,
        onRetry: () => void scanQ.refetch(),
        total: scanQ.data?.pages[0]?.total,
        hasMore: scanQ.hasNextPage,
        isFetchingMore: scanQ.isFetchingNextPage,
        fetchMore: () => void scanQ.fetchNextPage(),
        renderCard: (it, onSelect) => (
          <OwnershipScanCard item={it as OwnershipScanItem} onSelect={onSelect} />
        ),
        keyOf: (it) => (it as OwnershipScanItem).symbol,
        isFiltered,
        onClearFilters: () => setFilters(EMPTY_SCAN_FILTERS),
        filters: (
          <ScanFilterBar
            peerGroupOptions={facetsQ.data?.peerGroups ?? []}
            patternOptions={relabel(
              facetsQ.data?.patterns ?? [],
              (v) => TELL_META[v as OwnershipTell]?.label,
            )}
            patternLabel="Tell"
            bandOptions={relabel(facetsQ.data?.bands ?? [], (v) => BAND_META[v as LabelBand]?.label)}
            filters={filters}
            onChange={setFilters}
            loading={facetsQ.isLoading}
            matchCount={scanQ.data?.pages[0]?.total}
          />
        ),
      }}
      single={single}
    />
  );
}
