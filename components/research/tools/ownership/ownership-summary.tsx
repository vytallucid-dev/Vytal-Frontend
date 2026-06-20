"use client";

/**
 * The STATIC summary (bottom-right) — the conditional floor-check strip + the events
 * ledger. Floor-check fires ONLY on genuine flow/floor divergence and funnels to the
 * Divergence tool (flow-vs-fundamentals IS a divergence — linked, never re-plotted).
 * Ledger: pledge + shareholding are LIVE strata; insider + block show real NSE events
 * (or an honest empty state — not "pending feed").
 */

import Link from "next/link";
import { Panel } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import type { OwnershipSeriesView } from "@/types/research-tools";
import { buildLedger, type FloorCheck, type InsiderEvent, type BlockEvent } from "./ownership-data";

const FC_TONE: Record<FloorCheck["tone"], { fg: string; bg: string; bd: string }> = {
  pos: { fg: "var(--rec)", bg: "var(--rec-bg)", bd: "var(--rec-bd)" },
  neg: { fg: "var(--crit)", bg: "var(--crit-bg)", bd: "var(--crit-bd)" },
  warn: { fg: "var(--high)", bg: "var(--high-bg)", bd: "var(--high-bd)" },
};

const EV_DOT: Record<"pos" | "neg" | "mod", string> = {
  pos: "var(--rec)",
  neg: "var(--crit)",
  mod: "var(--high)",
};

// ── helpers for event display ────────────────────────────────────────────────

function fmtCr(v: number | null): string {
  if (v == null) return "";
  if (Math.abs(v) >= 100) return `₹${Math.round(v).toLocaleString("en-IN")} Cr`;
  return `₹${v.toFixed(2)} Cr`;
}

function fmtQty(s: string | null): string {
  if (!s) return "";
  const n = Number(s);
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr shs`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L shs`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K shs`;
  return `${n} shs`;
}

const CATEGORY_LABEL: Record<string, string> = {
  promoter: "Promoter",
  promoter_group: "Promoter Group",
  director: "Director",
  kmp: "KMP",
  designated_employee: "Desig. Employee",
  immediate_relative: "Immediate Relative",
  other: "Other",
};

const TXN_LABEL: Record<string, string> = {
  buy: "Buy",
  sell: "Sell",
  pledge: "Pledge",
  revoke_pledge: "Revoke Pledge",
  inter_se_transfer: "Inter-se Transfer",
  esos: "ESOS",
  other: "Other",
};

function isBuy(txn: string) { return txn === "buy"; }
function isSell(txn: string) { return txn === "sell"; }

function InsiderRow({ e }: { e: InsiderEvent }) {
  const buy = isBuy(e.transactionType);
  const sell = isSell(e.transactionType);
  const sideColor = buy ? "var(--rec)" : sell ? "var(--crit)" : "var(--ink3)";
  return (
    <div className="flex gap-3 border-t border-line py-2 first:border-t-0">
      <span
        className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide"
        style={{ background: buy ? "var(--rec-bg)" : sell ? "var(--crit-bg)" : "var(--surface-2)", color: sideColor, border: `1px solid ${buy ? "var(--rec-bd)" : sell ? "var(--crit-bd)" : "var(--line2)"}` }}
      >
        {TXN_LABEL[e.transactionType] ?? e.transactionType}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[12px] font-medium text-ink">{e.personName}</span>
          <span className="text-[10.5px] text-ink3">{CATEGORY_LABEL[e.personCategory] ?? e.personCategory}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10.5px] text-ink3">
          {e.tradeValueCr != null && <span>{fmtCr(e.tradeValueCr)}</span>}
          {e.securitiesTraded && <span>{fmtQty(e.securitiesTraded)}</span>}
          {e.holdingPctDelta != null && Math.abs(e.holdingPctDelta) >= 0.0001 && (
            <span style={{ color: e.holdingPctDelta > 0 ? "var(--rec)" : "var(--crit)" }}>
              {e.holdingPctDelta > 0 ? "+" : ""}{e.holdingPctDelta.toFixed(4)}%
            </span>
          )}
        </div>
      </div>
      <span className="num mt-0.5 shrink-0 text-[10px] text-ink3">{e.tradeDate ?? "—"}</span>
    </div>
  );
}

function BlockRow({ e }: { e: BlockEvent }) {
  const buy = isBuy(e.transactionType);
  const sell = isSell(e.transactionType);
  const sideColor = buy ? "var(--rec)" : sell ? "var(--crit)" : "var(--ink3)";
  return (
    <div className="flex gap-3 border-t border-line py-2 first:border-t-0">
      <div className="flex shrink-0 flex-col gap-1">
        <span
          className="rounded px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide"
          style={{ background: buy ? "var(--rec-bg)" : sell ? "var(--crit-bg)" : "var(--surface-2)", color: sideColor, border: `1px solid ${buy ? "var(--rec-bd)" : sell ? "var(--crit-bd)" : "var(--line2)"}` }}
        >
          {buy ? "Buy" : sell ? "Sell" : e.transactionType}
        </span>
        <span className="rounded border border-line2 px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-ink3">
          {e.dealType}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-ink">{e.clientName}</div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10.5px] text-ink3">
          {e.valueCr != null && <span>{fmtCr(e.valueCr)}</span>}
          <span>{fmtQty(e.quantity)} @ ₹{e.price.toFixed(2)}</span>
        </div>
      </div>
      <span className="num mt-0.5 shrink-0 text-[10px] text-ink3">{e.dealDate}</span>
    </div>
  );
}

export function OwnershipSummary({
  view,
  floor,
  symbol,
}: {
  view: OwnershipSeriesView;
  floor: FloorCheck | null;
  symbol: string;
}) {
  const { live, dormant, insider, block } = buildLedger(view);

  return (
    <Panel className="px-4 py-4">
      {/* conditional floor-check — only when flow/floor genuinely diverge */}
      {floor && (
        <div
          className="mb-3.5 flex flex-wrap items-center gap-3 rounded-xl border p-3"
          style={{ borderColor: FC_TONE[floor.tone].bd, background: FC_TONE[floor.tone].bg }}
        >
          <span
            className="grid size-7 shrink-0 place-items-center rounded-lg"
            style={{ background: FC_TONE[floor.tone].fg, color: "#0a0b0e" }}
          >
            <Icons.building weight="fill" className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[9.5px] font-semibold uppercase tracking-widest" style={{ color: FC_TONE[floor.tone].fg }}>
              {floor.kicker}
            </div>
            <div className="mt-0.5 text-[12px] leading-snug text-ink2">{floor.text}</div>
          </div>
          <Link
            href={`/research/divergence?symbol=${symbol}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-2.5 py-1.5 text-[11.5px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
          >
            View as divergence
            <Icons.arrowUpRight className="size-3" />
          </Link>
        </div>
      )}

      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="kicker">Events &amp; ledger</span>
      </div>

      {/* live strata — pledge + shareholding */}
      <div className="text-[10px] uppercase tracking-widest text-ink3">From shareholding &amp; pledging</div>
      <div className="mt-2 flex flex-col">
        {live.map((e, i) => (
          <div key={i} className="flex gap-3 border-t border-line py-2 first:border-t-0">
            <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: EV_DOT[e.tone] }} />
            <div>
              <div className="num text-[10.5px] text-ink3">{e.when}</div>
              <div className="mt-0.5 text-[12.5px] text-ink">{e.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* any genuinely-dormant lanes (currently none — C/D are live) */}
      {dormant.length > 0 && (
        <div className="mt-4 flex flex-col gap-2.5">
          {dormant.map((d) => (
            <div key={d.name} className="rounded-xl border border-dashed border-line2 p-3">
              <div className="flex items-center gap-2 text-ink2">
                <Icons.clock className="size-3.5 text-ink3" />
                <span className="text-[12.5px] font-medium">{d.name}</span>
                <span className="ml-auto rounded border border-line2 px-1.5 py-0.5 text-[8.5px] uppercase tracking-wide text-ink3">
                  pending feed
                </span>
              </div>
              <div className="mt-1.5 text-[11px] leading-relaxed text-ink3">{d.note}</div>
            </div>
          ))}
        </div>
      )}

      {/* insider trades — real NSE PIT events */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-ink3">Insider trades (NSE PIT)</div>
        {insider.length > 0 ? (
          <div className="mt-2 flex flex-col">
            {insider.map((e, i) => <InsiderRow key={i} e={e} />)}
          </div>
        ) : (
          <div className="mt-2 text-[11.5px] text-ink3">No insider activity in the window.</div>
        )}
      </div>

      {/* block & bulk deals */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-ink3">Block &amp; bulk deals</div>
        {block.length > 0 ? (
          <div className="mt-2 flex flex-col">
            {block.map((e, i) => <BlockRow key={i} e={e} />)}
          </div>
        ) : (
          <div className="mt-2 text-[11.5px] text-ink3">No block or bulk deals in the window.</div>
        )}
      </div>
    </Panel>
  );
}
