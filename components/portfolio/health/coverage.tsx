"use client";

import { Icons } from "@/lib/icons";
import type { Holding, PortfolioDisclosure, PortfolioSnapshot } from "@/types/portfolio";
import type { PortfolioTab } from "../tabs";
import { COVERAGE_COLOR, coverageFindings } from "../lib";
import { HoldingDisclosure } from "../holding-disclosure";
import { orderCoverageFindings } from "./lib";
import { CARD, CoverageBar, InfoTip, Tip } from "./parts";
import { FindingRow } from "./findings";

/** The unscored STOCK names, recognized-unscored (large/mid) first — "next in our queue". A non-stock is
 *  by-design unscored (it carries a served note) and is never queued for a score. */
export function queueSymbols(holdings: Holding[], n = 3): string[] {
  const unscored = holdings.filter((h) => h.health == null && !h.disclosureNotes?.length);
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
  scoredCount: number | null;
  totalCount: number | null;
  hasHealth: boolean;
  queue: string[];
}) {
  // (Stage 9) a pre-2.0 row carries no counts. Say nothing rather than invent a "0 of 0" — the coverage
  // % is on the row and carries the story alone.
  if (scoredCount == null || totalCount == null) return null;
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
      <Tip content={`${scoredCount} of ${totalCount} holdings scored — ${Math.round(p)}% by count. The rest light up as coverage completes; nothing is faked into the number in the meantime.`}>
        <div className="h-1.5 cursor-help overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full" style={{ width: `${p}%`, background: COVERAGE_COLOR.scored }} />
        </div>
      </Tip>
    </div>
  );
}

/** Coverage & unlock (B4) — the coverage bar + the unlock treatment + PV coverage findings
 *  + the honest unscored-name chips. Coverage is confidence, never a scare. */
export function CoverageUnlockSection({
  snapshot,
  holdings,
  disclosure,
  onOpenTab,
}: {
  snapshot: PortfolioSnapshot;
  holdings: Holding[];
  disclosure?: PortfolioDisclosure;
  onOpenTab?: (t: PortfolioTab) => void;
}) {
  const cs = snapshot.coverageState;
  const hasHealth = snapshot.healthRead != null;
  const pv = orderCoverageFindings(coverageFindings(snapshot));
  // STOCKS awaiting a score only — by-design non-stocks state their own reason (below), never as "awaiting".
  const awaiting = holdings.filter((h) => h.health == null && !h.disclosureNotes?.length);
  // Capital we could not value — the SAME served { code, cls, sentence } notes the /me/holdings rows carry.
  const unvalued = (disclosure?.heldNotValued ?? []).filter((x) => x.note);

  return (
    <div className={CARD}>
      <CoverageBar cs={cs} />

      <div className="mt-4 border-t border-line pt-4">
        <UnlockLine scoredCount={cs.scoredCount} totalCount={cs.totalCount} hasHealth={hasHealth} queue={queueSymbols(holdings)} />
      </div>

      {pv.length > 0 && (
        <div className="mt-4 grid gap-2 ">
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
            <InfoTip>
              Names we recognise and cover but haven&apos;t scored yet. They&apos;re held out of the number until scored — never estimated
              or faked in — and light up as coverage completes.
            </InfoTip>
          </span>
          {awaiting.map((h) => (
            <Tip key={h.symbol} content={`${h.symbol} is covered but not scored yet — it's excluded from the number until we score it.`}>
              <span className="num cursor-help rounded-md border border-line2 bg-surface-2 px-2 py-0.5 text-[11px] text-ink2">
                {h.symbol}
              </span>
            </Tip>
          ))}
          <span className="text-[11px] text-ink3">not scored yet — never faked into the number</span>
        </div>
      )}

      {/* Capital we couldn't value — each with its SERVED reason + tone, consistent with the per-row note.
          (Unexercised on a fully-priced book: renders only when a position has no live price.) */}
      {unvalued.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] text-ink2">
            <span className="size-2 rounded-full" style={{ background: "var(--high)" }} />
            <span className="num font-medium text-ink">{unvalued.length}</span> holding{unvalued.length === 1 ? "" : "s"} we couldn&apos;t value
            <InfoTip>
              Positions we hold but couldn&apos;t attach a live price to, so they sit outside the value-weighted reads. Each carries its own
              served reason below.
            </InfoTip>
          </p>
          <ul className="flex flex-col gap-2">
            {unvalued.map((x) => (
              <li key={x.symbol + x.accountId}>
                <span className="num text-[11.5px] font-semibold text-ink2">{x.symbol}</span>
                <HoldingDisclosure notes={x.note ? [x.note] : []} className="mt-0.5" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
