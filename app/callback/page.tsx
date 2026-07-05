"use client";

/**
 * /callback — the OAuth (Google) redirect landing.
 * ---------------------------------------------------------------------------
 * supabase-js (detectSessionInUrl) exchanges the code in the URL and the
 * AuthProvider picks up the resulting SIGNED_IN via onAuthStateChange. We just
 * wait for that session, then route onward (onboarding vs dashboard via the
 * isolated mock). Supabase auto-links a Google login to an existing same-email
 * account server-side — we don't fight it, we just let the session resolve.
 *
 * If the provider returns an error (user cancelled, config issue) it comes back
 * in the URL — we surface it honestly with a way back to sign in, rather than
 * spinning forever.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuroraBackdrop } from "@/components/onboarding/aurora-backdrop";
import { useAuth } from "@/components/providers/auth-provider";
import { postAuthRoute, useOnboardingStatus } from "@/lib/auth/onboarding-status";
import { BrandMark } from "@/components/auth/brand-mark";
import { MutedLink } from "@/components/auth/primitives";
import { Icons } from "@/lib/icons";

/** Give the code-exchange a generous window before calling it a failure. */
const TIMEOUT_MS = 10000;

function readOAuthError(): string | null {
  if (typeof window === "undefined") return null;
  const parse = (s: string) => new URLSearchParams(s);
  const hash = parse(window.location.hash.replace(/^#/, ""));
  const query = parse(window.location.search.replace(/^\?/, ""));
  const desc = hash.get("error_description") ?? query.get("error_description");
  const err = hash.get("error") ?? query.get("error");
  if (desc) return desc.replace(/\+/g, " ");
  return err ? err.replace(/_/g, " ") : null;
}

export default function CallbackPage() {
  const { session, loading, isRecovery } = useAuth();
  const { onboardingComplete, loading: obLoading } = useOnboardingStatus();
  const router = useRouter();

  const [error, setError] = React.useState<string | null>(null);

  // Surface an error the provider sent back in the URL.
  React.useEffect(() => {
    const err = readOAuthError();
    if (err) setError(err);
  }, []);

  // Route onward once the session resolves.
  React.useEffect(() => {
    if (error) return;
    if (isRecovery) {
      router.replace("/reset-password");
      return;
    }
    if (!loading && session && !obLoading) {
      router.replace(postAuthRoute(onboardingComplete));
    }
  }, [error, isRecovery, loading, session, obLoading, onboardingComplete, router]);

  // Fail gracefully if no session ever arrives.
  React.useEffect(() => {
    if (error || session) return;
    const t = setTimeout(() => {
      if (!session) setError("We couldn't complete sign-in. Please try again.");
    }, TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [error, session]);

  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden px-4">
      <AuroraBackdrop />
      <div className="relative z-10 flex w-full max-w-[24rem] flex-col items-center gap-6 text-center">
        <BrandMark />
        {error ? (
          <div className="flex flex-col items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-danger/12 ring-1 ring-danger/25">
              <Icons.warning weight="duotone" className="size-6 text-danger" />
            </span>
            <div className="flex flex-col gap-1.5">
              <p className="font-display text-base font-semibold text-ink sm:text-lg">
                Sign-in didn&apos;t finish
              </p>
              <p className="text-[13px] leading-relaxed text-ink2 sm:text-sm">
                {error.charAt(0).toUpperCase()}
                {error.slice(1)}
              </p>
            </div>
            <MutedLink href="/login">Back to sign in</MutedLink>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-ink2">
            <Icons.spinner className="size-5 animate-spin text-primary" />
            <span className="text-[13px] sm:text-sm">Completing sign-in…</span>
          </div>
        )}
      </div>
    </div>
  );
}
