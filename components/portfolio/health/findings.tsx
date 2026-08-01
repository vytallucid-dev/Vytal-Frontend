"use client";

import { Icons } from "@/lib/icons";
import { BoundaryLine } from "@/components/ui/boundary-line";
import type { PfFinding } from "@/types/portfolio";
import { FLAGS_SECTION_ID, type OpenTab } from "../tabs";
import { FAMILY_META, TONE_META, stockHealthHref } from "../lib";
import { bindChips, findingRead, isCrossPillar, type FindingTriage } from "./lib";
import { OpenLink, Tip } from "./parts";

// what each finding family is about — plain-language, for the hover-reveal on the family badge
const FAMILY_TIP: Record<string, string> = {
  PC: "Concentration — one issuer or position holding an outsized share of the book.",
  PB: "Breadth — how thinly your weight is spread across effective positions and sectors.",
  PQ: "Quality — the fundamental strength of the businesses you own.",
  PS: "Signals — active red flags firing on your holdings.",
  PX: "Cross-pillar — a tension between reads that the single number blended away.",
  PV: "Coverage — how much of your book we can see and score.",
};

// ── the exact-value receipts (60% · Neff 1.92 · 42% of value), verbatim from bind ────
function Chips({ f }: { f: PfFinding }) {
  const chips = bindChips(f);
  if (chips.length === 0) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span key={c.key} className="num rounded-md border border-line2 bg-surface-2 px-2 py-0.5 text-[10.5px] text-ink2">
          {c.text}
        </span>
      ))}
    </div>
  );
}

// ── link-out (Part D) — a finding must lead somewhere THAT CARRIES THE ANSWER, never a surface
//    that doesn't. Names a symbol → that stock's health page (shows its flag/evidence). A Signals
//    (PS) finding over several names → the Signals-ledger section, which now itemises each flag by
//    name. Concentration/breadth (PC/PB) → the Holdings & Allocation tab, which shows composition.
//    Anything with no answer-carrying destination renders NO link (a missing link beats a wrong one). ─
function FindingLink({ f, onOpenTab }: { f: PfFinding; onOpenTab?: OpenTab }) {
  const sym = typeof f.bind?.symbol === "string" ? (f.bind.symbol as string) : null;
  if (sym) return <OpenLink href={stockHealthHref(sym)}>Open {sym}</OpenLink>;
  const multi = Array.isArray(f.bind?.symbols) && (f.bind!.symbols as unknown[]).length > 0;
  // Signals findings (flags): the answer is the Signals ledger — land on it (it names each flag).
  // NOT the Holdings tab, which shows nothing about the flag.
  if (f.family === "PS" && multi && onOpenTab)
    return <OpenLink onClick={() => onOpenTab("health", FLAGS_SECTION_ID)}>See the flags</OpenLink>;
  // Concentration/breadth (PC/PB): the Holdings & Allocation tab carries the composition answer.
  if ((f.family === "PC" || f.family === "PB" || multi) && onOpenTab)
    return <OpenLink onClick={() => onOpenTab("holdings")}>See in holdings</OpenLink>;
  return null;
}

// ── a loud headline finding card — family-badged, the read + the receipts + a link out.
//    Cross-pillar (PX) findings carry a "tension" pill — they name what the number hid. ─
export function FindingCard({ f, onOpenTab }: { f: PfFinding; onOpenTab?: OpenTab }) {
  const tm = TONE_META[f.tone];
  const fam = FAMILY_META[f.family] ?? { label: f.family, color: tm.color };
  const read = findingRead(f);
  const showRead = read !== f.label;
  return (
    <div className="rounded-xl border p-3.5" style={{ borderColor: tm.border, borderLeftColor: fam.color, borderLeftWidth: 3, background: tm.bg }}>
      <div className="flex flex-wrap items-center gap-2">
        {FAMILY_TIP[f.family] ? (
          <Tip content={FAMILY_TIP[f.family]}>
            <span className="cursor-help text-[9px] font-semibold uppercase tracking-widest" style={{ color: fam.color }}>
              {fam.label}
            </span>
          </Tip>
        ) : (
          <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: fam.color }}>
            {fam.label}
          </span>
        )}
        {isCrossPillar(f) && (
          <Tip content="A cross-pillar tension — two reads pulling different ways that the single number blended away.">
            <span className="inline-flex cursor-help items-center gap-1 rounded-full border border-line2 bg-surface-2 px-1.5 py-px text-[9px] uppercase tracking-wide text-ink3">
              <Icons.scales weight="bold" className="size-2.5" />
              tension
            </span>
          </Tip>
        )}
        <span className="num ml-auto text-[9.5px] text-ink3">{f.id}</span>
      </div>
      <p className="font-display mt-1.5 text-[14px] font-semibold text-ink">{f.label}</p>
      {showRead && <p className="mt-1 text-[12px] leading-relaxed text-ink2">{read}</p>}
      <Chips f={f} />
      {f.doesntMean && <BoundaryLine text={f.doesntMean} size="sm" className="mt-2.5" />}
      <div className="mt-2">
        <FindingLink f={f} onOpenTab={onOpenTab} />
      </div>
    </div>
  );
}

// ── a quiet finding — secondary texture, and the shared row for coverage-family findings. ─
export function FindingRow({ f, onOpenTab }: { f: PfFinding; onOpenTab?: OpenTab }) {
  const tm = TONE_META[f.tone];
  const fam = FAMILY_META[f.family] ?? { label: f.family, color: tm.color };
  const read = findingRead(f);
  const showRead = read !== f.label;
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: fam.color }} />
      <div className="min-w-0 flex-1">
        <span className="font-display text-[12.5px] font-medium text-ink">{f.label}</span>
        {FAMILY_TIP[f.family] ? (
          <Tip content={FAMILY_TIP[f.family]}>
            <span className="ml-1.5 cursor-help text-[10px] uppercase tracking-wide text-ink3">{fam.label}</span>
          </Tip>
        ) : (
          <span className="ml-1.5 text-[10px] uppercase tracking-wide text-ink3">{fam.label}</span>
        )}
        {showRead && <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink3">{read}</p>}
        <Chips f={f} />
        {f.doesntMean && <BoundaryLine text={f.doesntMean} size="xs" className="mt-1.5" />}
      </div>
      <FindingLink f={f} onOpenTab={onOpenTab} />
    </div>
  );
}

// ── a findings block — loud cards (2-col) over quiet rows. Reused by BOTH reads (health
//    patterns PQ/PS/PX · construction PC/PB). Empty → an honest, read-specific note. ─────
export function FindingsBlock({
  triage,
  loudKicker,
  emptyNote,
  onOpenTab,
}: {
  triage: FindingTriage;
  loudKicker: string;
  emptyNote: string;
  onOpenTab?: OpenTab;
}) {
  const { loud, quiet } = triage;
  if (loud.length === 0 && quiet.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-4 py-3 text-[12.5px] text-ink2">
        <Icons.check weight="bold" className="size-4" style={{ color: "var(--rec)" }} />
        {emptyNote}
      </div>
    );
  }
  return (
    <div>
      {loud.length > 0 && (
        <>
          <p className="kicker mb-3">{loudKicker}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {loud.map((f) => (
              <FindingCard key={f.id} f={f} onOpenTab={onOpenTab} />
            ))}
          </div>
        </>
      )}
      {quiet.length > 0 && (
        <div className={loud.length > 0 ? "mt-5 border-t border-line pt-4" : ""}>
          <p className="kicker mb-3">More context</p>
          <div className="grid gap-2 md:grid-cols-2">
            {quiet.map((f) => (
              <FindingRow key={f.id} f={f} onOpenTab={onOpenTab} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
