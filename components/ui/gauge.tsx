import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Vytal Gauge — a compact circular SVG score dial, for pillar scores.
 * track --surface3 · value-colored arc · mono number centered.
 * (For the large proprietary Health Score, use <HealthRing /> instead.)
 *
 *   <Gauge value={72} color="var(--p-found)" />
 *   <Gauge value={61} size={72} color="var(--c-steady)" suffix="/100" />
 */
export function Gauge({
  value,
  max = 100,
  size = 64,
  strokeWidth = 6,
  color,
  suffix,
  showValue = true,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  /** arc color — pass a pillar / condition var. Defaults to the brand accent. */
  color?: string;
  suffix?: string;
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = color ?? "var(--primary)";

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface3)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arc}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            className="num font-semibold"
            style={{ fontSize: size * 0.3, color: arc }}
          >
            {Math.round(value)}
          </span>
          {suffix && (
            <span className="num text-ink3 mt-0.5" style={{ fontSize: size * 0.13 }}>
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
