"use client";

import { Icons } from "@/lib/icons";
import { JobPipelinePage } from "@/components/admin/job-pipeline-page";

export default function CorporateBondsPage() {
  return (
    <JobPipelinePage
      title="Corporate Bonds"
      subtitle="NCDs, debentures and municipal green bonds from the NSE udiff BhavCopy — identity, attributes and the traded close."
      icon={Icons.scales}
      notes={
        <>
          <span className="text-foreground font-medium">This universe is still growing.</span> The BhavCopy lists what
          TRADED, not what is LISTED, and corporate debt is thin — roughly 150 bonds print on a given session against
          356 catalogued. Each run unions a 10-session look-back and ACCUMULATES: it adds whatever new paper it sees and
          never deletes. So the catalogue converges on the traded universe over time rather than being complete on day
          one.
          <span className="block mt-2">
            <span className="text-foreground font-medium">The credit rating is not sourceable</span> from this feed, and
            it is stored as null with a reason — never inferred from the coupon, never inherited from the issuer, never
            defaulted to AAA. A fabricated rating is the exact number a bondholder would act on.
          </span>
        </>
      }
      jobs={[
        {
          jobType: "corporate_bonds_daily",
          label: "Run corporate bond ingest",
          endpoint: "/admin/corporate-bonds/trigger",
          description:
            "Reads the last 10 NSE sessions, fences corporate debt on the ISIN's own security-type (NOT the NSE series — a series is a trading board, not an instrument type), and upserts identity + attributes + the exchange close. Held-not-scored: a bond never enters the scoring universe.",
          pills: [
            "NSE udiff BhavCopy",
            "10-session union",
            "Idempotent — safe to re-run",
            "Accumulates the universe",
            "Never scored",
          ],
        },
      ]}
    />
  );
}
