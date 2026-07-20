"use client";

import { Icons } from "@/lib/icons";
import type { PfTone, PortfolioSnapshot } from "@/types/portfolio";
import { DRAG_COLOR, allFindings } from "../lib";
import { SIGNAL_SOURCE_META, activeSignals } from "../health/lib";

// ─────────────────────────────────────────────────────────────────────────────
// RED-FLAG STRIP — a glance-level "worth a look", pointing to WHERE the look happens
// (the Health tab). Reads the SAME fired-flag data the Health tab itemises and never
// recomputes it:
//   · WHICH / HOW MANY holdings are flagged → `activeSignals(snapshot)` (the per-holding
//     Signals ledger: { symbol, source, weight, points }).
//   · WHAT the flag is → the served READ of the loudest fired PS (Signals) finding
//     (`healthRead.findings`). ★ The per-holding ledger itself carries NO description — only a
//     `source` category (→ SIGNAL_SOURCE_META label like "Critical red flag"). The one-line
//     "why" the Health tab shows lives on the PS finding's `read` (e.g. PS1: "40% of your book …
//     active Critical/High red flags (DIXON). These are the holdings the model is warning on.").
//     We render that served text verbatim — nothing here is authored. If no PS read is served
//     (a ledger entry below the finding thresholds), we fall back to the source label.
//
// COLOUR BY WARNING LEVEL, in the RED family — a red flag reads RED (desaturated), never orange or
// amber. The lead flag's tone drives it: a Concern-level flag (Critical / Distress band) takes the
// clearer muted red; a Caution-level red flag (High / Medium) a lighter shade of the SAME red; only a
// non-flag Neutral (Fading strength) drops to slate. Desaturated + low-opacity fills so it reads
// "worth a look", not "emergency". A POINTER, NOT ADVICE — describes the flag, links to Health, never
// "sell". Renders NOTHING when zero flags fire.
// ─────────────────────────────────────────────────────────────────────────────

const TONE_RANK: Record<PfTone, number> = {
  Concern: 0,
  Caution: 1,
  Neutral: 2,
  Constructive: 3,
};

// Level → colour. Reds are DESATURATED (never --crit's saturated red); DRAG_COLOR.signal (#cf6a6a) is
// the codebase's own red-flag red, so the Overview strip matches the Health tab's Signals treatment.
const LEVEL_COLOR: Record<PfTone, string> = {
  Concern: DRAG_COLOR.signal, //   #cf6a6a — muted red, the red-flag red (Critical / Distress)
  Caution: "#d98a8a", //           lighter shade of the same red (High / Medium red flags)
  Neutral: "var(--ctx)", //        slate — a non-flag informational signal (Fading strength)
  Constructive: "var(--rec)", //   (won't occur for an active flag)
};

/** The strip's level colour (muted red for a red flag), or null when nothing fires — so the
 *  "Needs attention" eyebrow can match the strip instead of standing in a fixed amber. */
export function redFlagAccent(
  snapshot: PortfolioSnapshot | null,
): string | null {
  if (!snapshot) return null;
  const flags = activeSignals(snapshot);
  if (flags.length === 0) return null;
  const lead = [...flags].sort(
    (a, b) =>
      TONE_RANK[SIGNAL_SOURCE_META[a.source].tone] -
        TONE_RANK[SIGNAL_SOURCE_META[b.source].tone] || b.points - a.points,
  )[0];
  return LEVEL_COLOR[SIGNAL_SOURCE_META[lead.source].tone];
}

/** The served one-line brief: the loudest fired PS (Signals) finding's `read` — the same text
 *  the Health tab renders for these flags. Null when no PS finding carries a read. */
function servedBrief(snapshot: PortfolioSnapshot): string | null {
  const ps = allFindings(snapshot)
    .filter(
      (f) =>
        f.family === "PS" &&
        f.loud &&
        typeof f.read === "string" &&
        f.read.length > 0,
    )
    .sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]);
  return ps[0]?.read ?? null;
}

export function RedFlagStrip({
  snapshot,
  onOpenHealth,
}: {
  snapshot: PortfolioSnapshot | null;
  onOpenHealth: () => void;
}) {
  if (!snapshot) return null;
  const flags = activeSignals(snapshot); // SignalsDeduction[], points-desc; empty ⇒ no active flags
  if (flags.length === 0) return null; // honest-quiet — nothing renders when nothing fires

  const n = flags.length;
  // The lead flag — most severe by tone, then book weight. Drives the colour (by level) + the fallback.
  const lead = [...flags].sort(
    (a, b) =>
      TONE_RANK[SIGNAL_SOURCE_META[a.source].tone] -
        TONE_RANK[SIGNAL_SOURCE_META[b.source].tone] || b.points - a.points,
  )[0];
  const color = LEVEL_COLOR[SIGNAL_SOURCE_META[lead.source].tone]; // muted red for a red flag, by level
  const brief = servedBrief(snapshot); // the served finding read, or null
  // Fallback (no served finding read): the source label — the only other served text there is.
  const fallback = `${lead.symbol} — ${SIGNAL_SOURCE_META[lead.source].label}`;

  return (
    <div
      className="flex flex-col sm:flex-row flex-wrap items-start gap-x-3 gap-y-2 rounded-xl border px-4 py-3"
      style={{
        borderColor: `color-mix(in oklch, ${color} 26%, transparent)`,
        background: `color-mix(in oklch, ${color} 8%, transparent)`,
      }}
    >
      <div className="flex flex-1 items-start gap-3">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-md"
          style={{
            background: `color-mix(in oklch, ${color} 15%, transparent)`,
            color,
          }}
        >
          <Icons.warning weight="duotone" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-ink2">
            {n} holding{n === 1 ? "" : "s"} firing a red flag
          </p>
          {/* the served flag read — one line; describes what the flag is, never advice */}
          <p className=" text-[11.5px] leading-relaxed text-ink3">
            {brief ?? fallback}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenHealth}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] min-[450px]:text-[12px] font-medium transition-[filter] hover:brightness-125"
        style={{
          color,
          borderColor: `color-mix(in oklch, ${color} 32%, transparent)`,
          background: `color-mix(in oklch, ${color} 10%, transparent)`,
        }}
      >
        See full analysis
        <Icons.arrowRight className="size-3.5" />
      </button>
    </div>
  );
}
