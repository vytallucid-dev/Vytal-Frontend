/**
 * fetch() wrapper for admin-only endpoints (/api/v1/admin/*).
 * Attaches the current Supabase session's access token as a Bearer header —
 * same token lookup as apiFetch() in ./client.ts — but returns the raw
 * Response instead of a parsed body, so existing `res.json()` /
 * `json.success` handling at call sites is unchanged.
 */

import { supabase } from "@/lib/supabase/client";

export async function adminFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const headers: HeadersInit = {
    ...init.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(input, { ...init, headers });
}
