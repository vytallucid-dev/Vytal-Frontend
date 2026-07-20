"use client";

import { useState } from "react";
import { Icons } from "@/lib/icons";
import type { PfFinding } from "@/types/portfolio";
import { findingRead } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────
// PD DISCLOSURES (Construction v2 Stage 10a) — "what we can't tell you about this book". Its OWN section,
// distinct from findings: a PD finding describes VYTAL (what our data does not carry), not the book. Served
// on `referenceFindings` (a PfFinding[] channel), NOT the per-holding `disclosureNotes` — so this renders
// findings (id · label · read · doesntMean), and does NOT reuse `HoldingDisclosure` (that renders the
// different DisclosureNote shape). Every PD is mandatory and unsuppressible BY CONSTRUCTION (it is never
// in the persisted set the sort runs over), so there is nothing to filter — render them all, verbatim.
// ─────────────────────────────────────────────────────────────────────────────

function DisclosureItem({ f }: { f: PfFinding }) {
  const [open, setOpen] = useState(false);
  const read = findingRead(f);
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <div className="flex items-baseline gap-2.5">
        <span className="num shrink-0 text-[10px] text-ink3">{f.id}</span>
        <p className="text-[12.5px] font-medium text-ink">{f.label}</p>
      </div>
      {read !== f.label && <p className="mt-1 pl-[34px] text-[11.5px] leading-relaxed text-ink3">{read}</p>}
      {f.doesntMean && (
        <div className="pl-[34px]">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-ink3 transition-colors hover:text-ink2"
          >
            What this doesn&apos;t mean
            <Icons.caretDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && <p className="mt-1 border-l-2 border-line2 pl-2.5 text-[11px] italic leading-relaxed text-ink3">{f.doesntMean}</p>}
        </div>
      )}
    </div>
  );
}

/** The PD disclosure channel — reference-only, always-on, unsuppressible. Renders nothing when the
 *  book carries no disclosures (a pure-equity book with nothing we can't tell you). */
export function PdDisclosures({ findings }: { findings: PfFinding[] }) {
  if (!findings || findings.length === 0) return null;
  return (
    <div className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
      <p className="mb-3.5 max-w-[70ch] text-[12px] leading-relaxed text-ink3">
        These always show when they apply and can&apos;t be dismissed — the limits of what we can honestly say about what you hold. They describe our data, not your money.
      </p>
      <div className="flex flex-col">
        {findings.map((f) => (
          <DisclosureItem key={f.id} f={f} />
        ))}
      </div>
    </div>
  );
}
