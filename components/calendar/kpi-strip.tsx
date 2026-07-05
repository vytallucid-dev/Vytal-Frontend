"use client";

// The "do I need to pay attention this week" strip — four real reads off the calendar +
// held lens. Every figure is honest: a zero is a calm "nothing this week", never hidden.

import { Icons, type Icon } from "@/lib/icons";
import { tint } from "@/components/stock-detail/health/shared";
import { fmtDate, type Kpis } from "./lib";

function KpiCard({
  icon,
  accent,
  label,
  value,
  sub,
  muted,
}: {
  icon: Icon;
  accent: string;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  muted?: boolean;
}) {
  const Ic = icon;
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-line bg-surface-1 p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border" style={tint(accent)}>
        <Ic weight="duotone" className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] uppercase tracking-[0.1em] text-ink3">{label}</p>
        <p className={muted ? "font-display text-[14px] font-semibold text-ink2 leading-tight" : "font-display text-[20px] font-semibold leading-tight text-ink"}>
          {value}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-ink3">{sub}</p>
      </div>
    </div>
  );
}

export function KpiStrip({ kpis }: { kpis: Kpis }) {
  const earnings = kpis.nextHeldEarnings ?? kpis.nextAnyEarnings;
  const earningsHeld = kpis.nextHeldEarnings != null;

  return (
    <div className="grid h-full grid-cols-2 grid-rows-2 gap-2.5">
      {/* 1 — your holdings with events this week */}
      <KpiCard
        icon={Icons.portfolio}
        accent="var(--primary)"
        label="Your holdings"
        value={kpis.heldThisWeekCount}
        sub={
          kpis.heldThisWeekCount === 0
            ? "Nothing this week"
            : `${kpis.heldThisWeekSymbols.slice(0, 3).join(", ")}${kpis.heldThisWeekSymbols.length > 3 ? "…" : ""} · this week`
        }
      />

      {/* 2 — high-impact events this week */}
      <KpiCard
        icon={Icons.fire}
        accent="var(--p-mom)"
        label="High impact"
        value={kpis.highImpactThisWeek}
        sub={kpis.highImpactThisWeek === 0 ? "Calm week" : "events this week"}
      />

      {/* 3 — next earnings (held-first) */}
      <KpiCard
        icon={Icons.chartBar}
        accent="var(--c-steady)"
        label="Next earnings"
        muted={!earnings}
        value={earnings ? earnings.symbol : "None scheduled"}
        sub={
          earnings
            ? `${fmtDate(earnings.date)}${earningsHeld ? " · your holding" : " · market"}`
            : "in the next 90 days"
        }
      />

      {/* 4 — ex-dividend this week */}
      <KpiCard
        icon={Icons.coins}
        accent="var(--p-found)"
        label="Ex-dividend"
        value={kpis.exDivThisWeekCount}
        sub={
          kpis.exDivThisWeekCount === 0
            ? kpis.nextExDiv
              ? `Next: ${kpis.nextExDiv.symbol} · ${fmtDate(kpis.nextExDiv.exDateObj!)}`
              : "None upcoming"
            : "go ex this week"
        }
      />
    </div>
  );
}
