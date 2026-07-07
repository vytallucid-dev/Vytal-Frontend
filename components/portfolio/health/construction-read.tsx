"use client";

import { Icons } from "@/lib/icons";
import type { Holding, PortfolioSnapshot } from "@/types/portfolio";
import type { PortfolioTab } from "../tabs";
import { BLUEPRINT_ACCENT, CONSTRUCTION_BAND_META, DRAG_COLOR, concentrationFindings, constructionColor } from "../lib";
import {
  STRUCTURE_RULE_META,
  activeStructure,
  concentrationRead,
  effectiveBreadth,
  notEvaluableStructure,
  sectorSlices,
  structureLedger,
  triageFindings,
} from "./lib";
import { BlueprintShell, CapitalPill, StageBadge } from "./parts";
import { FindingsBlock } from "./findings";

const AMBER = DRAG_COLOR.construction;
const pct0 = (w: number) => `${Math.round(w * 100)}%`;
const pct1 = (w: number) => `${(w * 100).toFixed(1)}%`;
const r0 = (v: number) => Math.round(v);

// ── read the S1 penalty from the STORED ledger (which names fired symbols + threshold) —
//    never a client re-derivation of the rule. ─────────────────────────────────────────
function s1Info(s: PortfolioSnapshot): { symbols: Set<string>; threshold: number | null } {
  const entries = structureLedger(s).filter((e) => e.rule === "S1" && e.points > 0.005);
  const symbols = new Set(entries.map((e) => e.symbol).filter((x): x is string => !!x));
  let threshold: number | null = null;
  for (const e of entries) {
    const m = />\s*([\d.]+)%/.exec(e.detail);
    if (m) { threshold = Number(m[1]); break; }
  }
  return { symbols, threshold };
}
function s2Info(s: PortfolioSnapshot): { sector: string | null; evaluable: boolean } {
  const e = structureLedger(s).find((x) => x.rule === "S2");
  if (!e) return { sector: null, evaluable: true };
  if (e.points <= 0.005) return { sector: null, evaluable: !/not evaluable/i.test(e.detail) };
  const m = /^(.+?)\s+[\d.]+%\s*>/.exec(e.detail);
  return { sector: m ? m[1].trim() : null, evaluable: true };
}

function VizCard({ icon: Glyph, title, children }: { icon: typeof Icons.stack; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-ink">
        <Glyph weight="duotone" className="size-4" style={{ color: BLUEPRINT_ACCENT }} />
        {title}
      </div>
      {children}
    </div>
  );
}

// ── B3b · The shape picture — three compact viz. Concentration bars (S1 line) · effective
//    breadth (Neff of count) · sector mix (S2 line). Over-line drivers wear caution amber,
//    read straight from the ledger. Bar geometry is display arithmetic. ──────────────────
function ShapePicture({ snapshot, holdings }: { snapshot: PortfolioSnapshot; holdings: Holding[] }) {
  const s1 = s1Info(snapshot);
  const s2 = s2Info(snapshot);
  const breadth = effectiveBreadth(snapshot, holdings);
  const count = holdings.length;

  const priced = holdings.filter((h) => (h.marketValue ?? 0) > 0);
  const totalV = priced.reduce((a, h) => a + (h.marketValue ?? 0), 0) || 1;
  const topHoldings = [...priced].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0)).slice(0, 6);
  const maxWpct = topHoldings.length ? ((topHoldings[0].marketValue ?? 0) / totalV) * 100 : 0;
  const concDomain = Math.max(maxWpct, s1.threshold ?? 0) * 1.15 || 100;

  const sectors = sectorSlices(holdings).slice(0, 6);
  const maxSecPct = sectors.length ? sectors[0].weight * 100 : 0;
  const S2_LINE = 40; // the spec's S2 threshold — a display reference marker only
  const secDomain = Math.max(maxSecPct, S2_LINE) * 1.15 || 100;

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {/* Concentration */}
      <VizCard icon={Icons.stack} title="Concentration">
        <div className="relative flex flex-col gap-1.5">
          {s1.threshold != null && (
            <span className="absolute inset-y-0 z-10 w-px border-l border-dashed" style={{ left: `${(s1.threshold / concDomain) * 100}%`, borderColor: AMBER }} title={`S1 line ${s1.threshold}%`} />
          )}
          {topHoldings.map((h) => {
            const wpct = ((h.marketValue ?? 0) / totalV) * 100; // display arithmetic
            const over = s1.symbols.has(h.symbol);
            return (
              <div key={h.symbol} className="flex items-center gap-2">
                <span className="num w-16 shrink-0 truncate text-[10.5px] text-ink3">{h.symbol}</span>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full" style={{ width: `${Math.max((wpct / concDomain) * 100, 2)}%`, background: over ? AMBER : BLUEPRINT_ACCENT }} />
                </div>
                <span className="num w-9 shrink-0 text-right text-[10px] text-ink2">{pct0(wpct / 100)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink3">
          {s1.threshold != null ? <>Positions past the <span className="num">{s1.threshold}%</span> line carry a single-position penalty.</> : <>No single position crosses its size line.</>}
        </p>
      </VizCard>

      {/* Breadth */}
      <VizCard icon={Icons.sector} title="Effective breadth">
        <div className="flex items-baseline gap-1.5">
          <span className="num text-[24px] font-semibold leading-none text-ink">{breadth.neff.toFixed(1)}</span>
          <span className="num text-[12px] text-ink3">effective of {count}</span>
        </div>
        <div className="mt-3 flex gap-1" title={`${breadth.neff.toFixed(1)} effective of ${count} holdings`}>
          {Array.from({ length: Math.min(count, 12) }).map((_, i) => {
            const filled = i < Math.round(breadth.neff); // display arithmetic
            return <span key={i} className="h-2.5 flex-1 rounded-full" style={{ background: filled ? BLUEPRINT_ACCENT : "var(--surface-3)" }} />;
          })}
        </div>
        <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink3">
          Weight behaves like about <span className="num">{breadth.neff.toFixed(1)}</span> equally-sized positions{count > 0 ? <> across your {count} holding{count === 1 ? "" : "s"}</> : null}.
        </p>
      </VizCard>

      {/* Sector mix */}
      <VizCard icon={Icons.scales} title="Sector mix">
        {sectors.length === 0 ? (
          <p className="text-[11px] text-ink3">Sectors aren&apos;t classified for this book yet.</p>
        ) : (
          <div className="relative flex flex-col gap-1.5">
            {s2.evaluable && (
              <span className="absolute inset-y-0 z-10 w-px border-l border-dashed" style={{ left: `${(S2_LINE / secDomain) * 100}%`, borderColor: AMBER }} title="S2 line 40%" />
            )}
            {sectors.map((sl) => {
              const over = s2.sector != null && sl.sector === s2.sector;
              return (
                <div key={sl.sector} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 truncate text-[10.5px] text-ink3">{sl.sector}</span>
                  <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full" style={{ width: `${Math.max((sl.weight * 100 / secDomain) * 100, 2)}%`, background: over ? AMBER : BLUEPRINT_ACCENT }} />
                  </div>
                  <span className="num w-9 shrink-0 text-right text-[10px] text-ink2">{pct0(sl.weight)}</span>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink3">
          {!s2.evaluable ? <>Too much of the book is in unclassified sectors to read a pile-up honestly.</> : <>A sector past the <span className="num">40%</span> line moves a large share of the book together.</>}
        </p>
      </VizCard>
    </div>
  );
}

// ── B3c · Structure ledger — the fired S-rules verbatim, the concrete construction cost. ─
function StructureLedger({ snapshot, value }: { snapshot: PortfolioSnapshot; value: number }) {
  const active = activeStructure(snapshot);
  const skipped = notEvaluableStructure(snapshot);
  const calm = active.length === 0;
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md" style={{ background: `color-mix(in oklch, ${BLUEPRINT_ACCENT} 14%, transparent)`, color: BLUEPRINT_ACCENT }}>
          <Icons.chartBar weight="duotone" className="size-3.5" />
        </span>
        <p className="text-[13px] font-semibold text-ink">Construction — the Structure ledger</p>
        <span className="num ml-auto text-[11px] text-ink3">Structure {r0(value)}</span>
      </div>
      {calm ? (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] text-ink2" style={{ borderColor: "var(--rec-bd)", background: "var(--rec-bg)" }}>
          <Icons.check weight="bold" className="size-4" style={{ color: "var(--rec)" }} />
          How your holdings are weighted took nothing off — the book&apos;s construction is clean.
        </div>
      ) : (
        <>
          <p className="mb-3 text-[11px] leading-relaxed text-ink3">These deductions from 100 set Structure to <span className="num text-ink2">{r0(value)}</span>.</p>
          <div className="flex flex-col gap-2">
            {active.map((e, i) => {
              const meta = STRUCTURE_RULE_META[e.rule];
              return (
                <div key={`${e.rule}-${e.symbol ?? i}`} className="flex items-start gap-3 rounded-md border border-line bg-surface-1 px-3 py-2">
                  <span className="num mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: AMBER, borderColor: "color-mix(in oklch, " + AMBER + " 38%, transparent)", background: "color-mix(in oklch, " + AMBER + " 12%, transparent)" }}>
                    {e.rule}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-ink">{meta.title}</span>
                      {e.symbol && <span className="num rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-ink2">{e.symbol}</span>}
                    </div>
                    <p className="num mt-0.5 text-[10.5px] leading-snug text-ink3">{e.detail}</p>
                  </div>
                  <span className="num shrink-0 text-[14px] font-semibold" style={{ color: AMBER }}>−{r0(e.points)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
      {skipped.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-1">
          {skipped.map((e, i) => (
            <p key={`skip-${e.rule}-${i}`} className="text-[10.5px] leading-snug text-ink3">
              <span className="num mr-1.5 rounded bg-surface-3 px-1 py-px text-[9.5px]">{e.rule}</span>
              not evaluable — {e.detail.replace(/^not evaluable — /, "")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** The CONSTRUCTION READ — the blueprint: "Is this book safely held?" A fully standalone read
 *  (its own verdict + stage, never a deduction from Health): the shape picture, the Structure
 *  ledger, and the PC/PB findings. Always present. */
export function ConstructionReadBody({
  snapshot,
  holdings,
  onOpenTab,
}: {
  snapshot: PortfolioSnapshot;
  holdings: Holding[];
  onOpenTab?: (t: PortfolioTab) => void;
}) {
  const c = snapshot.constructionRead;
  const color = constructionColor(c.band);
  const conc = concentrationRead(holdings);
  const findings = triageFindings(concentrationFindings(snapshot));

  return (
    <BlueprintShell>
      {/* B3a — verdict + stage */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-baseline gap-2.5">
          <span className="num text-[30px] font-medium leading-none" style={{ color }}>{r0(c.value)}</span>
          <span className="font-display text-[16px] font-medium" style={{ color }}>{CONSTRUCTION_BAND_META[c.band].label}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge tier={c.structureTier} />
          <CapitalPill tier={c.capitalTier} />
        </div>
        {conc.largest && (
          <span className="ml-auto text-[11px] text-ink3">
            largest <span className="num text-ink2">{conc.largest.symbol}</span> {pct1(conc.largest.weight)} · top-3 <span className="num text-ink2">{pct0(conc.top3)}</span>
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <ShapePicture snapshot={snapshot} holdings={holdings} />
        <StructureLedger snapshot={snapshot} value={c.value} />
        <div className="border-t border-line pt-4">
          <FindingsBlock
            triage={findings}
            loudKicker="What your construction shows"
            emptyNote="Your book's construction is clean — no concentration or breadth pattern fired."
            onOpenTab={onOpenTab}
          />
        </div>
      </div>
    </BlueprintShell>
  );
}
