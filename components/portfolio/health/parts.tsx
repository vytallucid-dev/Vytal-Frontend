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
import type { CoverageState, StructureTier, CapitalTier } from "@/types/portfolio";
import { BLUEPRINT_ACCENT, COVERAGE_COLOR, stockHealthHref } from "../lib";

export const CARD = "rounded-2xl border border-line bg-surface-1 p-5 sm:p-6";

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

// ── the blueprint (construction) surface — cooler, bracketed corners + faint grid ─────
export function BlueprintShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border p-5 sm:p-6", className)}
      style={{
        borderColor: "color-mix(in oklch, " + BLUEPRINT_ACCENT + " 22%, var(--line))",
        background:
          "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px), var(--surface-1)",
        backgroundSize: "22px 22px, 22px 22px, auto",
        backgroundPosition: "center",
      }}
    >
      {/* bracketed corners — the blueprint motif */}
      <span className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 rounded-tl-[3px] border-l border-t" style={{ borderColor: BLUEPRINT_ACCENT, opacity: 0.55 }} />
      <span className="pointer-events-none absolute right-2.5 top-2.5 h-3 w-3 rounded-tr-[3px] border-r border-t" style={{ borderColor: BLUEPRINT_ACCENT, opacity: 0.55 }} />
      <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-3 w-3 rounded-bl-[3px] border-b border-l" style={{ borderColor: BLUEPRINT_ACCENT, opacity: 0.55 }} />
      <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-3 w-3 rounded-br-[3px] border-b border-r" style={{ borderColor: BLUEPRINT_ACCENT, opacity: 0.55 }} />
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
    { key: "scored", label: "Scored", w: cs.scoredWeight, color: COVERAGE_COLOR.scored, shimmer: false },
    { key: "awaiting", label: "Awaiting coverage", w: cs.recognizedUnscoredWeight, color: COVERAGE_COLOR.awaiting, shimmer: true },
    { key: "untracked", label: "Untracked", w: cs.smallUnscoredWeight, color: COVERAGE_COLOR.untracked, shimmer: false },
  ].filter((s) => s.w > 0);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="kicker">Your capital, across health coverage</p>
        <span className="text-[10.5px] text-ink3">% of book value</span>
      </div>
      <div className={cn("flex gap-0.5 overflow-hidden rounded-lg", height)}>
        {segs.map((s) => {
          const p = s.w * 100; // display arithmetic
          return (
            <div
              key={s.key}
              className="num relative flex items-center justify-center overflow-hidden text-[11px] font-medium"
              style={{ flex: Math.max(p, 2), background: s.color, color: "#0a0b0e" }}
              title={`${s.label} ${p.toFixed(1)}%`}
            >
              {s.shimmer && <span className="shimmer absolute inset-0" aria-hidden />}
              <span className="relative">{p >= 9 ? `${Math.round(p)}%` : ""}</span>
            </div>
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
  const cls = cn(
    "inline-flex items-center gap-1 text-[11.5px] text-ink3 transition-colors hover:text-ink2",
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
