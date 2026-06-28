"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import type { Icon } from "@/lib/icons";
import { StaggerGroup, StaggerItem } from "@/components/ui/reveal";
import type { FindingsSection as TFindings } from "@/types/health";
import {
  prepareStockFindings,
  accentVars,
  type PreparedFinding,
  type Family,
  type Accent,
  DENSITY_EMPTY_COPY,
  DENSITY_QUIET_HEADER,
} from "@/lib/findings";
import { SectionEyebrow, Panel, humanizeKey } from "./shared";

// Family → icon (one glyph per File-1 §5 family; the accent carries severity).
const FAMILY_ICON: Record<Family, Icon> = {
  A: Icons.warning,
  B: Icons.trendDown,
  C: Icons.compare,
  D: Icons.trendUp,
  E: Icons.pulse,
  F: Icons.chartBar,
  G: Icons.target,
  H: Icons.building,
  I: Icons.arrowUpRight,
};

const ACCENT_TAG: Record<Accent, string> = { crit: "Concern", high: "High", rec: "Constructive", ctx: "Context" };

function tagOf(f: PreparedFinding): string {
  if (f.displayState === "dampened") return "Sector-wide";
  if (f.displayState === "pending_data_integration") return "Pending feed";
  if (f.kind === "red_flag") return "Watch With Care";
  if (f.family === "D") return "Recovering";
  return ACCENT_TAG[f.accent];
}

// Funnel target (File 1 §5 funnels). Ownership-family cards → the ownership tool.
function funnelHref(f: PreparedFinding, symbol?: string): string | undefined {
  const ownership = f.key.startsWith("ownership_") || f.key.startsWith("divergence_C2");
  return ownership && symbol ? `/research/ownership?symbol=${symbol}` : undefined;
}

// ── evidence pips (secondary detail under the verdict sentence) ────────────────
const PIP_SKIP = new Set([
  "verdict", "verbatim", "name", "rule", "pattern", "card", "calibration", "sectorWide",
  "provisional", "series", "trajectory", "opmSeries", "ttmSeries", "deHistory", "gapTrajectory",
  "profile", "pillarDeltas", "compositeHeld", "breaches", "firedRule", "guardClean",
  "spansQuarterGap", "dilutionVerdict", "suppressedByBD", "firstBreach", "subtype", "variant",
  "leg", "isPillar", "floorLed", "leaderChanged", "type",
]);

function EvidencePips({ value }: { value: unknown }) {
  if (value == null || typeof value !== "object") return null;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([k, v]) => !PIP_SKIP.has(k) && v != null && typeof v !== "object")
    .slice(0, 5);
  if (!entries.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span key={k} className="num rounded-md bg-surface-3 px-2 py-0.5 text-[10px] text-ink2">
          {humanizeKey(k)}: <span className="text-ink">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

function FindingCard({ f, symbol }: { f: PreparedFinding; symbol?: string }) {
  const a = accentVars(f.accent);
  const Glyph = FAMILY_ICON[f.family];
  const tag = tagOf(f);
  const href = funnelHref(f, symbol);
  const pending = f.displayState === "pending_data_integration";
  const dampened = f.displayState === "dampened";
  const halved = dampened && f.magnitude != null ? ` (impact now ${f.magnitude > 0 ? "+" : ""}${f.magnitude})` : "";
  const sectorWideNote = dampened
    ? (typeof f.evidence?.sectorWide === "string" ? (f.evidence.sectorWide as string) : "sector-wide condition — magnitude halved") + halved
    : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-surface-1 p-5",
        pending && "opacity-70",
      )}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: a.color }} />
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: a.bg, color: a.color }}>
          <Glyph weight="fill" className="h-4 w-4" />
        </span>
        <span className="text-[14px] font-semibold text-ink">{f.name}</span>
        {f.divergenceCount && f.divergenceCount > 2 ? (
          <span className="num shrink-0 text-[10px] text-ink3">+{f.divergenceCount - 2} more</span>
        ) : null}
        <span
          className="ml-auto shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: a.color, background: a.bg, borderColor: a.bd }}
        >
          {tag}
        </span>
      </div>

      {/* Verdict sentence leads — File-1 copy bound to the real evidence numbers */}
      <p className="mt-3 text-[13px] leading-relaxed text-ink2">{f.verdict}</p>

      {/* Dampened: the sector-wide condition note (halved magnitude) */}
      {sectorWideNote && (
        <p className="num mt-2 rounded-md border px-2 py-1 text-[11px]" style={{ color: a.color, background: a.bg, borderColor: a.bd }}>
          {sectorWideNote}
        </p>
      )}

      {/* Pending feed: capability visible, no false coverage */}
      {pending && (
        <p className="mt-2 text-[11px] italic text-ink3">Active — pending data integration (feed not yet confirmed live).</p>
      )}

      {/* Evidence pips — the raw breaching stats, secondary to the sentence */}
      {f.subTypes && f.subTypes.length ? (
        f.subTypes.map((st) => (
          <div key={st.key} className="mt-2 border-l border-line2 pl-2.5">
            <span className="text-[11px] font-medium text-ink2">{st.name}</span>
            <EvidencePips value={st.evidence} />
          </div>
        ))
      ) : (
        <EvidencePips value={f.evidence} />
      )}

      {/* Hot-pond mask caveat — only on price-linked cards (B, C1, D) */}
      {f.maskNote && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-ink3">
          <Icons.fire weight="fill" className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "var(--high)" }} />
          <span>{f.maskNote}</span>
        </p>
      )}

      {/* Documented limitations (current-calibration bands, shallow trajectory window) */}
      {f.caveats.map((c) => (
        <p key={c} className="mt-1.5 text-[11px] italic text-ink3">{c}</p>
      ))}

      {/* The interpretive boundary — what this does NOT mean */}
      <p className="mt-3 border-l-2 border-line2 pl-3 text-[11.5px] italic text-ink3">{f.doesntMean}</p>

      {href ? (
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
        >
          View ownership
          <Icons.arrowUpRight className="h-3 w-3" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-3 inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink3 opacity-70"
        >
          See on flags board
          <Icons.arrowUpRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function FindingsSection({
  findings,
  symbol,
  pondHot = false,
}: {
  findings: TFindings;
  symbol?: string;
  pondHot?: boolean;
}) {
  const { ordered, density, count } = prepareStockFindings(findings, { pondHot });

  // Empty — the calm panel (File 1 §5 density: nothing fired).
  if (density === "empty") {
    return (
      <section>
        <SectionEyebrow label="Notable findings" icon={Icons.pulse} accent="var(--p-mkt)" pill="all clear" />
        <Panel className="flex flex-col items-center gap-2 py-10 text-center">
          <Icons.success weight="duotone" className="h-9 w-9 text-healthy" />
          <p className="max-w-md text-[13px] leading-relaxed text-ink2">{DENSITY_EMPTY_COPY}</p>
        </Panel>
      </section>
    );
  }

  // Loud (A–E fired) shows the count; quiet (only F–I) softens the header.
  const pill = density === "loud" ? `${count} finding${count === 1 ? "" : "s"}` : "context only";

  return (
    <section>
      <SectionEyebrow label="Notable findings" icon={Icons.pulse} accent="var(--p-mkt)" pill={pill} />
      {density === "quiet" && (
        <p className="-mt-2 mb-3 text-[12px] italic text-ink3">{DENSITY_QUIET_HEADER}.</p>
      )}
      <StaggerGroup className="grid gap-3.5 lg:grid-cols-2">
        {ordered.map((f, i) => (
          <StaggerItem key={`${f.key}-${i}`}>
            <FindingCard f={f} symbol={symbol} />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
