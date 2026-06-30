"use client";

/**
 * Result Viewer ↔ scoring connection. Surfaces, for the VIEWED result period:
 *  • the health composite + band (period-correct, from the backend's trajectory lookup),
 *  • a composite-shift fact ("moved ±X from {prior}") — NEUTRAL, never "this result caused X"
 *    and never good/bad coloured (a move is a fact, not a verdict),
 *  • the fired findings (red flags + patterns) via the shared prepareStockFindings path — the
 *    SAME renderer the comparison's finding-columns uses, so the surfaces never drift.
 *
 * Alignment honesty: findings are the engine's LATEST snapshot. They're labelled as tied to
 * THIS result only when health.latestPeriodKey === the viewed period; for an older quarter they
 * read as "latest health findings", not "this result's". The whole area honest-empties when the
 * stock isn't scored.
 */

import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { prepareStockFindings, accentVars, type PreparedFinding } from "@/lib/findings";
import { BAND_META } from "@/components/stock-detail/health/shared";
import type { ResultHealthBlock } from "@/types/result-detail";
import { Panel, HonestEmpty, shortPeriod } from "./shared";

// Severity tag copy — mirrors the comparison's finding-columns (display-only, kept in sync).
const ACCENT_TAG: Record<PreparedFinding["accent"], string> = {
  crit: "Concern",
  high: "High",
  rec: "Constructive",
  ctx: "Context",
};
function tagOf(f: PreparedFinding): string {
  if (f.displayState === "dampened") return "Sector-wide";
  if (f.displayState === "pending_data_integration") return "Pending feed";
  if (f.kind === "red_flag") return "Watch With Care";
  if (f.family === "D") return "Recovering";
  return ACCENT_TAG[f.accent];
}

function CompactFinding({ f }: { f: PreparedFinding }) {
  const a = accentVars(f.accent);
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface-2 p-3.5">
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: a.color }} />
      <div className="flex items-start gap-2">
        <span className="text-[13px] font-semibold leading-snug text-ink">{f.name}</span>
        <span
          className="ml-auto mt-0.5 shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: a.color, background: a.bg, borderColor: a.bd }}
        >
          {tagOf(f)}
        </span>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink2">{f.verdict}</p>
    </div>
  );
}

export function HealthContext({
  health,
  viewedPeriodKey,
}: {
  health: ResultHealthBlock | null;
  viewedPeriodKey: string;
}) {
  // Whole-area honest-empty when the stock has no in-force snapshot.
  if (!health || !health.scored) {
    return (
      <HonestEmpty>
        This stock isn&apos;t scored yet — no health composite or findings to show for this result.
      </HonestEmpty>
    );
  }

  const tiedToResult = health.latestPeriodKey === viewedPeriodKey;
  const prepared = prepareStockFindings(health.findings ?? { redFlags: [], patterns: [] });
  const flags = prepared.ordered.filter((f) => f.kind === "red_flag");
  const patterns = prepared.ordered.filter((f) => f.kind !== "red_flag");

  const band = health.periodBand ? BAND_META[health.periodBand] : null;
  const shift = health.compositeShift;

  return (
    <div className="space-y-4">
      {/* Composite in context + the period-to-period move (neutral — a fact, not a verdict). */}
      <Panel className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <div>
          <div className="text-[11px] text-ink3">Health composite · {shortPeriod(viewedPeriodKey)}</div>
          {health.periodComposite !== null ? (
            <div className="mt-1 flex items-baseline gap-2.5">
              <span className="num text-[26px] font-semibold text-ink">
                {health.periodComposite.toFixed(1)}
              </span>
              {band && (
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                    band.text,
                    band.bg,
                    band.border,
                  )}
                >
                  {band.label}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-1 text-[13px] text-ink3">Not scored for this period</div>
          )}
        </div>

        <div>
          <div className="text-[11px] text-ink3">Composite move</div>
          {shift ? (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-[18px] font-semibold text-ink2">
                {shift.delta > 0 ? "+" : ""}
                {shift.delta.toFixed(1)}
              </span>
              <span className="text-[12px] text-ink3">from {shortPeriod(shift.priorPeriodKey)}</span>
            </div>
          ) : (
            <div className="mt-1 text-[13px] text-ink3">No prior period to compare</div>
          )}
        </div>
      </Panel>

      {/* Findings — alignment-honest header (this result vs latest snapshot). */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-ink3">
          <Icons.pulse className="h-3.5 w-3.5" />
          <span>
            {tiedToResult
              ? "Flags this result triggered"
              : `Latest health findings (as of ${shortPeriod(health.latestPeriodKey ?? "")})`}
          </span>
        </div>
        {prepared.density === "empty" ? (
          <HonestEmpty>
            No flags or patterns fired{tiedToResult ? " for this result." : " in the latest scoring."}
          </HonestEmpty>
        ) : (
          <div className="space-y-2.5">
            {flags.map((f, i) => (
              <CompactFinding key={`${f.key}-${i}`} f={f} />
            ))}
            {patterns.map((f, i) => (
              <CompactFinding key={`${f.key}-${i}`} f={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
