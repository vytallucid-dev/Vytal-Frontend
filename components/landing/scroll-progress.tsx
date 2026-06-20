"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * A site-wide scroll indicator: a gradient bar that fills along the top as the
 * user travels through the page, plus a subtle following glow. Spring-smoothed
 * so it feels alive rather than mechanical.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[var(--grad-from)] via-[var(--grad-via)] to-[var(--grad-to)] shadow-[0_0_12px_var(--glow)]"
    />
  );
}
