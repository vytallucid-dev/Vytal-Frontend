"use client";

import { Panel, SectionHeader } from "./shared";
import { MetricRow, MetricGrid } from "./metric-row";
import { Icons } from "@/lib/icons";
import { toNum, fmtFractionPct, fmtRatio, omit, RISK_GLOSS } from "@/lib/fund-format";
import type { FundAnalytics } from "@/types/fund";

function ratio(v: string | null) {
  const n = toNum(v);
  return n === null ? null : fmtRatio(n);
}
function alphaPct(v: string | null) {
  const n = toNum(v);
  return n === null ? null : fmtFractionPct(n);
}
function tePct(v: string | null) {
  const n = toNum(v);
  return n === null ? null : fmtFractionPct(n, 1, false);
}

export function BenchmarkSection({ analytics }: { analytics: FundAnalytics }) {
  const b = analytics.benchmark;
  const om = analytics.omissions;

  return (
    <section>
      <SectionHeader label="Against its benchmark" accent="var(--p-mom)" icon={Icons.scales} />
      <Panel>
        {!b.index ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="num text-2xl leading-none text-ink3">—</span>
            <p className="max-w-sm text-[12.5px] leading-relaxed text-ink3">
              No index cleanly represents this fund — we&apos;d rather show nothing than compare it to the
              wrong one.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-[12.5px] text-ink2">
              Measured against <b className="font-semibold text-ink">{b.index}</b>
              {b.via && b.via !== "category" && <span className="text-ink3"> · via {b.via}</span>}
            </p>
            <MetricGrid>
              <div>
                <MetricRow label="Alpha" sub="1y · excess over benchmark" gloss={RISK_GLOSS.alpha} value={alphaPct(b.alpha1y)} valueClassName={toNum(b.alpha1y) !== null ? (toNum(b.alpha1y)! >= 0 ? "text-success" : "text-danger") : undefined} omission={omit(om, "alpha_1y")?.reason} dashOnOmit />
                <MetricRow label="Alpha" sub="3y" value={alphaPct(b.alpha3y)} valueClassName={toNum(b.alpha3y) !== null ? (toNum(b.alpha3y)! >= 0 ? "text-success" : "text-danger") : undefined} omission={omit(om, "alpha_3y")?.reason} dashOnOmit />
                <MetricRow label="Alpha" sub="5y" value={alphaPct(b.alpha5y)} valueClassName={toNum(b.alpha5y) !== null ? (toNum(b.alpha5y)! >= 0 ? "text-success" : "text-danger") : undefined} omission={omit(om, "alpha_5y")?.reason} dashOnOmit />
              </div>
              <div>
                <MetricRow label="Beta" sub="1y · moves with the index" gloss={RISK_GLOSS.beta} value={ratio(b.beta1y)} omission={omit(om, "beta_1y")?.reason} dashOnOmit />
                <MetricRow label="Beta" sub="3y" value={ratio(b.beta3y)} omission={omit(om, "beta_3y")?.reason} dashOnOmit />
                <MetricRow label="Tracking error" sub="1y" gloss={RISK_GLOSS.trackingError} value={tePct(b.trackingError1y)} omission={omit(om, "tracking_error_1y")?.reason} dashOnOmit />
              </div>
            </MetricGrid>
          </>
        )}
      </Panel>
    </section>
  );
}
