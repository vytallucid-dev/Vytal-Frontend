/**
 * ONBOARDING — MOCK STATE SHAPE (the wiring contract)
 * =====================================================================
 * This file is the single source of truth for the *shape* of onboarding
 * state. It is MOCK-only today (local useReducer, persisted to localStorage)
 * but is deliberately modelled on the real backend schema so wiring later is a
 * drop-in swap: replace the persistence layer, keep these types.
 *
 * TWO STORES — NEVER MERGED (the architectural spine):
 *   • LEDGER   = durable FACTS about the user (what they ARE).
 *   • REGISTER = a mutable SETTING (how the AI TALKS).
 * The flow only ever WRITES new fields/flags — it NEVER rewrites a raw answer
 * based on another answer. The register may permanently disagree with the
 * ledger; that is by design (see the two orthogonal axes below).
 *
 * TWO ORTHOGONAL AXES — NEVER COLLAPSED:
 *   • Delivery preference  (register.aiLevel)          = how they want it SAID.
 *   • Knowledge level      (financeDepth + termComfort) = what they UNDERSTAND.
 * "Wants plain delivery + is an expert" is VALID, not a contradiction. Nothing
 * in the UI should ever treat any combination as something to warn about.
 */

/* ---- LEDGER value domains (durable facts) ------------------------------- */

export type FinanceDepth = "casual" | "formal" | "professional";
export type TermComfort = "explain" | "follow" | "assume";
export type InvestingExperience = "starting" | "few_years" | "experienced";
export type InvestingStyle = "long_term" | "mix" | "active";

/** Conditional facts written by the adaptive follow-up (Part 2.5). Each is a
 *  FACT the resolver may later read — never an overwrite of a raw answer. */
export interface LedgerFlags {
  selfTaught: boolean;
  aspirationalTechnical: boolean;
  concisePro: boolean;
  explainLeaning: boolean;
  trustCredential: boolean;
}

export interface Ledger {
  displayName: string | null;
  financeDepth: FinanceDepth | null;
  termComfort: TermComfort | null;
  investingExperience: InvestingExperience | null;
  investingStyle: InvestingStyle | null;
  flags: LedgerFlags;
}

/* ---- REGISTER (a mutable setting) --------------------------------------- */

/** Delivery preference. Labels describe OUTPUT STYLE, never the user. */
export type AiLevel = "plain" | "balanced" | "technical";

export interface Register {
  aiLevel: AiLevel | null;
}

/* ---- META (flow progress + completion receipt) -------------------------- */

/** Step keys — the flow BRANCHES, so progress is key-based, not a number. */
export type StepKey =
  | "welcome"
  | "about"
  | "finance"
  | "adaptive"
  | "handoff"
  | "done";

export interface Meta {
  onboardingComplete: boolean;
  disclaimerAcceptedAt: string | null;
  disclaimerTextVersion: string | null;
  onboardingVersion: string | null;
  currentStep: StepKey;
  /** STRING keys (not a count) — the flow branches. */
  completedSteps: string[];
}

/* ---- The whole mock state ---------------------------------------------- */

export interface OnboardingState {
  ledger: Ledger;
  register: Register;
  meta: Meta;
}

/** Which of the four Step-2 (Finance & Investing) fields an answer targets. */
export type FinanceField =
  | "financeDepth"
  | "termComfort"
  | "investingExperience"
  | "investingStyle";
