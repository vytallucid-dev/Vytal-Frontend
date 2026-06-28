"use client";

/**
 * Ownership COMPOSITION — a 100%-stacked horizontal bar per entity (A and B), split into
 * Promoter / FII / DII / Public. This is parts-of-a-whole, so a stacked bar is the honest
 * chart (not independent grouped bars): each entity's holding mix reads as one full bar.
 *
 * Colours here are HOLDER-TYPE identity (four neutral pillar tokens), disambiguated by the
 * legend — NOT the A/B identity hues and NOT a winner colour. The two entities are told
 * apart by their row label, not by colour. Promoter pledge is a fraction OF the promoter
 * stake (not a slice of the whole), so it is NOT a stack segment — it stays in the detail
 * table below.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HonestEmpty } from "./shared";

const SEGMENTS = [
  { key: "promoter", label: "Promoter", color: "var(--p-found)" },
  { key: "fii", label: "FII", color: "var(--p-mom)" },
  { key: "dii", label: "DII", color: "var(--p-mkt)" },
  { key: "public", label: "Public & other", color: "var(--p-own)" },
] as const;

interface Holding {
  promoter: number | null;
  fii: number | null;
  dii: number | null;
}

interface Row {
  name: string;
  promoter: number;
  fii: number;
  dii: number;
  public: number;
  hasData: boolean;
}

/** Build one stacked row. Public is the residual (100 − the three known stakes), clamped
 *  to ≥ 0 so a bar never overflows. An entity with no holding data at all is flagged so we
 *  can render it honestly empty rather than as a fake full-public bar. */
function toRow(name: string, h: Holding): Row {
  const hasData = h.promoter !== null || h.fii !== null || h.dii !== null;
  const promoter = h.promoter ?? 0;
  const fii = h.fii ?? 0;
  const dii = h.dii ?? 0;
  const known = promoter + fii + dii;
  const pub = Math.max(0, 100 - known);
  return { name, promoter, fii, dii, public: pub, hasData };
}

export function OwnershipBars({
  aLabel,
  bLabel,
  a,
  b,
}: {
  aLabel: string;
  bLabel: string;
  a: Holding;
  b: Holding;
}) {
  const rows = [toRow(aLabel, a), toRow(bLabel, b)].filter((r) => r.hasData);

  if (rows.length === 0) {
    return <HonestEmpty>Ownership composition not available for these stocks.</HonestEmpty>;
  }

  return (
    <div className="space-y-3">
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
            barCategoryGap={18}
          >
            <CartesianGrid stroke="var(--line)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: "var(--ink3)", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "var(--ink2)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={84}
            />
            <Tooltip
              cursor={{ fill: "var(--line)", opacity: 0.3 }}
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--line2)",
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
              formatter={(value: number, name: string) => {
                const seg = SEGMENTS.find((s) => s.key === name);
                return [`${value.toFixed(1)}%`, seg?.label ?? name];
              }}
            />
            {SEGMENTS.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.key}
                stackId="holding"
                fill={s.color}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Holder-type legend — the colours mean holder type, not entity. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink3">
        {SEGMENTS.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
