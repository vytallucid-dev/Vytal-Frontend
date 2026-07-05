"use client";

/**
 * AuroraBackdrop — a calm, warm editorial aurora the glass card floats over.
 * ---------------------------------------------------------------------------
 * Replaces the earlier deep-space / nebula scene. Same JOB (give the glass real,
 * varied colour to refract — glass only reads as glass over colour) but a very
 * different MOOD: not a cold, twinkling star-void that reads as eerie, but a
 * slow WARM AURORA over a graphite dawn. Soft light blooms and two gently
 * swaying aurora curtains drift in the brand hues (blue → violet → gold → teal),
 * lifted by a whisper of editorial grid so it still reads as a serious
 * instrument, not a screensaver.
 *
 * The three moves that kill the "creepy" feel:
 *   • warm, OPEN base (a dawn glow up top) instead of a dark center-tunnel vignette
 *   • NO sharp twinkle — light motes are static or breathe very slowly
 *   • warmer palette weighting (gold + teal carry, blue/violet anchor)
 *
 * GPU-light: pure CSS gradients + transforms, no canvas. SSR-safe: the motes are
 * a FIXED table (no RNG / no Date / no Math.random), so server and client render
 * identically — no hydration mismatch. Honors reduced-motion: drift settles to
 * near-still, the composition stays.
 */

import * as React from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";

/* a slow, mirrored drift — the base motion for every living layer */
const drift = (dur: number, delay = 0): Transition => ({
  duration: dur,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
  delay,
});

/* Fixed light motes (percentages). No RNG → identical on server + client.
   Biased high (aurora sparks sit up in the sky); a few breathe, none twinkle. */
interface Mote {
  x: number;
  y: number;
  r: number;
  o: number;
  breathe?: boolean;
}
const MOTES: Mote[] = [
  { x: 12, y: 14, r: 1.1, o: 0.55, breathe: true },
  { x: 22, y: 26, r: 0.8, o: 0.4 },
  { x: 31, y: 9, r: 0.7, o: 0.35 },
  { x: 44, y: 20, r: 1.0, o: 0.5 },
  { x: 55, y: 12, r: 0.7, o: 0.3, breathe: true },
  { x: 63, y: 27, r: 0.9, o: 0.45 },
  { x: 71, y: 16, r: 0.8, o: 0.4 },
  { x: 82, y: 11, r: 1.1, o: 0.55, breathe: true },
  { x: 88, y: 30, r: 0.7, o: 0.32 },
  { x: 17, y: 40, r: 0.7, o: 0.3 },
  { x: 37, y: 46, r: 0.8, o: 0.34 },
  { x: 68, y: 42, r: 0.7, o: 0.3, breathe: true },
  { x: 92, y: 52, r: 0.8, o: 0.3 },
  { x: 8, y: 58, r: 0.9, o: 0.36 },
  { x: 49, y: 64, r: 0.7, o: 0.26 },
  { x: 78, y: 70, r: 0.8, o: 0.28 },
];

/** A soft, slow-drifting light bloom — the colour the glass refracts. */
function Bloom({
  className,
  hue,
  strength,
  reduce,
  animate,
  transition,
}: {
  className: string;
  hue: string;
  strength: number;
  reduce: boolean | null;
  animate?: Record<string, number[]>;
  transition?: Transition;
}) {
  return (
    <motion.div
      aria-hidden
      className={className}
      style={{
        background: `radial-gradient(circle at 50% 50%, color-mix(in oklab, ${hue} ${strength}%, transparent), transparent 70%)`,
      }}
      animate={reduce ? undefined : animate}
      transition={transition}
    />
  );
}

/** A tall, blurred aurora curtain that gently sways — the signature "aurora". */
function Curtain({
  className,
  hue,
  reduce,
  sway,
  dur,
  delay = 0,
}: {
  className: string;
  hue: string;
  reduce: boolean | null;
  sway: number;
  dur: number;
  delay?: number;
}) {
  return (
    <motion.div
      aria-hidden
      className={className}
      style={{
        background: `linear-gradient(to bottom, color-mix(in oklab, ${hue} 34%, transparent), color-mix(in oklab, ${hue} 12%, transparent) 45%, transparent 82%)`,
        mixBlendMode: "screen",
      }}
      animate={reduce ? undefined : { x: [0, sway, 0], skewX: [-4, 4, -4] }}
      transition={drift(dur, delay)}
    />
  );
}

export function AuroraBackdrop() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* warm graphite base — brightest up top (a dawn), gently darker below.
          OPEN, not a center-tunnel: nothing here reads as "closing in". */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(135% 115% at 50% -12%, #14151d 0%, #0f1017 40%, #0b0b11 74%, #08080c 100%)",
        }}
      />

      {/* dawn — a soft warm sunrise behind the glass, high and centered */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 42% at 50% -2%, color-mix(in oklab, var(--p-mkt) 13%, transparent), transparent 72%)",
        }}
      />

      {/* aurora curtains — the signature move; tall, soft, slowly swaying */}
      <Curtain
        className="absolute -top-[16%] left-[6%] h-[92vh] w-[34vw] blur-[90px]"
        hue="var(--c-pristine)"
        reduce={reduce}
        sway={40}
        dur={26}
      />
      <Curtain
        className="absolute -top-[20%] right-[10%] h-[96vh] w-[30vw] blur-[100px]"
        hue="var(--p-mom)"
        reduce={reduce}
        sway={-36}
        dur={32}
        delay={2}
      />

      {/* light blooms — colour pools for the glass to pick up (warm-weighted) */}
      <Bloom
        className="absolute -left-[12%] top-[2%] h-[68vh] w-[68vh] blur-[80px]"
        hue="var(--p-found)"
        strength={24}
        reduce={reduce}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, 70, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={drift(46)}
      />
      <Bloom
        className="absolute -right-[10%] top-[10%] h-[60vh] w-[60vh] blur-[90px]"
        hue="var(--p-mom)"
        strength={22}
        reduce={reduce}
        animate={{ x: [0, -50, 24, 0], y: [0, 50, -16, 0], scale: [1, 0.94, 1.1, 1] }}
        transition={drift(52)}
      />
      <Bloom
        className="absolute bottom-[-14%] right-[14%] h-[64vh] w-[64vh] blur-[90px]"
        hue="var(--p-mkt)"
        strength={20}
        reduce={reduce}
        animate={{ x: [0, -44, 28, 0], y: [0, -34, 18, 0], scale: [1, 1.12, 0.97, 1] }}
        transition={drift(58)}
      />
      <Bloom
        className="absolute -bottom-[16%] left-[10%] h-[58vh] w-[58vh] blur-[90px]"
        hue="var(--p-own)"
        strength={18}
        reduce={reduce}
        animate={{ x: [0, 46, -26, 0], y: [0, -28, 22, 0], scale: [1, 1.06, 0.95, 1] }}
        transition={drift(64)}
      />

      {/* whisper of editorial grid — quiet structure (the "serious instrument"),
          masked so it only reads faintly toward center */}
      <div className="absolute inset-0 bg-grid opacity-[0.04] [mask-image:radial-gradient(ellipse_72%_60%_at_50%_42%,black,transparent_84%)]" />

      {/* light motes — sparse, calm, static-or-slow (never a sharp twinkle) */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {MOTES.map((m, i) =>
          m.breathe && !reduce ? (
            <motion.circle
              key={i}
              cx={m.x}
              cy={m.y}
              r={m.r * 0.11}
              fill="#e6ecf8"
              initial={{ opacity: m.o }}
              animate={{ opacity: [m.o, m.o * 0.55, m.o] }}
              transition={{ duration: 5.5 + (i % 4) * 1.3, repeat: Infinity, ease: "easeInOut", delay: (i % 5) * 0.6 }}
            />
          ) : (
            <circle key={i} cx={m.x} cy={m.y} r={m.r * 0.11} fill="#e6ecf8" opacity={m.o} />
          ),
        )}
      </svg>

      {/* slow warm sheen — one diagonal light pass tying the palette together */}
      {!reduce && (
        <motion.div
          className="absolute inset-0 opacity-[0.22] mix-blend-screen"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 36%, color-mix(in oklab, var(--p-mkt) 9%, transparent) 50%, transparent 64%)",
            backgroundSize: "220% 220%",
            backgroundRepeat: "no-repeat",
          }}
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 34, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      )}

      {/* vignette — deliberately RESTRAINED so the scene feels open, not a tunnel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_92%_92%_at_50%_44%,transparent_64%,rgba(0,0,0,0.30)_100%)]" />
    </div>
  );
}
