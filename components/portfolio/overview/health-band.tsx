"use client";

import { Icons } from "@/lib/icons";
import type { Holding, PortfolioSnapshot } from "@/types/portfolio";
import {
  PHS_BAND_META,
  TONE_META,
  type ScoreBreakdown,
  attentionHoldings,
  findingRead,
  phsColor,
  pickSynthesis,
  scoreBreakdown,
  unscoredCount,
} from "../lib";
import { Funnel, Kicker } from "./shared";

const CARD = "rounded-xl border border-line bg-surface-1 p-5 sm:p-6";

function pct(v: number) {
  return `${Math.round(v)}%`;
}

// ── the capital-across-health bar (bucket splits — the Health tab's safeguard) ──
function CapitalBar({ s }: { s: PortfolioSnapshot }) {
  const total = s.totalValue || 1;
  const segs = [
    { key: "scored", label: "Scored", val: s.scoredValue, color: "var(--c-pristine)" },
    { key: "recognized", label: "Awaiting coverage", val: s.recognizedUnscoredValue, color: "var(--ctx)" },
    { key: "small", label: "Untracked", val: s.smallUnscoredValue, color: "var(--ink3)" },
  ].filter((seg) => seg.val > 0);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Kicker>Your capital, across health coverage</Kicker>
        <span className="text-[10.5px] text-ink3">% of book value</span>
      </div>
      <div className="flex h-8 gap-0.5 overflow-hidden rounded-lg">
        {segs.map((seg) => {
          const p = (seg.val / total) * 100;
          return (
            <div
              key={seg.key}
              className="num flex items-center justify-center text-[11px] font-medium"
              style={{ flex: Math.max(p, 2), background: seg.color, color: "#0a0b0e" }}
              title={`${seg.label} ${p.toFixed(1)}%`}
            >
              {p >= 8 ? `${Math.round(p)}%` : ""}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink2">
        {segs.map((seg) => (
          <span key={seg.key} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px]" style={{ background: seg.color }} />
            {seg.label} {pct((seg.val / total) * 100)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── score composition — Quality ANCHOR minus penalty-only DEDUCTIONS, landing on the
//    composite. Reframes the old three-equal-bars (which read 66/77/100 → 59 as a
//    contradiction) into the real model: 66 quality, less what construction & flags took
//    off, = 59. Every number is READ from the snapshot; the drags are a display split of
//    the same stored pillar values (lib.scoreBreakdown), never a recompute. ──────────────
function Deduction({ label, value, tone }: { label: string; value: number; tone: "drag" | "calm" | "neutral" }) {
  // drag = points actively subtracted (amber); calm = nothing subtracted, a GOOD thing
  // (green, e.g. Signals 100 = no red flags — never a trophy); neutral = coverage cap.
  const c = tone === "neutral" ? "var(--ctx)" : tone === "calm" ? "var(--rec)" : "var(--high)";
  return (
    <div
      className="flex flex-col items-center rounded-md border px-2.5 py-1"
      style={{ borderColor: `color-mix(in oklch, ${c} 30%, transparent)`, background: `color-mix(in oklch, ${c} 10%, transparent)` }}
    >
      <span className="num text-[15px] font-semibold leading-none" style={{ color: c }}>
        −{value}
      </span>
      <span className="mt-1 text-center text-[8.5px] uppercase leading-tight tracking-wide text-ink3">{label}</span>
    </div>
  );
}

function ScoreComposition({ b, color }: { b: ScoreBreakdown; color: string }) {
  const q = Math.round(b.quality);
  const cD = Math.round(b.constructionDrag);
  const fD = Math.round(b.flagsDrag);
  const covD = Math.round(b.coverageDrag);
  const noFlags = b.flagsDrag < 0.05; // Signals 100 → subtracted nothing (calm, not a peak)
  const noConstr = b.constructionDrag < 0.05;

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="kicker">How your score is built</p>
        <p className="text-[10px] text-ink3">quality, less deductions</p>
      </div>

      {/* the equation: anchor − deductions = composite */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-col">
          <span className="num text-[30px] font-semibold leading-none" style={{ color: "var(--p-found)" }}>
            {q}
          </span>
          <span className="mt-1 text-[8.5px] uppercase tracking-wide text-ink3">quality · anchor</span>
        </div>
        <Deduction label="construction" value={cD} tone={noConstr ? "calm" : "drag"} />
        <Deduction label={noFlags ? "no active flags" : "active flags"} value={fD} tone={noFlags ? "calm" : "drag"} />
        {covD > 0 && <Deduction label="coverage cap" value={covD} tone="neutral" />}
        <span className="text-[18px] font-medium text-ink3">=</span>
        <div className="flex flex-col">
          <span className="num text-[30px] font-semibold leading-none" style={{ color }}>
            {b.composite}
          </span>
          <span className="mt-1 text-[8.5px] uppercase tracking-wide text-ink3">health</span>
        </div>
      </div>

      {/* waterfall — the composite (band colour) plus each deduction tail sum to the
          Quality anchor, so the subtraction is visible, not implied */}
      <div className="mt-3.5 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        <div style={{ flex: Math.max(b.composite, 0.001), background: color }} title={`Portfolio health ${b.composite}`} />
        {b.constructionDrag >= 0.5 && (
          <div style={{ flex: b.constructionDrag, background: "var(--high)" }} title={`Construction −${cD}`} />
        )}
        {b.flagsDrag >= 0.5 && <div style={{ flex: b.flagsDrag, background: "var(--high)" }} title={`Active flags −${fD}`} />}
        {b.coverageDrag >= 0.5 && <div style={{ flex: b.coverageDrag, background: "var(--ctx)" }} title={`Coverage cap −${covD}`} />}
      </div>

      {/* plain-language reconciliation — the "ah, that makes sense" line */}
      <p className="mt-2.5 text-[11px] leading-relaxed text-ink3">
        Your holdings&apos; quality is <span className="num text-ink2">{q}</span> — where the score starts.{" "}
        {noConstr ? (
          <>Construction takes off <span className="num text-ink2">nothing</span></>
        ) : (
          <>Construction (concentration &amp; breadth) takes off <span className="num" style={{ color: "var(--high)" }}>{cD}</span></>
        )}
        {"; "}
        {noFlags ? (
          <>with no active red flags, Signals subtracts <span className="num" style={{ color: "var(--rec)" }}>nothing</span></>
        ) : (
          <>active red flags subtract <span className="num" style={{ color: "var(--high)" }}>{fD}</span></>
        )}
        {covD > 0 && (
          <>; coverage holds it a further <span className="num" style={{ color: "var(--ctx)" }}>{covD}</span> back</>
        )}
        {" — landing at "}
        <span className="num" style={{ color }}>{b.composite}</span>.
      </p>
    </div>
  );
}

// ── an honest "no score yet" shell (pending OR construction-only) ──────────────
function BuildingCard({
  title,
  body,
  holdingsLen,
  unscored,
  capital,
}: {
  title: string;
  body: string;
  holdingsLen: number;
  unscored: number;
  capital: PortfolioSnapshot | null;
}) {
  return (
    <div className={CARD}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="font-display text-[20px] font-semibold text-ink">{title}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink2">{body}</p>
          {holdingsLen > 0 && unscored > 0 && (
            <p className="mt-2 text-[11.5px] text-ink3">
              {unscored} of {holdingsLen} holdings aren&apos;t scored yet.
            </p>
          )}
        </div>
        {capital && capital.totalValue > 0 && (
          <div className="w-full max-w-sm">
            <CapitalBar s={capital} />
          </div>
        )}
      </div>
    </div>
  );
}

export function HealthBand({
  snapshot,
  holdings,
  onOpenHealth,
}: {
  snapshot: PortfolioSnapshot | null;
  holdings: Holding[];
  onOpenHealth: () => void;
}) {
  const unscored = unscoredCount(holdings);

  // ── pending: no snapshot persisted yet (fresh book, before its first mutation /
  //    nightly rescore trigger landed). Honest preparing state — never a fake score. ──
  if (!snapshot) {
    return (
      <BuildingCard
        title="Your health read is preparing"
        body="Portfolio health is computed when your book changes or on the nightly refresh — not on the fly. It appears here once that lands; nothing is estimated in the meantime."
        holdingsLen={holdings.length}
        unscored={unscored}
        capital={null}
      />
    );
  }

  // ── construction-only: no scored holdings → honest building state (never a zero) ──
  if (snapshot.phs == null || !snapshot.evaluable) {
    return (
      <BuildingCard
        title="Your health read is building"
        body="None of your holdings are scored yet, so there's no portfolio health score to show — we don't invent one. Add holdings our engine covers (large- and mid-cap names in the scored universe) and a weighted read appears here, with exactly how much of your book it reflects."
        holdingsLen={holdings.length}
        unscored={unscored}
        capital={snapshot}
      />
    );
  }

  const band = snapshot.band!;
  const bandMeta = PHS_BAND_META[band];
  const color = phsColor(band);
  const coveragePct = Math.round(snapshot.coverage * 100);
  // Anchor + deductions decomposition of the SAME published numbers (non-null here: the
  // guard above returns early unless phs/quality exist → the book is evaluable).
  const breakdown = scoreBreakdown(snapshot);
  // Two DISTINCT reads, sourced from different fields — never crossed:
  //  • attention = SCORED holdings flagged weak (fragile / below-par) → "needs a look"
  //  • awaiting  = UNSCORED holdings → "awaiting coverage" (Vytal can't score them yet)
  const attention = attentionHoldings(holdings);
  const awaiting = holdings.filter((h) => h.health == null).map((h) => h.symbol);
  // Coverage findings (PV family) are already surfaced by the coverage line + badges +
  // the Awaiting-coverage list below, so they must NOT also read as the health synthesis
  // (that's what put "Awaiting-coverage names" above a scored attention name).
  const healthFindings = snapshot.firedFindings.filter((f) => f.family !== "PV");
  const synthesis = pickSynthesis(healthFindings);
  const otherFindings = healthFindings
    .filter((f) => f.loud && f.id !== synthesis?.id)
    .slice(0, 3);

  return (
    <div className={CARD}>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* PHS number + coverage honesty — together, the hero */}
        <div className="lg:border-r lg:border-line lg:pr-7">
          <p className="kicker mb-1.5">Weighted portfolio health</p>
          <div className="flex items-end gap-3">
            <span className="num text-[52px] font-semibold leading-none" style={{ color }}>
              {snapshot.phs}
            </span>
            <span className="font-display mb-1 text-[18px] font-semibold" style={{ color }}>
              {bandMeta.label}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {snapshot.provisional && (
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: TONE_META.Caution.color, background: TONE_META.Caution.bg }}
              >
                Provisional
              </span>
            )}
            {snapshot.ceilingApplied && (
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: TONE_META.Neutral.color, background: TONE_META.Neutral.bg }}
              >
                Coverage-capped
              </span>
            )}
          </div>
          <p className="mt-3 max-w-[22em] text-[11.5px] leading-relaxed text-ink3">
            Reflects <span className="num text-ink2">{coveragePct}%</span> of your book by value
            {unscored > 0 && (
              <>
                {" · "}
                <span className="num text-ink2">{unscored}</span> holding{unscored === 1 ? "" : "s"} not yet scored
              </>
            )}
            .
            {snapshot.ceilingApplied && snapshot.ceilingValue != null && (
              <>
                {" "}Held at <span className="num text-ink2">{snapshot.ceilingValue}</span> until more of your book is
                covered
                {snapshot.phsRaw != null && (
                  <> — the verified portion alone reads <span className="num text-ink2">{Math.round(snapshot.phsRaw)}</span></>
                )}
                .
              </>
            )}
          </p>
        </div>

        {/* capital bar + score composition (anchor − deductions, not three peers) */}
        <div className="flex flex-col gap-5">
          <CapitalBar s={snapshot} />
          {breakdown && <ScoreComposition b={breakdown} color={color} />}
        </div>
      </div>

      {/* synthesis read + findings (descriptive, tone as-is) */}
      {synthesis && <p className="diagnosis mt-5 border-t border-line pt-4 text-[15px]">{findingRead(synthesis)}</p>}
      {otherFindings.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {otherFindings.map((f) => {
            const tm = TONE_META[f.tone];
            return (
              <div
                key={f.id}
                className="flex items-start gap-2.5 rounded-lg border px-3 py-2 text-[12px] text-ink2"
                style={{ borderColor: tm.border, background: tm.bg }}
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: tm.color }} />
                <span>
                  <span className="font-medium text-ink">{f.label}.</span> {findingRead(f) !== f.label ? findingRead(f) : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* two distinct reads — scored attention vs unscored coverage — never crossed */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-col gap-2.5">
          {/* Needs a look — SCORED holdings flagged weak (e.g. RELIANCE, below par) */}
          {attention.count > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink2">
                <Icons.warning weight="fill" className="size-4" style={{ color: "var(--high)" }} />
                <span className="num font-medium text-ink">{attention.count}</span> need{attention.count === 1 ? "s" : ""} a look
              </span>
              {attention.names.slice(0, 6).map((sym) => (
                <span
                  key={sym}
                  className="num rounded-md border px-2 py-0.5 text-[11px]"
                  style={{ color: "var(--high)", borderColor: "var(--high-bd)", background: "var(--high-bg)" }}
                >
                  {sym}
                </span>
              ))}
            </div>
          )}
          {/* Awaiting coverage — UNSCORED holdings (e.g. 360ONE). Neutral, not a warning. */}
          {awaiting.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink2">
                <span className="size-2 rounded-full" style={{ background: "var(--ctx)" }} />
                <span className="num font-medium text-ink">{awaiting.length}</span> awaiting coverage
              </span>
              {awaiting.slice(0, 6).map((sym) => (
                <span
                  key={sym}
                  className="num rounded-md border border-line2 bg-surface-2 px-2 py-0.5 text-[11px] text-ink2"
                >
                  {sym}
                </span>
              ))}
              <span className="text-[11px] text-ink3">not scored yet</span>
            </div>
          )}
          {/* both empty → an honest positive note, not a mislabelled group */}
          {attention.count === 0 && awaiting.length === 0 && (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink2">
              <Icons.check weight="bold" className="size-4" style={{ color: "var(--rec)" }} />
              Every holding is scored and in a sound band.
            </span>
          )}
        </div>
        <Funnel onClick={onOpenHealth}>Open portfolio health</Funnel>
      </div>
    </div>
  );
}
