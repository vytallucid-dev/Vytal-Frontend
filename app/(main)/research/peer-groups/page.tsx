"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePeerGroups } from "@/lib/api/hooks/use-peer-groups";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Card } from "@/components/ui/card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/reveal";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { healthBand, healthColorVar, healthTextClass, healthLabel, type HealthBand } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import type { PeerGroupListItem } from "@/types/peer-group";

const PAGE_WRAP = "mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 sm:gap-7";

// Our locked condition scale (best→worst) — used for the filter capsules and the
// score-fill colour. healthBand() returns these keys from a numeric score.
const BAND_ORDER: HealthBand[] = ["pristine", "healthy", "steady", "below", "fragile"];
const BAND_LABEL: Record<HealthBand, string> = {
  pristine: "Pristine",
  healthy: "Healthy",
  steady: "Steady",
  below: "Below par",
  fragile: "Fragile",
};
const BAND_COLOR: Record<HealthBand, string> = {
  pristine: "var(--c-pristine)",
  healthy: "var(--c-healthy)",
  steady: "var(--c-steady)",
  below: "var(--c-below)",
  fragile: "var(--c-fragile)",
};

type Filter = HealthBand | "all";

interface SectorGroup {
  key: string;
  displayName: string;
  items: PeerGroupListItem[];
}

/** Items arrive pre-ordered by sector then displayName, so grouping consecutive
 *  items is enough. Filtering first preserves contiguity. */
function groupBySector(items: PeerGroupListItem[]): SectorGroup[] {
  const groups: SectorGroup[] = [];
  for (const it of items) {
    const key = it.sector?.key ?? "_unlinked";
    const displayName = it.sector?.displayName ?? "Other";
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(it);
    else groups.push({ key, displayName, items: [it] });
  }
  return groups;
}

/** A slim score-fill meter that animates filling from 0 → score on first view.
 *  Far clearer than the old segmented strip: the bar IS the pond's score. */
function ScoreMeter({ score, color }: { score: number; color: string }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function FilterCapsule({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-line3 text-ink"
          : "border-line text-ink2 hover:border-line2 hover:text-ink",
      )}
      style={
        active && color
          ? { borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }
          : active
            ? { backgroundColor: "var(--surface2)" }
            : undefined
      }
    >
      {color && <span className="size-2 rounded-full" style={{ background: color }} />}
      <span>{label}</span>
      <span className="num text-ink3">{count}</span>
    </button>
  );
}

function PeerGroupCard({ pg }: { pg: PeerGroupListItem }) {
  const median = pg.medianComposite ?? 0;
  return (
    <Link href={`/research/peer-groups/${pg.id}`} className="block h-full">
      <Card className="lift h-full gap-3.5 p-5">
        {/* Lead — the pond's health, dominant. Rounded (no decimals) per spec. */}
        <div className="flex items-baseline gap-2.5">
          <span
            className="num text-4xl font-semibold leading-none"
            style={{ color: healthColorVar(median) }}
          >
            <AnimatedNumber value={median} decimals={0} />
          </span>
          <span className={cn("text-xs font-medium", healthTextClass(median))}>
            {healthLabel(median)}
          </span>
        </div>

        {/* Identity. */}
        <div className="flex flex-col gap-0.5">
          <h3 className="font-display text-base font-semibold leading-tight text-ink">
            {pg.displayName}
          </h3>
          <span className="text-[11px] text-ink3">{pg.memberCount} stocks</span>
        </div>

        {/* Score-fill meter + descriptor caption (secondary), pinned bottom. */}
        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          <ScoreMeter score={median} color={healthColorVar(median)} />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink3">{pg.descriptor}</span>
            {pg.redFlagMemberCount > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-ink3">
                <Icons.warning className="size-3" />
                {pg.redFlagMemberCount} flagged
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function PeerGroupsIndexPage() {
  const { data, isLoading, isError, error, refetch } = usePeerGroups();
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) {
    return (
      <div className={PAGE_WRAP}>
        <QuerySkeleton rows={6} rowHeight="h-32" className="mt-2" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className={PAGE_WRAP}>
        <QueryError
          message={(error as Error)?.message ?? "Failed to load peer groups"}
          onRetry={() => refetch()}
          className="mt-2"
        />
      </div>
    );
  }
  if (!data) return null;

  const scored = data.filter((d) => d.scored);
  const total = data.length;

  // Band counts across all scored ponds (drives the capsule filters).
  const counts = BAND_ORDER.reduce(
    (acc, b) => ({ ...acc, [b]: 0 }),
    {} as Record<HealthBand, number>,
  );
  for (const pg of scored) counts[healthBand(pg.medianComposite ?? 0)] += 1;

  const visible =
    filter === "all"
      ? scored
      : scored.filter((pg) => healthBand(pg.medianComposite ?? 0) === filter);
  const groups = groupBySector(visible);

  return (
    <div className={PAGE_WRAP}>
      {/* Centered hero — title + description (stock-screener style, our tokens). */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-3 pt-2 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Peer Groups</h1>
        <p className="text-sm text-ink2 sm:text-base">
          Every large-cap cohort, scored and ranked. Find the strongest ponds at a glance — then
          dive into one to compare its members.
        </p>
      </header>

      {/* Filter capsules — count per band, click to filter. */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <FilterCapsule
          label="All"
          count={scored.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {BAND_ORDER.filter((b) => counts[b] > 0).map((b) => (
          <FilterCapsule
            key={b}
            label={BAND_LABEL[b]}
            count={counts[b]}
            color={BAND_COLOR[b]}
            active={filter === b}
            onClick={() => setFilter(b)}
          />
        ))}
      </div>

      {/* Grouped cards. Keyed by `filter` too, so each section REMOUNTS on a filter
          change — otherwise a persisting section's StaggerGroup (whileInView + once)
          never re-fires and its re-keyed cards mount stuck at opacity-0, leaving a
          visible header over an empty grid. */}
      {groups.map((g, gi) => (
        <Reveal key={`${filter}:${g.key}`} delay={gi * 0.04}>
          <section className="flex flex-col gap-4">
            <div className="eyebrow-row">
              <span className="eyebrow">{g.displayName}</span>
            </div>
            <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((pg) => (
                <StaggerItem key={pg.id}>
                  <PeerGroupCard pg={pg} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>
        </Reveal>
      ))}

      <p className="eyebrow mt-2 text-center text-ink3">
        {scored.length} of {total} peer groups scored — more coverage rolling out.
      </p>
    </div>
  );
}
