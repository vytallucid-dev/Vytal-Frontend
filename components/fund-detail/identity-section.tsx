"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/fund-format";
import type { FundAnalytics, FundFamily, FundFamilyMember, PlanTier, PlanOptionLabel } from "@/types/fund";

const TIER_LABEL: Record<PlanTier, string> = { direct: "Direct", regular: "Regular", none: "" };
const OPTION_LABEL: Record<PlanOptionLabel, string> = { growth: "Growth", idcw: "IDCW", bonus: "Bonus" };

const TIER_ORDER: Record<PlanTier, number> = { direct: 0, regular: 1, none: 2 };
const OPTION_ORDER: Record<PlanOptionLabel, number> = { growth: 0, bonus: 1, idcw: 2 };

export function sortMembers(members: FundFamilyMember[]): FundFamilyMember[] {
  return [...members].sort(
    (a, b) =>
      TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || OPTION_ORDER[a.optionLabel] - OPTION_ORDER[b.optionLabel],
  );
}

/** The declined page's "way out" (spec §6.3): route to the member the SERVER chose to represent
 *  this family (`representativeSchemeCode`, resolved by the one rule in resolveRepresentative()) —
 *  never a re-derived client-side fallback chain. On a declined page the current member is by
 *  definition unmeasurable, so the representative is the family's best measurable plan and the right
 *  place to send the user. Returns null when the representative IS the current member or is itself
 *  unmeasurable (a genuinely twinless family, 708 of them) — no way out, and the page says so. */
export function representativeWayOut(
  family: FundFamily,
  currentSchemeCode: string,
): FundFamilyMember | null {
  const rep = family.members.find((m) => m.schemeCode === family.representativeSchemeCode);
  if (!rep || !rep.measurable || rep.schemeCode === currentSchemeCode) return null;
  return rep;
}

function planHref(schemeCode: string) {
  return `/research/funds/${schemeCode}`;
}

export function PlanSelector({
  members,
  activeSchemeCode,
}: {
  members: FundFamilyMember[];
  activeSchemeCode: string;
}) {
  if (members.length <= 1) return null;
  const sorted = sortMembers(members);
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {sorted.map((m) => {
        const active = m.schemeCode === activeSchemeCode;
        return (
          <Link
            key={m.schemeCode}
            href={planHref(m.schemeCode)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs transition-colors",
              active
                ? "border-primary/40 bg-primary/[0.08] text-primary"
                : "border-line2 text-ink2 hover:border-line3 hover:text-ink",
              !m.measurable && !active && "border-dashed opacity-70",
            )}
            title={!m.measurable ? "This plan's own series can't be charted — tap to see why" : undefined}
          >
            {m.tier !== "none" && <span className="font-medium">{TIER_LABEL[m.tier]}</span>}
            <span className={cn("block text-[10px]", active ? "text-primary/80" : "text-ink3")}>
              {OPTION_LABEL[m.optionLabel]}
              {!m.measurable && " · —"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function IdentitySection({
  schemeCode,
  analytics,
  family,
}: {
  schemeCode: string;
  analytics: FundAnalytics;
  family: FundFamily | null;
}) {
  const scheme = analytics.scheme;
  const currentMember = family?.members.find((m) => m.schemeCode === schemeCode) ?? null;

  const name = family?.family.canonicalName ?? scheme?.name ?? `Scheme ${schemeCode}`;
  const house = family?.family.fundHouse ?? scheme?.fundHouse;
  const categoryLeaf = currentMember?.instrument?.categoryLeaf ?? analytics.rank?.category ?? null;
  const isActive = scheme?.isActive ?? true;
  const nav = scheme?.currentNav !== null && scheme?.currentNav !== undefined ? Number(scheme.currentNav) : null;
  const navDate = fmtDate(scheme?.navDate ?? null);
  const isEtf = scheme?.assetClass === "etf";

  return (
    <div>
      {house && <div className="mb-1.5 text-[12.5px] tracking-wide text-ink2">{house}</div>}
      <h1 className="hero-name text-2xl text-ink sm:text-[28px]">{name}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {categoryLeaf && (
          <span className="rounded-full border border-line2 px-2.5 py-1 text-[11px] text-ink2">
            {categoryLeaf}
          </span>
        )}
        {isEtf && (
          <span className="rounded-full border border-line2 px-2.5 py-1 text-[11px] text-ink2">ETF</span>
        )}
        {!isActive && (
          <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[11px] text-warning">
            Dormant — this fund stopped reporting
          </span>
        )}
        {family?.family.isSingleton === false && (
          <span className="rounded-full border border-line2 px-2.5 py-1 text-[11px] text-ink3">
            {family.family.schemeCount} plan{family.family.schemeCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2.5">
        <span className="num text-lg text-ink">{nav !== null ? `₹${nav.toFixed(2)}` : "—"}</span>
        <span className="text-[11.5px] text-ink3">
          {isEtf ? "NAV" : "NAV"} · {navDate ?? "date unavailable"}
        </span>
      </div>

      {family && <PlanSelector members={family.members} activeSchemeCode={schemeCode} />}
    </div>
  );
}
