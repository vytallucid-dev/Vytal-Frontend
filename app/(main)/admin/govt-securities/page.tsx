"use client";

import { Icons } from "@/lib/icons";
import { JobPipelinePage } from "@/components/admin/job-pipeline-page";

export default function GovtSecuritiesPage() {
  return (
    <JobPipelinePage
      title="Government Securities"
      subtitle="G-secs, T-bills, State Development Loans and Sovereign Gold Bonds — identity, coupon, maturity and the traded close."
      icon={Icons.shield}
      notes={
        <>
          <span className="text-foreground font-medium">Government paper is thinly traded</span>, so a single session is
          a sample, not the universe — one day shows ~115 instruments, ten days show 215. Each run unions a 10-session
          look-back, and the price stays honestly dated to the session it actually came from.
          <span className="block mt-2">
            <span className="text-foreground font-medium">The exact maturity date is not in the feed</span> for G-secs,
            SDLs or SGBs, and it is not invented. The name gives a coupon and a YEAR; the DAY is null. Only T-bills carry
            a full date, because only T-bills publish one.
          </span>
        </>
      }
      jobs={[
        {
          jobType: "govt_securities_daily",
          label: "Run government securities ingest",
          endpoint: "/admin/govt-securities/trigger",
          description:
            "Reads the last 10 NSE sessions and loads the four government series (GS / TB / GB / SG) on an exact allow-list — corporate debt is excluded by construction, not by a heuristic. Held-not-scored: a Health Score is an equity judgement and a T-bill has none of its inputs.",
          pills: [
            "NSE udiff BhavCopy",
            "Series allow-list: GS/TB/GB/SG",
            "10-session union",
            "Idempotent — safe to re-run",
            "Never scored",
          ],
        },
      ]}
    />
  );
}
