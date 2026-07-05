"use client";

import Link from "next/link";
import { Icons } from "@/lib/icons";

/**
 * Upcoming events for the user's holdings (results dates / ex-dividend / corporate
 * actions). A portfolio-scoped events read isn't wired yet, so this is an honest
 * PENDING state that funnels to the full Calendar — never a fabricated schedule.
 */
export function Upcoming() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line2 bg-surface-1 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-3 text-ink2">
          <Icons.calendar weight="duotone" className="size-5" />
        </span>
        <div>
          <p className="text-[13px] font-medium text-ink">Upcoming events for your holdings</p>
          <p className="mt-0.5 max-w-lg text-[11.5px] leading-relaxed text-ink3">
            Results dates, ex-dividend and corporate actions among the names you hold will surface here. Until the
            holdings-scoped calendar read lands, the full market Calendar has every date.
          </p>
        </div>
      </div>
      <Link
        href="/calendar"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-3 py-2 text-[12px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
      >
        Open Calendar
        <Icons.arrowUpRight className="size-3" />
      </Link>
    </div>
  );
}
