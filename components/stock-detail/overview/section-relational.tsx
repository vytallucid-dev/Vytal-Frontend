"use client";

/**
 * THE RELATIONAL CARD (Relational L4) — the reader's personal note before the analysis begins.
 *
 * Every other Overview section describes THE STOCK. This one describes THE READER AND THE STOCK — their
 * position, what connects, what has stood for how long. It reads as a DIFFERENT KIND of object, but it
 * stays firmly IN the theme: it wears the EXACT same cool `.card-hero` surface as the card above it
 * (IdentitySection / Company) — a `--surface` base with the standard cool `--primary` corner glow. Its
 * only notes of its own are quiet and IN-PALETTE: a serif mode-header (font-display), and the reader-fact
 * markers rendered in the theme's own calm slate context colour (`--ctx`) against neutral object-fact
 * markers. No foreign accent hue, no colour wash, no SectionEyebrow (its mode header IS its label).
 *
 * ── LEAD-AND-SUPPORT, NOT A LIST (§Phase-rebuild) ──────────────────────────────────────────────────────
 * The card reads as someone telling you something, not a summary of bullet points: no <ul>/<li>, no
 * bullet dots, no leading markers. The mode header frames it; slot 1 is the LEAD, visually heaviest of
 * the body, directly under the header; the remaining slots are SUPPORTING — subordinate weight, tighter
 * spacing, one group beneath the lead rather than peers of it. Gloss stays a quiet line under its claim.
 * One boundary line at the end, the quietest thing on the card.
 *
 * ── WHAT THIS COMPONENT MAY NOT DO (Overview Pattern Library) ────────────────────────────────────────
 *  · Never author, reword, or re-template a `claim`, `gloss`, or `doesntMean` — they arrive RENDERED
 *    (the AI layer consumes the same object, §6.2). Sentences are rendered verbatim.
 *  · Never re-sort `slots` — the order is the backend's arbitration ladder, stable across visits (§2.3).
 *  · Never render `sourceRef`, `entryId`, `family`, or `weight` — opaque routing/telemetry fields.
 *  · Never render `negatives` or `meta.degradations` — the AI-layer payload / coverage record.
 *  · Never put a return / gain / loss / cost-basis figure on the card, from any source (§0.8).
 *  · Never re-derive the boundary priority — `boundaryEntryId` is the backend's pick (§4).
 *  · Never re-present a number the claim sentence already carries — the sentence is the whole fact; no
 *    badge row duplicates it.
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { BoundaryLine } from "@/components/ui/boundary-line";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import { useRelationalState } from "@/lib/api/hooks/use-relational";
import { Section, LoadingBlock } from "./shared";
import type { ResolvedEntry } from "@/types/relational";

// The section's own identity in the Overview stack — "Vytal Read" (the reader's read of the stock: their
// position, what connects, what's stood for how long). Rendered with the standard SectionEyebrow like
// every sibling, in the theme's calm slate — the same hue as the reader-fact markers inside.
const SECTION_ID = "overview-relational";
const SECTION_LABEL = "Vytal Read";
const SECTION_ACCENT = "var(--ctx)";

/** Reader-fact vs object-fact (§5): the UH and UW families plus UO4 are facts about the reader's OWN
 *  book or list; the rest are facts about the object. Derived from `family` (UO4 is the one documented
 *  UO exception — the single reader-fact among a stranger's orientation lines). `family` itself is never
 *  rendered. UW is the watchlist namespace: reader-side like UH, but a separate family because UH's
 *  boundary language is exposure-based and watchlisting is not exposure. */
const isReaderFact = (e: ResolvedEntry) => e.family === "UH" || e.family === "UW" || e.entryId === "UO4";

function NewPill() {
  // "New" — an annotation, never a reordering (§4.4). Tinted with the theme's own slate context colour.
  return (
    <span
      className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-px align-middle text-[9px] font-semibold uppercase tracking-wide"
      style={{ background: "var(--ctx-bg)", color: "var(--ctx)", border: "1px solid var(--ctx-bd)" }}
    >
      New
    </span>
  );
}

/** The card's LEAD claim — visually heaviest of the body, directly under the header. */
function LeadLine({ entry }: { entry: ResolvedEntry }) {
  const reader = isReaderFact(entry);
  return (
    <div className="mt-3 flex gap-2">
      <span
        aria-hidden
        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: reader ? "var(--ctx)" : "var(--ink3)" }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-medium leading-relaxed text-ink">
          {entry.claim}
          {entry.isNewSinceLastLook && <NewPill />}
        </p>
        {entry.gloss && <p className="mt-1 text-[12px] leading-relaxed text-ink3">{entry.gloss}</p>}
      </div>
    </div>
  );
}

/** A supporting claim — subordinate weight, tighter spacing, part of the group beneath the lead. */
function SupportLine({ entry }: { entry: ResolvedEntry }) {
  const reader = isReaderFact(entry);
  return (
    <div className="flex gap-2">
      <span
        aria-hidden
        className="mt-1.5 h-1.25 w-1.25 shrink-0 rounded-full"
        style={{ background: reader ? "var(--ctx)" : "var(--ink3)", opacity: 0.7 }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-relaxed text-ink2">
          {entry.claim}
          {entry.isNewSinceLastLook && <NewPill />}
        </p>
        {entry.gloss && <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink3">{entry.gloss}</p>}
      </div>
    </div>
  );
}

function Boundary({ text }: { text: string }) {
  // The app's shared doesn't-mean treatment (BoundaryLine): a left hairline rule, a derived label, and
  // the "≠" notation rendered as a real list rather than printed as a glyph.
  return <BoundaryLine text={text} size="md" />;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════

export function RelationalSection({ symbol }: { symbol: string }) {
  // Resolve the stock's id from the cached universe list (the same source the page uses for the pin
  // button) — this card takes `symbol` like every other Overview section and self-resolves the id.
  const { data: universe } = useUniverseStocks();
  const stockId = useMemo(() => universe?.find((s) => s.symbol === symbol)?.id ?? null, [universe, symbol]);

  const { data, isLoading, isError } = useRelationalState(stockId);
  const [open, setOpen] = useState(false);

  // Loading — the eyebrow + a quiet skeleton at roughly the card's height. Never blocks the rest of the
  // Overview (each section fetches independently). While the universe list is still resolving, stockId is
  // null and the query is disabled — the skeleton covers that window too.
  if (stockId == null || isLoading) {
    return (
      <Section id={SECTION_ID} label={SECTION_LABEL} icon={Icons.eye} accent={SECTION_ACCENT}>
        <LoadingBlock className="h-40 rounded-2xl" />
      </Section>
    );
  }

  // Failure or 4xx/5xx — render NOTHING (the whole section, eyebrow included). A supplementary card; an
  // error message where a personal note belongs is worse than its absence, and it must not disturb the
  // rest of the Overview.
  if (isError || !data) return null;

  const { header, slots, overflow, boundaryEntryId } = data;
  if (slots.length === 0) return null; // guaranteed-resolve upstream; defensive only.

  const [lead, ...support] = slots;
  // The backend picks the boundary — render whichever entryId it names, never re-derive the priority.
  const boundaryEntry = slots.find((s) => s.entryId === boundaryEntryId) ?? lead;
  const hasOverflow = overflow.length > 0;
  const otherBoundaries = slots.filter((s) => s.entryId !== boundaryEntry?.entryId);
  const canExpand = hasOverflow || otherBoundaries.length > 0;
  const expandLabel = hasOverflow ? `Everything standing (${slots.length + overflow.length})` : "What these don't mean";

  return (
    <Section id={SECTION_ID} label={SECTION_LABEL} icon={Icons.eye} accent={SECTION_ACCENT}>
      {/* The app's .card-hero surface, unmodified — the exact cool tint the card above (IdentitySection)
          wears. No foreign accent hue, no colour wash. The card sets itself apart by its serif header and
          the slate reader-fact markers, not by tint. */}
      <div className="card-hero relative overflow-hidden rounded-2xl border border-line2 px-5 py-4">
        <div className="relative">
          {/* Header — the mode's framing sentence IS the label. Display/serif, larger than body. */}
          <h3 className="font-display text-[17px] font-medium leading-snug tracking-[-0.005em] text-ink sm:text-[19px]">
            {header.claim}
          </h3>
          {header.gloss && <p className="mt-1 text-[12px] leading-relaxed text-ink3">{header.gloss}</p>}

          {/* Lead — slot 1, visually heaviest of the body, directly under the header. */}
          <LeadLine entry={lead} />

          {/* Support — remaining slots, subordinate weight, one group beneath the lead. */}
          {support.length > 0 && (
            <div className="mt-2.5 space-y-2.5 border-t border-line/60 pt-2.5">
              {support.map((e) => (
                <SupportLine key={e.entryId} entry={e} />
              ))}
            </div>
          )}

          {/* Exactly ONE boundary inline — the quietest thing on the card. */}
          {boundaryEntry && (
            <div className="mt-3.5">
              <Boundary text={boundaryEntry.doesntMean} />
            </div>
          )}

          {/* Footer — a single quiet expand control. No CTAs, no links. */}
          {canExpand && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-2/60 px-2.5 py-1 text-[11.5px] text-ink3 transition-colors hover:border-line3 hover:text-ink2"
              >
                <Icons.caretDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
                {open ? "Show less" : expandLabel}
              </button>

              {open && (
                <div className="mt-3 border-t border-line pt-3">
                  {hasOverflow ? (
                    <div className="space-y-2.5">
                      {overflow.map((e) => (
                        <SupportLine key={e.entryId} entry={e} />
                      ))}
                    </div>
                  ) : (
                    // No overflow → reveal the boundary lines of the entries not shown inline.
                    <div className="space-y-2.5">
                      {otherBoundaries.map((e) => (
                        <div key={e.entryId}>
                          <p className="mb-1 text-[11.5px] leading-relaxed text-ink2">{e.claim}</p>
                          <Boundary text={e.doesntMean} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
