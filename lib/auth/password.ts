/**
 * Password policy — one source of truth for the signup / reset requirements.
 * ---------------------------------------------------------------------------
 * These are the CLIENT-side requirements we show + validate live. They are set
 * at or above Supabase's server policy so a password that passes here passes
 * there too; if the project's server policy is ever stricter, Supabase still
 * has the final say and its `weak_password` error is surfaced (see
 * error-messages.ts). Tune the whole product's password bar from this file.
 */

export interface PasswordRule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

/** Minimum length — keep >= your Supabase Auth "Minimum password length". */
export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${MIN_PASSWORD_LENGTH} characters`,
    test: (pw) => pw.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "letter",
    label: "Contains a letter",
    test: (pw) => /\p{L}/u.test(pw),
  },
  {
    id: "number",
    label: "Contains a number",
    test: (pw) => /\d/.test(pw),
  },
];

export interface PasswordState {
  /** per-rule pass/fail, in display order */
  results: { id: string; label: string; met: boolean }[];
  /** every gating rule satisfied */
  valid: boolean;
  /** 0–4 coarse strength score for the meter */
  score: number;
  /** human label for the score */
  strengthLabel: "" | "Weak" | "Fair" | "Good" | "Strong";
}

/** Evaluate a password against the policy — drives the live checklist + meter. */
export function evaluatePassword(pw: string): PasswordState {
  const results = PASSWORD_RULES.map((r) => ({
    id: r.id,
    label: r.label,
    met: r.test(pw),
  }));
  const valid = results.every((r) => r.met);

  // Coarse strength: rules met + length/variety bonuses. Presentation only —
  // `valid` (not score) is what gates submission.
  let score = 0;
  if (pw.length >= MIN_PASSWORD_LENGTH) score++;
  if (pw.length >= 12) score++;
  if (/\p{L}/u.test(pw) && /\d/.test(pw)) score++;
  if (/[^\p{L}\d]/u.test(pw)) score++;
  score = Math.min(score, 4);

  const strengthLabel = (
    pw.length === 0 ? "" : score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong"
  ) as PasswordState["strengthLabel"];

  return { results, valid, score, strengthLabel };
}

/** Lightweight email shape check for inline validation (server is authoritative). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
