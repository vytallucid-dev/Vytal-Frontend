"use client";

import { Icons, type Icon } from "@/lib/icons";
import type { Holding, PortfolioSnapshot, StockBand, StructureRule } from "@/types/portfolio";
import { STOCK_BAND_LABEL } from "../lib";
import { capitalByBand, concentrationRead, effectiveBreadth, sectorSlices, structureLedger } from "./lib";

const CARD = "rounded-xl border border-line bg-surface-1 p-5 sm:p-6";
const pct0 = (w: number) => `${Math.round(w * 100)}%`;
const pct1 = (w: number) => `${(w * 100).toFixed(1)}%`;

const SECTOR_PALETTE = [
  "var(--p-found)",
  "var(--p-mom)",
  "var(--p-mkt)",
  "var(--p-own)",
  "var(--c-pristine)",
  "var(--c-healthy)",
  "var(--c-steady)",
  "var(--c-below)",
];

const BAND_COLOR: Record<StockBand | "unscored", string> = {
  pristine: "var(--c-pristine)",
  healthy: "var(--c-healthy)",
  steady: "var(--c-steady)",
  below_par: "var(--c-below)",
  fragile: "var(--c-fragile)",
  unscored: "var(--ink3)",
};

/** The Structure penalty a shape driver carried (0 when the rule didn't fire) — the
 *  bridge from "shape" to "what construction cost". Read straight from the ledger. */
function rulePoints(s: PortfolioSnapshot, rule: StructureRule): number {
  return structureLedger(s)
    .filter((e) => e.rule === rule)
    .reduce((a, e) => a + e.points, 0);
}

// ── one shape card — a headline figure, a bar, the driving names, a plain read, and the
//    Structure penalty (if any) this shape earned. ────────────────────────────────────
function ShapeCard({
  icon: Glyph,
  title,
  value,
  unit,
  barPct,
  barColor,
  chips,
  read,
  penalty,
  penaltyRule,
}: {
  icon: Icon;
  title: string;
  value: string;
  unit?: string;
  barPct: number;
  barColor: string;
  chips: string[];
  read: string;
  penalty: number;
  penaltyRule: StructureRule;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4">
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
        <Glyph weight="duotone" className="size-4 text-ink2" />
        {title}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1">
        <span className="num text-[26px] font-semibold leading-none text-ink">{value}</span>
        {unit && <span className="num text-[13px] text-ink3">{unit}</span>}
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full" style={{ width: `${Math.min(Math.max(barPct, 2), 100)}%`, background: barColor }} />
      </div>
      {chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span key={c} className="num rounded-md bg-surface-3 px-2 py-0.5 text-[10px] text-ink2">
              {c}
            </span>
          ))}
        </div>
      )}
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink3">{read}</p>
      {penalty > 0.5 && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10.5px]" style={{ color: "var(--high)", background: "var(--high-bg)" }}>
          <span className="num font-semibold">{penaltyRule}</span>
          <span>cost construction −{Math.round(penalty)}</span>
        </p>
      )}
    </div>
  );
}

// ── capital across health bands — the old tab's "the average hides the spread". Scored
//    capital grouped by its own condition band + an honest unscored slice. ─────────────
function BandDispersion({ holdings }: { holdings: Holding[] }) {
  const slices = capitalByBand(holdings);
  if (slices.length === 0) return null;
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="kicker">Your capital, across health bands</p>
        <span className="text-[10.5px] text-ink3">% of book value</span>
      </div>
      <div className="flex h-7 gap-0.5 overflow-hidden rounded-lg">
        {slices.map((sl) => {
          const p = sl.weight * 100;
          return (
            <div
              key={sl.band}
              className="num flex items-center justify-center text-[11px] font-medium"
              style={{ flex: Math.max(p, 2), background: BAND_COLOR[sl.band], color: "#0a0b0e" }}
              title={`${sl.band === "unscored" ? "Unscored" : STOCK_BAND_LABEL[sl.band]} ${p.toFixed(1)}%`}
            >
              {p >= 9 ? `${Math.round(p)}%` : ""}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink2">
        {slices.map((sl) => (
          <span key={sl.band} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px]" style={{ background: BAND_COLOR[sl.band] }} />
            {sl.band === "unscored" ? "Unscored" : STOCK_BAND_LABEL[sl.band]} {pct0(sl.weight)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** §3 · The book's shape — concentration / breadth / sector, driven by the real Structure
 *  inputs the ledger penalized, plus the capital-across-band dispersion. */
export function ShapeSection({ snapshot, holdings }: { snapshot: PortfolioSnapshot; holdings: Holding[] }) {
  const conc = concentrationRead(holdings);
  const breadth = effectiveBreadth(snapshot, holdings);
  const sectors = sectorSlices(holdings);
  const topSector = sectors[0];
  const holdingCount = holdings.length;

  return (
    <div className={CARD}>
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Concentration — S1 driver */}
        <ShapeCard
          icon={Icons.stack}
          title="Concentration"
          value={pct0(conc.top3)}
          unit="top 3"
          barPct={conc.top3 * 100}
          barColor="var(--c-steady)"
          chips={conc.top3Names.map((n) => `${n.symbol} ${pct0(n.weight)}`)}
          read={
            conc.largest
              ? `Your top three holdings are ${pct0(conc.top3)} of the book${
                  conc.largest.weight > 0.2 ? `; ${conc.largest.symbol} alone is ${pct1(conc.largest.weight)}` : ""
                }. The read leans on these names.`
              : "No priced positions to weigh yet."
          }
          penalty={rulePoints(snapshot, "S1")}
          penaltyRule="S1"
        />

        {/* Breadth — S3 driver */}
        <ShapeCard
          icon={Icons.sector}
          title="Effective breadth"
          value={breadth.neff.toFixed(1)}
          unit={`of ${holdingCount}`}
          barPct={(breadth.neff / Math.max(holdingCount, 1)) * 100}
          barColor="var(--p-own)"
          chips={breadth.stored ? ["from the engine"] : ["by value share"]}
          read={`Weight behaves like about ${breadth.neff.toFixed(1)} equally-sized positions across your ${holdingCount} holding${
            holdingCount === 1 ? "" : "s"
          } — the lower this runs below your count, the more the book leans on a few names.`}
          penalty={rulePoints(snapshot, "S3")}
          penaltyRule="S3"
        />

        {/* Sector exposure — S2 driver */}
        <ShapeCard
          icon={Icons.scales}
          title="Sector exposure"
          value={topSector ? pct0(topSector.weight) : "—"}
          unit={topSector ? topSector.sector : undefined}
          barPct={topSector ? topSector.weight * 100 : 0}
          barColor="var(--p-mkt)"
          chips={sectors.slice(0, 4).map((sl) => `${sl.sector} ${pct0(sl.weight)}`)}
          read={
            topSector
              ? `${topSector.sector} is ${pct1(topSector.weight)} of your book — its fortunes move a large share of your health together.`
              : "Sectors aren't classified for this book yet."
          }
          penalty={rulePoints(snapshot, "S2")}
          penaltyRule="S2"
        />
      </div>

      {/* the sector split bar — the whole book at a glance */}
      {sectors.length > 0 && (
        <div className="mt-3 rounded-lg border border-line bg-surface-2 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="kicker">How your book splits by sector</p>
            <span className="text-[10.5px] text-ink3">% of priced value</span>
          </div>
          <div className="flex h-6 gap-0.5 overflow-hidden rounded-lg">
            {sectors.map((sl, i) => {
              const p = sl.weight * 100;
              const color = sl.sector === "Unclassified" ? "var(--ink3)" : SECTOR_PALETTE[i % SECTOR_PALETTE.length];
              return (
                <div
                  key={sl.sector}
                  className="num flex items-center justify-center text-[10px] font-medium"
                  style={{ flex: Math.max(p, 1.5), background: color, color: "#0a0b0e" }}
                  title={`${sl.sector} ${p.toFixed(1)}%`}
                >
                  {p >= 12 ? sl.sector : ""}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3">
        <BandDispersion holdings={holdings} />
      </div>
    </div>
  );
}
