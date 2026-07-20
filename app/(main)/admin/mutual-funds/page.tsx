"use client";

import { Icons } from "@/lib/icons";
import { JobPipelinePage } from "@/components/admin/job-pipeline-page";

export default function MutualFundsPage() {
  return (
    <JobPipelinePage
      title="Mutual Funds & ETFs"
      subtitle="The AMFI universe — NAV, identity, the exchange close for listed funds, and the analytics fold."
      icon={Icons.package}
      notes={
        <>
          <span className="text-foreground font-medium">One pipeline, five jobs, two identity feeds.</span> An ETF is an
          AMFI-registered fund whose analytics come out of the SAME fold as a mutual fund&apos;s — so it lives here rather
          than on a card of its own. What it adds is a second number: a listed ETF has both a NAV (what a unit is worth)
          and an exchange close (what it actually trades at), and those are not the same thing.
          <span className="block mt-2">
            <span className="text-foreground font-medium">The analytics fold is compute-and-discard.</span> It streams
            five years of NAV history, folds it into per-scheme accumulators in memory, writes the derived numbers, and
            throws every raw NAV away. There is deliberately no NAV-history table — a persistent one measured ~26M rows /
            ~2.5GB against a 500MB ceiling.
          </span>
        </>
      }
      jobs={[
        {
          jobType: "amfi_nav_daily",
          label: "Run AMFI NAV ingest",
          endpoint: "/admin/mf/nav/trigger",
          description:
            "One file, the whole mutual-fund universe (~17,500 schemes): identity, scheme code, fund house, plan type and the current NAV. A blank or 'N.A.' NAV goes null — never coerced to 0.",
          pills: ["AMFI NAVAll", "~17,500 schemes", "Idempotent — safe to re-run"],
        },
        {
          jobType: "etf_nav_daily",
          label: "Run ETF NAV ingest",
          endpoint: "/admin/mf/etf-nav/trigger",
          description:
            "The same AMFI file, its COMPLEMENTARY sections — the 337 exchange-traded funds. Identity + NAV, on the same ISIN spine. Held-not-scored: a fund has no fundamentals to score.",
          pills: ["AMFI NAVAll", "337 ETFs", "Idempotent — safe to re-run", "Never scored"],
        },
        {
          jobType: "etf_prices_daily",
          label: "Run ETF exchange-close ingest",
          endpoint: "/admin/mf/etf-prices/trigger",
          description:
            "What a listed ETF actually TRADES at, from the NSE udiff BhavCopy. A different number from the NAV and a different source — a listed ETF trades at a premium or discount to its NAV, sometimes by several percent, and a holder cannot transact at the NAV.",
          pills: ["NSE udiff BhavCopy", "Exchange close ≠ NAV", "Idempotent — safe to re-run"],
        },
        {
          jobType: "mf_analytics_daily",
          label: "Run analytics fold",
          endpoint: "/admin/mf/analytics/trigger",
          description:
            "The compute-and-discard fold across the whole AMFI universe (funds AND ETFs): returns, volatility, Sharpe, max drawdown. ~21 network windows, roughly 12 minutes. Raw NAV history is never persisted.",
          pills: ["~12 minutes", "~21 windows", "Compute-and-discard", "Idempotent — recomputes the same numbers"],
        },
        {
          jobType: "instrument_corporate_actions",
          label: "Run ETF corporate-actions sweep",
          endpoint: "/admin/mf/corporate-actions/trigger",
          description:
            "Reads NSE's REAL, dated unit splits for every listed ETF, and reconciles the day AMFI actually applied each one. This is what lets the fold rescale a NAV series before it computes anything: AMFI does not restate a NAV when a fund sub-divides 1:10, so the raw series just steps down 90% overnight and every metric folded from it believes the fund collapsed. Runs at 19:45, fifteen minutes before the fold that depends on it. Never inferred from the NAV's shape — no NSE event, no adjustment.",
          pills: ["NSE corporate actions", "Real events only — never inferred", "Idempotent — safe to re-run", "Runs before the fold"],
        },
      ]}
    />
  );
}
