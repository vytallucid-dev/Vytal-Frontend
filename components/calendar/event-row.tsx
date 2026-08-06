"use client";

// One calendar event, rendered as a single funnel-to-stock row. Shared by the timeline
// (horizon groups) and the month-grid day detail so an event reads identically in both.
// A held name is visually distinguished (accent rail + health-context chip); a market
// name reads plain. Funnels to the stock's Events tab.

import Link from "next/link";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { tint } from "@/components/stock-detail/health/shared";
import { SetReminderButton } from "@/components/reminders/set-reminder-button";
import {
  BAND_META,
  IMPACT_META,
  daysAwayLabel,
  eventDetail,
  fmtDate,
  fmtDay,
  healthContext,
  typeMeta,
  type CalEvent,
} from "./lib";

function stockHref(symbol: string) {
  return `/research/stock-screener/${encodeURIComponent(symbol)}?tab=events`;
}

/** ex-date / record-date pills — only the dates that are real for this event. */
function DatePills({ e }: { e: CalEvent }) {
  const pills: { label: string; value: string }[] = [];
  if (e.exDate) pills.push({ label: "Ex", value: fmtDate(new Date(e.exDate)) });
  if (e.recordDate) pills.push({ label: "Record", value: fmtDate(new Date(e.recordDate)) });
  if (pills.length === 0) return null;
  return (
    <>
      {pills.map((p) => (
        <span key={p.label} className="num inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10.5px] text-ink3">
          <span className="uppercase tracking-wide">{p.label}</span>
          <span className="text-ink2">{p.value}</span>
        </span>
      ))}
    </>
  );
}

export function EventRow({ e }: { e: CalEvent }) {
  const meta = typeMeta(e.eventType);
  const impact = IMPACT_META[e.impact];
  const detail = eventDetail(e);
  const health = healthContext(e);
  const imminent = e.daysAway >= 0 && e.daysAway <= 1;

  return (
    <div
      className={cn(
        "group relative flex items-stretch gap-2 rounded-xl border bg-surface-1 py-3 pr-2.5 pl-0 transition-colors hover:border-line3 hover:bg-surface-2/50 sm:gap-3 sm:pr-3",
        e.isHeld ? "border-line2" : "border-line",
        // a record, not a catalyst — one notch quieter than a live row
        e.isPast && "opacity-[0.82]",
      )}
    >
      {/* stretched navigation link — covers the whole row (transparent); the set-reminder
          control sits above it (z-10) so its clicks don't navigate. */}
      <Link
        href={stockHref(e.symbol)}
        aria-label={`${e.symbol} — view events`}
        className="absolute inset-0 rounded-xl"
      />

      {/* held rail / impact rail */}
      <span
        aria-hidden
        className="my-0.5 ml-2 w-1 shrink-0 rounded-full"
        style={{ background: e.isHeld ? "var(--primary)" : impact.color, opacity: e.isHeld ? 1 : 0.55 }}
      />

      {/* type glyph */}
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center self-start rounded-lg border sm:h-9 sm:w-9" style={tint(meta.accent)}>
        <meta.icon weight="duotone" className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
      </span>

      {/* body */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13.5px] font-semibold text-ink">{e.symbol}</span>
          <span className="min-w-0 truncate text-[11.5px] text-ink3">{e.companyName}</span>
          {e.isHeld && (
            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold" style={tint("var(--primary)", 14, 30)}>
              <Icons.portfolio weight="fill" className="h-2.5 w-2.5" />
              Holding
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium" style={tint(meta.accent, 12, 26)}>
            {meta.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium text-ink2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: impact.color }} />
            {impact.label}
          </span>
          {detail && <span className="num text-[11.5px] text-ink2">{detail}</span>}
          <DatePills e={e} />
        </div>

        {/* health context — the Vytal layer, held names only */}
        {health && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: health.band ? BAND_META[health.band].color : "var(--ink3)" }}
            />
            <span className={health.band ? "font-medium" : "italic text-ink3"} style={health.band ? { color: BAND_META[health.band].color } : undefined}>
              {health.text}
            </span>
          </div>
        )}
      </div>

      {/* when — `imminent` is today/tomorrow ONLY. The grid reads history now, so a negative
          daysAway must not borrow the "happening now" emphasis the old `<= 1` gave it. */}
      <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 self-center text-right">
        <span className="num text-[12.5px] font-semibold text-ink">{e.dateLabel}</span>
        <span className="text-[10.5px] text-ink3">{fmtDay(e.date)}</span>
        <span
          className={cn(
            "mt-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
            imminent ? "text-ink" : "text-ink3",
          )}
          style={imminent ? tint("var(--primary)", 12, 28) : undefined}
        >
          {daysAwayLabel(e.daysAway)}
        </span>
      </div>

      {/* set-reminder — above the stretched link so its clicks stay local. Omitted on a past
          event: there is nothing left to be reminded about, and the backend resolves a rule
          against the NEXT occurrence, so the control would quietly mean something else here. */}
      {!e.isPast && (
        <div className="relative z-10 flex shrink-0 items-center self-center">
          <SetReminderButton symbol={e.symbol} stockId={e.stockId} eventType={e.eventType} eventDate={e.eventDate} />
        </div>
      )}
    </div>
  );
}
