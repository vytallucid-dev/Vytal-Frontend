"use client";

/**
 * Auth layout — the shared canvas for login / signup / forgot / reset.
 * ---------------------------------------------------------------------------
 * ONE aurora backdrop, the Vytal brand mark, and a floating glass card that the
 * screens render their forms into — so all four read as one designed surface
 * and flow visually into onboarding (which uses the same backdrop).
 *
 * It also owns the INVERSE guard: an already-authed user has no business on the
 * auth screens, so we send them onward (onboarding vs dashboard via the isolated
 * mock). The exceptions:
 *   • /reset-password is exempt — it must be reachable WITH a recovery session,
 *     and manages its own recovery logic.
 *   • a recovery session anywhere else here → /reset-password.
 */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AuroraBackdrop } from "@/components/onboarding/aurora-backdrop";
import { useAuth } from "@/components/providers/auth-provider";
import { postAuthRoute, useOnboardingStatus } from "@/lib/auth/onboarding-status";
import { BrandMark } from "@/components/auth/brand-mark";
import { Icons } from "@/lib/icons";

/** Only allow same-origin relative redirects (no open-redirect via ?redirect=). */
function safeInternalPath(path: string | null): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

/** Inline (backdrop-less) loader — the single AuroraBackdrop below shows through. */
function InlineLoader() {
  return (
    <div className="relative z-10 flex items-center gap-2.5 text-ink3">
      <Icons.spark weight="duotone" className="size-4 animate-pulse text-primary" />
      <span className="text-sm">One moment…</span>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isResetPage = pathname === "/reset-password";

  const { session, loading, isRecovery } = useAuth();
  const { onboardingComplete, loading: obLoading } = useOnboardingStatus();
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (isResetPage) return; // reset page owns its own recovery routing
    if (loading) return;
    if (isRecovery) {
      router.replace("/reset-password");
      return;
    }
    if (session && !obLoading) {
      const redirect = safeInternalPath(searchParams.get("redirect"));
      // Honor a deep-link redirect only when onboarding is done; an unfinished
      // user always lands on onboarding first.
      router.replace(
        onboardingComplete ? (redirect ?? postAuthRoute(true)) : postAuthRoute(false),
      );
    }
  }, [
    isResetPage,
    loading,
    session,
    isRecovery,
    obLoading,
    onboardingComplete,
    router,
    searchParams,
  ]);

  // The reset page always renders (it decides what to show from isRecovery).
  if (!isResetPage) {
    if (loading) return <InlineLoader />;
    if (isRecovery || session) return <InlineLoader />; // redirect in flight
  }
  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden px-4 py-8 sm:py-12">
      <AuroraBackdrop />

      {/* AuthGate reads useSearchParams (?redirect) → needs a Suspense boundary
          so static prerender of the auth pages doesn't bail out. */}
      <React.Suspense fallback={<InlineLoader />}>
        <AuthGate>
        <div className="relative z-10 w-full max-w-[25rem]">
          <BrandMark />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-5 overflow-hidden rounded-[20px] border border-white/10 p-5 sm:mt-6 sm:p-7"
            style={{
              background: "color-mix(in oklab, var(--surface-1) 66%, transparent)",
              backdropFilter: "blur(32px) saturate(170%)",
              WebkitBackdropFilter: "blur(32px) saturate(170%)",
              boxShadow:
                "0 50px 140px -42px rgba(0,0,0,0.82), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 74px 90px -78px rgba(120,150,220,0.20), inset 0 -84px 96px -80px rgba(214,166,82,0.12)",
            }}
          >
            {/* rim light along the card's top edge (glass edge, not a header) */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />
            {children}
          </motion.div>

          <p className="mt-5 text-center text-xs leading-relaxed text-ink3">
            An analysis platform, not investment advice.
          </p>
        </div>
        </AuthGate>
      </React.Suspense>
    </div>
  );
}
