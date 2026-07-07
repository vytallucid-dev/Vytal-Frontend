"use client";

import { Icons } from "@/lib/icons";
import type { Holding, PortfolioSnapshot } from "@/types/portfolio";
import type { PortfolioTab } from "../tabs";
import { COVERAGE_COLOR, coverageFindings } from "../lib";
import { orderCoverageFindings } from "./lib";
import { CARD, CoverageBar } from "./parts";
import { FindingRow } from "./findings";

/** The unscored names, recognized-unscored (large/mid) first — "next in our queue". */
export function queueSymbols(holdings: Holding[], n = 3): string[] {
  const unscored = holdings.filter((h) => h.health == null);
  const rank = (h: Holding) => (h.tier === "large" ? 0 : h.tier === "mid" ? 1 : 2);
  return [...unscored].sort((a, b) => rank(a) - rank(b) || b.weight - a.weight).slice(0, n).map((h) => h.symbol);
}

// ── the unlock treatment — coverage is a PROGRESS / ANTICIPATION story, never a failure
//    state. Queue (no health yet) · progress (partial) · complete (full). ────────────────
export function UnlockLine({
  scoredCount,
  totalCount,
  hasHealth,
  queue,
}: {
  scoredCount: number;
  totalCount: number;
  hasHealth: boolean;
  queue: string[];
}) {
  // display arithmetic (a count ratio), never a stored-score internal
  const complete = totalCount > 0 && scoredCount >= totalCount;

  if (!hasHealth) {
    return (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-[12.5px] leading-relaxed" style={{ color: COVERAGE_COLOR.scored }}>
          <Icons.spark weight="fill" className="size-4 shrink-0" />
          <span className="text-ink2">Health unlocks as we score your holdings{queue.length > 0 ? " — next in our queue:" : "."}</span>
        </p>
        {queue.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {queue.map((s) => (
              <span key={s} className="num rounded-md border px-2 py-0.5 text-[11px]" style={{ color: COVERAGE_COLOR.scored, borderColor: "color-mix(in oklch, " + COVERAGE_COLOR.scored + " 32%, transparent)", background: "color-mix(in oklch, " + COVERAGE_COLOR.scored + " 10%, transparent)" }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (complete) {
    return (
      <p className="flex items-center gap-2 text-[12.5px] text-ink2">
        <Icons.check weight="bold" className="size-4" style={{ color: "var(--rec)" }} />
        Every holding is scored — the number reflects your whole book.
      </p>
    );
  }

  const p = totalCount > 0 ? (scoredCount / totalCount) * 100 : 0; // display arithmetic
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[12.5px] leading-relaxed text-ink2">
        Scoring <span className="num text-ink">{scoredCount}</span> of your <span className="num text-ink">{totalCount}</span> holdings — lights up as we cover the rest.
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full" style={{ width: `${p}%`, background: COVERAGE_COLOR.scored }} />
      </div>
    </div>
  );
}

/** Coverage & unlock (B4) — the coverage bar + the unlock treatment + PV coverage findings
 *  + the honest unscored-name chips. Coverage is confidence, never a scare. */
export function CoverageUnlockSection({
  snapshot,
  holdings,
  onOpenTab,
}: {
  snapshot: PortfolioSnapshot;
  holdings: Holding[];
  onOpenTab?: (t: PortfolioTab) => void;
}) {
  const cs = snapshot.coverageState;
  const hasHealth = snapshot.healthRead != null;
  const pv = orderCoverageFindings(coverageFindings(snapshot));
  const awaiting = holdings.filter((h) => h.health == null);

  return (
    <div className={CARD}>
      <CoverageBar cs={cs} />

      <div className="mt-4 border-t border-line pt-4">
        <UnlockLine scoredCount={cs.scoredCount} totalCount={cs.totalCount} hasHealth={hasHealth} queue={queueSymbols(holdings)} />
      </div>

      {pv.length > 0 && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {pv.map((f) => (
            <FindingRow key={f.id} f={f} onOpenTab={onOpenTab} />
          ))}
        </div>
      )}

      {awaiting.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink2">
            <span className="size-2 rounded-full" style={{ background: COVERAGE_COLOR.awaiting }} />
            <span className="num font-medium text-ink">{awaiting.length}</span> awaiting coverage
          </span>
          {awaiting.map((h) => (
            <span key={h.symbol} className="num rounded-md border border-line2 bg-surface-2 px-2 py-0.5 text-[11px] text-ink2">
              {h.symbol}
            </span>
          ))}
          <span className="text-[11px] text-ink3">not scored yet — never faked into the number</span>
        </div>
      )}
    </div>
  );
}
