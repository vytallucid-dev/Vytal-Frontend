"use client";

/**
 * PART 1 · STEP 1 — "About You".
 *  • Display name (required, editable, pre-fillable from auth)  → ledger.displayName
 *  • AI explanation level: PROGRESSIVE DISCLOSURE. Three slim voice options in a
 *    row; only the SELECTED voice expands below to reveal its demo + answer.
 *    The old layout showed all three gif-led cards at once (three walls of text
 *    stacked) — the "too full" offender. Now you hear one voice at a time and
 *    tap to compare.  → register.aiLevel, kept entirely separate from the ledger.
 * Labels describe OUTPUT STYLE, never the user. No beginner/expert framing.
 */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { GifSlot } from "../gif-slot";
import { StepShell, QUESTION_LABEL, CAPTION, EASE } from "../primitives";
import { aboutConfig } from "../onboarding-config";
import type { AiLevel, OnboardingState } from "../onboarding-types";
import type { OnboardingAction } from "../onboarding-machine";
import { resolveAiLevel } from "../onboarding-machine";

const cardAccent: Record<AiLevel, "pristine" | "p-found" | "p-mom"> = {
  plain: "p-found",
  balanced: "pristine",
  technical: "p-mom",
};

export function AboutStep({
  state,
  dispatch,
  onBack,
  onContinue,
  canContinue,
  hint,
}: {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  hint?: string;
}) {
  const displayName = state.ledger.displayName ?? "";
  const aiLevel = resolveAiLevel(state);
  const cards = aboutConfig.aiLevel.cards;
  const selected = cards.find((c) => c.id === aiLevel) ?? cards[1];

  return (
    <StepShell
      eyebrow={aboutConfig.eyebrow}
      title={aboutConfig.title}
      subtitle={aboutConfig.subtitle}
      onBack={onBack}
      onContinue={onContinue}
      canContinue={canContinue}
      hint={hint}
    >
      {/* ── display name ── */}
      <div>
        <label htmlFor="onb-displayname" className={cn(QUESTION_LABEL, "block")}>
          {aboutConfig.displayName.label}
          <span className="ml-1 align-top text-sm text-danger">*</span>
        </label>
        <Input
          id="onb-displayname"
          value={displayName}
          onChange={(e) => dispatch({ type: "SET_DISPLAY_NAME", value: e.target.value })}
          placeholder={aboutConfig.displayName.placeholder}
          autoComplete="name"
          className="mt-3 h-11 max-w-sm text-base"
        />
        <p className="mt-2 text-xs text-ink3">{aboutConfig.displayName.hint}</p>
      </div>

      {/* ── AI explanation level (progressive disclosure) ── */}
      <div>
        <p className={QUESTION_LABEL}>{aboutConfig.aiLevel.label}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink2">
          One question —{" "}
          <span className="font-medium text-ink">{aboutConfig.aiLevel.sampleQuestion}</span>{" "}
          — answered three ways. Tap a voice to hear it.
        </p>

        {/* three slim voice options — one tap switches which answer is shown */}
        <div
          role="radiogroup"
          aria-label={aboutConfig.aiLevel.label}
          className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3"
        >
          {cards.map((card) => {
            const Icon = Icons[card.icon];
            const sel = aiLevel === card.id;
            return (
              <button
                key={card.id}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => dispatch({ type: "SET_AI_LEVEL", value: card.id })}
                className={cn(
                  "group flex flex-col gap-2 rounded-lg border p-3 text-left transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                  sel
                    ? "border-primary/55 bg-primary/[0.10] glow-sm"
                    : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-md border transition-colors",
                      sel
                        ? "border-primary/40 bg-primary/12 text-primary"
                        : "border-white/10 bg-white/5 text-ink2 group-hover:text-ink",
                    )}
                  >
                    <Icon weight="duotone" className="size-4" />
                  </span>
                  <span className="font-display text-sm font-semibold text-ink">
                    {card.name}
                  </span>
                  {sel && <Icons.check weight="bold" className="ml-auto size-3.5 text-primary" />}
                </span>
                <span className="text-[11.5px] leading-snug text-ink2">{card.tagline}</span>
              </button>
            );
          })}
        </div>

        {/* the selected voice's EXAMPLE — clearly a preview, not a fourth option:
            its own heading, room above it, and a dashed (non-selectable) frame */}
        <div className="mt-6">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Icons.spark weight="duotone" className="size-3.5 text-primary" />
            <span className="eyebrow">Example — how {selected.name} answers</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex flex-col gap-3 rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-3 sm:flex-row sm:items-center"
            >
              <div className="w-full shrink-0 sm:w-[150px]">
                <GifSlot
                  label={`${selected.name} demo`}
                  src={selected.gif}
                  aspect="16/9"
                  accent={cardAccent[selected.id]}
                  icon={selected.icon}
                  compact
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="kicker text-[9.5px] text-ink3">Its answer</span>
                <p className={CAPTION}>{selected.sampleAnswer}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs text-ink3">
          <Icons.info weight="duotone" className="mt-0.5 size-3.5 shrink-0 text-ink3" />
          {aboutConfig.aiLevel.reassurance}
        </p>
      </div>
    </StepShell>
  );
}
