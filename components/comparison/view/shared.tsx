"use client";

/**
 * Shared presentational primitives for the comparison VIEW.
 *
 * The two entities are distinguished by TWO CALM IDENTITY HUES (A = Foundation token,
 * B = Momentum token) — NOT good/bad green-vs-red. They are two colours, not a winner
 * colour and a loser colour. Nothing here ranks one side over the other: no winner
 * column, no per-metric highlight, no ✓/✗. Tables show exact values with an honest "—"
 * for nulls; overlay graphs are used only where the SHAPE of difference is the insight.
 */

import { cn } from "@/lib/utils";
import { formatCompact } from "@/lib/format";
import { tint } from "@/components/stock-detail/health/shared";
import { Icons, type Icon } from "@/lib/icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { MetricUnit } from "@/types/compare";

/** A/B identity hues — neutral pillar tokens, reused consistently across every tab. */
export const A_HUE = "var(--p-found)";
export const B_HUE = "var(--p-mom)";

/** Format a single metric value for display. `null` → an honest em-dash. No value is
 *  ever styled by whether it is "good" — formatting is identity-neutral. */
export function formatMetricValue(value: number | string | null, unit: MetricUnit): string {
  if (value === null || value === undefined) return "—";

  // String-valued universal metrics (band / marker / flag) arrive pre-resolved.
  if (typeof value === "string") {
    if (value.length === 0) return "—";
    return value
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  switch (unit) {
    case "score":
      return value.toFixed(1);
    case "pct":
      return `${value.toFixed(2)}%`;
    case "cr":
      return `₹${formatCompact(value)} Cr`;
    case "rupees":
      return `₹${value.toFixed(2)}`;
    case "ratio":
      return value.toFixed(2);
    case "multiple":
      return `${value.toFixed(2)}×`;
    case "band":
    case "marker":
    case "flag":
      return String(value);
    default:
      return String(value);
  }
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface-1 p-5", className)}>
      {children}
    </div>
  );
}

/**
 * InfoTip — a small "ⓘ" affordance that reveals a fuller explanation on hover/focus. Built
 * on the platform Radix tooltip (light chip on the dark theme). Used to define terms and to
 * explain how to read a section WITHOUT crowding the surface with permanent body copy.
 */
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
      <TooltipContent className="max-w-xs text-left leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Section header — mirrors the platform `SectionEyebrow` (tinted icon chip / accent bar
 * · label · tinted hairline · optional pill) so the comparison reads with the same
 * coloured rhythm as the stock-detail page, instead of flat grey. The optional `hint`
 * keeps the honest one-line explanation the comparison relies on; the optional `info`
 * adds a hover tooltip (deeper "how to read it / caveat") next to the title. `accent`
 * carries the per-section colour (health → --p-found, price → --p-mkt, ownership → --p-own).
 */
export function SectionTitle({
  children,
  hint,
  info,
  accent = "var(--p-found)",
  icon: Glyph,
  pill,
}: {
  children: React.ReactNode;
  hint?: string;
  info?: string;
  accent?: string;
  icon?: Icon;
  pill?: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2.5">
        {Glyph ? (
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border"
            style={tint(accent)}
          >
            <Glyph weight="duotone" className="h-4 w-4" />
          </span>
        ) : (
          <span className="h-3.5 w-[3px] shrink-0 rounded-full" style={{ background: accent }} />
        )}
        <h3 className="shrink-0 text-sm font-semibold text-ink">{children}</h3>
        {info && <InfoTip text={info} />}
        <span
          className="h-px flex-1"
          style={{ background: `color-mix(in oklch, ${accent} 20%, var(--line))` }}
        />
        {pill && (
          <span
            className="num shrink-0 rounded-full border px-2.5 py-1 text-[11px] tracking-normal"
            style={tint(accent, 10, 26)}
          >
            {pill}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink3">{hint}</p>}
    </div>
  );
}

export function HonestEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line2 bg-surface-1 px-4 py-6 text-center text-sm text-ink3">
      {children}
    </div>
  );
}

/** A | B legend — two dots in the identity hues. */
export function LegendAB({ aLabel, bLabel }: { aLabel: string; bLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-ink3">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: A_HUE }} />
        <span className="num font-medium text-ink2">{aLabel}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: B_HUE }} />
        <span className="num font-medium text-ink2">{bLabel}</span>
      </span>
    </div>
  );
}

export interface CompareRow {
  key: string;
  label: string;
  unit: MetricUnit;
  a: number | string | null;
  b: number | string | null;
}

/**
 * The core side-by-side TABLE — two value columns A | B. Label + unit-aware values,
 * honest "—" for nulls. There is NO winner column and NO highlight of the "better"
 * value: both columns are styled identically. The only colour is the A/B identity hue
 * on the column headers.
 */
export function CompareTable({
  aLabel,
  bLabel,
  rows,
}: {
  aLabel: string;
  bLabel: string;
  rows: CompareRow[];
}) {
  if (rows.length === 0) {
    return <HonestEmpty>No metrics available for this section.</HonestEmpty>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-1 text-left">
            <th className="px-4 py-2.5 font-medium text-ink3">Metric</th>
            <th className="px-4 py-2.5 text-right font-semibold">
              <span className="num" style={{ color: A_HUE }}>
                {aLabel}
              </span>
            </th>
            <th className="px-4 py-2.5 text-right font-semibold">
              <span className="num" style={{ color: B_HUE }}>
                {bLabel}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.key}
              className={cn(
                "border-b border-line last:border-0",
                i % 2 === 1 && "bg-surface-1/50",
              )}
            >
              <td className="px-4 py-2.5 text-ink2">{r.label}</td>
              <td className="num px-4 py-2.5 text-right text-ink">
                {formatMetricValue(r.a, r.unit)}
              </td>
              <td className="num px-4 py-2.5 text-right text-ink">
                {formatMetricValue(r.b, r.unit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A single entity's FAMILY-SPECIFIC metrics, rendered as a labeled value list — NOT a
 * side-by-side. Used for the cross-family case where these are explicitly not directly
 * comparable across the two entities.
 */
export function FamilyMetricList({
  hue,
  rows,
}: {
  hue: string;
  rows: { key: string; label: string; unit: MetricUnit; value: number | null }[];
}) {
  if (rows.length === 0) {
    return <HonestEmpty>No family-specific metrics on file.</HonestEmpty>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.key}
              className={cn(
                "border-b border-line last:border-0",
                i % 2 === 1 && "bg-surface-1/50",
              )}
            >
              <td className="px-4 py-2.5 text-ink2">{r.label}</td>
              <td className="num px-4 py-2.5 text-right font-medium" style={{ color: hue }}>
                {formatMetricValue(r.value, r.unit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
