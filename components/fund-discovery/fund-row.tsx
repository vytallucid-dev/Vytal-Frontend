"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { toNum, fmtFractionPct, fmtDate } from "@/lib/fund-format";
import type { FamilyRow, RepresentativePlan } from "@/types/funds-browse";

const TIER_LABEL: Record<string, string> = { direct: "Direct", regular: "Regular", none: "" };
const OPTION_LABEL: Record<string, string> = { growth: "Growth", idcw: "IDCW", bonus: "Bonus" };

function planLabel(p: RepresentativePlan): string {
  const tier = TIER_LABEL[p.tier];
  const option = OPTION_LABEL[p.optionLabel] ?? p.optionLabel;
  return tier ? `${tier} · ${option}` : option;
}

/** Short, honest phrase for a null-return cell — never a dash, never a 0. Falls back to the raw
 *  code (shown on hover via title) so an unmapped reason is surfaced, not swallowed. */
const SHORT_OMISSION: Record<string, string> = {
  insufficient_history: "too new",
  idcw_nav_not_total_return: "pays out",
  withheld_implausible: "withheld",
  out_of_range: "withheld",
  no_nav_in_window: "no data",
};
function shortOmission(code: string | undefined): string {
  if (!code) return "—";
  return SHORT_OMISSION[code] ?? "n/a";
}

function ReturnCell({ label, value, code }: { label: string; value: number | null; code?: string }) {
  const n = toNum(value);
  return (
    <div className="flex flex-col items-end">
      <span className="text-[9.5px] uppercase tracking-wide text-ink3">{label}</span>
      {n !== null ? (
        <span className={cn("num text-[13px] font-medium", n >= 0 ? "text-success" : "text-danger")}>
          {fmtFractionPct(n)}
        </span>
      ) : (
        <span className="text-[11px] italic text-ink3" title={code ?? "no value"}>
          {shortOmission(code)}
        </span>
      )}
    </div>
  );
}

export function FundRow({ row }: { row: FamilyRow }) {
  const nav = row.currentNav;
  const navDate = fmtDate(row.navDate);
  const otherPlans = row.schemeCount - 1;

  return (
    <Link
      href={`/research/funds/${row.representativeSchemeCode}`}
      className="group flex flex-col gap-3 rounded-xl border border-line bg-surface-1 px-4 py-3.5 transition-colors hover:border-line3 hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
    >
      {/* identity */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="hero-name truncate text-[15px] text-ink group-hover:text-primary">{row.canonicalName}</h3>
          {row.assetClass === "etf" && (
            <span className="shrink-0 rounded border border-line2 px-1.5 py-0.5 text-[9.5px] font-medium text-ink3">ETF</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink3">
          <span className="text-ink2">{row.fundHouse}</span>
          {row.categoryLeaf && (
            <>
              <span className="text-ink3">·</span>
              <span>{row.categoryLeaf}</span>
            </>
          )}
          {otherPlans > 0 && (
            <>
              <span className="text-ink3">·</span>
              <span>
                {row.schemeCount} plan{row.schemeCount === 1 ? "" : "s"}
              </span>
            </>
          )}
          {row.isDormant && (
            <span className="rounded-full border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">
              Dormant
            </span>
          )}
        </div>
      </div>

      {/* measurement */}
      {row.declined ? (
        <div className="flex shrink-0 items-center gap-3 sm:justify-end">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span
                className="num inline-flex items-center rounded border px-1.5 py-0.5 text-[10px]"
                style={{ color: "var(--p-own)", borderColor: "color-mix(in oklch, var(--p-own) 35%, transparent)" }}
                title={row.declinedReason}
              >
                {row.declinedReason ?? "not_measurable"}
              </span>
              <span className="text-[11.5px] text-ink3">can&apos;t be measured</span>
            </div>
            {nav !== null && (
              <span className="num text-[10px] text-ink3">
                ₹{nav.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                {navDate && <span> · {navDate}</span>}
              </span>
            )}
          </div>
          <Icons.caretRight className="hidden h-3.5 w-3.5 shrink-0 text-ink3 transition-transform group-hover:translate-x-0.5 sm:block" />
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-4 sm:justify-end">
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-4">
              <ReturnCell label="1Y" value={row.returns.ret1y} code={row.returnOmissions.ret1y} />
              <ReturnCell label="3Y" value={row.returns.ret3y} code={row.returnOmissions.ret3y} />
              <ReturnCell label="5Y" value={row.returns.ret5y} code={row.returnOmissions.ret5y} />
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-ink3">
              {/* Whose numbers these are. Meaningful only for a multi-plan mutual fund — an ETF has a
                  single share class, so its returns are unambiguous and its backend plan label
                  (which defaults to IDCW when the name lacks "growth") would only mislead. */}
              {row.assetClass !== "etf" && (
                <span title="These returns are this plan's — Direct and Regular differ by the expense ratio.">
                  {planLabel(row.representativePlan)}
                  <span className="text-ink3"> ·</span>
                </span>
              )}
              {nav !== null && (
                <span className="num">
                  ₹{nav.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  {navDate && <span className="text-ink3"> · {navDate}</span>}
                </span>
              )}
            </div>
          </div>
          <Icons.caretRight className="hidden h-3.5 w-3.5 shrink-0 text-ink3 transition-transform group-hover:translate-x-0.5 sm:block" />
        </div>
      )}
    </Link>
  );
}
