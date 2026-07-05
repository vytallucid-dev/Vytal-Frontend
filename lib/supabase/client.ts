/**
 * Supabase browser client — the single shared instance for the whole app.
 * ---------------------------------------------------------------------------
 * Session is the source of truth for auth. We DO NOT hand-roll token storage:
 * supabase-js persists the session (localStorage) and auto-refreshes the access
 * token on its own. `detectSessionInUrl` is what lets the OAuth redirect and the
 * password-recovery email link establish a session when the user lands back on
 * the app (the AuthProvider listens for the resulting auth events).
 *
 * Exported as a memoized singleton so every import shares ONE GoTrue client —
 * multiple clients would fight over the same storage key and duplicate the token
 * refresh timer.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loud in dev — a missing key silently breaks every auth call otherwise.
  // (Both values are public/browser-safe; see .env.example.)
  throw new Error(
    "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env (Dashboard → Project Settings → API).",
  );
}

/**
 * Module singleton. Guarding against re-instantiation matters under Next's dev
 * fast-refresh / HMR, where a module can re-evaluate and spawn duplicate clients.
 */
declare global {
  // eslint-disable-next-line no-var
  var __vytalSupabase: SupabaseClient | undefined;
}

export const supabase: SupabaseClient =
  globalThis.__vytalSupabase ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Establish a session from the tokens/code in the URL after an OAuth
      // redirect or a password-reset email link, then clean the URL.
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__vytalSupabase = supabase;
}
