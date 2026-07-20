"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { useFundChart } from "@/lib/api/hooks/use-fund-chart";
import { availableHorizons, computeOneTime, computeSip, type CalcPoint } from "@/lib/fund-calculator";
import { fmtDate } from "@/lib/fund-format";
import { SectionHeader } from "./shared";

type Mode = "sip" | "onetime";

function fmtINR(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function CalculatorSection({ schemeCode }: { schemeCode: string }) {
  // Same query key as ChartSection's useFundChart(schemeCode) — React Query dedupes this to
  // the one live fetch already in flight/cached, never a second round trip.
  const { data, isLoading, isError } = useFundChart(schemeCode);
  const [mode, setMode] = useState<Mode>("sip");
  const [sipAmount, setSipAmount] = useState(5000);
  const [lumpAmount, setLumpAmount] = useState(25000);

  const points: CalcPoint[] = useMemo(() => {
    if (!data || data.declined) return [];
    return data.points
      .map((p) => ({ date: p.date, nav: Number(p.nav) }))
      .filter((p) => Number.isFinite(p.nav) && p.nav > 0);
  }, [data]);

  const horizons = useMemo(() => availableHorizons(points), [points]);

  // spec §3.8: declined chart → no calculator, no series to compute from. NOT the same as
  // "no data yet" — `data` is also undefined while loading or on a 503, and those states
  // still need to render (below), not disappear silently.
  if (data?.declined) return null;

  const amount = mode === "sip" ? sipAmount : lumpAmount;
  const setAmount = mode === "sip" ? setSipAmount : setLumpAmount;
  const max = mode === "sip" ? 100_000 : 1_000_000;
  const step = mode === "sip" ? 500 : 1_000;

  return (
    <section id="calculator">
      <SectionHeader label="What this fund did with money" accent="var(--p-found)" icon={Icons.coins} />
      <div className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
        {isLoading && (
          <div className="flex min-h-[140px] items-center justify-center gap-2.5 text-[12.5px] text-ink3">
            <Icons.spinner className="h-4 w-4 animate-spin" />
            Waiting on the same live NAV series as the chart above…
          </div>
        )}

        {!isLoading && isError && (
          <p className="text-[12.5px] text-ink3">
            The calculator needs the live NAV series above, which isn&apos;t reachable right now — try again
            shortly.
          </p>
        )}

        {!isLoading && !isError && horizons.length === 0 && (
          <p className="text-[12.5px] text-ink3">
            Not enough NAV history yet for even a 6-month record — check back once this fund has more history.
          </p>
        )}

        {!isLoading && !isError && horizons.length > 0 && (
          <>
            <div
              role="radiogroup"
              aria-label="Investment mode"
              className="mb-5 flex w-fit items-center gap-0.5 rounded-lg border border-line2 bg-surface-1 p-0.5"
            >
              {(["sip", "onetime"] as Mode[]).map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                      active ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
                    )}
                  >
                    {m === "sip" ? "Monthly SIP" : "One time"}
                  </button>
                );
              })}
            </div>

            <div className="mb-5 text-center">
              <div className="text-[11.5px] text-ink3">{mode === "sip" ? "Monthly investment" : "Investment amount"}</div>
              <div className="num mt-1 text-[26px] text-ink">{fmtINR(amount)}</div>
              <input
                type="range"
                min={step}
                max={max}
                step={step}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-3 w-full accent-primary cursor-pointer"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="pb-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Over the past</th>
                    <th className="pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-ink3">You&apos;d have put in</th>
                    <th className="pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-ink3">It became</th>
                    <th className="pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Lowest it got</th>
                    <th className="pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {horizons.map((h) => {
                    const result =
                      mode === "sip"
                        ? computeSip(points, amount, h.days)
                        : computeOneTime(points, amount, h.days);
                    if (!result) return null;
                    const positive = result.returnPct >= 0;
                    return (
                      <tr key={h.key} className="border-b border-line last:border-b-0">
                        <td className="py-3 text-[12.5px] text-ink2">{h.label}</td>
                        <td className="num py-3 text-right text-ink">{fmtINR(result.invested)}</td>
                        <td className="num py-3 text-right text-ink">{fmtINR(result.finalValue)}</td>
                        <td className="py-3 text-right">
                          <span className="num text-danger">{fmtINR(result.lowestValue)}</span>
                          <span className="block text-[10px] text-ink3">{fmtDate(result.lowestDate)}</span>
                        </td>
                        <td className={cn("num py-3 text-right", positive ? "text-success" : "text-danger")}>
                          {positive ? "+" : ""}
                          {result.returnPct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-[11.5px] leading-relaxed text-ink3">
              This is what already happened, not what will. Every figure is the fund&apos;s own record over
              the window shown — including the lowest your money got along the way, which is the part
              you&apos;d have had to sit through.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
