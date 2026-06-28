"use client";

import { useMemo, type ReactNode } from "react";
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
import {
  deriveValuationRow,
  median,
  premiumPct,
  resolveFamily,
  showsEvEbitda,
  type ValuationRow,
} from "./lib";
import { PositioningScatter } from "./positioning-scatter";

// ─────────────────────────────────────────────────────────────────────────────────────
// THE PG Valuation tab — factual relative valuation WITHIN the fair peer set (the one
// place relative valuation is honest). Reuses the assembly hook (twice: price +
// fundamentals) and the shared Standings primitive — no new table, no new fetch pattern.
//
// Sections: A · Valuation Standings (multiples + premium/discount to group median) →
// B · Valuation Positioning (P/E-vs-quality scatter, plot-and-stop).
//
// NON-NEGOTIABLE: no health framing, no targets, no predictions, no buy/sell, no value-trap
// / quadrant verdicts. Relative valuation shown; the user judges.
// ─────────────────────────────────────────────────────────────────────────────────────

const dash = <span className="text-ink3">—</span>;

const fmtMcap = (v: number | null): ReactNode => {
  if (v == null) return dash;
  if (v >= 100000) return <span className="num">₹{(v / 100000).toFixed(2)}L Cr</span>;
  if (v >= 1000) return <span className="num">₹{(v / 1000).toFixed(1)}K Cr</span>;
  return <span className="num">₹{Math.round(v)} Cr</span>;
};

/** A multiple cell: the value + a NEUTRAL premium/discount-vs-median sub-line (a fact,
 *  never coloured good/bad). */
function multipleCell(value: number | null, med: number | null): ReactNode {
  if (value == null) return dash;
  const prem = premiumPct(value, med);
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="num font-medium text-ink">{value.toFixed(1)}</span>
      {prem != null && Math.abs(prem) >= 1 ? (
        <span className="num text-[10px] text-ink3">
          {prem > 0 ? "+" : ""}
          {prem.toFixed(0)}% vs med
        </span>
      ) : prem != null ? (
        <span className="num text-[10px] text-ink3">≈ median</span>
      ) : null}
    </div>
  );
}

export function PeerGroupValuation({
  peerGroupId,
  members,
}: {
  peerGroupId: string;
  members: MemberLike[];
}) {
  const priceAsm = usePeerGroupMemberData(peerGroupId, members, "price");
  const fundAsm = usePeerGroupMemberData(peerGroupId, members, "fundamentals");

  const rows: ValuationRow[] = useMemo(
    () =>
      members.map((m, i) => {
        const p = priceAsm.members[i];
        const f = fundAsm.members[i];
        const pending = (p?.isLoading ?? true) || (f?.isLoading ?? true);
        return deriveValuationRow(m.symbol, m.name, p?.data ?? null, f?.data ?? null, pending);
      }),
    [members, priceAsm.members, fundAsm.members],
  );

  const family = resolveFamily(rows);
  const evVisible = showsEvEbitda(family);

  // Group medians across resolved (non-null) members — the relative reference.
  const medians = useMemo(
    () => ({
      pe: median(rows.map((r) => r.pe)),
      pb: median(rows.map((r) => r.pb)),
      evEbitda: median(rows.map((r) => r.evEbitda)),
    }),
    [rows],
  );

  const columns: StandingsColumn<ValuationRow>[] = useMemo(() => {
    const cols: StandingsColumn<ValuationRow>[] = [
      {
        key: "pe",
        header: "P/E",
        hint: "trailing · vs median",
        sortValue: (r) => r.pe,
        render: (r) => multipleCell(r.pe, medians.pe),
      },
      {
        key: "pb",
        header: "P/B",
        hint: "vs median",
        sortValue: (r) => r.pb,
        render: (r) => multipleCell(r.pb, medians.pb),
      },
      {
        key: "marketCap",
        header: "Market cap",
        hint: "₹ Cr",
        sortValue: (r) => r.marketCap,
        render: (r) => fmtMcap(r.marketCap),
      },
    ];
    if (evVisible) {
      cols.push({
        key: "evEbitda",
        header: "EV / EBITDA",
        hint: "TTM · vs median",
        sortValue: (r) => r.evEbitda,
        render: (r) => multipleCell(r.evEbitda, medians.evEbitda),
      });
    }
    return cols;
  }, [medians, evVisible]);

  const resolvedCount = priceAsm.resolvedCount; // both assemblies advance together
  const isComplete = priceAsm.isComplete && fundAsm.isComplete;

  return (
    <div className="flex flex-col gap-2">
      {/* §A — Valuation Standings (the shared primitive). */}
      <section>
        <SectionEyebrow
          label="Valuation standings"
          icon={Icons.coins}
          accent="var(--p-own)"
          pill={`${members.length} members`}
        />
        {!isComplete && (
          <p className="mb-2.5 text-[11.5px] text-ink3">
            Assembling member price &amp; fundamentals in parallel —{" "}
            <span className="num">
              {resolvedCount} of {members.length}
            </span>{" "}
            loaded.
          </p>
        )}
        <Reveal>
          <StandingsTable
            rows={rows}
            columns={columns}
            rowHref={(symbol) => `/research/stock-screener/${symbol}?tab=fundamentals`}
            initialSort={{ key: "marketCap", dir: "desc" }}
          />
        </Reveal>
        <p className="mt-2.5 text-[11.5px] text-ink3">
          P/E and P/B from each member&apos;s price over its latest annual EPS / book value;
          {evVisible ? " EV/EBITDA from TTM operating profit;" : ""} market cap as stored.
          &quot;vs med&quot; is the premium (+) or discount (−) to the group&apos;s median multiple
          — a fact about relative pricing, not a recommendation. Members with negative or missing
          earnings show &quot;—&quot;, never a fabricated ratio.
        </p>
        {!evVisible && family != null && (
          <p className="mt-1.5 text-[11.5px] text-ink3">
            EV/EBITDA isn&apos;t meaningful for financials — it&apos;s omitted for this group.
          </p>
        )}
      </section>

      {/* §B — Valuation Positioning scatter (plot-and-stop). */}
      <PositioningScatter rows={rows} family={family} />
    </div>
  );
}
