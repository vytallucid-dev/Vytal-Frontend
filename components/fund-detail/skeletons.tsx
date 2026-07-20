"use client";

/**
 * Loading placeholders for the fund/ETF detail page. These mirror the real layout —
 * a skeleton that has the *shape* of what's coming (identity → hero tiles → chart →
 * metric panels) rather than a generic row of grey bars, so the page doesn't reflow
 * when the data lands. All shimmer/surface tokens, no raw colours.
 */

import { cn } from "@/lib/utils";
import { Icons, type Icon } from "@/lib/icons";
import { SectionHeader } from "./shared";

function Bar({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md bg-surface-2", className)} />;
}

/** Chart-shaped loading state: a faint faux area-line under a shimmer, plus the range
 *  pills — same footprint as {@link NavChart}, so switching to the real chart is seamless. */
export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div>
      <div
        className="relative w-full overflow-hidden rounded-xl border border-line bg-surface-2/40"
        style={{ height }}
      >
        <svg
          aria-hidden
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full opacity-50"
        >
          <defs>
            <linearGradient id="fund-chart-skeleton-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ink3)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--ink3)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,96 C40,82 72,90 110,62 C150,34 190,54 232,42 C272,31 312,18 360,26 L400,20 L400,120 L0,120 Z"
            fill="url(#fund-chart-skeleton-fill)"
          />
          <path
            d="M0,96 C40,82 72,90 110,62 C150,34 190,54 232,42 C272,31 312,18 360,26 L400,20"
            fill="none"
            stroke="var(--ink3)"
            strokeWidth="1.5"
            strokeOpacity="0.45"
          />
        </svg>
        <div className="shimmer absolute inset-0" />
      </div>
      <div className="mt-3.5 flex justify-center gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bar key={i} className="h-6 w-9" />
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <Bar className="h-3 w-72 max-w-full" />
      </div>
    </div>
  );
}

/** One two-column metric panel's worth of placeholder rows (Returns / Risk / Benchmark). */
function MetricPanelSkeleton({ label, accent, icon }: { label: string; accent: string; icon: Icon }) {
  return (
    <section className="mt-9">
      <SectionHeader label={label} accent={accent} icon={icon} />
      <div className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col}>
              {Array.from({ length: 3 }).map((_, r) => (
                <div
                  key={r}
                  className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0"
                >
                  <Bar className="h-3.5 w-24" />
                  <Bar className="h-3.5 w-14" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Full-page skeleton for the fund detail route — back-link, identity, the three hero
 *  tiles, the NAV chart and two metric panels, in their real positions. */
export function FundDetailSkeleton() {
  return (
    <div className="animate-in fade-in-0 duration-300">
      <Bar className="h-3.5 w-24" />

      {/* identity */}
      <div className="mt-5">
        <Bar className="h-3 w-40" />
        <Bar className="mt-3 h-8 w-2/3 max-w-md" />
        <div className="mt-4 flex gap-1.5">
          <Bar className="h-6 w-24 rounded-full" />
          <Bar className="h-6 w-14 rounded-full" />
        </div>
        <Bar className="mt-4 h-5 w-32" />
      </div>

      {/* hero — three equal tiles */}
      <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex min-h-[168px] flex-col gap-3 bg-surface-1 p-5">
            <Bar className="h-2.5 w-16" />
            <Bar className="mt-1 h-9 w-28" />
            <Bar className="h-3 w-32" />
            <Bar className="mt-auto h-2.5 w-20" />
          </div>
        ))}
      </div>

      {/* chart */}
      <div className="mt-9">
        <SectionHeader label="NAV" accent="var(--p-found)" icon={Icons.chartLine} />
        <div className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
          <ChartSkeleton height={230} />
        </div>
      </div>

      <MetricPanelSkeleton label="Returns" accent="var(--p-mkt)" icon={Icons.trendUp} />
      <MetricPanelSkeleton label="Risk" accent="var(--p-own)" icon={Icons.shield} />
    </div>
  );
}
