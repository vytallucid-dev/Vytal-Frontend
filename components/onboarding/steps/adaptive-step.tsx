"use client";

/**
 * PART 2.5 — ADAPTIVE FOLLOW-UP. Reached ONLY when exactly one trigger matched
 * (priority 1→2→3, decided in the machine). Shows that one trigger's question;
 * answering writes a FACT to ledger.flags — it never overwrites a raw answer.
 *
 * The chosen option is DERIVED from state (flags + the answered marker), so the
 * screen is resumable even for the "no flag" option. Presentation now matches
 * the paced rhythm: one calm question, wide stacked options, nav at the base.
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Icons } from "@/lib/icons";
import { OptionRow, StepShell, EASE } from "../primitives";
import { adaptiveConfig } from "../onboarding-config";
import type { AdaptiveOption } from "../onboarding-config";
import type { OnboardingState } from "../onboarding-types";
import type { OnboardingAction } from "../onboarding-machine";
import { evaluateAdaptive } from "../onboarding-machine";

function anyFlagSet(state: OnboardingState): boolean {
  return Object.values(state.ledger.flags).some(Boolean);
}

/** Fully derivable selection — works for the "no flag" option too. */
function isSelected(state: OnboardingState, opt: AdaptiveOption): boolean {
  const answered = state.meta.completedSteps.includes("adaptive:answered");
  if (opt.flag === null) return answered && !anyFlagSet(state);
  return state.ledger.flags[opt.flag] === true;
}

export function AdaptiveStep({
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
  // Which trigger are we on? Derived from the same evaluation the machine used.
  const triggerId = evaluateAdaptive(state);
  const trigger = triggerId ? adaptiveConfig.triggers[triggerId] : null;

  // Safety net: if (somehow) no trigger applies, don't trap the user here.
  if (!trigger) {
    return (
      <StepShell
        eyebrow={adaptiveConfig.eyebrow}
        title="All set"
        onBack={onBack}
        onContinue={onContinue}
        canContinue
      >
        <p className="text-sm text-ink2">Nothing more to ask — let's keep going.</p>
      </StepShell>
    );
  }

  return (
    <StepShell
      eyebrow={trigger.eyebrow}
      title={trigger.question}
      onBack={onBack}
      onContinue={onContinue}
      canContinue={canContinue}
      hint={hint}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.06, ease: EASE }}
        className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-ink2"
      >
        <Icons.spark weight="duotone" className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          A quick follow-up based on what you told us — it just fine-tunes the
          fit. There's no wrong pick.
        </span>
      </motion.div>

      <div
        role="radiogroup"
        aria-label={trigger.question}
        className="flex flex-col gap-3"
      >
        {trigger.options.map((opt, oi) => (
          <OptionRow
            key={opt.label}
            name={`adaptive-${trigger.id}`}
            label={opt.label}
            sublabel={opt.sublabel}
            icon={opt.icon}
            index={oi}
            selected={isSelected(state, opt)}
            onSelect={() => dispatch({ type: "SET_ADAPTIVE", flag: opt.flag })}
          />
        ))}
      </div>
    </StepShell>
  );
}
