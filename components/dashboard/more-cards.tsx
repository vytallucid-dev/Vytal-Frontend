"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Icons, type Icon } from "@/lib/icons";
import { sectorAllocation, upcomingEvents, watchlistPreview } from "@/lib/demo-data";
import { healthColorVar } from "@/lib/format";
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
    <div className={cn("glass flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
            <IconCmp weight="duotone" className="size-4 text-primary" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ---------- Allocation donut ---------- */
export function AllocationCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [active, setActive] = useState<number | null>(null);

  const size = 150;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <CardShell
      icon={Icons.sector}
      title="Allocation"
      subtitle="Where your money sits"
      action={
        <Link href="/portfolio" className="text-xs font-medium text-primary hover:underline">
          Rebalance
        </Link>
      }
    >
      <div ref={ref} className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {sectorAllocation.map((s, i) => {
              const len = (s.weight / 100) * c;
              const dash = `${len} ${c - len}`;
              const thisOffset = offset;
              offset -= len;
              const dim = active !== null && active !== i;
              return (
                <motion.circle
                  key={s.sector}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={active === i ? stroke + 4 : stroke}
                  strokeDasharray={dash}
                  initial={{ strokeDashoffset: c }}
                  animate={inView ? { strokeDashoffset: thisOffset, opacity: dim ? 0.35 : 1 } : {}}
                  transition={{ duration: 1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  style={{ cursor: "pointer" }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {active === null ? (
              <>
                <span className="font-display text-xl font-extrabold">6</span>
                <span className="text-[0.65rem] text-muted-foreground">sectors</span>
              </>
            ) : (
              <>
                <span className="font-display text-lg font-extrabold">{sectorAllocation[active].weight}%</span>
                <span className="max-w-[64px] truncate text-center text-[0.62rem] text-muted-foreground">
                  {sectorAllocation[active].sector}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-1">
          {sectorAllocation.map((s, i) => (
            <button
              key={s.sector}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className="flex items-center gap-2 text-left"
            >
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="flex-1 truncate text-xs text-muted-foreground">{s.sector}</span>
              <span className="font-mono text-xs font-medium">{s.weight}%</span>
            </button>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

/* ---------- Upcoming events ---------- */
const impactTint: Record<string, string> = {
  high: "text-danger bg-danger/10 border-danger/25",
  medium: "text-warning bg-warning/10 border-warning/25",
  low: "text-info bg-info/10 border-info/25",
};
export function EventsCard() {
  return (
    <CardShell
      icon={Icons.calendar}
      title="Upcoming Events"
      subtitle="On your radar this month"
      action={
        <Link href="/calendar" className="text-xs font-medium text-primary hover:underline">
          Calendar
        </Link>
      }
    >
      <div className="space-y-2">
        {upcomingEvents.map((e, i) => (
          <motion.div
            key={`${e.symbol}-${e.title}`}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-1/40 p-2.5"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border/70 bg-surface-2/50 text-center">
              <span className="font-display text-xs font-bold leading-none">{e.date.split(" ")[1]}</span>
              <span className="text-[0.6rem] uppercase text-muted-foreground">{e.date.split(" ")[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {e.symbol} <span className="font-normal text-muted-foreground">· {e.title}</span>
              </p>
              <p className="text-xs text-muted-foreground">{e.type}</p>
            </div>
            <span className={cn("rounded-md border px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase", impactTint[e.impact])}>
              {e.impact}
            </span>
          </motion.div>
        ))}
      </div>
    </CardShell>
  );
}

/* ---------- Watchlist preview ---------- */
export function WatchlistCard() {
  return (
    <CardShell
      icon={Icons.watchlist}
      title="Watchlist"
      subtitle="Stocks you're tracking"
      action={
        <Link href="/watchlist" className="text-xs font-medium text-primary hover:underline">
          Open
        </Link>
      }
    >
      <div className="space-y-1.5">
        {watchlistPreview.map((w, i) => {
          const up = w.change >= 0;
          return (
            <motion.div
              key={w.symbol}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-border/70 hover:bg-surface-1/50"
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold"
                style={{ color: healthColorVar(w.health), background: `color-mix(in oklch, ${healthColorVar(w.health)} 14%, transparent)` }}
              >
                {w.health}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{w.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{w.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">₹{w.price.toLocaleString("en-IN")}</p>
                <p className={cn("font-mono text-xs", up ? "text-success" : "text-danger")}>
                  {up ? "+" : ""}
                  {w.change}%
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <Link
        href="/watchlist"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Icons.plus weight="bold" className="size-3.5" />
        Add a stock
      </Link>
    </CardShell>
  );
}
