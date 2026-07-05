"use client";

/**
 * ProgressRail — branch-aware progress indicator.
 * ---------------------------------------------------------------------------
 * Visible across Steps 1, 2, (2.5) and Handoff. The adaptive Follow-up node is
 * optional: it's inserted (with a smooth layout animation) only when it's
 * genuinely on the path, so the branch never leaves the rail looking broken —
 * no phantom step, no jump. Milestones come from the machine, labels from config.
 *
 * `large` bumps the scale for the sticky in-card header treatment.
 */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Milestone } from "./onboarding-machine";

export function ProgressRail({
  milestones,
  large = false,
}: {
  milestones: Milestone[];
  large?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-center gap-2">
      <AnimatePresence initial={false} mode="popLayout">
        {milestones.map((m, i) => (
          <motion.div
            key={m.key}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-w-0 items-center gap-2.5"
          >
            {/* node */}
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "relative grid shrink-0 place-items-center rounded-full border font-semibold transition-colors",
                  large ? "size-8 text-[13px]" : "size-6 text-[11px]",
                  m.status === "completed" &&
                    "border-primary/50 bg-primary/15 text-primary",
                  m.status === "current" &&
                    "border-primary bg-primary text-primary-foreground",
                  m.status === "upcoming" &&
                    "border-line2 bg-white/[0.04] text-ink3",
                )}
              >
                {/* active step — a soft expanding ring pulse */}
                {m.status === "current" && (
                  <span
                    aria-hidden
                    className="animate-pulse-ring pointer-events-none absolute inset-0 rounded-full"
                  />
                )}
                {m.status === "completed" ? (
                  <Icons.check weight="bold" className={large ? "size-4" : "size-3"} />
                ) : (
                  <span className="num relative">{i + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  "hidden truncate font-medium sm:block",
                  large ? "text-sm" : "text-xs",
                  m.status === "upcoming" ? "text-ink3" : "text-ink2",
                  m.status === "current" && "text-ink",
                )}
              >
                {m.label}
              </span>
            </div>

            {/* connector (not after the last node) — fixed width so the whole
                stepper stays a centered group, not stretched to the edges */}
            {i < milestones.length - 1 && (
              <span className="h-px w-9 shrink-0 overflow-hidden rounded-full bg-line2 sm:w-16">
                <motion.span
                  layout
                  className="block h-full rounded-full bg-primary/60"
                  initial={false}
                  animate={{ width: m.status === "completed" ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
