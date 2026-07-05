"use client";

/**
 * OnboardingEntry — auth-guards the onboarding route and feeds it the real name.
 * ---------------------------------------------------------------------------
 * This is the auth-phase wiring for onboarding's documented swap point: instead
 * of the literal "Aarav", we pass the authenticated user's display name (from
 * Supabase user_metadata, set at signup / provided by Google), falling back to
 * the email local-part. Onboarding's internals are untouched — it still just
 * receives an `authName` prop.
 */

import { useAuth } from "@/components/providers/auth-provider";
import { RequireAuth } from "@/components/auth/route-guard";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

function displayNameFromUser(
  meta: Record<string, unknown> | undefined,
  email: string | undefined,
): string | null {
  const fromMeta =
    (typeof meta?.display_name === "string" && meta.display_name) ||
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    "";
  if (fromMeta.trim()) return fromMeta.trim();
  if (email) {
    const local = email.split("@")[0];
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return null;
}

export function OnboardingEntry() {
  const { user } = useAuth();
  const authName = displayNameFromUser(user?.user_metadata, user?.email);

  return (
    <RequireAuth>
      <OnboardingFlow authName={authName} />
    </RequireAuth>
  );
}
