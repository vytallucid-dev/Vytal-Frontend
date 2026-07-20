"use client";

// ─────────────────────────────────────────────────────────────
// ADMIN PANEL — the Data Control hub. Admin-only (gated by app/(main)/admin/
// layout.tsx). Holds the ingestion Control Hub + every data-source pipeline
// card; each card deep-links into its /admin/* detail page to trigger,
// backfill or inspect that flow. Built on the platform's FLAT editorial theme
// (solid surface-1/2 cards, hairline line borders, ink text scale, primary as
// the single accent) — the same language as the stock pages.
//
// Per-card "last run" + hero counts are REAL, from GET /api/v1/admin/pipelines
// (the newest finished background job / detection / manual inject per source) —
// no fabricated timestamps, statuses or record counts.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Icons, type Icon } from "@/lib/icons";
import { usePipelineStatus } from "@/lib/api/hooks/use-pipeline-status";

/* ─── Data flows (pipeline sources) ──────────────────────────────────────── */

interface DataFlow {
  href: string;
  title: string;
  description: string;
  icon: Icon;
}

const dataFlows: DataFlow[] = [
  {
    href: "/admin/ingestion-errors",
    title: "Ingestion Errors",
    description: "Detection-layer violations — fill admin-fixable values (cited) or flag for a code fix.",
    icon: Icons.warning,
  },
  {
    href: "/admin/retention",
    title: "Retention",
    description: "The nightly pruner's limits — floor-fenced, dry-run-previewed and audited before any change.",
    icon: Icons.database,
  },
  {
    href: "/admin/stock-prices",
    title: "Stock Prices",
    description: "End-of-day NSE Bhavcopy prices, deduped and inserted nightly.",
    icon: Icons.chartLine,
  },
  {
    href: "/admin/index-prices",
    title: "Index Prices",
    description: "End-of-day NSE index OHLC + valuation (ind_close_all). Display-only.",
    icon: Icons.graph,
  },
  {
    href: "/admin/quarterly-results",
    title: "Quarterly Results",
    description: "Latest filings parsed into clean financial statements.",
    icon: Icons.results,
  },
  {
    href: "/admin/casa",
    title: "CASA Ratios",
    description: "Quarterly CASA for the 12 scored banks — manual ingest, feeds banking F7.",
    icon: Icons.scales,
  },
  {
    href: "/admin/corporate-events",
    title: "Corporate Events",
    description: "Dividends, splits and bonuses upserted from the exchange.",
    icon: Icons.calendar,
  },
  {
    href: "/admin/insider-trades",
    title: "Insider Trades",
    description: "Promoter and designated-person activity, filtered to your universe.",
    icon: Icons.user,
  },
  {
    href: "/admin/block-deals",
    title: "Block Deals",
    description: "Bulk and block trade records ingested from exchange feeds.",
    icon: Icons.coins,
  },
  {
    href: "/admin/news-announcements",
    title: "News & Announcements",
    description: "NSE filings and Google News, enriched by the content extractor.",
    icon: Icons.news,
  },
  // ── THE NON-EQUITY LANES ─────────────────────────────────────────────────────
  // All four of these shipped CRON-ONLY. They were registered in the backend's pipeline registry —
  // each with a comment promising it would never become a "mystery cron" — but they had no card, no
  // manual trigger and no way to watch a run. A pipeline an operator cannot run is a pipeline they
  // cannot debug, and a promise in a comment is not a dashboard. These are the dashboard.
  {
    href: "/admin/mutual-funds",
    title: "Mutual Funds & ETFs",
    description: "AMFI NAV + identity, the exchange close for listed ETFs, and the compute-and-discard analytics fold.",
    icon: Icons.package,
  },
  {
    href: "/admin/reits",
    title: "REITs & InvITs",
    description: "Listed real-estate and infrastructure trusts — identity, close and distribution yield. Held, never scored.",
    icon: Icons.building,
  },
  {
    href: "/admin/govt-securities",
    title: "Government Securities",
    description: "G-secs, T-bills, SDLs and Sovereign Gold Bonds. Coupon and maturity year — never a fabricated date.",
    icon: Icons.shield,
  },
  {
    href: "/admin/corporate-bonds",
    title: "Corporate Bonds",
    description: "NCDs, debentures and municipal green bonds. Fenced on the ISIN, not the series. Rating honestly null.",
    icon: Icons.scales,
  },
  {
    href: "/admin/peer-group-metrics",
    title: "Peer Group Metrics",
    description: "Computed valuation and growth metrics across every peer group.",
    icon: Icons.chartBar,
  },
  {
    href: "/admin/shareholding-patterns",
    title: "Shareholding Patterns",
    description: "Quarterly promoter, FII, DII and public holding breakdowns.",
    icon: Icons.sector,
  },
];

/* ─── Time / trigger helpers (client-only) ───────────────────────────────── */

/** ISO → "just now" / "12 min ago" / "3 hrs ago" / "2 days ago" / "4 mo ago" / "1 yr ago". */
function relativeTime(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.round(months / 12);
  return `${years} yr${years === 1 ? "" : "s"} ago`;
}

/** Raw trigger audit → the manual-vs-cron distinction the operator cares about.
 *  triggeredBy is prefixed in the DB, e.g. "cron:daily-eod-prices", "user:aman",
 *  "hook:casa_inject", "seed:casa-5q-backfill" — so match on prefix, not equality. */
function triggerText(t: string | null | undefined): string | null {
  if (!t) return null;
  if (t === "detection") return "live detection";
  if (t.startsWith("cron")) return "cron";
  if (t.startsWith("hook:")) return "auto";
  if (t.startsWith("seed:")) return "seed";
  if (t === "admin_route" || t.startsWith("user:") || t.startsWith("fill:")) return "manual";
  return "manual";
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}
function olderThanDays(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() > days * 86_400_000;
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AdminPage() {
  const { data: pipelines } = usePipelineStatus();
  const loaded = !!pipelines;
  const statuses = pipelines ? Object.values(pipelines) : [];

  // Hero counts — all derived from the REAL pipeline status (no fabricated totals).
  const activeToday = statuses.filter((s) => s.lastRunAt && isToday(s.lastRunAt)).length;
  const idle = statuses.filter((s) => !s.lastRunAt || olderThanDays(s.lastRunAt, 7)).length;
  const lastActivityIso = statuses.reduce<string | null>((acc, s) => {
    if (!s.lastRunAt) return acc;
    return !acc || new Date(s.lastRunAt) > new Date(acc) ? s.lastRunAt : acc;
  }, null);

  const heroStats: { label: string; value: string; icon: Icon; mono?: boolean }[] = [
    { label: "Data sources", value: String(dataFlows.length), icon: Icons.building, mono: true },
    { label: "Active today", value: loaded ? String(activeToday) : "—", icon: Icons.bolt, mono: true },
    { label: "Idle 7d+", value: loaded ? String(idle) : "—", icon: Icons.clock, mono: true },
    {
      label: "Last activity",
      value: loaded ? (lastActivityIso ? relativeTime(lastActivityIso) : "None yet") : "—",
      icon: Icons.history,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-7"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Icons.shield weight="fill" className="size-3.5" />
                Admin · Control hub
              </div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Data <span className="text-primary">Control</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-ink2">
                Keep the terminal&apos;s data fresh — trigger, backfill and inspect
                every ingestion pipeline that feeds Vytal from one place.
              </p>
            </div>
            <Button asChild variant="outline" className="h-9 shrink-0">
              <Link href="/admin/stock-prices">
                <Icons.bolt weight="duotone" className="size-4" />
                Run a sync
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {heroStats.map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-surface-2 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <s.icon weight="duotone" className="size-4" />
                  </span>
                  <p className="text-[0.65rem] uppercase tracking-wider text-ink3">{s.label}</p>
                </div>
                <p
                  className={
                    s.mono
                      ? "num text-2xl font-bold text-ink sm:text-[1.65rem]"
                      : "font-display text-lg font-bold text-ink"
                  }
                >
                  {s.value}
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
            subtitle="Every ingestion flow feeds the terminal. Tap any source to trigger, backfill or inspect its jobs."
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dataFlows.map((flow, i) => {
            const key = flow.href.slice("/admin/".length);
            const status = pipelines?.[key];
            const trigger = triggerText(status?.triggeredBy);
            return (
              <Reveal key={flow.href} delay={i * 0.05}>
                <Link
                  href={flow.href}
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-line bg-surface-1 p-5 transition-colors hover:border-line3 hover:bg-surface-2"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <flow.icon weight="duotone" className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-bold tracking-tight text-ink">
                      {flow.title}
                    </h3>
                    <p className="mt-1 text-sm text-ink2">{flow.description}</p>
                  </div>

                  <div className="flex items-end justify-between gap-3 border-t border-line pt-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs text-ink3">
                        <Icons.clock weight="duotone" className="size-3.5 shrink-0" />
                        {!loaded ? (
                          <span>Last run: —</span>
                        ) : status?.lastRunAt ? (
                          <span>
                            Last run: <span className="text-ink2">{relativeTime(status.lastRunAt)}</span>
                          </span>
                        ) : (
                          <span>Never run</span>
                        )}
                      </p>
                      {loaded && status?.lastRunAt && trigger && (
                        <p className="mt-1 pl-5">
                          <span className="inline-flex items-center rounded-md border border-line2 bg-surface-3 px-1.5 py-0.5 text-[0.65rem] font-medium capitalize text-ink2">
                            {trigger}
                          </span>
                        </p>
                      )}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                      Manage
                      <Icons.arrowRight weight="bold" className="size-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
