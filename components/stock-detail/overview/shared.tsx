"use client";

/**
 * Shared primitives + formatters for the Overview tab. Every colour is a design-system
 * token (text-ink, bg-surface-1, border-line, var(--p-*)) — never a raw hex, never a
 * Tailwind colour name. The Overview "lobby" reuses the Health tab's calm rhythm
 * (eyebrow · Panel · .num on every number) so the two tabs read as one product.
 *
 * DISCIPLINE NOTE: the helpers here are DISPLAY-only. There is no verdict word, no
 * green→red buy-grading, no "outperformer/strong/suitable". Returns and ratios are
 * stated as facts; the user judges. (The one exception — the Competitive Standing
 * block — owns its own deterministic, spec-locked copy in section-standing.tsx.)
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icons, type Icon } from "@/lib/icons";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow, tint } from "../health/shared";

export const DASH = "—";

// `tint` is shared from health/shared (single source); re-exported for local consumers.
export { tint };

/** Directional colour for a signed price move — gains green, losses red, flat neutral.
 *  This is factual PRICE DIRECTION (up/down), not a health/quality buy-grade. */
export function toneColor(v: number | null | undefined): string {
  if (v == null || v === 0) return "var(--ink2)";
  return v > 0 ? "var(--success)" : "var(--danger)";
}

// ── formatters (factual; .num at the render site) ──────────────────────────────
export const fmtPrice = (v: number | null | undefined, dp = 2) =>
  v == null ? DASH : `₹${v.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

export const fmtPct = (v: number | null | undefined, dp = 1) => (v == null ? DASH : `${v.toFixed(dp)}%`);

/** Signed percent ("+18.2%" / "−5.4%"). Sign carries direction — NO colour grading. */
export const fmtSignedPct = (v: number | null | undefined, dp = 1) => {
  if (v == null) return DASH;
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(dp)}%`;
};

export const fmtX = (v: number | null | undefined, dp = 2) => (v == null ? DASH : `${v.toFixed(dp)}×`);
export const fmtRatio = (v: number | null | undefined, dp = 2) => (v == null ? DASH : v.toFixed(dp));

/** ₹ Cr with Lakh-Cr rollover for large caps (₹3.21 L Cr) — a fact, not a judgement. */
export function fmtMarketCap(v: number | null | undefined): string {
  if (v == null) return DASH;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(2)} L Cr`;
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

/** Format a raw metric value by its unit label (from getMetricLabel). */
export function fmtByUnit(v: number | null | undefined, unit?: string): string {
  if (v == null) return DASH;
  switch (unit) {
    case "%":
      return `${v.toFixed(1)}%`;
    case "×":
      return `${v.toFixed(2)}×`;
    case "days":
      return `${v.toFixed(0)}d`;
    case "ratio":
      return v.toFixed(2);
    default:
      return v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
}

// ── section shell — coloured icon · label · hairline · optional pill ───────────
export function Section({
  id,
  label,
  pill,
  icon: Glyph,
  accent = "var(--p-found)",
  children,
}: {
  id: string;
  label: string;
  pill?: string;
  icon?: Icon;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <section id={id} className="scroll-mt-24">
        <SectionEyebrow label={label} pill={pill} icon={Glyph} accent={accent} />
        {children}
      </section>
    </Reveal>
  );
}

/** Honest-empty placeholder — calm, never a fabricated value. */
export function HonestEmpty({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface-1 px-5 py-8 text-center text-[12.5px] text-ink3", className)}>
      {children}
    </div>
  );
}

/** A small inline loading shimmer block (per-section independent load). */
export function LoadingBlock({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl bg-surface-2", className)} />;
}

/** Neutral category / standing chip — faint accent only, NO green=good colouring.
 *  An optional `dot` adds a faint identity-coloured marker (e.g. the metric's pillar)
 *  — identity, not a grade. */
export function Chip({
  children,
  tone = "neutral",
  dot,
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
  dot?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px]",
        tone === "accent"
          ? "border-line2 bg-surface-2 text-ink2"
          : "border-line bg-surface-2 text-ink3",
        className,
      )}
    >
      {dot && <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />}
      {children}
    </span>
  );
}

/** A labelled stat tile (surface · hairline). Value uses .num. */
export function StatTile({
  label,
  value,
  sub,
  accentClass,
}: {
  label: string;
  value: string;
  sub?: string;
  accentClass?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="text-[11px] text-ink3">{label}</div>
      <div className={cn("num mt-1 text-[18px] font-semibold", accentClass ?? "text-ink")}>{value}</div>
      {sub && <div className="num mt-0.5 text-[11px] text-ink3">{sub}</div>}
    </div>
  );
}

/** The single (↗) funnel into a deeper tab — the lobby's "go deeper" door. */
export function Funnel({ tab, symbol, label }: { tab: string; symbol: string; label: string }) {
  return (
    <Link
      href={`/research/stock-screener/${symbol}?tab=${tab}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
    >
      {label}
      <Icons.arrowUpRight className="h-3 w-3" />
    </Link>
  );
}

// The §8 "What's Next" routing cards now live in the shared `WhereNext` component
// (../where-next) so every tab's nav footer is identical and colourful.
