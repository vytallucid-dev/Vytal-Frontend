"use client";

/**
 * OnboardingFlow — the orchestrator.
 * ---------------------------------------------------------------------------
 * WELCOME is a full-bleed section over the animated space backdrop (not boxed).
 * On "Get Started" it transitions into a contained, floating GLASS CARD that
 * houses the actual STEPS (About → Finance → (Adaptive) → Explore).
 *
 * The card is ONE continuous glass surface: the progress rail is sticky at the
 * top of the scroll body (with a soft fade, not a walled header bar), and the
 * Back/Continue buttons live in normal flow at the end of each step's content
 * (no pinned footer). The state machine, branch, resumability, two-store
 * separation and hard disclaimer gate are UNCHANGED — this is presentation.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Icons } from "@/lib/icons";
import { useOnboarding } from "./use-onboarding";
import { getMilestones, canAdvance } from "./onboarding-machine";
import { AuroraBackdrop } from "./aurora-backdrop";
import { LaunchSequence } from "./launch-sequence";
import { ProgressRail } from "./progress-rail";
import { WelcomeStep } from "./steps/welcome-step";
import { AboutStep } from "./steps/about-step";
import { FinanceStep } from "./steps/finance-step";
import { AdaptiveStep } from "./steps/adaptive-step";
import { HandoffStep } from "./steps/handoff-step";
import type { StepKey } from "./onboarding-types";

const DASHBOARD_ROUTE = "/dashboard";

/** Reveal-on-step transition (between steps inside the card). */
const pageVariants: Variants = {
  enter: { opacity: 0, y: 22, filter: "blur(4px)" },
  center: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -16, filter: "blur(4px)" },
};

/** Gentle nudge shown beside Continue when it's disabled. */
const disabledHint: Partial<Record<StepKey, string>> = {
  about: "Enter a name to continue.",
  finance: "Answer all four to continue.",
  adaptive: "Pick an option to continue.",
};

export function OnboardingFlow({
  authName = null,
}: {
  /** mock auth-provided name; pre-fills display name (fully editable) */
  authName?: string | null;
}) {
  const router = useRouter();
  const { state, dispatch, hydrated, commitComplete, reset } = useOnboarding(authName);
  const { currentStep } = state.meta;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // When true, the modal folds away and the LaunchSequence plays before routing.
  const [launching, setLaunching] = React.useState(false);

  const next = React.useCallback(() => dispatch({ type: "NEXT" }), [dispatch]);
  const back = React.useCallback(() => dispatch({ type: "BACK" }), [dispatch]);

  // "Enter Vytal" — start the launch animation; the receipt + route fire when
  // the sequence finishes (see complete → passed as onDone).
  const startLaunch = React.useCallback(() => setLaunching(true), []);

  const complete = React.useCallback(async () => {
    // Mark complete locally, then PERSIST it (flush pending step writes + the
    // idempotent completion POST) BEFORE navigating — so the acceptance lands.
    dispatch({ type: "COMPLETE", acceptedAt: new Date().toISOString() });
    const outcome = await commitComplete();
    if (outcome === "auth") return; // session died → commitComplete routed to /login
    router.push(DASHBOARD_ROUTE); // ok / soft-error → dashboard (resume read backstops)
  }, [dispatch, commitComplete, router]);

  // Already complete (returning here after finishing) → head to the dashboard.
  React.useEffect(() => {
    if (hydrated && state.meta.onboardingComplete) {
      router.replace(DASHBOARD_ROUTE);
    }
  }, [hydrated, state.meta.onboardingComplete, router]);

  // Each step starts at the top of the card (so the tour's scroll-gate begins
  // un-triggered, and forms don't inherit the previous step's scroll position).
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [currentStep]);

  // Gate render until hydrated so we resume at the right step with no flash.
  if (!hydrated) {
    return (
      <div className="relative grid min-h-svh place-items-center">
        <AuroraBackdrop />
        <div className="flex items-center gap-2 text-ink3">
          <Icons.spark weight="duotone" className="size-4 animate-pulse text-primary" />
          <span className="text-sm">Preparing your setup…</span>
        </div>
      </div>
    );
  }

  const isWelcome = currentStep === "welcome";
  const showRail = !isWelcome && currentStep !== "done";
  const milestones = getMilestones(state);
  const advanceable = canAdvance(state);

  const launchName = state.ledger.displayName?.trim() ?? "";

  return (
    <div
      className="relative flex min-h-svh w-full items-center justify-center p-3 sm:p-6"
      style={{ perspective: "1400px" }}
    >
      <AuroraBackdrop />

      <AnimatePresence mode="wait" initial={false}>
        {isWelcome ? (
          /* ── WELCOME — full-bleed over the space, not boxed ── */
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full"
          >
            <WelcomeStep onStart={next} />
          </motion.div>
        ) : (
          /* ── STEPS — a single continuous floating glass card ── */
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={
              launching
                ? { opacity: 0, y: -26, scale: 0.9, rotateX: 68, filter: "blur(5px)" }
                : { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" }
            }
            exit={{ opacity: 0, scale: 0.97 }}
            transition={
              launching
                ? { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
                : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
            }
            className={[
              "relative z-10 flex flex-col overflow-hidden rounded-[20px] border border-white/10",
              "h-[93dvh] w-[94vw] sm:h-[82vh] sm:w-[86vw] md:w-[74vw] lg:w-[54vw]",
              "max-w-[760px] max-h-[840px]",
            ].join(" ")}
            style={{
              transformOrigin: "center 42%",
              background: "color-mix(in oklab, var(--surface-1) 66%, transparent)",
              backdropFilter: "blur(32px) saturate(170%)",
              WebkitBackdropFilter: "blur(32px) saturate(170%)",
              // outer lift, hairline rim, then the aurora-glass tell: a cool
              // sheen off the top edge meeting a warm gold wash rising from below
              boxShadow:
                "0 50px 140px -42px rgba(0,0,0,0.82), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 74px 90px -78px rgba(120,150,220,0.20), inset 0 -84px 96px -80px rgba(214,166,82,0.12)",
            }}
          >
            {/* rim light along the card's top edge (glass edge, not a header) */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />

            {/* progress — a defined card header (not sticky-inside), so each
                step can FILL the body below it and pin its own nav at the base
                with airy glass in between (the new breathing rhythm) */}
            {showRail && (
              <div className="shrink-0 border-b border-white/10 bg-surface-1/80 px-5 py-4 backdrop-blur-xl sm:px-8 sm:py-[1.15rem]">
                <ProgressRail milestones={milestones} large />
              </div>
            )}

            {/* the step body — one glass surface; scrolls only when a step
                (the tour) is genuinely taller than the card. The bottom margin
                keeps the scroll area from sitting flush against the card edge. */}
            <div
              ref={scrollRef}
              className="custom-scrollbar relative mb-2.5 min-h-0 flex-1 overflow-y-auto overflow-x-hidden sm:mb-3.5"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="min-h-full"
                >
                  {currentStep === "about" && (
                    <AboutStep
                      state={state}
                      dispatch={dispatch}
                      onBack={back}
                      onContinue={next}
                      canContinue={advanceable}
                      hint={disabledHint.about}
                    />
                  )}
                  {currentStep === "finance" && (
                    <FinanceStep
                      state={state}
                      dispatch={dispatch}
                      onBack={back}
                      onContinue={next}
                      canContinue={advanceable}
                      hint={disabledHint.finance}
                    />
                  )}
                  {currentStep === "adaptive" && (
                    <AdaptiveStep
                      state={state}
                      dispatch={dispatch}
                      onBack={back}
                      onContinue={next}
                      canContinue={advanceable}
                      hint={disabledHint.adaptive}
                    />
                  )}
                  {currentStep === "handoff" && (
                    <HandoffStep scrollRef={scrollRef} onBack={back} onComplete={startLaunch} />
                  )}
                  {currentStep === "done" && (
                    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-ink3">
                      <Icons.spark weight="duotone" className="size-4 animate-pulse text-primary" />
                      <span className="text-sm">Entering Vytal…</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the launch — plays over the folding modal, then routes onward */}
      <AnimatePresence>
        {launching && <LaunchSequence name={launchName} onDone={complete} />}
      </AnimatePresence>

      {/* dev-only: replay the flow without clearing storage by hand */}
      <button
        type="button"
        onClick={reset}
        className="fixed bottom-3 right-3 z-40 rounded-full border border-line bg-surface-1/70 px-2.5 py-1 text-[10px] font-medium text-ink3 backdrop-blur transition-colors hover:text-ink2"
        title="Reset onboarding (dev)"
      >
        Reset (dev)
      </button>
    </div>
  );
}
