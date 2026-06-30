"use client";

import type { PeerGroupHealthView } from "@/types/peer-group";
import { PortraitSection } from "./portrait-section";
import { FieldLensSection } from "./field-lens-section";
import { StructureSection } from "./structure-section";
import { ProspectsSection } from "./prospects-section";
import { ExplorerSection } from "./explorer-section";
import { RawFloorSection } from "./raw-floor-section";

// ─────────────────────────────────────────────────────────────────────────────
// The PG Health tab — the real-data surface, faithful to docs/vytal_pg_health_tab.html.
// Section order (1→5): pond portrait → structure (movers + pathology) → prospects /
// hazards → metric distribution explorer → the underlying record. Every section
// renders ONLY what PeerGroupHealthView supplies; honest empty/guarded states stand
// in where the prototype's example data has no backing field.
// ─────────────────────────────────────────────────────────────────────────────
export function PeerGroupHealth({ view }: { view: PeerGroupHealthView }) {
  // The detail page already guards scored:false; aggregate is present when scored.
  if (!view.aggregate) {
    return (
      <div className="rounded-xl border border-line bg-card py-16 text-center">
        <p className="text-sm font-medium text-ink2">Not yet scored</p>
        <p className="mx-auto mt-1 max-w-sm text-[12px] text-ink3">
          This pond has no in-force snapshots yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PortraitSection
        aggregate={view.aggregate}
        members={view.members}
        identity={view.identity}
        notAtCurrentPeriod={view.notAtCurrentPeriod}
      />
      <FieldLensSection verdicts={view.aggregate.fieldLensVerdicts ?? []} />
      <StructureSection movers={view.movers} pathology={view.pathology} />
      <ProspectsSection members={view.members} />
      <ExplorerSection
        metrics={view.metricDistributions}
        fieldLensVerdicts={view.aggregate.fieldLensVerdicts ?? []}
      />
      <RawFloorSection metrics={view.metricDistributions} />
    </div>
  );
}
