"use client";

/**
 * §7 — Ownership Glance. DISPLAY.
 * Source: /ownership. A shareholding donut (promoter / FII / DII / retail / others)
 * + the R1 pledge red-flag ONLY when it is firing (the Activity-tab R1 treatment).
 * Decoupled from scoring — the holding split surfaces whenever the raw data exists,
 * even for an unscored stock. One look at who owns it + any pledge risk. CTA → Activity.
 */

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Icons } from "@/lib/icons";
import { useStockOwnership } from "@/lib/api/hooks/use-stock-ownership";
import type { OwnershipHolding } from "@/types/research-tools";
import { accentVars } from "@/lib/findings";
import { Panel } from "../health/shared";
import { Section, HonestEmpty, LoadingBlock, DASH, fmtPct, Funnel } from "./shared";

// Holding identity colours (who owns it) — NOT grading.
const SLICES: { key: keyof OwnershipHolding; label: string; color: string }[] = [
  { key: "promoterPct", label: "Promoter", color: "var(--p-own)" },
  { key: "fiiPct", label: "FII", color: "var(--p-found)" },
  { key: "diiPct", label: "DII", color: "var(--p-mom)" },
  { key: "retailPct", label: "Retail", color: "var(--p-mkt)" },
  { key: "othersPct", label: "Others", color: "var(--ink3)" },
];

export function OwnershipSection({ symbol }: { symbol: string }) {
  const { data: ownership, isLoading } = useStockOwnership(symbol);

  if (isLoading) {
    return (
      <Section id="overview-ownership" label="Ownership glance" icon={Icons.user} accent="var(--p-own)">
        <LoadingBlock className="h-48" />
      </Section>
    );
  }

  const holding = ownership?.current?.holding ?? null;
  const hasHolding =
    holding != null && SLICES.some((s) => typeof holding[s.key] === "number" && (holding[s.key] as number) > 0);

  if (!hasHolding) {
    return (
      <Section id="overview-ownership" label="Ownership glance" icon={Icons.user} accent="var(--p-own)">
        <HonestEmpty>Shareholding data not yet available for this stock.</HonestEmpty>
      </Section>
    );
  }

  const data = SLICES.map((s) => ({ label: s.label, value: (holding![s.key] as number | null) ?? 0, color: s.color })).filter(
    (d) => d.value > 0,
  );

  const r1Fired = ownership?.current?.r1Fired ?? false;
  const pledge = holding!.pledgedPctOfPromoter;
  const a = accentVars("crit");

  return (
    <Section id="overview-ownership" label="Ownership glance" icon={Icons.user} accent="var(--p-own)">
      <Panel>
        {/* R1 pledge red-flag — only when firing (Activity R1 treatment) */}
        {r1Fired && (
          <div className="relative mb-5 overflow-hidden rounded-xl border border-line bg-surface-2 p-4">
            <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: a.color }} />
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: a.bg, color: a.color }}>
                <Icons.warning weight="fill" className="h-3.5 w-3.5" />
              </span>
              <span className="text-[13px] font-semibold text-ink">Promoter pledging — R1</span>
              <span
                className="ml-auto shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: a.color, background: a.bg, borderColor: a.bd }}
              >
                Watch With Care
              </span>
            </div>
            <p className="num mt-2 text-[12px] text-ink2">
              {pledge != null ? `${pledge.toFixed(1)}% of promoter holding is pledged.` : "Promoter pledging breaches the R1 threshold."}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Donut */}
          <div className="h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={76} paddingAngle={1.5} stroke="var(--surface)" strokeWidth={1}>
                  {data.map((d) => (
                    <Cell key={d.label} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: "var(--surface2)",
                    border: "1px solid var(--line2)",
                    borderRadius: 10,
                    fontSize: 12,
                    padding: "6px 10px",
                  }}
                  itemStyle={{ color: "var(--ink)" }}
                  formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend + pledge stat */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {data.map((d) => (
                <div key={d.label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[12px] text-ink2">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                    {d.label}
                  </span>
                  <span className="num text-[12.5px] font-medium text-ink">{fmtPct(d.value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12px]">
              <span className="text-ink3">Promoter pledge</span>
              <span className="num font-medium text-ink2">{pledge != null ? fmtPct(pledge) : DASH}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <p className="text-[11.5px] text-ink3">
            {ownership?.current?.asOfDate ? `As of ${ownership.current.asOfDate}.` : ""} Full ownership history is on the Activity tab.
          </p>
          <Funnel tab="activity" symbol={symbol} label="Activity" />
        </div>
      </Panel>
    </Section>
  );
}
