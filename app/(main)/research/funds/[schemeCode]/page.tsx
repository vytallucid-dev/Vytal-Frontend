"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useFundAnalytics } from "@/lib/api/hooks/use-fund-analytics";
import { useFundFamily } from "@/lib/api/hooks/use-fund-family";
import { isApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { FundDetailSkeleton } from "@/components/fund-detail/skeletons";
import { IdentitySection, representativeWayOut } from "@/components/fund-detail/identity-section";
import { HeroSection } from "@/components/fund-detail/hero-section";
import { ChartSection } from "@/components/fund-detail/chart-section";
import { ReturnsSection } from "@/components/fund-detail/returns-section";
import { RiskSection } from "@/components/fund-detail/risk-section";
import { RankSection } from "@/components/fund-detail/rank-section";
import { BenchmarkSection } from "@/components/fund-detail/benchmark-section";
import { CalculatorSection } from "@/components/fund-detail/calculator-section";
import { DeclinedFundPage } from "@/components/fund-detail/declined-page";
import { omit } from "@/lib/fund-format";
import type { FundAnalytics } from "@/types/fund";

/** A scheme is the primary DECLINED state (spec §6.3) when every NAV-derived column is null —
 *  the same condition that makes /chart return `declined: true` (both are gated on the fold's
 *  `seriesSchemeCode === null`). Checked from analytics alone so the page doesn't have to wait
 *  on the live chart fetch to decide its own layout. */
function isFullyDeclined(a: FundAnalytics): boolean {
  const r = a.returns;
  const k = a.risk;
  return (
    r.m1 === null && r.m3 === null && r.m6 === null && r.y1 === null && r.y3Cagr === null && r.y5Cagr === null &&
    k.vol1y === null && k.vol3y === null &&
    k.maxDrawdown1y === null && k.maxDrawdown3y === null && k.maxDrawdown5y === null &&
    a.rolling1y.n === null
  );
}

/** Shared page container — centred, constrained reading width, matching the platform's
 *  other detail routes (peer-groups, stock-screener). Horizontal padding comes from the
 *  (main) layout, so we only own the max-width + centring here. */
const PAGE_WRAP = "mx-auto w-full min-w-0 pb-8";

/** Quiet single back-link to the funds browser (not a breadcrumb) — the same treatment the
 *  stock/peer-group detail pages use. */
function BackToFunds() {
  return (
    <Link
      href="/research/funds"
      className="inline-flex w-fit items-center gap-1.5 text-xs text-ink3 transition-colors hover:text-ink"
    >
      <Icons.arrowLeft className="size-3.5" />
      Back to funds
    </Link>
  );
}

export default function FundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schemeCode = String(params.schemeCode ?? "");

  const { data: analytics, isLoading, isError, error, refetch } = useFundAnalytics(schemeCode);
  const { data: family } = useFundFamily(schemeCode);

  if (isLoading) {
    return (
      <div className={PAGE_WRAP}>
        <FundDetailSkeleton />
      </div>
    );
  }

  if (isError || !analytics) {
    const apiErr = (error as { apiError?: unknown })?.apiError;
    const notFound = isApiError(apiErr) && apiErr.status === 404;
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface-1 p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-line2 bg-surface-2">
            <Icons.search weight="duotone" className="size-6 text-ink3" />
          </div>
          <h2 className="font-display text-xl font-semibold text-ink">
            {notFound ? "Not yet analysed" : "Couldn't load this fund"}
          </h2>
          <p className="mt-2 text-sm text-ink2">
            {notFound
              ? "This scheme hasn't been through the nightly analytics run yet — that's expected for a newly-listed fund, not an error."
              : "Something went wrong loading this fund."}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            {/* ⚠ A DESTINATION, NOT router.back(). This state is reached most often by a link from
                outside the app or a pasted URL — a fund that hasn't been analysed yet — where there is
                no previous entry in this tab's history and Back was simply inert. The funds browser is
                where "back" meant to go anyway. */}
            <Button variant="outline" onClick={() => router.push("/research/funds")}>
              <Icons.arrowLeft className="mr-2 h-4 w-4" />
              Back to funds
            </Button>
            {!notFound && (
              <Button onClick={() => refetch()}>
                <Icons.refresh className="mr-2 h-4 w-4" />
                Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isFullyDeclined(analytics)) {
    const reasonCode =
      omit(analytics.omissions, "ret_1y")?.code ??
      omit(analytics.omissions, "ret_1m")?.code ??
      "idcw_nav_not_total_return";
    return (
      <DeclinedFundPage schemeCode={schemeCode} analytics={analytics} family={family ?? null} reasonCode={reasonCode} />
    );
  }

  const sibling = family ? representativeWayOut(family, schemeCode) : null;
  const wayOut = sibling
    ? { href: `/research/funds/${sibling.schemeCode}`, label: "See this fund's Growth plan instead" }
    : undefined;

  return (
    <div className={PAGE_WRAP}>
      <BackToFunds />

      <div className="mt-5">
        <IdentitySection schemeCode={schemeCode} analytics={analytics} family={family ?? null} />
      </div>

      <div className="mt-9">
        <HeroSection analytics={analytics} />
      </div>

      <div className="mt-9">
        <ChartSection schemeCode={schemeCode} isEtf={analytics.scheme?.assetClass === "etf"} wayOut={wayOut} />
      </div>

      <div className="mt-9">
        <ReturnsSection analytics={analytics} />
      </div>

      <div className="mt-9">
        <RiskSection analytics={analytics} />
      </div>

      <div className="mt-9">
        <RankSection analytics={analytics} />
      </div>

      <div className="mt-9">
        <BenchmarkSection analytics={analytics} />
      </div>

      <div className="mt-9 pb-8">
        <CalculatorSection schemeCode={schemeCode} />
      </div>
    </div>
  );
}
