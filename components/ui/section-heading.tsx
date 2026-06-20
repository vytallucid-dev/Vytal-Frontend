"use client";

import { cn } from "@/lib/utils";
import type { Icon } from "@/lib/icons";
import type { ReactNode } from "react";

/**
 * The narrative "story header" used at the top of every app section.
 * eyebrow (small kicker) → title → subtitle, optional leading icon + trailing slot.
 * Keeps the guided-analysis voice consistent across the whole platform.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  icon: IconCmp,
  action,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: Icon;
  action?: ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "items-center text-center sm:flex-col",
        className
      )}
    >
      <div className={cn("space-y-1.5", align === "center" && "flex flex-col items-center")}>
        {eyebrow && (
          <div className="flex items-center gap-2 text-primary">
            {IconCmp && (
              <span className="grid size-6 place-items-center rounded-md bg-primary/12 ring-1 ring-primary/20">
                <IconCmp weight="duotone" className="size-3.5" />
              </span>
            )}
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              {eyebrow}
            </span>
          </div>
        )}
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-[1.7rem]">
          {title}
        </h2>
        {subtitle && (
          <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
