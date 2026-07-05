"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import type { Holding, HoldingsTotals, PortfolioSnapshot } from "@/types/portfolio";
import { PHS_BAND_META, TONE_META, phsColor, unscoredCount } from "../lib";
import { coverageFindings, deductionStory } from "./lib";
import { DeductionStorySection } from "./deduction-story";
import { FindingsSection, FindingRow } from "./findings";
import { ShapeSection } from "./shape";
import { HoldingsSection } from "./holdings";

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO HEALTH TAB — the teaching surface. Explanation-led: it opens with WHY the
// score is what it is (the deduction story off the real ledgers), then what the number
// hid (the PF library), then the book's shape, then the holdings with their per-stock
// evidence. Everything READS the stored snapshot + holdings — no score, penalty, pillar
// or PHS weight is recomputed here. Themed to the live stock-screener surface.
// ─────────────────────────────────────────────────────────────────────────────

const CARD = "rounded-xl border border-line bg-surface-1 p-5 sm:p-6";
const pct0 = (v: number) => `${Math.round(v)}%`;

// ── the capital-across-coverage bar (scored / awaiting / untracked — the safeguard) ──
function CoverageBar({ s }: { s: PortfolioSnapshot }) {
  const total = s.totalValue || 1;
  const segs = [
    { key: "scored", label: "Scored", val: s.scoredValue, color: "var(--c-pristine)" },
    { key: "recognized", label: "Awaiting coverage", val: s.recognizedUnscoredValue, color: "var(--ctx)" },
    { key: "small", label: "Untracked", val: s.smallUnscoredValue, color: "var(--ink3)" },
  ].filter((seg) => seg.val > 0);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="kicker">Your capital, across health coverage</p>
        <span className="text-[10.5px] text-ink3">% of book value</span>
      </div>
      <div className="flex h-7 gap-0.5 overflow-hidden rounded-lg">
        {segs.map((seg) => {
          const p = (seg.val / total) * 100;
          return (
            <div
              key={seg.key}
              className="num flex items-center justify-center text-[11px] font-medium"
              style={{ flex: Math.max(p, 2), background: seg.color, color: "#0a0b0e" }}
              title={`${seg.label} ${p.toFixed(1)}%`}
            >
              {p >= 9 ? `${Math.round(p)}%` : ""}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink2">
        {segs.map((seg) => (
          <span key={seg.key} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px]" style={{ background: seg.color }} />
            {seg.label} {pct0((seg.val / total) * 100)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── the header hero — the PHS number + coverage honesty (badges, %, ceiling note) ────
function HealthHero({ snapshot, holdings }: { snapshot: PortfolioSnapshot; holdings: Holding[] }) {
  const band = snapshot.band!;
  const bandMeta = PHS_BAND_META[band];
  const color = phsColor(band);
  const coveragePct = Math.round(snapshot.coverage * 100);
  const unscored = unscoredCount(holdings);

  return (
    <div className={CARD}>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
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
                {" "}Held at <span className="num text-ink2">{snapshot.ceilingValue}</span> until more of your book is covered
                {snapshot.phsRaw != null && (
                  <> — the verified portion alone reads <span className="num text-ink2">{Math.round(snapshot.phsRaw)}</span></>
                )}
                .
              </>
            )}
          </p>
        </div>
        <div className="flex items-center">
          <CoverageBar s={snapshot} />
        </div>
      </div>
    </div>
  );
}

// ── the coverage & confidence section — the PV-family findings carry the story; the
//    unscored / awaiting names are shown honestly, never faked. ────────────────────────
function CoverageSection({ snapshot, holdings }: { snapshot: PortfolioSnapshot; holdings: Holding[] }) {
  const pv = coverageFindings(snapshot.firedFindings);
  const awaiting = holdings.filter((h) => h.health == null);
  return (
    <div className={CARD}>
      <div className="mb-4">
        <CoverageBar s={snapshot} />
      </div>

      {pv.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {pv.map((f) => (
            <FindingRow key={f.id} f={f} />
          ))}
        </div>
      )}

      {awaiting.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink2">
            <span className="size-2 rounded-full" style={{ background: "var(--ctx)" }} />
            <span className="num font-medium text-ink">{awaiting.length}</span> awaiting coverage
          </span>
          {awaiting.map((h) => (
            <span key={h.symbol} className="num rounded-md border border-line2 bg-surface-2 px-2 py-0.5 text-[11px] text-ink2">
              {h.symbol}
            </span>
          ))}
          <span className="text-[11px] text-ink3">not scored yet — never faked into the number</span>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-[12px] text-ink2">
          <Icons.check weight="bold" className="size-4" style={{ color: "var(--rec)" }} />
          Every holding is scored — the number reflects your whole book.
        </div>
      )}
    </div>
  );
}

// ── honest shell for the two no-score states (pending · construction-only) ───────────
function BuildingState({ title, body, snapshot, holdings }: { title: string; body: string; snapshot: PortfolioSnapshot | null; holdings: Holding[] }) {
  const unscored = unscoredCount(holdings);
  return (
    <div className="flex flex-col pb-4">
      <SectionEyebrow label="How healthy your book is" icon={Icons.pulse} accent="var(--p-found)" />
      <div className={CARD}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="font-display text-[20px] font-semibold text-ink">{title}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink2">{body}</p>
            {holdings.length > 0 && unscored > 0 && (
              <p className="mt-2 text-[11.5px] text-ink3">
                {unscored} of {holdings.length} holdings aren&apos;t scored yet.
              </p>
            )}
          </div>
          {snapshot && snapshot.totalValue > 0 && (
            <div className="w-full max-w-sm">
              <CoverageBar s={snapshot} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Portfolio HEALTH — the teaching surface. Read-only over the stored snapshot (pillars,
 * both ledgers, PF findings) + per-holding health from the holdings read. No recompute.
 */
export function HealthTab({ snapshot, holdings }: { snapshot: PortfolioSnapshot | null; holdings: Holding[]; totals: HoldingsTotals }) {
  // pending: no snapshot persisted yet (fresh book, before its first mutation / nightly rescore)
  if (!snapshot) {
    return (
      <BuildingState
        title="Your health read is preparing"
        body="Portfolio health is computed when your book changes or on the nightly refresh — not on the fly. It appears here once that lands; nothing is estimated in the meantime."
        snapshot={null}
        holdings={holdings}
      />
    );
  }

  // construction-only: no scored holdings → honest building state (never a zero)
  if (snapshot.phs == null || !snapshot.evaluable || snapshot.band == null) {
    return (
      <BuildingState
        title="Your health read is building"
        body="None of your holdings are scored yet, so there's no portfolio health score to explain — we don't invent one. Add holdings our engine covers (large- and mid-cap names in the scored universe) and the full deduction story appears here."
        snapshot={snapshot}
        holdings={holdings}
      />
    );
  }

  const story = deductionStory(snapshot);
  const color = phsColor(snapshot.band);

  return (
    <div className="flex flex-col pb-4">
      {/* the hero — PHS + coverage honesty */}
      <SectionEyebrow label="How healthy your book is" pill="weighted · coverage-aware" icon={Icons.pulse} accent="var(--p-found)" />
      <Reveal>
        <HealthHero snapshot={snapshot} holdings={holdings} />
      </Reveal>

      {/* §1 · Why your score is {PHS} — the deduction story (leads) */}
      {story && (
        <>
          <SectionEyebrow label="Why your score is what it is" pill="anchor − deductions" icon={Icons.scales} accent="var(--high)" />
          <Reveal>
            <DeductionStorySection snapshot={snapshot} holdings={holdings} story={story} color={color} />
          </Reveal>
        </>
      )}

      {/* §2 · Headline findings — what the number hid */}
      <SectionEyebrow label="What the number hid" pill="the pattern library" icon={Icons.warning} accent="var(--p-mom)" />
      <Reveal>
        <FindingsSection findings={snapshot.firedFindings} />
      </Reveal>

      {/* Coverage & confidence — honest, PV-family findings carry the story */}
      <SectionEyebrow label="How much of your book we can see" pill="coverage & confidence" icon={Icons.shield} accent="var(--ctx)" />
      <Reveal>
        <CoverageSection snapshot={snapshot} holdings={holdings} />
      </Reveal>

      {/* §3 · The book's shape */}
      <SectionEyebrow label="The shape of what you hold" pill="concentration · breadth · sector" icon={Icons.sector} accent="var(--p-own)" />
      <Reveal>
        <ShapeSection snapshot={snapshot} holdings={holdings} />
      </Reveal>

      {/* §4 · Your holdings — depth, expand to per-stock LM/LP evidence */}
      <SectionEyebrow label="Your holdings" pill="attention names lead · expand for evidence" icon={Icons.portfolio} accent="var(--c-pristine)" />
      <Reveal>
        <HoldingsSection snapshot={snapshot} holdings={holdings} />
      </Reveal>

      {/* provenance — read-only over the stored snapshot */}
      <p className="mt-6 border-t border-line pt-4 text-[11px] leading-relaxed text-ink3">
        Read-only over your stored health snapshot — every pillar, penalty, ledger line and finding is computed server-side
        (portfolio-spec {snapshot.constantVersion}) and rendered here as-is; nothing on this tab is recomputed, predicted, or
        advice. As of {new Date(snapshot.asOf).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
      </p>
    </div>
  );
}
