"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// AI EXPLANATION STYLE (aiLevel) — READ + PERSIST. The real thing, not a fake toggle.
//
// ⚠ THIS PERSISTS TO THE SERVER, unlike the neighbouring notification toggles (which are useState + a
// toast and save nothing). The value is READ from `GET /me/onboarding` (register.aiLevel) and WRITTEN via
// the existing `PATCH /me/register` — the same endpoint onboarding uses. Selected state is DERIVED from
// the server query, never from local component state, so a change sticks across reloads and devices.
//
// The success toast is left to the global MutationCache (query-provider.tsx toasts when `meta.successMessage`
// is set) — declared here so there is exactly ONE toast and no per-call-site wiring. Errors are auto-toasted
// there too.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { onboardingApi, type RemoteOnboarding } from "@/lib/api/onboarding";
import type { AiLevel } from "@/components/onboarding/onboarding-types";

/** The register lives inside the onboarding GET; keying on it means this cache is coherent with any
 *  future consumer of the same read, and one invalidation refreshes the persisted value everywhere. */
export const AI_LEVEL_KEY = ["me", "onboarding"] as const;

/** The persisted aiLevel (from the register). `null` while the first read is in flight or if it errors —
 *  the caller falls back to the default until a real value resolves, never guessing a wrong highlight. */
export function useAiLevel() {
  return useQuery({
    queryKey: AI_LEVEL_KEY,
    queryFn: () => onboardingApi.get(),
    select: (d): AiLevel | null => (d?.register?.aiLevel as AiLevel | undefined) ?? null,
  });
}

/**
 * Persist a new aiLevel → `PATCH /me/register`. Optimistic (the highlight moves the instant you tap) and
 * reconciled on settle: `onSettled` invalidates the read so the UI ends on the SERVER's value, not the
 * optimistic guess — which is exactly what proves it persisted rather than merely flipping local state.
 */
export function useUpdateAiLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (aiLevel: AiLevel) => onboardingApi.patchRegister(aiLevel),
    onMutate: async (aiLevel) => {
      await qc.cancelQueries({ queryKey: AI_LEVEL_KEY });
      const prev = qc.getQueryData<RemoteOnboarding>(AI_LEVEL_KEY);
      if (prev) qc.setQueryData<RemoteOnboarding>(AI_LEVEL_KEY, { ...prev, register: { ...prev.register, aiLevel } });
      return { prev };
    },
    onError: (_err, _aiLevel, ctx) => {
      // Roll the optimistic highlight back; the global MutationCache surfaces the error toast.
      if (ctx?.prev) qc.setQueryData(AI_LEVEL_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: AI_LEVEL_KEY }),
    meta: {
      successMessage: "Explanation style updated",
      successDescription: "Vytal will use this across the app. Saved to your account.",
    },
  });
}
