"use client";

/**
 * THE RELATIONAL CARD (Relational L4) — the reader's personal note before the analysis begins.
 *
 * Every other Overview section describes THE STOCK. This one describes THE READER AND THE STOCK — their
 * position, what connects, what has stood for how long. It reads as a DIFFERENT KIND of object, but it
 * stays firmly IN the theme: it wears the EXACT same cool `.card-hero` surface as the card above it
 * (IdentitySection / Company) — a `--surface` base with the standard cool `--primary` corner glow — the same `Chip`
 * badges, and the same band treatment as the page header. Its only notes of its own are quiet and
 * IN-PALETTE: a serif mode-header (font-display), and the reader-fact markers rendered in the theme's own
 * calm slate context colour (`--ctx`) against neutral object-fact markers. No foreign accent hue, no
 * colour wash, no SectionEyebrow (its mode header IS its label).
 *
 * ── WHAT THIS COMPONENT MAY NOT DO (Overview Pattern Library) ────────────────────────────────────────
 *  · Never author, reword, or re-template a `claim`, `gloss`, or `doesntMean` — they arrive RENDERED
 *    (the AI layer consumes the same object, §6.2). Sentences are rendered verbatim.
 *  · Never re-sort `slots` — the order is the backend's arbitration ladder, stable across visits (§2.3).
 *  · Never render `sourceRef`, `entryId`, `family`, or `weight` — opaque routing/telemetry fields.
 *  · Never render `negatives` or `meta.degradations` — the AI-layer payload / coverage record.
 *  · Never put a return / gain / loss / cost-basis figure on the card, from any source (§0.8).
 *  · Badges come from `arithmetic` (structured), never from re-parsing the rendered sentence.
 */

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import { useRelationalState } from "@/lib/api/hooks/use-relational";
import { BAND_META } from "../health/shared";
import { Section, Chip, LoadingBlock } from "./shared";
import type { LabelBand } from "@/types/health";
import type { ResolvedEntry } from "@/types/relational";

// The section's own identity in the Overview stack — "Vytal Read" (the reader's read of the stock: their
// position, what connects, what's stood for how long). Rendered with the standard SectionEyebrow like
// every sibling, in the theme's calm slate — the same hue as the reader-fact markers inside.
const SECTION_ID = "overview-relational";
const SECTION_LABEL = "Vytal Read";
const SECTION_ACCENT = "var(--ctx)";

// The page header's band-badge treatment, verbatim — a card that renders "Steady 64" louder than the
// header would be editorialising by emphasis, so it reuses the exact same colour recipe (§4).
const BAND_BADGE: Record<LabelBand, string> = {
  pristine: "border-pristine/30 bg-pristine/10 text-pristine",
  healthy: "border-healthy/30 bg-healthy/10 text-healthy",
  steady: "border-steady/30 bg-steady/10 text-steady",
  below_par: "border-below/30 bg-below/10 text-below",
  fragile: "border-fragile/30 bg-fragile/10 text-fragile",
};

// ── small formatters (mirror the backend so a badge matches the claim's own string) ─────────────────
const trim1 = (n: number) => {
  const o = Math.round(n * 10) / 10;
  return Number.isInteger(o) ? `${o}` : o.toFixed(1);
};
/** Indian short money — ₹2.4 lakh · ₹40 crore · ₹18,000. Mirrors the backend `formatINR`. */
function fmtINRShort(v: number): string {
  const x = Math.round(v);
  if (x >= 1_00_00_000) return `₹${trim1(x / 1_00_00_000)} crore`;
  if (x >= 1_00_000) return `₹${trim1(x / 1_00_000)} lakh`;
  return `₹${x.toLocaleString("en-IN")}`;
}
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const isLabelBand = (b: unknown): b is LabelBand =>
  b === "fragile" || b === "below_par" || b === "steady" || b === "healthy" || b === "pristine";

/** Reader-fact vs object-fact (§5): the UH family plus UO4 are facts about the reader's OWN book; the
 *  rest are facts about the object. Derived from `family` (UO4 is the one documented UO exception — the
 *  single reader-fact among a stranger's orientation lines). `family` itself is never rendered. */
const isReaderFact = (e: ResolvedEntry) => e.family === "UH" || e.entryId === "UO4";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// Badges — quantities a reader SCANS, lifted from `arithmetic`, ≤3 per slot. Built on the app's own
// `Chip` (neutral pill) so they read exactly like every other Overview chip; the band badge alone wears
// the page header's band colours. Never a full clause, the header, or the boundary.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

function BandBadge({ composite, band }: { composite: number; band: LabelBand }) {
  return (
    <Chip className={cn("gap-1 font-medium", BAND_BADGE[band])}>
      <span className="num">{Math.round(composite)}</span>
      <span className="opacity-50">·</span>
      {BAND_META[band].label}
    </Chip>
  );
}

/** The badge set for one entry, from its `arithmetic` (+ standingSince). Order: value, weight, rank,
 *  health+band, duration — capped at 3. */
function badgesFor(e: ResolvedEntry): ReactNode[] {
  const a = e.arithmetic ?? {};
  const out: ReactNode[] = [];

  // Money + weight (a position claim). Never a return / gain / loss / basis — `value` is market value.
  const value = num(a.value);
  if (value != null && value > 0) {
    out.push(<Chip key="val" tone="accent"><span className="num">{fmtINRShort(value)}</span></Chip>);
  }
  const weightPct = num(a.weightPct);
  if (weightPct != null && weightPct > 0 && e.family === "UH") {
    out.push(<Chip key="wt" tone="accent"><span className="num">{weightPct}%</span>&nbsp;of book</Chip>);
  }

  // Rank / scale.
  const rank = num(a.rank);
  if (rank != null && rank >= 1) out.push(<Chip key="rank" tone="accent">{ordinal(rank)}-largest</Chip>);
  else if (e.entryId === "UH3" && weightPct != null) out.push(<Chip key="heavy" tone="accent">heavy</Chip>);

  // Health score + band — one badge, the page header's band treatment.
  const composite = num(a.composite);
  if (composite != null && isLabelBand(a.band)) out.push(<BandBadge key="hb" composite={composite} band={a.band} />);

  // Duration — the standingSince label (a fact about persistence, quiet + monospace).
  if (e.standingSince) {
    out.push(
      <Chip key="dur">
        <Icons.clock className="h-3 w-3" />
        <span className="num">{e.standingSince.label}</span>
      </Chip>,
    );
  }

  return out.slice(0, 3);
}

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

function SlotRow({ entry }: { entry: ResolvedEntry }) {
  const reader = isReaderFact(entry);
  const badges = badgesFor(entry);
  return (
    <li className="flex gap-2.5">
      {/* leading marker — reader-fact takes the card's calm slate accent, object-fact stays neutral (§5). */}
      <span
        aria-hidden
        className="mt-1.75 h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: reader ? "var(--ctx)" : "var(--ink3)" }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-relaxed text-ink2">
          {entry.claim}
          {entry.isNewSinceLastLook && <NewPill />}
        </p>
        {badges.length > 0 && <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{badges}</div>}
        {entry.gloss && <p className="mt-1 text-[11.5px] leading-relaxed text-ink3">{entry.gloss}</p>}
      </div>
    </li>
  );
}

/** The single inline boundary (§3): the doesntMean of the highest-misread-risk entry — UO6 (strength)
 *  first, then UO2 (health), then UO3 (flags). Facts about the reader's own book are hard to misread;
 *  claims about the object's QUALITY are exactly what gets misread, and UO6 ("sound for six years")
 *  reads as a buy unless its already-priced boundary is visible. Falls back to the top slot. */
function pickBoundaryEntry(slots: ResolvedEntry[]): ResolvedEntry | null {
  const byId = (id: string) => slots.find((s) => s.entryId === id);
  return byId("UO6") ?? byId("UO2") ?? byId("UO3") ?? slots[0] ?? null;
}

function Boundary({ text }: { text: string }) {
  // The app's existing doesn't-mean treatment (findings-section): a left hairline rule + muted italic.
  return <p className="border-l-2 border-line2 pl-3 text-[11.5px] italic leading-relaxed text-ink3">{text}</p>;
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

  const { header, slots, overflow } = data;
  if (slots.length === 0) return null; // guaranteed-resolve upstream; defensive only.

  const boundaryEntry = pickBoundaryEntry(slots);
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

          {/* Slots — in the response order, never re-sorted. */}
          <ul className="mt-3.5 space-y-3">
            {slots.map((e) => (
              <SlotRow key={e.entryId} entry={e} />
            ))}
          </ul>

          {/* Exactly ONE boundary inline. */}
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
                    <ul className="space-y-3">
                      {overflow.map((e) => (
                        <SlotRow key={e.entryId} entry={e} />
                      ))}
                    </ul>
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
