"use client";

import { useMemo, type ReactNode } from "react";
import {
  StandingsTable,
  type StandingsColumn,
} from "@/components/peer-group/standings-table";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { healthColorVar, healthLabel } from "@/lib/format";
import {
  usePeerGroupMemberData,
  type MemberLike,
} from "@/lib/api/hooks/use-peer-group-member-data";
import { getPeerGroupConfig } from "@/lib/peer-group/config";
import { readConfigMetric } from "@/lib/peer-group/read-metric";
import type { PeerGroupHealthView } from "@/types/peer-group";
import {
  computePE,
  type CompositeMemberInput,
  type HeadlineRow,
} from "./lib";
import { IdentitySection } from "./identity-section";
import { StructureSection } from "./structure-section";
import { FieldPerformanceSection } from "./field-performance-section";
import { HealthGlanceSection } from "./health-glance-section";

// ─────────────────────────────────────────────────────────────────────────────────────
// THE PG Overview tab — the field portrait / lobby. Unlike the lens tabs (one comparison
// each), Overview tells the WHOLE-GROUP story + a cross-dimensional headline snapshot, then
// funnels into the four lenses. Reuses the assembly hook (price + fundamentals) and the
// Standings primitive. NO winner/best-in-group, NO buy/sell, NO predictions.
//
// Sections: 1 Identity (config, verified editorial) · 2 Structure (concentration) ·
// 3 Headline standings (health+mcap+keyMetric+P/E+1Y, cross-dimensional) · 4 Field
// performance (price composite) · 5 Health glance (funnel to the pond).
// ─────────────────────────────────────────────────────────────────────────────────────

const dash = <span className="text-ink3">—</span>;

function fmtCr(v: number | null): ReactNode {
  if (v == null) return dash;
  if (v >= 100000) return <span className="num">₹{(v / 100000).toFixed(2)}L Cr</span>;
  if (v >= 1000) return <span className="num">₹{(v / 1000).toFixed(1)}K Cr</span>;
  return <span className="num">₹{Math.round(v)} Cr</span>;
}

export function PeerGroupOverview({
  peerGroupId,
  view,
  onOpenTab,
}: {
  peerGroupId: string;
  view: PeerGroupHealthView;
  onOpenTab: (tab: "health") => void;
}) {
  const members: MemberLike[] = view.members.map((m) => ({ symbol: m.symbol, name: m.name }));
  const priceAsm = usePeerGroupMemberData(peerGroupId, members, "price");
  const fundAsm = usePeerGroupMemberData(peerGroupId, members, "fundamentals");

  const config = getPeerGroupConfig(peerGroupId);
  // group-defining metric: first SCORED config metric (excluding the CASA gap); else ROE.
  const keyMeta = useMemo(() => {
    const scored = (config?.keyMetrics ?? []).filter((m) => m.source === "scored" && m.key !== "casa");
    return scored[0] ?? { key: "roe", label: "ROE", unit: "pct" as const };
  }, [config]);

  const rows: HeadlineRow[] = useMemo(
    () =>
      view.members.map((h, i) => {
        const price = priceAsm.members[i]?.data ?? null;
        const fund = fundAsm.members[i]?.data ?? null;
        const pending = (priceAsm.members[i]?.isLoading ?? true) || (fundAsm.members[i]?.isLoading ?? true);
        return {
          symbol: h.symbol,
          name: h.name,
          pending,
          composite: h.composite ?? null,
          labelBand: h.labelBand ?? null,
          marketCap: price?.current.marketCap ?? null,
          keyMetric: readConfigMetric(fund, keyMeta.key),
          pe: computePE(price, fund),
          return1y: price?.stock.returns.r1y ?? null,
        };
      }),
    [view.members, priceAsm.members, fundAsm.members, keyMeta.key],
  );

  const compositeMembers: CompositeMemberInput[] = useMemo(
    () =>
      view.members.map((h, i) => {
        const price = priceAsm.members[i]?.data ?? null;
        return {
          symbol: h.symbol,
          mcap: price?.current.marketCap ?? null,
          series: price?.stock.series ?? [],
        };
      }),
    [view.members, priceAsm.members],
  );

  const fmtKeyMetric = (v: number | null): ReactNode => {
    if (v == null) return dash;
    if (keyMeta.unit === "x" || keyMeta.unit === "ratio") return <span className="num">{v.toFixed(2)}×</span>;
    return <span className="num">{v.toFixed(1)}%</span>;
  };

  const columns: StandingsColumn<HeadlineRow>[] = useMemo(
    () => [
      {
        key: "composite",
        header: "Health",
        hint: "composite",
        sortValue: (r) => r.composite,
        render: (r) =>
          r.composite == null ? (
            dash
          ) : (
            <div className="flex flex-col items-end leading-tight">
              <span className="num font-semibold" style={{ color: healthColorVar(r.composite) }}>
                {Math.round(r.composite)}
              </span>
              <span className="text-[10px] text-ink3">{healthLabel(r.composite)}</span>
            </div>
          ),
      },
      {
        key: "marketCap",
        header: "Market cap",
        hint: "₹ Cr",
        sortValue: (r) => r.marketCap,
        render: (r) => fmtCr(r.marketCap),
      },
      {
        key: "keyMetric",
        header: keyMeta.label,
        hint: "group metric",
        sortValue: (r) => r.keyMetric,
        render: (r) => fmtKeyMetric(r.keyMetric),
      },
      {
        key: "pe",
        header: "P/E",
        hint: "trailing",
        sortValue: (r) => r.pe,
        render: (r) => (r.pe == null ? dash : <span className="num">{r.pe.toFixed(1)}</span>),
      },
      {
        key: "return1y",
        header: "1Y return",
        hint: "%",
        sortValue: (r) => r.return1y,
        render: (r) =>
          r.return1y == null ? (
            dash
          ) : (
            <span className="num">
              {r.return1y > 0 ? "+" : ""}
              {r.return1y.toFixed(1)}%
            </span>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keyMeta.label, keyMeta.unit],
  );

  const isComplete = priceAsm.isComplete && fundAsm.isComplete;

  return (
    <div className="flex flex-col gap-2">
      {/* §1 — Field identity. */}
      <IdentitySection config={config} identity={view.identity} />

      {/* §2 — Field structure (concentration). */}
      <StructureSection rows={rows} />

      {/* §3 — Headline cross-dimensional standings. */}
      <section>
        <SectionEyebrow
          label="Who's who"
          icon={Icons.stack}
          accent="var(--p-own)"
          pill={`${members.length} members`}
        />
        {!isComplete && (
          <p className="mb-2.5 text-[11.5px] text-ink3">
            Assembling health, price &amp; fundamentals in parallel —{" "}
            <span className="num">
              {Math.min(priceAsm.resolvedCount, fundAsm.resolvedCount)} of {members.length}
            </span>{" "}
            loaded.
          </p>
        )}
        <Reveal>
          <StandingsTable
            rows={rows}
            columns={columns}
            rowHref={(symbol) => `/research/stock-screener/${symbol}?tab=overview`}
            initialSort={{ key: "marketCap", dir: "desc" }}
          />
        </Reveal>
        <p className="mt-2.5 text-[11.5px] text-ink3">
          A cross-dimensional snapshot — health, size, {keyMeta.label}, P/E and one-year return per
          member, the read each lens tab then deepens. Click a member for its page; select two to
          compare. Honest &quot;—&quot; where a value is missing; no member is crowned.
        </p>
      </section>

      {/* §4 — Field performance over time. */}
      <FieldPerformanceSection members={compositeMembers} />

      {/* §5 — Health glance → funnel to the pond. */}
      {view.aggregate && (
        <HealthGlanceSection aggregate={view.aggregate} onOpenHealth={() => onOpenTab("health")} />
      )}
    </div>
  );
}
