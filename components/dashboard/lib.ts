// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD — shared pure helpers. No JSX, no fabricated data. Every value here is
// derived from a real read (auth session, portfolio totals) or is a formatting
// convenience. The dashboard cards each self-fetch their own /me/* read; these are
// the small shared derivations so the cards stay honest and consistent.
// ─────────────────────────────────────────────────────────────────────────────
import { formatINR } from "@/lib/format";

/** The user's display name, from Supabase user_metadata → email local-part → fallback.
 *  Mirrors components/app-sidebar-user.tsx so the greeting matches the account card. */
export function nameFromUser(
  meta: Record<string, unknown> | undefined,
  email: string | undefined,
): string {
  const fromMeta =
    (typeof meta?.display_name === "string" && meta.display_name) ||
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    "";
  if (fromMeta.trim()) return fromMeta.trim().split(/\s+/)[0]; // first name for the greeting
  if (email) {
    const local = email.split("@")[0];
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "there";
}

/** Time-of-day greeting. Client-only (uses local time) — the hero is a client card. */
export function greeting(hour: number): string {
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** Signed compact rupee, e.g. +₹1.2L / −₹34.0K. The minus is a real minus glyph. */
export function signINR(v: number): string {
  return `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;
}

/** Signed percentage, e.g. +2.35% / −10.98%. */
export function signPct(v: number): string {
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}%`;
}

/** Compact "time ago" from an ISO timestamp — no date lib. Client-only. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
