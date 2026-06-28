"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { FundamentalsView } from "@/types/fundamentals";
import {
  getPeerGroupConfig,
  type PeerGroupKeyMetric,
} from "@/lib/peer-group/config";
import { readConfigMetric } from "@/lib/peer-group/read-metric";
import { uniformCasaQuarter } from "@/lib/casa-display";
import { median } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────────────
// §E · Group-specific deep metrics — driven by the (reviewed & verified) peer-group config.
//
// It renders the PG's group-specific key metrics from getPeerGroupConfig(id).keyMetrics
// (real-data-seeded). The keyMetrics are read by `key` straight off the member fundamentals
// payloads — the config stays the single source of truth, so adjusting it is a DATA-SWAP, not
// a rebuild. When a PG has no keyMetrics (alternates), we fall back to a calm note pointing at
// the universal sections above. CASA honest-empties (backend gap).
// ─────────────────────────────────────────────────────────────────────────────────────

function fmtVal(v: number | null, unit: PeerGroupKeyMetric["unit"]): string {
  if (v == null) return "—";
  if (unit === "x") return `${v.toFixed(2)}×`;
  if (unit === "ratio") return `${v.toFixed(2)}×`;
  if (unit === "cr" || unit === "rupees") return `${Math.round(v)}`;
  return `${v.toFixed(1)}%`; // pct default
}

function MetricRow({
  metric,
  views,
}: {
  metric: PeerGroupKeyMetric;
  views: (FundamentalsView | null)[];
}) {
  // `note` marks a genuinely-unsurfaced metric (honest-empty). CASA is NO LONGER a gap —
  // it's read from each member's tiered banking payload below.
  const isGap = !!metric.note;
  const values = views.map((v) => readConfigMetric(v, metric.key));
  const withData = values.filter((x) => x != null).length;
  const med = median(values);
  // CASA is quarterly — surface the group's quarter when every member is on the same one
  // (§0: always show the quarter). Null when members span quarters → omit rather than mislead.
  const casaQuarter = metric.key === "casa" ? uniformCasaQuarter(views) : null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-ink">{metric.label}</span>
          <span
            className={cn(
              "rounded-full border px-1.5 py-px text-[9px] uppercase tracking-wider",
              metric.source === "scored"
                ? "border-primary/30 text-primary"
                : "border-line2 text-ink3",
            )}
          >
            {metric.source}
          </span>
        </div>
        {isGap && (
          <div className="mt-0.5 text-[10.5px] text-ink3">
            Backend gap — not surfaced by the read API yet; honest-empty until wired.
          </div>
        )}
        {casaQuarter && (
          <div className="num mt-0.5 text-[10.5px] text-ink3">as of {casaQuarter}</div>
        )}
      </div>
      <div className="shrink-0 text-right">
        {isGap ? (
          <span className="text-ink3">—</span>
        ) : (
          <>
            <span className="num text-[14px] font-medium text-ink">
              {fmtVal(med, metric.unit)}
            </span>
            <div className="text-[10px] text-ink3">
              median · <span className="num">{withData}</span>/<span className="num">{views.length}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function DeepMetricsSection({
  peerGroupId,
  views,
}: {
  peerGroupId: string;
  views: (FundamentalsView | null)[];
}) {
  const config = getPeerGroupConfig(peerGroupId);
  const keyMetrics = config?.keyMetrics ?? [];

  return (
    <section>
      <SectionEyebrow
        label="Group-specific metrics"
        icon={Icons.target}
        accent="var(--p-mom)"
        pill={config?.lensChip ?? "lens"}
      />
      <Reveal>
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          {keyMetrics.length > 0 ? (
            <>
              <div className="flex flex-col">
                {keyMetrics.map((m) => (
                  <MetricRow key={m.key} metric={m} views={views} />
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-ink3">
                The metrics this group is actually scored on, summarised as the field median across
                members — facts only, no ranking to act on.
              </p>
            </>
          ) : (
            <p className="py-4 text-center text-[13px] text-ink3">
              Group-specific metrics light up once this group&apos;s config is confirmed — the
              universal fundamentals above apply meanwhile.
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
