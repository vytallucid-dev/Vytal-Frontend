/**
 * Map Supabase auth errors to friendly, honest copy.
 * ---------------------------------------------------------------------------
 * We surface Supabase's ACTUAL failures (we never swallow them) but translate
 * the raw strings into calm, human sentences. Matching is by `code` first (the
 * stable signal on modern supabase-js AuthError) with a message-substring
 * fallback for older shapes. Unknown errors fall through to their raw message
 * so nothing is hidden — we just clean it up.
 */

import type { AuthError } from "@supabase/supabase-js";

export interface FriendlyError {
  /** headline shown in the alert */
  title: string;
  /** optional supporting line */
  detail?: string;
}

/** Known Supabase auth error codes → friendly copy. */
const BY_CODE: Record<string, FriendlyError> = {
  invalid_credentials: {
    title: "Incorrect email or password",
    detail: "Double-check your details and try again.",
  },
  email_not_confirmed: {
    title: "Confirm your email first",
    detail: "We sent you a confirmation link — open it, then sign in.",
  },
  user_already_exists: {
    title: "That email is already registered",
    detail: "Try signing in instead, or reset your password.",
  },
  email_exists: {
    title: "That email is already registered",
    detail: "Try signing in instead, or reset your password.",
  },
  weak_password: {
    title: "That password is too weak",
    detail: "Use a longer password with a mix of characters.",
  },
  over_email_send_rate_limit: {
    title: "Too many attempts",
    detail: "Please wait a minute before trying again.",
  },
  over_request_rate_limit: {
    title: "Too many attempts",
    detail: "Please wait a moment before trying again.",
  },
  validation_failed: {
    title: "Check the details you entered",
  },
  same_password: {
    title: "Choose a different password",
    detail: "Your new password must not match your current one.",
  },
  session_not_found: {
    title: "Your session has expired",
    detail: "Please sign in again.",
  },
  user_not_found: {
    title: "No account found",
    detail: "We couldn't find an account with those details.",
  },
  signup_disabled: {
    title: "Sign-ups are currently closed",
  },
  provider_disabled: {
    title: "That sign-in method isn't available",
  },
};

/** Fallback substring matches for older error shapes without a `code`. */
const BY_MESSAGE: [test: RegExp, friendly: FriendlyError][] = [
  [/invalid login credentials/i, BY_CODE.invalid_credentials],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/already registered|already been registered|already exists/i, BY_CODE.user_already_exists],
  [/password should be at least|weak password|password is too/i, BY_CODE.weak_password],
  [/rate limit|too many requests/i, BY_CODE.over_request_rate_limit],
  [/unable to validate email|invalid email/i, { title: "That email address looks off", detail: "Enter a valid email and try again." }],
  [/new password should be different|different from the old/i, BY_CODE.same_password],
  [/user not found/i, BY_CODE.user_not_found],
  [/network|failed to fetch/i, { title: "Connection problem", detail: "Check your internet and try again." }],
];

/**
 * Normalize any thrown/returned auth error into friendly copy.
 * Accepts a Supabase AuthError, a plain Error, or an unknown throw.
 */
export function toFriendlyError(err: unknown): FriendlyError {
  if (!err) return { title: "Something went wrong", detail: "Please try again." };

  const authErr = err as Partial<AuthError> & { code?: string; message?: string };
  const code = authErr.code;
  if (code && BY_CODE[code]) return BY_CODE[code];

  const message = authErr.message ?? String(err);
  for (const [test, friendly] of BY_MESSAGE) {
    if (test.test(message)) return friendly;
  }

  // Unknown — surface the real message (cleaned), never a silent failure.
  return { title: message || "Something went wrong" };
}
