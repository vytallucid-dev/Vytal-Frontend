"use client";

import { useState } from "react";
import { Icons } from "@/lib/icons";
import type { CDeduction, Exposures, Holding, PortfolioSnapshot } from "@/types/portfolio";
import type { PortfolioTab } from "../tabs";
import { BLUEPRINT_ACCENT, CONSTRUCTION_BAND_META, DRAG_COLOR, concentrationFindings, constructionColor } from "../lib";
import {
  CONSTRUCTION_RULE_META,
  cleanRules,
  concentrationRead,
  constructionRules,
  effectiveBreadth,
  firedRules,
  notEvaluableRules,
  sectorSlices,
  triageFindings,
} from "./lib";
import { BlueprintShell, InfoTip, Tip } from "./parts";
import { FindingsBlock } from "./findings";

const AMBER = DRAG_COLOR.construction;
const pct0 = (w: number) => `${Math.round(w * 100)}%`;
const pct1 = (w: number) => `${(w * 100).toFixed(1)}%`;
const r0 = (v: number) => Math.round(v);

// ── EXPOSURES (new) — four OVERLAPPING lenses off `constructionRead.exposures`. Bars, not a pie: a bond
//    is both debt AND single-name risk, so these deliberately do not sum to 100%. The "lenses not slices"
//    line is mandatory — it stops this being read as the Holdings allocation donut. ──────────────────
const EXPO_META: { key: keyof Exposures; label: string; color: string }[] = [
  { key: "nameRisk", label: "Single-name risk", color: DRAG_COLOR.construction },
  { key: "basket", label: "Basket (funds/ETFs)", color: BLUEPRINT_ACCENT },
  { key: "debt", label: "Debt", color: "var(--p-own)" },
  { key: "commodity", label: "Commodity", color: "var(--p-mkt)" },
];
// what each exposure lens means — for the hover-reveals on the exposure bars
const EXPO_TIP: Record<keyof Exposures, string> = {
  nameRisk: "Share of the book tied to individual issuers — a single company failing hits here.",
  basket: "Share held through funds and ETFs — diversified baskets we can't see inside.",
  debt: "Share in bonds and fixed income, including the debt side of any hybrid.",
  commodity: "Share in gold and commodities — moves with the metal, not with a company.",
};
function ExposuresCard({ exposures }: { exposures: Exposures | null }) {
  if (!exposures) return null; // legacy / no-holding row → no exposures to show
  const rows = EXPO_META.filter((m) => (exposures[m.key] ?? 0) > 0.0005);
  if (rows.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <Icons.scales weight="duotone" className="size-4" style={{ color: BLUEPRINT_ACCENT }} />
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
          What the book is made of
          <InfoTip>
            Four overlapping risk lenses on the same book — a bond is both debt and single-name risk, so these deliberately don&apos;t sum
            to 100%. Different from the allocation donut, which shows a mutually-exclusive class split.
          </InfoTip>
        </p>
      </div>
      <p className="mb-3.5 max-w-[70ch] text-[11.5px] leading-relaxed text-ink3">
        Four overlapping lenses on the same book — a bond counts as both debt and single-name risk, so these don&apos;t sum to 100%.
      </p>
      <div className="flex flex-col gap-2.5">
        {rows.map((m) => {
          const w = exposures[m.key];
          return (
            <Tip key={m.key} content={<><span className="font-semibold text-ink">{m.label} · {pct1(w)}</span><span className="mt-1 block text-ink2">{EXPO_TIP[m.key]}</span></>}>
              <div className="flex cursor-help items-center gap-3">
                <span className="w-[130px] shrink-0 text-[12px] text-ink2">{m.label}</span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(w * 100, 1)}%`, background: m.color, opacity: 0.85 }} />
                </div>
                <span className="num w-12 shrink-0 text-right text-[12px] text-ink">{pct1(w)}</span>
              </div>
            </Tip>
          );
        })}
      </div>
      <p className="mt-3.5 max-w-[74ch] border-t border-line pt-3 text-[11px] leading-relaxed text-ink3">
        These are lenses, not slices. The allocation donut on Holdings shows the mutually-exclusive class split; this shows risk concentrations that deliberately overlap.
      </p>
    </div>
  );
}

// ── EVALUABILITY STRIP (new) — the THREE-STATE read, visually distinct. `evaluable:false` (no subject)
//    and `evaluable:true, points:0` (checked, clean) are DIFFERENT CLAIMS and must never look the same:
//    fired = amber dot + points · clean = dim dot + "clean" · not-applicable = hollow ring + italic. ──
function ruleSubjectLine(r: CDeduction): string {
  const s = r.firedSubject;
  if (s) {
    if (s.kind === "entity" || s.kind === "sector" || s.kind === "house") return `${s.label} at ${pct1(s.weight)} of the book`;
    if (s.kind === "breadth" && r.metrics?.neff != null) return `behaves like ~${r.metrics.neff.toFixed(1)} effective positions`;
    if (s.kind === "count") return `${s.count} holdings`;
  }
  return CONSTRUCTION_RULE_META[r.rule].what;
}
function EvaluabilityStrip({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const fired = firedRules(snapshot);
  const clean = cleanRules(snapshot);
  const na = notEvaluableRules(snapshot);
  const rows: { r: CDeduction; state: "fired" | "clean" | "na" }[] = [
    ...fired.map((r) => ({ r, state: "fired" as const })),
    ...clean.map((r) => ({ r, state: "clean" as const })),
    ...na.map((r) => ({ r, state: "na" as const })),
  ];
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface-2">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink3">
        What we could and couldn&apos;t measure
        <InfoTip>
          Each construction rule in one of three states: <b className="font-semibold text-ink">fired</b> (found something, took points off),{" "}
          <b className="font-semibold text-ink">clean</b> (checked, nothing to flag) and <b className="font-semibold text-ink">not applicable</b>{" "}
          (no subject to measure). A rule with nothing to check is silent, not passed.
        </InfoTip>
      </div>
      {rows.map(({ r, state }) => (
        <div key={r.rule} className="grid grid-cols-[16px_1fr_auto] items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
          <span
            className="mt-1 size-2 rounded-full"
            style={
              state === "fired"
                ? { background: AMBER }
                : state === "clean"
                  ? { background: BLUEPRINT_ACCENT, opacity: 0.5 }
                  : { background: "transparent", border: "1px solid var(--ink3)" }
            }
          />
          <div className="min-w-0">
            <p className={`text-[12.5px] ${state === "na" ? "text-ink2" : "text-ink"}`}>{CONSTRUCTION_RULE_META[r.rule].title}</p>
            <p className={`mt-0.5 text-[11px] leading-snug text-ink3 ${state === "na" ? "italic" : ""}`}>
              {state === "na" ? "nothing to check — a rule with no subject is silent, not passed" : ruleSubjectLine(r)}
            </p>
          </div>
          <span
            className={`num shrink-0 text-right ${state === "na" ? "text-[10.5px] italic" : "text-[12px]"}`}
            style={{ color: state === "fired" ? AMBER : "var(--ink3)" }}
          >
            {state === "fired" ? `−${r0(r.points)}` : state === "clean" ? "clean" : "not applicable"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── "show the maths" — the RECEIPT layer (evaluability strip + the C-rule deduction ledger), collapsed
//    on load. Reads stay open; receipts are one tap away. Nothing is removed. ─────────────────────────
function ShowTheMaths({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-[12px] font-medium text-ink2 transition-colors hover:text-ink"
      >
        <Icons.chartBar weight="duotone" className="size-3.5" style={{ color: BLUEPRINT_ACCENT }} />
        Show the maths
        <span className="ml-1 text-[11px] text-ink3">— the evaluability read and the deduction ledger</span>
        <Icons.caretDown className={`ml-auto size-4 shrink-0 text-ink3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

// ── read the fired subject of a C-rule from the STRUCTURED ledger — never by parsing `detail` prose
//    (rebuilding that regex trap is exactly what broke the old Construction read). ─────────────────
function ruleOf(s: PortfolioSnapshot, rule: CDeduction["rule"]): CDeduction | undefined {
  return constructionRules(s).find((r) => r.rule === rule);
}

function VizCard({ icon: Glyph, title, tip, children }: { icon: typeof Icons.stack; title: string; tip?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
        <Glyph weight="duotone" className="size-4 shrink-0" style={{ color: BLUEPRINT_ACCENT }} />
        {title}
        {tip && <InfoTip>{tip}</InfoTip>}
      </div>
      {children}
    </div>
  );
}

// ── B3b · The shape picture — three compact viz. Concentration (C1 fired entity) · effective breadth
//    (C2 Neff over entities) · sector mix (C3 fired sector). Over-line drivers wear caution amber, read
//    from the ledger's STRUCTURED firedSubject. Bar geometry is display arithmetic over holdings. ──
function ShapePicture({ snapshot, holdings }: { snapshot: PortfolioSnapshot; holdings: Holding[] }) {
  const c1 = ruleOf(snapshot, "C1");
  const c3 = ruleOf(snapshot, "C3");
  const firedEntity = c1?.firedSubject?.kind === "entity" ? c1.firedSubject : null; // { label, weight }
  const firedSector = c3?.firedSubject?.kind === "sector" ? c3.firedSubject : null;
  const breadth = effectiveBreadth(snapshot, holdings);
  const count = holdings.length;

  const priced = holdings.filter((h) => (h.marketValue ?? 0) > 0);
  const totalV = priced.reduce((a, h) => a + (h.marketValue ?? 0), 0) || 1;
  const topHoldings = [...priced].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0)).slice(0, 6);
  const maxWpct = topHoldings.length ? ((topHoldings[0].marketValue ?? 0) / totalV) * 100 : 0;
  const concDomain = Math.max(maxWpct, firedEntity ? firedEntity.weight * 100 : 0) * 1.15 || 100;

  const sectors = sectorSlices(holdings).slice(0, 6);
  const maxSecPct = sectors.length ? sectors[0].weight * 100 : 0;
  const secDomain = Math.max(maxSecPct, 40) * 1.15 || 100;

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {/* Concentration — the C1 entity read */}
      <VizCard icon={Icons.stack} title="Concentration" tip="Your biggest positions by value. When a single issuer gets too heavy it carries a single-issuer concentration cost (rule C1). Amber marks the position that fired it.">
        <div className="relative flex flex-col gap-1.5">
          {topHoldings.map((h) => {
            const wpct = ((h.marketValue ?? 0) / totalV) * 100; // display arithmetic
            const over = firedEntity != null && h.symbol === firedEntity.label;
            return (
              <Tip key={h.symbol} content={<><span className="num font-semibold text-ink">{h.symbol} · {pct1(wpct / 100)} of book</span>{over && <span className="mt-1 block text-ink2">Heavy enough to carry a single-issuer concentration cost (C1).</span>}</>}>
                <div className="flex cursor-help items-center gap-2">
                  <span className="num w-16 shrink-0 truncate text-[10.5px] text-ink3">{h.symbol}</span>
                  <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full" style={{ width: `${Math.max((wpct / concDomain) * 100, 2)}%`, background: over ? AMBER : BLUEPRINT_ACCENT }} />
                  </div>
                  <span className="num w-9 shrink-0 text-right text-[10px] text-ink2">{pct0(wpct / 100)}</span>
                </div>
              </Tip>
            );
          })}
        </div>
        <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink3">
          {firedEntity ? <><span className="num">{firedEntity.label}</span> at <span className="num">{pct1(firedEntity.weight)}</span> carries a single-issuer concentration cost.</> : <>No single issuer is heavy enough to cost concentration.</>}
        </p>
      </VizCard>

      {/* Breadth — the C2 effective-issuer read */}
      <VizCard icon={Icons.sector} title="Effective breadth" tip="Neff — how many equally-sized positions your weighting behaves like, given how lopsided it is. Fewer effective names than holdings means more of your money rides on a few positions (rule C2).">
        <div className="flex items-baseline gap-1.5">
          <span className="num text-[24px] font-semibold leading-none text-ink">{breadth.neff.toFixed(1)}</span>
          <span className="num text-[12px] text-ink3">effective of {count}</span>
        </div>
        <Tip content={`Your weighting behaves like about ${breadth.neff.toFixed(1)} equally-sized positions, across ${count} holding${count === 1 ? "" : "s"}. Each filled pip is one effective position.`}>
          <div className="mt-3 flex cursor-help gap-1">
            {Array.from({ length: Math.min(count, 12) }).map((_, i) => {
              const filled = i < Math.round(breadth.neff); // display arithmetic
              return <span key={i} className="h-2.5 flex-1 rounded-full" style={{ background: filled ? BLUEPRINT_ACCENT : "var(--surface-3)" }} />;
            })}
          </div>
        </Tip>
        <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink3">
          Weight behaves like about <span className="num">{breadth.neff.toFixed(1)}</span> equally-sized positions{count > 0 ? <> across your {count} holding{count === 1 ? "" : "s"}</> : null}.
        </p>
      </VizCard>

      {/* Sector mix — the C3 read */}
      <VizCard icon={Icons.scales} title="Sector mix" tip="Your weight by sector, counted over stocks only. A sector past the ~40% line (dashed) moves a large share of the book together and carries a sector-concentration cost (rule C3).">
        {sectors.length === 0 ? (
          <p className="text-[11px] text-ink3">Sectors aren&apos;t classified for this book yet.</p>
        ) : (
          <div className="relative flex flex-col gap-1.5">
            <Tip content="The ~40% sector line. A sector past it moves a large share of the book together (C3).">
              <span className="absolute inset-y-0 z-10 w-px cursor-help border-l border-dashed" style={{ left: `${(40 / secDomain) * 100}%`, borderColor: AMBER }} />
            </Tip>
            {sectors.map((sl) => {
              const over = firedSector != null && sl.sector === firedSector.label;
              return (
                <Tip key={sl.sector} content={<><span className="font-semibold text-ink">{sl.sector} · {pct1(sl.weight)} of book</span>{over && <span className="mt-1 block text-ink2">Past the ~40% line — moves a large share of the book together (C3).</span>}</>}>
                  <div className="flex cursor-help items-center gap-2">
                    <span className="w-16 shrink-0 truncate text-[10.5px] text-ink3">{sl.sector}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full" style={{ width: `${Math.max((sl.weight * 100 / secDomain) * 100, 2)}%`, background: over ? AMBER : BLUEPRINT_ACCENT }} />
                    </div>
                    <span className="num w-9 shrink-0 text-right text-[10px] text-ink2">{pct0(sl.weight)}</span>
                  </div>
                </Tip>
              );
            })}
          </div>
        )}
        <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink3">
          {firedSector ? <><span className="num">{firedSector.label}</span> at <span className="num">{pct1(firedSector.weight)}</span> moves a large share of the book together.</> : <>A sector past the <span className="num">40%</span> line moves a large share of the book together.</>}
        </p>
      </VizCard>
    </div>
  );
}

// ── B3d · Construction ledger — the fired C-rules verbatim, the concrete construction cost. ──────────
function ConstructionLedger({ snapshot, value }: { snapshot: PortfolioSnapshot; value: number }) {
  const fired = firedRules(snapshot);
  const skipped = notEvaluableRules(snapshot);
  const hasLedger = constructionRules(snapshot).length > 0;
  const calm = fired.length === 0;
  if (!hasLedger) return null; // legacy / no-holding row → no ledger (the number + band still render)
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md" style={{ background: `color-mix(in oklch, ${BLUEPRINT_ACCENT} 14%, transparent)`, color: BLUEPRINT_ACCENT }}>
          <Icons.chartBar weight="duotone" className="size-3.5" />
        </span>
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
          Construction — the deduction ledger
          <InfoTip>
            The construction rules that fired, verbatim, and the points each took off 100 to set your Construction score. This is the
            concrete cost of how the book is weighted.
          </InfoTip>
        </p>
        <span className="num ml-auto text-[11px] text-ink3">Construction {r0(value)}</span>
      </div>
      {calm ? (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] text-ink2" style={{ borderColor: "var(--rec-bd)", background: "var(--rec-bg)" }}>
          <Icons.check weight="bold" className="size-4" style={{ color: "var(--rec)" }} />
          How your holdings are weighted took nothing off — the book&apos;s construction is clean.
        </div>
      ) : (
        <>
          <p className="mb-3 text-[11px] leading-relaxed text-ink3">These deductions from 100 set Construction to <span className="num text-ink2">{r0(value)}</span>.</p>
          <div className="flex flex-col gap-2">
            {fired.map((e) => {
              const meta = CONSTRUCTION_RULE_META[e.rule];
              return (
                <div key={e.rule} className="flex items-start gap-3 rounded-md border border-line bg-surface-1 px-3 py-2">
                  <span className="num mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: AMBER, borderColor: "color-mix(in oklch, " + AMBER + " 38%, transparent)", background: "color-mix(in oklch, " + AMBER + " 12%, transparent)" }}>
                    {e.rule}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[12px] font-medium text-ink">{meta.title}</span>
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
          {skipped.map((e) => (
            <p key={`skip-${e.rule}`} className="text-[10.5px] leading-snug text-ink3">
              <span className="num mr-1.5 rounded bg-surface-3 px-1 py-px text-[9.5px]">{e.rule}</span>
              not applicable — {CONSTRUCTION_RULE_META[e.rule].what}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** The CONSTRUCTION READ — the blueprint: "Is this book safely held?" A fully standalone read (its own
 *  verdict + archetype, never a deduction from Health): the shape picture, the evaluability panel, the
 *  C-ledger, and the PC/PB findings. Always present. `provisional` (§9.3) is a scope tag (unvaluedShare
 *  > 0.25) — a scope statement, never a cap; served in the disclosure channel, off by default here. */
export function ConstructionReadBody({
  snapshot,
  holdings,
  onOpenTab,
  provisional = false,
}: {
  snapshot: PortfolioSnapshot;
  holdings: Holding[];
  onOpenTab?: (t: PortfolioTab) => void;
  provisional?: boolean;
}) {
  const c = snapshot.constructionRead;
  const color = constructionColor(c.band);
  const conc = concentrationRead(holdings);
  const findings = triageFindings(concentrationFindings(snapshot));

  return (
    <BlueprintShell>
      {/* B3a — verdict + archetype */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Tip content={<><span className="font-semibold text-ink">Construction {r0(c.value)} · {CONSTRUCTION_BAND_META[c.band].label}</span><span className="mt-1 block text-ink2">How well your money is spread across the whole book — starting at 100, less the construction rules that fired. Higher is more safely held.</span></>}>
          <div className="flex cursor-help items-baseline gap-2.5">
            <span className="num text-[30px] font-medium leading-none" style={{ color }}>{r0(c.value)}</span>
            <span className="font-display text-[16px] font-medium" style={{ color }}>{CONSTRUCTION_BAND_META[c.band].label}</span>
          </div>
        </Tip>
        {c.archetype && (
          <span className="rounded-lg border px-2.5 py-1 text-[11px] font-semibold" style={{ color: BLUEPRINT_ACCENT, borderColor: `color-mix(in oklch, ${BLUEPRINT_ACCENT} 34%, transparent)`, background: `color-mix(in oklch, ${BLUEPRINT_ACCENT} 11%, transparent)` }}>
            {c.archetype}
          </span>
        )}
        {provisional && (
          <span className="rounded-md border px-2 py-0.5 text-[10.5px] font-medium" style={{ color: "var(--high)", borderColor: "var(--high-bd)", background: "var(--high-bg)" }} title="Some of your book could not be valued and is not reflected here.">
            Provisional
          </span>
        )}
        {conc.largest && (
          <Tip content={`Your single largest position is ${conc.largest.symbol} at ${pct1(conc.largest.weight)} of book value; your top three together hold ${pct0(conc.top3)}.`}>
            <span className="ml-auto cursor-help text-[11px] text-ink3">
              largest <span className="num text-ink2">{conc.largest.symbol}</span> {pct1(conc.largest.weight)} · top-3 <span className="num text-ink2">{pct0(conc.top3)}</span>
            </span>
          </Tip>
        )}
      </div>
      {provisional && (
        <p className="mt-2 text-[11px] leading-relaxed text-ink3">Some of your book could not be valued and is not reflected in this read — it is a scope note, not a penalty.</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <ShapePicture snapshot={snapshot} holdings={holdings} />
        <ExposuresCard exposures={c.exposures} />
        {/* COMPRESS — the receipt layer (evaluability read + deduction ledger) is one tap away. */}
        <ShowTheMaths>
          <EvaluabilityStrip snapshot={snapshot} />
          <ConstructionLedger snapshot={snapshot} value={c.value} />
        </ShowTheMaths>
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
