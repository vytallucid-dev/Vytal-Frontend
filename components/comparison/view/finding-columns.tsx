"use client";

/**
 * FINDINGS — the character layer of the comparison, rendered as TWO INDEPENDENT lists, one
 * per entity, side by side. They are NEVER row-paired across entities: a pattern in A's
 * column that is absent in B's is simply absent — no "A has this, B doesn't" framing, no
 * implied deficiency, no fabrication. Within each column the entity's findings are grouped
 * (red flags → patterns & signals) for readability, but the grouping is PER-COLUMN only.
 *
 * The findings engine already prunes by family (a bank cannot fire the 6 non-financial-only
 * patterns), so cross-family columns are naturally honest — there is no extra family gating
 * here; each entity just shows the set it fired.
 *
 * Verdict copy + accent colouring are reused from the stock-detail §5 findings layer
 * (prepareStockFindings / accentVars) so the two surfaces never drift. The card here is a
 * compact form suited to the narrow comparison columns.
 */

import { prepareStockFindings, accentVars, type PreparedFinding } from "@/lib/findings";
import type { Comparee } from "@/types/compare";
import { A_HUE, B_HUE, HonestEmpty } from "./shared";

// Tag copy — mirrors the stock-detail findings card (display-only; kept small + in sync).
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

/** A compact finding card — left accent bar, name, severity tag, and the File-1 verdict
 *  sentence bound to the real evidence. No winner colour, no cross-entity reference. */
function CompactFinding({ f }: { f: PreparedFinding }) {
  const a = accentVars(f.accent);
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface-1 p-3.5">
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

function EntityFindings({ entity, hue }: { entity: Comparee; hue: string }) {
  // pondHot is THIS entity's own PG signal — masks only its price-linked cards, exactly as
  // the stock-detail Health tab does. It is not a cross-entity comparison.
  const prepared = prepareStockFindings(entity.findings ?? { redFlags: [], patterns: [] }, {
    pondHot: entity.pondMask?.isHot ?? false,
  });

  const flags = prepared.ordered.filter((f) => f.kind === "red_flag");
  const patterns = prepared.ordered.filter((f) => f.kind !== "red_flag");

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: hue }} />
        <span className="num text-sm font-semibold text-ink">{entity.symbol}</span>
        {prepared.count > 0 && (
          <span className="text-xs text-ink3">
            · {prepared.count} {prepared.count === 1 ? "finding" : "findings"}
          </span>
        )}
      </div>

      {prepared.density === "empty" ? (
        <HonestEmpty>No patterns fired this period.</HonestEmpty>
      ) : (
        <div className="space-y-4">
          {flags.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink3">Red flags</p>
              {flags.map((f, i) => (
                <CompactFinding key={`${f.key}-${i}`} f={f} />
              ))}
            </div>
          )}
          {patterns.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink3">
                Patterns &amp; signals
              </p>
              {patterns.map((f, i) => (
                <CompactFinding key={`${f.key}-${i}`} f={f} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Two independent finding columns — A then B. Spatially side by side, NEVER row-paired. */
export function FindingColumns({ a, b }: { a: Comparee; b: Comparee }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">
      <EntityFindings entity={a} hue={A_HUE} />
      <EntityFindings entity={b} hue={B_HUE} />
    </div>
  );
}
