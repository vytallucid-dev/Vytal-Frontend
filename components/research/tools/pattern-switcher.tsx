"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 * THE SWITCHER — the side panel, made clickable. One entry per thing the page can be about.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ── ★ WHAT IT REPLACES ───────────────────────────────────────────────────────────────────────────
 * A static list that named the other readings and gave you no way to reach them. GLENMARK fires three
 * divergences about three different pillar pairs; the page charted one and printed the names of the
 * other two. Naming a reading and then withholding it is worse than not mentioning it — it tells the
 * reader something exists and that the tool will not show it.
 *
 * ── ★ NOT-COVERED ENTRIES ARE VISIBLY LIGHTER, AND ALWAYS LAST ───────────────────────────────────
 * No severity rail, no tier chip, no accent — there is no severity field on the type to read, which is
 * the point rather than an omission. They sit at the end in registry order, and NOTHING re-orders them
 * against each other: a 41-point NC1 and a 15-point NC1 are the same entry with different numbers in
 * it. The moment one reads louder than the other, the ranked generic-spread pattern both specs
 * excluded is back.
 */

import { cn } from "@/lib/utils";
import { accentOf, accentVars, familyOf } from "@/lib/findings/classify";
import { Panel } from "@/components/stock-detail/health/shared";
import { SUBJECT_META, readingsOf, stateLabelOf, titleOf, type Selectable } from "./selection";

export function PatternSwitcher({
  items,
  selectedId,
  onSelect,
}: {
  items: Selectable[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length < 2) return null; // one reading is not a choice — the page already shows it
  const patterns = items.filter((i) => i.kind === "pattern").length;
  const notes = items.length - patterns;
  return (
    <Panel className="px-4 py-4">
      <div className="kicker mb-3">
        {patterns > 0 && `${patterns} ${patterns === 1 ? "reading" : "readings"}`}
        {patterns > 0 && notes > 0 && " · "}
        {notes > 0 && `${notes} excluded`}
      </div>
      <div className="space-y-1.5" role="listbox" aria-label="Select a reading to study">
        {items.map((s) => (
          <SwitcherRow key={s.id} s={s} selected={s.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
    </Panel>
  );
}

function SwitcherRow({
  s,
  selected,
  onSelect,
}: {
  s: Selectable;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const note = s.kind === "not_covered";
  // ⚠ THE ACCENT IS READ ONLY FOR A PATTERN. A note has no severity field at all, so there is
  //   nothing here to colour it by — and a muted rail is the correct render, not a fallback.
  const a = s.kind === "pattern" ? accentVars(accentOf(s.pattern.severity, familyOf(s.pattern.patternKey))) : null;
  const state = stateLabelOf(s);
  const readings = readingsOf(s);

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(s.id)}
      className={cn(
        "relative w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-colors",
        selected ? "border-line3 bg-surface-2" : "border-line2 bg-surface-1 hover:border-line3 hover:bg-surface-2/50",
        note && !selected && "bg-surface-2/20",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-[3px]", !selected && "opacity-45")}
        style={{ background: note ? "var(--ink3)" : (a?.color ?? "var(--ink3)") }}
      />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-1.5">
        <span className={cn("text-[12.5px]", selected ? "font-semibold text-ink" : "font-medium text-ink2", note && "font-normal")}>
          {titleOf(s)}
        </span>
        {/* ⚠ NO ID BADGE FOR A NOTE. `s.id` (NC1, NC3, …) is the registry's internal identifier —
            it must never reach a rendered surface. `titleOf(s)` above already names the
            configuration; a note that has no tier chip simply renders none, same as a pattern
            with no tier. */}
        {!note && s.pattern.tier && (
          <span
            className="rounded px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide"
            style={{ color: a?.color, background: a?.bg }}
          >
            {s.pattern.tier}
          </span>
        )}
        {state && (
          <span
            className={cn(
              "ml-auto shrink-0 rounded border border-line2 px-1.5 py-px text-[9.5px] uppercase tracking-wide",
              note ? "text-ink3" : "text-ink2",
            )}
          >
            {state}
          </span>
        )}
      </div>
      {/* The subjects this reading is about — its pillar pair, with whatever values the wire states. */}
      <div className="num mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-1.5 text-[11px] text-ink3">
        {readings.map((r, i) => (
          <span key={r.subject} className="inline-flex items-center gap-1">
            {i > 0 && <span className="mr-1 text-ink3/60">vs</span>}
            <span className="h-[3px] w-2.5 rounded" style={{ background: SUBJECT_META[r.subject].cssVar }} />
            <span>{SUBJECT_META[r.subject].label}</span>
            {r.value !== null && <span className="text-ink2">{r.value}</span>}
          </span>
        ))}
      </div>
    </button>
  );
}
