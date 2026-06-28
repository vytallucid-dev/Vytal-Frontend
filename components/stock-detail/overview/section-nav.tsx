"use client";

/**
 * §8 — What's Next nav. DISPLAY.
 * Uses the shared WhereNext component (one source across all tabs), excluding the
 * Overview tab itself. The Valuation link stays cut — that tab no longer exists.
 */

import { WhereNext } from "../where-next";
import { Reveal } from "@/components/ui/reveal";

export function NavSection({ symbol }: { symbol: string }) {
  return (
    <Reveal>
      <div className="mt-8 scroll-mt-24" id="overview-next">
        <WhereNext symbol={symbol} exclude={["overview"]} />
      </div>
    </Reveal>
  );
}
