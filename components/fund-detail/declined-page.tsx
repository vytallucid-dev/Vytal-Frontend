"use client";

/**
 * The primary DECLINED state (spec §6.3) — 3,371 schemes, 24% of the catalogue. All 30
 * NAV_DERIVED_COLS nulled, chart declined, no calculator. What survives: name, fund house,
 * category, NAV, plan. This is a PRIMARY state, not an edge case — if it reads as a broken
 * database, the build failed.
 */

import Link from "next/link";
import { IdentitySection, representativeWayOut } from "./identity-section";
import { ReasonChip } from "./shared";
import { Icons } from "@/lib/icons";
import type { FundAnalytics, FundFamily } from "@/types/fund";

const CORE_REASON =
  "This plan pays its gains out as they're earned, so its NAV falls every time it pays. A return " +
  "measured from that series would understate the fund by exactly what it handed back to you — " +
  "and nobody publishes what it paid. So we won't show you one.";

const TWINLESS_FAMILY_SENTENCE =
  "This plan has no Growth twin in its expense tier to borrow a clean series from — and no " +
  "distribution history is published anywhere in India. We would rather show you nothing than a " +
  "number we know is wrong.";

export function DeclinedFundPage({
  schemeCode,
  analytics,
  family,
  reasonCode,
}: {
  schemeCode: string;
  analytics: FundAnalytics;
  family: FundFamily | null;
  reasonCode: string;
}) {
  const wayOut = family ? representativeWayOut(family, schemeCode) : null;

  return (
    <div className="mx-auto w-full min-w-0 pb-8">
      <Link
        href="/research/funds"
        className="inline-flex w-fit items-center gap-1.5 text-xs text-ink3 transition-colors hover:text-ink"
      >
        <Icons.arrowLeft className="size-3.5" />
        Back to funds
      </Link>

      <div className="mt-5">
        <IdentitySection schemeCode={schemeCode} analytics={analytics} family={family} />
      </div>

      <div className="mt-10 rounded-2xl border border-line2 bg-surface-1 p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line2 bg-surface-2">
            <Icons.info weight="duotone" className="h-5 w-5 text-ink3" />
          </span>
          <div>
            <p className="font-medium text-ink">This plan can&apos;t be measured</p>
            <ReasonChip code={reasonCode} />
          </div>
        </div>

        <p className="max-w-[62ch] text-[14px] leading-relaxed text-ink2">{CORE_REASON}</p>

        {wayOut ? (
          <a
            href={`/research/funds/${wayOut.schemeCode}`}
            className="group mt-6 inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.06] px-4 py-2.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary/[0.1]"
          >
            See this fund&apos;s {wayOut.tier !== "none" ? `${wayOut.tier === "direct" ? "Direct" : "Regular"} ` : ""}
            Growth plan instead
            <Icons.arrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        ) : (
          <p className="mt-5 max-w-[62ch] text-[13px] leading-relaxed text-ink3">
            {TWINLESS_FAMILY_SENTENCE}
            {family && (
              <>
                {" "}
                <b className="text-ink2">
                  This family has no plan we can measure — {family.family.schemeCount} scheme
                  {family.family.schemeCount === 1 ? "" : "s"} total.
                </b>
              </>
            )}
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-[11px] text-ink3">
        No score. No estimate. Just what we can and can&apos;t say about this plan&apos;s record.
      </p>
    </div>
  );
}
