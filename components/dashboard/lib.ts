// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD — shared pure helpers. No JSX, no fabricated data. Every value here is
// derived from a real read (auth session, portfolio totals) or is a formatting
// convenience. The dashboard cards each self-fetch their own /me/* read; these are
// the small shared derivations so the cards stay honest and consistent.
// ─────────────────────────────────────────────────────────────────────────────
import { formatINR } from "@/lib/format";

// ── THE GREETING AND ITS NAME LIVE IN components/chat/welcome.ts ────────────────────────────────────
// They used to be here, as `greeting(hour)` (three lines off the BROWSER's clock) and `nameFromUser`
// (metadata → email local-part → "there"). Both are gone rather than re-exported: the hero now calls the
// chat's `useGreeting()`, so there is ONE greeting on the platform and no second copy that can drift.
//
// Two behaviours changed with them, deliberately:
//   · THE CLOCK IS IST, not the browser's. The chat's convention everywhere a time is shown — a reader in
//     Dubai keeps Indian market hours, so their local clock is the wrong one to greet by.
//   · A READER WITH NO NAME SET gets the written nameless line ("Good morning") instead of a name derived
//     from their email local-part — which produced "Good morning, Arman.shaikh01082003", never a name
//     anyone chose. welcome.ts writes both faces of every line for exactly this reason.

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
