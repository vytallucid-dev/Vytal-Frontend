"use client";

/**
 * GifSlot — the labelled placeholder for a real-platform screen capture.
 * ---------------------------------------------------------------------------
 * Every gif in onboarding is a capture of the real product, which doesn't exist
 * yet. Rather than fabricate fake UI (misleading) or leave a broken-image gap
 * (ugly), each slot renders a clean, aspect-ratio-correct, on-brand container
 * that reads unmistakably as "▶ gif goes here".
 *
 * SINGLE SWAP POINT: pass `src` (wired from a `gif` field in config). When it's
 * null → placeholder. When it's a URL → the real media drops straight in, same
 * box, same aspect ratio. Nothing else changes.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icons, type IconName } from "@/lib/icons";

interface GifSlotProps {
  /** short human label, e.g. "Health Score demo" */
  label: string;
  /** THE swap point. null → placeholder; URL → real gif/video. */
  src?: string | null;
  /** CSS aspect ratio, e.g. "16/9", "4/3", "1/1". Keeps the box correct. */
  aspect?: string;
  /** optional accent to tint the placeholder glow (token color name) */
  accent?: "pristine" | "p-found" | "p-mom" | "p-mkt" | "p-own";
  /** optional icon shown in the placeholder */
  icon?: IconName;
  className?: string;
  /** compact variant tones down chrome for small tiles */
  compact?: boolean;
}

const accentVar: Record<NonNullable<GifSlotProps["accent"]>, string> = {
  pristine: "var(--c-pristine)",
  "p-found": "var(--p-found)",
  "p-mom": "var(--p-mom)",
  "p-mkt": "var(--p-mkt)",
  "p-own": "var(--p-own)",
};

export function GifSlot({
  label,
  src = null,
  aspect = "16/9",
  accent = "pristine",
  icon = "spark",
  className,
  compact = false,
}: GifSlotProps) {
  const glow = accentVar[accent];
  const Icon = Icons[icon];

  return (
    <div
      className={cn(
        "group/gif relative w-full max-w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]",
        className,
      )}
      style={{ aspectRatio: aspect }}
      role="img"
      aria-label={`${label} (demo preview placeholder)`}
    >
      {src ? (
        // ── real media (drops in later via config `gif`) ──
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${label} demo`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // ── on-brand placeholder ──
        <>
          {/* dotted backdrop + accent radial glow */}
          <div className="absolute inset-0 bg-dots opacity-40" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-70"
            style={{
              background: `radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, ${glow} 16%, transparent), transparent 60%)`,
            }}
          />
          {/* slow shimmer sweep so it reads as "live" */}
          <div className="pointer-events-none absolute inset-0 shimmer opacity-60" />

          {/* top chrome: DEMO chip + faux window dots */}
          {!compact && (
            <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-3 py-2.5">
              <span className="flex gap-1">
                <span className="size-1.5 rounded-full bg-line3" />
                <span className="size-1.5 rounded-full bg-line3" />
                <span className="size-1.5 rounded-full bg-line3" />
              </span>
              <span
                className="ml-auto rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  color: glow,
                  borderColor: `color-mix(in oklab, ${glow} 40%, transparent)`,
                  background: `color-mix(in oklab, ${glow} 10%, transparent)`,
                }}
              >
                Demo
              </span>
            </div>
          )}

          {/* center: play button + label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <span
              className={cn(
                "grid place-items-center rounded-full border backdrop-blur-sm transition-transform duration-300 group-hover/gif:scale-105",
                compact ? "size-9" : "size-12",
              )}
              style={{
                borderColor: `color-mix(in oklab, ${glow} 45%, transparent)`,
                background: `color-mix(in oklab, ${glow} 12%, transparent)`,
                boxShadow: `0 8px 30px -10px color-mix(in oklab, ${glow} 60%, transparent)`,
              }}
            >
              <Icons.caretRight
                weight="fill"
                className={compact ? "size-3.5" : "size-5"}
                style={{ color: glow, marginLeft: "2px" }}
              />
            </span>
            <div className="flex items-center gap-1.5">
              {!compact && <Icon weight="duotone" className="size-3.5 text-ink3" />}
              <span
                className={cn(
                  "font-medium text-ink2",
                  compact ? "text-[11px]" : "text-xs sm:text-sm",
                )}
              >
                {label}
              </span>
            </div>
          </div>

          {/* faux scrubber at the bottom to complete the "video" read */}
          {!compact && (
            <div className="absolute inset-x-3 bottom-2.5 flex items-center gap-2">
              <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-line2">
                <div
                  className="h-full w-1/3 rounded-full"
                  style={{ background: `color-mix(in oklab, ${glow} 70%, transparent)` }}
                />
              </div>
              <span className="num text-[9px] text-ink3">0:07</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
