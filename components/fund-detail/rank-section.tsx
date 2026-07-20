"use client";

import { Panel, SectionHeader, ReasonChip } from "./shared";
import { Icons } from "@/lib/icons";
import { fmtOrdinal, omit } from "@/lib/fund-format";
import type { FundAnalytics } from "@/types/fund";

function cap(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function HorizonRank({
  label,
  rank,
  pool,
  omissionKey,
  analytics,
}: {
  label: string;
  rank: number | null;
  pool: number | null;
  omissionKey: string;
  analytics: FundAnalytics;
}) {
  if (rank !== null && pool !== null) {
    return (
      <div className="flex items-baseline justify-between border-b border-line py-2 text-[12.5px] last:border-b-0">
        <span className="text-ink2">{label}</span>
        <span className="num text-ink">
          {fmtOrdinal(rank)} <span className="text-ink3">of {pool}</span>
        </span>
      </div>
    );
  }
  const reason = omit(analytics.omissions, omissionKey)?.reason;
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 text-[12.5px] last:border-b-0">
      <span className="text-ink2">{label}</span>
      <span className="max-w-[26ch] text-right text-[11px] text-ink3">
        {reason ?? "Not enough history to rank over this window."}
      </span>
    </div>
  );
}

export function RankSection({ analytics }: { analytics: FundAnalytics }) {
  const rank = analytics.rank;

  return (
    <section>
      <SectionHeader label="Rank in category" accent="var(--primary)" icon={Icons.crown} />
      <Panel>
        {!rank ? (
          <div className="flex flex-col gap-2.5">
            <ReasonChip code={omit(analytics.omissions, "rank")?.code ?? "not_ranked"} />
            <p className="max-w-[60ch] text-[13px] leading-relaxed text-ink2">
              {omit(analytics.omissions, "rank")?.reason ?? "This fund isn't in a rankable category/plan bucket."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2.5">
              {rank.y1 !== null ? (
                <>
                  <span className="num text-[32px] font-medium leading-none text-ink">
                    {fmtOrdinal(rank.y1)}
                  </span>
                  <span className="num text-[14px] text-ink2">of {rank.pool1y}</span>
                </>
              ) : (
                <span className="text-[13px] text-ink3">
                  {omit(analytics.omissions, "rank_y1")?.reason ?? "Not ranked over 1 year."}
                </span>
              )}
            </div>
            {rank.y1 !== null && rank.pool1y && (
              <div className="relative mt-4 h-1.25 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary/55"
                  style={{ width: `${Math.max(4, 100 - ((rank.y1 - 1) / Math.max(1, rank.pool1y - 1)) * 100)}%` }}
                />
              </div>
            )}
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
              Among <b className="text-ink2">{cap(rank.planType)} plans</b> in{" "}
              <b className="text-ink2">{rank.category}</b>, over 1 year.
              <br />
              {rank.pool1y !== null && rank.bucketSize !== null && (
                <>
                  {rank.pool1y} of the {rank.bucketSize} funds in this category had enough history to be
                  measured over this window.
                </>
              )}
            </p>

            <div className="mt-4 border-t border-line pt-1">
              <HorizonRank label="3-year rank" rank={rank.y3} pool={rank.pool3y} omissionKey="rank_y3" analytics={analytics} />
              <HorizonRank label="5-year rank" rank={rank.y5} pool={rank.pool5y} omissionKey="rank_y5" analytics={analytics} />
            </div>
          </>
        )}
      </Panel>
    </section>
  );
}
