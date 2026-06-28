"use client";

/**
 * Pillar-profile RADAR — the four pillar subtotals for A and B drawn as two overlaid
 * polygons on a shared 0–100 grid. A radar (not a bar rank) is the honest chart here:
 * the SHAPE of each entity across Foundation / Momentum / Market / Ownership is the
 * insight — where each is strong or soft — read as a profile, not a podium. Two neutral
 * identity hues; never a winner colour. No fill is "better"; both polygons are equal.
 */

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { A_HUE, B_HUE, HonestEmpty } from "./shared";

interface PillarDatum {
  pillar: string;
  a: number | null;
  b: number | null;
}

export function PillarRadar({
  aLabel,
  bLabel,
  data,
}: {
  aLabel: string;
  bLabel: string;
  data: PillarDatum[];
}) {
  const hasAny = data.some((d) => d.a !== null || d.b !== null);
  if (!hasAny) {
    return <HonestEmpty>Pillar scores not available for these stocks.</HonestEmpty>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <PolarGrid stroke="var(--line)" />
          <PolarAngleAxis
            dataKey="pillar"
            tick={{ fill: "var(--ink2)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            tickCount={5}
            stroke="var(--line)"
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--line2)",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
            formatter={(value: number, name: string) => [
              value.toFixed(1),
              name === "a" ? aLabel : bLabel,
            ]}
          />
          <Radar
            name="a"
            dataKey="a"
            stroke={A_HUE}
            fill={A_HUE}
            fillOpacity={0.16}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Radar
            name="b"
            dataKey="b"
            stroke={B_HUE}
            fill={B_HUE}
            fillOpacity={0.16}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
