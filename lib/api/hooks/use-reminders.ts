"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { EventReminder, RemindersResponse, CreateReminderInput } from "@/types/reminders";

const REMINDERS_KEY = ["me", "reminders"] as const;

/**
 * The authenticated user's event reminders → GET /api/v1/me/reminders. READ-ONLY over the
 * contract: the backend resolves each reminder's next event, fires in the lead window, and
 * sends the email; this renders the rules + their resolved next date.
 */
export function useReminders(opts: { enabled?: boolean } = {}) {
  return useQuery<EventReminder[]>({
    queryKey: REMINDERS_KEY,
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: RemindersResponse }>("/api/v1/me/reminders");
      return r.data.reminders;
    },
    enabled: opts.enabled ?? true,
  });
}

/** Create / pause-resume / delete a reminder. Every mutation invalidates the rules so they
 *  re-read the server truth (nextEventDate is server-resolved). */
export function useReminderMutations() {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: REMINDERS_KEY });

  // POST is idempotent on (stock, eventType) — re-affirms (updates daysBefore) rather than
  // duplicating. Returns { reminder, created }.
  const create = useMutation({
    mutationFn: (body: CreateReminderInput) =>
      apiFetch<{ success: boolean; data: { reminder: EventReminder; created: boolean } }>(
        "/api/v1/me/reminders",
        { method: "POST", body: JSON.stringify(body) },
      ),
    onSuccess: refresh,
    meta: {
      successMessage: (data: unknown) =>
        (data as { data?: { created?: boolean } })?.data?.created === false
          ? "Reminder updated"
          : "Reminder set",
      successDescription: "We'll email you before the event.",
      errorMessage: "Couldn't set the reminder",
    },
  });

  // PATCH is pause/resume ONLY (the whole edit surface).
  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch<{ success: boolean; data: { reminder: EventReminder } }>(
        `/api/v1/me/reminders/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify({ active }) },
      ),
    onSuccess: refresh,
    meta: {
      successMessage: (_data: unknown, vars: unknown) =>
        (vars as { active: boolean }).active ? "Reminder resumed" : "Reminder paused",
      errorMessage: "Couldn't update the reminder",
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean; data: unknown }>(
        `/api/v1/me/reminders/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
    onSuccess: refresh,
    meta: {
      successMessage: "Reminder removed",
      errorMessage: "Couldn't remove the reminder",
    },
  });

  return { create, setActive, remove };
}
