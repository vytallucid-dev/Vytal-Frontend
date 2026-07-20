"use client";

import Link from "next/link";
import { Icons } from "@/lib/icons";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { useEventsCalendar } from "@/lib/api/hooks/use-events-calendar";
import { UpcomingEventRow, heldUpcomingEvents } from "@/components/dashboard/upcoming-events";
import { Kicker } from "./shared";

/**
 * Upcoming events for the user's holdings (earnings dates / ex-dividend / corporate
 * actions). Read-only over the market-wide calendar (GET /api/v1/events/calendar),
 * client-filtered to the names the user holds and shown upcoming-first — the same live
 * read (and row rendering) the dashboard Events card uses. Honest-empty ONLY when no held
 * name has an upcoming event; nothing is ever fabricated.
 */

// the "Open Calendar →" funnel — kept in both the populated and empty states
function CalendarLink() {
  return (
    <Link
      href="/calendar"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3 py-1.5 text-[12px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
    >
      Open Calendar
      <Icons.arrowUpRight className="size-3" />
    </Link>
  );
}

// internal card header — the same rhythm the other Overview cards use (Kicker title +
// one-line muted subtitle), so the events read as a titled, connected part of the page.
function Header() {
  return (
    <div className="mb-4">
      <Kicker>Upcoming for your holdings</Kicker>
      <p className="mt-1 text-[11px] text-ink3">
        Results, ex-dividends and actions for the names you hold — nearest first.
      </p>
    </div>
  );
}

export function Upcoming() {
  const holdQ = useHoldings();
  const evQ = useEventsCalendar(90);
  // GUARD ON assetClass: this calendar is the EQUITY corporate-actions feed, so only a stock can
  // legitimately match. Building the held-set from every symbol worked only by luck — a fund/bond
  // symbol never happened to collide — and would leak the moment a non-equity event source lands (a
  // bond showing equity actions). Keying on stocks-only closes that permanently. A non-stock symbol
  // can no longer enter the set, so it can never match an equity event.
  const held = new Set(
    (holdQ.data?.holdings ?? []).filter((h) => h.assetClass === "stock").map((h) => h.symbol),
  );
  // The calendar is already upcoming-first (eventDate asc, impact tiebreak); keep held names.
  const mine = heldUpcomingEvents(evQ.data, held, 5);
  const loading = holdQ.isLoading || evQ.isLoading;

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
      <Header />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2/60" />
          ))}
        </div>
      ) : mine.length === 0 ? (
        // honest-empty — the user genuinely holds nothing with an upcoming event
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-line2 bg-surface-2/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-3 text-ink2">
              <Icons.calendar weight="duotone" className="size-5" />
            </span>
            <p className="max-w-lg text-[12px] leading-relaxed text-ink3">
              No upcoming events for your holdings — none of the names you hold have an earnings date, ex-dividend or
              corporate action scheduled in the next 90 days. The full market Calendar has every date.
            </p>
          </div>
          <CalendarLink />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {mine.map((e, i) => (
              <UpcomingEventRow key={e.id} e={e} index={i} showReminder />
            ))}
          </div>
          <div className="mt-4 flex justify-end border-t border-line pt-4">
            <CalendarLink />
          </div>
        </>
      )}
    </div>
  );
}
