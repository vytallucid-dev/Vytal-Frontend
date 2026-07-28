// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE PROVISIONAL OPENING LINE — a placeholder, and nothing more.
//
// ★ THE REAL LINE IS THE SERVER'S, AND ONLY THE SERVER'S. Each surface's reader-facing opening is written
// in chat/openings.ts §buildDisplay, directly beside the buildAsk it stands in for, and persisted on the
// opening user row as `display_content`. That is what the panel renders, what /chat renders on the same
// conversation, and what survives a reload — one text, one place. This file used to mirror all five of
// those strings client-side; it no longer does, because two copies of a promise about what an answer
// covers is exactly the pair that drifts, and the half that drifts is the one nobody re-reads.
//
// What remains is a SUBJECT NAME in a sentence frame, for the seconds between the reader tapping a card
// and the server answering. It says only what the client genuinely knows — which subject was tapped — and
// is replaced by the server's line the moment the open resolves. It deliberately promises nothing about
// what the answer will cover, because from here that would be a guess.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import type { DiscussContext } from "@/components/discuss/discuss-context";

/** The subject as the reader would say it — a ticker, a compared set, a name, else a soft fallback.
 *  Also the panel header's stand-in label while a fresh conversation is still opening (it has no
 *  server-derived title yet, and "Conversation" would be a worse answer than the subject itself). */
export function subjectLabelFor(ctx: DiscussContext): string {
  const s = ctx.subject;
  if (s.symbol) return s.symbol.toUpperCase();
  if (s.symbols && s.symbols.length > 0) return s.symbols.map((x) => x.toUpperCase()).join(" vs ");
  if (s.kind === "portfolio") return "my portfolio";
  if (s.name) return s.name;
  return "this";
}

/** What the card said it was about, if it said — a metric, a finding, a named concept. Pure identity that
 *  the CLIENT itself put in the context, never a claim about the answer. */
function focusOf(ctx: DiscussContext): string | null {
  const d = ctx.detail ?? {};
  for (const k of ["metric", "finding", "name", "title"]) {
    const v = d[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * The bubble shown while the open is in flight; the message sent when a card joins a RUNNING
 * conversation; and the last-resort default if a conversation somehow arrives without a display line (a
 * session created before `display_content` existed).
 *
 * ★ ONE RULE, NOT FIVE. It names the subject and — when the card named one — the thing on it, because
 * both are identity the client already holds. It never says what the answer will cover: that is a promise
 * only buildAsk can keep, so only buildDisplay, sitting next to it, is allowed to make it.
 */
export function provisionalOpeningLine(ctx: DiscussContext): string {
  const subject = subjectLabelFor(ctx);
  const focus = focusOf(ctx);
  return focus ? `Explain ${focus} on ${subject}` : `Explain ${subject}`;
}
