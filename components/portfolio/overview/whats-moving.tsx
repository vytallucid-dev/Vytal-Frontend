"use client";

import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { Holding } from "@/types/portfolio";
import { type ContributionRow, contributions, todaysMovers } from "../lib";
import { Funnel, Kicker } from "./shared";

const pnlColor = (v: number) => (v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-ink2");
const signPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;

function MoverRow({ h }: { h: Holding }) {
  const d = h.dayChangePct ?? 0;
  return (
    <div className="flex items-center justify-between py-1.5 text-[12.5px]">
      <span className="num font-medium text-ink">{h.symbol}</span>
      <span className={cn("num", pnlColor(d))}>{signPct(d)}</span>
    </div>
  );
}

function ContribRow({ r }: { r: ContributionRow }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[12.5px]">
      <span className="num font-medium text-ink">{r.holding.symbol}</span>
      <span className="flex items-center gap-2.5">
        {r.contribution != null && (
          <span className="num text-[10.5px] text-ink3">{Math.round(r.contribution * 100)}% of return</span>
        )}
        <span className={cn("num", pnlColor(r.pnl))}>{signINR(r.pnl)}</span>
      </span>
    </div>
  );
}

function Column({
  title,
  hint,
  up,
  down,
  upLabel,
  downLabel,
  empty,
}: {
  title: string;
  hint: string;
  up: React.ReactNode;
  down: React.ReactNode;
  upLabel: string;
  downLabel: string;
  empty: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5">
      <div className="mb-3">
        <Kicker>{title}</Kicker>
        <p className="mt-1 text-[11px] text-ink3">{hint}</p>
      </div>
      {empty ? (
        <p className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-4 py-6 text-center text-[12px] text-ink3">
          Nothing to show here yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-success">{upLabel}</p>
            <div className="divide-y divide-line/60">{up}</div>
          </div>
          <div className="mt-3 sm:mt-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-danger">{downLabel}</p>
            <div className="divide-y divide-line/60">{down}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function WhatsMoving({ holdings, onOpenPerformance }: { holdings: Holding[]; onOpenPerformance: () => void }) {
  const movers = todaysMovers(holdings);
  const contrib = contributions(holdings);
  const noDay = movers.gainers.length === 0 && movers.losers.length === 0;
  const noContrib = contrib.contributors.length === 0 && contrib.detractors.length === 0;

  const dash = (rows: React.ReactNode[], fallback: string) =>
    rows.length ? rows : <p className="py-1.5 text-[12px] text-ink3">{fallback}</p>;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2">
        <Column
          title="Today's movers"
          hint="Biggest single-day price moves, at last close"
          empty={noDay}
          upLabel="Gainers"
          downLabel="Losers"
          up={dash(movers.gainers.map((h) => <MoverRow key={h.symbol} h={h} />), "No gainers today.")}
          down={dash(movers.losers.map((h) => <MoverRow key={h.symbol} h={h} />), "No losers today.")}
        />
        <Column
          title="Contributors & detractors"
          hint="What's driving your total return, by ₹"
          empty={noContrib}
          upLabel="Contributors"
          downLabel="Detractors"
          up={dash(contrib.contributors.map((r) => <ContribRow key={r.holding.symbol} r={r} />), "No positions in the green.")}
          down={dash(contrib.detractors.map((r) => <ContribRow key={r.holding.symbol} r={r} />), "No positions in the red.")}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Funnel onClick={onOpenPerformance}>Open performance</Funnel>
      </div>
    </div>
  );
}
