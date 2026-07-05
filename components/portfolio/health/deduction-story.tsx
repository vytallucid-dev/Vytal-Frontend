"use client";

import { Icons } from "@/lib/icons";
import type { Holding, PortfolioSnapshot } from "@/types/portfolio";
import { holdingHealthColor } from "../lib";
import {
  SIGNAL_SOURCE_META,
  STRUCTURE_RULE_META,
  W_SIGNAL,
  W_STRUCT,
  activeSignals,
  activeStructure,
  type DeductionStory,
  notEvaluableStructure,
  qualityContributions,
} from "./lib";

const CARD = "rounded-xl border border-line bg-surface-1 p-5 sm:p-6";
const r0 = (v: number) => Math.round(v);
const pct1 = (w: number) => `${(w * 100).toFixed(1)}%`;

// ── one deduction chip in the equation (a drag, a calm no-op, or the coverage cap) ──
function DragChip({ label, value, tone }: { label: string; value: number; tone: "drag" | "calm" | "neutral" }) {
  const c = tone === "neutral" ? "var(--ctx)" : tone === "calm" ? "var(--rec)" : "var(--high)";
  return (
    <div
      className="flex flex-col items-center rounded-md border px-3 py-1.5"
      style={{
        borderColor: `color-mix(in oklch, ${c} 30%, transparent)`,
        background: `color-mix(in oklch, ${c} 10%, transparent)`,
      }}
    >
      <span className="num text-[17px] font-semibold leading-none" style={{ color: c }}>
        −{r0(value)}
      </span>
      <span className="mt-1 text-center text-[8.5px] uppercase leading-tight tracking-wide text-ink3">{label}</span>
    </div>
  );
}

// ── the waterfall: Quality anchor − drags = published PHS. The composite (band colour)
//    plus each drag tail sum back to the anchor, so the subtraction is visible. ────────
function Waterfall({ b, color }: { b: DeductionStory; color: string }) {
  const noConstr = b.constructionDrag < 0.05;
  const noFlags = b.flagsDrag < 0.05;
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-3.5 flex items-baseline justify-between">
        <p className="kicker">Why your score is {b.composite}</p>
        <p className="text-[10px] text-ink3">quality, less deductions</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex flex-col">
          <span className="num text-[32px] font-semibold leading-none" style={{ color: "var(--p-found)" }}>
            {r0(b.quality)}
          </span>
          <span className="mt-1 text-[8.5px] uppercase tracking-wide text-ink3">quality · anchor</span>
        </div>
        <span className="text-[16px] text-ink3">−</span>
        <DragChip label="construction" value={b.constructionDrag} tone={noConstr ? "calm" : "drag"} />
        <DragChip label={noFlags ? "no active flags" : "active flags"} value={b.flagsDrag} tone={noFlags ? "calm" : "drag"} />
        {b.coverageDrag > 0.05 && <DragChip label="coverage cap" value={b.coverageDrag} tone="neutral" />}
        <span className="text-[18px] font-medium text-ink3">=</span>
        <div className="flex flex-col">
          <span className="num text-[32px] font-semibold leading-none" style={{ color }}>
            {b.composite}
          </span>
          <span className="mt-1 text-[8.5px] uppercase tracking-wide text-ink3">health</span>
        </div>
      </div>

      <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        <div style={{ flex: Math.max(b.composite, 0.001), background: color }} title={`Portfolio health ${b.composite}`} />
        {b.constructionDrag >= 0.5 && (
          <div style={{ flex: b.constructionDrag, background: "var(--high)" }} title={`Construction −${r0(b.constructionDrag)}`} />
        )}
        {b.flagsDrag >= 0.5 && <div style={{ flex: b.flagsDrag, background: "var(--high)" }} title={`Active flags −${r0(b.flagsDrag)}`} />}
        {b.coverageDrag >= 0.5 && (
          <div style={{ flex: b.coverageDrag, background: "var(--ctx)" }} title={`Coverage cap −${r0(b.coverageDrag)}`} />
        )}
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
        Your holdings&apos; quality is <span className="num text-ink2">{r0(b.quality)}</span> — where the score starts.{" "}
        {noConstr ? (
          <>Construction takes off <span className="num text-ink2">nothing</span></>
        ) : (
          <>
            Construction (concentration &amp; breadth) takes off{" "}
            <span className="num" style={{ color: "var(--high)" }}>{r0(b.constructionDrag)}</span>
          </>
        )}
        {"; "}
        {noFlags ? (
          <>with no active red flags, Signals subtracts <span className="num" style={{ color: "var(--rec)" }}>nothing</span></>
        ) : (
          <>active red flags subtract <span className="num" style={{ color: "var(--high)" }}>{r0(b.flagsDrag)}</span></>
        )}
        {b.coverageDrag > 0.05 && (
          <>; coverage holds it a further <span className="num" style={{ color: "var(--ctx)" }}>{r0(b.coverageDrag)}</span> back</>
        )}
        {" — landing at "}
        <span className="num" style={{ color }}>{b.composite}</span>.
      </p>
    </div>
  );
}

// ── the Quality anchor, composed — health × renormalized weight per scored holding
//    (A.5). Derived from the holdings read (no per-holding Quality ledger exists); the
//    segments sum back to the anchor, so the 66 is shown to BE its holdings. ───────────
function QualityComposition({ holdings, quality }: { holdings: Holding[]; quality: number }) {
  const rows = qualityContributions(holdings);
  if (rows.length === 0) return null;
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="kicker">What builds the {r0(quality)} anchor</p>
        <p className="text-[10px] text-ink3">health × weight, scored names</p>
      </div>
      {/* the anchor as a stack — each segment is a name's contribution; they sum to Quality */}
      <div className="flex h-3 w-full gap-px overflow-hidden rounded-full bg-surface-3" title={`Quality ${r0(quality)} / 100`}>
        {rows.map((row) => (
          <div
            key={row.symbol}
            style={{ flex: Math.max(row.contribution, 0.001), background: holdingHealthColor({ health: row.health }) }}
            title={`${row.symbol} · contributes ${row.contribution.toFixed(1)} (health ${row.health} × ${pct1(row.share)})`}
          />
        ))}
        <div style={{ flex: Math.max(100 - quality, 0.001), background: "transparent" }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.symbol} className="flex items-center gap-2 text-[11px]">
            <span className="size-2 shrink-0 rounded-[2px]" style={{ background: holdingHealthColor({ health: row.health }) }} />
            <span className="num truncate text-ink2">{row.symbol}</span>
            <span className="num ml-auto shrink-0 text-ink3">
              {row.health} · {pct1(row.share)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Structure ledger — each fired S-rule verbatim, the concrete "why construction cost
//    you points". Σ points = the Structure gap (100 → pillar); the hit on your score is
//    W_STRUCT of that gap. Not-evaluable rules surface as honest context, not deductions.
function StructureLedgerPanel({ s, b }: { s: PortfolioSnapshot; b: DeductionStory }) {
  const active = activeStructure(s);
  const skipped = notEvaluableStructure(s);
  const calm = active.length === 0;
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid size-6 place-items-center rounded-md"
          style={{ background: "color-mix(in oklch, var(--p-own) 12%, transparent)", color: "var(--p-own)" }}
        >
          <Icons.sector weight="duotone" className="size-3.5" />
        </span>
        <p className="text-[13px] font-semibold text-ink">Construction — the Structure ledger</p>
        <span className="num ml-auto text-[11px] text-ink3">Structure {r0(b.structure)}</span>
      </div>
      <p className="mb-3.5 text-[11px] leading-relaxed text-ink3">
        {calm ? (
          <>How your holdings are weighted took <span className="text-ink2">nothing</span> off — the book&apos;s construction is clean.</>
        ) : (
          <>
            These deductions from 100 set Structure to <span className="num text-ink2">{r0(b.structure)}</span>. Construction&apos;s hit
            on your score is <span className="num text-ink2">{W_STRUCT * 100}%</span> of that gap —{" "}
            <span className="num" style={{ color: "var(--high)" }}>−{r0(b.constructionDrag)}</span>.
          </>
        )}
      </p>

      {calm ? (
        <div
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] text-ink2"
          style={{ borderColor: "var(--rec-bd)", background: "var(--rec-bg)" }}
        >
          <Icons.check weight="bold" className="size-4" style={{ color: "var(--rec)" }} />
          No concentration or breadth penalties fired.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((e, i) => {
            const meta = STRUCTURE_RULE_META[e.rule];
            return (
              <div
                key={`${e.rule}-${e.symbol ?? i}`}
                className="flex items-start gap-3 rounded-md border border-line bg-surface-1 px-3 py-2"
              >
                <span
                  className="num mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ color: "var(--high)", borderColor: "var(--high-bd)", background: "var(--high-bg)" }}
                >
                  {e.rule}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-ink">{meta.title}</span>
                    {e.symbol && (
                      <span className="num rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-ink2">{e.symbol}</span>
                    )}
                  </div>
                  <p className="num mt-0.5 text-[10.5px] leading-snug text-ink3">{e.detail}</p>
                </div>
                <span className="num shrink-0 text-[14px] font-semibold" style={{ color: "var(--high)" }}>
                  −{r0(e.points)}
                </span>
              </div>
            );
          })}
        </div>
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

// ── Signals ledger — per-holding red-flag deductions, capital-weighted. Empty ⇒ an
//    honest calm state (no flags), never a blank panel. ────────────────────────────────
function SignalsLedgerPanel({ s, b }: { s: PortfolioSnapshot; b: DeductionStory }) {
  const active = activeSignals(s);
  const calm = active.length === 0;
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid size-6 place-items-center rounded-md"
          style={{ background: "color-mix(in oklch, var(--p-mom) 12%, transparent)", color: "var(--p-mom)" }}
        >
          <Icons.warning weight="duotone" className="size-3.5" />
        </span>
        <p className="text-[13px] font-semibold text-ink">Active flags — the Signals ledger</p>
        <span className="num ml-auto text-[11px] text-ink3">Signals {r0(b.signals)}</span>
      </div>
      <p className="mb-3.5 text-[11px] leading-relaxed text-ink3">
        {calm ? (
          <>No holding is firing a red flag right now, so Signals subtracted <span className="text-ink2">nothing</span>.</>
        ) : (
          <>
            Each flagged holding deducts by its book weight. The hit on your score is{" "}
            <span className="num text-ink2">{W_SIGNAL * 100}%</span> of the Signals gap —{" "}
            <span className="num" style={{ color: "var(--high)" }}>−{r0(b.flagsDrag)}</span>.
          </>
        )}
      </p>

      {calm ? (
        <div
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] text-ink2"
          style={{ borderColor: "var(--rec-bd)", background: "var(--rec-bg)" }}
        >
          <Icons.check weight="bold" className="size-4" style={{ color: "var(--rec)" }} />
          No active red flags across your holdings.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((e) => {
            const meta = SIGNAL_SOURCE_META[e.source];
            return (
              <div key={e.symbol} className="flex items-center gap-3 rounded-md border border-line bg-surface-1 px-3 py-2">
                <span className="num shrink-0 rounded bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-ink">
                  {e.symbol}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] text-ink2">{meta.label}</span>
                  <span className="num ml-2 text-[10.5px] text-ink3">{pct1(e.weight)} of book</span>
                </div>
                <span className="num shrink-0 text-[14px] font-semibold" style={{ color: "var(--high)" }}>
                  −{e.points < 1 ? e.points.toFixed(1) : r0(e.points)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** §1 · Why your score is {PHS} — the deduction story, the LEADING section. */
export function DeductionStorySection({
  snapshot,
  holdings,
  story,
  color,
}: {
  snapshot: PortfolioSnapshot;
  holdings: Holding[];
  story: DeductionStory;
  color: string;
}) {
  return (
    <div className={CARD}>
      <Waterfall b={story} color={color} />
      <div className="mt-4 grid gap-4">
        <QualityComposition holdings={holdings} quality={story.quality} />
        <div className="grid gap-4 lg:grid-cols-2">
          <StructureLedgerPanel s={snapshot} b={story} />
          <SignalsLedgerPanel s={snapshot} b={story} />
        </div>
      </div>
    </div>
  );
}
