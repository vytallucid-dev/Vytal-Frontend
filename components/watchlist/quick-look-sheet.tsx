"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { WatchlistEntry } from "@/types/watchlist";
import type { PillarKey } from "@/types/health";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { useStockOhlcv } from "@/lib/api/hooks/use-stock-ohlcv";
import { useStockPrice } from "@/lib/api/hooks/use-stock-price";
import { useStockNews } from "@/lib/api/hooks/use-stock-news";
import { useStockEvents } from "@/lib/api/hooks/use-stock-events";
import { prepareStockFindings, accentVars } from "@/lib/findings";
import { PriceChart } from "@/components/stock-detail/price-chart";
import { useAlerts, useAlertMutations } from "@/lib/api/hooks/use-alerts";
import { AlertManageRow } from "@/components/alerts/alert-manage-row";
import type { Alert } from "@/types/alerts";
import { BAND_META, bandLabel, healthSinceAdded, priceSinceAdded } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────
// QUICK-LOOK SHEET — a lazy, per-stock research card that slides in on row click.
// It reuses the STOCK-PAGE reads (health snapshot · OHLCV · price view · news · events)
// so the list payload stays lean; nothing here is recomputed or fabricated. Descriptive
// only — NO price target, NO upside %, NO prediction anywhere. Unscored → price + chart +
// news, honest "not scored yet" for health / findings / metrics.
// ─────────────────────────────────────────────────────────────────────────────

const PILLAR_LABEL: Record<PillarKey, string> = {
  foundation: "Foundation",
  momentum: "Momentum",
  market: "Market",
  ownership: "Ownership",
};
const PILLAR_VAR: Record<PillarKey, string> = {
  foundation: "var(--p-found)",
  momentum: "var(--p-mom)",
  market: "var(--p-mkt)",
  ownership: "var(--p-own)",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtPrice = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const signPct = (v: number, d = 2) => `${v > 0 ? "+" : ""}${v.toFixed(d)}%`;
const pctClass = (v: number | null | undefined) =>
  v == null ? "text-ink3" : v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink3";

// ── a small section wrapper ──────────────────────────────────────────────────────
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="eyebrow">{title}</h3>
        {hint && <span className="text-[10.5px] text-ink3">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function NotScored({ what }: { what: string }) {
  return (
    <p className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-3 py-4 text-center text-[12px] text-ink3">
      {what} — not scored yet. We track price for this stock; Vytal scoring comes as coverage expands.
    </p>
  );
}

// ── 1 · first glance (renders instantly from the row entry; refines as reads land) ──
function FirstGlance({ entry }: { entry: WatchlistEntry }) {
  const health = useStockHealth(entry.symbol);
  // prefer the fresh snapshot when it lands; the row entry drives the instant paint
  const composite = health.data?.verdict?.composite ?? entry.health;
  const band = health.data?.verdict?.label.band ?? entry.band;
  const bandText = health.data?.verdict?.label.label ?? bandLabel(entry.band);
  const h = healthSinceAdded(entry);
  const p = priceSinceAdded(entry);

  return (
    <div className="px-5 pb-4 pt-2">
      <div className="flex items-start gap-4">
        {/* gauge — score in a band-tinted disc (colour off the STORED band, not rounded score) */}
        {entry.scored && band ? (
          <div
            className="grid size-16 shrink-0 place-items-center rounded-2xl border"
            style={{
              color: BAND_META[band].cssVar,
              background: `color-mix(in oklch, ${BAND_META[band].cssVar} 12%, transparent)`,
              borderColor: `color-mix(in oklch, ${BAND_META[band].cssVar} 32%, transparent)`,
            }}
          >
            <span className="num text-[26px] font-semibold leading-none">{composite ? Math.round(composite) : "—"}</span>
          </div>
        ) : (
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-line2 bg-surface-2 text-center text-[10px] leading-tight text-ink3">
            not
            <br />
            scored
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] text-ink3">{entry.sector ?? "—"}</p>
          {entry.scored && band ? (
            <p className="num text-[15px] font-semibold" style={{ color: BAND_META[band].cssVar }}>
              {bandText}
            </p>
          ) : (
            <p className="text-[14px] font-medium text-ink2">Not scored yet</p>
          )}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-[18px] font-semibold text-ink">
              {entry.price != null ? fmtPrice(entry.price) : "—"}
            </span>
            {entry.dayChangePct != null && (
              <span className={cn("num text-[12px]", pctClass(entry.dayChangePct))}>{signPct(entry.dayChangePct)} today</span>
            )}
          </div>
        </div>
      </div>

      {/* watching since + the since-you-added deltas (the soul, preserved) */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-surface-1 px-3.5 py-2.5">
        <span className="text-[11.5px] text-ink3">
          Watching since <span className="num text-ink2">{fmtDate(entry.addedAt)}</span>
        </span>
        {h && (
          <span className="text-[11.5px] text-ink2">
            {h.phrase}
            {h.delta != null && h.delta !== 0 && (
              <span className="num text-ink3"> ({h.delta > 0 ? "+" : ""}{h.delta} pts)</span>
            )}
          </span>
        )}
        {p && (
          <span className={cn("num text-[11.5px]", pctClass(p.pct))}>
            {p.pct > 0 ? "+" : ""}
            {p.pct.toFixed(1)}% since added
          </span>
        )}
      </div>
    </div>
  );
}

// ── 2 · price chart (TradingView / lightweight-charts engine, reused) ──────────────
function PriceChartSection({ symbol }: { symbol: string }) {
  const ohlcv = useStockOhlcv(symbol);
  const bars = ohlcv.data?.bars ?? [];
  return (
    <Section title="Price" hint="last 3 months · daily candles">
      {ohlcv.isLoading ? (
        <div className="shimmer h-[220px] w-full rounded-lg bg-surface-2" />
      ) : bars.length < 2 ? (
        <p className="py-8 text-center text-[12px] text-ink3">No price history to chart yet.</p>
      ) : (
        <PriceChart
          bars={bars}
          chartType="candlestick"
          timeframe="3M"
          emaToggles={{ 50: false, 100: false, 200: false }}
          bollinger={false}
          rsi={false}
          macd={false}
        />
      )}
    </Section>
  );
}

// ── 3 · key metrics — facts, NEVER targets/upside ──────────────────────────────────
function KeyMetrics({ entry }: { entry: WatchlistEntry }) {
  const price = useStockPrice(entry.symbol);
  const cur = price.data?.current;
  const ret = price.data?.stock.returns;
  const tierLabel =
    entry.tier === "large" ? "Large cap" : entry.tier === "mid" ? "Mid cap" : entry.tier === "small" ? "Small cap" : "—";

  const cells: { k: string; v: string; cls?: string }[] = [
    { k: "Market cap", v: cur?.marketCap != null ? `₹${Math.round(cur.marketCap).toLocaleString("en-IN")} Cr` : "—" },
    { k: "Cap tier", v: tierLabel },
    {
      k: "52-week range",
      v: cur?.week52Low != null && cur?.week52High != null ? `${fmtPrice(cur.week52Low)} – ${fmtPrice(cur.week52High)}` : "—",
    },
    { k: "From 52W high", v: cur?.pctFrom52WHigh != null ? signPct(cur.pctFrom52WHigh, 1) : "—", cls: pctClass(cur?.pctFrom52WHigh) },
    { k: "1M return", v: ret?.r1m != null ? signPct(ret.r1m, 1) : "—", cls: pctClass(ret?.r1m) },
    { k: "1Y return", v: ret?.r1y != null ? signPct(ret.r1y, 1) : "—", cls: pctClass(ret?.r1y) },
  ];

  return (
    <Section title="Key metrics" hint="facts, not valuation">
      {price.isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-12 rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {cells.map((c) => (
            <div key={c.k} className="rounded-lg border border-line bg-surface-1 px-3 py-2">
              <p className="text-[9.5px] uppercase tracking-[0.08em] text-ink3">{c.k}</p>
              <p className={cn("num mt-0.5 text-[13px] font-medium text-ink", c.cls)}>{c.v}</p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── 4 · Vytal health breakdown — composite + band + the 4 pillars (read-only) ───────
function HealthBreakdown({ entry }: { entry: WatchlistEntry }) {
  const health = useStockHealth(entry.symbol);
  const data = health.data;

  return (
    <Section title="Vytal health" hint="4-pillar composite">
      {health.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-9 rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : !entry.scored || !data?.scored || !data.verdict ? (
        <NotScored what="Health score" />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3">
            <span
              className="num rounded-lg px-2.5 py-1 text-[15px] font-semibold"
              style={{
                color: BAND_META[data.verdict.label.band].cssVar,
                background: `color-mix(in oklch, ${BAND_META[data.verdict.label.band].cssVar} 12%, transparent)`,
              }}
            >
              {data.verdict.composite}
            </span>
            <span className="num text-[13px] font-medium" style={{ color: BAND_META[data.verdict.label.band].cssVar }}>
              {data.verdict.label.label}
            </span>
          </div>
          <ul className="space-y-2">
            {data.pillars.map((p) => {
              const unavailable = p.state !== "scored";
              const pct = Math.max(0, Math.min(100, p.subtotal));
              return (
                <li key={p.pillar} className="flex items-center gap-3">
                  <span className="w-[74px] shrink-0 text-[11.5px] text-ink2">{PILLAR_LABEL[p.pillar]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                    {!unavailable && (
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PILLAR_VAR[p.pillar] }} />
                    )}
                  </div>
                  <span className="num w-12 shrink-0 text-right text-[12px] font-medium text-ink">
                    {unavailable ? "n/a" : Math.round(p.subtotal)}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Section>
  );
}

// ── 5 · findings — fired patterns + red flags, tone-styled, descriptive ─────────────
function FindingsList({ entry }: { entry: WatchlistEntry }) {
  const health = useStockHealth(entry.symbol);
  const data = health.data;
  const prepared = useMemo(() => {
    if (!data?.findings) return null;
    return prepareStockFindings(data.findings, { pondHot: data.verdict?.pondMask?.isHot ?? false });
  }, [data]);

  return (
    <Section title="Findings" hint={prepared && prepared.count > 0 ? `${prepared.count} fired` : undefined}>
      {health.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="shimmer h-14 rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : !entry.scored || !data?.scored ? (
        <NotScored what="Findings" />
      ) : !prepared || prepared.count === 0 ? (
        <p className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-3 py-4 text-center text-[12px] text-ink3">
          Nothing notable fired — steady, no divergence, no flag.
        </p>
      ) : (
        <ul className="space-y-2">
          {prepared.ordered.map((f) => {
            const v = accentVars(f.accent);
            return (
              <li
                key={f.key}
                className="rounded-lg border px-3 py-2.5"
                style={{ borderColor: v.bd, background: v.bg }}
              >
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full" style={{ background: v.color }} />
                  <span className="text-[12.5px] font-semibold" style={{ color: v.color }}>
                    {f.name}
                  </span>
                  {f.displayState !== "active" && (
                    <span className="rounded-[4px] border border-line2 px-1.5 py-px text-[8.5px] uppercase tracking-wider text-ink3">
                      {f.displayState === "dampened" ? "dampened" : "pending data"}
                    </span>
                  )}
                </div>
                {f.verdict && <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">{f.verdict}</p>}
                {/* The interpretive boundary — what this does NOT mean (Rules Spec card anatomy). */}
                <p className="mt-1 border-l-2 border-line2 pl-2 text-[11px] italic text-ink3">{f.doesntMean}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// ── 6 · news / events / corporate actions — quick recent list, honest-empty ─────────
function NewsEvents({ symbol }: { symbol: string }) {
  const news = useStockNews(symbol, { limit: 5, days: 120 });
  const events = useStockEvents(symbol, true, 180); // upcoming corporate actions

  const items = news.data?.data.news ?? [];
  const evs = events.data?.data.events ?? [];
  const loading = news.isLoading || events.isLoading;
  const empty = !loading && items.length === 0 && evs.length === 0;

  const evLabel = (e: (typeof evs)[number]) => {
    const t = e.eventType.replace(/_/g, " ");
    if (e.dividendAmount != null) return `Dividend ₹${e.dividendAmount}/sh`;
    if (e.bonusRatio) return `Bonus ${e.bonusRatio}`;
    if (e.splitRatio) return `Split ${e.splitRatio}`;
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  return (
    <Section title="News & events" hint="recent · upcoming">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer h-10 rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : empty ? (
        <p className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-3 py-4 text-center text-[12px] text-ink3">
          No recent news or upcoming events.
        </p>
      ) : (
        <div className="space-y-3">
          {evs.length > 0 && (
            <ul className="space-y-1.5">
              {evs.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-[12px]">
                  <span className="rounded-[4px] border border-p-mkt/30 bg-p-mkt/10 px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-p-mkt">
                    {e.isConfirmed ? "action" : "pending"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-ink2">{evLabel(e)}</span>
                  <span className="num shrink-0 text-[10.5px] text-ink3">{fmtDate(e.exDate ?? e.eventDate)}</span>
                </li>
              ))}
            </ul>
          )}
          <ul className="space-y-2">
            {items.map((n) => {
              const href = n.externalUrl ?? n.pdfUrl;
              const body = (
                <>
                  <div className="flex items-center gap-2">
                    {n.isHighImpact && <span className="size-1.5 shrink-0 rounded-full bg-high" />}
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink2">{n.headline}</span>
                    <span className="num shrink-0 text-[10.5px] text-ink3">{fmtDate(n.publishedAt)}</span>
                  </div>
                  {n.summary && <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink3">{n.summary}</p>}
                </>
              );
              return (
                <li key={n.id}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-2 py-1 transition-colors hover:bg-surface-2">
                      {body}
                    </a>
                  ) : (
                    <div className="px-2 py-1">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Section>
  );
}

// ── 6.5 · your alerts on this stock (list + add + edit/pause/delete) ────────────────
function AlertsSection({
  entry,
  onAdd,
  onEdit,
}: {
  entry: WatchlistEntry;
  onAdd: () => void;
  onEdit: (a: Alert) => void;
}) {
  const alertsQ = useAlerts();
  const { update, remove } = useAlertMutations();
  const [busyId, setBusyId] = useState<string | null>(null);
  const mine = useMemo(
    () => (alertsQ.data ?? []).filter((a) => a.stockId === entry.stockId),
    [alertsQ.data, entry.stockId],
  );

  const onToggle = (a: Alert) => {
    setBusyId(a.id);
    update.mutate({ id: a.id, body: { active: !a.active } }, { onSettled: () => setBusyId(null) });
  };
  const onDelete = (a: Alert) => {
    setBusyId(a.id);
    remove.mutate(a.id, { onSettled: () => setBusyId(null) });
  };

  return (
    <Section title="Your alerts" hint={mine.length > 0 ? `${mine.length} set` : undefined}>
      {alertsQ.isLoading ? (
        <div className="shimmer h-14 rounded-lg bg-surface-2" />
      ) : mine.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-3 py-4 text-center">
          <p className="text-[12px] text-ink3">No alerts on {entry.symbol} yet.</p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3 text-[12px] font-medium text-ink2 transition-colors hover:border-line3 hover:text-ink"
          >
            <Icons.bell weight="duotone" className="size-3.5" /> Set an alert
          </button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line/60 overflow-hidden rounded-lg border border-line">
            {mine.map((a) => (
              <AlertManageRow
                key={a.id}
                alert={a}
                busy={busyId === a.id}
                showSymbol={false}
                className="px-3"
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
          <button
            type="button"
            onClick={onAdd}
            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3 text-[12px] font-medium text-ink2 transition-colors hover:border-line3 hover:text-ink"
          >
            <Icons.plus className="size-3.5" /> Add another alert
          </button>
        </>
      )}
    </Section>
  );
}

// ── 7 · actions ─────────────────────────────────────────────────────────────────
function Actions({
  onFullAnalysis,
  onAddToPortfolio,
  onSetAlert,
}: {
  onFullAnalysis: () => void;
  onAddToPortfolio: () => void;
  onSetAlert: () => void;
}) {
  return (
    <div className="sticky bottom-0 mt-auto border-t border-line bg-surface-1/95 px-5 py-3 backdrop-blur">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onFullAnalysis}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-110"
        >
          Full analysis <Icons.arrowRight weight="bold" className="size-3.5" />
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAddToPortfolio}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-3 text-[12.5px] font-medium text-ink2 transition-colors hover:border-line3 hover:text-ink"
          >
            <Icons.plus className="size-3.5" /> Add to portfolio
          </button>
          <button
            type="button"
            onClick={onSetAlert}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-3 text-[12.5px] font-medium text-ink2 transition-colors hover:border-line3 hover:text-ink"
          >
            <Icons.bell weight="duotone" className="size-3.5" /> Set alert
          </button>
        </div>
      </div>
    </div>
  );
}

// ── the body (only mounted while the sheet is open/animating) ───────────────────────
function Body({
  entry,
  onFullAnalysis,
  onAddToPortfolio,
  onSetAlert,
  onEditAlert,
}: {
  entry: WatchlistEntry;
  onFullAnalysis: () => void;
  onAddToPortfolio: () => void;
  onSetAlert: () => void;
  onEditAlert: (a: Alert) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-5 pb-3 pt-5">
        <SheetTitle className="font-display text-[20px] font-semibold text-ink">{entry.symbol}</SheetTitle>
        <SheetDescription className="truncate text-[12.5px] text-ink3">{entry.name}</SheetDescription>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <FirstGlance entry={entry} />
        <AlertsSection entry={entry} onAdd={onSetAlert} onEdit={onEditAlert} />
        <PriceChartSection symbol={entry.symbol} />
        <KeyMetrics entry={entry} />
        <HealthBreakdown entry={entry} />
        <FindingsList entry={entry} />
        <NewsEvents symbol={entry.symbol} />
      </div>
      <Actions onFullAnalysis={onFullAnalysis} onAddToPortfolio={onAddToPortfolio} onSetAlert={onSetAlert} />
    </div>
  );
}

export function QuickLookSheet({
  entry,
  onOpenChange,
  onAddToPortfolio,
  onSetAlert,
  onEditAlert,
}: {
  entry: WatchlistEntry | null;
  onOpenChange: (open: boolean) => void;
  onAddToPortfolio: (symbol: string) => void;
  onSetAlert: (entry: WatchlistEntry) => void;
  onEditAlert: (alert: Alert) => void;
}) {
  const router = useRouter();
  // hold the last entry through the close animation so the body doesn't flash empty
  const [held, setHeld] = useState<WatchlistEntry | null>(null);
  useEffect(() => {
    if (entry) setHeld(entry);
  }, [entry]);
  const shown = entry ?? held;

  return (
    <Sheet open={!!entry} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 border-line bg-surface-1 p-0 sm:max-w-xl">
        {shown && (
          <Body
            entry={shown}
            onFullAnalysis={() => {
              onOpenChange(false);
              router.push(`/research/stock-screener/${encodeURIComponent(shown.symbol)}`);
            }}
            onAddToPortfolio={() => onAddToPortfolio(shown.symbol)}
            onSetAlert={() => onSetAlert(shown)}
            onEditAlert={onEditAlert}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
