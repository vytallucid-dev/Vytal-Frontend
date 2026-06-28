"use client";

/**
 * §5 — Key Metrics. DISPLAY (non-valuation ONLY).
 * Source: /fundamentals (dispatch-by-family). Glance cards with sparklines for the
 * business's quality/return ratios. Family-aware: a bank shows NIM/GNPA/PCR…, a
 * non-financial shows ROE/ROCE/margins/leverage. Sparkline = the ratio's movement
 * over available years (MiniSpark self-gates at ≥3 real points — no 2-point lines).
 *
 * EXCLUDES the valuation lens — NO P/E, NO P/B, NO dividend-yield-vs-sector. Those are
 * the cut lens and are deliberately not added here. Honest-empty per metric (a dash).
 */

import { Icons } from "@/lib/icons";
import { useStockFundamentals } from "@/lib/api/hooks/use-stock-fundamentals";
import type { FundamentalsView } from "@/types/fundamentals";
import { Panel, MiniSpark, sparkSeries } from "../health/shared";
import { Section, HonestEmpty, LoadingBlock, Funnel, DASH, fmtPct, fmtSignedPct, fmtX, fmtRatio } from "./shared";

const SPARK_COLOR = "var(--p-found)"; // calm identity colour for the trend line (not grading)

interface MetricSpec {
  label: string;
  value: string;
  spark?: (number | null)[];
}

/** Build the family-appropriate metric specs. Non-valuation only — never P/E, P/B, div-yield. */
function specsFor(v: FundamentalsView): { fiscalYear: string | null; metrics: MetricSpec[] } {
  // Non-financial
  if (v.family === "non_financial" && v.nonFinancial?.annual) {
    const a = v.nonFinancial.annual;
    const h = v.nonFinancial.ratioHistory;
    return {
      fiscalYear: a.fiscalYear,
      metrics: [
        { label: "ROE", value: fmtPct(a.roe), spark: sparkSeries(h, (r) => r.roe) },
        { label: "ROCE", value: fmtPct(a.roce), spark: sparkSeries(h, (r) => r.roce) },
        { label: "Net margin", value: fmtPct(a.netMargin), spark: sparkSeries(h, (r) => r.netMargin) },
        { label: "Operating margin", value: fmtPct(a.operatingMargin), spark: sparkSeries(h, (r) => r.operatingMargin) },
        { label: "Revenue growth (YoY)", value: fmtSignedPct(a.revenueGrowthYoy) },
        { label: "Profit growth (YoY)", value: fmtSignedPct(a.profitGrowthYoy) },
        { label: "Debt / Equity", value: fmtRatio(a.debtToEquity) },
        { label: "Interest coverage", value: fmtX(a.interestCoverage) },
      ],
    };
  }
  // Banking
  if (v.family === "banking" && v.banking?.annual) {
    const a = v.banking.annual;
    const h = v.banking.ratioHistory;
    return {
      fiscalYear: a.fiscalYear,
      metrics: [
        { label: "ROE", value: fmtPct(a.roe), spark: sparkSeries(h, (r) => r.roe) },
        { label: "Net interest margin", value: fmtPct(a.nim), spark: sparkSeries(h, (r) => r.nim) },
        { label: "Cost-to-income", value: fmtPct(a.costToIncome), spark: sparkSeries(h, (r) => r.costToIncome) },
        { label: "Credit cost", value: fmtPct(a.creditCostPct), spark: sparkSeries(h, (r) => r.creditCostPct) },
        { label: "Gross NPA", value: fmtPct(a.gnpaPct) },
        { label: "Net NPA", value: fmtPct(a.nnpaPct) },
        { label: "Provision coverage", value: fmtPct(a.pcr) },
        { label: "CET-1", value: fmtPct(a.cet1) },
      ],
    };
  }
  // NBFC
  if (v.family === "nbfc" && v.nbfc?.annual) {
    const a = v.nbfc.annual;
    return {
      fiscalYear: a.fiscalYear,
      metrics: [
        { label: "ROE", value: fmtPct(a.roe) },
        { label: "Net interest margin", value: fmtPct(a.nim) },
        { label: "Spread", value: fmtPct(a.spread) },
        { label: "Cost-to-income", value: fmtPct(a.costToIncomeRatio) },
        { label: "Credit cost", value: fmtPct(a.creditCostPct) },
        { label: "Borrowings / Equity", value: fmtX(a.borrowingsToEquity) },
        { label: "AUM growth (YoY)", value: fmtSignedPct(a.aumGrowthYoy) },
        { label: "PAT growth (YoY)", value: fmtSignedPct(a.patGrowthYoy) },
      ],
    };
  }
  // Life insurance
  if (v.family === "life_insurance" && v.lifeInsurance?.annual) {
    const a = v.lifeInsurance.annual;
    return {
      fiscalYear: a.fiscalYear,
      metrics: [
        { label: "ROE", value: fmtPct(a.roe) },
        { label: "Solvency ratio", value: fmtX(a.solvencyRatio) },
        { label: "13M persistency", value: fmtPct(a.persistency.m13) },
        { label: "New business premium", value: fmtPct(a.newBusinessPremiumPct) },
        { label: "Premium growth (YoY)", value: fmtSignedPct(a.premiumGrowthYoy) },
        { label: "PAT growth (YoY)", value: fmtSignedPct(a.patGrowthYoy) },
      ],
    };
  }
  // General insurance
  if (v.family === "general_insurance" && v.generalInsurance?.annual) {
    const a = v.generalInsurance.annual;
    return {
      fiscalYear: a.fiscalYear,
      metrics: [
        { label: "ROE", value: fmtPct(a.roe) },
        { label: "Combined ratio", value: fmtPct(a.combinedRatio) },
        { label: "Incurred claim ratio", value: fmtPct(a.incurredClaimRatio) },
        { label: "Solvency ratio", value: fmtX(a.solvencyRatio) },
        { label: "Net retention", value: fmtPct(a.netRetentionRatio) },
        { label: "GPW growth (YoY)", value: fmtSignedPct(a.gpwGrowthYoy) },
      ],
    };
  }
  return { fiscalYear: null, metrics: [] };
}

function MetricCard({ m }: { m: MetricSpec }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] text-ink3">{m.label}</div>
        {m.spark && <MiniSpark points={m.spark} color={SPARK_COLOR} width={56} height={20} />}
      </div>
      <div className="num mt-1 text-[17px] font-semibold text-ink">{m.value}</div>
    </div>
  );
}

export function MetricsSection({ symbol }: { symbol: string }) {
  const { data: fundamentals, isLoading } = useStockFundamentals(symbol);

  if (isLoading) {
    return (
      <Section id="overview-metrics" label="Key metrics" icon={Icons.scales} accent="var(--p-own)">
        <LoadingBlock className="h-40" />
      </Section>
    );
  }

  const built = fundamentals?.built ?? false;
  const { fiscalYear, metrics } = fundamentals ? specsFor(fundamentals) : { fiscalYear: null, metrics: [] };
  const anyValue = metrics.some((m) => m.value !== DASH);

  if (!built || !anyValue) {
    return (
      <Section id="overview-metrics" label="Key metrics" icon={Icons.scales} accent="var(--p-own)">
        <HonestEmpty>Fundamental metrics not yet available for this stock.</HonestEmpty>
      </Section>
    );
  }

  return (
    <Section id="overview-metrics" label="Key metrics" icon={Icons.scales} accent="var(--p-own)" pill={fiscalYear ?? undefined}>
      <Panel>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} m={m} />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <p className="text-[11.5px] text-ink3">Latest annual ratios — the full statements live on the Fundamentals tab.</p>
          <Funnel tab="fundamentals" symbol={symbol} label="Fundamentals" />
        </div>
      </Panel>
    </Section>
  );
}
