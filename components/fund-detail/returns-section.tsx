"use client";

import { Panel, SectionHeader } from "./shared";
import { MetricRow, MetricGrid } from "./metric-row";
import { Icons } from "@/lib/icons";
import { toNum, fmtFractionPct, omit } from "@/lib/fund-format";
import type { FundAnalytics } from "@/types/fund";

function retVal(v: string | null) {
  const n = toNum(v);
  return n === null ? null : fmtFractionPct(n);
}
function retClass(v: string | null) {
  const n = toNum(v);
  return n === null ? undefined : n >= 0 ? "text-success" : "text-danger";
}

export function ReturnsSection({ analytics }: { analytics: FundAnalytics }) {
  const r = analytics.returns;
  return (
    <section>
      <SectionHeader label="Returns" accent="var(--p-mkt)" icon={Icons.trendUp} />
      <Panel>
        <MetricGrid>
          <div>
            <MetricRow label="1 month" value={retVal(r.m1)} valueClassName={retClass(r.m1)} omission={omit(analytics.omissions, "ret_1m")?.reason} dashOnOmit />
            <MetricRow label="3 months" value={retVal(r.m3)} valueClassName={retClass(r.m3)} omission={omit(analytics.omissions, "ret_3m")?.reason} dashOnOmit />
            <MetricRow label="6 months" value={retVal(r.m6)} valueClassName={retClass(r.m6)} omission={omit(analytics.omissions, "ret_6m")?.reason} dashOnOmit />
          </div>
          <div>
            <MetricRow label="1 year" value={retVal(r.y1)} valueClassName={retClass(r.y1)} omission={omit(analytics.omissions, "ret_1y")?.reason} dashOnOmit />
            <MetricRow label="3 years" sub="annualised" value={retVal(r.y3Cagr)} valueClassName={retClass(r.y3Cagr)} omission={omit(analytics.omissions, "ret_3y_cagr")?.reason} dashOnOmit />
            <MetricRow label="5 years" sub="annualised" value={retVal(r.y5Cagr)} valueClassName={retClass(r.y5Cagr)} omission={omit(analytics.omissions, "ret_5y_cagr")?.reason} dashOnOmit />
          </div>
        </MetricGrid>
      </Panel>
    </section>
  );
}
