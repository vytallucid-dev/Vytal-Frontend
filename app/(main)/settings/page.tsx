"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Icons, type Icon } from "@/lib/icons";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ─── Data flows (8 sub-routes) ──────────────────────────────────────────── */

type FlowStatus = "healthy" | "running" | "stale";

interface DataFlow {
  href: string;
  title: string;
  description: string;
  icon: Icon;
  lastSync: string;
  status: FlowStatus;
  recordsToday: number;
}

const dataFlows: DataFlow[] = [
  {
    href: "/settings/stock-prices",
    title: "Stock Prices",
    description: "End-of-day NSE Bhavcopy prices, deduped and inserted nightly.",
    icon: Icons.chartLine,
    lastSync: "2h ago",
    status: "healthy",
    recordsToday: 2148,
  },
  {
    href: "/settings/index-prices",
    title: "Index Prices",
    description: "End-of-day NSE index OHLC + valuation (ind_close_all). Display-only.",
    icon: Icons.graph,
    lastSync: "2h ago",
    status: "healthy",
    recordsToday: 143,
  },
  {
    href: "/settings/quarterly-results",
    title: "Quarterly Results",
    description: "Latest filings parsed into clean financial statements.",
    icon: Icons.results,
    lastSync: "5h ago",
    status: "healthy",
    recordsToday: 312,
  },
  {
    href: "/settings/corporate-events",
    title: "Corporate Events",
    description: "Dividends, splits and bonuses upserted from the exchange.",
    icon: Icons.calendar,
    lastSync: "1h ago",
    status: "running",
    recordsToday: 87,
  },
  {
    href: "/settings/insider-trades",
    title: "Insider Trades",
    description: "Promoter and designated-person activity, filtered to your universe.",
    icon: Icons.user,
    lastSync: "3h ago",
    status: "healthy",
    recordsToday: 54,
  },
  {
    href: "/settings/block-deals",
    title: "Block Deals",
    description: "Bulk and block trade records ingested from exchange feeds.",
    icon: Icons.coins,
    lastSync: "4h ago",
    status: "healthy",
    recordsToday: 129,
  },
  {
    href: "/settings/news-announcements",
    title: "News & Announcements",
    description: "NSE filings and Google News, enriched by the content extractor.",
    icon: Icons.news,
    lastSync: "12m ago",
    status: "running",
    recordsToday: 643,
  },
  {
    href: "/settings/peer-group-metrics",
    title: "Peer Group Metrics",
    description: "Computed valuation and growth metrics across every peer group.",
    icon: Icons.chartBar,
    lastSync: "2d ago",
    status: "stale",
    recordsToday: 0,
  },
  {
    href: "/settings/shareholding-patterns",
    title: "Shareholding Patterns",
    description: "Quarterly promoter, FII, DII and public holding breakdowns.",
    icon: Icons.sector,
    lastSync: "9d ago",
    status: "stale",
    recordsToday: 0,
  },
];

/* ─── Status presentation ────────────────────────────────────────────────── */

const statusMeta: Record<
  FlowStatus,
  { label: string; dot: string; text: string; pulse?: boolean }
> = {
  healthy: { label: "Healthy", dot: "bg-success", text: "text-success" },
  running: { label: "Syncing", dot: "bg-warning", text: "text-warning", pulse: true },
  stale: { label: "Stale", dot: "bg-danger", text: "text-danger" },
};

/* ─── Preference toggles ─────────────────────────────────────────────────── */

interface Preference {
  key: string;
  icon: Icon;
  label: string;
  description: string;
  defaultOn: boolean;
}

const preferenceDefs: Preference[] = [
  {
    key: "priceAlerts",
    icon: Icons.bell,
    label: "Price alerts",
    description: "Ping me when a watched stock crosses my target or breaks a support level.",
    defaultOn: true,
  },
  {
    key: "healthAlerts",
    icon: Icons.health,
    label: "Health-score change alerts",
    description: "Notify me when a holding's health score moves between bands.",
    defaultOn: true,
  },
  {
    key: "weeklyDigest",
    icon: Icons.news,
    label: "Weekly digest email",
    description: "A Monday-morning recap of your portfolio, the market and key signals.",
    defaultOn: false,
  },
  {
    key: "earningsReminders",
    icon: Icons.calendar,
    label: "Earnings reminders",
    description: "A heads-up the day before any holding reports quarterly results.",
    defaultOn: true,
  },
];

/* ─── Toggle switch ──────────────────────────────────────────────────────── */

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-300",
        on ? "border-primary/40 bg-primary/80" : "border-border/70 bg-surface-2"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        className={cn(
          "absolute size-4 rounded-full bg-foreground shadow-sm",
          on ? "right-1" : "left-1"
        )}
      />
    </button>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(preferenceDefs.map((p) => [p.key, p.defaultOn]))
  );

  const togglePref = (key: string) =>
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  const recordsToday = dataFlows.reduce((a, f) => a + f.recordsToday, 0);
  const syncsToday = 36;

  const heroStats = [
    { label: "Data sources", value: dataFlows.length, icon: Icons.building, suffix: "" },
    { label: "Syncs today", value: syncsToday, icon: Icons.bolt, suffix: "" },
    {
      label: "Records ingested",
      value: recordsToday,
      icon: Icons.chartBar,
      suffix: "",
      animate: true,
    },
    { label: "Uptime", value: "99.9%", icon: Icons.shield, suffix: "" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-7"
      >
        <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-20" />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface-1/40 px-3 py-1 text-xs font-medium text-primary">
                <Icons.settings weight="duotone" className="size-3.5" />
                Control hub
              </div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Data &amp; <span className="text-gradient">Settings</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Keep the terminal&apos;s data fresh and tune how InvestIQ works for you —
                manage every ingestion pipeline and fine-tune your experience from one place.
              </p>
            </div>
            <Button asChild variant="outline" className="h-9 shrink-0">
              <Link href="/settings/stock-prices">
                <Icons.bolt weight="duotone" className="size-4" />
                Run a sync
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {heroStats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/70 bg-surface-1/40 p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
                    <s.icon weight="duotone" className="size-4" />
                  </span>
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                </div>
                <p className="font-display text-2xl font-bold sm:text-[1.65rem]">
                  {s.animate ? (
                    <AnimatedNumber value={s.value as number} />
                  ) : (
                    s.value
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Data sources ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <Reveal>
          <SectionHeading
            eyebrow="Pipelines"
            icon={Icons.health}
            title="Data sources"
            subtitle="Eight ingestion flows feed the terminal. Tap any source to trigger, backfill or inspect its jobs."
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dataFlows.map((flow, i) => {
            const meta = statusMeta[flow.status];
            return (
              <Reveal key={flow.href} delay={i * 0.05}>
                <SpotlightCard className="h-full">
                  <Link
                    href={flow.href}
                    className="flex h-full flex-col gap-4 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                        <flow.icon weight="duotone" className="size-5" />
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface-1/50 px-2.5 py-1 text-[0.65rem] font-semibold",
                          meta.text
                        )}
                      >
                        <span className="relative flex size-2">
                          {meta.pulse && (
                            <span
                              className={cn(
                                "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                                meta.dot
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "relative inline-flex size-2 rounded-full",
                              meta.dot
                            )}
                          />
                        </span>
                        {meta.label}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-bold tracking-tight">
                        {flow.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {flow.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icons.clock weight="duotone" className="size-3.5" />
                          Last sync: {flow.lastSync}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground/80">
                          {flow.recordsToday > 0
                            ? `${flow.recordsToday.toLocaleString("en-IN")} records today`
                            : "No records today"}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                        Manage
                        <Icons.arrowRight weight="bold" className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Preferences + Account ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Preferences */}
        <Reveal className="lg:col-span-2">
          <div className="glass h-full rounded-3xl border border-border/70 p-5 sm:p-6">
            <SectionHeading
              eyebrow="Preferences"
              icon={Icons.bell}
              title="Notifications & alerts"
              subtitle="Choose what the terminal nudges you about."
            />

            <div className="mt-5 space-y-2.5">
              {preferenceDefs.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface-1/40 p-3.5 sm:gap-4"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <p.icon weight="duotone" className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                  <Toggle
                    on={prefs[p.key]}
                    onToggle={() => togglePref(p.key)}
                    label={p.label}
                  />
                </div>
              ))}
            </div>

            {/* Appearance / theme row */}
            <div className="mt-5">
              <SectionHeading
                eyebrow="Appearance"
                icon={Icons.spark}
                title="Theme"
              />
              <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface-1/40 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icons.crown weight="duotone" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Midnight Aurora</p>
                    <p className="text-xs text-muted-foreground">
                      Accent currently set to brand primary.
                    </p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <Icons.shield weight="duotone" className="size-3.5 text-primary" />
                  Dark theme only
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-muted-foreground/80">
                <Icons.info weight="duotone" className="size-3.5 shrink-0 text-info" />
                InvestIQ is crafted as a dark-only terminal — a light mode isn&apos;t available yet.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Account */}
        <Reveal delay={0.05}>
          <div className="glass-strong relative h-full overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-6">
            <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-20" />
            <SectionHeading eyebrow="Account" icon={Icons.user} title="Your profile" />

            <div className="mt-5 flex flex-col items-center text-center">
              <div className="grid size-20 place-items-center rounded-full bg-linear-to-br from-primary via-primary/70 to-accent font-display text-2xl font-extrabold text-primary-foreground shadow-[0_8px_30px_-8px_var(--glow)]">
                AI
              </div>
              <p className="mt-3 font-display text-xl font-bold">Aarav Investor</p>
              <p className="text-sm text-muted-foreground">ajmix06@gmail.com</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Icons.crown weight="fill" className="size-3.5" />
                InvestIQ Pro
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-surface-1/40 p-3 text-center">
                <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Member since
                </p>
                <p className="font-display text-base font-bold">2023</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-surface-1/40 p-3 text-center">
                <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Plan value
                </p>
                <p className="font-display text-base font-bold">
                  {formatINR(2499, { compact: true })}/yr
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button variant="gradient" className="w-full">
                <Icons.crown weight="fill" className="size-4" />
                Manage plan
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground">
                <Icons.settings weight="duotone" className="size-4" />
                Account settings
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
