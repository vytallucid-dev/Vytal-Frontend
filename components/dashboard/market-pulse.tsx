"use client";

import { Sparkline } from "@/components/ui/sparkline";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { marketIndices } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function MarketPulse() {
  return (
    <Reveal>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {marketIndices.map((idx) => {
          const up = idx.change >= 0;
          return (
            <div
              key={idx.name}
              className="lift group rounded-2xl border border-border/70 bg-surface-1/40 p-4 hover:border-primary/25"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {idx.name}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 font-mono text-xs",
                    up ? "text-success" : "text-danger"
                  )}
                >
                  {up ? (
                    <Icons.arrowUpRight weight="bold" className="size-3" />
                  ) : (
                    <Icons.arrowDownRight weight="bold" className="size-3" />
                  )}
                  {Math.abs(idx.change)}%
                </span>
              </div>
              <p className="mt-1 font-display text-lg font-bold tracking-tight">
                {idx.value.toLocaleString("en-IN")}
              </p>
              <Sparkline
                data={idx.spark}
                width={180}
                height={30}
                className="mt-1.5 w-full"
                color={up ? "var(--success)" : "var(--danger)"}
              />
            </div>
          );
        })}
      </div>
    </Reveal>
  );
}
