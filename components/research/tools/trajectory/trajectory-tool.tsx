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
  windowQuarters,
  type SingleViewSlots,
  type ToolMeta,
  type ToolWindow,
} from "../tool-frame.types";
import { sliceWindow, dailyBoundsOf } from "../window-slice";
import { WINDOW_PARAM, paramsForStockSwitch, parseWindow, writeWindowParam } from "../tool-url-state";
import { TrajectorySummary } from "./trajectory-summary";
import { FindingCards } from "../finding-cards";
import { PatternSwitcher } from "../pattern-switcher";
import { SelectionChart, SelectionReadout } from "../selection-view";
import { buildSelectables, notCoveredRead, resolveSelected } from "../selection";
import { doesntMean } from "@/lib/findings/descriptions";
import { TrajectoryScanCard } from "./trajectory-card";
import { buildTrajectoryChips, buildTrajectoryRead } from "./trajectory-data";
import { TrajectoryChart } from "./trajectory-chart";
import { TrajectoryReadout } from "./trajectory-readout";
import { TrajectoryModeSwitch, type TrajectoryMode } from "./trajectory-mode";
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
  //
  // ★ IT IS URL STATE (`?window=`), READ NOT HELD — the same contract as `?pattern=` and `?view=`,
  //   replacing a useState window plus a render-body reset block that existed only to clear it on
  //   stock switch. Held in state it reset on stock switch, tool switch AND back navigation, and
  //   could not be linked; read from the URL it survives all three.
  //   ⚠ Memoised on the RAW STRING, not on `params`: `sliced` below is a useMemo over `[trajectory,
  //     window]`, so a fresh object per render would re-slice the whole daily series every render.
  const windowParam = params.get(WINDOW_PARAM);
  const window = useMemo(() => parseWindow(windowParam), [windowParam]);

  const onWindowChange = useCallback(
    (w: ToolWindow) => {
      const next = new URLSearchParams(Array.from(params.entries()));
      writeWindowParam(next, w);
      // `replace` + no scroll — re-framing the chart in place, exactly like the pattern and mode
      // switches beside it. Not a destination, so it stacks no back step.
      router.replace(`/research/trajectory?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  // ★ STOCK SWITCHING — `replace` once a stock is open, `push` from the landing. Landing → stock is
  //   a real destination; stock → stock re-frames the same page and must not stack (five stocks used
  //   to leave five back steps before the landing).
  //   ⚠ THE `symbol` TEST IS LOAD-BEARING — replacing unconditionally would consume the LANDING's own
  //     entry on the first pick, leaving no way back to it.
  //   Which params survive is the one scope rule's call (see tool-url-state.ts), never a fresh
  //   `?symbol=` string — that is what used to drop `view` and `window` silently.
  const onSelectSymbol = useCallback(
    (s: string) => {
      const url = `/research/trajectory?${paramsForStockSwitch(params, s).toString()}`;
      if (symbol) router.replace(url);
      else router.push(url);
    },
    [params, router, symbol],
  );

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

  // ── ★ THE VIEW MODE — pattern, or full trajectory. See trajectory-mode.tsx's header. ──────────
  // ⚠ THE DEFAULT KEYS ON trajectoryFindings.length — REAL B/D PATTERNS ONLY — NEVER ON
  //   selectables.length. selectables also counts not-covered notes, and a stock whose only
  //   selectable thing is an NC note (HDFCBANK: NC3, nothing firing) is NOT a stock with something
  //   to focus a pattern chart on. Keying the default on selectables.length was the original
  //   defect: it opened pattern mode with a note selected, which rendered a chart about a
  //   configuration we declined to read, on a page that should open onto the pillar history
  //   every scored stock actually has.
  const requestedView = params.get("view");
  const defaultMode: TrajectoryMode = trajectoryFindings.length > 0 ? "pattern" : "full";
  const mode: TrajectoryMode =
    requestedView === "pattern" || requestedView === "full" ? requestedView : defaultMode;
  const patternMode = mode === "pattern";
  const onModeChange = useCallback(
    (m: TrajectoryMode) => {
      const next = new URLSearchParams(Array.from(params.entries()));
      next.set("view", m);
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
        // The copy is the TOOL's — this tool's points genuinely ARE scored quarters, which is
        // exactly the assumption the frame used to make on every tool's behalf.
        buildingHistory:
          !!trajectory && trajectory.series.length <= 1 && !dailyBounds
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
        chips: verdict ? buildTrajectoryChips(verdict) : [],
        promotedRead: selectedNote
          ? notCoveredRead(selectedNote)
          : verdict && trajectory
            ? buildTrajectoryRead(readOrder)
            : null,
        funnelBackHref: `/research/stock-screener/${symbol}?tab=health`,
        // ★ THE MODE SWITCH — always present, next to the window switcher (frame-owned slot; see
        //   SingleViewSlots.renderModeSwitch). `hasReadings` is selectables.length, not
        //   trajectoryFindings.length: an NC-only stock has nothing to FOCUS a pattern chart on by
        //   default, but pattern mode can still show that note if a reader deliberately opens it —
        //   see TrajectoryModeSwitch's own note on why that button is disabled, never hidden.
        renderModeSwitch: () => (
          <TrajectoryModeSwitch mode={mode} onChange={onModeChange} hasReadings={selectables.length > 0} />
        ),
        // ★ PATTERN MODE → the selection dispatcher (shared with Divergence). On trajectory this
        //   never reaches SelectionChart's spread branch — no trajectory-family pattern or note
        //   carries two real pillars — so it always resolves to TrajectoryChart with the
        //   selection's own subjects focused (the P9 lock).
        // ★ FULL TRAJECTORY → TrajectoryChart called directly, with NO `focus` — every pillar plus
        //   the composite, individually togglable, no lock. This is the path that used to be
        //   unreachable: SelectionChart returned null with nothing selected, or drew a divergence
        //   spread when the only selectable thing was NC1 (before NC1 was filtered off this tool).
        //   There is no longer a state on which this tool declines to open.
        renderChart: (active, setActive) =>
          patternMode ? (
            <SelectionChart
              selection={selected}
              sliced={sliced}
              crossings={trajectory?.crossings ?? []}
              active={active}
              onActiveChange={setActive}
            />
          ) : sliced ? (
            <TrajectoryChart
              points={sliced.points}
              crossings={trajectory?.crossings ?? []}
              isDaily={sliced.isDaily}
              resultMarks={sliced.resultMarks}
              clampedEarlier={sliced.clampedEarlier}
              active={active}
              onActiveChange={setActive}
            />
          ) : null,
        renderReadout: (active) =>
          patternMode ? (
            <SelectionReadout selection={selected} sliced={sliced} active={active} />
          ) : sliced ? (
            <TrajectoryReadout points={sliced.points} isDaily={sliced.isDaily} active={active} />
          ) : null,
        renderSummary: () => (
          <>
            {/* ★ PATTERN-MODE ONLY. Full trajectory has no focused selection to switch between —
                the chart already shows everything at once. */}
            {patternMode && (
              <PatternSwitcher items={selectables} selectedId={selected?.id ?? null} onSelect={onSelect} />
            )}
            {/* ★ PATTERN MODE — THE SELECTED READING, COMPLETE, the others one click above in the
                switcher, and the boundary once beneath it.
                ★ FULL TRAJECTORY — the whole standing set at once, and NO boundary: that line is the
                interpretive limit of ONE reading, and printing it under a stack of them would attach
                one pattern's caveat to all of them. */}
            <FindingCards
              findings={patternMode ? (selectedPattern ? [selectedPattern] : []) : trajectoryFindings}
              notCovered={
                patternMode
                  ? (selectedNote ? [selectedNote] : [])
                  : (data?.findings?.notCovered?.filter((n) => n.tool === "trajectory") ?? [])
              }
              quietNote={data?.findings?.quietNote ?? undefined}
              crossTool={data?.findings?.crossTool?.find((c) => c.tool === "divergence") ?? undefined}
              ended={data?.findings?.recentlyEnded ?? undefined}
              regime={data?.regime ?? null}
              symbol={symbol}
              boundary={patternMode && selectedPattern ? doesntMean(selectedPattern.patternKey) : null}
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
      onWindowChange={onWindowChange}
      onSelectSymbol={onSelectSymbol}
      // ★ ALWAYS `push` — the rule, not an oversight. This button must work when the reader arrived
      //   at `?symbol=` DIRECTLY (health-page link, shared URL) with no landing entry behind them:
      //   `router.back()` would leave the tool entirely, and `replace` would swap the current entry
      //   for the landing so Back lands on the landing again — a button that appears to do nothing.
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
