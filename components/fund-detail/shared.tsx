"use client";

/**
 * Shared primitives for the fund/ETF detail page. The one idea every one of these encodes:
 * a declined metric is CONTENT, not a gap — it takes its slot at full size, states its reason,
 * and never collapses so the metrics around it can expand into the space. See
 * docs/SPEC_fund_detail_page_v1.md §2.2 / §3.2.
 */

import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icons, type Icon } from "@/lib/icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/** A faint tinted-surface style from any accent colour — icon-badge fill + border.
 *  Same formula as the stock-detail health tab's `tint()`, kept local so fund-detail
 *  doesn't reach across domains for one helper. */
function tint(accent: string, fill = 14, border = 30): CSSProperties {
  return {
    color: accent,
    background: `color-mix(in oklch, ${accent} ${fill}%, transparent)`,
    borderColor: `color-mix(in oklch, ${accent} ${border}%, transparent)`,
  };
}

export function InfoTip({ text, className }: { text: string; className?: string }) {
  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className={cn(
            "inline-grid shrink-0 place-items-center rounded text-ink3 transition-colors hover:text-ink2 focus:outline-none focus-visible:text-ink2",
            className,
          )}
        >
          <Icons.info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-left leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}

export function SectionHeader({
  label,
  accent = "var(--primary)",
  pill,
  icon: Glyph,
}: {
  label: string;
  accent?: string;
  pill?: string;
  icon?: Icon;
}) {
  // No mt-10/first:mt-0 self-margin here — every caller sits inside a page-level `mt-9`
  // wrapper (matching Hero/Chart), so vertical rhythm between sections is set in ONE place
  // (the page) instead of each header guessing whether it's "first" inside its own <section>.
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      {Glyph ? (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border" style={tint(accent)}>
          <Glyph weight="duotone" className="h-4 w-4" />
        </span>
      ) : (
        <span className="h-3.5 w-[3px] shrink-0 rounded-full" style={{ background: accent }} />
      )}
      <span className="eyebrow shrink-0">{label}</span>
      <span
        className="h-px min-w-4 flex-1"
        style={{ background: `color-mix(in oklch, ${accent} 20%, var(--line))` }}
      />
      {pill && (
        <span
          className="num shrink-0 rounded-full border px-2.5 py-1 text-[11px] tracking-normal text-ink2"
          style={{ borderColor: "var(--line2)", background: "var(--surface-2)" }}
        >
          {pill}
        </span>
      )}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface-1 p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

/** The "why" chip — a reason code rendered as a small pill, matching the prototype's `.why`
 *  and `.bigempty .code` treatment (teal, monospace, a fact you could grep for). */
export function ReasonChip({ code }: { code: string }) {
  return (
    <span
      className="num inline-flex w-fit items-center rounded border px-1.5 py-0.5 text-[10.5px]"
      style={{ color: "var(--p-own)", borderColor: "color-mix(in oklch, var(--p-own) 35%, transparent)" }}
    >
      {code}
    </span>
  );
}

/** A metric-row's value replaced by its reason, in place — same row height, same rhythm,
 *  never a dash. Use inside Returns/Risk table rows. */
export function DeclinedValue({ reason, className }: { reason: string; className?: string }) {
  return (
    <span className={cn("max-w-[30ch] text-right text-[11.5px] leading-snug text-ink3", className)}>
      {reason}
    </span>
  );
}

/** The compact alternative to {@link DeclinedValue}: an em-dash standing in for a missing
 *  value, with the full reason tucked into a hover tooltip so nothing is actually lost. Used
 *  where a wall of reason text would clutter the column (the benchmark grid). */
export function DashValue({ reason }: { reason?: string }) {
  if (!reason) return <span className="num shrink-0 text-[14px] text-ink3">—</span>;
  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Why this isn't available"
          className="num shrink-0 cursor-help text-[14px] text-ink3 underline decoration-line3 decoration-dotted underline-offset-4 transition-colors hover:text-ink2"
        >
          —
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-left leading-relaxed">{reason}</TooltipContent>
    </Tooltip>
  );
}

/** A hero cell (or any equal-weight tile) in its declined shape: same min-height as a live
 *  cell, the reason filling the value slot instead of a number. Never collapses; siblings
 *  never expand into it. */
export function DeclinedCell({
  label,
  code,
  reason,
}: {
  label: string;
  code: string;
  reason: string;
}) {
  return (
    <div className="flex min-h-[168px] flex-col bg-surface-1 p-5">
      <div className="eyebrow mb-3">{label}</div>
      <ReasonChip code={code} />
      <p className="mt-2.5 text-[13px] leading-relaxed text-ink2">{reason}</p>
    </div>
  );
}

/** Chart-sized decline — the reason fills the whole chart's footprint, not a small note under
 *  an empty box. `wayOut` renders the "see this fund's Growth plan instead" escape hatch when
 *  the family has a measurable sibling; omitted entirely for a genuinely twinless family. */
export function DeclinedBlock({
  code,
  reason,
  minHeight = 230,
  wayOut,
}: {
  code: string;
  reason: string;
  minHeight?: number;
  wayOut?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col justify-center gap-3 px-1" style={{ minHeight }}>
      <ReasonChip code={code} />
      <p className="max-w-[60ch] text-[13.5px] leading-relaxed text-ink2">{reason}</p>
      {wayOut && (
        <a
          href={wayOut.href}
          className="group mt-1 inline-flex w-fit items-center gap-1.5 text-[12.5px] font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
        >
          {wayOut.label}
          <Icons.arrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      )}
    </div>
  );
}

/** The "showing the Growth twin" disclosure banner — must render whenever `via === "growth_twin"`,
 *  in the exact spirit of the prototype's `.viabar`. Never silent. */
export function GrowthTwinBanner({ planLabel }: { planLabel: string }) {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/[0.06] px-3.5 py-3 text-[12.5px] leading-relaxed text-ink2">
      <span
        className="num mt-0.5 inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10.5px] text-primary"
        style={{ borderColor: "color-mix(in oklch, var(--primary) 40%, transparent)" }}
      >
        growth twin
      </span>
      <span>
        Showing the <b className="font-semibold text-ink">{planLabel}</b>{" "}
        plan&apos;s series — this plan pays its gains out, so its own NAV understates what the
        fund earned. Same fund, same portfolio, same expense tier.
      </span>
    </div>
  );
}
