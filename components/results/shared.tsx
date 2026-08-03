"use client";

/**
 * Shared primitives for the Results viewer tabs — re-exports the calm Health/Overview
 * vocabulary (Panel, SectionEyebrow, tint, MiniSpark, toneColor, fmt*) so the viewer
 * reads as one product with the rest of the app, plus a few result-specific helpers.
 * Tokens only; no glass/aurora/gradient. Every helper is DISPLAY/honest — no verdicts.
 */

import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { toneColor, fmtSignedPct, fmtPct, fmtMarketCap, DASH } from "@/components/stock-detail/overview/shared";

export { toneColor, fmtSignedPct, fmtPct, fmtMarketCap, DASH };
export { Panel, SectionEyebrow, tint, MiniSpark, sparkSeries, shortPeriod } from "@/components/stock-detail/health/shared";
export { Chip, HonestEmpty } from "@/components/stock-detail/overview/shared";

/** ₹ Cr (with L Cr rollover) or honest dash. */
export const fmtCr = (v: number | null | undefined): string => (v == null ? DASH : fmtMarketCap(v));

/** Guarded % change cur vs base (base = denominator). null on missing/zero base. */
export function pctChange(cur: number | null | undefined, base: number | null | undefined): number | null {
  if (cur == null || base == null || base === 0) return null;
  return ((cur - base) / Math.abs(base)) * 100;
}

/** Basis-point delta between two PERCENT values (cur − base) × 100. */
export function bps(cur: number | null | undefined, base: number | null | undefined): number | null {
  if (cur == null || base == null) return null;
  return Math.round((cur - base) * 100);
}

/** Signed "+120 bps" / "−40 bps" / dash. */
export function fmtBps(v: number | null): string {
  if (v == null) return DASH;
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)} bps`;
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════
 * QUARTER IN BRIEF — THE VERDICT BADGE AND THE PROSE.
 *
 * ── ★ MONOCHROME, ON PURPOSE ────────────────────────────────────────────────────────────────────
 * This badge sits on the same card as the health score, which IS a coloured scale that IS meant to be
 * read as better/worse. Two coloured scales side by side get read as one scale — a green "Grew" would
 * be taken as Vytal saying the quarter was good, which is precisely the claim the verdict does not
 * make. So DIRECTION IS CARRIED BY THE GLYPH AND THE WORD, never by hue. Mirrors BADGE_TREATMENT in
 * the backend's verdict.ts, which records the same decision as `colourEncodesMeaning: false`.
 *
 * ── ⚠ THE GLYPH IS THE DIRECTION OF PROFIT, AND NOTHING ELSE ────────────────────────────────────
 * Not a rating. "Lifted by one-offs" gets the UP glyph because profit did rise; the qualification
 * lives in the label, where a reader reads it, not in a warning triangle that would characterise the
 * quarter before they got there.
 *
 * ── ⚠ CROSS-REPO DUPLICATION, GATED ─────────────────────────────────────────────────────────────
 * VERDICT_DOESNT_MEAN, this key→glyph map and HEALTH_HEADING_MARKER all exist in the backend too, and
 * two repos cannot share a constant without a shared package (a new dependency). They are held to the
 * backend by `npm run verify:cross-repo` — see verify-quarter-brief-badge.ts. Editing any of them
 * here alone fails that gate loudly.
 * ════════════════════════════════════════════════════════════════════════════════════════════════ */

/** ⚠ SHIPS WITH THE BADGE, NEVER BELOW THE FOLD. The verdict is the most-read line on the card and
 *  the one a reader is most likely to act on, so the limit of what it claims travels with it. */
export const VERDICT_DOESNT_MEAN =
  "This describes one quarter's reported figures. It is not a view on the company, and not a view on the share price.";

/** The heading the pinned score date attaches to. A substring, not the whole heading, so a wording
 *  tweak upstream does not silently detach the date — and the cross-repo gate asserts it still
 *  matches exactly one of the backend's allowed headings. */
export const HEALTH_HEADING_MARKER = "health score";

/* ════════════════════════════════════════════════════════════════════════════════════════════════
 * MARKET REACTION — THE THREE STATES, STATED ONCE EACH.
 *
 * ── ⚠ WHY THESE ARE CONSTANTS HERE AND NOT STRINGS IN SnapshotTab ──────────────────────────────
 * Same reasoning as DENSITY_EMPTY_COPY in lib/findings/classify.ts, which is the precedent: a
 * sentence authored inline is a sentence nobody re-reads, and the one it replaced overclaimed for
 * as long as it sat there. The backend catalogue (src/catalogue/) is NOT a home for these — it is
 * the findings register (names, descriptions, boundaries, lens faces) and everything in it is
 * machine-emitted into lib/findings/generated/copy.generated.ts. Reaction-window copy has no home
 * there and inventing one would put a viewer string behind the findings staleness gate for no
 * reason. This module already holds the viewer's authored copy (VERDICT_DOESNT_MEAN above); these
 * sit with it, and SnapshotTab imports rather than authors.
 *
 * ── ⚠ WHAT THE EMPTY STATE MAY AND MAY NOT CLAIM ───────────────────────────────────────────────
 * REACTION_EMPTY_COPY previously rendered for a result filed TODAY, over four real closes and a
 * clean baseline (BLUEJET, 3 Aug). It asserted absence where the only missing thing was a close
 * that cannot exist yet. The backend no longer routes that case here — it is `forming` — so this
 * string now covers only what it says: no pre-filing baseline, or a closed window that never
 * printed. The two states are separate because the sentences are not interchangeable.
 * ════════════════════════════════════════════════════════════════════════════════════════════════ */

/** Genuinely no reaction data: no pre-filing baseline, or a window that closed without printing. */
export const REACTION_EMPTY_COPY = "Price reaction data not available for this result date.";

/** A forming window that has not opened yet — filed, but no close has printed since.
 *
 *  ⚠ NOT "0 of ~14 trading days". That is arithmetically true and reads as a countdown against a
 *  target, which is not what a reader needs here: nothing is pending on Vytal's side, the market
 *  simply has not traded since the filing. It also invites the reader to take the line on screen
 *  as the reaction, when every point on it predates the filing. So the state is named, and the
 *  line is labelled for what it is. */
export const REACTION_NOT_OPENED_KICKER = "window opens with the first close after filing";
export const REACTION_NOT_OPENED_COPY =
  "No close has printed since the filing. The reaction window opens with the first close after it — the line so far is the run-up into the filing.";

/** A forming window with at least one post-filing close. `~{expected}` is SERVED (derived from the
 *  window in result-detail.service.ts), never typed here — it was "~12" in two places and the
 *  window is 20 calendar days, so the literal described nothing. */
export const reactionFormingKicker = (done: number, expected: number): string =>
  `still forming — ${done} of ~${expected} trading days`;
export const reactionFormingCopy = (done: number, expected: number): string =>
  `Partial window — ${done} of ~${expected} trading days since filing. The line extends as daily closes come in.`;

/** A window that has run its course. */
export const REACTION_COMPLETE_COPY =
  "Closing price across the window — the path, stated as fact. No reaction verdict is implied.";

type VerdictGlyph = "up" | "down" | "level" | "split" | "flag";

const VERDICT_GLYPH: Record<string, VerdictGlyph> = {
  grew_margins_wider: "up",
  grew: "up",
  grew_margins_thinner: "up",
  grew_bad_loans_up: "up",
  held: "level",
  pulled_both_ways: "split",
  fell_back: "down",
  loss_both_periods: "flag",
  lifted_by_one_offs: "flag",
};

const GLYPH_ICON: Record<VerdictGlyph, (typeof Icons)[keyof typeof Icons]> = {
  up: Icons.arrowUpRight,
  down: Icons.arrowDownRight,
  level: Icons.compare,
  split: Icons.compare,
  // Not a warning triangle. `circleDot` is the established "a reading exists here" marker — it
  // states presence without approving or condemning, which is the whole contract of this badge.
  flag: Icons.circleDot,
};

/**
 * The COMPUTED verdict, rendered. Returns null when there is none — a brief with prose and no
 * verdict is a real, shipped state (MMTC), and it must render as NO badge, never an empty frame.
 *
 * ⚠ THE LABEL WRAPS; IT NEVER TRUNCATES. "Grew, margins thinner" clipped to "Grew, margins…" reads
 * as its own opposite, so there is no `truncate` here and there must never be one. At 320px the
 * longest label still fits on one line; if a future label does not, it takes a second line.
 */
export function VerdictBadge({
  verdictKey,
  label,
  className,
}: {
  verdictKey: string | null;
  label: string | null;
  className?: string;
}) {
  if (!verdictKey || !label) return null;
  const Glyph = GLYPH_ICON[VERDICT_GLYPH[verdictKey] ?? "level"];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-start gap-1.5 rounded-lg border border-line2 bg-surface-2 px-2.5 py-1",
        className,
      )}
    >
      <Glyph weight="regular" className="mt-0.75 h-3.5 w-3.5 shrink-0 text-ink2" />
      <span className="text-[12.5px] font-semibold leading-snug text-ink">{label}</span>
    </span>
  );
}

/** The qualifier that travels with the badge. Separate component only so the two surfaces cannot
 *  drift on the wording — there is one string and both render it. */
export function VerdictCaveat({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] leading-relaxed text-ink3", className)}>{VERDICT_DOESNT_MEAN}</p>
  );
}

/** A heading line as the generator may emit it: bare, `## Heading`, or `**Heading**`. Mirrors the
 *  backend's HEADING_RE. Detection is structural rather than a copy of the allowed-heading list,
 *  because generation already refuses any heading outside that list — anything stored IS allowed. */
const HEADING_LINE = /^\s{0,3}(?:#{1,6}\s*|\*\*)?([A-Z][^\n*#:]{3,60}?)(?:\*\*)?\s*:?\s*$/;
const BULLET_LINE = /^\s*[-*•]\s+/;

/**
 * The generated brief, rendered. Headings, short paragraphs, and the occasional bullet — nothing
 * else is in the output, so nothing else is parsed. Deliberately NOT a markdown library: the shape
 * is fixed and guarded upstream, and a general renderer would be a new dependency for four rules.
 *
 * ── ★ scoredAsOf IS RENDERED ADJACENT TO THE SCORE, NOT AS A FOOTNOTE ───────────────────────────
 * The Health tab recomputes on ordinary trading days; the brief's health section is pinned to the
 * snapshot in force when it was written. Both figures are correct and they can differ — DIXON moved
 * 65.1 → 65.0 in hours with no filing. A reader who sees two numbers and no date sees a
 * contradiction, so the date sits ON the health heading, in the same eyeline as the number under it.
 * A tooltip or a footer line would not be read at the moment the difference is noticed.
 */
export function QuarterBriefProse({
  content,
  scoredAsOf,
}: {
  content: string;
  scoredAsOf: string | null;
}) {
  const blocks: { kind: "heading" | "para" | "bullets"; text?: string; items?: string[] }[] = [];

  for (const raw of content.split("\n")) {
    const l = raw.trim();
    if (!l) continue;

    if (BULLET_LINE.test(l)) {
      const item = l.replace(BULLET_LINE, "").trim();
      const last = blocks[blocks.length - 1];
      if (last?.kind === "bullets") last.items!.push(item);
      else blocks.push({ kind: "bullets", items: [item] });
      continue;
    }

    const h = HEADING_LINE.exec(l);
    // Same guard the backend uses: a sentence that happens to end a line is not a heading.
    if (h && !/[.!?,;]$/.test(h[1]) && h[1].trim().split(/\s+/).length <= 8) {
      blocks.push({ kind: "heading", text: h[1].trim() });
      continue;
    }

    blocks.push({ kind: "para", text: l });
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => {
        if (b.kind === "heading") {
          const isHealth = b.text!.toLowerCase().includes(HEALTH_HEADING_MARKER);
          return (
            <div key={i} className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", i > 0 && "mt-1")}>
              <h4 className="text-[12.5px] font-semibold leading-snug text-ink">{b.text}</h4>
              {isHealth && scoredAsOf && (
                <span className="num text-[10.5px] leading-snug text-ink3">as scored on {scoredAsOf}</span>
              )}
            </div>
          );
        }
        if (b.kind === "bullets") {
          return (
            <ul key={i} className="flex flex-col gap-1.5">
              {b.items!.map((it, j) => (
                <li key={j} className="flex gap-2 text-[13px] leading-relaxed text-ink2">
                  <span aria-hidden className="mt-1.75 h-0.75 w-0.75 shrink-0 rounded-full bg-ink3" />
                  <span className="min-w-0">{it}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-[13px] leading-relaxed text-ink2">
            {b.text}
          </p>
        );
      })}
    </div>
  );
}

/** A labelled headline-number tile — value (.num) + optional signed YoY / QoQ rows. */
export function MetricTile({
  label,
  value,
  yoy,
  qoq,
}: {
  label: string;
  value: string;
  yoy?: number | null;
  qoq?: number | null;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="truncate text-[11px] text-ink3">{label}</div>
      <div className="num mt-1 text-[14px] sm:text-[18px] font-semibold text-ink">{value}</div>
      {(yoy !== undefined || qoq !== undefined) && (
        <div className="mt-1.5 flex flex-col gap-0.5">
          {yoy !== undefined && (
            <span className="num text-[11px]" style={{ color: toneColor(yoy) }}>
              {fmtSignedPct(yoy)} <span className="text-ink3">YoY</span>
            </span>
          )}
          {qoq !== undefined && (
            <span className="num text-[11px]" style={{ color: toneColor(qoq) }}>
              {fmtSignedPct(qoq)} <span className="text-ink3">QoQ</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
