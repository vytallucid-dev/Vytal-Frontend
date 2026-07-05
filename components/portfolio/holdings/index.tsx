"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import type { Holding, HoldingsTotals } from "@/types/portfolio";
import { type AllocationMode, type HoldingSortKey, type SortDir } from "../lib";
import { AllocationLayer } from "./allocation-layer";
import { PositionsTable } from "./positions-table";

/**
 * Portfolio HOLDINGS & ALLOCATION — the workhorse positions ledger with the allocation
 * layer absorbed on top. Tracker-first: money and weight lead, health is ONE column +
 * a band dot + an opt-in expand. Everything READS the holdings snapshot proven on the
 * Overview — no client-side score or weight recompute. The allocation Sector/Stock/
 * Market-cap toggle IS the table's group-by cut, so the two views read as one.
 * Themed to the live stock-screener surface (SectionEyebrow rhythm · Panel cards).
 */
export function HoldingsTab({ holdings, totals }: { holdings: Holding[]; totals: HoldingsTotals }) {
  // the SHARED cut — drives both the donut and the table's group-by (§1 ↔ §2)
  const [cut, setCut] = useState<AllocationMode>("sector");
  const [grouped, setGrouped] = useState(false);
  const [sort, setSort] = useState<{ key: HoldingSortKey; dir: SortDir }>({ key: "weight", dir: "desc" });

  const onSort = (key: HoldingSortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "symbol" ? "asc" : "desc" },
    );

  return (
    <div className="flex flex-col pb-4">
      {/* §1 · Allocation layer — the absorbed cut */}
      <SectionEyebrow label="How your capital is spread" pill="by value" icon={Icons.sector} accent="var(--p-own)" />
      <Reveal>
        <AllocationLayer holdings={holdings} cut={cut} onCutChange={setCut} />
      </Reveal>

      {/* §2 · Positions table — the heart */}
      <SectionEyebrow
        label="Your positions"
        pill={`${totals.positions} holding${totals.positions === 1 ? "" : "s"}`}
        icon={Icons.portfolio}
        accent="var(--c-pristine)"
      />
      <Reveal>
        <PositionsTable
          holdings={holdings}
          cut={cut}
          grouped={grouped}
          onGroupedChange={setGrouped}
          sort={sort}
          onSort={onSort}
        />
      </Reveal>
    </div>
  );
}
