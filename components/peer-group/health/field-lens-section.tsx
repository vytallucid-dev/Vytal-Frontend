"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import {
  SectionEyebrow,
  Panel,
  lensAccentVars,
} from "@/components/stock-detail/health/shared";
import { getMetricLabel } from "@/lib/health/metric-labels";
import type { PeerGroupFieldLensVerdict } from "@/types/peer-group";

// ─────────────────────────────────────────────────────────────────────────────────
// THE Field-Lens section — the PG page's headline read on the FIELD AS A WHOLE: where
// the pond clusters against each metric's own bands (elite / average / weak), distinct
// from the member-wise pathology census ("which members have problem X"). Reads ONLY
// aggregate.fieldLensVerdicts (the corrected band-cluster verdicts).
//
// Form: a proper section — three titled sub-sections (Strongest / Average / Weakest),
// each a block listing the metric names (first few inline, "show all" expands the rest).
// NEUTRAL colouring — Strongest reuses the `ctx` (neutral) accent, Weakest the `high`
// (amber) accent, Average muted; NEVER green-good/red-bad. `verdict: null` (thin, <5
// members) metrics collect into a muted footnote — listed, not hidden. Descriptive only.
// The per-metric distribution + field-read lives in the explorer below (drill one metric).
// ─────────────────────────────────────────────────────────────────────────────────

const STRONG = lensAccentVars("ctx"); // elite → neutral CONTEXT (never green)
const WEAK = lensAccentVars("high"); // weak → amber CONTEXT (never red)

const INLINE_LIMIT = 4; // names shown before the "show all" expand

/** One metric name + a subtle magnitude intensity dot (decisive fields read stronger). */
function MetricName({ v, color }: { v: PeerGroupFieldLensVerdict; color?: string }) {
  const label = getMetricLabel(v.metricKey).label;
  const dotOpacity = 0.3 + 0.7 * Math.min(1, Math.max(0, v.magnitude ?? 0));
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12.5px] text-ink2"
      title={`${label} (${v.metricKey})`}
    >
      {color && (
        <span className="size-1.5 shrink-0 rounded-full" style={{ background: color, opacity: dotOpacity }} aria-hidden />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

/** One titled sub-section block: header + count, names inline, "show all" for the rest. */
function Bucket({
  title,
  rows,
  color,
  bg,
  bd,
}: {
  title: string;
  rows: PeerGroupFieldLensVerdict[];
  color?: string;
  bg?: string;
  bd?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? rows : rows.slice(0, INLINE_LIMIT);
  const hidden = rows.length - shown.length;

  return (
    <div
      className="flex flex-1 flex-col gap-2.5 rounded-xl border bg-surface-1 p-4"
      style={bd ? { borderColor: bd } : { borderColor: "var(--line2)" }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: color ?? "var(--ink2)" }}
        >
          {title}
        </span>
        <span className="num text-[11px] text-ink3">{rows.length}</span>
      </div>

      {rows.length === 0 ? (
        <span className="text-[12px] italic text-ink3">None this period.</span>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            {shown.map((v) => (
              <MetricName key={v.metricKey} v={v} color={color} />
            ))}
          </div>
          {(hidden > 0 || showAll) && rows.length > INLINE_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              className="mt-0.5 inline-flex w-fit items-center gap-1 text-[11px] font-medium text-ink3 transition-colors hover:text-ink2"
            >
              {showAll ? "Show less" : `Show all ${rows.length}`}
              <Icons.caretDown className={"size-3 transition-transform " + (showAll ? "rotate-180" : "")} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function FieldLensSection({ verdicts }: { verdicts: PeerGroupFieldLensVerdict[] }) {
  if (!verdicts || verdicts.length === 0) return null;

  // Bucket by the corrected verdict; strongest/weakest ordered by magnitude (decisive first).
  const strong = verdicts
    .filter((v) => v.verdict === "PG_STRONG")
    .sort((a, b) => (b.magnitude ?? 0) - (a.magnitude ?? 0));
  const weak = verdicts
    .filter((v) => v.verdict === "PG_WEAK")
    .sort((a, b) => (b.magnitude ?? 0) - (a.magnitude ?? 0));
  const mixed = verdicts.filter((v) => v.verdict === "mixed");
  const notAssessable = verdicts.filter((v) => v.verdict === null);

  // One-line headline summary from the counts.
  const parts: string[] = [];
  if (strong.length) parts.push(`elite on ${strong.length}`);
  if (weak.length) parts.push(`weak on ${weak.length}`);
  if (mixed.length) parts.push(`average on ${mixed.length}`);
  const headline =
    parts.length > 0
      ? parts.join(", ").replace(/^./, (c) => c.toUpperCase()) + "."
      : "No assessable metrics in this field yet.";

  return (
    <section>
      <SectionEyebrow
        label="What kind of field is this"
        icon={Icons.scales}
        accent="var(--p-found)"
        pill="the field's character"
      />
      <Reveal>
        <Panel>
          <p className="mb-3 text-[12px] leading-relaxed text-ink2">
            Where the field clusters against each metric&apos;s own bands — strong where most members land
            in the top bands, weak where most land low, average otherwise. A read on the pond, not on any
            one name.
          </p>

          {/* one-line headline summary */}
          <p className="mb-4 text-[13px] font-medium text-ink">{headline}</p>

          {/* three titled sub-sections — row on wide, stacking on narrow */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Bucket title="Strongest" rows={strong} color={STRONG.color} bg={STRONG.bg} bd={STRONG.bd} />
            <Bucket title="Average" rows={mixed} />
            <Bucket title="Weakest" rows={weak} color={WEAK.color} bg={WEAK.bg} bd={WEAK.bd} />
          </div>

          {/* thin metrics — muted footnote, listed not hidden */}
          {notAssessable.length > 0 && (
            <p className="mt-4 text-[11px] text-ink3">
              {notAssessable.length}{" "}
              {notAssessable.length === 1 ? "metric" : "metrics"} not assessable (fewer than 5 members
              with data):{" "}
              <span className="num">
                {notAssessable.map((v) => getMetricLabel(v.metricKey).label).join(", ")}
              </span>
              .
            </p>
          )}

          <p className="mt-4 border-l-2 border-line2 pl-3 text-[11px] italic leading-relaxed text-ink3">
            A description of the field, not a recommendation; no member is crowned. An
            &ldquo;elite&rdquo; or &ldquo;weak&rdquo; field is about where the bands cluster, not a pass
            or fail on any stock. Drill any metric in the explorer below.
          </p>
        </Panel>
      </Reveal>
    </section>
  );
}
