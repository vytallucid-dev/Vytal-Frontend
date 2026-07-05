"use client";

/**
 * AuthLoading — the calm full-bleed "resolving session" state.
 * Shown while auth is still loading or a redirect is in flight, so the app never
 * flashes the wrong screen (a form to an authed user, or the app to a guest).
 * Reuses the platform's aurora backdrop for visual continuity with onboarding.
 */

import { AuroraBackdrop } from "@/components/onboarding/aurora-backdrop";
import { Icons } from "@/lib/icons";

export function AuthLoading({ message = "One moment…" }: { message?: string }) {
  return (
    <div className="relative grid min-h-svh place-items-center">
      <AuroraBackdrop />
      <div className="relative z-10 flex items-center gap-2.5 text-ink3">
        <Icons.spark weight="duotone" className="size-4 animate-pulse text-primary" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}
