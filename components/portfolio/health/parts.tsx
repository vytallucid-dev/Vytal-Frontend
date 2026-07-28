"use client";

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH TAB — shared visual primitives (Part A). Two DISTINCT read identities live
// here so the health read (premium) and the construction read (blueprint) never look
// like two competing quality scores. Everything renders server values as-is; the only
// client math is explicitly-labelled display arithmetic (bar widths), never a stored-score internal.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CoverageState, StructureTier, CapitalTier } from "@/types/portfolio";
import { BLUEPRINT_ACCENT, COVERAGE_COLOR, stockHealthHref } from "../lib";

export const CARD = "rounded-2xl border border-line bg-surface-1 p-5 sm:p-6";

// ── themed tooltip helpers — ONE home for the health tab's hover-reveals, so every section
//    header, chart, bar and card explains itself in the same voice and the same visual
//    language. The shadcn Tooltip already carries the theme (surface-3 · line2 · ink); these
//    just standardise width, placement and the info marker so call-sites stay terse. ─────────
type TipSide = "top" | "bottom" | "left" | "right";

/** Wrap any element so it reveals a themed tooltip on hover / keyboard-focus. The child IS the
 *  trigger — a chart, bar, chip or value — so nothing visible is added around it. */
export function Tip({
  content,
  children,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: TipSide;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={6}
        collisionPadding={12}
        className={cn("max-w-[min(280px,calc(100vw-24px))] text-left text-[11.5px] leading-relaxed", className)}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/** A small "i" marker that reveals a themed tooltip — for attaching context to a header or
 *  kicker without disturbing its layout. Keyboard-focusable, and never swallows a parent's
 *  click/expand (it preventDefaults + stops propagation). */
export function InfoTip({
  children,
  side = "top",
  className,
}: {
  children: React.ReactNode;
  side?: TipSide;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={cn(
            "inline-grid size-3.5 shrink-0 cursor-help place-items-center rounded-full text-ink3 outline-none transition-colors hover:text-ink2 focus-visible:text-ink2",
            className,
          )}
        >
          <Icons.info weight="regular" className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={6}
        collisionPadding={12}
        className="max-w-[min(280px,calc(100vw-24px))] text-left text-[11.5px] leading-relaxed"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

// ── the premium (health) surface — raised, warm band-tinted glow ──────────────────────
export function HealthShell({ accent, children, className }: { accent: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border p-5 sm:p-6", className)}
      style={{
        borderColor: "var(--line2)",
        background: `radial-gradient(120% 130% at 100% 0%, color-mix(in oklch, ${accent} 9%, transparent), transparent 55%), var(--surface-1)`,
      }}
    >
      {children}
    </div>
  );
}

// ── the blueprint (construction) surface — cooler, bracketed corners + faint slate glow ─
export function BlueprintShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border p-5 sm:p-6", className)}
      style={{
        borderColor: "color-mix(in oklch, " + BLUEPRINT_ACCENT + " 22%, var(--line))",
        background: `radial-gradient(120% 130% at 100% 0%, color-mix(in oklch, ${BLUEPRINT_ACCENT} 8%, transparent), transparent 55%), var(--surface-1)`,
      }}
    >
      {/* bracketed corners — the blueprint motif */}
      <div className="relative">{children}</div>
    </div>
  );
}

// ── stage badge — Starter / Building / Established book (structure_tier, copy-only) ───
const STAGE_LABEL: Record<StructureTier, string> = { Starter: "Starter book", Building: "Building book", Established: "Established book" };
export function StageBadge({ tier }: { tier: StructureTier | null }) {
  if (!tier) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: BLUEPRINT_ACCENT, borderColor: `color-mix(in oklch, ${BLUEPRINT_ACCENT} 34%, transparent)`, background: `color-mix(in oklch, ${BLUEPRINT_ACCENT} 11%, transparent)` }}
    >
      <Icons.chartBar weight="duotone" className="size-3.5" />
      {STAGE_LABEL[tier]}
    </span>
  );
}

const CAPITAL_LABEL: Record<CapitalTier, string> = { Modest: "Modest", Moderate: "Moderate", Substantial: "Substantial" };
export function CapitalPill({ tier }: { tier: CapitalTier | null }) {
  if (!tier) return null;
  return (
    <span className="num rounded-md border border-line2 bg-surface-2 px-2 py-0.5 text-[10.5px] text-ink3">
      {CAPITAL_LABEL[tier]} capital
    </span>
  );
}

// ── the band ribbon — a 4px 0–100 track tinted the band colour, with a marker at the
//    value's position. Gives the hero number a place on the scale, not just a value.
//    (display arithmetic, never a stored-score internal.) ────────────────────────────────────────
export function BandRibbon({ value, color }: { value: number; color: string }) {
  const pos = Math.max(0, Math.min(100, value)); // display arithmetic, never a stored-score internal
  return (
    <div className="relative mt-3 h-1 w-full max-w-[240px] rounded-full" style={{ background: `color-mix(in oklch, ${color} 24%, var(--surface-3))` }}>
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pos}%`, background: `color-mix(in oklch, ${color} 60%, transparent)` }} />
      <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2" style={{ left: `${pos}%`, background: color, boxShadow: "0 0 0 2px var(--surface-1)" }} />
    </div>
  );
}

// ── the coverage bar — Scored / Awaiting (shimmering "lighting up") / Untracked. A
//    3-segment read of the book by value across health coverage. ────────────────────────
export function CoverageBar({ cs, height = "h-7" }: { cs: CoverageState; height?: string }) {
  const segs = [
    { key: "scored", label: "Scored", w: cs.scoredWeight, color: COVERAGE_COLOR.scored, shimmer: false, desc: "Holdings we've scored on fundamentals — the businesses behind the Health number." },
    { key: "awaiting", label: "Awaiting coverage", w: cs.recognizedUnscoredWeight, color: COVERAGE_COLOR.awaiting, shimmer: true, desc: "Recognised names we cover but haven't scored yet. They light up as coverage completes — never faked into the number." },
    { key: "untracked", label: "Untracked", w: cs.smallUnscoredWeight, color: COVERAGE_COLOR.untracked, shimmer: false, desc: "Small or by-design holdings we don't score (funds, ETFs, gold, government paper). Not a gap." },
  ].filter((s) => s.w > 0);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="kicker flex items-center gap-1.5">
          Your capital, across health coverage
          <InfoTip>
            How your book value splits across health coverage: <b className="font-semibold text-ink">scored</b> (we can judge it),{" "}
            <b className="font-semibold text-ink">awaiting</b> (covered, not yet scored) and <b className="font-semibold text-ink">untracked</b> (small
            or by-design). Coverage is confidence, never a penalty on the number.
          </InfoTip>
        </p>
        <span className="text-[10.5px] text-ink3">% of book value</span>
      </div>
      <div className={cn("flex gap-0.5 overflow-hidden rounded-lg", height)}>
        {segs.map((s) => {
          const p = s.w * 100; // display arithmetic
          return (
            <Tip
              key={s.key}
              content={
                <>
                  <span className="font-semibold text-ink">{s.label} · {p.toFixed(1)}% of book value</span>
                  <span className="mt-1 block text-ink2">{s.desc}</span>
                </>
              }
            >
              <div
                className="num relative flex cursor-help items-center justify-center overflow-hidden text-[11px] font-medium"
                style={{ flex: Math.max(p, 2), background: s.color, color: "#0a0b0e" }}
              >
                {s.shimmer && <span className="shimmer absolute inset-0" aria-hidden />}
                <span className="relative">{p >= 9 ? `${Math.round(p)}%` : ""}</span>
              </div>
            </Tip>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink2">
        {segs.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px]" style={{ background: s.color }} />
            {s.label} {Math.round(s.w * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ── link-out affordance — a diagnostic must lead somewhere (Part D). A quiet "open" link,
//    never an action CTA. To a per-stock health page, or (via onClick) an in-hub tab. ────
export function OpenLink({ href, onClick, children, className }: { href?: string; onClick?: () => void; children: React.ReactNode; className?: string }) {
  // A legible affordance — a small bordered chip, not faint text (the old text-ink3 read as
  // decoration and was missed). Tone-neutral so it reads as "click" on any card background.
  const cls = cn(
    "inline-flex items-center gap-1 rounded-md border border-line2 bg-surface-2 px-2 py-1 text-[11.5px] font-medium text-ink2 transition-colors hover:border-line3 hover:bg-surface-3 hover:text-ink",
    className,
  );
  const body = (
    <>
      {children}
      <Icons.arrowUpRight className="size-3" />
    </>
  );
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

/** A holding/symbol → its per-stock health page. */
export function SymbolLink({ symbol, className }: { symbol: string; className?: string }) {
  return (
    <Link href={stockHealthHref(symbol)} className={cn("transition-colors hover:text-primary", className)}>
      {symbol}
    </Link>
  );
}
