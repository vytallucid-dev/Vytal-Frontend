"use client";

/**
 * PART 3 — HANDOFF. A long capability tour (config-driven, ~5 blocks, each a
 * mini reveal as it scrolls into view) followed by a deliberately heavier
 * disclaimer beat.
 *
 * Because the flow now scrolls WITHIN the modal, both the scroll-to-bottom gate
 * (IntersectionObserver) and the on-scroll reveals (whileInView) are re-rooted
 * to the modal's scroll container via `scrollRef`.
 *
 * HARD GATE (unchanged): "Enter Vytal" stays disabled until BOTH
 *   (a) the tour has been scrolled to the bottom, AND
 *   (b) the disclaimer checkbox is ticked.
 * Only then does clicking mock-write the receipt and route onward.
 */

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { GifSlot } from "../gif-slot";
import { STEP_PAD_X } from "../primitives";
import { handoffConfig, type TourBlock } from "../onboarding-config";

/**
 * EnterVytalButton — the one special, unmistakable button in the whole flow.
 * A full-width brand-gradient key with a rocket, a soft top-highlight, a live
 * sheen sweep and a warm glow: it reads as "begin", not "submit". Dims when the
 * gate isn't cleared.
 */
function EnterVytalButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.012 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className={cn(
        "group relative flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-lg text-[0.95rem] font-semibold tracking-tight text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
      )}
      style={{
        background: "linear-gradient(100deg, var(--c-pristine), var(--p-found) 46%, var(--p-mom))",
        boxShadow: disabled
          ? "none"
          : "0 14px 44px -12px var(--glow), inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.30)",
      }}
    >
      {/* live sheen sweep (enabled only) */}
      {!disabled && !reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/3"
          style={{
            background:
              "linear-gradient(100deg, transparent, rgba(255,255,255,0.38), transparent)",
          }}
          initial={{ x: "-160%" }}
          animate={{ x: "460%" }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.1, ease: "easeInOut" }}
        />
      )}
      {/* soft top highlight for the glassy key look */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"
      />
      <Icons.rocket
        weight="fill"
        className="relative size-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
      <span className="relative">{label}</span>
      <Icons.arrowRight
        weight="bold"
        className="relative size-4 transition-transform duration-200 group-hover:translate-x-1"
      />
    </motion.button>
  );
}

const accentToken: Record<TourBlock["accent"], string> = {
  pristine: "var(--c-pristine)",
  "p-found": "var(--p-found)",
  "p-mom": "var(--p-mom)",
  "p-mkt": "var(--p-mkt)",
  "p-own": "var(--p-own)",
};

function TourBlockRow({
  block,
  i,
  scrollRef,
}: {
  block: TourBlock;
  i: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const Icon = Icons[block.icon];
  const glow = accentToken[block.accent];
  const gifLeft = i % 2 === 1; // alternate for editorial rhythm (desktop only)

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35, root: scrollRef }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-1 items-center gap-5 lg:grid-cols-2 lg:gap-12"
    >
      {/* copy */}
      <div className={cn("order-2", gifLeft ? "lg:order-2" : "lg:order-1")}>
        <div className="mb-3 inline-flex items-center gap-2">
          <span
            className="grid size-9 place-items-center rounded-lg border"
            style={{
              color: glow,
              borderColor: `color-mix(in oklab, ${glow} 35%, transparent)`,
              background: `color-mix(in oklab, ${glow} 10%, transparent)`,
            }}
          >
            <Icon weight="duotone" className="size-[18px]" />
          </span>
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: glow }}
          >
            {block.eyebrow}
          </span>
        </div>
        <h3 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-[1.55rem] sm:leading-[1.12]">
          {block.title}
        </h3>
        <p className="mt-2.5 max-w-md text-sm leading-relaxed text-ink2 sm:text-[0.95rem]">
          {block.description}
        </p>
      </div>

      {/* gif — prominent co-lead */}
      <div className={cn("order-1", gifLeft ? "lg:order-1" : "lg:order-2")}>
        <GifSlot
          label={`${block.title} demo`}
          src={block.gif}
          aspect={block.aspect}
          accent={block.accent}
          icon={block.icon}
          className="glow-sm"
        />
      </div>
    </motion.div>
  );
}

export function HandoffStep({
  scrollRef,
  onBack,
  onComplete,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [reachedBottom, setReachedBottom] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Scroll-to-bottom detection — rooted to the MODAL scroll container (works on
  // touch too). Falls back to the viewport if the ref isn't attached yet.
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setReachedBottom(true);
      },
      { root: scrollRef.current ?? null, threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scrollRef]);

  const canEnter = reachedBottom && agreed;
  const { disclaimer } = handoffConfig;

  return (
    <div className={cn("w-full pb-14 pt-8 sm:pb-16", STEP_PAD_X)}>
      {/* header */}
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col items-center gap-3 text-center"
      >
        <span className="eyebrow">{handoffConfig.eyebrow}</span>
        <h1 className="font-display text-[1.55rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[1.95rem]">
          {handoffConfig.title}
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-ink2 sm:text-[0.95rem]">
          {handoffConfig.subtitle}
        </p>

        {/* scroll cue — fades once the bottom is reached */}
        <AnimatePresence>
          {!reachedBottom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 inline-flex items-center gap-1.5 text-xs text-ink3"
            >
              <motion.span
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icons.caretDown className="size-4" />
              </motion.span>
              Scroll to explore
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* the tour */}
      <div className="flex flex-col gap-12 sm:gap-16">
        {handoffConfig.tour.map((block, i) => (
          <TourBlockRow key={block.id} block={block} i={i} scrollRef={scrollRef} />
        ))}
      </div>

      {/* sentinel — once visible, the user has seen the whole tour */}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      {/* ── DISCLAIMER GATE — its own deliberate, heavier legal beat ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3, root: scrollRef }}
        transition={{ duration: 0.6 }}
        className="mt-12 sm:mt-16"
      >
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] shadow-[0_20px_60px_-24px_rgba(0,0,0,0.6)]">
          {/* accent top edge to set it apart from the tour */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ink3/50 to-transparent"
          />
          <div className="border-b border-white/10 bg-white/[0.03] px-6 py-4 sm:px-8">
            <div className="flex items-center gap-2">
              <Icons.shield weight="duotone" className="size-4 text-ink2" />
              <span className="eyebrow !text-ink3">{disclaimer.eyebrow}</span>
            </div>
            <h2 className="mt-2 font-display text-lg font-semibold text-ink sm:text-xl">
              {disclaimer.heading}
            </h2>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <p className="text-sm leading-relaxed text-ink2 sm:text-[0.95rem]">
              {disclaimer.body}
            </p>

            {/* checkbox */}
            <button
              type="button"
              role="checkbox"
              aria-checked={agreed}
              onClick={() => setAgreed((v) => !v)}
              className={cn(
                "mt-6 flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                agreed
                  ? "border-primary/50 bg-primary/[0.07]"
                  : "border-white/10 bg-white/[0.04] hover:border-white/20",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all",
                  agreed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-line3 text-transparent",
                )}
              >
                <Icons.check weight="bold" className="size-3.5" />
              </span>
              <span className="text-sm font-medium text-ink">{disclaimer.checkboxLabel}</span>
            </button>

            {/* actions — the special launch key on top, Back stacked beneath it */}
            <div className="mt-7 flex flex-col items-stretch gap-3">
              <EnterVytalButton
                label={disclaimer.button}
                disabled={!canEnter}
                onClick={onComplete}
              />
              {!canEnter && (
                <span className="flex items-center justify-center gap-1.5 text-center text-xs text-ink3">
                  <Icons.info weight="duotone" className="size-3.5 shrink-0" />
                  {!reachedBottom ? disclaimer.lockedHint : "Tick the box above to continue."}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={onBack}
                className="mx-auto gap-1.5 text-ink3 hover:text-ink2"
              >
                <Icons.arrowLeft className="size-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
