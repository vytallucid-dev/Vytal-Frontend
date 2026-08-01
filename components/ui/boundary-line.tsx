// components/ui/boundary-line.tsx
//
// THE ONE render for an interpretive-boundary string (`doesntMean`). Twelve sites printed the stored
// string raw into an italic left-bordered <p>; they now all call this. The parsing lives in
// lib/findings/boundary.ts (pure, gated); this file is presentation only.
//
// ── THE ACCESSIBILITY DECISION ────────────────────────────────────────────────────────────────────
// The "≠" markers become a real <ul>/<li>, not a replacement word. A screen reader announces
// "Doesn't mean — list, 3 items — the position is a mistake / it will fall / trim it", which is what
// the notation meant all along. The interpuncts between items are decorative and aria-hidden, so the
// separator is never spoken. Replacing "≠" with the word "not" would have needed grammar surgery on
// the imperative clauses ("trim it", "consolidate", "sell four") — that is authoring, not rendering.
//
// The visual treatment is unchanged from what every site already had: left hairline rule, muted, small.
// The label is the only new ink, and it is what makes the fragment a sentence.

import { boundaryParts } from "@/lib/findings/boundary";
import { cn } from "@/lib/utils";

/** Matches the three type scales the twelve call sites were already using. */
const SIZE = {
  xs: { pad: "pl-2", text: "text-[10.5px]", label: "text-[9px]" },
  sm: { pad: "pl-2.5", text: "text-[11px]", label: "text-[9px]" },
  md: { pad: "pl-3", text: "text-[11.5px]", label: "text-[9.5px]" },
} as const;

export function BoundaryLine({
  text,
  size = "md",
  className,
  /** Off only where the surrounding chrome IS the label — the portfolio disclosures accordion's
   *  trigger already reads "What this doesn't mean", and repeating it inside the panel is noise. */
  showLabel = true,
}: {
  text: string;
  size?: keyof typeof SIZE;
  className?: string;
  showLabel?: boolean;
}) {
  const parts = boundaryParts(text);
  const s = SIZE[size];
  if (!parts.clauses.length && !parts.prose) return null;

  return (
    <div className={cn("border-l-2 border-line2", s.pad, s.text, "leading-relaxed text-ink3", className)}>
      {showLabel && (
        <span className={cn("mb-0.5 block font-semibold uppercase tracking-[0.14em] text-ink3", s.label)}>
          {parts.label}
        </span>
      )}

      {parts.clauses.length > 0 && (
        <ul className="inline">
          {parts.clauses.map((c, i) => (
            <li key={c} className="inline">
              {i > 0 && (
                <span aria-hidden="true" className="px-1.5 opacity-50">
                  ·
                </span>
              )}
              <span className="italic">{c}</span>
            </li>
          ))}
        </ul>
      )}

      {parts.prose && (
        <span className={cn("italic", parts.clauses.length > 0 && "mt-1 block")}>{parts.prose}</span>
      )}
    </div>
  );
}
