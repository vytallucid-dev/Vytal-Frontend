"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Icons, type Icon } from "@/lib/icons";
import { Sparkline } from "@/components/ui/sparkline";
import { AlertsSheet } from "@/components/alerts/alerts-bell";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { useAlertEvents } from "@/lib/api/hooks/use-alerts";
import { useStockSpark } from "@/lib/api/hooks/use-stock-ohlcv";
import { useMarketNews } from "@/lib/api/hooks/use-market-news";
import { STOCK_BAND_LABEL } from "@/components/portfolio/lib";
import { sparkFromBars } from "@/components/watchlist/lib";
import { healthColorVar, formatINR } from "@/lib/format";
import { timeAgo, signPct } from "./lib";
import { cn } from "@/lib/utils";
import type { Holding } from "@/types/portfolio";
import type { ReactNode } from "react";

/* ---------- shared shell — aligned to the app's card idiom ---------- */
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
        "flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-1 p-5 sm:p-6",
        className,
      )}
    >
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

/** Health chip — INTEGER score in the stored band's colour; unscored shows a neutral
 *  dash (never a fabricated band colour). */
function HealthChip({ health, band }: { health: number | null; band: string | null }) {
  const color = health == null ? "var(--ink3)" : healthColorVar(health);
  return (
    <span
      className="grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold"
      style={{ color, background: `color-mix(in oklch, ${color} 14%, transparent)` }}
      title={
        health == null
          ? "Not yet scored"
          : `Health ${Math.round(health)}${band ? ` · ${STOCK_BAND_LABEL[band as keyof typeof STOCK_BAND_LABEL] ?? band}` : ""}`
      }
    >
      {health == null ? "—" : Math.round(health)}
    </span>
  );
}

function EmptyRow({ icon: IconCmp, text, cta, href }: { icon: Icon; text: string; cta: string; href: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line2 bg-surface-2/40 px-4 py-8 text-center">
      <IconCmp weight="duotone" className="size-7 text-ink3/60" />
      <p className="max-w-[22em] text-xs leading-relaxed text-ink3">{text}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2/60 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-line3"
      >
        {cta}
        <Icons.arrowRight weight="bold" className="size-3" />
      </Link>
    </div>
  );
}

function RowsSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-2/60" />
      ))}
    </div>
  );
}

/* ---------- Top Holdings ---------- */
// One row calls the 7-SESSION spark read (cache key ["stock", symbol, "spark"] — deliberately NOT
// the 365-session ["stock", symbol, "ohlcv"] the chart surfaces use) for its sparkline. Honest-omit
// <3 pts. This row draws 7 bars; it used to download a year of them to do it.
function HoldingRow({ h, i }: { h: Holding; i: number }) {
  const ohlcv = useStockSpark(h.symbol);
  const spark = sparkFromBars(ohlcv.data?.bars);
  const dayPct = h.dayChangePct;
  const up = (dayPct ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05 }}
    >
      <Link
        href={`/research/stock-screener/${h.symbol}`}
        className="group flex items-center gap-2.5 rounded-xl border border-transparent p-2 transition-colors hover:border-line2 hover:bg-surface-2/60 sm:gap-3"
      >
        <HealthChip health={h.health} band={h.band} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{h.symbol}</p>
          <p className="truncate text-xs text-ink3">{h.name}</p>
        </div>
        {spark ? (
          <Sparkline data={spark.closes} width={60} height={26} className="hidden shrink-0 min-[400px]:block" />
        ) : (
          <span className="hidden w-15 min-[400px]:block" />
        )}
        <div className="w-20 shrink-0 text-right sm:w-24">
          <p className="num text-sm text-ink">
            {h.marketValue != null ? formatINR(h.marketValue, { compact: true }) : "—"}
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
}

export function HoldingsCard() {
  const { data, isLoading } = useHoldings();
  const holdings = data?.holdings ?? [];
  const top = [...holdings].sort((a, b) => b.weight - a.weight).slice(0, 5);

  return (
    <CardShell
      icon={Icons.portfolio}
      title="Top Holdings"
      subtitle="Your largest positions"
      action={
        holdings.length > 0 ? (
          <Link href="/portfolio?tab=holdings" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        ) : undefined
      }
    >
      {isLoading ? (
        <RowsSkeleton />
      ) : top.length === 0 ? (
        <EmptyRow
          icon={Icons.portfolio}
          text="Add your holdings and your largest positions — with their health and today's move — surface here."
          cta="Add transactions"
          href="/portfolio"
        />
      ) : (
        <div className="space-y-1.5">
          {top.map((h, i) => (
            <HoldingRow key={h.symbol} h={h} i={i} />
          ))}
        </div>
      )}
    </CardShell>
  );
}

/* ---------- Market News — real cross-stock feed (high-impact first, then recent) ---------- */
export function NewsCard() {
  const { data, isLoading } = useMarketNews(7);
  const items = (data ?? []).slice(0, 6);

  return (
    <CardShell icon={Icons.news} title="Market News" subtitle="High-impact disclosures & press">
      {isLoading ? (
        <RowsSkeleton n={5} />
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-line2 bg-surface-2/40 px-4 py-10 text-center">
          <Icons.news weight="duotone" className="size-7 text-ink3/60" />
          <p className="text-xs leading-relaxed text-ink3">
            No market news in the last few days. Per-stock disclosures are always on each stock&apos;s page.
          </p>
        </div>
      ) : (
        <div className="-mx-1 space-y-0.5">
          {items.map((n, i) => {
            // NSE filing headlines are a raw type bucket; the real "what happened" is the summary.
            const title = n.sourceType === "nse_announcement" ? n.summary ?? n.headline : n.headline;
            const src = n.sourceType === "google_news" ? n.category ?? "Press" : "NSE filing";
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/research/stock-screener/${n.symbol}?tab=news`}
                  className="block rounded-xl px-2 py-2 transition-colors hover:bg-surface-2/60"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {n.isHighImpact && (
                      <span className="rounded bg-danger/12 px-1.5 py-px text-[0.6rem] font-semibold uppercase tracking-wide text-danger">
                        High impact
                      </span>
                    )}
                    <span className="text-xs font-semibold text-ink">{n.symbol}</span>
                    <span className="size-1 rounded-full bg-ink3/40" />
                    <span className="text-xs text-ink3">
                      {src}
                      {n.sector ? ` · ${n.sector}` : ""} · {timeAgo(n.publishedAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-ink">{title}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

/* ---------- Recent Alerts — the real fired-events feed ---------- */
export function AlertsCard() {
  const { data, isLoading } = useAlertEvents(8);
  const events = data ?? [];
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <>
    <CardShell
      icon={Icons.bell}
      title="Recent Alerts"
      subtitle="Alerts that crossed recently"
      action={
        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="cursor-pointer text-xs font-medium text-primary hover:underline"
        >
          Manage
        </button>
      }
    >
      {isLoading ? (
        <RowsSkeleton n={3} />
      ) : events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-line2 bg-surface-2/40 px-4 py-8 text-center">
          <Icons.bell weight="duotone" className="size-7 text-ink3/60" />
          <p className="text-xs leading-relaxed text-ink3">
            Watching — nothing has crossed yet. Set price, health-band or finding alerts from a
            stock&apos;s page or your watchlist, and fired ones land here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-line2 bg-surface-2/40 p-2.5"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icons.bell weight="duotone" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{e.symbol ?? "—"}</p>
                <p className="truncate text-xs text-ink3">{e.snapshot}</p>
              </div>
              <span className="shrink-0 text-xs text-ink3">{timeAgo(e.firedAt)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </CardShell>
    <AlertsSheet open={manageOpen} onOpenChange={setManageOpen} />
    </>
  );
}

/* ---------- AI Insights — honest stub (the AI layer isn't built) ---------- */
export function InsightsCard() {
  return (
    <CardShell
      icon={Icons.brain}
      title="AI Insights"
      subtitle="Reads on your book"
      action={
        <span className="rounded-full border border-line bg-surface-2/60 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink3">
          Coming soon
        </span>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line2 bg-surface-2/40 px-6 py-12 text-center">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Icons.brain weight="duotone" className="size-5 text-primary" />
        </span>
        <p className="font-display text-base font-semibold text-ink">AI insights are coming</p>
        <p className="max-w-lg text-xs leading-relaxed text-ink3">
          A layer that reads your real portfolio health, allocation and fired findings into plain
          language is in progress. Until it&apos;s built we show nothing here — no generated advice,
          no price targets, no fabricated calls.
        </p>
      </div>
    </CardShell>
  );
}
