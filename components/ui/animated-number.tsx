"use client";

import NumberFlow, { type Format } from "@number-flow/react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Intl.NumberFormat options (e.g. style/currency/grouping) */
  format?: Format;
}

/**
 * Smooth, accessible count-up/transition number built on NumberFlow.
 * Used for portfolio values, P&L, scores — anything that should feel "live".
 */
export function AnimatedNumber({
  value,
  className,
  prefix,
  suffix,
  decimals = 0,
  format,
}: AnimatedNumberProps) {
  return (
    <NumberFlow
      value={value}
      prefix={prefix}
      suffix={suffix}
      className={cn("font-mono tabular-nums", className)}
      format={
        format ?? {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }
      }
    />
  );
}
