"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { StaggerGroup, StaggerItem } from "@/components/ui/reveal";
import type { FindingsSection as TFindings, RedFlagView, PatternView } from "@/types/health";
import { SectionEyebrow, Panel, humanizeKey } from "./shared";

type Severity = "crit" | "high" | "ctx";

const SEV_STYLE: Record<Severity, { bar: string; chip: string; icon: string }> = {
  crit: { bar: "bg-crit", chip: "text-fragile bg-crit/12 border-crit/40", icon: "text-fragile bg-crit/12" },
  high: { bar: "bg-high", chip: "text-high bg-high/10 border-high/40", icon: "text-high bg-high/10" },
  ctx: { bar: "bg-ctx", chip: "text-ink2 bg-surface-2 border-line2", icon: "text-ink2 bg-surface-2" },
};

function patternSeverity(p: PatternView): Severity {
  const s = (p.severity ?? "").toLowerCase();
  if (/(crit|red|severe|high)/.test(s)) return "crit";
  if (/(amber|medium|watch|moderate)/.test(s)) return "high";
  return "ctx";
}

/** Render whatever the backend stored as evidence, honestly — never fabricated. */
function EvidencePips({ value }: { value: unknown }) {
  if (value == null || typeof value !== "object") return null;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v != null && typeof v !== "object")
    .slice(0, 4);
  if (!entries.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span key={k} className="num rounded-md bg-surface-3 px-2 py-0.5 text-[10px] text-ink2">
          {humanizeKey(k)}: <span className="text-ink">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

function FindingCard({
  sev,
  Icon,
  title,
  tag,
  evidence,
  notMeans,
  cta,
  href,
}: {
  sev: Severity;
  Icon: typeof Icons.warning;
  title: string;
  tag: string;
  evidence?: unknown;
  notMeans: string;
  cta: string;
  /** when set, the CTA becomes a live Link (e.g. a pledge flag → Ownership tool). */
  href?: string;
}) {
  const st = SEV_STYLE[sev];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-1 p-5">
      <span className={cn("absolute inset-y-0 left-0 w-[3px]", st.bar)} />
      <div className="flex items-center gap-3">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", st.icon)}>
          <Icon weight="fill" className="h-4 w-4" />
        </span>
        <span className="text-[14px] font-semibold text-ink">{title}</span>
        <span className={cn("ml-auto shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", st.chip)}>
          {tag}
        </span>
      </div>
      <EvidencePips value={evidence} />
      <p className="mt-3 border-l-2 border-line2 pl-3 text-[11.5px] italic text-ink3">{notMeans}</p>
      {href ? (
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
        >
          {cta}
          <Icons.arrowUpRight className="h-3 w-3" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-3 inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink3 opacity-70"
        >
          {cta}
          <Icons.arrowUpRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function FindingsSection({ findings, symbol }: { findings: TFindings; symbol?: string }) {
  const { redFlags, patterns } = findings;
  const total = redFlags.length + patterns.length;

  // calm panel — page length is a signal; an empty read is a designed state.
  if (total === 0) {
    return (
      <section>
        <SectionEyebrow label="Notable findings" pill="all clear" />
        <Panel className="flex flex-col items-center gap-2 py-10 text-center">
          <Icons.success weight="duotone" className="h-9 w-9 text-healthy" />
          <p className="text-[13px] font-medium text-ink">Nothing notable is firing</p>
          <p className="max-w-sm text-[12px] text-ink3">
            No red flags, no flagged patterns this period. A clean read — the score stands on its
            pillars without caveats.
          </p>
        </Panel>
      </section>
    );
  }

  return (
    <section>
      <SectionEyebrow label="Notable findings" pill={`${total} firing`} />
      <StaggerGroup className="grid gap-3.5 lg:grid-cols-2">
        {redFlags.map((f: RedFlagView, i) => {
          // Pledge / ownership red flags funnel to the Ownership tool (live), carrying
          // the symbol. Other findings stay dead (no flags board yet).
          const ownershipFlag = /pledge|r1|ownership|promoter/i.test(f.flagKey);
          const href = ownershipFlag && symbol ? `/research/ownership?symbol=${symbol}` : undefined;
          return (
            <StaggerItem key={`rf-${i}`}>
              <FindingCard
                sev="crit"
                Icon={Icons.warning}
                title={humanizeKey(f.flagKey)}
                tag={f.tier === "review" ? "Review" : f.severity ?? "Red flag"}
                evidence={f.triggeringValues}
                notMeans="Review your thesis, not a sell — an early risk read, not a price call."
                cta={href ? "View ownership" : "See on flags board"}
                href={href}
              />
            </StaggerItem>
          );
        })}
        {patterns.map((p: PatternView, i) => {
          const sev = patternSeverity(p);
          return (
            <StaggerItem key={`pt-${i}`}>
              <FindingCard
                sev={sev}
                Icon={Icons.graph}
                title={`Pattern · ${humanizeKey(p.patternKey)}`}
                tag={p.severity ?? (p.direction ?? "Context")}
                evidence={p.evidence ?? p.metricRefs}
                notMeans="A condition to look at — not a trade signal."
                cta="See on flags board"
              />
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </section>
  );
}
