"use client";

/**
 * Log in — email/password + Continue with Google.
 * On success we do NOT route here: the (auth) layout's gate observes the new
 * session and sends the user onward (onboarding vs dashboard via the isolated
 * mock, honoring any ?redirect=). We just surface real Supabase errors.
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { toFriendlyError, type FriendlyError } from "@/lib/auth/error-messages";
import { isValidEmail } from "@/lib/auth/password";
import {
  AuthHeading,
  AuthAlert,
  Field,
  PasswordField,
  SubmitButton,
  OrDivider,
  MutedLink,
} from "@/components/auth/primitives";
import { GoogleButton } from "@/components/auth/google-button";

export function LoginForm() {
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = React.useState<FriendlyError | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  // "Password updated — please sign in" note after a completed reset.
  const resetDone = searchParams.get("reset") === "success";

  function validate(): boolean {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Enter your email.";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) {
      setFormError(toFriendlyError(error));
      setSubmitting(false);
      return;
    }
    // Success → keep the button busy; the layout gate redirects us onward.
  }

  async function onGoogle() {
    setFormError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setFormError(toFriendlyError(error));
      setGoogleLoading(false);
    }
    // On success the browser is already navigating to Google.
  }

  return (
    <div className="flex flex-col gap-2">
      <AuthHeading
        eyebrow="Welcome back"
        title="Sign in to Vytal"
        subtitle={
          <>
            New here? <MutedLink href="/signup">Create an account</MutedLink>
          </>
        }
      />

      {resetDone && (
        <AuthAlert tone="success" title="Password updated">
          Sign in with your new password.
        </AuthAlert>
      )}

      {formError && (
        <AuthAlert tone="error" title={formError.title}>
          {formError.detail}
        </AuthAlert>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5 sm:gap-4">
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

        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          error={fieldErrors.password}
          disabled={submitting}
          className="mb-3"
          labelAction={
            <MutedLink href="/forgot-password" className="text-xs">
              Forgot password?
            </MutedLink>
          }
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
          }}
        />

        <SubmitButton loading={submitting}>Sign in</SubmitButton>
      </form>

      <OrDivider />

      <GoogleButton onClick={onGoogle} loading={googleLoading} disabled={submitting} />
    </div>
  );
}
