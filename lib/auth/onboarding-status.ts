"use client";

/**
 * useOnboardingStatus — the post-auth routing gate, now backed by the REAL
 * backend (was a localStorage mock).
 * ---------------------------------------------------------------------------
 * Reads GET /api/v1/me/onboarding and gates on `meta.onboardingComplete`:
 * complete → dashboard, incomplete → onboarding (resumed there). It only fetches
 * when a session exists (no token = nothing to read), so the logged-out auth
 * screens don't fire a pointless 401. On any read error it defaults to
 * incomplete — the safe direction (onboarding is itself auth-guarded).
 */

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { onboardingApi } from "@/lib/api/onboarding";

export interface OnboardingStatus {
  onboardingComplete: boolean;
  /** true until the status resolves — avoids a wrong-route flash */
  loading: boolean;
}

export function useOnboardingStatus(): OnboardingStatus {
  const { session, loading: authLoading } = useAuth();
  const [status, setStatus] = React.useState<OnboardingStatus>({
    onboardingComplete: false,
    loading: true,
  });

  React.useEffect(() => {
    if (authLoading) {
      setStatus({ onboardingComplete: false, loading: true });
      return;
    }
    if (!session) {
      // No session → nothing to read (the auth gate handles routing from here).
      setStatus({ onboardingComplete: false, loading: false });
      return;
    }

    let active = true;
    setStatus((s) => ({ ...s, loading: true }));
    onboardingApi
      .get()
      .then((data) => {
        if (active) setStatus({ onboardingComplete: !!data?.meta?.onboardingComplete, loading: false });
      })
      .catch(() => {
        // Error (network/anomaly) → treat as incomplete (safe: routes to onboarding).
        if (active) setStatus({ onboardingComplete: false, loading: false });
      });
    return () => {
      active = false;
    };
  }, [session, authLoading]);

  return status;
}

/** Where a freshly-authed user belongs, given their onboarding status. */
export const ROUTES = {
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  login: "/login",
} as const;

export function postAuthRoute(onboardingComplete: boolean): string {
  return onboardingComplete ? ROUTES.dashboard : ROUTES.onboarding;
}
