"use client";

/**
 * Reset password — the page the reset-email link lands on.
 * ---------------------------------------------------------------------------
 * It reads the RECOVERY session (AuthProvider's `isRecovery`), never a normal
 * login. Four phases:
 *   checking → waiting for Supabase to process the link's token and fire
 *              PASSWORD_RECOVERY (short grace window).
 *   ready    → valid recovery session → show the new-password form.
 *   invalid  → no recovery session (direct hit / expired / errored link) →
 *              honest state + a way to request a fresh link. Never crash, never
 *              silently sign the user in.
 *   success  → password updated → sign out and return to /login with a note.
 *
 * On success we sign out so the user re-authenticates with the new password and
 * the recovery session is fully cleared.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { toFriendlyError, type FriendlyError } from "@/lib/auth/error-messages";
import { evaluatePassword } from "@/lib/auth/password";
import {
  AuthHeading,
  AuthAlert,
  PasswordField,
  PasswordRules,
  SubmitButton,
  MutedLink,
} from "@/components/auth/primitives";
import { Icons } from "@/lib/icons";

/** How long to wait for PASSWORD_RECOVERY before deciding the link is invalid. */
const GRACE_MS = 2500;

type Phase = "checking" | "ready" | "invalid" | "success";

/** Pull an error out of the link's hash or query (Supabase reports expiry here). */
function readLinkError(): string | null {
  if (typeof window === "undefined") return null;
  const parse = (s: string) => new URLSearchParams(s);
  const hash = parse(window.location.hash.replace(/^#/, ""));
  const query = parse(window.location.search.replace(/^\?/, ""));
  const desc = hash.get("error_description") ?? query.get("error_description");
  const err = hash.get("error") ?? query.get("error");
  if (desc) return desc.replace(/\+/g, " ");
  return err ? err.replace(/_/g, " ") : null;
}

/** Did we land here from a recovery link (auth params in the URL)? Captured on
 *  first render, before supabase's detectSessionInUrl strips them. On this route
 *  such params only ever come from a password-reset link. */
function landedWithRecoveryParams(): boolean {
  if (typeof window === "undefined") return false;
  const url = window.location.href;
  return (
    /[?&#](code|token|token_hash)=/.test(url) ||
    /[?&#]type=recovery/.test(url) ||
    /[?&#]access_token=/.test(url)
  );
}

export function ResetPasswordForm() {
  const { isRecovery, session, loading, updatePassword, signOut, clearRecovery } = useAuth();
  const router = useRouter();

  // Belt-and-suspenders: the PASSWORD_RECOVERY event is the primary signal, but
  // if a session gets established from the link's params we accept that too, so
  // a valid reset never mis-shows as "invalid".
  const [hadRecoveryParams] = React.useState(landedWithRecoveryParams);
  const recovering = isRecovery || (!!session && hadRecoveryParams);

  const [phase, setPhase] = React.useState<Phase>("checking");
  const [linkError, setLinkError] = React.useState<string | null>(null);

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = React.useState<FriendlyError | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Detect an explicit error in the link up front (skips the grace wait).
  React.useEffect(() => {
    const err = readLinkError();
    if (err) {
      setLinkError(err);
      setPhase("invalid");
    }
  }, []);

  // Promote to `ready` the moment a recovery session is confirmed.
  React.useEffect(() => {
    if (recovering) setPhase((p) => (p === "success" ? p : "ready"));
  }, [recovering]);

  // If no recovery session materializes within the grace window, it's invalid.
  React.useEffect(() => {
    if (recovering || phase === "invalid" || phase === "success") return;
    const t = setTimeout(() => {
      setPhase((p) => (p === "ready" || p === "success" ? p : "invalid"));
    }, GRACE_MS);
    return () => clearTimeout(t);
  }, [recovering, loading, phase]);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!evaluatePassword(password).valid) next.password = "Password doesn't meet the requirements.";
    if (confirm !== password) next.confirm = "Passwords don't match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    const { error } = await updatePassword(password);
    if (error) {
      setFormError(toFriendlyError(error));
      setSubmitting(false);
      return;
    }
    // Updated → clear recovery, sign out, and send them to login to re-auth.
    setPhase("success");
    clearRecovery();
    await signOut();
    router.replace("/login?reset=success");
  }

  // ── checking ──
  if (phase === "checking") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Icons.spinner className="size-6 animate-spin text-primary" />
        <p className="text-[13px] text-ink2 sm:text-sm">Validating your reset link…</p>
      </div>
    );
  }

  // ── success ──
  if (phase === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-success/12 ring-1 ring-success/25 sm:size-14">
          <Icons.success weight="duotone" className="size-6 text-success sm:size-7" />
        </span>
        <h1 className="font-display text-[1.25rem] font-semibold tracking-tight text-ink sm:text-[1.4rem]">
          Password updated
        </h1>
        <p className="text-[13px] text-ink2 sm:text-sm">Redirecting you to sign in…</p>
      </div>
    );
  }

  // ── invalid ──
  if (phase === "invalid") {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center sm:gap-5">
        <span className="grid size-12 place-items-center rounded-2xl bg-danger/12 ring-1 ring-danger/25 sm:size-14">
          <Icons.warning weight="duotone" className="size-6 text-danger sm:size-7" />
        </span>
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h1 className="font-display text-[1.3rem] font-semibold leading-tight tracking-tight text-ink sm:text-[1.5rem]">
            This reset link is invalid or expired
          </h1>
          <p className="text-[13px] leading-relaxed text-ink2 sm:text-sm">
            {linkError
              ? `${linkError.charAt(0).toUpperCase()}${linkError.slice(1)}. `
              : "For your security, reset links expire after a short time. "}
            Request a new one to continue.
          </p>
        </div>
        <div className="mt-1 flex flex-col items-center gap-2 text-[13px] text-ink3 sm:text-sm">
          <MutedLink href="/forgot-password">Request a new link</MutedLink>
          <MutedLink href="/login">Back to sign in</MutedLink>
        </div>
      </div>
    );
  }

  // ── ready ──
  return (
    <div className="flex flex-col gap-2">
      <AuthHeading
        eyebrow="Password reset"
        title="Set a new password"
        subtitle="Choose a strong password you don't use elsewhere."
      />

      {formError && (
        <AuthAlert tone="error" title={formError.title}>
          {formError.detail}
        </AuthAlert>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5 sm:gap-4">
        <div className="flex flex-col gap-2.5">
          <PasswordField
            label="New password"
            autoComplete="new-password"
            placeholder="Create a new password"
            value={password}
            error={errors.password}
            disabled={submitting}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
            }}
          />
          {password.length > 0 && <PasswordRules value={password} />}
        </div>

        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          value={confirm}
          error={errors.confirm}
          disabled={submitting}
          className="mb-3"
          onChange={(e) => {
            setConfirm(e.target.value);
            if (errors.confirm) setErrors((x) => ({ ...x, confirm: undefined }));
          }}
        />

        <SubmitButton loading={submitting}>Update password</SubmitButton>
      </form>
    </div>
  );
}
