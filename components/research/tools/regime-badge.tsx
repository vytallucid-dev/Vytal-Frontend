"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 * THE REGIME BADGE — the sector's market phase, in the tool top bar, with an explainer behind it.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ── ★ THERE WAS NO LIVE REGIME PATH AT ALL ────────────────────────────────────────────────────────
 * `getRegimeByStock` existed with zero call sites. Regime resolved only inside the scoring batch, for
 * the findings that declare a dependency, stamped at THAT RUN's asOf. So a reader could see the phase
 * a finding fired under, frozen, and could not see the phase their sector is in NOW — while two of the
 * trajectory patterns (T3, T6) mean opposite things depending on exactly that.
 *
 * ── ⚠ NULL IS A FIRST-CLASS STATE AND HAS NO NUMERIC FALLBACK ────────────────────────────────────
 * When the price window is too short, too stale, or the stock sits in no peer group, there IS no
 * regime. The badge says so and the modal says why. There is no "assume Normal": a phase-conditional
 * reading rendered against an assumed phase is a claim with nothing behind it, and T3/T6 are exactly
 * the patterns where that claim would be strongest and most wrong.
 */

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { RegimeBadgeView } from "@/types/health";

const TONE: Record<string, { label: string; color: string }> = {
  HOT: { label: "Hot", color: "var(--high)" },
  NORMAL: { label: "Normal", color: "var(--ink2)" },
  STRESSED: { label: "Stressed", color: "var(--crit)" },
};

const pct = (f: number): string => `${f >= 0 ? "+" : ""}${(f * 100).toFixed(1)}%`;

export function RegimeBadge({ regime }: { regime: RegimeBadgeView | null }) {
  const [open, setOpen] = useState(false);
  if (!regime) return null;

  const t = regime.regime ? TONE[regime.regime] : null;
  const colour = t?.color ?? "var(--ink3)";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="What does market regime mean?"
        className="inline-flex items-center gap-1.5 rounded-lg border bg-surface-1 px-2.5 py-1.5 text-[11.5px] transition-colors hover:border-line3"
        style={{
          color: colour,
          borderColor: `color-mix(in oklab, ${colour} 33%, transparent)`,
        }}
      >
        <span className="size-[7px] rounded-full" style={{ background: colour }} />
        {t ? (
          <>
            <span>Regime: {t.label}</span>
            {regime.trailing6mo !== null && <span className="num text-ink2">{pct(regime.trailing6mo)}</span>}
            {regime.asOf && <span className="num text-ink3">as of {regime.asOf}</span>}
          </>
        ) : (
          // ⚠ Stated plainly. No number is shown because there is no number to show.
          <span>Regime: not established</span>
        )}
        <Icons.info className="h-3 w-3 opacity-50" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-6 sm:max-w-lg">
          <RegimeExplainer regime={regime} />
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * ★ THE EXPLAINER. NET-NEW COPY — no explainer for "regime" existed anywhere in the product.
 *
 * Written for a reader who has never met the term. Three things, in order: what it is, what it does
 * to the reading they are looking at right now, and what it does NOT do. The third is not optional —
 * regime changes how confidently a pattern reads, and a reader who takes it as a signal about the
 * market has learned the wrong thing from us.
 */
function RegimeExplainer({ regime }: { regime: RegimeBadgeView }) {
  const t = regime.regime ? TONE[regime.regime] : null;
  return (
    <div className="space-y-5">
      <div>
        <div className="kicker mb-2">Market regime</div>
        <h2 className="text-[19px] font-semibold text-ink">
          {t ? `This sector is running ${t.label.toLowerCase()}` : "This sector's phase could not be established"}
        </h2>
      </div>

      <section className="space-y-2.5 text-[13px] leading-relaxed text-ink2">
        <p>
          <span className="font-medium text-ink">What it is.</span> Regime is the phase the stock&apos;s{" "}
          <em>sector</em> has been in — not the stock&apos;s own performance. We take the sector&apos;s
          trailing six-month return and sort it into one of three phases: <strong>Hot</strong> when the
          sector has run hard, <strong>Stressed</strong> when it has fallen hard, and{" "}
          <strong>Normal</strong> in between. Every company in a sector carries the same regime, because
          it is a fact about the weather, not about the company.
        </p>

        <p>
          <span className="font-medium text-ink">Why we show it.</span> Some of the patterns on these
          pages were measured to behave <em>differently</em> depending on the phase — and in two cases,
          to reverse. In a hot sector, prices tend to rise regardless of the individual company, so a
          pattern that should read as a warning can read as nothing — or as the opposite. Without
          knowing the phase, you cannot tell which of those you are looking at.
        </p>

        <p>
          <span className="font-medium text-ink">What it changes about this reading.</span> It changes
          the wording, never whether something is shown. A pattern that fired still fired, and you still
          see it. What the phase decides is how much the reading is worth right now: whether we can tell
          you what this pattern did historically, whether we have to say the size of a move is flattered
          by the phase, or whether we have to tell you plainly that in this phase the evidence supports
          no direction at all. When that last one applies, the card says so instead of asserting
          something.
        </p>

        <p>
          <span className="font-medium text-ink">What it is not.</span> It is not a forecast, not a
          rating, and not a view on whether the sector is expensive. Hot does not mean sell and Stressed
          does not mean buy — a stressed sector is simply one where a fall has already happened. It also
          says nothing about this company: a strong business in a hot sector and a weak one in the same
          sector carry the identical regime.
        </p>
      </section>

      <section className="rounded-xl border border-line bg-surface-2 p-4">
        <div className="kicker mb-2.5">This reading</div>
        {t ? (
          <dl className="space-y-2 text-[12.5px]">
            <Row label="Phase" value={t.label} colour={t.color} />
            {regime.trailing6mo !== null && (
              <Row label="Sector return, trailing ~6 months" value={pct(regime.trailing6mo)} />
            )}
            <Row
              label="Measured from"
              value={
                regime.source === "index"
                  ? `the ${regime.indexName ?? "sector index"}`
                  : "the peer group's own members, equally weighted"
              }
            />
            {regime.asOf && <Row label="As of" value={regime.asOf} />}
            {/* A pg_pool reading carries a reason too — it says why no index was available. */}
            {regime.source === "pg_pool" && regime.reason && (
              <Row label="Why not an index" value={regime.reason} />
            )}
          </dl>
        ) : (
          <p className="text-[12.5px] leading-relaxed text-ink2">
            {/* ⚠ The honest empty. We say what is missing and we do not substitute a phase for it. */}
            We could not establish a phase for this sector
            {regime.reason ? <> — {regime.reason}</> : null}. Nothing on this page has been adjusted for
            phase as a result, and any pattern whose reading depends on the phase will say so on its own
            card rather than assume one.
          </p>
        )}
      </section>

      <p className="text-[11.5px] leading-relaxed text-ink3">
        Phases are cut at fixed thresholds on the trailing return and are recomputed as prices move, so
        a sector can change phase between one visit and the next. The date above is the last trading day
        included in the measurement.
      </p>
    </div>
  );
}

function Row({ label, value, colour }: { label: string; value: string; colour?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt className="text-ink3">{label}</dt>
      <dd className={cn("num text-right", colour ? "font-medium" : "text-ink")} style={colour ? { color: colour } : undefined}>
        {value}
      </dd>
    </div>
  );
}
