"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import type { Holding, HoldingsTotals, PfFinding, PortfolioDisclosure, PortfolioSnapshot } from "@/types/portfolio";
import type { PortfolioTab } from "../tabs";
import { BLUEPRINT_ACCENT, constructionColor, healthColor } from "../lib";
import { HeroSection } from "./hero";
import { StoryBlock, NullStoryNote } from "./story-block";
import { HealthHistoryChart } from "../health-history-chart";
import { HealthReadBody } from "./health-read";
import { ConstructionReadBody } from "./construction-read";
import { CoverageUnlockSection } from "./coverage";
import { PdDisclosures } from "./disclosures";
import { HoldingsSection } from "./holdings";

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO HEALTH TAB — the two-read teaching surface. One snapshot yields two named
// reads; `headlineSlot` decides who leads. Health owns the hero whenever it exists (the
// moat); a 0-scored book is a confident Construction read, not a half-built page. Everything
// READS the stored snapshot + holdings — no score, pillar, band, ledger or finding is
// recomputed here. The only client math is labelled display arithmetic (bar widths).
// ─────────────────────────────────────────────────────────────────────────────

const CARD = "rounded-2xl border border-line bg-surface-1 p-5 sm:p-6";

// ── the ONE honest empty state — no snapshot persisted yet (never a fabricated score) ──
function PreparingState() {
  return (
    <div className="flex flex-col pb-4">
      <SectionEyebrow label="How healthy your book is" icon={Icons.pulse} accent="var(--p-found)" />
      <div className={CARD}>
        <p className="font-display text-[20px] font-medium text-ink">Your health read is preparing</p>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink2">
          Portfolio health is computed when your book changes or on the nightly refresh — not on the fly. It appears here
          once that lands; nothing is estimated in the meantime.
        </p>
      </div>
    </div>
  );
}

function Provenance({ snapshot }: { snapshot: PortfolioSnapshot }) {
  return (
    <p className="mt-6 border-t border-line pt-4 text-[11px] leading-relaxed text-ink3">
      Read-only over your stored health snapshot — every score, penalty, ledger line and finding is computed server-side
      (portfolio-spec {snapshot.constantVersion}) and rendered here as-is; nothing on this tab is recomputed, predicted, or
      advice. As of {new Date(snapshot.asOf).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
    </p>
  );
}

/**
 * Portfolio HEALTH — the two-read teaching surface. Read-only over the stored snapshot +
 * per-holding health. `onOpenTab` funnels concentration/breadth findings to Holdings.
 */
export function HealthTab({
  snapshot,
  holdings,
  disclosure,
  referenceFindings,
  onOpenTab,
}: {
  snapshot: PortfolioSnapshot | null;
  holdings: Holding[];
  totals: HoldingsTotals;
  disclosure?: PortfolioDisclosure;
  /** (Stage 10a) The PD family — served BESIDE the snapshot on the response, threaded here from the hub.
   *  Reference-only, always-on; rendered in its own "what we can't tell you" section. */
  referenceFindings?: PfFinding[];
  onOpenTab?: (t: PortfolioTab) => void;
}) {
  // pending: no snapshot persisted yet (fresh book, before its first mutation / rescore)
  if (!snapshot) return <PreparingState />;

  const hasHealth = snapshot.healthRead != null;
  const healthAccent = healthColor(snapshot.healthRead?.band ?? null);
  const constructionAccent = hasHealth ? BLUEPRINT_ACCENT : constructionColor(snapshot.constructionRead.band);

  return (
    <div className="flex flex-col pb-4">
      {/* the story — the read on your book, as a designed object (or the calm null-story note when the
          book was scored before the story engine). Renders above everything; nothing below depends on it. */}
      <SectionEyebrow
        label="The read on your book"
        pill="the story"
        icon={Icons.pulse}
        accent={healthAccent}
      />
      <Reveal>
        {snapshot.story ? <StoryBlock snapshot={snapshot} /> : <NullStoryNote />}
      </Reveal>

      {/* the hero — the resolver fills the slot: health when it exists, else construction */}
      {hasHealth ? (
        <SectionEyebrow
          label="Two reads of your book"
          pill="health · construction"
          icon={Icons.pulse}
          accent={healthAccent}
        />
      ) : (
        <SectionEyebrow
          label="How your book is built"
          pill="structure & stage"
          icon={Icons.chartBar}
          accent={constructionAccent}
        />
      )}
      <Reveal>
        <HeroSection snapshot={snapshot} holdings={holdings} />
      </Reveal>

      {/* the history — the same two reads, over time. Read-only over portfolio_score_history;
          a young, fills-forward series (the chart owns its own controls + honest-sparse states). */}
      <SectionEyebrow
        label="How your scores have moved"
        pill="health · construction"
        icon={Icons.chartLine}
        accent={healthAccent}
      />
      <Reveal>
        <div className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
          <HealthHistoryChart />
        </div>
      </Reveal>

      {/* the health read — only when there's a scored book */}
      {hasHealth && (
        <>
          <SectionEyebrow
            label="Are the things you own sound?"
            pill="quality − flags"
            icon={Icons.pulse}
            accent={healthAccent}
          />
          <Reveal>
            <HealthReadBody snapshot={snapshot} holdings={holdings} onOpenTab={onOpenTab} />
          </Reveal>
        </>
      )}

      {/* the construction read — always present (its own question, blueprint identity) */}
      <SectionEyebrow
        label="Is this book safely held?"
        pill="structure & shape"
        icon={Icons.chartBar}
        accent={BLUEPRINT_ACCENT}
      />
      <Reveal>
        <ConstructionReadBody snapshot={snapshot} holdings={holdings} onOpenTab={onOpenTab} />
      </Reveal>

      {/* coverage & unlock — confidence, never a scare; prominent when there's no health yet */}
      <SectionEyebrow
        label={hasHealth ? "How much of your book we can see" : "Unlock your health read"}
        pill="coverage & confidence"
        icon={Icons.eye}
        accent={BLUEPRINT_ACCENT}
      />
      <Reveal>
        <CoverageUnlockSection snapshot={snapshot} holdings={holdings} disclosure={disclosure} onOpenTab={onOpenTab} />
      </Reveal>

      {/* disclosures (PD) — what we can't tell you about THIS book. Reference-only, unsuppressible;
          served beside the snapshot. Its own section, distinct from findings (it describes our data). */}
      {referenceFindings && referenceFindings.length > 0 && (
        <>
          <SectionEyebrow
            label="What we can't tell you about this book"
            pill="disclosures"
            icon={Icons.warning}
            accent={BLUEPRINT_ACCENT}
          />
          <Reveal>
            <PdDisclosures findings={referenceFindings} />
          </Reveal>
        </>
      )}

      {/* holdings floor — one row per issuer, combined across accounts (matches Construction); attention
          names lead; expand for per-stock evidence; link out */}
      <SectionEyebrow
        label="Your Combined Holdings"
        pill="combined across accounts · attention leads"
        icon={Icons.portfolio}
        accent="#4ea1e6"
      />
      <Reveal>
        <HoldingsSection snapshot={snapshot} holdings={holdings} />
      </Reveal>

      <Provenance snapshot={snapshot} />
    </div>
  );
}
