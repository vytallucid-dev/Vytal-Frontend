"use client";

import { Panel, SectionHeader } from "./shared";
import { MetricRow, MetricGrid } from "./metric-row";
import { Icons } from "@/lib/icons";
import { toNum, fmtFractionPct, fmtRatio, omit, RISK_GLOSS } from "@/lib/fund-format";
import type { FundAnalytics } from "@/types/fund";

function pct(v: string | null, withSign = false) {
  const n = toNum(v);
  return n === null ? null : fmtFractionPct(n, 1, withSign);
}
function ratio(v: string | null) {
  const n = toNum(v);
  return n === null ? null : fmtRatio(n);
}

export function RiskSection({ analytics }: { analytics: FundAnalytics }) {
  const r = analytics.risk;
  const om = analytics.omissions;
  return (
    <section>
      <SectionHeader label="Risk" accent="var(--p-own)" icon={Icons.shield} />
      <Panel>
        <MetricGrid>
          <div>
            <MetricRow label="Volatility" sub="1y · annualised" gloss={RISK_GLOSS.volatility} value={pct(r.vol1y)} omission={omit(om, "vol_1y")?.reason} dashOnOmit />
            <MetricRow label="Volatility" sub="3y" value={pct(r.vol3y)} omission={omit(om, "vol_3y")?.reason} dashOnOmit />
            <MetricRow label="Worst fall" sub="1y" gloss={RISK_GLOSS.maxDrawdown} value={pct(r.maxDrawdown1y)} valueClassName="text-danger" omission={omit(om, "max_drawdown_1y")?.reason} dashOnOmit />
            <MetricRow label="Worst fall" sub="3y" value={pct(r.maxDrawdown3y)} valueClassName="text-danger" omission={omit(om, "max_drawdown_3y")?.reason} dashOnOmit />
            <MetricRow label="Worst fall" sub="5y" value={pct(r.maxDrawdown5y)} valueClassName="text-danger" omission={omit(om, "max_drawdown_5y")?.reason} dashOnOmit />
          </div>
          <div>
            <MetricRow label="Sharpe" sub="1y" gloss={RISK_GLOSS.sharpe} value={ratio(r.sharpe1y)} omission={omit(om, "sharpe_1y")?.reason} dashOnOmit />
            <MetricRow label="Sharpe" sub="3y" value={ratio(r.sharpe3y)} omission={omit(om, "sharpe_3y")?.reason} dashOnOmit />
            <MetricRow label="Sharpe" sub="5y" value={ratio(r.sharpe5y)} omission={omit(om, "sharpe_5y")?.reason} dashOnOmit />
            <MetricRow label="Sortino" sub="1y" gloss={RISK_GLOSS.sortino} value={ratio(r.sortino1y)} omission={omit(om, "sortino_1y")?.reason} dashOnOmit />
            <MetricRow label="Sortino" sub="3y" value={ratio(r.sortino3y)} omission={omit(om, "sortino_3y")?.reason} dashOnOmit />
          </div>
        </MetricGrid>
      </Panel>
    </section>
  );
}
