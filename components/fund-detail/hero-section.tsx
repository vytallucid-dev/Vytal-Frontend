"use client";

import { DeclinedCell, ReasonChip } from "./shared";
import { toNum, fmtFractionPct, fmtScalePct, hasEnoughRolling, omit } from "@/lib/fund-format";
import type { FundAnalytics } from "@/types/fund";

type Horizon = "y3" | "y1" | "m6";

const HORIZON_META: Record<Horizon, { sub: string; foot: string; label: string }> = {
  y3: { sub: "a year, over 3 years", foot: "annualised · not a total", label: "over three years" },
  y1: { sub: "over the past year", foot: "not annualised", label: "over the past year" },
  m6: { sub: "over the past 6 months", foot: "not annualised", label: "over the past six months" },
};

const DD_OMISSION_KEY: Record<Horizon, string> = {
  y3: "max_drawdown_3y",
  y1: "max_drawdown_1y",
  m6: "max_drawdown_1y", // no 6m drawdown column exists — closest honest fallback
};

function pickReturn(a: FundAnalytics): { horizon: Horizon; value: number } | null {
  const y3 = toNum(a.returns.y3Cagr);
  if (y3 !== null) return { horizon: "y3", value: y3 };
  const y1 = toNum(a.returns.y1);
  if (y1 !== null) return { horizon: "y1", value: y1 };
  const m6 = toNum(a.returns.m6);
  if (m6 !== null) return { horizon: "m6", value: m6 };
  return null;
}

export function HeroSection({ analytics }: { analytics: FundAnalytics }) {
  const picked = pickReturn(analytics);
  const n = analytics.rolling1y.n;
  const pctPositive = toNum(analytics.rolling1y.pctPositive);
  const consistencyOk = hasEnoughRolling(n) && pctPositive !== null;

  const ddValue = picked ? toNum(
    picked.horizon === "y3" ? analytics.risk.maxDrawdown3y
      : picked.horizon === "y1" ? analytics.risk.maxDrawdown1y
      : analytics.risk.maxDrawdown1y,
  ) : null;

  return (
    <div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {/* ── RETURN ── */}
        {picked ? (
          <div className="flex min-h-[168px] flex-col bg-surface-1 p-5">
            <div className="eyebrow mb-3">Return</div>
            <div className={`num text-[34px] font-medium leading-none tracking-tight ${picked.value >= 0 ? "text-success" : "text-danger"}`}>
              {fmtFractionPct(picked.value)}
            </div>
            <div className="mt-2.5 text-[12px] leading-relaxed text-ink2">{HORIZON_META[picked.horizon].sub}</div>
            <div className="num mt-auto pt-3 text-[11px] text-ink3">{HORIZON_META[picked.horizon].foot}</div>
          </div>
        ) : (
          <DeclinedCell
            label="Return"
            code={omit(analytics.omissions, "ret_6m")?.code ?? "insufficient_history"}
            reason={omit(analytics.omissions, "ret_6m")?.reason ?? "Not enough NAV history to measure a return yet."}
          />
        )}

        {/* ── WORST FALL ── */}
        {picked && ddValue !== null ? (
          <div className="flex min-h-[168px] flex-col bg-surface-1 p-5">
            <div className="eyebrow mb-3">Worst fall</div>
            <div className="num text-[34px] font-medium leading-none tracking-tight text-danger">
              {fmtFractionPct(ddValue)}
            </div>
            <div className="mt-2.5 text-[12px] leading-relaxed text-ink2">
              from its peak, {HORIZON_META[picked.horizon].label}
            </div>
            <div className="num mt-auto pt-3 text-[11px] text-ink3">peak → trough</div>
          </div>
        ) : (
          <DeclinedCell
            label="Worst fall"
            code={omit(analytics.omissions, picked ? DD_OMISSION_KEY[picked.horizon] : "max_drawdown_1y")?.code ?? "insufficient_history"}
            reason={
              omit(analytics.omissions, picked ? DD_OMISSION_KEY[picked.horizon] : "max_drawdown_1y")?.reason ??
              "Not enough NAV history to measure a drawdown yet."
            }
          />
        )}

        {/* ── CONSISTENCY ── */}
        {consistencyOk ? (
          <div className="flex min-h-[168px] flex-col bg-surface-1 p-5">
            <div className="eyebrow mb-3">Consistency</div>
            <div className="num text-[34px] font-medium leading-none tracking-tight text-ink">
              {fmtScalePct(pctPositive, 0)}
            </div>
            <div className="mt-2.5 text-[12px] leading-relaxed text-ink2">of rolling 1-year windows ended up</div>
            <div className="num mt-auto pt-3 text-[11px] text-ink3">n = {n?.toLocaleString("en-IN")} windows</div>
          </div>
        ) : n === null ? (
          <DeclinedCell
            label="Consistency"
            code={omit(analytics.omissions, "roll_1y")?.code ?? "insufficient_history"}
            reason={omit(analytics.omissions, "roll_1y")?.reason ?? "Not enough NAV history for a single rolling one-year window yet."}
          />
        ) : (
          <DeclinedCell
            label="Consistency"
            code="insufficient_rolling_windows"
            reason={`Only ${n.toLocaleString("en-IN")} rolling one-year window${n === 1 ? "" : "s"} exist${n === 1 ? "s" : ""} so far — too few for a percentage to mean anything yet.`}
          />
        )}
      </div>

      <HeroSentence analytics={analytics} picked={picked} ddValue={ddValue} consistencyOk={consistencyOk} n={n} pctPositive={pctPositive} />
    </div>
  );
}

function HeroSentence({
  analytics,
  picked,
  ddValue,
  consistencyOk,
  n,
  pctPositive,
}: {
  analytics: FundAnalytics;
  picked: { horizon: Horizon; value: number } | null;
  ddValue: number | null;
  consistencyOk: boolean;
  n: number | null;
  pctPositive: number | null;
}) {
  if (!picked) return null;

  const retTxt = fmtFractionPct(picked.value);
  const ddTxt = ddValue !== null ? fmtFractionPct(Math.abs(ddValue), 1, false) : null;
  const horizonLabel = HORIZON_META[picked.horizon].label; // "over three years" | "over the past year" | "over the past six months"

  // Only ret3yCagr is a genuine annualised RATE ("a year, over 3 years"). ret1y numerically
  // covers exactly one year, so "a year" still reads true; ret6m is a 6-month total and must
  // never be dressed up as an annual figure.
  const lead =
    picked.horizon === "y3" ? (
      <>
        {horizonLabel[0].toUpperCase() + horizonLabel.slice(1)} this fund compounded at{" "}
        <b className="font-semibold text-ink">{retTxt} a year</b>
      </>
    ) : picked.horizon === "y1" ? (
      <>
        Over the past year this fund returned <b className="font-semibold text-ink">{retTxt}</b>
      </>
    ) : (
      <>
        Over the past six months this fund returned <b className="font-semibold text-ink">{retTxt}</b>
      </>
    );

  let tail: React.ReactNode;
  if (ddTxt && consistencyOk && n !== null && pctPositive !== null) {
    const posWindows = Math.round((pctPositive / 100) * n);
    tail = (
      <>
        {" "}but getting it meant holding through a <b>{ddTxt} fall</b>. Of the {n.toLocaleString("en-IN")} one-year
        stretches we could measure, <b>{posWindows.toLocaleString("en-IN")} ended higher</b> than they started.
      </>
    );
  } else if (ddTxt) {
    tail = (
      <>
        , and fell <b>{ddTxt}</b>{" "}
        at its worst. It hasn&apos;t existed long enough for us to say how often a one-year
        holding ended up.
      </>
    );
  } else {
    tail = ". Its drawdown and rolling consistency aren't measurable yet — see the reasons above.";
  }

  return (
    <p className="mt-4 text-[13.5px] leading-relaxed text-ink2">
      {lead}
      {tail}
    </p>
  );
}
