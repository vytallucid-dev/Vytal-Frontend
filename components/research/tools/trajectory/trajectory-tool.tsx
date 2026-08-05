"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 * Trajectory — the orchestrator. THE PAGE IS ABOUT THE SELECTED READING. Same treatment as Divergence.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * Selection drives the chart series, its heading, the readout, the promoted banner, the card and its
 * clauses, and the boundary. `?pattern=` makes it linkable; an unknown key falls back silently.
 *
 * ── ★ WHAT THE CHART DRAWS IS THE PATTERN'S OWN `pillarPair` ─────────────────────────────────────
 *   single-pillar (T5–T9)  → that pillar's line alone
 *   composite (T1–T4)      → the composite line alone
 *   a not-covered note     → whatever subjects it reports readings for
 * The survey view (all five lines, pillars togglable) is what renders when there is nothing to select.
 *
 * ⚠ T1–T4's record carries `pillarPair: ["composite"]` precisely so a chart does not read a doubled
 *   pillar name off the key and draw two unrelated lines. That is why the chart reads the record and
 *   never the key.
 *
 * ── ★ R1 STILL HOLDS: THIS TOOL DOES NOT RANK BY SIZE ────────────────────────────────────────────
 * The switcher shows no gap tier, because trajectory has none — the study found a bigger move is NOT
 * a stronger signal (a 15+pt Momentum gain read NEGATIVELY). Divergence is deliberately the opposite.
 * Do not harmonise the two.
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
  DEFAULT_WINDOW,
  windowQuarters,
  type SingleViewSlots,
  type ToolMeta,
  type ToolWindow,
} from "../tool-frame.types";
import { sliceWindow, dailyBoundsOf } from "../window-slice";
import { TrajectorySummary } from "./trajectory-summary";
import { FindingCards } from "../finding-cards";
import { PatternSwitcher } from "../pattern-switcher";
import { SelectionChart, SelectionReadout } from "../selection-view";
import { buildSelectables, notCoveredRead, resolveSelected } from "../selection";
import { doesntMean } from "@/lib/findings/descriptions";
import { TrajectoryScanCard } from "./trajectory-card";
import { buildTrajectoryChips, buildTrajectoryRead } from "./trajectory-data";
import { findingsForTool } from "@/lib/findings/tool-findings";

const TRAJECTORY_META: ToolMeta = {
  id: "trajectory",
  name: "Trajectory",
  Icon: Icons.chartLine,
  accentVar: "var(--p-found)",
  landingTitle: "Read a stock's whole story",
  landingSubtitle: "Pick a journey to study, or search any name in the scored universe.",
  landingEyebrow: "Top trajectory picks",
  scopeTag: "from your scored universe",
  searchPlaceholder: "Search a stock — e.g. TATASTEEL, Sun Pharma…",
};

export function TrajectoryTool() {
  const router = useRouter();
  const params = useSearchParams();
  const symbol = params.get("symbol")?.toUpperCase() || null;
  const requestedPattern = params.get("pattern");

  // The window carries the cadence (quarterly 1Y/2Y/3Y · daily 60/30/15D · custom).
  // Only the quarter count re-keys the fetch; daily/custom re-slice the same payload.
  const [window, setWindow] = useState<ToolWindow>(DEFAULT_WINDOW);
  const [lastSymbol, setLastSymbol] = useState<string | null>(symbol);
  if (lastSymbol !== symbol) {
    setLastSymbol(symbol);
    setWindow(DEFAULT_WINDOW);
  }

  const stocksQ = useScoredStocks();

  // ── Landing filters — peer group · pattern, both multi-select ─────────────────────────
  // ★ Held here and sent to the SERVER, never applied to `scanRows`. The scan is cursor-paged,
  //   so the client holds only the pages it has scrolled to; filtering those would filter a
  //   prefix of the ranking and hide matches that live on a page nobody fetched. The narrowing
  //   is part of the query key, so a change starts a fresh page-1 fetch and the frame's
  //   infinite-scroll sentinel then pages the NARROWED ranking the same way.
  const [filters, setFilters] = useState<ScanFilters>(EMPTY_SCAN_FILTERS);
  const isFiltered = scanFilterCount(filters) > 0;

  // Landing scan — cursor-paged; the frame's sentinel asks for the next page.
  const scanQ = useStockScan("trajectory", !symbol, filters);
  const scanRows = useMemo(() => scanQ.data?.pages.flatMap((p) => p.items), [scanQ.data]);
  // Filter OPTIONS come off the scan itself (only values that return cards), with counts
  // cross-filtered against the other dropdown's selection.
  const facetsQ = useStockScanFacets("trajectory", !symbol, filters);
  const healthQ = useStockHealth(symbol ?? "", windowQuarters(window));

  const data = healthQ.data;
  const verdict = data?.verdict ?? null;
  const trajectory = data?.trajectory ?? null;

  // ★ THE READ COMES FROM THE FIRED T-FAMILY FINDINGS — partitioned by FAMILY, so a divergence
  //   (C-family) finding cannot appear on this tool. Both specs state that boundary explicitly.
  const trajectoryFindings = useMemo(
    () => findingsForTool(data?.findings?.patterns, "trajectory"),
    [data],
  );
  const selectables = useMemo(
    () => buildSelectables(data?.findings?.patterns, data?.findings?.notCovered, "trajectory"),
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
      // `replace`, not `push`: switching readings on one stock re-frames the same page rather than
      // being a new destination, and should not stack back-button steps on the way out.
      router.replace(`/research/trajectory?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const selectedPattern = selected?.kind === "pattern" ? selected.pattern : null;
  const selectedNote = selected?.kind === "not_covered" ? selected.note : null;
  // The selected reading first, the rest behind it — so the banner's "+N more" stays true while its
  // title and body describe what is actually on screen.
  const readOrder = useMemo(
    () =>
      selectedPattern
        ? [selectedPattern, ...trajectoryFindings.filter((p) => p.patternKey !== selectedPattern.patternKey)]
        : [],
    [selectedPattern, trajectoryFindings],
  );

  // The sliced window — quarterly series, daily series, or custom range (all client-side).
  const sliced = useMemo(
    () =>
      trajectory
        ? sliceWindow(window, trajectory.series, trajectory.dailySeries, trajectory.resultDays)
        : null,
    [trajectory, window],
  );
  const dailyBounds = dailyBoundsOf(trajectory?.dailySeries);

  const single: SingleViewSlots | null = symbol
    ? {
        isLoading: healthQ.isLoading,
        regime: data?.regime ?? null,
        isError: healthQ.isError,
        onRetry: () => void healthQ.refetch(),
        notScored:
          data && (!data.scored || !verdict || !trajectory)
            ? {
                reason:
                  data.identity?.coverageReason ??
                  `Coverage state: ${data.identity?.coverageState ?? "not yet scored"}`,
              }
            : null,
        // building-history only when there's neither a multi-point quarterly series
        // NOR usable daily history (a daily-only stock can still draw a short window).
        buildingHistory: !!trajectory && trajectory.series.length <= 1 && !dailyBounds,
        dailyBounds,
        identity: {
          name: data?.identity?.name ?? symbol,
          ticker: symbol,
          sub: data?.identity
            ? `${symbol} · ${data.identity.sector?.displayName ?? data.identity.industryPath}`
            : symbol,
        },
        chips: verdict ? buildTrajectoryChips(verdict) : [],
        promotedRead: selectedNote
          ? notCoveredRead(selectedNote)
          : verdict && trajectory
            ? buildTrajectoryRead(readOrder)
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
            {/* ★ THE SELECTED READING, COMPLETE — the others sit one click above, each of them
                equally complete when selected. The boundary renders once, under the card. */}
            <FindingCards
              findings={selectedPattern ? [selectedPattern] : []}
              notCovered={selectedNote ? [selectedNote] : []}
              quietNote={data?.findings?.quietNote ?? undefined}
              crossTool={data?.findings?.crossTool?.find((c) => c.tool === "divergence") ?? undefined}
              ended={data?.findings?.recentlyEnded ?? undefined}
              regime={data?.regime ?? null}
              symbol={symbol}
              boundary={selectedPattern ? doesntMean(selectedPattern.patternKey) : null}
            />
            {trajectory ? <TrajectorySummary trajectory={trajectory} /> : null}
          </>
        ),
      }
    : null;

  return (
    <ToolFrame
      meta={TRAJECTORY_META}
      symbol={symbol}
      window={window}
      onWindowChange={setWindow}
      onSelectSymbol={(s) => router.push(`/research/trajectory?symbol=${encodeURIComponent(s)}`)}
      onHome={() => router.push("/research/trajectory")}
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
        renderCard: (it, onSelectSym) => (
          <TrajectoryScanCard item={it as ToolScanItem} onSelect={onSelectSym} />
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
