"use client";

/**
 * Shared onboarding primitives + the ONE rhythm every step obeys.
 * ---------------------------------------------------------------------------
 * The redesign trades a tall SCROLL of stacked questions for a calm, PACED
 * surface: each step fills the card, sits its header + content up top, pins the
 * Back / Continue nav at the bottom, and lets airy glass breathe in between.
 * Nothing is crammed; the aurora shows through the empty space on purpose.
 *
 *   • StepHeader  → the editorial eyebrow + serif title + subcopy (shared)
 *   • StepNav     → the bottom-anchored Back / Continue row (shared)
 *   • StepShell   → header + content + spacer + nav, filling the card height
 *   • OptionRow   → one selectable option as a full-width editorial row
 *
 * Text scale lives here too so every step reads as one designed surface.
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Icons, type IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { navLabels } from "./onboarding-config";

/* ---- the shared scale ---------------------------------------------------- */
export const STEP_PAD_X = "px-5 sm:px-8";
export const QUESTION_LABEL =
  "font-display text-[0.98rem] font-medium leading-snug text-ink sm:text-[1.05rem]";
export const CAPTION = "text-[13px] leading-relaxed text-ink2";

/** House easing — one signature curve across the whole flow. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ---- StepHeader — the editorial header every step shares ----------------- */

export function StepHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn("flex flex-col gap-3", align === "center" && "items-center text-center")}
    >
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="font-display text-[1.55rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[1.95rem]">
        {title}
      </h1>
      {subtitle && (
        <p
          className={cn(
            "max-w-md text-sm leading-relaxed text-ink2 sm:text-[0.95rem]",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </motion.header>
  );
}

/* ---- StepNav — the calm, bottom-anchored Back / Continue row ------------- */

interface StepNavProps {
  onBack?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  backLabel?: string;
  hint?: string;
}

export function StepNav({
  onBack,
  onContinue,
  canContinue = true,
  continueLabel = navLabels.continue,
  backLabel = navLabels.back,
  hint,
}: StepNavProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex items-center justify-between gap-3 pt-8"
    >
      <Button type="button" variant="ghost" size="lg" onClick={onBack} className="gap-1.5">
        <Icons.arrowLeft className="size-4" />
        {backLabel}
      </Button>
      <div className="flex items-center gap-3">
        {!canContinue && hint && <span className="hidden text-xs text-ink3 sm:block">{hint}</span>}
        <Button
          type="button"
          size="lg"
          onClick={onContinue}
          disabled={!canContinue}
          className="group min-w-[9.5rem] gap-1.5"
        >
          {continueLabel}
          <Icons.arrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ---- StepShell — fills the card; content up top, nav pinned bottom -------
 * The flex column + flex-1 spacer is what gives the flow its breathing room:
 * a short step no longer stretches its content to fill — it sits calmly with
 * glass (and aurora) below it, nav anchored at the base. */

interface StepShellProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  headerAlign?: "left" | "center";
  children: React.ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  hint?: string;
}

export function StepShell({
  eyebrow,
  title,
  subtitle,
  headerAlign,
  children,
  onBack,
  onContinue,
  canContinue = true,
  continueLabel = navLabels.continue,
  hint,
}: StepShellProps) {
  return (
    <div className={cn("flex min-h-full flex-col pb-6 pt-8 sm:pt-9", STEP_PAD_X)}>
      <StepHeader eyebrow={eyebrow} title={title} subtitle={subtitle} align={headerAlign} />

      {/* gap-9 so stacked questions read as distinct blocks, not one paragraph */}
      <div className="mt-7 flex flex-col gap-9 sm:mt-8">{children}</div>

      {/* the breathing room — airy glass between content and nav */}
      <div className="min-h-[1.5rem] flex-1" />

      {onContinue && (
        <StepNav
          onBack={onBack}
          onContinue={onContinue}
          canContinue={canContinue}
          continueLabel={continueLabel}
          hint={hint}
        />
      )}
    </div>
  );
}

/* ---- OptionRow — one selectable option, a full-width editorial row -------
 * Icon chip · label + sublabel · selection tick. Single accent-glow selected
 * state. Wider and calmer than the old grid tiles, so one question can own the
 * frame. */

interface OptionRowProps {
  label: string;
  sublabel?: string;
  icon?: IconName;
  selected: boolean;
  onSelect: () => void;
  index?: number;
  name?: string;
}

export function OptionRow({
  label,
  sublabel,
  icon,
  selected,
  onSelect,
  index = 0,
  name,
}: OptionRowProps) {
  const Icon = icon ? Icons[icon] : null;
  return (
    <motion.button
      type="button"
      role={name ? "radio" : undefined}
      aria-checked={name ? selected : undefined}
      aria-pressed={name ? undefined : selected}
      onClick={onSelect}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: EASE }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group relative flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        selected
          ? "border-primary/55 bg-primary/[0.11] glow-sm"
          : "border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]",
      )}
    >
      {Icon && (
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg border transition-colors",
            selected
              ? "border-primary/40 bg-primary/12 text-primary"
              : "border-white/10 bg-white/5 text-ink2 group-hover:text-ink",
          )}
        >
          <Icon weight="duotone" className="size-[18px]" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold leading-tight text-ink">{label}</span>
        {sublabel && <span className="mt-0.5 text-xs leading-snug text-ink2">{sublabel}</span>}
      </span>
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border transition-all",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-line3 bg-transparent text-transparent",
        )}
      >
        <Icons.check weight="bold" className="size-3" />
      </span>
    </motion.button>
  );
}
