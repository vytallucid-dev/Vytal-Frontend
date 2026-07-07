"use client";

import { Icons } from "@/lib/icons";
import type { Holding, PortfolioSnapshot } from "@/types/portfolio";
import {
  BLUEPRINT_ACCENT,
  CONSTRUCTION_BAND_META,
  HEALTH_BAND_META,
  constructionColor,
  healthColor,
  scoreBreakdown,
} from "../lib";
import { BandRibbon, BlueprintShell, CapitalPill, CoverageBar, HealthShell, StageBadge } from "./parts";
import { UnlockLine, queueSymbols } from "./coverage";

const r0 = (v: number) => Math.round(v);

// ── the whisper line — names the ONE Health deduction (active flags) so the number never
//    floats naked. Nothing positional: construction is a different read and never appears
//    here. Derived from the stored Quality/Signals split, never a recompute. ─────────────
function whisper(s: PortfolioSnapshot): string {
  const b = scoreBreakdown(s);
  const h = s.healthRead!;
  if (!b) return "Anchored on your holdings' quality.";
  const n = r0(b.flagsDrag);
  if (h.signals >= 100 || n < 1) return "Your holdings' quality carries straight through — no active flags.";
  return `Your holdings' quality is ${r0(b.quality)}; active flags took ${n} off.`;
}

// ── the "Provisional" tag — the ENTIRE honesty mechanism now that the ceiling is retired:
//    under 40% coverage the number is true but thinly-seen. No cap, ever. ────────────────
function ProvisionalTag() {
  return (
    <span
      className="ml-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: "#d6a652", background: "color-mix(in oklch, #d6a652 14%, transparent)" }}
    >
      Provisional
    </span>
  );
}

// ── the co-hero question label — the anti-averaging device. Each read states its OWN
//    question above its OWN number, so the pair reads as two answers, never two scores to
//    average. Health tinted its band colour; Construction tinted blueprint slate. ─────────
function QuestionLabel({ children, color, icon: Glyph }: { children: React.ReactNode; color: string; icon: typeof Icons.pulse }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color }}>
      <Glyph weight="duotone" className="size-3.5 shrink-0" />
      {children}
    </p>
  );
}

// ── HEALTH — the PRIMARY co-hero: "Are the things you own sound?" Pure Quality less active
//    flags, uncapped. Premium identity (band-tinted radial glow). ─────────────────────────
function HealthCoHero({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const h = snapshot.healthRead!;
  const band = h.band!;
  const color = healthColor(band);
  const cs = snapshot.coverageState;
  const coveragePct = r0(cs.scoredWeight * 100);

  return (
    <HealthShell accent={color} className="h-full">
      <QuestionLabel color={color} icon={Icons.pulse}>Are the things you own sound?</QuestionLabel>
      <div className="flex items-end gap-3">
        <span className="num text-[52px] font-medium leading-none" style={{ color }}>
          {h.value}
        </span>
        <span className="font-display mb-1.5 text-[22px] font-medium" style={{ color }}>
          {HEALTH_BAND_META[band].label}
        </span>
      </div>
      {h.value != null && <BandRibbon value={h.value} color={color} />}
      <p className="mt-3 max-w-[26em] text-[12px] leading-relaxed text-ink2">{whisper(snapshot)}</p>

      {/* mandatory coverage line — always present; the number is TRUE as shown (no cap) */}
      <p className="mt-2 max-w-[26em] text-[12px] leading-relaxed text-ink3">
        Covers <span className="num text-ink2">{cs.scoredCount}</span> of{" "}
        <span className="num text-ink2">{cs.totalCount}</span> holdings ·{" "}
        <span className="num text-ink2">{coveragePct}%</span> of book value.
        {h.provisional && <ProvisionalTag />}
      </p>
    </HealthShell>
  );
}

// ── CONSTRUCTION — the permanent CO-HERO (equal tier): "Is this book safely held?" A
//    standalone Structure read at the SAME size as Health, in its BLUEPRINT identity (slate
//    accent + grid/bracket motif) so it reads as a different KIND of number, never a second
//    health score. No coverage line — it needs none. ─────────────────────────────────────
function ConstructionCoHero({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const c = snapshot.constructionRead;
  const color = constructionColor(c.band);

  return (
    <BlueprintShell className="h-full">
      <QuestionLabel color={BLUEPRINT_ACCENT} icon={Icons.chartBar}>Is this book safely held?</QuestionLabel>
      <div className="flex items-end gap-3">
        <span className="num text-[52px] font-medium leading-none" style={{ color }}>
          {r0(c.value)}
        </span>
        <span className="font-display mb-1.5 text-[22px] font-medium" style={{ color }}>
          {CONSTRUCTION_BAND_META[c.band].label}
        </span>
      </div>
      <BandRibbon value={c.value} color={color} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StageBadge tier={c.structureTier} />
        <CapitalPill tier={c.capitalTier} />
      </div>
      <p className="mt-3 max-w-[26em] text-[12px] leading-relaxed text-ink3">
        How your holdings are weighted — concentration, breadth and sector shape. Independent of the health read.
      </p>
    </BlueprintShell>
  );
}

// ── CONSTRUCTION in the PRIMARY slot — the ONLY read when there's no scored book yet.
//    Coverage renders as a warm unlock promise, not a caveat; no Health co-hero exists. ───
function ConstructionPrimary({ snapshot, holdings }: { snapshot: PortfolioSnapshot; holdings: Holding[] }) {
  const c = snapshot.constructionRead;
  const color = constructionColor(c.band);
  const cs = snapshot.coverageState;
  const queue = queueSymbols(holdings);

  return (
    <BlueprintShell>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="lg:border-r lg:border-line lg:pr-7">
          <QuestionLabel color={BLUEPRINT_ACCENT} icon={Icons.chartBar}>Is this book safely held?</QuestionLabel>
          <div className="flex items-end gap-3">
            <span className="num text-[52px] font-medium leading-none" style={{ color }}>
              {r0(c.value)}
            </span>
            <span className="font-display mb-1.5 text-[22px] font-medium" style={{ color }}>
              {CONSTRUCTION_BAND_META[c.band].label}
            </span>
          </div>
          <BandRibbon value={c.value} color={color} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StageBadge tier={c.structureTier} />
            <CapitalPill tier={c.capitalTier} />
          </div>
          <p className="mt-3 max-w-[26em] text-[12px] leading-relaxed text-ink2">
            Health unlocks as we score your holdings
            {queue.length > 0 ? <> — {queue.slice(0, 3).join(", ")} {queue.length === 1 ? "is" : "are"} next in our queue.</> : "."}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3.5">
          <CoverageBar cs={cs} />
          <UnlockLine scoredCount={cs.scoredCount} totalCount={cs.totalCount} hasHealth={false} queue={queue} />
        </div>
      </div>
    </BlueprintShell>
  );
}

/** The hero resolver. A scored book shows BOTH reads as equal-tier co-heroes (Health primary
 *  · Construction co-hero) — two questions, two numbers, kept visually apart so they're never
 *  averaged. A 0-scored book shows Construction alone in the primary slot with its unlock
 *  queue; no Health block is stubbed. The two values are NEVER combined. */
export function HeroSection({ snapshot, holdings }: { snapshot: PortfolioSnapshot; holdings: Holding[] }) {
  if (!snapshot.healthRead) return <ConstructionPrimary snapshot={snapshot} holdings={holdings} />;
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <HealthCoHero snapshot={snapshot} />
      <ConstructionCoHero snapshot={snapshot} />
    </div>
  );
}
