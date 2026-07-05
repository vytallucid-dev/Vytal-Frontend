"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { LensPatternPill, PILLAR_META } from "@/components/stock-detail/health/shared";
import type { PillarKey } from "@/types/health";
import type { Holding, PortfolioSnapshot } from "@/types/portfolio";
import { STOCK_BAND_LABEL, holdingHealthColor } from "../lib";
import { type HoldingRank, flaggedSymbols, rankedHoldings } from "./lib";

const CARD = "rounded-xl border border-line bg-surface-1 p-3 sm:p-4";
const PILLAR_ORDER: PillarKey[] = ["foundation", "momentum", "market", "ownership"];

// ── the one-line "why it's here" state for a row (band + flag, descriptive) ──────────
function rowState(rank: HoldingRank): string {
  if (rank.unscored) return "Not yet scored — awaiting coverage";
  if (rank.flagged && rank.weak) return "Weak band with an active red flag";
  if (rank.flagged) return "An active red flag is firing";
  if (rank.weak) return "Weak band — a drag on the book's Quality";
  return "Sound and steady — no attention needed";
}

// a common shape across LP (pillar) and LM (metric) lens patterns
interface LensEvidence {
  pillarLabel: string;
  id: string;
  label: string;
  tone: string;
  fieldVerdict: "PG_WEAK" | "PG_STRONG" | null;
  role: "top_level" | "supporting_detail";
  verdict?: string;
}

// ── the expanded per-stock evidence — the three-lens (LM/LP) patterns pulled from the
//    per-stock health read. This is TEXTURE beneath the portfolio headline, never a
//    competing top-level card (anti-double-count, B.7). Lazy: mounts only on expand. ──
function HoldingEvidence({ symbol }: { symbol: string }) {
  const q = useStockHealth(symbol);

  if (q.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 px-1 py-3 sm:grid-cols-4">
        {PILLAR_ORDER.map((k) => (
          <div key={k} className="shimmer h-8 rounded-md bg-surface-2" />
        ))}
      </div>
    );
  }
  if (q.isError || !q.data) {
    return <p className="px-1 py-3 text-[11.5px] italic text-ink3">The per-stock evidence couldn&apos;t load right now.</p>;
  }
  if (!q.data.scored) {
    return (
      <p className="px-1 py-3 text-[11.5px] leading-relaxed text-ink3">
        Vytal doesn&apos;t cover this name yet, so there&apos;s no three-lens evidence to show — we don&apos;t invent one.
      </p>
    );
  }

  const pillars = q.data.pillars ?? [];
  const evidence: LensEvidence[] = [];
  for (const p of pillars) {
    const label = PILLAR_META[p.pillar]?.label ?? p.pillar;
    for (const lp of p.lensPillarPatterns ?? []) {
      evidence.push({ pillarLabel: label, id: lp.id, label: lp.label, tone: lp.tone, fieldVerdict: lp.fieldVerdict, role: lp.role, verdict: lp.verdict });
    }
    for (const m of p.metrics ?? []) {
      if (m.lensPattern) {
        const lm = m.lensPattern;
        evidence.push({ pillarLabel: label, id: `${m.metricKey}-${lm.id}`, label: lm.label, tone: lm.tone, fieldVerdict: lm.fieldVerdict, role: lm.role, verdict: lm.verdict });
      }
    }
  }
  const lead = evidence.filter((e) => e.role === "top_level");
  const supporting = evidence.filter((e) => e.role === "supporting_detail");

  return (
    <div className="px-1 py-3">
      {/* the 4 pillar subtotals — the composite's frame, for context under the headline */}
      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {PILLAR_ORDER.map((k) => {
          const p = pillars.find((x) => x.pillar === k);
          const v = p?.subtotal ?? null;
          const meta = PILLAR_META[k];
          return (
            <div key={k} className="flex items-center gap-2">
              <span className="w-[68px] shrink-0 text-[10px] text-ink3">{meta.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full" style={{ width: `${v ?? 0}%`, background: meta.cssVar }} />
              </div>
              <span className="num w-6 shrink-0 text-right text-[10px] font-medium" style={{ color: meta.cssVar }}>
                {v == null ? "—" : Math.round(v)}
              </span>
            </div>
          );
        })}
      </div>

      {evidence.length === 0 ? (
        <p className="text-[11.5px] leading-relaxed text-ink3">
          No three-lens pattern fired on this name — the read across bar, field and trend is uneventful.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {lead.length > 0 && (
            <div className="flex flex-col gap-2">
              {lead.map((e) => (
                <div key={e.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-[68px] shrink-0 text-[9.5px] uppercase tracking-wide text-ink3">{e.pillarLabel}</span>
                    <LensPatternPill label={e.label} tone={e.tone} fieldVerdict={e.fieldVerdict} role={e.role} />
                  </div>
                  {e.verdict && <p className="pl-[76px] text-[11.5px] leading-relaxed text-ink2">{e.verdict}</p>}
                </div>
              ))}
            </div>
          )}
          {supporting.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
              <span className="text-[9.5px] uppercase tracking-wide text-ink3">also</span>
              {supporting.map((e) => (
                <LensPatternPill key={e.id} label={e.label} tone={e.tone} fieldVerdict={e.fieldVerdict} role={e.role} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── one holding row — weight · symbol · band + composite · state. Attention names carry
//    a left accent and open; sound scored names stay calm but still open for evidence. ─
function HoldingRow({ rank }: { rank: HoldingRank }) {
  const [open, setOpen] = useState(false);
  const h = rank.holding;
  const color = holdingHealthColor(h);
  const attention = rank.weak || rank.flagged;
  const accent = rank.flagged ? "var(--crit)" : rank.weak ? "var(--high)" : "transparent";
  const canExpand = h.health != null; // unscored names have no per-stock evidence to open

  return (
    <div
      className="overflow-hidden rounded-lg border border-line bg-surface-1"
      style={attention ? { borderLeftColor: accent, borderLeftWidth: 3 } : undefined}
    >
      <button
        type="button"
        onClick={() => canExpand && setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left sm:px-4",
          canExpand ? "cursor-pointer hover:bg-surface-2" : "cursor-default",
        )}
      >
        <span className="num w-11 shrink-0 text-right text-[12px] text-ink2">{(h.weight * 100).toFixed(1)}%</span>
        <span className="num w-24 shrink-0 truncate text-[13px] font-semibold text-ink sm:w-28">{h.symbol}</span>
        <span className="hidden w-32 shrink-0 items-center gap-2 text-[12px] sm:flex">
          <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
          <span className="text-ink2">{h.band ? STOCK_BAND_LABEL[h.band] : "Unscored"}</span>
          {h.health != null && (
            <span className="num font-medium" style={{ color }}>
              {h.health}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] text-ink3">{rowState(rank)}</span>
        {canExpand && (
          <Icons.caretDown
            className={cn("size-4 shrink-0 text-ink3 transition-transform", open && "rotate-180")}
          />
        )}
      </button>
      {open && canExpand && (
        <div className="border-t border-line px-3 sm:px-4">
          <HoldingEvidence symbol={h.symbol} />
        </div>
      )}
    </div>
  );
}

/** §4 · Your holdings — depth. Sorted by weight × attention (weak/flagged lead); expand a
 *  name to its per-stock three-lens (LM/LP) evidence. */
export function HoldingsSection({ snapshot, holdings }: { snapshot: PortfolioSnapshot; holdings: Holding[] }) {
  const ranks = rankedHoldings(holdings, flaggedSymbols(snapshot));
  return (
    <div className={CARD}>
      <div className="mb-2 flex items-center gap-3 px-1 text-[9.5px] uppercase tracking-wide text-ink3">
        <span className="w-11 shrink-0 text-right">Weight</span>
        <span className="w-24 shrink-0 sm:w-28">Holding</span>
        <span className="hidden w-32 shrink-0 sm:block">Condition</span>
        <span className="flex-1">Why it&apos;s here</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {ranks.map((rank) => (
          <HoldingRow key={rank.holding.symbol} rank={rank} />
        ))}
      </div>
    </div>
  );
}
