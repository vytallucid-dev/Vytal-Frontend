"use client";

/**
 * Ownership tool — the orchestrator. Fills the SAME five <ToolFrame> slots
 * (zero frame edits). Reads the ownership SERIES (the new differentiating endpoint)
 * for the holding split / pledging / flows, and the HEALTH snapshot for the
 * Foundation floor (the floor-check input) + sector. The flow signal is derived from
 * holding-split deltas; pledge from share counts.
 */

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/lib/icons";
import { useScoredStocks, useStockScan } from "@/lib/api/hooks/use-stocks";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { useStockOwnership } from "@/lib/api/hooks/use-stock-ownership";
import type { OwnershipScanItem } from "@/types/research-tools";
import { ToolFrame } from "../tool-frame";
import {
  DEFAULT_WINDOW,
  windowQuarters,
  type SingleViewSlots,
  type ToolMeta,
  type ToolWindow,
} from "../tool-frame.types";
import { OwnershipChart } from "./ownership-chart";
import { OwnershipReadout } from "./ownership-readout";
import { OwnershipSummary } from "./ownership-summary";
import { OwnershipScanCard } from "./ownership-card";
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
  // score series. It rides the shared window contract via the quarter count; the switcher's
  // daily/custom options render disabled (no daily bounds passed) — an honest dormant state.
  const [window, setWindow] = useState<ToolWindow>(DEFAULT_WINDOW);
  const [lastSymbol, setLastSymbol] = useState<string | null>(symbol);
  if (lastSymbol !== symbol) {
    setLastSymbol(symbol);
    setWindow(DEFAULT_WINDOW);
  }
  const quarters = windowQuarters(window);

  const stocksQ = useScoredStocks();
  const scanQ = useStockScan<OwnershipScanItem>("ownership", !symbol);
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
        buildingHistory: loaded && !notScored && holdingPoints.length <= 1,
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
      onWindowChange={setWindow}
      onSelectSymbol={(s) => router.push(`/research/ownership?symbol=${encodeURIComponent(s)}`)}
      onHome={() => router.push("/research/ownership")}
      stocks={stocksQ.data}
      stocksLoading={stocksQ.isLoading}
      landing={{
        items: scanQ.data,
        isLoading: scanQ.isLoading,
        isError: scanQ.isError,
        onRetry: () => void scanQ.refetch(),
        renderCard: (it, onSelect) => (
          <OwnershipScanCard item={it as OwnershipScanItem} onSelect={onSelect} />
        ),
        keyOf: (it) => (it as OwnershipScanItem).symbol,
      }}
      single={single}
    />
  );
}
