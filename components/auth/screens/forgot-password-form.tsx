"use client";

/**
 * Forgot password — email → resetPasswordForEmail(redirectTo: /reset-password).
 * On success we show an explicit "check your email" state (never leave the user
 * guessing). We show the same confirmation regardless of whether the email
 * exists — standard anti-enumeration — while still surfacing real errors like
 * rate limits.
 */

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { toFriendlyError, type FriendlyError } from "@/lib/auth/error-messages";
import { isValidEmail } from "@/lib/auth/password";
import {
  AuthHeading,
  AuthAlert,
  Field,
  SubmitButton,
  MutedLink,
} from "@/components/auth/primitives";
import { Icons } from "@/lib/icons";

export function ForgotPasswordForm() {
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | undefined>();
  const [formError, setFormError] = React.useState<FriendlyError | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!email.trim()) {
      setEmailError("Enter your email.");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    const { error } = await resetPasswordForEmail(email.trim());
    setSubmitting(false);
    if (error) {
      setFormError(toFriendlyError(error));
      return;
    }
    setSent(true);
  }

  // ── "Check your email" state ──
  if (sent) {
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
            If an account exists for{" "}
            <span className="font-medium text-ink">{email.trim()}</span>, we&apos;ve sent a link
            to reset your password. It expires shortly for your security.
          </p>
        </div>
        <div className="mt-1 flex flex-col items-center gap-2 text-[13px] text-ink3 sm:text-sm">
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            Use a different email
          </button>
          <MutedLink href="/login">Back to sign in</MutedLink>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <AuthHeading
        eyebrow="Password reset"
        title="Forgot your password?"
        subtitle="Enter your email and we'll send you a link to set a new one."
      />

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
          error={emailError}
          disabled={submitting}
          className="mb-3"
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(undefined);
          }}
        />

        <SubmitButton loading={submitting}>Send reset link</SubmitButton>
      </form>

      <div className="text-center text-[13px] text-ink3 sm:text-sm">
        Remembered it? <MutedLink href="/login">Back to sign in</MutedLink>
      </div>
    </div>
  );
}
