"use client";

/**
 * Divergence & Convergence tool — the orchestrator. Fills the SAME five <ToolFrame>
 * slots Trajectory does (meta, renderChart, renderReadout, renderSummary,
 * promotedRead, landing). Zero frame edits. The spread series is pure arithmetic
 * over the health endpoint's trajectory block (no new DB read); the landing uses the
 * new `?tool=divergence` scan.
 */

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/lib/icons";
import { useScoredStocks, useStockScan } from "@/lib/api/hooks/use-stocks";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import type { DivergenceScanItem, DivergenceConfig } from "@/types/research-tools";
import { ToolFrame } from "../tool-frame";
import {
  DEFAULT_WINDOW,
  windowQuarters,
  type SingleViewSlots,
  type ToolMeta,
  type ToolWindow,
} from "../tool-frame.types";
import { sliceWindow, dailyBoundsOf } from "../window-slice";
import { DivergenceChart, DivergenceEmpty } from "./divergence-chart";
import { DivergenceReadout } from "./divergence-readout";
import { DivergenceSummary } from "./divergence-summary";
import { DivergenceScanCard } from "./divergence-card";
import {
  pickScoredPair,
  buildSpread,
  divergenceConfig,
  divergenceFlag,
  directionOf,
  buildDivergenceRead,
  buildDivergenceChips,
} from "./divergence-data";

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

  const [window, setWindow] = useState<ToolWindow>(DEFAULT_WINDOW);
  const [lastSymbol, setLastSymbol] = useState<string | null>(symbol);
  if (lastSymbol !== symbol) {
    setLastSymbol(symbol);
    setWindow(DEFAULT_WINDOW);
  }

  const stocksQ = useScoredStocks();
  const scanQ = useStockScan<DivergenceScanItem>("divergence", !symbol);
  const healthQ = useStockHealth(symbol ?? "", windowQuarters(window));

  const data = healthQ.data;
  const verdict = data?.verdict ?? null;
  const trajectory = data?.trajectory ?? null;
  const pillars = useMemo(() => data?.pillars ?? [], [data]);

  // The window sliced to the selected cadence (quarterly / daily / custom) — the daily
  // block is already on the payload, so a short window is a pure client-side re-slice.
  const sliced = useMemo(
    () =>
      trajectory
        ? sliceWindow(window, trajectory.series, trajectory.dailySeries, trajectory.resultDays)
        : null,
    [trajectory, window],
  );
  const dailyBounds = dailyBoundsOf(trajectory?.dailySeries);

  // The spread is the SAME pillar-spread arithmetic — now over the sliced window's points,
  // so on a daily window the gap moves day by day. No new read; no lens primitive.
  const pair = useMemo(() => (pillars.length ? pickScoredPair(pillars) : null), [pillars]);
  const spread = useMemo(
    () => (sliced && pair ? buildSpread(sliced.points, pair.high, pair.low) : []),
    [sliced, pair],
  );
  // The full-quarterly spread — a window-INDEPENDENT basis. Gates building-history and
  // backs the promoted read / chips when the current window is too thin to read (so an
  // empty custom range never fabricates an "aligned" read from zero points).
  const quarterlySpread = useMemo(
    () =>
      trajectory && pair
        ? buildSpread(
            trajectory.series.map((pt) => ({
              x: "", asOfDate: null, periodKey: null,
              composite: pt.composite, foundation: pt.foundation, momentum: pt.momentum,
              market: pt.market, ownership: pt.ownership,
            })),
            pair.high,
            pair.low,
          )
        : [],
    [trajectory, pair],
  );
  const hasQuarterlySpread = quarterlySpread.length >= 2;

  // Read basis: the current window when it has ≥2 points (so the read describes what's on
  // screen), else the full quarterly spread (stable + honest on an empty/thin window).
  const readSpread = spread.length >= 2 ? spread : quarterlySpread;
  const gap = readSpread.length ? readSpread[readSpread.length - 1].gap : 0;
  const flag = divergenceFlag(gap);
  const baseConfig: DivergenceConfig = pair ? divergenceConfig(pair.high, pair.low) : "none";
  // Honest "no notable divergence" → an aligned read, never a manufactured tension.
  const readConfig: DivergenceConfig = flag === "none" ? "none" : baseConfig;
  const direction =
    readSpread.length >= 2
      ? directionOf(readSpread[0].gap, readSpread[readSpread.length - 1].gap)
      : "steady";

  const noPair = !!data && !!trajectory && pair === null;

  const single: SingleViewSlots | null = symbol
    ? {
        isLoading: healthQ.isLoading,
        isError: healthQ.isError,
        onRetry: () => void healthQ.refetch(),
        notScored:
          data && (!data.scored || !verdict || !trajectory || noPair)
            ? {
                reason: noPair
                  ? "Fewer than two scored pillars — there's no spread to read yet."
                  : (data.identity?.coverageReason ??
                    `Coverage state: ${data.identity?.coverageState ?? "not yet scored"}`),
              }
            : null,
        // Window-independent building-history: no readable quarterly spread AND no usable
        // daily history. An empty CURRENT window (e.g. a custom range with no points) is
        // handled by the chart's own empty state, not by blanking the whole grid.
        buildingHistory:
          !!trajectory && !!pair && !hasQuarterlySpread && !dailyBounds,
        dailyBounds,
        identity: {
          name: data?.identity?.name ?? symbol,
          ticker: symbol,
          sub: data?.identity
            ? `${symbol} · ${data.identity.sector?.displayName ?? data.identity.industryPath}`
            : symbol,
        },
        chips: verdict ? buildDivergenceChips(verdict, gap, readConfig, direction) : [],
        promotedRead:
          verdict && trajectory && pair
            ? buildDivergenceRead(readConfig, direction, pair.high, pair.low)
            : null,
        funnelBackHref: `/research/stock-screener/${symbol}?tab=health`,
        renderChart: (active, setActive) =>
          pair && spread.length >= 2 ? (
            <DivergenceChart
              spread={spread}
              highPillar={pair.high}
              lowPillar={pair.low}
              direction={direction}
              isDaily={sliced?.isDaily ?? false}
              resultMarks={sliced?.resultMarks ?? []}
              clampedEarlier={sliced?.clampedEarlier ?? false}
              active={active}
              onActiveChange={setActive}
            />
          ) : pair ? (
            // honest empty state — the current window sliced to <2 comparable points
            // (empty custom range, or sparse daily history after the ≤0-pillar guard).
            <DivergenceEmpty isDaily={sliced?.isDaily ?? false} highPillar={pair.high} lowPillar={pair.low} />
          ) : null,
        renderReadout: (active) =>
          pair && spread.length ? (
            <DivergenceReadout
              spread={spread}
              highPillar={pair.high}
              lowPillar={pair.low}
              direction={direction}
              active={active}
            />
          ) : null,
        renderSummary: () =>
          pair && spread.length >= 2 ? (
            <DivergenceSummary
              spread={spread}
              highPillar={pair.high}
              lowPillar={pair.low}
              config={readConfig}
              direction={direction}
            />
          ) : null,
      }
    : null;

  return (
    <ToolFrame
      meta={DIVERGENCE_META}
      symbol={symbol}
      window={window}
      onWindowChange={setWindow}
      onSelectSymbol={(s) => router.push(`/research/divergence?symbol=${encodeURIComponent(s)}`)}
      onHome={() => router.push("/research/divergence")}
      stocks={stocksQ.data}
      stocksLoading={stocksQ.isLoading}
      landing={{
        items: scanQ.data,
        isLoading: scanQ.isLoading,
        isError: scanQ.isError,
        onRetry: () => void scanQ.refetch(),
        renderCard: (it, onSelect) => (
          <DivergenceScanCard item={it as DivergenceScanItem} onSelect={onSelect} />
        ),
        keyOf: (it) => (it as DivergenceScanItem).symbol,
      }}
      single={single}
    />
  );
}
