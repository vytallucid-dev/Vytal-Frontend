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
import type { SingleViewSlots, ToolMeta, ToolWindow } from "../tool-frame.types";
import { DivergenceChart } from "./divergence-chart";
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

  const [window, setWindow] = useState<ToolWindow>(12);
  const [lastSymbol, setLastSymbol] = useState<string | null>(symbol);
  if (lastSymbol !== symbol) {
    setLastSymbol(symbol);
    setWindow(12);
  }

  const stocksQ = useScoredStocks();
  const scanQ = useStockScan<DivergenceScanItem>("divergence", !symbol);
  const healthQ = useStockHealth(symbol ?? "", window);

  const data = healthQ.data;
  const verdict = data?.verdict ?? null;
  const trajectory = data?.trajectory ?? null;
  const pillars = useMemo(() => data?.pillars ?? [], [data]);

  // The spread is pure arithmetic over the existing trajectory series — no new read.
  const pair = useMemo(() => (pillars.length ? pickScoredPair(pillars) : null), [pillars]);
  const spread = useMemo(
    () => (trajectory && pair ? buildSpread(trajectory.series, pair.high, pair.low) : []),
    [trajectory, pair],
  );

  const gap = spread.length ? spread[spread.length - 1].gap : 0;
  const flag = divergenceFlag(gap);
  const baseConfig: DivergenceConfig = pair ? divergenceConfig(pair.high, pair.low) : "none";
  // Honest "no notable divergence" → an aligned read, never a manufactured tension.
  const readConfig: DivergenceConfig = flag === "none" ? "none" : baseConfig;
  const direction =
    spread.length >= 2 ? directionOf(spread[0].gap, spread[spread.length - 1].gap) : "steady";

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
        // single period, OR too few comparable periods after dropping unavailable-pillar quarters
        buildingHistory:
          (!!trajectory && trajectory.series.length <= 1) ||
          (!!pair && !!trajectory && spread.length < 2),
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
              active={active}
              onActiveChange={setActive}
            />
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
