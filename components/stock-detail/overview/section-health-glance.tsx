"use client";

/**
 * §3 — Health Glance. DISPLAY from REAL health.
 * Source: /health. Shows the real composite + band and the FOUR real pillars
 * (Foundation / Momentum / Market / Ownership) as compact reads — no fake score,
 * no "Valuation" pillar (it doesn't exist), no green smiley. Honest-empty when
 * scored===false. Funnels to the Health tab for the full diagnostic.
 */

import { Icons } from "@/lib/icons";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import type { PillarKey } from "@/types/health";
import { Panel, PillarGauge, BAND_META, PILLAR_META } from "../health/shared";
import { Section, HonestEmpty, LoadingBlock, Funnel } from "./shared";

const HEALTH_ACCENT = "var(--c-healthy)";

const PILLAR_ORDER: PillarKey[] = ["foundation", "momentum", "market", "ownership"];

export function HealthGlanceSection({ symbol }: { symbol: string }) {
  const { data: health, isLoading } = useStockHealth(symbol);

  if (isLoading) {
    return (
      <Section id="overview-health" label="Health glance" icon={Icons.health} accent={HEALTH_ACCENT}>
        <LoadingBlock className="h-44" />
      </Section>
    );
  }

  const scored = health?.scored && health.verdict;
  if (!scored || !health) {
    return (
      <Section id="overview-health" label="Health glance" icon={Icons.health} accent={HEALTH_ACCENT}>
        <HonestEmpty>Health score not yet available for this stock.</HonestEmpty>
      </Section>
    );
  }

  const { verdict, pillars } = health;
  const band = BAND_META[verdict!.label.band];
  const byKey = new Map(pillars.map((p) => [p.pillar, p]));

  return (
    <Section id="overview-health" label="Health glance" icon={Icons.health} accent={HEALTH_ACCENT}>
      <Panel>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          {/* Composite + band */}
          <div className="flex items-center gap-4 lg:w-64 lg:shrink-0">
            <PillarGauge score={verdict!.composite} color={band.cssVar} size={76} strokeWidth={7} />
            <div>
              <div className={`text-[15px] font-semibold ${band.text}`}>{verdict!.label.label}</div>
              <div className="num text-[11px] text-ink3">composite health</div>
            </div>
          </div>

          {/* The four real pillars */}
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
            {PILLAR_ORDER.map((key) => {
              const p = byKey.get(key);
              const meta = PILLAR_META[key];
              const unavailable = !p || p.state !== "scored";
              return (
                <div key={key} className="flex flex-col items-center gap-1.5 text-center">
                  <PillarGauge score={p?.subtotal ?? 0} color={unavailable ? "var(--ink3)" : meta.cssVar} size={52} strokeWidth={5} />
                  <div className="text-[11px] text-ink2">{meta.label}</div>
                  {unavailable && <div className="text-[9.5px] text-ink3">redistributed</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-[0.8rem] sm:flex items-center justify-between border-t border-line pt-4">
          <p className="text-[11.5px] text-ink3">Four pillars, one composite — the full breakdown lives on the Health tab.</p>
          <Funnel tab="health" symbol={symbol} label="Full health" />
        </div>
      </Panel>
    </Section>
  );
}
