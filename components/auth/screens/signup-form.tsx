"use client";

/**
 * Sign up — email, password (live-validated) + confirm password (+ Google).
 * ---------------------------------------------------------------------------
 * No display name here — that's collected in onboarding. Two success paths,
 * chosen by what Supabase returns:
 *   • a SESSION (email confirmation OFF) → the (auth) layout gate routes the
 *     new user to onboarding (onboardingComplete === false).
 *   • a USER but NO session (email confirmation ON) → we show a "check your
 *     email" state. This path is wired NOW even though confirmation is off, so
 *     turning it on later needs no new code.
 * We also detect Supabase's anti-enumeration shape (a returned user with zero
 * identities == the email is already registered) and surface it honestly.
 */

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { toFriendlyError, type FriendlyError } from "@/lib/auth/error-messages";
import { evaluatePassword, isValidEmail } from "@/lib/auth/password";
import {
  AuthHeading,
  AuthAlert,
  Field,
  PasswordField,
  PasswordRules,
  SubmitButton,
  OrDivider,
  MutedLink,
} from "@/components/auth/primitives";
import { GoogleButton } from "@/components/auth/google-button";
import { Icons } from "@/lib/icons";

export function SignupForm() {
  const { signUp, signInWithGoogle } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showRules, setShowRules] = React.useState(false);

  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = React.useState<FriendlyError | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [confirmSent, setConfirmSent] = React.useState<string | null>(null);

  function validate(): boolean {
    const next: typeof fieldErrors = {};
    if (!email.trim()) next.email = "Enter your email.";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (!evaluatePassword(password).valid) next.password = "Password doesn't meet the requirements.";
    if (!confirm) next.confirm = "Re-enter your password.";
    else if (confirm !== password) next.confirm = "Passwords don't match.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) {
      setShowRules(true);
      return;
    }

    setSubmitting(true);
    const { data, error } = await signUp({ email: email.trim(), password });

    if (error) {
      setFormError(toFriendlyError(error));
      setSubmitting(false);
      return;
    }

    // Anti-enumeration: a user with no identities means the email already exists.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setFormError(toFriendlyError({ code: "user_already_exists" }));
      setSubmitting(false);
      return;
    }

    if (data.session) {
      // Confirmation OFF → signed in. The layout gate routes to onboarding.
      // Keep the button busy through the redirect.
      return;
    }

    // Confirmation ON → no session yet. Show the "check your email" state.
    setConfirmSent(email.trim());
    setSubmitting(false);
  }

  async function onGoogle() {
    setFormError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setFormError(toFriendlyError(error));
      setGoogleLoading(false);
    }
  }

  // ── "Check your email" confirmation state ──
  if (confirmSent) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center sm:gap-5">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/12 ring-1 ring-primary/25 sm:size-14">
          <Icons.envelope weight="duotone" className="size-6 text-primary sm:size-7" />
        </span>
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h1 className="font-display text-[1.3rem] font-semibold leading-tight tracking-tight text-ink sm:text-[1.5rem]">
            Check your email
          </h1>
          <p className="text-[13px] leading-relaxed text-ink2 sm:text-sm">
            We sent a confirmation link to{" "}
            <span className="font-medium text-ink">{confirmSent}</span>. Open it to activate
            your account, then sign in.
          </p>
        </div>
        <div className="mt-1 text-[13px] text-ink3 sm:text-sm">
          Already confirmed? <MutedLink href="/login">Sign in</MutedLink>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <AuthHeading
        eyebrow="Get started"
        title="Create your account"
        subtitle={
          <>
            Already have one? <MutedLink href="/login">Sign in</MutedLink>
          </>
        }
      />

      {formError && (
        <AuthAlert tone="error" title={formError.title}>
          {formError.detail}
        </AuthAlert>
      )}

      <form onSubmit={onSubmit} noValidate className="flex mt-4 flex-col gap-3.5 sm:gap-4">
        <Field
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          error={fieldErrors.email}
          disabled={submitting}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
        />

        <div className="flex flex-col gap-2.5">
          <PasswordField
            label="Password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            error={fieldErrors.password}
            disabled={submitting}
            onFocus={() => setShowRules(true)}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
          />
          {(showRules || password.length > 0) && <PasswordRules value={password} />}
        </div>

        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirm}
          error={fieldErrors.confirm}
          disabled={submitting}
          className="mb-3"
          onChange={(e) => {
            setConfirm(e.target.value);
            if (fieldErrors.confirm) setFieldErrors((f) => ({ ...f, confirm: undefined }));
          }}
        />

        <SubmitButton loading={submitting}>Create account</SubmitButton>
      </form>

      <OrDivider />

      <GoogleButton
        onClick={onGoogle}
        loading={googleLoading}
        disabled={submitting}
        label="Sign up with Google"
      />

      <p className="text-center text-[11px] leading-relaxed text-ink3 sm:text-xs">
        By continuing you agree to Vytal&apos;s Terms &amp; Privacy Policy.
      </p>
    </div>
  );
}
