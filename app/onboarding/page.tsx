import type { Metadata } from "next";
import { OnboardingEntry } from "@/components/onboarding/onboarding-entry";

export const metadata: Metadata = {
  title: "Welcome to Vytal — Let's get you set up",
};

/**
 * Onboarding route — shown once after auth, before the dashboard. It lives
 * OUTSIDE the (main) group on purpose: no sidebar, no navbar, its own
 * full-bleed canvas.
 *
 * OnboardingEntry auth-guards the route and passes the real authenticated
 * display name into the flow (was a hardcoded "Aarav" before auth was wired).
 */
export default function OnboardingPage() {
  return <OnboardingEntry />;
}
