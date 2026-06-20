"use client";

/**
 * Thin placeholder for a tool that will reuse <ToolFrame> once its slots are built
 * (Divergence / Ownership). Honest "coming" state — same strip, same surfaces — so
 * the nav entry resolves to a real page today without faking the tool.
 */

import Link from "next/link";
import { Icons, type IconName } from "@/lib/icons";
import { Panel } from "@/components/stock-detail/health/shared";
import { Reveal } from "@/components/ui/reveal";

export function ComingSoonTool({
  name,
  icon,
  accentVar,
  blurb,
}: {
  name: string;
  /** icon key (string, not the component) so server pages can pass it across the RSC boundary. */
  icon: IconName;
  accentVar: string;
  blurb: string;
}) {
  const ToolIcon = Icons[icon];
  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-line pb-3 pt-1">
        <span className="flex items-center gap-2.5 font-display text-base font-medium text-ink">
          <ToolIcon weight="duotone" className="size-[18px]" style={{ color: accentVar }} />
          {name}
        </span>
        <span className="ml-auto text-[11.5px] text-ink3">research tool</span>
      </div>

      <Reveal>
        <Panel className="flex flex-col items-center gap-3 py-20 text-center">
          <span
            className="grid size-12 place-items-center rounded-2xl"
            style={{ background: `color-mix(in oklab, ${accentVar} 14%, transparent)`, color: accentVar }}
          >
            <ToolIcon weight="duotone" className="size-6" />
          </span>
          <p className="hero-name text-[20px] text-ink">{name} is coming</p>
          <p className="max-w-md text-[13px] text-ink2">{blurb}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11.5px] text-ink3">
            <Icons.check className="size-3.5 text-healthy" />
            Will reuse the same single-stock frame as Trajectory
          </p>
          <Link
            href="/research/trajectory"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-3.5 py-2 text-[12.5px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
          >
            <Icons.chartLine className="size-3.5" style={{ color: "var(--p-found)" }} />
            Open Trajectory
          </Link>
        </Panel>
      </Reveal>
    </div>
  );
}
