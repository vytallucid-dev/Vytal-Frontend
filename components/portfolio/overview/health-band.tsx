"use client";

import { Icons } from "@/lib/icons";
import type { Holding, PfFinding, PortfolioSnapshot } from "@/types/portfolio";
import {
  BLUEPRINT_ACCENT,
  CONSTRUCTION_BAND_META,
  COVERAGE_COLOR,
  HEALTH_BAND_META,
  allFindings,
  attentionHoldings,
  constructionColor,
  findingRead,
  healthColor,
} from "../lib";
import { Funnel } from "./shared";

const CARD = "rounded-xl border border-line bg-surface-1 p-5 sm:p-6";

// ── the single hook line — the loudest thing, so the glance pulls into the tab. ──────────
function hookFinding(s: PortfolioSnapshot): PfFinding | null {
  const order: Record<string, number> = { Concern: 0, Caution: 1, Neutral: 2, Constructive: 3 };
  const loud = allFindings(s)
    .filter((f) => f.loud && f.family !== "PV" && (f.tone === "Concern" || f.tone === "Caution"))
    .sort((a, b) => order[a.tone] - order[b.tone]);
  return loud[0] ?? null;
}

// ── an honest "no score yet" glance — pending snapshot (never a fabricated number) ──────
function PreparingGlance({ onOpenHealth }: { onOpenHealth: () => void }) {
  return (
    <div className={CARD}>
      <p className="kicker">Portfolio health</p>
      <p className="mt-2.5 font-display text-[16px] font-medium text-ink">Your health read is preparing</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink3">
        Computed when your book changes or on the nightly refresh — it appears once that lands.
      </p>
      <div className="mt-4">
        <Funnel onClick={onOpenHealth}>View health</Funnel>
      </div>
    </div>
  );
}

/**
 * Overview HEALTH CARD (Part C) — a compact, resolver-aware glance that teases the Health
 * tab. Same band-colour language as the tab; one accent; no waterfall / ledgers. Read-only.
 */
export function HealthBand({
  snapshot,
  holdings,
  onOpenHealth,
}: {
  snapshot: PortfolioSnapshot | null;
  holdings: Holding[];
  onOpenHealth: () => void;
}) {
  if (!snapshot) return <PreparingGlance onOpenHealth={onOpenHealth} />;

  const h = snapshot.healthRead;

  // ── health present — band chip + Health Score + one hook line ──
  if (h && h.value != null && h.band) {
    const color = healthColor(h.band);
    const hook = hookFinding(snapshot);
    const attention = attentionHoldings(holdings);
    const hookText = hook
      ? hook.label
      : attention.count > 0
        ? `${attention.names[0]} needs a look`
        : "Sound overall — nothing needs a look";
    return (
      <div className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <p className="kicker">Portfolio health</p>
          <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color, background: `color-mix(in oklch, ${color} 14%, transparent)` }}>
            {HEALTH_BAND_META[h.band].label}
          </span>
        </div>
        <div className="mt-2 flex items-end gap-2.5">
          <span className="num text-[28px] font-medium leading-none" style={{ color }}>{h.value}</span>
          <span className="mb-0.5 text-[11px] text-ink3">
            reflects <span className="num text-ink2">{Math.round(snapshot.coverageState.scoredWeight * 100)}%</span> of value
          </span>
        </div>
        <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink2">
          {hook ? (
            <>
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
              <span><span className="font-medium text-ink">{hook.label}.</span> {findingRead(hook) !== hook.label ? findingRead(hook) : ""}</span>
            </>
          ) : (
            <>
              <Icons.check weight="bold" className="mt-0.5 size-4 shrink-0" style={{ color: "var(--rec)" }} />
              <span>{hookText}</span>
            </>
          )}
        </p>
        <div className="mt-4">
          <Funnel onClick={onOpenHealth}>View health</Funnel>
        </div>
      </div>
    );
  }

  // ── health null — a confident construction glance + the unlock promise ──
  const c = snapshot.constructionRead;
  const color = constructionColor(c.band);
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between gap-3">
        <p className="kicker">How your book is built</p>
        <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color, background: `color-mix(in oklch, ${color} 14%, transparent)` }}>
          {CONSTRUCTION_BAND_META[c.band].label}
        </span>
      </div>
      <div className="mt-2 flex items-end gap-2.5">
        <span className="num text-[28px] font-medium leading-none" style={{ color }}>{Math.round(c.value)}</span>
        <span className="mb-0.5 text-[11px] text-ink3">structure</span>
      </div>
      <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink2">
        <Icons.spark weight="fill" className="mt-0.5 size-4 shrink-0" style={{ color: COVERAGE_COLOR.scored }} />
        <span>Health unlocks as we score your holdings.</span>
      </p>
      <div className="mt-4">
        <Funnel onClick={onOpenHealth}>View health</Funnel>
      </div>
    </div>
  );
}
