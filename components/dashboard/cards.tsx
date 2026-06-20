"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkline } from "@/components/ui/sparkline";
import { Icons, type Icon } from "@/lib/icons";
import {
  topHoldings,
  trendingToday,
  marketNews,
  recentAlerts,
  aiInsights,
} from "@/lib/demo-data";
import { healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/* ---------- shared shell ---------- */
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
    <div
      className={cn(
        "glass flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-6",
        className
      )}
    >
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

function HealthChip({ score }: { score: number }) {
  return (
    <span
      className="grid size-7 place-items-center rounded-lg text-xs font-bold"
      style={{
        color: healthColorVar(score),
        background: `color-mix(in oklch, ${healthColorVar(score)} 14%, transparent)`,
      }}
      title={`Health ${score}`}
    >
      {score}
    </span>
  );
}

/* ---------- Top Holdings ---------- */
export function HoldingsCard() {
  return (
    <CardShell
      icon={Icons.portfolio}
      title="Top Holdings"
      subtitle="Your largest positions"
      action={
        <Link
          href="/portfolio"
          className="text-xs font-medium text-primary hover:underline"
        >
          View all
        </Link>
      }
    >
      <div className="space-y-1.5">
        {topHoldings.map((h, i) => {
          const up = h.day >= 0;
          return (
            <motion.div
              key={h.symbol}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-border/70 hover:bg-surface-1/50"
            >
              <HealthChip score={h.health} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{h.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{h.name}</p>
              </div>
              <Sparkline data={h.spark} width={60} height={26} />
              <div className="w-20 text-right">
                <p className="font-mono text-sm">₹{(h.value / 1000).toFixed(1)}K</p>
                <p
                  className={cn(
                    "font-mono text-xs",
                    up ? "text-success" : "text-danger"
                  )}
                >
                  {up ? "+" : ""}
                  {h.day}%
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </CardShell>
  );
}

/* ---------- Trending Today ---------- */
export function TrendingCard() {
  return (
    <CardShell icon={Icons.fire} title="Trending Today" subtitle="Movers worth a look">
      <div className="space-y-3">
        {trendingToday.map((t, i) => {
          const up = t.change >= 0;
          return (
            <motion.div
              key={t.symbol}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border/60 bg-surface-1/40 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HealthChip score={t.health} />
                  <div>
                    <p className="text-sm font-semibold">{t.symbol}</p>
                    <p className="text-xs text-muted-foreground">{t.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">₹{t.price.toLocaleString("en-IN")}</p>
                  <p className={cn("font-mono text-xs", up ? "text-success" : "text-danger")}>
                    {up ? "+" : ""}
                    {t.change}%
                  </p>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{t.reason}</p>
            </motion.div>
          );
        })}
      </div>
    </CardShell>
  );
}

/* ---------- Market News ---------- */
const impactTint: Record<string, string> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-muted-foreground",
};
export function NewsCard() {
  return (
    <CardShell icon={Icons.news} title="Market Pulse" subtitle="What's moving markets now">
      <div className="-mx-1 space-y-1">
        {marketNews.map((n, i) => (
          <motion.a
            key={n.id}
            href="#"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="block rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-1/60"
          >
            <div className="flex items-center gap-2">
              <span className={cn("text-[0.65rem] font-semibold uppercase tracking-wider", impactTint[n.impact])}>
                {n.tag}
              </span>
              <span className="size-1 rounded-full bg-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">{n.source} · {n.time}</span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug">{n.title}</p>
          </motion.a>
        ))}
      </div>
    </CardShell>
  );
}

/* ---------- Recent Alerts ---------- */
const alertIcon: Record<string, Icon> = {
  target: Icons.target,
  health: Icons.health,
  move: Icons.pulse,
  event: Icons.calendar,
};
export function AlertsCard() {
  return (
    <CardShell
      icon={Icons.bell}
      title="Recent Alerts"
      subtitle="Triggered in the last 24h"
      action={
        <Link href="/calendar" className="text-xs font-medium text-primary hover:underline">
          Manage
        </Link>
      }
    >
      <div className="space-y-2">
        {recentAlerts.map((a, i) => {
          const AIcon = alertIcon[a.kind] ?? Icons.bell;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-1/40 p-2.5"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <AIcon weight="duotone" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{a.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{a.text}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{a.time}</span>
            </motion.div>
          );
        })}
      </div>
    </CardShell>
  );
}

/* ---------- AI Insights ---------- */
const priorityTint: Record<string, string> = {
  high: "border-danger/25 bg-danger/8 text-danger",
  medium: "border-warning/25 bg-warning/8 text-warning",
  low: "border-info/25 bg-info/8 text-info",
};
export function InsightsCard() {
  return (
    <CardShell
      icon={Icons.brain}
      title="AI Insights"
      subtitle="Personalized for your book"
      action={
        <span className="flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          Live
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {aiInsights.map((ins, i) => (
          <motion.div
            key={ins.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="flex flex-col rounded-2xl border border-border/60 bg-surface-1/40 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-md bg-surface-2/70 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                {ins.tag}
              </span>
              <span
                className={cn(
                  "rounded-md border px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase",
                  priorityTint[ins.priority]
                )}
              >
                {ins.priority}
              </span>
            </div>
            <p className="text-sm font-semibold">{ins.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ins.body}</p>
          </motion.div>
        ))}
      </div>
    </CardShell>
  );
}
