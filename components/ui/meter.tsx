import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Vytal Meter / Bar — a slim horizontal value bar.
 * Track is --surface3, the fill is a semantic color, width animates.
 * height 6–9px · radius 4–6px (per the design system).
 *
 *   <Meter value={72} color="var(--c-healthy)" />
 *   <Meter value={40} max={100} className="..." height={8} />
 */
export function Meter({
  value,
  max = 100,
  color,
  height = 6,
  className,
  trackClassName,
}: {
  value: number;
  max?: number;
  /** any CSS color — defaults to the brand accent. Pass a condition/pillar var. */
  color?: string;
  height?: number;
  className?: string;
  trackClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn(
        "bg-surface-3 w-full overflow-hidden rounded-[5px]",
        trackClassName
      )}
      style={{ height }}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn("h-full rounded-[5px] transition-[width] duration-500 ease-out", className)}
        style={{ width: `${pct}%`, background: color ?? "var(--primary)" }}
      />
    </div>
  );
}
