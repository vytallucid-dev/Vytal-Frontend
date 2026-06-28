"use client";

import { useRef, type ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/peer-group/chart-tooltip";
import { fieldAverages, type OwnershipRow } from "./lib";

const pct = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`);

// ─────────────────────────────────────────────────────────────────────────────────────
// §B · Flows — the field's institutional direction over the loaded window.
// A CHANGE-RANKING (diverging bars), not a grouped-bar-for-everything default: who has
// gained / lost the most institutional (FII+DII) share. Factual — accumulation vs
// distribution leaders, no "therefore buy". Members without a 2-quarter holding history
// are listed honestly as "no trend yet", never dropped silently.
// ─────────────────────────────────────────────────────────────────────────────────────

const POS = "var(--c-healthy)";
const NEG = "var(--c-below)";

function fmtPp(v: number) {
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}`;
}

function ChangeBar({
  row,
  max,
  onShow,
  onHide,
}: {
  row: OwnershipRow;
  max: number;
  onShow: (e: { clientX: number; clientY: number }, content: ReactNode) => void;
  onHide: () => void;
}) {
  const v = row.windowDelta ?? 0;
  const frac = max > 0 ? Math.min(Math.abs(v) / max, 1) : 0;
  const pos = v >= 0;
  return (
    <div
      className="flex cursor-default items-center gap-2 rounded py-1 transition-colors hover:bg-surface-2"
      onMouseMove={(e) =>
        onShow(
          e,
          <TipBody
            title={row.symbol}
            rows={[
              { label: "Window Δ", value: `${fmtPp(v)} pp` },
              { label: "FII", value: pct(row.fii) },
              { label: "DII", value: pct(row.dii) },
              { label: "Inst. now", value: pct(row.instNow) },
            ]}
          />,
        )
      }
      onMouseLeave={onHide}
    >
      <div className="num w-20 shrink-0 truncate text-[12px] text-ink2">{row.symbol}</div>
      {/* diverging track: centre is zero */}
      <div className="relative h-4 flex-1">
        <div className="absolute inset-y-0 left-1/2 w-px bg-line2" />
        <div
          className={cn("absolute inset-y-0.5 rounded-sm", pos ? "left-1/2" : "right-1/2")}
          style={{
            width: `${frac * 50}%`,
            background: pos ? POS : NEG,
            opacity: 0.85,
          }}
        />
      </div>
      <div
        className="num w-12 shrink-0 text-right text-[12px] font-medium"
        style={{ color: v === 0 ? "var(--ink3)" : pos ? POS : NEG }}
      >
        {fmtPp(v)}
      </div>
    </div>
  );
}

export function FlowsSection({ rows }: { rows: OwnershipRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(containerRef);

  const ranked = rows
    .filter((r) => r.windowDelta != null)
    .sort((a, b) => (b.windowDelta ?? 0) - (a.windowDelta ?? 0));
  const noTrend = rows.filter((r) => !r.pending && r.windowDelta == null);
  const stillLoading = rows.some((r) => r.pending);

  const max = ranked.reduce((m, r) => Math.max(m, Math.abs(r.windowDelta ?? 0)), 0);
  const { avgFii, avgDii, withData } = fieldAverages(rows);

  return (
    <section>
      <SectionEyebrow
        label="Institutional flows across the field"
        icon={Icons.trendUp}
        accent="var(--p-mom)"
        pill="FII + DII"
      />
      <Reveal>
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          {/* field aggregate — calm, factual */}
          <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[12px] text-ink2">
            <span>
              Field average FII{" "}
              <span className="num font-medium text-ink">
                {avgFii != null ? `${avgFii.toFixed(1)}%` : "—"}
              </span>
            </span>
            <span>
              Field average DII{" "}
              <span className="num font-medium text-ink">
                {avgDii != null ? `${avgDii.toFixed(1)}%` : "—"}
              </span>
            </span>
            <span className="text-ink3">
              across <span className="num">{withData}</span> of{" "}
              <span className="num">{rows.length}</span> members with data
            </span>
          </div>

          {ranked.length > 0 ? (
            <>
              <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-ink3">
                Institutional share change over the window (pp) — gainers to top
              </div>
              <div ref={containerRef} className="relative flex flex-col">
                <ChartTooltip tip={tip} />
                {ranked.map((r) => (
                  <ChangeBar key={r.symbol} row={r} max={max} onShow={show} onHide={hide} />
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-ink3">
                Change in combined FII + DII holding, earliest to latest loaded quarter. Hover a row
                for its FII / DII split. Accumulation (positive) and distribution (negative) are stated
                as facts, not recommendations.
              </p>
            </>
          ) : (
            <p className="text-[13px] text-ink3">
              {stillLoading
                ? "Assembling member ownership histories…"
                : "No member has two quarters of holding data in this window yet — institutional trend will show once histories deepen."}
            </p>
          )}

          {noTrend.length > 0 && ranked.length > 0 && (
            <p className="mt-2 text-[11px] text-ink3">
              No trend yet (single quarter on file):{" "}
              <span className="num text-ink2">
                {noTrend.map((r) => r.symbol).join(", ")}
              </span>
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
