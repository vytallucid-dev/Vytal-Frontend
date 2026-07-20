"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { BrokerCatalogEntry, BrokerMeta, Holding } from "@/types/portfolio";
import { useAccounts, useBrokerCatalog } from "@/lib/api/hooks/use-accounts";
import { useBrokerStatus } from "@/lib/api/hooks/use-brokers";
import { accountKind, brokerHue, brokerLabel } from "../accounts/lib";
import { type AccountValueRow, accountValueRows, niceNum } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────
// BY ACCOUNT — invested vs current value, per account. Built from the RAW /me/holdings union (never
// aggregateHoldings — the per-account split is the point: RELIANCE in two books draws two accounts).
// Both bars sum the SAME priced population, so the comparison is honest and the Current bar equals the
// account-detail "Value" by construction.
//
//   DESKTOP — compact GROUPED vertical bars (muted Invested + gain/loss Current); scrub tooltip is the
//             app's chart idiom (SVG plot + an HTML overlay snapping to the nearest group).
//   MOBILE  — reflows to horizontal bars, one stacked row per account (name + broker badge, an Invested
//             and a Current bar running left-to-right, the ₹/% change beside). Vertical grouped columns
//             are tiny unreadable stubs at phone width; the same data, same rules, only the orientation
//             changes by breakpoint.
// Pure value/return — ZERO health here (no health field is read, imported or derived).
// ─────────────────────────────────────────────────────────────────────────────

const signINR = (v: number) => `${v >= 0 ? "+" : "−"}${formatINR(Math.abs(v), { compact: true })}`;
const signPct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`;

interface AcctMeta {
  broker: string;
  kind: "verified" | "stated";
}

// Compact geometry — a stretched viewBox (preserveAspectRatio="none") fills a short fixed-height box,
// so the plot is the same width as the container and % positioning is exact. No SVG <text> (it would
// distort under the stretch); the tooltip + axis are HTML.
const VBW = 800;
const VBH = 176;
const X0 = 8;
const X1 = 792;
const PLOT_TOP = 10;
const PLOT_BOTTOM = 166;
const PLOT_W = X1 - X0;

/** The coloured broker badge (Verified accounts) — the broker's catalogue label in its per-broker hue,
 *  as on the Holdings preview. A manual/Stated account shows NO badge (its name is the neutral
 *  identifier) — never a provenance tag, never a raw broker id. */
function BrokerBadge({ meta, catalogue, adapted }: { meta: AcctMeta | undefined; catalogue: BrokerCatalogEntry[] | undefined; adapted: BrokerMeta[] | undefined }) {
  if (!meta || meta.kind !== "verified") return null;
  const hue = brokerHue(meta.broker);
  return (
    <span
      className="inline-flex shrink-0 items-center rounded px-1 py-px text-[8px] font-semibold uppercase tracking-wide"
      style={{ color: hue, background: `color-mix(in oklch, ${hue} 18%, transparent)`, borderColor: `color-mix(in oklch, ${hue} 34%, transparent)`, borderWidth: 1 }}
    >
      {brokerLabel(meta.broker, catalogue, adapted)}
    </span>
  );
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-[2px]" style={{ background: color }} />
      {label}
    </span>
  );
}

export function ByAccount({ holdings }: { holdings: Holding[] }) {
  const { rows, unpricedOnlyCount } = useMemo(() => accountValueRows(holdings), [holdings]);

  // Broker per account lives on /me/accounts (the holdings wire carries only the account NAME), so the
  // coloured badge joins accountId → account.broker. Existing cached endpoints — no backend change.
  const accountsQ = useAccounts();
  const catalogueQ = useBrokerCatalog();
  const { data: brokerStatus } = useBrokerStatus();
  const acctMeta = useMemo(() => {
    const m = new Map<string, AcctMeta>();
    for (const a of accountsQ.data ?? []) m.set(a.id, { broker: a.broker, kind: accountKind(a) });
    return m;
  }, [accountsQ.data]);

  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface-1 p-4 sm:p-5">
        <p className="rounded-lg border border-dashed border-line2 bg-surface-2/50 px-4 py-5 text-center text-[12px] text-ink3">
          No priced holdings to chart yet.
        </p>
      </div>
    );
  }

  const n = rows.length;
  const maxVal = Math.max(...rows.flatMap((r) => [r.invested, r.current]), 1);
  const yHi = niceNum(maxVal);
  const yOf = (v: number) => PLOT_TOP + ((yHi - v) / yHi) * (PLOT_BOTTOM - PLOT_TOP);
  const baseY = PLOT_BOTTOM;

  const slot = PLOT_W / n;
  const pairGap = 4;
  const barW = Math.min(20, Math.max(4, (slot * 0.5 - pairGap) / 2));
  const groupW = barW * 2 + pairGap;
  const centerX = (i: number) => X0 + slot * i + slot / 2;
  const leftPct = (i: number) => (centerX(i) / VBW) * 100;

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vbx = ((e.clientX - rect.left) / rect.width) * VBW;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(centerX(i) - vbx);
      if (d < bd) { bd = d; best = i; }
    }
    setActive(best);
  };

  const hovered = active != null ? rows[active] : null;

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[10.5px] text-ink3">
        <LegendKey color="var(--ink3)" label="Invested" />
        <LegendKey color="var(--success)" label="Current (up)" />
        <LegendKey color="var(--danger)" label="Current (down)" />
      </div>

      {/* DESKTOP — vertical grouped columns (works with room). Hidden on phones (unreadable stubs there). */}
      <div className="hidden md:block">
        {/* chart — a short stretched plot; the tooltip is an HTML overlay in this relative box */}
        <div className="relative w-full select-none" style={{ aspectRatio: `${VBW} / ${VBH}` }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VBW} ${VBH}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full cursor-crosshair"
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={() => setActive(null)}
            role="img"
            aria-label="Invested versus current value by account"
          >
            {/* faint mid gridline + the zero baseline */}
            <line x1={X0} y1={yOf(yHi / 2)} x2={X1} y2={yOf(yHi / 2)} stroke="var(--line)" strokeDasharray="2 5" strokeOpacity={0.5} />
            <line x1={X0} y1={baseY} x2={X1} y2={baseY} stroke="var(--line2)" />

            {rows.map((r, i) => {
              const x0 = centerX(i) - groupW / 2;
              const gain = r.changeValue >= 0;
              return (
                <g key={r.accountId} onPointerEnter={() => setActive(i)}>
                  {active === i && <rect x={centerX(i) - slot / 2} y={PLOT_TOP} width={slot} height={baseY - PLOT_TOP} fill="var(--surface-2)" opacity={0.55} />}
                  <rect x={x0} y={yOf(r.invested)} width={barW} height={Math.max(baseY - yOf(r.invested), 1.5)} rx={2} fill="var(--ink3)" />
                  <rect x={x0 + barW + pairGap} y={yOf(r.current)} width={barW} height={Math.max(baseY - yOf(r.current), 1.5)} rx={2} fill={gain ? "var(--success)" : "var(--danger)"} />
                </g>
              );
            })}
          </svg>

          {/* scrub tooltip — HTML overlay, snaps to the hovered account group (the chart idiom) */}
          {hovered && (
            <div
              className="pointer-events-none absolute z-10 flex -translate-x-1/2 flex-col gap-0.5 whitespace-nowrap rounded-md border border-line2 bg-surface-3 px-2.5 py-1.5 text-[11px] shadow-lg"
              style={{ left: `${Math.min(Math.max(leftPct(active!), 15), 85)}%`, top: 2 }}
            >
              <span className="mb-0.5 flex items-center gap-1.5 text-[11.5px] font-medium text-ink">
                <span className="truncate">{hovered.accountName}</span>
                <BrokerBadge meta={acctMeta.get(hovered.accountId)} catalogue={catalogueQ.data} adapted={brokerStatus?.available} />
              </span>
              <TipLine label="Invested" value={formatINR(hovered.invested, { compact: true })} />
              <TipLine label="Current" value={formatINR(hovered.current, { compact: true })} />
              <span className="mt-0.5 flex items-center justify-between gap-6 border-t border-line/60 pt-1">
                <span className="text-ink3">Change</span>
                <span className={cn("num font-medium", hovered.changeValue >= 0 ? "text-success" : "text-danger")}>
                  {signINR(hovered.changeValue)}
                  {hovered.changePct != null && ` (${signPct(hovered.changePct)})`}
                </span>
              </span>
              {hovered.dayChangeValue != null && (
                <span className="flex items-center justify-between gap-6">
                  <span className="text-ink3">Today</span>
                  <span className={cn("num", hovered.dayChangeValue >= 0 ? "text-success" : "text-danger")}>{signINR(hovered.dayChangeValue)}</span>
                </span>
              )}
              {hovered.unpricedCount > 0 && <TipLine label="Unpriced" value={formatINR(hovered.unpricedInvested, { compact: true })} muted />}
            </div>
          )}
        </div>

        {/* x-axis — name + coloured broker badge (Verified) + ₹/% change, aligned under each group */}
        <div className="mt-2 flex" style={{ paddingLeft: `${(X0 / VBW) * 100}%`, paddingRight: `${((VBW - X1) / VBW) * 100}%` }}>
          {rows.map((r, i) => (
            <div
              key={r.accountId}
              className={cn("flex min-w-0 flex-col items-center gap-0.5 px-0.5 text-center transition-opacity", active != null && active !== i && "opacity-45")}
              style={{ flex: 1, maxWidth: `${(slot / PLOT_W) * 100}%` }}
            >
              <span className="max-w-full truncate text-[11px] text-ink2">{r.accountName}</span>
              <BrokerBadge meta={acctMeta.get(r.accountId)} catalogue={catalogueQ.data} adapted={brokerStatus?.available} />
              <span className={cn("num text-[10px]", r.changeValue >= 0 ? "text-success" : "text-danger")}>{signPct(r.changePct ?? 0)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE — horizontal bars, one stacked row per account. Reads at phone width where the vertical
          columns become illegible stubs. Same rows, same rules — only the orientation flips. */}
      <div className="divide-y divide-line/60 md:hidden">
        {rows.map((r) => (
          <MobileAccountRow
            key={r.accountId}
            row={r}
            scaleMax={maxVal}
            meta={acctMeta.get(r.accountId)}
            catalogue={catalogueQ.data}
            adapted={brokerStatus?.available}
          />
        ))}
      </div>

      {rows.some((r) => r.unpricedCount > 0) && (
        <p className="mt-3 border-t border-line pt-2.5 text-[10px] leading-relaxed text-ink3">
          {rows
            .filter((r) => r.unpricedCount > 0)
            .map((r) => `${formatINR(r.unpricedInvested, { compact: true })} in ${r.accountName}`)
            .join(" · ")}{" "}
          sits in unpriced holdings — not shown in the bars (both bars cover priced holdings only).
        </p>
      )}
      {unpricedOnlyCount > 0 && (
        <p className={cn("text-[10px] leading-relaxed text-ink3", rows.some((r) => r.unpricedCount > 0) ? "mt-1" : "mt-3 border-t border-line pt-2.5")}>
          {unpricedOnlyCount} account{unpricedOnlyCount === 1 ? "" : "s"} hold{unpricedOnlyCount === 1 ? "s" : ""} only instruments we couldn&apos;t price — not shown here.
        </p>
      )}
    </div>
  );
}

// ── mobile row — a horizontal Invested + Current bar pair per account, on the shared scale ─────────
function MobileHBar({ label, value, scaleMax, color }: { label: string; value: number; scaleMax: number; color: string }) {
  const pct = scaleMax > 0 ? (value / scaleMax) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[9px] uppercase tracking-wide text-ink3">{label}</span>
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 1)}%`, background: color }} />
      </div>
      <span className="num w-16 shrink-0 text-right text-[11px] text-ink2">{formatINR(value, { compact: true })}</span>
    </div>
  );
}

function MobileAccountRow({
  row,
  scaleMax,
  meta,
  catalogue,
  adapted,
}: {
  row: AccountValueRow;
  scaleMax: number;
  meta: AcctMeta | undefined;
  catalogue: BrokerCatalogEntry[] | undefined;
  adapted: BrokerMeta[] | undefined;
}) {
  const gain = row.changeValue >= 0;
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[12.5px] font-medium text-ink">{row.accountName}</span>
          <BrokerBadge meta={meta} catalogue={catalogue} adapted={adapted} />
        </div>
        <div className="shrink-0 text-right">
          <span className="num text-[12.5px] font-semibold text-ink">{formatINR(row.current, { compact: true })}</span>
          <span className={cn("num ml-1.5 text-[11px] font-medium", gain ? "text-success" : "text-danger")}>
            {signINR(row.changeValue)}
            {row.changePct != null && ` (${signPct(row.changePct)})`}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <MobileHBar label="Invested" value={row.invested} scaleMax={scaleMax} color="var(--ink3)" />
        <MobileHBar label="Current" value={row.current} scaleMax={scaleMax} color={gain ? "var(--success)" : "var(--danger)"} />
      </div>
    </div>
  );
}

function TipLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <span className="flex items-center justify-between gap-6">
      <span className="text-ink3">{label}</span>
      <span className={cn("num", muted ? "text-ink3" : "text-ink")}>{value}</span>
    </span>
  );
}
