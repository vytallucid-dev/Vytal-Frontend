"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ASK VYTAL ABOUT YOUR BOOK — the dashboard's way into a real conversation.
//
// It is an INPUT AND A LAUNCHER, not a chat. Nothing is sent from here and no session is created here:
// the reader's text is staged and /chat opens a blank conversation with it (pending-message.ts §THE RULE
// THIS FILE EXISTS TO KEEP). Every consequence of sending — the session, the model-written title, the
// reveal, the guardrail, the daily cap, retry on failure — is the chat page's, unchanged, because this
// surface never touches any of it.
//
// ═══ §THE SUGGESTIONS ARE THE FEATURE ═══════════════════════════════════════════════════════════════
// A suggestion Vytal puts in the reader's mouth and then cannot answer is worse than an empty dropdown:
// it advertises a capability, spends the reader's daily quota, and returns a decline. So every line here
// is picked against TWO gates, and a line that fails either one is not written.
//
//  ① ANSWERABLE — a tool in the registry returns the facts it asks for. Each is annotated with that tool
//    below. What is deliberately ABSENT is as considered as what is present: nothing about valuation
//    ("is my book expensive"), nothing forward-looking, nothing about what to buy or sell, and no growth
//    screen — getUniverseScan's own description ends by saying it has no price, market-cap or valuation
//    screen, so those questions reach the model with no way to answer them.
//
//  ② NON-ADVISORY — Vytal explains; it does not counsel. "Should I trim anything?" is advice-seeking,
//    and the output guardrail (ai/guardrail.ts, `addressed-should`) blocks the model from answering it in
//    kind — so the reader would spend a message to be told no. Every line below asks what something IS
//    or what Vytal SAYS, never what the reader ought to DO.
//
// ═══ §THE EMPTY BOOK ════════════════════════════════════════════════════════════════════════════════
// "What's my portfolio health?" asked of a book with no holdings is a question with no answer, and
// offering it is the same broken promise in a different costume. A reader with nothing yet gets the
// CONCEPTUAL set instead — and gets it by importing the chat's own blank-conversation suggestions rather
// than by writing four more, so the two surfaces stay in step for free.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/chat/use-progressive-reveal";
import { SUGGESTIONS as CONCEPT_SUGGESTIONS } from "@/components/chat/welcome";
import { CHAT_NEW_HREF, stageChatMessage } from "@/components/chat/pending-message";
// The composer's own lock, read from the SAME shared query key the chat page and the sidekick panel
// read — one request answers all three, and none of them can disagree about whether the reader may send.
import { useChatQuota, useRefreshChatQuota } from "@/lib/api/hooks/use-chat-quota";
import { composerQuotaNote } from "@/components/chat/chat-message";

/** A suggestion, with the tool that answers it recorded beside it. The comment is not decoration: it is
 *  the check that was run before the line was added, kept next to the line so it can be re-run. */
interface Suggestion {
  text: string;
  /** The registry tool whose result answers this. */
  tool: string;
}

/** THE BOOK SET — offered only when the reader actually holds something. */
const PORTFOLIO_SUGGESTIONS: readonly Suggestion[] = [
  // getPortfolioFacts returns the health read, the construction read, coverage, holdings + weights and
  // any portfolio findings. This is the question that tool exists for.
  { text: "How does Vytal read my portfolio's health right now?", tool: "getPortfolioFacts" },
  // slice=finding, finding="red flags", scope=portfolio — the scan's documented way to answer
  // "which of the ones I own are firing". Asks WHICH, not what to do about them.
  { text: "Which of my holdings are firing red flags?", tool: "getUniverseScan scope=portfolio" },
  // slice=band, scope=portfolio — the band distribution over the reader's own names.
  { text: "How is my book spread across the health bands?", tool: "getUniverseScan scope=portfolio" },
  // The scan run twice — the reader's book against the universe it is drawn from. Both scopes are the
  // same tool, so this is one comparison the model can actually ground.
  { text: "How does my book compare with the universe Vytal scores?", tool: "getUniverseScan" },
  // getFindingsForSymbols is the per-company other half of the scan: what Vytal SAYS about names you
  // can already list, which is exactly what the holdings are.
  { text: "What does Vytal say about the companies I hold?", tool: "getFindingsForSymbols" },
  // The construction read (concentration, entity/sector spread) is part of the same fact block, and
  // "what does that mean" keeps it explanatory rather than a request for a verdict on the reader.
  { text: "How concentrated is my book, and what does that mean?", tool: "getPortfolioFacts" },
];

/** THE EMPTY-BOOK SET — the chat's own blank-conversation chips, which need no holdings and no fact
 *  block. Imported, never re-typed (see §THE EMPTY BOOK). */
const EMPTY_BOOK_SUGGESTIONS: readonly Suggestion[] = CONCEPT_SUGGESTIONS.map((text) => ({
  text,
  tool: "context layer (no tool call needed)",
}));

// ── §THE PLACEHOLDER ────────────────────────────────────────────────────────────────────────────────
// ONE STANDING SENTENCE, ONE MOVING TAIL. The prompt always reads "Ask Vytal about …" — that half is
// STATIC and never types, erases or retypes. Only the tail after it animates, so the reader's eye has a
// fixed sentence to rest on and the motion is confined to the thing that is actually changing.
const PLACEHOLDER_PREFIX = "Ask Vytal about ";

// ⚠ TWO TAIL SETS, BECAUSE A PLACEHOLDER CANNOT WRAP — IT CLIPS. Measured at 320px the field is only
//   ~152px wide (288px card − 40px padding − the icon, the gaps and the 32px send button), and the
//   prefix alone eats most of it at the field's 14px type. So the tails shorten on a narrow field AND
//   the placeholder steps down a couple of points there (§THE NARROW STEP-DOWN on the input) — together
//   that keeps the WHOLE sentence, prefix included, inside the box on a 320px phone.
//   The set is chosen from the FIELD'S OWN measured width, not a viewport breakpoint: the same input is
//   narrow on a phone and wide in the hero's left column, and only the element knows which it is.
const TAILS_WIDE = [
  "your portfolio",
  "your holdings' health",
  "your watchlist",
  "what's firing red flags",
] as const;

/** The narrow tails — each MEASURED to fit the 320px field with the prefix and the caret in front of it.
 *  The prefix alone spends ~94px of the ~167px available there, so the budget is ~11 characters and
 *  "your holdings' health" simply is not on offer at that width. Kept a few px inside the box rather
 *  than flush against it, so a font that loads a hair wider than Inter still cannot clip the sentence. */
const TAILS_NARROW = ["your book", "your stocks", "red flags", "your bands"] as const;

/** Below this field width the narrow tails + the smaller placeholder type are used. */
const NARROW_FIELD_PX = 260;

const TYPE_MS = 45; // per character
const HOLD_MS = 1900; // full phrase, before it clears
const CLEAR_MS = 22; // per character, deleting — faster than typing, as real typing is
const NEXT_MS = 320; // beat between phrases

/**
 * The animated placeholder. The prefix is CONSTANT; only `tail` is typed and cleared.
 *
 * ★ PAUSED WHENEVER IT WOULD BE NOISE — while the field is focused (the reader is reading suggestions,
 *   not an animation), while it holds text (there is no placeholder to animate), and under
 *   prefers-reduced-motion, where it settles on the first, complete tail and never moves again.
 */
function useTypedPlaceholder(active: boolean, narrow: boolean): { text: string; caret: boolean } {
  const reduced = useReducedMotion();
  const set = narrow ? TAILS_NARROW : TAILS_WIDE;
  const [phrase, setPhrase] = useState(0);
  const [len, setLen] = useState(0);
  const [erasing, setErasing] = useState(false);

  // The field crossed the threshold (a rotation, a desktop resize, the measurement landing after the
  // first paint) → start the new set cleanly rather than mid-word in the old one's length.
  useEffect(() => {
    setPhrase(0);
    setLen(0);
    setErasing(false);
  }, [narrow]);

  useEffect(() => {
    // ⚠ REDUCED MOTION IS NOT "the same animation, faster" — it is no animation. The full first tail,
    //   statically, which is also the honest fallback if timers are throttled in a background tab.
    if (reduced || !active) return;
    const full = set[phrase];
    let t: number;
    if (!erasing && len < full.length) t = window.setTimeout(() => setLen((n) => n + 1), TYPE_MS);
    else if (!erasing) t = window.setTimeout(() => setErasing(true), HOLD_MS);
    else if (len > 0) t = window.setTimeout(() => setLen((n) => n - 1), CLEAR_MS);
    else
      t = window.setTimeout(() => {
        setErasing(false);
        setPhrase((p) => (p + 1) % set.length);
      }, NEXT_MS);
    return () => window.clearTimeout(t);
  }, [reduced, active, phrase, len, erasing, set]);

  // ★ THE PREFIX IS ALWAYS WHOLE — it is prepended here on every path, so no state of this hook can ever
  //   render a half-typed "Ask Vytal ab".
  if (reduced) return { text: PLACEHOLDER_PREFIX + set[0], caret: false };
  // ⚠ NOT the frozen partial. When the animation stops (the reader focused the field) a half-typed
  //   "your holding" is just a typo sitting in the input — so it settles on a COMPLETE tail instead.
  if (!active) return { text: PLACEHOLDER_PREFIX + set[0], caret: false };
  const current = set[Math.min(phrase, set.length - 1)];
  return { text: PLACEHOLDER_PREFIX + current.slice(0, len), caret: true };
}

export function AskVytal({ hasHoldings }: { hasHoldings: boolean }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const listId = useId();

  const suggestions = useMemo(
    () => (hasHoldings ? PORTFOLIO_SUGGESTIONS : EMPTY_BOOK_SUGGESTIONS),
    [hasHoldings],
  );

  // ── §THE DAILY CAP ────────────────────────────────────────────────────────────────────────────────
  // The same lock the chat page's and the sidekick panel's composers wear, from the same shared query.
  //
  // ★ IT BELONGS HERE, NOT ONLY ON /chat. This input's whole job is to send the reader somewhere to ask
  //   a question. Letting a capped reader compose one, pick a suggestion, press send and THEN discover on
  //   the next screen that nothing can be sent is the worst arrangement of the same facts. So the lock is
  //   applied where the question starts: dead input, dead button, no dropdown, and the reason stated.
  //
  // ⚠ ABSENT ⇒ OPEN. `useChatQuota` is optimistic by design (QUOTA_UNKNOWN.canSend = true) — a composer
  //   is never locked on an absence of information, only on the server actually saying no.
  const quotaQ = useChatQuota();
  const refreshQuota = useRefreshChatQuota();
  const sendBlock = quotaQ.data && !quotaQ.data.canSend ? (quotaQ.data.unavailable ?? null) : null;
  const blocked = sendBlock != null;

  // Lift it the moment the cap resets, rather than leaving a dead input until something else refetches —
  // the same "re-check when the instant you were locked with passes" the chat core does.
  const resetAt = sendBlock?.resetAt ?? null;
  useEffect(() => {
    if (!resetAt) return;
    const ms = Date.parse(resetAt) - Date.now();
    if (!Number.isFinite(ms)) return;
    const t = window.setTimeout(refreshQuota, Math.max(0, ms) + 1000);
    return () => window.clearTimeout(t);
  }, [resetAt, refreshQuota]);

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  // The portal needs a document, which the server render does not have.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // −1 ⇒ nothing highlighted, so Enter belongs to the INPUT (it sends). ≥0 ⇒ Enter takes that
  // suggestion into the field. See §KEYBOARD.
  const [active, setActive] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── §ANCHORING — ESCAPE THE CARD, BUT STAY INSIDE THE SCROLLER ────────────────────────────────────
  // Two constraints that look opposed and are satisfied by one choice.
  //
  // ⚠ THE HERO CARD IS `overflow-hidden` (HeroShell, for its rounded corners), so a dropdown positioned
  //   INSIDE it is clipped at the card's bottom edge — measured: at 320px only the panel's top ~12px
  //   survived and every suggestion was invisible. Element boxes do NOT reveal this (getBoundingClientRect
  //   reports the layout box an ancestor is hiding), which is why it took a screenshot to find.
  //
  // ⚠ BUT THE PAGE DOES NOT SCROLL — <main> DOES (main-shell.tsx: `overflow-y-auto`). A panel portalled
  //   to <body> and positioned `fixed` therefore has to be re-positioned by JS on every scroll event,
  //   and a React state write per event lands a frame late: the panel visibly lags and judders behind
  //   the field it is supposed to be attached to. Worse, being `fixed` at body level it is outside every
  //   clip on the page, so scrolling down painted it straight over the Navbar.
  //
  // ★ SO IT PORTALS INTO THE SCROLLER ITSELF and is positioned `absolute` in that scroller's CONTENT
  //   coordinates. The panel is then a normal part of the scrolled content: the browser moves it with
  //   the field for free — no scroll listener, no per-frame state, nothing to lag — and <main>'s own
  //   overflow clips it at the top, so it cannot reach the Navbar. It is still outside the card, so the
  //   card's overflow-hidden no longer touches it.
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number; width: number; above: boolean } | null>(null);

  /** The nearest ancestor that actually scrolls, or null ⇒ the page itself (document.body). */
  const findScroller = useCallback((el: HTMLElement | null): HTMLElement | null => {
    for (let p = el?.parentElement ?? null; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowY;
      if (o === "auto" || o === "scroll") return p;
    }
    return null;
  }, []);

  const measure = useCallback(() => {
    const el = fieldRef.current;
    if (!el) return;
    const host = findScroller(el);
    setScroller(host);
    const r = el.getBoundingClientRect();
    const panelH = panelRef.current?.getBoundingClientRect().height ?? 320;
    // Flip above only when the space below genuinely cannot hold the panel (a short landscape phone).
    // Measured against the SCROLLER's visible box when there is one — that is the reader's real window.
    const viewBottom = host ? host.getBoundingClientRect().bottom : window.innerHeight;
    const viewTop = host ? host.getBoundingClientRect().top : 0;
    const below = viewBottom - r.bottom;
    const above = below < panelH + 16 && r.top - viewTop > below;

    if (host) {
      // CONTENT coordinates inside the scroller: viewport delta + how far it is already scrolled.
      const h = host.getBoundingClientRect();
      const left = r.left - h.left + host.scrollLeft;
      const top = above
        ? r.top - h.top + host.scrollTop - 8
        : r.bottom - h.top + host.scrollTop + 8;
      setAnchor({ left, top, width: r.width, above });
    } else {
      // No scrolling ancestor ⇒ the page scrolls; document coordinates behave the same way.
      const left = r.left + window.scrollX;
      const top = above ? r.top + window.scrollY - 8 : r.bottom + window.scrollY + 8;
      setAnchor({ left, top, width: r.width, above });
    }
  }, [findScroller]);

  // ★ NO SCROLL LISTENER, BY DESIGN — the panel is inside the scrolled content, so it already moves with
  //   it. Only things that change the field's position WITHIN that content need a re-measure.
  //
  // ⚠ THE PANEL IS OBSERVED TOO. The flip-above test needs the panel's real height, and on the first
  //   pass the panel does not exist yet (measure runs to decide where to put it). Observing it means the
  //   fallback height is used for exactly one frame and then corrected by the real one — otherwise a
  //   short list could flip above on a guess of 320px it never actually needed.
  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    if (fieldRef.current) ro.observe(fieldRef.current);
    if (panelRef.current) ro.observe(panelRef.current);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [open, measure, anchor?.above]);

  // ★ THE FIELD MEASURES ITSELF (see §THE PLACEHOLDER). Starts NARROW: the short set can never overflow,
  //   so the one frame before the observer reports is safe by construction — the reverse default would
  //   flash a clipped phrase on every phone.
  const [narrow, setNarrow] = useState(true);
  useEffect(() => {
    const el = inputRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < NARROW_FIELD_PX));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animate only while the field is idle and empty — the moment it has text or focus there is nothing
  // to advertise, and a moving placeholder under a reader's own words is just motion for its own sake.
  const placeholder = useTypedPlaceholder(!focused && value.length === 0, narrow);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  /** THE HANDOFF. Stage → navigate. Nothing is sent from this component; see the file header. */
  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || blocked) return; // §THE DAILY CAP — never stage a message that cannot be sent
      stageChatMessage(trimmed);
      close();
      router.push(CHAT_NEW_HREF);
    },
    [router, close, blocked],
  );

  /** A suggestion goes INTO THE FIELD. It does not send — the reader gets to edit it, and pressing send
   *  is their decision, not a side effect of browsing a list. */
  const choose = useCallback(
    (text: string) => {
      setValue(text);
      close();
      inputRef.current?.focus();
    },
    [close],
  );

  // Click / tap outside closes. Pointerdown rather than click so a tap that lands on another control
  // does not first have to fight this dropdown for the event.
  // ⚠ BOTH BOXES: the panel is portalled out of `rootRef`, so a click inside it is "outside" by DOM
  //   containment and would close the dropdown before the row could be chosen.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      close();
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  // ── §KEYBOARD ─────────────────────────────────────────────────────────────────────────────────────
  // ⚠ AND IT MUST NOT EAT ⌘K. The command palette listens on `window` (navbar.tsx) and fires from inside
  //   inputs by design — a ⌘/Ctrl chord can never be part of typing. So this handler returns immediately
  //   on any modified keystroke: it neither preventDefaults nor stops propagation for them, and ⌘K opens
  //   the palette from this field exactly as it does from every other input on the platform.
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return; // ⌘K / ⌘B and friends — not ours, do not touch
    if (e.nativeEvent.isComposing) return; // IME candidate confirmation is never a command
    if (blocked) return; // capped: the field is disabled anyway, but the keys mean nothing either

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (e.key === "Escape") {
      if (!open) return; // nothing of ours is open — leave Escape to whatever else wants it
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      // A highlighted suggestion is what Enter means right now; otherwise Enter is "send what I typed".
      if (open && active >= 0) choose(suggestions[active].text);
      else submit(value);
    }
  };

  const canSubmit = value.trim().length > 0 && !blocked;

  // A capped reader is shown a dead field, so the placeholder says why rather than inviting a question.
  const placeholderText = blocked
    ? "Daily limit reached"
    : placeholder.text + (placeholder.caret ? "▌" : "");

  return (
    <div ref={rootRef} className="relative mt-5">
      {/* THE FIELD. `min-w-0` on the input is what keeps a long typed question from widening the row and
          pushing the send button off a 320px screen — the flex child must be allowed to shrink. */}
      {/* The chrome tightens on a narrow field — every pixel taken back from padding and gaps is a pixel
          the "Ask Vytal about …" sentence gets to keep. The tap targets stay ≥28px, which is still a
          comfortable thumb target for a control that sits beside a full-width input. */}
      <div
        ref={fieldRef}
        className={cn(
          "flex h-12 items-center rounded-xl border bg-surface-2/60 transition-colors",
          narrow ? "gap-1.5 px-2.5" : "gap-2 px-3",
          focused ? "border-primary/40" : "border-line",
        )}
      >
        {/* ★ THE SAME MARK THE NAVBAR'S ASK-VYTAL BUTTON WEARS (navbar.tsx — `Icons.spark weight="fill"`
            in an `.ai-chip`), in the intelligent-layer's own colour. Two entry points to one assistant
            should not be badged as two different things; the dropdown rows below carry it too. */}
        <Icons.spark weight="fill" className="size-[1.05rem] shrink-0 text-ai-from" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={value}
          disabled={blocked}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => {
            setFocused(true);
            if (!blocked) setOpen(true); // §3a — focus opens the suggestions (never while capped)
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          // The placeholder is the ANIMATED string; the caret is appended as a character rather than
          // overlaid, so it cannot drift out of alignment and costs no second element to lay out.
          placeholder={placeholderText}
          aria-label="Ask Vytal about your book"
          // The combobox contract, so a screen reader is told there is a list, which item is active, and
          // that choosing one writes into this field.
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          // §THE NARROW STEP-DOWN — the TYPED text stays 14px everywhere; only the PLACEHOLDER steps
          // down on a narrow field, which is what lets the full "Ask Vytal about …" sentence stay inside
          // a 320px box instead of clipping mid-word. What the reader writes is never shrunk.
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink3/80",
            narrow && !blocked && "placeholder:text-[11px]",
            blocked && "cursor-not-allowed opacity-60",
          )}
        />
        <button
          type="button"
          onClick={() => submit(value)}
          disabled={!canSubmit}
          aria-label="Ask Vytal"
          title="Ask Vytal"
          className={cn(
            "grid shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40",
            narrow ? "size-7" : "size-8",
          )}
        >
          <Icons.send className="size-4" />
        </button>
      </div>

      {/* §THE DAILY CAP — the composer's own line, verbatim from `composerQuotaNote`, so a capped reader
          reads the SAME sentence here, in the sidekick rail and on /chat. `role="status"` because it
          appears without the reader having done anything. */}
      {sendBlock && (
        <p className="mt-1.5 flex items-start gap-1.5 px-1 text-[10.5px] leading-snug text-ink3" role="status">
          <Icons.info className="mt-px size-3 shrink-0" aria-hidden />
          <span>{composerQuotaNote(sendBlock)}</span>
        </p>
      )}

      {/* THE DROPDOWN — portalled to <body> (§ESCAPING THE CARD) and sized to the FIELD's measured rect,
          so it is exactly as wide as the input at every viewport and cannot overflow one: there is no
          width to get wrong at 320px. Each row wraps (`text-pretty`, no truncate) because a clipped
          suggestion is a suggestion the reader cannot evaluate, and the list scrolls (max-h) so six rows
          on a short landscape phone do not run off the bottom. */}
      {mounted &&
        createPortal(
          // Into the SCROLLER (§ANCHORING), falling back to <body> when nothing above us scrolls.
          <AnimatePresence>
            {open && anchor && (
              <motion.div
                ref={panelRef}
                // Matches the platform's existing framer-motion vocabulary (framer-motion 12.38.0, the
                // only animation package imported anywhere in this frontend — see welcome-hero's
                // HeroShell and chat-hub §THE RAIL for the same curve family).
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: anchor.above ? 6 : -6, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 1 } : { opacity: 0, y: anchor.above ? 6 : -6, scale: 0.985 }}
                transition={reduced ? { duration: 0 } : { duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  left: anchor.left,
                  width: anchor.width,
                  ...(anchor.above ? { top: anchor.top, translate: "0 -100%" } : { top: anchor.top }),
                }}
                // `absolute`, not `fixed` — it lives in the scrolled content (§ANCHORING). z-30 keeps it
                // over the cards it covers and under the Navbar's z-100, so even without the scroller's
                // clip it could not paint over the chrome.
                className="absolute z-30 overflow-hidden rounded-xl border border-line2 bg-surface-1 shadow-lg"
              >
            <p className="border-b border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-ink3">
              {hasHoldings ? "Ask about your book" : "Start with how Vytal reads companies"}
            </p>
            <ul id={listId} role="listbox" aria-label="Suggested questions" className="custom-scrollbar max-h-64 overflow-y-auto p-1">
              {suggestions.map((s, i) => (
                <li key={s.text}>
                  <button
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                    type="button"
                    // ⚠ onMouseDown, not onClick: the input's blur would otherwise fire first and a
                    //   close-on-blur would unmount this row before its click ever landed.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(s.text);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] leading-snug transition-colors",
                      active === i ? "bg-surface-2 text-ink" : "text-ink2 hover:bg-surface-2/60",
                    )}
                  >
                    <Icons.spark
                      weight="fill"
                      className="mt-0.5 size-3 shrink-0 text-ai-from"
                      aria-hidden
                    />
                    <span className="min-w-0 text-pretty">{s.text}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-3 py-2 text-[10px] leading-snug text-ink3">
              Picking one writes it into the box — press{" "}
              <Icons.send className="inline size-2.5 align-[-1px]" aria-hidden /> to start the
              conversation.
            </p>
              </motion.div>
            )}
          </AnimatePresence>,
          scroller ?? document.body,
        )}
    </div>
  );
}
