"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InfoTip, DeclinedValue, DashValue } from "./shared";

export function MetricRow({
  label,
  sub,
  gloss,
  value,
  valueClassName,
  omission,
  dashOnOmit = false,
}: {
  label: string;
  sub?: string;
  gloss?: string;
  value?: string | null;
  valueClassName?: string;
  omission?: string;
  /** When the value is missing, show a compact em-dash (reason on hover) instead of the
   *  full reason text — keeps a sparse grid tidy. Used by the benchmark section. */
  dashOnOmit?: boolean;
}) {
  const hasValue = value !== undefined && value !== null;
  return (
    <div className="group flex items-start justify-between gap-3.5 border-b border-line py-2.5 transition-colors last:border-b-0 hover:border-line2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1 text-[12.5px] text-ink2 transition-colors group-hover:text-ink">
          <span>{label}</span>
          {gloss && <InfoTip text={gloss} />}
        </div>
        {sub && <span className="mt-0.5 text-[11px] text-ink3">{sub}</span>}
      </div>
      {hasValue ? (
        <span className={cn("num shrink-0 text-[14px] tabular-nums", valueClassName ?? "text-ink")}>{value}</span>
      ) : dashOnOmit ? (
        <DashValue reason={omission} />
      ) : (
        <DeclinedValue reason={omission ?? "Not available for this fund."} />
      )}
    </div>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">{children}</div>;
}
