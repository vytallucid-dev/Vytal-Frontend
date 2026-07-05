"use client";

/**
 * LaunchSequence — the "Enter Vytal" moment.
 * ---------------------------------------------------------------------------
 * Fires once the disclaimer gate is cleared and the user commits. While the
 * glass modal folds away behind it (driven in onboarding-flow), this plays a
 * short, premium launch: an aurora bloom rushes out from center, light streaks
 * burst outward (the "journey begins" beat), concentric rings expand, and the
 * Vytal mark greets the user by name — then the whole scene washes into the app
 * background so the hand-off to the dashboard is seamless, never a hard cut.
 *
 * Calm, not creepy: warm brand hues, one confident beat, then gone. Honors
 * reduced-motion (skips the kinetic layers, keeps the greeting, exits faster).
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icons } from "@/lib/icons";

const STREAKS = Array.from({ length: 12 }, (_, i) => i);
const RINGS = [0, 0.16, 0.32];

export function LaunchSequence({
  name,
  onDone,
}: {
  name: string;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const totalMs = reduce ? 950 : 1750;

  React.useEffect(() => {
    const t = window.setTimeout(onDone, totalMs);
    return () => window.clearTimeout(t);
  }, [onDone, totalMs]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
    >
      {/* gentle darken so the bloom + mark read against the folding modal */}
      <div className="absolute inset-0 bg-black/35" />

      {/* aurora bloom — a warm brand-hued light rushing out from center */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            translateX: "-50%",
            translateY: "-50%",
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--c-pristine) 48%, transparent) 0%, color-mix(in oklab, var(--p-mom) 30%, transparent) 34%, color-mix(in oklab, var(--p-mkt) 16%, transparent) 52%, transparent 64%)",
          }}
          initial={{ width: 40, height: 40, opacity: 0.95 }}
          animate={{ width: "230vmax", height: "230vmax", opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {/* concentric launch rings */}
      {!reduce &&
        RINGS.map((delay, i) => (
          <motion.span
            key={`r${i}`}
            aria-hidden
            className="absolute left-1/2 top-1/2 rounded-full border border-primary/45"
            style={{ translateX: "-50%", translateY: "-50%" }}
            initial={{ width: 70, height: 70, opacity: 0.7 }}
            animate={{ width: 560, height: 560, opacity: 0 }}
            transition={{ duration: 1.35, delay, ease: "easeOut" }}
          />
        ))}

      {/* light streaks bursting outward — the "into the journey" motion */}
      {!reduce &&
        STREAKS.map((i) => (
          <motion.span
            key={`s${i}`}
            aria-hidden
            className="absolute left-1/2 top-1/2 h-px w-28 origin-left"
            style={{
              rotate: `${(i / STREAKS.length) * 360}deg`,
              background:
                "linear-gradient(90deg, transparent, color-mix(in oklab, var(--c-pristine) 75%, transparent))",
            }}
            initial={{ scaleX: 0, x: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1, 0], x: [0, 160], opacity: [0, 0.85, 0] }}
            transition={{ duration: 1.1, delay: 0.12 + (i % 4) * 0.05, ease: "easeOut" }}
          />
        ))}

      {/* center — the Vytal mark greeting the user by name */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-4 px-6 text-center"
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="grid size-16 place-items-center rounded-xl border border-primary/40 bg-primary/12 text-primary"
          style={{ boxShadow: "0 0 46px -6px var(--glow)" }}
          animate={reduce ? undefined : { scale: [1, 1.09, 1] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icons.health weight="duotone" className="size-8" />
        </motion.span>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            <span className="text-gradient">
              Welcome aboard{name ? `, ${name}` : ""}.
            </span>
          </h2>
          <p className="flex items-center justify-center gap-2 text-sm text-ink2">
            <Icons.spark weight="fill" className="size-3.5 animate-pulse text-primary" />
            Entering Vytal…
          </p>
        </div>
      </motion.div>

      {/* final wash into the app background — seamless hand-off to the dashboard */}
      <motion.div
        className="absolute inset-0 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: totalMs / 1000, times: [0, 0.74, 1], ease: "easeIn" }}
      />
    </motion.div>
  );
}
