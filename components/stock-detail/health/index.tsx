"use client";

import { useParams } from "next/navigation";
import { Icons } from "@/lib/icons";
import { Reveal } from "@/components/ui/reveal";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { Panel } from "./shared";
import { VerdictHero } from "./verdict-section";
import { RideSection } from "./ride-section";
import { PeerSection } from "./peer-section";
import { AnatomySection } from "./anatomy-section";
import { TrajectorySection } from "./trajectory-section";
import { FindingsSection } from "./findings-section";
import { RawFloorSection } from "./raw-floor-section";
import { WhereNext } from "../where-next";

export default function HealthScore() {
  const params = useParams();
  const symbol = params.symbol as string;
  const { data, isLoading, isError, error, refetch } = useStockHealth(symbol);

  if (isLoading) return <QuerySkeleton rows={6} rowHeight="h-16" className="mt-8" />;
  if (isError)
    return (
      <QueryError
        message={(error as Error)?.message ?? "Failed to load health data"}
        onRetry={() => refetch()}
        className="mt-8"
      />
    );
  if (!data) return null;

  const { identity, verdict, pillars, trajectory, findings, peerStanding } = data;

  // ── honest not-scored state ──
  if (!data.scored || !verdict) {
    return (
      <div className="mt-8">
        <Panel className="flex flex-col items-center gap-3 py-14 text-center">
          <Icons.info weight="duotone" className="h-10 w-10 text-ink3" />
          <p className="font-medium text-ink">Health score not available for {identity.symbol}</p>
          <p className="max-w-sm text-sm text-ink3">
            {identity.coverageReason ?? `Coverage state: ${identity.coverageState ?? "not yet scored"}`}
          </p>
        </Panel>
      </div>
    );
  }

  const foundation = pillars.find((p) => p.pillar === "foundation");

  return (
    <div className="mt-6 space-y-2">
      <Reveal>
        <VerdictHero identity={identity} verdict={verdict} pillars={pillars} />
      </Reveal>

      {foundation && (
        <Reveal>
          <RideSection identity={identity} foundation={foundation} />
        </Reveal>
      )}

      {peerStanding && (
        <Reveal>
          <PeerSection identity={identity} verdict={verdict} peer={peerStanding} pillars={pillars} />
        </Reveal>
      )}

      <AnatomySection pillars={pillars} />

      {trajectory && (
        <Reveal>
          <TrajectorySection trajectory={trajectory} symbol={identity.symbol} />
        </Reveal>
      )}

      {findings && (
        <Reveal>
          {/* Hot-pond mask (File 1 §5) — the REAL PG-level signal: the stock's pond heat,
              inherited from PGState.mask_heat and stamped on the snapshot. Replaces the old
              stock-level proxy (the stock's own wide price-ahead divergence). A stock in a hot
              pond now masks even if its OWN gap is modest; a stock in a calm/warm pond does not,
              even if it's individually price-extended. null/pre-stamp ⇒ no mask (safe default). */}
          <FindingsSection
            findings={findings}
            symbol={identity.symbol}
            pondHot={verdict.pondMask?.isHot ?? false}
          />
        </Reveal>
      )}

      <Reveal>
        <RawFloorSection pillars={pillars} />
      </Reveal>

      <Reveal>
        <WhereNext symbol={identity.symbol} exclude={["health"]} />
      </Reveal>
    </div>
  );
}
