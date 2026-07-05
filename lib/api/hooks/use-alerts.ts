"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type {
  Alert,
  AlertEvent,
  AlertsResponse,
  AlertEventsResponse,
  CreateAlertInput,
  UpdateAlertInput,
} from "@/types/alerts";

const ALERTS_KEY = ["me", "alerts"] as const;
const EVENTS_KEY = ["me", "alerts", "events"] as const;

/**
 * The authenticated user's alert rules → GET /api/v1/me/alerts. READ-ONLY: the backend
 * evaluates + records; this renders the rules and their state (active/armed/last-fired).
 */
export function useAlerts(opts: { enabled?: boolean } = {}) {
  return useQuery<Alert[]>({
    queryKey: ALERTS_KEY,
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: AlertsResponse }>("/api/v1/me/alerts");
      return r.data.alerts;
    },
    enabled: opts.enabled ?? true,
  });
}

/** The fired-events log → GET /api/v1/me/alerts/events (discrete crossings, newest first). */
export function useAlertEvents(limit = 50) {
  return useQuery<AlertEvent[]>({
    queryKey: [...EVENTS_KEY, limit],
    queryFn: async () => {
      const r = await apiFetch<{ success: boolean; data: AlertEventsResponse }>(
        `/api/v1/me/alerts/events?limit=${limit}`,
      );
      return r.data.events;
    },
    refetchOnWindowFocus: true,
  });
}

/** Create / edit / delete an alert rule. Every mutation invalidates the rules AND the
 *  events feed so both re-read the server truth. No derived state is faked client-side. */
export function useAlertMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ALERTS_KEY });
    void qc.invalidateQueries({ queryKey: EVENTS_KEY });
  };

  const create = useMutation({
    mutationFn: (body: CreateAlertInput) =>
      apiFetch<{ success: boolean; data: { alert: Alert } }>("/api/v1/me/alerts", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: refresh,
    meta: {
      successMessage: "Alert set",
      successDescription: "We'll record it the moment it crosses.",
      errorMessage: "Couldn't set the alert",
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAlertInput }) =>
      apiFetch<{ success: boolean; data: { alert: Alert } }>(
        `/api/v1/me/alerts/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(body) },
      ),
    onSuccess: refresh,
    meta: {
      // pause/resume from the manage row sends only { active }; a full edit sends more.
      successMessage: (_data: unknown, vars: unknown) => {
        const body = (vars as { body?: Record<string, unknown> })?.body ?? {};
        const keys = Object.keys(body);
        if (keys.length === 1 && keys[0] === "active") return body.active ? "Alert resumed" : "Alert paused";
        return "Alert updated";
      },
      errorMessage: "Couldn't update the alert",
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean; data: unknown }>(
        `/api/v1/me/alerts/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
    onSuccess: refresh,
    meta: {
      successMessage: "Alert deleted",
      errorMessage: "Couldn't delete the alert",
    },
  });

  return { create, update, remove };
}
