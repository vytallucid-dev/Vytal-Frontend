"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 * THE TRAJECTORY VIEW MODE — pattern, or full trajectory. Two primary modes, one visible switch.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ── ★ WHAT THIS RESTORES ─────────────────────────────────────────────────────────────────────────
 * This tool began as a PILLAR EXPLORER: pick any combination of the four pillars plus the composite
 * and watch them move. Pattern rendering then REPLACED that view instead of joining it — the chart
 * became whatever the selected reading's `pillarPair` named, and there was no way back to the general
 * one. The general view is the tool's primary use, so it is a mode, not a fallback.
 *
 *   pattern — a selected reading, its pillar focused, its clauses rendered. The P9 focus lock lives
 *             HERE and only here: the legend cannot switch off the pattern's own subject, because a
 *             chart out of step with the card beneath it is the defect `focus` exists to prevent.
 *   full    — every pillar and the composite, individually togglable. No pattern framing, no lock.
 *
 * ── ★ WHY THE MODE IS IN THE URL ─────────────────────────────────────────────────────────────────
 * `?view=full` sits beside the existing `?pattern=`, so a reader who found something in the pillar
 * history can send exactly that view to someone else. It also survives a refresh, which a useState
 * mode would not — and a mode that silently resets is a mode people stop trusting.
 *
 * ⚠ THE ABSENT PARAM IS NOT "pattern". It means "no explicit choice", which is what lets the DEFAULT
 * (resolved in trajectory-tool.tsx from whether anything is firing) do its job. Writing "pattern" into
 * the URL on load would freeze the default at the moment of first render, so a stock that later stops
 * firing would keep opening into an empty pattern mode.
 */

import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

export type TrajectoryMode = "pattern" | "full";

export function TrajectoryModeSwitch({
  mode,
  onChange,
  /** Whether there is anything to select. False ⇒ pattern mode has no reading to render, so its
   *  button is offered DISABLED WITH A REASON rather than hidden — see the note below. */
  hasReadings,
}: {
  mode: TrajectoryMode;
  onChange: (m: TrajectoryMode) => void;
  hasReadings: boolean;
}) {
  const btn = (on: boolean, disabled?: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-[11px] transition-colors",
      disabled
        ? "cursor-not-allowed border-line2 bg-surface-2 text-ink3/40"
        : on
          ? "border-line3 bg-surface-3 font-medium text-ink"
          : "border-line2 bg-surface-2 text-ink2 hover:border-line3 hover:text-ink",
    );

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Trajectory view mode">
      {/* ⚠ DISABLED, NOT HIDDEN. A stock with no reading has nothing for pattern mode to draw, but
          hiding the button would leave the reader unable to tell whether this tool has a pattern mode
          at all — and the same tool on the next stock would sprout a control that was never there.
          The disabled state says "this mode exists and this stock has nothing for it", which is the
          honest reading and the one a `title` can explain. */}
      <button
        disabled={!hasReadings}
        title={hasReadings ? "The selected reading, its pillar focused" : "No trajectory reading on this stock"}
        onClick={() => hasReadings && onChange("pattern")}
        aria-pressed={mode === "pattern"}
        className={btn(mode === "pattern", !hasReadings)}
      >
        <Icons.target className="size-3" />
        Pattern
      </button>
      <button
        title="Every pillar and the composite, over time"
        onClick={() => onChange("full")}
        aria-pressed={mode === "full"}
        className={btn(mode === "full")}
      >
        <Icons.chartLine className="size-3" />
        Full trajectory
      </button>
    </div>
  );
}
