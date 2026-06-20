"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { AnimatedNumber } from "@/components/ui/animated-number";
import type { IdentitySection, VerdictSection, PillarView } from "@/types/health";
import { BAND_META, LABEL_BAND_ORDER } from "./shared";
import { buildDiagnosis } from "./diagnosis";

export function VerdictHero({
  identity,
  verdict,
  pillars,
}: {
  identity: IdentitySection;
  verdict: VerdictSection;
  pillars: PillarView[];
}) {
  const { segments, sub } = buildDiagnosis(verdict, pillars);
  const activeBand = verdict.label.band;

  // sector tag: sector · sectorClass (sectorClass is null today → sector only)
  const sectorBits = [identity.sector?.displayName, identity.sectorClass].filter(Boolean);

  const traj = verdict.trajectoryMarker;
  const trajChip =
    traj === "improving"
      ? { Icon: Icons.trendUp, text: "Improving", cls: "text-healthy bg-healthy/10 border-healthy/30" }
      : traj === "deteriorating"
        ? { Icon: Icons.trendDown, text: "Deteriorating", cls: "text-high bg-high/10 border-high/40" }
        : traj === "stable"
          ? { Icon: Icons.pulse, text: "Stable", cls: "text-ink2 bg-surface-2 border-line2" }
          : null;

  const divChip =
    verdict.divergence.flag === "wide"
      ? { text: "Wide divergence", cls: "text-fragile bg-crit/12 border-crit/40" }
      : verdict.divergence.flag === "notable"
        ? { text: "Notable divergence", cls: "text-high bg-high/10 border-high/40" }
        : { text: "Tight alignment", cls: "text-healthy bg-healthy/10 border-healthy/30" };

  return (
    <section className="card-hero relative overflow-hidden rounded-2xl border border-line2 p-7 sm:p-8">
      {/* soft corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full opacity-60"
        style={{ background: `radial-gradient(circle, ${BAND_META[activeBand].cssVar}26, transparent 68%)` }}
      />
      <div className="relative grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* ── left: the read ── */}
        <div>
          {sectorBits.length > 0 && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-line2 px-3 py-1.5 text-[11.5px] text-ink2">
              <span className="h-1.5 w-1.5 rounded-full bg-p-mkt" />
              {sectorBits.join(" · ")}
            </div>
          )}

          <p className="diagnosis max-w-[24em]">
            {segments.map((s, i) =>
              s.bold ? (
                <b key={i} className="font-medium text-ink">
                  {s.text}
                </b>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </p>
          <p className="mt-2 font-display text-[15px] italic text-ink2">{sub}</p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {trajChip && (
              // Live CTA → the Trajectory research tool, carrying the symbol.
              <Link
                href={`/research/trajectory?symbol=${identity.symbol}`}
                title="Study the full trajectory"
                className={cn(
                  "group/traj inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-[filter] hover:brightness-110",
                  trajChip.cls,
                )}
              >
                <trajChip.Icon className="h-3.5 w-3.5" />
                {trajChip.text}
                {verdict.trajectoryDelta != null && (
                  <span className="num">
                    ({verdict.trajectoryDelta > 0 ? "+" : ""}
                    {verdict.trajectoryDelta.toFixed(1)})
                  </span>
                )}
                <Icons.arrowUpRight className="h-3 w-3 opacity-50 transition-opacity group-hover/traj:opacity-100" />
              </Link>
            )}
            {/* Live CTA → the Divergence & Convergence research tool, carrying the symbol. */}
            <Link
              href={`/research/divergence?symbol=${identity.symbol}`}
              title="Study the spread in Divergence & Convergence"
              className={cn(
                "group/div inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-[filter] hover:brightness-110",
                divChip.cls,
              )}
            >
              <Icons.compare className="h-3.5 w-3.5" />
              {divChip.text}
              {verdict.divergence.flag !== "none" && (
                <span className="num">({verdict.divergence.gap.toFixed(0)})</span>
              )}
              <Icons.arrowUpRight className="h-3 w-3 opacity-50 transition-opacity group-hover/div:opacity-100" />
            </Link>
          </div>
        </div>

        {/* ── right: condition scale ── */}
        <div>
          <div className="kicker mb-3">Condition</div>
          <div className="flex flex-col gap-1.5">
            {LABEL_BAND_ORDER.map((b) => {
              const meta = BAND_META[b];
              const on = b === activeBand;
              return (
                <div
                  key={b}
                  className={cn(
                    "flex items-center gap-3 rounded-[10px] border px-3.5 py-2.5 transition-colors",
                    on ? "bg-surface-3" : "border-transparent bg-surface-2",
                  )}
                  style={on ? { borderColor: `color-mix(in oklab, ${meta.cssVar} 45%, transparent)` } : undefined}
                >
                  <span className={cn("h-6 w-1 rounded", meta.cap, on ? "opacity-100" : "opacity-50")} />
                  <span className={cn("text-[12.5px]", on ? "font-semibold text-ink" : "font-medium text-ink3")}>
                    {meta.label}
                  </span>
                  {on ? (
                    <AnimatedNumber
                      value={verdict.composite}
                      decimals={1}
                      className="ml-auto text-[15px] text-ink"
                    />
                  ) : b === "pristine" ? (
                    <span className="ml-auto text-[10px] text-ink3 opacity-70">fully priced</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
