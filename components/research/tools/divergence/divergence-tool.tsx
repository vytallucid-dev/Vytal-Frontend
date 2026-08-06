"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 * Divergence & Convergence — the orchestrator. THE PAGE IS ABOUT THE SELECTED READING.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ── ★ WHAT CHANGED: ONE CHART, THREE READINGS ────────────────────────────────────────────────────
 * GLENMARK fires D2 (Market 69 vs Momentum 26), D1 (Market 69 vs Foundation 35) and D5 (Foundation 35
 * vs Momentum 26). This tool charted the lead one and listed the other two in a panel you could not
 * click — it named readings it then refused to show.
 *
 * Selection now drives EVERY slot: chart series, chart heading, readout, chips, the promoted banner,
 * the card and its clauses, and the boundary. Switching from D2 to D5 does not filter a static view —
 * it re-frames the page onto a different pair of pillars with a different gap and a different
 * sentence. Three patterns means three independently complete analyses, not one merged one.
 *
 * ⚠ THE SELECTION IS URL STATE (`?pattern=`), so a specific reading is linkable and survives refresh.
 *   An unknown or no-longer-firing key falls back to the default silently — see resolveSelected.
 *
 * ── ★ NOT-COVERED NOTES ARE SELECTABLE HERE TOO, WITH FULL CHART PARITY ──────────────────────────
 * A note carries the same `pair` and `lifecycle` shapes a finding does, so the chart and readout draw
 * it through the identical path (selection-view.tsx branches on `pair`, never on `kind`). Only the
 * words and the weight differ — and the banner's tone is pinned neutral, because a note is the record
 * of a decision NOT to make a claim and must never wear a severity accent.
 */

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/lib/icons";
import { useScoredStocks, useStockScan, useStockScanFacets } from "@/lib/api/hooks/use-stocks";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import {
  EMPTY_SCAN_FILTERS,
  scanFilterCount,
  type ScanFilters,
  type ToolScanItem,
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
import { sliceWindow, dailyBoundsOf } from "../window-slice";
import { WINDOW_PARAM, paramsForStockSwitch, parseWindow, writeWindowParam } from "../tool-url-state";
import { DivergenceSummary } from "./divergence-summary";
import { FindingCards } from "../finding-cards";
import { PatternSwitcher } from "../pattern-switcher";
import { SelectionChart, SelectionReadout } from "../selection-view";
import { buildSelectables, notCoveredRead, pairOf, resolveSelected } from "../selection";
import { doesntMean } from "@/lib/findings/descriptions";
import { DivergenceScanCard } from "./divergence-card";
import { buildSpread, buildDivergenceRead, buildDivergenceChips, buildHeadlineRead } from "./divergence-data";
import { findingsForTool } from "@/lib/findings/tool-findings";

const DIVERGENCE_META: ToolMeta = {
  id: "divergence",
  name: "Divergence & Convergence",
  Icon: Icons.scales,
  accentVar: "var(--p-mkt)",
  landingTitle: "Where the pillars disagree",
  landingSubtitle:
    "The gap between price, fundamentals and ownership — and which way it's resolving. Pick a tension to study, or search any name.",
  landingEyebrow: "Widest tensions in your scope",
  scopeTag: "ranked by gap",
  searchPlaceholder: "Search a stock — e.g. SIEMENS, Larsen & Toubro…",
};

export function DivergenceTool() {
  const router = useRouter();
  const params = useSearchParams();
  const symbol = params.get("symbol")?.toUpperCase() || null;
  const requestedPattern = params.get("pattern");

  // ★ THE WINDOW IS URL STATE (`?window=`), READ NOT HELD — the same contract as `?pattern=`.
  //   It replaces a useState window plus a render-body reset block that existed only to clear that
  //   state on stock switch. Held in state it reset on stock switch, tool switch AND back
  //   navigation, and could not be linked at all; read from the URL it survives all three and the
  //   first health fetch is keyed to the right quarter count instead of always fetching 12 first.
  //   ⚠ Memoised on the RAW STRING, not on `params`: `sliced` below is a useMemo over `[trajectory,
  //     window]`, so a fresh object per render would re-slice the whole daily series every render.
  const windowParam = params.get(WINDOW_PARAM);
  const window = useMemo(() => parseWindow(windowParam), [windowParam]);

  const onWindowChange = useCallback(
    (w: ToolWindow) => {
      const next = new URLSearchParams(Array.from(params.entries()));
      writeWindowParam(next, w);
      // `replace` + no scroll: changing timeframe re-frames the chart in place, exactly like
      // switching pattern. It is not a destination and must not stack a back step.
      router.replace(`/research/divergence?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  // ★ STOCK SWITCHING — `replace` once a stock is already open, `push` from the landing.
  //   Landing → a stock is a real destination and keeps its back step. Stock → stock is re-framing
  //   the same page (the reasoning already written on the pattern switch, one level up), so it must
  //   not stack: five stocks used to leave five back steps between the reader and the landing.
  //   ⚠ THE `symbol` TEST IS LOAD-BEARING. Replacing unconditionally would consume the LANDING's own
  //     history entry on the first selection, leaving no way back to it at all.
  //   Params are decided by the one scope rule — never by a fresh `?symbol=` string, which is what
  //   silently dropped every sibling param before.
  const onSelectSymbol = useCallback(
    (s: string) => {
      const url = `/research/divergence?${paramsForStockSwitch(params, s).toString()}`;
      if (symbol) router.replace(url);
      else router.push(url);
    },
    [params, router, symbol],
  );

  const stocksQ = useScoredStocks();

  // ── Landing filters — condition band · peer group · pattern, all multi-select ─────────
  // ★ Held here and sent to the SERVER, never applied to `scanRows`. The scan is cursor-paged,
  //   so the client holds only the pages it has scrolled to; filtering those would filter a
  //   prefix of the ranking and hide matches on a page nobody fetched. The narrowing is part of
  //   the query key, so a change starts a fresh page-1 fetch and the frame's infinite-scroll
  //   sentinel then pages the NARROWED ranking the same way.
  const [filters, setFilters] = useState<ScanFilters>(EMPTY_SCAN_FILTERS);
  const isFiltered = scanFilterCount(filters) > 0;

  // Landing scan — cursor-paged; the frame's sentinel asks for the next page.
  const scanQ = useStockScan<ToolScanItem>("divergence", !symbol, filters);
  const scanRows = useMemo(() => scanQ.data?.pages.flatMap((p) => p.items), [scanQ.data]);
  // Filter OPTIONS come off the scan itself (only values that return cards), with counts
  // cross-filtered against the other dropdowns' selections.
  const facetsQ = useStockScanFacets("divergence", !symbol, filters);
  const healthQ = useStockHealth(symbol ?? "", windowQuarters(window));

  const data = healthQ.data;
  const verdict = data?.verdict ?? null;
  const trajectory = data?.trajectory ?? null;

  const sliced = useMemo(
    () =>
      trajectory
        ? sliceWindow(window, trajectory.series, trajectory.dailySeries, trajectory.resultDays)
        : null,
    [trajectory, window],
  );
  const dailyBounds = dailyBoundsOf(trajectory?.dailySeries);

  // ── THE SELECTION ────────────────────────────────────────────────────────────────────────────
  // Patterns in findingsForTool's order (state → tier → severity → key — the SAME order the cards
  // already used, so the default selection is the card that already led), then the not-covered notes
  // in registry order, always last.
  const divergenceFindings = useMemo(
    () => findingsForTool(data?.findings?.patterns, "divergence"),
    [data],
  );
  const selectables = useMemo(
    () => buildSelectables(data?.findings?.patterns, data?.findings?.notCovered, "divergence"),
    [data],
  );
  const selected = useMemo(
    () => resolveSelected(selectables, requestedPattern),
    [selectables, requestedPattern],
  );
  const onSelect = useCallback(
    (id: string) => {
      const next = new URLSearchParams(Array.from(params.entries()));
      next.set("pattern", id);
      // `replace`, not `push`: switching readings on one stock is re-framing the same page, not a new
      // destination — it should not stack ten back-button steps on the way out of the tool.
      router.replace(`/research/divergence?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const selectedPattern = selected?.kind === "pattern" ? selected.pattern : null;
  const selectedNote = selected?.kind === "not_covered" ? selected.note : null;
  const selectedPair = selected ? pairOf(selected) : null;

  // The selected reading first, the rest behind it — so the banner's "+N more" count stays true while
  // its title, body and tier badge describe what is actually on screen.
  const readOrder = useMemo(
    () =>
      selectedPattern
        ? [selectedPattern, ...divergenceFindings.filter((p) => p.patternKey !== selectedPattern.patternKey)]
        : [],
    [selectedPattern, divergenceFindings],
  );

  // The spread for the SUMMARY panel — the selected pair only. Null-pair selections (a composite or
  // single-subject note) have no spread to narrate, and the panel simply does not render.
  const summarySpread = useMemo(
    () => (sliced && selectedPair ? buildSpread(sliced.points, selectedPair.high, selectedPair.low) : []),
    [sliced, selectedPair],
  );

  // ★ THE EMPTY-STATE BUG. `spread === null` is the coverage fact — fewer than two scored pillars.
  //   It is NOT "nothing is firing": HDFCBANK is scored on four pillars with a 41-point spread and
  //   used to read "isn't scored yet". Three states, and only the first is a not-scored screen:
  //     1 genuinely unscored                                   — spread is null
  //     2 scored, nothing firing, nothing to note              — the honest headline
  //     3 scored, nothing firing, a not-covered note present   — the note, selectable like any read
  const noSpread = !!data && !!verdict && verdict.divergence.spread === null;

  // ★ GENUINELY EMPTY — state 2 above, and ONLY state 2. Scored, a readable spread, and nothing on it:
  //   no Formed pattern, no Building one, and no not-covered note either (`selectables` is exactly
  //   that union). ⚠ NOT the same as `noSpread`, which is a COVERAGE fact and already renders its own
  //   panel — conflating the two would offer "go read the trajectory" to a stock whose pillars are the
  //   very thing that isn't scored. See FindingCards.pointWhenEmpty.
  const nothingFiring = !!data && !!verdict && !noSpread && selectables.length === 0;

  const single: SingleViewSlots | null = symbol
    ? {
        isLoading: healthQ.isLoading,
        regime: data?.regime ?? null,
        isError: healthQ.isError,
        onRetry: () => void healthQ.refetch(),
        notScored:
          data && (!data.scored || !verdict || !trajectory || noSpread)
            ? {
                reason: noSpread
                  ? "Fewer than two scored pillars — there's no spread to read yet."
                  : (data.identity?.coverageReason ??
                    `Coverage state: ${data.identity?.coverageState ?? "not yet scored"}`),
              }
            : null,
        // ⚠ BUILDING-HISTORY NOW ASKS THE HISTORY QUESTION, not the pair question. It used to key on
        //   whether a quarterly SPREAD could be built, which is a fact about the selected pair — so a
        //   scored stock with a full series but no firing pattern could read "building history".
        // The copy is the TOOL's, not the frame's — only this tool knows that its points are scored
        // quarters (Ownership's are shareholding filings, and the frame used to say "scored" for
        // both). `!noSpread` is redundant — noSpread already forces notScored, which early-returns
        // ahead of this — but it is kept as a local guard rather than a dependency on gate order.
        buildingHistory:
          !!trajectory && !noSpread && trajectory.series.length <= 1 && !dailyBounds
            ? {
                title: "Only one scored quarter so far",
                body: `A journey needs at least two in-force snapshots. As ${symbol} accrues more scored quarters, the recording will fill in here.`,
              }
            : null,
        dailyBounds,
        identity: {
          name: data?.identity?.name ?? symbol,
          ticker: symbol,
          sub: data?.identity
            ? `${symbol} · ${data.identity.sector?.displayName ?? data.identity.industryPath}`
            : symbol,
        },
        chips: verdict ? buildDivergenceChips(verdict, selectedPair?.gap ?? null, readOrder) : [],
        promotedRead: selectedNote
          ? notCoveredRead(selectedNote)
          : verdict && trajectory
            ? readOrder.length
              ? buildDivergenceRead(readOrder, verdict.divergence)
              : buildHeadlineRead(verdict.divergence)
            : null,
        funnelBackHref: `/research/stock-screener/${symbol}?tab=health`,
        renderChart: (active, setActive) => (
          <SelectionChart
            selection={selected}
            sliced={sliced}
            crossings={trajectory?.crossings ?? []}
            active={active}
            onActiveChange={setActive}
          />
        ),
        renderReadout: (active) => (
          <SelectionReadout selection={selected} sliced={sliced} active={active} />
        ),
        renderSummary: () => (
          <>
            {/* The side panel, made clickable — every reading on this stock, the notes last. */}
            <PatternSwitcher items={selectables} selectedId={selected?.id ?? null} onSelect={onSelect} />
            {/* ★ THE SELECTED READING, COMPLETE — every clause the backend composed, in its order.
                Not a truncated card with a "see more": the other readings are one click away in the
                switcher above, each of them equally complete when selected. */}
            <FindingCards
              findings={selectedPattern ? [selectedPattern] : []}
              notCovered={selectedNote ? [selectedNote] : []}
              quietNote={data?.findings?.quietNote ?? undefined}
              crossTool={data?.findings?.crossTool?.find((c) => c.tool === "trajectory") ?? undefined}
              ended={data?.findings?.recentlyEnded ?? undefined}
              regime={data?.regime ?? null}
              symbol={symbol}
              boundary={selectedPattern ? doesntMean(selectedPattern.patternKey) : null}
              // ★ A DEAD END GETS A DOOR. Nothing firing here → say so plainly and point at
              //   Trajectory, which always has the stock's pillar history. See `nothingFiring`.
              pointWhenEmpty={nothingFiring}
            />
            {selectedPair && summarySpread.length >= 2 ? (
              <DivergenceSummary
                spread={summarySpread}
                highPillar={selectedPair.high}
                lowPillar={selectedPair.low}
                findings={readOrder}
              />
            ) : null}
          </>
        ),
      }
    : null;

  return (
    <ToolFrame
      meta={DIVERGENCE_META}
      symbol={symbol}
      window={window}
      onWindowChange={onWindowChange}
      onSelectSymbol={onSelectSymbol}
      // ★ ALWAYS `push`, and that is the rule rather than an oversight. The landing is a genuinely
      //   different view from a stock page, so it earns a back step — but more importantly this
      //   button must work when the reader arrived at `?symbol=` DIRECTLY (a health-page link, a
      //   shared URL) with no landing entry behind them. `router.back()` would leave the tool
      //   entirely there, and `replace` would swap the current entry for the landing so Back
      //   returns to the landing again — a button that appears to do nothing, which is the exact
      //   complaint this work started from. `push` is the only option with no dead path.
      onHome={() => router.push("/research/divergence")}
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
        renderCard: (it, onSelect2) => (
          <DivergenceScanCard item={it as ToolScanItem} onSelect={onSelect2} />
        ),
        keyOf: (it) => (it as ToolScanItem).symbol,
        isFiltered,
        onClearFilters: () => setFilters(EMPTY_SCAN_FILTERS),
        filters: (
          <ScanFilterBar
            peerGroupOptions={facetsQ.data?.peerGroups ?? []}
            patternOptions={facetsQ.data?.patterns ?? []}
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
