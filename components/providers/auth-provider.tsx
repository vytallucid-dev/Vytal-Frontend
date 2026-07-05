"use client";

/**
 * AuthProvider — app-wide session, the single source of truth for auth.
 * ===========================================================================
 * The Supabase session IS the state. We subscribe to `onAuthStateChange` and
 * mirror it into React context; we never hand-roll token storage (supabase-js
 * persists + auto-refreshes on its own — see lib/supabase/client.ts).
 *
 * Exposes `{ user, session, loading, isRecovery }` plus thin helpers that wrap
 * the Supabase auth calls. Helpers return Supabase's real `{ data, error }` so
 * screens surface the ACTUAL error (mapped to friendly copy at the edge) rather
 * than us swallowing it here.
 *
 * ── THE CORRECTNESS TRAP: recovery sessions ────────────────────────────────
 * When a user arrives via a password-reset email link, Supabase establishes a
 * *recovery* session and fires a `PASSWORD_RECOVERY` event. That user must land
 * on the RESET-PASSWORD form — NOT be treated as a normally-logged-in user and
 * waved into the dashboard. We latch an `isRecovery` flag on that event (and
 * mirror it to sessionStorage so a refresh on the reset page keeps the mode),
 * and routing everywhere keys off it. It is cleared on sign-out and by
 * `clearRecovery()` (called once the password has been updated).
 */

import * as React from "react";
import type {
  AuthChangeEvent,
  AuthResponse,
  AuthTokenResponsePassword,
  OAuthResponse,
  Session,
  User,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/** sessionStorage key — a per-tab UI hint, NOT a token (tokens stay in supabase). */
const RECOVERY_FLAG_KEY = "vytal.auth.recovery";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /** true until the initial session check resolves (gates first render) */
  loading: boolean;
  /** true when the active session came from a password-reset link */
  isRecovery: boolean;

  signInWithPassword: (email: string, password: string) => Promise<AuthTokenResponsePassword>;
  signUp: (args: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<OAuthResponse>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  /** drop recovery mode once the new password is set (before routing to login) */
  clearRecovery: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/** Absolute app origin for redirect URLs (client-only). */
function appOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isRecovery, setIsRecovery] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    // Seed recovery mode from the per-tab marker so a refresh on the reset page
    // (URL token already consumed) still shows the reset form, not the app.
    try {
      if (window.sessionStorage.getItem(RECOVERY_FLAG_KEY) === "1") {
        setIsRecovery(true);
      }
    } catch {
      /* sessionStorage unavailable — recovery still latches via the event below */
    }

    // Initial snapshot — resolves `loading`. supabase-js reads persisted session.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Live updates. Keep this callback SYNCHRONOUS (no awaits) — awaiting inside
    // it can deadlock the auth client.
    const { data: sub } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, nextSession) => {
        if (!active) return;

        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);

        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true);
          try {
            window.sessionStorage.setItem(RECOVERY_FLAG_KEY, "1");
          } catch {
            /* ignore */
          }
        } else if (event === "SIGNED_OUT") {
          setIsRecovery(false);
          try {
            window.sessionStorage.removeItem(RECOVERY_FLAG_KEY);
          } catch {
            /* ignore */
          }
        }
      },
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const clearRecovery = React.useCallback(() => {
    setIsRecovery(false);
    try {
      window.sessionStorage.removeItem(RECOVERY_FLAG_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isRecovery,

      signInWithPassword: (email, password) =>
        supabase.auth.signInWithPassword({ email, password }),

      signUp: ({ email, password, displayName }) =>
        supabase.auth.signUp({
          email,
          password,
          options: {
            // user_metadata — the backend's signup trigger provisions the
            // public.users row from this. `emailRedirectTo` matters only once
            // email confirmation is switched on (harmless while it's off).
            data: displayName
              ? { display_name: displayName, full_name: displayName }
              : undefined,
            emailRedirectTo: `${appOrigin()}/callback`,
          },
        }),

      signInWithGoogle: () =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${appOrigin()}/callback` },
        }),

      signOut: async () => {
        await supabase.auth.signOut();
      },

      resetPasswordForEmail: (email) =>
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${appOrigin()}/reset-password`,
        }),

      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { error };
      },

      clearRecovery,
    }),
    [user, session, loading, isRecovery, clearRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
