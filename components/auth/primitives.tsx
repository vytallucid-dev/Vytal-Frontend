"use client";

/**
 * Auth form primitives — the shared building blocks every screen composes from,
 * so all five auth screens read as one designed surface (not five templates).
 *   AuthHeading · Field · PasswordField · PasswordRules · AuthAlert ·
 *   SubmitButton · OrDivider · MutedLink
 * All dark, on the platform tokens (ink / line / surface / primary).
 */

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { evaluatePassword, type PasswordState } from "@/lib/auth/password";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── AuthHeading — eyebrow + serif title + subcopy, shared across screens ── */
export function AuthHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="font-display text-[1.3rem] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[1.55rem] sm:leading-[1.1]">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[13px] leading-relaxed text-ink2 sm:text-sm">{subtitle}</p>
      )}
    </div>
  );
}

/* ── Field — labelled input with inline error + optional trailing slot ── */
interface FieldProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string | null;
  hint?: string;
  /** trailing control rendered inside the input frame (e.g. show/hide) */
  trailing?: React.ReactNode;
  /** right-aligned action beside the label (e.g. "Forgot password?") */
  labelAction?: React.ReactNode;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, trailing, labelAction, id, className, ...props },
  ref,
) {
  // Always call useId (never short-circuit it — Rules of Hooks).
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-xs font-medium text-ink2 sm:text-[13px]">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-10 w-full rounded-lg border bg-white/[0.03] px-3.5 text-[0.9rem] text-ink outline-none transition-colors sm:h-11 sm:text-[0.95rem]",
            "placeholder:text-ink3/80",
            "border-line2 hover:border-line3",
            "focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25",
            error && "border-danger/60 focus-visible:border-danger/70 focus-visible:ring-danger/20",
            trailing && "pr-11",
            className,
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">{trailing}</div>
        )}
      </div>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            id={`${inputId}-error`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-xs text-danger"
          >
            <Icons.warning weight="fill" className="size-3.5 shrink-0" />
            {error}
          </motion.p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-ink3">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

/* ── PasswordField — Field with a show/hide toggle ── */
interface PasswordFieldProps extends Omit<FieldProps, "trailing" | "type"> {
  autoComplete?: string;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [show, setShow] = React.useState(false);
    return (
      <Field
        ref={ref}
        type={show ? "text" : "password"}
        trailing={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="grid size-8 place-items-center rounded-md text-ink3 transition-colors hover:text-ink2"
          >
            {show ? (
              <Icons.eyeSlash className="size-[1.05rem]" />
            ) : (
              <Icons.eye className="size-[1.05rem]" />
            )}
          </button>
        }
        {...props}
      />
    );
  },
);

/* ── PasswordRules — live requirement checklist + strength meter ── */
export function PasswordRules({ value }: { value: string }) {
  const state: PasswordState = evaluatePassword(value);
  const meterColor =
    state.score <= 1
      ? "bg-danger"
      : state.score === 2
        ? "bg-warning"
        : state.score === 3
          ? "bg-steady"
          : "bg-success";

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-line/70 bg-white/[0.02] p-3">
      {/* strength meter */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-1.5 flex-1 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-full flex-1 rounded-full transition-colors duration-300",
                i < state.score ? meterColor : "bg-white/8",
              )}
            />
          ))}
        </div>
        <span className="w-12 text-right text-[11px] font-medium tabular-nums text-ink3">
          {state.strengthLabel}
        </span>
      </div>
      {/* rules */}
      <ul className="grid gap-1.5">
        {state.results.map((r) => (
          <li key={r.id} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full transition-colors",
                r.met ? "bg-success/15 text-success" : "bg-white/6 text-ink3",
              )}
            >
              {r.met ? (
                <Icons.check weight="bold" className="size-2.5" />
              ) : (
                <span className="size-1 rounded-full bg-current" />
              )}
            </span>
            <span className={cn(r.met ? "text-ink2" : "text-ink3")}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── AuthAlert — surfaced error / success / info banner ── */
type AlertTone = "error" | "success" | "info";

const alertStyles: Record<AlertTone, { wrap: string; icon: React.ReactNode }> = {
  error: {
    wrap: "border-danger/35 bg-danger/[0.09] text-danger",
    icon: <Icons.warning weight="fill" className="size-4 shrink-0" />,
  },
  success: {
    wrap: "border-success/35 bg-success/[0.09] text-success",
    icon: <Icons.success weight="fill" className="size-4 shrink-0" />,
  },
  info: {
    wrap: "border-primary/35 bg-primary/[0.09] text-primary",
    icon: <Icons.info weight="fill" className="size-4 shrink-0" />,
  },
};

export function AuthAlert({
  tone = "error",
  title,
  children,
}: {
  tone?: AlertTone;
  title: string;
  children?: React.ReactNode;
}) {
  const s = alertStyles[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        s.wrap,
      )}
    >
      <span className="mt-0.5">{s.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{title}</p>
        {children && (
          <p className="mt-0.5 text-[13px] leading-snug opacity-90">{children}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ── SubmitButton — full-width primary with a loading state ── */
export function SubmitButton({
  loading,
  children,
  ...props
}: React.ComponentProps<"button"> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className={cn(
        "relative cursor-pointer inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[0.9rem] font-semibold text-primary-foreground transition-all sm:h-11 sm:text-[0.95rem]",
        "hover:brightness-110 active:scale-[0.99]",
        "disabled:pointer-events-none disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      {...props}
    >
      {loading ? (
        <>
          <Icons.spinner className="size-4 animate-spin" />
          <span>Please wait…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* ── OrDivider — the "or" rule between email + Google ── */
export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink3">
        {label}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/* ── MutedLink — the small footer / inline links ── */
export function MutedLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}
