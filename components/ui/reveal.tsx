"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  as?: "div" | "section" | "li" | "span";
}

/** Consistent scroll-into-view reveal used across all app pages. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  once = true,
  as = "div",
}: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Stagger container — children should be <Reveal> or motion items. */
const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
/** No-stagger container for large / dynamic lists. Children animate in PARALLEL, so no
 *  item is queued behind a cumulative stagger delay. With staggerChildren a 200-item feed
 *  delays its tail by ~16s — those cards sit at opacity 0, and filtering one of them to
 *  the top (e.g. searching) leaves it stuck at 0. Parallel reveal eliminates that. */
const flatContainerVariants: Variants = {
  hidden: {},
  show: {},
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export function StaggerGroup({
  children,
  className,
  inView = true,
}: {
  children: ReactNode;
  className?: string;
  /** Scroll-trigger the staggered reveal (default). Set false for dynamic lists whose
   *  children are swapped/filtered after mount (filtered feeds, search results): the group
   *  reveals via `animate` and a NON-staggered container, so every child — including ones
   *  reordered to the top after a filter — reliably reaches "show" with no cumulative
   *  delay (which otherwise left deep-list cards stuck at opacity 0). */
  inView?: boolean;
}) {
  const trigger = inView
    ? ({
        variants: containerVariants,
        whileInView: "show",
        viewport: { once: true, margin: "-60px" },
      } as const)
    : ({ variants: flatContainerVariants, animate: "show" } as const);
  return (
    <motion.div className={className} initial="hidden" {...trigger}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={cn(className)} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
