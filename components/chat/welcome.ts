"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE BLANK-CONVERSATION COPY — shared by the chat page's welcome and the sidekick panel's empty state,
// so the two surfaces greet the same reader the same way. Only the LAYOUT differs (a centred hero block
// at 800px vs a bottom-anchored stack in a ~350px rail); the words are these.
//
// ═══ THE GREETING ═══════════════════════════════════════════════════════════════════════════════════
//
// Fifteen lines across seven bands of the day, picked at random within the band the reader arrives in.
// The register is warm and brief with a little character — this is a financial product, so nothing here
// is a joke, and nothing performs enthusiasm the reader hasn't earned yet.
//
// ★ NAME-OPTIONAL, AS TWO WRITTEN FORMS RATHER THAN ONE WITH THE NAME CUT OUT. Plenty of readers have no
// display name set, and mechanically stripping "…, {name}" leaves stumps ("Still up,"). So every line
// carries both faces, each written to read naturally on its own.
//
// ★ IST, ALWAYS — the app's convention everywhere a time is shown (chat-message §formatResetHint). A
// reader in Dubai or London still keeps Indian market hours, so their clock is the wrong one to greet by.
//
// ★ MARKET-AWARE LINES ARE WEEKDAY-GATED. Four lines name the session (pre-open / underway / after the
// close). They are offered only Mon–Fri, because "the session's underway" on a Sunday is simply false,
// and this product does not say things that aren't so to sound livelier. When a market line is withheld
// its band falls back to its neutral line(s) — a repeated true greeting beats a rotating false one.
//
// ⚠ §THE HOLIDAY CAVEAT — the ONE inaccuracy left, and it is known rather than overlooked. Mon–Fri is
// not the same as "a trading day": on the ~10 NSE holidays a year that fall on a weekday, the four gated
// lines would still speak of an open session. Closing it needs a trading calendar the frontend does not
// have (there is no holiday list anywhere in the codebase, and no market-status endpoint). It is one
// greeting on ten days a year, so it is flagged, not faked.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

/** Starting prompts a blank conversation can answer WELL — conceptual questions grounded in Vytal's
 *  context layer (the health model, the four pillars, the bands, verdicts). Nothing here needs a specific
 *  stock's data, because a blank conversation has no fact block and no tools yet. */
export const SUGGESTIONS = [
  "How does Vytal read a company's health?",
  "What do the four pillars measure?",
  "What does the Pristine band mean?",
  "What does a field verdict tell me?",
] as const;

/** The one line of framing under the greeting — what this conversation is actually good for. */
export const WELCOME_FRAMING =
  "Ask me how Vytal reads companies — the health model, the four pillars, what a verdict means.";

/** The honest limitation, stated up front: a blank conversation has no stock's numbers in it. */
export const WELCOME_NOTE =
  "For a specific stock with its live numbers, open it and tap “Discuss this read” — that brings the data into the conversation.";

/** The same limitation for the rail, where the note sits inches from the cards it is talking about. */
export const WELCOME_NOTE_SHORT =
  "Open a card and tap “Discuss this read” to bring its numbers into the conversation.";

// ── the clock ───────────────────────────────────────────────────────────────────────────────────────

/** Minutes since midnight IST + whether it is a weekday. Read from the ABSOLUTE instant, so it is the
 *  same answer in any browser timezone. */
interface IstClock {
  minutes: number;
  weekday: boolean;
}

const MARKET_OPEN = 9 * 60 + 15; // 09:15 IST — continuous trading begins
const MARKET_CLOSE = 15 * 60 + 30; // 15:30 IST — continuous trading ends

function istClock(now: Date): IstClock {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const day = get("weekday");
  return {
    minutes: (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
    weekday: day !== "Sat" && day !== "Sun",
  };
}

/** The seven bands of the reader's day, in IST. */
type Band = "smallHours" | "earlyMorning" | "morning" | "midday" | "afternoon" | "evening" | "lateNight";

function bandOf(minutes: number): Band {
  if (minutes < 5 * 60) return "smallHours"; //    00:00 – 04:59
  if (minutes < 8 * 60) return "earlyMorning"; //  05:00 – 07:59
  if (minutes < 12 * 60) return "morning"; //      08:00 – 11:59
  if (minutes < 15 * 60) return "midday"; //       12:00 – 14:59
  if (minutes < 18 * 60) return "afternoon"; //    15:00 – 17:59
  if (minutes < 22 * 60) return "evening"; //      18:00 – 21:59
  return "lateNight"; //                           22:00 – 23:59
}

// ── the fifteen ─────────────────────────────────────────────────────────────────────────────────────

interface Greeting {
  band: Band;
  /** `{name}` is substituted with the reader's first name. */
  withName: string;
  /** The same greeting for a reader with no display name — written, not derived. */
  plain: string;
  /** Extra condition beyond the band. Absent ⇒ always eligible. Present ⇒ a market claim, so it must be
   *  true of the clock AND the calendar before it is said (see §MARKET-AWARE LINES). */
  when?: (c: IstClock) => boolean;
}

export const GREETINGS: readonly Greeting[] = [
  // ── the small hours · 00:00 – 04:59 ──
  { band: "smallHours", withName: "Still up, {name}?", plain: "Still up?" },
  { band: "smallHours", withName: "The quiet hours, {name}", plain: "The quiet hours" },

  // ── early morning · 05:00 – 07:59 ──
  { band: "earlyMorning", withName: "Early start, {name}", plain: "An early start" },
  { band: "earlyMorning", withName: "Ahead of the world, {name}", plain: "Ahead of the world" },

  // ── morning · 08:00 – 11:59 (straddles the open, so both market lines live here) ──
  { band: "morning", withName: "Good morning, {name}", plain: "Good morning" },
  {
    band: "morning",
    withName: "Ahead of the open, {name}",
    plain: "Ahead of the open",
    when: (c) => c.weekday && c.minutes < MARKET_OPEN,
  },
  {
    band: "morning",
    withName: "The session's underway, {name}",
    plain: "The session's underway",
    when: (c) => c.weekday && c.minutes >= MARKET_OPEN,
  },

  // ── midday · 12:00 – 14:59 (entirely inside the session on a trading day) ──
  { band: "midday", withName: "Middle of the day, {name}", plain: "Middle of the day" },
  { band: "midday", withName: "Deep in the session, {name}", plain: "Deep in the session", when: (c) => c.weekday },

  // ── afternoon · 15:00 – 17:59 (the close falls inside it) ──
  { band: "afternoon", withName: "Good afternoon, {name}", plain: "Good afternoon" },
  {
    band: "afternoon",
    withName: "After the close, {name}",
    plain: "After the close",
    when: (c) => c.weekday && c.minutes >= MARKET_CLOSE,
  },

  // ── evening · 18:00 – 21:59 ──
  { band: "evening", withName: "Wrapping up the day, {name}", plain: "Wrapping up the day" },
  { band: "evening", withName: "Good evening, {name}", plain: "Good evening" },

  // ── late night · 22:00 – 23:59 ──
  { band: "lateNight", withName: "Winding down, {name}", plain: "Winding down" },
  { band: "lateNight", withName: "Late one, {name}", plain: "A late one" },
];

/** Pick a greeting for `now`. Exported for testing — the band and the eligible pool are pure functions of
 *  the instant; only the choice within the pool is random. */
export function pickGreeting(firstName: string, now: Date = new Date()): string {
  const clock = istClock(now);
  const band = bandOf(clock.minutes);
  const pool = GREETINGS.filter((g) => g.band === band && (!g.when || g.when(clock)));
  // Every band has at least one unconditional line, so `pool` is never empty; the guard is for the day
  // someone adds a band and forgets one.
  const chosen = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : GREETINGS[0];
  return firstName ? chosen.withName.replace("{name}", firstName) : chosen.plain;
}

// ── the hooks the surfaces use ──────────────────────────────────────────────────────────────────────

/** First name from the Supabase session metadata (display_name / full_name / name); "" if none set. */
export function useReaderFirstName(): string {
  const { user } = useAuth();
  const m = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const raw = [m.display_name, m.full_name, m.name].find((v) => typeof v === "string" && v.trim().length > 0);
  const name = typeof raw === "string" ? raw.trim() : "";
  return name ? name.split(/\s+/)[0] : "";
}

/**
 * The greeting to show, or null until it is known.
 *
 * ★ RESOLVED AFTER MOUNT, DELIBERATELY. Two things here belong to the browser and not to the server: the
 * random pick, and the reader (whose name arrives with the client-side auth session). Choosing during
 * render would make the server and the client disagree on the very first paint — a hydration mismatch on
 * the largest line of the screen. Null means "not yet"; the caller reserves the line so nothing jumps,
 * and the welcome block's own fade-in covers the single frame before it lands.
 */
export function useGreeting(): string | null {
  const firstName = useReaderFirstName();
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    setGreeting(pickGreeting(firstName));
  }, [firstName]);
  return greeting;
}
