"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import type { PeerGroupConfig } from "@/lib/peer-group/config";
import type { PeerGroupIdentity } from "@/types/peer-group";

// ─────────────────────────────────────────────────────────────────────────────────────
// §1 · Field Identity — "what am I looking at." Factual identity (name / members / sector)
// always; the config editorial (whatBinds / character) is reviewed & verified, shown plainly.
// Real-data-seeded key metrics shown plainly. Honest fallback for alternates (no config) —
// identity only, calm.
// ─────────────────────────────────────────────────────────────────────────────────────

export function IdentitySection({
  config,
  identity,
}: {
  config: PeerGroupConfig | null;
  identity: PeerGroupIdentity;
}) {
  const whatBinds = config?.whatBinds?.trim() ?? "";
  const character = config?.character?.trim() ?? "";
  const hasEditorial = whatBinds.length > 0 || character.length > 0;
  const scoredMetrics = (config?.keyMetrics ?? []).filter((m) => m.source === "scored");

  return (
    <section>
      <SectionEyebrow
        label="What this field is"
        icon={Icons.compass}
        accent="var(--p-found)"
        pill={config?.lensChip ?? undefined}
      />
      <Reveal>
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          {/* factual identity — always */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink2">
            <span className="font-display text-lg font-semibold text-ink">{identity.displayName}</span>
            <span className="text-ink3">·</span>
            <span className="num">{identity.memberCount} members</span>
            {identity.sector && (
              <>
                <span className="text-ink3">·</span>
                <Badge variant="outline">{identity.sector.displayName}</Badge>
              </>
            )}
          </div>

          {hasEditorial ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
              {whatBinds && (
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-ink3">
                    What binds them
                  </div>
                  <p className="text-[14px] leading-relaxed text-ink">{whatBinds}</p>
                </div>
              )}
              {character && (
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-ink3">
                    Economic character
                  </div>
                  <p className="text-[14px] leading-relaxed text-ink2">{character}</p>
                </div>
              )}
              {scoredMetrics.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-ink3">Scored on:</span>
                  {scoredMetrics.map((m) => (
                    <span
                      key={m.key}
                      className="rounded-full border border-line2 px-2 py-0.5 text-[10.5px] text-ink2"
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-ink3">
              Group-specific framing is being prepared for this field — the factual comparison across
              the tabs applies meanwhile.
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
