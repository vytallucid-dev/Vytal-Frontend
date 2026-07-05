/**
 * ONBOARDING — STATE MACHINE (a branching, resumable flow — not a page sequence)
 * =====================================================================
 * Steps advance via a machine keyed on `meta.currentStep` / `meta.completedSteps`.
 * It handles the branch (the adaptive follow-up may or may not fire) and is
 * fully resumable: the whole state is persisted (see use-onboarding), so a
 * remount resumes at `currentStep` with every prior answer intact.
 *
 * The reducer is PURE. It only ever WRITES new fields/flags; it never rewrites a
 * raw answer based on another answer (the ledger/register separation, enforced).
 * Timestamps are passed IN via the action payload so the reducer stays pure.
 */

import {
  DEFAULT_AI_LEVEL,
  ONBOARDING_VERSION,
  DISCLAIMER_TEXT_VERSION,
  milestoneLabels,
} from "./onboarding-config";
import type {
  AiLevel,
  FinanceField,
  LedgerFlags,
  OnboardingState,
  StepKey,
} from "./onboarding-types";

/* ---- Initial (empty) state -------------------------------------------- */

/** All conditional flags in their unset (false) state. */
export function emptyFlags(): LedgerFlags {
  return {
    selfTaught: false,
    aspirationalTechnical: false,
    concisePro: false,
    explainLeaning: false,
    trustCredential: false,
  };
}

export function makeInitialState(authName?: string | null): OnboardingState {
  return {
    ledger: {
      // Pre-fill from auth (mock) but keep it fully editable.
      displayName: authName?.trim() ? authName.trim() : null,
      financeDepth: null,
      termComfort: null,
      investingExperience: null,
      investingStyle: null,
      flags: emptyFlags(),
    },
    // Delivery preference defaults to balanced (never plain/technical) — this
    // bakes in the "aiLevel unset → balanced" fallback and matches the
    // default-highlighted Balanced card.
    register: {
      aiLevel: DEFAULT_AI_LEVEL,
    },
    meta: {
      onboardingComplete: false,
      disclaimerAcceptedAt: null,
      disclaimerTextVersion: null,
      onboardingVersion: null,
      currentStep: "welcome",
      completedSteps: [],
    },
  };
}

/* ---- Pure selectors ---------------------------------------------------- */

/** Defensive read of the delivery preference: null → balanced, ALWAYS. */
export function resolveAiLevel(state: OnboardingState): AiLevel {
  return state.register.aiLevel ?? DEFAULT_AI_LEVEL;
}

/**
 * ADAPTIVE FOLLOW-UP — evaluate ONLY after Step 2 is complete.
 * Fires AT MOST ONE, strict priority 1→2→3, first match only. `null` → skip
 * straight to Handoff. Conditions read the RESOLVED aiLevel (delivery axis) and
 * the ledger knowledge axis independently — the two axes are never collapsed.
 */
export function evaluateAdaptive(
  state: OnboardingState,
): "t1" | "t2" | "t3" | null {
  const ai = resolveAiLevel(state);
  const { financeDepth, termComfort } = state.ledger;

  // Trigger 1 — wants full depth, but knowledge signals point lower.
  if (ai === "technical" && (financeDepth === "casual" || termComfort === "explain")) {
    return "t1";
  }
  // Trigger 2 — wants it plain, but knowledge signals point higher.
  if (ai === "plain" && (financeDepth === "professional" || termComfort === "assume")) {
    return "t2";
  }
  // Trigger 3 — formal exposure but asked us to explain terms.
  if (financeDepth === "formal" && termComfort === "explain") {
    return "t3";
  }
  return null;
}

/** True once all four Step-2 ledger fields exist. */
export function isFinanceComplete(state: OnboardingState): boolean {
  const { financeDepth, termComfort, investingExperience, investingStyle } =
    state.ledger;
  return Boolean(
    financeDepth && termComfort && investingExperience && investingStyle,
  );
}

/** Compute the next step from the current one, honouring the branch. */
export function computeNextStep(state: OnboardingState): StepKey {
  switch (state.meta.currentStep) {
    case "welcome":
      return "about";
    case "about":
      return "finance";
    case "finance":
      // The branch: adaptive only if a trigger matches, else straight to handoff.
      return evaluateAdaptive(state) ? "adaptive" : "handoff";
    case "adaptive":
      return "handoff";
    case "handoff":
      return "done";
    default:
      return "done";
  }
}

/** Is the current step's requirement satisfied enough to advance? */
export function canAdvance(state: OnboardingState): boolean {
  switch (state.meta.currentStep) {
    case "welcome":
      return true;
    case "about":
      // Display name required + non-empty. aiLevel is always set (defaults balanced).
      return Boolean(state.ledger.displayName?.trim());
    case "finance":
      return isFinanceComplete(state);
    case "adaptive": {
      // Answered iff the matched trigger's chosen option has been recorded.
      // We treat "any of this trigger's possible flags decided" — but since one
      // option sets no flag, we track answered-ness in meta.completedSteps via
      // the ADAPTIVE_ANSWERED action instead. Here: advanceable once recorded.
      return state.meta.completedSteps.includes("adaptive:answered");
    }
    case "handoff":
      // The hard disclaimer gate is enforced in the component (scroll + check),
      // not here; COMPLETE is dispatched only when both are satisfied.
      return true;
    default:
      return false;
  }
}

/* ---- Progress rail milestones (branch-aware) --------------------------- */

export interface Milestone {
  key: string;
  label: string;
  status: "completed" | "current" | "upcoming";
}

/**
 * The visible progress milestones. Base = About → Finance → Explore. The
 * optional Follow-up node is inserted after Finance ONLY when it's actually on
 * the path (already visited, or Finance done and a trigger matched) — so the
 * rail never shows a phantom step, and never looks broken across the branch.
 */
export function getMilestones(state: OnboardingState): Milestone[] {
  const { currentStep, completedSteps } = state.meta;
  const order: string[] = ["about", "finance"];

  const adaptiveOnPath =
    completedSteps.includes("adaptive") ||
    currentStep === "adaptive" ||
    (completedSteps.includes("finance") && evaluateAdaptive(state) !== null);

  if (adaptiveOnPath) order.push("adaptive");
  order.push("handoff");

  return order.map((key) => {
    let status: Milestone["status"] = "upcoming";
    if (completedSteps.includes(key)) status = "completed";
    if (currentStep === key) status = "current";
    // handoff counts as completed once we're done
    if (key === "handoff" && currentStep === "done") status = "completed";
    return { key, label: milestoneLabels[key] ?? key, status };
  });
}

/* ======================================================================= */
/*  REDUCER                                                                 */
/* ======================================================================= */

export type OnboardingAction =
  | { type: "HYDRATE"; state: OnboardingState }
  | { type: "SET_DISPLAY_NAME"; value: string }
  | { type: "SET_AI_LEVEL"; value: AiLevel }
  | { type: "SET_FINANCE"; field: FinanceField; value: string }
  | { type: "SET_ADAPTIVE"; flag: keyof LedgerFlags | null }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "COMPLETE"; acceptedAt: string }
  | { type: "RESET"; authName?: string | null };

export function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "SET_DISPLAY_NAME":
      return {
        ...state,
        ledger: { ...state.ledger, displayName: action.value },
      };

    // Register write — kept entirely separate from the ledger.
    case "SET_AI_LEVEL":
      return {
        ...state,
        register: { ...state.register, aiLevel: action.value },
      };

    // Ledger write — a raw fact. Never derived from another answer.
    case "SET_FINANCE":
      return {
        ...state,
        ledger: { ...state.ledger, [action.field]: action.value },
      };

    // Adaptive answer — writes a FLAG (fact) only; NEVER touches a raw answer.
    // Records answered-ness as a keyed marker so the step can advance and can be
    // re-answered idempotently (re-selecting clears prior flags from this step).
    case "SET_ADAPTIVE": {
      const flags = emptyFlags();
      if (action.flag) flags[action.flag] = true;
      const answered = state.meta.completedSteps.includes("adaptive:answered")
        ? state.meta.completedSteps
        : [...state.meta.completedSteps, "adaptive:answered"];
      return {
        ...state,
        ledger: { ...state.ledger, flags },
        meta: { ...state.meta, completedSteps: answered },
      };
    }

    case "NEXT": {
      const next = computeNextStep(state);
      const current = state.meta.currentStep;
      const completed = state.meta.completedSteps.includes(current)
        ? state.meta.completedSteps
        : [...state.meta.completedSteps, current];

      // Leaving Finance forward re-decides the branch: wipe any prior adaptive
      // answer (flags + marker) so the adaptive flags ALWAYS reflect a fresh
      // answer — never a stale one left over from a since-changed Step-2 answer
      // (or from a trigger that no longer fires). Fixes the back-edit-forward
      // path where the user would otherwise carry a flag they never re-picked.
      if (current === "finance") {
        return {
          ...state,
          ledger: { ...state.ledger, flags: emptyFlags() },
          meta: {
            ...state.meta,
            currentStep: next,
            completedSteps: completed.filter((k) => k !== "adaptive:answered"),
          },
        };
      }

      return {
        ...state,
        meta: { ...state.meta, currentStep: next, completedSteps: completed },
      };
    }

    // Back walks the ACTUAL path taken (completedSteps is ordered), so the
    // branch is handled for free — no separate history stack needed.
    case "BACK": {
      const path = state.meta.completedSteps.filter(
        (k) => !k.includes(":"), // drop internal markers like "adaptive:answered"
      );
      if (path.length === 0) return state;
      const prev = path[path.length - 1] as StepKey;
      // Remove the step we're returning to from completed, plus any markers
      // belonging to steps at/after it (only the adaptive marker exists today).
      const trimmed = state.meta.completedSteps.filter((k) => {
        if (k === prev) return false;
        if (prev === "finance" && k === "adaptive:answered") return false;
        return true;
      });
      return {
        ...state,
        meta: { ...state.meta, currentStep: prev, completedSteps: trimmed },
      };
    }

    // The completion receipt — writes meta only (mock). Stamped with the
    // timestamp/versions the wiring layer will later persist server-side.
    case "COMPLETE": {
      const completed = state.meta.completedSteps.includes("handoff")
        ? state.meta.completedSteps
        : [...state.meta.completedSteps, "handoff"];
      return {
        ...state,
        meta: {
          ...state.meta,
          onboardingComplete: true,
          disclaimerAcceptedAt: action.acceptedAt,
          disclaimerTextVersion: DISCLAIMER_TEXT_VERSION,
          onboardingVersion: ONBOARDING_VERSION,
          currentStep: "done",
          completedSteps: completed,
        },
      };
    }

    case "RESET":
      return makeInitialState(action.authName);

    default:
      return state;
  }
}
