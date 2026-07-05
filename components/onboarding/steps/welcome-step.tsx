"use client";

/**
 * PART 0 — WELCOME. The entry moment. No inputs, nothing saved. Cinematic
 * within the modal: a brand mark, a word-by-word headline reveal, a prominent
 * hero montage gif placeholder co-leading with the copy, and a single confident
 * CTA. All copy + gif tiles come from config.
 */

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { GifSlot } from "../gif-slot";
import { welcomeConfig } from "../onboarding-config";

const wordReveal: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, delay: 0.25 + i * 0.14, ease: [0.22, 1, 0.36, 1] },
  }),
};

const tileAccents = ["pristine", "p-mom", "p-found"] as const;

export function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
      {/* LEFT — copy */}
      <div className="text-center lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary"
        >
          <span className="flex size-1.5 animate-pulse rounded-full bg-primary" />
          {welcomeConfig.eyebrow}
        </motion.div>

        <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-[3.5rem]">
          {welcomeConfig.headline.map((word, i) => (
            <motion.span
              key={word}
              custom={i}
              variants={wordReveal}
              initial="hidden"
              animate="show"
              className={
                i === welcomeConfig.headlineAccentIndex
                  ? "text-gradient inline-block"
                  : "inline-block text-ink"
              }
            >
              {word}
              {i < welcomeConfig.headline.length - 1 ? " " : ""}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink2 sm:text-lg lg:mx-0"
        >
          {welcomeConfig.subhead}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
        >
          <Button
            size="lg"
            onClick={onStart}
            className="group h-12 min-w-[12rem] gap-2 text-[0.95rem]"
          >
            {welcomeConfig.cta}
            <Icons.arrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <span className="text-xs text-ink3">{welcomeConfig.footnote}</span>
        </motion.div>
      </div>

      {/* RIGHT — hero montage: prominent lead gif + two supporting tiles */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto w-full max-w-md"
      >
        <div className="animate-float">
          <GifSlot
            label={welcomeConfig.gifs[0].label}
            src={welcomeConfig.gifs[0].gif}
            aspect="16/10"
            accent={tileAccents[0]}
            icon="health"
            className="glow-primary"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {welcomeConfig.gifs.slice(1).map((g, i) => (
            <GifSlot
              key={g.id}
              label={g.label}
              src={g.gif}
              aspect="4/3"
              accent={tileAccents[i + 1]}
              icon={i === 0 ? "chartLine" : "compare"}
              compact
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
