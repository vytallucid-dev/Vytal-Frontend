"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

/**
 * The app-shell scroll container + a slim gradient progress bar that tracks how
 * far the user has scrolled through the current page. Gives the same
 * "travelling through the site" feel as the landing page, inside the terminal.
 */
export function PageScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <motion.div
        style={{ scaleX }}
        className="absolute inset-x-0 top-0 z-30 h-[2px] origin-left bg-gradient-to-r from-[var(--grad-from)] via-[var(--grad-via)] to-[var(--grad-to)]"
      />
      <div
        ref={ref}
        className="custom-scrollbar min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-10 pt-4 sm:px-5 lg:px-6"
      >
        {children}
      </div>
    </div>
  );
}
