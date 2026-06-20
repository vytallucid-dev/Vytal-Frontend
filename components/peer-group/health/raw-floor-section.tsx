"use client";

import { useState } from "react";
import { Icons } from "@/lib/icons";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { getMetricLabel } from "@/lib/health/metric-labels";
import type { PeerMetricDistribution, PeerGroupMemberView } from "@/types/peer-group";
import type { MetricBand } from "@/types/health";
import { cn } from "@/lib/utils";

const METRIC_BAND_VAR: Record<MetricBand, string> = {
  excellent: "var(--c-pristine)",
  good: "var(--c-healthy)",
  acceptable: "var(--c-steady)",
  concerning: "var(--c-below)",
  distress: "var(--c-fragile)",
};

interface Cell {
  rawValue: number;
  l1Band: MetricBand | null;
  scoreState: string;
}
interface Col {
  key: string;
  label: string;
  unit?: string;
}

function fmtVal(v: number, unit?: string): string {
  const d = unit === "×" || unit === "ratio" ? 2 : Math.abs(v) >= 100 ? 0 : 1;
  return v.toFixed(d);
}

export function RawFloorSection({
  metrics,
  members,
}: {
  metrics: PeerMetricDistribution[];
  members: PeerGroupMemberView[];
}) {
  const [open, setOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string>("symbol");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const cols: Col[] = metrics.map((m) => ({
    key: m.metricKey,
    label: getMetricLabel(m.metricKey).label,
    unit: getMetricLabel(m.metricKey).unit,
  }));

  // pivot: symbol → { name, composite, cells }
  const bySymbol = new Map<string, { name: string; composite: number; cells: Map<string, Cell> }>();
  for (const m of members) {
    bySymbol.set(m.symbol, { name: m.name, composite: m.composite, cells: new Map() });
  }
  for (const dist of metrics) {
    for (const mem of dist.members) {
      const row = bySymbol.get(mem.symbol);
      if (row) {
        row.cells.set(dist.metricKey, {
          rawValue: mem.rawValue,
          l1Band: mem.l1Band,
          scoreState: mem.scoreState,
        });
      }
    }
  }

  const symbols = [...bySymbol.keys()];
  symbols.sort((a, b) => {
    if (sortKey === "symbol") return a < b ? -sortDir : a > b ? sortDir : 0;
    const av = bySymbol.get(a)!.cells.get(sortKey)?.rawValue ?? -Infinity;
    const bv = bySymbol.get(b)!.cells.get(sortKey)?.rawValue ?? -Infinity;
    return (av - bv) * sortDir;
  });

  const onSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(key === "symbol" ? 1 : -1);
    }
    setExpanded(null);
  };

  return (
    <section>
      <SectionEyebrow label="The underlying record" pill="every number behind the scores" />
      <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-3 text-ink2">
            <Icons.stack className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-[14px] font-semibold text-ink">Show the underlying data</span>
            <span className="block text-[12px] text-ink3">
              The reported figures behind every score — per name, sortable. The raw layer beneath the
              verdicts above.
            </span>
          </span>
          <Icons.caretDown
            className={cn("size-5 shrink-0 text-ink3 transition-transform", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="px-5 pb-5">
            <p className="pb-3 text-[11px] italic text-ink3">
              Click any name to expand its full metric breakdown. Quarterly/annual series &amp;
              shareholding history are a later enrichment — current period shown.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th
                      onClick={() => onSort("symbol")}
                      className="cursor-pointer select-none border-b border-line2 px-3 py-2.5 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink3 hover:text-ink2"
                    >
                      Name {sortKey === "symbol" && <span className="text-steady">{sortDir < 0 ? "▼" : "▲"}</span>}
                    </th>
                    {cols.map((c) => (
                      <th
                        key={c.key}
                        onClick={() => onSort(c.key)}
                        className="cursor-pointer select-none whitespace-nowrap border-b border-line2 px-3 py-2.5 text-right text-[9.5px] font-semibold uppercase tracking-wide text-ink3 hover:text-ink2"
                        title={c.key}
                      >
                        {c.label} {sortKey === c.key && <span className="text-steady">{sortDir < 0 ? "▼" : "▲"}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {symbols.map((sym) => {
                    const row = bySymbol.get(sym)!;
                    const isExp = expanded === sym;
                    return (
                      <RawRow
                        key={sym}
                        sym={sym}
                        row={row}
                        cols={cols}
                        isExp={isExp}
                        onToggle={() => setExpanded((e) => (e === sym ? null : sym))}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BandChip({ band }: { band: MetricBand | null }) {
  if (!band) return <span className="text-ink3">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink2">
      <span className="size-2 rounded-sm" style={{ background: METRIC_BAND_VAR[band] }} />
      {band}
    </span>
  );
}

function RawRow({
  sym,
  row,
  cols,
  isExp,
  onToggle,
}: {
  sym: string;
  row: { name: string; composite: number; cells: Map<string, Cell> };
  cols: Col[];
  isExp: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="group hover:bg-surface-2">
        <td
          onClick={onToggle}
          className="num cursor-pointer whitespace-nowrap border-b border-line px-3 py-2.5 text-left font-medium text-ink"
        >
          <span className="mr-1 text-[10px] text-ink3">{isExp ? "▾" : "▸"}</span>
          {sym}
        </td>
        {cols.map((c) => {
          const cell = row.cells.get(c.key);
          return (
            <td key={c.key} className="num border-b border-line px-3 py-2.5 text-right text-ink2">
              {cell ? fmtVal(cell.rawValue, c.unit) : <span className="text-ink3">—</span>}
            </td>
          );
        })}
      </tr>
      {isExp && (
        <tr>
          <td colSpan={cols.length + 1} className="border-b border-line2 bg-surface-2 p-0">
            <div className="p-4">
              <div className="mb-1 text-[13px] font-medium text-ink">{row.name}</div>
              <div className="mb-3 text-[11px] text-ink3">
                Composite {Math.round(row.composite)} · current-period metric breakdown
              </div>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {cols.map((c) => {
                  const cell = row.cells.get(c.key);
                  return (
                    <div key={c.key} className="flex items-center justify-between gap-3 border-b border-line py-1.5">
                      <span className="text-[11.5px] text-ink2">
                        {c.label}
                        <span className="num ml-1.5 text-[9px] text-ink3">{c.key}</span>
                      </span>
                      <span className="flex items-center gap-2.5">
                        <BandChip band={cell?.l1Band ?? null} />
                        <span className="num text-[12.5px] font-medium text-ink">
                          {cell ? `${fmtVal(cell.rawValue, c.unit)}${c.unit ? ` ${c.unit}` : ""}` : "—"}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[10.5px] italic text-ink3">
                Full quarterly &amp; annual reported series and shareholding history — deferred to a
                later enrichment; the scoring substrate (current-period values + data-derived bands)
                is shown here.
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
