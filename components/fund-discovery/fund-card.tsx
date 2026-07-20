"use client";

/**
 * Card surfaces for the fund/ETF discovery grid — the same visual language as the Results
 * feed (Panel · surface tiles · neutral Chips · directional colour only on the return sign).
 * Family-grain: every card routes to the SERVER-resolved representative plan, so the grid and
 * the detail page never disagree about whose numbers "the fund's return" means.
 */

import Link from "next/link";
import { Panel, tint } from "@/components/stock-detail/health/shared";
import { Chip, DASH, toneColor } from "@/components/stock-detail/overview/shared";
import { toNum, fmtFractionPct, fmtDate } from "@/lib/fund-format";
import type { FamilyRow, RepresentativePlan } from "@/types/funds-browse";

const TIER_LABEL: Record<string, string> = { direct: "Direct", regular: "Regular", none: "" };
const OPTION_LABEL: Record<string, string> = { growth: "Growth", idcw: "IDCW", bonus: "Bonus" };

function planLabel(p: RepresentativePlan): string {
  const tier = TIER_LABEL[p.tier];
  const option = OPTION_LABEL[p.optionLabel] ?? p.optionLabel;
  return tier ? `${tier} · ${option}` : option;
}

/** Short, honest phrase for a null-return cell — never a fabricated 0. The raw code rides
 *  along in `title` so an unmapped reason is surfaced, not swallowed. */
const SHORT_OMISSION: Record<string, string> = {
  insufficient_history: "too new",
  idcw_nav_not_total_return: "pays out",
  withheld_implausible: "withheld",
  out_of_range: "withheld",
  no_nav_in_window: "no data",
};
function shortOmission(code: string | undefined): string {
  if (!code) return DASH;
  return SHORT_OMISSION[code] ?? "n/a";
}

const fmtNav = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** A single return tile (1Y / 3Y / 5Y) — the return itself is the headline value, coloured
 *  only by its sign (fact, not a grade). Null shows a short honest reason, never a dash-zero. */
function ReturnTile({ label, value, code }: { label: string; value: number | null; code?: string }) {
  const n = toNum(value);
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
      <div className="text-[10px] text-ink3">{label}</div>
      {n !== null ? (
        <div className="num mt-0.5 text-[13.5px] font-semibold" style={{ color: toneColor(n) }}>
          {fmtFractionPct(n)}
        </div>
      ) : (
        <div className="num mt-0.5 text-[12px] font-medium text-ink3" title={code ?? "no value"}>
          {shortOmission(code)}
        </div>
      )}
    </div>
  );
}

/** The full discovery card. Header (name · house · NAV) → three return tiles (or an honest
 *  "can't be measured" strip when the representative has no total-return series) → chip row. */
export function FundCard({ row }: { row: FamilyRow }) {
  const nav = row.currentNav;
  const navDate = fmtDate(row.navDate);
  const isEtf = row.assetClass === "etf";

  return (
    <Link href={`/research/funds/${row.representativeSchemeCode}`} className="group block h-full">
      <Panel className="flex h-full flex-col gap-3.5 p-4 transition-colors hover:border-line3">
        {/* header */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="hero-name truncate text-[15px] text-ink transition-colors group-hover:text-primary">
                {row.canonicalName}
              </h3>
              {isEtf && (
                <span className="shrink-0 rounded border border-line2 px-1.5 py-0.5 text-[9.5px] font-medium text-ink3">
                  ETF
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[12px] text-ink2">{row.fundHouse}</p>
          </div>
          <div className="shrink-0 text-right">
            {nav !== null ? (
              <>
                <div className="num text-[13.5px] font-semibold text-ink">{fmtNav(nav)}</div>
                <div className="num text-[10px] text-ink3">NAV{navDate ? ` · ${navDate}` : ""}</div>
              </>
            ) : (
              <span className="num text-[12px] text-ink3">{DASH}</span>
            )}
          </div>
        </div>

        {/* measurement */}
        {row.declined ? (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
            <span
              className="num inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px]"
              style={tint("var(--p-own)", 0, 35)}
              title={row.declinedReason}
            >
              {row.declinedReason ?? "not_measurable"}
            </span>
            <span className="text-[11.5px] text-ink3">can&apos;t be measured</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <ReturnTile label="1-year" value={row.returns.ret1y} code={row.returnOmissions.ret1y} />
            <ReturnTile label="3-year" value={row.returns.ret3y} code={row.returnOmissions.ret3y} />
            <ReturnTile label="5-year" value={row.returns.ret5y} code={row.returnOmissions.ret5y} />
          </div>
        )}

        {/* chip row */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {row.categoryLeaf && <Chip tone="accent">{row.categoryLeaf}</Chip>}
          {!isEtf && <Chip>{planLabel(row.representativePlan)}</Chip>}
          {row.schemeCount > 1 && (
            <Chip>
              {row.schemeCount} plan{row.schemeCount === 1 ? "" : "s"}
            </Chip>
          )}
          {row.isDormant && (
            <span className="inline-flex items-center rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[11px] text-warning">
              Dormant
            </span>
          )}
        </div>
      </Panel>
    </Link>
  );
}

/** Compact "top grower" tile — the same shape as the Results page's top-growers strip:
 *  name · signed 1-year return · horizon · category. */
export function GrowerCard({ row }: { row: FamilyRow }) {
  const n = toNum(row.returns.ret1y);
  const isEtf = row.assetClass === "etf";
  return (
    <Link
      href={`/research/funds/${row.representativeSchemeCode}`}
      className="flex h-full flex-col gap-1.5 rounded-xl border border-line bg-surface-1 p-3 transition-colors hover:border-line3 hover:bg-surface-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="hero-name truncate text-[13px] text-ink">{row.canonicalName}</span>
        <span className="num shrink-0 text-[12.5px] font-semibold" style={{ color: toneColor(n) }}>
          {n !== null ? fmtFractionPct(n) : DASH}
        </span>
      </div>
      <span className="num text-[10.5px] text-ink3">1-year return</span>
      <span className="mt-auto flex items-center gap-1.5 truncate text-[10.5px] text-ink3">
        {isEtf && (
          <span className="shrink-0 rounded border border-line2 px-1 py-px text-[8.5px] font-medium text-ink3">ETF</span>
        )}
        <span className="truncate">{row.categoryLeaf ?? row.fundHouse ?? DASH}</span>
      </span>
    </Link>
  );
}
