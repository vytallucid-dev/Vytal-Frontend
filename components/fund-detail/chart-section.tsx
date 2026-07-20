"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { useFundChart } from "@/lib/api/hooks/use-fund-chart";
import { isApiError } from "@/lib/api/client";
import { NavChart, type NavPoint } from "./nav-chart";
import { DeclinedBlock, GrowthTwinBanner, SectionHeader } from "./shared";
import { ChartSkeleton } from "./skeletons";
import { chartDeclineText } from "@/lib/fund-format";

type RangeKey = "1M" | "6M" | "1Y" | "3Y" | "5Y" | "MAX";
const RANGE_DAYS: Record<RangeKey, number> = {
  "1M": 30,
  "6M": 182,
  "1Y": 365,
  "3Y": 365 * 3,
  "5Y": 365 * 5,
  MAX: Infinity,
};
const RANGE_ORDER: RangeKey[] = ["1M", "6M", "1Y", "3Y", "5Y", "MAX"];

export function ChartSection({
  schemeCode,
  isEtf,
  wayOut,
}: {
  schemeCode: string;
  isEtf: boolean;
  wayOut?: { href: string; label: string };
}) {
  // No `days` — mfapi returns the WHOLE series in one call regardless, so range switching is
  // free client-side slicing rather than a second live round trip per click (spec §3.3: "Range:
  // whatever the endpoint's days supports" — here that is everything it has).
  const { data, isLoading, isError, error } = useFundChart(schemeCode);
  const [range, setRange] = useState<RangeKey>("3Y");

  const points: NavPoint[] = useMemo(() => {
    if (!data || data.declined) return [];
    return data.points
      .map((p) => ({ time: p.date, value: Number(p.nav) }))
      .filter((p) => Number.isFinite(p.value));
  }, [data]);

  const spanDays = useMemo(() => {
    if (points.length < 2) return 0;
    return (
      (new Date(points[points.length - 1].time).getTime() -
        new Date(points[0].time).getTime()) /
      86_400_000
    );
  }, [points]);

  const visible = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (!Number.isFinite(days)) return points;
    const cutoff = points.length
      ? new Date(points[points.length - 1].time).getTime() - days * 86_400_000
      : 0;
    return points.filter((p) => new Date(p.time).getTime() >= cutoff);
  }, [points, range]);

  return (
    <section>
      <SectionHeader
        label={isEtf ? "NAV (not market price)" : "NAV"}
        accent="var(--p-found)"
        icon={Icons.chartLine}
      />
      <div className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
        {isLoading && (
          <>
            <ChartSkeleton height={230} />
          </>
        )}

        {!isLoading && isError && (
          <DeclinedBlock
            code="source_unreachable"
            reason={
              isApiError((error as { apiError?: unknown })?.apiError)
                ? `We couldn't reach the NAV source right now. ${(error as Error).message}`
                : "We couldn't reach the NAV source right now. This is an outage, not a decision — try again shortly."
            }
          />
        )}

        {!isLoading && !isError && data?.declined && (
          <DeclinedBlock
            code={data.reason}
            reason={chartDeclineText(data.reason)}
            wayOut={wayOut}
          />
        )}

        {!isLoading && !isError && data && !data.declined && (
          <>
            {data.via === "growth_twin" && (
              <GrowthTwinBanner planLabel="Growth" />
            )}
            <NavChart points={visible} valueLabel={isEtf ? "NAV" : "NAV"} />
            <div className="mt-3.5 flex justify-center gap-1">
              {RANGE_ORDER.map((r) => {
                const disabled =
                  Number.isFinite(RANGE_DAYS[r]) &&
                  spanDays > 0 &&
                  RANGE_DAYS[r] > spanDays + 5 &&
                  r !== "MAX";
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={disabled}
                    onClick={() => setRange(r)}
                    className={cn(
                      "num rounded-md px-2.5 py-1 text-[11px] transition-colors",
                      range === r
                        ? "border border-line2 text-ink"
                        : "border border-transparent text-ink3 hover:text-ink2",
                      disabled && "cursor-not-allowed opacity-30",
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            {isEtf && (
              <p className="mt-3 text-center text-[11px] text-ink3">
                This is NAV, not the exchange-traded market price — the two can
                diverge intraday.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
