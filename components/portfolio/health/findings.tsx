"use client";

import { Icons } from "@/lib/icons";
import type { PfFinding } from "@/types/portfolio";
import type { PortfolioTab } from "../tabs";
import { FAMILY_META, TONE_META, stockHealthHref } from "../lib";
import { bindChips, findingRead, isCrossPillar, type FindingTriage } from "./lib";
import { OpenLink } from "./parts";

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

// ── link-out (Part D) — a finding must lead somewhere. Names a symbol → that stock's
//    health page; PC/PB (concentration/sector/breadth) → the Holdings & Allocation tab. ─
function FindingLink({ f, onOpenTab }: { f: PfFinding; onOpenTab?: (t: PortfolioTab) => void }) {
  const sym = typeof f.bind?.symbol === "string" ? (f.bind.symbol as string) : null;
  if (sym) return <OpenLink href={stockHealthHref(sym)}>Open {sym}</OpenLink>;
  const multi = Array.isArray(f.bind?.symbols) && (f.bind!.symbols as unknown[]).length > 0;
  if ((f.family === "PC" || f.family === "PB" || multi) && onOpenTab)
    return <OpenLink onClick={() => onOpenTab("holdings")}>See in holdings</OpenLink>;
  return null;
}

// ── a loud headline finding card — family-badged, the read + the receipts + a link out.
//    Cross-pillar (PX) findings carry a "tension" pill — they name what the number hid. ─
export function FindingCard({ f, onOpenTab }: { f: PfFinding; onOpenTab?: (t: PortfolioTab) => void }) {
  const tm = TONE_META[f.tone];
  const fam = FAMILY_META[f.family] ?? { label: f.family, color: tm.color };
  const read = findingRead(f);
  const showRead = read !== f.label;
  return (
    <div className="rounded-xl border p-3.5" style={{ borderColor: tm.border, borderLeftColor: fam.color, borderLeftWidth: 3, background: tm.bg }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: fam.color }}>
          {fam.label}
        </span>
        {isCrossPillar(f) && (
          <span className="inline-flex items-center gap-1 rounded-full border border-line2 bg-surface-2 px-1.5 py-px text-[9px] uppercase tracking-wide text-ink3">
            <Icons.scales weight="bold" className="size-2.5" />
            tension
          </span>
        )}
        <span className="num ml-auto text-[9.5px] text-ink3">{f.id}</span>
      </div>
      <p className="font-display mt-1.5 text-[14px] font-semibold text-ink">{f.label}</p>
      {showRead && <p className="mt-1 text-[12px] leading-relaxed text-ink2">{read}</p>}
      <Chips f={f} />
      <div className="mt-2">
        <FindingLink f={f} onOpenTab={onOpenTab} />
      </div>
    </div>
  );
}

// ── a quiet finding — secondary texture, and the shared row for coverage-family findings. ─
export function FindingRow({ f, onOpenTab }: { f: PfFinding; onOpenTab?: (t: PortfolioTab) => void }) {
  const tm = TONE_META[f.tone];
  const fam = FAMILY_META[f.family] ?? { label: f.family, color: tm.color };
  const read = findingRead(f);
  const showRead = read !== f.label;
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: fam.color }} />
      <div className="min-w-0 flex-1">
        <span className="font-display text-[12.5px] font-medium text-ink">{f.label}</span>
        <span className="ml-1.5 text-[10px] uppercase tracking-wide text-ink3">{fam.label}</span>
        {showRead && <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink3">{read}</p>}
        <Chips f={f} />
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
  onOpenTab?: (t: PortfolioTab) => void;
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
