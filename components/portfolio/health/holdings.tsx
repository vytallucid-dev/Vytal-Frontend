"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { roundScore } from "@/lib/format";
import { assetClassLabel } from "@/lib/asset-class";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { LensPatternPill, PILLAR_META } from "@/components/stock-detail/health/shared";
import { lensDoesntMean } from "@/lib/findings";
import type { PillarKey } from "@/types/health";
import type { Holding, PortfolioSnapshot, SignalsDeduction } from "@/types/portfolio";
import { DRAG_COLOR, STOCK_BAND_LABEL, holdingHealthColor, stockHealthHref } from "../lib";
import { HoldingDisclosure } from "../holding-disclosure";
import { InfoTip, Tip } from "./parts";
import { SIGNAL_SOURCE_META, type EntityHolding, type EntityRank, aggregateHoldings, flaggedEntries, rankedEntities } from "./lib";

const CARD = "rounded-xl border border-line bg-surface-1 p-3 sm:p-4";
const PILLAR_ORDER: PillarKey[] = ["foundation", "momentum", "market", "ownership"];
const pct1 = (w: number) => `${(w * 100).toFixed(1)}%`;

// ── the one-line "why it's here" state for a row (band + flag, descriptive). When a flag fired and
//    its identity is on the wire, NAME the finding ("Distribution Pattern — an active red flag") rather
//    than the generic non-answer; falls back to the generic line on a pre-thread snapshot. ──────────
function rowState(rank: EntityRank, flag: SignalsDeduction | null): string {
  if (rank.unscored) return "Not yet scored — awaiting coverage";
  const name = flag?.title ?? null;
  if (rank.flagged && rank.weak)
    return name ? `${name} — a red flag in a weak band` : "Weak band with an active red flag";
  if (rank.flagged) return name ? `${name} — an active red flag` : "An active red flag is firing";
  if (rank.weak) return "Weak band — a drag on the book's Quality";
  return "Sound and steady — no attention needed";
}

// ── the flag callout for a flagged holding's EXPAND — names the finding + its written read, so the
//    "why" is answerable right here without leaving for the stock page. Read-only; nothing invented. ──
function FlagNote({ flag }: { flag: SignalsDeduction }) {
  const meta = SIGNAL_SOURCE_META[flag.source];
  return (
    <div
      className="mt-3 rounded-md border px-3 py-2.5"
      style={{
        borderColor: `color-mix(in oklch, ${DRAG_COLOR.signal} 26%, transparent)`,
        background: `color-mix(in oklch, ${DRAG_COLOR.signal} 7%, transparent)`,
      }}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink">
          <Icons.warning weight="duotone" className="size-3.5 shrink-0" style={{ color: DRAG_COLOR.signal }} />
          {flag.title ?? meta.label}
        </span>
        {flag.title && (
          <span className="text-[10.5px] font-medium" style={{ color: DRAG_COLOR.signal }}>{meta.label}</span>
        )}
      </div>
      {flag.read && <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">{flag.read}</p>}
    </div>
  );
}

// a common shape across LP (pillar) and LM (metric) lens patterns
interface LensEvidence {
  pillarLabel: string;
  id: string;
  /** The bare uppercase lens id (LM3 / LP2 / …) — resolves the catalog's "doesn't-mean" copy. */
  lensId: string;
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
      evidence.push({ pillarLabel: label, id: lp.id, lensId: lp.id, label: lp.label, tone: lp.tone, fieldVerdict: lp.fieldVerdict, role: lp.role, verdict: lp.verdict });
    }
    for (const m of p.metrics ?? []) {
      if (m.lensPattern) {
        const lm = m.lensPattern;
        evidence.push({ pillarLabel: label, id: `${m.metricKey}-${lm.id}`, lensId: lm.id, label: lm.label, tone: lm.tone, fieldVerdict: lm.fieldVerdict, role: lm.role, verdict: lm.verdict });
      }
    }
  }
  const lead = evidence.filter((e) => e.role === "top_level");
  const supporting = evidence.filter((e) => e.role === "supporting_detail");

  return (
    <div className="px-1 py-3">
      {/* the 4 pillar subtotals — the composite's frame, for context under the headline.
          Stacks one-per-row on the smallest screens so each bar keeps a readable width. */}
      <div className="mb-3 grid grid-cols-1 gap-x-4 gap-y-2 min-[400px]:grid-cols-2 sm:grid-cols-4">
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
                  {/* The interpretive boundary — now that the lens "doesn't-mean" copy exists
                      frontend-side, every lead lens read carries its boundary. */}
                  <p className="pl-[76px] text-[11px] italic leading-relaxed text-ink3">{lensDoesntMean(e.lensId)}</p>
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

// ── the constituent breakdown — shown in the EXPAND of a MULTI-INSTRUMENT entity (an NTPC stock +
//    bond). One line per instrument: its class, its weight, and its OWN treatment — the equity's score,
//    the bond's served disclosure. Nothing is blended; the row is the entity, this is its parts. ─────
function ConstituentBreakdown({ entity }: { entity: EntityHolding }) {
  return (
    <div className="px-1 py-3">
      <p className="mb-2.5 text-[11px] leading-relaxed text-ink3">
        <span className="num text-ink2">{entity.displayName}</span> across {entity.constituents.length} instruments — one company, {pct1(entity.weight)} of the book:
      </p>
      <div className="flex flex-col gap-2">
        {entity.constituents.map((c) => (
          <div key={c.isin ?? c.symbol} className="flex items-center gap-2.5 rounded-md border border-line bg-surface-1 px-3 py-2">
            <span className="num shrink-0 text-[12px] font-semibold text-ink">{c.symbol}</span>
            {c.assetClass && (
              <Tip content={`This instrument is a ${assetClassLabel(c.assetClass).toLowerCase()}.`}>
                <span className="shrink-0 cursor-help rounded border border-line2 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-ink3">{assetClassLabel(c.assetClass)}</span>
              </Tip>
            )}
            <Tip content={`${pct1(c.weight)} of your whole book, summed across accounts.`}>
              <span className="num ml-auto shrink-0 cursor-help text-[11px] text-ink2">{pct1(c.weight)}</span>
            </Tip>
            {c.health != null ? (
              <Tip content={`Health ${roundScore(c.health)} out of 100 — this instrument's own score.`}>
                <span className="num shrink-0 cursor-help text-[12px] font-medium" style={{ color: holdingHealthColor(c) }}>{roundScore(c.health)}</span>
              </Tip>
            ) : c.disclosureNotes && c.disclosureNotes.length > 0 ? (
              <HoldingDisclosure notes={c.disclosureNotes} variant="inline" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── the condition read for an entity — the equity's band + score, a served by-design disclosure, or an
//    honest "Unscored". Carries its own themed tooltip; the disclosure variant brings its own. Shared by
//    both the desktop row and the mobile card so the two never drift. ─────────────────────────────────
function EntityCondition({ e, byDesign }: { e: EntityHolding; byDesign: boolean }) {
  if (byDesign) return <HoldingDisclosure notes={e.disclosureNotes} variant="inline" />;
  const color = e.health != null ? holdingHealthColor({ health: e.health }) : "var(--ink3)";
  const bandLabel = e.band ? STOCK_BAND_LABEL[e.band] : "Unscored";
  const tip =
    e.health != null
      ? `${bandLabel} band · health ${roundScore(e.health)} of 100 — the score of this issuer's equity.`
      : "We recognise this name but haven't scored it yet — it stays out of the number until we do.";
  return (
    <Tip content={tip}>
      <span className="inline-flex cursor-help items-center gap-2 text-[12px]">
        <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="text-ink2">{bandLabel}</span>
        {e.health != null && (
          <span className="num font-medium" style={{ color }}>
            {roundScore(e.health)}
          </span>
        )}
      </span>
    </Tip>
  );
}

// ── one ENTITY — combined across accounts, matching the engine. weight (summed) · issuer · the equity's
//    band + score · state. RESPONSIVE by construction: a dense table row on sm+, an expandable CARD with
//    labelled fields on phones (the row layout truncated badly there). Attention names carry a left accent
//    and open; a multi-instrument entity opens to its equity's evidence AND its constituent breakdown. ──
function EntityCardView({ rank, flag }: { rank: EntityRank; flag: SignalsDeduction | null }) {
  const [open, setOpen] = useState(false);
  const e = rank.entity;
  const attention = rank.weak || rank.flagged;
  const accent = rank.flagged ? "var(--crit)" : rank.weak ? "var(--high)" : "transparent";
  const attnTip = rank.flagged
    ? flag?.title
      ? `${flag.title} — an active red flag${flag.read ? `. ${flag.read}` : ""}`
      : "An active red flag is firing on this holding."
    : rank.weak
      ? "This holding sits in a weak band — a drag on the book's quality."
      : null;
  // A by-design entity (fund/ETF/gold/pure-bond) is unscored and carries a SERVED note — NOT "awaiting
  // coverage". It renders QUIETER (muted, the info marker, no condition dot) so the eye skips it.
  const notes = e.disclosureNotes;
  const byDesign = e.health == null && notes.length > 0;
  const dim = byDesign;
  // Expand when there's a scored equity (its pillars) OR several instruments to break out.
  const canExpand = e.equity != null || e.multiInstrument;
  // The expand's per-stock evidence reads the EQUITY's symbol (pillars/three-lens unchanged); a
  // fund/gold entity has no equity and no expand.
  const evidenceSymbol = e.equity?.symbol ?? null;
  const why = byDesign
    ? notes[0]!.sentence
    : e.multiInstrument
      ? `${e.constituents.length} instruments of one company — expand to see each`
      : rowState(rank, flag);

  const weightTip = `${pct1(e.weight)} of your whole book by value, summed across every account and instrument for this issuer.`;
  const multiTip = `${e.constituents.length} instruments of one issuer (e.g. its stock and bond), combined into this single line. Expand to see each.`;
  const linkTip = `Open ${e.displayName}'s stock health page.`;
  const toggle = () => canExpand && setOpen((o) => !o);

  return (
    <div
      className={cn("overflow-hidden rounded-xl border border-line bg-surface-1", dim && "opacity-75")}
      style={attention ? { borderLeftColor: accent, borderLeftWidth: 3 } : undefined}
    >
      {/* ── DESKTOP (sm+) — the dense table row ─────────────────────────────────────────────── */}
      <div className="hidden items-stretch sm:flex">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "flex flex-1 items-center gap-3 px-4 py-2.5 text-left",
            canExpand ? "cursor-pointer hover:bg-surface-2" : "cursor-default",
          )}
        >
          <Tip content={weightTip}>
            <span className={cn("num w-11 shrink-0 cursor-help text-right text-[12px]", dim ? "text-ink3" : "text-ink2")}>{pct1(e.weight)}</span>
          </Tip>
          <span className="flex w-28 shrink-0 items-center gap-1.5">
            <span className={cn("font-display truncate text-[13px]", dim ? "font-medium text-ink3" : "font-semibold text-ink")}>{e.displayName}</span>
            {e.multiInstrument && (
              <Tip content={multiTip}>
                <span className="shrink-0 cursor-help rounded border border-line2 px-1 py-px text-[8.5px] uppercase tracking-wide text-ink3">{e.constituents.length}×</span>
              </Tip>
            )}
          </span>
          <span className="flex w-32 justify-center shrink-0 items-center gap-2">
            <EntityCondition e={e} byDesign={byDesign} />
          </span>
            <span className="w-0 min-w-0 flex-1 truncate text-[12px] text-ink3">{why}</span>
          {canExpand && <Icons.caretDown className={cn("size-4 shrink-0 text-ink3 transition-transform", open && "rotate-180")} />}
        </button>
        {/* link-out — the row leads somewhere (Part D): the issuer's stock health page */}
        <Tip content={linkTip}>
          <Link
            href={stockHealthHref(e.displayName)}
            aria-label={`Open ${e.displayName} health`}
            className="grid shrink-0 place-items-center border-l border-line px-3 text-ink3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Icons.arrowUpRight className="size-3.5" />
          </Link>
        </Tip>
      </div>

      {/* ── MOBILE (<sm) — the expandable card: the SAME facts, stacked into labelled fields so nothing
             truncates and every value has room. ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:hidden">
        <button
          type="button"
          onClick={toggle}
          className={cn("flex flex-col gap-2.5 px-3.5 py-3 text-left", canExpand ? "cursor-pointer active:bg-surface-2" : "cursor-default")}
        >
          {/* header — issuer, badges, weight, caret */}
          <div className="flex items-center gap-2">
            <span className={cn("font-display min-w-0 truncate text-[15px]", dim ? "font-medium text-ink3" : "font-semibold text-ink")}>{e.displayName}</span>
            {e.multiInstrument && (
              <Tip content={multiTip}>
                <span className="shrink-0 cursor-help rounded border border-line2 px-1 py-px text-[9px] uppercase tracking-wide text-ink3">{e.constituents.length}×</span>
              </Tip>
            )}
            {attnTip && (
              <Tip content={attnTip}>
                <span className="size-2 shrink-0 cursor-help rounded-full" style={{ background: accent }} />
              </Tip>
            )}
            <Tip content={weightTip}>
              <span className={cn("num ml-auto shrink-0 cursor-help text-[13px] font-medium", dim ? "text-ink3" : "text-ink")}>
                {pct1(e.weight)} <span className="text-[10px] font-normal text-ink3">of book</span>
              </span>
            </Tip>
            {canExpand && <Icons.caretDown className={cn("size-4 shrink-0 text-ink3 transition-transform", open && "rotate-180")} />}
          </div>
          {/* condition field */}
          <div className="flex items-center gap-2">
            <span className="w-[74px] shrink-0 text-[10px] uppercase tracking-wide text-ink3">Condition</span>
            <EntityCondition e={e} byDesign={byDesign} />
          </div>
          {/* why-it's-here field — full text, wrapping */}
          <div className="flex items-start gap-2">
            <span className="w-[74px] shrink-0 pt-px text-[10px] uppercase tracking-wide text-ink3">Why it&apos;s here</span>
            <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-ink2">{why}</span>
          </div>
        </button>
        {/* link-out footer — full-width tap target on phones */}
        <Link
          href={stockHealthHref(e.displayName)}
          className="flex items-center justify-center gap-1.5 border-t border-line px-3 py-2 text-[11.5px] text-ink3 transition-colors active:bg-surface-2"
        >
          Open {e.displayName} health
          <Icons.arrowUpRight className="size-3" />
        </Link>
      </div>

      {/* ── shared expand — per-stock evidence and, for a multi-instrument issuer, its constituent breakout ── */}
      {open && canExpand && (
        <div className="border-t border-line px-3 sm:px-4">
          {/* the flag's identity + written read — the "why", answerable here without leaving the tab */}
          {flag && (flag.title || flag.read) && <FlagNote flag={flag} />}
          {evidenceSymbol && <HoldingEvidence symbol={evidenceSymbol} />}
          {e.multiInstrument && <ConstituentBreakdown entity={e} />}
        </div>
      )}
    </div>
  );
}

/** §4 · Your Combined Holdings — depth, aggregated across accounts to match the Construction engine
 *  (one row per issuer entity). Sorted by weight × attention (weak/flagged lead); expand a name to its
 *  per-stock three-lens (LM/LP) evidence, and — for a multi-instrument issuer — its constituent breakout.
 *  Renders as a dense table on sm+ and as expandable cards on phones (where the row truncated badly). */
export function HoldingsSection({ snapshot, holdings }: { snapshot: PortfolioSnapshot; holdings: Holding[] }) {
  const flags = flaggedEntries(snapshot); // symbol → ledger entry (its title/read), for naming the finding
  const ranks = rankedEntities(aggregateHoldings(holdings), new Set(flags.keys()));
  return (
    <div className={CARD}>
      {/* column headers — desktop only; the mobile cards label their own fields */}
      <div className="mb-2 hidden items-center gap-3 px-4 text-[9.5px] uppercase tracking-wide text-ink3 sm:flex">
        <span className="w-11 shrink-0 text-right">Weight</span>
        <span className="flex w-28 shrink-0 items-center gap-1">
          Holding
          <InfoTip>One line per issuer, combined across accounts. A &ldquo;2×&rdquo; badge means several instruments of one issuer — e.g. its stock and bond — merged into one line.</InfoTip>
        </span>
        <span className="flex w-32 shrink-0 items-center gap-1">
          Condition
          <InfoTip>The scored equity&apos;s health band and score, or a served note for holdings we don&apos;t score by design (funds, ETFs, gold).</InfoTip>
        </span>
        <span className="flex flex-1 items-center gap-1">
          Why it&apos;s here
          <InfoTip>Why the holding is worth noting — an active red flag, a weak band, a multi-instrument issuer, or simply sound and steady.</InfoTip>
        </span>
      </div>
      <div className="flex flex-col gap-5 sm:gap-1.5">
        {ranks.map((rank) => {
          // the winning ledger entry for a flagged entity — matched on any constituent symbol
          const flag = rank.flagged
            ? (rank.entity.constituents.map((c) => flags.get(c.symbol)).find(Boolean) ?? null)
            : null;
          return <EntityCardView key={rank.entity.key} rank={rank} flag={flag} />;
        })}
      </div>
    </div>
  );
}
