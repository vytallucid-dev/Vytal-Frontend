"use client";

import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DisclosureNote, NullReasonClass } from "@/types/portfolio";

// ─────────────────────────────────────────────────────────────────────────────
// HOLDING DISCLOSURE (X3) — render a SERVED disclosure note. The sentence is composed backend-side and
// is authoritative: it is rendered VERBATIM. `cls` chooses TONE ONLY (colour · icon · weight); it never
// chooses words. There is no code→sentence map on the client and there must never be one.
//
//   not_a_gap  → neutral, matter-of-fact. The by-design case (a fund we don't judge, a T-bill that pays
//                no coupon) and the MOST COMMON one on a multi-asset book — it must read as NORMAL, not a
//                problem: neutral ink, an info glyph, no caution colour, no dash.
//   our_gap    → light caution. We can't do something (price it, source its coupon). Honest, not alarmed.
//   world_gap  → the same light caution — the limit is the world's, not ours. Wording is served; tone
//                matches our_gap.
//   refused    → firmer. We decline to present something (a stale NAV as if current) — a deliberate
//                withholding, not an inability. Distinct glyph + weight, still not an alarm.
// ─────────────────────────────────────────────────────────────────────────────

type IconCmp = typeof Icons.info;
const TONE: Record<NullReasonClass, { color: string; Icon: IconCmp; firm?: boolean }> = {
  not_a_gap: { color: "var(--ink3)", Icon: Icons.info },
  our_gap: { color: "var(--high)", Icon: Icons.warning },
  world_gap: { color: "var(--high)", Icon: Icons.warning },
  refused: { color: "var(--high)", Icon: Icons.eyeSlash, firm: true },
};

/** Dedupe by code, keeping SERVED ORDER — defensive against a backend repeat; never collapses two
 *  DISTINCT codes into one line. */
function dedupe(notes: DisclosureNote[]): DisclosureNote[] {
  const seen = new Set<string>();
  return notes.filter((n) => (seen.has(n.code) ? false : (seen.add(n.code), true)));
}

/** ONE marker for ONE class — its glyph + an INDEPENDENT tooltip carrying ONLY that class's served
 *  sentence(s). Same-class notes (a T-bill's discount-at-par + not-scored) stack, one line each,
 *  verbatim. Never shared with another class's marker. */
function DisclosureMarker({ notes, Icon, color, firm }: { notes: DisclosureNote[]; Icon: IconCmp; color: string; firm: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help">
          <Icon weight={firm ? "fill" : "regular"} className="size-3.5 shrink-0" style={{ color }} />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-left leading-relaxed">
        {notes.map((n, i) => (
          <p key={n.code} className={cn(i > 0 && "mt-1.5", firm && "font-medium")}>
            {n.sentence}
          </p>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Render a holding's served disclosure notes. Multiple notes stack in served order.
 *  · variant "full"   — icon + full sentence, one row per note (roomy: expand, lists, coverage).
 *  · variant "inline" — compact tinted icon(s), the sentence(s) on hover (dense table / preview cells).
 * Renders nothing when there are no notes (a scored, priced, non-coupon holding — the honest empty).
 */
export function HoldingDisclosure({
  notes,
  variant = "full",
  className,
}: {
  notes: DisclosureNote[] | undefined;
  variant?: "full" | "inline";
  className?: string;
}) {
  const list = dedupe(notes ?? []);
  if (list.length === 0) return null;

  if (variant === "inline") {
    // ── MARKERS SPLIT BY CLASS, NOT BY COUNT ──────────────────────────────────────────────────────
    // A holding can carry several notes of different KINDS. Render ONE marker per distinct kind, each
    // with its OWN tooltip:
    //   · not_a_gap (by-design — why this isn't scored: funds, gold, REITs, discount-at-par, not-scored)
    //     → the info `i`. Neutral.
    //   · our_gap / world_gap / refused (we can't value/read this right now — coupon, unpriced, dormant)
    //     → a slashed-circle "withheld" glyph, caution tone. Reads as limited/withheld, not "reveal"
    //       (no eye) and not "error" (no warning triangle).
    // At most two markers; each tooltip shows ONLY its class's served sentence(s). Same-class notes
    // (a T-bill's discount + not-scored) stack under the single marker — same kind, one honest marker.
    const byDesign = list.filter((n) => n.cls === "not_a_gap");
    const withheld = list.filter((n) => n.cls !== "not_a_gap"); // our_gap · world_gap · refused
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        {byDesign.length > 0 && (
          <DisclosureMarker notes={byDesign} Icon={Icons.info} color="var(--ink3)" firm={false} />
        )}
        {withheld.length > 0 && (
          <DisclosureMarker
            notes={withheld}
            Icon={Icons.prohibit}
            color="var(--high)"
            firm={withheld.some((n) => TONE[n.cls].firm)} // a refused note reads firmer than a plain our_gap
          />
        )}
      </span>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {list.map((n) => {
        const t = TONE[n.cls];
        return (
          <li key={n.code} className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink2">
            <t.Icon weight={t.firm ? "fill" : "regular"} className="mt-[1.5px] size-3.5 shrink-0" style={{ color: t.color }} />
            <span className={cn(t.firm && "font-medium")}>{n.sentence}</span>
          </li>
        );
      })}
    </ul>
  );
}
