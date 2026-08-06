"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 * THE FINDING CARDS — one complete card per firing pattern, and a visually distinct card per ending.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ── ★ WHAT THIS REPLACES: "A LEAD PLUS A LIST OF NAMES" ───────────────────────────────────────────
 * Both tools rendered `findings[0]` in full and reduced everything else to "+2 more divergences on
 * this stock". BHEL is the case that makes it indefensible: it fires D1 (Market ahead of Foundation,
 * 82.2 vs 53.5) AND D2 (Market ahead of Momentum, 82.2 vs 53.9) — two EXTREME gaps, about two
 * different pairs, with two different readings. The old view showed one and counted the other.
 *
 * ⚠ AND THE SUPPRESSED ONE WAS NOT REDUNDANT. Its `pair` names different pillars, so the number in
 * its sentence is a different number. A count cannot carry that.
 *
 * ── THE CLAUSE ORDER IS THE BACKEND'S ────────────────────────────────────────────────────────────
 * `clauses` arrives ordered — observation · movement · size · phase · boundary — and is rendered in
 * the order given. This component chooses no wording and omits no clause; a clause that is absent is
 * absent because the composer withheld it (a relaxed-tier finding emits no size and no phase, and
 * that suppression is the point).
 *
 * ★ THE BOUNDARY CLAUSE RENDERS ONCE, AT CONTAINER LEVEL. Two cards citing the same gap print the
 * number twice — that is correct, they are two readings of it — but the interpretive boundary is a
 * property of the family, not of each card, and printing it per card turns a rule into wallpaper.
 */

import { Panel } from "@/components/stock-detail/health/shared";
import { cn } from "@/lib/utils";
import { accentOf, accentVars, familyOf } from "@/lib/findings/classify";
import { findingName } from "@/lib/findings/descriptions";
import { configurationTitle } from "./selection";
import Link from "next/link";
import { RegimeBadge } from "./regime-badge";
import type {
  CrossToolSummary,
  EndedFindingView,
  NotCoveredNote,
  PatternView,
  RegimeBadgeView,
  VerdictClause,
} from "@/types/health";

const PILLAR_LABEL: Record<string, string> = {
  foundation: "Foundation",
  momentum: "Momentum",
  market: "Market",
  ownership: "Ownership",
  composite: "Health score",
};

/**
 * ★ EVERY CLAUSE THE BACKEND SENT, IN THE ORDER IT SENT THEM. One exclusion, named: `boundary`,
 * which is hoisted to the container (see the header).
 *
 * ⚠ THIS USED TO BE AN ALLOWLIST — `["observation", "band_context", "movement", "size", "phase"]` —
 * i.e. a frontend copy of the backend's CLAUSE_ORDER membership. That is the exact failure mode
 * verify-trajectory.ts already hit once: it held its own copy of the clause order, and adding
 * `band_context` broke it on three fixtures because the copy went stale the moment the real list
 * moved. An allowlist here fails more quietly still — a newly-composed clause would simply never
 * render, with nothing to fail.
 *
 * So the frontend states no order and no membership. The array arrives ordered (the composer emits in
 * CLAUSE_ORDER and a backend gate asserts it), and this renders it as received. A clause that is
 * absent is absent because the composer withheld it — a relaxed-tier finding emits no `size` and no
 * `phase`, and that suppression is the claim rule working.
 */
function ClauseList({ clauses }: { clauses: VerdictClause[] }) {
  const body = clauses.filter((c) => c.type !== "boundary");
  if (!body.length) return null;
  return (
    <div className="mt-2.5 space-y-1.5">
      {body.map((c) => (
        <p
          key={c.type}
          className={cn(
            "text-[12.5px] leading-relaxed",
            // The observation is the reading; everything after it qualifies the reading. Rank by
            // weight rather than by colour — none of these is a warning on its own.
            c.type === "observation" ? "text-ink2" : "text-ink3",
          )}
        >
          {c.text}
        </p>
      ))}
    </div>
  );
}

/** The pair this finding is about — its OWN, from its record. Silent when it names none. */
function PairLine({ p }: { p: PatternView }) {
  if (!p.pair) return null;
  return (
    <div className="num mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink3">
      <span className="text-ink2">{PILLAR_LABEL[p.pair.high.pillar] ?? p.pair.high.pillar}</span>
      <span className="text-ink">{p.pair.high.subtotal}</span>
      <span className="text-ink3">vs</span>
      <span className="text-ink2">{PILLAR_LABEL[p.pair.low.pillar] ?? p.pair.low.pillar}</span>
      <span className="text-ink">{p.pair.low.subtotal}</span>
      <span className="rounded bg-surface-3 px-1.5 py-0.5">{p.pair.gap} apart</span>
    </div>
  );
}

/**
 * One FIRING pattern, complete.
 *
 * ── ★ FORMED AND BUILDING ARE VISIBLY DIFFERENT STATES, NOT TWO INTENSITIES ──────────────────────
 * Same pattern name — the shape IS the pattern, and a threshold grades how loudly it speaks rather
 * than whether it speaks. But a Building card carries no claim, no study figure and no regime clause,
 * and a reader must be able to see that at a glance rather than infer it from a missing sentence.
 *
 * So: Formed keeps the solid rail and severity accent. Building gets a dashed rail, a muted accent
 * and an explicit FORMING chip. ⚠ The severity ACCENT IS DELIBERATELY NOT USED for Building's rail —
 * an extreme-gap Building card would otherwise wear the same loud colour as a Formed one and read as
 * the stronger card on the page, which is exactly backwards.
 */
export function FindingCard({ p }: { p: PatternView }) {
  const a = accentVars(accentOf(p.severity, familyOf(p.patternKey)));
  const building = p.state === "building";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4",
        building ? "border-dashed border-line2 bg-surface-2/30" : "border-line bg-surface-1",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-[3px]", building && "opacity-40")}
        style={{ background: building ? "var(--ink3)" : a.color }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("text-[13px] font-semibold", building ? "text-ink2" : "text-ink")}>
          {findingName(p.patternKey)}
        </span>
        {building ? (
          <span className="rounded-md border border-line2 bg-surface-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink3">
            Forming
          </span>
        ) : (
          p.tier && (
            <span
              className="rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: a.color, background: a.bg, borderColor: a.bd }}
            >
              {p.tier}
            </span>
          )
        )}
      </div>
      <PairLine p={p} />
      <ClauseList clauses={p.clauses ?? []} />
    </div>
  );
}

/**
 * ★ AN ENDED FINDING — VISUALLY DISTINCT, NEVER MIXED IN.
 *
 * Dashed border, muted surface, an explicit "closed" marker and its own heading. A divergence that
 * simply vanished taught the reader nothing and taught them to distrust the next one; this is the tool
 * showing it was reading something real.
 *
 * ⚠ NO `size` OR `phase` CLAUSE REACHES HERE — the backend does not compose one for an ended card,
 * because both qualify a claim about a condition that no longer holds.
 */
export function EndedFindingCard({ e }: { e: EndedFindingView }) {
  const r = e.lifecycle.resolution;
  return (
    <div className="rounded-xl border border-dashed border-line2 bg-surface-2/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-line2 bg-surface-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink3">
          Closed
        </span>
        <span className="text-[13px] font-medium text-ink2">{e.name}</span>
        {r?.resolved && (
          <span className="num rounded-md bg-surface-3 px-2 py-0.5 text-[10.5px] text-ink2">
            {r.type === "converged" ? "converged" : "collapsed"}
          </span>
        )}
      </div>
      <div className="num mt-1.5 text-[11px] text-ink3">
        stood {e.lifecycle.firstSeen}
        {e.lifecycle.lastSeen !== e.lifecycle.firstSeen ? ` → ${e.lifecycle.lastSeen}` : ""} ·{" "}
        {e.lifecycle.runLength} {e.lifecycle.runLength === 1 ? "reading" : "readings"} · ended{" "}
        {e.lifecycle.endedPeriodsAgo} ago
      </div>
      <div className="mt-2 space-y-1.5">
        {e.clauses
          .filter((c) => c.type !== "boundary")
          .map((c) => (
            <p key={c.type} className="text-[12.5px] leading-relaxed text-ink3">
              {c.text}
            </p>
          ))}
      </div>
    </div>
  );
}

/**
 * The card stack for one tool. Findings arrive ALREADY ORDERED (tier → severity → key, from
 * `findingsForTool`) — this component does not re-sort, because ordering is a claim about which
 * tension leads and that decision has one home.
 */
export function FindingCards({
  findings,
  ended,
  notCovered,
  quietNote,
  crossTool,
  regime,
  boundary,
  symbol,
  pointWhenEmpty,
}: {
  findings: PatternView[];
  ended?: EndedFindingView[];
  /** Configurations tested and not shipped — see NotCoveredSection. */
  notCovered?: NotCoveredNote[];
  /** The registry-level line for a scored, quiet, nothing-to-note stock. Renders only when
   *  `findings` and `notCovered` are BOTH empty — see the field note on FindingsSection.quietNote. */
  quietNote?: string | null;
  /** The OTHER tool's digest, if it has anything. */
  crossTool?: CrossToolSummary;
  /**
   * ★ POINT SOMEWHERE EVEN WHEN THE OTHER TOOL IS ALSO EMPTY — opt-in, and Divergence is the only
   * caller. A divergence view with nothing firing, nothing forming and no not-covered note is a dead
   * end: correct, honest, and offering the reader no next step. Trajectory always has something (the
   * pillars moved), so that is where the dead end points.
   *
   * ⚠ OPT-IN RATHER THAN AUTOMATIC ON `count === 0`. Trajectory does NOT want this — its full mode
   * already guarantees a view — and a pointer that appeared on both tools would send a reader with
   * nothing on either into a loop between them.
   */
  pointWhenEmpty?: boolean;
  /** The live sector regime — threaded down to NC7's card, which explains itself with the same
   *  RegimeBadge/explainer every other regime-facing surface on the page uses. */
  regime?: RegimeBadgeView | null;
  /** The family boundary — rendered ONCE, under the stack. See the header. */
  boundary: string | null;
  /** The stock on screen, for the cross-tool link. Passed rather than read off `location.search`,
   *  which is not available during SSR and now has a second param on it. */
  symbol?: string | null;
}) {
  const showQuiet = !findings.length && !notCovered?.length && !!quietNote;
  // The pointer renders when this tool has NOTHING of its own — the caller has already decided that
  // (see `pointWhenEmpty`), so this only checks that a cross-tool digest exists to link through.
  const showPointer = !!pointWhenEmpty && !!crossTool;
  if (!findings.length && !ended?.length && !notCovered?.length && !crossTool?.count && !showQuiet && !showPointer)
    return null;
  return (
    <Panel className="px-4 py-4">
      {findings.length > 0 && (
        <>
          <div className="kicker mb-3">
            {findings.length === 1 ? "What is standing" : `${findings.length} patterns standing`}
          </div>
          <div className="space-y-3">
            {findings.map((p) => (
              <FindingCard key={p.patternKey} p={p} />
            ))}
          </div>
        </>
      )}

      {!!ended?.length && (
        <>
          <div className="kicker mb-3 mt-5">Recently closed</div>
          <div className="space-y-3">
            {ended.map((e) => (
              <EndedFindingCard key={e.patternKey} e={e} />
            ))}
          </div>
        </>
      )}

      {!!notCovered?.length && <NotCoveredSection notes={notCovered} regime={regime} />}

      {showQuiet && <p className="text-[12.5px] leading-relaxed text-ink3">{quietNote}</p>}

      {(!!crossTool?.count || showPointer) && crossTool && (
        <CrossToolLine s={crossTool} symbol={symbol ?? null} />
      )}

      {boundary && (
        <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink3">
          <span className="text-ink2">Doesn&apos;t mean:</span> {boundary}
        </p>
      )}
    </Panel>
  );
}

/**
 * ★ EXPLICITLY EXCLUDED — plainly separate from findings, and deliberately the quietest thing on
 * the page.
 *
 * ⚠ NO SEVERITY COLOUR, NO TIER CHIP, NO ORDERING, NO SIZE STATED IN PROSE. These are not readings;
 * they are the record of a decision NOT to give one. Styling them like a finding — or sorting them by
 * anything — would rebuild the generic-spread pattern both specs excluded, where a 41-point version
 * reads louder than a 15-point one. They render in registry order because that is not an order at all.
 *
 * ⚠ THE SECTION KICKER USED TO READ "Tested, not shipped" AND EACH CARD HAD NO HEADING OF ITS OWN —
 * a heading that named our process instead of the configuration, on cards that otherwise never named
 * themselves at all. "Explicitly excluded" is the specs' own section title for this material (both
 * Part 4/Part 5 use it verbatim), and each card now opens with `configurationTitle`, the SAME
 * derivation every other site that names a note uses — parity with `FindingCard`, which always names
 * itself.
 *
 * ⚠ NO ID BADGE EITHER. `n.id` (NC1, NC3, …) is the registry's internal identifier, not a reader-
 * facing name — `configurationTitle` is the name. `key={n.id}` below is React's list key, never
 * rendered as text.
 *
 * The pillar-value readout and the pair line below are DATA (chart-parity fields on the note), same
 * numbers a real finding's `PairLine` shows — never a size claim in `n.text` itself, which the backend
 * gate enforces. NC7 embeds the SAME `RegimeBadge` the page's identity row uses, so "sector phase" in
 * its copy is one click from the actual explainer rather than a second description of it.
 */
function NotCoveredSection({ notes, regime }: { notes: NotCoveredNote[]; regime?: RegimeBadgeView | null }) {
  return (
    <>
      <div className="kicker mb-3 mt-5">Explicitly excluded</div>
      <div className="space-y-3">
        {notes.map((n) => (
          <div key={n.id} className="rounded-xl border border-line2 bg-surface-2/30 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium text-ink2">{configurationTitle(n.readings)}</span>
            </div>
            <div className="num mb-1.5 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink3">
              {n.readings.map((r) => (
                <span key={r.subject}>
                  <span className="text-ink2">{PILLAR_LABEL[r.subject] ?? r.subject}</span>{" "}
                  <span className="text-ink">{r.value}</span>
                </span>
              ))}
              {n.id === "NC7" && (
                <span className="ml-1">
                  <RegimeBadge regime={regime ?? null} />
                </span>
              )}
            </div>
            {n.pair && (
              <div className="num mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink3/80">
                <span>{PILLAR_LABEL[n.pair.high.pillar] ?? n.pair.high.pillar}</span>
                <span>{n.pair.high.subtotal}</span>
                <span>vs</span>
                <span>{PILLAR_LABEL[n.pair.low.pillar] ?? n.pair.low.pillar}</span>
                <span>{n.pair.low.subtotal}</span>
              </div>
            )}
            <p className="text-[12.5px] leading-relaxed text-ink2">{n.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * ★ THE OTHER TOOL, IN TWO LINES. A count, the names, and the lead finding's own headline fact —
 * then a link. ⚠ NOT A CARD: rendering the other family's findings here would duplicate them, and two
 * renderings of one finding are how two surfaces start disagreeing about it.
 *
 * ── ★ THE ZERO-COUNT BRANCH — A POINTER, NOT A DIGEST ────────────────────────────────────────────
 * Reached only via `pointWhenEmpty`, and it says something categorically different: with no readings
 * to summarise, the sentence must NOT imply there are any. So it makes the one claim that is true of
 * every scored stock — the pillars have a history and it can always be drawn — and sends the reader
 * there. ⚠ It states no count, names no finding and promises no pattern; a "0 readings on the
 * Trajectory tool" line would be accurate about the count and wrong about what is waiting.
 */
function CrossToolLine({ s, symbol }: { s: CrossToolSummary; symbol: string | null }) {
  const label = s.tool === "divergence" ? "Divergence" : "Trajectory";
  // ⚠ THE LINK CARRIES THE SYMBOL AND NOTHING ELSE. It deliberately does NOT deep-link to
  //   `leadPatternKey`: this tool's selection is this tool's, and pre-selecting the other tool's lead
  //   would make a ranking decision on that tool's behalf from outside it.
  const empty = s.count === 0;
  return (
    <div className="mt-5 rounded-xl border border-line2 bg-surface-2/30 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-[12.5px] text-ink2">
          {empty ? (
            <>
              <span className="font-medium text-ink">Nothing is standing here.</span> No pattern has
              formed, none is forming, and there is no note to add — this stock&apos;s pillars simply
              aren&apos;t far enough apart to read.
            </>
          ) : (
            <>
              <span className="font-medium text-ink">
                {s.count} {s.count === 1 ? "reading" : "readings"}
              </span>{" "}
              on the {label} tool — {s.names.join(", ")}
            </>
          )}
        </span>
        {symbol && (
          <Link
            href={`/research/${s.tool}?symbol=${encodeURIComponent(symbol)}`}
            className="shrink-0 text-[11.5px] text-ink3 underline-offset-2 hover:text-ink2 hover:underline"
          >
            Open {label} →
          </Link>
        )}
      </div>
      {empty ? (
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink3">
          The {label} tool always has something to show: every scored pillar has a history, whether or
          not a pattern ever formed on it.
        </p>
      ) : (
        s.leadFact && <p className="mt-1.5 text-[12px] leading-relaxed text-ink3">{s.leadFact}</p>
      )}
    </div>
  );
}
