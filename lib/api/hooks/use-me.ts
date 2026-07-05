"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * The authenticated user's identity + role — the client's source of truth for
 * gating admin-only surfaces (the Admin Panel / Data hub).
 *
 * Role is NOT in the Supabase JWT; it lives in public.users.role and is served
 * by GET /api/v1/me/profile. This hook reads it and derives `isAdmin`. Gated on
 * an active session (no session → no fetch, isAdmin=false). This is a UI hint
 * ONLY — every /admin/* API route is independently enforced with requireAdmin,
 * so a tampered client can never actually reach admin data.
 */
export interface MyProfile {
  userId: string;
  email: string;
  role: "user" | "admin";
  isAdmin: boolean;
}

export function useMe() {
  const { session, loading: authLoading } = useAuth();

  const query = useQuery<MyProfile>({
    queryKey: ["me", "profile"],
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // role rarely changes within a session
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: MyProfile }>(
        "/api/v1/me/profile",
      );
      return r.data;
    },
  });

  return {
    ...query,
    profile: query.data ?? null,
    // Only ever true once the profile has actually resolved to role='admin'.
    isAdmin: query.data?.isAdmin === true,
    // "Still figuring out who this is" — used to avoid flashing/gating too early.
    isResolving: authLoading || (!!session && query.isLoading),
  };
}
