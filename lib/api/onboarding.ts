/**
 * Onboarding API — the real persistence layer for the flow (replaces the mock).
 * ---------------------------------------------------------------------------
 * Five focused endpoints on the backend, each touching exactly one store; the
 * frontend keeps that separation (aiLevel → register, everything else → ledger).
 *
 * AUTH: every call carries the Supabase access token as a Bearer header. We read
 * a FRESH token from the shared client per call (supabase auto-refreshes it), so
 * a long onboarding session never sends a stale token. No userId is ever sent —
 * the backend derives the user from the token and ignores any userId.
 */

import { supabase } from "@/lib/supabase/client";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/** Typed API failure carrying the HTTP status + backend machine code + field. */
export class OnboardingApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly field?: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "OnboardingApiError";
  }
  get isAuth() {
    return this.status === 401;
  }
  get isValidation() {
    return this.status === 400;
  }
  get isNotProvisioned() {
    return this.status === 409;
  }
}

// ── Transport shapes (plain; the flow layer coerces to its typed state) ──
export interface RemoteOnboarding {
  ledger: {
    displayName: string | null;
    financeDepth: string | null;
    termComfort: string | null;
    investingExperience: string | null;
    investingStyle: string | null;
    flags: {
      selfTaught: boolean;
      aspirationalTechnical: boolean;
      concisePro: boolean;
      explainLeaning: boolean;
      trustCredential: boolean;
    };
  };
  register: { aiLevel: string };
  meta: {
    onboardingComplete: boolean;
    currentStep: string | null;
    completedSteps: string[];
    disclaimerAcceptedAt: string | null;
    disclaimerTextVersion: string | null;
    onboardingVersion: string | null;
  };
}

/** Partial ledger write — send only what changed (flags flattened). */
export interface LedgerPatch {
  displayName?: string;
  financeDepth?: string;
  termComfort?: string;
  investingExperience?: string;
  investingStyle?: string;
  selfTaught?: boolean;
  aspirationalTechnical?: boolean;
  concisePro?: boolean;
  explainLeaning?: boolean;
  trustCredential?: boolean;
}

export interface ProgressPatch {
  currentStep?: string | null;
  completedSteps?: string[];
}

export interface CompletePayload {
  disclaimerTextVersion: string;
  onboardingVersion: string;
}

/** Core authed fetch → returns the backend's `data`, throws OnboardingApiError. */
async function authedFetch<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    // No live session → treat like the backend's 401 so callers route to re-auth.
    throw new OnboardingApiError(401, "no_session", undefined, "No active session");
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    // Network failure — a distinct, retryable class (status 0).
    throw new OnboardingApiError(0, "network", undefined, (e as Error)?.message);
  }

  let json: { success?: boolean; data?: T; error?: string; field?: string; message?: string } | null =
    null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    throw new OnboardingApiError(
      res.status,
      json?.error ?? "error",
      json?.field,
      json?.message,
    );
  }
  return json?.data as T;
}

export const onboardingApi = {
  /** GET status + resume state (all three stores). */
  get: () => authedFetch<RemoteOnboarding>("/api/v1/me/onboarding", "GET"),

  /** PATCH durable facts + flags → user_ledger ONLY. */
  patchLedger: (patch: LedgerPatch) =>
    authedFetch<RemoteOnboarding["ledger"]>("/api/v1/me/ledger", "PATCH", patch),

  /** PATCH delivery preference → user_register ONLY. Never carries ledger fields. */
  patchRegister: (aiLevel: string) =>
    authedFetch<RemoteOnboarding["register"]>("/api/v1/me/register", "PATCH", { aiLevel }),

  /** PATCH progress (step + completed keys, server unions) → user_onboarding_meta. */
  patchProgress: (patch: ProgressPatch) =>
    authedFetch<RemoteOnboarding["meta"]>("/api/v1/me/onboarding/progress", "PATCH", patch),

  /** POST final completion (idempotent, write-once acceptance) → user_onboarding_meta. */
  complete: (payload: CompletePayload) =>
    authedFetch<RemoteOnboarding["meta"]>("/api/v1/me/onboarding/complete", "POST", payload),
};
