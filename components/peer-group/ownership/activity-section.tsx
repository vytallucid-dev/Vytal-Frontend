"use client";

import { useMemo } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionEyebrow, tint } from "@/components/stock-detail/health/shared";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { PeerGroupMemberData } from "@/lib/api/hooks/use-peer-group-member-data";
import type {
  OwnershipSeriesView,
  InsiderEvent,
  BlockEvent,
} from "@/types/research-tools";

// ─────────────────────────────────────────────────────────────────────────────────────
// §C · Activity — block deals & insider trades, at the FIELD level.
// LIVE, not dormant. Each member's ownership view already carries events.insider[] /
// events.block[] (populated by buildOwnershipView, newest-first, capped 25 per member);
// the PG ownership assembly already fetches them. We flatten across members into two
// combined recent-activity feeds — real disclosures only, nothing fabricated.
//
// The three honest states (distinguished by assembly.isComplete):
//   • loading           — members still resolving, no rows yet → calm "assembling" line
//   • has data          — flattened feed non-empty → render the feed (fills in progressively)
//   • genuinely empty    — every member resolved AND no events this window → honest "none"
// "Genuinely empty (we checked, there's none)" replaces the old dormant "coming" tile
// (which wrongly equated not-scored with not-renderable).
//
// Buy/sell is shown as a FACT — a small directional glyph + neutral label, never a
// green/red verdict. An insider buy is a disclosure, not a "buy signal".
// ─────────────────────────────────────────────────────────────────────────────────────

const FEED_CAP = 16; // most-recent N across the field per lane

// Lane identity accents — a slight, non-verdict colour per lane (matches the lane
// header chips). Insider = momentum, block/bulk = foundation. NOT keyed to buy/sell.
const INSIDER_ACCENT = "var(--p-mom)";
const BLOCK_ACCENT = "var(--p-found)";

// ── formatters (mirror stock-detail/activity.tsx) ───────────────────────────────────
const DASH = "—";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: string | null | undefined) {
  if (!d) return DASH;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return d;
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} '${m[1].slice(2)}`;
}

const fmtCr = (v: number | null | undefined, dp = 1) =>
  v == null
    ? DASH
    : `₹${v.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp })} Cr`;

const fmtPrice = (v: number | null | undefined) =>
  v == null ? DASH : `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function fmtPp(v: number | null | undefined, dp = 2) {
  if (v == null) return DASH;
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}pp`;
}

/** Stringified BigInt share count → compact Indian (e.g. "8.50 L", "1.20 Cr"). */
function fmtShares(s: string | null | undefined) {
  if (s == null) return DASH;
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(2)} L`;
  return n.toLocaleString("en-IN");
}

// ── label maps (lowercase engine codes → display) ───────────────────────────────────
const PERSON_CATEGORY_LABEL: Record<string, string> = {
  promoter: "Promoter",
  promoter_group: "Promoter group",
  director: "Director",
  kmp: "KMP",
  designated_employee: "Designated employee",
  immediate_relative: "Promoter relative",
  other: "Other",
};
const TXN_LABEL: Record<string, string> = {
  buy: "Buy",
  sell: "Sell",
  pledge: "Pledge",
  revoke_pledge: "Pledge release",
  inter_se_transfer: "Inter-se transfer",
  esos: "ESOP",
  encumber: "Encumber",
  release: "Release",
  other: "Other",
};
function humanize(k: string) {
  const s = k.replace(/[_-]+/g, " ").trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const labelOf = (map: Record<string, string>, k: string) => map[k] ?? humanize(k);

/** Direction as a FACT, never a verdict — buy reads up, sell reads down, neutral ink. */
function dirGlyph(txn: string) {
  if (txn === "buy") return "↑";
  if (txn === "sell") return "↓";
  return "·";
}

// ── feed rows carry their member symbol so a combined feed stays traceable ──────────
type InsiderRow = InsiderEvent & { symbol: string };
type BlockRow = BlockEvent & { symbol: string };

/** newest-first; nulls sort last (string ISO dates compare lexicographically). */
function byDateDesc(a: string | null, b: string | null) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a < b ? 1 : a > b ? -1 : 0;
}

// ════════════════════════════════════════════════════════════════════════════════════
// Lane shell — shared header + the three honest states
// ════════════════════════════════════════════════════════════════════════════════════
function LaneShell({
  icon: Glyph,
  title,
  accent,
  count,
  total,
  resolvedCount,
  totalCount,
  isComplete,
  emptyCopy,
  children,
}: {
  icon: typeof Icons.eye;
  title: string;
  accent: string;
  count: number; // rows shown
  total: number; // rows available (pre-cap)
  resolvedCount: number;
  totalCount: number;
  isComplete: boolean;
  emptyCopy: string;
  children: React.ReactNode;
}) {
  const hasData = total > 0;
  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface-1 p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg border" style={tint(accent)}>
            <Glyph weight="duotone" className="size-4" />
          </span>
          <span className="text-[12.5px] font-medium text-ink">{title}</span>
        </div>
        {hasData && (
          <span className="num text-[10px] uppercase tracking-wider text-ink3">
            {total} across field
          </span>
        )}
      </div>

      {hasData ? (
        <>
          {children}
          {!isComplete && (
            <p className="mt-2 text-[10.5px] text-ink3">
              Still assembling —{" "}
              <span className="num">
                {resolvedCount} of {totalCount}
              </span>{" "}
              members loaded.
            </p>
          )}
          {total > count && (
            <p className="num mt-2 text-[10.5px] text-ink3">
              Showing the {count} most recent of {total}.
            </p>
          )}
        </>
      ) : !isComplete ? (
        <p className="py-6 text-center text-[11.5px] text-ink3">
          Assembling member disclosures —{" "}
          <span className="num">
            {resolvedCount} of {totalCount}
          </span>{" "}
          loaded.
        </p>
      ) : (
        <p className="py-6 text-center text-[11.5px] text-ink3">{emptyCopy}</p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════════
// Insider lane
// ════════════════════════════════════════════════════════════════════════════════════
function InsiderRowItem({ e, accent }: { e: InsiderRow; accent: string }) {
  return (
    <li className="border-t border-line py-2.5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <span
          className="num shrink-0 rounded border px-1.5 py-0.5 text-[10px]"
          style={tint(accent, 12, 26)}
        >
          {e.symbol}
        </span>
        <span className="shrink-0 text-[12px]" style={{ color: accent }} aria-hidden>
          {dirGlyph(e.transactionType)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] text-ink">{e.personName}</span>
        <span className="num shrink-0 text-[10.5px] text-ink3">{fmtDate(e.tradeDate)}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px] text-ink3">
        <span className="text-ink2">{labelOf(TXN_LABEL, e.transactionType)}</span>
        <span>{labelOf(PERSON_CATEGORY_LABEL, e.personCategory)}</span>
        {e.tradeValueCr != null && <span className="num text-ink2">{fmtCr(e.tradeValueCr)}</span>}
        {e.holdingPctDelta != null && <span className="num">{fmtPp(e.holdingPctDelta)}</span>}
      </div>
    </li>
  );
}

// ════════════════════════════════════════════════════════════════════════════════════
// Block / bulk lane
// ════════════════════════════════════════════════════════════════════════════════════
function BlockRowItem({ d, accent }: { d: BlockRow; accent: string }) {
  return (
    <li className="border-t border-line py-2.5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <span
          className="num shrink-0 rounded border px-1.5 py-0.5 text-[10px]"
          style={tint(accent, 12, 26)}
        >
          {d.symbol}
        </span>
        <span className="shrink-0 text-[12px]" style={{ color: accent }} aria-hidden>
          {dirGlyph(d.transactionType)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] text-ink">{d.clientName}</span>
        <span className="num shrink-0 text-[10.5px] text-ink3">{fmtDate(d.dealDate)}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px] text-ink3">
        <span className="capitalize text-ink2">{d.dealType}</span>
        <span className="text-ink2">{labelOf(TXN_LABEL, d.transactionType)}</span>
        <span className="num">{fmtShares(d.quantity)} sh</span>
        <span className="num">{fmtPrice(d.price)}</span>
        {d.valueCr != null && <span className="num text-ink2">{fmtCr(d.valueCr)}</span>}
      </div>
    </li>
  );
}

// ════════════════════════════════════════════════════════════════════════════════════
// §C
// ════════════════════════════════════════════════════════════════════════════════════
export function ActivitySection({
  assembly,
}: {
  assembly: PeerGroupMemberData<OwnershipSeriesView>;
}) {
  const { members, resolvedCount, totalCount, isComplete } = assembly;

  // Flatten each lane across resolved members, tag with symbol, dedupe, sort newest-first.
  const insider = useMemo<InsiderRow[]>(() => {
    const seen = new Set<string>();
    const out: InsiderRow[] = [];
    for (const m of members) {
      for (const e of m.data?.events.insider ?? []) {
        const key = `${m.symbol}|${e.personName}|${e.tradeDate ?? ""}|${e.transactionType}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ ...e, symbol: m.symbol });
      }
    }
    return out.sort((a, b) => byDateDesc(a.tradeDate, b.tradeDate));
  }, [members]);

  const block = useMemo<BlockRow[]>(() => {
    const seen = new Set<string>();
    const out: BlockRow[] = [];
    for (const m of members) {
      for (const d of m.data?.events.block ?? []) {
        const key = `${m.symbol}|${d.dealDate}|${d.clientName}|${d.transactionType}|${d.quantity}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ ...d, symbol: m.symbol });
      }
    }
    return out.sort((a, b) => byDateDesc(a.dealDate, b.dealDate));
  }, [members]);

  const insiderShown = insider.slice(0, FEED_CAP);
  const blockShown = block.slice(0, FEED_CAP);
  const total = insider.length + block.length;

  return (
    <section>
      <SectionEyebrow
        label="Block deals & insider activity"
        icon={Icons.stack}
        accent="var(--p-found)"
        pill={isComplete ? `${total} events` : "assembling"}
      />
      <Reveal>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Insider lane */}
          <LaneShell
            icon={Icons.eye}
            title="Insider activity"
            accent={INSIDER_ACCENT}
            count={insiderShown.length}
            total={insider.length}
            resolvedCount={resolvedCount}
            totalCount={totalCount}
            isComplete={isComplete}
            emptyCopy="No insider trades disclosed across the field in this window."
          >
            <ul className="flex flex-col">
              {insiderShown.map((e, i) => (
                <InsiderRowItem key={`${e.symbol}-${e.tradeDate ?? ""}-${i}`} e={e} accent={INSIDER_ACCENT} />
              ))}
            </ul>
          </LaneShell>

          {/* Block / bulk lane */}
          <LaneShell
            icon={Icons.coins}
            title="Bulk & block deals"
            accent={BLOCK_ACCENT}
            count={blockShown.length}
            total={block.length}
            resolvedCount={resolvedCount}
            totalCount={totalCount}
            isComplete={isComplete}
            emptyCopy="No bulk or block deals across the field in this window."
          >
            <ul className="flex flex-col">
              {blockShown.map((d, i) => (
                <BlockRowItem key={`${d.symbol}-${d.dealDate}-${i}`} d={d} accent={BLOCK_ACCENT} />
              ))}
            </ul>
          </LaneShell>
        </div>
      </Reveal>
      <p className="mt-2.5 text-[11.5px] text-ink3">
        Real NSE PIT disclosures and bulk/block deals across the field&apos;s members, newest first.
        Buy and sell are stated as facts, not signals — no rows are fabricated.
      </p>
    </section>
  );
}
