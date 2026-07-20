"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE STORY BLOCK (Construction v2 Stage 10b) — the read on the book, as a designed object.
//
// ⚠ DATA-SHAPE NOTE. The wire serves `Storyboard { movements[], text, used[], reference[] }` — there is
// NO `headline` / `coverageLine` / `watchItems` / `metrics` field, and a movement's figures live ONLY
// inside its `text` string. So every structured number this block renders is sourced from where it
// actually has a home: `story.reference[].bind` (the PA1 composition, the movement-4 findings),
// `coverageState` (the donut), `healthRead`/`constructionRead` (the two centres). Nothing is recomputed
// — the composition shares are PA1's own bind; the coverage weights are the frozen snapshot's.
//
// The prototype (docs/vytal_health_v2_full.html) is the layout contract; this is that layout bound to
// the real shape. The centre of the LEFT donut is the SCORED-SLICE QUALITY (a 0–100 score), never the
// ring's coverage total — labelled "scored slice" and coloured as a score so the two can never be read
// as one number. The by-design segment is a NEUTRAL dark (funds/gold/govt paper we deliberately don't
// judge) — never a warning colour.
// ─────────────────────────────────────────────────────────────────────────────

import { Icons } from "@/lib/icons";
import { PILLAR_META } from "@/components/stock-detail/health/shared";
import type { Archetype, PfFinding, PortfolioSnapshot } from "@/types/portfolio";
import { CONSTRUCTION_BAND_META, COVERAGE_COLOR, HEALTH_BAND_META, constructionColor, healthColor } from "../lib";
import { InfoTip, Tip } from "./parts";

const CARD = "rounded-2xl border border-line bg-surface-1 p-5 sm:p-6";
const r0 = (v: number) => Math.round(v);
const pct0 = (w: number) => `${Math.round(w * 100)}%`;
const pct1 = (w: number) => `${(w * 100).toFixed(1)}%`;
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

// ── archetype gloss — the plain tail appended the FIRST time the archetype word appears (here). A label
//    dictionary keyed on the served archetype value (like CONSTRUCTION_BAND_META), never a hardcoded book. ─
const ARCHETYPE_GLOSS: Record<Archetype, string> = {
  "Stock-led": "built mostly from individual stocks",
  "Fund-led": "built mostly from funds and ETFs",
  Blended: "a mix of stocks, funds and other instruments",
  "Income-led": "built mostly from bonds and government paper",
  "Commodity-led": "built mostly from gold and commodities",
};

// ── COMPOSITION — equity / debt / gold, the mutually-exclusive split. Sourced from PA1's OWN bind
//    (the shares the movement-1 sentence was built from), never recomputed off holdings. ─────────────
const COMP_COLOR = { equity: PILLAR_META.foundation.cssVar, debt: PILLAR_META.ownership.cssVar, gold: PILLAR_META.market.cssVar };
function composition(pa1: PfFinding | undefined, exposures: { debt: number; commodity: number } | null) {
  const eq = num(pa1?.bind.equityShare);
  const debt = num(pa1?.bind.debtShare) ?? exposures?.debt ?? null;
  const gold = num(pa1?.bind.commodityShare) ?? exposures?.commodity ?? null;
  const equity = eq ?? (debt != null && gold != null ? Math.max(0, 1 - debt - gold) : null);
  const segs = [
    { key: "equity", label: "Equity", w: equity ?? 0, color: COMP_COLOR.equity },
    { key: "debt", label: "Debt", w: debt ?? 0, color: COMP_COLOR.debt },
    { key: "gold", label: "Gold", w: gold ?? 0, color: COMP_COLOR.gold },
  ].filter((s) => s.w > 0.0005);
  return segs.length ? segs : null;
}

function CompositionBar({ segs }: { segs: { key: string; label: string; w: number; color: string }[] }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        <p className="kicker">What you hold, by kind</p>
        <InfoTip>
          The mutually-exclusive split of your book by asset kind — equity, debt and gold — by value. Unlike the risk lenses, these add up
          to 100%.
        </InfoTip>
      </div>
      <div className="flex h-9 gap-0.5 overflow-hidden rounded-lg">
        {segs.map((s) => (
          <Tip key={s.key} content={`${s.label} — ${pct1(s.w)} of your book by value.`}>
            <div
              className="num flex cursor-help items-center justify-center overflow-hidden text-[11px] font-semibold"
              style={{ flex: Math.max(s.w * 100, 3), background: s.color, color: "#0a0b0e" }}
            >
              <span className="truncate px-1">{s.w >= 0.09 ? `${pct0(s.w)} ${s.label.toLowerCase()}` : ""}</span>
            </div>
          </Tip>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink3">
        {segs.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px]" style={{ background: s.color }} />
            {s.label} <span className="num text-ink2">{pct1(s.w)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── the SVG ring primitive (donut + gauge share it). r=52, drawn from 12-o'clock clockwise. ────────
const R = 52;
const C = 2 * Math.PI * R;
function Ring({ segments, track }: { segments: { w: number; color: string; round?: boolean }[]; track: string }) {
  let acc = 0;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
      <circle cx="60" cy="60" r={R} fill="none" stroke={track} strokeWidth="12" />
      {segments.map((s, i) => {
        const len = Math.max(0, Math.min(1, s.w)) * C;
        const off = -acc * C;
        acc += Math.max(0, Math.min(1, s.w));
        return (
          <circle
            key={i}
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeLinecap={s.round ? "round" : "butt"}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={off}
          />
        );
      })}
    </svg>
  );
}

function CentreValue({ value, sub, color }: { value: number; sub: string; color: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="num text-[32px] font-medium leading-none" style={{ color }}>{value}</span>
      <span className="mt-1 text-center text-[8px] uppercase leading-tight tracking-[0.06em] text-ink3">{sub}</span>
    </div>
  );
}

// ── a movement-4 finding → a watch chip. Label is the finding's own label; the figure is read from its
//    bind (weight, else effective-position count), never a per-id hardcoded phrase. ─────────────────
function watchFigure(f: PfFinding): string | null {
  const w = num(f.bind?.weight);
  if (w != null) return pct1(w);
  const neff = num(f.bind?.neff);
  if (neff != null) return `~${neff.toFixed(1)} eff`;
  return null;
}

/** The story block — the read on the book, rendered as a designed object over the real Storyboard.
 *  Renders only when `snapshot.story` is non-null; the null case is `NullStoryNote` (below). */
export function StoryBlock({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const story = snapshot.story!;
  const h = snapshot.healthRead;
  const c = snapshot.constructionRead;
  const cs = snapshot.coverageState;

  const m1 = story.movements.find((m) => m.movement === 1);
  const pa1 = story.reference.find((f) => f.id === "PA1");
  const pv6 = story.reference.find((f) => f.id === "PV6");
  const comp = composition(pa1, c.exposures);

  // watch items — the movement-4 findings, in the order the story spent them. Variable length.
  const m4used = story.movements.find((m) => m.movement === 4)?.used ?? [];
  const watch = m4used
    .map((id) => story.reference.find((f) => f.id === id))
    .filter((f): f is PfFinding => !!f);

  // donut — scored / awaiting / by-design, off the frozen coverage weights (by-design is the remainder).
  const scored = cs.scoredWeight;
  const awaiting = cs.recognizedUnscoredWeight;
  const byDesign = Math.max(0, 1 - scored - awaiting);
  const donutSegs = [
    { w: scored, color: COVERAGE_COLOR.scored },
    { w: awaiting, color: COVERAGE_COLOR.awaiting },
    { w: byDesign, color: COVERAGE_COLOR.untracked }, // NEUTRAL dark — by design, never a warning
  ];
  const healthAccent = healthColor(h?.band ?? null);
  const constructionAccent = constructionColor(c.band);
  const healthBandWord = h?.band ? HEALTH_BAND_META[h.band].label.toLowerCase() : "unread";
  const constructionBandWord = CONSTRUCTION_BAND_META[c.band].label.toLowerCase();
  const gloss = c.archetype ? ARCHETYPE_GLOSS[c.archetype] : null;

  return (
    <div className={CARD}>
      {/* headline — movement 1's served composition sentence, rendered as a headline (not prose) */}
      {m1?.text && <p className="font-display text-[21px] font-medium leading-snug text-ink sm:text-[23px]">{m1.text}</p>}
      <p className="mt-1.5 text-[12.5px] text-ink3">Written from what you hold — not advice, not a prediction.</p>

      {comp && <CompositionBar segs={comp} />}

      {/* two columns — What we can read (donut) · How it's built (gauge). Stacks on mobile. */}
      <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-2xl border border-line sm:grid-cols-2">
        {/* LEFT — What we can read */}
        <div className="flex flex-col items-center bg-surface-2 p-5 text-center">
          <p className="mb-4 flex items-center gap-1.5 self-start text-[11px] font-semibold uppercase tracking-[0.09em] text-ink3">
            What we can read
            <InfoTip side="bottom">
              Coverage by book value: the <b className="font-semibold text-ink">scored</b> slice we can judge, names{" "}
              <b className="font-semibold text-ink">awaiting</b> a score, and <b className="font-semibold text-ink">by-design</b> holdings
              (funds, ETFs, gold) we don&apos;t score. The centre number is the quality of the scored slice only — not the ring total.
            </InfoTip>
          </p>
          <Tip
            side="bottom"
            content={
              h?.value != null
                ? `The centre number, ${h.value}, is the quality of the ${pct0(scored)} of your book we've scored — not an average over the whole ring.`
                : `The ring shows coverage by book value: scored, awaiting a score, and by-design holdings we don't score.`
            }
          >
            <div className="relative size-[120px] cursor-help">
              <Ring segments={donutSegs} track="var(--surface-3)" />
              {h?.value != null && <CentreValue value={h.value} sub={"scored slice"} color={healthAccent} />}
            </div>
          </Tip>
          <div className="mt-4 flex w-full max-w-[230px] flex-col gap-2">
            <LegendRow color={COVERAGE_COLOR.scored} label="Scored" value={pct0(scored)} tip={`The businesses we can judge on fundamentals${cs.scoredCount != null && cs.totalCount != null ? ` — ${cs.scoredCount} of ${cs.totalCount} holdings` : ""}. This slice scores ${h?.value ?? "—"}.`} />
            {awaiting > 0 && <LegendRow color={COVERAGE_COLOR.awaiting} label="Awaiting" value={pct0(awaiting)} tip="A stock we cover but haven't scored yet — it lights up as coverage completes, never faked into the number." />}
            <LegendRow color={COVERAGE_COLOR.untracked} label="By design" value={pct0(byDesign)} tip="Funds, ETFs, gold and government paper. We don't judge these — a fund owns businesses we can't see inside. Not a gap." />
          </div>
          <p className="mt-4 max-w-[34ch] text-[12px] leading-relaxed text-ink2">
            Of the money we can judge, your businesses read <b className="font-semibold text-ink">{healthBandWord}</b>.
            <span className="mt-1.5 block text-[11px] text-ink3">This is only the {pct0(scored)} we can read — it says nothing about the rest.</span>
          </p>
        </div>

        {/* RIGHT — How it's built */}
        <div className="flex flex-col items-center border-t border-line bg-surface-2 p-5 text-center sm:border-l sm:border-t-0">
          <p className="mb-4 flex items-center gap-1.5 self-start text-[11px] font-semibold uppercase tracking-[0.09em] text-ink3">
            How it&apos;s built
            <InfoTip side="bottom">
              The Construction score over your <b className="font-semibold text-ink">whole book</b> — how your money is arranged across
              holdings. It covers every holding and never touches quality.
            </InfoTip>
          </p>
          <Tip side="bottom" content={`Construction ${r0(c.value)} — how your money is spread across the whole book. Covers every holding; it never touches quality.`}>
            <div className="relative size-[120px] cursor-help">
              <Ring segments={[{ w: c.value / 100, color: constructionAccent, round: true }]} track="var(--line)" />
              <CentreValue value={r0(c.value)} sub={"whole book"} color={constructionAccent} />
            </div>
          </Tip>
          {c.archetype && (
            <div className="mt-4 inline-flex items-center gap-2">
              <span className="num rounded-full border border-line2 px-3 py-1 text-[10.5px] text-ink2">{c.archetype} · {CONSTRUCTION_BAND_META[c.band].label}</span>
            </div>
          )}
          {gloss && <p className="mt-2 text-[11px] text-ink3">{c.archetype} — {gloss}.</p>}
          <p className="mt-3 max-w-[34ch] text-[12px] leading-relaxed text-ink2">
            The way you&apos;ve spread your money across the whole book is <b className="font-semibold text-ink">{constructionBandWord}</b>.
            <span className="mt-1.5 block text-[11px] text-ink3">Covers every holding. It never touches quality.</span>
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-[11.5px] leading-relaxed text-ink3">
        These answer <b className="text-ink2">two different questions</b> — what you own, and how you&apos;ve arranged it. They&apos;re never combined into one number.
      </p>

      {/* watch items — variable length; the whole row hides when the story spent no movement-4 finding */}
      {watch.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-line pt-5 sm:grid-cols-[150px_1fr] sm:items-center sm:gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-semibold text-ink2">Worth your attention</span>
            <span className="text-[10.5px] text-ink3">{watch.length} item{watch.length === 1 ? "" : "s"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {watch.map((f) => {
              const fig = watchFigure(f);
              return (
                <Tip key={f.id} content={f.read ?? f.label}>
                  <span className="inline-flex cursor-help items-center gap-2 rounded-lg border border-line2 bg-surface-2 px-3 py-1.5">
                    <span className="size-1.5 rounded-full" style={{ background: "var(--high)" }} />
                    <span className="text-[12px] text-ink">{f.label}</span>
                    {fig && <span className="num text-[11px] text-ink3">{fig}</span>}
                  </span>
                </Tip>
              );
            })}
          </div>
        </div>
      )}

      {/* by-design footer — PV6's served sentence (the ₹ outside the read). Rendered verbatim. */}
      {pv6?.read && (
        <p className="mt-5 text-center border-t border-line pt-4 text-[12px] leading-relaxed text-ink3">{pv6.read}</p>
      )}
    </div>
  );
}

function LegendRow({ color, label, value, tip }: { color: string; label: string; value: string; tip: string }) {
  return (
    <Tip content={tip}>
      <div className="flex cursor-help items-center gap-2.5 text-[11.5px]">
        <span className="size-2 shrink-0 rounded-[2px]" style={{ background: color }} />
        <span className="text-ink2">{label}</span>
        <span className="num ml-auto text-ink">{value}</span>
        <Icons.info weight="regular" className="size-3 shrink-0 text-ink3" aria-hidden />
      </div>
    </Tip>
  );
}

/** The null-story state — first-class, calm, never an alarm. ~39 of 41 live books hit this (scored
 *  before the story engine, or no scored holdings). Everything below the block still renders. */
export function NullStoryNote() {
  return (
    <div className={CARD}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-line2 bg-surface-2 text-ink3">
          <Icons.info weight="duotone" className="size-4" />
        </span>
        <div>
          <p className="text-[13.5px] font-medium text-ink">The written read isn&apos;t ready for this book yet</p>
          <p className="mt-1 max-w-[70ch] text-[12.5px] leading-relaxed text-ink3">
            This book was scored before the story engine — the numbers below are current, and the written read appears the next time it rescores. Nothing here is estimated in the meantime.
          </p>
        </div>
      </div>
    </div>
  );
}
