"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 * Trajectory — the orchestrator. TWO PRIMARY MODES: pattern, and full trajectory.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 *   PATTERN MODE — the page is about the SELECTED READING. Selection drives the chart series, its
 *     heading, the readout, the promoted banner, the card and its clauses, and the boundary.
 *     `?pattern=` makes it linkable; an unknown key falls back silently. What the chart draws is the
 *     pattern's own `pillarPair`:
 *       single-pillar (T5–T9)  → that pillar's line alone
 *       composite (T1–T4)      → the composite line alone
 *       a not-covered note     → whatever subjects it reports readings for
 *     ⚠ T1–T4's record carries `pillarPair: ["composite"]` precisely so a chart does not read a
 *       doubled pillar name off the key and draw two unrelated lines. The chart reads the record,
 *       never the key.
 *
 *   FULL TRAJECTORY — the pillar explorer this tool started as. All five lines, each individually
 *     togglable, no focus lock and no pattern framing.
 *
 * ── ★ WHY FULL TRAJECTORY IS A MODE AND NOT AN EMPTY STATE ───────────────────────────────────────
 * Pattern rendering REPLACED the general view rather than joining it, and that cost more than a
 * feature. With nothing selectable the tool rendered NO CHART AT ALL (SelectionChart returns null on a
 * null selection) — and with only a not-covered note selectable it rendered the DIVERGENCE spread
 * instrument, because selection-view.tsx dispatches on `pair` and NC1's pair is present. HDFCBANK hit
 * the second: four scored pillars, six quarters of history, and a trajectory page showing a
 * Foundation-vs-Market spread. The pillars had moved the whole time; nothing would draw them.
 *
 * So there is no path on which this tool declines to open. The mode DEFAULTS (below) put a reader on
 * the right view with no clicks, and the switch puts them on the other one with exactly one.
 *
 * ── ★ R1 STILL HOLDS: THIS TOOL DOES NOT RANK BY SIZE ────────────────────────────────────────────
 * The switcher shows no gap tier, because trajectory has none — the study found a bigger move is NOT
 * a stronger signal (a 15+pt Momentum gain read NEGATIVELY). Divergence is deliberately the opposite.
 * Do not harmonise the two.
 */

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/lib/icons";
import { useScoredStocks, useStockScan } from "@/lib/api/hooks/use-stocks";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import type { ToolScanItem } from "@/types/research-tools";
import { ToolFrame } from "../tool-frame";
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
  const [window, setWindow] = useState<ToolWindow>(DEFAULT_WINDOW);
  const [lastSymbol, setLastSymbol] = useState<string | null>(symbol);
  if (lastSymbol !== symbol) {
    setLastSymbol(symbol);
    setWindow(DEFAULT_WINDOW);
  }

  const stocksQ = useScoredStocks();
  const scanQ = useStockScan("trajectory", !symbol);
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

  // ── THE MODE ─────────────────────────────────────────────────────────────────────────────────
  // ★ THE DEFAULT IS "IS A TRAJECTORY PATTERN FIRING", not "is anything selectable".
  //
  // ⚠ A NOT-COVERED NOTE MUST NOT TRIP PATTERN MODE, and that distinction is the whole HDFCBANK fix.
  //   Notes ride in `selectables` on BOTH tools (see buildSelectables), so keying the default off
  //   `selectables.length` would open HDFCBANK — which fires no T pattern at all — into pattern mode
  //   on NC1, whose pair renders the divergence spread instrument. A note is the record of a decision
  //   NOT to make a claim; it is not a reading that earns the framing of the page. It stays one click
  //   away in the switcher, where a reader who wants it can find it.
  const requestedView = params.get("view");
  const defaultMode: TrajectoryMode = trajectoryFindings.length > 0 ? "pattern" : "full";
  // An explicit `?view=` wins — except a request for pattern mode on a stock with nothing to select,
  // which would render an empty page. Falling back is silent for the same reason an unknown
  // `?pattern=` is: a reader following an old link should land on the stock, not on a failure.
  const mode: TrajectoryMode =
    requestedView === "full" ? "full"
    : requestedView === "pattern" && selectables.length ? "pattern"
    : defaultMode;
  const onModeChange = useCallback(
    (m: TrajectoryMode) => {
      const next = new URLSearchParams(Array.from(params.entries()));
      next.set("view", m);
      router.replace(`/research/trajectory?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );
  const patternMode = mode === "pattern";

  // ★ NOTHING IS "SELECTED" IN FULL TRAJECTORY. Gating the selection here rather than at each of the
  //   six slots below means the mode cannot half-apply — there is no path where the chart unfocuses
  //   but the banner, the card or the boundary keep speaking for a reading the chart is not drawing.
  const selection = patternMode ? selected : null;
  const selectedPattern = selection?.kind === "pattern" ? selection.pattern : null;
  const selectedNote = selection?.kind === "not_covered" ? selection.note : null;
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
        // In full trajectory the banner is the stock's OWN trajectory read, unattached to any
        // selection — the honest "Stable — no material change." line when nothing is firing. It is a
        // summary of the page, not a frame on the chart, so it does not contradict five drawn lines.
        promotedRead: selectedNote
          ? notCoveredRead(selectedNote)
          : verdict && trajectory
            ? buildTrajectoryRead(patternMode ? readOrder : trajectoryFindings)
            : null,
        funnelBackHref: `/research/stock-screener/${symbol}?tab=health`,
        // ★ ALWAYS PRESENT — the mode switch is not conditional on the stock having a pattern. See
        //   TrajectoryModeSwitch for why the pattern button is disabled rather than hidden.
        renderModeSwitch: () => (
          <TrajectoryModeSwitch mode={mode} onChange={onModeChange} hasReadings={selectables.length > 0} />
        ),
        // ⚠ FULL TRAJECTORY GOES STRAIGHT TO TrajectoryChart, NOT THROUGH SelectionChart. That
        //   dispatcher exists to route a SELECTION to the right instrument, and with no selection it
        //   renders nothing at all. Passing no `focus` is what unlocks the legend (see the prop note).
        renderChart: (active, setActive) =>
          patternMode ? (
            <SelectionChart
              selection={selection}
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
            <SelectionReadout selection={selection} sliced={sliced} active={active} />
          ) : sliced?.points.length ? (
            <TrajectoryReadout points={sliced.points} isDaily={sliced.isDaily} active={active} />
          ) : null,
        renderSummary: () => (
          <>
            {/* The side panel, made clickable — every reading on this stock, the notes last.
                ⚠ PATTERN MODE ONLY: a switcher is a control over the selection, and full trajectory
                has none. Showing it there would offer a choice that changes nothing on screen. */}
            {patternMode && (
              <PatternSwitcher items={selectables} selectedId={selection?.id ?? null} onSelect={onSelect} />
            )}
            {/* ★ PATTERN MODE — THE SELECTED READING, COMPLETE, the others one click above in the
                switcher, and the boundary once beneath it.
                ★ FULL TRAJECTORY — the whole standing set at once, and NO boundary: that line is the
                interpretive limit of ONE reading, and printing it under a stack of them would attach
                one pattern's caveat to all of them. Everything else the panel carries (what closed,
                what was tested and not shipped, the other tool) is about the stock, not the
                selection, so it renders identically in both modes. */}
            <FindingCards
              findings={patternMode ? (selectedPattern ? [selectedPattern] : []) : trajectoryFindings}
              notCovered={
                patternMode
                  ? (selectedNote ? [selectedNote] : [])
                  : (data?.findings?.notCovered ?? [])
              }
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
        items: scanQ.data?.items,
        isLoading: scanQ.isLoading,
        isError: scanQ.isError,
        onRetry: () => void scanQ.refetch(),
        renderCard: (it, onSelectSym) => (
          <TrajectoryScanCard item={it as ToolScanItem} onSelect={onSelectSym} />
        ),
        keyOf: (it) => (it as ToolScanItem).symbol,
      }}
      single={single}
    />
  );
}
