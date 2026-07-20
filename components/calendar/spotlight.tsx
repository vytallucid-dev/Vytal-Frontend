"use client";

// The "if you read one thing" card — the single most important upcoming event (nearest
// high-impact, held-first). Condensed to sit beside the KPI grid: identity · type/impact ·
// its health context (rounded score · band, the Vytal read) · when · funnel. Honest when
// the spotlight is a market name (no owned score to show).

import Link from "next/link";
import { Icons } from "@/lib/icons";
import { tint } from "@/components/stock-detail/health/shared";
import {
  BAND_META,
  IMPACT_META,
  daysAwayLabel,
  eventDetail,
  fmtDate,
  fmtFull,
  healthContext,
  typeMeta,
  type CalEvent,
} from "./lib";

function stockHref(symbol: string) {
  return `/research/stock-screener/${encodeURIComponent(symbol)}?tab=events`;
}

export function Spotlight({ event }: { event: CalEvent }) {
  const meta = typeMeta(event.eventType);
  const impact = IMPACT_META[event.impact];
  const detail = eventDetail(event);
  const health = healthContext(event);

  // the health read — rounded score · band when scored, honest states otherwise
  const healthValue =
    health && health.band ? (health.score != null ? `${health.score} · ${BAND_META[health.band].label}` : BAND_META[health.band].label) : health ? "Not scored" : "Not in holdings";
  const healthColor = health?.band ? BAND_META[health.band].color : "var(--ink3)";

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line2 bg-surface-1 p-3.5 sm:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-[0.06]"
        style={{ background: `radial-gradient(70% 100% at 20% 0%, ${meta.accent}, transparent)` }}
      />

      <div className="flex items-center gap-1.5 text-ink3">
        <Icons.spark weight="fill" className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em]">Spotlight · next big thing</span>
      </div>

      {/* identity */}
      <div className="mt-2.5 flex items-start gap-2.5 sm:gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border sm:h-10 sm:w-10" style={tint(meta.accent)}>
          <meta.icon weight="duotone" className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={stockHref(event.symbol)} className="font-display text-[16px] font-semibold text-ink hover:text-primary sm:text-[18px]">
              {event.symbol}
            </Link>
            {event.isHeld && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold" style={tint("var(--primary)", 14, 30)}>
                <Icons.portfolio weight="fill" className="h-2.5 w-2.5" />
                Holding
              </span>
            )}
          </div>
          <p className="truncate text-[11.5px] text-ink3">{event.companyName}</p>
        </div>
      </div>

      {/* type + impact */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium" style={tint(meta.accent, 12, 26)}>
          {meta.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-ink2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: impact.color }} />
          {impact.label} impact
        </span>
        {detail && <span className="num text-[11.5px] text-ink2">{detail}</span>}
      </div>

      {/* health · when */}
      <div className="mt-3 flex items-stretch gap-2">
        <div className="flex flex-1 flex-col justify-center gap-0.5 rounded-lg border px-2.5 py-2 sm:px-3" style={health?.band ? tint(healthColor, 9, 26) : { borderColor: "var(--line)" }}>
          <span className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">Health</span>
          <span className="truncate font-display text-[13.5px] font-semibold sm:text-[15px]" style={{ color: healthColor }}>
            {healthValue}
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-0.5 rounded-lg border border-line px-2.5 py-2 sm:px-3">
          <span className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">When</span>
          <span className="num text-[12.5px] font-semibold text-ink">{fmtDate(event.date)}</span>
          <span className="text-[10.5px] text-ink3">{fmtFull(event.date).split(",")[0]} · {daysAwayLabel(event.daysAway)}</span>
        </div>
      </div>

      <Link
        href={stockHref(event.symbol)}
        className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-3.5 py-2 text-[12.5px] font-medium text-ink transition-colors hover:border-line3 hover:bg-surface-3"
      >
        Open {event.symbol}
        <Icons.arrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
