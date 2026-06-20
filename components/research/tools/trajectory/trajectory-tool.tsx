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
import { shortPeriod } from "@/components/stock-detail/health/shared";
import { useScoredStocks, useStockScan } from "@/lib/api/hooks/use-stocks";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import type { StockScanItem } from "@/types/research-tools";
import { ToolFrame } from "../tool-frame";
import type {
  SingleViewSlots,
  ToolMeta,
  ToolWindow,
} from "../tool-frame.types";
import { TrajectoryChart } from "./trajectory-chart";
import { TrajectoryReadout } from "./trajectory-readout";
import { TrajectorySummary } from "./trajectory-summary";
import { TrajectoryScanCard } from "./trajectory-card";
import {
  buildTrajectoryChips,
  buildTrajectoryRead,
  type ChartPoint,
} from "./trajectory-data";

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

const r1 = (x: number) => Math.round(x * 10) / 10;

export function TrajectoryTool() {
  const router = useRouter();
  const params = useSearchParams();
  const symbol = params.get("symbol")?.toUpperCase() || null;

  // window drives the health endpoint's ?window= (4/8/12 → 1Y/2Y/3Y). Local state;
  // reset to 3Y whenever the stock changes (adjust-state-on-prop-change pattern).
  const [window, setWindow] = useState<ToolWindow>(12);
  const [lastSymbol, setLastSymbol] = useState<string | null>(symbol);
  if (lastSymbol !== symbol) {
    setLastSymbol(symbol);
    setWindow(12);
  }

  const stocksQ = useScoredStocks();
  const scanQ = useStockScan("trajectory", !symbol);
  const healthQ = useStockHealth(symbol ?? "", window);

  const data = healthQ.data;
  const verdict = data?.verdict ?? null;
  const trajectory = data?.trajectory ?? null;

  const chartPoints: ChartPoint[] = useMemo(
    () =>
      (trajectory?.series ?? []).map((pt) => ({
        period: shortPeriod(pt.periodKey),
        composite: r1(pt.composite),
        foundation: r1(pt.foundation),
        momentum: r1(pt.momentum),
        market: r1(pt.market),
        ownership: r1(pt.ownership),
      })),
    [trajectory],
  );

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
        buildingHistory: !!trajectory && trajectory.series.length <= 1,
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
          trajectory ? (
            <TrajectoryChart
              points={chartPoints}
              crossings={trajectory.crossings}
              active={active}
              onActiveChange={setActive}
            />
          ) : null,
        renderReadout: (active) =>
          chartPoints.length ? <TrajectoryReadout points={chartPoints} active={active} /> : null,
        renderSummary: () => (trajectory ? <TrajectorySummary trajectory={trajectory} /> : null),
      }
    : null;

  return (
    <ToolFrame
      meta={TRAJECTORY_META}
      symbol={symbol}
      window={window}
      onWindowChange={setWindow}
      onSelectSymbol={(s) => router.push(`/research/trajectory?symbol=${s}`)}
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
