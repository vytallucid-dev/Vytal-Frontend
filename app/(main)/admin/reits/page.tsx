"use client";

import { Icons } from "@/lib/icons";
import { JobPipelinePage } from "@/components/admin/job-pipeline-page";

export default function ReitsPage() {
  return (
    <JobPipelinePage
      title="REITs & InvITs"
      subtitle="Listed real-estate and infrastructure trusts — identity, the traded close, and the distribution yield."
      icon={Icons.building}
      notes={
        <>
          A trust TRADES like a stock (order book, OHLCV, a ticker) but it is{" "}
          <span className="text-foreground font-medium">not a company</span>: no shareholding pattern, no quarterly P&amp;L
          in the shape our fundamentals expect, and therefore no peer group and{" "}
          <span className="text-foreground font-medium">no Health Score</span>. It is held and valued, never scored — and
          that is structural, not a flag: with no stock row, the scoring engine cannot reach it.
        </>
      }
      jobs={[
        {
          jobType: "reit_daily",
          label: "Run REIT / InvIT ingest",
          endpoint: "/admin/reits/trigger",
          description:
            "Reads the NSE udiff BhavCopy (series RR for REITs, IV for InvITs) and upserts identity, the exchange close and the distribution yield. Runs after NSE publishes the day's bhavcopy.",
          pills: ["NSE udiff BhavCopy", "Series RR / IV", "Idempotent — safe to re-run", "Never scored"],
        },
      ]}
    />
  );
}
