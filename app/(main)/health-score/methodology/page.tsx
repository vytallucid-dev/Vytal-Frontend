"use client";

/**
 * /health-score/methodology — HOW THE HEALTH SCORE IS BUILT.
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * ★ THE ONE PROPERTY THIS PAGE HAS TO KEEP: IT MUST BE TRUE.
 *
 * The version this replaced described a nine-pillar model the engine does not run, and proved it
 * with a hand-typed HDFC row. Both are gone. The model copy now mirrors the engine's own constants
 * (lib/health-data.ts documents where each one lives), and the worked example is FETCHED — a real
 * snapshot for a real company, rendered exactly as it comes back.
 *
 * Consequences, and they are deliberate:
 *   · Nothing on this page is hand-authored except prose. No score, no band, no pillar value, no
 *     metric list. If the engine changes its mind about MARUTI, this page changes with it.
 *   · The page states NO metric count. "40+" was false; any replacement number is one more thing
 *     to drift. The worked example shows the real list for that company, which is the honest answer
 *     — the count differs by peer group and by what a company has actually filed.
 *   · The LOADING state renders no numeric placeholder. A skeleton shaped like a score ring with a
 *     grey number in it is a claim that a number is coming; if the fetch fails it was a lie. So the
 *     loader says what it is waiting for, in words, and occupies the space without pretending.
 *   · The UNSCORED / FAILED state does not hide. The model explanation above it is still true and
 *     still renders; only the example panel degrades, and it degrades by SAYING SO.
 *
 * ── TWO LAYERS (deliberate) ───────────────────────────────────────────────────────────────────
 * Everything above "How it works underneath" is the plain read: the four pillars and their ORDER,
 * five bands, peer-relative, quarterly. The expandable layer carries the three lenses,
 * redistribution, the pillar floor and neutral-hold. MECHANISM IS PUBLISHED; CALIBRATION IS NOT.
 *
 * ── ★ NO WEIGHT REACHES THIS PAGE, IN ANY FORM. (Operator ruling; reverses the earlier one.) ────
 * An earlier version printed the pillar weights as "35 · 25 · 20 · 20", as a per-card percentage,
 * as a bar drawn `width: {weight}%`, and as `subtotal × weight = contribution` rows that summed to
 * the composite. All four are gone, and the fourth was the worst: a contribution divided by its own
 * subtotal IS the weight, so the "showing our working" panel handed over the entire vector.
 *
 * ⚠ THE ORDER STILL SHIPS, AND MUST. Four pillars with nothing said about their relative pull reads
 * as four EQUAL pillars — false in a second direction, and the reading a reader reaches unprompted.
 * PILLAR_ORDER_NOTE carries it in words.
 *
 * SO: THIS PAGE MUST NEVER RENDER, even though the payload it fetches carries them all:
 *     pillar.appliedWeight · pillar.nominalWeight — nor any product, ratio or bar width using them
 *     metric.bars · metric.bandLadder · metric.lens.l1.referenceValue (those ARE the bars)
 *     metric.nominalWeight · metric.effectiveWeight · metric.contribution (per-metric weights)
 *     pillar.nativeZone (the weak/strong marks) · ownership penalty magnitudes
 * The test for anything new: could a reader recover a weight from what is on screen, alone or over
 * a handful of stocks? If yes, it does not go on the page.
 *
 * The metric drill-down shows WHICH metrics a pillar read, how each SCORED, and which way each of
 * the three lenses came out. That is the decomposition, and it is weight-free.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import {
  BAND_META,
  METRIC_BAND_META,
  PILLAR_META,
  Panel,
  PillarGauge,
  SectionEyebrow,
  clampPct,
  tint,
} from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import {
  BAND_DOCS,
  MECHANISM_DOCS,
  NOT_ADVICE_NOTE,
  PILLAR_DOCS,
  PILLAR_ORDER_NOTE,
  WORKED_EXAMPLE_SYMBOL,
} from "@/lib/health-data";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { cn } from "@/lib/utils";
import { getMarketSubLabel, getMetricLabel } from "@/lib/health/metric-labels";
import type {
  HealthSnapshotView,
  MetricView,
  PillarKey,
  PillarView,
} from "@/types/health";

// ── small helpers ───────────────────────────────────────────────────────────────────────────────

/** "2026-07-31" → "31 Jul 2026". Returns null for the empty string an unscored payload carries. */
function longDate(ymd: string): string | null {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** The lens words, as a reader reads them. No reference VALUES — those are the bars. */
const L1_WORD: Record<string, string> = {
  above_bar: "above the bar",
  below_bar: "below the bar",
  not_evaluable: "—",
};
const L2_WORD: Record<string, string> = {
  above_peer: "above peers",
  near_peer: "level with peers",
  below_peer: "below peers",
  not_evaluable: "—",
};
const L3_WORD: Record<string, string> = {
  improving: "improving",
  flat: "flat",
  declining: "declining",
  not_evaluable: "building history",
};

const PILLAR_ORDER: PillarKey[] = ["foundation", "momentum", "market", "ownership"];

/** "%" and "×" sit tight against the number; "days" reads as a word and needs the space.
 *  "ratio" is a unit-of-account, not something to print — a bare number is the right render. */
function formatUnit(unit?: string): string {
  if (!unit || unit === "ratio") return "";
  return unit === "%" || unit === "×" ? unit : ` ${unit}`;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════════════════════

export default function MethodologyPage() {
  return (
    <div className="mx-auto flex w-full min-w-0 flex-col gap-4 pb-12">
      <Hero />
      <PillarsSection />
      <BandsSection />
      <WorkedExample />
      <SecondLayer />
      <BoundaryNote />
      <Cta />
    </div>
  );
}

// ── hero ────────────────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line2 bg-surface-1 px-6 py-9 sm:px-9 sm:py-12">
      <Link
        href="/health-score"
        className="mb-6 inline-flex items-center gap-1.5 text-[12.5px] text-ink3 transition-colors hover:text-ink"
      >
        <Icons.caretRight className="size-3.5 rotate-180" />
        Back to Health Hub
      </Link>

      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-lg border" style={tint("var(--p-found)")}>
          <Icons.health weight="duotone" className="size-4" />
        </span>
        <span className="eyebrow">Methodology</span>
      </div>

      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-[2.4rem] sm:leading-[1.1]">
        How the <span className="text-primary">Health Score</span> is built
      </h1>

      <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-ink2 sm:text-sm">
        A Health Score is one number, 0–100, describing how sound a company looks right now. It is
        built from four pillars, each a 0–100 read of one dimension of the business, combined with
        fixed weights. Every reading is made against the company&apos;s own peer group, so a score
        means the same thing in pharma as it does in metals.
      </p>
      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-ink3">
        Below, the plain version first — the pillars, the bands, and a real company scored end to
        end. The mechanics underneath are one click further down.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { icon: Icons.stack, t: "Four pillars, fixed weights" },
          { icon: Icons.building, t: "Judged against peers" },
          { icon: Icons.refresh, t: "Re-read as companies file" },
        ].map(({ icon: Glyph, t }) => (
          <span
            key={t}
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink2"
          >
            <Glyph weight="duotone" className="size-3.5 text-primary" />
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

// ── the four pillars ────────────────────────────────────────────────────────────────────────────

function PillarsSection() {
  return (
    <section>
      <SectionEyebrow label="The four pillars" icon={Icons.stack} accent="var(--p-found)" />
      <p className="mb-5 max-w-2xl text-[13px] leading-relaxed text-ink2">
        They are not weighted equally. <strong className="font-medium text-ink">{PILLAR_ORDER_NOTE}</strong>{" "}
        Foundation leads because the business itself is the anchor — a company is what it is before
        it is what the market thinks of it. Whatever the split, it is fixed for every company and
        every sector: never tuned per stock, never fitted to a peer group.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PILLAR_DOCS.map((p, i) => {
          const meta = PILLAR_META[p.key];
          return (
            <Reveal key={p.key} delay={(i % 2) * 0.06}>
              <Panel className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl border" style={tint(meta.cssVar)}>
                      <p.icon weight="duotone" className="size-[1.15rem]" />
                    </span>
                    <div>
                      <h3 className={cn("font-display text-[15px] font-semibold", meta.text)}>{p.label}</h3>
                      <p className="text-[11.5px] text-ink3">{p.asks}</p>
                    </div>
                  </div>
                  {/* ⚠ ORDINAL, NEVER NUMERIC. This chip used to read "35%", and the bar that sat
                      below it was drawn `width: {weight}%` — a weight you could measure off the
                      screen with a ruler. Both are gone. The words carry the ordering; nothing
                      carries the magnitude. Cards render in weight order, which says it again. */}
                  <span
                    className="shrink-0 rounded-lg border px-2 py-1 text-[10.5px] font-medium"
                    style={tint(meta.cssVar, 10, 26)}
                  >
                    {p.pull}
                  </span>
                </div>

                <p className="mt-3 text-[13px] leading-relaxed text-ink2">{p.reads}</p>
                <p className="mt-2 border-t border-line pt-2 text-[12px] leading-relaxed text-ink3">
                  <span className="font-medium text-ink2">Not this: </span>
                  {p.notThis}
                </p>
              </Panel>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

// ── the five bands ──────────────────────────────────────────────────────────────────────────────

function BandsSection() {
  return (
    <section>
      <SectionEyebrow label="Reading the score" icon={Icons.scales} accent="var(--c-steady)" />
      <p className="mb-5 max-w-2xl text-[13px] leading-relaxed text-ink2">
        The 0–100 scale carries a band — a plain tier word. The cuts are the same for every company.
        A band summarises soundness now; it is never a verdict on the price.
      </p>

      <Reveal>
        <Panel className="p-0 sm:p-0">
          <ul className="divide-y divide-line">
            {BAND_DOCS.map((b) => {
              const meta = BAND_META[b.band === "below" ? "below_par" : b.band];
              return (
                <li key={b.band} className="flex flex-col gap-1.5 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                  <span className="flex shrink-0 items-center gap-2.5 sm:w-44">
                    <span className="size-2.5 rounded-full" style={{ background: meta.cssVar }} />
                    <span className={cn("font-display text-[14px] font-semibold", meta.text)}>{b.label}</span>
                  </span>
                  <span className="num shrink-0 text-[12.5px] text-ink3 sm:w-24">{b.range}</span>
                  <span className="text-[12.5px] leading-relaxed text-ink2">{b.meaning}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </Reveal>

      <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
        Boundaries include their lower number: a score of exactly 68 is Healthy, and 74 is Pristine.
        The band is derived from the full-precision score, so a 67.6 that displays as 68 is still
        Steady.
      </p>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// WORKED EXAMPLE — live.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function WorkedExample() {
  const { data, isLoading, isError } = useStockHealth(WORKED_EXAMPLE_SYMBOL);

  return (
    <section>
      <SectionEyebrow
        label="A worked example"
        icon={Icons.graph}
        accent="var(--p-mom)"
        pill={WORKED_EXAMPLE_SYMBOL}
        tip="This panel is not written by hand. It reads the same scored snapshot the stock's own page reads, so it can never describe a model we don't run."
      />
      <p className="mb-5 max-w-2xl text-[13px] leading-relaxed text-ink2">
        One real company, scored end to end. Every number below is read live from the same snapshot
        that powers {WORKED_EXAMPLE_SYMBOL}&apos;s own page — nothing here is typed in.
      </p>

      {isLoading ? (
        <ExamplePending />
      ) : isError || !data ? (
        <ExampleUnavailable
          title="The worked example isn't loading right now"
          body="We can't reach the scoring service, so there is no snapshot to show. Everything above this panel still describes how the score is built — this is the one part of the page that needs live data, and it would rather say nothing than show you a made-up company."
        />
      ) : !data.scored || !data.verdict ? (
        <ExampleUnscored view={data} />
      ) : (
        <ExampleScored view={data} />
      )}
    </section>
  );
}

/**
 * LOADING. No ring, no grey number, no bar-shaped block — a skeleton in the shape of a score is a
 * promise that a score is coming, and this panel is the one place on the page that can fail. It
 * holds its space and says what it is doing.
 */
function ExamplePending() {
  return (
    <Panel className="flex min-h-[13rem] flex-col items-center justify-center gap-3 text-center">
      <Icons.spinner weight="bold" className="size-5 animate-spin text-ink3" />
      <p className="text-[13px] text-ink2">
        Reading {WORKED_EXAMPLE_SYMBOL}&apos;s latest scored snapshot…
      </p>
      <p className="max-w-sm text-[11.5px] leading-relaxed text-ink3">
        This example is fetched, not stored on the page, so it always shows the current score rather
        than one written down at some point in the past.
      </p>
    </Panel>
  );
}

function ExampleUnavailable({ title, body }: { title: string; body: string }) {
  return (
    <Panel className="flex min-h-[13rem] flex-col items-center justify-center gap-2.5 text-center">
      <span className="grid size-9 place-items-center rounded-xl border" style={tint("var(--high)")}>
        <Icons.warningTriangle weight="duotone" className="size-[1.15rem]" />
      </span>
      <p className="font-display text-[15px] font-semibold text-ink">{title}</p>
      <p className="max-w-md text-[12.5px] leading-relaxed text-ink2">{body}</p>
    </Panel>
  );
}

/** The stock exists but carries no score. An honest, named state — never a blank or a zero. */
function ExampleUnscored({ view }: { view: HealthSnapshotView }) {
  const { identity } = view;
  return (
    <Panel className="flex min-h-[13rem] flex-col items-center justify-center gap-2.5 text-center">
      <span className="grid size-9 place-items-center rounded-xl border" style={tint("var(--ctx)")}>
        <Icons.info weight="duotone" className="size-[1.15rem]" />
      </span>
      <p className="font-display text-[15px] font-semibold text-ink">
        {identity.name || WORKED_EXAMPLE_SYMBOL} is not scored at the moment
      </p>
      <p className="max-w-md text-[12.5px] leading-relaxed text-ink2">
        {identity.coverageReason ||
          "A company scores only when enough of its filed data is present — Foundation available, and at least two pillars surviving. Below that, Vytal records it as unscored rather than publishing a number built from scraps."}
      </p>
      <p className="max-w-md text-[11.5px] leading-relaxed text-ink3">
        That is the same state described under “A thin pillar is dropped rather than guessed” below.
        You are looking at it happen.
      </p>
    </Panel>
  );
}

function ExampleScored({ view }: { view: HealthSnapshotView }) {
  const [openPillar, setOpenPillar] = useState<PillarKey | null>(null);
  const { identity, verdict } = view;
  const v = verdict!;

  const pillars = PILLAR_ORDER.map((k) => view.pillars.find((p) => p.pillar === k)).filter(
    (p): p is PillarView => Boolean(p),
  );
  const asOf = longDate(identity.asOfDate);
  const bandMeta = BAND_META[v.label.band];
  // ⚠ NO contributionOf / NO total. A per-pillar contribution divided by its own subtotal IS that
  // pillar's weight — showing four of them alongside four subtotals hands over the whole vector.
  // The panel shows each pillar's raw 0–100 read and the finished composite, and nothing between.
  const anyRedistributed = pillars.some((p) => p.state !== "scored");

  return (
    <Reveal>
      <Panel>
        {/* header — identity, period AND date */}
        <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-4">
            <HealthRing score={v.composite} size={104} strokeWidth={9} color={bandMeta.cssVar} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="num text-[15px] font-semibold text-ink">{identity.symbol}</span>
                <span
                  className={cn("rounded-md border px-2 py-0.5 text-[11px] font-medium", bandMeta.text)}
                  style={tint(bandMeta.cssVar, 10, 30)}
                >
                  {bandMeta.label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[13px] text-ink2">{identity.name}</p>
              <p className="mt-0.5 text-[11.5px] text-ink3">
                {identity.sector?.displayName ?? "Sector not classified"}
                {identity.peerGroup ? ` · ${identity.peerGroup.name}` : ""}
              </p>
              <p className="num mt-1.5 text-[11.5px] text-ink3">
                {identity.periodKey}
                {asOf ? ` · as of ${asOf}` : ""}
              </p>
            </div>
          </div>

          <p className="text-[12.5px] leading-relaxed text-ink2 sm:ml-auto sm:max-w-xs">
            Four pillar reads, blended by weight into the score above. Nothing is added on top of
            that blend — no adjustment, no override, no manual touch.
          </p>
        </div>

        {/* the four reads — raw 0–100 subtotals, in weight order. No products, no running total. */}
        <div className="mt-5 flex flex-col gap-2">
          {pillars.map((p) => (
            <PillarRow
              key={p.pillar}
              p={p}
              open={openPillar === p.pillar}
              onToggle={() => setOpenPillar(openPillar === p.pillar ? null : p.pillar)}
            />
          ))}
        </div>

        {/* the result */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-line2 bg-surface-2 px-4 py-3">
          <span className="text-[13px] font-medium text-ink2">
            Health Score
            <span className="ml-1.5 text-[11.5px] font-normal text-ink3">weighted blend of the four</span>
          </span>
          <span className="num text-[17px] font-semibold" style={{ color: bandMeta.cssVar }}>
            {v.composite.toFixed(1)}
          </span>
        </div>

        {/* ★ SAY THIS OUT LOUD. Four numbers above a fifth that is not their sum reads as an
            arithmetic error unless you name it. It is not an error — it is a weighted blend with
            the weights withheld, and a reader deserves to be told that rather than left to
            wonder whether the page can add up. */}
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink3">
          The four pillar reads above will not add up to {v.composite.toFixed(1)}, and they are not
          meant to — the score is a <em>weighted</em> blend, so each read counts for more or less
          than the others.{" "}
          {anyRedistributed
            ? "One pillar could not be scored here and was removed from the blend, with its weight shared across the rest."
            : PILLAR_ORDER_NOTE}
        </p>

        {v.divergence.flag !== "none" && v.divergence.high && v.divergence.low && (
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
            The four don&apos;t agree here — {PILLAR_META[v.divergence.high.pillar].label} reads{" "}
            {Math.round(v.divergence.high.subtotal)} while{" "}
            {PILLAR_META[v.divergence.low.pillar].label} reads{" "}
            {Math.round(v.divergence.low.subtotal)}. One number can be reached from very different
            mixes, which is why the pillars are shown and not just the total.
          </p>
        )}

        <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
          Open a pillar to see which metrics it read and how each one scored. What is not published,
          here or anywhere: how the four pillars are weighted against each other, how the metrics
          inside a pillar are weighted, and the thresholds each metric is measured against. Those
          are the part of the model Vytal keeps.
        </p>
      </Panel>
    </Reveal>
  );
}

// ── one pillar row, with its drill-down ─────────────────────────────────────────────────────────

/**
 * One pillar's RAW 0–100 read. ⚠ It deliberately shows no weight, no `subtotal × weight`, and no
 * contribution — a contribution and a subtotal together give up the weight by division, which is
 * the whole reason this row was rewritten. What it does show is the pillar's own score, which is a
 * fact about the company, and whether the pillar was scored at all, which is a fact about our data.
 */
function PillarRow({ p, open, onToggle }: { p: PillarView; open: boolean; onToggle: () => void }) {
  const meta = PILLAR_META[p.pillar];
  const dropped = p.state !== "scored";
  const doc = PILLAR_DOCS.find((d) => d.key === p.pillar);
  const hasDetail = Boolean(p.metrics?.length || p.marketSubs?.length || p.ownership);

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <button
        type="button"
        onClick={hasDetail ? onToggle : undefined}
        disabled={!hasDetail}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
          hasDetail ? "hover:bg-surface-2" : "cursor-default",
        )}
      >
        {/* ⚠ A dropped pillar gets NO gauge. Drawing an empty ring with a "0" in it is a score of
            zero on screen, and zero is a claim we did not earn — the whole point of redistribution
            is that we removed the pillar instead of scoring it badly. */}
        {dropped ? (
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-dashed border-line2 text-ink3">
            <Icons.close weight="bold" className="size-3.5" />
          </span>
        ) : (
          <PillarGauge score={p.subtotal} color={meta.cssVar} size={44} strokeWidth={5} />
        )}

        <span className="min-w-0 flex-1">
          <span className={cn("block text-[13.5px] font-medium", dropped ? "text-ink3" : meta.text)}>
            {meta.label}
          </span>
          <span className="block text-[11.5px] text-ink3">
            {dropped
              ? "Not available — removed from the blend, its weight shared across the others"
              : (doc?.asks ?? "")}
          </span>
        </span>

        <span
          className="num shrink-0 text-right text-[13.5px] font-semibold"
          style={{ color: dropped ? "var(--ink3)" : meta.cssVar }}
        >
          {dropped ? "—" : p.subtotal.toFixed(1)}
        </span>

        {hasDetail && (
          <Icons.caretDown
            className={cn("size-3.5 shrink-0 text-ink3 transition-transform", open && "rotate-180")}
          />
        )}
      </button>

      {open && hasDetail && (
        <div className="border-t border-line bg-surface-2/50 px-3 py-3">
          <PillarDetail p={p} />
        </div>
      )}
    </div>
  );
}

function PillarDetail({ p }: { p: PillarView }) {
  if (p.metrics?.length) {
    return (
      <>
        <p className="mb-2.5 text-[11.5px] text-ink3">
          The {p.metrics.length} metric{p.metrics.length === 1 ? "" : "s"} this pillar read for this
          company, each scored 0–100 and each checked three ways.
        </p>
        <div className="flex flex-col gap-1.5">
          {p.metrics.map((m) => (
            <MetricRow key={m.metricKey} m={m} />
          ))}
        </div>
      </>
    );
  }

  if (p.marketSubs?.length) {
    return (
      <>
        <p className="mb-2.5 text-[11.5px] text-ink3">
          What the price read looked at. Each component is scored on its own; an unavailable one is
          named rather than filled in.
        </p>
        <div className="flex flex-col gap-1.5">
          {p.marketSubs.map((s) => {
            const label = getMarketSubLabel(s.subComponent).label;
            return (
              <div
                key={s.subComponent}
                className="flex items-center gap-3 rounded-md bg-surface-1 px-2.5 py-1.5"
              >
                <span className="num shrink-0 text-[10px] uppercase tracking-wider text-ink3">
                  {s.subComponent}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-ink2">{label}</span>
                {s.available && s.score !== null ? (
                  <span className="num shrink-0 text-[12px] font-medium text-ink">
                    {Math.round(s.score)}
                  </span>
                ) : (
                  <span className="shrink-0 text-[10.5px] italic text-ink3">
                    {s.reason ?? "not available"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  if (p.ownership) {
    return (
      <>
        <p className="mb-2.5 text-[11.5px] text-ink3">
          Ownership is read from filed shareholding disclosures rather than a metric list. Each
          class of owner is followed separately; where a feed carries nothing for this company, that
          is recorded rather than scored as neutral-by-default.
        </p>
        <div className="flex flex-col gap-1.5">
          {p.ownership.flowCategories.map((f) => (
            <div key={f.category} className="flex items-center gap-3 rounded-md bg-surface-1 px-2.5 py-1.5">
              <span className="min-w-0 flex-1 text-[12px] text-ink2">{FLOW_LABEL[f.category]}</span>
              <span
                className={cn(
                  "shrink-0 text-[10.5px]",
                  f.categoryState === "scored" ? "text-ink2" : "italic text-ink3",
                )}
              >
                {f.categoryState === "scored"
                  ? (f.trendState ?? "read")
                  : f.categoryState === "dormant_no_feed"
                    ? "no feed"
                    : "no data filed"}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return null;
}

const FLOW_LABEL: Record<string, string> = {
  A_promoter: "Promoter holding & pledging",
  B_institutional: "Institutional participation",
  C_insider: "Insider transactions",
  D_block: "Block & bulk deals",
};

/**
 * One metric. Shows WHAT it is, its raw value, its 0–100 score and the three lens verdicts.
 * ⚠ Deliberately withheld: the bar (l1.referenceValue), the band ladder, the weights and the
 * contribution. See the file header — this page publishes the mechanism, not the calibration.
 */
function MetricRow({ m }: { m: MetricView }) {
  const meta = getMetricLabel(m.metricKey);
  const scored = m.scoreState === "scored" && m.metricScore !== null;
  const bandMeta = m.l1Band ? METRIC_BAND_META[m.l1Band] : null;

  return (
    <div className="rounded-md bg-surface-1 px-2.5 py-2">
      <div className="flex items-center gap-3">
        <span className="num shrink-0 text-[10px] uppercase tracking-wider text-ink3">{m.metricKey}</span>
        <span className="min-w-0 flex-1 truncate text-[12px] text-ink2">{meta.label}</span>

        {m.rawValue !== null && (
          <span className="num shrink-0 text-[11px] text-ink3">
            {m.rawValue.toFixed(2)}
            {formatUnit(meta.unit)}
          </span>
        )}

        {scored ? (
          <span className={cn("num shrink-0 text-[11.5px] font-medium", bandMeta ? bandMeta.text : "text-ink")}>
            {Math.round(clampPct(m.metricScore as number))}
          </span>
        ) : (
          <span className="shrink-0 text-[10.5px] italic text-ink3">
            {m.scoreState === "neutral_hold" ? "held neutral" : "not scored"}
          </span>
        )}
      </div>

      {m.lens && (
        <div className="mt-1.5 flex flex-wrap gap-1.5 pl-[calc(2.5rem+0.75rem)]">
          <LensWord label="vs bar" word={L1_WORD[m.lens.l1.state] ?? "—"} muted={!m.lens.l1.evaluable} />
          <LensWord label="vs peers" word={L2_WORD[m.lens.l2.state] ?? "—"} muted={!m.lens.l2.evaluable} />
          <LensWord label="vs own history" word={L3_WORD[m.lens.l3.state] ?? "—"} muted={!m.lens.l3.evaluable} />
        </div>
      )}
    </div>
  );
}

function LensWord({ label, word, muted }: { label: string; word: string; muted?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded bg-surface-3 px-1.5 py-0.5 text-[10px]">
      <span className="text-ink3">{label}</span>
      <span className={cn(muted ? "italic text-ink3" : "font-medium text-ink2")}>{word}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// SECOND LAYER — the mechanics, behind one click.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function SecondLayer() {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <SectionEyebrow label="How it works underneath" icon={Icons.cpu} accent="var(--p-own)" />
      <p className="mb-4 max-w-2xl text-[13px] leading-relaxed text-ink2">
        Enough to check our reasoning, and to know what a score does when the data is thin. What is
        not here: the thresholds each metric is measured against, the weights inside a pillar, and
        the levels at which a finding fires. Those are the part of the model we keep.
      </p>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface-1 px-4 py-3 text-left transition-colors hover:border-line2 hover:bg-surface-2"
      >
        <Icons.caretDown
          weight="bold"
          className={cn("size-4 shrink-0 text-primary transition-transform", open && "rotate-180")}
        />
        <span className="flex-1 text-[13.5px] font-medium text-ink">
          {open ? "Hide the mechanics" : "Show the mechanics"}
        </span>
        <span className="num text-[11.5px] text-ink3">{MECHANISM_DOCS.length} things it does</span>
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MECHANISM_DOCS.map((d, i) => (
            <Reveal key={d.id} delay={(i % 2) * 0.05}>
              <Panel className="h-full">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg border" style={tint("var(--p-own)")}>
                    <d.icon weight="duotone" className="size-4" />
                  </span>
                  <h3 className="font-display text-[13.5px] font-semibold text-ink">{d.title}</h3>
                </div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink2">{d.body}</p>
              </Panel>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

// ── boundary + CTA ──────────────────────────────────────────────────────────────────────────────

function BoundaryNote() {
  return (
    <Reveal>
      <div className="mt-2 flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3.5">
        <Icons.info weight="duotone" className="mt-0.5 size-4 shrink-0 text-ink3" />
        <p className="text-[12px] leading-relaxed text-ink2">{NOT_ADVICE_NOTE}</p>
      </div>
    </Reveal>
  );
}

function Cta() {
  return (
    <Reveal>
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-surface-1 p-6 text-center sm:flex-row sm:text-left">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">See it across the market</h3>
          <p className="mt-1 text-[12.5px] text-ink2">
            Every scored company, its four pillars and its band — in one table.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/health-score">
              Open the Health Hub
              <Icons.arrowRight weight="bold" className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/research/stock-screener/${WORKED_EXAMPLE_SYMBOL}?tab=health`}>
              {WORKED_EXAMPLE_SYMBOL}&apos;s full read
            </Link>
          </Button>
        </div>
      </div>
    </Reveal>
  );
}
