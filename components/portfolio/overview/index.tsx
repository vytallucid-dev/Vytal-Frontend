"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import type { Holding, HoldingsTotals, PortfolioSnapshot } from "@/types/portfolio";
import type { PortfolioTab } from "../tabs";
import { ValueHero } from "./value-hero";
import { HealthBand } from "./health-band";
import { AllocationGlance } from "./allocation-glance";
import { WhatsMoving } from "./whats-moving";
import { HoldingsPreview } from "./holdings-preview";
import { Upcoming } from "./upcoming";

/**
 * Portfolio OVERVIEW — the synthesizing home. Tracker-first (the money leads), with
 * health prominent in position two as a rich summary that HANDS OFF to the Health
 * tab. Everything here is READ over the pre-computed snapshot + holdings; no score,
 * penalty or PHS weight is computed client-side. Themed to the live stock-screener
 * surface (SectionEyebrow rhythm · Panel cards · mono/serif split).
 */
export function OverviewTab({
  snapshot,
  holdings,
  totals,
  onOpenTab,
}: {
  snapshot: PortfolioSnapshot | null;
  holdings: Holding[];
  totals: HoldingsTotals;
  onOpenTab: (tab: PortfolioTab) => void;
}) {
  return (
    <div className="flex flex-col pb-4">
      {/* A · Value hero — the money anchor */}
      <SectionEyebrow label="What your book is worth" icon={Icons.coins} accent="var(--p-mkt)" />
      <Reveal>
        <ValueHero holdings={holdings} totals={totals} />
      </Reveal>

      {/* B · Health summary band — position two, prominent, still a connector */}
      <SectionEyebrow
        label="How healthy your book is"
        pill="weighted · coverage-aware"
        icon={Icons.pulse}
        accent="var(--p-found)"
      />
      <Reveal>
        <HealthBand snapshot={snapshot} holdings={holdings} onOpenHealth={() => onOpenTab("health")} />
      </Reveal>

      {/* C · Allocation & diversification glance */}
      <SectionEyebrow label="How your capital is spread" pill="by value" icon={Icons.sector} accent="var(--p-own)" />
      <Reveal>
        <AllocationGlance holdings={holdings} onOpenHoldings={() => onOpenTab("holdings")} />
      </Reveal>

      {/* D · What's moving — two distinct reads */}
      <SectionEyebrow label="What's moving" icon={Icons.trendUp} accent="var(--p-mom)" />
      <Reveal>
        <WhatsMoving holdings={holdings} onOpenPerformance={() => onOpenTab("performance")} />
      </Reveal>

      {/* E · Holdings preview */}
      <SectionEyebrow label="Your holdings" pill="top by weight" icon={Icons.portfolio} accent="var(--c-pristine)" />
      <Reveal>
        <HoldingsPreview holdings={holdings} onOpenHoldings={() => onOpenTab("holdings")} />
      </Reveal>

      {/* F · Upcoming (honest pending until the holdings-scoped events read lands) */}
      <SectionEyebrow label="On the horizon" icon={Icons.calendar} accent="var(--ctx)" />
      <Reveal>
        <Upcoming />
      </Reveal>
    </div>
  );
}
