"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Icons, type Icon } from "@/lib/icons";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { useWatchlist } from "@/lib/api/hooks/use-watchlist";
import { useEventsCalendar, type CalendarEvent } from "@/lib/api/hooks/use-events-calendar";
import { buildAllocation, diversificationRead, type AllocSegment } from "@/components/portfolio/lib";
import { healthColorVar, formatINR } from "@/lib/format";
import { signPct } from "./lib";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function CardShell({
  icon: IconCmp,
  title,
  subtitle,
  action,
  children,
  className,
}: {
  icon: Icon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-1 p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
            <IconCmp weight="duotone" className="size-4 text-primary" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold leading-tight text-ink">{title}</h3>
            {subtitle && <p className="text-xs text-ink3">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// Cursor-anchored tooltip position, clamped to the viewport so it never runs off-screen
// (flips to the left of the cursor near the right edge, rides up near the bottom).
function tipPos(x: number, y: number): { left: number; top: number } {
  const W = 200;
  const H = 54;
  const PAD = 10;
  if (typeof window === "undefined") return { left: x + 14, top: y + 14 };
  const left = x + 14 + W > window.innerWidth ? Math.max(PAD, x - 14 - W) : x + 14;
  const top = Math.min(y + 14, window.innerHeight - H - PAD);
  return { left, top };
}

/** Fold segments beyond `max` into a single grey "Others" slice. */
function fold(segs: AllocSegment[], max = 6): AllocSegment[] {
  if (segs.length <= max) return segs;
  const head = segs.slice(0, max - 1);
  const restWeight = segs.slice(max - 1).reduce((s, x) => s + x.weight, 0);
  return [...head, { key: "__others", label: `Others (${segs.length - (max - 1)})`, weight: restWeight, color: "var(--ink3)" }];
}

/* ---------- Allocation donut ---------- */
// Reuses the Portfolio Holdings-tab donut construction verbatim: concentric stroked arcs
// with a STATIC strokeDashoffset = −(cumulative weight)×circumference, drawn clockwise from
// 12 o'clock over a background track. (The prior animated build left a broken partial ring.)
// Sector labels are the real display names the backend now serves (never snake_case keys).
export function AllocationCard() {
  const { data, isLoading } = useHoldings();
  const [active, setActive] = useState<number | null>(null);
  // cursor-following tooltip (portaled to <body> so no card overflow clips it)
  const [tip, setTip] = useState<{ x: number; y: number; i: number } | null>(null);
  const segs = fold(buildAllocation(data?.holdings ?? [], "sector"));
  const div = diversificationRead(data?.holdings ?? []);
  const totalPriced = (data?.holdings ?? []).reduce((s, h) => s + (h.marketValue ?? 0), 0);

  const size = 150;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = segs.length > 1 ? 2 : 0;
  let acc = 0;

  return (
    <CardShell
      icon={Icons.sector}
      title="Allocation"
      subtitle="Where your money sits"
      action={
        segs.length > 0 ? (
          <Link href="/portfolio?tab=holdings" className="text-xs font-medium text-primary hover:underline">
            Holdings
          </Link>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="h-40 flex-1 animate-pulse rounded-xl bg-surface-2/60" />
      ) : segs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line2 bg-surface-2/40 px-4 py-8 text-center">
          <Icons.sector weight="duotone" className="size-7 text-ink3/60" />
          <p className="max-w-[22em] text-xs leading-relaxed text-ink3">
            Allocation appears once your holdings carry live prices — split by sector, from your real book.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div
            className="relative shrink-0"
            style={{ width: size, height: size }}
            onMouseLeave={() => {
              setActive(null);
              setTip(null);
            }}
          >
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
              {segs.map((seg, i) => {
                const len = Math.max(seg.weight * c - gap, 0.001);
                const dash = `${len} ${c - len}`;
                const offset = -acc * c;
                acc += seg.weight;
                const dim = active !== null && active !== i;
                return (
                  <circle
                    key={seg.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={stroke}
                    strokeDasharray={dash}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                    style={{ opacity: dim ? 0.4 : 1, cursor: "pointer", transition: "opacity .18s" }}
                    onMouseEnter={() => setActive(i)}
                    onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, i })}
                  />
                );
              })}
            </svg>
            {/* center summary — pointer-events-none so it never blocks hovering the ring */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {active === null ? (
                <>
                  <span className="num font-display text-xl font-extrabold text-ink">{segs.length}</span>
                  <span className="text-[0.65rem] text-ink3">sectors</span>
                </>
              ) : (
                <>
                  <span className="num font-display text-lg font-extrabold text-ink">{Math.round(segs[active].weight * 100)}%</span>
                  <span className="max-w-16 truncate text-center text-[0.62rem] text-ink3">{segs[active].label}</span>
                </>
              )}
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-1">
            {segs.map((s, i) => (
              <button
                key={s.key}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className="flex items-center gap-2 text-left"
              >
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                <span className="min-w-0 flex-1 truncate text-xs text-ink2">{s.label}</span>
                <span className="num text-xs font-medium text-ink">{(s.weight * 100).toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {segs.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
          <Stat label="Top-3" value={`${Math.round(div.top3 * 100)}%`} />
          <Stat label="Sectors" value={String(div.sectorCount)} />
          <Stat label="Largest" value={div.largest ? `${Math.round(div.largest.weight * 100)}%` : "—"} sub={div.largest?.symbol} />
        </div>
      )}

      {/* cursor-anchored tooltip — sector · weight % · value (portaled past card overflow) */}
      {tip &&
        segs[tip.i] &&
        createPortal(
          <div
            style={{ position: "fixed", ...tipPos(tip.x, tip.y), zIndex: 60 }}
            className="pointer-events-none max-w-[200px] rounded-lg border border-line2 bg-surface-3 px-2.5 py-1.5 text-xs shadow-lg"
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-[3px]" style={{ background: segs[tip.i].color }} />
              <span className="truncate font-medium text-ink">{segs[tip.i].label}</span>
            </div>
            <div className="num mt-0.5 text-ink3">
              {(segs[tip.i].weight * 100).toFixed(1)}% of book
              {totalPriced > 0 ? ` · ${formatINR(segs[tip.i].weight * totalPriced, { compact: true })}` : ""}
            </div>
          </div>,
          document.body,
        )}
    </CardShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">{label}</p>
      <p className="num mt-0.5 text-[15px] font-medium text-ink">{value}</p>
      {sub && <p className="num text-[10px] text-ink3">{sub}</p>}
    </div>
  );
}

/* ---------- Upcoming events — holdings-scoped (client filter of the market calendar) ---------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EVENT_LABEL: Record<string, string> = {
  earnings: "Earnings",
  dividend: "Dividend",
  agm: "AGM",
  board_meeting: "Board Meeting",
  bonus: "Bonus",
  split: "Split",
  buyback: "Buyback",
  rights: "Rights",
  record_date: "Record Date",
};
const IMPACT_TINT: Record<string, string> = {
  high: "text-danger bg-danger/10 border-danger/25",
  medium: "text-warning bg-warning/10 border-warning/25",
  low: "text-info bg-info/10 border-info/25",
};

function fmtDate(iso: string): { day: string; mon: string } {
  const [, m, d] = iso.split("-");
  return { day: d ?? "--", mon: MONTHS[Number(m) - 1] ?? "" };
}
function eventLabel(t: string): string {
  return EVENT_LABEL[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function eventDetail(e: CalendarEvent): string | null {
  if (e.eventType === "dividend") {
    const amt = e.dividendAmount != null ? `₹${e.dividendAmount}/sh` : null;
    const ex = e.exDate ? `ex ${fmtDate(e.exDate).mon} ${fmtDate(e.exDate).day}` : null;
    return [amt, ex].filter(Boolean).join(" · ") || null;
  }
  if (e.eventType === "bonus" && e.bonusRatio) return `Bonus ${e.bonusRatio}`;
  if (e.eventType === "split" && e.splitRatio) return `Split ${e.splitRatio}`;
  return null;
}

export function EventsCard() {
  const holdQ = useHoldings();
  const evQ = useEventsCalendar(90);
  const held = new Set((holdQ.data?.holdings ?? []).map((h) => h.symbol));
  // The calendar is already upcoming-first (eventDate asc, impact tiebreak); just keep held names.
  const mine = (evQ.data ?? []).filter((e) => held.has(e.symbol)).slice(0, 5);
  const loading = holdQ.isLoading || evQ.isLoading;

  return (
    <CardShell
      icon={Icons.calendar}
      title="Upcoming Events"
      subtitle="For your holdings"
      action={
        <Link href="/calendar" className="text-xs font-medium text-primary hover:underline">
          Calendar
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2/60" />
          ))}
        </div>
      ) : mine.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line2 bg-surface-2/40 px-4 py-8 text-center">
          <Icons.calendar weight="duotone" className="size-7 text-ink3/60" />
          <p className="max-w-[22em] text-xs leading-relaxed text-ink3">
            No upcoming events for your holdings in the next few months. The full market Calendar has
            every date.
          </p>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2/60 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-line3"
          >
            Open Calendar
            <Icons.arrowRight weight="bold" className="size-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {mine.map((e, i) => {
            const d = fmtDate(e.eventDate);
            const detail = eventDetail(e);
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-line2 bg-surface-2/40 p-2.5"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-line2 bg-surface-3/50 text-center leading-none">
                  <span className="num font-display text-xs font-bold text-ink">{d.day}</span>
                  <span className="text-[0.6rem] uppercase text-ink3">{d.mon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {e.symbol} <span className="font-normal text-ink3">· {eventLabel(e.eventType)}</span>
                  </p>
                  {detail && <p className="truncate text-xs text-ink3">{detail}</p>}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md border px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase",
                    IMPACT_TINT[e.impactLevel] ?? "text-ink3 border-line2",
                  )}
                >
                  {e.impactLevel}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

/* ---------- Watchlist preview (real /me/watchlist) ---------- */
export function WatchlistCard() {
  const { data, isLoading } = useWatchlist();
  const entries = [...(data ?? [])]
    .sort((a, b) => Number(b.favorite) - Number(a.favorite))
    .slice(0, 5);

  return (
    <CardShell
      icon={Icons.watchlist}
      title="Watchlist"
      subtitle="Stocks you're tracking"
      action={
        (data?.length ?? 0) > 0 ? (
          <Link href="/watchlist" className="text-xs font-medium text-primary hover:underline">
            Open
          </Link>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-2/60" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line2 bg-surface-2/40 px-4 py-8 text-center">
          <Icons.watchlist weight="duotone" className="size-7 text-ink3/60" />
          <p className="max-w-[22em] text-xs leading-relaxed text-ink3">
            Pin stocks to track how their health and price move since you got interested.
          </p>
          <Link
            href="/watchlist"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2/60 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-line3"
          >
            <Icons.plus weight="bold" className="size-3.5" />
            Pin a stock
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {entries.map((w, i) => {
              const color = w.health == null ? "var(--ink3)" : healthColorVar(w.health);
              const dayPct = w.dayChangePct;
              const up = (dayPct ?? 0) >= 0;
              return (
                <motion.div
                  key={w.stockId}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/research/stock-screener/${w.symbol}`}
                    className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-line2 hover:bg-surface-2/60"
                  >
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold"
                      style={{ color, background: `color-mix(in oklch, ${color} 14%, transparent)` }}
                      title={w.health == null ? "Not yet scored" : `Health ${Math.round(w.health)}`}
                    >
                      {w.health == null ? "—" : Math.round(w.health)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{w.symbol}</p>
                      <p className="truncate text-xs text-ink3">{w.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="num text-sm text-ink">
                        {w.price != null ? `₹${w.price.toLocaleString("en-IN")}` : "—"}
                      </p>
                      {dayPct != null ? (
                        <p className={cn("num text-xs", up ? "text-success" : "text-danger")}>{signPct(dayPct)}</p>
                      ) : (
                        <p className="text-xs text-ink3">no price</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <Link
            href="/watchlist"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line2 py-2 text-xs font-medium text-ink3 transition-colors hover:border-primary/40 hover:text-ink"
          >
            <Icons.plus weight="bold" className="size-3.5" />
            Pin a stock
          </Link>
        </>
      )}
    </CardShell>
  );
}
