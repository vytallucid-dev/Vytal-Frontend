"use client";

/**
 * useOnboarding — reducer + REAL backend persistence.
 * ---------------------------------------------------------------------------
 * The persistence layer (this file) is the ONLY thing that changed when the mock
 * was retired — the reducer, state machine, resumability contract, adaptive
 * branch, and every component are untouched. Where this used to read/write a
 * localStorage blob, it now talks to the five focused endpoints, each carrying
 * the Supabase Bearer token:
 *
 *   • mount        → GET /api/v1/me/onboarding → HYDRATE (resume where left off)
 *   • on change    → debounced DIFF-SYNC, routing each changed store to its own
 *                    endpoint (aiLevel → register, facts/flags → ledger,
 *                    step/progress → progress). Partial + de-duped server-side.
 *   • completion   → commitComplete(): flush pending writes, then POST complete
 *                    (awaited by the flow so it lands before we navigate away).
 *
 * SEPARATION kept on the client too: aiLevel ONLY ever goes to patchRegister;
 * every other fact/flag ONLY to patchLedger. The two are never crossed.
 *
 * ERRORS: 401 → re-auth (/login); 409 not_provisioned → halt + surface (no retry
 * loop); network/5xx → keep the answer locally, don't advance the synced marker,
 * so it retries on the next change (and the resume read recovers on refresh).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  makeInitialState,
  emptyFlags,
  onboardingReducer,
  type OnboardingAction,
} from "./onboarding-machine";
import {
  DEFAULT_AI_LEVEL,
  DISCLAIMER_TEXT_VERSION,
  ONBOARDING_VERSION,
} from "./onboarding-config";
import type {
  AiLevel,
  FinanceDepth,
  InvestingExperience,
  InvestingStyle,
  LedgerFlags,
  OnboardingState,
  StepKey,
  TermComfort,
} from "./onboarding-types";
import {
  onboardingApi,
  OnboardingApiError,
  type LedgerPatch,
  type ProgressPatch,
  type RemoteOnboarding,
} from "@/lib/api/onboarding";

const DEBOUNCE_MS = 500;
const STEP_KEYS: StepKey[] = ["welcome", "about", "finance", "adaptive", "handoff", "done"];
const FLAG_KEYS = Object.keys(emptyFlags()) as (keyof LedgerFlags)[];

export type SyncError =
  | { kind: "auth" }
  | { kind: "not_provisioned" }
  | { kind: "validation"; field?: string }
  | { kind: "network" };

/** Outcome of the final completion write — drives the flow's post-complete route. */
export type CommitOutcome = "ok" | "auth" | "error";

export interface UseOnboarding {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  /** false until the backend resume read resolves — gate render to avoid a flash */
  hydrated: boolean;
  /** persist the final completion (flush + POST); the flow awaits this */
  commitComplete: () => Promise<CommitOutcome>;
  /** last non-fatal sync problem (network/validation) for optional surfacing */
  syncError: SyncError | null;
  /** dev convenience: restart from Welcome (local only — backend isn't cleared) */
  reset: () => void;
}

/* ── snapshot of what's been persisted, so we only PATCH real deltas ── */
interface Snap {
  ledger: {
    displayName: string | null;
    financeDepth: string | null;
    termComfort: string | null;
    investingExperience: string | null;
    investingStyle: string | null;
    flags: LedgerFlags;
  };
  aiLevel: string | null;
  currentStep: string | null;
  completedRealSteps: string[];
}

/** Drop internal markers (e.g. "adaptive:answered") — the backend stores real milestones only. */
const realSteps = (steps: string[]): string[] => steps.filter((k) => !k.includes(":"));

function coerceStep(s: string | null): StepKey {
  return s && (STEP_KEYS as string[]).includes(s) ? (s as StepKey) : "welcome";
}

function ledgerSnapOf(l: OnboardingState["ledger"]): Snap["ledger"] {
  return {
    displayName: l.displayName,
    financeDepth: l.financeDepth,
    termComfort: l.termComfort,
    investingExperience: l.investingExperience,
    investingStyle: l.investingStyle,
    flags: { ...l.flags },
  };
}

/** The server's actual values → the baseline we diff against (so we never re-push what's already there). */
function snapFromRemote(r: RemoteOnboarding): Snap {
  return {
    ledger: {
      displayName: r.ledger.displayName,
      financeDepth: r.ledger.financeDepth,
      termComfort: r.ledger.termComfort,
      investingExperience: r.ledger.investingExperience,
      investingStyle: r.ledger.investingStyle,
      flags: { ...emptyFlags(), ...r.ledger.flags },
    },
    aiLevel: r.register.aiLevel,
    currentStep: r.meta.currentStep,
    completedRealSteps: realSteps(r.meta.completedSteps ?? []),
  };
}

function snapFromState(s: OnboardingState): Snap {
  return {
    ledger: ledgerSnapOf(s.ledger),
    aiLevel: s.register.aiLevel,
    currentStep: s.meta.currentStep,
    completedRealSteps: realSteps(s.meta.completedSteps),
  };
}

/** Map the resume read into the flow's state shape (with auth-name pre-fill for a fresh user). */
function mapRemoteToState(r: RemoteOnboarding, authName?: string | null): OnboardingState {
  const base = makeInitialState(authName);
  return {
    ledger: {
      // null on the server (fresh user) → keep the auth pre-fill so the first
      // sync persists it; otherwise use the stored name.
      displayName: r.ledger.displayName ?? base.ledger.displayName,
      financeDepth: r.ledger.financeDepth as FinanceDepth | null,
      termComfort: r.ledger.termComfort as TermComfort | null,
      investingExperience: r.ledger.investingExperience as InvestingExperience | null,
      investingStyle: r.ledger.investingStyle as InvestingStyle | null,
      flags: { ...emptyFlags(), ...r.ledger.flags },
    },
    register: { aiLevel: (r.register.aiLevel as AiLevel) ?? DEFAULT_AI_LEVEL },
    meta: {
      onboardingComplete: r.meta.onboardingComplete,
      disclaimerAcceptedAt: r.meta.disclaimerAcceptedAt,
      disclaimerTextVersion: r.meta.disclaimerTextVersion,
      onboardingVersion: r.meta.onboardingVersion,
      currentStep: coerceStep(r.meta.currentStep),
      completedSteps: Array.isArray(r.meta.completedSteps) ? r.meta.completedSteps : [],
    },
  };
}

/* ── diff builders — each returns the payload for ONE store, or null ── */
function ledgerPatchFrom(state: OnboardingState, snap: Snap): LedgerPatch | null {
  const l = state.ledger;
  const s = snap.ledger;
  const patch: LedgerPatch = {};
  // displayName: only persist a real non-empty name (backend rejects empty; the
  // about step requires one anyway).
  if (l.displayName !== s.displayName && typeof l.displayName === "string" && l.displayName.trim()) {
    patch.displayName = l.displayName.trim();
  }
  const cats: (keyof LedgerPatch & keyof OnboardingState["ledger"])[] = [
    "financeDepth",
    "termComfort",
    "investingExperience",
    "investingStyle",
  ];
  for (const f of cats) {
    const cur = l[f];
    if (cur !== s[f] && typeof cur === "string") (patch as Record<string, string>)[f] = cur;
  }
  for (const flag of FLAG_KEYS) {
    if (l.flags[flag] !== s.flags[flag]) patch[flag] = l.flags[flag];
  }
  return Object.keys(patch).length ? patch : null;
}

function progressPatchFrom(state: OnboardingState, snap: Snap): ProgressPatch | null {
  const curStep = state.meta.currentStep;
  const curReal = realSteps(state.meta.completedSteps);
  const stepChanged = curStep !== snap.currentStep;
  const completedChanged =
    curReal.length !== snap.completedRealSteps.length ||
    curReal.some((k, i) => k !== snap.completedRealSteps[i]);
  if (!stepChanged && !completedChanged) return null;
  const patch: ProgressPatch = {};
  if (stepChanged) patch.currentStep = curStep;
  if (completedChanged) patch.completedSteps = curReal;
  return patch;
}

export function useOnboarding(authName?: string | null): UseOnboarding {
  const router = useRouter();
  const [state, dispatch] = React.useReducer(
    onboardingReducer,
    authName ?? null,
    makeInitialState,
  );
  const [hydrated, setHydrated] = React.useState(false);
  const [syncError, setSyncError] = React.useState<SyncError | null>(null);

  // Live refs so async syncs always see the freshest state / baseline.
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const snapRef = React.useRef<Snap>(snapFromState(state));
  const chainRef = React.useRef<Promise<void>>(Promise.resolve());
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const haltedRef = React.useRef(false);
  const redirectedRef = React.useRef(false);

  const handleSyncError = React.useCallback(
    (err: unknown) => {
      if (err instanceof OnboardingApiError) {
        if (err.isAuth) {
          if (!redirectedRef.current) {
            redirectedRef.current = true;
            haltedRef.current = true;
            router.replace("/login");
          }
          return;
        }
        if (err.isNotProvisioned) {
          haltedRef.current = true; // anomaly — stop, don't loop
          setSyncError({ kind: "not_provisioned" });
          return;
        }
        if (err.isValidation) {
          console.error("[onboarding] validation rejected", err.field, err.message);
          setSyncError({ kind: "validation", field: err.field });
          return;
        }
      }
      // network / unknown — retryable
      setSyncError({ kind: "network" });
    },
    [router],
  );

  // One diff-sync pass: PATCH each changed store, advance its snapshot on success.
  const doSyncOnce = React.useCallback(async () => {
    if (haltedRef.current) return;
    const s = stateRef.current;
    const snap = snapRef.current;
    const ledgerPatch = ledgerPatchFrom(s, snap);
    const aiLevel =
      s.register.aiLevel !== snap.aiLevel && s.register.aiLevel != null ? s.register.aiLevel : null;
    const progressPatch = progressPatchFrom(s, snap);
    if (!ledgerPatch && aiLevel == null && !progressPatch) return;

    const tasks: Promise<void>[] = [];
    if (ledgerPatch) {
      tasks.push(
        onboardingApi.patchLedger(ledgerPatch).then(() => {
          snapRef.current.ledger = ledgerSnapOf(s.ledger);
        }),
      );
    }
    if (aiLevel != null) {
      tasks.push(
        onboardingApi.patchRegister(aiLevel).then(() => {
          snapRef.current.aiLevel = s.register.aiLevel;
        }),
      );
    }
    if (progressPatch) {
      tasks.push(
        onboardingApi.patchProgress(progressPatch).then(() => {
          snapRef.current.currentStep = s.meta.currentStep;
          snapRef.current.completedRealSteps = realSteps(s.meta.completedSteps);
        }),
      );
    }

    const settled = await Promise.allSettled(tasks);
    const failed = settled.filter((r) => r.status === "rejected");
    if (failed.length === 0) setSyncError(null);
    for (const r of failed) handleSyncError((r as PromiseRejectedResult).reason);
  }, [handleSyncError]);

  // Serialize syncs so two passes never race on the same store.
  const runSync = React.useCallback((): Promise<void> => {
    chainRef.current = chainRef.current.then(doSyncOnce, doSyncOnce);
    return chainRef.current;
  }, [doSyncOnce]);

  // ── Hydrate from the backend on mount (resume where the user left off) ──
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const remote = await onboardingApi.get();
        if (!active) return;
        dispatch({ type: "HYDRATE", state: mapRemoteToState(remote, authName) });
        snapRef.current = snapFromRemote(remote); // diff future writes against the server truth
      } catch (err) {
        if (!active) return;
        if (err instanceof OnboardingApiError && err.isAuth) {
          // No/expired session — RequireAuth will bounce to /login; render nothing new.
        } else if (err instanceof OnboardingApiError && err.isNotProvisioned) {
          haltedRef.current = true;
          setSyncError({ kind: "not_provisioned" });
        } else {
          setSyncError({ kind: "network" });
        }
        // Diff against the local initial state so we don't re-push defaults.
        snapRef.current = snapFromState(stateRef.current);
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Debounced diff-sync on every change (after hydration) ──
  React.useEffect(() => {
    if (!hydrated || haltedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSync();
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [state, hydrated, runSync]);

  // ── Final completion — flush pending writes, then the idempotent POST ──
  const commitComplete = React.useCallback(async (): Promise<CommitOutcome> => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    try {
      await runSync(); // ensure the last step's answers landed first
    } catch {
      /* surfaced inside runSync */
    }
    try {
      await onboardingApi.complete({
        disclaimerTextVersion: DISCLAIMER_TEXT_VERSION,
        onboardingVersion: ONBOARDING_VERSION,
      });
      return "ok";
    } catch (err) {
      if (err instanceof OnboardingApiError && err.isAuth) {
        if (!redirectedRef.current) {
          redirectedRef.current = true;
          router.replace("/login");
        }
        return "auth";
      }
      console.error("[onboarding] complete failed", err);
      setSyncError({ kind: "network" });
      return "error";
    }
  }, [runSync, router]);

  const reset = React.useCallback(() => {
    dispatch({ type: "RESET", authName });
  }, [authName]);

  return { state, dispatch, hydrated, commitComplete, syncError, reset };
}
