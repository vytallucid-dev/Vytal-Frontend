"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** radius of the cursor glow in px */
  radius?: number;
  /** glow color (defaults to brand primary) */
  color?: string;
}

/**
 * A card that emits a soft radial spotlight following the cursor, plus a
 * hairline gradient border that lights up on hover. GPU-friendly (only
 * background-position + opacity animate). Falls back gracefully on touch.
 */
export function SpotlightCard({
  children,
  className,
  radius = 360,
  color = "color-mix(in oklch, var(--primary) 22%, transparent)",
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-radius);
  const mouseY = useMotionValue(-radius);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, ${color}, transparent 70%)`;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        mouseX.set(-radius);
        mouseY.set(-radius);
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70",
        "bg-[linear-gradient(180deg,color-mix(in_oklch,var(--surface-1)_55%,transparent),color-mix(in_oklch,var(--background)_72%,transparent))]",
        "backdrop-blur-md transition-colors duration-300 hover:border-primary/30",
        className
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
