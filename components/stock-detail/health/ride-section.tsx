"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { IdentitySection, PillarView } from "@/types/health";
import { SectionEyebrow, Panel, clampPct } from "./shared";
import { floorDescriptor, foundationFloorLine } from "./diagnosis";

/**
 * "How it rides" — the risk-shape ribbon. The prototype's line 1 (realized
 * volatility / drawdown) has NO backing field in the contract, so it is omitted
 * honestly; what IS available is the balance-sheet floor (Foundation) and its
 * native-zone interpretation, which is the prototype's line 2. The ribbon is
 * repurposed to plot floor strength — clearly labelled, never mislabelled as vol.
 */
export function RideSection({
  identity,
  foundation,
}: {
  identity: IdentitySection;
  foundation: PillarView;
}) {
  const floor = foundation.subtotal;

  return (
    <section>
      <SectionEyebrow label="How it rides" pill="balance-sheet floor" />
      <Panel className="grid items-center gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* ribbon */}
        <div>
          <div className="mb-2 flex justify-between text-[11px] text-ink3">
            <span>Thin floor</span>
            <span>Adequate</span>
            <span>Fortress</span>
          </div>
          <div
            className="relative h-2.5 rounded-md"
            style={{
              background:
                "linear-gradient(90deg, var(--c-fragile), var(--c-below) 35%, var(--c-steady) 58%, var(--c-healthy) 80%, var(--c-pristine))",
            }}
          >
            <span
              className="absolute -top-1.5 h-[22px] w-[3px] rounded-sm bg-ink"
              style={{ left: `${clampPct(floor)}%` }}
            >
              <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-surface-1 bg-ink" />
            </span>
          </div>
          <div className="num mt-4 text-[10.5px] text-ink">
            Foundation scores <AnimatedNumber value={floor} decimals={1} className="text-ink" /> / 100
          </div>
        </div>

        {/* interpretation */}
        <div>
          <div className="text-[14.5px] font-medium text-ink">
            Its floor scores{" "}
            <AnimatedNumber value={floor} decimals={0} className="text-ink" /> — {floorDescriptor(floor)}.
          </div>
          <div className="mt-2 text-[12.5px] leading-relaxed text-ink2">
            {foundationFloorLine(identity.sectorClass, foundation.nativeZone)}
          </div>
        </div>
      </Panel>
    </section>
  );
}
