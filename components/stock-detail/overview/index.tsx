"use client";

/**
 * Overview tab — the "lobby". A calm glance of the stock across every domain, each
 * section a real-data taste that routes to its deep tab. Replaces the legacy phantom
 * overview.tsx (all mock data removed). Fans out to FIVE+ real sources — /overview,
 * /price, /health, /fundamentals, /ownership, /peer-groups — each section loading and
 * honest-emptying INDEPENDENTLY so one dead source never blanks the page.
 *
 * Two disciplines on one page, fenced clearly:
 *   • §4 Competitive Standing is DISCIPLINE A — spec-locked deterministic assembly.
 *   • Every other section is honest factual DISPLAY — no verdicts, no advice, no
 *     green→red buy-grading, no valuation lens.
 */

import { IdentitySection } from "./section-identity";
import { PriceSection } from "./section-price";
import { HealthGlanceSection } from "./section-health-glance";
import { StandingSection } from "./section-standing";
import { MetricsSection } from "./section-metrics";
import { PeersSection } from "./section-peers";
import { OwnershipSection } from "./section-ownership";
import { NavSection } from "./section-nav";

export default function Overview({ symbol }: { symbol: string }) {
  if (!symbol) return null;
  return (
    <div className="space-y-2">
      <IdentitySection symbol={symbol} />
      <PriceSection symbol={symbol} />
      <HealthGlanceSection symbol={symbol} />
      <StandingSection symbol={symbol} />
      <MetricsSection symbol={symbol} />
      <PeersSection symbol={symbol} />
      <OwnershipSection symbol={symbol} />
      <NavSection symbol={symbol} />
    </div>
  );
}
