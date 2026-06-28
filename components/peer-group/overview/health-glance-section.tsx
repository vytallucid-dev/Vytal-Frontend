"use client";

import { Reveal } from "@/components/ui/reveal";
import { ArrowRight } from "lucide-react";
import {
  SectionEyebrow,
  BAND_META,
  LABEL_BAND_ORDER,
} from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { healthLabel } from "@/lib/format";
import type { PeerGroupAggregate } from "@/types/peer-group";

// ─────────────────────────────────────────────────────────────────────────────────────
// §5 · Health glance — ONE health-forward summary of the pond (median band + spread + band
// mix) that funnels to the built Health tab. Integrated, not dominant — the full pond view
// lives one click away.
// ─────────────────────────────────────────────────────────────────────────────────────

export function HealthGlanceSection({
  aggregate,
  onOpenHealth,
}: {
  aggregate: PeerGroupAggregate;
  onOpenHealth: () => void;
}) {
  const median = aggregate.medianComposite;
  const label = healthLabel(median);
  const spread = aggregate.descriptor.split(",")[1]?.trim() ?? "varied";
  const dist = aggregate.bandDistribution;
  const total = LABEL_BAND_ORDER.reduce((s, b) => s + dist[b], 0);

  return (
    <section>
      <SectionEyebrow label="Health at a glance" icon={Icons.health} accent="var(--c-healthy)" pill="signature lens" />
      <Reveal>
        <button
          type="button"
          onClick={onOpenHealth}
          className="group flex w-full flex-col gap-4 rounded-xl border border-line bg-surface-1 p-5 text-left transition-colors hover:border-line2 hover:bg-surface-2"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="num text-3xl font-semibold" style={{ color: healthColorFor(median) }}>
                {Math.round(median)}
              </span>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-ink">{label} median</span>
                <span className="text-[11.5px] text-ink3">
                  {spread} spread · <span className="num">{aggregate.scoredCount}</span> scored
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-ink2 transition-colors group-hover:text-primary">
              Full Health
              <ArrowRight className="size-3.5" />
            </span>
          </div>

          {/* band mix mini-bar */}
          <div>
            <div className="flex h-6 gap-0.5 overflow-hidden rounded-md">
              {LABEL_BAND_ORDER.map((b) => {
                const n = dist[b];
                if (n === 0) return null;
                return (
                  <div
                    key={b}
                    className="num flex items-center justify-center text-[11px] font-medium"
                    style={{ flex: n, background: BAND_META[b].cssVar, color: "#0a0b0e" }}
                    title={`${BAND_META[b].label}: ${n} member${n > 1 ? "s" : ""}`}
                  >
                    {n}
                  </div>
                );
              })}
              {total === 0 && <span className="text-[11px] text-ink3">No members scored.</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink2">
              {LABEL_BAND_ORDER.filter((b) => dist[b] > 0).map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm" style={{ background: BAND_META[b].cssVar }} />
                  {BAND_META[b].label} {dist[b]}
                </span>
              ))}
            </div>
          </div>
        </button>
      </Reveal>
    </section>
  );
}

function healthColorFor(score: number): string {
  if (score >= 74) return BAND_META.pristine.cssVar;
  if (score >= 68) return BAND_META.healthy.cssVar;
  if (score >= 62) return BAND_META.steady.cssVar;
  if (score >= 55) return BAND_META.below_par.cssVar;
  return BAND_META.fragile.cssVar;
}
