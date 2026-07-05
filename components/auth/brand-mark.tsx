"use client";

/**
 * BrandMark — the Vytal wordmark shown above every auth card.
 * Mirrors the platform mark (spark chip + display wordmark) so the auth surface
 * reads as the same product, and bridges into onboarding's "Welcome to Vytal".
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Icons } from "@/lib/icons";

export function BrandMark() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-center"
    >
      <Link
        href="/"
        aria-label="Vytal — home"
        className="group inline-flex items-center gap-2.5 rounded-xl px-1 py-1"
      >
        <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 ring-1 ring-primary/30 transition-transform group-hover:scale-105 sm:size-9">
          <Icons.spark weight="fill" className="size-4 text-primary sm:size-[1.15rem]" />
        </span>
        <span className="font-display text-[1.2rem] font-bold leading-none tracking-tight text-ink sm:text-[1.4rem]">
          Vytal
        </span>
      </Link>
    </motion.div>
  );
}
