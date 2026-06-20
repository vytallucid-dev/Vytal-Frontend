"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types + mock data (local)                                           */
/* ------------------------------------------------------------------ */

type EventType =
  | "Earnings"
  | "Dividend"
  | "AGM"
  | "Board Meeting"
  | "Bonus/Split"
  | "Ex-Date";

type Impact = "high" | "medium" | "low";
type Source = "Portfolio" | "Watchlist" | "Market";

interface MarketEvent {
  id: string;
  date: string; // ISO "2026-06-18"
  friendly: string; // "Jun 18"
  day: string; // "Today" | "Tomorrow" | weekday
  symbol: string;
  name: string;
  eventType: EventType;
  time: string;
  impact: Impact;
  source: Source;
  revenueEst?: string;
  epsEst?: string;
}

const events: MarketEvent[] = [
  {
    id: "e1",
    date: "2026-06-16",
    friendly: "Jun 16",
    day: "Today",
    symbol: "RELIANCE",
    name: "Reliance Industries",
    eventType: "Earnings",
    time: "Post Market",
    impact: "high",
    source: "Portfolio",
    revenueEst: "₹2.41L Cr",
    epsEst: "₹28.4",
  },
  {
    id: "e2",
    date: "2026-06-16",
    friendly: "Jun 16",
    day: "Today",
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    eventType: "Dividend",
    time: "Ex-Date 09:00",
    impact: "medium",
    source: "Portfolio",
  },
  {
    id: "e3",
    date: "2026-06-17",
    friendly: "Jun 17",
    day: "Tomorrow",
    symbol: "TCS",
    name: "Tata Consultancy Services",
    eventType: "Earnings",
    time: "Post Market",
    impact: "high",
    source: "Portfolio",
    revenueEst: "₹64,200 Cr",
    epsEst: "₹32.1",
  },
  {
    id: "e4",
    date: "2026-06-17",
    friendly: "Jun 17",
    day: "Tomorrow",
    symbol: "INFY",
    name: "Infosys",
    eventType: "Board Meeting",
    time: "11:30 AM",
    impact: "medium",
    source: "Watchlist",
  },
  {
    id: "e5",
    date: "2026-06-18",
    friendly: "Jun 18",
    day: "Thursday",
    symbol: "TATAMOTORS",
    name: "Tata Motors",
    eventType: "Earnings",
    time: "Pre Market",
    impact: "high",
    source: "Watchlist",
    revenueEst: "₹1.18L Cr",
    epsEst: "₹14.7",
  },
  {
    id: "e6",
    date: "2026-06-18",
    friendly: "Jun 18",
    day: "Thursday",
    symbol: "ITC",
    name: "ITC Ltd",
    eventType: "Bonus/Split",
    time: "Record Date",
    impact: "medium",
    source: "Portfolio",
  },
  {
    id: "e7",
    date: "2026-06-19",
    friendly: "Jun 19",
    day: "Friday",
    symbol: "ASIANPAINT",
    name: "Asian Paints",
    eventType: "AGM",
    time: "10:00 AM",
    impact: "low",
    source: "Market",
  },
  {
    id: "e8",
    date: "2026-06-19",
    friendly: "Jun 19",
    day: "Friday",
    symbol: "WIPRO",
    name: "Wipro Ltd",
    eventType: "Dividend",
    time: "Ex-Date 09:00",
    impact: "low",
    source: "Watchlist",
  },
  {
    id: "e9",
    date: "2026-06-22",
    friendly: "Jun 22",
    day: "Monday",
    symbol: "BAJFINANCE",
    name: "Bajaj Finance",
    eventType: "Earnings",
    time: "Post Market",
    impact: "high",
    source: "Portfolio",
    revenueEst: "₹16,800 Cr",
    epsEst: "₹48.9",
  },
  {
    id: "e10",
    date: "2026-06-22",
    friendly: "Jun 22",
    day: "Monday",
    symbol: "LT",
    name: "Larsen & Toubro",
    eventType: "Ex-Date",
    time: "09:00 AM",
    impact: "medium",
    source: "Market",
  },
  {
    id: "e11",
    date: "2026-06-23",
    friendly: "Jun 23",
    day: "Tuesday",
    symbol: "SUNPHARMA",
    name: "Sun Pharmaceutical",
    eventType: "Board Meeting",
    time: "02:00 PM",
    impact: "low",
    source: "Watchlist",
  },
  {
    id: "e12",
    date: "2026-06-24",
    friendly: "Jun 24",
    day: "Wednesday",
    symbol: "MARUTI",
    name: "Maruti Suzuki",
    eventType: "Earnings",
    time: "Post Market",
    impact: "high",
    source: "Portfolio",
    revenueEst: "₹38,400 Cr",
    epsEst: "₹121.5",
  },
];

/* ------------------------------------------------------------------ */
/* Style maps                                                          */
/* ------------------------------------------------------------------ */

const typeStyles: Record<EventType, { text: string; bg: string; border: string }> = {
  Earnings: { text: "text-primary", bg: "bg-primary/12", border: "border-primary/25" },
  Dividend: { text: "text-success", bg: "bg-success/12", border: "border-success/25" },
  AGM: { text: "text-info", bg: "bg-info/12", border: "border-info/25" },
  "Board Meeting": { text: "text-info", bg: "bg-info/12", border: "border-info/25" },
  "Bonus/Split": { text: "text-warning", bg: "bg-warning/12", border: "border-warning/25" },
  "Ex-Date": { text: "text-success", bg: "bg-success/12", border: "border-success/25" },
};

const impactStyles: Record<Impact, { text: string; bg: string; dot: string; label: string }> = {
  high: { text: "text-danger", bg: "bg-danger/12", dot: "bg-danger", label: "High" },
  medium: { text: "text-warning", bg: "bg-warning/12", dot: "bg-warning", label: "Medium" },
  low: { text: "text-muted-foreground", bg: "bg-surface-2", dot: "bg-muted-foreground/60", label: "Low" },
};

const sourceStyles: Record<Source, { text: string; icon: typeof Icons.coins }> = {
  Portfolio: { text: "text-success", icon: Icons.coins },
  Watchlist: { text: "text-warning", icon: Icons.star },
  Market: { text: "text-info", icon: Icons.building },
};

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

const sourceFilters = ["All", "Portfolio", "Watchlist"] as const;
const impactFilters = ["All", "High", "Medium", "Low"] as const;
const typeFilters = [
  "All",
  "Earnings",
  "Dividend",
  "AGM",
  "Board Meeting",
  "Bonus/Split",
  "Ex-Date",
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CalendarPage() {
  const [sourceFilter, setSourceFilter] = useState<(typeof sourceFilters)[number]>("All");
  const [impactFilter, setImpactFilter] = useState<(typeof impactFilters)[number]>("All");
  const [typeFilter, setTypeFilter] = useState<(typeof typeFilters)[number]>("All");
  const [reminded, setReminded] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const toggleRemind = (ev: MarketEvent) => {
    setReminded((prev) => {
      const next = { ...prev, [ev.id]: !prev[ev.id] };
      if (next[ev.id]) {
        setToast(`Reminder set for ${ev.symbol} · ${ev.eventType}`);
      } else {
        setToast(null);
      }
      return next;
    });
  };

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (sourceFilter !== "All" && e.source !== sourceFilter) return false;
        if (impactFilter !== "All" && e.impact !== impactFilter.toLowerCase()) return false;
        if (typeFilter !== "All" && e.eventType !== typeFilter) return false;
        return true;
      }),
    [sourceFilter, impactFilter, typeFilter]
  );

  // group by date, preserving chronological order
  const groups = useMemo(() => {
    const map = new Map<string, MarketEvent[]>();
    for (const e of filtered) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return Array.from(map.entries()).map(([date, list]) => ({
      date,
      friendly: list[0].friendly,
      day: list[0].day,
      list,
    }));
  }, [filtered]);

  // week strip — one chip per unique date in the full dataset
  const weekStrip = useMemo(() => {
    const seen = new Map<string, MarketEvent>();
    for (const e of events) if (!seen.has(e.date)) seen.set(e.date, e);
    return Array.from(seen.values()).map((e) => ({
      date: e.date,
      friendly: e.friendly,
      day: e.day,
      count: events.filter((x) => x.date === e.date).length,
    }));
  }, []);

  const summary = useMemo(() => {
    return {
      thisWeek: events.length,
      highImpact: events.filter((e) => e.impact === "high").length,
      portfolio: events.filter((e) => e.source === "Portfolio").length,
      watchlist: events.filter((e) => e.source === "Watchlist").length,
    };
  }, []);

  const summaryCards = [
    { label: "This week", value: summary.thisWeek, icon: Icons.calendar, accent: "text-primary", ring: "ring-primary/20", bg: "bg-primary/12" },
    { label: "High impact", value: summary.highImpact, icon: Icons.bolt, accent: "text-danger", ring: "ring-danger/20", bg: "bg-danger/12" },
    { label: "Your portfolio", value: summary.portfolio, icon: Icons.coins, accent: "text-success", ring: "ring-success/20", bg: "bg-success/12" },
    { label: "Your watchlist", value: summary.watchlist, icon: Icons.star, accent: "text-warning", ring: "ring-warning/20", bg: "bg-warning/12" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-7"
      >
        <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-20" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-primary">
              <span className="grid size-6 place-items-center rounded-md bg-primary/12 ring-1 ring-primary/20">
                <Icons.calendar weight="duotone" className="size-3.5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Market Calendar</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Never miss what <span className="text-gradient">moves your stocks</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Earnings, dividends and corporate actions for your portfolio &amp; watchlist —
              tracked, ranked by impact, and ready to remind you before they hit.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-surface-1/40 px-3 py-2 text-xs">
                <Icons.results weight="duotone" className="size-4 text-primary" />
                <span className="font-mono font-bold">{events.length}</span>
                <span className="text-muted-foreground">events tracked</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-surface-1/40 px-3 py-2 text-xs">
                <Icons.bolt weight="duotone" className="size-4 text-danger" />
                <span className="font-mono font-bold">{summary.highImpact}</span>
                <span className="text-muted-foreground">high impact</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 self-start rounded-2xl border border-border/70 bg-surface-1/40 p-4 lg:self-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary/12 ring-1 ring-primary/20">
              <Icons.bell weight="duotone" className="size-7 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Next up</p>
              <p className="font-display text-lg font-bold">RELIANCE earnings</p>
              <p className="font-mono text-xs text-muted-foreground">Today · Post Market</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((c, i) => (
          <Reveal key={c.label} delay={i * 0.05}>
            <div className="glass flex items-center gap-4 rounded-3xl border border-border/70 p-4 sm:p-5">
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl ring-1", c.bg, c.ring)}>
                <c.icon weight="duotone" className={cn("size-5", c.accent)} />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className={cn("font-display text-2xl font-extrabold", c.accent)}>{c.value}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Week strip */}
      <Reveal>
        <div className="glass rounded-3xl border border-border/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Icons.calendar weight="duotone" className="size-4 text-primary" /> This week at a glance
          </div>
          <div className="custom-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {weekStrip.map((w) => (
              <div
                key={w.date}
                className={cn(
                  "flex min-w-21 shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 text-center",
                  w.day === "Today"
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/60 bg-surface-1/40"
                )}
              >
                <span
                  className={cn(
                    "text-[0.65rem] font-semibold uppercase tracking-wider",
                    w.day === "Today" ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {w.day}
                </span>
                <span className="font-display text-sm font-bold">{w.friendly}</span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[0.6rem] text-muted-foreground">
                  {w.count} {w.count === 1 ? "event" : "events"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Filters */}
      <Reveal>
        <div className="glass flex flex-col gap-4 rounded-3xl border border-border/70 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Icons.filter weight="duotone" className="size-4 text-primary" /> Filter events
          </div>

          <FilterRow label="Source">
            {sourceFilters.map((s) => (
              <Chip key={s} active={sourceFilter === s} onClick={() => setSourceFilter(s)}>
                {s}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Impact">
            {impactFilters.map((s) => (
              <Chip key={s} active={impactFilter === s} onClick={() => setImpactFilter(s)}>
                {s !== "All" && (
                  <span className={cn("size-1.5 rounded-full", impactStyles[s.toLowerCase() as Impact].dot)} />
                )}
                {s}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Type">
            {typeFilters.map((s) => (
              <Chip key={s} active={typeFilter === s} onClick={() => setTypeFilter(s)}>
                {s}
              </Chip>
            ))}
          </FilterRow>
        </div>
      </Reveal>

      {/* Agenda */}
      <Reveal>
        <SectionHeading
          eyebrow="Agenda"
          icon={Icons.clock}
          title="Upcoming events"
          subtitle={`${filtered.length} event${filtered.length === 1 ? "" : "s"} matching your filters, grouped by day.`}
        />
      </Reveal>

      {groups.length === 0 ? (
        <Reveal>
          <div className="glass flex flex-col items-center gap-3 rounded-3xl border border-border/70 p-12 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-surface-2">
              <Icons.calendar weight="duotone" className="size-6 text-muted-foreground" />
            </span>
            <p className="font-display text-lg font-bold">No events match these filters</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try widening your source, impact or type selection to see more upcoming events.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSourceFilter("All");
                setImpactFilter("All");
                setTypeFilter("All");
              }}
            >
              <Icons.close weight="bold" className="size-4" /> Clear filters
            </Button>
          </div>
        </Reveal>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g, gi) => (
            <Reveal key={g.date} delay={gi * 0.05}>
              <div className="glass overflow-hidden rounded-3xl border border-border/70">
                {/* group header */}
                <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-surface-1/40 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-2xl border text-center leading-none",
                        g.day === "Today"
                          ? "border-primary/40 bg-primary/10"
                          : "border-border/60 bg-surface-2"
                      )}
                    >
                      <span className="flex flex-col">
                        <span className="font-display text-sm font-extrabold">{g.friendly.split(" ")[1]}</span>
                        <span className="text-[0.55rem] uppercase tracking-wider text-muted-foreground">
                          {g.friendly.split(" ")[0]}
                        </span>
                      </span>
                    </span>
                    <div>
                      <p className="font-display text-base font-bold">
                        {g.day}
                        {g.day !== "Today" && g.day !== "Tomorrow" && (
                          <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground">
                            {g.friendly}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{g.friendly}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground">
                    {g.list.length} {g.list.length === 1 ? "event" : "events"}
                  </span>
                </div>

                {/* rows */}
                <ul className="divide-y divide-border/50">
                  {g.list.map((ev, ri) => {
                    const ts = typeStyles[ev.eventType];
                    const im = impactStyles[ev.impact];
                    const src = sourceStyles[ev.source];
                    const isReminded = !!reminded[ev.id];
                    return (
                      <motion.li
                        key={ev.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.45, delay: ri * 0.04, ease: EASE }}
                        className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-2/30 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                      >
                        {/* left impact marker */}
                        <div className="flex items-center gap-3 sm:w-auto">
                          <span className={cn("h-10 w-1 shrink-0 rounded-full", im.dot)} aria-hidden />
                          <div className="min-w-0 flex-1 sm:hidden">
                            <p className="font-display text-base font-bold">{ev.symbol}</p>
                            <p className="truncate text-xs text-muted-foreground">{ev.name}</p>
                          </div>
                        </div>

                        {/* main info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold",
                                ts.bg,
                                ts.border,
                                ts.text
                              )}
                            >
                              {ev.eventType}
                            </span>
                            <p className="hidden font-display text-base font-bold sm:block">{ev.symbol}</p>
                            <p className="hidden truncate text-sm text-muted-foreground sm:block">{ev.name}</p>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                            <span className="flex items-center gap-1 font-mono text-muted-foreground">
                              <Icons.clock weight="duotone" className="size-3.5" />
                              {ev.time}
                            </span>
                            <span className={cn("flex items-center gap-1 font-medium", src.text)}>
                              <src.icon weight="duotone" className="size-3.5" />
                              {ev.source}
                            </span>
                            <span className={cn("flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium", im.bg, im.text)}>
                              <span className={cn("size-1.5 rounded-full", im.dot)} />
                              {im.label} impact
                            </span>
                            {ev.eventType === "Earnings" && ev.revenueEst && (
                              <>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Icons.coins weight="duotone" className="size-3.5 text-info" />
                                  Rev est <span className="font-mono text-foreground">{ev.revenueEst}</span>
                                </span>
                                {ev.epsEst && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Icons.target weight="duotone" className="size-3.5 text-info" />
                                    EPS est <span className="font-mono text-foreground">{ev.epsEst}</span>
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* remind button */}
                        <div className="shrink-0">
                          <Button
                            variant={isReminded ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleRemind(ev)}
                            className={cn("h-8 w-full sm:w-auto", isReminded && "shadow-[0_2px_18px_-6px_var(--glow)]")}
                          >
                            <motion.span
                              key={isReminded ? "on" : "off"}
                              initial={{ scale: 0.6, rotate: isReminded ? -25 : 0 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 420, damping: 16 }}
                              className="inline-flex"
                            >
                              {isReminded ? (
                                <Icons.check weight="bold" className="size-4" />
                              ) : (
                                <Icons.bell weight="duotone" className="size-4" />
                              )}
                            </motion.span>
                            {isReminded ? "Reminded" : "Remind"}
                          </Button>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="glass-strong fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-border/70 p-3 shadow-2xl sm:inset-x-auto sm:right-6"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success/12 ring-1 ring-success/20">
              <Icons.check weight="bold" className="size-4 text-success" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Reminder set</p>
              <p className="truncate text-xs text-muted-foreground">{toast}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Icons.close className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small local helpers                                                 */
/* ------------------------------------------------------------------ */

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/12 text-primary"
          : "border-border/70 bg-surface-1/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
