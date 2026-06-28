"use client";

import { useMemo, useRef } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { useChartTooltip, ChartTooltip, TipBody } from "@/components/peer-group/chart-tooltip";
import { concentration, type HeadlineRow } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────────────
// §2 · Field Structure — the field's SHAPE by size. A segmented SHARE BAR (one bar split by
// member market cap, largest→smallest) reads concentration at a glance: one fat segment = a
// field dominated by one name; even segments = a balanced field. Plus aggregate field size,
// leader share, and how few names make up half / four-fifths of the field. Factual, no verdict.
// (A share bar — deliberately NOT the sorted rank-bars used elsewhere.)
// ─────────────────────────────────────────────────────────────────────────────────────

function fmtCr(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L Cr`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K Cr`;
  return `₹${Math.round(v)} Cr`;
}

// a calm, repeating neutral palette — NOT a good/bad scale (segments are just members).
const SEG = ["var(--p-found)", "var(--p-mom)", "var(--p-own)"];

export function StructureSection({ rows }: { rows: HeadlineRow[] }) {
  const c = useMemo(() => concentration(rows.map((r) => ({ symbol: r.symbol, mcap: r.marketCap }))), [rows]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tip, show, hide } = useChartTooltip(containerRef);

  if (c.withData < 2) {
    return (
      <section>
        <SectionEyebrow label="Field structure" icon={Icons.stack} accent="var(--p-own)" />
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          <p className="py-6 text-center text-[13px] text-ink3">
            Too few members have a market cap on file to show the field&apos;s size structure yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionEyebrow
        label="Field structure"
        icon={Icons.stack}
        accent="var(--p-own)"
        pill={fmtCr(c.aggregate)}
      />
      <Reveal>
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          {/* aggregate facts */}
          <div className="mb-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[12px] text-ink2">
            <span>
              Field size <span className="num font-medium text-ink">{fmtCr(c.aggregate)}</span>
            </span>
            <span>
              Largest{" "}
              <span className="num font-medium text-ink">
                {c.slices[0]?.symbol} {c.leaderShare != null ? `${(c.leaderShare * 100).toFixed(0)}%` : "—"}
              </span>
            </span>
            {c.count50 != null && (
              <span className="text-ink3">
                top <span className="num">{c.count50}</span> = ½ the field
              </span>
            )}
            {c.count80 != null && (
              <span className="text-ink3">
                top <span className="num">{c.count80}</span> = 80%
              </span>
            )}
          </div>

          {/* segmented share bar (tooltip lives in the relative parent so it isn't clipped) */}
          <div ref={containerRef} className="relative">
            <ChartTooltip tip={tip} />
            <div className="flex h-9 w-full overflow-hidden rounded-lg">
              {c.slices.map((s, i) => (
                <div
                  key={s.symbol}
                  className="num flex cursor-default items-center justify-center text-[10px] font-medium"
                  style={{
                    flex: s.share,
                    background: SEG[i % SEG.length],
                    opacity: 0.85 - (i % SEG.length) * 0.12,
                    color: "#0a0b0e",
                    minWidth: s.share > 0.06 ? undefined : 0,
                  }}
                  onMouseMove={(e) =>
                    show(
                      e,
                      <TipBody
                        title={s.symbol}
                        rows={[
                          { label: "Market cap", value: fmtCr(s.mcap) },
                          { label: "Share", value: `${(s.share * 100).toFixed(1)}%` },
                        ]}
                      />,
                    )
                  }
                  onMouseLeave={hide}
                >
                  {s.share > 0.07 ? s.symbol : ""}
                </div>
              ))}
            </div>
          </div>

          {/* legend (smaller names that didn't fit a label) */}
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink3">
            {c.slices.map((s, i) => (
              <span key={s.symbol} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm" style={{ background: SEG[i % SEG.length], opacity: 0.85 }} />
                <span className="num text-ink2">{s.symbol}</span> {(s.share * 100).toFixed(1)}%
              </span>
            ))}
          </div>

          {c.withData < c.total && (
            <p className="mt-2.5 text-[11px] text-ink3">
              <span className="num">{c.withData}</span> of <span className="num">{c.total}</span>{" "}
              members sized — others lack a market cap on file.
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
