"use client";

import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  StandingsTable,
  type StandingsColumn,
} from "@/components/peer-group/standings-table";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import {
  usePeerGroupMemberData,
  type MemberLike,
} from "@/lib/api/hooks/use-peer-group-member-data";
import { deriveOwnershipRow, type OwnershipRow } from "./lib";
import { FlowsSection } from "./flows-section";
import { ActivitySection } from "./activity-section";

// ─────────────────────────────────────────────────────────────────────────────────────
// THE PG Ownership (Shareholding) tab — the FOUNDATION build.
// Establishes (a) the per-member parallel/progressive assembly pattern and (b) the shared
// Standings primitive, both reused by the Valuation / Fundamentals / Overview tabs.
//
// Sections: A · Ownership Standings (the Standings primitive) → B · Flows (field
// institutional change-ranking) → C · Activity (dormant block/insider tiles).
// ─────────────────────────────────────────────────────────────────────────────────────

const dash = <span className="text-ink3">—</span>;

function pctCell(v: number | null): ReactNode {
  return v == null ? dash : <span className="num">{v.toFixed(1)}%</span>;
}

function deltaCell(v: number | null): ReactNode {
  if (v == null) return dash;
  const tone = v > 0 ? "var(--c-healthy)" : v < 0 ? "var(--c-below)" : "var(--ink3)";
  return (
    <span className="num font-medium" style={{ color: tone }}>
      {v > 0 ? "+" : ""}
      {v.toFixed(1)}
    </span>
  );
}

const COLUMNS: StandingsColumn<OwnershipRow>[] = [
  {
    key: "promoter",
    header: "Promoter",
    hint: "%",
    sortValue: (r) => r.promoter,
    render: (r) => pctCell(r.promoter),
  },
  {
    key: "fii",
    header: "FII",
    hint: "%",
    sortValue: (r) => r.fii,
    render: (r) => pctCell(r.fii),
  },
  {
    key: "dii",
    header: "DII",
    hint: "%",
    sortValue: (r) => r.dii,
    render: (r) => pctCell(r.dii),
  },
  {
    key: "public",
    header: "Public",
    hint: "% retail float",
    sortValue: (r) => r.public,
    render: (r) => pctCell(r.public),
  },
  {
    key: "instDeltaQoq",
    header: "Inst. Δ",
    hint: "FII+DII QoQ, pp",
    sortValue: (r) => r.instDeltaQoq,
    render: (r) => deltaCell(r.instDeltaQoq),
  },
];

export function PeerGroupShareholding({
  peerGroupId,
  members,
}: {
  peerGroupId: string;
  members: MemberLike[];
}) {
  const searchParams = useSearchParams();
  const highlightSymbol = searchParams.get("from")?.toUpperCase() ?? null;

  const assembly = usePeerGroupMemberData(peerGroupId, members, "ownership");

  const rows: OwnershipRow[] = useMemo(
    () =>
      assembly.members.map((m) =>
        deriveOwnershipRow(m.symbol, m.name, m.data, m.isLoading),
      ),
    [assembly.members],
  );

  const { resolvedCount, totalCount, isComplete } = assembly;

  return (
    <div className="flex flex-col gap-2">
      {/* §A — Ownership Standings (the shared primitive). */}
      <section>
        <SectionEyebrow
          label="Ownership standings"
          icon={Icons.building}
          accent="var(--p-own)"
          pill={`${totalCount} members`}
        />
        {!isComplete && (
          <p className="mb-2.5 text-[11.5px] text-ink3">
            Assembling member shareholding in parallel —{" "}
            <span className="num">
              {resolvedCount} of {totalCount}
            </span>{" "}
            loaded.
          </p>
        )}
        <Reveal>
          <StandingsTable
            rows={rows}
            columns={COLUMNS}
            rowHref={(symbol) => `/research/stock-screener/${symbol}?tab=activity`}
            highlightSymbol={highlightSymbol}
            initialSort={{ key: "promoter", dir: "desc" }}
          />
        </Reveal>
        <p className="mt-2.5 text-[11.5px] text-ink3">
          Promoter, FII, DII and public (retail float) from each member&apos;s latest
          shareholding filing. Click a member for its activity tab; select two to compare. Sort
          any column — the table ranks and contrasts, it never crowns a pick.
        </p>
      </section>

      {/* §B — Flows. */}
      <FlowsSection rows={rows} />

      {/* §C — Activity (live field-level insider + block-deal feeds from the assembly). */}
      <ActivitySection assembly={assembly} />
    </div>
  );
}
