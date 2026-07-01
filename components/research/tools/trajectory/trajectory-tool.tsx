"use client";

/**
 * Trajectory tool — the orchestrator. Reads dual-entry from the URL (`?symbol=`),
 * fetches the scored universe + the scan (cold) + the health snapshot (warm), and
 * fills the <ToolFrame> slots. All chrome / grid / scrub-state / switchers are the
 * frame's; this file only supplies trajectory's data + render slots.
 */

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/lib/icons";
import { useScoredStocks, useStockScan } from "@/lib/api/hooks/use-stocks";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import type { StockScanItem } from "@/types/research-tools";
import { ToolFrame } from "../tool-frame";
import {
  DEFAULT_WINDOW,
  windowQuarters,
  type SingleViewSlots,
  type ToolMeta,
  type ToolWindow,
} from "../tool-frame.types";
import { sliceWindow, dailyBoundsOf } from "../window-slice";
import { TrajectoryChart } from "./trajectory-chart";
import { TrajectoryReadout } from "./trajectory-readout";
import { TrajectorySummary } from "./trajectory-summary";
import { TrajectoryScanCard } from "./trajectory-card";
import { buildTrajectoryChips, buildTrajectoryRead } from "./trajectory-data";

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

  // The window carries the cadence (quarterly 1Y/2Y/3Y · daily 60/30/15D · custom).
  // Only the quarter count re-keys the fetch; daily/custom re-slice the same payload.
  // Reset to the default (3Y quarterly) whenever the stock changes.
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

  // The sliced window — quarterly series, daily series, or custom range (all client-side).
  const sliced = useMemo(
    () =>
      trajectory
        ? sliceWindow(window, trajectory.series, trajectory.dailySeries, trajectory.resultDays)
        : null,
    [trajectory, window],
  );
  const chartPoints = sliced?.points ?? [];
  const dailyBounds = dailyBoundsOf(trajectory?.dailySeries);

  const single: SingleViewSlots | null = symbol
    ? {
        isLoading: healthQ.isLoading,
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
        promotedRead: verdict && trajectory ? buildTrajectoryRead(verdict, trajectory) : null,
        funnelBackHref: `/research/stock-screener/${symbol}?tab=health`,
        renderChart: (active, setActive) =>
          trajectory && sliced ? (
            <TrajectoryChart
              points={chartPoints}
              crossings={trajectory.crossings}
              isDaily={sliced.isDaily}
              resultMarks={sliced.resultMarks}
              clampedEarlier={sliced.clampedEarlier}
              active={active}
              onActiveChange={setActive}
            />
          ) : null,
        renderReadout: (active) =>
          chartPoints.length ? (
            <TrajectoryReadout points={chartPoints} isDaily={sliced?.isDaily ?? false} active={active} />
          ) : null,
        renderSummary: () => (trajectory ? <TrajectorySummary trajectory={trajectory} /> : null),
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
        items: scanQ.data,
        isLoading: scanQ.isLoading,
        isError: scanQ.isError,
        onRetry: () => void scanQ.refetch(),
        renderCard: (it, onSelect) => (
          <TrajectoryScanCard item={it as StockScanItem} onSelect={onSelect} />
        ),
        keyOf: (it) => (it as StockScanItem).symbol,
      }}
      single={single}
    />
  );
}
