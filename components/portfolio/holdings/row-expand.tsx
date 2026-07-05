"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { Icons } from "@/lib/icons";
import { useStockOhlcv } from "@/lib/api/hooks/use-stock-ohlcv";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { MiniSpark, PILLAR_META, SPARK_MIN_POINTS } from "@/components/stock-detail/health/shared";
import type { PillarKey } from "@/types/health";
import type { Holding } from "@/types/portfolio";
import { STOCK_BAND_LABEL, holdingHealthColor, returnPct } from "../lib";

const pnlText = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const signPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v))}`;

const PILLAR_ORDER: PillarKey[] = ["foundation", "momentum", "market", "ownership"];

// ── a small labelled figure ──────────────────────────────────────────────────
function Fig({ label, value, tone, sub }: { label: string; value: string; tone?: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9.5px] uppercase tracking-[0.09em] text-ink3">{label}</p>
      <p className={cn("num mt-0.5 text-[13px] font-medium", tone ?? "text-ink")}>{value}</p>
      {sub && <p className="num text-[10px] text-ink3">{sub}</p>}
    </div>
  );
}

// ── the price sparkline — lazy per-symbol OHLCV; honest-omit under 3 real points ──
function PriceSpark({ symbol }: { symbol: string }) {
  const q = useStockOhlcv(symbol);
  if (q.isLoading) return <div className="shimmer h-[38px] w-full rounded-md bg-surface-2" />;
  const closes = (q.data?.bars ?? []).slice(-60).map((b) => b.close);
  if (closes.length < SPARK_MIN_POINTS) {
    return <p className="text-[11px] italic text-ink3">Price history unavailable.</p>;
  }
  const up = closes[closes.length - 1] >= closes[0];
  return (
    <div className="flex items-center gap-3">
      <MiniSpark points={closes} color={up ? "var(--rec)" : "var(--crit)"} width={200} height={38} />
      <span className="num text-[10px] text-ink3">last {closes.length} sessions · at close</span>
    </div>
  );
}

// ── the health mini — band + score from the holding; the 4 pillars lazy-fetched.
//    Unscored holdings never fetch — they get the honest "not yet scored" note. ──
function HealthMini({ holding }: { holding: Holding }) {
  const scored = holding.health != null;
  const q = useStockHealth(scored ? holding.symbol : "");
  const color = holdingHealthColor(holding);

  if (!scored) {
    return (
      <div className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-3.5 py-3">
        <p className="text-[12px] text-ink2">Not yet scored</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink3">
          Vytal doesn&apos;t cover this name yet, so there&apos;s no health read to show — we don&apos;t invent one. The
          tracker figures above are live all the same.
        </p>
      </div>
    );
  }

  const pillars = q.data?.pillars ?? null;

  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-ink2">Health</span>
        <span className="inline-flex items-baseline gap-1.5">
          <span className="text-[11px] text-ink3">{holding.band ? STOCK_BAND_LABEL[holding.band] : "—"}</span>
          <span className="num text-[18px] font-semibold" style={{ color }}>
            {holding.health}
          </span>
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
        {q.isLoading &&
          PILLAR_ORDER.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="w-[68px] text-[10.5px] text-ink3">{PILLAR_META[k].label}</span>
              <div className="shimmer h-1.5 flex-1 rounded-full bg-surface-3" />
            </div>
          ))}
        {pillars &&
          PILLAR_ORDER.map((k) => {
            const p = pillars.find((x) => x.pillar === k);
            const v = p?.subtotal ?? null;
            const meta = PILLAR_META[k];
            return (
              <div key={k} className="flex items-center gap-2">
                <span className="w-[68px] shrink-0 text-[10.5px] text-ink3">{meta.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full" style={{ width: `${v ?? 0}%`, background: meta.cssVar }} />
                </div>
                <span className="num w-6 shrink-0 text-right text-[10.5px] font-medium" style={{ color: meta.cssVar }}>
                  {v == null ? "—" : Math.round(v)}
                </span>
              </div>
            );
          })}
        {q.isError && (
          <p className="col-span-2 text-[11px] italic text-ink3">Pillar breakdown couldn&apos;t load right now.</p>
        )}
      </div>
    </div>
  );
}

// ── an in-expand funnel link (routes out of the portfolio surface) ────────────
function ExpandFunnel({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3 py-1.5 text-[12px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
    >
      {children}
      <Icons.arrowUpRight className="size-3" />
    </button>
  );
}

export function RowExpand({ holding }: { holding: Holding }) {
  const router = useRouter();
  const rp = returnPct(holding);
  const sym = holding.symbol;

  return (
    <div className="grid gap-5 px-3 py-4 sm:px-4 lg:grid-cols-[1.5fr_1fr]">
      {/* left — tracker detail + sparkline */}
      <div className="min-w-0">
        <div className="grid grid-cols-3 gap-x-4 gap-y-3.5 sm:grid-cols-4">
          <Fig
            label="LTP"
            value={holding.currentPrice != null ? formatINR(holding.currentPrice) : "—"}
            sub={holding.currentPrice != null ? "at last close" : undefined}
          />
          <Fig
            label="Day change"
            value={holding.dayChangePct != null ? signPct(holding.dayChangePct) : "—"}
            tone={holding.dayChangePct != null ? pnlText(holding.dayChangePct) : "text-ink3"}
            sub={holding.dayChangeValue != null ? signINR(holding.dayChangeValue) : undefined}
          />
          <Fig label="Qty × avg" value={`${holding.quantity} × ${formatINR(holding.avgCost)}`} />
          <Fig label="Invested" value={formatINR(holding.investedValue)} />
          <Fig
            label="Current value"
            value={holding.marketValue != null ? formatINR(holding.marketValue) : "—"}
          />
          <Fig
            label="Total P&L"
            value={holding.unrealizedPnl != null ? signINR(holding.unrealizedPnl) : "—"}
            tone={holding.unrealizedPnl != null ? pnlText(holding.unrealizedPnl) : "text-ink3"}
            sub={rp != null ? signPct(rp) : undefined}
          />
          <Fig
            label="Realized P&L"
            value={holding.realizedPnl !== 0 ? signINR(holding.realizedPnl) : "—"}
            tone={holding.realizedPnl !== 0 ? pnlText(holding.realizedPnl) : "text-ink3"}
            sub={holding.realizedPnl !== 0 ? "booked" : "none booked"}
          />
          <Fig label="Weight" value={`${(holding.weight * 100).toFixed(1)}%`} sub="of book" />
        </div>

        <div className="mt-4 border-t border-line pt-3.5">
          <p className="mb-2 text-[9.5px] uppercase tracking-[0.09em] text-ink3">Price</p>
          <PriceSpark symbol={sym} />
        </div>
      </div>

      {/* right — health mini + funnels */}
      <div className="flex flex-col gap-3 lg:border-l lg:border-line lg:pl-5">
        <HealthMini holding={holding} />
        <div className="flex flex-wrap gap-2">
          <ExpandFunnel onClick={() => router.push(`/research/stock-screener/${sym}`)}>Stock page</ExpandFunnel>
          <ExpandFunnel onClick={() => router.push(`/research/stock-screener/${sym}?tab=health`)}>
            Health page
          </ExpandFunnel>
          <ExpandFunnel onClick={() => router.push(`/research/trajectory?symbol=${sym}`)}>Trajectory</ExpandFunnel>
        </div>
      </div>
    </div>
  );
}
