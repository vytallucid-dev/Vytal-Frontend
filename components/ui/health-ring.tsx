"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { healthColorVar, healthLabel } from "@/lib/format";

interface HealthRingProps {
  /** 0–100 health score */
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** show the numeric score in the center */
  showValue?: boolean;
  /** show the band label (Strong / Moderate / Weak) under the value */
  showLabel?: boolean;
  /** override the center label text */
  label?: string;
  /** suffix shown after the value, e.g. "/100" */
  suffix?: string;
}

/**
 * The InvestIQ Health Score, made visual. A gradient progress arc whose color
 * tracks the health band, with a soft glow and a count-up center value.
 * Pure SVG + transform animation — no layout thrash, GPU-friendly.
 */
export function HealthRing({
  score,
  size = 120,
  strokeWidth = 9,
  className,
  showValue = true,
  showLabel = false,
  label,
  suffix,
}: HealthRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = healthColorVar(clamped);
  const gradId = `hr-grad-${Math.round(clamped)}-${size}`;

  return (
    <div
      ref={ref}
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.65} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="color-mix(in oklch, var(--foreground) 10%, transparent)"
          strokeWidth={strokeWidth}
        />
        {/* progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={
            inView ? { strokeDashoffset: circumference * (1 - clamped / 100) } : {}
          }
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="num font-semibold leading-none"
            style={{ fontSize: size * 0.3, color }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.25, duration: 0.5, ease: "backOut" }}
          >
            {Math.round(clamped)}
          </motion.span>
          {suffix && (
            <span className="text-[0.6rem] text-muted-foreground/70 -mt-0.5">
              {suffix}
            </span>
          )}
          {(showLabel || label) && (
            <span
              className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-wider"
              style={{ color }}
            >
              {label ?? healthLabel(clamped)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
