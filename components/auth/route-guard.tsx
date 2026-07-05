"use client";

/**
 * RequireAuth — client-side guard for protected surfaces (the app + onboarding).
 * ---------------------------------------------------------------------------
 * Auth is client-side (supabase-js, localStorage session), so route protection
 * lives here rather than in server middleware.
 *
 *   • no session        → /login (preserving where they were headed)
 *   • recovery session  → /reset-password (a reset link must never slip into
 *                         the app as a normal login — the correctness trap)
 *
 * The auth screens use the inverse gate, implemented in app/(auth)/layout.tsx.
 *
 * NOTE: guarding these FRONTEND routes is unrelated to the backend's public
 * data reads, which stay token-free this phase — the fetches inside these pages
 * still send no token.
 */

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthLoading } from "./auth-loading";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, isRecovery } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (loading) return;
    if (isRecovery) {
      router.replace("/reset-password");
      return;
    }
    if (!session) {
      const next = encodeURIComponent(pathname || "");
      router.replace(`/login${next ? `?redirect=${next}` : ""}`);
    }
  }, [loading, session, isRecovery, router, pathname]);

  if (loading) return <AuthLoading message="Checking your session…" />;
  if (isRecovery || !session) return <AuthLoading message="Redirecting…" />;
  return <>{children}</>;
}
