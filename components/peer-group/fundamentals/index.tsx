"use client";

import { useMemo } from "react";
import { StandingsTable } from "@/components/peer-group/standings-table";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import {
  usePeerGroupMemberData,
  type MemberLike,
} from "@/lib/api/hooks/use-peer-group-member-data";
import {
  deriveFundamentalsRow,
  fundamentalsColumns,
  resolveFamily,
  type FundamentalsRow,
} from "./lib";
import { GrowthSection } from "./growth-section";
import { ProfitabilitySection } from "./profitability-section";
import { BalanceSheetSection } from "./balance-sheet-section";
import { DeepMetricsSection } from "./deep-metrics-section";

// ─────────────────────────────────────────────────────────────────────────────────────
// THE PG Fundamentals tab — member-vs-member financial comparison on the FIELD's own
// (family-aware) terms. Reuses the assembly hook + the Standings primitive; sections B/C/D
// each slice the SAME assembled data into a different distribution visual (scatter / strip /
// ranking — varied, not bars-for-everything). §E is the config-ready deep-metrics extension.
//
// NON-NEGOTIABLE: real financial data, NO health framing, NO winner/best-in-group, NO
// buy/sell/predictions. Sortable standings + distributions; the user judges.
// ─────────────────────────────────────────────────────────────────────────────────────

export function PeerGroupFundamentals({
  peerGroupId,
  members,
}: {
  peerGroupId: string;
  members: MemberLike[];
}) {
  const asm = usePeerGroupMemberData(peerGroupId, members, "fundamentals");

  const rows: FundamentalsRow[] = useMemo(
    () =>
      asm.members.map((m) =>
        deriveFundamentalsRow(m.symbol, m.name, m.data, m.isLoading),
      ),
    [asm.members],
  );

  const family = resolveFamily(rows);
  const isBanking = family === "banking";
  const { columns, initialSortKey } = useMemo(
    () => fundamentalsColumns(family),
    [family],
  );

  const views = useMemo(() => asm.members.map((m) => m.data), [asm.members]);

  return (
    <div className="flex flex-col gap-2">
      {/* §A — Operating Standings (the shared primitive, family-aware columns). */}
      <section>
        <SectionEyebrow
          label="Operating standings"
          icon={Icons.chartBar}
          accent="var(--p-own)"
          pill={`${members.length} members`}
        />
        {!asm.isComplete && (
          <p className="mb-2.5 text-[11.5px] text-ink3">
            Assembling member fundamentals in parallel —{" "}
            <span className="num">
              {asm.resolvedCount} of {members.length}
            </span>{" "}
            loaded.
          </p>
        )}
        <Reveal>
          <StandingsTable
            rows={rows}
            columns={columns}
            rowHref={(symbol) => `/research/stock-screener/${symbol}?tab=fundamentals`}
            initialSort={{ key: initialSortKey, dir: "desc" }}
          />
        </Reveal>
        <p className="mt-2.5 text-[11.5px] text-ink3">
          {isBanking
            ? "Bank-relevant fundamentals — NII & profit growth, NIM, asset quality (GNPA), returns and efficiency. Columns that don't apply to banks (ROCE, D/E) aren't shown."
            : "Growth, margins, returns and leverage from each member's latest annual filing; growth is year-on-year (multi-year CAGR isn't stored, so none is shown). "}
          Click a member for its fundamentals; select two to compare. Missing values show
          &quot;—&quot;; the table ranks and contrasts, it never crowns a pick.
        </p>
      </section>

      {/* §B / §C / §D — distribution depth, varied visuals. */}
      <GrowthSection rows={rows} isBanking={isBanking} />
      <ProfitabilitySection rows={rows} isBanking={isBanking} />
      <BalanceSheetSection rows={rows} isBanking={isBanking} />

      {/* §E — config-ready group-specific deep metrics. */}
      <DeepMetricsSection peerGroupId={peerGroupId} views={views} />
    </div>
  );
}
