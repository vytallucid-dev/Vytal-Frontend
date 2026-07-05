"use client";

import { Icons } from "@/lib/icons";
import type { PfFinding } from "@/types/portfolio";
import { TONE_META } from "../lib";
import { bindChips, findingRead, isCrossPillar, triageFindings } from "./lib";

const CARD = "rounded-xl border border-line bg-surface-1 p-5 sm:p-6";

// ── family identity — the pillar a finding speaks to (badge label) ──────────────────
const FAMILY_LABEL: Record<string, string> = {
  PC: "Concentration",
  PB: "Breadth",
  PQ: "Quality",
  PS: "Signals",
  PV: "Coverage",
  PX: "Cross-pillar",
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

// ── a loud headline finding card — tone-styled, the read + the receipts. Cross-pillar
//    (PX) findings get a distinct tag — they name the tension the single number hid. ──
function FindingCard({ f }: { f: PfFinding }) {
  const tm = TONE_META[f.tone];
  const read = findingRead(f);
  const showRead = read !== f.label;
  return (
    <div
      className="rounded-lg border p-3.5"
      style={{ borderColor: tm.border, borderLeftColor: tm.color, borderLeftWidth: 3, background: tm.bg }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: tm.color }}>
          {FAMILY_LABEL[f.family] ?? f.family}
        </span>
        {isCrossPillar(f) && (
          <span className="inline-flex items-center gap-1 rounded-full border border-line2 bg-surface-2 px-1.5 py-px text-[9px] uppercase tracking-wide text-ink3">
            <Icons.scales weight="bold" className="size-2.5" />
            tension
          </span>
        )}
        <span className="num ml-auto text-[9.5px] text-ink3">{f.id}</span>
      </div>
      <p className="mt-1.5 text-[13px] font-semibold text-ink">{f.label}</p>
      {showRead && <p className="mt-1 text-[12px] leading-relaxed text-ink2">{read}</p>}
      <Chips f={f} />
    </div>
  );
}

// ── a quiet finding — secondary texture: present, never suppressed, not headlined.
//    Also the shared row for the coverage section's PV-family findings. ────────────────
export function FindingRow({ f }: { f: PfFinding }) {
  const tm = TONE_META[f.tone];
  const read = findingRead(f);
  const showRead = read !== f.label;
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-line bg-surface-2 px-3 py-2">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: tm.color }} />
      <div className="min-w-0">
        <span className="text-[12px] font-medium text-ink">{f.label}</span>
        <span className="ml-1.5 text-[10px] uppercase tracking-wide text-ink3">{FAMILY_LABEL[f.family] ?? f.family}</span>
        {showRead && <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink3">{read}</p>}
        <Chips f={f} />
      </div>
    </div>
  );
}

/** §2 · Headline findings — what the number hid. The PF library, triaged: loud findings
 *  headline (Concern → Constructive, heavier capital first); quiet ones are texture.
 *  Descriptive only — tone renders as-is; nothing here is advice. */
export function FindingsSection({ findings }: { findings: PfFinding[] }) {
  const { loud, quiet } = triageFindings(findings);

  if (loud.length === 0 && quiet.length === 0) {
    return (
      <div className={CARD}>
        <div className="flex items-center gap-2.5 text-[13px] text-ink2">
          <Icons.check weight="bold" className="size-4" style={{ color: "var(--rec)" }} />
          The single number hid nothing worth headlining — no portfolio-level pattern fired on this book.
        </div>
      </div>
    );
  }

  return (
    <div className={CARD}>
      {loud.length > 0 && (
        <>
          <p className="kicker mb-3">What the number hid</p>
          <div className="grid gap-3 md:grid-cols-2">
            {loud.map((f) => (
              <FindingCard key={f.id} f={f} />
            ))}
          </div>
        </>
      )}

      {quiet.length > 0 && (
        <div className={loud.length > 0 ? "mt-5 border-t border-line pt-4" : ""}>
          <p className="kicker mb-3">More context</p>
          <div className="grid gap-2 md:grid-cols-2">
            {quiet.map((f) => (
              <FindingRow key={f.id} f={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
