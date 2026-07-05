"use client";

/**
 * PART 2 · STEP 2 — "Finance & Investing", now PACED: one question at a time.
 * ---------------------------------------------------------------------------
 * The four questions used to stack into a 12-tile wall (the main "too full"
 * offender). They're now a calm sequence — one spotlit question at a time, three
 * wide options. Selecting records the answer; advancing is a deliberate Next
 * click (no auto-scroll). A slim segmented bar keeps the "4 reads" promise clear.
 *
 * Nothing about the DATA changed: every option still writes the same raw fact
 * to the same ledger field. Question paging is LOCAL UI state; the machine's
 * step-level contract (Finance completes once all four are answered) is intact.
 */

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { OptionRow, StepNav, STEP_PAD_X, EASE } from "../primitives";
import { financeConfig, navLabels } from "../onboarding-config";
import type { FinanceField, OnboardingState } from "../onboarding-types";
import type { OnboardingAction } from "../onboarding-machine";

export function FinanceStep({
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
  const reduce = useReducedMotion();
  const questions = financeConfig.questions;
  const total = questions.length;

  const answerOf = (i: number) =>
    state.ledger[questions[i].field as FinanceField] as string | null;
  const firstUnanswered = questions.findIndex((_, i) => answerOf(i) == null);
  const maxReachable = firstUnanswered === -1 ? total - 1 : firstUnanswered;

  // Resume where the user left off: first unanswered question, else the last.
  const [qIndex, setQIndex] = React.useState(() =>
    firstUnanswered === -1 ? total - 1 : firstUnanswered,
  );
  const [dir, setDir] = React.useState(1);

  const goTo = (i: number, d: number) => {
    setDir(d);
    setQIndex(i);
  };

  const q = questions[qIndex];
  const current = answerOf(qIndex);
  const isLast = qIndex === total - 1;

  // Record the answer only — moving on is a deliberate Next click, never auto.
  const select = (value: string) => {
    dispatch({ type: "SET_FINANCE", field: q.field as FinanceField, value });
  };

  const goPrev = () => (qIndex > 0 ? goTo(qIndex - 1, -1) : onBack());
  const goForward = () => (isLast ? onContinue() : goTo(qIndex + 1, 1));
  const canForward = isLast ? canContinue : current != null;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 44, filter: "blur(4px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -44, filter: "blur(4px)" }),
  };

  return (
    <div className={cn("flex min-h-full flex-col pb-7 pt-8 sm:pt-10", STEP_PAD_X)}>
      {/* slim sub-progress — keeps "four quick reads" honest without a wall */}
      <div className="flex items-center gap-3">
        <span className="eyebrow min-w-0 truncate">{financeConfig.eyebrow}</span>
        <span className="h-px flex-1 bg-line" />
        <span className="num shrink-0 text-xs text-ink3">
          <span className="text-ink2">{qIndex + 1}</span> / {total}
        </span>
      </div>
      <div className="mt-3 flex gap-1.5" role="presentation">
        {questions.map((qq, i) => {
          const reachable = i <= maxReachable;
          return (
            <button
              key={qq.field}
              type="button"
              aria-label={`Question ${i + 1}`}
              disabled={!reachable}
              onClick={() => reachable && goTo(i, i > qIndex ? 1 : -1)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                reachable ? "cursor-pointer" : "cursor-default",
                i === qIndex
                  ? "bg-primary"
                  : answerOf(i) != null
                    ? "bg-primary/45 hover:bg-primary/60"
                    : "bg-line2",
              )}
            />
          );
        })}
      </div>

      {/* the one spotlit question */}
      <div className="relative mt-9 flex-1">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={q.field}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.34, ease: EASE }}
          >
            <span className="eyebrow">{q.eyebrow}</span>
            <h2 className="mt-2.5 font-display text-[1.3rem] font-semibold leading-[1.14] tracking-tight text-ink sm:text-[1.6rem]">
              {q.title}
            </h2>
            <div
              role="radiogroup"
              aria-label={q.title}
              className="mt-6 flex flex-col gap-2.5"
            >
              {q.options.map((opt, oi) => (
                <OptionRow
                  key={opt.value}
                  name={q.field}
                  label={opt.label}
                  sublabel={opt.sublabel}
                  icon={opt.icon}
                  index={oi}
                  selected={current === opt.value}
                  onSelect={() => select(opt.value)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <StepNav
        onBack={goPrev}
        backLabel={qIndex > 0 ? "Previous" : navLabels.back}
        onContinue={goForward}
        canContinue={canForward}
        continueLabel={isLast ? navLabels.continue : "Next"}
        hint={hint}
      />
    </div>
  );
}
