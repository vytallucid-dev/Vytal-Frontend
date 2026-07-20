"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWatchlist, useWatchlistMutations } from "@/lib/api/hooks/use-watchlist";
import { useAlerts } from "@/lib/api/hooks/use-alerts";
import { useStockOhlcv } from "@/lib/api/hooks/use-stock-ohlcv";
import type { Alert } from "@/types/alerts";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Sparkline } from "@/components/ui/sparkline";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { WatchlistEntry } from "@/types/watchlist";
import { TransactionSheet } from "@/components/portfolio/transaction-sheet";
import { CreateAlertModal } from "@/components/alerts/create-alert-modal";
import {
  BAND_META,
  healthSinceAdded,
  priceSinceAdded,
  sortWatchlist,
  sparkFromBars,
  watchlistSummary,
  type SortDir,
  type WatchSortKey,
} from "./lib";
import { AddToWatchlist } from "./add-stock";
import { QuickLookSheet } from "./quick-look-sheet";

// ─────────────────────────────────────────────────────────────────────────────
// WATCHLIST v2 — the research surface. Richer row (star favorites · health · price ·
// 1D/7D · the since-you-added health-delta hero · 7d sparkline) and a lazy quick-look
// sheet on row click. Read-only over the read-join; the sparkline/7D reuse the per-stock
// OHLCV read (shared with the sheet chart), so the list payload stays lean.
// ─────────────────────────────────────────────────────────────────────────────

const fmtPrice = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const signedPts = (n: number) => `${n > 0 ? "+" : ""}${n} pts`;
const moveColor = (d: "up" | "down" | "flat") =>
  d === "up" ? "var(--rec)" : d === "down" ? "var(--high)" : "var(--ink3)";
const pctCell = (v: number | null) =>
  v == null ? "text-ink3" : v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink3";
const fmtPct = (v: number | null, d = 1) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(d)}%`);
// ₹Cr, compact for the big caps (≥1 lakh cr → "₹X.XL Cr"), grouped otherwise.
const fmtMktCap = (v: number | null) =>
  v == null ? "—" : v >= 1e5 ? `₹${(v / 1e5).toFixed(2)}L Cr` : `₹${Math.round(v).toLocaleString("en-IN")} Cr`;

// ── the since-you-added health-delta hero (the soul, preserved) ─────────────────
function SinceAdded({ entry, compact, align = "center" }: { entry: WatchlistEntry; compact?: boolean; align?: "center" | "start" }) {
  const h = healthSinceAdded(entry);
  const p = priceSinceAdded(entry);
  const alignCls = align === "start" ? "items-start" : "items-center";
  if (!h) {
    return p ? (
      <div className={cn("flex flex-col gap-0.5", alignCls)}>
        <PriceDelta price={p} strong />
        <span className="text-[11px] text-ink3">price only · not scored yet</span>
      </div>
    ) : (
      <span className="text-[12px] text-ink3">no baseline yet</span>
    );
  }
  const color = moveColor(h.direction);
  const Arrow = h.direction === "up" ? Icons.trendUp : h.direction === "down" ? Icons.trendDown : Icons.arrowRight;
  return (
    <div className={cn("flex flex-col gap-0.5", alignCls)}>
      <div className="flex items-center gap-1.5">
        <Arrow weight="bold" className="size-3.5 shrink-0" style={{ color }} />
        <span className={cn("font-display leading-tight text-ink", compact ? "text-[13.5px]" : "text-[14px]")}>{h.phrase}</span>
        {h.delta != null && h.delta !== 0 && (
          <span className="num shrink-0 text-[11px]" style={{ color }}>
            {signedPts(h.delta)}
          </span>
        )}
      </div>
      {p && <PriceDelta price={p} />}
    </div>
  );
}

function PriceDelta({ price, strong }: { price: { pct: number; direction: "up" | "down" | "flat" }; strong?: boolean }) {
  const glyph = price.direction === "up" ? "▲" : price.direction === "down" ? "▼" : "▬";
  const cls = price.direction === "up" ? "text-success" : price.direction === "down" ? "text-danger" : "text-ink3";
  return (
    <span className={cn("num", strong ? "text-[13px] font-medium" : "text-[11px]", cls)}>
      {glyph} {Math.abs(price.pct).toFixed(1)}% since added
    </span>
  );
}

// ── health band chip — coloured by the STORED band; honest when unscored ─────────
function BandChip({ entry }: { entry: WatchlistEntry }) {
  if (!entry.scored || entry.band == null) {
    return <span className="text-[11.5px] italic text-ink3">not scored yet</span>;
  }
  const meta = BAND_META[entry.band];
  return (
    <span
      className="num inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-semibold"
      style={{ color: meta.cssVar, background: `color-mix(in oklch, ${meta.cssVar} 12%, transparent)` }}
    >
      {entry.health ?? "—"}
      <span className="font-medium">{meta.label}</span>
    </span>
  );
}

// ── favorite star (two-tier) — optimistic toggle ─────────────────────────────────
function Star({ entry, onToggle }: { entry: WatchlistEntry; onToggle: (e: WatchlistEntry) => void }) {
  return (
    <button
      type="button"
      aria-label={entry.favorite ? `Unstar ${entry.symbol}` : `Star ${entry.symbol}`}
      aria-pressed={entry.favorite}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(entry);
      }}
      className="inline-grid size-7 place-items-center rounded-lg transition-colors hover:bg-surface-2"
    >
      <Icons.star
        weight={entry.favorite ? "fill" : "regular"}
        className={cn("size-4", entry.favorite ? "text-warning" : "text-ink3 hover:text-ink2")}
      />
    </button>
  );
}

// ── unpin button ─────────────────────────────────────────────────────────────────
function Unpin({ entry, onUnpin, busy }: { entry: WatchlistEntry; onUnpin: (id: string) => void; busy: boolean }) {
  return (
    <button
      type="button"
      aria-label={`Remove ${entry.symbol} from watchlist`}
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onUnpin(entry.stockId);
      }}
      className="inline-grid size-7 place-items-center rounded-lg text-ink3 transition-colors hover:bg-crit/10 hover:text-danger disabled:opacity-50"
    >
      {busy ? <Icons.spinner className="size-3.5 animate-spin" /> : <Icons.close className="size-3.5" />}
    </button>
  );
}

// ── alert indicator — a bell + count when the user has alert(s) on this stock. Tinted
//    with the brand accent so it's clearly legible against the neutral row. ──────────
function AlertBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 rounded-[4px] px-1 py-px text-[9.5px] font-semibold"
      style={{
        color: "var(--primary)",
        background: "color-mix(in oklch, var(--primary) 15%, transparent)",
        boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--primary) 30%, transparent)",
      }}
      title={`${count} alert${count > 1 ? "s" : ""} set`}
    >
      <Icons.bell weight="fill" className="size-2.5" />
      {count}
    </span>
  );
}

// ── one desktop row (calls the shared per-stock OHLCV read for spark + 7D/1M) ──────
// Column order + widths are set once in the table's <colgroup>; cells here just fill
// them, so every row lines up on the same even grid. Numeric cells right-align; the
// pad is a consistent px-2.5 py-3 so the whole table reads as one rhythm.
function Row({
  entry,
  alertCount,
  onOpen,
  onToggleFav,
  onUnpin,
  unpinning,
}: {
  entry: WatchlistEntry;
  alertCount: number;
  onOpen: (e: WatchlistEntry) => void;
  onToggleFav: (e: WatchlistEntry) => void;
  onUnpin: (id: string) => void;
  unpinning: boolean;
}) {
  const ohlcv = useStockOhlcv(entry.symbol);
  const spark = sparkFromBars(ohlcv.data?.bars);

  return (
    <tr
      onClick={() => onOpen(entry)}
      className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2/50"
    >
      <td className="px-1.5 py-3 text-center">
        <Star entry={entry} onToggle={onToggleFav} />
      </td>
      <td className="px-2.5 py-3">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold text-ink">{entry.symbol}</p>
          <AlertBadge count={alertCount} />
        </div>
        <p className="truncate text-[11.5px] text-ink3">{entry.name}</p>
      </td>
      <td className="px-2.5 py-3">
        <BandChip entry={entry} />
      </td>
      <td className="px-2.5 py-3 text-right num text-[12px] text-ink2">{fmtMktCap(entry.marketCap)}</td>
      <td className="px-2.5 py-3 text-right">
        <span className="num text-[13px] text-ink">{entry.price != null ? fmtPrice(entry.price) : "—"}</span>
      </td>
      <td className={cn("px-2.5 py-3 text-right num text-[12px]", pctCell(entry.dayChangePct))}>
        {fmtPct(entry.dayChangePct, 2)}
      </td>
      <td className={cn("px-2.5 py-3 text-right num text-[12px]", pctCell(spark?.return7d ?? null))}>
        {fmtPct(spark?.return7d ?? null)}
      </td>
      <td className={cn("px-2.5 py-3 text-right num text-[12px]", pctCell(spark?.return1m ?? null))}>
        {fmtPct(spark?.return1m ?? null)}
      </td>
      <td className="px-2.5 py-3">
        <SinceAdded entry={entry} />
      </td>
      <td className="px-2.5 py-3">
        <div className="flex justify-center">
          {spark ? (
            <Sparkline data={spark.closes} width={72} height={26} />
          ) : (
            <span className="text-[10px] text-ink3">—</span>
          )}
        </div>
      </td>
      <td className="px-1.5 py-3 text-center">
        <Unpin entry={entry} onUnpin={onUnpin} busy={unpinning} />
      </td>
    </tr>
  );
}

// ── one mobile card ───────────────────────────────────────────────────────────────
function Card({
  entry,
  alertCount,
  onOpen,
  onToggleFav,
  onUnpin,
  unpinning,
}: {
  entry: WatchlistEntry;
  alertCount: number;
  onOpen: (e: WatchlistEntry) => void;
  onToggleFav: (e: WatchlistEntry) => void;
  onUnpin: (id: string) => void;
  unpinning: boolean;
}) {
  const ohlcv = useStockOhlcv(entry.symbol);
  const spark = sparkFromBars(ohlcv.data?.bars);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(entry);
        }
      }}
      className="flex w-full cursor-pointer flex-col gap-2.5 rounded-xl border border-line bg-surface-1 p-3.5 text-left outline-none transition-colors hover:border-line2 focus-visible:border-primary/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          <Star entry={entry} onToggle={onToggleFav} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[13.5px] font-semibold text-ink">{entry.symbol}</p>
              <AlertBadge count={alertCount} />
            </div>
            <p className="truncate text-[11.5px] text-ink3">{entry.name}</p>
            {entry.marketCap != null && <p className="num mt-0.5 text-[10.5px] text-ink3">{fmtMktCap(entry.marketCap)}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <BandChip entry={entry} />
          <Unpin entry={entry} onUnpin={onUnpin} busy={unpinning} />
        </div>
      </div>

      {/* since-you-added — its own line so the health-delta hero has room */}
      <div className="border-t border-line/70 pt-2.5">
        <SinceAdded entry={entry} compact align="start" />
      </div>

      {/* price · returns · spark — price keeps its returns; wraps instead of clustering */}
      <div className="flex items-end gap-2">
        {spark && <Sparkline data={spark.closes} width={56} height={24} className="shrink-0 self-center" />}
        <div className="ml-auto text-right">
          <span className="num text-[13px] text-ink">{entry.price != null ? fmtPrice(entry.price) : "—"}</span>
          <div className="mt-0.5 flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5">
            <span className={cn("num text-[10.5px]", pctCell(entry.dayChangePct))}>{fmtPct(entry.dayChangePct)} 1D</span>
            {spark?.return7d != null && (
              <span className={cn("num text-[10.5px]", pctCell(spark.return7d))}>{fmtPct(spark.return7d)} 7D</span>
            )}
            {spark?.return1m != null && (
              <span className={cn("num text-[10.5px]", pctCell(spark.return1m))}>{fmtPct(spark.return1m)} 1M</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── sortable header ────────────────────────────────────────────────────────────────
function SortHead({
  label,
  sortKey,
  active,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: WatchSortKey;
  active: boolean;
  dir: SortDir;
  onSort: (k: WatchSortKey) => void;
  align?: "left" | "right" | "center";
}) {
  return (
    <th className={cn("px-2.5 py-2.5 font-medium", align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left")}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex max-w-full items-center gap-1 truncate transition-colors hover:text-ink",
          align === "right" && "flex-row-reverse",
          active ? "text-ink" : "text-ink3",
        )}
      >
        {label}
        {active && (dir === "asc" ? <Icons.caretUp className="size-3 shrink-0" /> : <Icons.caretDown className="size-3 shrink-0" />)}
      </button>
    </th>
  );
}

function EmptyWatchlist({ favoritesOnly }: { favoritesOnly: boolean }) {
  if (favoritesOnly) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-line2 px-8 py-16 text-center">
        <Icons.star weight="duotone" className="mx-auto mb-3 size-7 text-ink3 opacity-60" />
        <p className="text-[13px] text-ink3">No favorites yet — tap a row&apos;s star to promote it here.</p>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line2 px-8 py-20 text-center">
      <Icons.star weight="duotone" className="mx-auto mb-4 size-8 text-ink3 opacity-60" />
      <h3 className="font-display text-[20px] font-semibold text-ink2">Nothing on your radar yet</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink3">
        Pin a stock and this becomes your since-you-added surface — how its health has held, firmed or slipped since
        you got interested, price a quieter second. Nothing is tracked until you pin it.
      </p>
      <div className="mt-5 flex justify-center">
        <AddToWatchlist
          pinnedIds={new Set()}
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-110"
            >
              <Icons.plus className="size-3.5" />
              Pin your first stock
            </button>
          }
        />
      </div>
    </div>
  );
}

export function WatchlistHub() {
  const router = useRouter();
  const wlQ = useWatchlist();
  const alertsQ = useAlerts();
  const { unpin, setFavorite } = useWatchlistMutations();
  const [sort, setSort] = useState<{ key: WatchSortKey; dir: SortDir }>({ key: "addedAt", dir: "desc" });
  const [unpinningId, setUnpinningId] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<WatchlistEntry | null>(null);
  const [txn, setTxn] = useState<{ open: boolean; symbol?: string }>({ open: false });
  const [alertModal, setAlertModal] = useState<{ symbol: string; name: string; editing: Alert | null } | null>(null);

  const entries = useMemo(() => wlQ.data ?? [], [wlQ.data]);
  const pinnedIds = useMemo(() => new Set(entries.map((e) => e.stockId)), [entries]);
  const alertCountByStock = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of alertsQ.data ?? []) m.set(a.stockId, (m.get(a.stockId) ?? 0) + 1);
    return m;
  }, [alertsQ.data]);
  const summary = useMemo(() => watchlistSummary(entries), [entries]);
  const favCount = useMemo(() => entries.filter((e) => e.favorite).length, [entries]);

  const visible = useMemo(() => {
    const filtered = favoritesOnly ? entries.filter((e) => e.favorite) : entries;
    return sortWatchlist(filtered, sort.key, sort.dir);
  }, [entries, favoritesOnly, sort]);

  const onSort = (key: WatchSortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "symbol" ? "asc" : "desc" },
    );

  const onToggleFav = (e: WatchlistEntry) => setFavorite.mutate({ stockId: e.stockId, favorite: !e.favorite });
  const onUnpin = (stockId: string) => {
    setUnpinningId(stockId);
    unpin.mutate(stockId, { onSettled: () => setUnpinningId(null) });
  };
  const onAddToPortfolio = (symbol: string) => {
    setSelected(null); // close the quick-look; the txn sheet takes the stage
    setTxn({ open: true, symbol });
  };

  const chips: { k: string; v: string; color?: string }[] = [
    { k: "Tracking", v: String(summary.total) },
    { k: "Firmed", v: String(summary.firmed), color: summary.firmed > 0 ? "var(--rec)" : undefined },
    { k: "Slipped", v: String(summary.slipped), color: summary.slipped > 0 ? "var(--high)" : undefined },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      {/* header */}
      <div className="pt-1">
        <div className="mb-3 flex items-center justify-end gap-3">
          
          {entries.length > 0 && <AddToWatchlist pinnedIds={pinnedIds} />}
        </div>
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Watchlist</h1>
            <p className="mt-1 text-[12.5px] text-ink2">
              {wlQ.data ? (
                entries.length === 0 ? (
                  "Pin stocks to start watching"
                ) : (
                  <>
                    <span className="num">{summary.total}</span> pinned · <span className="num">{summary.scored}</span>{" "}
                    scored — what&apos;s changed since you added
                  </>
                )
              ) : (
                "Loading your watchlist…"
              )}
            </p>
          </div>
          {entries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((s) => (
                <div key={s.k} className="flex flex-col gap-0.5 rounded-lg border border-line bg-surface-1 px-3.5 py-2">
                  <span className="text-[9.5px] uppercase tracking-[0.1em] text-ink3">{s.k}</span>
                  <span className="num text-[16px] font-medium" style={s.color ? { color: s.color } : undefined}>
                    {s.v}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* body */}
      {wlQ.isLoading ? (
        <QuerySkeleton rows={6} rowHeight="h-16" className="mt-6" />
      ) : wlQ.isError ? (
        <QueryError
          message={(wlQ.error as Error)?.message ?? "Failed to load your watchlist"}
          onRetry={() => wlQ.refetch()}
          className="mt-6"
        />
      ) : entries.length === 0 ? (
        <EmptyWatchlist favoritesOnly={false} />
      ) : (
        <>
          {/* controls — favorites filter */}
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFavoritesOnly((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                favoritesOnly
                  ? "border-warning/40 bg-warning/10 text-warning"
                  : "border-line2 text-ink3 hover:text-ink2",
              )}
            >
              <Icons.star weight={favoritesOnly ? "fill" : "regular"} className="size-3.5" />
              Favorites
              <span className="num text-[11px] opacity-70">{favCount}</span>
            </button>
          </div>

          {visible.length === 0 ? (
            <EmptyWatchlist favoritesOnly={favoritesOnly} />
          ) : (
            <>
              {/* table (desktop) — fixed layout + a shared <colgroup> so every column
                  lands on the same even grid regardless of content width */}
              <div className="hidden rounded-2xl border border-line bg-surface-1 md:block">
                <div className="custom-scrollbar overflow-x-auto">
                  <table className="w-full min-w-[1160px] table-fixed border-collapse text-sm">
                    <colgroup>
                      <col style={{ width: 40 }} /> {/* star */}
                      <col /> {/* Stock (flex) */}
                      <col style={{ width: 122 }} /> {/* Health */}
                      <col style={{ width: 104 }} /> {/* Mkt cap */}
                      <col style={{ width: 96 }} /> {/* Price */}
                      <col style={{ width: 64 }} /> {/* 1D */}
                      <col style={{ width: 64 }} /> {/* 7D */}
                      <col style={{ width: 64 }} /> {/* 1M */}
                      <col /> {/* Since you added (flex) */}
                      <col style={{ width: 88 }} /> {/* 7d spark */}
                      <col style={{ width: 40 }} /> {/* unpin */}
                    </colgroup>
                    <thead>
                      <tr className="border-b border-line text-[11px] text-ink3">
                        <th className="px-1.5 py-2.5" aria-label="Favorite" />
                        <SortHead label="Stock" sortKey="symbol" active={sort.key === "symbol"} dir={sort.dir} onSort={onSort} />
                        <SortHead label="Health" sortKey="band" active={sort.key === "band"} dir={sort.dir} onSort={onSort} />
                        <SortHead label="Mkt cap" sortKey="marketCap" active={sort.key === "marketCap"} dir={sort.dir} onSort={onSort} align="right" />
                        <th className="px-2.5 py-2.5 text-right font-medium text-ink3">Price</th>
                        <SortHead label="1D" sortKey="dayChange" active={sort.key === "dayChange"} dir={sort.dir} onSort={onSort} align="right" />
                        <th className="px-2.5 py-2.5 text-right font-medium text-ink3">7D</th>
                        <th className="px-2.5 py-2.5 text-right font-medium text-ink3">1M</th>
                        <SortHead
                          label="Since you added"
                          sortKey="sinceAdded"
                          active={sort.key === "sinceAdded"}
                          dir={sort.dir}
                          onSort={onSort}
                          align="center"
                        />
                        <th className="px-2.5 py-2.5 text-center font-medium text-ink3">7d</th>
                        <th className="px-1.5 py-2.5" aria-label="Unpin" />
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((e) => (
                        <Row
                          key={e.stockId}
                          entry={e}
                          alertCount={alertCountByStock.get(e.stockId) ?? 0}
                          onOpen={setSelected}
                          onToggleFav={onToggleFav}
                          onUnpin={onUnpin}
                          unpinning={unpinningId === e.stockId}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* cards (mobile) */}
              <div className="space-y-2.5 md:hidden">
                {visible.map((e) => (
                  <Card
                    key={e.stockId}
                    entry={e}
                    alertCount={alertCountByStock.get(e.stockId) ?? 0}
                    onOpen={setSelected}
                    onToggleFav={onToggleFav}
                    onUnpin={onUnpin}
                    unpinning={unpinningId === e.stockId}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* quick-look sheet (lazy per-stock reads) */}
      <QuickLookSheet
        entry={selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onAddToPortfolio={onAddToPortfolio}
        onSetAlert={(e) => setAlertModal({ symbol: e.symbol, name: e.name, editing: null })}
        onEditAlert={(a) => setAlertModal({ symbol: a.symbol ?? "", name: a.name ?? "", editing: a })}
      />

      {/* add-to-portfolio → the portfolio txn sheet, prefilled with the stock */}
      <TransactionSheet
        open={txn.open}
        onOpenChange={(o) => setTxn((s) => ({ ...s, open: o }))}
        initialSymbol={txn.symbol}
      />

      {/* set / edit alert → the create-alert modal (stacks over the quick-look) */}
      <CreateAlertModal
        open={!!alertModal}
        onOpenChange={(o) => !o && setAlertModal(null)}
        symbol={alertModal?.symbol ?? ""}
        name={alertModal?.name}
        editing={alertModal?.editing}
      />
    </div>
  );
}
